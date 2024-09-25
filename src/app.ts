import config from './serverConfig';
import fs from 'fs-extra';
import {
  ensureEnv,
  checkPackages,
  checkValidator,
  checkMaps,
  ensureRunsDir,
  printReadyBox
} from './setup';
import {
  getKitTransformer,
  getKitsTransformer,
  runWorkflowTransformer,
  getSelectedTests,
  getTestActions,
  runTestListExpr,
  runActionListExpr,
  validateTree
} from './helpers/expressions';
import { fork } from 'node:child_process';
import path from 'path';
import cors from 'cors';
import express from 'express';
import axios from 'axios';
import kits from '../kits.json';
import { getUiRoute } from './helpers/getUiFileFromDisk';
import chalk from 'chalk';
import type { Express, Request, Response } from 'express';

const port: number = 8400;
const enginePort: number = 8401;

const app: Express = express();
const workingDir: string = path.resolve('.');
const currentRunDir: string = path.join(workingDir, 'runs', 'current');
const ioDir: string = path.join(workingDir, 'io');

const engineApi = axios.create({
  baseURL: `http://localhost:${enginePort.toString()}`
});

const getKitStatus = (kitId: string) => {
  const kitStatusFilePath = path.join(currentRunDir, 'kitStatus.json');
  if (fs.existsSync(kitStatusFilePath)) {
    const kitStatusFileContent = JSON.parse(fs.readFileSync(kitStatusFilePath).toString());
    if (kitStatusFileContent?.kitId === kitId) {
      return kitStatusFileContent?.status;
    };
  };
  return 'ready';
};

const getTestStatus = async (testId: string) => {
  const testStatusFilePath: string = path.join(currentRunDir, `testStatus_${testId}.json`);
  if (await fs.exists(testStatusFilePath)) {
    const testStatusFileContent = JSON.parse((await fs.readFile(testStatusFilePath)).toString());
    return testStatusFileContent?.status;
  };
  return 'ready';
};

const getActionStatus = async (mappingId: string) => {
  const actionStatusFilePath = path.join(ioDir, `actionStatus_${mappingId}.json`);
  if (await fs.exists(actionStatusFilePath)) {
    const actionStatusFileContent = JSON.parse((await fs.readFile(actionStatusFilePath)).toString());
    return {
      statusCode: actionStatusFileContent?.statusCode,
      statusText: actionStatusFileContent?.statusText
    };
  };
  return {
    statusCode: 'ready',
    statusText: 'Ready'
  };
};

const getKits = async (res: Response) => {
  const transformed = await getKitsTransformer.evaluate(kits, { getKitStatus });
  res.status(200).json(transformed);
};

const getKit = async (req: Request, res: Response) => {
  const kitId: string = req.originalUrl.substring(10);
  const transformed = await getKitTransformer.evaluate(kits, { kitId, getActionStatus, getTestStatus });
  res.status(200).json(transformed);
};

const runTest = async (testId: string) => {
  const testStatusFilePath: string = path.join(currentRunDir, `testStatus_${testId}.json`);
  const testStatusJson = {
    status: 'init'
  };
  const actionsToRun: string[] = await getTestActions.evaluate({}, { kits, testId });
  fs.writeFileSync(testStatusFilePath, JSON.stringify(testStatusJson, null, 2));
  try {
    await runActionList(actionsToRun);
    const lastActionStatus: string = (await getActionStatus(actionsToRun[actionsToRun.length - 1])).statusCode;
    fs.writeFileSync(testStatusFilePath, JSON.stringify({ status: lastActionStatus }, null, 2));
  } catch (e) {
    const details: string = (e instanceof Error) ? `${e.name}: ${e.message}` : undefined;
    fs.writeFileSync(testStatusFilePath, JSON.stringify({ status: 'error', details }, null, 2));
  }
};

const runAction = async (mappingId: string) => {
  // only run action if it did not run already
  const statusJson = await getActionStatus(mappingId);
  if (statusJson.statusCode === 'ready') {
    const actionStatusFilePath = path.join(ioDir, `actionStatus_${mappingId}.json`);
    fs.writeFileSync(actionStatusFilePath, JSON.stringify({ statusCode: 'init', statusText: 'Initiated' }, null, 2));
    try {
      await engineApi.post(`/Mapping/${mappingId}`, {});
      if (!fs.existsSync(actionStatusFilePath)) {
        fs.writeFileSync(actionStatusFilePath, JSON.stringify({ statusCode: 'completed', statusText: 'Completed' }, null, 2));
      }
    } catch (e) {
      const details: string = (e instanceof Error) ? `${e.name}: ${e.message}` : undefined;
      fs.writeFileSync(actionStatusFilePath, JSON.stringify({ statusCode: 'error', statusText: 'Error', details }, null, 2));
    }
  }
};

const runTestList = async (testList: string[]) => {
  await runTestListExpr.evaluate({}, { testList, runTest });
};

const runActionList = async (actionList: string[]) => {
  await runActionListExpr.evaluate({}, { actionList, runAction });
};

const runKit = async (req: Request, res: Response) => {
  res.status(202).send('Accepted');
  const kitId: string = req.body.kitId;
  const selectedTests: string[] = req.body.selected;
  const workflow = await runWorkflowTransformer.evaluate(kits, { kitId, selectedTests });
  const kitStatusJsonPath: string = path.join(currentRunDir, 'kitStatus.json');
  fs.ensureDirSync(currentRunDir);
  fs.writeFileSync(path.join(currentRunDir, 'workflow.json'), JSON.stringify(workflow, null, 2));
  const testsToRun: string[] = await getSelectedTests.evaluate(workflow);
  fs.writeFileSync(kitStatusJsonPath, JSON.stringify({ kitId, status: 'in-progress' }, null, 2));
  try {
    await runTestList(testsToRun);
    fs.writeFileSync(kitStatusJsonPath, JSON.stringify({ kitId, status: 'completed' }, null, 2));
  } catch (e) {
    const details: string = (e instanceof Error) ? `${e.name}: ${e.message}` : undefined;
    fs.writeFileSync(kitStatusJsonPath, JSON.stringify({ kitId, status: 'error', details }, null, 2));
  }
};

const abortRun = (res?: Response) => {
  if (res) res.status(202).send('Accepted');
  const kitStatusFilePath: string = path.join(currentRunDir, 'kitStatus.json');
  if (fs.existsSync(kitStatusFilePath)) {
    const kitStatusFileContent = JSON.parse(fs.readFileSync(kitStatusFilePath).toString());
    const kitId: string = kitStatusFileContent.kitId;
    const currentStatus: string = kitStatusFileContent.status;
    if (currentStatus === 'in-progress') fs.writeFileSync(path.join(currentRunDir, 'kitStatus.json'), JSON.stringify({ kitId, status: 'aborted' }, null, 2));
  }
};

const stashRun = (res: Response) => {
  // move current run dir into stash and clear it
  const workflowFilePath = path.join(currentRunDir, 'workflow.json');
  if (fs.existsSync(workflowFilePath)) {
    const workflowFileContent = JSON.parse(fs.readFileSync(workflowFilePath).toString());
    const runTimestamp = workflowFileContent?.timestamp;
    const stashDir: string = path.join(workingDir, 'runs', runTimestamp);
    fs.renameSync(currentRunDir, stashDir);
    fs.copySync(ioDir, path.join(stashDir, 'io'));
    fs.removeSync(ioDir);
    fs.ensureDirSync(ioDir);
    ensureRunsDir();
  }
  res.status(200).send('Stashed');
};

const handler = async (req: Request, res: Response) => {
  const route = req.originalUrl;
  const method = req.method.toLowerCase();
  if (method === 'get') {
    if (route === '/health') {
      // handle healthcheck url
      const engineResponse = await engineApi.get(route);
      res.status(engineResponse.status).json(engineResponse.data);
    } else if (route.startsWith('/api/')) {
      if (route === '/api/kits') {
        await getKits(res);
      } else if (route.startsWith('/api/kits/')) {
        await getKit(req, res);
      }
    } else {
      // handle all else (assuming it's a ui file)
      getUiRoute(route, res);
    }
  } else if (method === 'post') {
    if (route === '/api/kits/$run') {
      await runKit(req, res);
    } else if (route === '/api/kits/$abort') {
      abortRun(res);
    } else if (route === '/api/kits/$stash') {
      stashRun(res);
    } else {
      res.status(404).send('Not found');
    }
  };
};

const startExpress = () => {
  // setup and start express app after engine is ready
  app.use(cors());
  app.use(express.json({ limit: '50mb', type: ['application/json'] }));
  app.get('*', handler);
  app.post('*', handler);
  // start listening
  app.listen(port, () => printReadyBox(port.toString()));
};

const ensureCleanStart = async () => {
  await ensureEnv(config);
  checkPackages();
  checkValidator();
  checkMaps();
  ensureRunsDir();
  abortRun();
  await validateTree.evaluate(kits);
};

const init = async () => {
  try {
    await ensureCleanStart();

    // TODO: This will not work in SEA mode
    // will need to have engine.js as asset and export to file.
    // + possibly another node.exe will be needed
    const engine = fork(path.join(__dirname, 'engine.js'));

    // register callback function for close event
    engine.on('close', (code) => {
      console.error(chalk.red(`Engine exited with code ${code}`));
      console.log(chalk.bold.red('Certificator startup failed \u{1F61E}'));
    });

    // register callback function for spawn event
    engine.on('spawn', () => {
      console.log(chalk.yellow('\u{23F3} Engine warming up...'));
    });

    engine.on('message', (message) => {
      if (message === 'ready') startExpress();
    });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const message = err instanceof Error || (typeof err === 'object' && err['message']) ? err['message'] : JSON.stringify(err, null, 2);
    console.error(chalk.red('Error initializing: ', message));
  }
};

export const serverPromise = init();

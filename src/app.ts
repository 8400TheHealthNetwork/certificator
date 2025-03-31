/**
 * This is the main entry point for the Certificator app.
 * It sets up the Express server, loads the kits.json file, and starts the engine as a forked process.
 * Inside the Node SEA exe, this will be the default script
 *   e.g. - the one that starts up if no arguments were passed to the exe.
 */

import config from './serverConfig';
import fs from 'fs-extra';
import {
  ensureEnv,
  checkPackages,
  checkValidator,
  checkMaps,
  ensureRunsDir,
  printReadyBox,
  checkWebFolder,
  checkJdkFolder
} from './setup';
import {
  getKitTransformer,
  getKitsTransformer,
  runWorkflowTransformer,
  getSelectedTests,
  getSkippedTests,
  getTestActions,
  runTestListExpr,
  runActionListExpr,
  validateTree,
  addMockKit
} from './helpers/expressions';
import { ChildProcess, fork } from 'node:child_process';
import path from 'path';
import cors from 'cors';
import express from 'express';
import { AxiosResponse } from 'axios';
import kitsFile from '../kits.json';
import { serveUiRoute } from './helpers/serveUiFiles';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { version as CERTIFICATOR_VERSION } from '../package.json';
import type { Express, Request, Response } from 'express';
import { createEngineClient, readJsonFile, writeJsonFile } from './helpers';
import {
  workingDir,
  currentRunDir,
  ioDir,
  kitStatusFilePath,
  workflowFilePath,
  getActionStatusFilePath,
  getTestStatusFilePath,
  engineScriptPath
} from './helpers/paths';
import { getLocalDateTime } from './helpers/localDateTime';

// Load .env file contents into process.env
dotenv.config();

export let kits = kitsFile;
export const certificatorVersion = CERTIFICATOR_VERSION;

// set the main application port (web app) and the engine port (backend)
const port: number = 8400;
const enginePort: number = 8401;

const app: Express = express();

// create an axios client for engine communication over http
const engineApi = createEngineClient(enginePort);

// create a function that spawns the engine as a forked process
// In dev mode this is a regular fork - the regular node EXE is called with the script as argument
// In the SEA EXE this will call the SEA binary with the script as argument, and this will trigger the embedded engine script
const newEngine = () => fork(engineScriptPath);
let engine: ChildProcess;

export const getKitStatus = async (kitId: string) => {
  // if there's a kit status file then read it and see if it's referring to the requested kit id
  // if no kit status file found OR it is not referring to the kit then the status is 'ready'
  // otherwise - the status in the file is the kit status
  if (await fs.exists(kitStatusFilePath)) {
    const kitStatusFileContent = await readJsonFile(kitStatusFilePath);
    if (kitStatusFileContent?.kitId === kitId) {
      return kitStatusFileContent?.status;
    };
  };
  return 'ready';
};

const setKitStatus = async (kitId: string, status: string, details?: string) => {
  await writeJsonFile(kitStatusFilePath, { kitId, status, details });
};

export const getTestStatus = async (testId: string) => {
  if (await fs.exists(getTestStatusFilePath(testId))) {
    const testStatusFileContent = await readJsonFile(getTestStatusFilePath(testId));
    return testStatusFileContent?.status;
  };
  return 'ready';
};

/**
 * Get the current status of an action
 * If the action status file exists, read it and return the content
 * If the file does not exist, return a default status object (ready)
 * @param mappingId The mapping (action) id
 * @returns A status object
 */
export const getActionStatus = async (mappingId: string) => {
  if (await fs.exists(getActionStatusFilePath(mappingId))) {
    const actionStatusFileContent = await readJsonFile(getActionStatusFilePath(mappingId));
    return actionStatusFileContent;
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
  const transformed = await getKitTransformer.evaluate(kits, { kitId, getKitStatus, getActionStatus, getTestStatus });
  res.status(200).json(transformed);
};

const setActionStatus = async (mappingId: string, statusCode: string, statusText: string, details?: string) => {
  await writeJsonFile(getActionStatusFilePath(mappingId), { statusCode, statusText, details });
};

const setTestStatus = async (testId: string, status: string, statusText: string, details?: string) => {
  await writeJsonFile(getTestStatusFilePath(testId), { status, statusText, details });
};

const setSkippedTests = async (skippedTests: string[]) => {
  skippedTests.forEach(async (testId: string) => await setTestStatus(testId, 'skipped', 'Skipped'));
};

const runAction = async (mappingId: string) => {
  // only run action if it did not run already
  const initialStatusJson = await getActionStatus(mappingId);
  let engineResponse: AxiosResponse;
  if (initialStatusJson.statusCode === 'ready') {
    await setActionStatus(mappingId, 'init', 'Initialized');
    try {
      console.log(getLocalDateTime(), `Executing action: ${mappingId}`);
      engineResponse = await engineApi.post('/', {
        input: {},
        contentType: 'application/json',
        fume: `(
        // declaring a mapping-specific $setStatus() function
        $setStatus := function($code,$text,$details){
          $writeFile(
            {
              'statusCode': $code,
              'statusText':$text,
              'details': $details
            },
            'actionStatus_${mappingId}.json'
          )
        };
        // setting action status to 'in-progress'
        $setStatus('in-progress','In Progress');

        // executing the mapping
        $${mappingId}(
          {}, // empty object as input
          // binding the $setStatus function to the mapping
          {
            'setStatus': $setStatus
          }
        ))`
      });
      const currentActionStatus = await getActionStatus(mappingId);
      if (currentActionStatus?.statusCode === 'in-progress' || currentActionStatus?.statusCode === 'init') {
        if (engineResponse.status === 200) {
          await setActionStatus(mappingId, 'completed', 'Completed');
        } else {
          const details: string = engineResponse.data.message.message ?? (
            typeof engineResponse.data.message === 'string' ? engineResponse.data.message : JSON.stringify(engineResponse.data.message ?? engineResponse.data)
          );
          console.log(`Error executing mapping ${mappingId}. Details: ${details}`);
          await setActionStatus(mappingId, 'error', 'Error', details);
        }
      };
      console.log(getLocalDateTime(), `Mapping ${mappingId} execution finished`);
    } catch (e) {
      const details: string = (e instanceof Error) ? `${e.name}: ${e.message}` : JSON.stringify(e);
      console.log(getLocalDateTime(), `Error executing mapping ${mappingId}. Details: ${details}`);
      await setActionStatus(mappingId, 'error', 'Error', details);
    }
  }
};

const runActionList = async (actionList: string[]) => {
  await runActionListExpr.evaluate({}, { actionList, runAction });
};

const runTest = async (testId: string) => {
  console.log(`Starting execution of test ${testId}`);
  const actionsToRun: string[] = await getTestActions.evaluate({}, { kits, testId });
  let errorDetails: string;
  await setTestStatus(testId, 'in-progress', 'in-progress');
  try {
    await runActionList(actionsToRun);
  } catch (e) {
    errorDetails = (e instanceof Error) ? `${e.name}: ${e.message}` : JSON.stringify(e);
    console.log(`Error executing test ${testId}. Details: ${errorDetails}`);
  };
  const lastMappingId: string = actionsToRun[actionsToRun.length - 1];
  const lastActionStatusJson = await getActionStatus(lastMappingId);
  errorDetails = errorDetails ?? lastActionStatusJson?.details;
  const testStatus: string = errorDetails ? 'error' : lastActionStatusJson.statusCode;
  const testStatusText: string = errorDetails ? 'Error' : lastActionStatusJson.statusText;
  await setTestStatus(testId, testStatus, testStatusText, errorDetails);
};

const runTestList = async (testList: string[]) => {
  await runTestListExpr.evaluate({}, { testList, runTest });
};

const runKit = async (req: Request, res: Response) => {
  const kitId: string = req.body?.kitId;
  let testsToRun: string[], skippedTests: string[];
  if (typeof kitId === 'string' && kitId.length > 0) {
    const currentKitStatus: string = await getKitStatus(kitId);
    if (currentKitStatus === 'ready') {
      try {
        await stashRun();
        const selectedTests: string[] = req.body.selected;
        if (Array.isArray(selectedTests) && selectedTests.length > 0) {
          const workflow = await runWorkflowTransformer.evaluate(kits, { kitId, selectedTests });
          [testsToRun, skippedTests] = await Promise.all([getSelectedTests.evaluate(workflow), getSkippedTests.evaluate(workflow), fs.ensureDir(currentRunDir)]);
          await Promise.all([writeJsonFile(workflowFilePath, workflow), setKitStatus(kitId, 'in-progress'), setSkippedTests(skippedTests ?? [])]);
        } else {
          res.status(400).send(`No tests were selected: 'selected' must be an array of strings, recieved ${selectedTests}`);
          return;
        }
      } catch (e) {
        const details: string = (e instanceof Error) ? `${e.name}: ${e.message}` : undefined;
        res.status(500).send(details ?? JSON.stringify(e));
        return;
      };
    } else {
      res.status(403).send(`Cannot run Kit '${kitId}' because it's status is '${currentKitStatus}'`);
      return;
    }
  } else {
    res.status(400).send('Invalid or missing Kit ID');
    return;
  };
  try {
    res.status(202).send('Accepted');
    await runTestList(testsToRun);
    await setKitStatus(kitId, 'completed');
  } catch (e) {
    const details: string = (e instanceof Error) ? `${e.name}: ${e.message}` : undefined;
    await setKitStatus(kitId, 'error', details ?? JSON.stringify(e));
  }
};

const abortRun = async (res?: Response) => {
  const kitFileExists = await fs.exists(kitStatusFilePath);
  const kitStatusFileContent = kitFileExists ? await readJsonFile(kitStatusFilePath) : undefined;
  let kitId: string;
  let currentStatus: string;
  if (kitStatusFileContent) {
    kitId = kitStatusFileContent?.kitId;
    currentStatus = kitStatusFileContent?.status;
  };
  if (typeof kitId === 'string' && currentStatus === 'in-progress') {
    if (res) {
      await setKitStatus(kitId, 'aborting');
      res.status(202).send('Accepted');
      engine.kill();
      engine = newEngine();
      // register callback function for close event
      engine.on('close', (code) => {
        console.error(chalk.red(`Engine exited with code ${code}`));
      });

      // register callback function for spawn event
      engine.on('spawn', () => {
        console.log(chalk.yellow('\u{23F3} Engine warming up...'));
      });

      engine.on('message', (message) => {
        if (message === 'ready') {
          void setKitStatus(kitId, 'aborted');
        };
      });
    } else await setKitStatus(kitId, 'aborted');
  } else {
    if (res) res.status(403).send('Cannot abort, no Kit is currently running.');
  }
};

const stashRun = async (res?: Response) => {
  // move current run dir into stash and clear it
  if (await fs.exists(workflowFilePath)) {
    const workflowFileContent = await readJsonFile(workflowFilePath);
    const runTimestamp = workflowFileContent?.timestamp;
    const stashDir: string = path.join(workingDir, 'runs', runTimestamp);
    await fs.rename(currentRunDir, stashDir);
    await fs.copy(ioDir, path.join(stashDir, 'io'));
    await fs.remove(ioDir);
    await fs.ensureDir(ioDir);
    ensureRunsDir();
  }
  if (res) res.status(200).send('Stashed');
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
    } else if (route === '/dev') {
      await serveUiRoute('/dev.html', res);
    } else {
      // handle all else (assuming it's a ui file)
      await serveUiRoute(route, res);
    }
  } else if (method === 'post') {
    if (route === '/api/kits/$run') {
      await runKit(req, res);
    } else if (route === '/api/kits/$abort') {
      await abortRun(res);
    } else if (route === '/api/kits/$stash') {
      await stashRun(res);
    } else {
      res.status(404).send('Not found');
    }
  };
};

const serveUi = () => {
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
  checkWebFolder();
  checkJdkFolder();
  await abortRun();
  console.log(chalk.grey('Ensuring referential integrity in kits.json...'));
  await validateTree.evaluate(kits);
};

const printFailedStartup = () => console.log(chalk.bold.red('Certificator startup failed \u{1F61E}'));

const init = async () => {
  try {
    if (process.env?.MOCKING_KIT === 'true') {
      kits = await addMockKit.evaluate({}, { kits });
    };

    await ensureCleanStart();
    // start the engine
    engine = newEngine();

    // register callback function for close event
    engine.on('close', (code) => {
      console.error(chalk.red(`Engine exited with code ${code}`));
      printFailedStartup();
    });

    // register callback function for spawn event
    engine.on('spawn', () => {
      console.log(chalk.yellow('\u{23F3} Engine warming up...'));
    });

    engine.on('message', (message) => {
      if (message === 'ready') {
        serveUi();
        engine.on('close', (code) => {
          console.error(chalk.red(`Engine exited with code ${code}`));
        });
      };
    });
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const message = err instanceof Error || (typeof err === 'object' && err['message']) ? err['message'] : JSON.stringify(err, null, 2);
    console.error(chalk.red('\u{1F61E} Error initializing: ', message));
    printFailedStartup();
  }
};

export const serverPromise = init();

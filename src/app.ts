import config from './serverConfig';
import fs from 'fs-extra';
import { ensureEnv, checkPackages, checkValidator, checkMaps, ensureRunsDir, printReadyBox } from './setup';
import { getKitTransformer, getKitsTransformer, runWorkflowTransformer } from './helpers/transformers';
import { fork } from 'node:child_process';
import path from 'path';
import cors from 'cors';
import express from 'express';
import axios from 'axios';
import kits from '../kits.json';
import { isFiletypeChunked } from './helpers/chunkedFileTypes';
import { getUiFileFromDisk } from './helpers/getUiFileFromDisk';

import contentTypeMap from './helpers/contentTypeMap.json';

import type { Express, Request, Response } from 'express';

const port: number = 8400;
const enginePort: number = 8401;

const app: Express = express();
const workingDir = path.resolve('.');
const currentRunDir = path.join(workingDir, 'runs', 'current');
const ioDir = path.join(workingDir, 'io');

const engineApi = axios.create({
  baseURL: `http://localhost:${enginePort.toString()}`
});

// cache for ui files
const cachedFiles = {};

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

const getKits = async (res: Response) => {
  const transformed = await getKitsTransformer.evaluate(kits, { getKitStatus });
  res.status(200).json(transformed);
};

const getKit = async (req: Request, res: Response) => {
  const kitId: string = req.originalUrl.substring(10);
  const transformed = await getKitTransformer.evaluate(kits, { kitId });
  res.status(200).json(transformed);
};

const runKit = async (req: Request, res: Response) => {
  res.status(202).send('Accepted');
  const kitId: string = req.body.kitId;
  const selectedTests: string[] = req.body.selected;
  const workflow = await runWorkflowTransformer.evaluate(kits, { kitId, selectedTests });
  fs.ensureDirSync(currentRunDir);
  fs.writeFileSync(path.join(currentRunDir, 'workflow.json'), JSON.stringify(workflow));
  fs.writeFileSync(path.join(currentRunDir, 'kitStatus.json'), JSON.stringify({ kitId, status: 'in-progress' }));
};

const abortRun = (res?: Response) => {
  if (res) res.status(202).send('Accepted');
  const kitStatusFilePath: string = path.join(currentRunDir, 'kitStatus.json');
  if (fs.existsSync(kitStatusFilePath)) {
    const kitStatusFileContent = JSON.parse(fs.readFileSync(kitStatusFilePath).toString());
    const kitId: string = kitStatusFileContent.kitId;
    const currentStatus: string = kitStatusFileContent.status;
    if (currentStatus === 'in-progress') fs.writeFileSync(path.join(currentRunDir, 'kitStatus.json'), JSON.stringify({ kitId, status: 'aborted' }));
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

const getContent = (route: string) => {
  const cached = cachedFiles[route];
  if (cached) {
    return cached;
  } else {
    const getter = getUiFileFromDisk;
    const rawContent = getter(route);
    if (rawContent) {
      cachedFiles[route] = { filename: rawContent.filename, file: rawContent.file };
      return cachedFiles[route];
    } else {
      return undefined;
    }
  }
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
      const content = getContent(route);
      if (content) {
        const filename = content?.filename;
        const file = content?.file;
        const extension = path.extname(filename);
        const contentType = contentTypeMap[extension];
        if (contentType) {
          res.set('Content-Type', contentType);
        };
        res.set('Content-Disposition', `inline; filename="${filename}"`);
        if (isFiletypeChunked[extension]) {
          res.set('Accept-Ranges', 'bytes');
          res.status(200).write(file);
          res.end();
        } else {
          res.status(200).send(file);
        }
      } else {
        res.status(404).send('Not found');
      }
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

const init = async () => {
  try {
    await ensureEnv(config);
    checkPackages();
    checkValidator();
    checkMaps();
    ensureRunsDir();
    abortRun();

    // TODO: This will not work in SEA mode
    // will need to have engine.js as asset and export to file.
    // + possibly another node.exe will be needed
    const engine = fork(path.join(__dirname, 'engine.js'));

    // register callback function for close event
    engine.on('close', (code) => {
      console.log(`Engine exited with code ${code}`);
    });

    // register callback function for spawn event
    engine.on('spawn', () => {
      console.log('Engine warming up...');
    });

    engine.on('message', (message) => {
      if (message === 'ready') {
        // setup and start express app after engine is ready
        app.use(cors());
        app.use(express.json({ limit: '50mb', type: ['application/json'] }));
        app.get('*', handler);
        app.post('*', handler);
        // start listening
        app.listen(port, () => printReadyBox(port.toString()));
      }
    });
  } catch (err) {
    console.error('Error initializing: ', err);
  }
};

export const serverPromise = init();

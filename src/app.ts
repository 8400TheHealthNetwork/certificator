import config from './serverConfig';
import fs from 'fs-extra';
import { ensureEnv, checkPackages, checkValidator, checkMaps } from './setup';
import { fork } from 'node:child_process';
import path from 'path';
import cors from 'cors';
import express from 'express';
import axios from 'axios';
import type { Express, Request, Response } from 'express';

const app: Express = express();
const port: number = 8400;
const workingDir = path.resolve('.');
const uiDistPath = path.join(workingDir, 'ui', 'dist');

const engineApi = axios.create({
  baseURL: 'http://localhost:8401'
});

// cache for ui files
const cachedFiles = {};

// map of file extensions to mime types
const contentTypeMap = {
  '.ico': 'image/x-icon',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml'
};

// file types that should be sent using a write stream
const isFiletypeChunked = {
  '.js': true,
  '.ttf': true,
  '.ico': true,
  '.css': true,
  '.svg': true
};

const getUiFileFromDisk = (route: string) => {
  const filePath = path.join(uiDistPath, route);
  let file: Buffer;
  let filename: string;
  try {
    file = fs.readFileSync(filePath);
    filename = path.basename(filePath);
    return { filename, file };
  } catch {
    if (path.basename(filePath) !== 'index.html') {
      return getUiFileFromDisk('index.html');
    } else {
      return undefined;
    }
  }
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
  if (req.method.toLowerCase() === 'get') {
    const route = req.originalUrl;
    if (route === '/health') {
      // handle healthcheck url
      const engineResponse = await engineApi.get(route);
      res.status(engineResponse.status).json(engineResponse.data);
    } else if (route.startsWith('/Action/')) {
      // handle action call
      const mappingId: string = route.substring(8);
      console.log(`Mapping: ${mappingId}`);
      res.status(200).send(`Mapping: ${mappingId}`);
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
          await res.status(200).write(file);
          res.end();
        } else {
          res.status(200).send(file);
        }
      } else {
        res.status(404).send('Not found');
      }
    }
  };
};

const init = async () => {
  try {
    await ensureEnv(config);
    checkPackages();
    checkValidator();
    checkMaps();
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

    // setup express app
    app.use(cors());
    app.get('*', handler);

    // start listening
    app.listen(port, () => {
      console.log(`Certificator listening on port ${port}`);
    });
  } catch (err) {
    console.error('Error initializing: ', err);
  }
};

export const serverPromise = init();

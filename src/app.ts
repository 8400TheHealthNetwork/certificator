import config from './serverConfig';
import fs from 'fs-extra';
import { ensureEnv, checkPackages, checkValidator, checkMaps } from './setup';
import { fork } from 'node:child_process';
import path from 'path';
import cors from 'cors';
import express from 'express';
import axios from 'axios';
import type { Express, Request, Response } from 'express';
import chalk from 'chalk';
import kits from '../kits.json';
import jsonata from 'jsonata';
import type { Expression } from 'jsonata';
import contentTypeMap from './helpers/contentTypeMap.json';

const app: Express = express();
const port: number = 8400;
const workingDir = path.resolve('.');
const uiDistPath = path.join(workingDir, 'ui', 'dist');
let getKitTransformer: Expression;
let getKitstransformer: Expression;

const engineApi = axios.create({
  baseURL: 'http://localhost:8401'
});

// cache for ui files
const cachedFiles = {};

// file types that should be sent using a write stream
const isFiletypeChunked = {
  '.js': true,
  '.ttf': true,
  '.ico': true,
  '.css': true,
  '.svg': true
};

const getKitStatus = (kitId: string) => {
  // TODO: implement
  return 'ready';
};

const getKits = async (res: Response) => {
  if (!getKitstransformer) {
    getKitstransformer = jsonata(`
      {
        'kits': kits.{
          'id': id,
          'name': name,
          'description': description,
          'status': $getKitStatus(id)
        }[]
      }`
    );
  };
  const transformed = await getKitstransformer.evaluate(kits, { getKitStatus });
  res.status(200).json(transformed);
};

const getKit = async (req: Request, res: Response) => {
  const kitId: string = req.originalUrl.substring(10);
  if (!getKitTransformer) {
    getKitTransformer = jsonata(`
      (
        $actionsMap := actions{
          id: description
        };
  
        kits[id=$kitId].{
          'children': children.{
            'id': id,
            'name': name,
            'metadata': description ? {
              'description': description,
              'status': 'ready'
            },
            'children': children.{
              'id': id,
              'name': name,
              'metadata': {
                'status': 'ready'
              },
              'children': children.{
                'id': id,
                'name': name,
                'metadata': {
                  'Description': description,
                  'Status': 'ready',
                  'Details': details,
                  'Actions': '\n' & (actions#$i.(
                    $string($i + 1) & '. ' & $lookup($actionsMap, $) & ' (ready)'
                  ) ~> $join( '\n'))
                }
              }[]
            }[]
          }[]
        }
      )
    `);
  };
  const transformed = await getKitTransformer.evaluate(kits, { kitId });
  res.status(200).json(transformed);
};

const runKit = async (req: Request, res: Response) => {
  res.status(202).send('Accepted');
};

const getUiFileFromDisk = (route: string) => {
  if (route === '/report' || route === '/report/') {
    route = '/report/index.html';
  } else if (route === '/') {
    route = '/index.html';
  }
  const filePath = path.join(uiDistPath, route);
  let file: Buffer;
  let filename: string;
  try {
    file = fs.readFileSync(filePath);
    filename = path.basename(filePath);
    return { filename, file };
  } catch {
    if (path.basename(filePath) !== 'index.html') {
      if (route.startsWith('/report/')) {
        return getUiFileFromDisk('report/index.html');
      } else {
        return getUiFileFromDisk('index.html');
      }
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
    } else {
      res.status(404).send('Not found');
    }
  };
};

const printReadyBox = () => {
  console.log(
    chalk`
    {green  ╔════════════════════════════════════════════════════════════════════════════════╗}
    {green  ║                            Certificator is ready!                              ║}
    {green  ║                                                                                ║}
    {green  ║}     Access the UI by opening this URL in a browser: {yellow http://localhost:${port}/}     {green ║}
    {green  ╚════════════════════════════════════════════════════════════════════════════════╝}
    `);
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

    engine.on('message', (message) => {
      if (message === 'ready') {
        // setup and start express app after engine is ready
        app.use(cors());
        app.use(express.json({ limit: '50mb', type: ['application/json'] }));
        app.get('*', handler);
        app.post('*', handler);
        // start listening
        app.listen(port, printReadyBox);
      }
    });
  } catch (err) {
    console.error('Error initializing: ', err);
  }
};

export const serverPromise = init();

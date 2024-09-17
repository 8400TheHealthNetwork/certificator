import config from './serverConfig';
import { checkEnv, checkPackages, checkValidator, checkMaps } from './setup';
import { IConfig, FumeServer } from 'fume-fhir-converter';
import { extraBindings } from './helpers';
import { setFumeServer } from './config';
import { loadMapFiles } from './helpers/loadMaps';
import { version as CERTIFICATOR_VERSION } from '../package.json';
import type { Request, Response, NextFunction } from 'express';

let configObject: IConfig;

const reRouter = async (req: Request, res: Response, next: NextFunction) => {
  if (req.method.toLowerCase() === 'get' && (req.originalUrl === '/' || req.originalUrl === '/health')) {
    res.status(200).json({
      CERTIFICATOR_VERSION,
      FHIR_SERVER_BASE: configObject.FHIR_SERVER_BASE,
      CERTIFICATOR_API_PORT: configObject.SERVER_PORT
    });
  } else {
    next();
  }
};

const logger = {
  info: () => { /* Do nothing with info level logging from FUME */ },
  warn: (input: any | any[]) => console.warn(input),
  error: (input: any | any[]) => console.error(input)
};

async function initServer () {
  try {
    const newConfig: IConfig = await checkEnv(config);
    configObject = newConfig;
    checkPackages();
    checkValidator();
    checkMaps();
    const fumeServer = new FumeServer<IConfig>();
    fumeServer.registerLogger(logger);
    fumeServer.registerAppMiddleware(reRouter);
    console.log('Registered HTTP server middleware');
    for (const key in extraBindings) {
      fumeServer.registerBinding(key, extraBindings[key]);
      console.log(`Registered $${key}() function binding`);
    }
    setFumeServer(fumeServer);
    await fumeServer.warmUp(newConfig);
    loadMapFiles();
    console.log('Ready :)');
  } catch (err) {
    console.error('Error warming up: ', err);
  }
}

export const serverPromise = initServer();

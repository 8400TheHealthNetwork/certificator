import config from './serverConfig';
import { checkEnv, checkPackages, checkValidator, checkMaps } from './setup';
import { IConfig, FumeServer } from 'fume-fhir-converter';
import { extraBindings } from './helpers';
import { setFumeServer } from './config';
import { loadMapFiles } from './helpers/loadMaps';
import type { Request, Response } from 'express';

let configObject: IConfig;

const healthCheck = async (req: Request, res: Response) => {
  res.status(200).json({
    FHIR_SERVER_BASE: configObject.FHIR_SERVER_BASE,
    CERTIFICATOR_API_PORT: configObject.SERVER_PORT
  });
};

async function initServer () {
  try {
    const newConfig: IConfig = await checkEnv(config);
    configObject = newConfig;
    checkPackages();
    checkValidator();
    checkMaps();
    const fumeServer = new FumeServer<IConfig>();
    setFumeServer(fumeServer);
    for (const key in extraBindings) {
      fumeServer.registerBinding(key, extraBindings[key]);
    }
    console.log('Registered extra bindings');
    const app = fumeServer.getExpressApp();
    app.get('/health', healthCheck);
    await fumeServer.warmUp(newConfig);
    loadMapFiles();
  } catch (err) {
    console.error('Error warming up: ', err);
  }
}

export const serverPromise = initServer();

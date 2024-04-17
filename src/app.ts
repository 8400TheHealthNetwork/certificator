import config from './serverConfig';
import { checkEnv, checkPackages, checkValidator } from './setup';
import { IConfig, FumeServer } from 'fume-fhir-converter';
import { extraBindings } from './helpers';
import { setFumeServer } from './config';

async function initServer () {
  try {
    const newConfig: IConfig = await checkEnv(config);
    checkPackages();
    checkValidator();
    const fumeServer = new FumeServer<IConfig>();
    setFumeServer(fumeServer);
    for (const key in extraBindings) {
      fumeServer.registerBinding(key, extraBindings[key]);
    }
    console.log('Registered extra bindings');
    await fumeServer.warmUp(newConfig);
  } catch (err) {
    console.error('Error warming up: ', err);
  }
}

export const serverPromise = initServer();

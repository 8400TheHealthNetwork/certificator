import config from './serverConfig';
import { IConfig, FumeServer } from 'fume-fhir-converter';
import {
  ExtendedFhirClient,
  extraBindings
} from './helpers';
import { setFumeServer } from './config';

const fumeServer = new FumeServer<IConfig>();
setFumeServer(fumeServer);

async function initServer () {
  const fhirClient = new ExtendedFhirClient();
  fumeServer.registerFhirClient(fhirClient);
  console.log('Registered extended fhir client');

  for (const key in extraBindings) {
    fumeServer.registerBinding(key, extraBindings[key]);
  }

  console.log('Registered extra bindings');

  try {
    await fumeServer.warmUp(config);
  } catch (err) {
    console.error('Error warming up: ', err);
  }
}

export const serverPromise = initServer();

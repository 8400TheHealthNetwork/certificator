import { IFumeServer, IConfig } from 'fume-fhir-converter';

let fumeServer: IFumeServer<IConfig> | undefined;

export const setFumeServer = (server: IFumeServer<IConfig>): void => {
  fumeServer = server;
};

export const getFumeServer = () => {
  return fumeServer;
};

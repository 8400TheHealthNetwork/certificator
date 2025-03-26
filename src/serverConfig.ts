import { IConfig, FumeConfigSchema } from 'fume-fhir-converter';

export const config = FumeConfigSchema.parse(process.env) as IConfig;
export default config;

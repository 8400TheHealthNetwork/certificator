import * as dotenv from 'dotenv';
import { IConfig, FumeConfigSchema } from 'fume-fhir-converter';

dotenv.config();

export const config = FumeConfigSchema.parse(process.env) as IConfig;
export default config;

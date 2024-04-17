import fs from 'fs-extra';
import path from 'path';
import axios, { AxiosInstance } from 'axios';
import seaConfig from '../sea-config.json';

const validatorUrl: string = 'https://github.com/hapifhir/org.hl7.fhir.core/releases/latest/download/validator_cli.jar';
const registryUrl: string = 'https://packages.fhir.org';
const assetsFolderPath: string = './assets';
const server: AxiosInstance = axios.create();

if (!fs.existsSync(assetsFolderPath)) {
  fs.mkdirSync(assetsFolderPath);
  console.log(`Directory '${assetsFolderPath}' created successfully.`);
};

const downloadValidator = async () => {
  const res = await server.get(validatorUrl, { responseType: 'arraybuffer' });
  if (res?.data) {
    console.log(`Downloaded latest version of HL7 Validator from ${validatorUrl}`);
    const jarPath = path.join(assetsFolderPath, 'validator_cli.jar');
    fs.writeFileSync(jarPath, res.data);
    console.log(`Saved validator jar in: ${jarPath}`);
  }
};

const downloadPackageTar = async (packageName: string, version: string) => {
  const packFolder: string = path.join(assetsFolderPath, 'fhirPackages');
  if (!fs.existsSync(packFolder)) {
    fs.mkdirSync(packFolder);
    console.log(`Directory '${packFolder}' created successfully.`);
  };
  const packageUrl: string = `${registryUrl}/${packageName}/${version}`;
  const res = await server.get(packageUrl, { responseType: 'arraybuffer' });
  if (res?.data) {
    console.log(`Downloaded package ${packageName}@${version}`);
    const tarPath = path.join(packFolder, `${packageName}#${version}.tgz`);
    fs.writeFileSync(tarPath, res.data);
    console.log(`Saved package in: ${tarPath}`);
  }
};

void downloadValidator();

Object.keys(seaConfig.assets).map(async (p) => {
  if (p !== 'validator_cli.jar') {
    const parts: string[] = p.split('#');
    await downloadPackageTar(parts[0], parts[1]);
  }
});

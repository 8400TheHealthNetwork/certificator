import fs from 'fs-extra';
import path from 'path';
import axios, { AxiosInstance } from 'axios';
import { getList } from './getPackageList';

const registryUrl: string = 'https://packages.fhir.org';
const assetsFolderPath: string = './assets';
const server: AxiosInstance = axios.create();

if (!fs.existsSync(assetsFolderPath)) {
  fs.mkdirSync(assetsFolderPath);
  console.log(`Directory '${assetsFolderPath}' created successfully.`);
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

getList().map(async (p) => {
  console.log(`Downloading package ${p}`);
  const parts: string[] = p.split('#');
  await downloadPackageTar(parts[0], parts[1]);
});

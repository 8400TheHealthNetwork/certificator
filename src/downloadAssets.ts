import fs from 'fs-extra';
import axios, { AxiosInstance } from 'axios';
import { getList } from './getPackageList';
import { assetsFolderPath, fhirPackagesAssetsPath, getTarAssetsFilePath } from './helpers/paths';

const registryUrl: string = 'https://packages.fhir.org';
const server: AxiosInstance = axios.create();

if (!fs.existsSync(assetsFolderPath)) {
  fs.mkdirSync(assetsFolderPath);
  console.log(`Directory '${assetsFolderPath}' created successfully.`);
};

const downloadPackageTar = async (packageName: string, version: string) => {
  if (packageName && version) {
    const packFolder: string = fhirPackagesAssetsPath;
    if (!fs.existsSync(packFolder)) {
      fs.mkdirSync(packFolder);
      console.log(`Directory '${packFolder}' created successfully.`);
    };
    const packageUrl: string = `${registryUrl}/${packageName}/${version}`;
    try {
      const res = await server.get(packageUrl, { responseType: 'arraybuffer' });
      if (res?.data) {
        console.log(`Downloaded package ${packageName}@${version}`);
        const tarPath = getTarAssetsFilePath(packageName, version);
        fs.writeFileSync(tarPath, res.data);
        console.log(`Saved package in: ${tarPath}`);
      }
    } catch (error) {
      console.error(`Error downloading package ${packageName}@${version}:`, error);
    }
  }
};

getList().filter(Boolean).map(async (p) => {
  console.log(`Downloading package ${p}`);
  const parts: string[] = p.split('#');
  await downloadPackageTar(parts[0], parts[1]);
});

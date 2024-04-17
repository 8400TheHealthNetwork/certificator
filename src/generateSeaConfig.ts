import fs from 'fs-extra';
import path from 'path';
import { getList } from './getPackageList';

const workingDir: string = path.resolve('.');
const assetsFolderPath: string = path.join(workingDir, 'assets');
const packageList: string[] = getList();
const seaConfigPath: string = path.join(workingDir, 'sea-config.json');

const getAssets = (packageList: string[]) => {
  const assetsObj: Record<string, string> = {};
  packageList.forEach(p => {
    const fileName: string = `${p}.tgz`;
    assetsObj[fileName] = path.join(assetsFolderPath, 'fhirPackages', fileName);
  });
  assetsObj['validator_cli.jar'] = path.join(assetsFolderPath, 'validator_cli.jar');
  assetsObj['fhirPackageList.txt'] = path.join(workingDir, 'fhirPackageList.txt');
  return assetsObj;
};

const seaConfig = {
  main: path.join(workingDir, 'dist/bin/certificator.js'),
  output: path.join(workingDir, 'dist/bin/certificator.blob'),
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: false,
  assets: getAssets(packageList)
};

fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
console.log(`Generated sea-config file in ${seaConfigPath}`);

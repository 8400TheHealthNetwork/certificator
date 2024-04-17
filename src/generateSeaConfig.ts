import fs from 'fs-extra';
import path from 'path';
import { getList } from './getPackageList';

const workingDir: string = path.resolve('.');
const assetsFolderPath: string = path.join(workingDir, 'assets');
const packageList: string[] = getList();
const seaConfigPath: string = path.join(workingDir, 'sea-config.json');
const mapDirPath: string = path.join(workingDir, 'maps');
const mapFileList: string[] = fs.readdirSync(mapDirPath);
const mapListFilePath: string = path.join(workingDir, 'mapFileList.json');

const getAssets = (packageList: string[], mapFileList: string[]) => {
  const assetsObj: Record<string, string> = {};
  packageList.forEach(p => {
    const fileName: string = `${p}.tgz`;
    assetsObj[fileName] = path.join(assetsFolderPath, 'fhirPackages', fileName);
  });
  mapFileList.forEach(filename => {
    assetsObj[filename] = path.join(mapDirPath, filename);
  });
  assetsObj['validator_cli.jar'] = path.join(assetsFolderPath, 'validator_cli.jar');
  assetsObj['fhirPackageList.txt'] = path.join(workingDir, 'fhirPackageList.txt');
  fs.writeFileSync(mapListFilePath, JSON.stringify(mapFileList, null, 2));
  assetsObj['mapFileList.json'] = mapListFilePath;
  return assetsObj;
};

const seaConfig = {
  main: path.join(workingDir, 'dist/bin/certificator.js'),
  output: path.join(workingDir, 'dist/bin/certificator.blob'),
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: false,
  assets: getAssets(packageList, mapFileList)
};

fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
console.log(`Generated sea-config file in ${seaConfigPath}`);

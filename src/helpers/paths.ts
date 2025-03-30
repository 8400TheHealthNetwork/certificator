import path from 'path';
import sea from 'node:sea';
import os from 'os';

const packageCachePath: string = path.join(os.homedir(), '.fhir', 'packages');
const workingDir: string = path.resolve('.');
const uiDistPath: string = sea.isSea() ? path.join(workingDir, 'web') : path.join(workingDir, 'ui', 'dist');
const webAssetFolderPath: string = path.join(workingDir, 'dist', 'sea', 'web');
const jdkAssetFolderPath: string = path.join(workingDir, 'dist', 'sea', 'jdk');
const mainScriptAssetPath: string = path.join(workingDir, 'dist', 'sea', 'main.js');
const engineScriptAssetPath: string = path.join(workingDir, 'dist', 'sea', 'engine.js');
const currentRunDir: string = path.join(workingDir, 'runs', 'current');
const workflowFilePath: string = path.join(currentRunDir, 'workflow.json');
const kitStatusFilePath: string = path.join(currentRunDir, 'kitStatus.json');
const ioDir: string = path.join(workingDir, 'io');
const mapDirPath: string = path.join(workingDir, 'maps');
const mapListFilePath: string = path.join(workingDir, 'mapFileList.json');
const engineScriptPath: string = path.join(__dirname, 'engine.js');
const assetsFolderPath: string = path.join(workingDir, 'build', 'assets');
const webAssetZipPath: string = path.join(assetsFolderPath, 'web.zip');
const jdkAssetZipPath: string = path.join(assetsFolderPath, 'jdk.zip');
const fhirPackakeListPath: string = path.join(workingDir, 'fhirPackageList.txt');
const fhirPackagesAssetsPath: string = path.join(assetsFolderPath, 'fhirPackages');
const seaConfigPath: string = path.join(workingDir, 'build', 'sea-config.json');
const distSeaPath: string = path.join(workingDir, 'dist', 'sea');
const validatorJarAssetPath: string = sea.isSea() ? path.join(workingDir, 'validator.jar') : path.join(distSeaPath, 'validator.jar');
const seaRouterScriptPath: string = path.join(workingDir, 'build', 'seaRouter.js');
const seaBloblPath: string = path.join(workingDir, 'build', 'certificator.blob');

const getTestStatusFilePath: Function = (testId: string): string => path.join(currentRunDir, `testStatus_${testId}.json`);
const getActionStatusFilePath: Function = (mappingId: string): string => path.join(ioDir, `actionStatus_${mappingId}.json`);
const getTarAssetsFilePath: Function = (packageName: string, version: string): string => path.join(fhirPackagesAssetsPath, `${packageName}#${version}.tgz`);

export {
  packageCachePath,
  workingDir,
  mapDirPath,
  mapListFilePath,
  uiDistPath,
  currentRunDir,
  workflowFilePath,
  kitStatusFilePath,
  ioDir,
  getTestStatusFilePath,
  getActionStatusFilePath,
  engineScriptPath,
  assetsFolderPath,
  fhirPackakeListPath,
  fhirPackagesAssetsPath,
  getTarAssetsFilePath,
  seaConfigPath,
  distSeaPath,
  validatorJarAssetPath,
  mainScriptAssetPath,
  engineScriptAssetPath,
  seaRouterScriptPath,
  seaBloblPath,
  webAssetFolderPath,
  jdkAssetFolderPath,
  webAssetZipPath,
  jdkAssetZipPath
};

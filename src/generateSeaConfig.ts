import fs from 'fs-extra';
import path from 'path';
import { getList } from './getPackageList';
import {
  fhirPackagesAssetsPath,
  fhirPackakeListPath,
  jdkAssetZipPath,
  mainScriptAssetPath,
  mapDirPath,
  mapListFilePath,
  seaConfigPath,
  seaBloblPath,
  seaRouterScriptPath,
  validatorJarAssetPath,
  webAssetZipPath,
  engineScriptAssetPath
} from './helpers/paths';

const getAssets = () => {
  const packageList: string[] = getList();
  const mapFileList: string[] = fs.readdirSync(mapDirPath);
  const assetsObj: Record<string, string> = {};
  packageList.forEach(p => {
    const fileName: string = `${p}.tgz`;
    const filePath: string = path.join(fhirPackagesAssetsPath, fileName);
    if (fs.existsSync(filePath)) {
      assetsObj[fileName] = filePath;
    }
  });
  mapFileList.forEach(filename => {
    assetsObj[filename] = path.join(mapDirPath, filename);
  });
  assetsObj['validator.jar'] = validatorJarAssetPath;
  assetsObj['fhirPackageList.txt'] = fhirPackakeListPath;
  fs.writeFileSync(mapListFilePath, JSON.stringify(mapFileList, null, 2));
  assetsObj['mapFileList.json'] = mapListFilePath;
  assetsObj['main.js'] = mainScriptAssetPath;
  assetsObj['engine.js'] = engineScriptAssetPath;
  assetsObj['web.zip'] = webAssetZipPath;
  assetsObj['zdk.zip'] = jdkAssetZipPath;
  return assetsObj;
};

const seaConfig = {
  main: seaRouterScriptPath,
  output: seaBloblPath,
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: false,
  assets: getAssets()
};

fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));
console.log(`Generated sea-config file in ${seaConfigPath}`);

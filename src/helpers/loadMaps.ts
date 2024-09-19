
import fs from 'fs-extra';
import path from 'path';
import { getFumeServer } from '../config';

const toFunction = (mapping: string) => {
  return async (input: any | any[]) => {
    const res: any | any[] = await getFumeServer().transform(input, mapping);
    return res;
  };
};

const cacheMapping = (mappingId: string, mappingExpr: string) => {
  const mappingFunc = toFunction(mappingExpr);
  const cacheEntry = {
    expression: mappingExpr,
    function: mappingFunc
  };
  const { compiledMappings } = getFumeServer().getCache();
  compiledMappings.set(mappingId, cacheEntry);
  console.log(`Registered mapping '${mappingId}'`);
};

const clearMappingCache = () => {
  const mappingCache = getFumeServer().getCache().compiledMappings;
  const mappingIds = mappingCache.keys();
  mappingIds.forEach((key: string) => {
    mappingCache.remove(key);
  });
  console.log('Cleared mapping cache');
};

export const loadMapFiles = () => {
  clearMappingCache();
  const folderPath: string = path.resolve('maps');
  if (fs.existsSync(folderPath)) {
    const list: string[] = fs.readdirSync(folderPath);
    if (list.length > 0) {
      console.log(`Loading map files from ${folderPath}...`);
      list.forEach((filename: string) => {
        const filePath: string = path.join(folderPath, filename);
        const mapId: string = path.parse(filePath).name;
        console.log(`Loading map file ${filename}...`);
        const expression: string = fs.readFileSync(filePath).toString();
        cacheMapping(mapId, expression);
        console.log(`Loaded file ${filename}, map id: ${mapId}`);
      });
    }
  } else {
    console.log(`${folderPath} is missing, no map files will be loaded.`);
  }
};

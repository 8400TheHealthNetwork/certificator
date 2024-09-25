
import fs from 'fs-extra';
import path from 'path';
import { getFumeServer } from '../config';
import kits from '../../kits.json';

const folderPath: string = path.join(path.resolve('.'), 'maps');

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

const checkAllActionsExist = (list: string[]) => {
  const actions = kits.actions;
  actions.forEach((action) => {
    const mappingId: string = action.mapping;
    const mappingFileName: string[] = list.filter((filename: string) => {
      return path.parse(path.join(folderPath, filename)).name === mappingId;
    });
    if (mappingFileName.length === 0) throw new Error(`Mapping ${mappingId} from action ${action.id} could not be found in ${folderPath}`);
    if (mappingFileName.length > 1) throw new Error(`Mapping ${mappingId} from action ${action.id} matches multiple file names in ${folderPath}`);
  });
};

export const loadMapFiles = () => {
  clearMappingCache();
  if (fs.existsSync(folderPath)) {
    const list: string[] = fs.readdirSync(folderPath);
    checkAllActionsExist(list);
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

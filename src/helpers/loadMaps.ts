
import fs from 'fs-extra';
import path from 'path';
import { getFumeServer } from './configFumeServer';
import kits from '../../kits.json';
import chalk from 'chalk';
import { mapDirPath } from './paths';

const folderPath: string = mapDirPath;

const toFunction = (mapping: string) => {
  return async (input: any | any[], bindings: Record<string, any | any[]> = {}) => {
    const res = await getFumeServer().transform(input, mapping, bindings);
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
  console.log(chalk`{grey Registered mapping} {green ${mappingId}}`);
};

const clearMappingCache = () => {
  console.log(chalk.grey('Clearing mapping cache...'));
  const mappingCache = getFumeServer().getCache().compiledMappings;
  const mappingIds = mappingCache.keys();
  mappingIds.forEach((key: string) => {
    mappingCache.remove(key);
  });
  console.log(chalk.grey('Mapping cache cleared'));
};

const checkAllActionsExist = (list: string[]) => {
  console.log(chalk.grey('Ensuring all action maps exist...'));
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
      console.log(chalk.grey(`Loading map files from ${folderPath}...`));
      list.forEach((filename: string) => {
        const filePath: string = path.join(folderPath, filename);
        const mapId: string = path.parse(filePath).name;
        const expression: string = fs.readFileSync(filePath).toString();
        cacheMapping(mapId, expression);
      });
    }
  } else {
    console.log(`${folderPath} is missing, no map files will be loaded.`);
  }
};

/**
 * © Copyright Outburn Ltd. 2022-2024 All Rights Reserved
 *   Project name: FUME
 */
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
  // fork: os
  const mappingFunc = toFunction(mappingExpr);
  const cacheEntry = {
    expression: mappingExpr,
    function: mappingFunc
  };
  const { compiledMappings } = getFumeServer().getCache();
  compiledMappings.set(mappingId, cacheEntry);
};

export const loadMapFiles = () => {
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

import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { isFiletypeChunked } from './chunkedFileTypes';
import contentTypeMap from './contentTypeMap.json';
import { getKitTransformer, reportRunSettings } from './expressions';
import { kits, getKitStatus, getActionStatus, getTestStatus, readJsonFile, testStatusFilePath } from '../app';
import type { Response } from 'express';

const workingDir = path.resolve('.');
const uiDistPath = path.join(workingDir, 'ui', 'dist');
const currentRunDir: string = path.join(workingDir, 'runs', 'current');
const workflowFilePath = path.join(currentRunDir, 'workflow.json');

// cache for ui files
const cachedFiles = {};

const getUiFileFromDisk = (route: string) => {
  if (route === '/report' || route === '/report/') {
    route = '/report/index.html';
  } else if (route === '/') {
    route = '/index.html';
  }
  const filePath = path.join(uiDistPath, route);
  let file: Buffer;
  let filename: string;
  try {
    file = fs.readFileSync(filePath);
    filename = path.basename(filePath);
    return { filename, file };
  } catch {
    if (path.basename(filePath) !== 'index.html') {
      if (route.startsWith('/report/')) {
        return getUiFileFromDisk('report/index.html');
      } else {
        return getUiFileFromDisk('index.html');
      }
    } else {
      return undefined;
    }
  };
};

const getFileContent = (route: string) => {
  const cached = cachedFiles[route];
  if (cached) {
    return cached;
  } else {
    const rawContent = getUiFileFromDisk(route);
    if (rawContent) {
      cachedFiles[route] = { filename: rawContent.filename, file: rawContent.file };
      return cachedFiles[route];
    } else {
      return undefined;
    }
  }
};

const getKitJson = async (kitId: string) => {
  return await getKitTransformer.evaluate(kits, { kitId, getKitStatus, getActionStatus, getTestStatus });
};

const getTestErrorDetails = async (testId: string) => {
  const testStatusFileContent = await readJsonFile(testStatusFilePath(testId));
  return testStatusFileContent?.details;
};

const getReport = async (res: Response) => {
  const workflow = await readJsonFile(workflowFilePath);
  const kitId: string = workflow?.kitId;
  const source = {
    kit: await getKitJson(kitId),
    workflow
  };
  const resJson = await reportRunSettings.evaluate(source, { kitId, kits, getTestErrorDetails, getTestStatus, userHomeDir: path.basename(os.homedir()), userProfile: path.basename(process.env.USERPROFILE) });
  res.set('Content-Type', 'application/json');
  res.set('Content-Disposition', 'inline; filename="data.json"');
  res.status(200).send(resJson);
};

export const serveUiRoute = async (route: string, res: Response) => {
  if (route === '/report/data.json') {
    await getReport(res);
  } else {
    const content = getFileContent(route);
    if (content) {
      const filename = content?.filename;
      const file = content?.file;
      const extension = path.extname(filename);
      const contentType = contentTypeMap[extension];
      if (contentType) {
        res.set('Content-Type', contentType);
      };
      res.set('Content-Disposition', `inline; filename="${filename}"`);
      if (isFiletypeChunked[extension]) {
        res.set('Accept-Ranges', 'bytes');
        res.status(200).write(file);
        res.end();
      } else {
        res.status(200).send(file);
      }
    } else {
      res.status(404).send('Not found');
    }
  }
};

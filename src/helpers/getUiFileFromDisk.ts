import path from 'path';
import fs from 'fs-extra';

const workingDir = path.resolve('.');
const uiDistPath = path.join(workingDir, 'ui', 'dist');

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

export const getContent = (route: string) => {
  const cached = cachedFiles[route];
  if (cached) {
    return cached;
  } else {
    const getter = getUiFileFromDisk;
    const rawContent = getter(route);
    if (rawContent) {
      cachedFiles[route] = { filename: rawContent.filename, file: rawContent.file };
      return cachedFiles[route];
    } else {
      return undefined;
    }
  }
};

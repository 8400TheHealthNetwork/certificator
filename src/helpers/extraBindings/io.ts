import fs from 'fs';
import path from 'path';

const ioFolderPath = './io';

if (!fs.existsSync(ioFolderPath)) {
  fs.mkdirSync(ioFolderPath);
  console.log(`Directory '${ioFolderPath}' created successfully.`);
};

export const writeFile = (content: any[], fileName: string) => {
  const filePath: string = path.join(ioFolderPath, fileName);
  let data: string;
  if (typeof content === 'string') {
    data = content;
  } else {
    data = JSON.stringify(content);
  }
  fs.writeFileSync(filePath, data);
  console.log(`File ${filePath} created successfully.`);
};

export const readFile = (fileName: string) => {
  const filePath: string = path.join(ioFolderPath, fileName);
  const data: string = fs.readFileSync(filePath).toString();
  let res;
  try {
    res = JSON.parse(data);
  } catch {
    res = data;
  }
  return res;
};

export const readDir = (subDir?: string): string[] => {
  const dirPath: string = subDir ? path.join(ioFolderPath, subDir) : ioFolderPath;
  const fileList: string[] = fs.readdirSync(dirPath);
  return fileList;
};

export const makeDir = (relativePath: string) => {
  const absPath: string = path.join(ioFolderPath, relativePath);
  if (!fs.existsSync(absPath)) {
    fs.mkdirSync(absPath, { recursive: true });
    console.log(`Directory '${absPath}' created successfully.`);
  } else {
    console.log(`Directory '${absPath}' already exists.`);
  }
};

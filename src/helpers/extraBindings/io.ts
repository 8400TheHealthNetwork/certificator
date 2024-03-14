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
  return fs.readFileSync(filePath).toJSON;
};

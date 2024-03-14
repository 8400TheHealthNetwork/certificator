import fs from 'fs';
import path from 'path';

const ioFolderPath = '../../../io';

if (!fs.existsSync(ioFolderPath)) {
  fs.mkdirSync(ioFolderPath);
  console.log(`Directory '${ioFolderPath}' created successfully.`);
};

export const writeFile = (content: any[], fileName: string) => {
  fs.writeFileSync(path.join(ioFolderPath, fileName), JSON.stringify(content));
};

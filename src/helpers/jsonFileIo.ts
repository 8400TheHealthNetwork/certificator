import fs from 'fs-extra';

export const readJsonFile = async (filePath: string) => {
  if (await fs.exists(filePath)) {
    const content: string = (await fs.readFile(filePath)).toString();
    return content === '' ? {} : JSON.parse(content);
  } else return undefined;
};

export const writeJsonFile = async (filePath: string, content: any) => await fs.writeFile(filePath, JSON.stringify(content, null, 2));

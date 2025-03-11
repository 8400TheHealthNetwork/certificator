import path from 'path';
import axios from 'axios';

const server = axios.create({ timeout: 60000 });

const workingDir = path.resolve('.');

const fetch = async (url: string) => {
  console.log(`Fetching ${url}...`);
  const res = await server.get(url, { responseType: 'arraybuffer' });
  return res;
};

export const getIoFolderPath = () => {
  return path.join(workingDir, 'io');
};

export default {
  fetch,
  getIoFolderPath
};

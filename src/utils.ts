import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';

const server = axios.create({ timeout: 60000 });

const workingDir = path.resolve('.');

const fetch = async (url: string) => {
  console.log(`Fetching ${url}...`);
  const res = await server.get(url, { responseType: 'arraybuffer' });
  return res;
};

export const getJrePath = () => {
  return path.join(workingDir, 'bin', 'jre');
};

const getJreVersionPath = () => {
  const jrePath = getJrePath();
  if (!fs.existsSync(jrePath)) {
    console.log('No JRE versions installed :(');
    return undefined;
  };

  const versions = fs.readdirSync(jrePath);
  if (versions.length === 1) {
    return path.join(jrePath, versions[0]);
  };
  if (versions.length > 1) {
    console.log('Multiple versions of jre found... Deleting all of them!');
  };
  if (versions.length === 0) {
    console.log('No JRE versions installed :(');
  };
  fs.rmSync(jrePath, { recursive: true, force: true });
  return undefined;
};

export const getJreBin = () => {
  const versionPath = getJreVersionPath();
  if (versionPath) {
    return path.join(versionPath, 'bin', 'java');
  };
  return undefined;
};

export const getValidatorPath = () => {
  return path.join(workingDir, 'bin', 'validator_cli.jar');
};

export const getIoFolderPath = () => {
  return path.join(workingDir, 'io');
};

export default {
  fetch,
  getJrePath,
  getJreBin,
  getValidatorPath,
  getIoFolderPath
};

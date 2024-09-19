import { execSync } from 'child_process';
import utils from '../../utils.js';
import { join as pathJoin } from 'path';
const {
  getJreBin,
  getValidatorPath,
  getIoFolderPath
} = utils;

const java = getJreBin();
const jar = getValidatorPath();
const ioFolder = getIoFolderPath();

export const validate = async (resourceFileName: string, options?: Record<string, string>) => {
  if (java && jar) {
    const filePath = pathJoin(ioFolder, resourceFileName);
    const igArg: string = options?.ig ? `-ig "${options.ig}"` : '';
    const outputArg: string = options?.output ? `-output "${pathJoin(ioFolder, options.output)}"` : '';
    const profileArg: string = options?.profile ? `-profile ${options.profile}` : '';
    const command: string = `"${java}" -Dfile.encoding=UTF-8 -jar "${jar}" "${filePath}" -version 4.0.1 -jurisdiction global ${igArg} ${outputArg} ${profileArg} -tx n/a`;
    const stdout: Buffer | string = execSync(command);
    if (typeof stdout === 'string') {
      return stdout;
    } else {
      return stdout.toString();
    }
  } else {
    throw new Error('Failed to find JRE :(');
  }
};

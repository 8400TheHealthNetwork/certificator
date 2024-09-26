import { execSync } from 'child_process';
import { join as pathJoin } from 'path';
import { getValidatorPath, getIoFolderPath, getJreBin } from '../../utils';

const ioFolder = getIoFolderPath();

const jar = getValidatorPath();

const java = getJreBin();

export const validate = (resourceFileName: string, options?: Record<string, string>) => {
  if (java && jar) {
    const filePath = pathJoin(ioFolder, resourceFileName);
    const igArg: string = options?.ig ? `-ig "${options.ig}"` : '';
    const outputArg: string = options?.output ? `-output "${pathJoin(ioFolder, options.output)}"` : '';
    const profileArg: string = options?.profile ? `-profile ${options.profile}` : '';
    const command: string = `"${java}" -Dfile.encoding=UTF-8 -jar "${jar}" "${filePath}" -version 4.0.1 -jurisdiction global ${igArg} ${outputArg} ${profileArg} -tx n/a -extension http://hl7api.sourceforge.net/`;
    try {
      const stdout: string = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' });
      return stdout;
    } catch (e) {
      return e instanceof Error ? e.message : JSON.stringify(e);
    }
  } else {
    throw new Error('Failed to find JRE :(');
  }
};

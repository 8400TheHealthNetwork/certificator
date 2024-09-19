import { execSync } from 'child_process';
import { join as pathJoin, resolve } from 'path';
import fs from 'fs-extra';

const workingDir = resolve('.');

export const getIoFolderPath = () => {
  return pathJoin(workingDir, 'io');
};

const ioFolder = getIoFolderPath();

export const getValidatorPath = () => {
  return pathJoin(workingDir, 'bin', 'validator_cli.jar');
};

const jar = getValidatorPath();

const getJrePath = () => {
  return pathJoin(workingDir, 'bin', 'jre');
};

const getJreVersionPath = () => {
  const jrePath = getJrePath();
  if (!fs.existsSync(jrePath)) {
    console.log('No JRE versions installed :(');
    return undefined;
  };

  const versions = fs.readdirSync(jrePath);
  if (versions.length === 1) {
    return pathJoin(jrePath, versions[0]);
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
    return pathJoin(versionPath, 'bin', 'java');
  };
  return undefined;
};

const java = getJreBin();

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

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import sea from 'node:sea';
import tar from 'tar';
import temp from 'temp';
import { IConfig } from 'fume-fhir-converter';
import { input, password, select } from '@inquirer/prompts';
import { getList } from './getPackageList';
import chalk from 'chalk';

export const ensureEnv = async (config: IConfig): Promise<IConfig> => {
  const FHIR_PACKAGES = 'il.core.fhir.r4#0.17.0';
  if (!fs.existsSync('.env')) {
    console.log('.env file is missing, let\'s create one');
    const FHIR_SERVER_BASE: string = await input({ message: 'What is the FHIR server address?' });
    const FHIR_SERVER_AUTH_TYPE: string = await select({ message: 'What is the auth type?', choices: [{ value: 'NONE' }, { value: 'BASIC' }] });
    let FHIR_SERVER_UN: string = '';
    let FHIR_SERVER_PW: string = '';
    if (FHIR_SERVER_AUTH_TYPE === 'BASIC') {
      FHIR_SERVER_UN = await input({ message: 'Please enter the username for the FHIR server' });
      FHIR_SERVER_PW = await password({ message: 'Please enter the password', mask: true });
    }
    const FHIR_VERSION = '4.0.1';
    const SERVER_PORT = '8401';
    const FHIR_SERVER_TIMEOUT = await input({ message: 'Timeout (in Milliseconds) for FHIR server API calls? (default: 30000)', default: '30000' });

    const dotEnvFile: string = `
# FHIR Server address
FHIR_SERVER_BASE=${FHIR_SERVER_BASE}

# Auth type (NONE / BASIC)
FHIR_SERVER_AUTH_TYPE=${FHIR_SERVER_AUTH_TYPE}

# Username
FHIR_SERVER_UN=${FHIR_SERVER_UN}

# Password
FHIR_SERVER_PW=${FHIR_SERVER_PW}

FHIR_VERSION=${FHIR_VERSION}

# Timeout for FHIR server API calls
FHIR_SERVER_TIMEOUT=${FHIR_SERVER_TIMEOUT}

# Validator cache settings
SESSION_CACHE_IMPLEMENTATION=PassiveExpiringSessionCache
SESSION_CACHE_DURATION=-1
    `;
    fs.writeFileSync('.env', dotEnvFile);
    const newConfig: IConfig = {
      FHIR_SERVER_BASE,
      FHIR_SERVER_AUTH_TYPE,
      FHIR_SERVER_UN,
      FHIR_SERVER_PW,
      FHIR_VERSION,
      SERVER_PORT: Number(SERVER_PORT),
      FHIR_SERVER_TIMEOUT: Number(FHIR_SERVER_TIMEOUT),
      SERVER_STATELESS: false,
      SEARCH_BUNDLE_PAGE_SIZE: config.SEARCH_BUNDLE_PAGE_SIZE,
      FHIR_PACKAGES
    };
    return newConfig;
  } else {
    return { ...config, FHIR_PACKAGES };
  }
};

export const checkPackages = () => {
  if (sea.isSea()) {
    const list: string[] = getList();
    list.forEach(p => {
      const packagePath: string = path.join(os.homedir(), '.fhir', 'packages', p);
      if (!fs.existsSync(packagePath)) {
        console.log(`Package ${p} is missing, extracting it...`);
        const tarFile = sea.getAsset(`${p}.tgz`);
        // console.log(`Creating folder: ${packagePath}`);
        // fs.mkdirSync(packagePath);
        // Create a temporary file and write the package to there
        temp.track();
        const tempFile = temp.openSync();
        fs.writeFileSync(tempFile.path, Buffer.from(tarFile));
        // Extract the package to a temporary directory
        const tempDirectory = temp.mkdirSync();
        tar.x({
          cwd: tempDirectory,
          file: tempFile.path,
          sync: true,
          strict: true
        });
        fs.moveSync(tempDirectory, packagePath);
      }
    });
  }
};

export const checkValidator = () => {
  if (sea.isSea()) {
    if (!fs.existsSync(path.join('.', 'bin', 'validator.jar'))) {
      console.log('Extracting HL7 Validator...');
      const jarFile = sea.getAsset('validator.jar');
      fs.ensureDirSync('bin');
      fs.writeFileSync(path.join('.', 'bin', 'validator.jar'), Buffer.from(jarFile));
    }
  }
};

export const checkMaps = () => {
  if (sea.isSea()) {
    if (!fs.existsSync('maps')) {
      fs.mkdirSync('maps');
      const fileList = JSON.parse(Buffer.from(sea.getAsset('mapFileList.json')).toString());
      if (Array.isArray(fileList) && typeof fileList[0] === 'string') {
        fileList.forEach(filename => {
          const filePath: string = path.join('maps', filename);
          fs.writeFileSync(filePath, Buffer.from(sea.getAsset(filename)));
        });
      }
    }
  }
};

export const ensureRunsDir = () => {
  if (!fs.existsSync('runs')) {
    fs.mkdirSync('runs');
    fs.mkdirSync(path.join('runs', 'current'));
  }
};

export const printReadyBox = (port: string) => {
  console.log(
    chalk`
  {green ╔═══════════════════════════════════════════════════════════════════════╗}
  {green ║                     \u{1F525} Certificator is ready! \u{1F525}                      ║}
  {green ║                                                                       ║}
  {green ║} Access the UI by opening this URL in a browser: {yellow http://localhost:${port}} {green ║}
  {green ╚═══════════════════════════════════════════════════════════════════════╝}
    `);
};

import config from './serverConfig';
import { ensureEnv, checkPackages, checkValidator, checkMaps } from './setup';
import { fork } from 'node:child_process';
import path from 'path';

async function init () {
  try {
    await ensureEnv(config);
    checkPackages();
    checkValidator();
    checkMaps();
    // TODO: This will not work in SEA mode
    // will need to have engine.js as asset and export to file.
    // + possibly another node.exe will be needed
    const engine = fork(path.join(__dirname, 'engine.js'));

    engine.on('close', (code) => {
      console.log(`Engine exited with code ${code}`);
    });

    engine.on('spawn', () => {
      console.log('Engine warming up...');
    });
  } catch (err) {
    console.error('Error initializing: ', err);
  }
}

export const serverPromise = init();

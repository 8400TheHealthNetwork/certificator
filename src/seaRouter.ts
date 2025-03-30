// sea-launcher.js
import path from 'path';
import fs from 'fs-extra';
import sea from 'node:sea';

if (!sea.isSea()) throw new Error('Not running inside a SEA binary.');

const runFromAssetOrDisk = () => {
  let arg: string;
  let scriptKey: string = 'main.js';
  let assetCode: string;
  console.log('Arguments:', process.argv);
  try {
    arg = process.argv[2];
    scriptKey = path.basename(arg);
  } catch {}

  try {
    assetCode = sea.getAsset(scriptKey, 'utf-8');
  } catch {
    assetCode = undefined;
  }

  if (assetCode) {
    // eslint-disable-next-line no-eval
    eval(assetCode);
    return;
  }

  if (arg && fs.existsSync(arg) && arg.endsWith('.js')) {
    require(arg);
    return;
  }

  throw new Error(`Cannot resolve script: ${arg}`);
};

runFromAssetOrDisk();

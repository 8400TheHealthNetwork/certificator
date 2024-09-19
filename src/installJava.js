import path from 'path';
import { tmpdir as _tmpdir } from 'os';
import { x } from 'tar';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';
import { $ } from 'execa';
import utils from './utils.js';
const { getJrePath, getJreBin, fetch } = utils;

const unzipDirectory = async (inputFilePath, outputDirectory) => {
  const zip = new AdmZip(inputFilePath);
  return new Promise((resolve, reject) => {
    zip.extractAllToAsync(outputDirectory, true, (error) => {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log(`Extracted to "${outputDirectory}" successfully`);
        resolve();
      }
    });
  });
};

const extractFileName = (contentDisposition) => {
  let filename = 'OpenJDK11.zip'; // default
  if (typeof contentDisposition === 'string' && contentDisposition.startsWith('attachment;')) {
    const parts = contentDisposition.split(';');
    const namePart = parts.length > 1 ? parts[1].trimStart() : undefined;
    if (typeof namePart === 'string' && (namePart.startsWith('filename=') || namePart.startsWith('"filename"='))) {
      const equalIndex = namePart.indexOf('=');
      filename = namePart.substring(equalIndex + 1).split(';')[0];
      if (filename.startsWith('"') && filename.trimEnd().endsWith('"')) {
        filename = filename.substring(1, filename.length - 2);
      }
    }
  };
  return filename;
};

const download = async (dir, url) => {
  console.log(`Downloading JRE archive from ${url} into ${dir}`);
  fs.ensureDirSync(dir);
  const response = await fetch(url);
  const attachmentName = extractFileName(response?.headers['content-disposition']);
  const destFile = path.join(dir, attachmentName);
  if (response && response?.data) {
    console.log(`Downloaded the JRE archive, saving as '${destFile}'`);
    fs.writeFileSync(destFile, response.data);
    console.log(`Saved JRE archive in: ${destFile}`);
    return destFile;
  } else {
    throw new Error('Download failed :(');
  }
};

const move = (file) => {
  const newFile = path.join(path.resolve('.'), file.split(path.sep).slice(-1)[0]);
  console.log(`Moving ${file} to ${newFile}`);
  fs.copyFileSync(file, newFile);
  fs.unlinkSync(file);
  return newFile;
};

const extractTarGz = async (file, dir) => {
  console.log(`Extracting ${file} into ${dir}`);
  x({ file, cwd: dir });
  fs.unlinkSync(file);
  return dir;
};

const extract = async (file) => {
  const dir = getJrePath();
  fs.ensureDirSync(dir);
  const extension = path.extname(file);
  if (extension === '.zip') {
    console.log('Extracting ZIP...');
    await unzipDirectory(file, dir);
  } else {
    console.log('Extracting TarGz...');
    await extractTarGz(file, dir);
  }
  await fs.unlink(file);
  return dir;
};

const installJre = async () => {
  console.log('Getting fresh copy of JRE...');
  const javaDir = await install();
  console.log({ javaDir });
  return javaDir;
};

const install = async () => {
  const version = '11';
  const options = {
    openjdk_impl: 'hotspot',
    release: 'latest',
    type: 'jre',
    heap_size: 'normal',
    vendor: 'adoptopenjdk',
    os: 'windows',
    arch: 'x64'
  };

  const endpoint = 'api.adoptopenjdk.net';
  const versionPath = 'latest/' + version + '/ga';

  if (process.platform !== 'win32') {
    throw new Error(`Unsupported operating system ${process.platform}`);
  };

  if (process.arch !== 'x64') {
    throw new Error(`Unsupported architecture ${process.arch}`);
  };

  const url =
    'https://' +
    endpoint +
    '/v3/binary/' +
    versionPath +
    '/' +
    options.os +
    '/' +
    options.arch +
    '/' +
    options.type +
    '/' +
    options.openjdk_impl +
    '/' +
    options.heap_size +
    '/' +
    options.vendor;

  const tmpdir = path.join(_tmpdir(), 'jre');

  console.log('Java URL: ' + url);
  const file = await download(tmpdir, url);
  const newFile = move(file);
  return await extract(newFile);
};

const isJavaInstalled = async () => {
  const jreBin = getJreBin();
  if (jreBin) {
    const result = await $`${jreBin} -version`;
    return result.exitCode === 0;
  } else {
    return false;
  }
};

const ensure = async () => {
  let javaInstalled = false;
  console.log('Checking for JRE...');
  javaInstalled = await isJavaInstalled();
  if (!javaInstalled) {
    const javaDir = await installJre();
    if (javaDir) {
      javaInstalled = await isJavaInstalled();
    }
  }
  console.log({ javaInstalled });
  return javaInstalled;
};

ensure();

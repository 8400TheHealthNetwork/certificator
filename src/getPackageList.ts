import fs from 'fs-extra';
import sea from 'node:sea';

export const getList = () => {
  let listFile: string;
  if (sea.isSea()) {
    listFile = Buffer.from(sea.getAsset('fhirPackageList.txt')).toString();
  } else {
    listFile = fs.readFileSync('fhirPackageList.txt').toString();
  }
  const lines: string[] = listFile.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines;
};

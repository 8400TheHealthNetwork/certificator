import fs from 'fs-extra';

export const getList = () => {
  const listFile: string = fs.readFileSync('fhirPackageList.txt').toString();
  const lines: string[] = listFile.split(/\r?\n/).filter(line => line.trim() !== '');
  return lines;
};

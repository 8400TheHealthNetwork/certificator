import * as fs from 'fs-extra';
import * as path from 'path';
import AdmZip from 'adm-zip';

/**
 * Zips the contents of a folder (not the folder itself) into a target zip file.
 * @param folderPath - Path to the folder whose contents should be zipped.
 * @param targetZipPath - Path where the resulting zip file should be saved.
 */
export const zipFolderContents = (folderPath: string, targetZipPath: string): void => {
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Folder does not exist: ${folderPath}`);
  }

  const zip = new AdmZip();
  const files = fs.readdirSync(folderPath);

  for (const fileName of files) {
    const fullPath = path.join(folderPath, fileName);
    const stat = fs.statSync(fullPath);

    if (stat.isFile()) {
      zip.addLocalFile(fullPath);
    } else if (stat.isDirectory()) {
      zip.addLocalFolder(fullPath, fileName);
    }
  }

  zip.writeZip(targetZipPath);
};

import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { getAsset } from 'node:sea';

/**
 * Extracts a bundled zip asset using sea.getAsset and extracts it to a target folder.
 * @param assetName - The name of the embedded zip asset (as passed to sea.getAsset).
 * @param targetFolderPath - The folder to extract the zip contents into.
 */
export const extractZipFromSEA = (assetName: string, targetFolderPath: string): void => {
  const buffer = getAsset(assetName);
  if (!buffer) {
    throw new Error(`Asset not found: ${assetName}`);
  }

  const zip = new AdmZip(Buffer.from(buffer));

  if (!fs.existsSync(targetFolderPath)) {
    fs.mkdirSync(targetFolderPath, { recursive: true });
  }

  zip.extractAllTo(targetFolderPath, true);
};

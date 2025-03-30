import { zipFolderContents } from './helpers/zipFolder';
import { webAssetFolderPath, webAssetZipPath, jdkAssetFolderPath, jdkAssetZipPath } from './helpers/paths';

try {
  zipFolderContents(webAssetFolderPath, webAssetZipPath);
  console.log(`Web assets zipped successfully to ${webAssetZipPath}`);
} catch (error) {
  console.error(`Error zipping web assets: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
};

try {
  zipFolderContents(jdkAssetFolderPath, jdkAssetZipPath);
  console.log(`JDK assets zipped successfully to ${jdkAssetZipPath}`);
} catch (error) {
  console.error(`Error zipping JDK assets: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
};

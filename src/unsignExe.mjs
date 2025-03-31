import { readFile, writeFile } from 'node:fs/promises';
import { signatureSet } from 'portable-executable-signature';

const exePath = process.argv[2];
if (!exePath) {
  console.error('Usage: node src/unsignExe.js <path-to-exe>');
  process.exit(1);
}
const data = await readFile(exePath);
const unsigned = signatureSet(data, null);
await writeFile(exePath, Buffer.from(unsigned));

import fs from 'fs-extra';
import utils from './utils.js';
const { fetch, getValidatorPath } = utils;

const validatorUrl = 'https://github.com/hapifhir/org.hl7.fhir.core/releases/latest/download/validator_cli.jar';

const getValidator = async () => {
  const jarPath = getValidatorPath();
  if (fs.existsSync(jarPath)) {
    console.log('Java validator found :)');
    return true;
  };
  console.log('Java validator not found, downloading...');
  const res = await fetch(validatorUrl);
  if (res?.data) {
    console.log(`Downloaded latest version of HL7 Validator from ${validatorUrl}`);
    fs.writeFileSync(jarPath, res.data);
    console.log(`Saved validator jar in: ${jarPath}`);
  }
  return true;
};

const ensure = async () => {
  console.log('Checking for the FHIR java validator...');
  const validatorExists = await getValidator();
  console.log({ validatorExists });
  return validatorExists;
};

ensure();

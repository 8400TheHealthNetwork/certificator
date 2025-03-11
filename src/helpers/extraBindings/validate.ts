import createValidatorInstance from 'fhir-validator-js';
import { getList as getPackageList } from '../../getPackageList';

let validator;

export const validate = async (resource: any) => {
  if (validator === undefined) {
    const packageList = getPackageList();
    validator = await createValidatorInstance({
      sv: '4.0.1',
      igs: packageList
    });
  }

  const result = await validator.validate(resource);
  return result;
};

export const shutdown = () => {
  if (validator) {
    validator.shutdown();
  }
};

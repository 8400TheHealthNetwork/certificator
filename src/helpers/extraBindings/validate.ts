import createValidatorInstance from 'fhir-validator-js';
import { getList as getPackageList } from '../../getPackageList';

let validator;

export const validate = async (resource: any, profiles: string | string[]) => {
  if (validator === undefined) {
    const packageList = getPackageList();
    validator = await createValidatorInstance({
      sv: '4.0.1',
      igs: packageList,
      txServer: null
    });
  }

  const result = await validator.validate(resource, profiles);
  return result;
};

export const shutdown = () => {
  if (validator) {
    validator.shutdown();
  }
};

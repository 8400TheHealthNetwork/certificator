/* eslint-disable @typescript-eslint/return-await */
import createValidatorInstance from 'fhir-validator-js';
import { getList as getPackageList } from '../../getPackageList';
import os from 'os';

const cpuCount = os.cpus().length;
const numValidators = Math.max(Math.min(cpuCount - 1, 3), 1); // Max 3 validators, min 1 validator
const validators: any[] = [];
const queues: Array<Promise<void>> = [];
const batchSize = 4; // Maximum batch size per request

/**
 * Initialize multiple validator instances.
 */
const initializeValidators = async () => {
  if (validators.length === 0) {
    console.log(`Starting ${numValidators} validator instances...`);
    const packageList = getPackageList();

    for (let i = 0; i < numValidators; i++) {
      validators[i] = await createValidatorInstance({
        sv: '4.0.1',
        igs: packageList,
        txServer: null
      });

      queues[i] = Promise.resolve(); // ✅ Initialize with resolved promise
    }
    console.log(`✅ All ${numValidators} validator instances are ready.`);
  }
};

/**
 * Validate a single resource or an array of resources using dynamic batch assignment.
 */
export const validate = async (resource: any | any[], profiles: string | string[]) => {
  await initializeValidators(); // Ensure validators are ready

  let _resource: any | any[];
  if (Array.isArray(resource) && resource.length === 1) { _resource = resource[0]; } else { _resource = resource; }; // Unwrap single resource

  let results: any | any[];

  if (Array.isArray(_resource)) {
    results = await validateBatch(_resource, profiles);
  } else {
    results = await assignToValidator(_resource, profiles, [0]);
  };

  if (Array.isArray(results)) {
    return results.map(result => result.result);
  } else {
    return results.result;
  }
};

/**
 * Splits a resource array into batches and assigns them dynamically to validators.
 */
const validateBatch = async (resources: any[], profiles: string | string[]) => {
  const batches = chunkArrayWithIndices(resources, batchSize);
  const results: Array<{ index: number, result: any }> = [];

  // Assign each batch dynamically as soon as a validator is available
  const promises = batches.map(async ({ batch, indices }) =>
    assignToValidator(batch, profiles, indices)
  );

  // Wait for all validations to complete while preserving their indices
  const resolvedResults = await Promise.allSettled(promises);

  // Flatten and restore original order
  resolvedResults.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      res.value.forEach((item: any, j: number) => {
        results.push({ index: batches[i].indices[j], result: item });
      });
    } else {
      console.error(`❌ Validation error at batch ${i}:`, res.reason);
    }
  });

  // ✅ The only place where sorting is needed
  return results.sort((a, b) => a.index - b.index).map(entry => entry.result);
};

/**
 * Assigns a batch to the next available validator while tracking original indices.
 */
const assignToValidator = async (batch: any, profiles: string | string[], indices: number[]) => {
  if (queues.length === 0 || validators.length === 0) {
    throw new Error('Validators are not initialized.');
  }

  // ✅ Find the validator with the shortest queue
  const minIndex = queues.reduce((bestIndex, curr, index) =>
    (queues[bestIndex]?.then ? bestIndex : index), 0
  );

  // ✅ Chain the new validation task onto the existing queue
  const newTask = queues[minIndex].then(() => validators[minIndex].validate(batch, profiles));

  queues[minIndex] = newTask.catch(() => {}); // Prevent breaking queue on failure

  return newTask.then(results => {
    if (!Array.isArray(results)) {
      results = [results]; // Wrap in array if necessary
    }

    // ✅ Simply return the results **without sorting**
    return results.map((res: any, i: number) => ({ index: indices[i], result: res }));
  });
};

/**
 * Splits an array into smaller arrays of a given batch size while preserving indices.
 */
const chunkArrayWithIndices = (array: any[], chunkSize: number): Array<{ batch: any[], indices: number[] }> => {
  const chunks: Array<{ batch: any[], indices: number[] }> = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push({ batch: array.slice(i, i + chunkSize), indices: Array.from({ length: chunkSize }, (_, j) => i + j) });
  }
  return chunks;
};

export const shutdown = () => {
  if (validators.length > 0) {
    validators.forEach(validator => validator.shutdown());
  }
};

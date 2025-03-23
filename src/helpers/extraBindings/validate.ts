/* eslint-disable @typescript-eslint/return-await */
import createValidatorInstance from 'fhir-validator-js';
import os from 'os';
import fs from 'fs-extra';
import path from 'path';

const cpuCount = os.cpus().length;
const numValidators = cpuCount >= 4 ? 4 : cpuCount; // Max 4 validators, min 1 validator
const validators: any[] = [];
const queues: Array<Promise<void>> = [];
const minBatchSize = 5;
const maxBatchSize = 13;

const readSessionId = (validatorIndex: number) => {
  const filePath: string = path.join('.', `.validatorSession-${String(validatorIndex)}`);
  const data: string = fs.readFileSync(filePath).toString();
  return data;
};

const writeSessionId = (sessionId: string, validatorIndex: number) => {
  const filePath: string = path.join('.', `.validatorSession-${String(validatorIndex)}`);
  fs.writeFileSync(filePath, sessionId);
};

/**
 * Initialize multiple validator instances.
 */
const initializeValidators = async () => {
  if (validators.length === 0) {
    console.log(`Starting ${numValidators} validator instances...`);
    const packageList = ['il.core.fhir.r4#0.17.0'];

    for (let i = 0; i < numValidators; i++) {
      let sessionId: string | null;
      try {
        sessionId = readSessionId(i);
      } catch {
        sessionId = null;
      }
      validators[i] = await createValidatorInstance({
        sv: '4.0.1',
        igs: packageList,
        txServer: null,
        sessionId
      });

      queues[i] = Promise.resolve(); // ✅ Initialize with resolved promise
      writeSessionId(validators[i].sessionId, i);
    }
    console.log(`✅ All ${numValidators} validator instances are ready.`);
  }
};

const determineBatchSize = (numResources: number, numValidators: number): number => {
  let bestBatchSize = minBatchSize;
  let bestScore = -Infinity; // Higher is better

  for (let batchSize = minBatchSize; batchSize <= maxBatchSize; batchSize++) {
    const totalBatches = Math.ceil(numResources / batchSize);

    // Score 1: How well batch size divides resources (higher remainder = better, except zero is best)
    const resourceBalance = numResources % batchSize;
    const resourceScore = (resourceBalance === 0 ? batchSize : resourceBalance) / batchSize;

    // Score 2: How well batches distribute across validators (higher remainder = better, except zero is best)
    const validatorBalance = totalBatches % numValidators;
    const validatorScore = (validatorBalance === 0 ? numValidators : validatorBalance) / numValidators;

    const score = (resourceScore + validatorScore * numValidators);

    if (score > bestScore) {
      bestScore = score;
      bestBatchSize = batchSize;
    }
  }

  return bestBatchSize;
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
    return results.length === 1 ? results[0].result : results.map(result => result.result);
  } else {
    return results.result;
  }
};

/**
 * Splits a resource array into batches and assigns them dynamically to validators.
 */
const validateBatch = async (resources: any[], profiles: string | string[]) => {
  const batches = chunkArrayWithIndices(resources, determineBatchSize(resources.length, numValidators));
  const results: Array<{ index: number, result: any }> = [];
  let nextBatchIndex = 0;

  // Create a queue system for validators
  const validatorQueues = new Array(numValidators).fill(Promise.resolve());

  // Function to assign a batch to the next available validator
  const processNextBatch = async (validatorIndex: number): Promise<void> => {
    if (nextBatchIndex >= batches.length) return; // No more batches left

    const { batch, indices } = batches[nextBatchIndex++];
    try {
      const batchResults = await validators[validatorIndex].validate(batch, profiles);
      if (Array.isArray(batchResults)) {
        batchResults.forEach((result: any, i: number) => {
          results[indices[i]] = { index: indices[i], result }; // Store results with original index
        });
      } else {
        results[indices[0]] = { index: indices[0], result: batchResults }; // Store single result with original index
      }
    } catch (error) {
      console.error(`❌ Validator ${validatorIndex} failed on batch ${nextBatchIndex - 1}:`, error);
    }

    // Recursively process the next batch on the same validator
    await processNextBatch(validatorIndex);
  };

  // Kick off initial batch processing
  validatorQueues.forEach((_, validatorIndex) => {
    validatorQueues[validatorIndex] = processNextBatch(validatorIndex);
  });

  // Wait for all validators to finish their work
  await Promise.all(validatorQueues);

  return results; // ✅ No sorting needed, results are placed in correct order
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

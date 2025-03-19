// additional function to bind and use within expressions
import { http } from '../fhirServer/client';
import { writeFile, readFile, makeDir, readDir, resolveCanonical, readPackageIndex } from './io';
import { toMarkdown } from './markdown';
import { validate } from './validate';

const instant = () => Date.now();

export const extraBindings = { instant, validate, http, writeFile, readFile, makeDir, readDir, resolveCanonical, readPackageIndex, toMarkdown };

// additional function to bind and use within expressions
import { http } from '../fhirServer/client';
import { writeFile, readFile, makeDir, readDir, resolveCanonical, readPackageIndex } from './io';
import { toMarkdown } from './markdown';

export const extraBindings = { http, writeFile, readFile, makeDir, readDir, resolveCanonical, readPackageIndex, toMarkdown };

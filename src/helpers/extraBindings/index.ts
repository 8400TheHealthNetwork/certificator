// additional function to bind and use within expressions
import { http } from '../fhirServer/client';
import { writeFile, readFile, makeDir, readDir, resolveCanonical, readPackageIndex } from './io';
import { toMarkdown } from './markdown';
import { validate } from './validate';

const instant = () => Date.now();
const setStatus = () => {}; // noop for dev mode. overridden with actual func when invoked as an action

export const extraBindings = { setStatus, instant, validate, http, writeFile, readFile, makeDir, readDir, resolveCanonical, readPackageIndex, toMarkdown };

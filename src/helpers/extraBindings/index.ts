// additional function to bind and use within expressions
import { http } from '../fhirServer/client';
import { writeFile, readFile } from './io';

export const extraBindings = { http, writeFile, readFile };

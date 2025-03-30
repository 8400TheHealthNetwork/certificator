# Editing & Authoring Mappings (Actions)
The basic functional building block of a test run is the Action entity. This is essentially a Mapping file that resides in the `maps` folder. Each map file's name must be purely alpha-numeric (no dashes, spaces, underscores or any other special character) and the extension is `.txt`.
The filename will be used as the mapping id and can be referenced in the following places:
1. In the `kits.json` file - To define metadata about the Action and where in the kit(s) it is being used.
2. Inside other mappings - You can call a mapping from another mapping just like any other function, e.g: `$myMappingId({})` calls the mapping saved as `maps\myMappingId.txt` and passes an empty object as the input.

**Note** - Any changes in the `maps` folder content (new files, changes in existing files, file deletion) are only reflected after a restart of the Certificator app, since the folder is scanned and loaded only once at start-up.

## Dev UI
To assist in the process of authoring and testing Mappings, there is a basic web interface available at `http://localhost:8400/dev`. The top pane is the (optional) input to the mapping. It must be a valid JSON document.  
The second pane is the Mapping expression itself.  
Pressing the `Run` button will run the Mapping on the provided input (empty input translates to an empty object), and any response data returned when it finishes will be displayed at the bottom pane.

## Syntax
The syntax for the mapping logic is the FUME syntax, which is based on the JSONata syntax. To be able to fully understand the existing tests and author new ones you should review the [JSONata documentation](https://docs.jsonata.org/overview.html) and [FUME documentation](https://www.fume.health/).

## Functions
Additional functions have been added to support common activities required in this project:

### $validate(resources [, profiles])
Runs validation (using the background HL7 Validator server) on an array of `resources` (as JSON objects), optionally againt the provided array of `profiles` (Cannonical URL's).
Please read the [validator background process](README.md#validator-background-process---on-first-call) section in the readme for some important information about the usage & behavior of this function.

Returns an array of validation result objects, in the same order as the input array.  
Each result object contains an `issues` array with errors, warnings and/or information from the HL7 Validator.  
It is possible to pass a single resource instead of an array, in which case the result will also be a single result object.

### $writeFile(content, filepath)
Writes a file into the `io` folder. If the file already exists it will be overriden.  
- `content`: string or a JSON object
- `filepath`: File name or path. Relative to the `io` folder. If an internal path is provided, the target folder must exist. You may use $makeDir() to create any internal folder structure.
This function returns `undefined` (or throws an error).

### $readFile(filepath)
Reads a file from the `io` folder.
- `filepath`: File name or path. Relative to the `io` folder.  

Returns the contents of the file. JSON files will be parsed and return as JSON values. Other files will be returned as `string`.  
If the file is not found, returns `undefined` (not an error).

### $makeDir(path)
Creates a directory or a chain of directories (e.g 'level1/level2/level3') inside the `io` folder. If any of the path steps already exists, it is NOT an error, and the contents of the folder will not be cleared. Can be used to ensure an internal path exists.
- `path`: Directory name or path. Relative to the `io` folder.

Returns `undefined` or an error.

### $readDir( [subPath] )
Reads the content of a folder. If `subPath` is not provided, the contents of the `io` folder will be returned. If a sub path is provided, it will be treated as an internal path inside `io`, and the contents of the internal folder will be retruned.
- `subpath`: Directory name or path. Relative to the `io` folder. Defaults to `io` itself.

Returns an array of file names (string), or an empty array (if folder is empty), or throws an error.

### $setStatus(code, display [, details] )
This function is bound to each mapping when it is loaded from the `maps` folder, and makes it easy to write custom Action statuses and information. The `code` (string) argument must be one of the valid status codes (e.g. 'passed', 'failed'), the `display` (string) should be the corresponding human-friendly value of it ('Passed', 'Failed' etc.) and the optional `details` (string) may contain any additional information about the status.  

**Notes**:
1. It is not required to use this function if you don't want to report a custom status. The regular workflow statuses `init`, `in-progress`, `completed` and `error` are handled automatically. The most common use for this function is in objective tests, where internal mapping logic is performed to determine if the action passed or failed.
2. When running an expression from the dev UI, this function has no effect (and using it will not throw any errors). This is because statuses are only reported during an orchestrated run of a Test Kit, and it requires a Mapping ID (which is only assigned when a mapping is loaded from a file).

### $instant()
Returns the **current exact** Date/Time in milliseconds. This is different from JSONata's built-in `$millis()` function since it will always return a new value, while `$now()` always returns the same value (the execution start time).  
It is useful for measuring times between different steps in a Mapping.

### $http(HttpOptions)
Performs an HTTP(s) call. The default Base URL for a request is the FHIR Server configured for the current [Environment](EnvironmentVariables.md). This project uses this bare-bone approach when interacting with the FHIR server (and not the native FUME functions $search(), $resolve() etc.) because in a certification framework we cannot assume that the FHIR endpoint behaves according to the standard. Using a direct HTTP call and processing its full response (and handling exceptions and errors gracefully) is essential.  
This function is a wrapper for an [Axios Instance](https://axios-http.com/docs/instance), where the `HttpOptions` argument is mapped internally to the [Axios Request Config](https://axios-http.com/docs/req_config) interface, and the returned object is an instance of [Axios Response Schema](https://axios-http.com/docs/res_schema).

These are the available config options for the mandatory HttpOptions input argument. All fields are optional. `url` SHALL be a relative URL. If both `url` and `baseUrl` are not specified, the deafult endpoint will be the FHIR server's base address. Requests will default to GET if method is not specified.  
If you need to access a base address differnt than the default FHIR server, pass an absolute URL in `baseUrl`, and optionally append an additional path by passing a relative URL in `url`.

HttpOptions:
```
{
  'method': <string, default: 'get'>,
  'headers: { 'key': 'value' ... },
  'url': <string, default: '/'>,
  'baseUrl': <string, default: $fhirServer>
  'body': <JSON>,
  'params': { 'key': 'value' ... },
  'timeout': <number, default: 10000ms>
}
```

Example call to $http() inside a Mapping:
```
$readResponse := $http({
  'method':'get',
  'headers' : {'accept': 'application/fhir+json'},
  'url': 'metadata'
})
```

This will perform a GET request against the FHIR Server's `metadata` endpoint, and return the full Axios Response object, including status, headers, and body. A conformant server should response to this request with its CapabilityStatement resource in JSON format.  
*Note*: The $http() function will NOT fail on HTTP error codes. This is by design. This means you should always inspect the response's `status` element to see, for example, if the code is in the 2xx range or not.
The actual body contents of the response can be accessed using the `data` element:

```
$readResponse.data // *should* be the actual CapabilityStatement JSON returned by the FHIR server
```

### $resolveCanonical(url)
Searches the FHIR Package Cache for a conformance resource with the provided `url` (string).

## Variables
In addition to the added functions, some global variables have been defined to enable access to useful values from within mappings. These are the variables and their usage:

### $fhirServer
Holds the URL (string) of the FHIR endpoint as configured in the [Environment Variables](EnvironmentVariables.md).

### $sampleSize
Holds the sample size (number) as configured in the [Environment Variables](EnvironmentVariables.md) or the default value of 1000 if not configured otherwise.
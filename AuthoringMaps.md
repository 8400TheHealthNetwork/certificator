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

### $validate(resources, profiles)
Runs validation (using the background HL7 Validator server) on an array of `resources` (as JSON objects), optionally againt the provided array of `profiles` (Cannonical URL's).
Please read the [validator background process](README.md#validator-background-process---on-first-call) section in the readme for some important information about the usage & behavior of this function.

### $writeFile(content, filepath)

### $readFile(filepath)

### $makeDir

### $readDir

### $setStatus(code, display, details)
This function is bound to each mapping when it is loaded from the `maps` folder, and makes it easy to write custom Action statuses and information. The `code` (string) argument must be one of the valid status codes (e.g. 'passed', 'failed'), the `display` (string) should be the corresponding human-friendly value of it ('Passed', 'Failed' etc.) and the optional `details` (string) may contain any additional information about the status.  

**Notes**:
1. It is not required to use this function if you don't want to report a custom status. The regular workflow statuses `init`, `in-progress`, `completed` and `error` are handled automatically. The most common use for this function is in objective tests, where internal mapping logic is performed to determine if the action passed or failed.
2. When running an expression from the dev UI, this function has no effect (and using it will not throw any errors). This is because statuses are only reported during an orchestrated run of a Test Kit, and it requires a Mapping ID (which is only assigned when a mapping is loaded from a file).

### $instant()
Returns the **current exact** Date/Time in milliseconds. This is different from JSONata's built-in `$millis()` function since it will always return a new value, while `$now()` always returns the same value (the execution start time).  
It is useful for measuring times between different steps in a Mapping.

### $http()

## Variables
In addition to the added functions, some global variables have been defined to enable access to useful values from within mappings. These are the variables and their usage:

### $fhirServer
Holds the URL (string) of the FHIR endpoint as configured in the [Environment Variables](EnvironmentVariables.md).

### $sampleSize
Holds the sample size (number) as configured in the [Environment Variables](EnvironmentVariables.md) or the default value of 1000 if not configured otherwise.
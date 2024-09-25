# Certificator
FHIR® Certificator for Ministry of Health, Israel

# Entities

## Test
Test status - the test status of both types (see below) is the status of the last Action (see below) in the test.

### Objective tests
Tests where we can programmatically determine if the test passed or failed.

### Subjective tests
Tests where human consideration is needed to evaluate if the test passed or failed.

Asserting pass or fail for such tests is done by a human player reviewing the test output taking into account relevant business & clinical context.

For example - assessing if the distribution of Patient.birthDate makes sense for the tested FHIR endpoint.

## Test kit

## Sample

## Action
Action == Fume map

Action can be used to perform a prerequisite step (e.g - making a simple read to fetch a resource instance) or evaluation of a logical condition as part of the test (e.g- testing if resourceType is as expected).

Action attributes
* id -
* description - human-readable text
* mapping - the name of the map
* status - 

### Action status
e.g actionStatus_[mapping].json => actionStatus_isMetadataResourceTypeOk.json
**TBD**

**Processing** status codes
1. init - A request to start the action has been sent to the engine
2. in-progress - The engine has started execution of the map
3. completed - The map completed execution, but the outcome cannot be determined (subjective)
4. error - The map's execution failed due to some error

**Logical conditions** outcome codes:
1. passed
2. failed

## Test run

# Orchestrator
## Deployment
Running the Certificator (either as the EXE distribution or using `npm start` from the root folder of the project) will spawn two HTTP servers:
### Orchestrator
On: `http://localhost:8400`
This serves both the UI (at the root endpoint) and the orchestration API's (at the `/api/` endpoint).
The report web page is also served under this port at the  `/report` endpoint.
### Engine
On: `http://localhost:8401`
This is the backend services engine that handles Actions. The Orchestrator API's are communicating with this server in a synchronous manner (running Actions and waiting for them to finish or fail) while exposing an asynchronous API for the UI.
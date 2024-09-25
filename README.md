# Certificator
FHIR® Certificator for Ministry of Health, Israel

# Entities

## Test
### Objective tests
Tests where we can programmatically determine if the test passed or failed

### Subjective tests
Tests where a human needs to evaluate if  the test passed or failed

## Test kit

## Sample

## Action
Action == Fume map

Action can be a prerequisite step (like performing a GET resource) or evaluation of a logical condition as part of the test such as testing if resourceType is as expected.

Action attributes
* id -
* description - human-readable text
* mapping - the name of the map

Action status
e.g actionStatus_[mapping].json => actionStatus_isMetadataResourceTypeOk.json
**TBD**

## Test run

# Orchestrator
## Deployment
Running the Certificator (either as the EXE distribution or using `npm start` from the root folder of the project) will spawn two HTTP servers:
### Orchestrator
On: `http://localhost:8400`
This serves both the UI (at the root endpoint) and the orchestration API's (at the `/api/` endpoint).
The report web page is also served under this port at the  `/report` endpoint.
### Engine
On: `http://localhost:8401`
This is the backend services engine that handles Actions. The Orchestrator API's are communicating with this server in a synchronous manner (running Actions and waiting for them to finish or fail) while exposing an asynchronous API for the UI.
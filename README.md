# Certificator
FHIR® Certificator for Ministry of Health, Israel

## Install & Run
1. Download the [Windows Executable](https://github.com/8400TheHealthNetwork/certificator/releases/latest/download/certificator.exe) into a dedicated folder, e.g. `c:\certificator`.
2. Open a Command Prompt (cmd) and navigate to the folder. E.g `cd c:\certificator` + ENTER.
3. Start the app: `certificator` + ENTER
4. On first run, follow the instructions in the Command Prompt to configure the environment.

For all possible configurations & settings see [Environment Variables](EnvironmentVariables.md)

## Development
This project's source control is manage by Git and uses the forking workflow.
If you wish to contribute to the project, you should:
1. Make sure you have Git, Node and NPM installed globally on your machine.
2. Fork the repository.
3. Clone the fork to a local folder.
4. Run `npm i` to install all dependencies.
5. Run `npm start` to build the project and start the app.

After making changes to any of the code or mapping files, you should exit the process (if it was still running) and then `npm start` again. Advanced users may use other lifecycle scripts defined in `package.json` for fine-grained control of the development/build/test/run activities.

When you are ready to contribute your work back to the upstream repository, follow these steps:
1. Make sure your local branch is up-to-date with the upstream `main` branch (using `git pull` or `git merge`). Resolve any conflicts that may arrise due to upstream changes in areas you have modified too.
2. Create a dedicated feature branch and push it to your fork.
3. Open a pull request.

Only pull requests from forks will be reviewed and possibly merged by the moderators.

## Orchestrator
Running the Certificator app will start an orchestration process that spawns between 2 and 3 HTTP servers, each on a separate thread:

### Web App (Main thread)
On: `http://localhost:8400`
This serves both the UI (at the root endpoint) and the orchestration API's (at the `/api/` endpoint).
The report web page is also served under this port at the  `http://localhost:8400/report` endpoint.
A basic UI for testing and developing maps is available at `http://localhost:8400/dev`.

### Engine (Backend thread)
On: `http://localhost:8401`
This is the backend services engine that handles Actions. The Orchestrator API's are communicating with this server in a synchronous manner (running Actions and waiting for them to finish or fail) while exposing an asynchronous API for the UI.

### Validator (Background process - on first call)
On the first call to $validate() from a mapping, the HL7 Java Validator (wrapped as a web server), will be exposed at: `http://localhost:3500`.  
Once the server is up, 4 validation sessions will be initiated and cached.  
**Note**: This takes a significant amount of time on the first run, depending on the performance of the machine on which it is running - anywhere between 20-90 minutes is normal. After initialization the actual validations will be efficient and fast - so long as the validation server is still running in the background. 
For this reason, the validation server process continues to run in the background *even if the Certificator process is killed*.
Please note that restarting the machine will lead to a fresh run of the service on the next $validate() call, and will again require patience until the sessions are warmed-up.
If for any reason you wish to manually kill the validation server, you should do so through the Windows task manager. The process can be identified by the title `OpenJDK Platform binary`.

## Entities

### Test
Test status - the test status of both types (see below) is the status of the last Action (see below) in the test.

#### Objective tests
Tests where we can programmatically determine if the test passed or failed.

#### Subjective tests
Tests where human consideration is needed to evaluate if the test passed or failed.

Asserting pass or fail for such tests is done by a human player reviewing the test output taking into account relevant business & clinical context.

For example - assessing if the distribution of Patient.birthDate makes sense for the tested FHIR endpoint.

### Test kit

### Sample

### Action
Action == Fume map

Action can be used to perform a prerequisite step (e.g - making a simple read to fetch a resource instance) or evaluation of a logical condition as part of the test (e.g- testing if resourceType is as expected).

Action attributes
* id -
* description - human-readable text
* mapping - the name of the map
* status - 

#### Action status
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

### Test run

## 🔍 License

This project is licensed under the **AGPL License 3.0**.

### 📜 Main Dependencies & Their Licenses:

- **FHIR Validator (Apache 2.0)** - [HL7 FHIR Validator](https://github.com/hapifhir/org.hl7.fhir.validator-wrapper)
- **OpenJDK (GPLv2 + Classpath Exception)** - [OpenJDK](https://openjdk.org/)
- **FHIR Validator JS (Apache 2.0)** - [Java Validator wrapped in a Node.js module](https://github.com/Outburn-IL/fhir-validator-js)
- **FUME Community (AGPL-3.0)** - [FUME FHIR Converter](https://github.com/Outburn-IL/fume-community)
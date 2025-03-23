# IL FHIR Certificator Environment Variables
The Certificator uses several environment variables that configure its settings and behavior.


## 🛠 Setup & Usage
The variables may be set directly at the system or user level (for advanced users), or it may be set in a text file named `.env` located at the installation folder. 

When first running the application, if a `.env` file is missing you will be guided through entering the different mandatory settings and the `.env` file will be created for you. You may edit this file later if you want to change or add variables. 

Note: If you edit the `.env` while the Certificator is running, a **restart** is required for the changes to take affect.

Bellow are the variables and their usage.

## ⚙️ Variables

### 📌FHIR_SERVER_BASE
The FHIR Server address. This is the endpoint that will be tested.

Example in ENV file:  
`FHIR_SERVER_BASE=https://server.fire.ly/r4`

### 📌FHIR_SERVER_AUTH_TYPE
Authorization type for the FHIR server endpoint. Currently supported values are `NONE` and `BASIC` (all capital). If set to `BASIC`, a username and password env variables **MUST** also be set.

Example in ENV file:  
`FHIR_SERVER_AUTH_TYPE=NONE`

### 📌FHIR_SERVER_UN
If `FHIR_SERVER_AUTH_TYPE=BASIC`, this variable must hold the user name.

Example in ENV file:  
`FHIR_SERVER_UN=some_user`

### 📌FHIR_SERVER_PW
If `FHIR_SERVER_AUTH_TYPE=BASIC`, this variable must hold the password.

Example in ENV file:  
`FHIR_SERVER_PW=passw@rd`

**Note**: If you don't want to hard code the passwrd in the env file you may set this as a system or user level environment variable and omit it from the `.env` file entirely.

#### 📌FHIR_SERVER_TIMEOUT
Timeout (in milliseconds) for FHIR server API calls. Default is 30000.

Example in ENV file:  
`FHIR_SERVER_TIMEOUT=60000`

### 📌MOCKING_KIT
For developers only. This flag adds a "mock" test kit that makes it easy to test and debug the integration between the web UI and the engine during test runs. When set to "true" (string, lowercase), the Certificator homepage will have a "Mock Kit" entry added to the test kit drop-down list.

Example in ENV file:  
`MOCKING_KIT=true`

### 📌RESOURCE_SAMPLE_SIZE
When sampling random resources from the FHIR server, this determines how many resources are collected. When this parameter is not set, the default of 1000 resources is used. 

When performing tests & development work, it may be helpful to set this manually to a lower number to reduce the amount of time the sampling process takes to complete.

Example in ENV file:  
`RESOURCE_SAMPLE_SIZE=50`

### 🔧SESSION_CACHE_IMPLEMENTATION & SESSION_CACHE_DURATION
These two parameters are automatically added to the `.env` file and should not be touched. They control how the HL7 Validator Wrapper behaves regarding validation sessions. These **must** be their exact values:
```
SESSION_CACHE_IMPLEMENTATION=PassiveExpiringSessionCache
SESSION_CACHE_DURATION=-1
```
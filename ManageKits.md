# Editing & Defining Test Kits

## Overview

The `kits.json` file defines the structure and behavior of test kits by specifying three core entities:

1. **Actions** – Atomic, reusable operations defined as mappings.  
 Examples include:
   - Interacting with the FHIR server (e.g., performing a `search` or `read` operation)
   - Evaluating logical conditions
   - Interfacing with other components (e.g., validating resources)

2. **Tests** – Sequences of Actions executed in a predefined order.  
 Tests serve as logical groupings for validating specific behaviors or outcomes.

3. **Kits** – Collections of Tests designed to validate a broader scope or standard.  
 For example, a kit might verify compliance with the **IL Data Portability Law**.

---

## Editing the `kits.json` File

The `kits.json` file consists of two main arrays:

### 1. `actions`

Each Action defines a reusable mapping operation.  
Example:

```json
{
  "id": "doExtractConditionCode",
  "description": "(Test 178) - Condition.code.coding.system distribution",
  "mapping": "doExtractConditionCode"
}
```

- **`id`** – A unique identifier for referencing this action within a test.
- **`description`** – Describes what the action is intended to do.
- **`mapping`** – Refers to the name of the mapping file located in the `maps` folder.

---

### 2. `kits`

Each Kit contains a set of tests grouped together with several levels of hierarchy ("children").
A test is made of a sequence of actions to be performed in a predefined order.

Example:

```json
{
  "id": "test11",
  "name": "Check there is a CapabilityStatement",
  "description": "Check there is a CapabilityStatement",
  "details": "Check GET metadata returns a CapabilityStatement.\n Applications SHALL return a resource that describes the functionality of the server end-point.\n https://hl7.org/fhir/R4/http.html#capabilities \n RESTful servers are required to provide this resource on demand. Servers SHALL specify what resource types and operations are supported \n https://hl7.org/fhir/R4/capabilitystatement.html#notes",
  "actions": [
    "get-metadata",
    "metadata-http-200"
 ]
}
```

- **`id`** – Unique identifier for the test.
- **`name`** – Short, descriptive title of the test.
- **`description`** – Brief explanation of the test's purpose.
- **`details`** – Additional context, including relevant requirements and documentation links.
- **`actions`** – Ordered list of actions (by ID) to execute.  
 > If an action has already been executed during the current Kit run, it will be skipped.

---
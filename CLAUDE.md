# BNG Statutory Metric 

This is a javascript library, to be used in all JS contexts: web, server, serverless etc.
The library recreates the functionality of the DEFRA Biodiversity Statutory Metric calculation tool so that it can be used in different contexts outside of Excel.
It uses the bun runtime when developing the code. Use typical bun conventions like `bun test`, `bun build` for project tasks.

# Structure
## Documentation
More information about the project can be found in:
* ./README.md
* ./docs

Scan these files for helpful information before starting a big task.


## Input Sheets
The input sheets are replicated 1-1 into relevant files. Example:
A-1 On-Site Habitat Baseline = src/onSite/habitatBaseline.ts
E-2 Off-Site Hedge Creation = src/offSite/hedgerowCreation.ts

## Tests
Tests can be found next to the relevant files under test. Example:
src/onSite/habitatBaseline.ts -> src/onSite/habitatBaseline.test.ts

# Agent Instructions
* ALWAYS use the simplest possible approach.
* ALWAYS do exactly what is asked.
* NEVER try to guess the next steps or future improvements.
* ALWAYS use @agent-excel-file-analyzer to interact with the spreadsheets.


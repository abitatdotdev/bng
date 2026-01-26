# DEFRA statutory biodiversity metric tool

> [!NOTE]
> This repository is a work in progress. Reach out to hello@abitat.dev to contribute.

The code here provides an open source, generally available version of the
[statutory biodiversity metric calculation tool](https://www.gov.uk/government/publications/statutory-biodiversity-metric-tools-and-guides)
published by [DEFRA](https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs).

The aims of this library are:
* directly mirror the existing spreadsheet calculation tool
* remain compatible with the spreadsheet format to enable seamless read/write with either tool
* work in all javascript environments (server, web, serverless)
* document and test the functionality/inner workings of the calculations

By doing so, we wish to facilitate better tooling for BNG.

## Community contributions

We encourage community contributions, but it's too early to be directly involved.
If you would like to contribute to this project, please get in touch at
[hello@abitat.dev](mailto:hello@abitat.dev).

## Using this tool

You can use this tool in any environment: web, server, serverless etc. by installing the package and using the `parseFile` function.

```sh 
npm add @abitat/bng
```

In your code, there are two options for parsing a file.

```ts
import { parseFile } from '@abitat/bng';

// in server environments, where you have access to the local filesystem
// you can pass a string representing the path to the file
const parsedSheet = parseFile('./my_metric.xlsm');

// in browser environments, or when you have file information in-memory
// you can pass the data directly to the function as an array buffer.
// For example, from an input field on a page...
const data = await inputElement.files?.[0].arrayBuffer()
const parsedSheet = parseFile(data);
```

## Documentation

- [Excel Column Mappings](./docs/excel-column-mappings.md) - Reference guide for Excel sheet structures and column mappings used in comparison tests

## Testing

There is a pretty comprehensive test suite that is split into two sections:
1. Unit tests
1. Comparison tests

### Unit tests
The unit tests make sure the each pipeline is solid and reflects the rules implicit in the original spreadsheet formulas.
They come with the benefit of providing documentation for how each calculation is performed.

These are run quickly and easily using `bun test:fast`.
This will run all tests concurrently and it's fast enough to watch for any changes you might make with no issues (try running `bun test:fast --watch` and making changes).


### Comparison tests
To make sure that the tool is compatible with the metric spreadsheets, we compare the output that the tool would calculate against real, submitted metric spreadsheets.

A few simple spreadsheets are included in the `examples/` directory, but changes are tested against the more thorough set of metrics available in the [metrics repository](https://github.com/abitatdotdev/bng-metrics).

#### Setup
To test against this larger set, you must first add them to a directory: `test/metrics`, either by copying there or by (preferably) symlinking to the other repository.

#### Testing
`bun test:compare`

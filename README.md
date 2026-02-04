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

On its own, this library doesn't do much.
However, by building on top of this library, we can power the next wave of BNG tooling.


## Community contributions

We encourage community contributions, but it's too early to be directly involved.
If you would like to contribute to this project, please get in touch at
[hello@abitat.dev](mailto:hello@abitat.dev).

## Using this tool

> [!NOTE]
> Submissions to LPAs should always provide the official version of the metric.

You can use this tool in any environment: web, server, serverless etc. by installing the package and using the `parseFile` function.

### Node
```sh 
npm add @abitat/bng
```

```ts
const { parseFile, headlineResults, tradingSummaries } = require('@abitat/bng');
// or, for module-based projects
import { parseFile, headlineResults, tradingSummaries } from '@abitat/bng';
```

```ts
// in server environments, where you have access to the local filesystem
// you can pass a string representing the path to the file
const parsedSheet = parseFile('./my_metric.xlsm');
const tradingSums = tradingSummaries(parsedRows);
const headlineResults = headlineResults(parsedRows, tradingSums);

console.log(headlineResults);
```

### Browser
Here's a simple example, outputting parsed files to the console.

```html
<head>
    <script type="module">
        import {parseFile,headlineResults,tradingSummaries} from "https://esm.sh/@abitat/bng/dist/browser/index.mjs";

        const fileEl = document.getElementById("file");
        fileEl.onchange = async (ev) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const data = await file.arrayBuffer();
            try {
                const parsed = parseFile(data)
                const tradingSums = tradingSummaries(parsedRows);
                const headlineResults = headlineResults(parsedRows, tradingSums);
                console.info({ parsed, tradingSums, headlineResults });
            } catch (e) {
                console.error(e);
            }
        }
    </script>
</head>

<body>
    <input id="file" type="file" />
</body>
</html>
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
To test against this larger set, you must first add them to a directory: `test/metrics`, either by copying there or by symlinking to the other repository.

#### Testing
`bun test:compare`

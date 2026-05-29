# DEFRA statutory biodiversity metric tool

> [!NOTE]
> This repository is a work in progress. Reach out to hello@abitat.dev to contribute.

The code here provides an implementation of the
[statutory biodiversity metric calculation tool](https://www.gov.uk/government/publications/statutory-biodiversity-metric-tools-and-guides)
published by [DEFRA](https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs).

**Licensing** ([full terms](./LICENSE.md)):

- The **JSON Schema** published at
  <https://abitatdotdev.github.io/bng/inputs.json> is dedicated to the
  **public domain under CC0 1.0** — anyone, including commercial
  entities, may adopt and build on it as a shared standard with no
  restrictions.
- The **library source code** is **dual-licensed**: free for
  noncommercial use (including charities, education, environmental
  protection organisations, and government) under the
  [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0);
  commercial use requires a separate license from abitat
  (<hello@abitat.dev>).

The aims of this library are:
* directly mirror the existing spreadsheet calculation tool
* remain compatible with the spreadsheet format to enable seamless read/write with either tool
* work in all javascript environments (server, web, serverless)
* document and test the functionality/inner workings of the calculations

On its own, this library doesn't do much.
However, by building on top of this library, we can power the next wave of BNG tooling.

## Abitat Finder

If you have a statutory metric and need to source off-site biodiversity units,
use [abitat finder](https://intel.abitat.dev/finder). Submit your metric and
see every registered habitat bank in England that matches your deficit — built
by the team behind this library. No account required.


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

### Streaming large files

For large metric files where loading the whole workbook into memory is a
problem, use `parseFileStream` instead — it yields rows incrementally so the
consumer can batch them. See [docs/streaming-parser.md](./docs/streaming-parser.md).

### Skipping validation

By default, `parseFile` rejects rows that fail any of the metric's
business-logic checks (e.g. an incompatible broad habitat / habitat type
combination). Pass `{ validate: false }` to skip those checks while still
running every enrichment and unit-value calculation. Rows that hit a missing
lookup get `undefined` unit values; the rest of the file calculates normally.

```ts
import { parseFile, headlineResults, tradingSummaries } from '@abitat/bng';

const parsed = parseFile('./my_metric.xlsm', { validate: false });
const tradingSums = tradingSummaries(parsed);
console.log(headlineResults(parsed, tradingSums));
```

### Data Parsers

For validating and enriching data outside of the metric sheet, the library provides dedicated parsers for each input type. 

```ts
import {
    parseOnSiteHabitatBaseline,
    parseOffSiteHedgerowCreation
} from '@abitat/bng';

// Validate and enrich habitat baseline data
const onSiteHabitatBaseline = parseOnSiteHabitatBaseline({
    broadHabitat: "Grassland",
    habitatType: "Other neutral grassland",
    irreplaceableHabitat: false,
    area: 2.5,
    condition: "Good",
    strategicSignificance: "Area/compensation not in local strategy or local nature recovery strategy",
    areaRetained: 2.0,
    areaEnhanced: 0.5,
    bespokeCompensationAgreed: "No",
});

if (onSiteHabitatBaseline.success) {
    // See the whole row from the corresponding input sheet
    console.log(onSiteHabitatBaseline.output);
} else {
    console.log(onSiteHabitatBaseline.issues);
}
```

These parsers match the shape of the data in the sheet as much as possible,
so you might have to, for example, convert booleans to "No".
Typescript will provide type hints where possible.

## Documentation

- [Streaming parser](./docs/streaming-parser.md) - `parseFileStream` for memory-bounded, row-by-row parsing of large metric files.

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

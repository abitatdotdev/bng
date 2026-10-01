# Workbook test data

The JSON files contain sparse workbook cells for ordinary parser scenarios: mixed habitat interventions, advanced and delayed creation, enhancement, bespoke compensation, off-site losses, intertidal trading and retained hedgerows beyond row 200. They preserve input rows, headers, detection cells and saved calculation results from Microsoft Excel-recalculated metric 4.1 workbooks.

The parser tests in `src/parsers/parseFile.test.ts` and `test/parseFileStream.test.ts` load this data through `test/workbookFixtures.ts` and serialize XLSX bytes in memory. No binary workbook files are checked in with these fixtures or needed by these tests. These tests run with `bun run test`; the eager parser and input-range tests also run with `bun run test:fast`.

`expected-results.json` records expected values, original formulas and source hashes. Numeric assertions use tolerance `1e-8`. Workbook display labels `"0.00"` and `"Yes ✓"` correspond to numeric zero and boolean true in the public API. Timing sentinels are compared exactly.

To regenerate the data, run `bun scripts/importWorkbookFixtures.ts [writer-worktree]` (defaults to `../intel-onsite-metric-writer`). Only this optional importer requires external Excel files. It verifies their original hashes, reads them without changes and writes JSON.

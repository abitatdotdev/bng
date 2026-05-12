# Streaming `.xlsm` parser for `@abitat/bng`

## Why

`parseFile` currently calls SheetJS (`xlsx`) `read(buffer)` / `readFile(path)`, which inflates the entire `.xlsm` (zip + `sharedStrings.xml` + every cell of every retained sheet) into an in-memory `WorkBook` before any row is parsed. On a 512MB Fly VM, a 5.7MB statutory metric file produces ~395MB RSS and gets OOM-killed mid-parse, taking the HTTP server down with it. Even after bumping the VM to 1GB, peak memory still scales with file size rather than row count, so the next slightly-larger file reproduces the failure.

The downstream consumer (`abitat/intel`, `src/lib/submitted-metrics.server.ts → extractFeatures → replaceMetric`) does **not** need the full `AllFeatures` object in memory. It maps each row to a DB-insert shape and bulk-inserts per kind inside a single Kysely transaction. If the library yielded rows incrementally, the consumer could batch-insert and keep peak heap bounded by batch size, not file size.

## Goal

Add a streaming parse API to `@abitat/bng` whose peak memory is bounded by `O(sharedStrings + maxBufferedSheet)` rather than `O(fileSize)`. The new path must **not** depend on SheetJS — SheetJS is the OOM source and has no usable per-row streaming API for the worksheet XML. Preserve the existing `parseFile` API as a thin wrapper for backwards compatibility.

## Non-goals

- No change to validation semantics. Rows produced by the stream must be byte-identical to rows produced by today's `parseFile` (same valibot schemas, same enrichment, same row order per sheet).
- No change to the public `AllFeatures` shape returned by `parseFile`.
- Not optimising calculations downstream of parsing (headline results, trading summaries). Those keep operating on a fully-materialised `AllFeatures`.
- Not removing SheetJS from the package in this change. v1 keeps both paths in parallel; a follow-up can delete the SheetJS path once `abitat/intel` has migrated.

## Cross-environment constraint

The package ships to web, Node, Bun, serverless, and edge runtimes (see `package.json` `exports`: `.` for Node ESM/CJS, `./browser` for browser ESM, plus a separate `bun build` target). The streaming parser must work in all of them. Concretely that rules out:

- `node:fs`, `node:stream`, `node:zlib` — Node-only.
- `Buffer` — Node-only (use `Uint8Array`).
- Worker-based streaming xlsx libs that ship Node bindings.

It rules in:

- Web `ReadableStream<Uint8Array>` (Node ≥18, Bun, browser, Cloudflare Workers, Deno).
- `Uint8Array` / `ArrayBuffer`.
- Pure-JS deps with no platform code. `fflate` is the main candidate: small, dependency-free, supports streaming unzip via its `Unzip` class, works identically in all four runtimes. (Confirm bundle-size impact on the `./browser` export before committing.)

## What we have to work with

The existing parser is built around SheetJS' `WorkSheet` shape and a small set of helpers:

- `parseFile.ts:115` — `parseWorkbook`, the single SheetJS entry point.
- `parseFile.ts:161` — `parseFile`, runs `parseAllRows` / `parseAllEnhancementRows` over the 18 sheet specs in `parseFile.ts:167–189` in a fixed order.
- `parseFile.ts:332` — `findAllDataRows`, scans the `dataDetectionColumn` from `startRow` for up to `MAX_DATA_ROWS` (200) and stops after 10 consecutive empties.
- `excelHelpers.ts:24` — `getCellValue(sheet, row, col)`, the single read primitive used by every `parseXxxRow` function. Internally it converts the sheet to an array-of-arrays once and caches it in a `WeakMap`.
- `columnMappings.ts` — `validateWorkbookHeaders`, the header-validation pass that runs immediately after `parseWorkbook`.
- `rowParsers.ts` — 18 `parseXxxRow(sheet, row)` functions that read individual cells via `getCellValue` and return the valibot input shape.

The row parsers are the contract worth preserving. They only need:

1. A `(row, col) → cellValue` accessor.
2. A `WorkSheet`-shaped handle to pass in.

If we satisfy those two with a non-SheetJS backend, the row parsers and schemas are reused unchanged.

## Strategy: a minimal sheet view

Introduce a runtime-agnostic `SheetView` interface that the row parsers consume, and provide two implementations:

```ts
export interface SheetView {
  getCell(row: number, col: number): string | number | boolean | null;
}
```

- **SheetJS adapter** wraps a `WorkSheet` and calls today's `getCellValue`. Used by `parseFile` (synchronous, unchanged behaviour).
- **Streaming adapter** is built row-by-row by the streaming xlsx reader. Only holds the cells of the current sheet's relevant row window.

`getCellValue` is exported and used directly by every `parseXxxRow`. Refactor those 18 functions to accept a `SheetView` (or rebind `getCellValue` to dispatch on the view). Type signatures change from `XLSX.Sheet` to `SheetView`; the bodies are unchanged.

## The streaming xlsx reader

An `.xlsx`/`.xlsm` is a zip containing:

- `xl/sharedStrings.xml` — shared string table referenced by `<c t="s"><v>idx</v></c>` cells.
- `xl/workbook.xml` + `xl/_rels/workbook.xml.rels` — sheet name → `xl/worksheets/sheetN.xml` mapping.
- `xl/worksheets/sheetN.xml` — per-sheet XML, one `<row>` per row, one `<c>` per cell. Numbers are inline (`<v>1.23</v>`), strings are shared-string indices (`<c t="s"><v>42</v>`) or rarely inline strings (`<c t="inlineStr"><is><t>...</t></is></c>`).
- `xl/styles.xml` — only relevant if we need to distinguish dates from numbers; the current parser already does not, so we can ignore styles.

Pipeline:

1. **Stream-unzip with `fflate.Unzip`.** It accepts a `Uint8Array` chunk at a time and emits per-entry streams. Works in every target environment.
2. **First pass over entries we need, in this order:**
   - `xl/workbook.xml` + rels → build sheetName → entryPath map. Validate that every name in `allSheetSpecs` and `sheetsToGrab` exists; reuse `validateWorkbookHeaders`' missing-sheet error format.
   - `xl/sharedStrings.xml` → fully buffer into a `string[]`. This is the only unavoidable buffered allocation; on the failing fixture it is ~tens of MB of strings, not hundreds.
   - For each sheet we want, in the order defined by `parseFile.ts:167–189`: SAX-parse `<row>` elements; convert each `<row>` into a sparse `Map<number, cellValue>`; expose a `SheetView` backed by that map; run the matching `parseXxxRow` + valibot pipeline; yield the result; discard the row.
3. **Header validation** happens during the row scan: when we cross `startRow - 1` we have seen all header rows; run the per-sheet header check then. If headers mismatch we throw the same error `validateWorkbookHeaders` throws today.
4. **Stop conditions** mirror `findAllDataRows`: stop after 10 consecutive empty `dataDetectionColumn` rows or after `MAX_DATA_ROWS` data rows.

The SAX layer can be a ~150-line hand-roll — we only care about `<sst>/<si>/<t>`, `<sheetData>/<row>/<c>/<v>/<is>/<t>`, and the `r`/`t`/`s` attributes of `<c>`. Avoid a dependency for this; SAX libs that work in every runtime (`sax-wasm`, `htmlparser2`) are larger than the parser we need.

### Sheet ordering & enhancement → baseline coupling

Spec author was right that enhancement sheets need their baseline sheet. Concretely (`parseFile.ts:169,173,177,181,185,189`), each `parseAllEnhancementRows` call takes both `baselineSpec` and `enhancementSpec`, and the corresponding `parseOnSiteHabitatEnhancementRow` etc. take `(baselineSheet, enhancementSheet, row)` — see `parseAllEnhancementRows` signature at `parseFile.ts:292`.

Constraint: the streaming reader visits zip entries in **zip order**, not workbook order. Two options:

1. **Buffer baseline `SheetView`s.** For each baseline sheet, fully materialise its sparse row map (still cheap — baselines are the smallest sheets) when its entry is encountered. Keep it in scope only while the matching enhancement sheet is streamed; drop after.
2. **Two-pass.** Index zip entries on the first pass, then re-open the zip and re-stream baseline sheets on demand.

Prefer (1). Memory for a buffered baseline sheet is `O(rows × usedCols)` — for the failing fixture this is small.

The yield order from `parseFileStream` must match `parseFile.ts:167–189` regardless of zip order. Implementation: collect each sheet's parsed rows into an in-memory queue keyed by spec; drain the queues in the canonical order after the underlying zip stream ends. Alternative: process the zip entries twice (once to index, once to stream in canonical order). The queue approach uses more peak memory but is simpler and one-pass; pick it unless profiling says otherwise.

## Proposed API

```ts
// New
export type StreamedRow =
  | { kind: "onSiteHabitatBaseline"; row: OnSiteHabitatBaseline }
  | { kind: "onSiteHabitatCreation"; row: OnSiteHabitatCreation }
  | { kind: "onSiteHabitatEnhancement"; row: OnSiteHabitatEnhancement }
  // ... one variant per sheet currently parsed in parseFile.ts:167–189
  ;

export type ParseFileStreamInput =
  | Uint8Array
  | ArrayBuffer
  | Blob
  | ReadableStream<Uint8Array>;

export interface ParseFileStreamOptions extends ParseFileOptions {
  /** Optional cancellation. Aborting causes the iterator to throw on next `next()`. */
  signal?: AbortSignal;
}

export function parseFileStream(
  file: ParseFileStreamInput,
  options?: ParseFileStreamOptions,
): AsyncIterable<StreamedRow>;
```

Notes:

- Input does **not** accept a filesystem path. Path-based parsing in `parseFile` works because SheetJS' `readFile` uses `node:fs`; that doesn't exist in the browser. Callers on Node who want a path open it themselves: `Readable.toWeb(fs.createReadStream(path))`. This keeps `parseFileStream` portable.
- Yield order matches `parseFile.ts:167–189`. Within a sheet, row order is preserved.

`parseFile` keeps its current synchronous SheetJS implementation. We do **not** rewrite it on top of `parseFileStream`, because:

- That would force `parseFile` to become async (a breaking signature change), and the only consumer is `abitat/intel`, which calls `parseFile` from an async function but still expects a sync return shape.
- The streaming reader has different I/O properties and isn't free; keeping the sync path means existing callers and tests are unaffected.

If `parseFile` ever needs to share row-parser code with `parseFileStream`, share it through the `SheetView` interface, not by having one call the other.

### Browser entrypoint

`src/browser.ts` is a separate build target (`bun build src/browser.ts --target browser`). Export `parseFileStream` from both `src/index.ts` and `src/browser.ts`. The streaming reader must not import anything from `src/parsers/parseFile.ts` that pulls in SheetJS in browser builds. Verify with `bun build --target browser` after wiring — SheetJS in a browser bundle has been a problem historically.

## Implementation plan

1. Define `SheetView` and migrate `getCellValue` / row parsers to accept it. Keep SheetJS-backed implementation; all existing tests pass unchanged.
2. Add `fflate` dependency. Audit browser bundle size delta (`bun build src/browser.ts` before/after).
3. Build the zip-stream → entry-stream layer over `fflate.Unzip`.
4. Build the SAX layer for `sharedStrings.xml` and `worksheet.xml`. Unit-test against hand-written fixtures (a 2-row workbook with a shared string, an inline string, a number, an empty cell, a sparse row).
5. Build the streaming sheet → `SheetView` adapter. Verify that `parseOnSiteHabitatBaselineRow` returns the same output given a streamed view vs a SheetJS view for a recorded reference workbook.
6. Wire `parseFileStream`: orchestrate the sheet visit order, buffer baselines for enhancements, drain queues in canonical order, run valibot per row, yield.
7. Export from both `src/index.ts` and `src/browser.ts`.
8. Run `bun test:compare` — must pass unchanged.

## Testing

- `bng/test/comparison.test.ts` (`bun test:compare`) compares parsed output against reference fixtures. Add a parallel comparison that consumes `parseFileStream`, accumulates into `AllFeatures`, and asserts deep equality with the legacy output for every fixture.
- Unit tests for the SAX layer (per item 4 above).
- Manual memory test (not in suite): parse a synthetic ~50MB workbook under `--max-old-space-size=128` and `bun --smol`; record peak RSS. Compare to legacy `parseFile` on the same fixture.

## Acceptance criteria

- `parseFileStream` is exported from `src/index.ts` and `src/browser.ts`.
- `bun build` succeeds for all four targets (`node` ESM, `node` CJS, `browser` ESM, plus types).
- For every existing test fixture, accumulating `parseFileStream` into `AllFeatures` produces deep-equal output to `parseFile`.
- Parsing a 50MB synthetic metric file completes with `--max-old-space-size=128`.
- No regression in `bun test:compare`.

## Out of scope / follow-ups

- Streaming output of headline results / trading summaries (those still need the full `AllFeatures`).
- Removing SheetJS entirely. v1 keeps both paths; a follow-up can delete the sync path once `abitat/intel` has migrated.

## References

- Current parser entry: `src/parsers/parseFile.ts:115` (`parseWorkbook`) and `:161` (`parseFile`).
- Cell-access helper used by every row parser: `src/parsers/excelHelpers.ts:24` (`getCellValue`).
- Header validation: `src/parsers/columnMappings.ts` — `validateWorkbookHeaders`, `formatValidationErrors`.
- Sheet whitelist + `sheetsToGrab` array: `src/parsers/parseFile.ts:68-95`.
- Sheet visit order (must be preserved by the stream): `src/parsers/parseFile.ts:167-189`.
- Enhancement-row signature requiring a baseline sheet: `src/parsers/parseFile.ts:292` (`parseAllEnhancementRows`).
- Build targets: `package.json` `scripts.build:*` and `exports`.
- Consumer call site: `intel/src/lib/submitted-metrics.server.ts:261` (`extractFeatures`) and `:320` (`replaceMetric`).
- Failure trace that motivated this work: Fly OOM at 2026-05-12T15:31:00Z on machine `0800eeda649248`, total-vm 74GB / anon-rss 395MB, parsing `Davenham_Habitat_Bank_...ALS_Feb2025.xlsm` (5,712,175 bytes). Request `POST /api/admin/sites/UGS-120526003/metric` took 51,191ms and returned 422.

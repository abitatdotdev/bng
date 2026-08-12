# Streaming parser (`parseFileStream`)

`parseFile` loads the entire `.xlsm`/`.xlsx` into memory before returning anything. For large metric files on small VMs, that can OOM. `parseFileStream` yields rows incrementally so the consumer can batch them and never holds the full workbook on the heap.

The output rows are byte-identical to `parseFile`'s — same valibot schemas, same enrichment, same order.

## Usage

```ts
import { parseFileStream } from "@abitat/bng";

for await (const { kind, row } of parseFileStream(input)) {
  // `kind` tells you which sheet the row came from.
  // `row` is the same parsed shape `parseFile` would have produced.
}
```

## Inputs

```ts
type ParseFileStreamInput =
  | Uint8Array
  | ArrayBuffer
  | Blob
  | ReadableStream<Uint8Array>;
```

Works in Node, Bun, browsers, and edge runtimes. No filesystem path — on Node, do `Readable.toWeb(fs.createReadStream(path))` if you have one.

## Options

```ts
interface ParseFileStreamOptions {
  /** Run the validating schema for each row. Default: true. Same as `parseFile`. */
  validate?: boolean;
  /** Abort iteration. The next `.next()` rejects with `signal.reason`. */
  signal?: AbortSignal;
}
```

## Output

Each yielded value is a discriminated union — one variant per sheet (18 in total):

```ts
type StreamedRow =
  | { kind: "onSiteHabitatBaseline";    row: OnSiteHabitatBaseline }
  | { kind: "onSiteHabitatCreation";    row: OnSiteHabitatCreation }
  | { kind: "onSiteHabitatEnhancement"; row: OnSiteHabitatEnhancement }
  | { kind: "offSiteHabitatBaseline";   row: OffSiteHabitatBaseline }
  // ...etc — one per AllFeatures key
  ;
```

Yield order is the same as `parseFile`: on-site habitat → off-site habitat → on-site hedgerow → off-site hedgerow → on-site watercourse → off-site watercourse, and within each block: baselines → creations → enhancements. Row order within a sheet is preserved.

## Errors

- **`Unsupported metric layout: ...`** — sheet missing or column header mismatch. Thrown before the first row is yielded, same wording as `parseFile`.
- **`Error: parsing <sheet> row <n>`** — schema validation failed (only when `validate: true`). Thrown mid-stream; rows yielded before the error are valid.
- **`AbortError`** (or whatever you set as `signal.reason`) — thrown on the next `.next()` after `controller.abort()`.

## Example: batched bulk insert

```ts
import { parseFileStream, type StreamedRow } from "@abitat/bng";

const BATCH = 500;

async function ingest(buffer: ArrayBuffer, db: Kysely<DB>) {
  const buckets = new Map<StreamedRow["kind"], unknown[]>();
  const flush = async (kind: StreamedRow["kind"]) => {
    const rows = buckets.get(kind);
    if (!rows?.length) return;
    await db.insertInto(tableFor(kind)).values(rows).execute();
    buckets.set(kind, []);
  };

  for await (const { kind, row } of parseFileStream(buffer)) {
    let bucket = buckets.get(kind);
    if (!bucket) { bucket = []; buckets.set(kind, bucket); }
    bucket.push(row);
    if (bucket.length >= BATCH) await flush(kind);
  }
  for (const kind of buckets.keys()) await flush(kind);
}
```

## When to use which

| | `parseFile` | `parseFileStream` |
|---|---|---|
| Return shape | `AllFeatures` (sync) | `AsyncIterable<StreamedRow>` |
| Memory | grows with file size | bounded by the largest single sheet |
| Use when | you need the full materialised object (calculations, headline results, trading summaries) | you only need rows for ingest / bulk insert / row-by-row processing |

`parseFile` is unchanged and remains the right choice for downstream calculations that need `AllFeatures` in one shot.

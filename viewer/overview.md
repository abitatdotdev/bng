An in-progress schema for the BNG Metric, drafted by "The BNG Coalition".

## How to read this site

- The left sidebar lists every input schema (on-site and off-site, for habitats, hedgerows, and watercourses).
- Each entry shows the full object shape: required fields, enums, numeric ranges, and per-field descriptions.
- All schemas live under `#/components/schemas/<name>` in this view (originally `#/$defs/<name>` in the published JSON Schema).

## Using the published schema

The canonical schema is published at <https://abitatdotdev.github.io/bng/inputs.json>. Reference a single entry via JSON pointer:

```json
{ "$ref": "https://abitatdotdev.github.io/bng/inputs.json#/$defs/onSiteHabitatBaseline" }
```

## Naming convention

Schemas are named `<location><module><stage>`:

- **location** — `onSite` or `offSite`
- **module** — `Habitat`, `Hedgerow`, or `Watercourse`
- **stage** — `Baseline`, `Creation`, or `Enhancement`

For example, `offSiteHedgerowEnhancement` is the input for enhancing an existing off-site hedgerow.

## Source

See the project README and `docs/` directory for calculation details and worked examples.

## License

- **The schema** (this document, `inputs.json`) is dedicated to the **public domain under CC0 1.0** — adopt, extend, and redistribute freely, including commercially, with no attribution required.
- **The library** that generates and validates against it is **dual-licensed**: free for noncommercial use (charities, education, environmental protection organisations, government) under the PolyForm Noncommercial License 1.0.0; commercial use requires a separate license from abitat (<hello@abitat.dev>).

Full terms: [license.md](./license.md).

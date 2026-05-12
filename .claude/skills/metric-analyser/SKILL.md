---
name: metric-analyser
description: Reads and understands Statutory Metric Spreadsheets for any type of question
argument-hint: [sheet|file|question]
model: haiku
---

# Statutory Metric Analyser

Analyse one or more BNG metric spreadsheets from the `examples/` directory or the `test/metrics` directory.

## How to use

Invoke with `/metric-analyser` optionally followed by:
- A specific sheet name (e.g. `A-1`, `D-2`, `C-1`)
- A specific file (e.g. `simple.xlsm`)
- A specific question (e.g. `what habitats are lost on-site?`)

If no arguments are given, produce a high-level summary of all sheets in `examples/less-simple.xlsm`.

## Instructions

1. **Use the excel-file-analyzer agent** (`@agent-excel-file-analyzer`) for all spreadsheet reads. Never use raw bash or the excel MCP tools directly.

2. **Reference the column mappings** in `src/parsers/columnMappings.ts` (the authoritative spec) before reading any sheet. `docs/excel-column-mappings.md` is a human-readable companion but may lag behind the spec. The spec tells you:
   - Which row headers and data rows start on
   - Which columns are inputs vs calculated outputs
   - Sheet-specific quirks (typos in names, special cases)

3. **Read only what you need.** Don't dump entire sheets. Use targeted ranges based on the column mappings. Expand only if the user's question requires it.

4. **Follow formula references** Never search across large ranges of sheets to understand logic. Choose a cell, read the formula, then explore the cells referenced in the formula. Follow the cell references until you understand what is happening.

5. **Available spreadsheets:**
   - `examples/simple.xlsm` / `examples/simple-unlocked.xlsm` — simple example, perfect for formulas
   - `examples/less-simple.xlsm` — richer data

6. **Sheet groups to be aware of:**

   | Group       | On-Site       | Off-Site      | Trading Summary               |
   |-------------|---------------|---------------|-------------------------------|
   | Habitat     | A-1, A-2, A-3 | D-1, D-2, D-3 | Trading Summary Area Habitats |
   | Hedgerow    | B-1, B-2, B-3 | E-1, E-2, E-3 | Trading Summary Hedgerows     |
   | Watercourse | C-1, C-2, C-3 | F-1, F-2, F-3 | Trading Summary WaterC's      |

   Off-site sheets add **Spatial Risk Multiplier** logic (exception: F-2 does not apply SRM to units).

7. **Structure your output clearly:**
   - State which file and sheet(s) you read
   - Note important cells and ranges specifically
   - Use plain english for formulas, but reference specific formulas from cells

8. **Document your findings:**
   - Create notes in the skill directory that outline important information about sheets and logic

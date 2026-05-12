# Unit Shortfall Calculations

The 'Unit shortfall calculations' sheet is a validation and synthesis layer that determines whether a project meets statutory biodiversity net gain (BNG) requirements. It pulls aggregated data from Headline Results and Trading Summary sheets, breaks shortfalls down by distinctiveness tier, and flags regulatory violations.

**Source file:** `examples/simple-unlocked.xlsm` (identical structure in `examples/less-simple.xlsm`)

---

## Overall Data Flow

```
Baseline sheets (A-1, B-1, C-1, D-1, E-1, F-1)
  └─▶ Trading Summary sheets (by distinctiveness tier)
        └─▶ Headline Results (aggregated totals + required units)
              └─▶ Unit shortfall calculations
                    ├── Summary: pass/fail per feature type
                    ├── Tier shortfall: how much is needed per tier
                    └── Tier detail: which individual habitats are lost/gained
```

The sheet reads but never writes back — it is a terminal consumer of calculated data.

---

## Sheet Structure

The sheet has three distinct sections laid out vertically:

| Rows | Section | Purpose |
|------|---------|---------|
| 2–8 | Summary | High-level target vs actual for habitats, hedgerows, watercourses |
| 9–16 | Tier Shortfall | Per-tier shortfall amounts (A5 down to A1) with SRM applied |
| 17+ | Tier Detail | Individual habitats listed under each distinctiveness tier showing net gains/losses |

---

## Section 1: Summary (Rows 2–8)

Columns D–H. Each row covers one feature type.

| Row | Feature | D (Target) | E (Baseline Units) | F (Required Units) | G (Unit Deficit) |
|-----|---------|-----------|--------------------|--------------------|-----------------|
| 3 | Area Habitats | `=Start!F22` | `='Headline Results'!$E$61` | `='Headline Results'!$F61` | `='Headline Results'!$H61` |
| 4 | Hedgerows | `=Start!F22` | `='Headline Results'!H9` | `='Headline Results'!$F62` | `='Headline Results'!$H62` |
| 5 | Watercourses | `=Start!F22` | `='Headline Results'!H10` | `='Headline Results'!$F63` | `='Headline Results'!$H63` |

- **D column** — pulls the user-specified BNG target from the Start sheet (cell F22). This is the same value for all three rows.
- **E column** — pulls the current baseline unit total from Headline Results.
- **F column** — pulls the required unit total (baseline × 1.1 for the statutory 10% net gain).
- **G column** — the deficit: required minus actual. Positive means a shortfall exists.

---

## Section 2: Tier Shortfall (Rows 9–16)

This is the core calculation section. It determines how many units are needed *by tier* to close the overall shortfall, accounting for trading rules between tiers.

### Column Layout

| Column | Content |
|--------|---------|
| E | Tier label (A5, A4, A3, A2, A1, H, W) |
| F | Unit shortfall for that tier |
| G | Shortfall with Spatial Risk Multiplier applied (F × 2) |

### Guard Clause — Very High Distinctiveness Loss Check

Every tier formula begins with the same guard:

```excel
IF(OR('Trading Summary Area Habitats'!$K$13 < 0,
      'Trading Summary WaterC''s'!$I$13 < 0), "ERROR", ...)
```

- `K$13` on Trading Summary Area Habitats is the net gain/loss for tier A5 (Very High) habitats.
- `I$13` on Trading Summary WaterC's is the same for Very High watercourses.
- If either is negative, the entire sheet returns `"ERROR"`. Losses of Very High distinctiveness habitat cannot be offset through trading — they must be compensated separately (bespoke or like-for-like).

Row 16 displays the full warning message when this condition is triggered:

```excel
=IF(OR(...), "ERROR - This metric still includes losses of very high distinctiveness habitat. ...")
```

### Per-Tier Formulas

**Tiers A5 through A2** (rows 13 down to 10) use straightforward aggregation of the corresponding tier detail sections:

| Row | Tier | Formula (Column F) | What it aggregates |
|-----|------|--------------------|--------------------|
| 13 | A5 | `=(H21*-1)` | Net losses in tier detail rows 21–25 (lakes, ponds, etc.) |
| 12 | A4 | `=(H27+M129)*-1` | Habitat losses (H27) + hedgerow losses (M129) |
| 11 | A3 | `=H45*-1` | Woodland/forest losses |
| 10 | A2 | `=(H57+M127)*-1` | Habitat losses (H57) + hedgerow losses (M127) |

The `*-1` sign flip converts negative net-change values (losses) into positive shortfall amounts.

**Tier A1** (row 9) is the most complex. It acts as the balancing tier — it must absorb whatever shortfall remains after higher tiers have been accounted for. The formula is a deeply nested conditional:

```excel
=IFERROR(
  IF(<guard clause>, "ERROR",
    IF((F13+F12+F11+F10 + ((H65+M122+G138)*-1)) >= G3,
      ((H65+M122+G138)*-1),                          -- Case 1
      IF((F13+F12+F11+F10 + ((H65+M122+G138)*-1)) >= (G3-(F3-E3)),
        (((H65+M122+G138)*-1) + (G3-(F13+F12+F11+F10+((H65+M122+G138)*-1)))),  -- Case 2
        IF(G3 <= 0, ((H65+M122+G138)*-1),            -- Case 3
          IF((F13+F12+F11+F10+((H65+M122+G138)*-1)) < G3,
            (G3-(F10+F11+F12+F13)),                   -- Case 4
            IF(G3 >= F3-E3,
              ((H65+M122+G138)*-1)+(F3-E3),           -- Case 5
              ((H65+M122+G138)*-1)+G3                 -- Case 6
            )
          )
        )
      )
    )
  ), "Error")
```

Breaking down the logic:

- **`(H65+M122+G138)*-1`** is the raw A1-tier loss: sum of habitat losses (H65), hedgerow losses (M122), and watercourse losses (G138), sign-flipped to a positive shortfall.
- **`F13+F12+F11+F10`** is the sum of shortfalls already calculated for tiers A5–A2.
- **`G3`** is the overall habitat deficit from the summary section.
- The cases determine whether the A1 raw loss alone satisfies the overall deficit, or whether A1 must absorb the remainder after higher-tier shortfalls are subtracted.

**Hedgerows (row 14)** and **Watercourses (row 15)** follow a simpler but structurally similar pattern — they compare their own raw tier loss against the feature-type deficit (G4 or G5):

```excel
-- Row 14 (Hedgerows):
=IFERROR(IF(<guard>, "ERROR",
  IF((G147*-1) < G4, G4,
    IF(G4 <= 0, (G147*-1),
      IF(G4 >= F4-E4, (G147*-1),
        (G147*-1)+G4)))), "Error")

-- Row 15 (Watercourses):
=IF(<guard>, "ERROR",
  IF((G157*-1) < G5, G5,
    IF(G5 <= 0, (G157*-1),
      IF(G5 >= F5-E5, (G157*-1),
        (G157*-1)+G5))))
```

### SRM Column (Column G)

Column G simply doubles column F:

```excel
=IF(F9="ERROR", "ERROR", F9*2)
```

This represents the Spatial Risk Multiplier penalty for off-site compensation: units delivered off-site must be doubled to account for delivery risk.

---

## Section 3: Tier Detail (Rows 17+)

Individual habitats are listed under each tier heading with their net unit change pulled from the G-2 Habitat groups sheet.

### Structure per tier block

```
Row N:   Tier header  (B = tier code, D = "Tier", E = "Habitat", F = "Habitat Group")
Row N+1: Tier label   (D = tier code, E = description)
Rows N+2...: Individual habitats
  G column: net unit change  (='G-2 Habitat groups'!BE[row] or similar)
  H column: =SUMIF(G[start]:G[end], "<0")  — aggregates only the losses in this block
```

The SUMIF pattern is consistent across every tier block. It isolates negative values (losses) so the tier shortfall formulas in Section 2 can reference just the loss total via the H column.

### Key tier detail row references

| Cell | Tier | What it totals |
|------|------|----------------|
| H21 | A5 | Very High distinctiveness habitat losses |
| H27 | A4 | High distinctiveness habitat losses |
| H45 | A3 | Medium distinctiveness habitat losses |
| H57 | A2 | Low distinctiveness habitat losses |
| H65 | A1 | Very Low distinctiveness habitat losses |
| G138 | — | Watercourse losses feeding into A1 |
| M122 | — | Hedgerow losses feeding into A1 |
| M127 | — | Hedgerow losses feeding into A2 |
| M129 | — | Hedgerow losses feeding into A4 |
| G147 | — | Hedgerow total losses (row 14 formula) |
| G157 | — | Watercourse total losses (row 15 formula) |

---

## Cross-Sheet References

| Source Sheet | Cells Used | Purpose |
|---|---|---|
| Start | F22 | User-specified BNG target |
| Headline Results | E61, F61–F63, H9–H10 | Baseline and required unit totals per feature type |
| Trading Summary Area Habitats | K13 | Very High tier net gain/loss (guard clause) |
| Trading Summary WaterC's | I13 | Very High watercourse net gain/loss (guard clause) |
| G-2 Habitat groups | BE column, AU/AV columns | Individual habitat net changes and groupings |

---

## Key Patterns

### 1. Guard clause is universal
Every formula in the tier shortfall section begins with the same Very High distinctiveness check. If any VH habitat or watercourse has a net loss, the entire sheet errors out. This enforces the regulatory rule that VH losses cannot be traded away.

### 2. Sign convention
Raw values from Trading Summary and tier detail sections are *negative* when habitat is lost. The shortfall formulas consistently apply `*-1` to convert losses into positive shortfall amounts for comparison against the deficit in column G.

### 3. SUMIF isolates losses
Tier detail blocks contain both gains and losses. The `SUMIF(..., "<0")` in column H extracts only the negative values, giving each tier a clean "total lost" figure that the shortfall formulas reference.

### 4. A1 tier absorbs the remainder
Tiers A5–A2 report their raw losses directly. Tier A1 is the balancing tier: its formula compares the sum of all higher-tier shortfalls against the overall deficit and adjusts accordingly. If higher tiers already cover the deficit, A1 reports only its own raw loss. If not, A1 must make up the difference.

### 5. SRM doubling is a flat multiplier
Column G applies a uniform ×2 to every tier shortfall. This is not a risk-adjusted calculation — it is a fixed policy multiplier reflecting the additional units required when compensation is delivered off-site.

### 6. Hedgerow and watercourse shortfalls are feature-isolated
Unlike area habitats which have a complex multi-tier balancing formula, hedgerows and watercourses each have a single shortfall value (rows 14 and 15). The logic is: if the feature-type deficit (G4 or G5) exists, report whichever is larger — the raw tier loss or the deficit itself.

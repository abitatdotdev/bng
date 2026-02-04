# Implementation Strategy: `unitShortfall`

## Where it lives

**`src/unitShortfall.ts`** — a single file, same as `headlineResults.ts`. It's a synthesis layer, not an input sheet (those go in `onSite/`/`offSite/`) and not a trading rule engine (those go in `tradingSummaries/`). The scope is comparable to headlineResults (~200–300 lines), so no subdirectory is needed.

---

## Function signature

```typescript
import type { AllFeatures } from './features';
import type { HeadlineResults } from './headlineResults';

export function unitShortfall(features: AllFeatures, headline: HeadlineResults) { ... }
export type UnitShortfallResult = ReturnType<typeof unitShortfall>;
```

Two inputs mirror the sheet's data flow:
- `headline` — already contains `habitatUnitSummary`, `hedgerowUnitSummary`, `watercourseUnitSummary` (the Section 1 summary values). No need to recompute.
- `features` — needed for grouping lookups (`valuesByHabitat` etc.) that produce per-habitat net changes for Section 3, and for calling trading summaries for the guard clause.

---

## Internal structure (three functions, one orchestrator)

Following the headlineResults pattern of small, named, pure helper functions:

### 1. Guard clause

```typescript
function hasVeryHighLosses(features: AllFeatures): boolean
```

Calls `habitatTradingSummary(features).vHighSatisfied` and `watercourseTradingSummary(features).vHighSatisfied` — these already exist. The guard is `!habitatVhSatisfied || !watercourseVhSatisfied`. Note: hedgerows are deliberately excluded, matching the Excel formula which only checks `'Trading Summary Area Habitats'!$K$13` and `'Trading Summary WaterC''s'!$I$13`.

### 2. Tier loss aggregation

```typescript
function habitatTierLosses(features: AllFeatures): Record<DistinctivenessCategory, number>
function hedgerowTierLosses(features: AllFeatures): Record<DistinctivenessCategory, number>
function watercourseTierLosses(features: AllFeatures): Record<DistinctivenessCategory, number>
```

Each iterates over all items of that feature type (via `allHabitats`, `allHedgerows`, `allWatercourses`), groups by `distinctivenessCategory`, pulls `unitChangeIncludingOffSite` (or equivalent) from the corresponding grouping function, and sums only the negative values per tier. This is the SUMIF pattern from Section 3 of the sheet.

The habitat version would look like:

```typescript
function habitatTierLosses(features: AllFeatures) {
    const byHabitat = valuesByHabitat(features);
    const result: Record<string, number> = {};
    for (const habitat of Object.values(allHabitats)) {
        const change = byHabitat[habitat.label]?.unitChangeIncludingOffSite ?? 0;
        if (change < 0) {
            const tier = habitat.distinctivenessCategory;
            result[tier] = (result[tier] ?? 0) + change;
        }
    }
    return result;  // values are negative; sign-flipped by callers
}
```

### 3. Tier shortfall calculation

```typescript
function habitatTierShortfall(
    tierLosses: Record<DistinctivenessCategory, number>,
    overallDeficit: number,
    baselineUnits: number,
    requiredUnits: number
): { a5: number; a4: number; a3: number; a2: number; a1: number }
```

- **A5–A2**: straightforward sign-flip of the corresponding tier loss value.
- **A1**: the balancing tier. Implement the six-case conditional as a standalone function with named local variables so each case is readable and testable independently:

```typescript
function a1BalancingShortfall(
    a1RawLoss: number,       // sum of A1-tier losses (positive)
    higherTierTotal: number, // A2+A3+A4+A5 shortfalls
    deficit: number,         // overall feature deficit from HeadlineResults
    requiredGap: number      // requiredUnits - baselineUnits
): number
```

Hedgerow and watercourse shortfalls are simpler — single-value comparisons against their own feature-type deficit (rows 14 and 15 in the sheet). Extract as:

```typescript
function featureShortfall(rawTierLoss: number, deficit: number, requiredGap: number): number
```

### 4. SRM application

Not a separate function — just `* 2` applied in the orchestrator when building the output. Keeping it inline matches how the sheet treats it (a trivial column, not a named calculation).

---

## Output shape

```typescript
{
    hasVeryHighLosses: boolean,

    summary: {
        habitats:     { baselineUnits, requiredUnits, unitDeficit },
        hedgerows:    { baselineUnits, requiredUnits, unitDeficit },
        watercourses: { baselineUnits, requiredUnits, unitDeficit },
    },

    tierShortfalls: {
        habitats: {
            a5: { shortfall, srmShortfall },
            a4: { shortfall, srmShortfall },
            a3: { shortfall, srmShortfall },
            a2: { shortfall, srmShortfall },
            a1: { shortfall, srmShortfall },
        },
        hedgerows:    { shortfall, srmShortfall },
        watercourses: { shortfall, srmShortfall },
    },

    tierDetail: {
        habitats: { habitat: HabitatLabel, tier: DistinctivenessCategory, netChange: number }[],
        hedgerows: { hedgerow: HedgerowLabel, tier: DistinctivenessCategory, netChange: number }[],
        watercourses: { watercourse: WatercourseLabel, tier: DistinctivenessCategory, netChange: number }[],
    },
}
```

Use `ReturnType<typeof unitShortfall>` for the type export (consistent with `HeadlineResults`).

---

## Testing

Follow the existing fixture + unit test pattern (`*.test.ts` next to the source):

| Test | What to verify |
|------|---------------|
| Guard clause | Returns `true` when VH habitat has net loss; `false` otherwise; hedgerow VH losses do not trigger it |
| Tier loss aggregation | Only negative changes are summed; habitats/hedgerows/watercourses are isolated |
| A1 balancing | All six cases produce correct output — this is the highest-risk function and warrants a dedicated describe block with one test per case |
| Feature shortfall (hedgerow/watercourse) | Deficit-vs-loss comparison logic |
| SRM doubling | Trivially correct, but include to guard against future changes |
| Integration | Call `unitShortfall` with a known `AllFeatures` fixture and compare all output values against the Excel file |

---

## Wiring

No changes to `index.ts` are needed at this stage — `headlineResults` isn't exported there either. Consumers import directly:

```typescript
import { unitShortfall } from './src/unitShortfall';
import { headlineResults } from './src/headlineResults';

const headline = headlineResults(features);
const shortfall = unitShortfall(features, headline);
```

If the project later adds a top-level orchestrator that chains everything, both modules wire in at the same level.

---

## How to implement each feature

Follow these rules while completing each task:
* keep function and variable names as close as possible to the names in the sheet
* always read and refer to specific formulas before implementing the corresponding function

---

## What to implement first

1. **Tier loss aggregation** — the foundation. Everything else depends on it, and it's the easiest to validate against Excel (Section 3 values are directly visible).
2. **Guard clause** — trivial once trading summaries are in scope, but semantically important to get right before building shortfall logic on top.
3. **A5–A2 shortfalls** — simple sign-flips of tier losses.
4. **Feature shortfall** (hedgerow/watercourse) — small self-contained conditional.
5. **A1 balancing** — last, because it depends on all higher tiers and is the most complex single piece. Test thoroughly against Excel.


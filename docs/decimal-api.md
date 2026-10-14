# Decimal API

BNG accepts finite JavaScript numbers, decimal strings or Decimal.js instances for area and length
inputs through `featuresFromInput(input, { validate?: boolean })` and the checked
and unchecked row schemas. Numeric years also accept strings and Decimal instances, subject
to the existing integer range of 0–30; `30+` remains a separate string sentinel.
Both `@abitat/bng` and `@abitat/bng/browser` export the same Decimal constructor,
`Quantity` type, schemas and exact calculation helpers.

```ts
import {
    toDecimal,
    featuresFromInput,
    tradingSummaries,
    headlineResults,
} from '@abitat/bng';

const { features, issues } = featuresFromInput({
    onSiteHabitatBaselines: [{
        broadHabitat: 'Grassland',
        habitatType: 'Modified grassland',
        area: '0.123456789123456789',
        condition: 'Poor',
        irreplaceableHabitat: false,
        strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
    }],
});

const row = features.onSiteHabitatBaselines[0];
row.totalHabitatUnits;                   // number: 0.24691357824691357
row.totalHabitatUnitsDecimal.toString(); // '0.246913578246913578'

const trading = tradingSummaries(features);
const headline = headlineResults(features, trading);
headline.onSiteHabitatBaselineDecimal.toString(); // '0.246913578246913578'
```

## Outputs and compatibility

Every continuous numeric row result has a companion beside its existing number
field, including baseline, retained, enhanced, lost, compensation and delivered
units and spatially adjusted units. The number is projected from the same final
Decimal calculation. Existing labels, booleans and nested objects retain their
meaning. Numeric timing and multiplier fields also have companions; impossible
or unavailable values retain their existing sentinel or `undefined` state.

| Existing output | Exact output |
| --- | --- |
| `row.unitsLost` | `row.unitsLostDecimal` |
| `valuesByHabitat(features)[label].overallUnitChange` | Same value object, `overallUnitChangeDecimal` |
| `valuesByBroadHabitat`, `valuesByHedgerow`, `valuesByWatercourse` | Companions inside each existing value object |
| `trading.habitats.details.medium.cumulativeSurplus` | Same path, `cumulativeSurplusDecimal` |
| `headline.onSiteHabitatNetChange.units` | Same object, `unitsDecimal` |
| `headline.offSiteHabitatNetChangeWithSRM` | `offSiteHabitatNetChangeWithSRMDecimal`, including `N/A` |
| `unitShortfall(...).tierShortfalls.hedgerows.shortfall` | Same object, `shortfallDecimal` |
| Numeric arrays in shortfall details | Matching `...Decimal` arrays, in the same order |
| `calculateOffSiteGainSiteSummary(...)[0].netChange` | Same result, `netChangeDecimal` |

Companion fields are declared directly in object literals and their public types.
There is no generic field generator, proxy, getter or lazy calculation. Timing
lookup tables retain their original labels.

A scalar number cannot have a sibling property. The existing scalar headline
helpers keep their number return values. Append `Decimal` to their names for the
exact return: for example, `calculateOnSiteHabitatBaselineDecimal`,
`calculateOffSiteWatercoursePostInterventionDecimal`, and
`calculateOffSiteHabitatNetChangeWithSRMDecimal`. The latter retains `N/A` when
spatial adjustment is unavailable. `featureShortfallDecimal` and
`a1BalancingShortfallDecimal` provide the exact scalar shortfall results.

`cumulativeBroadHabitatChangeDecimal` returns a Decimal map with exactly the
same keys and topology as `cumulativeBroadHabitatChange`. It does not add
synthetic habitat keys. Grouping value objects, in contrast, expose enumerable
companion fields: code iterating their values must select known number columns
or exclude keys ending in `Decimal`. Internal aggregations use explicit fields;
they do not sum both projections and companions.

Calculators take enriched `AllFeatures`, headline and trading results with their
Decimal companions. `featuresFromInput` and workbook parsers produce those
results; raw number, string and Decimal inputs are converted by the input schemas.

## Arithmetic and input rules

BNG uses its own Decimal.js constructor with **20 significant digits** and
**ROUND_HALF_UP**, isolated from changes to another constructor's `Decimal.set`
configuration. Inputs can contain more digits; they are preserved when accepted
and arithmetic results round to this context. Exact outputs mean Decimal
results within this context, rather than unlimited precision or a promise about
Excel's internal representation. Number inputs retain only the precision that
JavaScript supplied; use decimal strings or Decimal quantities when their
original decimal digits matter.

Decimal recognition uses `Decimal.isDecimal` and guarded conversion checks. Instances from `Decimal.clone()`, other installed copies and
separate bundles are accepted. Strings follow Valibot's decimal validation: signed
plain decimal notation such as `"0.1"`, `".5"` and `"+2"`. Whitespace, scientific
notation, hexadecimal and malformed strings are rejected. Malformed marker
objects, non-numeric objects, `NaN` and either infinity are also rejected. Missing
required measurements produce parse issues; optional retained/enhanced values
keep their documented zero defaults. Gain-site contribution amounts likewise
default only when omitted.

`validate: false` skips workbook business checks while retaining numeric input
validation. `validate: true` reports existing business-rule failures with their
sheet, row index and field paths. This extension preserves the existing
calculation and invalid-row contribution behavior; it does not implement a new
editor evaluator or change workbook contribution gates.

Workbook imports still normalize measurements to **8 decimal places** in
`normalizeNumber`. Manual/runtime quantities are not restricted to 8 places.
Trading uses BNG's Decimal context without another 15-significant-digit operand
normalization. Display rounding remains the application's responsibility.

Net-change `percentage` fields use percentage points, so `10` means 10%.
`totalNetPercentageChange` uses proportions, so `0.1` means 10%.
`netGainTarget` also uses a proportion; unit-summary `target` includes the
baseline, so a 10% target is `1.1`. Their companions use the same units.

## JSON and persistence

Runtime inputs are `number | string | Decimal`, and runtime companions are actual Decimal
objects. Decimal.js `toJSON()` serializes them as strings:

```ts
const saved = JSON.parse(JSON.stringify(row));
// saved.area is a number; saved.areaDecimal is a string.

const area = toDecimal(saved.areaDecimal);
// Supply area, or the validated decimal string, as the input measurement.
```

JSON parsing does not recreate Decimal instances. Input schemas explicitly accept
validated decimal strings and convert measurements to Decimal before calculation.
The exported `toDecimal` helper accepts numbers, decimal strings and Decimal
instances, validates finiteness and returns a Decimal. Numeric year strings keep the
same integer range as other year inputs; `30+` remains a separate sentinel.

Decimal.js JSON strings can use scientific notation, which Valibot's decimal
string rule excludes. For those values, reconstruct an instance with
`new Decimal(saved.areaDecimal)`, or persist `row.areaDecimal.toFixed()` to keep
a plain decimal string suitable for direct input. JSON Schema now describes both
numeric and decimal-string inputs, including non-negative measurement and
bounded integer-year constraints.

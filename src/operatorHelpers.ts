// Small, pure helpers exposed for downstream apps (e.g. operators portal) that
// need to compute Bucket-3 deal-context multipliers without having to drive a
// full row-schema pipeline. Each helper here is a thin façade over data tables
// that already live in this package — no formulas are reinvented.

import { difficulty } from './difficulty';
import { getStrategicSignificance } from './strategicSignificanceSchema';
import { allHabitats } from './habitats';
import { allHedgerows } from './hedgerows';
import { allWatercourses } from './watercourses';
import { watercourseEnhancementTemporalMatrix } from './watercourseEnhancementTemporalMatrix';
import { yearsToTargetCondition } from './watercourseCondition';

export type StandardDifficulty = keyof typeof difficulty;

/**
 * Role the parcel plays in a deal — drives which difficulty / years-to-target
 * table is consulted.
 *
 * - `baseline`: no creation/enhancement happens against this parcel; difficulty
 *   is neutral (1.0).
 * - `creation`: brand-new habitat being created.
 * - `enhancement`: existing habitat being uplifted.
 * - `distinctiveness`: hedgerow/watercourse pathway where uplifting to a more
 *   distinctive sibling habitat — only meaningful for `standardYearsToTarget`.
 */
export type DealRole = 'baseline' | 'creation' | 'enhancement' | 'distinctiveness';

/**
 * Resolve the Bucket-3 difficulty multiplier for a deal.
 *
 * Reuses bng's `difficulty` table (Low 1.0 / Medium 0.67 / High 0.33 /
 * Very High 0.1). The dynamic in-advance downgrade — "if the habitat is
 * created/enhanced in advance of losses AND has reached its target condition
 * by the works-start date, the multiplier drops to Low" — is encoded via the
 * `inAdvance` flag. Callers compute that flag from their deal context.
 *
 * Rules (from operators stock-calculations spec, Bucket 3 difficulty):
 *   - `role === 'baseline'`              → 1.0 (no work happening).
 *   - `standardDifficulty` missing/null  → 1.0 (unknown habitat fallback).
 *   - `inAdvance === true`               → `difficulty.Low` (1.0).
 *   - otherwise                          → `difficulty[standardDifficulty]`.
 *
 * Returns a `number` (never a Decimal) — boundary contract.
 */
export function calculateDifficultyMultiplier(input: {
    role: DealRole;
    standardDifficulty?: StandardDifficulty | null;
    inAdvance?: boolean;
}): number {
    if (input.role === 'baseline') return 1;
    if (!input.standardDifficulty) return 1;
    if (input.inAdvance) return difficulty.Low;
    return difficulty[input.standardDifficulty];
}

/**
 * Strategic significance multiplier from the bng table.
 *
 * Accepts either the canonical description string (as it appears in a metric
 * row, e.g. "Formally identified in local strategy") or the bucketed category
 * (e.g. "Low strategic significance" / "Medium strategic significance" /
 * "High strategic significance"). Anything we can't resolve → 1.0 (the
 * neutral / Low value), so a missing operator submission doesn't punish a
 * deal arithmetically.
 */
export function strategicSignificanceMultiplier(
    value: string | null | undefined,
): number {
    if (!value) return 1;
    // getStrategicSignificance returns undefined when no description match
    // (despite the non-null assertion on its `find` result).
    const byDescription = getStrategicSignificance(
        value as Parameters<typeof getStrategicSignificance>[0],
    ) as { multiplier: number } | undefined;
    if (byDescription) return byDescription.multiplier;
    // Bucketed category match (what we store on rows after enrichment).
    if (value.startsWith('High')) return 1.15;
    if (value.startsWith('Medium')) return 1.1;
    return 1;
}

// --- standardYearsToTarget ----------------------------------------------------

const isNumberOrString = (v: unknown): v is number | string =>
    typeof v === 'number' || typeof v === 'string';

type HabitatLabel = keyof typeof allHabitats;
type HedgerowLabel = keyof typeof allHedgerows;
type WatercourseLabel = keyof typeof allWatercourses;

/**
 * Standard years to reach a target condition for a parcel, as published by
 * bng's per-habitat data tables. This is the *static* lookup — it does not
 * apply the operator's in-advance offset or any dynamic-difficulty branching;
 * the operators portal does those on top.
 *
 * Roles:
 *  - `'creation'`        — current condition is irrelevant; years to grow into
 *    `targetCondition` from nothing.
 *  - `'enhancement'`     — years to move from `currentCondition` to
 *    `targetCondition`. Habitats key on `"current - target"`, hedgerows /
 *    watercourses on `"current to target"`.
 *  - `'distinctiveness'` — for hedgerow/watercourse only: `targetCondition`
 *    is the destination habitat label, not a condition.
 *
 * Returns the raw value from the underlying data table:
 *  - a `number` for a real year count,
 *  - a string sentinel like `"30+"` or `"Not Possible ▲"` where the metric
 *    expresses an out-of-band case,
 *  - `0` only for truly unknown inputs (label not in any family, mis-typed
 *    pathway, or missing required `currentCondition`).
 *
 * Callers that need a temporal multiplier should route the result through
 * {@link lookupTemporalMultiplier}, which understands the string sentinels.
 */
export function standardYearsToTarget(
    habitatLabel: string,
    currentCondition: string | null | undefined,
    targetCondition: string,
    role: 'creation' | 'enhancement' | 'distinctiveness',
): number | string {
    // Try each family in turn — labels are unique across families.
    const habitat = (allHabitats as Record<string, unknown>)[habitatLabel] as
        | (typeof allHabitats)[HabitatLabel]
        | undefined;
    const hedgerow = (allHedgerows as Record<string, unknown>)[habitatLabel] as
        | (typeof allHedgerows)[HedgerowLabel]
        | undefined;
    const watercourse = (allWatercourses as Record<string, unknown>)[habitatLabel] as
        | (typeof allWatercourses)[WatercourseLabel]
        | undefined;

    if (!habitat && !hedgerow && !watercourse) return 0;

    if (role === 'creation') {
        if (habitat) {
            const v = (habitat.temporalMultipliers as Record<string, unknown>)[targetCondition];
            return isNumberOrString(v) ? v : 0;
        }
        if (watercourse) {
            // Watercourse creation times are NOT held per type — DEFRA keys
            // them off the target condition alone, in one shared table. This
            // is the same table `enrichWithCreationWatercourseData`
            // (src/watercourses/shared.ts) drives the full row pipeline from.
            // The per-type `yearsToTargetConditionViaCreation` on the
            // watercourse entries disagrees with it (at Moderate: Priority
            // habitat 8, Ditches 2, Canals 1, vs the metric's 5) and is not
            // what the metric uses.
            const v = (yearsToTargetCondition as Record<string, unknown>)[targetCondition];
            return isNumberOrString(v) ? v : 0;
        }
        const map = hedgerow?.yearsToTargetConditionViaCreation as
            | Record<string, unknown>
            | null
            | undefined;
        if (!map) return 0;
        const v = map[targetCondition];
        return isNumberOrString(v) ? v : 0;
    }

    if (role === 'enhancement') {
        if (!currentCondition) return 0;
        if (habitat) {
            const key = `${currentCondition} - ${targetCondition}`;
            const v = (habitat.enhancementTemporalMultipliers as Record<string, unknown>)[key];
            return isNumberOrString(v) ? v : 0;
        }
        if (watercourse) {
            // Watercourse enhancement times are NOT held per type — DEFRA keys
            // them off the condition pathway alone, in one shared matrix. This
            // is the same table `calculateEnhancementTimeToTarget`
            // (src/watercourses/shared.ts) drives the full row pipeline from.
            const v = watercourseEnhancementTemporalMatrix[
                `${currentCondition} to ${targetCondition}`
            ];
            if (v === undefined || v === 'N/A') return 'Not Possible ▲';
            return v;
        }
        const map = (hedgerow as { yearsToTargetConditionViaEnhancement?: Record<string, unknown> } | undefined)
            ?.yearsToTargetConditionViaEnhancement;
        if (!map) return 0;
        const key = `${currentCondition} to ${targetCondition}`;
        const v = map[key];
        return isNumberOrString(v) ? v : 0;
    }

    // role === 'distinctiveness' — hedgerow/watercourse only; targetCondition
    // is the destination habitat label.
    const distMap =
        (hedgerow as { yearsToTargetConditionViaDistinctiveness?: Record<string, unknown> | null } | undefined)
            ?.yearsToTargetConditionViaDistinctiveness ?? null;
    if (!distMap) return 0;
    const v = distMap[targetCondition];
    return isNumberOrString(v) ? v : 0;
}

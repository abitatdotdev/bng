import { expect, test, describe } from "bun:test";
import { headlineResults } from './headlineResults';
import { type AllFeatures } from './features';
import type { TradingSummaries } from './tradingSummaries';

function emptyFixture(overrides: Partial<AllFeatures> = {}): AllFeatures {
    return {
        onSiteHabitatBaselines: [],
        onSiteHabitatCreations: [],
        onSiteHabitatEnhancements: [],
        offSiteHabitatBaselines: [],
        offSiteHabitatCreations: [],
        offSiteHabitatEnhancements: [],
        onSiteHedgerowBaselines: [],
        onSiteHedgerowCreations: [],
        onSiteHedgerowEnhancements: [],
        offSiteHedgerowBaselines: [],
        offSiteHedgerowCreations: [],
        offSiteHedgerowEnhancements: [],
        onSiteWatercourseBaselines: [],
        onSiteWatercourseCreations: [],
        onSiteWatercourseEnhancements: [],
        offSiteWatercourseBaselines: [],
        offSiteWatercourseCreations: [],
        offSiteWatercourseEnhancements: [],
        ...overrides,
    };
}

function emptyTradingSummary(): TradingSummaries {
    return {
        habitats: { details: {} as any, vHighSatisfied: true, highSatisfied: true, mediumSatisfied: true, lowSatisfied: true },
        hedgerows: { details: {} as any, vHighSatisfied: true, highSatisfied: true, mediumSatisfied: true, lowSatisfied: true, vLowSatisfied: true },
        watercourses: { details: {} as any, vHighSatisfied: true, highSatisfied: true, mediumSatisfied: true, lowSatisfied: true },
    };
}

/**
 * Precision tests for the headline results chain.
 *
 * Context: operators reconstruct a metric by appending synthesised off-site
 * rows whose per-row totals are known to clear the developer's deficit. With
 * the prior `reduce((sum, x) => new Decimal(sum).plus(x).toNumber(), 0)`
 * idiom, every iteration round-tripped through IEEE-754, accumulating ~1e-16
 * of noise per step. Over O(1e3) ops across the chain the residual landed at
 * ~1e-5 AU — small in absolute terms, but on the "still short" side of the
 * unit-deficit clamp, forcing operators to add a 1e-4 AU slack.
 *
 * After the fix, accumulators stay in Decimal until the final `.toNumber()`
 * so the residual must collapse to machine epsilon (≤1e-14).
 */
const TOLERANCE = 1e-14;

function expectNearZero(actual: number, tol: number = TOLERANCE) {
    expect(Math.abs(actual)).toBeLessThanOrEqual(tol);
}

function expectClose(actual: number, expected: number, tol: number = TOLERANCE) {
    expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
}

describe("headlineResults precision", () => {
    test("many small off-site creates summing exactly to the deficit clear it to ≤1e-14", () => {
        // On-site baseline of 10 AU, fully lost (post-intervention = 0).
        // Required = 10 × 1.1 = 11. We need off-site changeWithSRM = 11.
        // 110 creates × 0.1 AU each (with SRM = 1) → exact 11 in Decimal.
        const N = 110;
        const perRow = 0.1;

        const features: AllFeatures = emptyFixture({
            onSiteHabitatBaselines: [
                { totalHabitatUnits: 10, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0 } as any,
            ],
            offSiteHabitatCreations: Array.from({ length: N }, () => ({
                habitatUnitsDelivered: perRow,
                habitatUnitsDeliveredWithSpatialRisk: perRow,
            } as any)),
        });

        const result = headlineResults(features, emptyTradingSummary());

        expectClose(result.offSiteHabitatPostIntervention, 11);
        expectClose(result.offSiteHabitatNetChange.units, 11);
        expect(result.offSiteHabitatNetChangeWithSRM).not.toBe("N/A");
        expectClose(result.offSiteHabitatNetChangeWithSRM as number, 11);

        // The headline reading the operator cares about: deficit cleared, 10% gain met.
        expectNearZero(result.habitatUnitSummary.unitDeficit);
        expectClose(result.totalNetPercentageChange.habitat, 0.1);
    });

    test("mixed-magnitude off-site creates summing exactly to required clear deficit to ≤1e-14", () => {
        // Required for a 10 AU baseline at 10% gain = 11.
        // Hand-picked decomposition: 4.3724 + 3.1276 + 2.5 + 0.5 + 0.5 = 11.
        const contributions = [4.3724, 3.1276, 2.5, 0.5, 0.5];

        const features: AllFeatures = emptyFixture({
            onSiteHabitatBaselines: [
                { totalHabitatUnits: 10, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0 } as any,
            ],
            offSiteHabitatCreations: contributions.map(v => ({
                habitatUnitsDelivered: v,
                habitatUnitsDeliveredWithSpatialRisk: v,
            } as any)),
        });

        const result = headlineResults(features, emptyTradingSummary());

        expectNearZero(result.habitatUnitSummary.unitDeficit);
        expectClose(result.totalNetPercentageChange.habitat, 0.1);
    });

    test("near-miss: a 1e-6 AU shortfall is reported faithfully, not eaten by noise", () => {
        // Same as the clearing case, but with the last row 1e-6 short.
        // The point is precision both ways: residuals we DO see should be real,
        // not chain noise — and chain noise must not mask a real shortfall.
        const N = 110;
        const perRow = 0.1;
        const shortBy = 1e-6;

        const features: AllFeatures = emptyFixture({
            onSiteHabitatBaselines: [
                { totalHabitatUnits: 10, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0 } as any,
            ],
            offSiteHabitatCreations: [
                ...Array.from({ length: N - 1 }, () => ({
                    habitatUnitsDelivered: perRow,
                    habitatUnitsDeliveredWithSpatialRisk: perRow,
                } as any)),
                {
                    habitatUnitsDelivered: perRow - shortBy,
                    habitatUnitsDeliveredWithSpatialRisk: perRow - shortBy,
                } as any,
            ],
        });

        const result = headlineResults(features, emptyTradingSummary());

        expectClose(result.habitatUnitSummary.unitDeficit, shortBy);
    });

    test("baseline × (1 + 0.1) is computed exactly (no 1.1 IEEE noise)", () => {
        // Baseline whose × 1.1 product can drift under float math.
        const features: AllFeatures = emptyFixture({
            onSiteHabitatBaselines: [
                { totalHabitatUnits: 4.3724, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0 } as any,
            ],
        });

        const result = headlineResults(features, emptyTradingSummary());

        // 4.3724 × 1.1 = 4.80964 exactly in decimal
        expectClose(result.habitatUnitSummary.requiredUnits, 4.80964);
    });

    test("with SRM applied, deficit clears exactly when SRM-adjusted units meet required", () => {
        // Baseline 10 → required 11.
        // 22 creates × 1.0 AU gross, each at SRM 0.5 → delivered-with-SRM 0.5 each.
        // Total with SRM = 11.0.
        const N = 22;
        const features: AllFeatures = emptyFixture({
            onSiteHabitatBaselines: [
                { totalHabitatUnits: 10, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0 } as any,
            ],
            offSiteHabitatCreations: Array.from({ length: N }, () => ({
                habitatUnitsDelivered: 1.0,
                habitatUnitsDeliveredWithSpatialRisk: 0.5,
            } as any)),
        });

        const result = headlineResults(features, emptyTradingSummary());

        expectClose(result.offSiteHabitatNetChange.units, 22);
        expect(result.offSiteHabitatNetChangeWithSRM).not.toBe("N/A");
        expectClose(result.offSiteHabitatNetChangeWithSRM as number, 11);
        expectNearZero(result.habitatUnitSummary.unitDeficit);
    });

    test("hedgerow precision mirrors habitat path", () => {
        // Same N×0.1 pattern, applied to the hedgerow chain.
        const N = 110;
        const perRow = 0.1;

        const features: AllFeatures = emptyFixture({
            onSiteHedgerowBaselines: [
                { totalHedgerowUnits: 10, unitsRetained: 0 } as any,
            ],
            offSiteHedgerowCreations: Array.from({ length: N }, () => ({
                hedgerowUnitsDelivered: perRow,
                hedgerowUnitsDeliveredWithSpatialRisk: perRow,
            } as any)),
        });

        const result = headlineResults(features, emptyTradingSummary());

        expectNearZero(result.hedgerowUnitSummary.unitDeficit);
        expectClose(result.totalNetPercentageChange.hedgerow, 0.1);
    });

    test("watercourse precision mirrors habitat path", () => {
        const N = 110;
        const perRow = 0.1;

        const features: AllFeatures = emptyFixture({
            onSiteWatercourseBaselines: [
                { totalWatercourseUnits: 10, unitsRetained: 0, vhdhBespokeCompensationUnits: 0 } as any,
            ],
            offSiteWatercourseCreations: Array.from({ length: N }, () => ({
                unitsDelivered: perRow,
                netUnitChangeWithSpatialRisk: perRow,
            } as any)),
        });

        const result = headlineResults(features, emptyTradingSummary());

        expectNearZero(result.watercourseUnitSummary.unitDeficit);
        expectClose(result.totalNetPercentageChange.watercourse, 0.1);
    });

    test("many-row reduces stay exact: 1000 rows of 0.001 sum to exactly 1", () => {
        // Stress the reducer directly: 1000 rows × 0.001 AU. With a number-typed
        // accumulator this drifts at the 13th decimal; with a Decimal accumulator
        // and a single final toNumber() it lands on 1 exactly.
        const N = 1000;
        const perRow = 0.001;

        const features: AllFeatures = emptyFixture({
            onSiteHabitatBaselines: [
                { totalHabitatUnits: 10, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0 } as any,
            ],
            offSiteHabitatCreations: Array.from({ length: N }, () => ({
                habitatUnitsDelivered: perRow,
                habitatUnitsDeliveredWithSpatialRisk: perRow,
            } as any)),
        });

        const result = headlineResults(features, emptyTradingSummary());

        // 1000 × 0.001 = 1 exactly through Decimal accumulators.
        expectClose(result.offSiteHabitatPostIntervention, 1);
        expectClose(result.offSiteHabitatNetChange.units, 1);
        // Required = 11; on-site post = 0; off-site changeWithSRM = 1.
        // Deficit = 11 - 0 - 1 = 10, exactly.
        expectClose(result.habitatUnitSummary.unitDeficit, 10);
    });
});

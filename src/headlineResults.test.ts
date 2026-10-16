import { Decimal } from "./decimal";
import { featuresFromInput, type BngInput } from "./parsers/featuresFromInput";
import { tradingSummaries } from "./tradingSummaries";
import { expect, test, describe } from "bun:test";
import {
    calculateOnSiteHabitatBaseline,
    calculateOnSiteHabitatPostIntervention,
    calculateOnSiteHabitatNetChange,
    calculateOffSiteHabitatBaseline,
    calculateOffSiteHabitatPostIntervention,
    calculateOffSiteHabitatNetChange,
    calculateOffSiteHabitatNetChangeWithSRM,
    calculateOnSiteHedgerowBaseline,
    calculateOnSiteHedgerowPostIntervention,
    calculateOnSiteHedgerowNetChange,
    calculateOffSiteHedgerowBaseline,
    calculateOffSiteHedgerowPostIntervention,
    calculateOffSiteHedgerowNetChange,
    calculateOffSiteHedgerowNetChangeWithSRM,
    calculateOnSiteWatercourseBaseline,
    calculateOnSiteWatercoursePostIntervention,
    calculateOnSiteWatercourseNetChange,
    calculateOffSiteWatercourseBaseline,
    calculateOffSiteWatercoursePostIntervention,
    calculateOffSiteWatercourseNetChange,
    calculateOffSiteWatercourseNetChangeWithSRM,
    calculateCombinedNetUnitChange,
    calculateTotalSRMDeductions,
    calculateFinalTotalNetUnitChange,
    headlineResults,
} from "./headlineResults";
import { type AllFeatures } from "./features";
import type { TradingSummaries } from "./tradingSummaries";

/**
 * Creates a minimal valid headline results input with all empty arrays
 */
export function emptyFixture(overrides: Partial<AllFeatures> = {}): AllFeatures {
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

export function emptyTradingSummary(): TradingSummaries {
    return {
        habitats: {
            details: {} as any,
            vHighSatisfied: true,
            highSatisfied: true,
            mediumSatisfied: true,
            lowSatisfied: true,
        },
        hedgerows: {
            details: {} as any,
            vHighSatisfied: true,
            highSatisfied: true,
            mediumSatisfied: true,
            lowSatisfied: true,
            vLowSatisfied: true,
        },
        watercourses: {
            details: {} as any,
            vHighSatisfied: true,
            highSatisfied: true,
            mediumSatisfied: true,
            lowSatisfied: true,
        },
    };
}

describe("headline aggregate availability", () => {
    test("D-1 overrun retains baseline SUM values and propagates gated post totals", () => {
        const { features, issues } = featuresFromInput({
            offSiteHabitatBaselines: [{
                broadHabitat: 'Grassland',
                habitatType: 'Other neutral grassland',
                area: 1,
                strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
                condition: 'Moderate',
                irreplaceableHabitat: false,
                spatialRiskCategory: 'Compensation outside LPA or NCA of impact site and neighbouring LPA or NCA',
                areaRetained: 1.1,
                areaEnhanced: 0,
                offSiteReferenceNumber: 'OFF-001',
            }],
        }, { validate: false });

        const result = headlineResults(features, emptyTradingSummary());

        expect(issues).toEqual([]);
        expect(result.offSiteHabitatBaseline).toBe(8);
        expect(result.aggregateAvailability.inputTotals['D-1']!.totalHabitatUnits!.value).toBe(8);
        expect(result.aggregateAvailability.inputTotals['D-1']!.totalHabitatUnitsSRM!.value).toBe(4);
        expect(result.aggregateAvailability.inputTotals['D-1']!.baselineUnitsRetained!.available).toBe(false);
        expect(result.aggregateAvailability.inputTotals['D-1']!.baselineUnitsEnhanced!.available).toBe(false);
        expect(result.aggregateAvailability.headline.baseline.offSite.habitat).toBe(true);
        expect(result.aggregateAvailability.headline.postIntervention.offSite.habitat).toBe(false);
        expect(result.ratioAvailability.offSite.habitat).toBe('check-data');
        expect(result.ratioAvailability.totalNet.habitat).toBe('check-data');
        expect(result.targetStatuses.totalNetGain.habitat).toBe('check-data');
    });

    test("includes bespoke watercourse compensation when deciding whether spatial totals feed final net", () => {
        const input = emptyFixture({
            offSiteWatercourseBaselines: [{
                totalWatercourseUnits: 1,
                totalWatercourseUnitsDecimal: new Decimal(1),
                totalWatercourseUnitsSRM: 1,
                totalWatercourseUnitsSRMDecimal: new Decimal(1),
                unitsRetained: 0,
                unitsRetainedDecimal: new Decimal(0),
                unitsRetainedWithSRM: 0,
                unitsRetainedWithSRMDecimal: new Decimal(0),
                vhdhBespokeCompensationUnits: 2,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(2),
                spatialRiskMultiplier: 1,
                spatialRiskMultiplierDecimal: new Decimal(1),
                watercourseBaselineAvailability: { unavailableResults: { unitsRetainedWithSRM: 'check-data' } },
            } as never],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.aggregateAvailability.inputTotals['F-1']!.vhdhBespokeCompensationUnits!.value).toBe(2);
        expect(result.aggregateAvailability.headline.postInterventionWithSpatialRisk.offSite.watercourse).toBe(false);
        expect(result.aggregateAvailability.headline.finalNet.watercourse).toBe(false);
        expect(result.ratioAvailability.totalNet.watercourse).toBe('check-data');
    });

    test("does not exempt an unavailable zero-candidate total", () => {
        const input = emptyFixture({
            onSiteWatercourseBaselines: [{
                totalWatercourseUnits: 0,
                totalWatercourseUnitsDecimal: new Decimal(0),
                unitsRetained: 0,
                unitsRetainedDecimal: new Decimal(0),
                vhdhBespokeCompensationUnits: 0,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                watercourseBaselineAvailability: { retainedExceedsLength: true, unavailableResults: { unitsRetained: 'check-data' } },
            } as never],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.ratioAvailability.onSite.watercourse).toBe('check-data');
        expect(result.targetStatuses.onSiteNetGain.watercourse).toBe('check-data');
    });

    test("retained-length errors reach post-intervention ratios and targets while keeping numeric candidates", () => {
        const input = emptyFixture({
            onSiteWatercourseBaselines: [{
                totalWatercourseUnits: 10,
                totalWatercourseUnitsDecimal: new Decimal(10),
                unitsRetained: 4,
                unitsRetainedDecimal: new Decimal(4),
                vhdhBespokeCompensationUnits: 0,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                watercourseBaselineAvailability: { retainedExceedsLength: true, unavailableResults: { unitsRetained: 'check-data' } },
            } as never],
            offSiteWatercourseBaselines: [{
                totalWatercourseUnits: 10,
                totalWatercourseUnitsDecimal: new Decimal(10),
                unitsRetained: 5,
                unitsRetainedDecimal: new Decimal(5),
                vhdhBespokeCompensationUnits: 0,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                spatialRiskMultiplier: 1,
                spatialRiskMultiplierDecimal: new Decimal(1),
                watercourseBaselineAvailability: { retainedExceedsLength: true, unavailableResults: { unitsRetained: 'check-data' } },
            } as never],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.aggregateAvailability.inputTotals['C-1']!.unitsRetained!.value).toBe(4);
        expect(result.aggregateAvailability.inputTotals['C-1']!.unitsRetained!.available).toBe(false);
        expect(result.aggregateAvailability.inputTotals['F-1']!.unitsRetained!.value).toBe(5);
        expect(result.aggregateAvailability.inputTotals['F-1']!.unitsRetained!.available).toBe(false);
        expect(result.ratioAvailability.onSite.watercourse).toBe('check-data');
        expect(result.ratioAvailability.totalNet.watercourse).toBe('check-data');
        expect(result.targetStatuses.onSiteNetGain.watercourse).toBe('check-data');
        expect(result.targetStatuses.totalNetGain.watercourse).toBe('check-data');
    });
});

describe("calculateOnSiteHabitatBaseline", () => {
    test("returns 0 for empty array", () => {
        const result = calculateOnSiteHabitatBaseline([]);
        expect(result).toBe(0);
    });

    test("sums totalHabitatUnits from single baseline", () => {
        const baselines = [{ totalHabitatUnits: 10, totalHabitatUnitsDecimal: new Decimal(10) } as any];
        const result = calculateOnSiteHabitatBaseline(baselines);
        expect(result).toBe(10);
    });

    test("sums totalHabitatUnits from multiple baselines", () => {
        const baselines = [
            { totalHabitatUnits: 10, totalHabitatUnitsDecimal: new Decimal(10) } as any,
            { totalHabitatUnits: 20.5, totalHabitatUnitsDecimal: new Decimal(20.5) } as any,
            { totalHabitatUnits: 15.25, totalHabitatUnitsDecimal: new Decimal(15.25) } as any,
        ];
        const result = calculateOnSiteHabitatBaseline(baselines);
        expect(result).toBe(45.75);
    });
});

describe("calculateOnSiteHabitatPostIntervention", () => {
    test("returns 0 for all empty arrays", () => {
        const result = calculateOnSiteHabitatPostIntervention([], [], []);
        expect(result).toBe(0);
    });

    test("sums retained and bespoke compensation units from baselines only", () => {
        const baselines = [
            {
                baselineUnitsRetained: 10,
                baselineUnitsRetainedDecimal: new Decimal(10),
                vhdhBespokeCompensationUnits: 5,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(5),
            } as any,
            {
                baselineUnitsRetained: 8,
                baselineUnitsRetainedDecimal: new Decimal(8),
                vhdhBespokeCompensationUnits: 3,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(3),
            } as any,
        ];
        const result = calculateOnSiteHabitatPostIntervention(baselines, [], []);
        expect(result).toBe(26);
    });

    test("sums created units only", () => {
        const creations = [
            { habitatUnitsDelivered: 15, habitatUnitsDeliveredDecimal: new Decimal(15) } as any,
            { habitatUnitsDelivered: 20, habitatUnitsDeliveredDecimal: new Decimal(20) } as any,
        ];
        const result = calculateOnSiteHabitatPostIntervention([], creations, []);
        expect(result).toBe(35);
    });

    test("sums enhanced units only", () => {
        const enhancements = [
            { habitatUnitsDelivered: 12, habitatUnitsDeliveredDecimal: new Decimal(12) } as any,
            { habitatUnitsDelivered: 18, habitatUnitsDeliveredDecimal: new Decimal(18) } as any,
        ];
        const result = calculateOnSiteHabitatPostIntervention([], [], enhancements);
        expect(result).toBe(30);
    });

    test("sums all units from baselines, creations, and enhancements", () => {
        const baselines = [
            {
                baselineUnitsRetained: 10,
                baselineUnitsRetainedDecimal: new Decimal(10),
                vhdhBespokeCompensationUnits: 5,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(5),
            } as any,
        ];
        const creations = [
            { habitatUnitsDelivered: 20, habitatUnitsDeliveredDecimal: new Decimal(20) } as any,
        ];
        const enhancements = [
            { habitatUnitsDelivered: 15, habitatUnitsDeliveredDecimal: new Decimal(15) } as any,
        ];
        const result = calculateOnSiteHabitatPostIntervention(baselines, creations, enhancements);
        expect(result).toBe(50);
    });
});

describe("calculateOnSiteHabitatNetChange", () => {
    test("calculates positive net change", () => {
        const result = calculateOnSiteHabitatNetChange(100, 150);
        expect(result.units).toBe(50);
        expect(result.percentage).toBe(50);
    });

    test("calculates negative net change", () => {
        const result = calculateOnSiteHabitatNetChange(100, 80);
        expect(result.units).toBe(-20);
        expect(result.percentage).toBe(-20);
    });

    test("calculates zero net change", () => {
        const result = calculateOnSiteHabitatNetChange(100, 100);
        expect(result.units).toBe(0);
        expect(result.percentage).toBe(0);
    });

    test("handles zero baseline without division by zero", () => {
        const result = calculateOnSiteHabitatNetChange(0, 50);
        expect(result.units).toBe(50);
        expect(result.percentage).toBe(0);
    });

    test("calculates percentage correctly with decimals", () => {
        const result = calculateOnSiteHabitatNetChange(80, 100);
        expect(result.units).toBe(20);
        expect(result.percentage).toBe(25);
    });
});

describe("calculateOffSiteHabitatBaseline", () => {
    test("returns 0 for empty array", () => {
        const result = calculateOffSiteHabitatBaseline([]);
        expect(result).toBe(0);
    });

    test("sums totalHabitatUnits from single baseline", () => {
        const baselines = [{ totalHabitatUnits: 25, totalHabitatUnitsDecimal: new Decimal(25) } as any];
        const result = calculateOffSiteHabitatBaseline(baselines);
        expect(result).toBe(25);
    });

    test("sums totalHabitatUnits from multiple baselines", () => {
        const baselines = [
            { totalHabitatUnits: 15, totalHabitatUnitsDecimal: new Decimal(15) } as any,
            { totalHabitatUnits: 30.5, totalHabitatUnitsDecimal: new Decimal(30.5) } as any,
            { totalHabitatUnits: 10.25, totalHabitatUnitsDecimal: new Decimal(10.25) } as any,
        ];
        const result = calculateOffSiteHabitatBaseline(baselines);
        expect(result).toBe(55.75);
    });
});

describe("calculateOffSiteHabitatPostIntervention", () => {
    test("returns 0 for all empty arrays", () => {
        const result = calculateOffSiteHabitatPostIntervention([], [], []);
        expect(result).toBe(0);
    });

    test("sums retained and bespoke compensation units from baselines only", () => {
        const baselines = [
            {
                baselineUnitsRetained: 12,
                baselineUnitsRetainedDecimal: new Decimal(12),
                vhdhBespokeCompensationUnits: 6,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(6),
            } as any,
            {
                baselineUnitsRetained: 9,
                baselineUnitsRetainedDecimal: new Decimal(9),
                vhdhBespokeCompensationUnits: 4,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(4),
            } as any,
        ];
        const result = calculateOffSiteHabitatPostIntervention(baselines, [], []);
        expect(result).toBe(31);
    });

    test("sums all units from baselines, creations, and enhancements", () => {
        const baselines = [
            {
                baselineUnitsRetained: 15,
                baselineUnitsRetainedDecimal: new Decimal(15),
                vhdhBespokeCompensationUnits: 8,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(8),
            } as any,
        ];
        const creations = [
            { habitatUnitsDelivered: 25, habitatUnitsDeliveredDecimal: new Decimal(25) } as any,
        ];
        const enhancements = [
            { habitatUnitsDelivered: 18, habitatUnitsDeliveredDecimal: new Decimal(18) } as any,
        ];
        const result = calculateOffSiteHabitatPostIntervention(baselines, creations, enhancements);
        expect(result).toBe(66);
    });
});

describe("calculateOffSiteHabitatNetChange", () => {
    test("calculates positive net change", () => {
        const result = calculateOffSiteHabitatNetChange(80, 120);
        expect(result.units).toBe(40);
        expect(result.percentage).toBe(50);
    });

    test("calculates negative net change", () => {
        const result = calculateOffSiteHabitatNetChange(100, 70);
        expect(result.units).toBe(-30);
        expect(result.percentage).toBe(-30);
    });

    test("handles zero baseline without division by zero", () => {
        const result = calculateOffSiteHabitatNetChange(0, 40);
        expect(result.units).toBe(40);
        expect(result.percentage).toBe(0);
    });
});

describe("calculateOffSiteHabitatNetChangeWithSRM", () => {
    test("returns N/A when net change is negative", () => {
        const baselines = [
            {
                totalHabitatUnitsSRM: 50,
                totalHabitatUnitsSRMDecimal: new Decimal(50),
                baselineUnitsRetained: 0,
                baselineUnitsRetainedDecimal: new Decimal(0),
                baselineUnitsEnhanced: 0,
                baselineUnitsEnhancedDecimal: new Decimal(0),
                spatialRiskMultiplier: 0.5,
                spatialRiskMultiplierDecimal: new Decimal(0.5),
            } as any,
        ];
        const result = calculateOffSiteHabitatNetChangeWithSRM(baselines, [], [], -10);
        expect(result).toBe("N/A");
    });

    test("returns N/A when net change is zero", () => {
        const baselines = [
            {
                totalHabitatUnitsSRM: 50,
                totalHabitatUnitsSRMDecimal: new Decimal(50),
                baselineUnitsRetained: 0,
                baselineUnitsRetainedDecimal: new Decimal(0),
                baselineUnitsEnhanced: 0,
                baselineUnitsEnhancedDecimal: new Decimal(0),
                spatialRiskMultiplier: 0.5,
                spatialRiskMultiplierDecimal: new Decimal(0.5),
            } as any,
        ];
        const result = calculateOffSiteHabitatNetChangeWithSRM(baselines, [], [], 0);
        expect(result).toBe("N/A");
    });

    test("calculates SRM-adjusted net change for positive gains", () => {
        // Formula: baselineUnitsRetainedWithSRM = (areaRetained * D * C * S * SRM) + (vhdhBespokeCompensationUnits * SRM)
        // Example: areaRetained=10, D=6, C=2, S=1.15, SRM=0.5, vhdhBespokeCompensationUnits=10
        // = (10 * 6 * 2 * 1.15 * 0.5) + (10 * 0.5) = 69 + 5 = 74
        const baselines = [
            {
                totalHabitatUnitsSRM: 50,
                totalHabitatUnitsSRMDecimal: new Decimal(50),
                areaRetained: 10,
                areaRetainedDecimal: new Decimal(10),
                distinctivenessScore: 6,
                distinctivenessScoreDecimal: new Decimal(6),
                conditionScore: 2,
                conditionScoreDecimal: new Decimal(2),
                strategicSignificanceMultiplier: 1.15,
                strategicSignificanceMultiplierDecimal: new Decimal(1.15),
                vhdhBespokeCompensationUnits: 10,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(10),
                baselineUnitsRetainedWithSRM: 74,
                baselineUnitsRetainedWithSRMDecimal: new Decimal(74),
                spatialRiskMultiplier: 0.5,
                spatialRiskMultiplierDecimal: new Decimal(0.5),
            } as any,
        ];
        const creations = [
            {
                habitatUnitsDeliveredWithSpatialRisk: 30,
                habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(30),
            } as any,
        ];
        const enhancements = [
            {
                habitatUnitsDeliveredWithSpatialRisk: 20,
                habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(20),
            } as any,
        ];

        // Post-intervention WITH SRM = 74 + 30 + 20 = 124
        // Net change WITH SRM = 124 - 50 = 74
        const result = calculateOffSiteHabitatNetChangeWithSRM(baselines, creations, enhancements, 10);
        expect(result).toBe(74);
    });

    test("handles multiple baselines with different SRM values", () => {
        // First baseline: areaRetained=5, D=4, C=1.5, S=1, SRM=0.6, vhdhBespokeCompensationUnits=10
        // = (5 * 4 * 1.5 * 1 * 0.6) + (10 * 0.6) = 18 + 6 = 24
        // Second baseline: areaRetained=4, D=3, C=2, S=1, SRM=0.8, vhdhBespokeCompensationUnits=5
        // = (4 * 3 * 2 * 1 * 0.8) + (5 * 0.8) = 19.2 + 4 = 23.2
        const baselines = [
            {
                totalHabitatUnitsSRM: 30,
                totalHabitatUnitsSRMDecimal: new Decimal(30),
                areaRetained: 5,
                areaRetainedDecimal: new Decimal(5),
                distinctivenessScore: 4,
                distinctivenessScoreDecimal: new Decimal(4),
                conditionScore: 1.5,
                conditionScoreDecimal: new Decimal(1.5),
                strategicSignificanceMultiplier: 1,
                strategicSignificanceMultiplierDecimal: new Decimal(1),
                vhdhBespokeCompensationUnits: 10,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(10),
                baselineUnitsRetainedWithSRM: 24,
                baselineUnitsRetainedWithSRMDecimal: new Decimal(24),
                spatialRiskMultiplier: 0.6,
                spatialRiskMultiplierDecimal: new Decimal(0.6),
            } as any,
            {
                totalHabitatUnitsSRM: 20,
                totalHabitatUnitsSRMDecimal: new Decimal(20),
                areaRetained: 4,
                areaRetainedDecimal: new Decimal(4),
                distinctivenessScore: 3,
                distinctivenessScoreDecimal: new Decimal(3),
                conditionScore: 2,
                conditionScoreDecimal: new Decimal(2),
                strategicSignificanceMultiplier: 1,
                strategicSignificanceMultiplierDecimal: new Decimal(1),
                vhdhBespokeCompensationUnits: 5,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(5),
                baselineUnitsRetainedWithSRM: 23.2,
                baselineUnitsRetainedWithSRMDecimal: new Decimal(23.2),
                spatialRiskMultiplier: 0.8,
                spatialRiskMultiplierDecimal: new Decimal(0.8),
            } as any,
        ];

        // Post-intervention WITH SRM = 24 + 23.2 = 47.2
        // Net change WITH SRM = 47.2 - (30 + 20) = 47.2 - 50 = -2.8
        const result = calculateOffSiteHabitatNetChangeWithSRM(baselines, [], [], 10);
        expect(result).toBeCloseTo(-2.8, 1);
    });

    test("handles zero baseline WITH SRM without division by zero", () => {
        const baselines = [
            {
                totalHabitatUnitsSRM: 0,
                totalHabitatUnitsSRMDecimal: new Decimal(0),
                areaRetained: 0,
                areaRetainedDecimal: new Decimal(0),
                distinctivenessScore: 6,
                distinctivenessScoreDecimal: new Decimal(6),
                conditionScore: 2,
                conditionScoreDecimal: new Decimal(2),
                strategicSignificanceMultiplier: 1.15,
                strategicSignificanceMultiplierDecimal: new Decimal(1.15),
                vhdhBespokeCompensationUnits: 0,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                baselineUnitsRetainedWithSRM: 0,
                baselineUnitsRetainedWithSRMDecimal: new Decimal(0),
                spatialRiskMultiplier: 0.5,
                spatialRiskMultiplierDecimal: new Decimal(0.5),
            } as any,
        ];
        const creations = [
            {
                habitatUnitsDeliveredWithSpatialRisk: 20,
                habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(20),
            } as any,
        ];

        const result = calculateOffSiteHabitatNetChangeWithSRM(baselines, creations, [], 40);
        expect(result).toBe(20);
    });
});

describe("headlineResults", () => {
    test("calculates on-site habitat results with empty arrays", () => {
        const input = emptyFixture();
        const result = headlineResults(input, emptyTradingSummary());

        expect(result.onSiteHabitatBaseline).toBe(0);
        expect(result.onSiteHabitatPostIntervention).toBe(0);
        expect(result.onSiteHabitatNetChange.units).toBe(0);
        expect(result.onSiteHabitatNetChange.percentage).toBe(0);
    });

    test("calculates on-site habitat results with data", () => {
        const input = emptyFixture({
            onSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 100,
                    totalHabitatUnitsDecimal: new Decimal(100),
                    baselineUnitsRetained: 60,
                    baselineUnitsRetainedDecimal: new Decimal(60),
                    vhdhBespokeCompensationUnits: 20,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(20),
                } as any,
            ],
            onSiteHabitatCreations: [
                { habitatUnitsDelivered: 30, habitatUnitsDeliveredDecimal: new Decimal(30) } as any,
            ],
            onSiteHabitatEnhancements: [
                { habitatUnitsDelivered: 10, habitatUnitsDeliveredDecimal: new Decimal(10) } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.onSiteHabitatBaseline).toBe(100);
        expect(result.onSiteHabitatPostIntervention).toBe(120); // 60 + 20 + 30 + 10
        expect(result.onSiteHabitatNetChange.units).toBe(20);
        expect(result.onSiteHabitatNetChange.percentage).toBe(20);
    });

    test("calculates off-site habitat results with empty arrays", () => {
        const input = emptyFixture();
        const result = headlineResults(input, emptyTradingSummary());

        expect(result.offSiteHabitatBaseline).toBe(0);
        expect(result.offSiteHabitatPostIntervention).toBe(0);
        expect(result.offSiteHabitatNetChange.units).toBe(0);
        expect(result.offSiteHabitatNetChange.percentage).toBe(0);
        expect(result.offSiteHabitatNetChangeWithSRM).toBe("N/A");
    });

    test("calculates off-site habitat results with data", () => {
        // Formula: baselineUnitsRetainedWithSRM = (areaRetained * D * C * S * SRM) + (vhdhBespokeCompensationUnits * SRM)
        // Example: areaRetained=8, D=4, C=2, S=1, SRM=0.5, vhdhBespokeCompensationUnits=10
        // = (8 * 4 * 2 * 1 * 0.5) + (10 * 0.5) = 32 + 5 = 37
        const input = emptyFixture({
            offSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 80,
                    totalHabitatUnitsDecimal: new Decimal(80),
                    totalHabitatUnitsSRM: 40,
                    totalHabitatUnitsSRMDecimal: new Decimal(40),
                    baselineUnitsRetained: 50,
                    baselineUnitsRetainedDecimal: new Decimal(50),
                    baselineUnitsEnhanced: 10,
                    baselineUnitsEnhancedDecimal: new Decimal(10),
                    areaRetained: 8,
                    areaRetainedDecimal: new Decimal(8),
                    distinctivenessScore: 4,
                    distinctivenessScoreDecimal: new Decimal(4),
                    conditionScore: 2,
                    conditionScoreDecimal: new Decimal(2),
                    strategicSignificanceMultiplier: 1,
                    strategicSignificanceMultiplierDecimal: new Decimal(1),
                    vhdhBespokeCompensationUnits: 10,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(10),
                    baselineUnitsRetainedWithSRM: 37,
                    baselineUnitsRetainedWithSRMDecimal: new Decimal(37),
                    spatialRiskMultiplier: 0.5,
                    spatialRiskMultiplierDecimal: new Decimal(0.5),
                } as any,
            ],
            offSiteHabitatCreations: [
                {
                    habitatUnitsDelivered: 30,
                    habitatUnitsDeliveredDecimal: new Decimal(30),
                    habitatUnitsDeliveredWithSpatialRisk: 15,
                    habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(15),
                } as any,
            ],
            offSiteHabitatEnhancements: [
                {
                    habitatUnitsDelivered: 20,
                    habitatUnitsDeliveredDecimal: new Decimal(20),
                    habitatUnitsDeliveredWithSpatialRisk: 10,
                    habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(10),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.offSiteHabitatBaseline).toBe(80);
        expect(result.offSiteHabitatPostIntervention).toBe(110); // 50 + 10 + 30 + 20
        expect(result.offSiteHabitatNetChange.units).toBe(30);
        expect(result.offSiteHabitatNetChange.percentage).toBe(37.5); // 30/80 * 100

        // WITH SRM: baseline = 40, post = 37 + 15 + 10 = 62
        // Net change = 62 - 40 = 22
        expect(result.offSiteHabitatNetChangeWithSRM).toBe(22);
    });

    test("SRM not applied when off-site net change is negative", () => {
        const input = emptyFixture({
            offSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 100,
                    totalHabitatUnitsDecimal: new Decimal(100),
                    totalHabitatUnitsSRM: 50,
                    totalHabitatUnitsSRMDecimal: new Decimal(50),
                    baselineUnitsRetained: 30,
                    baselineUnitsRetainedDecimal: new Decimal(30),
                    baselineUnitsEnhanced: 0,
                    baselineUnitsEnhancedDecimal: new Decimal(0),
                    areaRetained: 5,
                    areaRetainedDecimal: new Decimal(5),
                    distinctivenessScore: 4,
                    distinctivenessScoreDecimal: new Decimal(4),
                    conditionScore: 2,
                    conditionScoreDecimal: new Decimal(2),
                    strategicSignificanceMultiplier: 1,
                    strategicSignificanceMultiplierDecimal: new Decimal(1),
                    vhdhBespokeCompensationUnits: 0,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                    baselineUnitsRetainedWithSRM: 20,
                    baselineUnitsRetainedWithSRMDecimal: new Decimal(20), // (5 * 4 * 2 * 1 * 0.5) + (0 * 0.5) = 20
                    spatialRiskMultiplier: 0.5,
                    spatialRiskMultiplierDecimal: new Decimal(0.5),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.offSiteHabitatBaseline).toBe(100);
        expect(result.offSiteHabitatPostIntervention).toBe(30); // Only retained
        expect(result.offSiteHabitatNetChange.units).toBe(-70); // Negative
        expect(result.offSiteHabitatNetChangeWithSRM).toBe("N/A");
    });
});

describe("calculateOnSiteHedgerowBaseline", () => {
    test("returns 0 for empty array", () => {
        const result = calculateOnSiteHedgerowBaseline([]);
        expect(result).toBe(0);
    });

    test("sums totalHedgerowUnits from single baseline", () => {
        const baselines = [{ totalHedgerowUnits: 15, totalHedgerowUnitsDecimal: new Decimal(15) } as any];
        const result = calculateOnSiteHedgerowBaseline(baselines);
        expect(result).toBe(15);
    });

    test("sums totalHedgerowUnits from multiple baselines", () => {
        const baselines = [
            { totalHedgerowUnits: 12.5, totalHedgerowUnitsDecimal: new Decimal(12.5) } as any,
            { totalHedgerowUnits: 18.75, totalHedgerowUnitsDecimal: new Decimal(18.75) } as any,
            { totalHedgerowUnits: 9.25, totalHedgerowUnitsDecimal: new Decimal(9.25) } as any,
        ];
        const result = calculateOnSiteHedgerowBaseline(baselines);
        expect(result).toBe(40.5);
    });
});

describe("calculateOnSiteHedgerowPostIntervention", () => {
    test("returns 0 for all empty arrays", () => {
        const result = calculateOnSiteHedgerowPostIntervention([], [], []);
        expect(result).toBe(0);
    });

    test("sums retained units from baselines only", () => {
        const baselines = [
            { unitsRetained: 8, unitsRetainedDecimal: new Decimal(8) } as any,
            { unitsRetained: 6, unitsRetainedDecimal: new Decimal(6) } as any,
        ];
        const result = calculateOnSiteHedgerowPostIntervention(baselines, [], []);
        expect(result).toBe(14);
    });

    test("sums created units only", () => {
        const creations = [
            { hedgerowUnitsDelivered: 12, hedgerowUnitsDeliveredDecimal: new Decimal(12) } as any,
            { hedgerowUnitsDelivered: 16, hedgerowUnitsDeliveredDecimal: new Decimal(16) } as any,
        ];
        const result = calculateOnSiteHedgerowPostIntervention([], creations, []);
        expect(result).toBe(28);
    });

    test("sums enhanced units only", () => {
        const enhancements = [
            { hedgerowUnitsDelivered: 10, hedgerowUnitsDeliveredDecimal: new Decimal(10) } as any,
            { hedgerowUnitsDelivered: 14, hedgerowUnitsDeliveredDecimal: new Decimal(14) } as any,
        ];
        const result = calculateOnSiteHedgerowPostIntervention([], [], enhancements);
        expect(result).toBe(24);
    });

    test("sums all units from baselines, creations, and enhancements", () => {
        const baselines = [{ unitsRetained: 8, unitsRetainedDecimal: new Decimal(8) } as any];
        const creations = [
            { hedgerowUnitsDelivered: 15, hedgerowUnitsDeliveredDecimal: new Decimal(15) } as any,
        ];
        const enhancements = [
            { hedgerowUnitsDelivered: 12, hedgerowUnitsDeliveredDecimal: new Decimal(12) } as any,
        ];
        const result = calculateOnSiteHedgerowPostIntervention(baselines, creations, enhancements);
        expect(result).toBe(35);
    });
});

describe("calculateOnSiteHedgerowNetChange", () => {
    test("calculates positive net change", () => {
        const result = calculateOnSiteHedgerowNetChange(50, 75);
        expect(result.units).toBe(25);
        expect(result.percentage).toBe(50);
    });

    test("calculates negative net change", () => {
        const result = calculateOnSiteHedgerowNetChange(60, 45);
        expect(result.units).toBe(-15);
        expect(result.percentage).toBe(-25);
    });

    test("calculates zero net change", () => {
        const result = calculateOnSiteHedgerowNetChange(40, 40);
        expect(result.units).toBe(0);
        expect(result.percentage).toBe(0);
    });

    test("handles zero baseline without division by zero", () => {
        const result = calculateOnSiteHedgerowNetChange(0, 30);
        expect(result.units).toBe(30);
        expect(result.percentage).toBe(0);
    });

    test("calculates percentage correctly with decimals", () => {
        const result = calculateOnSiteHedgerowNetChange(40, 50);
        expect(result.units).toBe(10);
        expect(result.percentage).toBe(25);
    });
});

describe("headlineResults - on-site hedgerows", () => {
    test("calculates on-site hedgerow results with empty arrays", () => {
        const input = emptyFixture();
        const result = headlineResults(input, emptyTradingSummary());

        expect(result.onSiteHedgerowBaseline).toBe(0);
        expect(result.onSiteHedgerowPostIntervention).toBe(0);
        expect(result.onSiteHedgerowNetChange.units).toBe(0);
        expect(result.onSiteHedgerowNetChange.percentage).toBe(0);
    });

    test("calculates on-site hedgerow results with data", () => {
        const input = emptyFixture({
            onSiteHedgerowBaselines: [
                {
                    totalHedgerowUnits: 60,
                    totalHedgerowUnitsDecimal: new Decimal(60),
                    unitsRetained: 40,
                    unitsRetainedDecimal: new Decimal(40),
                } as any,
            ],
            onSiteHedgerowCreations: [
                { hedgerowUnitsDelivered: 20, hedgerowUnitsDeliveredDecimal: new Decimal(20) } as any,
            ],
            onSiteHedgerowEnhancements: [
                { hedgerowUnitsDelivered: 8, hedgerowUnitsDeliveredDecimal: new Decimal(8) } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.onSiteHedgerowBaseline).toBe(60);
        expect(result.onSiteHedgerowPostIntervention).toBe(68); // 40 + 20 + 8
        expect(result.onSiteHedgerowNetChange.units).toBe(8);
        expect(result.onSiteHedgerowNetChange.percentage).toBeCloseTo(13.33, 1);
    });

    test("calculates with multiple hedgerow entries", () => {
        const input = emptyFixture({
            onSiteHedgerowBaselines: [
                {
                    totalHedgerowUnits: 30,
                    totalHedgerowUnitsDecimal: new Decimal(30),
                    unitsRetained: 20,
                    unitsRetainedDecimal: new Decimal(20),
                } as any,
                {
                    totalHedgerowUnits: 25,
                    totalHedgerowUnitsDecimal: new Decimal(25),
                    unitsRetained: 15,
                    unitsRetainedDecimal: new Decimal(15),
                } as any,
            ],
            onSiteHedgerowCreations: [
                { hedgerowUnitsDelivered: 12, hedgerowUnitsDeliveredDecimal: new Decimal(12) } as any,
                { hedgerowUnitsDelivered: 8, hedgerowUnitsDeliveredDecimal: new Decimal(8) } as any,
            ],
            onSiteHedgerowEnhancements: [
                { hedgerowUnitsDelivered: 6, hedgerowUnitsDeliveredDecimal: new Decimal(6) } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.onSiteHedgerowBaseline).toBe(55); // 30 + 25
        expect(result.onSiteHedgerowPostIntervention).toBe(61); // 20 + 15 + 12+8 + 6
        expect(result.onSiteHedgerowNetChange.units).toBe(6);
        expect(result.onSiteHedgerowNetChange.percentage).toBeCloseTo(10.909);
    });
});

describe("calculateOffSiteHedgerowBaseline", () => {
    test("returns 0 for empty array", () => {
        const result = calculateOffSiteHedgerowBaseline([]);
        expect(result).toBe(0);
    });

    test("sums totalHedgerowUnits from single baseline", () => {
        const baselines = [{ totalHedgerowUnits: 20, totalHedgerowUnitsDecimal: new Decimal(20) } as any];
        const result = calculateOffSiteHedgerowBaseline(baselines);
        expect(result).toBe(20);
    });

    test("sums totalHedgerowUnits from multiple baselines", () => {
        const baselines = [
            { totalHedgerowUnits: 14.5, totalHedgerowUnitsDecimal: new Decimal(14.5) } as any,
            { totalHedgerowUnits: 22.75, totalHedgerowUnitsDecimal: new Decimal(22.75) } as any,
            { totalHedgerowUnits: 8.25, totalHedgerowUnitsDecimal: new Decimal(8.25) } as any,
        ];
        const result = calculateOffSiteHedgerowBaseline(baselines);
        expect(result).toBe(45.5);
    });
});

describe("calculateOffSiteHedgerowPostIntervention", () => {
    test("returns 0 for all empty arrays", () => {
        const result = calculateOffSiteHedgerowPostIntervention([], [], []);
        expect(result).toBe(0);
    });

    test("sums retained units from baselines only (not enhanced)", () => {
        const baselines = [
            {
                unitsRetained: 10,
                unitsRetainedDecimal: new Decimal(10),
                unitsEnhanced: 5,
                unitsEnhancedDecimal: new Decimal(5),
            } as any,
            {
                unitsRetained: 8,
                unitsRetainedDecimal: new Decimal(8),
                unitsEnhanced: 3,
                unitsEnhancedDecimal: new Decimal(3),
            } as any,
        ];
        const result = calculateOffSiteHedgerowPostIntervention(baselines, [], []);
        expect(result).toBe(18); // 10 + 8 (enhanced not counted here)
    });

    test("sums all units from baselines, creations, and enhancements", () => {
        const baselines = [
            {
                unitsRetained: 12,
                unitsRetainedDecimal: new Decimal(12),
                unitsEnhanced: 6,
                unitsEnhancedDecimal: new Decimal(6),
            } as any,
        ];
        const creations = [
            { hedgerowUnitsDelivered: 18, hedgerowUnitsDeliveredDecimal: new Decimal(18) } as any,
        ];
        const enhancements = [
            { hedgerowUnitsDelivered: 14, hedgerowUnitsDeliveredDecimal: new Decimal(14) } as any,
        ];
        const result = calculateOffSiteHedgerowPostIntervention(baselines, creations, enhancements);
        expect(result).toBe(44); // 12 + 18 + 14 (enhanced not counted from baselines)
    });
});

describe("calculateOffSiteHedgerowNetChange", () => {
    test("calculates positive net change", () => {
        const result = calculateOffSiteHedgerowNetChange(60, 90);
        expect(result.units).toBe(30);
        expect(result.percentage).toBe(50);
    });

    test("calculates negative net change", () => {
        const result = calculateOffSiteHedgerowNetChange(80, 60);
        expect(result.units).toBe(-20);
        expect(result.percentage).toBe(-25);
    });

    test("handles zero baseline without division by zero", () => {
        const result = calculateOffSiteHedgerowNetChange(0, 35);
        expect(result.units).toBe(35);
        expect(result.percentage).toBe(0);
    });
});

describe("calculateOffSiteHedgerowNetChangeWithSRM", () => {
    test("returns N/A when net change is negative", () => {
        const baselines = [
            {
                totalHedgerowUnitsSRM: 30,
                totalHedgerowUnitsSRMDecimal: new Decimal(30),
                unitsRetained: 0,
                unitsRetainedDecimal: new Decimal(0),
                unitsEnhanced: 0,
                unitsEnhancedDecimal: new Decimal(0),
                spatialRiskMultiplier: 0.6,
                spatialRiskMultiplierDecimal: new Decimal(0.6),
            } as any,
        ];
        const result = calculateOffSiteHedgerowNetChangeWithSRM(baselines, [], [], -10);
        expect(result).toBe("N/A");
    });

    test("returns N/A when net change is zero", () => {
        const baselines = [
            {
                totalHedgerowUnitsSRM: 30,
                totalHedgerowUnitsSRMDecimal: new Decimal(30),
                unitsRetained: 0,
                unitsRetainedDecimal: new Decimal(0),
                unitsEnhanced: 0,
                unitsEnhancedDecimal: new Decimal(0),
                spatialRiskMultiplier: 0.6,
                spatialRiskMultiplierDecimal: new Decimal(0.6),
            } as any,
        ];
        const result = calculateOffSiteHedgerowNetChangeWithSRM(baselines, [], [], 0);
        expect(result).toBe("N/A");
    });

    test("calculates SRM-adjusted net change for positive gains", () => {
        const baselines = [
            {
                totalHedgerowUnitsSRM: 36,
                totalHedgerowUnitsSRMDecimal: new Decimal(36), // baseline WITH SRM
                unitsRetained: 30,
                unitsRetainedDecimal: new Decimal(30),
                unitsEnhanced: 10,
                unitsEnhancedDecimal: new Decimal(10),
                spatialRiskMultiplier: 0.6,
                spatialRiskMultiplierDecimal: new Decimal(0.6), // 60% multiplier (40% risk)
            } as any,
        ];
        const creations = [
            {
                hedgerowUnitsDeliveredWithSpatialRisk: 18,
                hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(18),
            } as any, // already includes SRM
        ];
        const enhancements = [
            {
                hedgerowUnitsDeliveredWithSpatialRisk: 12,
                hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(12),
            } as any, // already includes SRM
        ];

        // Post-intervention WITH SRM = 30 * 0.6 + 18 + 12 = 18 + 18 + 12 = 48
        // Net change WITH SRM = 48 - 36 = 12
        const result = calculateOffSiteHedgerowNetChangeWithSRM(baselines, creations, enhancements, 10);
        expect(result).toBe(12);
    });

    test("handles multiple baselines with different SRM values", () => {
        const baselines = [
            {
                totalHedgerowUnitsSRM: 24,
                totalHedgerowUnitsSRMDecimal: new Decimal(24), // 40 * 0.6
                unitsRetained: 15,
                unitsRetainedDecimal: new Decimal(15),
                unitsEnhanced: 5,
                unitsEnhancedDecimal: new Decimal(5),
                spatialRiskMultiplier: 0.6,
                spatialRiskMultiplierDecimal: new Decimal(0.6),
            } as any,
            {
                totalHedgerowUnitsSRM: 20,
                totalHedgerowUnitsSRMDecimal: new Decimal(20), // 25 * 0.8
                unitsRetained: 12,
                unitsRetainedDecimal: new Decimal(12),
                unitsEnhanced: 4,
                unitsEnhancedDecimal: new Decimal(4),
                spatialRiskMultiplier: 0.8,
                spatialRiskMultiplierDecimal: new Decimal(0.8),
            } as any,
        ];

        // Post-intervention WITH SRM = 15 * 0.6 + 12 * 0.8 = 9 + 9.6 = 18.6
        // Net change WITH SRM = 18.6 - (24 + 20) = 18.6 - 44 = -25.4
        const result = calculateOffSiteHedgerowNetChangeWithSRM(baselines, [], [], 10);
        expect(result).toBe(-25.4);
    });

    test("handles zero baseline WITH SRM without division by zero", () => {
        const baselines = [
            {
                totalHedgerowUnitsSRM: 0,
                totalHedgerowUnitsSRMDecimal: new Decimal(0),
                unitsRetained: 0,
                unitsRetainedDecimal: new Decimal(0),
                unitsEnhanced: 0,
                unitsEnhancedDecimal: new Decimal(0),
                spatialRiskMultiplier: 0.7,
                spatialRiskMultiplierDecimal: new Decimal(0.7),
            } as any,
        ];
        const creations = [
            {
                hedgerowUnitsDeliveredWithSpatialRisk: 15,
                hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(15),
            } as any,
        ];

        const result = calculateOffSiteHedgerowNetChangeWithSRM(baselines, creations, [], 25);
        expect(result).toBe(15);
    });
});

describe("headlineResults - off-site hedgerows", () => {
    test("calculates off-site hedgerow results with empty arrays", () => {
        const input = emptyFixture();
        const result = headlineResults(input, emptyTradingSummary());

        expect(result.offSiteHedgerowBaseline).toBe(0);
        expect(result.offSiteHedgerowPostIntervention).toBe(0);
        expect(result.offSiteHedgerowNetChange.units).toBe(0);
        expect(result.offSiteHedgerowNetChange.percentage).toBe(0);
        expect(result.offSiteHedgerowNetChangeWithSRM).toBe("N/A");
    });

    test("calculates off-site hedgerow results with data", () => {
        const input = emptyFixture({
            offSiteHedgerowBaselines: [
                {
                    totalHedgerowUnits: 50,
                    totalHedgerowUnitsDecimal: new Decimal(50),
                    totalHedgerowUnitsSRM: 30,
                    totalHedgerowUnitsSRMDecimal: new Decimal(30), // 60% multiplier (40% spatial risk)
                    unitsRetained: 35,
                    unitsRetainedDecimal: new Decimal(35),
                    unitsEnhanced: 8,
                    unitsEnhancedDecimal: new Decimal(8),
                    spatialRiskMultiplier: 0.6,
                    spatialRiskMultiplierDecimal: new Decimal(0.6),
                } as any,
            ],
            offSiteHedgerowCreations: [
                {
                    hedgerowUnitsDelivered: 20,
                    hedgerowUnitsDeliveredDecimal: new Decimal(20),
                    hedgerowUnitsDeliveredWithSpatialRisk: 12,
                    hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(12), // 20 * 0.6
                } as any,
            ],
            offSiteHedgerowEnhancements: [
                {
                    hedgerowUnitsDelivered: 15,
                    hedgerowUnitsDeliveredDecimal: new Decimal(15),
                    hedgerowUnitsDeliveredWithSpatialRisk: 9,
                    hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(9), // 15 * 0.6
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.offSiteHedgerowBaseline).toBe(50);
        expect(result.offSiteHedgerowPostIntervention).toBe(70); // 35 + 20 + 15 (enhanced not counted from baselines)
        expect(result.offSiteHedgerowNetChange.units).toBe(20);
        expect(result.offSiteHedgerowNetChange.percentage).toBeCloseTo(40, 1); // 20/50 * 100

        // WITH SRM: baseline = 30, post = 35*0.6 + 12 + 9 = 21 + 12 + 9 = 42
        // Net change = 42 - 30 = 12
        expect(result.offSiteHedgerowNetChangeWithSRM).toBeCloseTo(12, 1);
    });

    test("SRM not applied when off-site hedgerow net change is negative", () => {
        const input = emptyFixture({
            offSiteHedgerowBaselines: [
                {
                    totalHedgerowUnits: 80,
                    totalHedgerowUnitsDecimal: new Decimal(80),
                    totalHedgerowUnitsSRM: 48,
                    totalHedgerowUnitsSRMDecimal: new Decimal(48),
                    unitsRetained: 25,
                    unitsRetainedDecimal: new Decimal(25),
                    unitsEnhanced: 0,
                    unitsEnhancedDecimal: new Decimal(0),
                    spatialRiskMultiplier: 0.6,
                    spatialRiskMultiplierDecimal: new Decimal(0.6),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.offSiteHedgerowBaseline).toBe(80);
        expect(result.offSiteHedgerowPostIntervention).toBe(25); // Only retained
        expect(result.offSiteHedgerowNetChange.units).toBe(-55); // Negative
        expect(result.offSiteHedgerowNetChangeWithSRM).toBe("N/A");
    });
});

describe("calculateOnSiteWatercourseBaseline", () => {
    test("returns 0 for empty array", () => {
        const result = calculateOnSiteWatercourseBaseline([]);
        expect(result).toBe(0);
    });

    test("sums totalWatercourseUnits from single baseline", () => {
        const baselines = [
            { totalWatercourseUnits: 15, totalWatercourseUnitsDecimal: new Decimal(15) } as any,
        ];
        const result = calculateOnSiteWatercourseBaseline(baselines);
        expect(result).toBe(15);
    });

    test("sums totalWatercourseUnits from multiple baselines", () => {
        const baselines = [
            { totalWatercourseUnits: 12, totalWatercourseUnitsDecimal: new Decimal(12) } as any,
            { totalWatercourseUnits: 18.5, totalWatercourseUnitsDecimal: new Decimal(18.5) } as any,
            { totalWatercourseUnits: 9.75, totalWatercourseUnitsDecimal: new Decimal(9.75) } as any,
        ];
        const result = calculateOnSiteWatercourseBaseline(baselines);
        expect(result).toBe(40.25);
    });
});

describe("calculateOnSiteWatercoursePostIntervention", () => {
    test("returns 0 for all empty arrays", () => {
        const result = calculateOnSiteWatercoursePostIntervention([], [], []);
        expect(result).toBe(0);
    });

    test("sums retained and bespoke compensation units from baselines only", () => {
        const baselines = [
            {
                unitsRetained: 12,
                unitsRetainedDecimal: new Decimal(12),
                vhdhBespokeCompensationUnits: 6,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(6),
            } as any,
            {
                unitsRetained: 9,
                unitsRetainedDecimal: new Decimal(9),
                vhdhBespokeCompensationUnits: 4,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(4),
            } as any,
        ];
        const result = calculateOnSiteWatercoursePostIntervention(baselines, [], []);
        expect(result).toBe(31);
    });

    test("sums created units only", () => {
        const creations = [
            { unitsDelivered: 18, unitsDeliveredDecimal: new Decimal(18) } as any,
            { unitsDelivered: 22, unitsDeliveredDecimal: new Decimal(22) } as any,
        ];
        const result = calculateOnSiteWatercoursePostIntervention([], creations, []);
        expect(result).toBe(40);
    });

    test("sums enhanced units only", () => {
        const enhancements = [
            { watercourseUnitsDelivered: 14, watercourseUnitsDeliveredDecimal: new Decimal(14) } as any,
            { watercourseUnitsDelivered: 19, watercourseUnitsDeliveredDecimal: new Decimal(19) } as any,
        ];
        const result = calculateOnSiteWatercoursePostIntervention([], [], enhancements);
        expect(result).toBe(33);
    });

    test("sums all units from baselines, creations, and enhancements", () => {
        const baselines = [
            {
                unitsRetained: 15,
                unitsRetainedDecimal: new Decimal(15),
                vhdhBespokeCompensationUnits: 7,
                vhdhBespokeCompensationUnitsDecimal: new Decimal(7),
            } as any,
        ];
        const creations = [{ unitsDelivered: 20, unitsDeliveredDecimal: new Decimal(20) } as any];
        const enhancements = [
            { watercourseUnitsDelivered: 16, watercourseUnitsDeliveredDecimal: new Decimal(16) } as any,
        ];
        const result = calculateOnSiteWatercoursePostIntervention(baselines, creations, enhancements);
        expect(result).toBe(58); // 15 + 7 + 20 + 16
    });
});

describe("calculateOnSiteWatercourseNetChange", () => {
    test("calculates positive net change", () => {
        const result = calculateOnSiteWatercourseNetChange(50, 75);
        expect(result.units).toBe(25);
        expect(result.percentage).toBe(50);
    });

    test("calculates negative net change", () => {
        const result = calculateOnSiteWatercourseNetChange(70, 50);
        expect(result.units).toBe(-20);
        expect(result.percentage).toBeCloseTo(-28.57, 1);
    });

    test("calculates zero net change", () => {
        const result = calculateOnSiteWatercourseNetChange(60, 60);
        expect(result.units).toBe(0);
        expect(result.percentage).toBe(0);
    });

    test("handles zero baseline without division by zero", () => {
        const result = calculateOnSiteWatercourseNetChange(0, 40);
        expect(result.units).toBe(40);
        expect(result.percentage).toBe(0);
    });
});

describe("headlineResults - on-site watercourses", () => {
    test("calculates on-site watercourse results with empty arrays", () => {
        const input = emptyFixture();
        const result = headlineResults(input, emptyTradingSummary());

        expect(result.onSiteWatercourseBaseline).toBe(0);
        expect(result.onSiteWatercoursePostIntervention).toBe(0);
        expect(result.onSiteWatercourseNetChange.units).toBe(0);
        expect(result.onSiteWatercourseNetChange.percentage).toBe(0);
    });

    test("calculates on-site watercourse results with data", () => {
        const input = emptyFixture({
            onSiteWatercourseBaselines: [
                {
                    totalWatercourseUnits: 45,
                    totalWatercourseUnitsDecimal: new Decimal(45),
                    unitsRetained: 30,
                    unitsRetainedDecimal: new Decimal(30),
                    vhdhBespokeCompensationUnits: 10,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(10),
                } as any,
            ],
            onSiteWatercourseCreations: [
                {
                    unitsDelivered: 25,
                    unitsDeliveredDecimal: new Decimal(25),
                } as any,
            ],
            onSiteWatercourseEnhancements: [
                {
                    watercourseUnitsDelivered: 20,
                    watercourseUnitsDeliveredDecimal: new Decimal(20),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.onSiteWatercourseBaseline).toBe(45);
        expect(result.onSiteWatercoursePostIntervention).toBe(85); // 30 + 10 + 25 + 20
        expect(result.onSiteWatercourseNetChange.units).toBe(40);
        expect(result.onSiteWatercourseNetChange.percentage).toBeCloseTo(88.89, 1); // 40/45 * 100
    });

    test("calculates on-site watercourse results with only baseline data", () => {
        const input = emptyFixture({
            onSiteWatercourseBaselines: [
                {
                    totalWatercourseUnits: 60,
                    totalWatercourseUnitsDecimal: new Decimal(60),
                    unitsRetained: 55,
                    unitsRetainedDecimal: new Decimal(55),
                    vhdhBespokeCompensationUnits: 0,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.onSiteWatercourseBaseline).toBe(60);
        expect(result.onSiteWatercoursePostIntervention).toBe(55);
        expect(result.onSiteWatercourseNetChange.units).toBe(-5);
        expect(result.onSiteWatercourseNetChange.percentage).toBeCloseTo(-8.33, 1);
    });
});

describe("calculateOffSiteWatercourseBaseline", () => {
    test("returns 0 for empty array", () => {
        const result = calculateOffSiteWatercourseBaseline([]);
        expect(result).toBe(0);
    });

    test("sums totalWatercourseUnits from single baseline", () => {
        const baselines = [
            { totalWatercourseUnits: 20, totalWatercourseUnitsDecimal: new Decimal(20) } as any,
        ];
        const result = calculateOffSiteWatercourseBaseline(baselines);
        expect(result).toBe(20);
    });

    test("sums totalWatercourseUnits from multiple baselines", () => {
        const baselines = [
            { totalWatercourseUnits: 14, totalWatercourseUnitsDecimal: new Decimal(14) } as any,
            { totalWatercourseUnits: 22.5, totalWatercourseUnitsDecimal: new Decimal(22.5) } as any,
            { totalWatercourseUnits: 11.75, totalWatercourseUnitsDecimal: new Decimal(11.75) } as any,
        ];
        const result = calculateOffSiteWatercourseBaseline(baselines);
        expect(result).toBe(48.25);
    });
});

describe("calculateOffSiteWatercoursePostIntervention", () => {
    test("returns 0 for all empty arrays", () => {
        const result = calculateOffSiteWatercoursePostIntervention([], [], []);
        expect(result).toBe(0);
    });

    test("sums retained units from baselines only (not enhanced)", () => {
        const baselines = [
            {
                unitsRetained: 14,
                unitsRetainedDecimal: new Decimal(14),
                unitsEnhanced: 7,
                unitsEnhancedDecimal: new Decimal(7),
            } as any,
            {
                unitsRetained: 11,
                unitsRetainedDecimal: new Decimal(11),
                unitsEnhanced: 5,
                unitsEnhancedDecimal: new Decimal(5),
            } as any,
        ];
        const result = calculateOffSiteWatercoursePostIntervention(baselines, [], []);
        expect(result).toBe(25); // 14 + 11 (enhanced not counted here)
    });

    test("sums all units from baselines, creations, and enhancements", () => {
        const baselines = [
            {
                unitsRetained: 16,
                unitsRetainedDecimal: new Decimal(16),
                unitsEnhanced: 8,
                unitsEnhancedDecimal: new Decimal(8),
            } as any,
        ];
        const creations = [{ unitsDelivered: 22, unitsDeliveredDecimal: new Decimal(22) } as any];
        const enhancements = [
            { watercourseUnitsDelivered: 18, watercourseUnitsDeliveredDecimal: new Decimal(18) } as any,
        ];
        const result = calculateOffSiteWatercoursePostIntervention(baselines, creations, enhancements);
        expect(result).toBe(56); // 16 + 22 + 18 (enhanced not counted from baselines)
    });
});

describe("calculateOffSiteWatercourseNetChange", () => {
    test("calculates positive net change", () => {
        const result = calculateOffSiteWatercourseNetChange(55, 85);
        expect(result.units).toBe(30);
        expect(result.percentage).toBeCloseTo(54.55, 1);
    });

    test("calculates negative net change", () => {
        const result = calculateOffSiteWatercourseNetChange(75, 55);
        expect(result.units).toBe(-20);
        expect(result.percentage).toBeCloseTo(-26.67, 1);
    });

    test("handles zero baseline without division by zero", () => {
        const result = calculateOffSiteWatercourseNetChange(0, 38);
        expect(result.units).toBe(38);
        expect(result.percentage).toBe(0);
    });
});

describe("calculateOffSiteWatercourseNetChangeWithSRM", () => {
    test("returns N/A when net change is negative", () => {
        const baselines = [
            {
                totalWatercourseUnitsSRM: 35,
                totalWatercourseUnitsSRMDecimal: new Decimal(35),
                unitsRetained: 0,
                unitsRetainedDecimal: new Decimal(0),
                unitsEnhanced: 0,
                unitsEnhancedDecimal: new Decimal(0),
                spatialRiskMultiplier: 0.7,
                spatialRiskMultiplierDecimal: new Decimal(0.7),
            } as any,
        ];
        const result = calculateOffSiteWatercourseNetChangeWithSRM(baselines, [], [], -12);
        expect(result).toBe("N/A");
    });

    test("returns N/A when net change is zero", () => {
        const baselines = [
            {
                totalWatercourseUnitsSRM: 35,
                totalWatercourseUnitsSRMDecimal: new Decimal(35),
                unitsRetained: 0,
                unitsRetainedDecimal: new Decimal(0),
                unitsEnhanced: 0,
                unitsEnhancedDecimal: new Decimal(0),
                spatialRiskMultiplier: 0.7,
                spatialRiskMultiplierDecimal: new Decimal(0.7),
            } as any,
        ];
        const result = calculateOffSiteWatercourseNetChangeWithSRM(baselines, [], [], 0);
        expect(result).toBe("N/A");
    });

    test("calculates SRM-adjusted net change for positive gains", () => {
        const baselines = [
            {
                totalWatercourseUnitsSRM: 42,
                totalWatercourseUnitsSRMDecimal: new Decimal(42), // baseline WITH SRM
                unitsRetained: 35,
                unitsRetainedDecimal: new Decimal(35),
                unitsEnhanced: 12,
                unitsEnhancedDecimal: new Decimal(12),
                spatialRiskMultiplier: 0.7,
                spatialRiskMultiplierDecimal: new Decimal(0.7), // 70% multiplier (30% risk)
            } as any,
        ];
        const creations = [
            { netUnitChangeWithSpatialRisk: 20, netUnitChangeWithSpatialRiskDecimal: new Decimal(20) } as any,
        ];
        const enhancements = [
            {
                watercourseUnitsDeliveredWithSpatialRisk: 15,
                watercourseUnitsDeliveredWithSpatialRiskDecimal: new Decimal(15),
            } as any,
        ];

        // Post-intervention WITH SRM = 35 * 0.7 + 20 + 15 = 24.5 + 20 + 15 = 59.5
        // Net change WITH SRM = 59.5 - 42 = 17.5
        const result = calculateOffSiteWatercourseNetChangeWithSRM(baselines, creations, enhancements, 12);
        expect(result).toBeCloseTo(17.5, 1);
    });

    test("handles zero baseline WITH SRM without division by zero", () => {
        const baselines = [
            {
                totalWatercourseUnitsSRM: 0,
                totalWatercourseUnitsSRMDecimal: new Decimal(0),
                unitsRetained: 0,
                unitsRetainedDecimal: new Decimal(0),
                unitsEnhanced: 0,
                unitsEnhancedDecimal: new Decimal(0),
                spatialRiskMultiplier: 0.8,
                spatialRiskMultiplierDecimal: new Decimal(0.8),
            } as any,
        ];
        const creations = [
            { netUnitChangeWithSpatialRisk: 18, netUnitChangeWithSpatialRiskDecimal: new Decimal(18) } as any,
        ];

        const result = calculateOffSiteWatercourseNetChangeWithSRM(baselines, creations, [], 28);
        expect(result).toBe(18);
    });
});

describe("headlineResults - off-site watercourses", () => {
    test("calculates off-site watercourse results with empty arrays", () => {
        const input = emptyFixture();
        const result = headlineResults(input, emptyTradingSummary());

        expect(result.offSiteWatercourseBaseline).toBe(0);
        expect(result.offSiteWatercoursePostIntervention).toBe(0);
        expect(result.offSiteWatercourseNetChange.units).toBe(0);
        expect(result.offSiteWatercourseNetChange.percentage).toBe(0);
        expect(result.offSiteWatercourseNetChangeWithSRM).toBe("N/A");
    });

    test("calculates off-site watercourse results with data", () => {
        const input = emptyFixture({
            offSiteWatercourseBaselines: [
                {
                    totalWatercourseUnits: 55,
                    totalWatercourseUnitsDecimal: new Decimal(55),
                    totalWatercourseUnitsSRM: 38.5,
                    totalWatercourseUnitsSRMDecimal: new Decimal(38.5), // 70% multiplier (30% spatial risk)
                    unitsRetained: 40,
                    unitsRetainedDecimal: new Decimal(40),
                    unitsEnhanced: 10,
                    unitsEnhancedDecimal: new Decimal(10),
                    spatialRiskMultiplier: 0.7,
                    spatialRiskMultiplierDecimal: new Decimal(0.7),
                } as any,
            ],
            offSiteWatercourseCreations: [
                {
                    unitsDelivered: 25,
                    unitsDeliveredDecimal: new Decimal(25),
                    netUnitChangeWithSpatialRisk: 17.5,
                    netUnitChangeWithSpatialRiskDecimal: new Decimal(17.5), // 25 * 0.7
                } as any,
            ],
            offSiteWatercourseEnhancements: [
                {
                    watercourseUnitsDelivered: 20,
                    watercourseUnitsDeliveredDecimal: new Decimal(20),
                    watercourseUnitsDeliveredWithSpatialRisk: 14,
                    watercourseUnitsDeliveredWithSpatialRiskDecimal: new Decimal(14), // 20 * 0.7
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.offSiteWatercourseBaseline).toBe(55);
        expect(result.offSiteWatercoursePostIntervention).toBe(85); // 40 + 25 + 20 (enhanced not counted from baselines)
        expect(result.offSiteWatercourseNetChange.units).toBe(30);
        expect(result.offSiteWatercourseNetChange.percentage).toBeCloseTo(54.55, 1); // 30/55 * 100

        // WITH SRM: baseline = 38.5, post = 40*0.7 + 17.5 + 14 = 28 + 17.5 + 14 = 59.5
        // Net change = 59.5 - 38.5 = 21
        expect(result.offSiteWatercourseNetChangeWithSRM).toBeCloseTo(21, 1);
    });

    test("SRM not applied when off-site watercourse net change is negative", () => {
        const input = emptyFixture({
            offSiteWatercourseBaselines: [
                {
                    totalWatercourseUnits: 85,
                    totalWatercourseUnitsDecimal: new Decimal(85),
                    totalWatercourseUnitsSRM: 59.5,
                    totalWatercourseUnitsSRMDecimal: new Decimal(59.5),
                    unitsRetained: 30,
                    unitsRetainedDecimal: new Decimal(30),
                    unitsEnhanced: 0,
                    unitsEnhancedDecimal: new Decimal(0),
                    spatialRiskMultiplier: 0.7,
                    spatialRiskMultiplierDecimal: new Decimal(0.7),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.offSiteWatercourseBaseline).toBe(85);
        expect(result.offSiteWatercoursePostIntervention).toBe(30); // Only retained
        expect(result.offSiteWatercourseNetChange.units).toBe(-55); // Negative
        expect(result.offSiteWatercourseNetChangeWithSRM).toBe("N/A");
    });
});

describe("calculateCombinedNetUnitChange", () => {
    test("returns zero for all zero inputs", () => {
        const result = calculateCombinedNetUnitChange(0, 0, 0, 0, 0, 0);
        expect(result.habitat).toBe(0);
        expect(result.hedgerow).toBe(0);
        expect(result.watercourse).toBe(0);
    });

    test("calculates combined habitat net change", () => {
        const result = calculateCombinedNetUnitChange(20, 15, 0, 0, 0, 0);
        expect(result.habitat).toBe(35);
        expect(result.hedgerow).toBe(0);
        expect(result.watercourse).toBe(0);
    });

    test("calculates combined hedgerow net change", () => {
        const result = calculateCombinedNetUnitChange(0, 0, 12, 8, 0, 0);
        expect(result.habitat).toBe(0);
        expect(result.hedgerow).toBe(20);
        expect(result.watercourse).toBe(0);
    });

    test("calculates combined watercourse net change", () => {
        const result = calculateCombinedNetUnitChange(0, 0, 0, 0, 18, 10);
        expect(result.habitat).toBe(0);
        expect(result.hedgerow).toBe(0);
        expect(result.watercourse).toBe(28);
    });

    test("calculates combined net change for all habitat types", () => {
        const result = calculateCombinedNetUnitChange(25, 18, 15, 12, 20, 14);
        expect(result.habitat).toBe(43); // 25 + 18
        expect(result.hedgerow).toBe(27); // 15 + 12
        expect(result.watercourse).toBe(34); // 20 + 14
    });

    test("handles negative net changes", () => {
        const result = calculateCombinedNetUnitChange(-10, 20, 5, -8, -15, 10);
        expect(result.habitat).toBe(10); // -10 + 20
        expect(result.hedgerow).toBe(-3); // 5 + -8
        expect(result.watercourse).toBe(-5); // -15 + 10
    });

    test("handles mixed positive and negative values", () => {
        const result = calculateCombinedNetUnitChange(30, -10, 15, 5, -20, 25);
        expect(result.habitat).toBe(20);
        expect(result.hedgerow).toBe(20);
        expect(result.watercourse).toBe(5);
    });
});

describe("calculateTotalSRMDeductions", () => {
    test("returns zero when all inputs are zero", () => {
        const result = calculateTotalSRMDeductions(0, 0, 0, 0, 0, 0);
        expect(result.habitat).toBe(0);
        expect(result.hedgerow).toBe(0);
        expect(result.watercourse).toBe(0);
    });

    test("calculates habitat SRM deductions", () => {
        // Net change: 30, With SRM: 15, Deduction: 15
        const result = calculateTotalSRMDeductions(30, 15, 0, 0, 0, 0);
        expect(result.habitat).toBe(15);
        expect(result.hedgerow).toBe(0);
        expect(result.watercourse).toBe(0);
    });

    test("calculates hedgerow SRM deductions", () => {
        // Net change: 28, With SRM: 16.8, Deduction: 11.2
        const result = calculateTotalSRMDeductions(0, 0, 28, 16.8, 0, 0);
        expect(result.habitat).toBe(0);
        expect(result.hedgerow).toBeCloseTo(11.2, 1);
        expect(result.watercourse).toBe(0);
    });

    test("calculates watercourse SRM deductions", () => {
        // Net change: 40, With SRM: 28, Deduction: 12
        const result = calculateTotalSRMDeductions(0, 0, 0, 0, 40, 28);
        expect(result.habitat).toBe(0);
        expect(result.hedgerow).toBe(0);
        expect(result.watercourse).toBe(12);
    });

    test("calculates total SRM deductions across all habitat types", () => {
        const result = calculateTotalSRMDeductions(30, 15, 28, 16.8, 40, 28);
        expect(result.habitat).toBe(15); // 30 - 15
        expect(result.hedgerow).toBeCloseTo(11.2, 1); // 28 - 16.8
        expect(result.watercourse).toBe(12); // 40 - 28
    });

    test("handles zero SRM deductions (no spatial risk)", () => {
        // When net change equals net change with SRM, deduction is 0
        const result = calculateTotalSRMDeductions(20, 20, 15, 15, 10, 10);
        expect(result.habitat).toBe(0);
        expect(result.hedgerow).toBe(0);
        expect(result.watercourse).toBe(0);
    });

    test("does not deduct SRM from off-site losses", () => {
        // Losses stay in combined net change and have no spatial deduction.
        const result = calculateTotalSRMDeductions(-10, 0, -5, 0, -8, 0);
        expect(result.habitat).toBe(0);
        expect(result.hedgerow).toBe(0);
        expect(result.watercourse).toBe(0);
    });
});

describe("calculateFinalTotalNetUnitChange", () => {
    test("returns zero when both inputs are zero", () => {
        const combinedChange = calculateCombinedNetUnitChange(0, 0, 0, 0, 0, 0);
        const deductions = calculateTotalSRMDeductions(0, 0, 0, 0, 0, 0);
        const result = calculateFinalTotalNetUnitChange(combinedChange, deductions);
        expect(result.habitat).toBe(0);
        expect(result.hedgerow).toBe(0);
        expect(result.watercourse).toBe(0);
    });

    test("calculates final total with positive combined change and no deductions", () => {
        const combinedChange = calculateCombinedNetUnitChange(100, 0, 50, 0, 30, 0);
        const deductions = calculateTotalSRMDeductions(0, 0, 0, 0, 0, 0);
        const result = calculateFinalTotalNetUnitChange(combinedChange, deductions);
        expect(result.habitat).toBe(100);
        expect(result.hedgerow).toBe(50);
        expect(result.watercourse).toBe(30);
    });

    test("calculates final total with positive combined change and deductions", () => {
        const combinedChange = calculateCombinedNetUnitChange(100, 0, 50, 0, 40, 0);
        const deductions = calculateTotalSRMDeductions(25, 0, 10, 0, 5, 0);
        const result = calculateFinalTotalNetUnitChange(combinedChange, deductions);
        expect(result.habitat).toBe(75);
        expect(result.hedgerow).toBe(40);
        expect(result.watercourse).toBe(35);
    });

    test("calculates final total with negative combined change", () => {
        const combinedChange = calculateCombinedNetUnitChange(-50, 0, -20, 0, -10, 0);
        const deductions = calculateTotalSRMDeductions(0, 0, 0, 0, 0, 0);
        const result = calculateFinalTotalNetUnitChange(combinedChange, deductions);
        expect(result.habitat).toBe(-50);
        expect(result.hedgerow).toBe(-20);
        expect(result.watercourse).toBe(-10);
    });

    test("calculates final total with negative combined change and deductions", () => {
        const combinedChange = calculateCombinedNetUnitChange(-30, 0, -15, 0, -5, 0);
        const deductions = calculateTotalSRMDeductions(10, 0, 5, 0, 2, 0);
        const result = calculateFinalTotalNetUnitChange(combinedChange, deductions);
        expect(result.habitat).toBe(-40);
        expect(result.hedgerow).toBe(-20);
        expect(result.watercourse).toBe(-7);
    });

    test("calculates final total with realistic scenario", () => {
        const combinedChange = calculateCombinedNetUnitChange(50, 0, 30, 0, 24, 0);
        const deductions = calculateTotalSRMDeductions(15, 0, 11.2, 0, 12, 0);
        const result = calculateFinalTotalNetUnitChange(combinedChange, deductions);
        expect(result.habitat).toBe(35);
        expect(result.hedgerow).toBeCloseTo(18.8, 1);
        expect(result.watercourse).toBe(12);
    });

    test("handles decimal values correctly", () => {
        const combinedChange = calculateCombinedNetUnitChange(87.5, 0, 45.25, 0, 32.75, 0);
        const deductions = calculateTotalSRMDeductions(23.75, 0, 12.5, 0, 8.25, 0);
        const result = calculateFinalTotalNetUnitChange(combinedChange, deductions);
        expect(result.habitat).toBe(63.75);
        expect(result.hedgerow).toBe(32.75);
        expect(result.watercourse).toBe(24.5);
    });

    test("calculates with large deductions that exceed combined change", () => {
        const combinedChange = calculateCombinedNetUnitChange(50, 0, 30, 0, 20, 0);
        const deductions = calculateTotalSRMDeductions(60, 0, 40, 0, 25, 0);
        const result = calculateFinalTotalNetUnitChange(combinedChange, deductions);
        expect(result.habitat).toBe(-10);
        expect(result.hedgerow).toBe(-10);
        expect(result.watercourse).toBe(-5);
    });
});

describe("headlineResults - combined calculations", () => {
    test("includes combined net unit change in results", () => {
        const input = emptyFixture({
            onSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 100,
                    totalHabitatUnitsDecimal: new Decimal(100),
                    baselineUnitsRetained: 80,
                    baselineUnitsRetainedDecimal: new Decimal(80),
                    vhdhBespokeCompensationUnits: 0,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                } as any,
            ],
            offSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 50,
                    totalHabitatUnitsDecimal: new Decimal(50),
                    baselineUnitsRetained: 40,
                    baselineUnitsRetainedDecimal: new Decimal(40),
                    vhdhBespokeCompensationUnits: 0,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                    baselineUnitsEnhanced: 0,
                    baselineUnitsEnhancedDecimal: new Decimal(0),
                    spatialRiskMultiplier: 0.5,
                    spatialRiskMultiplierDecimal: new Decimal(0.5),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        // On-site: baseline 100, post 80, net -20
        // Off-site: baseline 50, post 40, net -10
        expect(result.combinedNetUnitChange.habitat).toBe(-30); // -20 + -10
        expect(result.combinedNetUnitChange.hedgerow).toBe(0);
        expect(result.combinedNetUnitChange.watercourse).toBe(0);
    });

    test("includes SRM deductions in results", () => {
        const input = emptyFixture({
            offSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 80,
                    totalHabitatUnitsDecimal: new Decimal(80),
                    totalHabitatUnitsSRM: 40,
                    totalHabitatUnitsSRMDecimal: new Decimal(40),
                    baselineUnitsRetained: 50,
                    baselineUnitsRetainedDecimal: new Decimal(50),
                    baselineUnitsEnhanced: 10,
                    baselineUnitsEnhancedDecimal: new Decimal(10),
                    vhdhBespokeCompensationUnits: 10,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(10),
                    baselineUnitsRetainedWithSRM: 30,
                    baselineUnitsRetainedWithSRMDecimal: new Decimal(30), // (50+10)*0.5
                    spatialRiskMultiplier: 0.5,
                    spatialRiskMultiplierDecimal: new Decimal(0.5),
                } as any,
            ],
            offSiteHabitatCreations: [
                {
                    habitatUnitsDelivered: 30,
                    habitatUnitsDeliveredDecimal: new Decimal(30),
                    habitatUnitsDeliveredWithSpatialRisk: 15,
                    habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(15),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        // Off-site net change: post = 50 + 10 + 30 = 90, baseline = 80, net = 10
        // Off-site net change with SRM: post with SRM = (50+10)*0.5 + 15 = 30 + 15 = 45, baseline with SRM = 40, net with SRM = 5
        // SRM deduction: 10 - 5 = 5
        expect(result.totalSRMDeductions.habitat).toBe(5);
    });

    test("calculates complete headline results with all habitat types", () => {
        const input = emptyFixture({
            // On-site habitat: +20
            onSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 100,
                    totalHabitatUnitsDecimal: new Decimal(100),
                    baselineUnitsRetained: 60,
                    baselineUnitsRetainedDecimal: new Decimal(60),
                    vhdhBespokeCompensationUnits: 20,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(20),
                } as any,
            ],
            onSiteHabitatCreations: [
                { habitatUnitsDelivered: 40, habitatUnitsDeliveredDecimal: new Decimal(40) } as any,
            ],

            // Off-site habitat: +30, with SRM: +15, deduction: 15
            offSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 80,
                    totalHabitatUnitsDecimal: new Decimal(80),
                    totalHabitatUnitsSRM: 40,
                    totalHabitatUnitsSRMDecimal: new Decimal(40),
                    baselineUnitsRetained: 50,
                    baselineUnitsRetainedDecimal: new Decimal(50),
                    baselineUnitsEnhanced: 10,
                    baselineUnitsEnhancedDecimal: new Decimal(10),
                    vhdhBespokeCompensationUnits: 10,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(10),
                    baselineUnitsRetainedWithSRM: 30,
                    baselineUnitsRetainedWithSRMDecimal: new Decimal(30), // (50+10)*0.5
                    spatialRiskMultiplier: 0.5,
                    spatialRiskMultiplierDecimal: new Decimal(0.5),
                } as any,
            ],
            offSiteHabitatCreations: [
                {
                    habitatUnitsDelivered: 50,
                    habitatUnitsDeliveredDecimal: new Decimal(50),
                    habitatUnitsDeliveredWithSpatialRisk: 25,
                    habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(25),
                } as any,
            ],

            // On-site hedgerow: +10
            onSiteHedgerowBaselines: [
                {
                    totalHedgerowUnits: 50,
                    totalHedgerowUnitsDecimal: new Decimal(50),
                    unitsRetained: 30,
                    unitsRetainedDecimal: new Decimal(30),
                    unitsEnhanced: 10,
                    unitsEnhancedDecimal: new Decimal(10),
                } as any,
            ],
            onSiteHedgerowCreations: [
                { hedgerowUnitsDelivered: 20, hedgerowUnitsDeliveredDecimal: new Decimal(20) } as any,
            ],

            // Off-site hedgerow: +20, with SRM: +12, deduction: 8
            offSiteHedgerowBaselines: [
                {
                    totalHedgerowUnits: 60,
                    totalHedgerowUnitsDecimal: new Decimal(60),
                    totalHedgerowUnitsSRM: 36,
                    totalHedgerowUnitsSRMDecimal: new Decimal(36),
                    unitsRetained: 35,
                    unitsRetainedDecimal: new Decimal(35),
                    unitsEnhanced: 10,
                    unitsEnhancedDecimal: new Decimal(10),
                    spatialRiskMultiplier: 0.6,
                    spatialRiskMultiplierDecimal: new Decimal(0.6),
                } as any,
            ],
            offSiteHedgerowCreations: [
                {
                    hedgerowUnitsDelivered: 35,
                    hedgerowUnitsDeliveredDecimal: new Decimal(35),
                    hedgerowUnitsDeliveredWithSpatialRisk: 21,
                    hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(21),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        // On-site hedgerow: baseline 50, post = 30 + 20 = 50, net 0
        // Off-site hedgerow: baseline 60, post = 35 + 35 = 70 (enhanced not counted from baselines), net 10
        // Combined: habitat 50, hedgerow 10
        expect(result.combinedNetUnitChange.habitat).toBe(50); // 20 + 30
        expect(result.combinedNetUnitChange.hedgerow).toBe(10); // 0 + 10
        expect(result.combinedNetUnitChange.watercourse).toBe(0);

        // Off-site hedgerow WITH SRM: baseline = 36, post = 35*0.6 + 21 = 21 + 21 = 42, net = 42 - 36 = 6
        // SRM deduction hedgerow: 10 - 6 = 4
        expect(result.totalSRMDeductions.habitat).toBe(15);
        expect(result.totalSRMDeductions.hedgerow).toBe(4);
        expect(result.totalSRMDeductions.watercourse).toBe(0);
    });

    test("includes total net percentage change in results", () => {
        const input = emptyFixture({
            onSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 100,
                    totalHabitatUnitsDecimal: new Decimal(100),
                    baselineUnitsRetained: 60,
                    baselineUnitsRetainedDecimal: new Decimal(60),
                    vhdhBespokeCompensationUnits: 20,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(20),
                } as any,
            ],
            onSiteHabitatCreations: [
                { habitatUnitsDelivered: 40, habitatUnitsDeliveredDecimal: new Decimal(40) } as any,
            ],
            onSiteHedgerowBaselines: [
                {
                    totalHedgerowUnits: 50,
                    totalHedgerowUnitsDecimal: new Decimal(50),
                    unitsRetained: 30,
                    unitsRetainedDecimal: new Decimal(30),
                    unitsEnhanced: 10,
                    unitsEnhancedDecimal: new Decimal(10),
                } as any,
            ],
            onSiteHedgerowCreations: [
                { hedgerowUnitsDelivered: 20, hedgerowUnitsDeliveredDecimal: new Decimal(20) } as any,
            ],
            onSiteWatercourseBaselines: [
                {
                    totalWatercourseUnits: 40,
                    totalWatercourseUnitsDecimal: new Decimal(40),
                    unitsRetained: 20,
                    unitsRetainedDecimal: new Decimal(20),
                    vhdhBespokeCompensationUnits: 10,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(10),
                } as any,
            ],
            onSiteWatercourseCreations: [
                { unitsDelivered: 20, unitsDeliveredDecimal: new Decimal(20) } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        // On-site habitat: baseline 100, post 120 (60+20+40), net +20
        // On-site hedgerow: baseline 50, post 50 (30+20), net 0
        // On-site watercourse: baseline 40, post 50 (20+10+20), net +10
        // Total net percentage: habitat 20/100 = 0.2, hedgerow 0/50 = 0, watercourse 10/40 = 0.25
        expect(result.totalNetPercentageChange.habitat).toBe(0.2);
        expect(result.totalNetPercentageChange.hedgerow).toBe(0);
        expect(result.totalNetPercentageChange.watercourse).toBe(0.25);
    });

    test("handles zero baseline in total net percentage change", () => {
        const input = emptyFixture({
            onSiteHabitatCreations: [
                { habitatUnitsDelivered: 50, habitatUnitsDeliveredDecimal: new Decimal(50) } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        // On-site habitat: baseline 0, post 50, net +50
        // Total net percentage: habitat 50/0 = 0 (division by zero handled)
        expect(result.totalNetPercentageChange.habitat).toBe(0);
        expect(result.totalNetPercentageChange.hedgerow).toBe(0);
        expect(result.totalNetPercentageChange.watercourse).toBe(0);
    });

    test("netGainTarget option drives unit summary requirement and deficit", () => {
        const input = emptyFixture({
            onSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 100,
                    totalHabitatUnitsDecimal: new Decimal(100),
                    baselineUnitsRetained: 100,
                    baselineUnitsRetainedDecimal: new Decimal(100),
                    vhdhBespokeCompensationUnits: 0,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary(), { netGainTarget: 0.2 });

        // baseline 100, 20% target => required 120, post 100, change 0 => deficit 20
        expect(result.habitatUnitSummary.baselineUnits).toBe(100);
        expect(result.habitatUnitSummary.requiredUnits).toBe(120);
        expect(result.habitatUnitSummary.unitDeficit).toBe(20);
    });

    test("uses the parsed Start page net-gain target", () => {
        const input = emptyFixture({
            startPage: { netGainTarget: 0.2 },
            onSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 100,
                    totalHabitatUnitsDecimal: new Decimal(100),
                    baselineUnitsRetained: 100,
                    baselineUnitsRetainedDecimal: new Decimal(100),
                    vhdhBespokeCompensationUnits: 0,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                } as any,
            ],
        } as Partial<AllFeatures> & { startPage: { netGainTarget: number } });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.habitatUnitSummary.requiredUnits).toBe(120);
        expect(result.habitatUnitSummary.unitDeficit).toBe(20);
    });

    test("netGainTarget defaults to 0.1 when not provided", () => {
        const input = emptyFixture({
            onSiteHabitatBaselines: [
                {
                    totalHabitatUnits: 100,
                    totalHabitatUnitsDecimal: new Decimal(100),
                    baselineUnitsRetained: 100,
                    baselineUnitsRetainedDecimal: new Decimal(100),
                    vhdhBespokeCompensationUnits: 0,
                    vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
                } as any,
            ],
        });

        const result = headlineResults(input, emptyTradingSummary());

        expect(result.habitatUnitSummary.requiredUnits).toBe(110);
        expect(result.habitatUnitSummary.unitDeficit).toBe(10);
    });
});

describe("spatial risk and watercourse compensation", () => {
    function parseInput(input: BngInput) {
        const result = featuresFromInput(input);
        expect(result.issues).toEqual([]);
        return result.features;
    }

    const strategicSignificance = "Area/compensation not in local strategy/ no local strategy" as const;
    const spatialRiskCategory =
        "Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA" as const;
    const waterSpatial = "Outside waterbody catchment, but within operational catchment" as const;
    const common = { condition: "Poor", strategicSignificance, offSiteReferenceNumber: "gain-site" } as const;
    const area = {
        ...common,
        broadHabitat: "Grassland",
        habitatType: "Other neutral grassland",
        spatialRiskCategory,
    } as const;
    const hedge = { ...common, habitatType: "Native hedgerow", spatialRiskCategory } as const;
    const water = {
        ...common,
        watercourseType: "Ditches",
        watercourseEncroachment: "No Encroachment",
        riparianEncroachment: "No Encroachment/ No Encroachment",
        spatialRiskCategory: waterSpatial,
    } as const;

    for (const change of ["negative", "zero", "positive"] as const) {
        const behaviour = {
            negative: "keeps off-site losses in net change without spatial risk deductions",
            zero: "applies no spatial risk deductions when off-site units are unchanged",
            positive: "deducts spatial risk from off-site gains in all three unit families",
        };
        test(behaviour[change], () => {
            const retained = change === "zero" ? 1 : 0;
            const features = parseInput({
                offSiteHabitatBaselines: [
                    { ...area, area: 1, irreplaceableHabitat: false, areaRetained: retained },
                ],
                offSiteHedgerowBaselines: [{ ...hedge, length: 1, lengthRetained: retained }],
                offSiteWatercourseBaselines: [{ ...water, length: 1, lengthRetained: retained }],
                offSiteHabitatCreations:
                    change === "positive" ? [{ ...area, area: 2, habitatCreationInAdvance: "30+" }] : [],
                offSiteHedgerowCreations:
                    change === "positive" ? [{ ...hedge, length: 2, habitatCreatedInAdvance: "30+" }] : [],
                offSiteWatercourseCreations:
                    change === "positive" ? [{ ...water, length: 2, habitatCreatedInAdvance: "30+" }] : [],
            });
            const result = headlineResults(features, tradingSummaries(features));
            const expectedChange =
                change === "negative"
                    ? { habitat: -4, hedgerow: -2, watercourse: -4 }
                    : change === "zero"
                      ? { habitat: 0, hedgerow: 0, watercourse: 0 }
                      : { habitat: 4, hedgerow: 2, watercourse: 4 };
            const expectedDeductions =
                change === "positive"
                    ? { habitat: 1, hedgerow: 0.5, watercourse: 1 }
                    : { habitat: 0, hedgerow: 0, watercourse: 0 };
            expect(result.combinedNetUnitChange).toMatchObject(expectedChange);
            expect(result.totalSRMDeductions).toMatchObject(expectedDeductions);
            expect(
                calculateTotalSRMDeductions(
                    result.offSiteHabitatNetChange.units,
                    result.offSiteHabitatNetChangeWithSRM,
                    result.offSiteHedgerowNetChange.units,
                    result.offSiteHedgerowNetChangeWithSRM,
                    result.offSiteWatercourseNetChange.units,
                    result.offSiteWatercourseNetChangeWithSRM,
                ),
            ).toMatchObject(expectedDeductions);
            for (const family of ["habitat", "hedgerow", "watercourse"] as const) {
                expect(result.totalNetUnitChange[family]).toBe(
                    expectedChange[family] - expectedDeductions[family],
                );
            }
        });
    }

    describe("off-site watercourse compensation aggregates", () => {
        for (const bespokeCompensation of ["Yes", "Pending", "No"] as const) {
            for (const [lengthRetained, lengthEnhanced, units] of [
                [0.5, 0, 8],
                [0, 0.5, 8],
                [0.25, 0.5, 4],
            ] as const) {
                test(`${bespokeCompensation}, retained ${lengthRetained}, enhanced ${lengthEnhanced}`, () => {
                    const features = parseInput({
                        offSiteWatercourseBaselines: [
                            {
                                ...water,
                                watercourseType: "Priority habitat",
                                condition: "Moderate",
                                length: 1,
                                lengthRetained,
                                lengthEnhanced,
                                bespokeCompensation,
                            },
                        ],
                    });
                    const baseline = features.offSiteWatercourseBaselines[0]!;
                    const compensation = bespokeCompensation === "No" ? 0 : units;
                    expect(baseline.vhdhBespokeCompensationUnits).toBe(compensation);
                    expect(
                        calculateOffSiteWatercoursePostIntervention(
                            features.offSiteWatercourseBaselines,
                            [],
                            [],
                        ),
                    ).toBe(16 * lengthRetained + compensation);
                });
            }
        }
        test("includes spatially adjusted bespoke compensation in watercourse gains", () => {
            const features = parseInput({
                offSiteWatercourseBaselines: [
                    {
                        ...water,
                        watercourseType: "Priority habitat",
                        condition: "Moderate",
                        length: 1,
                        lengthRetained: 0.5,
                        bespokeCompensation: "Yes",
                    },
                ],
                offSiteWatercourseCreations: [
                    { ...water, length: 1, condition: "Moderate", habitatCreatedInAdvance: "30+" },
                ],
            });
            const result = headlineResults(features, tradingSummaries(features));
            expect(result.offSiteWatercoursePostIntervention).toBe(24); // H26: retained 8 + compensation 8 + creation 8
            expect(result.offSiteWatercourseNetChange.units).toBe(8);
            expect(result.offSiteWatercourseNetChangeWithSRM).toBe(6); // L26 (6 + 6 + 6) - L22 (12)
            expect(
                calculateOffSiteWatercourseNetChangeWithSRM(
                    features.offSiteWatercourseBaselines,
                    features.offSiteWatercourseCreations,
                    [],
                    8,
                ),
            ).toBe(6);
            expect(result.totalSRMDeductions.watercourse).toBe(2);
        });
    });
});

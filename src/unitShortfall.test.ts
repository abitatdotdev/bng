import { describe, expect, test } from 'bun:test';
import { unitShortfall } from './unitShortfall';
import type { AllFeatures } from './features';
import type { HeadlineResults } from './headlineResults';

// ============================================================================
// FIXTURES: Minimal mock data to test logical rules
// ============================================================================

/**
 * Creates an empty features object with no data
 */
function emptyFeatures(): AllFeatures {
    return {
        __id: 1,
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
    };
}

/**
 * Creates a minimal headline results object
 */
function createHeadlineResults(
    habitatDeficit = 0,
    habitatBaseline = 100,
    habitatRequired = 110,
    hedgerowDeficit = 0,
    hedgerowBaseline = 50,
    hedgerowRequired = 55,
    watercourseDeficit = 0,
    watercourseBaseline = 20,
    watercourseRequired = 22
): HeadlineResults {
    return {
        habitatUnitSummary: {
            target: 1.1,
            baselineUnits: habitatBaseline,
            requiredUnits: habitatRequired,
            unitDeficit: habitatDeficit,
        },
        hedgerowUnitSummary: {
            target: 1.1,
            baselineUnits: hedgerowBaseline,
            requiredUnits: hedgerowRequired,
            unitDeficit: hedgerowDeficit,
        },
        watercourseUnitSummary: {
            target: 1.1,
            baselineUnits: watercourseBaseline,
            requiredUnits: watercourseRequired,
            unitDeficit: watercourseDeficit,
        },
    } as HeadlineResults;
}

// ============================================================================
// UNIT TESTS: Testing logical rules with fixtures
// ============================================================================

describe('unitShortfall', () => {
    describe('output structure', () => {
        test('returns complete structure with empty features', () => {
            const features = emptyFeatures();
            const headline = createHeadlineResults();
            const result = unitShortfall(features, headline);

            // Verify the complete output structure
            expect(result.hasVeryHighLosses).toBeDefined();
            expect(typeof result.hasVeryHighLosses).toBe('boolean');

            expect(result.summary).toBeDefined();
            expect(result.summary.habitats).toBeDefined();
            expect(result.summary.hedgerows).toBeDefined();
            expect(result.summary.watercourses).toBeDefined();

            expect(result.tierShortfalls).toBeDefined();
            expect(result.tierShortfalls.habitats).toBeDefined();
            expect(result.tierShortfalls.habitats.a5).toBeDefined();
            expect(result.tierShortfalls.habitats.a4).toBeDefined();
            expect(result.tierShortfalls.habitats.a3).toBeDefined();
            expect(result.tierShortfalls.habitats.a2).toBeDefined();
            expect(result.tierShortfalls.habitats.a1).toBeDefined();
            expect(result.tierShortfalls.hedgerows).toBeDefined();
            expect(result.tierShortfalls.watercourses).toBeDefined();

            expect(result.tierDetail).toBeDefined();
            expect(Array.isArray(result.tierDetail.habitats)).toBe(true);
            expect(Array.isArray(result.tierDetail.hedgerows)).toBe(true);
            expect(Array.isArray(result.tierDetail.watercourses)).toBe(true);
        });

        test('summary values match headline results', () => {
            const features = emptyFeatures();
            const headline = createHeadlineResults(10, 100, 110, 5, 50, 55, 2, 20, 22);
            const result = unitShortfall(features, headline);

            // Summary section should mirror the headline results unit summaries
            expect(result.summary.habitats.baselineUnits)
                .toBe(headline.habitatUnitSummary.baselineUnits);
            expect(result.summary.habitats.requiredUnits)
                .toBe(headline.habitatUnitSummary.requiredUnits);
            expect(result.summary.habitats.unitDeficit)
                .toBe(headline.habitatUnitSummary.unitDeficit);

            expect(result.summary.hedgerows.baselineUnits)
                .toBe(headline.hedgerowUnitSummary.baselineUnits);
            expect(result.summary.hedgerows.requiredUnits)
                .toBe(headline.hedgerowUnitSummary.requiredUnits);
            expect(result.summary.hedgerows.unitDeficit)
                .toBe(headline.hedgerowUnitSummary.unitDeficit);

            expect(result.summary.watercourses.baselineUnits)
                .toBe(headline.watercourseUnitSummary.baselineUnits);
            expect(result.summary.watercourses.requiredUnits)
                .toBe(headline.watercourseUnitSummary.requiredUnits);
            expect(result.summary.watercourses.unitDeficit)
                .toBe(headline.watercourseUnitSummary.unitDeficit);
        });

        test('exports UnitShortfallResult type', () => {
            const features = emptyFeatures();
            const headline = createHeadlineResults();
            const result = unitShortfall(features, headline);

            // The return type should be inferred from the function
            expect(result).toBeDefined();
        });
    });

    describe('SRM (Spatial Risk Multiplier) application', () => {
        test('SRM fields exist and are numbers', () => {
            const features = emptyFeatures();
            const headline = createHeadlineResults();
            const result = unitShortfall(features, headline);

            // SRM fields should exist and be numbers
            expect(typeof result.tierShortfalls.habitats.a5.srmShortfall).toBe('number');
            expect(typeof result.tierShortfalls.habitats.a4.srmShortfall).toBe('number');
            expect(typeof result.tierShortfalls.habitats.a3.srmShortfall).toBe('number');
            expect(typeof result.tierShortfalls.habitats.a2.srmShortfall).toBe('number');
            expect(typeof result.tierShortfalls.habitats.a1.srmShortfall).toBe('number');
            expect(typeof result.tierShortfalls.hedgerows.srmShortfall).toBe('number');
            expect(typeof result.tierShortfalls.watercourses.srmShortfall).toBe('number');
        });

        test('SRM doubles all shortfall values', () => {
            const features = emptyFeatures();
            const headline = createHeadlineResults();
            const result = unitShortfall(features, headline);

            // SRM shortfall should be exactly 2x the regular shortfall
            expect(result.tierShortfalls.habitats.a5.srmShortfall)
                .toBe(result.tierShortfalls.habitats.a5.shortfall * 2);
            expect(result.tierShortfalls.habitats.a4.srmShortfall)
                .toBe(result.tierShortfalls.habitats.a4.shortfall * 2);
            expect(result.tierShortfalls.habitats.a3.srmShortfall)
                .toBe(result.tierShortfalls.habitats.a3.shortfall * 2);
            expect(result.tierShortfalls.habitats.a2.srmShortfall)
                .toBe(result.tierShortfalls.habitats.a2.shortfall * 2);
            expect(result.tierShortfalls.habitats.a1.srmShortfall)
                .toBe(result.tierShortfalls.habitats.a1.shortfall * 2);
            expect(result.tierShortfalls.hedgerows.srmShortfall)
                .toBe(result.tierShortfalls.hedgerows.shortfall * 2);
            expect(result.tierShortfalls.watercourses.srmShortfall)
                .toBe(result.tierShortfalls.watercourses.shortfall * 2);
        });
    });

    describe('tier shortfall calculations', () => {
        test('all shortfall values are non-negative', () => {
            const features = emptyFeatures();
            const headline = createHeadlineResults();
            const result = unitShortfall(features, headline);

            // All shortfall values should be >= 0
            expect(result.tierShortfalls.habitats.a5.shortfall).toBeGreaterThanOrEqual(0);
            expect(result.tierShortfalls.habitats.a4.shortfall).toBeGreaterThanOrEqual(0);
            expect(result.tierShortfalls.habitats.a3.shortfall).toBeGreaterThanOrEqual(0);
            expect(result.tierShortfalls.habitats.a2.shortfall).toBeGreaterThanOrEqual(0);
            expect(result.tierShortfalls.habitats.a1.shortfall).toBeGreaterThanOrEqual(0);
            expect(result.tierShortfalls.hedgerows.shortfall).toBeGreaterThanOrEqual(0);
            expect(result.tierShortfalls.watercourses.shortfall).toBeGreaterThanOrEqual(0);
        });
    });
});

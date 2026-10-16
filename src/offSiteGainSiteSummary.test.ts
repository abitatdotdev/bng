import { describe, expect, test } from 'bun:test';
import { Decimal } from './decimal';
import {
    calculateOffSiteGainSiteSummary,
    calculateOffSiteGainSiteSummaries,
    hasOffSiteGainSiteLoss,
    type OffSiteGainSiteResult,
    type OffSiteGainSiteContribution,
} from './offSiteGainSiteSummary';
import { featuresFromInput, type BngInput } from './parsers/featuresFromInput';

const localSignificance = 'Area/compensation not in local strategy/ no local strategy' as const;
const spatialRiskCategory = 'Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA' as const;
const watercourseRisk = 'Outside waterbody catchment, but within operational catchment' as const;

function expectMappedSummary(
    summary: OffSiteGainSiteResult,
    reference: string | undefined,
    baseline: Decimal,
    retained: Decimal,
    created: Decimal,
    enhanced: Decimal,
    baselineWithSpatialRisk: Decimal,
    createdWithSpatialRisk: Decimal,
) {
    expect(summary.reference).toBe(reference ?? '');
    expect(summary.baselineDecimal.eq(baseline)).toBe(true);
    expect(summary.retainedDecimal.eq(retained)).toBe(true);
    expect(summary.createdDecimal.eq(created)).toBe(true);
    expect(summary.enhancedDecimal.eq(enhanced)).toBe(true);
    expect(summary.baselineDecimal.eq(baselineWithSpatialRisk)).toBe(false);
    expect(summary.createdDecimal.eq(createdWithSpatialRisk)).toBe(false);
}

describe('calculateOffSiteGainSiteSummary', () => {
    test('uses raw parsed baseline, retained, creation, and enhancement results for all metric families', () => {
        const habitat = {
            broadHabitat: 'Grassland',
            habitatType: 'Modified grassland',
            strategicSignificance: localSignificance,
            offSiteReferenceNumber: 'Habitat Site',
            spatialRiskCategory,
        } as const;
        const hedgerow = {
            habitatType: 'Native hedgerow',
            strategicSignificance: localSignificance,
            offSiteReferenceNumber: 'Hedgerow Site',
            spatialRiskCategory,
        } as const;
        const watercourse = {
            watercourseType: 'Ditches',
            strategicSignificance: localSignificance,
            offSiteReferenceNumber: 'Watercourse Site',
            spatialRiskCategory: watercourseRisk,
            watercourseEncroachment: 'No Encroachment',
            riparianEncroachment: 'No Encroachment/ No Encroachment',
        } as const;
        const input = {
            offSiteHabitatBaselines: [{ ...habitat, area: 1, areaRetained: 0.5, areaEnhanced: 0, condition: 'Moderate', irreplaceableHabitat: false }],
            offSiteHabitatCreations: [{ ...habitat, area: 1, condition: 'Moderate', habitatCreationInAdvance: 0 }],
            offSiteHabitatEnhancements: [{ ...habitat, condition: 'Good', baseline: { ...habitat, area: 1, areaRetained: 0, areaEnhanced: 1, condition: 'Moderate', irreplaceableHabitat: false }, habitatEnhancedInAdvance: 0 }],
            offSiteHedgerowBaselines: [{ ...hedgerow, length: 1, lengthRetained: 0.5, lengthEnhanced: 0, condition: 'Moderate' }],
            offSiteHedgerowCreations: [{ ...hedgerow, length: 1, condition: 'Moderate', habitatCreatedInAdvance: 0 }],
            offSiteHedgerowEnhancements: [{ ...hedgerow, condition: 'Good', baseline: { ...hedgerow, length: 1, lengthRetained: 0, lengthEnhanced: 1, condition: 'Moderate' }, hedgerowEnhancedInAdvance: 0 }],
            offSiteWatercourseBaselines: [{ ...watercourse, length: 1, lengthRetained: 0.5, lengthEnhanced: 0, condition: 'Moderate' }],
            offSiteWatercourseCreations: [{ ...watercourse, length: 1, condition: 'Moderate', habitatCreatedInAdvance: 0 }],
            offSiteWatercourseEnhancements: [{ ...watercourse, condition: 'Good', baseline: { ...watercourse, length: 1, lengthRetained: 0, lengthEnhanced: 1, condition: 'Moderate' }, watercourseEnhancedInAdvance: 0 }],
        } satisfies BngInput;
        const { features } = featuresFromInput(input, { validate: false });
        const summaries = calculateOffSiteGainSiteSummaries(features);
        const habitatBaseline = features.offSiteHabitatBaselines[0]!;
        const habitatCreation = features.offSiteHabitatCreations[0]!;
        const habitatEnhancement = features.offSiteHabitatEnhancements[0]!;
        expectMappedSummary(
            summaries.habitat[0]!,
            habitatBaseline.offSiteReferenceNumber,
            habitatBaseline.totalHabitatUnitsDecimal,
            habitatBaseline.baselineUnitsRetainedDecimal,
            habitatCreation.habitatUnitsDeliveredDecimal,
            habitatEnhancement.habitatUnitsDeliveredDecimal,
            habitatBaseline.totalHabitatUnitsSRMDecimal,
            habitatCreation.habitatUnitsDeliveredWithSpatialRiskDecimal,
        );

        const hedgerowBaseline = features.offSiteHedgerowBaselines[0]!;
        const hedgerowCreation = features.offSiteHedgerowCreations[0]!;
        const hedgerowEnhancement = features.offSiteHedgerowEnhancements[0]!;
        expectMappedSummary(
            summaries.hedgerow[0]!,
            hedgerowBaseline.offSiteReferenceNumber,
            hedgerowBaseline.totalHedgerowUnitsDecimal,
            hedgerowBaseline.unitsRetainedDecimal,
            hedgerowCreation.hedgerowUnitsDeliveredDecimal,
            hedgerowEnhancement.hedgerowUnitsDeliveredDecimal,
            hedgerowBaseline.totalHedgerowUnitsSRMDecimal,
            hedgerowCreation.hedgerowUnitsDeliveredWithSpatialRiskDecimal,
        );

        const watercourseBaseline = features.offSiteWatercourseBaselines[0]!;
        const watercourseCreation = features.offSiteWatercourseCreations[0]!;
        const watercourseEnhancement = features.offSiteWatercourseEnhancements[0]!;
        expectMappedSummary(
            summaries.watercourse[0]!,
            watercourseBaseline.offSiteReferenceNumber,
            watercourseBaseline.totalWatercourseUnitsDecimal,
            watercourseBaseline.unitsRetainedDecimal,
            watercourseCreation.unitsDeliveredDecimal,
            watercourseEnhancement.watercourseUnitsDeliveredDecimal,
            watercourseBaseline.totalWatercourseUnitsSRMDecimal,
            watercourseCreation.netUnitChangeWithSpatialRiskDecimal,
        );
    });

    test('matches workbook reference criteria while preserving labels', () => {
        const contributions: OffSiteGainSiteContribution[] = [
            { reference: 'A', baseline: 1 },
            { reference: 'a', created: 1 },
            { reference: ' A', baseline: 1 },
            { reference: ' ', baseline: 1 },
        ];

        expect(calculateOffSiteGainSiteSummary(contributions)).toMatchObject([
            {
                reference: 'A',
                baseline: 1,
                created: 1,
                netChange: 0,
                isLoss: false,
            },
            {
                reference: ' A',
                baseline: 1,
                netChange: -1,
                isLoss: true,
            },
            { reference: ' ', baseline: 1, netChange: -1, isLoss: true },
        ]);
    });

    test('uses wildcard and escaped-wildcard criteria', () => {
        expect(calculateOffSiteGainSiteSummary([
            { reference: '*', baseline: 1 },
            { reference: 'other', created: 1 },
        ])).toMatchObject([
            { reference: '*', baseline: 1, created: 1, netChange: 0 },
            { reference: 'other', created: 1, netChange: 1 },
        ]);

        expect(calculateOffSiteGainSiteSummary([
            { reference: '~*', baseline: 1 },
            { reference: '*', created: 1 },
        ])).toMatchObject([
            { reference: '~*', baseline: 0, created: 1, netChange: 1 },
            { reference: '*', baseline: 1, created: 1, netChange: 0 },
        ]);
    });

    test('matches probed Excel operator criteria across text reference cells', () => {
        const source: OffSiteGainSiteContribution[] = [
            { reference: 'A', baseline: 1 }, { reference: 'a', baseline: 2 },
            { reference: ' A', baseline: 3 }, { reference: ' ', baseline: 4 },
            { reference: '*', baseline: 5 }, { reference: '?', baseline: 6 },
            { reference: '~', baseline: 7 }, { reference: '0', baseline: 8 },
            { reference: '01', baseline: 9 }, { reference: '1', baseline: 10 },
            { reference: '10', baseline: 11 }, { reference: 'B', baseline: 12 },
        ];
        const criteria = ['=0', '=00', '=1', '<>1', '<1', '<=1', '>1', '>=1', '=1*', '<>1*', '=*', '<>*', '=~*', '=A*', '<>A*'];
        const results = calculateOffSiteGainSiteSummary([
            ...source,
            ...criteria.map((reference) => ({ reference, baseline: 0 })),
        ]);
        const totalFor = (reference: string) => results.find((result) => result.reference === reference)?.baseline;

        expect(totalFor('=0')).toBe(8);
        expect(totalFor('=00')).toBe(8);
        expect(totalFor('=1')).toBe(19);
        expect(totalFor('<>1')).toBe(78);
        expect(totalFor('<1')).toBe(0);
        expect(totalFor('<=1')).toBe(0);
        expect(totalFor('>1')).toBe(0);
        expect(totalFor('>=1')).toBe(0);
        expect(totalFor('=1*')).toBe(21);
        expect(totalFor('<>1*')).toBe(57);
        expect(totalFor('=*')).toBe(78);
        expect(totalFor('<>*')).toBe(0);
        expect(totalFor('=~*')).toBe(5);
        expect(totalFor('=A*')).toBe(3);
        expect(totalFor('<>A*')).toBe(75);
    });

    test('matches the workbook empty-operand not-equal criterion', () => {
        const result = calculateOffSiteGainSiteSummary([
            { reference: 'A', baseline: 2 },
            { reference: 'B', baseline: 3 },
            { reference: '<>', baseline: 0 },
        ]);
        expect(result.find(({ reference }) => reference === '<>')?.baseline).toBe(5);
    });

    test('treats omitted unit values as zero and preserves decimal arithmetic', () => {
        const result = calculateOffSiteGainSiteSummary([
            { reference: 'Decimal Site', baseline: 0.3 },
            { reference: 'Decimal Site', created: 0.1, enhanced: 0.2 },
        ]);

        expect(result).toMatchObject([
            {
                reference: 'Decimal Site',
                baseline: 0.3,
                retained: 0,
                created: 0.1,
                enhanced: 0.2,
                netChange: 0,
                isLoss: false,
            },
        ]);
    });

    test('ignores literal blank references and returns no groups for empty input', () => {
        expect(calculateOffSiteGainSiteSummary([{ reference: '', baseline: 10 }])).toEqual([]);
        expect(calculateOffSiteGainSiteSummary([])).toEqual([]);
    });

    test('marks a site as loss only when its aggregated net change is negative', () => {
        const result = calculateOffSiteGainSiteSummary([
            { reference: 'Loss', baseline: 5, retained: 4 },
            { reference: 'Break even', baseline: 4, created: 4 },
            { reference: 'Gain', baseline: 2, created: 3 },
            { reference: 'Zero balance' },
        ]);

        expect(result.map(({ reference, netChange, isLoss }) => ({ reference, netChange, isLoss }))).toEqual([
            { reference: 'Loss', netChange: -1, isLoss: true },
            { reference: 'Break even', netChange: 0, isLoss: false },
            { reference: 'Gain', netChange: 1, isLoss: false },
            { reference: 'Zero balance', netChange: 0, isLoss: false },
        ]);
    });
});

describe('hasOffSiteGainSiteLoss', () => {
    test('returns true when any gain site is flagged as a loss', () => {
        const results = calculateOffSiteGainSiteSummary([
            { reference: 'Gain', baseline: 1, created: 2 },
            { reference: 'Loss', baseline: 2, retained: 1 },
        ]);

        expect(hasOffSiteGainSiteLoss(results)).toBeTrue();
    });

    test('returns false when there are no losses or no results', () => {
        expect(hasOffSiteGainSiteLoss(calculateOffSiteGainSiteSummary([
            { reference: 'Break even', baseline: 2, retained: 2 },
            { reference: 'Gain', created: 1 },
        ]))).toBeFalse();
        expect(hasOffSiteGainSiteLoss([])).toBeFalse();
    });
});

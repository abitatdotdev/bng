import { describe, expect, test } from 'bun:test';
import { Decimal } from './decimal';
import { calculateWorkbookAggregateAvailability } from './workbookAggregateAvailability';
import { featuresFromInput, type BngInput } from './parsers/featuresFromInput';

const strategicSignificance = 'Location ecologically desirable but not in local strategy';
const habitatBaseline = {
    broadHabitat: 'Grassland',
    habitatType: 'Modified grassland',
    condition: 'Moderate',
    strategicSignificance,
    irreplaceableHabitat: false,
    area: 1,
};
const waterBaseline = {
    watercourseType: 'Ditches',
    length: 1,
    condition: 'Moderate',
    strategicSignificance,
    watercourseEncroachment: 'No Encroachment',
    riparianEncroachment: 'No Encroachment/ No Encroachment',
};

function calculate(input: BngInput) {
    return calculateWorkbookAggregateAvailability(featuresFromInput(input, { validate: false }).features);
}

describe('workbook total availability', () => {
    test('preserves row repair values while aggregating selective area allocation errors', () => {
        const input = {
            onSiteHabitatBaselines: [{ ...habitatBaseline, areaRetained: 1.1 }],
            offSiteHabitatBaselines: [{
                ...habitatBaseline,
                habitatType: 'Other neutral grassland',
                strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
                spatialRiskCategory: 'Compensation outside LPA or NCA of impact site and neighbouring LPA or NCA',
                offSiteReferenceNumber: 'OFF-001',
                areaRetained: 1.1,
            }],
        } satisfies BngInput;
        const { features } = featuresFromInput(input, { validate: false });
        const result = calculateWorkbookAggregateAvailability(features);
        const row = features.offSiteHabitatBaselines[0]!;

        expect(row.totalHabitatUnits).toBe(8);
        expect(row.totalHabitatUnitsSRM).toBe(4);
        expect(result.inputSheets['A-1'].unitsLost).toBe(true);
        expect(result.inputSheets['D-1'].unitsLost).toBe(true);
        expect(result.inputTotals['D-1'].totalHabitatUnits?.value).toBe(8);
        expect(result.inputTotals['D-1'].totalHabitatUnitsSRM?.value).toBe(4);
        expect(result.inputTotals['D-1'].baselineUnitsRetained?.available).toBe(false);
        expect(result.inputTotals['D-1'].baselineUnitsEnhanced?.available).toBe(false);
        expect(result.headline.baseline.offSite.habitat).toBe(true);
    });

    test('keeps water enhancement-only over-allocation numeric and aggregate-available', () => {
        const { features } = featuresFromInput({
            onSiteWatercourseBaselines: [{ ...waterBaseline, lengthRetained: 0, lengthEnhanced: 1.1 }],
        }, { validate: false });
        const row = features.onSiteWatercourseBaselines[0]!;
        const result = calculateWorkbookAggregateAvailability(features);

        expect(row.unitsEnhanced).toBeGreaterThan(0);
        expect(row.unitsEnhancedDecimal).toBeInstanceOf(Decimal);
        expect(result.inputTotals['C-1'].unitsEnhanced?.valueDecimal.eq(row.unitsEnhancedDecimal)).toBe(true);
        expect(result.inputTotals['C-1'].unitsRetained?.available).toBe(true);
        expect(result.inputTotals['C-1'].unitsEnhanced?.available).toBe(true);
    });

    test('uses Decimal totals and the watercourse positive-only loss sum', () => {
        const { features } = featuresFromInput({
            onSiteHabitatBaselines: [
                { ...habitatBaseline, area: 0.1 },
                { ...habitatBaseline, area: 0.2 },
            ],
            offSiteWatercourseBaselines: [{
                ...waterBaseline,
                spatialRiskCategory: 'Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA',
                offSiteReferenceNumber: 'OFF-001',
                lengthRetained: 0,
                lengthEnhanced: 0,
            }],
        }, { validate: false });
        const result = calculateWorkbookAggregateAvailability(features);

        expect(result.inputTotals['A-1'].area?.valueDecimal.toString()).toBe('0.3');
        expect(result.inputTotals['F-1'].unitsLost?.valueDecimal.isFinite()).toBe(true);
        expect(result.inputTotals['F-1'].unitsLost?.available).toBe(true);
    });

    test('uses the actual off-site hedgerow SRM retained field in totals', () => {
        const { features } = featuresFromInput({
            offSiteHedgerowBaselines: [{
                habitatType: 'Native hedgerow',
                condition: 'Moderate',
                strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
                offSiteReferenceNumber: 'OFF-001',
                spatialRiskCategory: 'Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA',
                length: 1,
                lengthRetained: 0.2,
                lengthEnhanced: 0,
            }],
        }, { validate: false });
        const row = features.offSiteHedgerowBaselines[0]!;
        const result = calculateWorkbookAggregateAvailability(features);

        expect(row.unitsRetainedWithSRMDecimal.toString()).toBe('0.6');
        expect(result.inputTotals['E-1'].unitsRetainedWithSRM?.valueDecimal.eq(row.unitsRetainedWithSRMDecimal)).toBe(true);
    });

    test('distinguishes the E1 error cell from an F1 blank cell during ordinary sums', () => {
        const { features } = featuresFromInput({
            offSiteHedgerowBaselines: [{
                habitatType: 'Native hedgerow',
                condition: 'Moderate',
                strategicSignificance,
                spatialRiskCategory: 'Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA',
                length: 2,
                lengthRetained: 0.2,
                lengthEnhanced: 0,
            }],
            offSiteWatercourseBaselines: [{
                ...waterBaseline,
                spatialRiskCategory: 'Outside waterbody catchment, but within operational catchment',
                watercourseEncroachment: 'N/A - Culvert',
                lengthRetained: 0.2,
                lengthEnhanced: 0,
            }],
        }, { validate: false });
        const e1 = features.offSiteHedgerowBaselines[0]!;
        const f1 = features.offSiteWatercourseBaselines[0]!;
        const result = calculateWorkbookAggregateAvailability(features);

        expect(e1.hedgerowBaselineAvailability?.unitsLostError).toBe(true);
        expect(result.inputTotals['E-1'].unitsLost?.available).toBe(false);
        expect(f1.watercourseBaselineAvailability?.unavailableResults.unitsRetainedWithSRM).toBe('blank');
        expect(result.inputTotals['F-1'].unitsRetainedWithSRM?.value).toBe(0);
        expect(result.inputTotals['F-1'].unitsRetainedWithSRM?.available).toBe(true);
    });

    test('uses source review status for C3 and F3 caps, ordinary shortfall, and unavailable rows', () => {
        const cappedBaseline = { ...waterBaseline, lengthEnhanced: 1.5 };
        const { features: cappedC3 } = featuresFromInput({
            onSiteWatercourseEnhancements: [{
                baseline: cappedBaseline,
                watercourseType: 'Ditches',
                condition: 'Moderate',
                strategicSignificance,
                watercourseEncroachment: 'Minor',
                riparianEncroachment: 'No Encroachment/ No Encroachment',
            }],
        }, { validate: false });
        const c3CapRow = cappedC3.onSiteWatercourseEnhancements[0]!;
        const cappedResult = calculateWorkbookAggregateAvailability(cappedC3);

        expect(c3CapRow.watercourseUnitsDelivered).toBeLessThan(c3CapRow.baseline.unitsEnhanced);
        expect(c3CapRow.enhancementUnitReview.status).toBe('clear');
        expect(cappedResult.inputSheets['C-3'].watercourseUnitsDelivered).toBe(true);

        const risk = 'Outside waterbody catchment, but within operational catchment';
        const reviewedBaseline = { ...waterBaseline, lengthEnhanced: 0.5, spatialRiskCategory: risk, offSiteReferenceNumber: 'OFF-001' };
        const { features: reviewedF3 } = featuresFromInput({
            offSiteWatercourseEnhancements: [{
                baseline: reviewedBaseline,
                watercourseType: 'Ditches',
                condition: 'Moderate',
                strategicSignificance,
                watercourseEncroachment: 'Minor',
                riparianEncroachment: 'No Encroachment/ No Encroachment',
                offSiteReferenceNumber: 'OFF-001',
            }],
        }, { validate: false });
        const reviewedRow = reviewedF3.offSiteWatercourseEnhancements[0]!;
        const reviewedResult = calculateWorkbookAggregateAvailability(reviewedF3);

        expect(reviewedRow.enhancementUnitReview.status).toBe('review');
        expect(reviewedResult.inputSheets['F-3'].watercourseUnitsDelivered).toBe(false);
        expect(reviewedResult.inputSheets['F-3'].watercourseUnitsDeliveredWithSpatialRisk).toBe(false);

        const { features: unavailableC3 } = featuresFromInput({
            onSiteWatercourseEnhancements: [{
                baseline: { ...waterBaseline, lengthEnhanced: 0.5 },
                watercourseType: 'Ditches',
                condition: 'Moderate',
                strategicSignificance,
                watercourseEnhancedInAdvance: 1,
                watercourseEnhancedDelay: 1,
                watercourseEncroachment: 'No Encroachment',
                riparianEncroachment: 'No Encroachment/ No Encroachment',
            }],
        }, { validate: false });
        const unavailableC3Row = unavailableC3.onSiteWatercourseEnhancements[0]!;
        const unavailableC3Result = calculateWorkbookAggregateAvailability(unavailableC3);

        expect(unavailableC3Row.enhancementUnitReview.status).toBe('unavailable');
        expect(unavailableC3Result.inputSheets['C-3'].watercourseUnitsDelivered).toBe(true);

        const { features: unavailableF3 } = featuresFromInput({
            offSiteWatercourseEnhancements: [{
                baseline: reviewedBaseline,
                watercourseType: 'Ditches',
                condition: 'Moderate',
                strategicSignificance,
                watercourseEncroachment: 'No Encroachment',
                riparianEncroachment: 'No Encroachment/ No Encroachment',
            }],
        }, { validate: false });
        const unavailableF3Row = unavailableF3.offSiteWatercourseEnhancements[0]!;
        const unavailableF3Result = calculateWorkbookAggregateAvailability(unavailableF3);

        expect(unavailableF3Row.enhancementUnitReview.status).toBe('unavailable');
        expect(unavailableF3Result.inputSheets['F-3'].watercourseUnitsDelivered).toBe(true);
        expect(unavailableF3Result.inputSheets['F-3'].watercourseUnitsDeliveredWithSpatialRisk).toBe(true);
    });
});

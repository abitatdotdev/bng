import { describe, expect, test } from 'bun:test';
import { Decimal } from './decimal';
import { calculateWorkbookAggregateAvailability } from './workbookAggregateAvailability';
import type { AllFeatures } from './features';
import { featuresFromInput } from './parsers/featuresFromInput';

function emptyFeatures(overrides: Partial<AllFeatures> = {}): AllFeatures {
    return {
        onSiteHabitatBaselines: [], onSiteHabitatCreations: [], onSiteHabitatEnhancements: [],
        offSiteHabitatBaselines: [], offSiteHabitatCreations: [], offSiteHabitatEnhancements: [],
        onSiteHedgerowBaselines: [], onSiteHedgerowCreations: [], onSiteHedgerowEnhancements: [],
        offSiteHedgerowBaselines: [], offSiteHedgerowCreations: [], offSiteHedgerowEnhancements: [],
        onSiteWatercourseBaselines: [], onSiteWatercourseCreations: [], onSiteWatercourseEnhancements: [],
        offSiteWatercourseBaselines: [], offSiteWatercourseCreations: [], offSiteWatercourseEnhancements: [],
        ...overrides,
    };
}

describe('workbook total availability', () => {
    test('gates only columns whose source formulas inspect allocation errors', () => {
        const result = calculateWorkbookAggregateAvailability(emptyFeatures({
            onSiteHabitatBaselines: [{ areaCalculationAvailability: { unavailableResults: { unitsLost: 'check-data' } } } as never],
            offSiteHabitatBaselines: [{ areaCalculationAvailability: { unavailableResults: { areaHabitatLost: 'check-data' } } } as never],
            onSiteHedgerowBaselines: [{ hedgerowBaselineAvailability: { status: 'over-allocated', unavailableResults: { baselineTotals: 'check-data' } } } as never],
        }));

        expect(result.inputSheets['A-1'].totalHabitatUnits).toBe(true);
        expect(result.inputSheets['A-1'].unitsLost).toBe(true);
        expect(result.inputSheets['D-1'].totalHabitatUnits).toBe(true);
        expect(result.inputSheets['D-1'].unitsLost).toBe(true);
        expect(result.inputSheets['D-1'].vhdhBespokeCompensationUnits).toBe(true);
        expect(result.inputSheets['D-1'].baselineUnitsRetained).toBe(false);
        expect(result.headline.baseline.onSite.hedgerow).toBe(true);
    });


    test('keeps parsed D-1 baseline totals available on allocation overrun while gating retained totals', () => {
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
        const result = calculateWorkbookAggregateAvailability(features);
        const row = features.offSiteHabitatBaselines[0]!;

        expect(issues.offSiteHabitatBaselines).toBeUndefined();
        expect(row.totalHabitatUnits).toBe(8);
        expect(row.totalHabitatUnitsSRM).toBe(4);
        expect(result.inputSheets['D-1'].totalHabitatUnits).toBe(true);
        expect(result.inputSheets['D-1'].totalHabitatUnitsSRM).toBe(true);
        expect(result.inputSheets['D-1'].baselineUnitsRetained).toBe(false);
        expect(result.inputSheets['D-1'].baselineUnitsEnhanced).toBe(false);
        expect(result.inputTotals['D-1']!.totalHabitatUnits!.value).toBe(8);
        expect(result.inputTotals['D-1']!.totalHabitatUnitsSRM!.value).toBe(4);
        expect(result.inputTotals['D-1']!.baselineUnitsRetained!.available).toBe(false);
        expect(result.inputTotals['D-1']!.baselineUnitsEnhanced!.available).toBe(false);
    });

    test('water totals gate retained overlength only, preserving enhancement-only overrun and blank rows', () => {
        const result = calculateWorkbookAggregateAvailability(emptyFeatures({
            onSiteWatercourseBaselines: [
                { unitsRetained: 0, unitsRetainedDecimal: new Decimal(0), unitsEnhanced: 24, unitsEnhancedDecimal: new Decimal(24), watercourseBaselineAvailability: { overAllocated: true, unavailableResults: {} } } as never,
                { unitsRetained: 0, unitsRetainedDecimal: new Decimal(0), unitsEnhanced: 0, unitsEnhancedDecimal: new Decimal(0), watercourseBaselineAvailability: { invalidEncroachment: true, unavailableResults: { unitsRetained: 'blank', unitsEnhanced: 'blank' } } } as never,
            ],
        }));

        expect(result.inputSheets['C-1'].unitsRetained).toBe(true);
        expect(result.inputSheets['C-1'].unitsEnhanced).toBe(true);
        expect(result.inputTotals['C-1']!.unitsRetained!.available).toBe(true);
        expect(result.inputTotals['C-1']!.unitsEnhanced!.available).toBe(true);
        expect(result.inputTotals['C-1']!.unitsRetained!.value).toBe(0);
        expect(result.inputTotals['C-1']!.unitsEnhanced!.value).toBe(24);
    });

    test('keeps row values while making below-baseline delivery an aggregate-only gate', () => {
        const row = {
            watercourseUnitsDeliveredDecimal: new Decimal(3),
            baseline: { unitsEnhancedDecimal: new Decimal(4) },
        };
        const result = calculateWorkbookAggregateAvailability(emptyFeatures({
            onSiteWatercourseEnhancements: [row as never],
        }));

        expect(result.inputSheets['C-3'].watercourseUnitsDelivered).toBe(false);
        expect(result.inputTotals['C-3']!.watercourseUnitsDelivered!.available).toBe(false);
        expect(result.inputTotals['C-3']!.length!.available).toBe(true);
        expect(row.watercourseUnitsDeliveredDecimal.toString()).toBe('3');
    });

    test('uses exact sums, ignores unavailable text cells, and applies watercourse positive-only loss totals', () => {
        const result = calculateWorkbookAggregateAvailability(emptyFeatures({
            onSiteHabitatBaselines: [
                { area: 0.1, areaDecimal: new Decimal('0.1'), unitsLost: 0, unitsLostDecimal: new Decimal(0), areaCalculationAvailability: { unavailableResults: { unitsLost: 'check-data' } } } as never,
                { area: 0.2, areaDecimal: new Decimal('0.2'), unitsLost: 2, unitsLostDecimal: new Decimal(2) } as never,
            ],
            offSiteWatercourseBaselines: [
                { length: 1, lengthDecimal: new Decimal(1), unitsLost: -3, unitsLostDecimal: new Decimal(-3), watercourseBaselineAvailability: { unavailableResults: { unitsLost: 'check-data' } } } as never,
                { length: 2, lengthDecimal: new Decimal(2), unitsLost: 4, unitsLostDecimal: new Decimal(4) } as never,
            ],
        }));

        expect(result.inputTotals['A-1']!.area!.valueDecimal.toString()).toBe('0.3');
        expect(result.inputTotals['A-1']!.unitsLost!.valueDecimal.toString()).toBe('2');
        expect(result.inputTotals['F-1']!.unitsLost!.valueDecimal.toString()).toBe('4');
        expect(result.inputTotals['F-1']!.unitsLost!.available).toBe(true);
    });
});

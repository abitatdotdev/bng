import { Decimal, type Quantity } from './decimal';
import type { AllFeatures } from './features';

const EXCLUDED_AREA_TYPES = new Set([
    'Facade-bound green wall',
    'Ground based green wall',
    'Urban tree',
    'Rural tree',
    'Artificial hard structures',
    'Artificial features of hard structures',
    'Artificial hard structures with integrated greening of grey infrastructure (IGGI)',
]);

const EXCLUDED_IRREPLACEABLE_AREA_TYPES = new Set([
    'Facade-bound green wall',
    'Ground based green wall',
    'Urban tree',
    'Rural tree',
    'Artificial hard structures with integrated greening of grey infrastructure (IGGI)',
]);

type Row = Record<string, unknown>;

function amount(row: Row, field: string): Decimal {
    const exact = row[`${field}Decimal`];
    if (Decimal.isDecimal(exact) && exact.isFinite()) return exact;
    const value = row[field] as Quantity | undefined;
    return value === undefined ? new Decimal(0) : new Decimal(value);
}

export function countsTowardsSiteArea(habitatType: string): boolean {
    return !EXCLUDED_AREA_TYPES.has(habitatType);
}

function included(row: Row): boolean {
    return countsTowardsSiteArea(String(row.habitatType ?? ''));
}

function sum(rows: Row[], field: string, filter: (row: Row) => boolean = () => true): Decimal {
    return rows.reduce(
        (total, row) => filter(row) ? total.plus(amount(row, field)) : total,
        new Decimal(0),
    );
}

function siteTotals(
    baselines: Row[],
    creations: Row[],
    enhancements: Row[],
) {
    const baselineArea = sum(baselines, 'area', included);
    const lostArea = sum(baselines, 'areaHabitatLost', included);
    const createdArea = sum(creations, 'area', included);
    const baselineEnhancedArea = sum(baselines, 'areaEnhanced');
    const irreplaceableArea = sum(
        baselines,
        'area',
        (row) => Boolean(row.irreplaceableHabitat) && !EXCLUDED_IRREPLACEABLE_AREA_TYPES.has(String(row.habitatType ?? '')),
    );
    const enhancedArea = sum(enhancements, 'area');
    const creationDifference = createdArea.minus(lostArea).abs();
    const enhancementDifference = enhancedArea.minus(baselineEnhancedArea).abs();

    return {
        baselineArea,
        lostArea,
        createdArea,
        enhancedArea,
        baselineEnhancedArea,
        irreplaceableArea,
        creationDifference,
        enhancementDifference,
        creationMatchesLoss: creationDifference.lessThanOrEqualTo('0.01'),
        enhancementMatchesBaseline: enhancementDifference.isZero(),
    };
}

/** Returns the workbook's exclusion-aware area totals and cross-sheet checks. */
export function calculateAreaReconciliation(features: AllFeatures) {
    const onSiteBaselines = features.onSiteHabitatBaselines as unknown as Row[];
    const offSiteBaselines = features.offSiteHabitatBaselines as unknown as Row[];
    return {
        onSite: siteTotals(
            onSiteBaselines,
            features.onSiteHabitatCreations as unknown as Row[],
            features.onSiteHabitatEnhancements as unknown as Row[],
        ),
        offSite: siteTotals(
            offSiteBaselines,
            features.offSiteHabitatCreations as unknown as Row[],
            features.offSiteHabitatEnhancements as unknown as Row[],
        ),
        irreplaceableHabitatPresent: [...onSiteBaselines, ...offSiteBaselines].some(
            (row) => Boolean(row.irreplaceableHabitat) && amount(row, 'area').greaterThan(0),
        ),
    };
}

import { Decimal, type Quantity } from './decimal';
import type { AllFeatures } from './features';
import type { AreaHabitatType } from './areaCalculationTypes';

const EXCLUDED_AREA_TYPES = new Set<AreaHabitatType>([
    'Facade-bound green wall',
    'Ground based green wall',
    'Urban tree',
    'Rural tree',
    'Artificial hard structures',
    'Artificial features of hard structures',
    'Artificial hard structures with integrated greening of grey infrastructure (IGGI)',
]);

const EXCLUDED_IRREPLACEABLE_AREA_TYPES = new Set<AreaHabitatType>([
    'Facade-bound green wall',
    'Ground based green wall',
    'Urban tree',
    'Rural tree',
    'Artificial hard structures with integrated greening of grey infrastructure (IGGI)',
]);

type HabitatBaseline = AllFeatures['onSiteHabitatBaselines'][number] | AllFeatures['offSiteHabitatBaselines'][number];
type HabitatCreation = AllFeatures['onSiteHabitatCreations'][number] | AllFeatures['offSiteHabitatCreations'][number];
type HabitatEnhancement = AllFeatures['onSiteHabitatEnhancements'][number] | AllFeatures['offSiteHabitatEnhancements'][number];

function amount(value: Quantity | undefined, exact: Decimal | undefined): Decimal {
    if (exact?.isFinite()) return exact;
    return value === undefined ? new Decimal(0) : new Decimal(value);
}

function baselineAmount(
    row: HabitatBaseline,
    field: 'area' | 'areaHabitatLost' | 'areaEnhanced',
): Decimal {
    switch (field) {
        case 'area':
            return amount(row.area, row.areaDecimal);
        case 'areaHabitatLost':
            return amount(row.areaHabitatLost, row.areaHabitatLostDecimal);
        case 'areaEnhanced':
            return amount(row.areaEnhanced, row.areaEnhancedDecimal);
    }
}

function sumBaseline(
    rows: readonly HabitatBaseline[],
    field: 'area' | 'areaHabitatLost' | 'areaEnhanced',
    include: (row: HabitatBaseline) => boolean = () => true,
): Decimal {
    return rows.reduce(
        (total, row) => include(row) ? total.plus(baselineAmount(row, field)) : total,
        new Decimal(0),
    );
}

function sumArea<AreaFeature extends { area: Quantity; areaDecimal: Decimal }>(rows: readonly AreaFeature[]): Decimal {
    return rows.reduce(
        (total, row) => total.plus(amount(row.area, row.areaDecimal)),
        new Decimal(0),
    );
}

function sumIncludedArea<AreaFeature extends { area: Quantity; areaDecimal: Decimal; habitatType: AreaHabitatType }>(
    rows: readonly AreaFeature[],
): Decimal {
    return rows.reduce(
        (total, row) => countsTowardsSiteArea(row.habitatType)
            ? total.plus(amount(row.area, row.areaDecimal))
            : total,
        new Decimal(0),
    );
}

function siteTotals(
    baselines: readonly HabitatBaseline[],
    creations: readonly HabitatCreation[],
    enhancements: readonly HabitatEnhancement[],
) {
    const included = (row: HabitatBaseline) => countsTowardsSiteArea(row.habitatType);
    const baselineArea = sumBaseline(baselines, 'area', included);
    const lostArea = sumBaseline(baselines, 'areaHabitatLost', included);
    const createdArea = sumIncludedArea(creations);
    const baselineEnhancedArea = sumBaseline(baselines, 'areaEnhanced');
    const irreplaceableArea = sumBaseline(
        baselines,
        'area',
        (row) => row.irreplaceableHabitat && !EXCLUDED_IRREPLACEABLE_AREA_TYPES.has(row.habitatType),
    );
    const enhancedArea = sumArea(enhancements);
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
    const onSiteBaselines = features.onSiteHabitatBaselines;
    const offSiteBaselines = features.offSiteHabitatBaselines;
    return {
        onSite: siteTotals(
            onSiteBaselines,
            features.onSiteHabitatCreations,
            features.onSiteHabitatEnhancements,
        ),
        offSite: siteTotals(
            offSiteBaselines,
            features.offSiteHabitatCreations,
            features.offSiteHabitatEnhancements,
        ),
        irreplaceableHabitatPresent: [...onSiteBaselines, ...offSiteBaselines].some(
            (row) => row.irreplaceableHabitat && amount(row.area, row.areaDecimal).greaterThan(0),
        ),
    };
}

export function countsTowardsSiteArea(habitatType: AreaHabitatType): boolean {
    return !EXCLUDED_AREA_TYPES.has(habitatType);
}

import { Decimal } from './decimal';
import type { AllFeatures } from './features';
import type { AreaBaselineResult } from './areaCalculationTypes';

export type WorkbookSheet = 'A-1' | 'A-2' | 'A-3' | 'D-1' | 'D-2' | 'D-3' | 'B-1' | 'B-2' | 'B-3' | 'E-1' | 'E-2' | 'E-3' | 'C-1' | 'C-2' | 'C-3' | 'F-1' | 'F-2' | 'F-3';

const SHEET_FEATURES = {
    'A-1': 'onSiteHabitatBaselines',
    'A-2': 'onSiteHabitatCreations',
    'A-3': 'onSiteHabitatEnhancements',
    'D-1': 'offSiteHabitatBaselines',
    'D-2': 'offSiteHabitatCreations',
    'D-3': 'offSiteHabitatEnhancements',
    'B-1': 'onSiteHedgerowBaselines',
    'B-2': 'onSiteHedgerowCreations',
    'B-3': 'onSiteHedgerowEnhancements',
    'E-1': 'offSiteHedgerowBaselines',
    'E-2': 'offSiteHedgerowCreations',
    'E-3': 'offSiteHedgerowEnhancements',
    'C-1': 'onSiteWatercourseBaselines',
    'C-2': 'onSiteWatercourseCreations',
    'C-3': 'onSiteWatercourseEnhancements',
    'F-1': 'offSiteWatercourseBaselines',
    'F-2': 'offSiteWatercourseCreations',
    'F-3': 'offSiteWatercourseEnhancements',
} as const satisfies Record<WorkbookSheet, keyof AllFeatures>;

type RowsFor<Sheet extends WorkbookSheet> = AllFeatures[(typeof SHEET_FEATURES)[Sheet]];
type RowFor<Sheet extends WorkbookSheet> = RowsFor<Sheet>[number];
type DecimalBackedField<Feature> = {
    [Field in keyof Feature & string]: Feature[Field] extends number | string | Decimal | undefined
        ? `${Field}Decimal` extends keyof Feature
            ? Feature[`${Field}Decimal` & keyof Feature] extends Decimal | string | undefined
                ? Field
                : never
            : never
        : never;
}[keyof Feature & string];

const TOTAL_FIELDS = {
    'A-1': ['area', 'totalHabitatUnits', 'areaRetained', 'areaEnhanced', 'baselineUnitsRetained', 'baselineUnitsEnhanced', 'areaHabitatLost', 'unitsLost', 'vhdhBespokeCompensationUnits'],
    'A-2': ['area', 'habitatUnitsDelivered'],
    'A-3': ['area', 'habitatUnitsDelivered'],
    'D-1': ['area', 'totalHabitatUnitsSRM', 'totalHabitatUnits', 'areaRetained', 'areaEnhanced', 'baselineUnitsRetained', 'baselineUnitsEnhanced', 'baselineUnitsRetainedWithSRM', 'areaHabitatLost', 'unitsLost', 'vhdhBespokeCompensationUnits'],
    'D-2': ['area', 'habitatUnitsDeliveredWithSpatialRisk', 'habitatUnitsDelivered'],
    'D-3': ['area', 'habitatUnitsDeliveredWithSpatialRisk', 'habitatUnitsDelivered'],
    'B-1': ['length', 'totalHedgerowUnits', 'lengthRetained', 'lengthEnhanced', 'unitsRetained', 'unitsEnhanced', 'lengthLost', 'unitsLost'],
    'B-2': ['length', 'hedgerowUnitsDelivered'],
    'B-3': ['length', 'hedgerowUnitsDelivered'],
    'E-1': ['length', 'totalHedgerowUnitsSRM', 'totalHedgerowUnits', 'lengthRetained', 'lengthEnhanced', 'unitsRetained', 'unitsEnhanced', 'lengthLost', 'unitsLost', 'unitsRetainedWithSRM'],
    'E-2': ['length', 'hedgerowUnitsDeliveredWithSpatialRisk', 'hedgerowUnitsDelivered'],
    'E-3': ['length', 'hedgerowUnitsDeliveredWithSpatialRisk', 'hedgerowUnitsDelivered'],
    'C-1': ['length', 'totalWatercourseUnits', 'lengthRetained', 'lengthEnhanced', 'unitsRetained', 'unitsEnhanced', 'lengthLost', 'unitsLost', 'vhdhBespokeCompensationUnits'],
    'C-2': ['length', 'unitsDelivered'],
    'C-3': ['length', 'watercourseUnitsDelivered'],
    'F-1': ['length', 'totalWatercourseUnitsSRM', 'totalWatercourseUnits', 'lengthRetained', 'lengthEnhanced', 'unitsRetained', 'unitsEnhanced', 'lengthLost', 'unitsLost', 'unitsRetainedWithSRM', 'vhdhBespokeCompensationUnits'],
    'F-2': ['length', 'netUnitChangeWithSpatialRisk', 'unitsDelivered'],
    'F-3': ['length', 'watercourseUnitsDeliveredWithSpatialRisk', 'watercourseUnitsDelivered'],
} as const satisfies { [Sheet in WorkbookSheet]: readonly DecimalBackedField<RowFor<Sheet>>[] };

export type WorkbookTotalField<Sheet extends WorkbookSheet> = (typeof TOTAL_FIELDS)[Sheet][number];
type InputTotal = { value: number; valueDecimal: Decimal; available: boolean };
type InputTotals = { [Sheet in WorkbookSheet]: Record<WorkbookTotalField<Sheet>, InputTotal> };

type AvailabilityFields = {
    'A-1': 'areaHabitatLost' | 'unitsLost' | 'totalHabitatUnits' | 'totalHabitatUnitsSRM' | 'vhdhBespokeCompensationUnits';
    'A-2': never;
    'A-3': never;
    'D-1': 'areaHabitatLost' | 'unitsLost' | 'totalHabitatUnits' | 'totalHabitatUnitsSRM' | 'baselineUnitsRetained' | 'baselineUnitsEnhanced' | 'baselineUnitsRetainedWithSRM' | 'vhdhBespokeCompensationUnits';
    'D-2': never;
    'D-3': never;
    'B-1': 'totalHedgerowUnits' | 'totalHedgerowUnitsSRM' | 'unitsRetained' | 'unitsEnhanced';
    'B-2': never;
    'B-3': never;
    'E-1': 'totalHedgerowUnits' | 'totalHedgerowUnitsSRM' | 'unitsRetained' | 'unitsEnhanced' | 'unitsLost' | 'unitsRetainedWithSRM';
    'E-2': never;
    'E-3': never;
    'C-1': 'totalWatercourseUnits' | 'totalWatercourseUnitsSRM' | 'unitsRetained' | 'unitsEnhanced' | 'unitsLost' | 'vhdhBespokeCompensationUnits';
    'C-2': never;
    'C-3': 'watercourseUnitsDelivered';
    'F-1': 'totalWatercourseUnits' | 'totalWatercourseUnitsSRM' | 'unitsRetained' | 'unitsEnhanced' | 'unitsLost' | 'unitsRetainedWithSRM' | 'vhdhBespokeCompensationUnits';
    'F-2': never;
    'F-3': 'watercourseUnitsDelivered' | 'watercourseUnitsDeliveredWithSpatialRisk';
};
type InputSheets = { [Sheet in WorkbookSheet]: Partial<Record<AvailabilityFields[Sheet], boolean>> };
type TotalGates = { [Sheet in WorkbookSheet]?: Partial<Record<WorkbookTotalField<Sheet>, boolean>> };

type HabitatBaseline = AllFeatures['onSiteHabitatBaselines'][number];
type HedgerowBaseline = AllFeatures['onSiteHedgerowBaselines'][number] | AllFeatures['offSiteHedgerowBaselines'][number];
type WatercourseBaseline = AllFeatures['onSiteWatercourseBaselines'][number] | AllFeatures['offSiteWatercourseBaselines'][number];
type HedgerowBaselineAvailability = AllFeatures['offSiteHedgerowBaselines'][number]['hedgerowBaselineAvailability'];
type WatercourseBaselineAvailability = AllFeatures['offSiteWatercourseBaselines'][number]['watercourseBaselineAvailability'];
type WatercourseEnhancement = AllFeatures['onSiteWatercourseEnhancements'][number];

function areaRowsAvailable(rows: readonly HabitatBaseline[], result: AreaBaselineResult): boolean {
    return rows.every((row) => !row.areaCalculationAvailability?.unavailableResults[result]);
}

function hedgerowBaselineAvailable(
    rows: readonly HedgerowBaseline[],
    result: keyof HedgerowBaselineAvailability['unavailableResults'],
): boolean {
    return rows.every((row) => {
        const state = row.hedgerowBaselineAvailability;
        return state?.unavailableResults[result] === undefined;
    });
}

function waterBaselineAvailable(
    rows: readonly WatercourseBaseline[],
    result: keyof WatercourseBaselineAvailability['unavailableResults'],
): boolean {
    return rows.every((row) => {
        const unavailableResults: WatercourseBaselineAvailability['unavailableResults'] =
            row.watercourseBaselineAvailability?.unavailableResults ?? {};
        return unavailableResults[result] === undefined;
    });
}

function waterAllocationAvailable(
    rows: readonly WatercourseBaseline[],
    result: 'unitsRetained' | 'unitsEnhanced' | 'unitsRetainedWithSRM',
): boolean {
    return rows.every((row) => {
        const state = row.watercourseBaselineAvailability;
        const unavailableResults: WatercourseBaselineAvailability['unavailableResults'] = state?.unavailableResults ?? {};
        return !state?.retainedExceedsLength && unavailableResults[result] !== 'check-data';
    });
}

function deliveryBelowBaseline(rows: readonly WatercourseEnhancement[]): boolean {
    return rows.some((row) => row.enhancementUnitReview?.status === 'review');
}

function totalValue<Feature, Field extends DecimalBackedField<Feature>>(rows: readonly Feature[], field: Field, positiveOnly: boolean): Decimal {
    return rows.reduce((sum, row) => {
        const projected = row[field];
        const exact = row[`${field}Decimal` as keyof Feature];
        const value = Decimal.isDecimal(exact)
            ? exact
            : typeof projected === 'number' && Number.isFinite(projected)
                ? new Decimal(projected)
                : undefined;
        if (!value || (positiveOnly && !value.greaterThan(0))) return sum;
        return sum.plus(value);
    }, new Decimal(0));
}

function totalsFor<Sheet extends WorkbookSheet>(
    rows: readonly RowFor<Sheet>[],
    sheet: Sheet,
    gates: Partial<Record<WorkbookTotalField<Sheet>, boolean>> = {},
): Record<WorkbookTotalField<Sheet>, InputTotal> {
    const totals = Object.fromEntries(TOTAL_FIELDS[sheet].map((field) => {
        const positiveOnly = (sheet === 'C-1' || sheet === 'F-1') && field === 'unitsLost';
        const typedField = field as DecimalBackedField<RowFor<Sheet>>;
        const valueDecimal = totalValue(rows, typedField, positiveOnly);
        const gate = Object.entries(gates).find(([gateField]) => gateField === field)?.[1];
        return [field, { value: valueDecimal.toNumber(), valueDecimal, available: typeof gate === 'boolean' ? gate : true }];
    }));
    return totals as Record<WorkbookTotalField<Sheet>, InputTotal>;
}

type AggregateDependency = {
    [Sheet in WorkbookSheet]: { sheet: Sheet; field: WorkbookTotalField<Sheet> };
}[WorkbookSheet];

/** Availability follows the explicit error dependencies of workbook column totals. */
export function calculateWorkbookAggregateAvailability(features: AllFeatures) {
    const a1 = features.onSiteHabitatBaselines;
    const d1 = features.offSiteHabitatBaselines;
    const b1 = features.onSiteHedgerowBaselines;
    const e1 = features.offSiteHedgerowBaselines;
    const c1 = features.onSiteWatercourseBaselines;
    const f1 = features.offSiteWatercourseBaselines;
    const c3 = features.onSiteWatercourseEnhancements;
    const f3 = features.offSiteWatercourseEnhancements;

    const d1RetainedAvailable = areaRowsAvailable(d1, 'areaHabitatLost');
    const b1AllocationAvailable = hedgerowBaselineAvailable(b1, 'lengthLost');
    const e1AllocationAvailable = hedgerowBaselineAvailable(e1, 'lengthLost');
    const c1RetainedAvailable = waterAllocationAvailable(c1, 'unitsRetained');
    const f1RetainedAvailable = waterAllocationAvailable(f1, 'unitsRetained');
    const c3DeliveryAvailable = !deliveryBelowBaseline(c3);
    const f3DeliveryAvailable = !deliveryBelowBaseline(f3);

    const inputSheets = {
        'A-1': { areaHabitatLost: true, unitsLost: true, totalHabitatUnits: true, totalHabitatUnitsSRM: true, vhdhBespokeCompensationUnits: true },
        'A-2': {},
        'A-3': {},
        'D-1': { areaHabitatLost: true, unitsLost: true, totalHabitatUnits: true, totalHabitatUnitsSRM: true, baselineUnitsRetained: d1RetainedAvailable, baselineUnitsEnhanced: d1RetainedAvailable, baselineUnitsRetainedWithSRM: d1RetainedAvailable, vhdhBespokeCompensationUnits: true },
        'D-2': {},
        'D-3': {},
        'B-1': { totalHedgerowUnits: true, totalHedgerowUnitsSRM: true, unitsRetained: b1AllocationAvailable, unitsEnhanced: b1AllocationAvailable },
        'B-2': {},
        'B-3': {},
        'E-1': { totalHedgerowUnits: true, totalHedgerowUnitsSRM: true, unitsRetained: e1AllocationAvailable, unitsEnhanced: e1AllocationAvailable, unitsLost: !e1.some((row) => row.hedgerowBaselineAvailability?.unitsLostError), unitsRetainedWithSRM: e1AllocationAvailable },
        'E-2': {},
        'E-3': {},
        'C-1': { totalWatercourseUnits: true, totalWatercourseUnitsSRM: waterBaselineAvailable(c1, 'totalWatercourseUnitsSRM'), unitsRetained: c1RetainedAvailable, unitsEnhanced: waterAllocationAvailable(c1, 'unitsEnhanced'), unitsLost: true, vhdhBespokeCompensationUnits: waterBaselineAvailable(c1, 'vhdhBespokeCompensationUnits') },
        'C-2': {},
        'C-3': { watercourseUnitsDelivered: c3DeliveryAvailable },
        'F-1': { totalWatercourseUnits: true, totalWatercourseUnitsSRM: true, unitsRetained: f1RetainedAvailable, unitsEnhanced: waterAllocationAvailable(f1, 'unitsEnhanced'), unitsLost: true, unitsRetainedWithSRM: waterAllocationAvailable(f1, 'unitsRetainedWithSRM'), vhdhBespokeCompensationUnits: waterBaselineAvailable(f1, 'vhdhBespokeCompensationUnits') },
        'F-2': {},
        'F-3': { watercourseUnitsDelivered: f3DeliveryAvailable, watercourseUnitsDeliveredWithSpatialRisk: f3DeliveryAvailable },
    } satisfies InputSheets;

    const inputTotals: InputTotals = {
        'A-1': totalsFor(a1, 'A-1'),
        'A-2': totalsFor(features.onSiteHabitatCreations, 'A-2'),
        'A-3': totalsFor(features.onSiteHabitatEnhancements, 'A-3'),
        'D-1': totalsFor(d1, 'D-1', { baselineUnitsRetained: d1RetainedAvailable, baselineUnitsEnhanced: d1RetainedAvailable, baselineUnitsRetainedWithSRM: d1RetainedAvailable }),
        'D-2': totalsFor(features.offSiteHabitatCreations, 'D-2'),
        'D-3': totalsFor(features.offSiteHabitatEnhancements, 'D-3'),
        'B-1': totalsFor(b1, 'B-1', { unitsRetained: b1AllocationAvailable, unitsEnhanced: b1AllocationAvailable }),
        'B-2': totalsFor(features.onSiteHedgerowCreations, 'B-2'),
        'B-3': totalsFor(features.onSiteHedgerowEnhancements, 'B-3'),
        'E-1': totalsFor(e1, 'E-1', { unitsRetained: e1AllocationAvailable, unitsEnhanced: e1AllocationAvailable, unitsLost: !e1.some((row) => row.hedgerowBaselineAvailability?.unitsLostError), unitsRetainedWithSRM: e1AllocationAvailable }),
        'E-2': totalsFor(features.offSiteHedgerowCreations, 'E-2'),
        'E-3': totalsFor(features.offSiteHedgerowEnhancements, 'E-3'),
        'C-1': totalsFor(c1, 'C-1', { unitsRetained: c1RetainedAvailable, unitsEnhanced: waterAllocationAvailable(c1, 'unitsEnhanced') }),
        'C-2': totalsFor(features.onSiteWatercourseCreations, 'C-2'),
        'C-3': totalsFor(c3, 'C-3', { watercourseUnitsDelivered: c3DeliveryAvailable }),
        'F-1': totalsFor(f1, 'F-1', { unitsRetained: f1RetainedAvailable, unitsEnhanced: waterAllocationAvailable(f1, 'unitsEnhanced'), unitsRetainedWithSRM: waterAllocationAvailable(f1, 'unitsRetainedWithSRM') }),
        'F-2': totalsFor(features.offSiteWatercourseCreations, 'F-2'),
        'F-3': totalsFor(f3, 'F-3', { watercourseUnitsDelivered: f3DeliveryAvailable, watercourseUnitsDeliveredWithSpatialRisk: f3DeliveryAvailable }),
    } satisfies InputTotals;

    const available = <Sheet extends WorkbookSheet>(sheet: Sheet, field: WorkbookTotalField<Sheet>) =>
        inputTotals[sheet][field].available;
    const combine = (dependencies: readonly AggregateDependency[]) =>
        dependencies.every(({ sheet, field }) => available(sheet, field));
    const baseline = {
        onSite: {
            habitat: available('A-1', 'totalHabitatUnits'),
            hedgerow: available('B-1', 'totalHedgerowUnits'),
            watercourse: available('C-1', 'totalWatercourseUnits'),
        },
        offSite: {
            habitat: available('D-1', 'totalHabitatUnits'),
            hedgerow: available('E-1', 'totalHedgerowUnits'),
            watercourse: available('F-1', 'totalWatercourseUnits'),
        },
    };
    const postIntervention = {
        onSite: {
            habitat: combine([{ sheet: 'A-1', field: 'baselineUnitsRetained' }, { sheet: 'A-1', field: 'vhdhBespokeCompensationUnits' }, { sheet: 'A-2', field: 'habitatUnitsDelivered' }, { sheet: 'A-3', field: 'habitatUnitsDelivered' }]),
            hedgerow: combine([{ sheet: 'B-1', field: 'unitsRetained' }, { sheet: 'B-2', field: 'hedgerowUnitsDelivered' }, { sheet: 'B-3', field: 'hedgerowUnitsDelivered' }]),
            watercourse: combine([{ sheet: 'C-1', field: 'unitsRetained' }, { sheet: 'C-1', field: 'vhdhBespokeCompensationUnits' }, { sheet: 'C-2', field: 'unitsDelivered' }, { sheet: 'C-3', field: 'watercourseUnitsDelivered' }]),
        },
        offSite: {
            habitat: combine([{ sheet: 'D-1', field: 'baselineUnitsRetained' }, { sheet: 'D-1', field: 'vhdhBespokeCompensationUnits' }, { sheet: 'D-2', field: 'habitatUnitsDelivered' }, { sheet: 'D-3', field: 'habitatUnitsDelivered' }]),
            hedgerow: combine([{ sheet: 'E-1', field: 'unitsRetained' }, { sheet: 'E-2', field: 'hedgerowUnitsDelivered' }, { sheet: 'E-3', field: 'hedgerowUnitsDelivered' }]),
            watercourse: combine([{ sheet: 'F-1', field: 'unitsRetained' }, { sheet: 'F-1', field: 'vhdhBespokeCompensationUnits' }, { sheet: 'F-2', field: 'unitsDelivered' }, { sheet: 'F-3', field: 'watercourseUnitsDelivered' }]),
        },
    };
    const postInterventionWithSpatialRisk = {
        offSite: {
            habitat: combine([{ sheet: 'D-1', field: 'baselineUnitsRetainedWithSRM' }, { sheet: 'D-2', field: 'habitatUnitsDeliveredWithSpatialRisk' }, { sheet: 'D-3', field: 'habitatUnitsDeliveredWithSpatialRisk' }]),
            hedgerow: combine([{ sheet: 'E-1', field: 'unitsRetainedWithSRM' }, { sheet: 'E-2', field: 'hedgerowUnitsDeliveredWithSpatialRisk' }, { sheet: 'E-3', field: 'hedgerowUnitsDeliveredWithSpatialRisk' }]),
            watercourse: combine([{ sheet: 'F-1', field: 'unitsRetainedWithSRM' }, { sheet: 'F-2', field: 'netUnitChangeWithSpatialRisk' }, { sheet: 'F-3', field: 'watercourseUnitsDeliveredWithSpatialRisk' }]),
        },
    };
    const netChange = {
        onSite: {
            habitat: baseline.onSite.habitat && postIntervention.onSite.habitat,
            hedgerow: baseline.onSite.hedgerow && postIntervention.onSite.hedgerow,
            watercourse: baseline.onSite.watercourse && postIntervention.onSite.watercourse,
        },
        offSite: {
            habitat: baseline.offSite.habitat && postIntervention.offSite.habitat,
            hedgerow: baseline.offSite.hedgerow && postIntervention.offSite.hedgerow,
            watercourse: baseline.offSite.watercourse && postIntervention.offSite.watercourse,
        },
    };
    const total = <Sheet extends WorkbookSheet>(sheet: Sheet, field: WorkbookTotalField<Sheet>) =>
        inputTotals[sheet][field].valueDecimal;
    const offSiteNetCandidates = {
        habitat: total('D-1', 'baselineUnitsRetained').plus(total('D-1', 'vhdhBespokeCompensationUnits')).plus(total('D-2', 'habitatUnitsDelivered')).plus(total('D-3', 'habitatUnitsDelivered')).minus(total('D-1', 'totalHabitatUnits')),
        hedgerow: total('E-1', 'unitsRetained').plus(total('E-2', 'hedgerowUnitsDelivered')).plus(total('E-3', 'hedgerowUnitsDelivered')).minus(total('E-1', 'totalHedgerowUnits')),
        watercourse: total('F-1', 'unitsRetained').plus(total('F-1', 'vhdhBespokeCompensationUnits')).plus(total('F-2', 'unitsDelivered')).plus(total('F-3', 'watercourseUnitsDelivered')).minus(total('F-1', 'totalWatercourseUnits')),
    };
    const netChangeWithSpatialRisk = {
        habitat: netChange.offSite.habitat && available('D-1', 'totalHabitatUnitsSRM') && postInterventionWithSpatialRisk.offSite.habitat,
        hedgerow: netChange.offSite.hedgerow && available('E-1', 'totalHedgerowUnitsSRM') && postInterventionWithSpatialRisk.offSite.hedgerow,
        watercourse: netChange.offSite.watercourse && available('F-1', 'totalWatercourseUnitsSRM') && postInterventionWithSpatialRisk.offSite.watercourse,
    };
    const srmDeduction = {
        habitat: netChange.offSite.habitat && (offSiteNetCandidates.habitat.lte(0) || netChangeWithSpatialRisk.habitat),
        hedgerow: netChange.offSite.hedgerow && (offSiteNetCandidates.hedgerow.lte(0) || netChangeWithSpatialRisk.hedgerow),
        watercourse: netChange.offSite.watercourse && (offSiteNetCandidates.watercourse.lte(0) || netChangeWithSpatialRisk.watercourse),
    };
    const combinedNetChange = {
        habitat: netChange.onSite.habitat && netChange.offSite.habitat,
        hedgerow: netChange.onSite.hedgerow && netChange.offSite.hedgerow,
        watercourse: netChange.onSite.watercourse && netChange.offSite.watercourse,
    };
    const finalNet = {
        habitat: netChange.onSite.habitat && netChange.offSite.habitat && (offSiteNetCandidates.habitat.lte(0) || netChangeWithSpatialRisk.habitat),
        hedgerow: netChange.onSite.hedgerow && netChange.offSite.hedgerow && (offSiteNetCandidates.hedgerow.lte(0) || netChangeWithSpatialRisk.hedgerow),
        watercourse: netChange.onSite.watercourse && netChange.offSite.watercourse && (offSiteNetCandidates.watercourse.lte(0) || netChangeWithSpatialRisk.watercourse),
    };

    return {
        inputSheets,
        inputTotals,
        headline: { baseline, postIntervention, postInterventionWithSpatialRisk, netChange, netChangeWithSpatialRisk, combinedNetChange, srmDeduction, finalNet },
    };
}

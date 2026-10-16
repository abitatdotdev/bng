import type { AllFeatures } from './features';
import { Decimal } from './decimal';

type Row = Record<string, unknown>;
type Unavailable = 'blank' | 'check-data';

function unavailable(row: Row, stateKey: string, result: string): boolean {
    const state = row[stateKey] as { unavailableResults?: Record<string, unknown> } | undefined;
    const status = state?.unavailableResults?.[result];
    return status === 'blank' || status === 'check-data';
}

function rowsAvailable(rows: Row[], stateKey: string, result: string): boolean {
    return rows.every((row) => !unavailable(row, stateKey, result));
}

function hedgeBaselineAvailable(rows: Row[], result: string): boolean {
    return rows.every((row) => {
        const state = row.hedgerowBaselineAvailability as {
            status?: string;
            allocationState?: string;
            unavailableResults?: Record<string, Unavailable>;
        } | undefined;
        const legacyBaselineFailure = result === 'baselineTotals' &&
            (state?.status === 'over-allocated' || state?.allocationState === 'over-allocated');
        return !legacyBaselineFailure &&
            state?.unavailableResults?.[result] !== 'blank' &&
            state?.unavailableResults?.[result] !== 'check-data';
    });
}

function waterBaselineAvailable(rows: Row[], result: string): boolean {
    return rowsAvailable(rows, 'watercourseBaselineAvailability', result);
}

function waterAllocationAvailable(rows: Row[], result: string): boolean {
    return rows.every((row) => {
        const state = row.watercourseBaselineAvailability as {
            retainedExceedsLength?: boolean;
            unavailableResults?: Record<string, Unavailable>;
        } | undefined;
        return !state?.retainedExceedsLength &&
            state?.unavailableResults?.[result] !== 'check-data';
    });
}

function deliveryBelowBaseline(rows: Row[]): boolean {
    return rows.some((row) => {
        const baseline = row.baseline as Row | undefined;
        const delivered = row.watercourseUnitsDeliveredDecimal;
        const required = baseline?.unitsEnhancedDecimal;
        return Decimal.isDecimal(delivered) && Decimal.isDecimal(required) && delivered.lessThan(required);
    });
}

type InputTotal = { value: number; valueDecimal: Decimal; available: boolean };

const TOTAL_FIELDS: Record<string, string[]> = {
    'A-1': ['area', 'totalHabitatUnits', 'areaRetained', 'areaEnhanced', 'baselineUnitsRetained', 'baselineUnitsEnhanced', 'areaHabitatLost', 'unitsLost', 'vhdhBespokeCompensationUnits'],
    'A-2': ['area', 'habitatUnitsDelivered'],
    'A-3': ['area', 'habitatUnitsDelivered'],
    'D-1': ['area', 'totalHabitatUnitsSRM', 'totalHabitatUnits', 'areaRetained', 'areaEnhanced', 'baselineUnitsRetained', 'baselineUnitsEnhanced', 'baselineUnitsRetainedWithSRM', 'areaHabitatLost', 'unitsLost', 'vhdhBespokeCompensationUnits'],
    'D-2': ['area', 'habitatUnitsDeliveredWithSpatialRisk', 'habitatUnitsDelivered'],
    'D-3': ['area', 'habitatUnitsDeliveredWithSpatialRisk', 'habitatUnitsDelivered'],
    'B-1': ['length', 'totalHedgerowUnits', 'lengthRetained', 'lengthEnhanced', 'unitsRetained', 'unitsEnhanced', 'lengthLost', 'unitsLost'],
    'B-2': ['length', 'hedgerowUnitsDelivered'],
    'B-3': ['length', 'hedgerowUnitsDelivered'],
    'E-1': ['length', 'totalHedgerowUnitsSRM', 'totalHedgerowUnits', 'lengthRetained', 'lengthEnhanced', 'unitsRetained', 'unitsEnhanced', 'lengthLost', 'unitsLost', 'baselineUnitsRetainedWithSRM'],
    'E-2': ['length', 'hedgerowUnitsDeliveredWithSpatialRisk', 'hedgerowUnitsDelivered'],
    'E-3': ['length', 'hedgerowUnitsDeliveredWithSpatialRisk', 'hedgerowUnitsDelivered'],
    'C-1': ['length', 'totalWatercourseUnits', 'lengthRetained', 'lengthEnhanced', 'unitsRetained', 'unitsEnhanced', 'lengthLost', 'unitsLost', 'vhdhBespokeCompensationUnits'],
    'C-2': ['length', 'unitsDelivered'],
    'C-3': ['length', 'watercourseUnitsDelivered'],
    'F-1': ['length', 'totalWatercourseUnitsSRM', 'totalWatercourseUnits', 'lengthRetained', 'lengthEnhanced', 'unitsRetained', 'unitsEnhanced', 'lengthLost', 'unitsLost', 'unitsRetainedWithSRM', 'vhdhBespokeCompensationUnits'],
    'F-2': ['length', 'netUnitChangeWithSpatialRisk', 'unitsDelivered'],
    'F-3': ['length', 'watercourseUnitsDeliveredWithSpatialRisk', 'watercourseUnitsDelivered'],
};

function totalValue(rows: Row[], field: string, positiveOnly = false): Decimal {
    return rows.reduce((sum, row) => {
        const exact = row[`${field}Decimal`];
        const value = Decimal.isDecimal(exact) ? exact :
            typeof row[field] === 'number' && Number.isFinite(row[field]) ? new Decimal(row[field] as number) : undefined;
        if (!value || (positiveOnly && !value.greaterThan(0))) return sum;
        return sum.plus(value);
    }, new Decimal(0));
}

function totalsFor(rows: Row[], sheet: string): Record<string, InputTotal> {
    const allocationGates: Record<string, Record<string, boolean>> = {
        'D-1': {
            baselineUnitsRetained: rowsAvailable(rows, 'areaCalculationAvailability', 'areaHabitatLost'),
            baselineUnitsEnhanced: rowsAvailable(rows, 'areaCalculationAvailability', 'areaHabitatLost'),
            baselineUnitsRetainedWithSRM: rowsAvailable(rows, 'areaCalculationAvailability', 'areaHabitatLost'),
        },
        'B-1': {
            unitsRetained: hedgeBaselineAvailable(rows, 'lengthLost'),
            unitsEnhanced: hedgeBaselineAvailable(rows, 'lengthLost'),
        },
        'E-1': {
            unitsRetained: hedgeBaselineAvailable(rows, 'lengthLost'),
            unitsEnhanced: hedgeBaselineAvailable(rows, 'lengthLost'),
            baselineUnitsRetainedWithSRM: hedgeBaselineAvailable(rows, 'lengthLost'),
        },
        'C-1': {
            unitsRetained: waterAllocationAvailable(rows, 'unitsRetained'),
            unitsEnhanced: waterAllocationAvailable(rows, 'unitsEnhanced'),
        },
        'F-1': {
            unitsRetained: waterAllocationAvailable(rows, 'unitsRetained'),
            unitsEnhanced: waterAllocationAvailable(rows, 'unitsEnhanced'),
            unitsRetainedWithSRM: waterAllocationAvailable(rows, 'unitsRetainedWithSRM'),
        },
    };
    const aggregateError = sheet === 'C-3' || sheet === 'F-3' ? deliveryBelowBaseline(rows) : false;
    return Object.fromEntries(TOTAL_FIELDS[sheet]!.map((field) => {
        const positiveOnly = (sheet === 'C-1' || sheet === 'F-1') && field === 'unitsLost';
        const explicitGate = allocationGates[sheet]?.[field];
        const hedgeErrorGate = sheet === 'E-1' && field === 'unitsLost' && rows.some((row) =>
            Boolean((row.hedgerowBaselineAvailability as Row | undefined)?.unitsLostError));
        const gate = explicitGate ?? (hedgeErrorGate
            ? false
            : aggregateError && ((sheet === 'C-3' && field === 'watercourseUnitsDelivered') ||
                (sheet === 'F-3' && (field === 'watercourseUnitsDelivered' || field === 'watercourseUnitsDeliveredWithSpatialRisk')))
            ? false
            : true);
        const valueDecimal = totalValue(rows, field, positiveOnly);
        return [field, { value: valueDecimal.toNumber(), valueDecimal, available: gate }];
    }));
}

/** Availability follows the explicit error dependencies of workbook column totals. */
export function calculateWorkbookAggregateAvailability(features: AllFeatures) {
    const a1 = features.onSiteHabitatBaselines as unknown as Row[];
    const d1 = features.offSiteHabitatBaselines as unknown as Row[];
    const b1 = features.onSiteHedgerowBaselines as unknown as Row[];
    const e1 = features.offSiteHedgerowBaselines as unknown as Row[];
    const c1 = features.onSiteWatercourseBaselines as unknown as Row[];
    const f1 = features.offSiteWatercourseBaselines as unknown as Row[];
    const c3 = features.onSiteWatercourseEnhancements as unknown as Row[];
    const f3 = features.offSiteWatercourseEnhancements as unknown as Row[];

    const inputSheets = {
        'A-1': {
            areaHabitatLost: true,
            unitsLost: true,
            totalHabitatUnits: true,
            totalHabitatUnitsSRM: true,
            vhdhBespokeCompensationUnits: true,
        },
        'D-1': {
            areaHabitatLost: true,
            unitsLost: true,
            totalHabitatUnits: true,
            totalHabitatUnitsSRM: true,
            baselineUnitsRetained: rowsAvailable(d1, 'areaCalculationAvailability', 'areaHabitatLost'),
            baselineUnitsEnhanced: rowsAvailable(d1, 'areaCalculationAvailability', 'areaHabitatLost'),
            baselineUnitsRetainedWithSRM: rowsAvailable(d1, 'areaCalculationAvailability', 'areaHabitatLost'),
            vhdhBespokeCompensationUnits: true,
        },
        'B-1': {
            totalHedgerowUnits: true,
            totalHedgerowUnitsSRM: true,
            unitsRetained: hedgeBaselineAvailable(b1, 'lengthLost'),
            unitsEnhanced: hedgeBaselineAvailable(b1, 'lengthLost'),
        },
        'E-1': {
            totalHedgerowUnits: true,
            totalHedgerowUnitsSRM: true,
            unitsRetained: hedgeBaselineAvailable(e1, 'lengthLost'),
            unitsEnhanced: hedgeBaselineAvailable(e1, 'lengthLost'),
            unitsLost: !e1.some((row) => Boolean((row.hedgerowBaselineAvailability as Row | undefined)?.unitsLostError)),
            baselineUnitsRetainedWithSRM: hedgeBaselineAvailable(e1, 'lengthLost'),
        },
        'C-1': {
            totalWatercourseUnits: true,
            totalWatercourseUnitsSRM: waterBaselineAvailable(c1, 'totalWatercourseUnitsSRM'),
            unitsRetained: waterAllocationAvailable(c1, 'unitsRetained'),
            unitsEnhanced: waterAllocationAvailable(c1, 'unitsEnhanced'),
            unitsLost: true,
            vhdhBespokeCompensationUnits: waterBaselineAvailable(c1, 'vhdhBespokeCompensationUnits'),
        },
        'F-1': {
            totalWatercourseUnits: true,
            totalWatercourseUnitsSRM: true,
            unitsRetained: waterAllocationAvailable(f1, 'unitsRetained'),
            unitsEnhanced: waterAllocationAvailable(f1, 'unitsEnhanced'),
            unitsLost: true,
            unitsRetainedWithSRM: waterAllocationAvailable(f1, 'unitsRetainedWithSRM'),
            vhdhBespokeCompensationUnits: waterBaselineAvailable(f1, 'vhdhBespokeCompensationUnits'),
        },
        'C-3': {
            watercourseUnitsDelivered: !deliveryBelowBaseline(c3),
        },
        'F-3': {
            watercourseUnitsDelivered: !deliveryBelowBaseline(f3),
            watercourseUnitsDeliveredWithSpatialRisk: !deliveryBelowBaseline(f3),
        },
    };
    const inputTotals = {
        'A-1': totalsFor(a1, 'A-1'),
        'A-2': totalsFor(features.onSiteHabitatCreations as unknown as Row[], 'A-2'),
        'A-3': totalsFor(features.onSiteHabitatEnhancements as unknown as Row[], 'A-3'),
        'D-1': totalsFor(d1, 'D-1'),
        'D-2': totalsFor(features.offSiteHabitatCreations as unknown as Row[], 'D-2'),
        'D-3': totalsFor(features.offSiteHabitatEnhancements as unknown as Row[], 'D-3'),
        'B-1': totalsFor(b1, 'B-1'),
        'B-2': totalsFor(features.onSiteHedgerowCreations as unknown as Row[], 'B-2'),
        'B-3': totalsFor(features.onSiteHedgerowEnhancements as unknown as Row[], 'B-3'),
        'E-1': totalsFor(e1, 'E-1'),
        'E-2': totalsFor(features.offSiteHedgerowCreations as unknown as Row[], 'E-2'),
        'E-3': totalsFor(features.offSiteHedgerowEnhancements as unknown as Row[], 'E-3'),
        'C-1': totalsFor(c1, 'C-1'),
        'C-2': totalsFor(features.onSiteWatercourseCreations as unknown as Row[], 'C-2'),
        'C-3': totalsFor(c3, 'C-3'),
        'F-1': totalsFor(f1, 'F-1'),
        'F-2': totalsFor(features.offSiteWatercourseCreations as unknown as Row[], 'F-2'),
        'F-3': totalsFor(f3, 'F-3'),
    };

    const available = (sheet: keyof typeof inputTotals, field: string) =>
        inputTotals[sheet][field as keyof (typeof inputTotals)[typeof sheet]]?.available ?? false;
    const combine = (dependencies: [keyof typeof inputTotals, string][]) =>
        dependencies.every(([sheet, field]) => available(sheet, field));
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
            habitat: combine([['A-1', 'baselineUnitsRetained'], ['A-1', 'vhdhBespokeCompensationUnits'], ['A-2', 'habitatUnitsDelivered'], ['A-3', 'habitatUnitsDelivered']]),
            hedgerow: combine([['B-1', 'unitsRetained'], ['B-2', 'hedgerowUnitsDelivered'], ['B-3', 'hedgerowUnitsDelivered']]),
            watercourse: combine([['C-1', 'unitsRetained'], ['C-1', 'vhdhBespokeCompensationUnits'], ['C-2', 'unitsDelivered'], ['C-3', 'watercourseUnitsDelivered']]),
        },
        offSite: {
            habitat: combine([['D-1', 'baselineUnitsRetained'], ['D-1', 'vhdhBespokeCompensationUnits'], ['D-2', 'habitatUnitsDelivered'], ['D-3', 'habitatUnitsDelivered']]),
            hedgerow: combine([['E-1', 'unitsRetained'], ['E-2', 'hedgerowUnitsDelivered'], ['E-3', 'hedgerowUnitsDelivered']]),
            watercourse: combine([['F-1', 'unitsRetained'], ['F-1', 'vhdhBespokeCompensationUnits'], ['F-2', 'unitsDelivered'], ['F-3', 'watercourseUnitsDelivered']]),
        },
    };
    const postInterventionWithSpatialRisk = {
        offSite: {
            habitat: combine([['D-1', 'baselineUnitsRetainedWithSRM'], ['D-2', 'habitatUnitsDeliveredWithSpatialRisk'], ['D-3', 'habitatUnitsDeliveredWithSpatialRisk']]),
            hedgerow: combine([['E-1', 'baselineUnitsRetainedWithSRM'], ['E-2', 'hedgerowUnitsDeliveredWithSpatialRisk'], ['E-3', 'hedgerowUnitsDeliveredWithSpatialRisk']]),
            watercourse: combine([['F-1', 'unitsRetainedWithSRM'], ['F-2', 'netUnitChangeWithSpatialRisk'], ['F-3', 'watercourseUnitsDeliveredWithSpatialRisk']]),
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
    const total = (sheet: keyof typeof inputTotals, field: string) =>
        inputTotals[sheet][field as keyof (typeof inputTotals)[typeof sheet]]?.valueDecimal ?? new Decimal(0);
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

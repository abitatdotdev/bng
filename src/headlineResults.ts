import { Decimal, type Quantity, toDecimal } from './decimal';
import * as v from 'valibot';

import { onSiteHabitatBaselineSchema } from './onSite/habitatBaseline';
import { onSiteHabitatCreationSchema } from './onSite/habitatCreation';
import { onSiteHabitatEnhancementSchema } from './onSite/habitatEnhancement';
import { offSiteHabitatBaselineSchema } from './offSite/habitatBaseline';
import { offSiteHabitatCreationSchema } from './offSite/habitatCreation';
import { offSiteHabitatEnhancementSchema } from './offSite/habitatEnhancement';
import { onSiteHedgerowBaselineSchema } from './onSite/hedgerowBaseline';
import { onSiteHedgerowCreationSchema } from './onSite/hedgerowCreation';
import { onSiteHedgerowEnhancementSchema } from './onSite/hedgerowEnhancement';
import { offSiteHedgerowBaselineSchema } from './offSite/hedgerowBaseline';
import { offSiteHedgerowCreationSchema } from './offSite/hedgerowCreation';
import { offSiteHedgerowEnhancementSchema } from './offSite/hedgerowEnhancement';
import { onSiteWatercourseBaselineSchema } from './onSite/watercourseBaseline';
import { onSiteWatercourseCreationSchema } from './onSite/watercourseCreation';
import { onSiteWatercourseEnhancementSchema } from './onSite/watercourseEnhancement';
import { offSiteWatercourseBaselineSchema } from './offSite/watercourseBaseline';
import { offSiteWatercourseCreationSchema } from './offSite/watercourseCreation';
import { offSiteWatercourseEnhancementSchema } from './offSite/watercourseEnhancement';
import type { AllFeatures } from './features';
import type { TradingSummaries } from './tradingSummaries';

const ZERO = new Decimal(0);

/** Sum a numeric field across rows, staying in Decimal until the caller converts. */
function sumD<T>(rows: T[], pick: (row: T) => number | Decimal): Decimal {
    return rows.reduce((acc: Decimal, row) => acc.plus(pick(row)), ZERO);
}

// --- On-site habitat ----------------------------------------------------------

function onSiteHabitatBaselineD(baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[]): Decimal {
    return sumD(baselines, (b) => b.totalHabitatUnitsDecimal);
}

/**
 * Calculates the total on-site habitat baseline units
 * Sums the totalHabitatUnits from all A-1 baseline entries
 * Corresponds to cell H8 in the Headline Results sheet
 */
export function calculateOnSiteHabitatBaseline(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[],
): number {
    const result = calculateOnSiteHabitatBaselineDecimal(baselines);
    return typeof result === 'string' ? result : result.toNumber();
}

function onSiteHabitatPostInterventionD(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteHabitatEnhancementSchema>[],
): Decimal {
    return sumD(creations, (c) => c.habitatUnitsDeliveredDecimal)
        .plus(sumD(enhancements, (e) => e.habitatUnitsDeliveredDecimal))
        .plus(
            sumD(baselines, (b) =>
                new Decimal(b.baselineUnitsRetainedDecimal).plus(b.vhdhBespokeCompensationUnitsDecimal),
            ),
        );
}

/**
 * Calculates the total on-site habitat units after intervention
 * Sums retained/enhanced units from A-1 (via special compensation allowances)
 * + created units from A-2
 * + enhanced units from A-3
 * Corresponds to cell H12 in the Headline Results sheet
 */
export function calculateOnSiteHabitatPostIntervention(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteHabitatEnhancementSchema>[],
): number {
    const result = calculateOnSiteHabitatPostInterventionDecimal(baselines, creations, enhancements);
    return typeof result === 'string' ? result : result.toNumber();
}

function netChangeD(baseline: Decimal, postIntervention: Decimal): { unitsD: Decimal; percentageD: Decimal } {
    const unitsD = postIntervention.minus(baseline);
    const percentageD = baseline.isZero() ? ZERO : unitsD.div(baseline).mul(100);
    return { unitsD, percentageD };
}

/**
 * Calculates the net change in on-site habitat units and percentage
 * Corresponds to cells H16 and I16 in the Headline Results sheet
 */
export function calculateOnSiteHabitatNetChange(
    baseline: Quantity,
    postIntervention: Quantity,
): {
    units: number;
    unitsDecimal: Decimal;
    percentage: number;
    percentageDecimal: Decimal;
} {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return {
        units: unitsD.toNumber(),
        unitsDecimal: unitsD,
        percentage: percentageD.toNumber(),
        percentageDecimal: percentageD,
    };
}

// --- Off-site habitat ---------------------------------------------------------

function offSiteHabitatBaselineD(baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[]): Decimal {
    return sumD(baselines, (b) => b.totalHabitatUnitsDecimal);
}

/**
 * Calculates the total off-site habitat baseline units
 * Sums the totalHabitatUnits from all D-1 baseline entries
 * Corresponds to cell H20 in the Headline Results sheet
 */
export function calculateOffSiteHabitatBaseline(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
): number {
    const result = calculateOffSiteHabitatBaselineDecimal(baselines);
    return typeof result === 'string' ? result : result.toNumber();
}

function offSiteHabitatPostInterventionD(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHabitatEnhancementSchema>[],
): Decimal {
    return sumD(creations, (c) => c.habitatUnitsDeliveredDecimal)
        .plus(sumD(enhancements, (e) => e.habitatUnitsDeliveredDecimal))
        .plus(
            sumD(baselines, (b) =>
                new Decimal(b.baselineUnitsRetainedDecimal).plus(b.vhdhBespokeCompensationUnitsDecimal),
            ),
        );
}

/**
 * Calculates the total off-site habitat units after intervention
 * Sums retained/enhanced units from D-1 + created units from D-2 + enhanced units from D-3
 * Corresponds to cell H24 in the Headline Results sheet
 */
export function calculateOffSiteHabitatPostIntervention(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHabitatEnhancementSchema>[],
): number {
    const result = calculateOffSiteHabitatPostInterventionDecimal(baselines, creations, enhancements);
    return typeof result === 'string' ? result : result.toNumber();
}

/**
 * Calculates the net change in off-site habitat units and percentage
 * Corresponds to cells H28 and I28 in the Headline Results sheet
 */
export function calculateOffSiteHabitatNetChange(
    baseline: Quantity,
    postIntervention: Quantity,
): {
    units: number;
    unitsDecimal: Decimal;
    percentage: number;
    percentageDecimal: Decimal;
} {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return {
        units: unitsD.toNumber(),
        unitsDecimal: unitsD,
        percentage: percentageD.toNumber(),
        percentageDecimal: percentageD,
    };
}

function offSiteHabitatNetChangeWithSRMD(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHabitatEnhancementSchema>[],
    netChangeUnitsD: Decimal,
): Decimal | 'N/A' {
    if (netChangeUnitsD.lte(0)) return 'N/A' as const;

    const baselineWithSRM = sumD(baselines, (b) => b.totalHabitatUnitsSRMDecimal);
    const postInterventionWithSRM = sumD(baselines, (b) => b.baselineUnitsRetainedWithSRMDecimal)
        .plus(sumD(creations, (c) => c.habitatUnitsDeliveredWithSpatialRiskDecimal))
        .plus(sumD(enhancements, (e) => e.habitatUnitsDeliveredWithSpatialRiskDecimal));

    return postInterventionWithSRM.minus(baselineWithSRM);
}

/**
 * Calculates the net change in off-site habitat units WITH Spatial Risk Multiplier applied
 * SRM is only applied to off-site gains (positive net change)
 * Corresponds to cells H32 and I32 (merged) in the Headline Results sheet
 * NOTE: there is another hidden column (L) that contains these sums
 */
export function calculateOffSiteHabitatNetChangeWithSRM(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHabitatEnhancementSchema>[],
    netChangeUnits: Quantity,
): number | 'N/A' {
    const result = calculateOffSiteHabitatNetChangeWithSRMDecimal(
        baselines,
        creations,
        enhancements,
        netChangeUnits,
    );
    return typeof result === 'string' ? result : result.toNumber();
}

// --- On-site hedgerow ---------------------------------------------------------

function onSiteHedgerowBaselineD(baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[]): Decimal {
    return sumD(baselines, (b) => b.totalHedgerowUnitsDecimal);
}

/**
 * Calculates the total on-site hedgerow baseline units
 * Sums the totalHedgerowUnits from all B-1 baseline entries
 * Corresponds to cell H9 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowBaseline(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[],
): number {
    const result = calculateOnSiteHedgerowBaselineDecimal(baselines);
    return typeof result === 'string' ? result : result.toNumber();
}

function onSiteHedgerowPostInterventionD(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteHedgerowEnhancementSchema>[],
): Decimal {
    return sumD(creations, (c) => c.hedgerowUnitsDeliveredDecimal)
        .plus(sumD(enhancements, (e) => e.hedgerowUnitsDeliveredDecimal))
        .plus(sumD(baselines, (b) => b.unitsRetainedDecimal));
}

/**
 * Calculates the total on-site hedgerow units after intervention
 * Sums retained units from B-1 + created units from B-2 + enhanced units from B-3
 * Corresponds to cell H13 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowPostIntervention(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteHedgerowEnhancementSchema>[],
): number {
    const result = calculateOnSiteHedgerowPostInterventionDecimal(baselines, creations, enhancements);
    return typeof result === 'string' ? result : result.toNumber();
}

/**
 * Calculates the net change in on-site hedgerow units and percentage
 * Corresponds to cells H17 and J17 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowNetChange(
    baseline: Quantity,
    postIntervention: Quantity,
): {
    units: number;
    unitsDecimal: Decimal;
    percentage: number;
    percentageDecimal: Decimal;
} {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return {
        units: unitsD.toNumber(),
        unitsDecimal: unitsD,
        percentage: percentageD.toNumber(),
        percentageDecimal: percentageD,
    };
}

// --- Off-site hedgerow --------------------------------------------------------

function offSiteHedgerowBaselineD(baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[]): Decimal {
    return sumD(baselines, (b) => b.totalHedgerowUnitsDecimal);
}

/**
 * Calculates the total off-site hedgerow baseline units
 * Sums the totalHedgerowUnits from all E-1 baseline entries
 * Corresponds to cell H21 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowBaseline(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
): number {
    const result = calculateOffSiteHedgerowBaselineDecimal(baselines);
    return typeof result === 'string' ? result : result.toNumber();
}

function offSiteHedgerowPostInterventionD(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHedgerowEnhancementSchema>[],
): Decimal {
    return sumD(baselines, (b) => b.unitsRetainedDecimal)
        .plus(sumD(creations, (c) => c.hedgerowUnitsDeliveredDecimal))
        .plus(sumD(enhancements, (e) => e.hedgerowUnitsDeliveredDecimal));
}

/**
 * Calculates the total off-site hedgerow units after intervention
 * Sums retained/enhanced units from E-1 + created units from E-2 + enhanced units from E-3
 * Corresponds to cell H25 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowPostIntervention(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHedgerowEnhancementSchema>[],
): number {
    const result = calculateOffSiteHedgerowPostInterventionDecimal(baselines, creations, enhancements);
    return typeof result === 'string' ? result : result.toNumber();
}

/**
 * Calculates the net change in off-site hedgerow units and percentage
 * Corresponds to cells H29 and I29 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowNetChange(
    baseline: Quantity,
    postIntervention: Quantity,
): {
    units: number;
    unitsDecimal: Decimal;
    percentage: number;
    percentageDecimal: Decimal;
} {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return {
        units: unitsD.toNumber(),
        unitsDecimal: unitsD,
        percentage: percentageD.toNumber(),
        percentageDecimal: percentageD,
    };
}

function offSiteHedgerowNetChangeWithSRMD(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHedgerowEnhancementSchema>[],
    netChangeUnitsD: Decimal,
): Decimal | 'N/A' {
    if (netChangeUnitsD.lte(0)) return 'N/A' as const;

    const baselineWithSRM = sumD(baselines, (b) => b.totalHedgerowUnitsSRMDecimal);
    const retainedAndEnhancedWithSRM = sumD(baselines, (b) =>
        new Decimal(b.unitsRetainedDecimal).mul(b.spatialRiskMultiplierDecimal),
    );
    const createdWithSRM = sumD(creations, (c) => c.hedgerowUnitsDeliveredWithSpatialRiskDecimal);
    const enhancedWithSRM = sumD(enhancements, (e) => e.hedgerowUnitsDeliveredWithSpatialRiskDecimal);

    return retainedAndEnhancedWithSRM.plus(createdWithSRM).plus(enhancedWithSRM).minus(baselineWithSRM);
}

/**
 * Calculates the net change in off-site hedgerow units WITH Spatial Risk Multiplier applied
 * SRM is only applied to off-site gains (positive net change)
 * Corresponds to cells H33 and I33 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowNetChangeWithSRM(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHedgerowEnhancementSchema>[],
    netChangeUnits: Quantity,
): number | 'N/A' {
    const result = calculateOffSiteHedgerowNetChangeWithSRMDecimal(
        baselines,
        creations,
        enhancements,
        netChangeUnits,
    );
    return typeof result === 'string' ? result : result.toNumber();
}

// --- On-site watercourse ------------------------------------------------------

function onSiteWatercourseBaselineD(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[],
): Decimal {
    return sumD(baselines, (b) => b.totalWatercourseUnitsDecimal);
}

/**
 * Calculates the total on-site watercourse baseline units
 * Sums the totalWatercourseUnits from all C-1 baseline entries
 * Corresponds to cell H10 in the Headline Results sheet
 */
export function calculateOnSiteWatercourseBaseline(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[],
): number {
    const result = calculateOnSiteWatercourseBaselineDecimal(baselines);
    return typeof result === 'string' ? result : result.toNumber();
}

function onSiteWatercoursePostInterventionD(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteWatercourseEnhancementSchema>[],
): Decimal {
    return sumD(creations, (c) => c.unitsDeliveredDecimal)
        .plus(sumD(enhancements, (e) => e.watercourseUnitsDeliveredDecimal))
        .plus(sumD(baselines, (b) => b.unitsRetainedDecimal))
        .plus(sumD(baselines, (b) => b.vhdhBespokeCompensationUnitsDecimal));
}

/**
 * Calculates the total on-site watercourse units after intervention
 * Corresponds to cell H14 in the Headline Results sheet
 */
export function calculateOnSiteWatercoursePostIntervention(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteWatercourseEnhancementSchema>[],
): number {
    const result = calculateOnSiteWatercoursePostInterventionDecimal(baselines, creations, enhancements);
    return typeof result === 'string' ? result : result.toNumber();
}

/**
 * Calculates the net change in on-site watercourse units and percentage
 * Corresponds to cells H18 and J18 in the Headline Results sheet
 */
export function calculateOnSiteWatercourseNetChange(
    baseline: Quantity,
    postIntervention: Quantity,
): {
    units: number;
    unitsDecimal: Decimal;
    percentage: number;
    percentageDecimal: Decimal;
} {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return {
        units: unitsD.toNumber(),
        unitsDecimal: unitsD,
        percentage: percentageD.toNumber(),
        percentageDecimal: percentageD,
    };
}

// --- Off-site watercourse -----------------------------------------------------

function offSiteWatercourseBaselineD(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
): Decimal {
    return sumD(baselines, (b) => b.totalWatercourseUnitsDecimal);
}

/**
 * Calculates the total off-site watercourse baseline units
 * Sums the totalWatercourseUnits from all F-1 baseline entries
 * Corresponds to cell H22 in the Headline Results sheet
 */
export function calculateOffSiteWatercourseBaseline(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
): number {
    const result = calculateOffSiteWatercourseBaselineDecimal(baselines);
    return typeof result === 'string' ? result : result.toNumber();
}

function offSiteWatercoursePostInterventionD(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[],
): Decimal {
    return sumD(baselines, (b) =>
        new Decimal(b.unitsRetainedDecimal).plus(b.vhdhBespokeCompensationUnitsDecimal ?? 0),
    )
        .plus(sumD(creations, (c) => c.unitsDeliveredDecimal))
        .plus(sumD(enhancements, (e) => e.watercourseUnitsDeliveredDecimal));
}

/**
 * Calculates the total off-site watercourse units after intervention
 * Sums retained and bespoke compensation units from F-1, creation from F-2 and enhancement from F-3
 * Corresponds to cell H26 in the Headline Results sheet
 */
export function calculateOffSiteWatercoursePostIntervention(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[],
): number {
    const result = calculateOffSiteWatercoursePostInterventionDecimal(baselines, creations, enhancements);
    return typeof result === 'string' ? result : result.toNumber();
}

/**
 * Calculates the net change in off-site watercourse units and percentage
 * Corresponds to cells H30 and I30 in the Headline Results sheet
 */
export function calculateOffSiteWatercourseNetChange(
    baseline: Quantity,
    postIntervention: Quantity,
): {
    units: number;
    unitsDecimal: Decimal;
    percentage: number;
    percentageDecimal: Decimal;
} {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return {
        units: unitsD.toNumber(),
        unitsDecimal: unitsD,
        percentage: percentageD.toNumber(),
        percentageDecimal: percentageD,
    };
}

function offSiteWatercourseNetChangeWithSRMD(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[],
    netChangeUnitsD: Decimal,
): Decimal | 'N/A' {
    if (netChangeUnitsD.lte(0)) return 'N/A' as const;

    // L26 includes retained, created, enhanced and F-1 compensation units after SRM.
    const baselineWithSRM = sumD(baselines, (b) => b.totalWatercourseUnitsSRMDecimal);
    const retainedAndEnhancedWithSRM = sumD(baselines, (b) =>
        new Decimal(b.unitsRetainedDecimal)
            .plus(b.vhdhBespokeCompensationUnitsDecimal ?? 0)
            .mul(b.spatialRiskMultiplierDecimal),
    );
    const createdWithSRM = sumD(creations, (c) => c.netUnitChangeWithSpatialRiskDecimal);
    const enhancedWithSRM = sumD(enhancements, (e) => e.watercourseUnitsDeliveredWithSpatialRiskDecimal);

    return retainedAndEnhancedWithSRM.plus(createdWithSRM).plus(enhancedWithSRM).minus(baselineWithSRM);
}

/**
 * Calculates the net change in off-site watercourse units WITH Spatial Risk Multiplier applied
 * SRM is only applied to off-site gains (positive net change)
 * Corresponds to cells H34 and I34 in the Headline Results sheet
 */
export function calculateOffSiteWatercourseNetChangeWithSRM(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[],
    netChangeUnits: Quantity,
): number | 'N/A' {
    const result = calculateOffSiteWatercourseNetChangeWithSRMDecimal(
        baselines,
        creations,
        enhancements,
        netChangeUnits,
    );
    return typeof result === 'string' ? result : result.toNumber();
}

// --- Aggregations -------------------------------------------------------------

/**
 * Calculates the combined net unit change across all habitat types
 * Sums on-site and off-site net changes for habitats, hedgerows, and watercourses
 * Corresponds to cells H38, H39, H40 in the Headline Results sheet
 */
export function calculateCombinedNetUnitChange(
    onSiteHabitatNetChange: Quantity,
    offSiteHabitatNetChange: Quantity,
    onSiteHedgerowNetChange: Quantity,
    offSiteHedgerowNetChange: Quantity,
    onSiteWatercourseNetChange: Quantity,
    offSiteWatercourseNetChange: Quantity,
) {
    const habitatDecimal = new Decimal(onSiteHabitatNetChange).plus(offSiteHabitatNetChange);
    const hedgerowDecimal = new Decimal(onSiteHedgerowNetChange).plus(offSiteHedgerowNetChange);
    const watercourseDecimal = new Decimal(onSiteWatercourseNetChange).plus(offSiteWatercourseNetChange);
    return {
        habitat: habitatDecimal.toNumber(),
        habitatDecimal,
        hedgerow: hedgerowDecimal.toNumber(),
        hedgerowDecimal,
        watercourse: watercourseDecimal.toNumber(),
        watercourseDecimal,
    };
}

function srmDeductionD(change: Decimal, changeWithSRM: Quantity | 'N/A'): Decimal {
    return change.lte(0) || changeWithSRM === 'N/A' ? new Decimal(0) : change.minus(changeWithSRM);
}

/**
 * Calculates the total Spatial Risk Multiplier deductions
 * SRM deductions = the difference between regular net change and net change with SRM applied
 * This represents the units "lost" due to spatial risk
 * Corresponds to cells H41, H42, H43 in the Headline Results sheet
 */
export function calculateTotalSRMDeductions(
    offSiteHabitatNetChange: Quantity,
    offSiteHabitatNetChangeWithSRM: Quantity | 'N/A',
    offSiteHedgerowNetChange: Quantity,
    offSiteHedgerowNetChangeWithSRM: Quantity | 'N/A',
    offSiteWatercourseNetChange: Quantity,
    offSiteWatercourseNetChangeWithSRM: Quantity | 'N/A',
) {
    const habitatDecimal = srmDeductionD(
        new Decimal(offSiteHabitatNetChange),
        offSiteHabitatNetChangeWithSRM,
    );
    const hedgerowDecimal = srmDeductionD(
        new Decimal(offSiteHedgerowNetChange),
        offSiteHedgerowNetChangeWithSRM,
    );
    const watercourseDecimal = srmDeductionD(
        new Decimal(offSiteWatercourseNetChange),
        offSiteWatercourseNetChangeWithSRM,
    );
    return {
        habitat: habitatDecimal.toNumber(),
        habitatDecimal,
        hedgerow: hedgerowDecimal.toNumber(),
        hedgerowDecimal,
        watercourse: watercourseDecimal.toNumber(),
        watercourseDecimal,
    };
}

function zeroNaND(x: Decimal | 'N/A'): Decimal {
    return x === 'N/A' ? ZERO : x;
}

/**
 * Calculates the final total net unit change with SRM adjustments applied
 * This is the ultimate summary metric: combined net change minus SRM deductions
 * Alternatively: sum of all on-site net changes + all off-site net changes WITH SRM
 * Corresponds to cells H50, H51, H52 in the Headline Results sheet
 */
export function calculateFinalTotalNetUnitChange(
    combinedNetUnitChange: ReturnType<typeof calculateCombinedNetUnitChange>,
    totalSRMDeductions: ReturnType<typeof calculateTotalSRMDeductions>,
) {
    const habitatDecimal = new Decimal(combinedNetUnitChange.habitatDecimal).minus(
        totalSRMDeductions.habitatDecimal,
    );
    const hedgerowDecimal = new Decimal(combinedNetUnitChange.hedgerowDecimal).minus(
        totalSRMDeductions.hedgerowDecimal,
    );
    const watercourseDecimal = new Decimal(combinedNetUnitChange.watercourseDecimal).minus(
        totalSRMDeductions.watercourseDecimal,
    );
    return {
        habitat: habitatDecimal.toNumber(),
        habitatDecimal,
        hedgerow: hedgerowDecimal.toNumber(),
        hedgerowDecimal,
        watercourse: watercourseDecimal.toNumber(),
        watercourseDecimal,
    };
}

export function calculateTotalNetPercentageChange(
    totalNetUnitChange: ReturnType<typeof calculateFinalTotalNetUnitChange>,
    onSiteHabitatBaseline: Quantity,
    onSiteHedgerowBaseline: Quantity,
    onSiteWatercourseBaseline: Quantity,
) {
    const habitatDecimal = toDecimal(
        new Decimal(onSiteHabitatBaseline).isZero()
            ? 0
            : new Decimal(totalNetUnitChange.habitatDecimal).div(onSiteHabitatBaseline),
    );
    const hedgerowDecimal = toDecimal(
        new Decimal(onSiteHedgerowBaseline).isZero()
            ? 0
            : new Decimal(totalNetUnitChange.hedgerowDecimal).div(onSiteHedgerowBaseline),
    );
    const watercourseDecimal = toDecimal(
        new Decimal(onSiteWatercourseBaseline).isZero()
            ? 0
            : new Decimal(totalNetUnitChange.watercourseDecimal).div(onSiteWatercourseBaseline),
    );
    return {
        habitat: habitatDecimal.toNumber(),
        habitatDecimal,
        hedgerow: hedgerowDecimal.toNumber(),
        hedgerowDecimal,
        watercourse: watercourseDecimal.toNumber(),
        watercourseDecimal,
    };
}

function unitSummaryD(
    baselineD: Decimal,
    postInterventionD: Decimal,
    changeD: Decimal,
    changeWithSRMD: Decimal | 'N/A',
    targetD: Decimal,
) {
    const requiredUnitsD = targetD.mul(baselineD);
    const effectiveChangeD = changeWithSRMD === 'N/A' ? changeD : changeWithSRMD;
    const unitDeficitD = requiredUnitsD.minus(postInterventionD).minus(effectiveChangeD);
    const unitDeficitNormalisedD = unitDeficitD.isNegative() ? ZERO : unitDeficitD;

    return {
        target: targetD.toNumber(),
        targetDecimal: targetD,
        baselineUnits: baselineD.toNumber(),
        baselineUnitsDecimal: baselineD,
        requiredUnits: requiredUnitsD.toNumber(),
        requiredUnitsDecimal: requiredUnitsD,
        unitDeficit: unitDeficitNormalisedD.toNumber(),
        unitDeficitDecimal: unitDeficitNormalisedD,
    };
}

/*
 * Calculates all of the fields from the 'Headline Results' sheet
 */
export function headlineResults(
    features: AllFeatures & { startPage?: { netGainTarget?: Quantity } },
    tradingSummaries: TradingSummaries,
    options: { netGainTarget?: Quantity } = {},
) {
    const netGainTarget = options.netGainTarget ?? features.startPage?.netGainTarget ?? 0.1;
    const targetD = new Decimal(1).plus(netGainTarget);

    // On-site baselines (Decimal)
    const onSiteHabitatBaselineD_ = onSiteHabitatBaselineD(features.onSiteHabitatBaselines);
    const onSiteHedgerowBaselineD_ = onSiteHedgerowBaselineD(features.onSiteHedgerowBaselines);
    const onSiteWatercourseBaselineD_ = onSiteWatercourseBaselineD(features.onSiteWatercourseBaselines);

    // On-site post-intervention (Decimal)
    const onSiteHabitatPostInterventionD_ = onSiteHabitatPostInterventionD(
        features.onSiteHabitatBaselines,
        features.onSiteHabitatCreations,
        features.onSiteHabitatEnhancements,
    );
    const onSiteHedgerowPostInterventionD_ = onSiteHedgerowPostInterventionD(
        features.onSiteHedgerowBaselines,
        features.onSiteHedgerowCreations,
        features.onSiteHedgerowEnhancements,
    );
    const onSiteWatercoursePostInterventionD_ = onSiteWatercoursePostInterventionD(
        features.onSiteWatercourseBaselines,
        features.onSiteWatercourseCreations,
        features.onSiteWatercourseEnhancements,
    );

    // On-site net change
    const onSiteHabitatNet = netChangeD(onSiteHabitatBaselineD_, onSiteHabitatPostInterventionD_);
    const onSiteHedgerowNet = netChangeD(onSiteHedgerowBaselineD_, onSiteHedgerowPostInterventionD_);
    const onSiteWatercourseNet = netChangeD(onSiteWatercourseBaselineD_, onSiteWatercoursePostInterventionD_);

    // Off-site baselines (Decimal)
    const offSiteHabitatBaselineD_ = offSiteHabitatBaselineD(features.offSiteHabitatBaselines);
    const offSiteHedgerowBaselineD_ = offSiteHedgerowBaselineD(features.offSiteHedgerowBaselines);
    const offSiteWatercourseBaselineD_ = offSiteWatercourseBaselineD(features.offSiteWatercourseBaselines);

    // Off-site post-intervention (Decimal)
    const offSiteHabitatPostInterventionD_ = offSiteHabitatPostInterventionD(
        features.offSiteHabitatBaselines,
        features.offSiteHabitatCreations,
        features.offSiteHabitatEnhancements,
    );
    const offSiteHedgerowPostInterventionD_ = offSiteHedgerowPostInterventionD(
        features.offSiteHedgerowBaselines,
        features.offSiteHedgerowCreations,
        features.offSiteHedgerowEnhancements,
    );
    const offSiteWatercoursePostInterventionD_ = offSiteWatercoursePostInterventionD(
        features.offSiteWatercourseBaselines,
        features.offSiteWatercourseCreations,
        features.offSiteWatercourseEnhancements,
    );

    // Off-site net change
    const offSiteHabitatNet = netChangeD(offSiteHabitatBaselineD_, offSiteHabitatPostInterventionD_);
    const offSiteHedgerowNet = netChangeD(offSiteHedgerowBaselineD_, offSiteHedgerowPostInterventionD_);
    const offSiteWatercourseNet = netChangeD(
        offSiteWatercourseBaselineD_,
        offSiteWatercoursePostInterventionD_,
    );

    // Off-site net change WITH SRM
    const offSiteHabitatNetChangeWithSRMD_ = offSiteHabitatNetChangeWithSRMD(
        features.offSiteHabitatBaselines,
        features.offSiteHabitatCreations,
        features.offSiteHabitatEnhancements,
        offSiteHabitatNet.unitsD,
    );
    const offSiteHedgerowNetChangeWithSRMD_ = offSiteHedgerowNetChangeWithSRMD(
        features.offSiteHedgerowBaselines,
        features.offSiteHedgerowCreations,
        features.offSiteHedgerowEnhancements,
        offSiteHedgerowNet.unitsD,
    );
    const offSiteWatercourseNetChangeWithSRMD_ = offSiteWatercourseNetChangeWithSRMD(
        features.offSiteWatercourseBaselines,
        features.offSiteWatercourseCreations,
        features.offSiteWatercourseEnhancements,
        offSiteWatercourseNet.unitsD,
    );

    // Combined net unit change (Decimal, then exposed as number)
    const combinedHabitatD = onSiteHabitatNet.unitsD.plus(offSiteHabitatNet.unitsD);
    const combinedHedgerowD = onSiteHedgerowNet.unitsD.plus(offSiteHedgerowNet.unitsD);
    const combinedWatercourseD = onSiteWatercourseNet.unitsD.plus(offSiteWatercourseNet.unitsD);

    // SRM deductions (Decimal)
    const srmDeductionHabitatD = srmDeductionD(offSiteHabitatNet.unitsD, offSiteHabitatNetChangeWithSRMD_);
    const srmDeductionHedgerowD = srmDeductionD(offSiteHedgerowNet.unitsD, offSiteHedgerowNetChangeWithSRMD_);
    const srmDeductionWatercourseD = srmDeductionD(
        offSiteWatercourseNet.unitsD,
        offSiteWatercourseNetChangeWithSRMD_,
    );

    // Final net unit change (Decimal)
    const totalHabitatD = combinedHabitatD.minus(srmDeductionHabitatD);
    const totalHedgerowD = combinedHedgerowD.minus(srmDeductionHedgerowD);
    const totalWatercourseD = combinedWatercourseD.minus(srmDeductionWatercourseD);

    // Percentage (Decimal)
    const totalNetPercentageChangeHabitatDecimal = toDecimal(
        onSiteHabitatBaselineD_.isZero() ? 0 : totalHabitatD.div(onSiteHabitatBaselineD_),
    );
    const totalNetPercentageChangeHedgerowDecimal = toDecimal(
        onSiteHedgerowBaselineD_.isZero() ? 0 : totalHedgerowD.div(onSiteHedgerowBaselineD_),
    );
    const totalNetPercentageChangeWatercourseDecimal = toDecimal(
        onSiteWatercourseBaselineD_.isZero() ? 0 : totalWatercourseD.div(onSiteWatercourseBaselineD_),
    );
    const totalNetPercentageChange = {
        habitat: totalNetPercentageChangeHabitatDecimal.toNumber(),
        habitatDecimal: totalNetPercentageChangeHabitatDecimal,
        hedgerow: totalNetPercentageChangeHedgerowDecimal.toNumber(),
        hedgerowDecimal: totalNetPercentageChangeHedgerowDecimal,
        watercourse: totalNetPercentageChangeWatercourseDecimal.toNumber(),
        watercourseDecimal: totalNetPercentageChangeWatercourseDecimal,
    };

    // Trading summaries
    const habitatTradingSummaries = tradingSummaries.habitats;
    const hedgerowTradingSummaries = tradingSummaries.hedgerows;
    const watercourseTradingSummaries = tradingSummaries.watercourses;
    const tradingRulesSatisfied =
        habitatTradingSummaries.vHighSatisfied &&
        habitatTradingSummaries.highSatisfied &&
        habitatTradingSummaries.mediumSatisfied &&
        habitatTradingSummaries.lowSatisfied &&
        hedgerowTradingSummaries.vHighSatisfied &&
        hedgerowTradingSummaries.highSatisfied &&
        hedgerowTradingSummaries.mediumSatisfied &&
        hedgerowTradingSummaries.lowSatisfied &&
        hedgerowTradingSummaries.vLowSatisfied &&
        watercourseTradingSummaries.vHighSatisfied &&
        watercourseTradingSummaries.highSatisfied &&
        watercourseTradingSummaries.mediumSatisfied &&
        watercourseTradingSummaries.lowSatisfied;

    // Unit summaries — feed Decimals through to avoid intermediate rounding
    const habitatUnitSummary = unitSummaryD(
        onSiteHabitatBaselineD_,
        onSiteHabitatPostInterventionD_,
        offSiteHabitatNet.unitsD,
        offSiteHabitatNetChangeWithSRMD_,
        targetD,
    );
    const hedgerowUnitSummary = unitSummaryD(
        onSiteHedgerowBaselineD_,
        onSiteHedgerowPostInterventionD_,
        offSiteHedgerowNet.unitsD,
        offSiteHedgerowNetChangeWithSRMD_,
        targetD,
    );
    const watercourseUnitSummary = unitSummaryD(
        onSiteWatercourseBaselineD_,
        onSiteWatercoursePostInterventionD_,
        offSiteWatercourseNet.unitsD,
        offSiteWatercourseNetChangeWithSRMD_,
        targetD,
    );

    return {
        onSiteHabitatBaseline: onSiteHabitatBaselineD_.toNumber(),
        onSiteHabitatBaselineDecimal: onSiteHabitatBaselineD_,
        onSiteHabitatPostIntervention: onSiteHabitatPostInterventionD_.toNumber(),
        onSiteHabitatPostInterventionDecimal: onSiteHabitatPostInterventionD_,
        onSiteHabitatNetChange: {
            units: onSiteHabitatNet.unitsD.toNumber(),
            unitsDecimal: onSiteHabitatNet.unitsD,
            percentage: onSiteHabitatNet.percentageD.toNumber(),
            percentageDecimal: onSiteHabitatNet.percentageD,
        },
        offSiteHabitatBaseline: offSiteHabitatBaselineD_.toNumber(),
        offSiteHabitatBaselineDecimal: offSiteHabitatBaselineD_,
        offSiteHabitatPostIntervention: offSiteHabitatPostInterventionD_.toNumber(),
        offSiteHabitatPostInterventionDecimal: offSiteHabitatPostInterventionD_,
        offSiteHabitatNetChange: {
            units: offSiteHabitatNet.unitsD.toNumber(),
            unitsDecimal: offSiteHabitatNet.unitsD,
            percentage: offSiteHabitatNet.percentageD.toNumber(),
            percentageDecimal: offSiteHabitatNet.percentageD,
        },
        offSiteHabitatNetChangeWithSRM:
            typeof offSiteHabitatNetChangeWithSRMD_ === 'string' ||
            offSiteHabitatNetChangeWithSRMD_ === undefined
                ? offSiteHabitatNetChangeWithSRMD_
                : toDecimal(offSiteHabitatNetChangeWithSRMD_).toNumber(),
        offSiteHabitatNetChangeWithSRMDecimal: offSiteHabitatNetChangeWithSRMD_,
        onSiteHedgerowBaseline: onSiteHedgerowBaselineD_.toNumber(),
        onSiteHedgerowBaselineDecimal: onSiteHedgerowBaselineD_,
        onSiteHedgerowPostIntervention: onSiteHedgerowPostInterventionD_.toNumber(),
        onSiteHedgerowPostInterventionDecimal: onSiteHedgerowPostInterventionD_,
        onSiteHedgerowNetChange: {
            units: onSiteHedgerowNet.unitsD.toNumber(),
            unitsDecimal: onSiteHedgerowNet.unitsD,
            percentage: onSiteHedgerowNet.percentageD.toNumber(),
            percentageDecimal: onSiteHedgerowNet.percentageD,
        },
        offSiteHedgerowBaseline: offSiteHedgerowBaselineD_.toNumber(),
        offSiteHedgerowBaselineDecimal: offSiteHedgerowBaselineD_,
        offSiteHedgerowPostIntervention: offSiteHedgerowPostInterventionD_.toNumber(),
        offSiteHedgerowPostInterventionDecimal: offSiteHedgerowPostInterventionD_,
        offSiteHedgerowNetChange: {
            units: offSiteHedgerowNet.unitsD.toNumber(),
            unitsDecimal: offSiteHedgerowNet.unitsD,
            percentage: offSiteHedgerowNet.percentageD.toNumber(),
            percentageDecimal: offSiteHedgerowNet.percentageD,
        },
        offSiteHedgerowNetChangeWithSRM:
            typeof offSiteHedgerowNetChangeWithSRMD_ === 'string' ||
            offSiteHedgerowNetChangeWithSRMD_ === undefined
                ? offSiteHedgerowNetChangeWithSRMD_
                : toDecimal(offSiteHedgerowNetChangeWithSRMD_).toNumber(),
        offSiteHedgerowNetChangeWithSRMDecimal: offSiteHedgerowNetChangeWithSRMD_,
        onSiteWatercourseBaseline: onSiteWatercourseBaselineD_.toNumber(),
        onSiteWatercourseBaselineDecimal: onSiteWatercourseBaselineD_,
        onSiteWatercoursePostIntervention: onSiteWatercoursePostInterventionD_.toNumber(),
        onSiteWatercoursePostInterventionDecimal: onSiteWatercoursePostInterventionD_,
        onSiteWatercourseNetChange: {
            units: onSiteWatercourseNet.unitsD.toNumber(),
            unitsDecimal: onSiteWatercourseNet.unitsD,
            percentage: onSiteWatercourseNet.percentageD.toNumber(),
            percentageDecimal: onSiteWatercourseNet.percentageD,
        },
        offSiteWatercourseBaseline: offSiteWatercourseBaselineD_.toNumber(),
        offSiteWatercourseBaselineDecimal: offSiteWatercourseBaselineD_,
        offSiteWatercoursePostIntervention: offSiteWatercoursePostInterventionD_.toNumber(),
        offSiteWatercoursePostInterventionDecimal: offSiteWatercoursePostInterventionD_,
        offSiteWatercourseNetChange: {
            units: offSiteWatercourseNet.unitsD.toNumber(),
            unitsDecimal: offSiteWatercourseNet.unitsD,
            percentage: offSiteWatercourseNet.percentageD.toNumber(),
            percentageDecimal: offSiteWatercourseNet.percentageD,
        },
        offSiteWatercourseNetChangeWithSRM:
            typeof offSiteWatercourseNetChangeWithSRMD_ === 'string' ||
            offSiteWatercourseNetChangeWithSRMD_ === undefined
                ? offSiteWatercourseNetChangeWithSRMD_
                : toDecimal(offSiteWatercourseNetChangeWithSRMD_).toNumber(),
        offSiteWatercourseNetChangeWithSRMDecimal: offSiteWatercourseNetChangeWithSRMD_,
        combinedNetUnitChange: {
            habitat: combinedHabitatD.toNumber(),
            habitatDecimal: combinedHabitatD,
            hedgerow: combinedHedgerowD.toNumber(),
            hedgerowDecimal: combinedHedgerowD,
            watercourse: combinedWatercourseD.toNumber(),
            watercourseDecimal: combinedWatercourseD,
        },
        totalSRMDeductions: {
            habitat: srmDeductionHabitatD.toNumber(),
            habitatDecimal: srmDeductionHabitatD,
            hedgerow: srmDeductionHedgerowD.toNumber(),
            hedgerowDecimal: srmDeductionHedgerowD,
            watercourse: srmDeductionWatercourseD.toNumber(),
            watercourseDecimal: srmDeductionWatercourseD,
        },
        totalNetUnitChange: {
            habitat: totalHabitatD.toNumber(),
            habitatDecimal: totalHabitatD,
            hedgerow: totalHedgerowD.toNumber(),
            hedgerowDecimal: totalHedgerowD,
            watercourse: totalWatercourseD.toNumber(),
            watercourseDecimal: totalWatercourseD,
        },
        totalNetPercentageChange,
        tradingRulesSatisfied,
        habitatUnitSummary,
        hedgerowUnitSummary,
        watercourseUnitSummary,
    };
}

export type HeadlineResults = ReturnType<typeof headlineResults>;

export function calculateOnSiteHabitatBaselineDecimal(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[],
): Decimal {
    return onSiteHabitatBaselineD(baselines);
}

export function calculateOnSiteHabitatPostInterventionDecimal(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteHabitatEnhancementSchema>[],
): Decimal {
    return onSiteHabitatPostInterventionD(baselines, creations, enhancements);
}

export function calculateOffSiteHabitatBaselineDecimal(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
): Decimal {
    return offSiteHabitatBaselineD(baselines);
}

export function calculateOffSiteHabitatPostInterventionDecimal(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHabitatEnhancementSchema>[],
): Decimal {
    return offSiteHabitatPostInterventionD(baselines, creations, enhancements);
}

export function calculateOffSiteHabitatNetChangeWithSRMDecimal(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHabitatEnhancementSchema>[],
    netChangeUnits: Quantity,
): Decimal | 'N/A' {
    const result = offSiteHabitatNetChangeWithSRMD(
        baselines,
        creations,
        enhancements,
        new Decimal(netChangeUnits),
    );
    return result;
}

export function calculateOnSiteHedgerowBaselineDecimal(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[],
): Decimal {
    return onSiteHedgerowBaselineD(baselines);
}

export function calculateOnSiteHedgerowPostInterventionDecimal(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteHedgerowEnhancementSchema>[],
): Decimal {
    return onSiteHedgerowPostInterventionD(baselines, creations, enhancements);
}

export function calculateOffSiteHedgerowBaselineDecimal(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
): Decimal {
    return offSiteHedgerowBaselineD(baselines);
}

export function calculateOffSiteHedgerowPostInterventionDecimal(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHedgerowEnhancementSchema>[],
): Decimal {
    return offSiteHedgerowPostInterventionD(baselines, creations, enhancements);
}

export function calculateOffSiteHedgerowNetChangeWithSRMDecimal(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHedgerowEnhancementSchema>[],
    netChangeUnits: Quantity,
): Decimal | 'N/A' {
    const result = offSiteHedgerowNetChangeWithSRMD(
        baselines,
        creations,
        enhancements,
        new Decimal(netChangeUnits),
    );
    return result;
}

export function calculateOnSiteWatercourseBaselineDecimal(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[],
): Decimal {
    return onSiteWatercourseBaselineD(baselines);
}

export function calculateOnSiteWatercoursePostInterventionDecimal(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteWatercourseEnhancementSchema>[],
): Decimal {
    return onSiteWatercoursePostInterventionD(baselines, creations, enhancements);
}

export function calculateOffSiteWatercourseBaselineDecimal(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
): Decimal {
    return offSiteWatercourseBaselineD(baselines);
}

export function calculateOffSiteWatercoursePostInterventionDecimal(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[],
): Decimal {
    return offSiteWatercoursePostInterventionD(baselines, creations, enhancements);
}

export function calculateOffSiteWatercourseNetChangeWithSRMDecimal(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[],
    netChangeUnits: Quantity,
): Decimal | 'N/A' {
    const result = offSiteWatercourseNetChangeWithSRMD(
        baselines,
        creations,
        enhancements,
        new Decimal(netChangeUnits),
    );
    return result;
}

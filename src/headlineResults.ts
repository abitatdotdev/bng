import * as v from 'valibot';
import { Decimal } from './decimal';
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

function onSiteHabitatBaselineD(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[]
): Decimal {
    return sumD(baselines, b => b.totalHabitatUnits);
}

/**
 * Calculates the total on-site habitat baseline units
 * Sums the totalHabitatUnits from all A-1 baseline entries
 * Corresponds to cell H8 in the Headline Results sheet
 */
export function calculateOnSiteHabitatBaseline(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[]
): number {
    return onSiteHabitatBaselineD(baselines).toNumber();
}

function onSiteHabitatPostInterventionD(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteHabitatEnhancementSchema>[]
): Decimal {
    return sumD(creations, c => c.habitatUnitsDelivered)
        .plus(sumD(enhancements, e => e.habitatUnitsDelivered))
        .plus(sumD(baselines, b => new Decimal(b.baselineUnitsRetained).plus(b.vhdhBespokeCompensationUnits)));
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
    enhancements: v.InferOutput<typeof onSiteHabitatEnhancementSchema>[]
): number {
    return onSiteHabitatPostInterventionD(baselines, creations, enhancements).toNumber();
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
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return { units: unitsD.toNumber(), percentage: percentageD.toNumber() };
}

// --- Off-site habitat ---------------------------------------------------------

function offSiteHabitatBaselineD(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[]
): Decimal {
    return sumD(baselines, b => b.totalHabitatUnits);
}

/**
 * Calculates the total off-site habitat baseline units
 * Sums the totalHabitatUnits from all D-1 baseline entries
 * Corresponds to cell H20 in the Headline Results sheet
 */
export function calculateOffSiteHabitatBaseline(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[]
): number {
    return offSiteHabitatBaselineD(baselines).toNumber();
}

function offSiteHabitatPostInterventionD(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHabitatEnhancementSchema>[]
): Decimal {
    return sumD(creations, c => c.habitatUnitsDelivered)
        .plus(sumD(enhancements, e => e.habitatUnitsDelivered))
        .plus(sumD(baselines, b => new Decimal(b.baselineUnitsRetained).plus(b.vhdhBespokeCompensationUnits)));
}

/**
 * Calculates the total off-site habitat units after intervention
 * Sums retained/enhanced units from D-1 + created units from D-2 + enhanced units from D-3
 * Corresponds to cell H24 in the Headline Results sheet
 */
export function calculateOffSiteHabitatPostIntervention(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHabitatEnhancementSchema>[]
): number {
    return offSiteHabitatPostInterventionD(baselines, creations, enhancements).toNumber();
}

/**
 * Calculates the net change in off-site habitat units and percentage
 * Corresponds to cells H28 and I28 in the Headline Results sheet
 */
export function calculateOffSiteHabitatNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return { units: unitsD.toNumber(), percentage: percentageD.toNumber() };
}

function offSiteHabitatNetChangeWithSRMD(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHabitatCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHabitatEnhancementSchema>[],
    netChangeUnitsD: Decimal
): Decimal | "N/A" {
    if (netChangeUnitsD.lte(0)) return "N/A" as const;

    const baselineWithSRM = sumD(baselines, b => b.totalHabitatUnitsSRM);
    const postInterventionWithSRM = sumD(baselines, b => b.baselineUnitsRetainedWithSRM)
        .plus(sumD(creations, c => c.habitatUnitsDeliveredWithSpatialRisk))
        .plus(sumD(enhancements, e => e.habitatUnitsDeliveredWithSpatialRisk));

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
    netChangeUnits: number
): number | "N/A" {
    const result = offSiteHabitatNetChangeWithSRMD(baselines, creations, enhancements, new Decimal(netChangeUnits));
    return result === "N/A" ? result : result.toNumber();
}

// --- On-site hedgerow ---------------------------------------------------------

function onSiteHedgerowBaselineD(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[]
): Decimal {
    return sumD(baselines, b => b.totalHedgerowUnits);
}

/**
 * Calculates the total on-site hedgerow baseline units
 * Sums the totalHedgerowUnits from all B-1 baseline entries
 * Corresponds to cell H9 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowBaseline(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[]
): number {
    return onSiteHedgerowBaselineD(baselines).toNumber();
}

function onSiteHedgerowPostInterventionD(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteHedgerowEnhancementSchema>[]
): Decimal {
    return sumD(creations, c => c.hedgerowUnitsDelivered)
        .plus(sumD(enhancements, e => e.hedgerowUnitsDelivered))
        .plus(sumD(baselines, b => b.unitsRetained));
}

/**
 * Calculates the total on-site hedgerow units after intervention
 * Sums retained units from B-1 + created units from B-2 + enhanced units from B-3
 * Corresponds to cell H13 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowPostIntervention(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteHedgerowEnhancementSchema>[]
): number {
    return onSiteHedgerowPostInterventionD(baselines, creations, enhancements).toNumber();
}

/**
 * Calculates the net change in on-site hedgerow units and percentage
 * Corresponds to cells H17 and J17 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return { units: unitsD.toNumber(), percentage: percentageD.toNumber() };
}

// --- Off-site hedgerow --------------------------------------------------------

function offSiteHedgerowBaselineD(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[]
): Decimal {
    return sumD(baselines, b => b.totalHedgerowUnits);
}

/**
 * Calculates the total off-site hedgerow baseline units
 * Sums the totalHedgerowUnits from all E-1 baseline entries
 * Corresponds to cell H21 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowBaseline(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[]
): number {
    return offSiteHedgerowBaselineD(baselines).toNumber();
}

function offSiteHedgerowPostInterventionD(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHedgerowEnhancementSchema>[]
): Decimal {
    return sumD(baselines, b => b.unitsRetained)
        .plus(sumD(creations, c => c.hedgerowUnitsDelivered))
        .plus(sumD(enhancements, e => e.hedgerowUnitsDelivered));
}

/**
 * Calculates the total off-site hedgerow units after intervention
 * Sums retained/enhanced units from E-1 + created units from E-2 + enhanced units from E-3
 * Corresponds to cell H25 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowPostIntervention(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHedgerowEnhancementSchema>[]
): number {
    return offSiteHedgerowPostInterventionD(baselines, creations, enhancements).toNumber();
}

/**
 * Calculates the net change in off-site hedgerow units and percentage
 * Corresponds to cells H29 and I29 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return { units: unitsD.toNumber(), percentage: percentageD.toNumber() };
}

function offSiteHedgerowNetChangeWithSRMD(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteHedgerowCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteHedgerowEnhancementSchema>[],
    netChangeUnitsD: Decimal
): Decimal | "N/A" {
    if (netChangeUnitsD.lte(0)) return "N/A" as const;

    const baselineWithSRM = sumD(baselines, b => b.totalHedgerowUnitsSRM);
    const retainedAndEnhancedWithSRM = sumD(baselines, b => new Decimal(b.unitsRetained).mul(b.spatialRiskMultiplier));
    const createdWithSRM = sumD(creations, c => c.hedgerowUnitsDeliveredWithSpatialRisk);
    const enhancedWithSRM = sumD(enhancements, e => e.hedgerowUnitsDeliveredWithSpatialRisk);

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
    netChangeUnits: number
): number | "N/A" {
    const result = offSiteHedgerowNetChangeWithSRMD(baselines, creations, enhancements, new Decimal(netChangeUnits));
    return result === "N/A" ? result : result.toNumber();
}

// --- On-site watercourse ------------------------------------------------------

function onSiteWatercourseBaselineD(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[]
): Decimal {
    return sumD(baselines, b => b.totalWatercourseUnits);
}

/**
 * Calculates the total on-site watercourse baseline units
 * Sums the totalWatercourseUnits from all C-1 baseline entries
 * Corresponds to cell H10 in the Headline Results sheet
 */
export function calculateOnSiteWatercourseBaseline(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[]
): number {
    return onSiteWatercourseBaselineD(baselines).toNumber();
}

function onSiteWatercoursePostInterventionD(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteWatercourseEnhancementSchema>[]
): Decimal {
    return sumD(creations, c => c.unitsDelivered)
        .plus(sumD(enhancements, e => e.watercourseUnitsDelivered))
        .plus(sumD(baselines, b => b.unitsRetained))
        .plus(sumD(baselines, b => b.vhdhBespokeCompensationUnits));
}

/**
 * Calculates the total on-site watercourse units after intervention
 * Corresponds to cell H14 in the Headline Results sheet
 */
export function calculateOnSiteWatercoursePostIntervention(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof onSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof onSiteWatercourseEnhancementSchema>[]
): number {
    return onSiteWatercoursePostInterventionD(baselines, creations, enhancements).toNumber();
}

/**
 * Calculates the net change in on-site watercourse units and percentage
 * Corresponds to cells H18 and J18 in the Headline Results sheet
 */
export function calculateOnSiteWatercourseNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return { units: unitsD.toNumber(), percentage: percentageD.toNumber() };
}

// --- Off-site watercourse -----------------------------------------------------

function offSiteWatercourseBaselineD(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[]
): Decimal {
    return sumD(baselines, b => b.totalWatercourseUnits);
}

/**
 * Calculates the total off-site watercourse baseline units
 * Sums the totalWatercourseUnits from all F-1 baseline entries
 * Corresponds to cell H22 in the Headline Results sheet
 */
export function calculateOffSiteWatercourseBaseline(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[]
): number {
    return offSiteWatercourseBaselineD(baselines).toNumber();
}

function offSiteWatercoursePostInterventionD(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[]
): Decimal {
    return sumD(baselines, b => b.unitsRetained)
        .plus(sumD(creations, c => c.unitsDelivered))
        .plus(sumD(enhancements, e => e.watercourseUnitsDelivered));
}

/**
 * Calculates the total off-site watercourse units after intervention
 * Sums retained/enhanced units from F-1 + created units from F-2 + enhanced units from F-3
 * Corresponds to cell H26 in the Headline Results sheet
 */
export function calculateOffSiteWatercoursePostIntervention(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[]
): number {
    return offSiteWatercoursePostInterventionD(baselines, creations, enhancements).toNumber();
}

/**
 * Calculates the net change in off-site watercourse units and percentage
 * Corresponds to cells H30 and I30 in the Headline Results sheet
 */
export function calculateOffSiteWatercourseNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const { unitsD, percentageD } = netChangeD(new Decimal(baseline), new Decimal(postIntervention));
    return { units: unitsD.toNumber(), percentage: percentageD.toNumber() };
}

function offSiteWatercourseNetChangeWithSRMD(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[],
    netChangeUnitsD: Decimal
): Decimal | "N/A" {
    if (netChangeUnitsD.lte(0)) return "N/A" as const;

    const baselineWithSRM = sumD(baselines, b => b.totalWatercourseUnitsSRM);
    const retainedAndEnhancedWithSRM = sumD(baselines, b => new Decimal(b.unitsRetained).mul(b.spatialRiskMultiplier));
    const createdWithSRM = sumD(creations, c => c.netUnitChangeWithSpatialRisk);
    const enhancedWithSRM = sumD(enhancements, e => e.watercourseUnitsDeliveredWithSpatialRisk);

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
    netChangeUnits: number
): number | "N/A" {
    const result = offSiteWatercourseNetChangeWithSRMD(baselines, creations, enhancements, new Decimal(netChangeUnits));
    return result === "N/A" ? result : result.toNumber();
}

// --- Aggregations -------------------------------------------------------------

/**
 * Calculates the combined net unit change across all habitat types
 * Sums on-site and off-site net changes for habitats, hedgerows, and watercourses
 * Corresponds to cells H38, H39, H40 in the Headline Results sheet
 */
export function calculateCombinedNetUnitChange(
    onSiteHabitatNetChange: number,
    offSiteHabitatNetChange: number,
    onSiteHedgerowNetChange: number,
    offSiteHedgerowNetChange: number,
    onSiteWatercourseNetChange: number,
    offSiteWatercourseNetChange: number
) {
    return {
        habitat: new Decimal(onSiteHabitatNetChange).plus(offSiteHabitatNetChange).toNumber(),
        hedgerow: new Decimal(onSiteHedgerowNetChange).plus(offSiteHedgerowNetChange).toNumber(),
        watercourse: new Decimal(onSiteWatercourseNetChange).plus(offSiteWatercourseNetChange).toNumber(),
    };
}

/**
 * Calculates the total Spatial Risk Multiplier deductions
 * SRM deductions = the difference between regular net change and net change with SRM applied
 * This represents the units "lost" due to spatial risk
 * Corresponds to cells H44, H45, H46 in the Headline Results sheet
 */
export function calculateTotalSRMDeductions(
    offSiteHabitatNetChange: number,
    offSiteHabitatNetChangeWithSRM: number | "N/A",
    offSiteHedgerowNetChange: number,
    offSiteHedgerowNetChangeWithSRM: number | "N/A",
    offSiteWatercourseNetChange: number,
    offSiteWatercourseNetChangeWithSRM: number | "N/A"
) {
    return {
        habitat: new Decimal(offSiteHabitatNetChange).minus(zeroNaN(offSiteHabitatNetChangeWithSRM)).toNumber(),
        hedgerow: new Decimal(offSiteHedgerowNetChange).minus(zeroNaN(offSiteHedgerowNetChangeWithSRM)).toNumber(),
        watercourse: new Decimal(offSiteWatercourseNetChange).minus(zeroNaN(offSiteWatercourseNetChangeWithSRM)).toNumber(),
    };
}

function zeroNaN<T>(x: number | T): number {
    return typeof x === "number" ? x : 0;
}

function zeroNaND(x: Decimal | "N/A"): Decimal {
    return x === "N/A" ? ZERO : x;
}

/**
 * Calculates the final total net unit change with SRM adjustments applied
 * This is the ultimate summary metric: combined net change minus SRM deductions
 * Alternatively: sum of all on-site net changes + all off-site net changes WITH SRM
 * Corresponds to cells H50, H51, H52 in the Headline Results sheet
 */
export function calculateFinalTotalNetUnitChange(
    combinedNetUnitChange: ReturnType<typeof calculateCombinedNetUnitChange>,
    totalSRMDeductions: ReturnType<typeof calculateTotalSRMDeductions>
) {
    return {
        habitat: new Decimal(combinedNetUnitChange.habitat).minus(totalSRMDeductions.habitat).toNumber(),
        hedgerow: new Decimal(combinedNetUnitChange.hedgerow).minus(totalSRMDeductions.hedgerow).toNumber(),
        watercourse: new Decimal(combinedNetUnitChange.watercourse).minus(totalSRMDeductions.watercourse).toNumber(),
    };
}

export function calculateTotalNetPercentageChange(
    totalNetUnitChange: ReturnType<typeof calculateFinalTotalNetUnitChange>,
    onSiteHabitatBaseline: number,
    onSiteHedgerowBaseline: number,
    onSiteWatercourseBaseline: number,
) {
    return {
        habitat: onSiteHabitatBaseline === 0 ? 0 : new Decimal(totalNetUnitChange.habitat).div(onSiteHabitatBaseline).toNumber(),
        hedgerow: onSiteHedgerowBaseline === 0 ? 0 : new Decimal(totalNetUnitChange.hedgerow).div(onSiteHedgerowBaseline).toNumber(),
        watercourse: onSiteWatercourseBaseline === 0 ? 0 : new Decimal(totalNetUnitChange.watercourse).div(onSiteWatercourseBaseline).toNumber(),
    };
}

function unitSummaryD(baselineD: Decimal, postInterventionD: Decimal, changeD: Decimal, changeWithSRMD: Decimal | "N/A", targetD: Decimal) {
    const requiredUnitsD = targetD.mul(baselineD);
    const effectiveChangeD = changeWithSRMD === "N/A" ? changeD : changeWithSRMD;
    const unitDeficitD = requiredUnitsD.minus(postInterventionD).minus(effectiveChangeD);
    const unitDeficitNormalisedD = unitDeficitD.isNegative() ? ZERO : unitDeficitD;

    return {
        target: targetD.toNumber(),
        baselineUnits: baselineD.toNumber(),
        requiredUnits: requiredUnitsD.toNumber(),
        unitDeficit: unitDeficitNormalisedD.toNumber(),
    };
}

/*
 * Calculates all of the fields from the 'Headline Results' sheet
 */
export function headlineResults(features: AllFeatures, tradingSummaries: TradingSummaries, options: { netGainTarget?: number } = {}) {
    const netGainTarget = options.netGainTarget ?? 0.1;
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
    const offSiteWatercourseNet = netChangeD(offSiteWatercourseBaselineD_, offSiteWatercoursePostInterventionD_);

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
    const srmDeductionHabitatD = offSiteHabitatNet.unitsD.minus(zeroNaND(offSiteHabitatNetChangeWithSRMD_));
    const srmDeductionHedgerowD = offSiteHedgerowNet.unitsD.minus(zeroNaND(offSiteHedgerowNetChangeWithSRMD_));
    const srmDeductionWatercourseD = offSiteWatercourseNet.unitsD.minus(zeroNaND(offSiteWatercourseNetChangeWithSRMD_));

    // Final net unit change (Decimal)
    const totalHabitatD = combinedHabitatD.minus(srmDeductionHabitatD);
    const totalHedgerowD = combinedHedgerowD.minus(srmDeductionHedgerowD);
    const totalWatercourseD = combinedWatercourseD.minus(srmDeductionWatercourseD);

    // Percentage (Decimal)
    const totalNetPercentageChange = {
        habitat: onSiteHabitatBaselineD_.isZero() ? 0 : totalHabitatD.div(onSiteHabitatBaselineD_).toNumber(),
        hedgerow: onSiteHedgerowBaselineD_.isZero() ? 0 : totalHedgerowD.div(onSiteHedgerowBaselineD_).toNumber(),
        watercourse: onSiteWatercourseBaselineD_.isZero() ? 0 : totalWatercourseD.div(onSiteWatercourseBaselineD_).toNumber(),
    };

    // Trading summaries
    const habitatTradingSummaries = tradingSummaries.habitats;
    const hedgerowTradingSummaries = tradingSummaries.hedgerows;
    const watercourseTradingSummaries = tradingSummaries.watercourses;
    const tradingRulesSatisfied = (
        habitatTradingSummaries.vHighSatisfied
        && habitatTradingSummaries.highSatisfied
        && habitatTradingSummaries.mediumSatisfied
        && habitatTradingSummaries.lowSatisfied
        && hedgerowTradingSummaries.vHighSatisfied
        && hedgerowTradingSummaries.highSatisfied
        && hedgerowTradingSummaries.mediumSatisfied
        && hedgerowTradingSummaries.lowSatisfied
        && hedgerowTradingSummaries.vLowSatisfied
        && watercourseTradingSummaries.vHighSatisfied
        && watercourseTradingSummaries.highSatisfied
        && watercourseTradingSummaries.mediumSatisfied
        && watercourseTradingSummaries.lowSatisfied
    );

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

    const toNum = (d: Decimal | "N/A"): number | "N/A" => d === "N/A" ? d : d.toNumber();

    return {
        onSiteHabitatBaseline: onSiteHabitatBaselineD_.toNumber(),
        onSiteHabitatPostIntervention: onSiteHabitatPostInterventionD_.toNumber(),
        onSiteHabitatNetChange: { units: onSiteHabitatNet.unitsD.toNumber(), percentage: onSiteHabitatNet.percentageD.toNumber() },
        offSiteHabitatBaseline: offSiteHabitatBaselineD_.toNumber(),
        offSiteHabitatPostIntervention: offSiteHabitatPostInterventionD_.toNumber(),
        offSiteHabitatNetChange: { units: offSiteHabitatNet.unitsD.toNumber(), percentage: offSiteHabitatNet.percentageD.toNumber() },
        offSiteHabitatNetChangeWithSRM: toNum(offSiteHabitatNetChangeWithSRMD_),
        onSiteHedgerowBaseline: onSiteHedgerowBaselineD_.toNumber(),
        onSiteHedgerowPostIntervention: onSiteHedgerowPostInterventionD_.toNumber(),
        onSiteHedgerowNetChange: { units: onSiteHedgerowNet.unitsD.toNumber(), percentage: onSiteHedgerowNet.percentageD.toNumber() },
        offSiteHedgerowBaseline: offSiteHedgerowBaselineD_.toNumber(),
        offSiteHedgerowPostIntervention: offSiteHedgerowPostInterventionD_.toNumber(),
        offSiteHedgerowNetChange: { units: offSiteHedgerowNet.unitsD.toNumber(), percentage: offSiteHedgerowNet.percentageD.toNumber() },
        offSiteHedgerowNetChangeWithSRM: toNum(offSiteHedgerowNetChangeWithSRMD_),
        onSiteWatercourseBaseline: onSiteWatercourseBaselineD_.toNumber(),
        onSiteWatercoursePostIntervention: onSiteWatercoursePostInterventionD_.toNumber(),
        onSiteWatercourseNetChange: { units: onSiteWatercourseNet.unitsD.toNumber(), percentage: onSiteWatercourseNet.percentageD.toNumber() },
        offSiteWatercourseBaseline: offSiteWatercourseBaselineD_.toNumber(),
        offSiteWatercoursePostIntervention: offSiteWatercoursePostInterventionD_.toNumber(),
        offSiteWatercourseNetChange: { units: offSiteWatercourseNet.unitsD.toNumber(), percentage: offSiteWatercourseNet.percentageD.toNumber() },
        offSiteWatercourseNetChangeWithSRM: toNum(offSiteWatercourseNetChangeWithSRMD_),
        combinedNetUnitChange: {
            habitat: combinedHabitatD.toNumber(),
            hedgerow: combinedHedgerowD.toNumber(),
            watercourse: combinedWatercourseD.toNumber(),
        },
        totalSRMDeductions: {
            habitat: srmDeductionHabitatD.toNumber(),
            hedgerow: srmDeductionHedgerowD.toNumber(),
            watercourse: srmDeductionWatercourseD.toNumber(),
        },
        totalNetUnitChange: {
            habitat: totalHabitatD.toNumber(),
            hedgerow: totalHedgerowD.toNumber(),
            watercourse: totalWatercourseD.toNumber(),
        },
        totalNetPercentageChange,
        tradingRulesSatisfied,
        habitatUnitSummary,
        hedgerowUnitSummary,
        watercourseUnitSummary,
    };
}

export type HeadlineResults = ReturnType<typeof headlineResults>

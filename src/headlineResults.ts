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

/**
 * Calculates the total on-site habitat baseline units
 * Sums the totalHabitatUnits from all A-1 baseline entries
 * Corresponds to cell H8 in the Headline Results sheet
 */
export function calculateOnSiteHabitatBaseline(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[]
): number {
    return baselines.reduce((sum: number, baseline) => new Decimal(sum).plus(baseline.totalHabitatUnits).toNumber(), 0);
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
    const createdUnits = creations.reduce((sum: number, c) => new Decimal(sum).plus(c.habitatUnitsDelivered).toNumber(), 0);
    const enhancedUnits = enhancements.reduce((sum: number, e) => new Decimal(sum).plus(e.habitatUnitsDelivered).toNumber(), 0);
    const retainedUnits = baselines.reduce((sum: number, b) => new Decimal(sum).plus(b.baselineUnitsRetained).plus(b.vhdhBespokeCompensationUnits).toNumber(), 0);
    return new Decimal(createdUnits).plus(enhancedUnits).plus(retainedUnits).toNumber();
}

/**
 * Calculates the net change in on-site habitat units and percentage
 * Corresponds to cells H16 and I16 in the Headline Results sheet
 */
export function calculateOnSiteHabitatNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = new Decimal(postIntervention).minus(baseline).toNumber();
    const percentage = baseline === 0 ? 0 : new Decimal(units).div(baseline).mul(100).toNumber();

    return { units, percentage };
}

/**
 * Calculates the total off-site habitat baseline units
 * Sums the totalHabitatUnits from all D-1 baseline entries
 * Corresponds to cell H20 in the Headline Results sheet
 */
export function calculateOffSiteHabitatBaseline(
    baselines: v.InferOutput<typeof offSiteHabitatBaselineSchema>[]
): number {
    return baselines.reduce((sum: number, baseline) => new Decimal(sum).plus(baseline.totalHabitatUnits).toNumber(), 0);
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
    const createdUnits = creations.reduce((sum: number, c) => new Decimal(sum).plus(c.habitatUnitsDelivered).toNumber(), 0);
    const enhancedUnits = enhancements.reduce((sum: number, e) => new Decimal(sum).plus(e.habitatUnitsDelivered).toNumber(), 0);
    const retainedUnits = baselines.reduce((sum: number, b) => new Decimal(sum).plus(b.baselineUnitsRetained).plus(b.vhdhBespokeCompensationUnits).toNumber(), 0);
    return new Decimal(createdUnits).plus(enhancedUnits).plus(retainedUnits).toNumber();
}

/**
 * Calculates the net change in off-site habitat units and percentage
 * Corresponds to cells H28 and I28 in the Headline Results sheet
 */
export function calculateOffSiteHabitatNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = new Decimal(postIntervention).minus(baseline).toNumber();
    const percentage = baseline === 0 ? 0 : new Decimal(units).div(baseline).mul(100).toNumber();

    return { units, percentage };
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
    // If net change is <= 0, SRM is not applicable
    if (netChangeUnits <= 0) {
        return "N/A" as const;
    }

    // Calculate baseline WITH SRM
    const baselineWithSRM = baselines.reduce(
        (sum: number, baseline) => new Decimal(sum).plus(baseline.totalHabitatUnitsSRM).toNumber(),
        0
    );

    // Calculate post-intervention WITH SRM
    const sumBaselineUnitsRetained = baselines.reduce((sum: number, baseline) => new Decimal(sum).plus(baseline.baselineUnitsRetainedWithSRM).toNumber(), 0);
    const sumCreatedUnitsDelivered = creations.reduce((sum: number, creation) => new Decimal(sum).plus(creation.habitatUnitsDeliveredWithSpatialRisk).toNumber(), 0);
    const sumEnhancedUnitsDelivered = enhancements.reduce((sum: number, enhancement) => new Decimal(sum).plus(enhancement.habitatUnitsDeliveredWithSpatialRisk).toNumber(), 0);

    const postInterventionWithSRM = new Decimal(sumBaselineUnitsRetained).plus(sumCreatedUnitsDelivered).plus(sumEnhancedUnitsDelivered).toNumber();

    // Calculate net change WITH SRM
    return new Decimal(postInterventionWithSRM).minus(baselineWithSRM).toNumber();
}

/**
 * Calculates the total on-site hedgerow baseline units
 * Sums the totalHedgerowUnits from all B-1 baseline entries
 * Corresponds to cell H9 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowBaseline(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[]
): number {
    return baselines.reduce((sum: number, baseline) => new Decimal(sum).plus(baseline.totalHedgerowUnits).toNumber(), 0);
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
    // = 'B-2 On-Site Hedge Creation'!W260
    const createdUnits = creations.reduce((sum: number, c) => new Decimal(sum).plus(c.hedgerowUnitsDelivered).toNumber(), 0);
    // +'B-3 On-Site Hedge Enhancement'!AH258
    const enhancedUnits = enhancements.reduce((sum: number, e) => new Decimal(sum).plus(e.hedgerowUnitsDelivered).toNumber(), 0);
    // +'B-1 On-Site Hedge Baseline'!R258
    const retainedUnits = baselines.reduce((sum: number, b) => new Decimal(sum).plus(b.unitsRetained).toNumber(), 0);
    return new Decimal(createdUnits).plus(enhancedUnits).plus(retainedUnits).toNumber();
}

/**
 * Calculates the net change in on-site hedgerow units and percentage
 * Corresponds to cells H17 and J17 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = new Decimal(postIntervention).minus(baseline).toNumber();
    const percentage = baseline === 0 ? 0 : new Decimal(units).div(baseline).mul(100).toNumber();

    return { units, percentage };
}

/**
 * Calculates the total off-site hedgerow baseline units
 * Sums the totalHedgerowUnits from all E-1 baseline entries
 * Corresponds to cell H21 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowBaseline(
    baselines: v.InferOutput<typeof offSiteHedgerowBaselineSchema>[]
): number {
    return baselines.reduce((sum: number, baseline) => new Decimal(sum).plus(baseline.totalHedgerowUnits).toNumber(), 0);
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
    // Sum retained and enhanced units from baselines
    const retainedAndEnhanced = baselines.reduce(
        (sum: number, baseline) => new Decimal(sum).plus(baseline.unitsRetained).plus(baseline.unitsEnhanced).toNumber(),
        0
    );

    // Sum created units
    const created = creations.reduce(
        (sum: number, creation) => new Decimal(sum).plus(creation.hedgerowUnitsDelivered).toNumber(),
        0
    );

    // Sum enhanced units
    const enhanced = enhancements.reduce(
        (sum: number, enhancement) => new Decimal(sum).plus(enhancement.hedgerowUnitsDelivered).toNumber(),
        0
    );

    return new Decimal(retainedAndEnhanced).plus(created).plus(enhanced).toNumber();
}

/**
 * Calculates the net change in off-site hedgerow units and percentage
 * Corresponds to cells H29 and I29 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = new Decimal(postIntervention).minus(baseline).toNumber();
    const percentage = baseline === 0 ? 0 : new Decimal(units).div(baseline).mul(100).toNumber();

    return { units, percentage };
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
    // If net change is <= 0, SRM is not applicable
    if (netChangeUnits <= 0) {
        return "N/A" as const;
    }

    // Calculate baseline WITH SRM
    const baselineWithSRM = baselines.reduce(
        (sum: number, baseline) => new Decimal(sum).plus(baseline.totalHedgerowUnitsSRM).toNumber(),
        0
    );

    // Calculate post-intervention WITH SRM
    // For retained/enhanced from baselines, apply SRM manually
    const retainedAndEnhancedWithSRM = baselines.reduce(
        (sum: number, baseline) =>
            new Decimal(sum).plus(new Decimal(baseline.unitsRetained).plus(baseline.unitsEnhanced).mul(baseline.spatialRiskMultiplier)).toNumber(),
        0
    );

    // Created and enhanced already have SRM-adjusted values
    const createdWithSRM = creations.reduce(
        (sum: number, creation) => new Decimal(sum).plus(creation.hedgerowUnitsDeliveredWithSpatialRisk).toNumber(),
        0
    );

    const enhancedWithSRM = enhancements.reduce(
        (sum: number, enhancement) => new Decimal(sum).plus(enhancement.hedgerowUnitsDeliveredWithSpatialRisk).toNumber(),
        0
    );

    const postInterventionWithSRM = new Decimal(retainedAndEnhancedWithSRM).plus(createdWithSRM).plus(enhancedWithSRM).toNumber();

    return new Decimal(postInterventionWithSRM).minus(baselineWithSRM).toNumber();
}

/**
 * Calculates the total on-site watercourse baseline units
 * Sums the totalWatercourseUnits from all C-1 baseline entries
 * Corresponds to cell H10 in the Headline Results sheet
 */
export function calculateOnSiteWatercourseBaseline(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[]
): number {
    return baselines.reduce((sum: number, baseline) => new Decimal(sum).plus(baseline.totalWatercourseUnits).toNumber(), 0);
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
    // ='C-2 On-Site WaterC'' Creation'!Z260
    const creationUnits = creations.reduce((sum: number, c) => new Decimal(sum).plus(c.unitsDelivered).toNumber(), 0);
    // + 'C-3 On-Site WaterC'' Enhancement'!AM258
    const enhancementUnits = enhancements.reduce((sum: number, e) => new Decimal(sum).plus(e.watercourseUnitsDelivered).toNumber(), 0);
    // + 'C-1 On-Site WaterC'' Baseline'!W258
    const retainedUnits = baselines.reduce((sum: number, b) => new Decimal(sum).plus(b.unitsRetained).toNumber(), 0);
    // + 'C-1 On-Site WaterC'' Baseline'!AT258
    const bespokeCompensationUnits = baselines.reduce((sum: number, b) => new Decimal(sum).plus(b.vhdhBespokeCompensationUnits).toNumber(), 0);

    return new Decimal(creationUnits).plus(enhancementUnits).plus(retainedUnits).plus(bespokeCompensationUnits).toNumber();
}

/**
 * Calculates the net change in on-site watercourse units and percentage
 * Corresponds to cells H18 and J18 in the Headline Results sheet
 */
export function calculateOnSiteWatercourseNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = new Decimal(postIntervention).minus(baseline).toNumber();
    const percentage = baseline === 0 ? 0 : new Decimal(units).div(baseline).mul(100).toNumber();

    return { units, percentage };
}

/**
 * Calculates the total off-site watercourse baseline units
 * Sums the totalWatercourseUnits from all F-1 baseline entries
 * Corresponds to cell H22 in the Headline Results sheet
 */
export function calculateOffSiteWatercourseBaseline(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[]
): number {
    return baselines.reduce((sum: number, baseline) => new Decimal(sum).plus(baseline.totalWatercourseUnits).toNumber(), 0);
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
    // Sum retained and enhanced units from baselines
    const retainedAndEnhanced = baselines.reduce(
        (sum: number, baseline) => new Decimal(sum).plus(baseline.unitsRetained).plus(baseline.unitsEnhanced).toNumber(),
        0
    );

    // Sum created units
    const created = creations.reduce(
        (sum: number, creation) => new Decimal(sum).plus(creation.unitsDelivered).toNumber(),
        0
    );

    // Sum enhanced units
    const enhanced = enhancements.reduce(
        (sum: number, enhancement) => new Decimal(sum).plus(enhancement.watercourseUnitsDelivered).toNumber(),
        0
    );

    return new Decimal(retainedAndEnhanced).plus(created).plus(enhanced).toNumber();
}

/**
 * Calculates the net change in off-site watercourse units and percentage
 * Corresponds to cells H30 and I30 in the Headline Results sheet
 */
export function calculateOffSiteWatercourseNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = new Decimal(postIntervention).minus(baseline).toNumber();
    const percentage = baseline === 0 ? 0 : new Decimal(units).div(baseline).mul(100).toNumber();

    return { units, percentage };
}

/**
 * Calculates the net change in off-site watercourse units WITH Spatial Risk Multiplier applied
 * SRM is only applied to off-site gains (positive net change)
 * Corresponds to cells H34 and I34 in the Headline Results sheet
 *
*/
export function calculateOffSiteWatercourseNetChangeWithSRM(
    baselines: v.InferOutput<typeof offSiteWatercourseBaselineSchema>[],
    creations: v.InferOutput<typeof offSiteWatercourseCreationSchema>[],
    enhancements: v.InferOutput<typeof offSiteWatercourseEnhancementSchema>[],
    netChangeUnits: number
): number | "N/A" {
    // If net change is <= 0, SRM is not applicable
    if (netChangeUnits <= 0) {
        return "N/A" as const
    }

    // Calculate baseline WITH SRM
    const baselineWithSRM = baselines.reduce(
        (sum: number, baseline) => new Decimal(sum).plus(baseline.totalWatercourseUnitsSRM).toNumber(),
        0
    );

    // Calculate post-intervention WITH SRM
    // For retained/enhanced from baselines, apply SRM manually
    const retainedAndEnhancedWithSRM = baselines.reduce(
        (sum: number, baseline) =>
            new Decimal(sum).plus(new Decimal(baseline.unitsRetained).plus(baseline.unitsEnhanced).mul(baseline.spatialRiskMultiplier)).toNumber(),
        0
    );

    const createdWithSRM = creations.reduce(
        (sum: number, creation) => new Decimal(sum).plus(creation.netUnitChangeWithSpatialRisk).toNumber(),
        0
    );

    const enhancedWithSRM = enhancements.reduce(
        (sum: number, enhancement) => new Decimal(sum).plus(enhancement.watercourseUnitsDeliveredWithSpatialRisk).toNumber(),
        0
    );

    const postInterventionWithSRM = new Decimal(retainedAndEnhancedWithSRM).plus(createdWithSRM).plus(enhancedWithSRM).toNumber();
    return new Decimal(postInterventionWithSRM).minus(baselineWithSRM).toNumber();
}

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
    const habitat = new Decimal(onSiteHabitatNetChange).plus(offSiteHabitatNetChange).toNumber();
    const hedgerow = new Decimal(onSiteHedgerowNetChange).plus(offSiteHedgerowNetChange).toNumber();
    const watercourse = new Decimal(onSiteWatercourseNetChange).plus(offSiteWatercourseNetChange).toNumber();

    return { habitat, hedgerow, watercourse };
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
    const habitat = new Decimal(offSiteHabitatNetChange).minus(zeroNaN(offSiteHabitatNetChangeWithSRM)).toNumber();
    const hedgerow = new Decimal(offSiteHedgerowNetChange).minus(zeroNaN(offSiteHedgerowNetChangeWithSRM)).toNumber();
    const watercourse = new Decimal(offSiteWatercourseNetChange).minus(zeroNaN(offSiteWatercourseNetChangeWithSRM)).toNumber();

    return { habitat, hedgerow, watercourse };
}

function zeroNaN<T>(x: number | T): number {
    return typeof x === "number" ? x : 0;
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
    }
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
    }
}

function unitSummary(baseline: number, postIntervention: number, change: number, changeWithSRM: number | "N/A", target = 1.1) {
    const baselineUnits = baseline;
    const requiredUnits = new Decimal(target).mul(baselineUnits).toNumber();
    const unitDeficit = changeWithSRM === "N/A"
        ? new Decimal(requiredUnits).minus(postIntervention).minus(change).toNumber()
        : new Decimal(requiredUnits).minus(postIntervention).minus(changeWithSRM).toNumber();
    const unitDeficitNormalised = unitDeficit < 0 ? 0 : unitDeficit

    return {
        target,
        baselineUnits: baseline,
        requiredUnits: new Decimal(1.1).mul(baseline).toNumber(),
        unitDeficit: unitDeficitNormalised,
    }
}

/*
 * Calculates all of the fields from the 'Headline Results' sheet
 */
export function headlineResults(features: AllFeatures, tradingSummaries: TradingSummaries) {
    // On-site baseline
    const onSiteHabitatBaseline = calculateOnSiteHabitatBaseline(features.onSiteHabitatBaselines);
    const onSiteHedgerowBaseline = calculateOnSiteHedgerowBaseline(features.onSiteHedgerowBaselines);
    const onSiteWatercourseBaseline = calculateOnSiteWatercourseBaseline(features.onSiteWatercourseBaselines);

    // On-site post intervention
    const onSiteHabitatPostIntervention = calculateOnSiteHabitatPostIntervention(
        features.onSiteHabitatBaselines,
        features.onSiteHabitatCreations,
        features.onSiteHabitatEnhancements
    );
    const onSiteHedgerowPostIntervention = calculateOnSiteHedgerowPostIntervention(
        features.onSiteHedgerowBaselines,
        features.onSiteHedgerowCreations,
        features.onSiteHedgerowEnhancements
    );
    const onSiteWatercoursePostIntervention = calculateOnSiteWatercoursePostIntervention(
        features.onSiteWatercourseBaselines,
        features.onSiteWatercourseCreations,
        features.onSiteWatercourseEnhancements
    );

    // On-site net change
    const onSiteHabitatNetChange = calculateOnSiteHabitatNetChange(
        onSiteHabitatBaseline,
        onSiteHabitatPostIntervention
    );
    const onSiteHedgerowNetChange = calculateOnSiteHedgerowNetChange(
        onSiteHedgerowBaseline,
        onSiteHedgerowPostIntervention
    );
    const onSiteWatercourseNetChange = calculateOnSiteWatercourseNetChange(
        onSiteWatercourseBaseline,
        onSiteWatercoursePostIntervention
    );

    // Off-site baseline
    const offSiteHabitatBaseline = calculateOffSiteHabitatBaseline(features.offSiteHabitatBaselines);
    const offSiteHedgerowBaseline = calculateOffSiteHedgerowBaseline(features.offSiteHedgerowBaselines);
    const offSiteWatercourseBaseline = calculateOffSiteWatercourseBaseline(features.offSiteWatercourseBaselines);

    // Off-site post-intervention
    const offSiteHabitatPostIntervention = calculateOffSiteHabitatPostIntervention(
        features.offSiteHabitatBaselines,
        features.offSiteHabitatCreations,
        features.offSiteHabitatEnhancements
    );
    const offSiteHedgerowPostIntervention = calculateOffSiteHedgerowPostIntervention(
        features.offSiteHedgerowBaselines,
        features.offSiteHedgerowCreations,
        features.offSiteHedgerowEnhancements
    );
    const offSiteWatercoursePostIntervention = calculateOffSiteWatercoursePostIntervention(
        features.offSiteWatercourseBaselines,
        features.offSiteWatercourseCreations,
        features.offSiteWatercourseEnhancements
    );

    // Off-site net change
    const offSiteHabitatNetChange = calculateOffSiteHabitatNetChange(
        offSiteHabitatBaseline,
        offSiteHabitatPostIntervention
    );
    const offSiteHedgerowNetChange = calculateOffSiteHedgerowNetChange(
        offSiteHedgerowBaseline,
        offSiteHedgerowPostIntervention
    );
    const offSiteWatercourseNetChange = calculateOffSiteWatercourseNetChange(
        offSiteWatercourseBaseline,
        offSiteWatercoursePostIntervention
    );

    // Off-site unit change
    // NOTE: this is hidden by default in the sheet
    const offSiteHabitatNetChangeWithSRM = calculateOffSiteHabitatNetChangeWithSRM(
        features.offSiteHabitatBaselines,
        features.offSiteHabitatCreations,
        features.offSiteHabitatEnhancements,
        offSiteHabitatNetChange.units
    );
    const offSiteHedgerowNetChangeWithSRM = calculateOffSiteHedgerowNetChangeWithSRM(
        features.offSiteHedgerowBaselines,
        features.offSiteHedgerowCreations,
        features.offSiteHedgerowEnhancements,
        offSiteHedgerowNetChange.units
    );
    const offSiteWatercourseNetChangeWithSRM = calculateOffSiteWatercourseNetChangeWithSRM(
        features.offSiteWatercourseBaselines,
        features.offSiteWatercourseCreations,
        features.offSiteWatercourseEnhancements,
        offSiteWatercourseNetChange.units
    );

    // Combined net unit change
    const combinedNetUnitChange = calculateCombinedNetUnitChange(
        onSiteHabitatNetChange.units,
        offSiteHabitatNetChange.units,
        onSiteHedgerowNetChange.units,
        offSiteHedgerowNetChange.units,
        onSiteWatercourseNetChange.units,
        offSiteWatercourseNetChange.units
    );

    const totalSRMDeductions = calculateTotalSRMDeductions(
        offSiteHabitatNetChange.units,
        offSiteHabitatNetChangeWithSRM,
        offSiteHedgerowNetChange.units,
        offSiteHedgerowNetChangeWithSRM,
        offSiteWatercourseNetChange.units,
        offSiteWatercourseNetChangeWithSRM
    );

    // FINAL RESULTS
    const totalNetUnitChange = calculateFinalTotalNetUnitChange(
        combinedNetUnitChange,
        totalSRMDeductions,
    );

    const totalNetPercentageChange = calculateTotalNetPercentageChange(
        totalNetUnitChange,
        onSiteHabitatBaseline,
        onSiteHedgerowBaseline,
        onSiteWatercourseBaseline,
    )

    // Trading Summaries
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
    )

    // Unit Summaries
    const habitatUnitSummary = unitSummary(onSiteHabitatBaseline, onSiteHabitatPostIntervention, offSiteHabitatNetChange.units, offSiteHabitatNetChangeWithSRM)
    const hedgerowUnitSummary = unitSummary(onSiteHedgerowBaseline, onSiteHedgerowPostIntervention, offSiteHedgerowNetChange.units, offSiteHedgerowNetChangeWithSRM)
    const watercourseUnitSummary = unitSummary(onSiteWatercourseBaseline, onSiteWatercoursePostIntervention, offSiteWatercourseNetChange.units, offSiteWatercourseNetChangeWithSRM)

    return {
        onSiteHabitatBaseline,
        onSiteHabitatPostIntervention,
        onSiteHabitatNetChange,
        offSiteHabitatBaseline,
        offSiteHabitatPostIntervention,
        offSiteHabitatNetChange,
        offSiteHabitatNetChangeWithSRM,
        onSiteHedgerowBaseline,
        onSiteHedgerowPostIntervention,
        onSiteHedgerowNetChange,
        offSiteHedgerowBaseline,
        offSiteHedgerowPostIntervention,
        offSiteHedgerowNetChange,
        offSiteHedgerowNetChangeWithSRM,
        onSiteWatercourseBaseline,
        onSiteWatercoursePostIntervention,
        onSiteWatercourseNetChange,
        offSiteWatercourseBaseline,
        offSiteWatercoursePostIntervention,
        offSiteWatercourseNetChange,
        offSiteWatercourseNetChangeWithSRM,
        combinedNetUnitChange,
        totalSRMDeductions,
        totalNetUnitChange,
        totalNetPercentageChange,
        tradingRulesSatisfied,
        habitatUnitSummary,
        hedgerowUnitSummary,
        watercourseUnitSummary,
    };
}

export type HeadlineResults = ReturnType<typeof headlineResults>

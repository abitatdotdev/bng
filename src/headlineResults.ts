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
import { habitatTradingSummary } from './tradingSummaries/habitats';
import { hedgerowTradingSummary } from './tradingSummaries/hedgerows';
import { watercourseTradingSummary } from './tradingSummaries/watercourses';

/**
 * Calculates the total on-site habitat baseline units
 * Sums the totalHabitatUnits from all A-1 baseline entries
 * Corresponds to cell H8 in the Headline Results sheet
 */
export function calculateOnSiteHabitatBaseline(
    baselines: v.InferOutput<typeof onSiteHabitatBaselineSchema>[]
): number {
    return baselines.reduce((sum, baseline) => sum + baseline.totalHabitatUnits, 0);
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
    return (
        creations.reduce((sum, c) => sum + c.habitatUnitsDelivered, 0)
        + enhancements.reduce((sum, e) => sum + e.habitatUnitsDelivered, 0)
        + baselines.reduce((sum, b) => sum + b.baselineUnitsRetained + b.vhdhBespokeCompensationUnits, 0)
    )
}

/**
 * Calculates the net change in on-site habitat units and percentage
 * Corresponds to cells H16 and I16 in the Headline Results sheet
 */
export function calculateOnSiteHabitatNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = postIntervention - baseline;
    const percentage = baseline === 0 ? 0 : (units / baseline) * 100;

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
    return baselines.reduce((sum, baseline) => sum + baseline.totalHabitatUnits, 0);
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
    return (
        creations.reduce((sum, c) => sum + c.habitatUnitsDelivered, 0)
        + enhancements.reduce((sum, e) => sum + e.habitatUnitsDelivered, 0)
        + baselines.reduce((sum, b) => sum + b.baselineUnitsRetained + b.vhdhBespokeCompensationUnits, 0)
    )
}

/**
 * Calculates the net change in off-site habitat units and percentage
 * Corresponds to cells H28 and I28 in the Headline Results sheet
 */
export function calculateOffSiteHabitatNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = postIntervention - baseline;
    const percentage = baseline === 0 ? 0 : (units / baseline) * 100;

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
        (sum, baseline) => sum + baseline.totalHabitatUnitsSRM,
        0
    );

    // Calculate post-intervention WITH SRM
    const sumBaselineUnitsRetained = baselines.reduce((sum, baseline) => sum + baseline.baselineUnitsRetainedWithSRM, 0)
    const sumCreatedUnitsDelivered = creations.reduce((sum, creation) => sum + creation.habitatUnitsDeliveredWithSpatialRisk, 0)
    const sumEnhancedUnitsDelivered = enhancements.reduce((sum, enhancement) => sum + enhancement.habitatUnitsDeliveredWithSpatialRisk, 0)

    const postInterventionWithSRM = sumBaselineUnitsRetained + sumCreatedUnitsDelivered + sumEnhancedUnitsDelivered;

    // Calculate net change WITH SRM
    return postInterventionWithSRM - baselineWithSRM;
}

/**
 * Calculates the total on-site hedgerow baseline units
 * Sums the totalHedgerowUnits from all B-1 baseline entries
 * Corresponds to cell H9 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowBaseline(
    baselines: v.InferOutput<typeof onSiteHedgerowBaselineSchema>[]
): number {
    return baselines.reduce((sum, baseline) => sum + baseline.totalHedgerowUnits, 0);
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
    const createdUnits = creations.reduce((sum, c) => sum + c.hedgerowUnitsDelivered, 0)
    // +'B-3 On-Site Hedge Enhancement'!AH258
    const enhancedUnits = enhancements.reduce((sum, e) => sum + e.hedgerowUnitsDelivered, 0)
    // +'B-1 On-Site Hedge Baseline'!R258
    const retainedUnits = baselines.reduce((sum, b) => sum + b.unitsRetained, 0)
    return createdUnits + enhancedUnits + retainedUnits
}

/**
 * Calculates the net change in on-site hedgerow units and percentage
 * Corresponds to cells H17 and J17 in the Headline Results sheet
 */
export function calculateOnSiteHedgerowNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = postIntervention - baseline;
    const percentage = baseline === 0 ? 0 : (units / baseline) * 100;

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
    return baselines.reduce((sum, baseline) => sum + baseline.totalHedgerowUnits, 0);
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
        (sum, baseline) => sum + baseline.unitsRetained + baseline.unitsEnhanced,
        0
    );

    // Sum created units
    const created = creations.reduce(
        (sum, creation) => sum + creation.hedgerowUnitsDelivered,
        0
    );

    // Sum enhanced units
    const enhanced = enhancements.reduce(
        (sum, enhancement) => sum + enhancement.hedgerowUnitsDelivered,
        0
    );

    return retainedAndEnhanced + created + enhanced;
}

/**
 * Calculates the net change in off-site hedgerow units and percentage
 * Corresponds to cells H29 and I29 in the Headline Results sheet
 */
export function calculateOffSiteHedgerowNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = postIntervention - baseline;
    const percentage = baseline === 0 ? 0 : (units / baseline) * 100;

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
        (sum, baseline) => sum + baseline.totalHedgerowUnitsSRM,
        0
    );

    // Calculate post-intervention WITH SRM
    // For retained/enhanced from baselines, apply SRM manually
    const retainedAndEnhancedWithSRM = baselines.reduce(
        (sum, baseline) =>
            sum + (baseline.unitsRetained + baseline.unitsEnhanced) * baseline.spatialRiskMultiplier,
        0
    );

    // Created and enhanced already have SRM-adjusted values
    const createdWithSRM = creations.reduce(
        (sum, creation) => sum + creation.hedgerowUnitsDeliveredWithSpatialRisk,
        0
    );

    const enhancedWithSRM = enhancements.reduce(
        (sum, enhancement) => sum + enhancement.hedgerowUnitsDeliveredWithSpatialRisk,
        0
    );

    const postInterventionWithSRM = retainedAndEnhancedWithSRM + createdWithSRM + enhancedWithSRM;

    return postInterventionWithSRM - baselineWithSRM;
}

/**
 * Calculates the total on-site watercourse baseline units
 * Sums the totalWatercourseUnits from all C-1 baseline entries
 * Corresponds to cell H10 in the Headline Results sheet
 */
export function calculateOnSiteWatercourseBaseline(
    baselines: v.InferOutput<typeof onSiteWatercourseBaselineSchema>[]
): number {
    return baselines.reduce((sum, baseline) => sum + baseline.totalWatercourseUnits, 0);
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
    const creationUnits = creations.reduce((sum, c) => sum + c.unitsDelivered, 0)
    // + 'C-3 On-Site WaterC'' Enhancement'!AM258
    const enhancementUnits = enhancements.reduce((sum, e) => sum + e.watercourseUnitsDelivered, 0)
    // + 'C-1 On-Site WaterC'' Baseline'!W258
    const retainedUnits = baselines.reduce((sum, b) => sum + b.unitsRetained, 0)
    // + 'C-1 On-Site WaterC'' Baseline'!AT258
    const bespokeCompensationUnits = baselines.reduce((sum, b) => sum + b.vhdhBespokeCompensationUnits, 0)

    return creationUnits + enhancementUnits + retainedUnits + bespokeCompensationUnits
}

/**
 * Calculates the net change in on-site watercourse units and percentage
 * Corresponds to cells H18 and J18 in the Headline Results sheet
 */
export function calculateOnSiteWatercourseNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = postIntervention - baseline;
    const percentage = baseline === 0 ? 0 : (units / baseline) * 100;

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
    return baselines.reduce((sum, baseline) => sum + baseline.totalWatercourseUnits, 0);
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
        (sum, baseline) => sum + baseline.unitsRetained + baseline.unitsEnhanced,
        0
    );

    // Sum created units
    const created = creations.reduce(
        (sum, creation) => sum + creation.unitsDelivered,
        0
    );

    // Sum enhanced units
    const enhanced = enhancements.reduce(
        (sum, enhancement) => sum + enhancement.watercourseUnitsDelivered,
        0
    );

    return retainedAndEnhanced + created + enhanced;
}

/**
 * Calculates the net change in off-site watercourse units and percentage
 * Corresponds to cells H30 and I30 in the Headline Results sheet
 */
export function calculateOffSiteWatercourseNetChange(
    baseline: number,
    postIntervention: number
): { units: number; percentage: number } {
    const units = postIntervention - baseline;
    const percentage = baseline === 0 ? 0 : (units / baseline) * 100;

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
        (sum, baseline) => sum + baseline.totalWatercourseUnitsSRM,
        0
    );

    // Calculate post-intervention WITH SRM
    // For retained/enhanced from baselines, apply SRM manually
    const retainedAndEnhancedWithSRM = baselines.reduce(
        (sum, baseline) =>
            sum + (baseline.unitsRetained + baseline.unitsEnhanced) * baseline.spatialRiskMultiplier,
        0
    );

    const createdWithSRM = creations.reduce(
        (sum, creation) => sum + creation.netUnitChangeWithSpatialRisk,
        0
    );

    const enhancedWithSRM = enhancements.reduce(
        (sum, enhancement) => sum + enhancement.watercourseUnitsDeliveredWithSpatialRisk,
        0
    );

    const postInterventionWithSRM = retainedAndEnhancedWithSRM + createdWithSRM + enhancedWithSRM;
    return postInterventionWithSRM - baselineWithSRM;
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
    const habitat = onSiteHabitatNetChange + offSiteHabitatNetChange;
    const hedgerow = onSiteHedgerowNetChange + offSiteHedgerowNetChange;
    const watercourse = onSiteWatercourseNetChange + offSiteWatercourseNetChange;

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
    const habitat = offSiteHabitatNetChange - zeroNaN(offSiteHabitatNetChangeWithSRM);
    const hedgerow = offSiteHedgerowNetChange - zeroNaN(offSiteHedgerowNetChangeWithSRM);
    const watercourse = offSiteWatercourseNetChange - zeroNaN(offSiteWatercourseNetChangeWithSRM);

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
        habitat: combinedNetUnitChange.habitat - totalSRMDeductions.habitat,
        hedgerow: combinedNetUnitChange.hedgerow - totalSRMDeductions.hedgerow,
        watercourse: combinedNetUnitChange.watercourse - totalSRMDeductions.watercourse,
    }
}

export function calculateTotalNetPercentageChange(
    totalNetUnitChange: ReturnType<typeof calculateFinalTotalNetUnitChange>,
    onSiteHabitatBaseline: number,
    onSiteHedgerowBaseline: number,
    onSiteWatercourseBaseline: number,
) {
    return {
        habitat: onSiteHabitatBaseline === 0 ? 0 : totalNetUnitChange.habitat / onSiteHabitatBaseline,
        hedgerow: onSiteHedgerowBaseline === 0 ? 0 : totalNetUnitChange.hedgerow / onSiteHedgerowBaseline,
        watercourse: onSiteWatercourseBaseline === 0 ? 0 : totalNetUnitChange.watercourse / onSiteWatercourseBaseline,
    }
}

function unitSummary(baseline: number, postIntervention: number, change: number, changeWithSRM: number | "N/A", target = 1.1) {
    const baselineUnits = baseline;
    const requiredUnits = target * baselineUnits;
    const unitDeficit = changeWithSRM === "N/A"
        ? requiredUnits - postIntervention - change
        : requiredUnits - postIntervention - changeWithSRM
    const unitDeficitNormalised = unitDeficit < 0 ? 0 : unitDeficit

    return {
        target,
        baselineUnits: baseline,
        requiredUnits: 1.1 * baseline,
        unitDeficit: unitDeficitNormalised,
    }
}

/*
 * Calculates all of the fields from the 'Headline Results' sheet
 */
export function headlineResults(data: AllFeatures) {
    // On-site baseline
    const onSiteHabitatBaseline = calculateOnSiteHabitatBaseline(data.onSiteHabitatBaselines);
    const onSiteHedgerowBaseline = calculateOnSiteHedgerowBaseline(data.onSiteHedgerowBaselines);
    const onSiteWatercourseBaseline = calculateOnSiteWatercourseBaseline(data.onSiteWatercourseBaselines);

    // On-site post intervention
    const onSiteHabitatPostIntervention = calculateOnSiteHabitatPostIntervention(
        data.onSiteHabitatBaselines,
        data.onSiteHabitatCreations,
        data.onSiteHabitatEnhancements
    );
    const onSiteHedgerowPostIntervention = calculateOnSiteHedgerowPostIntervention(
        data.onSiteHedgerowBaselines,
        data.onSiteHedgerowCreations,
        data.onSiteHedgerowEnhancements
    );
    const onSiteWatercoursePostIntervention = calculateOnSiteWatercoursePostIntervention(
        data.onSiteWatercourseBaselines,
        data.onSiteWatercourseCreations,
        data.onSiteWatercourseEnhancements
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
    const offSiteHabitatBaseline = calculateOffSiteHabitatBaseline(data.offSiteHabitatBaselines);
    const offSiteHedgerowBaseline = calculateOffSiteHedgerowBaseline(data.offSiteHedgerowBaselines);
    const offSiteWatercourseBaseline = calculateOffSiteWatercourseBaseline(data.offSiteWatercourseBaselines);

    // Off-site post-intervention
    const offSiteHabitatPostIntervention = calculateOffSiteHabitatPostIntervention(
        data.offSiteHabitatBaselines,
        data.offSiteHabitatCreations,
        data.offSiteHabitatEnhancements
    );
    const offSiteHedgerowPostIntervention = calculateOffSiteHedgerowPostIntervention(
        data.offSiteHedgerowBaselines,
        data.offSiteHedgerowCreations,
        data.offSiteHedgerowEnhancements
    );
    const offSiteWatercoursePostIntervention = calculateOffSiteWatercoursePostIntervention(
        data.offSiteWatercourseBaselines,
        data.offSiteWatercourseCreations,
        data.offSiteWatercourseEnhancements
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
        data.offSiteHabitatBaselines,
        data.offSiteHabitatCreations,
        data.offSiteHabitatEnhancements,
        offSiteHabitatNetChange.units
    );
    const offSiteHedgerowNetChangeWithSRM = calculateOffSiteHedgerowNetChangeWithSRM(
        data.offSiteHedgerowBaselines,
        data.offSiteHedgerowCreations,
        data.offSiteHedgerowEnhancements,
        offSiteHedgerowNetChange.units
    );
    const offSiteWatercourseNetChangeWithSRM = calculateOffSiteWatercourseNetChangeWithSRM(
        data.offSiteWatercourseBaselines,
        data.offSiteWatercourseCreations,
        data.offSiteWatercourseEnhancements,
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
    const habitatTradingSummaries = habitatTradingSummary(data);
    const hedgerowTradingSummaries = hedgerowTradingSummary(data);
    const watercourseTradingSummaries = watercourseTradingSummary(data);
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

/**
 * Shared watercourse calculation functions
 *
 * This module contains calculation functions that are identical between
 * on-site and off-site watercourse modules (baseline, creation, enhancement).
 *
 * All functions use generics to work with both on-site and off-site types.
 */

import { allWatercourses, type Watercourse, type WatercourseLabel } from '../watercourses';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { yearsToTargetCondition, type WatercourseCondition } from '../watercourseCondition';
import {
    watercourseEncroachmentMultipliers,
    riparianEncroachmentMultipliers,
    type WatercourseEncroachment,
    type RiparianEncroachment
} from '../watercourseEncroachment';
import { getTemporalMultiplier, lookupTemporalMultiplier } from '../temporalMultipliers';
import { difficulty } from '../difficulty';
import { watercourseEnhancementTemporalMatrix } from '../watercourseEnhancementTemporalMatrix';

// ============================================================================
// BASELINE FUNCTIONS
// ============================================================================

/**
 * Enrich data with watercourse properties from the watercourses lookup.
 * Used by baseline modules to add metadata and encroachment multipliers.
 */
export function enrichWithBaselineWatercourseData<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    watercourseType: WatercourseLabel;
    condition: WatercourseCondition;
    strategicSignificance: StrategicSignificanceDescription;
    watercourseEncroachment: string;
    riparianEncroachment: string;
}>(data: Data) {
    const watercourse = allWatercourses[data.watercourseType];

    // Get condition score from watercourse lookup
    // Note: conditionScore can be 'Not possible' string or a number
    const conditionScore = watercourse.conditions[data.condition] as number | 'Not possible';

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    // Type-safe lookups with assertion since values are from picklist
    const watercourseEncroachmentMultiplier = watercourseEncroachmentMultipliers[data.watercourseEncroachment as keyof typeof watercourseEncroachmentMultipliers];
    const riparianEncroachmentMultiplier = riparianEncroachmentMultipliers[data.riparianEncroachment as keyof typeof riparianEncroachmentMultipliers];

    return {
        ...data,
        distinctiveness: watercourse.distinctivenessCategory,
        distinctivenessScore: watercourse.distinctivenessScore,
        conditionScore,
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        watercourseEncroachmentMultiplier,
        riparianEncroachmentMultiplier,
        tradingRules: watercourse.tradingRules,
        irreplaceable: watercourse.irreplaceable,
    };
}

/**
 * Calculate baseline units for retained and enhanced portions.
 * Used by both on-site and off-site baseline calculations.
 */
export function enrichWithBaselineUnitsData<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number | 'Not possible';
    strategicSignificanceMultiplier: number;
    watercourseEncroachmentMultiplier: number;
    riparianEncroachmentMultiplier: number;
}>(data: Data) {
    // At this point, validation has ensured conditionScore is a number
    const conditionScore = data.conditionScore as number;
    const unitsRetained = data.lengthRetained
        * data.distinctivenessScore
        * conditionScore
        * data.strategicSignificanceMultiplier
        * data.watercourseEncroachmentMultiplier
        * data.riparianEncroachmentMultiplier;

    const unitsEnhanced = data.lengthEnhanced
        * data.distinctivenessScore
        * conditionScore
        * data.strategicSignificanceMultiplier
        * data.watercourseEncroachmentMultiplier
        * data.riparianEncroachmentMultiplier;

    return {
        ...data,
        unitsRetained,
        unitsEnhanced,
    };
}

/**
 * Calculate total watercourse units.
 * Used by both on-site and off-site baseline calculations.
 */
export function enrichWithTotalWatercourseUnits<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number | 'Not possible';
    strategicSignificanceMultiplier: number;
    watercourseEncroachmentMultiplier: number;
    riparianEncroachmentMultiplier: number;
}>(data: Data) {
    // At this point, validation has ensured conditionScore is a number
    const conditionScore = data.conditionScore as number;

    const totalWatercourseUnits = data.length
        * data.distinctivenessScore
        * conditionScore
        * data.strategicSignificanceMultiplier
        * data.watercourseEncroachmentMultiplier
        * data.riparianEncroachmentMultiplier;

    return {
        ...data,
        totalWatercourseUnits,
    };
}

/**
 * Calculate length lost and units lost.
 * Used by both on-site and off-site baseline calculations.
 */
export function enrichWithUnitsLost<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    totalWatercourseUnits: number;
    unitsRetained: number;
    unitsEnhanced: number;
}>(data: Data) {
    const lengthLost = data.length - data.lengthRetained - data.lengthEnhanced;
    const unitsLost = lengthLost === 0 ? 0 :
        data.totalWatercourseUnits - data.unitsRetained - data.unitsEnhanced;

    return {
        ...data,
        lengthLost,
        unitsLost,
    };
}

// ============================================================================
// CREATION FUNCTIONS
// ============================================================================

/**
 * Enrich data with watercourse properties from the watercourses lookup.
 * Used by creation modules to add metadata and time to target.
 */
export function enrichWithCreationWatercourseData<Data extends {
    watercourseType: WatercourseLabel;
    condition: WatercourseCondition;
    strategicSignificance: StrategicSignificanceDescription;
}>(data: Data) {
    const watercourse = allWatercourses[data.watercourseType];

    // Get condition score from watercourse lookup
    const conditionScore = watercourse.conditions[data.condition] as number | 'Not possible';
    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);
    const standardTimeToTarget = yearsToTargetCondition[data.condition];

    return {
        ...data,
        distinctiveness: watercourse.distinctivenessCategory,
        distinctivenessScore: watercourse.distinctivenessScore,
        conditionScore,
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        standardTimeToTarget,
        standardDifficulty: watercourse.technicalDifficultyOfCreation,
        tradingRules: watercourse.tradingRules,
        irreplaceable: watercourse.irreplaceable,
    };
}

/**
 * Calculate temporal adjustments and multiplier.
 * Used by both on-site and off-site creation calculations.
 */
export function enrichWithTemporalData<Data extends {
    watercourseType: WatercourseLabel;
    condition: WatercourseCondition;
    habitatCreatedInAdvance: number;
    delayInStarting: number;
    standardTimeToTarget: number;
}>(data: Data) {

    // Cell 012
    const standardOrAdjustedTimeToTargetCondition =
        (data.standardTimeToTarget <= data.habitatCreatedInAdvance && data.delayInStarting === 0)
            ? "Check details - Is there evidence that habitat has reached target condition? ⚠" as const
            : data.habitatCreatedInAdvance > 0
                ? "Check details - Is there evidence habitat creation started/in place? ⚠" as const
                : data.delayInStarting > 0
                    ? "Check details- Delay in starting habitat in required condition? ⚠" as const
                    : "Standard time to target condition applied" as const;

    // Calculate adjusted time to target
    let finalTimeToTarget = data.standardTimeToTarget + data.delayInStarting - data.habitatCreatedInAdvance;

    // Cap at 30+ years
    if (finalTimeToTarget > 30) {
        finalTimeToTarget = 30;
    }

    // Ensure minimum of 0
    if (finalTimeToTarget < 0) {
        finalTimeToTarget = 0;
    }

    const temporalMultiplier = getTemporalMultiplier(finalTimeToTarget as any) as number;

    // Check for special ditch category (Ditches with Fairly Poor or Fairly Good)
    const isDitchFairlyCategory = data.watercourseType === 'Ditches' &&
        (data.condition === 'Fairly Poor' || data.condition === 'Fairly Good');

    return {
        ...data,
        standardOrAdjustedTimeToTargetCondition,
        finalTimeToTarget,
        temporalMultiplier,
        isDitchFairlyCategory,
    };
}

/**
 * Calculate difficulty multiplier.
 * Used by both on-site and off-site creation calculations.
 */
export function enrichWithDifficultyData<Data extends {
    standardOrAdjustedTimeToTargetCondition: ReturnType<typeof enrichWithTemporalData>['standardOrAdjustedTimeToTargetCondition'],
    standardTimeToTarget: ReturnType<typeof enrichWithCreationWatercourseData>['standardTimeToTarget'],
    standardDifficulty: ReturnType<typeof enrichWithCreationWatercourseData>['standardDifficulty'],
    isDitchFairlyCategory: boolean;
    habitatCreatedInAdvance: number;
}>(data: Data) {

    const standardDifficultyOfCreation = data.standardDifficulty;
    const appliedDifficulty =
        data.standardOrAdjustedTimeToTargetCondition === "Check details - Is there evidence that habitat has reached target condition? ⚠"
            ? "Low Difficulty - only applicable if all habitat created before losses ⚠" as const
            : "Standard difficulty applied" as const;

    const finalDifficultyOfCreation =
        (appliedDifficulty === "Standard difficulty applied"
            && (typeof data.standardTimeToTarget === "number" && data.standardTimeToTarget > data.habitatCreatedInAdvance))
            ? standardDifficultyOfCreation
            : (appliedDifficulty === "Low Difficulty - only applicable if all habitat created before losses ⚠"
                && (typeof data.standardTimeToTarget === "number"
                    && data.habitatCreatedInAdvance >= data.standardTimeToTarget))
                ? "Low"
                : standardDifficultyOfCreation;

    const difficultyMultiplier = difficulty[finalDifficultyOfCreation];

    return {
        ...data,
        appliedDifficulty,
        finalDifficultyOfCreation,
        difficultyMultiplier,
    };
}

/**
 * Calculate encroachment multipliers for creation.
 * Used by both on-site and off-site creation calculations.
 */
export function enrichCreationWithEncroachmentData<Data extends {
    watercourseType: WatercourseLabel;
    watercourseEncroachment: WatercourseEncroachment;
    riparianEncroachment: RiparianEncroachment;
}>(data: Data) {
    const watercourseEncroachmentMultiplier = watercourseEncroachmentMultipliers[data.watercourseEncroachment];
    const riparianEncroachmentMultiplier = riparianEncroachmentMultipliers[data.riparianEncroachment];

    return {
        ...data,
        watercourseEncroachmentMultiplier,
        riparianEncroachmentMultiplier,
    };
}

/**
 * Calculate final net unit change for creation.
 * Used by both on-site and off-site creation calculations.
 */
export function enrichWithUnitsDelivered<Data extends {
    length: number;
    distinctivenessScore: number;
    conditionScore: number | 'Not possible';
    strategicSignificanceMultiplier: number;
    temporalMultiplier: number;
    difficultyMultiplier: number;
    watercourseEncroachmentMultiplier: number;
    riparianEncroachmentMultiplier: number;
}>(data: Data) {
    // At this point, validation has ensured conditionScore is a number
    const conditionScore = data.conditionScore as number;

    const unitsDelivered = data.length
        * data.distinctivenessScore
        * conditionScore
        * data.strategicSignificanceMultiplier
        * data.temporalMultiplier
        * data.difficultyMultiplier
        * data.watercourseEncroachmentMultiplier
        * data.riparianEncroachmentMultiplier;

    return {
        ...data,
        unitsDelivered,
    };
}

// ============================================================================
// ENHANCEMENT FUNCTIONS
// ============================================================================

/**
 * Fallback years when baseline distinctiveness < proposed distinctiveness
 * (i.e., when upgrading to a rarer habitat type)
 */
export const DISTINCTIVENESS_UPGRADE_YEARS = 10;

/**
 * Helper to convert years value to number for arithmetic.
 * Used in enhancement calculations.
 */
export function yearsToNumber(years: number | "30+"): number {
    return years === "30+" ? 31 : years;
}

/**
 * Extract baseline watercourse data including length.
 * The baseline contains the length that is being enhanced.
 * Generic to work with both OnSiteWatercourseBaseline and OffSiteWatercourseBaseline.
 */
export function enrichBaselineWatercourseData<
    Baseline extends {
        lengthEnhanced: number;
        watercourseType: WatercourseLabel;
        distinctivenessScore: number;
        distinctiveness: string;
        conditionScore: number | 'Not possible';
        condition: WatercourseCondition;
    },
    Data extends { baseline: Baseline }
>(data: Data) {
    const { baseline } = data;

    return {
        ...data,
        length: baseline.lengthEnhanced,
        _baselineWatercourse: {
            label: baseline.watercourseType,
            distinctivenessScore: baseline.distinctivenessScore,
            distinctivenessCategory: baseline.distinctiveness,
        },
        _baselineCondition: baseline.conditionScore,
        _baselineConditionLabel: baseline.condition,
    };
}

/**
 * Enrich data with proposed watercourse properties from the watercourses lookup.
 * Used by enhancement modules.
 */
export function enrichProposedWatercourseData<Data extends {
    watercourseType: WatercourseLabel;
    condition: WatercourseCondition;
    strategicSignificance: StrategicSignificanceDescription;
}>(data: Data) {
    const watercourse = allWatercourses[data.watercourseType];

    // Get condition score from watercourse lookup
    const conditionScore = watercourse.conditions[data.condition] as number | 'Not possible';

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    return {
        ...data,
        distinctiveness: watercourse.distinctivenessCategory,
        distinctivenessScore: watercourse.distinctivenessScore,
        conditionScore,
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        tradingRules: watercourse.tradingRules,
        technicalDifficulty: watercourse.technicalDifficultyOfEnhancement,
        irreplaceable: watercourse.irreplaceable,
    };
}

/**
 * Add enhancement pathway label.
 * Format: "baseline condition to proposed condition"
 */
export function addEnhancementPathway<Data extends {
    _baselineConditionLabel: WatercourseCondition;
    condition: WatercourseCondition;
}>(data: Data) {
    const enhancementPathway = `${data._baselineConditionLabel} to ${data.condition}`;

    return {
        ...data,
        enhancementPathway
    };
}

/**
 * Lookup enhancement time to target from watercourse enhancement temporal data.
 * Uses the enhancement pathway (baseline→proposed condition) to find years to target.
 * Special case: If baseline distinctiveness < proposed distinctiveness, use fallback (10 years).
 */
export function lookupEnhancementTimeToTarget<Data extends {
    _baselineWatercourse: { distinctivenessScore: number };
    distinctivenessScore: number;
    enhancementPathway: string;
}>(data: Data) {
    const baselineDistinctiveness = data._baselineWatercourse.distinctivenessScore;
    const proposedDistinctiveness = data.distinctivenessScore;

    let timeToTargetCondition: number | "N/A";

    // Special case: If upgrading distinctiveness (e.g., Ditches to Other rivers and streams)
    if (baselineDistinctiveness < proposedDistinctiveness) {
        timeToTargetCondition = DISTINCTIVENESS_UPGRADE_YEARS;
    } else {
        // Normal case: lookup from enhancement matrix
        const pathwayValue = watercourseEnhancementTemporalMatrix[data.enhancementPathway];
        timeToTargetCondition = pathwayValue !== undefined ? pathwayValue : "N/A";
    }

    return {
        ...data,
        timeToTargetCondition
    };
}

/**
 * Calculate final time to target condition based on:
 * - Standard enhancement time (from enhancement temporal data)
 * - Years of watercourse enhanced in advance
 * - Years of delay in starting enhancement
 */
export function calculateFinalTimeToTargetValues<Data extends {
    timeToTargetCondition: number | "N/A";
    watercourseEnhancedInAdvance: number | "30+";
    watercourseEnhancedDelay: number | "30+";
}>(data: Data) {
    const { timeToTargetCondition, watercourseEnhancedInAdvance, watercourseEnhancedDelay } = data;

    let finalTimeToTargetCondition: number | "30+" | "N/A";
    const normalisedEnhancedInAdvance = yearsToNumber(watercourseEnhancedInAdvance);
    const normalisedEnhancedDelay = yearsToNumber(watercourseEnhancedDelay);

    // If standard time is "N/A", final time is also "N/A"
    if (timeToTargetCondition === "N/A") {
        finalTimeToTargetCondition = "N/A";
    }
    // If advance >= standard time, final time is 0
    else if (normalisedEnhancedInAdvance >= timeToTargetCondition) {
        finalTimeToTargetCondition = 0;
    }
    // Calculate: standardTime - advance + delay
    else {
        const result = timeToTargetCondition - normalisedEnhancedInAdvance + normalisedEnhancedDelay;

        // Cap at "30+" if result > 30
        if (result > 30) {
            finalTimeToTargetCondition = "30+";
        } else {
            // Ensure non-negative result
            finalTimeToTargetCondition = Math.max(0, result);
        }
    }

    // Look up the temporal multiplier for the final time
    const temporalMultiplier = typeof finalTimeToTargetCondition === 'number' || finalTimeToTargetCondition === '30+'
        ? lookupTemporalMultiplier(finalTimeToTargetCondition)
        : finalTimeToTargetCondition;

    return {
        ...data,
        finalTimeToTargetCondition,
        temporalMultiplier
    };
}

/**
 * Determine enhancement difficulty based on whether watercourse reached target before losses.
 */
export function determineEnhancementDifficulty<Data extends {
    watercourseEnhancedInAdvance: number | "30+";
    finalTimeToTargetCondition: number | "30+" | "N/A";
    technicalDifficulty: Watercourse['technicalDifficultyOfEnhancement'];
}>(data: Data) {
    // Normalize watercourseEnhancedInAdvance for comparisons
    const normalisedEnhancedInAdvance = yearsToNumber(data.watercourseEnhancedInAdvance);
    // Standard difficulty of enhancement
    const standardDifficultyOfEnhancement = data.technicalDifficulty;

    // Determine if watercourse has reached target condition (advance > 0 and final time is 0)
    const hasReachedTargetCondition =
        normalisedEnhancedInAdvance > 0 &&
        data.finalTimeToTargetCondition === 0;

    let appliedDifficultyMultiplier: string;
    let finalDifficultyOfEnhancement: keyof typeof difficulty;
    if (hasReachedTargetCondition) {
        appliedDifficultyMultiplier = "Low Difficulty - only applicable if all watercourse enhanced before losses ⚠";
        finalDifficultyOfEnhancement = "Low";
    } else {
        appliedDifficultyMultiplier = "Standard difficulty applied";
        finalDifficultyOfEnhancement = standardDifficultyOfEnhancement as keyof typeof difficulty;
    }

    // Difficulty multiplier applied
    const difficultyMultiplierApplied = difficulty[finalDifficultyOfEnhancement];

    return {
        ...data,
        standardDifficultyOfEnhancement,
        appliedDifficultyMultiplier,
        finalDifficultyOfEnhancement,
        difficultyMultiplierApplied
    };
}

/**
 * Calculate encroachment multipliers for enhancement.
 * Used by both on-site and off-site enhancement calculations.
 */
export function enrichEnhancementWithEncroachmentData<Data extends {
    watercourseEncroachment: WatercourseEncroachment;
    riparianEncroachment: RiparianEncroachment;
}>(data: Data) {
    const watercourseEncroachmentMultiplier = watercourseEncroachmentMultipliers[data.watercourseEncroachment];
    const riparianEncroachmentMultiplier = riparianEncroachmentMultipliers[data.riparianEncroachment];

    return {
        ...data,
        watercourseEncroachmentMultiplier,
        riparianEncroachmentMultiplier,
    };
}

/**
 * Calculate watercourse units delivered from enhancement as NET GAIN over baseline.
 *
 * Formula (Delta Method):
 * - If proposed length > baseline length:
 *   ((proposedLength × proposedD × proposedC) - (baselineLength × baselineD × baselineC)) × difficulty × temporal
 *   + (baselineLength × baselineD × baselineC)
 *   then apply: × strategic × watercourseEncroachment × riparianEncroachment
 *
 * - If proposed length <= baseline length:
 *   ((proposedLength × proposedD × proposedC) - (proposedLength × baselineD × baselineC)) × difficulty × temporal
 *   + (proposedLength × baselineD × baselineC)
 *   then apply: × strategic × watercourseEncroachment × riparianEncroachment
 *
 * This accounts for partial enhancement scenarios where only part of baseline is enhanced.
 */
export function calculateEnhancementUnitsDelivered<
    Baseline extends {
        lengthEnhanced: number;
    },
    Data extends {
        length: number;
        _baselineWatercourse: any;
        _baselineCondition: number | 'Not possible';
        distinctivenessScore: number;
        conditionScore: number | 'Not possible';
        strategicSignificanceMultiplier: number;
        temporalMultiplier: number | string;
        difficultyMultiplierApplied: number;
        watercourseEncroachmentMultiplier: number;
        riparianEncroachmentMultiplier: number;
        baseline: Baseline;
    }
>(data: Data) {
    const proposedLength = data.length;
    const baselineLength = data.baseline.lengthEnhanced;
    const baselineD = data._baselineWatercourse.distinctivenessScore;
    const baselineC = data._baselineCondition as number; // Validation ensures it's a number
    const proposedD = data.distinctivenessScore;
    const proposedC = data.conditionScore as number; // Validation ensures it's a number
    const strategic = data.strategicSignificanceMultiplier;
    const difficultyMult = data.difficultyMultiplierApplied;
    const temporal = typeof data.temporalMultiplier === 'number' ? data.temporalMultiplier : 0;
    const watercourseEncroachment = data.watercourseEncroachmentMultiplier;
    const riparianEncroachment = data.riparianEncroachmentMultiplier;

    let watercourseUnitsDelivered: number;

    // Delta method accounting for length changes
    if (proposedLength > baselineLength) {
        // Proposed length exceeds baseline - use baseline length for baseline calculation
        const proposedUnits = proposedLength * proposedD * proposedC;
        const baselineUnits = baselineLength * baselineD * baselineC;
        const delta = (proposedUnits - baselineUnits) * difficultyMult * temporal;
        watercourseUnitsDelivered = (delta + baselineUnits) * strategic * watercourseEncroachment * riparianEncroachment;
    } else {
        // Proposed length <= baseline - use proposed length for baseline calculation
        const proposedUnits = proposedLength * proposedD * proposedC;
        const baselineUnits = proposedLength * baselineD * baselineC;
        const delta = (proposedUnits - baselineUnits) * difficultyMult * temporal;
        watercourseUnitsDelivered = (delta + baselineUnits) * strategic * watercourseEncroachment * riparianEncroachment;
    }

    return {
        ...data,
        watercourseUnitsDelivered
    };
}

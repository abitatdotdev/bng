import { Decimal, toDecimal } from '../decimal';
/**
 * Shared watercourse calculation functions
 *
 * This module contains calculation functions that are identical between
 * on-site and off-site watercourse modules (baseline, creation, enhancement).
 *
 * All functions use generics to work with both on-site and off-site types.
 */

import { allWatercourses, type Watercourse, type WatercourseLabel } from '../watercourses';
import {
    getStrategicSignificance,
    type StrategicSignificanceDescription,
} from '../strategicSignificanceSchema';
import { yearsToTargetCondition, type WatercourseCondition } from '../watercourseCondition';
import {
    watercourseEncroachmentMultipliers,
    riparianEncroachmentMultipliers,
    type WatercourseEncroachment,
    type RiparianEncroachment,
} from '../watercourseEncroachment';
import { lookupTemporalMultiplier } from '../temporalMultipliers';
import { difficulty } from '../difficulty';
import { calculateEnhancementDifficulty as calculateEnhancementDifficultyShared } from '../enhancementDifficultyCalc';
import { watercourseEnhancementTemporalMatrix } from '../watercourseEnhancementTemporalMatrix';

// ============================================================================
// BASELINE FUNCTIONS
// ============================================================================

/**
 * Enrich data with watercourse properties from the watercourses lookup.
 * Used by baseline modules to add metadata and encroachment multipliers.
 */
export function enrichWithBaselineWatercourseData<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        lengthRetained: number;
        lengthRetainedDecimal: Decimal;
        lengthEnhanced: number;
        lengthEnhancedDecimal: Decimal;
        watercourseType: WatercourseLabel;
        condition: WatercourseCondition;
        strategicSignificance: StrategicSignificanceDescription;
        watercourseEncroachment: string;
        riparianEncroachment: string;
    },
>(data: Data) {
    const watercourse = allWatercourses[data.watercourseType];

    // Get condition score from watercourse lookup
    // Note: conditionScore can be 'Not possible' string or a number
    const conditionScore = watercourse.conditions[data.condition] as number | 'Not possible';

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    // Type-safe lookups with assertion since values are from picklist
    const watercourseEncroachmentMultiplier =
        watercourseEncroachmentMultipliers[
            data.watercourseEncroachment as keyof typeof watercourseEncroachmentMultipliers
        ];
    const riparianEncroachmentMultiplier =
        riparianEncroachmentMultipliers[
            data.riparianEncroachment as keyof typeof riparianEncroachmentMultipliers
        ];

    return {
        ...data,
        distinctiveness: watercourse.distinctivenessCategory,
        distinctivenessScore: watercourse.distinctivenessScore,
        distinctivenessScoreDecimal: toDecimal(watercourse.distinctivenessScore),
        conditionScore,
        conditionScoreDecimal:
            typeof conditionScore === 'number' ? toDecimal(conditionScore) : conditionScore,
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        strategicSignificanceMultiplierDecimal: toDecimal(strategicSignificance.multiplier),
        watercourseEncroachmentMultiplier,
        watercourseEncroachmentMultiplierDecimal: toDecimal(watercourseEncroachmentMultiplier),
        riparianEncroachmentMultiplier,
        riparianEncroachmentMultiplierDecimal: toDecimal(riparianEncroachmentMultiplier),
        tradingRules: watercourse.tradingRules,
        irreplaceable: watercourse.irreplaceable,
    };
}

/**
 * Calculate baseline units for retained and enhanced portions.
 * Used by both on-site and off-site baseline calculations.
 */
/**
 * Pure calculation: derives baseline units retained and enhanced for watercourses.
 */
export function calculateBaselineUnits(input: {
    lengthRetained: number;
    lengthRetainedDecimal?: Decimal;
    lengthEnhanced: number;
    lengthEnhancedDecimal?: Decimal;
    distinctivenessScore: number;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: number | 'Not possible';
    conditionScoreDecimal?: Decimal | 'Not possible';
    strategicSignificanceMultiplier: number;
    strategicSignificanceMultiplierDecimal?: Decimal;
    watercourseEncroachmentMultiplier: number;
    watercourseEncroachmentMultiplierDecimal?: Decimal;
    riparianEncroachmentMultiplier: number;
    riparianEncroachmentMultiplierDecimal?: Decimal;
}) {
    const conditionScore = input.conditionScoreDecimal ?? input.conditionScore;
    const unitsRetained = new Decimal(input.lengthRetainedDecimal ?? toDecimal(input.lengthRetained))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(conditionScore)
        .mul(input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier))
        .mul(
            input.watercourseEncroachmentMultiplierDecimal ??
                toDecimal(input.watercourseEncroachmentMultiplier),
        )
        .mul(input.riparianEncroachmentMultiplierDecimal ?? toDecimal(input.riparianEncroachmentMultiplier));

    const unitsEnhanced = new Decimal(input.lengthEnhancedDecimal ?? toDecimal(input.lengthEnhanced))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(conditionScore)
        .mul(input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier))
        .mul(
            input.watercourseEncroachmentMultiplierDecimal ??
                toDecimal(input.watercourseEncroachmentMultiplier),
        )
        .mul(input.riparianEncroachmentMultiplierDecimal ?? toDecimal(input.riparianEncroachmentMultiplier));

    return {
        unitsRetained: unitsRetained.toNumber(),
        unitsRetainedDecimal: unitsRetained,
        unitsEnhanced: unitsEnhanced.toNumber(),
        unitsEnhancedDecimal: unitsEnhanced,
    };
}

export function enrichWithBaselineUnitsData<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        lengthRetained: number;
        lengthRetainedDecimal: Decimal;
        lengthEnhanced: number;
        lengthEnhancedDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number | 'Not possible';
        conditionScoreDecimal: Decimal | 'Not possible';
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        watercourseEncroachmentMultiplier: number;
        watercourseEncroachmentMultiplierDecimal: Decimal;
        riparianEncroachmentMultiplier: number;
        riparianEncroachmentMultiplierDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateBaselineUnits(data) };
}

/**
 * Calculate total watercourse units.
 * Used by both on-site and off-site baseline calculations.
 */
/**
 * Pure calculation: derives totalWatercourseUnits.
 */
export function calculateTotalWatercourseUnits(input: {
    length: number;
    lengthDecimal?: Decimal;
    distinctivenessScore: number;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: number | 'Not possible';
    conditionScoreDecimal?: Decimal | 'Not possible';
    strategicSignificanceMultiplier: number;
    strategicSignificanceMultiplierDecimal?: Decimal;
    watercourseEncroachmentMultiplier: number;
    watercourseEncroachmentMultiplierDecimal?: Decimal;
    riparianEncroachmentMultiplier: number;
    riparianEncroachmentMultiplierDecimal?: Decimal;
}) {
    const conditionScore = input.conditionScoreDecimal ?? input.conditionScore;

    const totalWatercourseUnits = new Decimal(input.lengthDecimal ?? toDecimal(input.length))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(conditionScore)
        .mul(input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier))
        .mul(
            input.watercourseEncroachmentMultiplierDecimal ??
                toDecimal(input.watercourseEncroachmentMultiplier),
        )
        .mul(input.riparianEncroachmentMultiplierDecimal ?? toDecimal(input.riparianEncroachmentMultiplier));

    return {
        totalWatercourseUnits: totalWatercourseUnits.toNumber(),
        totalWatercourseUnitsDecimal: totalWatercourseUnits,
    };
}

export function enrichWithTotalWatercourseUnits<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        lengthRetained: number;
        lengthRetainedDecimal: Decimal;
        lengthEnhanced: number;
        lengthEnhancedDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number | 'Not possible';
        conditionScoreDecimal: Decimal | 'Not possible';
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        watercourseEncroachmentMultiplier: number;
        watercourseEncroachmentMultiplierDecimal: Decimal;
        riparianEncroachmentMultiplier: number;
        riparianEncroachmentMultiplierDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateTotalWatercourseUnits(data) };
}

/**
 * Calculate length lost and units lost.
 * Used by both on-site and off-site baseline calculations.
 */
/**
 * Pure calculation: derives lengthLost and unitsLost.
 */
export function calculateUnitsLost(input: {
    length: number;
    lengthDecimal?: Decimal;
    lengthRetained: number;
    lengthRetainedDecimal?: Decimal;
    lengthEnhanced: number;
    lengthEnhancedDecimal?: Decimal;
    totalWatercourseUnits: number;
    totalWatercourseUnitsDecimal?: Decimal;
    unitsRetained: number;
    unitsRetainedDecimal?: Decimal;
    unitsEnhanced: number;
    unitsEnhancedDecimal?: Decimal;
}) {
    const lengthLost = new Decimal(input.lengthDecimal ?? toDecimal(input.length))
        .minus(input.lengthRetainedDecimal ?? toDecimal(input.lengthRetained))
        .minus(input.lengthEnhancedDecimal ?? toDecimal(input.lengthEnhanced));
    const unitsLost = lengthLost.isZero()
        ? 0
        : new Decimal(input.totalWatercourseUnitsDecimal ?? toDecimal(input.totalWatercourseUnits))
              .minus(input.unitsRetainedDecimal ?? toDecimal(input.unitsRetained))
              .minus(input.unitsEnhancedDecimal ?? toDecimal(input.unitsEnhanced));

    return {
        lengthLost: lengthLost.toNumber(),
        lengthLostDecimal: lengthLost,
        unitsLost: toDecimal(unitsLost).toNumber(),
        unitsLostDecimal: toDecimal(unitsLost),
    };
}

export function enrichWithUnitsLost<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        lengthRetained: number;
        lengthRetainedDecimal: Decimal;
        lengthEnhanced: number;
        lengthEnhancedDecimal: Decimal;
        totalWatercourseUnits: number;
        totalWatercourseUnitsDecimal: Decimal;
        unitsRetained: number;
        unitsRetainedDecimal: Decimal;
        unitsEnhanced: number;
        unitsEnhancedDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateUnitsLost(data) };
}

// ============================================================================
// CREATION FUNCTIONS
// ============================================================================

/**
 * Enrich data with watercourse properties from the watercourses lookup.
 * Used by creation modules to add metadata and time to target.
 */
export function enrichWithCreationWatercourseData<
    Data extends {
        watercourseType: WatercourseLabel;
        condition: WatercourseCondition;
        strategicSignificance: StrategicSignificanceDescription;
    },
>(data: Data) {
    const watercourse = allWatercourses[data.watercourseType];

    // Get condition score from watercourse lookup
    const conditionScore = watercourse.conditions[data.condition] as number | 'Not possible';
    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);
    const standardTimeToTarget = yearsToTargetCondition[data.condition];

    return {
        ...data,
        distinctiveness: watercourse.distinctivenessCategory,
        distinctivenessScore: watercourse.distinctivenessScore,
        distinctivenessScoreDecimal: toDecimal(watercourse.distinctivenessScore),
        conditionScore,
        conditionScoreDecimal:
            typeof conditionScore === 'number' ? toDecimal(conditionScore) : conditionScore,
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        strategicSignificanceMultiplierDecimal: toDecimal(strategicSignificance.multiplier),
        standardTimeToTarget,
        standardTimeToTargetDecimal: toDecimal(standardTimeToTarget),
        standardDifficulty: watercourse.technicalDifficultyOfCreation,
        tradingRules: watercourse.tradingRules,
        irreplaceable: watercourse.irreplaceable,
    };
}

/**
 * Pure calculation: computes the standardOrAdjusted message, finalTimeToTarget,
 * and isDitchFairlyCategory flag from input data.
 */
export function calculateTemporalAdjustments<
    Data extends {
        watercourseType: WatercourseLabel;
        condition: WatercourseCondition;
        habitatCreatedInAdvance: number | '30+';
        delayInStarting: number | '30+';
        standardTimeToTarget: number;
        standardTimeToTargetDecimal?: Decimal;
    },
>(data: Data) {
    // Status messages use numeric years; the final-time branches preserve sentinels.
    const habitatCreatedInAdvance =
        data.habitatCreatedInAdvance === '30+' ? 30 : data.habitatCreatedInAdvance;
    const delayInStarting = data.delayInStarting === '30+' ? 30 : data.delayInStarting;

    const standardOrAdjustedTimeToTargetCondition =
        data.standardTimeToTarget <= habitatCreatedInAdvance && delayInStarting === 0
            ? ('Check details - Is there evidence that habitat has reached target condition? ⚠' as const)
            : habitatCreatedInAdvance > 0
              ? ('Check details - Is there evidence habitat creation started/in place? ⚠' as const)
              : delayInStarting > 0
                ? ('Check details- Delay in starting habitat in required condition? ⚠' as const)
                : ('Standard time to target condition applied' as const);

    const delayedTime = new Decimal(
        data.standardTimeToTargetDecimal ?? toDecimal(data.standardTimeToTarget),
    ).plus(delayInStarting);
    const finalTimeToTarget: number | '30+' =
        data.habitatCreatedInAdvance === '30+'
            ? 0
            : data.delayInStarting === '30+' || delayedTime.gt(30)
              ? '30+'
              : Decimal.max(0, delayedTime.minus(habitatCreatedInAdvance)).toNumber();

    const isDitchFairlyCategory =
        data.watercourseType === 'Ditches' &&
        (data.condition === 'Fairly Poor' || data.condition === 'Fairly Good');

    return {
        ...data,
        standardOrAdjustedTimeToTargetCondition,
        finalTimeToTarget,
        finalTimeToTargetDecimal:
            typeof finalTimeToTarget === 'number' ? toDecimal(finalTimeToTarget) : finalTimeToTarget,
        isDitchFairlyCategory,
    };
}

/**
 * Lookup: attaches temporalMultiplier from finalTimeToTarget.
 */
export function lookupTemporalMultiplierFromFinalTime<
    Data extends {
        finalTimeToTarget: number | '30+';
    },
>(data: Data) {
    const value = lookupTemporalMultiplier(data.finalTimeToTarget);
    const temporalMultiplier = typeof value === 'number' ? value : 0;

    return {
        ...data,
        temporalMultiplier,
        temporalMultiplierDecimal: toDecimal(temporalMultiplier),
    };
}

/**
 * Backwards-compatible composed transform: pure calc → lookup.
 */
export function enrichWithTemporalData<
    Data extends {
        watercourseType: WatercourseLabel;
        condition: WatercourseCondition;
        habitatCreatedInAdvance: number | '30+';
        delayInStarting: number | '30+';
        standardTimeToTarget: number;
        standardTimeToTargetDecimal: Decimal;
    },
>(data: Data) {
    return lookupTemporalMultiplierFromFinalTime(calculateTemporalAdjustments(data));
}

/**
 * Calculate difficulty multiplier.
 * Used by both on-site and off-site creation calculations.
 */
/**
 * Pure calculation: derives appliedDifficulty, finalDifficultyOfCreation and
 * difficultyMultiplier for watercourse creation.
 */
export function calculateDifficultyData(input: {
    standardOrAdjustedTimeToTargetCondition: ReturnType<
        typeof calculateTemporalAdjustments
    >['standardOrAdjustedTimeToTargetCondition'];
    standardTimeToTarget: ReturnType<typeof enrichWithCreationWatercourseData>['standardTimeToTarget'];
    standardDifficulty: ReturnType<typeof enrichWithCreationWatercourseData>['standardDifficulty'];
    habitatCreatedInAdvance: number | '30+';
}) {
    const habitatCreatedInAdvance =
        input.habitatCreatedInAdvance === '30+' ? 30 : input.habitatCreatedInAdvance;
    const standardDifficultyOfCreation = input.standardDifficulty;
    const appliedDifficulty =
        input.standardOrAdjustedTimeToTargetCondition ===
        'Check details - Is there evidence that habitat has reached target condition? ⚠'
            ? ('Low Difficulty - only applicable if all habitat created before losses ⚠' as const)
            : ('Standard difficulty applied' as const);

    const finalDifficultyOfCreation =
        appliedDifficulty === 'Standard difficulty applied' &&
        typeof input.standardTimeToTarget === 'number' &&
        input.standardTimeToTarget > habitatCreatedInAdvance
            ? standardDifficultyOfCreation
            : appliedDifficulty ===
                    'Low Difficulty - only applicable if all habitat created before losses ⚠' &&
                typeof input.standardTimeToTarget === 'number' &&
                habitatCreatedInAdvance >= input.standardTimeToTarget
              ? 'Low'
              : standardDifficultyOfCreation;

    const difficultyMultiplier = difficulty[finalDifficultyOfCreation];

    return {
        appliedDifficulty,
        finalDifficultyOfCreation,
        difficultyMultiplier,
        difficultyMultiplierDecimal: toDecimal(difficultyMultiplier),
    };
}

export function enrichWithDifficultyData<
    Data extends {
        standardOrAdjustedTimeToTargetCondition: ReturnType<
            typeof enrichWithTemporalData
        >['standardOrAdjustedTimeToTargetCondition'];
        standardTimeToTarget: ReturnType<typeof enrichWithCreationWatercourseData>['standardTimeToTarget'];
        standardDifficulty: ReturnType<typeof enrichWithCreationWatercourseData>['standardDifficulty'];
        isDitchFairlyCategory: boolean;
        habitatCreatedInAdvance: number | '30+';
    },
>(data: Data) {
    return { ...data, ...calculateDifficultyData(data) };
}

/**
 * Calculate encroachment multipliers for creation.
 * Used by both on-site and off-site creation calculations.
 */
export function enrichCreationWithEncroachmentData<
    Data extends {
        watercourseType: WatercourseLabel;
        watercourseEncroachment: WatercourseEncroachment;
        riparianEncroachment: RiparianEncroachment;
    },
>(data: Data) {
    const watercourseEncroachmentMultiplier =
        watercourseEncroachmentMultipliers[data.watercourseEncroachment];
    const riparianEncroachmentMultiplier = riparianEncroachmentMultipliers[data.riparianEncroachment];

    return {
        ...data,
        watercourseEncroachmentMultiplier,
        watercourseEncroachmentMultiplierDecimal: toDecimal(watercourseEncroachmentMultiplier),
        riparianEncroachmentMultiplier,
        riparianEncroachmentMultiplierDecimal: toDecimal(riparianEncroachmentMultiplier),
    };
}

/**
 * Calculate final net unit change for creation.
 * Used by both on-site and off-site creation calculations.
 */
/**
 * Pure calculation: derives unitsDelivered for a watercourse creation.
 */
export function calculateUnitsDelivered(input: {
    length: number;
    lengthDecimal?: Decimal;
    distinctivenessScore: number;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: number | 'Not possible';
    conditionScoreDecimal?: Decimal | 'Not possible';
    strategicSignificanceMultiplier: number;
    strategicSignificanceMultiplierDecimal?: Decimal;
    temporalMultiplier: number;
    temporalMultiplierDecimal?: Decimal | string;
    difficultyMultiplier: number;
    difficultyMultiplierDecimal?: Decimal;
    watercourseEncroachmentMultiplier: number;
    watercourseEncroachmentMultiplierDecimal?: Decimal;
    riparianEncroachmentMultiplier: number;
    riparianEncroachmentMultiplierDecimal?: Decimal;
}) {
    const conditionScore = input.conditionScoreDecimal ?? input.conditionScore;

    const unitsDelivered = new Decimal(input.lengthDecimal ?? toDecimal(input.length))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(conditionScore)
        .mul(input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier))
        .mul(input.temporalMultiplierDecimal ?? toDecimal(input.temporalMultiplier))
        .mul(input.difficultyMultiplierDecimal ?? toDecimal(input.difficultyMultiplier))
        .mul(
            input.watercourseEncroachmentMultiplierDecimal ??
                toDecimal(input.watercourseEncroachmentMultiplier),
        )
        .mul(input.riparianEncroachmentMultiplierDecimal ?? toDecimal(input.riparianEncroachmentMultiplier));

    return { unitsDelivered: unitsDelivered.toNumber(), unitsDeliveredDecimal: unitsDelivered };
}

export function enrichWithUnitsDelivered<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number | 'Not possible';
        conditionScoreDecimal: Decimal | 'Not possible';
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        temporalMultiplier: number;
        temporalMultiplierDecimal: Decimal | string;
        difficultyMultiplier: number;
        difficultyMultiplierDecimal: Decimal;
        watercourseEncroachmentMultiplier: number;
        watercourseEncroachmentMultiplierDecimal: Decimal;
        riparianEncroachmentMultiplier: number;
        riparianEncroachmentMultiplierDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateUnitsDelivered(data) };
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
export function yearsToNumber(years: number | '30+'): number {
    return years === '30+' ? 31 : years;
}

/**
 * Extract baseline watercourse data including length.
 * The baseline contains the length that is being enhanced.
 * Generic to work with both OnSiteWatercourseBaseline and OffSiteWatercourseBaseline.
 */
/**
 * Pure restructure: extracts baseline-derived fields onto a flat object.
 */
export function calculateBaselineWatercourseData<
    Baseline extends {
        lengthEnhanced: number;
        lengthEnhancedDecimal?: Decimal;
        watercourseType: WatercourseLabel;
        distinctivenessScore: number;
        distinctivenessScoreDecimal?: Decimal;
        distinctiveness: string;
        conditionScore: number | 'Not possible';
        conditionScoreDecimal?: Decimal | 'Not possible';
        condition: WatercourseCondition;
    },
>(input: { baseline: Baseline }) {
    const { baseline } = input;
    return {
        length: baseline.lengthEnhanced,
        lengthDecimal: baseline.lengthEnhancedDecimal ?? toDecimal(baseline.lengthEnhanced),
        _baselineWatercourse: {
            label: baseline.watercourseType,
            distinctivenessScore: baseline.distinctivenessScore,
            distinctivenessScoreDecimal:
                baseline.distinctivenessScoreDecimal ?? toDecimal(baseline.distinctivenessScore),
            distinctivenessCategory: baseline.distinctiveness,
        },
        _baselineCondition: baseline.conditionScore,
        _baselineConditionDecimal:
            typeof baseline.conditionScore === 'number'
                ? toDecimal(baseline.conditionScore)
                : baseline.conditionScore,
        _baselineConditionLabel: baseline.condition,
    };
}

export function enrichBaselineWatercourseData<
    Baseline extends {
        lengthEnhanced: number;
        lengthEnhancedDecimal?: Decimal;
        watercourseType: WatercourseLabel;
        distinctivenessScore: number;
        distinctivenessScoreDecimal?: Decimal;
        distinctiveness: string;
        conditionScore: number | 'Not possible';
        conditionScoreDecimal?: Decimal | 'Not possible';
        condition: WatercourseCondition;
    },
    Data extends { baseline: Baseline },
>(data: Data) {
    return { ...data, ...calculateBaselineWatercourseData(data) };
}

/**
 * Enrich data with proposed watercourse properties from the watercourses lookup.
 * Used by enhancement modules.
 */
export function enrichProposedWatercourseData<
    Data extends {
        watercourseType: WatercourseLabel;
        condition: WatercourseCondition;
        strategicSignificance: StrategicSignificanceDescription;
    },
>(data: Data) {
    const watercourse = allWatercourses[data.watercourseType];

    // Get condition score from watercourse lookup
    const conditionScore = watercourse.conditions[data.condition] as number | 'Not possible';

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    return {
        ...data,
        distinctiveness: watercourse.distinctivenessCategory,
        distinctivenessScore: watercourse.distinctivenessScore,
        distinctivenessScoreDecimal: toDecimal(watercourse.distinctivenessScore),
        conditionScore,
        conditionScoreDecimal:
            typeof conditionScore === 'number' ? toDecimal(conditionScore) : conditionScore,
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        strategicSignificanceMultiplierDecimal: toDecimal(strategicSignificance.multiplier),
        tradingRules: watercourse.tradingRules,
        technicalDifficulty: watercourse.technicalDifficultyOfEnhancement,
        irreplaceable: watercourse.irreplaceable,
    };
}

/**
 * Add enhancement pathway label.
 * Format: "baseline condition to proposed condition"
 */
/**
 * Pure calculation: derives enhancementPathway label.
 */
export function calculateEnhancementPathway(input: {
    baselineConditionLabel: WatercourseCondition;
    condition: WatercourseCondition;
}) {
    return { enhancementPathway: `${input.baselineConditionLabel} to ${input.condition}` };
}

export function addEnhancementPathway<
    Data extends {
        _baselineConditionLabel: WatercourseCondition;
        condition: WatercourseCondition;
    },
>(data: Data) {
    return {
        ...data,
        ...calculateEnhancementPathway({
            baselineConditionLabel: data._baselineConditionLabel,
            condition: data.condition,
        }),
    };
}

/**
 * Lookup enhancement time to target from watercourse enhancement temporal data.
 * Uses the enhancement pathway (baseline→proposed condition) to find years to target.
 * Special case: If baseline distinctiveness < proposed distinctiveness, use fallback (10 years).
 */
/**
 * Pure calculation: branches on distinctiveness; for upgrades returns the
 * fixed upgrade years, otherwise resolves the pathway against the matrix.
 */
export function calculateEnhancementTimeToTarget(input: {
    baselineDistinctivenessScore: number;
    baselineDistinctivenessScoreDecimal?: Decimal;
    distinctivenessScore: number;
    distinctivenessScoreDecimal?: Decimal;
    enhancementPathway: string;
    enhancementTemporalMatrix: typeof watercourseEnhancementTemporalMatrix;
}) {
    let timeToTargetCondition: number | 'N/A';

    if (input.baselineDistinctivenessScore < input.distinctivenessScore) {
        timeToTargetCondition = DISTINCTIVENESS_UPGRADE_YEARS;
    } else {
        const pathwayValue = input.enhancementTemporalMatrix[input.enhancementPathway];
        timeToTargetCondition = pathwayValue !== undefined ? pathwayValue : 'N/A';
    }

    return {
        timeToTargetCondition,
        timeToTargetConditionDecimal:
            typeof timeToTargetCondition === 'number'
                ? toDecimal(timeToTargetCondition)
                : timeToTargetCondition,
    };
}

export function lookupEnhancementTimeToTarget<
    Data extends {
        _baselineWatercourse: { distinctivenessScore: number };
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        enhancementPathway: string;
    },
>(data: Data) {
    return {
        ...data,
        ...calculateEnhancementTimeToTarget({
            baselineDistinctivenessScore: data._baselineWatercourse.distinctivenessScore,
            baselineDistinctivenessScoreDecimal: toDecimal(data._baselineWatercourse.distinctivenessScore),
            distinctivenessScore: data.distinctivenessScore,
            distinctivenessScoreDecimal: data.distinctivenessScoreDecimal,
            enhancementPathway: data.enhancementPathway,
            enhancementTemporalMatrix: watercourseEnhancementTemporalMatrix,
        }),
    };
}

/**
 * Calculate final time to target condition based on:
 * - Standard enhancement time (from enhancement temporal data)
 * - Years of watercourse enhanced in advance
 * - Years of delay in starting enhancement
 */
/**
 * Pure calculation: derives finalTimeToTargetCondition for enhancement.
 */
export function calculateEnhancementFinalTimeToTargetCondition<
    Data extends {
        timeToTargetCondition: number | 'N/A';
        watercourseEnhancedInAdvance: number | '30+';
        watercourseEnhancedDelay: number | '30+';
    },
>(data: Data) {
    const { timeToTargetCondition, watercourseEnhancedInAdvance, watercourseEnhancedDelay } = data;

    let finalTimeToTargetCondition: number | '30+' | 'N/A';
    const normalisedEnhancedInAdvance = yearsToNumber(watercourseEnhancedInAdvance);
    const normalisedEnhancedDelay = yearsToNumber(watercourseEnhancedDelay);

    if (timeToTargetCondition === 'N/A') {
        finalTimeToTargetCondition = 'N/A';
    } else if (normalisedEnhancedInAdvance >= timeToTargetCondition) {
        finalTimeToTargetCondition = 0;
    } else {
        const result = new Decimal(timeToTargetCondition)
            .minus(normalisedEnhancedInAdvance)
            .plus(normalisedEnhancedDelay)
            .toNumber();

        if (result > 30) {
            finalTimeToTargetCondition = '30+';
        } else {
            finalTimeToTargetCondition = Decimal.max(0, result).toNumber();
        }
    }

    return {
        ...data,
        finalTimeToTargetCondition,
        finalTimeToTargetConditionDecimal:
            typeof finalTimeToTargetCondition === 'number'
                ? toDecimal(finalTimeToTargetCondition)
                : finalTimeToTargetCondition,
    };
}

/**
 * Lookup: attaches temporalMultiplier from finalTimeToTargetCondition.
 */
export function lookupEnhancementTemporalMultiplier<
    Data extends {
        finalTimeToTargetCondition: number | '30+' | 'N/A';
    },
>(data: Data) {
    const finalTimeToTargetCondition = data.finalTimeToTargetCondition;
    const temporalMultiplier =
        typeof finalTimeToTargetCondition === 'number' || finalTimeToTargetCondition === '30+'
            ? lookupTemporalMultiplier(finalTimeToTargetCondition)
            : finalTimeToTargetCondition;

    return {
        ...data,
        temporalMultiplier,
        temporalMultiplierDecimal:
            typeof temporalMultiplier === 'number' ? toDecimal(temporalMultiplier) : temporalMultiplier,
    };
}

/**
 * Backwards-compatible composed transform: pure calc → lookup.
 */
export function calculateFinalTimeToTargetValues<
    Data extends {
        timeToTargetCondition: number | 'N/A';
        watercourseEnhancedInAdvance: number | '30+';
        watercourseEnhancedDelay: number | '30+';
    },
>(data: Data) {
    return lookupEnhancementTemporalMultiplier(calculateEnhancementFinalTimeToTargetCondition(data));
}

/**
 * Determine enhancement difficulty based on whether watercourse reached target before losses.
 */
export function calculateEnhancementDifficulty(input: {
    watercourseEnhancedInAdvance: number | '30+';
    finalTimeToTargetCondition: number | '30+' | 'N/A';
    standardDifficultyOfEnhancement: Watercourse['technicalDifficultyOfEnhancement'];
    baselineConditionScore?: number | 'Not possible';
    conditionScore?: number | 'Not possible';
    baselineDistinctivenessScore?: number;
    distinctivenessScore?: number;
}) {
    return calculateEnhancementDifficultyShared({
        enhancedInAdvance: input.watercourseEnhancedInAdvance,
        finalTimeToTargetCondition: input.finalTimeToTargetCondition,
        standardDifficultyOfEnhancement: input.standardDifficultyOfEnhancement as keyof typeof difficulty,
        lowDifficultyMessage: 'Low Difficulty - only applicable if all watercourse enhanced before losses ⚠',
        hasReachedTargetCondition:
            (typeof input.baselineConditionScore === 'number' &&
                typeof input.conditionScore === 'number' &&
                input.baselineConditionScore > input.conditionScore) ||
            (typeof input.baselineDistinctivenessScore === 'number' &&
                typeof input.distinctivenessScore === 'number' &&
                input.baselineDistinctivenessScore > input.distinctivenessScore)
                ? false
                : undefined,
    });
}

export function determineEnhancementDifficulty<
    Data extends {
        watercourseEnhancedInAdvance: number | '30+';
        finalTimeToTargetCondition: number | '30+' | 'N/A';
        technicalDifficulty: Watercourse['technicalDifficultyOfEnhancement'];
        _baselineCondition?: number | 'Not possible';
        conditionScore?: number | 'Not possible';
        _baselineWatercourse?: { distinctivenessScore: number };
        distinctivenessScore?: number;
    },
>(data: Data) {
    return {
        ...data,
        ...calculateEnhancementDifficulty({
            watercourseEnhancedInAdvance: data.watercourseEnhancedInAdvance,
            finalTimeToTargetCondition: data.finalTimeToTargetCondition,
            standardDifficultyOfEnhancement: data.technicalDifficulty,
            baselineConditionScore: data._baselineCondition,
            conditionScore: data.conditionScore,
            baselineDistinctivenessScore: data._baselineWatercourse?.distinctivenessScore,
            distinctivenessScore: data.distinctivenessScore,
        }),
    };
}

/**
 * Calculate encroachment multipliers for enhancement.
 * Used by both on-site and off-site enhancement calculations.
 */
export function enrichEnhancementWithEncroachmentData<
    Data extends {
        watercourseEncroachment: WatercourseEncroachment;
        riparianEncroachment: RiparianEncroachment;
    },
>(data: Data) {
    const watercourseEncroachmentMultiplier =
        watercourseEncroachmentMultipliers[data.watercourseEncroachment];
    const riparianEncroachmentMultiplier = riparianEncroachmentMultipliers[data.riparianEncroachment];

    return {
        ...data,
        watercourseEncroachmentMultiplier,
        watercourseEncroachmentMultiplierDecimal: toDecimal(watercourseEncroachmentMultiplier),
        riparianEncroachmentMultiplier,
        riparianEncroachmentMultiplierDecimal: toDecimal(riparianEncroachmentMultiplier),
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
/**
 * Pure calculation: derives watercourseUnitsDelivered for an enhancement.
 */
export function calculateEnhancementUnitsDeliveredPure(input: {
    proposedLength: number;
    proposedLengthDecimal?: Decimal;
    baselineLength: number;
    baselineLengthDecimal?: Decimal;
    baselineDistinctivenessScore: number;
    baselineDistinctivenessScoreDecimal?: Decimal;
    baselineConditionScore: number | 'Not possible';
    baselineConditionScoreDecimal?: Decimal | 'Not possible';
    distinctivenessScore: number;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: number | 'Not possible';
    conditionScoreDecimal?: Decimal | 'Not possible';
    strategicSignificanceMultiplier: number;
    strategicSignificanceMultiplierDecimal?: Decimal;
    temporalMultiplier: number | string;
    temporalMultiplierDecimal?: Decimal | string;
    difficultyMultiplierApplied: number;
    difficultyMultiplierAppliedDecimal?: Decimal;
    watercourseEncroachmentMultiplier: number;
    watercourseEncroachmentMultiplierDecimal?: Decimal;
    riparianEncroachmentMultiplier: number;
    riparianEncroachmentMultiplierDecimal?: Decimal;
}) {
    const proposedLength = input.proposedLengthDecimal ?? toDecimal(input.proposedLength);
    const baselineLength = input.baselineLengthDecimal ?? toDecimal(input.baselineLength);
    const baselineD =
        input.baselineDistinctivenessScoreDecimal ?? toDecimal(input.baselineDistinctivenessScore);
    const baselineC = input.baselineConditionScoreDecimal ?? input.baselineConditionScore;
    const proposedD = input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore);
    const proposedC = input.conditionScoreDecimal ?? input.conditionScore;
    const strategic =
        input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier);
    const difficultyMult =
        input.difficultyMultiplierAppliedDecimal ?? toDecimal(input.difficultyMultiplierApplied);
    const temporal =
        typeof input.temporalMultiplier === 'number'
            ? ((input.temporalMultiplierDecimal ?? toDecimal(input.temporalMultiplier)) as Decimal)
            : 0;
    const watercourseEncroachment =
        input.watercourseEncroachmentMultiplierDecimal ?? toDecimal(input.watercourseEncroachmentMultiplier);
    const riparianEncroachment =
        input.riparianEncroachmentMultiplierDecimal ?? toDecimal(input.riparianEncroachmentMultiplier);

    let watercourseUnitsDelivered: Decimal;

    if (new Decimal(proposedLength).gt(baselineLength)) {
        const proposedUnits = new Decimal(proposedLength).mul(proposedD).mul(proposedC);
        const baselineUnits = new Decimal(baselineLength).mul(baselineD).mul(baselineC);
        const delta = proposedUnits.minus(baselineUnits).mul(difficultyMult).mul(temporal);
        watercourseUnitsDelivered = delta
            .plus(baselineUnits)
            .mul(strategic)
            .mul(watercourseEncroachment)
            .mul(riparianEncroachment);
    } else {
        const proposedUnits = new Decimal(proposedLength).mul(proposedD).mul(proposedC);
        const baselineUnits = new Decimal(proposedLength).mul(baselineD).mul(baselineC);
        const delta = proposedUnits.minus(baselineUnits).mul(difficultyMult).mul(temporal);
        watercourseUnitsDelivered = delta
            .plus(baselineUnits)
            .mul(strategic)
            .mul(watercourseEncroachment)
            .mul(riparianEncroachment);
    }

    return {
        watercourseUnitsDelivered: watercourseUnitsDelivered.toNumber(),
        watercourseUnitsDeliveredDecimal: watercourseUnitsDelivered,
    };
}

export function calculateEnhancementUnitsDelivered<
    Baseline extends {
        length?: number;
        lengthDecimal?: Decimal;
        lengthEnhanced: number;
        lengthEnhancedDecimal?: Decimal;
    },
    Data extends {
        length: number;
        lengthDecimal?: Decimal;
        _baselineWatercourse: any;
        _baselineCondition: number | 'Not possible';
        distinctivenessScore: number;
        distinctivenessScoreDecimal?: Decimal;
        conditionScore: number | 'Not possible';
        conditionScoreDecimal?: Decimal | 'Not possible';
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal?: Decimal;
        temporalMultiplier: number | string;
        temporalMultiplierDecimal?: Decimal | string;
        difficultyMultiplierApplied: number;
        difficultyMultiplierAppliedDecimal?: Decimal;
        watercourseEncroachmentMultiplier: number;
        watercourseEncroachmentMultiplierDecimal?: Decimal;
        riparianEncroachmentMultiplier: number;
        riparianEncroachmentMultiplierDecimal?: Decimal;
        baseline: Baseline;
    },
>(data: Data) {
    return {
        ...data,
        ...calculateEnhancementUnitsDeliveredPure({
            proposedLength: data.length,
            proposedLengthDecimal: data.lengthDecimal ?? toDecimal(data.length),
            baselineLength: data.baseline.length ?? data.baseline.lengthEnhanced,
            baselineLengthDecimal:
                data.baseline.lengthDecimal ??
                (data.baseline.length !== undefined
                    ? toDecimal(data.baseline.length)
                    : data.baseline.lengthEnhancedDecimal ?? toDecimal(data.baseline.lengthEnhanced)),
            baselineDistinctivenessScore: data._baselineWatercourse.distinctivenessScore,
            baselineDistinctivenessScoreDecimal: toDecimal(data._baselineWatercourse.distinctivenessScore),
            baselineConditionScore: data._baselineCondition,
            baselineConditionScoreDecimal:
                typeof data._baselineCondition === 'number'
                    ? toDecimal(data._baselineCondition)
                    : data._baselineCondition,
            distinctivenessScore: data.distinctivenessScore,
            distinctivenessScoreDecimal:
                data.distinctivenessScoreDecimal ?? toDecimal(data.distinctivenessScore),
            conditionScore: data.conditionScore,
            conditionScoreDecimal:
                data.conditionScoreDecimal ??
                (typeof data.conditionScore === 'number'
                    ? toDecimal(data.conditionScore)
                    : data.conditionScore),
            strategicSignificanceMultiplier: data.strategicSignificanceMultiplier,
            strategicSignificanceMultiplierDecimal:
                data.strategicSignificanceMultiplierDecimal ??
                toDecimal(data.strategicSignificanceMultiplier),
            temporalMultiplier: data.temporalMultiplier,
            temporalMultiplierDecimal: data.temporalMultiplierDecimal ?? toDecimal(data.temporalMultiplier),
            difficultyMultiplierApplied: data.difficultyMultiplierApplied,
            difficultyMultiplierAppliedDecimal:
                data.difficultyMultiplierAppliedDecimal ?? toDecimal(data.difficultyMultiplierApplied),
            watercourseEncroachmentMultiplier: data.watercourseEncroachmentMultiplier,
            watercourseEncroachmentMultiplierDecimal:
                data.watercourseEncroachmentMultiplierDecimal ??
                toDecimal(data.watercourseEncroachmentMultiplier),
            riparianEncroachmentMultiplier: data.riparianEncroachmentMultiplier,
            riparianEncroachmentMultiplierDecimal:
                data.riparianEncroachmentMultiplierDecimal ?? toDecimal(data.riparianEncroachmentMultiplier),
        }),
    };
}

import * as v from 'valibot';
import { allWatercourses, type WatercourseLabel } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, yearsSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { watercourseConditionSchema, type WatercourseCondition } from '../watercourseCondition';
import { lookupTemporalMultiplier } from '../temporalMultipliers';
import { difficulty } from '../difficulty';
import type { OnSiteWatercourseBaseline } from './watercourseBaseline';
import { watercourseTypeSchema } from '../watercourseType';
import { riparianEncroachmentCreationSchema, watercourseEncroachmentCreationSchema, type RiparianEncroachment, type WatercourseEncroachment, riparianEncroachmentMultipliers, watercourseEncroachmentMultipliers } from '../watercourseEncroachment';
import { watercourseEnhancementTemporalMatrix } from '../watercourseEnhancementTemporalMatrix';

/**
 * Fallback years when baseline distinctiveness < proposed distinctiveness
 * (i.e., when upgrading to a rarer habitat type)
 */
const DISTINCTIVENESS_UPGRADE_YEARS = 10;

const inputSchema = v.object({
    baseline: v.custom<OnSiteWatercourseBaseline>((input) => {
        return typeof input === 'object' && input !== null && 'watercourseType' in input;
    }),
    watercourseType: watercourseTypeSchema,
    condition: watercourseConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    watercourseEnhancedInAdvance: v.optional(yearsSchema, 0),
    watercourseEnhancedDelay: v.optional(yearsSchema, 0),
    watercourseEncroachment: watercourseEncroachmentCreationSchema,
    riparianEncroachment: riparianEncroachmentCreationSchema,
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
});

/**
 * Extract baseline watercourse data including length
 * The baseline contains the length that is being enhanced
 */
const enrichBaselineWatercourseData = <Data extends {
    baseline: OnSiteWatercourseBaseline
}>(data: Data) => {
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
 * Enrich data with proposed watercourse properties from the watercourses lookup
 */
const enrichProposedWatercourseData = <Data extends {
    watercourseType: WatercourseLabel;
    condition: WatercourseCondition;
    strategicSignificance: StrategicSignificanceDescription;
}>(data: Data) => {
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
        technicalDifficulty: watercourse.technicalDifficulty,
        irreplaceable: watercourse.irreplaceable,
    };
}

/**
 * Add enhancement pathway label
 * Format: "baseline condition to proposed condition"
 */
const addEnhancementPathway = <Data extends {
    _baselineConditionLabel: WatercourseCondition,
    condition: WatercourseCondition
}>(data: Data) => {
    const enhancementPathway = `${data._baselineConditionLabel} to ${data.condition}`;

    return {
        ...data,
        enhancementPathway
    };
}

/**
 * Lookup enhancement time to target from watercourse enhancement temporal data
 * Uses the enhancement pathway (baseline→proposed condition) to find years to target
 * Special case: If baseline distinctiveness < proposed distinctiveness, use fallback (10 years)
 */
const lookupEnhancementTimeToTarget = <Data extends {
    _baselineWatercourse: { distinctivenessScore: number },
    distinctivenessScore: number,
    enhancementPathway: string
}>(data: Data) => {
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
 * Helper to convert years value to number for arithmetic
 */
function yearsToNumber(years: number | "30+"): number {
    return years === "30+" ? 31 : years;
}

/**
 * Calculate final time to target condition based on:
 * - Standard enhancement time (from enhancement temporal data)
 * - Years of watercourse enhanced in advance
 * - Years of delay in starting enhancement
 */
const calculateFinalTimeToTargetValues = <Data extends {
    timeToTargetCondition: number | "N/A",
    watercourseEnhancedInAdvance: number | "30+",
    watercourseEnhancedDelay: number | "30+"
}>(data: Data) => {
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
 * Determine enhancement difficulty based on whether watercourse reached target before losses
 */
const determineEnhancementDifficulty = <Data extends {
    watercourseType: WatercourseLabel,
    watercourseEnhancedInAdvance: number | "30+",
    finalTimeToTargetCondition: number | "30+" | "N/A",
    technicalDifficulty: string
}>(data: Data) => {
    const watercourse = allWatercourses[data.watercourseType];

    // Normalize watercourseEnhancedInAdvance for comparisons
    const normalisedEnhancedInAdvance = yearsToNumber(data.watercourseEnhancedInAdvance);

    // Standard difficulty of enhancement
    const standardDifficultyOfEnhancement = watercourse.technicalDifficulty;

    // Determine if watercourse has reached target condition (advance > 0 and final time is 0)
    const hasReachedTargetCondition =
        normalisedEnhancedInAdvance > 0 &&
        data.finalTimeToTargetCondition === 0;

    // Applied difficulty multiplier
    let appliedDifficultyMultiplier: string;
    if (hasReachedTargetCondition) {
        appliedDifficultyMultiplier = "Low Difficulty - only applicable if all watercourse enhanced before losses ⚠";
    } else {
        appliedDifficultyMultiplier = "Standard difficulty applied";
    }

    // Final difficulty of enhancement
    let finalDifficultyOfEnhancement: keyof typeof difficulty;
    if (appliedDifficultyMultiplier === "Low Difficulty - only applicable if all watercourse enhanced before losses ⚠") {
        finalDifficultyOfEnhancement = "Low";
    } else {
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
 * Calculate encroachment multipliers
 */
const enrichWithEncroachmentData = <Data extends {
    watercourseEncroachment: WatercourseEncroachment;
    riparianEncroachment: RiparianEncroachment;
}>(data: Data) => {
    const watercourseEncroachmentMultiplier = watercourseEncroachmentMultipliers[data.watercourseEncroachment];
    const riparianEncroachmentMultiplier = riparianEncroachmentMultipliers[data.riparianEncroachment];

    return {
        ...data,
        watercourseEncroachmentMultiplier,
        riparianEncroachmentMultiplier,
    };
}

/**
 * Calculate watercourse units delivered from enhancement as NET GAIN over baseline
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
 * This accounts for partial enhancement scenarios where only part of baseline is enhanced
 */
const calculateEnhancementUnitsDelivered = <Data extends {
    length: number,
    _baselineWatercourse: any,
    _baselineCondition: number | 'Not possible',
    distinctivenessScore: number,
    conditionScore: number | 'Not possible',
    strategicSignificanceMultiplier: number,
    temporalMultiplier: number | string,
    difficultyMultiplierApplied: number,
    watercourseEncroachmentMultiplier: number,
    riparianEncroachmentMultiplier: number,
    baseline: OnSiteWatercourseBaseline
}>(data: Data) => {
    const proposedLength = data.length;
    const baselineLength = data.baseline.lengthEnhanced;
    const baselineD = data._baselineWatercourse.distinctivenessScore;
    const baselineC = data._baselineCondition as number; // Validation ensures it's a number
    const proposedD = data.distinctivenessScore;
    const proposedC = data.conditionScore as number; // Validation ensures it's a number
    const strategic = data.strategicSignificanceMultiplier;
    const difficulty = data.difficultyMultiplierApplied;
    const temporal = typeof data.temporalMultiplier === 'number' ? data.temporalMultiplier : 0;
    const watercourseEncroachment = data.watercourseEncroachmentMultiplier;
    const riparianEncroachment = data.riparianEncroachmentMultiplier;

    let watercourseUnitsDelivered: number;

    // Delta method accounting for length changes
    if (proposedLength > baselineLength) {
        // Proposed length exceeds baseline - use baseline length for baseline calculation
        const proposedUnits = proposedLength * proposedD * proposedC;
        const baselineUnits = baselineLength * baselineD * baselineC;
        const delta = (proposedUnits - baselineUnits) * difficulty * temporal;
        watercourseUnitsDelivered = (delta + baselineUnits) * strategic * watercourseEncroachment * riparianEncroachment;
    } else {
        // Proposed length <= baseline - use proposed length for baseline calculation
        const proposedUnits = proposedLength * proposedD * proposedC;
        const baselineUnits = proposedLength * baselineD * baselineC;
        const delta = (proposedUnits - baselineUnits) * difficulty * temporal;
        watercourseUnitsDelivered = (delta + baselineUnits) * strategic * watercourseEncroachment * riparianEncroachment;
    }

    return {
        ...data,
        watercourseUnitsDelivered
    };
}

export const onSiteWatercourseEnhancementSchema = v.pipe(
    inputSchema,

    // Basic validations
    v.check(s => !!allWatercourses[s.watercourseType], "Invalid watercourse type"),
    v.check(
        s => !(
            (typeof s.watercourseEnhancedInAdvance === "string" || s.watercourseEnhancedInAdvance > 0)
            && (typeof s.watercourseEnhancedDelay === "string" || s.watercourseEnhancedDelay > 0)
        ),
        "Cannot have both watercourse enhanced in advance and delay in starting watercourse enhancement"
    ),

    // Extract baseline data and length
    v.transform(enrichBaselineWatercourseData),

    // Enrich proposed watercourse data
    v.transform(enrichProposedWatercourseData),

    // Validate that the condition is possible for this watercourse type
    v.check(
        s => typeof s.conditionScore === 'number',
        "The selected condition is not possible for this watercourse type"
    ),

    // Validation checks for enhancement
    v.check(
        data => {
            const baseline = data._baselineWatercourse;
            const proposed = allWatercourses[data.watercourseType];

            // Cannot reduce distinctiveness (trading down)
            return proposed.distinctivenessScore >= baseline.distinctivenessScore;
        },
        "Trading rules not satisfied - watercourse distinctiveness cannot be reduced"
    ),
    v.check(
        data => {
            const baselineCondition = data._baselineCondition as number;
            const proposedCondition = data.conditionScore as number;
            const baselineD = data._baselineWatercourse.distinctivenessScore;
            const proposedD = data.distinctivenessScore;

            // Cannot reduce condition
            if (proposedCondition < baselineCondition) {
                return false;
            }

            // If same condition, must have distinctiveness upgrade
            if (proposedCondition === baselineCondition) {
                return proposedD > baselineD;
            }

            return true;
        },
        "Enhancement must improve condition or distinctiveness"
    ),

    // Validate encroachment consistency with watercourse type
    v.check(
        s => s.watercourseType === 'Culvert' ? s.watercourseEncroachment === 'N/A - Culvert' : s.watercourseEncroachment !== 'N/A - Culvert',
        "Culvert watercourses must use 'N/A - Culvert' for watercourse encroachment"
    ),
    v.check(
        s => s.watercourseType === 'Culvert' ? s.riparianEncroachment === 'N/A - Culvert' : s.riparianEncroachment !== 'N/A - Culvert',
        "Culvert watercourses must use 'N/A - Culvert' for riparian encroachment"
    ),

    // Calculate enhancement pathway label
    v.transform(addEnhancementPathway),

    // Temporal calculation
    v.transform(lookupEnhancementTimeToTarget),
    v.transform(calculateFinalTimeToTargetValues),

    // Difficulty logic
    v.transform(determineEnhancementDifficulty),

    // Encroachment multipliers
    v.transform(enrichWithEncroachmentData),

    // Final calculation
    v.transform(calculateEnhancementUnitsDelivered),
)

export type OnSiteWatercourseEnhancementSchema = v.InferInput<typeof onSiteWatercourseEnhancementSchema>
export type OnSiteWatercourseEnhancement = v.InferOutput<typeof onSiteWatercourseEnhancementSchema>

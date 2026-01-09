import * as v from 'valibot';
import { allHedgerows, type HedgerowLabel } from '../hedgerows';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, yearsSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { hedgerowConditionSchema, type HedgerowCondition } from '../hedgerowCondition';
import { lookupTemporalMultiplier } from '../temporalMultipliers';
import { difficulty } from '../difficulty';
import { lengthSchema, hedgerowTypeSchema } from './hedgerowBaseline';

const inputSchema = v.object({
    habitatType: hedgerowTypeSchema,
    length: lengthSchema,
    condition: hedgerowConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatCreatedInAdvance: v.optional(yearsSchema, 0),
    delayInStartingHabitatCreation: v.optional(yearsSchema, 0),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
});

export const onSiteHedgerowCreationSchema = v.pipe(
    inputSchema,
    // Validate that the habitat type is valid
    v.check(s => !!allHedgerows[s.habitatType], "Invalid hedgerow habitat type"),
    // Check if Non-native and ornamental hedgerow has only Poor condition
    v.check(
        s => !(s.habitatType === "Non-native and ornamental hedgerow" && s.condition !== "Poor"),
        "Non-native and ornamental hedgerow can only have Poor condition"
    ),
    // Check that both advance and delay are not both > 0 (invalid scenario)
    v.check(
        s => {
            const hasAdvance = s.habitatCreatedInAdvance === "30+" || (typeof s.habitatCreatedInAdvance === "number" && s.habitatCreatedInAdvance > 0);
            const hasDelay = s.delayInStartingHabitatCreation === "30+" || (typeof s.delayInStartingHabitatCreation === "number" && s.delayInStartingHabitatCreation > 0);
            return !(hasAdvance && hasDelay);
        },
        "Cannot have both habitat created in advance and delay in starting creation"
    ),
    // Enrich with hedgerow data
    v.transform(enrichWithHedgerowData),
    // Calculate temporal data
    v.transform(enrichWithTemporalData),
    // Calculate difficulty data
    v.transform(enrichWithDifficultyData),
    // Calculate hedgerow units delivered
    v.transform(enrichWithHedgerowUnitsDelivered),
);

export type OnSiteHedgerowCreationSchema = v.InferInput<typeof onSiteHedgerowCreationSchema>;
export type OnSiteHedgerowCreation = v.InferOutput<typeof onSiteHedgerowCreationSchema>;

/**
 * Enrich data with hedgerow properties from the hedgerows lookup
 */
export function enrichWithHedgerowData<Data extends {
    habitatType: HedgerowLabel;
    condition: HedgerowCondition;
    strategicSignificance: StrategicSignificanceDescription;
}>(data: Data) {
    const hedgerow = allHedgerows[data.habitatType];

    // Get condition score - hedgerows use simplified scoring
    // Based on the metric: Good = 3, Moderate = 2, Poor = 1
    const conditionScoreMap: Record<HedgerowCondition, number> = {
        "Good": 3,
        "Moderate": 2,
        "Poor": 1,
    };

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    return {
        ...data,
        distinctiveness: hedgerow.distinctivenessCategory,
        distinctivenessScore: hedgerow.distinctivenessScore,
        conditionScore: conditionScoreMap[data.condition],
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        tradingRules: hedgerow.tradingRules,
        technicalDifficultyCreation: hedgerow.technicalDifficultyCreation,
        technicalDifficultyCreationMultiplier: hedgerow.technicalDifficultyCreationMultiplier,
    };
}

/**
 * Helper to convert years value to number for arithmetic
 */
function yearsToNumber(years: number | "30+"): number {
    return years === "30+" ? 31 : years;
}

/**
 * Calculate temporal data: standard time to target, final time to target, and temporal multiplier
 */
export function enrichWithTemporalData<Data extends {
    habitatType: HedgerowLabel;
    condition: HedgerowCondition;
    habitatCreatedInAdvance: number | "30+";
    delayInStartingHabitatCreation: number | "30+";
}>(data: Data) {
    const hedgerow = allHedgerows[data.habitatType];

    // Get standard time to target condition from the matrix lookup
    const yearsMap = hedgerow.yearsToTargetConditionViaCreation;
    const standardTimeToTarget = yearsMap[data.condition as keyof typeof yearsMap];

    // Calculate final time to target condition
    // Formula: standard time - advance + delay
    let finalTimeToTarget: number | string = 0;

    if (typeof standardTimeToTarget === 'string') {
        // Handle "30+" or "Not possible ▲" or other string values
        if (standardTimeToTarget === '30+') {
            // Convert "30+" to 31 for arithmetic when it's the standard time
            const advanceYears = yearsToNumber(data.habitatCreatedInAdvance);
            const delayYears = yearsToNumber(data.delayInStartingHabitatCreation);

            finalTimeToTarget = 31 - advanceYears + delayYears;

            // Result stays as "30+" if it's still >= 30
            if (finalTimeToTarget >= 30) {
                finalTimeToTarget = '30+';
            }
        } else {
            // Other string values like "Not possible ▲"
            finalTimeToTarget = standardTimeToTarget;
        }
    } else {
        // Numeric standard time
        // Convert "30+" to 31 for arithmetic
        const advanceYears = yearsToNumber(data.habitatCreatedInAdvance);
        const delayYears = yearsToNumber(data.delayInStartingHabitatCreation);

        finalTimeToTarget = standardTimeToTarget - advanceYears + delayYears;

        // Handle the "30+" case for output
        if (standardTimeToTarget >= 30 && finalTimeToTarget >= 30) {
            finalTimeToTarget = '30+';
        } else if (finalTimeToTarget >= 30) {
            finalTimeToTarget = '30+';
        }
    }

    // Get temporal multiplier
    const temporalMultiplier = typeof finalTimeToTarget === 'number' || finalTimeToTarget === '30+'
        ? lookupTemporalMultiplier(finalTimeToTarget)
        : finalTimeToTarget;

    return {
        ...data,
        standardTimeToTargetCondition: standardTimeToTarget,
        finalTimeToTargetCondition: finalTimeToTarget,
        temporalMultiplier,
    };
}

/**
 * Calculate difficulty data: determine final difficulty and multiplier
 */
export function enrichWithDifficultyData<Data extends {
    habitatType: HedgerowLabel;
    habitatCreatedInAdvance: number | "30+";
    standardTimeToTargetCondition: number | string;
    finalTimeToTargetCondition: number | string;
    technicalDifficultyCreation: string;
    technicalDifficultyCreationMultiplier: number;
}>(data: Data) {
    const hedgerow = allHedgerows[data.habitatType];
    const standardDifficulty = hedgerow.technicalDifficultyCreation;

    // Determine final difficulty
    // Logic from Excel: If habitat created in advance and final time <= 0, use "Low" difficulty
    // Otherwise, use standard difficulty
    let finalDifficulty = standardDifficulty;
    let difficultyMultiplier = hedgerow.technicalDifficultyCreationMultiplier;

    const isCreatedInAdvance = data.habitatCreatedInAdvance === "30+" ||
        (typeof data.habitatCreatedInAdvance === "number" && data.habitatCreatedInAdvance > 0);
    const finalTime = typeof data.finalTimeToTargetCondition === 'number'
        ? data.finalTimeToTargetCondition
        : 999; // Large number for non-numeric values

    if (isCreatedInAdvance && finalTime <= 0) {
        finalDifficulty = 'Low';
        difficultyMultiplier = difficulty['Low'];
    }

    return {
        ...data,
        standardDifficulty,
        finalDifficulty,
        difficultyMultiplier,
    };
}

/**
 * Calculate hedgerow units delivered
 */
export function enrichWithHedgerowUnitsDelivered<Data extends {
    length: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
    temporalMultiplier: number | string;
    difficultyMultiplier: number;
}>(data: Data) {
    // If temporal multiplier is not a number (e.g., "Check Data ⚠" or "N/A"), return 0
    const temporalMultiplierValue = typeof data.temporalMultiplier === 'number'
        ? data.temporalMultiplier
        : 0;

    const hedgerowUnitsDelivered = data.length
        * data.distinctivenessScore
        * data.conditionScore
        * data.strategicSignificanceMultiplier
        * temporalMultiplierValue
        * data.difficultyMultiplier;

    return {
        ...data,
        hedgerowUnitsDelivered,
    };
}

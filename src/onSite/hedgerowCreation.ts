import * as v from 'valibot';
import { Decimal } from '../decimal';
import { allHedgerows, type HedgerowLabel } from '../hedgerows';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema, yearsSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { hedgerowConditionSchema, type HedgerowCondition } from '../hedgerowCondition';
import { lookupTemporalMultiplier } from '../temporalMultipliers';
import { difficulty } from '../difficulty';
import { hedgerowTypeSchema } from '../hedgerowType';

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
        s => !(
            (s.habitatCreatedInAdvance === "30+" || (typeof s.habitatCreatedInAdvance === "number" && s.habitatCreatedInAdvance > 0))
            && (s.delayInStartingHabitatCreation === "30+" || (typeof s.delayInStartingHabitatCreation === "number" && s.delayInStartingHabitatCreation > 0))
        ),
        "Cannot have both habitat created in advance and delay in starting creation"
    ),
    // Enrich with hedgerow data
    v.transform(enrichWithHedgerowData),
    // Calculate temporal data
    v.transform(lookupStandardTimeToTargetCondition),
    v.transform(calculateFinalTimeToTargetCondition),
    v.transform(lookupTemporalMultiplierStep),
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
 * Lookup: attaches standardTimeToTargetCondition from hedgerow.yearsToTargetConditionViaCreation.
 */
export function lookupStandardTimeToTargetCondition<Data extends {
    habitatType: HedgerowLabel;
    condition: HedgerowCondition;
}>(data: Data) {
    const hedgerow = allHedgerows[data.habitatType];
    const standardTimeToTargetCondition = hedgerow.yearsToTargetConditionViaCreation[data.condition];

    return {
        ...data,
        standardTimeToTargetCondition,
    };
}

/**
 * Pure calculation: derives finalTimeToTargetCondition from standardTimeToTargetCondition,
 * advance, and delay.
 */
export function calculateFinalTimeToTargetCondition<Data extends {
    standardTimeToTargetCondition: number | string | undefined;
    habitatCreatedInAdvance: number | "30+";
    delayInStartingHabitatCreation: number | "30+";
}>(data: Data) {
    const standardTimeToTarget = data.standardTimeToTargetCondition;
    let finalTimeToTarget: number | string | undefined = undefined;

    if (typeof standardTimeToTarget === 'string') {
        if (standardTimeToTarget === '30+') {
            const advanceYears = yearsToNumber(data.habitatCreatedInAdvance);
            const delayYears = yearsToNumber(data.delayInStartingHabitatCreation);

            finalTimeToTarget = new Decimal(31).minus(advanceYears).plus(delayYears).toNumber();

            if (finalTimeToTarget >= 30) {
                finalTimeToTarget = '30+';
            }
        } else {
            finalTimeToTarget = standardTimeToTarget;
        }
    } else {
        if (!standardTimeToTarget) {
            finalTimeToTarget = undefined;
        } else {
            const advanceYears = yearsToNumber(data.habitatCreatedInAdvance);
            const delayYears = yearsToNumber(data.delayInStartingHabitatCreation);

            finalTimeToTarget = new Decimal(standardTimeToTarget).minus(advanceYears).plus(delayYears).toNumber();

            if (standardTimeToTarget >= 30 && finalTimeToTarget >= 30) {
                finalTimeToTarget = '30+';
            } else if (finalTimeToTarget >= 30) {
                finalTimeToTarget = '30+';
            }
        }
    }

    return {
        ...data,
        finalTimeToTargetCondition: finalTimeToTarget,
    };
}

/**
 * Lookup: attaches temporalMultiplier from finalTimeToTargetCondition.
 */
export function lookupTemporalMultiplierStep<Data extends {
    finalTimeToTargetCondition: number | string | undefined;
}>(data: Data) {
    const finalTimeToTarget = data.finalTimeToTargetCondition;
    const temporalMultiplier = typeof finalTimeToTarget === 'number' || finalTimeToTarget === '30+'
        ? lookupTemporalMultiplier(finalTimeToTarget)
        : finalTimeToTarget;

    return {
        ...data,
        temporalMultiplier,
    };
}

/**
 * Backwards-compatible composed transform: lookup → calc → lookup.
 */
export function enrichWithTemporalData<Data extends {
    habitatType: HedgerowLabel;
    condition: HedgerowCondition;
    habitatCreatedInAdvance: number | "30+";
    delayInStartingHabitatCreation: number | "30+";
}>(data: Data) {
    return lookupTemporalMultiplierStep(
        calculateFinalTimeToTargetCondition(
            lookupStandardTimeToTargetCondition(data)
        )
    );
}

/**
 * Pure calculation: derives finalDifficulty and difficultyMultiplier from resolved
 * standard hedgerow difficulty values.
 */
export function calculateDifficultyData(input: {
    habitatCreatedInAdvance: number | "30+";
    finalTimeToTargetCondition: number | string | undefined;
    standardDifficulty: string;
    standardDifficultyMultiplier: number;
}) {
    let finalDifficulty = input.standardDifficulty;
    let difficultyMultiplier = input.standardDifficultyMultiplier;

    const isCreatedInAdvance = input.habitatCreatedInAdvance === "30+" ||
        (typeof input.habitatCreatedInAdvance === "number" && input.habitatCreatedInAdvance > 0);
    const finalTime = typeof input.finalTimeToTargetCondition === 'number'
        ? input.finalTimeToTargetCondition
        : 999;

    if (isCreatedInAdvance && finalTime <= 0) {
        finalDifficulty = 'Low';
        difficultyMultiplier = difficulty['Low'];
    }

    return {
        standardDifficulty: input.standardDifficulty,
        finalDifficulty,
        difficultyMultiplier,
    };
}

export function enrichWithDifficultyData<Data extends {
    habitatType: HedgerowLabel;
    habitatCreatedInAdvance: number | "30+";
    standardTimeToTargetCondition: number | string | undefined;
    finalTimeToTargetCondition: number | string | undefined;
    technicalDifficultyCreation: string;
    technicalDifficultyCreationMultiplier: number;
}>(data: Data) {
    const hedgerow = allHedgerows[data.habitatType];

    return {
        ...data,
        ...calculateDifficultyData({
            habitatCreatedInAdvance: data.habitatCreatedInAdvance,
            finalTimeToTargetCondition: data.finalTimeToTargetCondition,
            standardDifficulty: hedgerow.technicalDifficultyCreation,
            standardDifficultyMultiplier: hedgerow.technicalDifficultyCreationMultiplier,
        }),
    };
}

/**
 * Pure calculation: derives hedgerowUnitsDelivered.
 */
export function calculateHedgerowUnitsDelivered(input: {
    length: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
    temporalMultiplier: number | string | undefined;
    difficultyMultiplier: number;
}) {
    const temporalMultiplierValue = typeof input.temporalMultiplier === 'number'
        ? input.temporalMultiplier
        : 0;

    const hedgerowUnitsDelivered = new Decimal(input.length)
        .mul(input.distinctivenessScore)
        .mul(input.conditionScore)
        .mul(input.strategicSignificanceMultiplier)
        .mul(temporalMultiplierValue)
        .mul(input.difficultyMultiplier)
        .toNumber();

    return { hedgerowUnitsDelivered };
}

/**
 * Calculate hedgerow units delivered
 */
export function enrichWithHedgerowUnitsDelivered<Data extends {
    length: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
    temporalMultiplier: number | string | undefined;
    difficultyMultiplier: number;
}>(data: Data) {
    const temporalMultiplierValue = typeof data.temporalMultiplier === 'number'
        ? data.temporalMultiplier
        : 0;

    const hedgerowUnitsDelivered = new Decimal(data.length)
        .mul(data.distinctivenessScore)
        .mul(data.conditionScore)
        .mul(data.strategicSignificanceMultiplier)
        .mul(temporalMultiplierValue)
        .mul(data.difficultyMultiplier)
        .toNumber();

    return {
        ...data,
        hedgerowUnitsDelivered,
    };
}

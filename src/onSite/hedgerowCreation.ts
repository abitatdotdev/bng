import { type Decimal, toDecimal } from '../decimal';
import * as v from 'valibot';
import { allHedgerows, type HedgerowLabel } from '../hedgerows';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema, safeTransform, yearsSchema } from '../schemaUtils';
import {
    getStrategicSignificance,
    type StrategicSignificanceDescription,
} from '../strategicSignificanceSchema';
import { hedgerowConditionSchema, type HedgerowCondition } from '../hedgerowCondition';
import { lookupTemporalMultiplier } from '../temporalMultipliers';
import { addOnSiteHedgerowCreationTimingGuidance } from './hedgerowTiming';
import { difficulty } from '../difficulty';
import { hedgerowTypeSchema } from '../hedgerowType';
import {
    calculateFinalTimeToTargetCondition as calculateFinalTimeToTargetConditionPure,
    calculateHedgerowUnitsDelivered,
} from '../hedgerowCalc';

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
    v.transform((data) => ({
        ...data,
        length: data.length.toNumber(),
        lengthDecimal: data.length,
        habitatCreatedInAdvance: data.habitatCreatedInAdvance,
        habitatCreatedInAdvanceDecimal:
            typeof data.habitatCreatedInAdvance === 'number'
                ? toDecimal(data.habitatCreatedInAdvance)
                : data.habitatCreatedInAdvance,
        delayInStartingHabitatCreation: data.delayInStartingHabitatCreation,
        delayInStartingHabitatCreationDecimal:
            typeof data.delayInStartingHabitatCreation === 'number'
                ? toDecimal(data.delayInStartingHabitatCreation)
                : data.delayInStartingHabitatCreation,
    })),
    // Validate that the habitat type is valid
    v.forward(
        v.check((s) => !!allHedgerows[s.habitatType], 'Invalid hedgerow habitat type'),
        ['habitatType'],
    ),
    // Check if Non-native and ornamental hedgerow has only Poor condition
    v.forward(
        v.check(
            (s) => !(s.habitatType === 'Non-native and ornamental hedgerow' && s.condition !== 'Poor'),
            'Non-native and ornamental hedgerow can only have Poor condition',
        ),
        ['condition'],
    ),
    // Check that both advance and delay are not both > 0 (invalid scenario)
    v.check(
        (s) =>
            !(
                (s.habitatCreatedInAdvance === '30+' ||
                    (typeof s.habitatCreatedInAdvance === 'number' && s.habitatCreatedInAdvance > 0)) &&
                (s.delayInStartingHabitatCreation === '30+' ||
                    (typeof s.delayInStartingHabitatCreation === 'number' &&
                        s.delayInStartingHabitatCreation > 0))
            ),
        'Cannot have both habitat created in advance and delay in starting creation',
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
    v.transform(addOnSiteHedgerowCreationTimingGuidance),
);

export type OnSiteHedgerowCreationSchema = v.InferInput<typeof onSiteHedgerowCreationSchema>;
export type OnSiteHedgerowCreation = v.InferOutput<typeof onSiteHedgerowCreationSchema>;

export const onSiteHedgerowCreationUncheckedSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        length: data.length.toNumber(),
        lengthDecimal: data.length,
        habitatCreatedInAdvance: data.habitatCreatedInAdvance,
        habitatCreatedInAdvanceDecimal:
            typeof data.habitatCreatedInAdvance === 'number'
                ? toDecimal(data.habitatCreatedInAdvance)
                : data.habitatCreatedInAdvance,
        delayInStartingHabitatCreation: data.delayInStartingHabitatCreation,
        delayInStartingHabitatCreationDecimal:
            typeof data.delayInStartingHabitatCreation === 'number'
                ? toDecimal(data.delayInStartingHabitatCreation)
                : data.delayInStartingHabitatCreation,
    })),
    safeTransform(enrichWithHedgerowData),
    safeTransform(lookupStandardTimeToTargetCondition),
    safeTransform(calculateFinalTimeToTargetCondition),
    safeTransform(lookupTemporalMultiplierStep),
    safeTransform(enrichWithDifficultyData),
    safeTransform(enrichWithHedgerowUnitsDelivered),
    safeTransform(addOnSiteHedgerowCreationTimingGuidance),
);

/**
 * Enrich data with hedgerow properties from the hedgerows lookup
 */
export function enrichWithHedgerowData<
    Data extends {
        habitatType: HedgerowLabel;
        condition: HedgerowCondition;
        strategicSignificance: StrategicSignificanceDescription;
    },
>(data: Data) {
    const hedgerow = allHedgerows[data.habitatType];

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    return {
        ...data,
        distinctiveness: hedgerow.distinctivenessCategory,
        distinctivenessScore: hedgerow.distinctivenessScore,
        distinctivenessScoreDecimal: toDecimal(hedgerow.distinctivenessScore),
        conditionScore: hedgerow.conditions[data.condition],
        conditionScoreDecimal: toDecimal(hedgerow.conditions[data.condition]),
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        strategicSignificanceMultiplierDecimal: toDecimal(strategicSignificance.multiplier),
        tradingRules: hedgerow.tradingRules,
        technicalDifficultyCreation: hedgerow.technicalDifficultyCreation,
        technicalDifficultyCreationMultiplier: hedgerow.technicalDifficultyCreationMultiplier,
        technicalDifficultyCreationMultiplierDecimal: toDecimal(
            hedgerow.technicalDifficultyCreationMultiplier,
        ),
    };
}

/**
 * Lookup: attaches standardTimeToTargetCondition from hedgerow.yearsToTargetConditionViaCreation.
 */
export function lookupStandardTimeToTargetCondition<
    Data extends {
        habitatType: HedgerowLabel;
        condition: HedgerowCondition;
    },
>(data: Data) {
    const hedgerow = allHedgerows[data.habitatType];
    const standardTimeToTargetCondition = hedgerow.yearsToTargetConditionViaCreation[data.condition];

    return {
        ...data,
        standardTimeToTargetCondition,
        standardTimeToTargetConditionDecimal:
            typeof standardTimeToTargetCondition === 'number'
                ? toDecimal(standardTimeToTargetCondition)
                : standardTimeToTargetCondition,
    };
}

/**
 * Pipeline transform: calls the pure final-time calculation and merges into data.
 */
export function calculateFinalTimeToTargetCondition<
    Data extends {
        standardTimeToTargetCondition: number | string | undefined;
        habitatCreatedInAdvance: number | '30+';
        delayInStartingHabitatCreation: number | '30+';
    },
>(data: Data) {
    return { ...data, ...calculateFinalTimeToTargetConditionPure(data) };
}

/**
 * Lookup: attaches temporalMultiplier from finalTimeToTargetCondition.
 */
export function lookupTemporalMultiplierStep<
    Data extends {
        finalTimeToTargetCondition: number | string | undefined;
    },
>(data: Data) {
    const finalTimeToTarget = data.finalTimeToTargetCondition;
    const temporalMultiplier =
        typeof finalTimeToTarget === 'number' || finalTimeToTarget === '30+'
            ? lookupTemporalMultiplier(finalTimeToTarget)
            : finalTimeToTarget;

    return {
        ...data,
        temporalMultiplier,
        temporalMultiplierDecimal:
            typeof temporalMultiplier === 'number' ? toDecimal(temporalMultiplier) : temporalMultiplier,
    };
}

/**
 * Backwards-compatible composed transform: lookup → calc → lookup.
 */
export function enrichWithTemporalData<
    Data extends {
        habitatType: HedgerowLabel;
        condition: HedgerowCondition;
        habitatCreatedInAdvance: number | '30+';
        delayInStartingHabitatCreation: number | '30+';
    },
>(data: Data) {
    return lookupTemporalMultiplierStep(
        calculateFinalTimeToTargetCondition(lookupStandardTimeToTargetCondition(data)),
    );
}

/**
 * Pure calculation: derives finalDifficulty and difficultyMultiplier from resolved
 * standard hedgerow difficulty values.
 */
export function calculateDifficultyData(input: {
    habitatCreatedInAdvance: number | '30+';
    finalTimeToTargetCondition: number | string | undefined;
    standardDifficulty: string;
    standardDifficultyMultiplier: number;
    standardDifficultyMultiplierDecimal?: Decimal;
}) {
    let finalDifficulty = input.standardDifficulty;
    let difficultyMultiplier = input.standardDifficultyMultiplier;

    const isCreatedInAdvance =
        input.habitatCreatedInAdvance === '30+' ||
        (typeof input.habitatCreatedInAdvance === 'number' && input.habitatCreatedInAdvance > 0);
    const finalTime =
        typeof input.finalTimeToTargetCondition === 'number' ? input.finalTimeToTargetCondition : 999;

    if (isCreatedInAdvance && finalTime <= 0) {
        finalDifficulty = 'Low';
        difficultyMultiplier = difficulty['Low'];
    }

    return {
        standardDifficulty: input.standardDifficulty,
        finalDifficulty,
        difficultyMultiplier,
        difficultyMultiplierDecimal: toDecimal(difficultyMultiplier),
    };
}

export function enrichWithDifficultyData<
    Data extends {
        habitatType: HedgerowLabel;
        habitatCreatedInAdvance: number | '30+';
        standardTimeToTargetCondition: number | string | undefined;
        finalTimeToTargetCondition: number | string | undefined;
        technicalDifficultyCreation: string;
        technicalDifficultyCreationMultiplier: number;
        technicalDifficultyCreationMultiplierDecimal: Decimal;
    },
>(data: Data) {
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
 * Pipeline transform: calls the pure units-delivered calculation and merges into data.
 */
export function enrichWithHedgerowUnitsDelivered<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number;
        conditionScoreDecimal: Decimal;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        temporalMultiplier: number | string | undefined;
        difficultyMultiplier: number;
        difficultyMultiplierDecimal: Decimal;
    },
>(data: Data) {
    const delivered = calculateHedgerowUnitsDelivered(data);
    return {
        ...data,
        hedgerowUnitsDelivered: delivered.hedgerowUnitsDelivered,
        hedgerowUnitsDeliveredDecimal: delivered.hedgerowUnitsDeliveredDecimal,
    };
}

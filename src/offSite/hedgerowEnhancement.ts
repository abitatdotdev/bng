import { Decimal, toDecimal } from '../decimal';
import * as v from 'valibot';

import { allHedgerows, type HedgerowLabel, type Hedgerow } from '../hedgerows';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, safeTransform, yearsSchema } from '../schemaUtils';
import {
    getStrategicSignificance,
    type StrategicSignificanceDescription,
} from '../strategicSignificanceSchema';
import { hedgerowConditionSchema, type HedgerowCondition } from '../hedgerowCondition';
import { difficulty } from '../difficulty';
import { hedgerowTypeSchema } from '../hedgerowType';
import {
    offSiteHedgerowBaselineSchema,
    offSiteHedgerowBaselineUncheckedSchema,
    type OffSiteHedgerowBaseline,
} from './hedgerowBaseline';
import { enrichWithSpatialRisk } from './common';
import { lookupTemporalMultiplier } from '../temporalMultipliers';
import {
    calculateEnhancementPathway,
    calculateEnhancementTimeToTarget,
    calculateEnhancementUnitsDelivered,
} from '../hedgerowCalc';
import { calculateEnhancementDifficulty as calculateEnhancementDifficultyShared } from '../enhancementDifficultyCalc';
import { applyEnhancementConditionAvailability } from '../calculationAvailability';
import { addLinearTimingGuidance, applyHedgerowEnhancementQuality, applyLinearTimingAvailability, applyHedgerowOffSiteAvailability } from '../linearRuleAvailability';
import {
    enrichHedgerowEnhancementMovement,
    gateHedgerowEnhancementMovement,
} from '../hedgerowEnhancementMovementGate';

const inputSchema = v.object({
    baseline: offSiteHedgerowBaselineSchema,
    habitatType: hedgerowTypeSchema,
    condition: hedgerowConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    hedgerowEnhancedInAdvance: v.optional(yearsSchema, 0),
    hedgerowEnhancedDelay: v.optional(yearsSchema, 0),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
});

/**
 * Extract baseline hedgerow data including length
 * The baseline contains the length that is being enhanced
 */
const enrichBaselineHedgerowData = <
    Data extends {
        baseline: OffSiteHedgerowBaseline;
    },
>(
    data: Data,
) => {
    const { baseline } = data;
    const hedgerow = allHedgerows[baseline.habitatType];

    return {
        ...data,
        length: baseline.lengthEnhanced,
        lengthDecimal: baseline.lengthEnhancedDecimal,
        _baselineHedgerow: {
            ...hedgerow,
            label: baseline.habitatType,
            distinctivenessScore: baseline.distinctivenessScore,
            distinctivenessScoreDecimal: baseline.distinctivenessScoreDecimal,
            distinctivenessCategory: baseline.distinctiveness,
        },
        _baselineCondition: baseline.conditionScore,
        _baselineConditionDecimal: toDecimal(baseline.conditionScore),
    };
};

/**
 * Enrich data with proposed hedgerow properties from the hedgerows lookup
 */
const enrichProposedHedgerowData = <
    Data extends {
        habitatType: HedgerowLabel;
        condition: HedgerowCondition;
        strategicSignificance: StrategicSignificanceDescription;
    },
>(
    data: Data,
) => {
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
        technicalDifficultyEnhancement: hedgerow.technicalDifficultyEnhancement,
        technicalDifficultyEnhancementMultiplier: hedgerow.technicalDifficultyEnhancementMultiplier,
        technicalDifficultyEnhancementMultiplierDecimal: toDecimal(
            hedgerow.technicalDifficultyEnhancementMultiplier,
        ),
    };
};

const addEnhancementPathway = <
    Data extends {
        baseline: OffSiteHedgerowBaseline;
        condition: HedgerowCondition;
    },
>(
    data: Data,
) => {
    return {
        ...data,
        ...calculateEnhancementPathway({
            baselineCondition: data.baseline.condition,
            proposedCondition: data.condition,
        }),
    };
};

const lookupEnhancementTimeToTarget = <
    Data extends {
        _baselineHedgerow: Pick<
            Hedgerow,
            'distinctivenessScore' | 'yearsToTargetConditionViaDistinctiveness'
        >;
        distinctivenessScore: Hedgerow['distinctivenessScore'];
        habitatType: HedgerowLabel;
        enhancementPathway: string;
    },
>(
    data: Data,
) => {
    const hedgerow = allHedgerows[data.habitatType];
    return {
        ...data,
        ...calculateEnhancementTimeToTarget({
            baselineDistinctivenessScore: data._baselineHedgerow.distinctivenessScore,
            distinctivenessScore: data.distinctivenessScore,
            yearsToTargetConditionViaDistinctiveness:
                data._baselineHedgerow.yearsToTargetConditionViaDistinctiveness,
            yearsToTargetConditionViaEnhancement: hedgerow.yearsToTargetConditionViaEnhancement,
            habitatType: data.habitatType,
            enhancementPathway: data.enhancementPathway,
        }),
    };
};

/**
 * Helper to convert years value to number for arithmetic
 */
function yearsToNumber(years: number | '30+'): number {
    return years === '30+' ? 31 : years;
}

/**
 * Calculate final time to target condition based on:
 * - Standard enhancement time (from enhancement temporal data)
 * - Years of hedgerow enhanced in advance
 * - Years of delay in starting enhancement
 */
const calculateFinalTimeToTargetCondition = <
    Data extends {
        timeToTargetCondition: number | '30+' | 'Not possible ▲';
        hedgerowEnhancedInAdvance: number | '30+';
        hedgerowEnhancedDelay: number | '30+';
    },
>(
    data: Data,
) => {
    const { timeToTargetCondition, hedgerowEnhancedInAdvance, hedgerowEnhancedDelay } = data;

    let finalTimeToTargetCondition: number | '30+' | 'Not possible ▲';
    const normalisedHedgerowEnhancedInAdvance = yearsToNumber(hedgerowEnhancedInAdvance);
    const normalisedHedgerowEnhancedDelay = yearsToNumber(hedgerowEnhancedDelay);

    if (timeToTargetCondition === 'Not possible ▲') {
        finalTimeToTargetCondition = 'Not possible ▲';
    } else if (timeToTargetCondition === '30+') {
        if (hedgerowEnhancedInAdvance === 0) {
            finalTimeToTargetCondition = '30+';
        } else {
            const result = new Decimal(31)
                .minus(normalisedHedgerowEnhancedInAdvance)
                .plus(normalisedHedgerowEnhancedDelay)
                .toNumber();
            if (result >= 30) {
                finalTimeToTargetCondition = '30+';
            } else {
                finalTimeToTargetCondition = Decimal.max(0, result).toNumber();
            }
        }
    } else if (normalisedHedgerowEnhancedInAdvance >= timeToTargetCondition) {
        finalTimeToTargetCondition = 0;
    } else {
        const result = new Decimal(timeToTargetCondition)
            .minus(normalisedHedgerowEnhancedInAdvance)
            .plus(normalisedHedgerowEnhancedDelay)
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
};

const lookupTemporalMultiplierStep = <
    Data extends {
        finalTimeToTargetCondition: number | '30+' | 'Not possible ▲';
    },
>(
    data: Data,
) => {
    const finalTimeToTargetCondition = data.finalTimeToTargetCondition;
    const temporalMultiplier =
        typeof finalTimeToTargetCondition === 'number' || finalTimeToTargetCondition === '30+'
            ? lookupTemporalMultiplier(finalTimeToTargetCondition)
            : finalTimeToTargetCondition;

    const finalTimeToTargetMultiplier =
        typeof temporalMultiplier === 'number' ? temporalMultiplier : undefined;

    return {
        ...data,
        temporalMultiplier,
        temporalMultiplierDecimal:
            typeof temporalMultiplier === 'number' ? toDecimal(temporalMultiplier) : temporalMultiplier,
        finalTimeToTargetMultiplier,
        finalTimeToTargetMultiplierDecimal:
            typeof finalTimeToTargetMultiplier === 'number'
                ? toDecimal(finalTimeToTargetMultiplier)
                : finalTimeToTargetMultiplier,
    };
};

/**
 * Determine enhancement difficulty based on whether hedgerow reached target before losses
 */
export function calculateEnhancementDifficulty(input: {
    hedgerowEnhancedInAdvance: number | '30+';
    finalTimeToTargetCondition: number | '30+' | 'Not possible ▲';
    standardDifficultyOfEnhancement: string;
}) {
    return calculateEnhancementDifficultyShared({
        enhancedInAdvance: input.hedgerowEnhancedInAdvance,
        finalTimeToTargetCondition: input.finalTimeToTargetCondition,
        standardDifficultyOfEnhancement: input.standardDifficultyOfEnhancement as keyof typeof difficulty,
        lowDifficultyMessage: 'Low Difficulty - only applicable if all hedgerow enhanced before losses ⚠',
    });
}

const determineEnhancementDifficulty = <
    Data extends {
        habitatType: HedgerowLabel;
        timeToTargetCondition: number | '30+' | 'Not possible ▲';
        hedgerowEnhancedInAdvance: number | '30+';
        finalTimeToTargetCondition: number | '30+' | 'Not possible ▲';
        technicalDifficultyEnhancement: string;
        technicalDifficultyEnhancementMultiplier: number;
    },
>(
    data: Data,
) => {
    const hedgerow = allHedgerows[data.habitatType];

    return {
        ...data,
        ...calculateEnhancementDifficulty({
            hedgerowEnhancedInAdvance: data.hedgerowEnhancedInAdvance,
            finalTimeToTargetCondition: data.finalTimeToTargetCondition,
            standardDifficultyOfEnhancement: hedgerow.technicalDifficultyEnhancement,
        }),
    };
};

/**
 * Enriches data with spatial risk multiplier from baseline.
 */
const enrichWithSpatialRiskData = <
    Data extends {
        baseline: OffSiteHedgerowBaseline;
    },
>(
    data: Data,
) => {
    const spatialRiskCategory = data.baseline.spatialRiskCategory;
    return spatialRiskCategory
        ? enrichWithSpatialRisk({ ...data, spatialRiskCategory })
        : { ...data, spatialRiskMultiplier: 1, spatialRiskMultiplierDecimal: toDecimal(1) };
};

/**
 * Calculate hedgerow units delivered from enhancement as NET GAIN over baseline
 *
 * Formula:
 * - Calculate proposed units: Length × Proposed Distinctiveness × Proposed Condition
 * - Calculate baseline units: Length × Baseline Distinctiveness × Baseline Condition
 * - Calculate delta with multipliers: (Proposed - Baseline) × Difficulty × Temporal
 * - Add back baseline units: Delta + Baseline
 * - Apply strategic significance: Result × Strategic
 *
 * For off-site, calculates two values:
 * 1. hedgerowUnitsDeliveredWithSpatialRisk: includes spatial risk multiplier (column AJ in Excel)
 * 2. hedgerowUnitsDelivered: without spatial risk multiplier (column AK in Excel)
 *
 * Special case: If baseline condition > proposed condition (condition reduced),
 * use proposed condition as baseline condition for calculation
 */
const enrichWithEnhancementUnitsDelivered = <
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        _baselineHedgerow: any;
        _baselineCondition: number;
        _baselineConditionDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number;
        conditionScoreDecimal: Decimal;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        temporalMultiplier: number | string;
        temporalMultiplierDecimal: Decimal | string;
        difficultyMultiplierApplied: number;
        difficultyMultiplierAppliedDecimal: Decimal;
        spatialRiskMultiplier: number;
        spatialRiskMultiplierDecimal: Decimal;
    },
>(
    data: Data,
) => {
    return {
        ...data,
        ...calculateEnhancementUnitsDelivered({
            length: data.length,
            lengthDecimal: data.lengthDecimal,
            baselineDistinctivenessScore: data._baselineHedgerow.distinctivenessScore,
            baselineDistinctivenessScoreDecimal: toDecimal(data._baselineHedgerow.distinctivenessScore),
            baselineConditionScore: data._baselineCondition,
            baselineConditionScoreDecimal: data._baselineConditionDecimal,
            distinctivenessScore: data.distinctivenessScore,
            distinctivenessScoreDecimal: data.distinctivenessScoreDecimal,
            conditionScore: data.conditionScore,
            conditionScoreDecimal: data.conditionScoreDecimal,
            strategicSignificanceMultiplier: data.strategicSignificanceMultiplier,
            strategicSignificanceMultiplierDecimal: data.strategicSignificanceMultiplierDecimal,
            temporalMultiplier: data.temporalMultiplier,
            temporalMultiplierDecimal: data.temporalMultiplierDecimal,
            difficultyMultiplierApplied: data.difficultyMultiplierApplied,
            difficultyMultiplierAppliedDecimal: data.difficultyMultiplierAppliedDecimal,
            spatialRiskMultiplier: data.spatialRiskMultiplier,
            spatialRiskMultiplierDecimal: data.spatialRiskMultiplierDecimal,
        }),
    };
};

const offSiteHedgerowEnhancementValidatedSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        hedgerowEnhancedInAdvance: data.hedgerowEnhancedInAdvance,
        hedgerowEnhancedInAdvanceDecimal:
            typeof data.hedgerowEnhancedInAdvance === 'number'
                ? toDecimal(data.hedgerowEnhancedInAdvance)
                : data.hedgerowEnhancedInAdvance,
        hedgerowEnhancedDelay: data.hedgerowEnhancedDelay,
        hedgerowEnhancedDelayDecimal:
            typeof data.hedgerowEnhancedDelay === 'number'
                ? toDecimal(data.hedgerowEnhancedDelay)
                : data.hedgerowEnhancedDelay,
    })),

    v.transform((data) => enrichHedgerowEnhancementMovement(data, true)),
    v.forward(
        v.check(
            (data) => data.enhancementMovement.status !== 'forbidden',
            (issue) => issue.input.enhancementMovement.message,
        ),
        ['habitatType'],
    ),

    // Basic validations
    v.forward(
        v.check((s) => !!allHedgerows[s.habitatType], 'Invalid hedgerow habitat type'),
        ['habitatType'],
    ),
    v.forward(
        v.check(
            (s) => !(s.habitatType === 'Non-native and ornamental hedgerow' && s.condition !== 'Poor'),
            'Non-native and ornamental hedgerow can only have Poor condition',
        ),
        ['condition'],
    ),
    v.check(
        (s) =>
            !(
                (typeof s.hedgerowEnhancedInAdvance === 'string' || s.hedgerowEnhancedInAdvance > 0) &&
                (typeof s.hedgerowEnhancedDelay === 'string' || s.hedgerowEnhancedDelay > 0)
            ),
        'Cannot have both hedgerow enhanced in advance and delay in starting hedgerow enhancement',
    ),
    v.forward(
        v.check(
            (data) => !data.baseline.spatialRiskCategory || !!data.offSiteReferenceNumber,
            'Off-site reference required ▲',
        ),
        ['offSiteReferenceNumber'],
    ),

    // Extract baseline data and length
    v.transform(enrichBaselineHedgerowData),

    // Enrich proposed hedgerow data
    v.transform(enrichProposedHedgerowData),

    // Validation checks for enhancement
    v.check((data) => {
        const baseline = data._baselineHedgerow;
        const proposed = allHedgerows[data.habitatType];

        // Mirror the DEFRA workbook (column O on E-3 / B-3): the only
        // distinctiveness rejection is High→High with mismatched labels.
        // Otherwise require same-or-better distinctiveness.
        if (baseline.distinctivenessCategory === 'High' && proposed.distinctivenessCategory === 'High') {
            return baseline.label === proposed.label;
        }
        return proposed.distinctivenessScore >= baseline.distinctivenessScore;
    }, 'Trading rules not satisfied - hedgerow distinctiveness mismatch'),
    v.forward(
        v.check(
            (data) => data._baselineCondition <= data.conditionScore,
            'Error - Can not reduce condition ▲',
        ),
        ['condition'],
    ),
    v.check(
        (data) =>
            data._baselineCondition !== data.conditionScore ||
            data.distinctivenessScore > data._baselineHedgerow.distinctivenessScore,
        'Enhancement does not improve hedgerow quality',
    ),

);

export const offSiteHedgerowEnhancementSchema = v.pipe(
    offSiteHedgerowEnhancementValidatedSchema,

    // Calculate enhancement pathway label
    v.transform(addEnhancementPathway),

    // Temporal calculation
    v.transform(lookupEnhancementTimeToTarget),
    v.transform(calculateFinalTimeToTargetCondition),
    v.transform(lookupTemporalMultiplierStep),

    // Difficulty logic
    v.transform(determineEnhancementDifficulty),

    // Spatial risk multiplier
    v.transform(enrichWithSpatialRiskData),
    // Final calculation
    v.transform(enrichWithEnhancementUnitsDelivered),
    v.transform((data) =>
        applyEnhancementConditionAvailability(
            gateHedgerowEnhancementMovement(
                applyHedgerowOffSiteAvailability(
                    applyLinearTimingAvailability(
                        {
                            ...applyHedgerowEnhancementQuality(addLinearTimingGuidance(data), true),
                        },
                        'hedgerow',
                        true,
                        data.hedgerowEnhancedInAdvance,
                        data.hedgerowEnhancedDelay,
                    ),
                ),
            ),
            'hedgerow',
            true,
        ),
    ),
);

export type OffSiteHedgerowEnhancementSchema = v.InferInput<typeof offSiteHedgerowEnhancementSchema>;
export type OffSiteHedgerowEnhancement = v.InferOutput<typeof offSiteHedgerowEnhancementSchema>;

const uncheckedInputSchema = v.object({
    ...inputSchema.entries,
    baseline: offSiteHedgerowBaselineUncheckedSchema,
});

export const offSiteHedgerowEnhancementUncheckedSchema = v.pipe(
    uncheckedInputSchema,
    v.transform((data) => ({
        ...data,
        hedgerowEnhancedInAdvance: data.hedgerowEnhancedInAdvance,
        hedgerowEnhancedInAdvanceDecimal:
            typeof data.hedgerowEnhancedInAdvance === 'number'
                ? toDecimal(data.hedgerowEnhancedInAdvance)
                : data.hedgerowEnhancedInAdvance,
        hedgerowEnhancedDelay: data.hedgerowEnhancedDelay,
        hedgerowEnhancedDelayDecimal:
            typeof data.hedgerowEnhancedDelay === 'number'
                ? toDecimal(data.hedgerowEnhancedDelay)
                : data.hedgerowEnhancedDelay,
    })),
    safeTransform((data) => enrichHedgerowEnhancementMovement(data, true)),
    safeTransform(enrichBaselineHedgerowData),
    safeTransform(enrichProposedHedgerowData),
    safeTransform(addEnhancementPathway),
    safeTransform(lookupEnhancementTimeToTarget),
    safeTransform(calculateFinalTimeToTargetCondition),
    safeTransform(lookupTemporalMultiplierStep),
    safeTransform(determineEnhancementDifficulty),
    safeTransform(enrichWithSpatialRiskData),
    safeTransform(enrichWithEnhancementUnitsDelivered),
    safeTransform((data) =>
        applyEnhancementConditionAvailability(
            gateHedgerowEnhancementMovement(
                applyHedgerowOffSiteAvailability(
                    applyLinearTimingAvailability(
                        {
                            ...applyHedgerowEnhancementQuality(addLinearTimingGuidance(data), true),
                        },
                        'hedgerow',
                        true,
                        data.hedgerowEnhancedInAdvance,
                        data.hedgerowEnhancedDelay,
                    ),
                ),
            ),
            'hedgerow',
            true,
        ),
    ),
);

import { Decimal, toDecimal } from '../decimal';
import * as v from 'valibot';

import { broadHabitatSchema } from '../broadHabitats';
import { creationHabitatType, type CreationHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import {
    areaSchema,
    enrichWithCreationData,
    enrichWithHabitatData,
    freeTextSchema,
    isValidCondition,
    isValidHabitat,
    safeTransform,
    yearsSchema,
} from '../schemaUtils';
import { habitatByBroadAndType, type Habitat } from '../habitats';
import { lookupFinalTimeToTargetMultiplier } from '../areaTiming';
import { calculateDifficultyData, calculateStandardOrAdjustedTimeToTarget } from '../areaCreationCalculations';
export {
    calculateAppliedDifficultyMultiplier,
    calculateDifficultyData,
    calculateDifficultyMultiplierApplied,
    calculateFinalDifficultyOfCreation,
    calculateStandardOrAdjustedTimeToTarget,
} from '../areaCreationCalculations';
import { calculateHabitatUnitsDelivered } from '../habitatCalc';
import { applyOnSiteHabitatCreationTiming } from './habitatAvailability';
import type { AreaDistinctivenessScore, HabitatConditionScore } from '../areaCalculationTypes';

const inputSchema = v.object({
    broadHabitat: broadHabitatSchema,
    habitatType: creationHabitatType,
    area: areaSchema,
    condition: conditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatCreationInAdvance: v.optional(yearsSchema, 0),
    habitatCreationDelay: v.optional(yearsSchema, 0),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
});

/**
 * Calculates the final time to target condition and its corresponding multiplier based on:
 * - Standard time to target condition (from habitat temporal multipliers)
 * - Years of habitat creation in advance
 * - Years of delay in starting habitat creation
 *
 * Formula: finalTime = standardTime - advance + delay
 * - Capped at "30+" if result > 30
 * - Returns 0 if advance >= standardTime
 * - Returns "Not Possible" if standardTime is "Not Possible ▲"
 *
 * Also calculates standardOrAdjustedTimeToTarget (column R) which provides validation messages
 * based on the habitat creation parameters.
 *
 * Also looks up the temporal multiplier for the calculated final time.
 *
 * Corresponds to formulas in Excel cells R12, S12, and T12 of sheet A-2
 */
/**
 * Pure calculation: derives standardOrAdjustedTimeToTarget and finalTimeToTargetCondition.
 *
 * Reads timeToPoorCondition from data._habitat.temporalMultipliers['Poor'] (already attached
 * by enrichWithHabitatData earlier in the pipeline).
 */
const calculateFinalTimeToTargetCondition = <
    Data extends {
        broadHabitat: string;
        habitatType: string;
        distinctivenessScore: AreaDistinctivenessScore;
        timeToTargetCondition: number | '30+' | 'Not Possible ▲';
        habitatCreationInAdvance: number | '30+';
        habitatCreationDelay: number | '30+';
        _habitat: Habitat;
    },
>(
    data: Data,
) => {
    const { timeToTargetCondition, habitatCreationInAdvance, habitatCreationDelay, distinctivenessScore } =
        data;

    const timeToPoorCondition = data._habitat.temporalMultipliers['Poor'];

    const normalisedHabitatCreationInAdvance =
        typeof habitatCreationInAdvance === 'string' ? 30 : habitatCreationInAdvance;
    const normalisedHabitatCreationDelay =
        typeof habitatCreationDelay === 'string' ? 30 : habitatCreationDelay;

    let standardOrAdjustedTimeToTarget = calculateStandardOrAdjustedTimeToTarget(
        normalisedHabitatCreationInAdvance,
        habitatCreationInAdvance,
        normalisedHabitatCreationDelay,
        habitatCreationDelay,
        distinctivenessScore,
        timeToTargetCondition,
        timeToPoorCondition,
    );

    let finalTimeToTargetCondition: number | '30+' | 'Not Possible ▲';

    if (timeToTargetCondition === 'Not Possible ▲') {
        finalTimeToTargetCondition = 'Not Possible ▲';
    } else if (timeToTargetCondition === '30+') {
        if (habitatCreationInAdvance === 0) {
            finalTimeToTargetCondition = '30+';
        } else {
            finalTimeToTargetCondition = Decimal.max(
                0,
                new Decimal(30).minus(normalisedHabitatCreationInAdvance),
            ).toNumber();
        }
    } else if (
        normalisedHabitatCreationInAdvance >= timeToTargetCondition &&
        normalisedHabitatCreationInAdvance !== 0 &&
        timeToTargetCondition !== 0
    ) {
        finalTimeToTargetCondition = 0;
    } else {
        const result = new Decimal(timeToTargetCondition)
            .minus(normalisedHabitatCreationInAdvance)
            .plus(normalisedHabitatCreationDelay)
            .toNumber();

        if (result > 30) {
            finalTimeToTargetCondition = '30+';
        } else {
            finalTimeToTargetCondition = Decimal.max(0, result).toNumber();
        }
    }

    return {
        ...data,
        standardOrAdjustedTimeToTarget,
        finalTimeToTargetCondition,
        finalTimeToTargetConditionDecimal:
            typeof finalTimeToTargetCondition === 'number'
                ? toDecimal(finalTimeToTargetCondition)
                : finalTimeToTargetCondition,
    };
};

/**
 * Enriches data with difficulty-related properties.
 *
 * Calculates:
 * - standardDifficultyOfCreation: The standard technical difficulty for habitat creation
 * - appliedDifficultyMultiplier: A message indicating which difficulty logic was applied
 * - finalDifficultyOfCreation: The actual difficulty level used for calculations
 * - difficultyMultiplierApplied: The numeric multiplier value
 *
 * Corresponds to columns U-X in Excel sheet A-2
 */
export const enrichWithDifficultyData = <
    Data extends {
        broadHabitat: string;
        habitatType: CreationHabitatType;
        standardOrAdjustedTimeToTarget: ReturnType<typeof calculateStandardOrAdjustedTimeToTarget>;
        timeToTargetCondition: number | '30+' | 'Not Possible ▲';
        habitatCreationInAdvance: number | '30+';
        finalTimeToTargetCondition: number | '30+' | 'Not Possible ▲';
    },
>(
    data: Data,
) => {
    const habitat = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

    return {
        ...data,
        ...calculateDifficultyData({
            habitatType: data.habitatType,
            standardOrAdjustedTimeToTarget: data.standardOrAdjustedTimeToTarget,
            timeToTargetCondition: data.timeToTargetCondition,
            habitatCreationInAdvance: data.habitatCreationInAdvance,
            standardDifficultyOfCreation: habitat.technicalDifficultyCreation,
            technicalDifficultyEnhancement: habitat.technicalDifficultyEnhancement,
        }),
    };
};

/**
 * Calculates habitat units delivered for on-site habitat creation.
 *
 * Formula: Area × Distinctiveness Score × Condition Score × Strategic Significance Multiplier
 *          × Final Time to Target Multiplier × Difficulty Multiplier
 *
 * If finalTimeToTargetMultiplier is undefined (e.g., "Not Possible ▲"), returns 0 units.
 *
 * Corresponds to column Y in Excel sheet A-2
 */
const enrichWithHabitatUnitsDelivered = <
    Data extends {
        area: number;
        distinctivenessScore: AreaDistinctivenessScore;
        conditionScore: HabitatConditionScore | undefined;
        strategicSignificanceMultiplier: number;
        finalTimeToTargetMultiplier: number | undefined;
        difficultyMultiplierApplied: number;
    },
>(
    data: Data,
) => {
    const delivered = calculateHabitatUnitsDelivered(data);
    return {
        ...data,
        habitatUnitsDelivered: delivered.habitatUnitsDelivered,
        habitatUnitsDeliveredDecimal: delivered.habitatUnitsDeliveredDecimal,
    };
};

export const onSiteHabitatCreationSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        area: data.area.toNumber(),
        areaDecimal: data.area,
        habitatCreationInAdvance: data.habitatCreationInAdvance,
        habitatCreationInAdvanceDecimal:
            typeof data.habitatCreationInAdvance === 'number'
                ? toDecimal(data.habitatCreationInAdvance)
                : data.habitatCreationInAdvance,
        habitatCreationDelay: data.habitatCreationDelay,
        habitatCreationDelayDecimal:
            typeof data.habitatCreationDelay === 'number'
                ? toDecimal(data.habitatCreationDelay)
                : data.habitatCreationDelay,
    })),
    v.forward(
        v.check(
            (s) => isValidHabitat(s.broadHabitat, s.habitatType),
            'The broad habitat and habitat type are incompatible',
        ),
        ['habitatType'],
    ),
    v.forward(
        v.check(
            (s) => isValidCondition(s.broadHabitat, s.habitatType, s.condition),
            'The condition for this habitat is invalid',
        ),
        ['condition'],
    ),
    v.check(
        (s) =>
            !(
                (typeof s.habitatCreationInAdvance === 'string' || s.habitatCreationInAdvance > 0) &&
                (typeof s.habitatCreationDelay === 'string' || s.habitatCreationDelay > 0)
            ),
        'Cannot have both habitat creation in advance and delay in starting habitat creation',
    ),
    v.transform(enrichWithHabitatData),
    v.transform(enrichWithCreationData),
    v.transform(calculateFinalTimeToTargetCondition),
    v.transform(lookupFinalTimeToTargetMultiplier),
    v.transform(enrichWithDifficultyData),
    v.transform(enrichWithHabitatUnitsDelivered),
    v.transform(applyOnSiteHabitatCreationTiming),
);
export type OnSiteHabitatCreation = v.InferOutput<typeof onSiteHabitatCreationSchema>;
export type OnSiteHabitatCreationSchema = v.InferInput<typeof onSiteHabitatCreationSchema>;

export const onSiteHabitatCreationUncheckedSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        area: data.area.toNumber(),
        areaDecimal: data.area,
        habitatCreationInAdvance: data.habitatCreationInAdvance,
        habitatCreationInAdvanceDecimal:
            typeof data.habitatCreationInAdvance === 'number'
                ? toDecimal(data.habitatCreationInAdvance)
                : data.habitatCreationInAdvance,
        habitatCreationDelay: data.habitatCreationDelay,
        habitatCreationDelayDecimal:
            typeof data.habitatCreationDelay === 'number'
                ? toDecimal(data.habitatCreationDelay)
                : data.habitatCreationDelay,
    })),
    safeTransform(enrichWithHabitatData),
    safeTransform(enrichWithCreationData),
    safeTransform(calculateFinalTimeToTargetCondition),
    safeTransform(lookupFinalTimeToTargetMultiplier),
    safeTransform(enrichWithDifficultyData),
    safeTransform(enrichWithHabitatUnitsDelivered),
    safeTransform(applyOnSiteHabitatCreationTiming),
);

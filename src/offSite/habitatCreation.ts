import { type Decimal, toDecimal } from '../decimal';
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
import { spatialRiskCategorySchema } from '../spatialRisk';
import { habitatByBroadAndType, type Habitat } from '../habitats';
import { calculateDifficultyData, calculateStandardOrAdjustedTimeToTarget } from '../areaCreationCalculations';
import {
    calculateFinalTimeToTargetCondition as calculateFinalTimeToTargetConditionShared,
    lookupFinalTimeToTargetMultiplier,
} from '../areaTiming';
import { enrichWithSpatialRisk } from './spatialRisk';
import { calculateHabitatUnitsDelivered } from '../habitatCalc';
import { applyOffSiteHabitatCreationAvailability } from './habitatAvailability';
import type { AreaDistinctivenessScore, HabitatConditionScore } from '../areaCalculationTypes';

export {
    calculateAppliedDifficultyMultiplier,
    calculateDifficultyData,
    calculateDifficultyMultiplierApplied,
    calculateFinalDifficultyOfCreation,
    calculateStandardOrAdjustedTimeToTarget,
} from '../areaCreationCalculations';

const inputSchema = v.object({
    broadHabitat: broadHabitatSchema,
    habitatType: creationHabitatType,
    area: areaSchema,
    condition: conditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatCreationInAdvance: v.optional(yearsSchema, 0),
    habitatCreationDelay: v.optional(yearsSchema, 0),
    spatialRiskCategory: spatialRiskCategorySchema,
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
    baselineReferenceNumber: freeTextSchema,
});

/**
 * Calculates the final time to target condition and its corresponding multiplier based on:
 * - Standard time to target condition (from habitat temporal multipliers)
 * - Years of habitat creation in advance
 * - Years of delay in starting habitat creation
 *
 * Corresponds to formula in Excel cell S11 of sheet D-2
 */
const calculateFinalTimeToTargetCondition = <
    Data extends {
        timeToTargetCondition: number | '30+' | 'Not Possible ▲';
        habitatCreationInAdvance: number | '30+';
        habitatCreationDelay: number | '30+';
        distinctivenessScore: AreaDistinctivenessScore;
        _habitat: Habitat;
    },
>(
    data: Data,
) => {
    return calculateFinalTimeToTargetConditionShared({
        ...data,
        standardOrAdjustedTimeToTarget: calculateStandardOrAdjustedTimeToTarget(
            data.habitatCreationInAdvance === '30+' ? 30 : data.habitatCreationInAdvance,
            data.habitatCreationInAdvance,
            data.habitatCreationDelay === '30+' ? 30 : data.habitatCreationDelay,
            data.habitatCreationDelay,
            data.distinctivenessScore,
            data.timeToTargetCondition,
            data._habitat.temporalMultipliers.Poor,
        ),
        advance: data.habitatCreationInAdvance,
        advanceDecimal:
            typeof data.habitatCreationInAdvance === 'number'
                ? toDecimal(data.habitatCreationInAdvance)
                : data.habitatCreationInAdvance,
        delay: data.habitatCreationDelay,
        delayDecimal:
            typeof data.habitatCreationDelay === 'number'
                ? toDecimal(data.habitatCreationDelay)
                : data.habitatCreationDelay,
    });
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
 * Corresponds to columns U-X in Excel sheet D-2
 */
const enrichWithDifficultyData = <
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
 * Enriches data with spatial risk multiplier.
 *
 * Corresponds to column Z in Excel sheet D-2
 */
const enrichWithSpatialRiskData = enrichWithSpatialRisk;

/**
 * Calculates habitat units delivered for off-site habitat creation.
 *
 * Two calculations:
 * 1. habitatUnitsDeliveredWithSpatialRisk: Area × Distinctiveness Score × Condition Score ×
 *    Strategic Significance Multiplier × Final Time to Target Multiplier × Difficulty Multiplier ×
 *    Spatial Risk Multiplier
 * 2. habitatUnitsDelivered: Same as above but without Spatial Risk Multiplier
 *
 * If finalTimeToTargetMultiplier is undefined (e.g., "Not Possible ▲"), returns 0 units.
 *
 * Corresponds to columns AA and AB in Excel sheet D-2
 */
const enrichWithHabitatUnitsDelivered = <
    Data extends {
        area: number;
        areaDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: HabitatConditionScore | undefined;
        conditionScoreDecimal: Decimal | undefined;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        finalTimeToTargetMultiplier: number | undefined;
        difficultyMultiplierApplied: number;
        difficultyMultiplierAppliedDecimal: Decimal;
        spatialRiskMultiplier: number;
    },
>(
    data: Data,
) => {
    return { ...data, ...calculateHabitatUnitsDelivered(data) };
};

export const offSiteHabitatCreationSchema = v.pipe(
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
                (s.habitatCreationInAdvance === '30+' || s.habitatCreationInAdvance > 0) &&
                (s.habitatCreationDelay === '30+' || s.habitatCreationDelay > 0)
            ),
        'Cannot have both habitat creation in advance and delay in starting habitat creation',
    ),
    v.transform(enrichWithHabitatData),
    v.transform(enrichWithCreationData),
    v.transform(calculateFinalTimeToTargetCondition),
    v.transform(lookupFinalTimeToTargetMultiplier),
    v.transform(enrichWithDifficultyData),
    v.transform(enrichWithSpatialRiskData),
    v.transform(enrichWithHabitatUnitsDelivered),
    v.transform(applyOffSiteHabitatCreationAvailability),
);

export type OffSiteHabitatCreationSchema = v.InferInput<typeof offSiteHabitatCreationSchema>;
export type OffSiteHabitatCreation = v.InferOutput<typeof offSiteHabitatCreationSchema>;

export const offSiteHabitatCreationUncheckedSchema = v.pipe(
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
    safeTransform(enrichWithSpatialRiskData),
    safeTransform(enrichWithHabitatUnitsDelivered),
    safeTransform(applyOffSiteHabitatCreationAvailability),
);

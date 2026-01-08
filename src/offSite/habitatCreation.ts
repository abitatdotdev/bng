import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { creationHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { areaSchema, enrichWithCreationData, enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, yearsSchema } from '../schemaUtils';
import { spatialRiskCategorySchema } from '../spatialRisk';
import { habitatByBroadAndType } from '../habitats';
import { difficulty } from '../difficulty';
import { calculateFinalTimeToTargetValues as calculateFinalTimeToTargetValuesCommon, enrichWithSpatialRisk } from './common';

const inputSchema =
    v.object({
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
    })
type OutputSchema = v.InferOutput<typeof inputSchema>

/**
 * Calculates the final time to target condition and its corresponding multiplier based on:
 * - Standard time to target condition (from habitat temporal multipliers)
 * - Years of habitat creation in advance
 * - Years of delay in starting habitat creation
 *
 * Corresponds to formula in Excel cell S11 of sheet D-2
 */
const calculateFinalTimeToTargetValues = <Data extends {
    timeToTargetCondition: number | "30+" | "Not Possible ▲",
    habitatCreationInAdvance: number | "30+",
    habitatCreationDelay: number | "30+"
}>(data: Data) => {
    return calculateFinalTimeToTargetValuesCommon({
        ...data,
        advance: data.habitatCreationInAdvance,
        delay: data.habitatCreationDelay,
    });
}

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
const enrichWithDifficultyData = <Data extends {
    broadHabitat: string,
    habitatType: string,
    timeToTargetCondition: number | "30+" | "Not Possible ▲",
    habitatCreationInAdvance: number | "30+",
    finalTimeToTargetCondition: number | "30+" | "Not Possible ▲"
}>(data: Data) => {
    const habitat = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

    // Normalize habitatCreationInAdvance for comparisons
    const normalisedHabitatCreationInAdvance = typeof data.habitatCreationInAdvance === "string" ? 30 : data.habitatCreationInAdvance;

    // Standard difficulty of creation (column U)
    const standardDifficultyOfCreation = habitat.technicalDifficultyCreation;

    // Get the time to Poor condition to check if the threshold has been reached
    const timeToPoorCondition = habitat.temporalMultipliers['Poor'];

    // List of habitats that should not use enhancement difficulty
    const excludedHabitats = [
        "Traditional orchards",
        "Ornamental lake or pond",
        "Ponds (non-priority habitat)",
        "Ruderal/Ephemeral",
        "Tall forbs",
        "Developed land; sealed surface"
    ];

    // Determine if habitat has reached target condition (advance >= standard time)
    const hasReachedTargetCondition =
        normalisedHabitatCreationInAdvance > 0 &&
        data.finalTimeToTargetCondition === 0;

    // Determine if habitat creation started and Poor threshold reached
    const hasReachedPoorThreshold =
        normalisedHabitatCreationInAdvance > 0 &&
        timeToPoorCondition !== "Not Possible ▲" &&
        (timeToPoorCondition === 0 ||
            (typeof timeToPoorCondition === 'number' && normalisedHabitatCreationInAdvance >= timeToPoorCondition)) &&
        !hasReachedTargetCondition;

    // Applied difficulty multiplier (column V)
    let appliedDifficultyMultiplier: string;
    if (hasReachedTargetCondition) {
        appliedDifficultyMultiplier = "Low Difficulty - only applicable if all habitat created before losses ⚠";
    } else if (hasReachedPoorThreshold && !excludedHabitats.includes(data.habitatType)) {
        appliedDifficultyMultiplier = "Enhancement difficulty applied";
    } else {
        appliedDifficultyMultiplier = "Standard difficulty applied";
    }

    // Final difficulty of creation (column W)
    let finalDifficultyOfCreation: keyof typeof difficulty;
    if (appliedDifficultyMultiplier === "Low Difficulty - only applicable if all habitat created before losses ⚠") {
        finalDifficultyOfCreation = "Low";
    } else if (appliedDifficultyMultiplier === "Enhancement difficulty applied") {
        finalDifficultyOfCreation = habitat.technicalDifficultyEnhancement;
    } else {
        finalDifficultyOfCreation = standardDifficultyOfCreation;
    }

    // Difficulty multiplier applied (column X)
    const difficultyMultiplierApplied = difficulty[finalDifficultyOfCreation];

    return {
        ...data,
        standardDifficultyOfCreation,
        appliedDifficultyMultiplier,
        finalDifficultyOfCreation,
        difficultyMultiplierApplied
    };
}

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
const calculateHabitatUnitsDelivered = <Data extends {
    area: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
    finalTimeToTargetMultiplier: number | undefined,
    difficultyMultiplierApplied: number,
    spatialRiskMultiplier: number
}>(data: Data) => {
    const baseUnits =
        data.area *
        data.distinctivenessScore *
        data.conditionScore *
        data.strategicSignificanceMultiplier *
        (data.finalTimeToTargetMultiplier ?? 0) *
        data.difficultyMultiplierApplied;

    const habitatUnitsDeliveredWithSpatialRisk = baseUnits * data.spatialRiskMultiplier;
    const habitatUnitsDelivered = baseUnits;

    return {
        ...data,
        habitatUnitsDeliveredWithSpatialRisk,
        habitatUnitsDelivered
    };
}

export const offSiteHabitatCreationSchema = v.pipe(
    inputSchema,
    v.check(s => isValidHabitat(s.broadHabitat, s.habitatType), "The broad habitat and habitat type are incompatible"),
    v.check(s => isValidCondition(s.broadHabitat, s.habitatType, s.condition), "The condition for this habitat is invalid"),
    v.check(
        s => !(
            (typeof s.habitatCreationInAdvance === "string" || s.habitatCreationInAdvance > 0)
            && (typeof s.habitatCreationDelay === "string" || s.habitatCreationDelay > 0)
        ),
        "Cannot have both habitat creation in advance and delay in starting habitat creation"
    ),
    v.transform(enrichWithHabitatData),
    v.transform(enrichWithCreationData),
    v.transform(calculateFinalTimeToTargetValues),
    v.transform(enrichWithDifficultyData),
    v.transform(enrichWithSpatialRiskData),
    v.transform(calculateHabitatUnitsDelivered)
)
export type OffSiteHabitatCreationSchema = v.InferInput<typeof offSiteHabitatCreationSchema>


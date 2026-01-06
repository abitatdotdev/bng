import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { creationHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { areaSchema, enrichWithCreationData, enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, yearsSchema } from '../schemaUtils';
import { getTemporalMultiplier, type TemporalMultiplierKey } from '../temporalMultipliers';
import { habitatByBroadAndType } from '../habitats';
import { difficulty } from '../difficulty';

const inputSchema =
    v.object({
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
    })
type OutputSchema = v.InferOutput<typeof inputSchema>

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
 * Also looks up the temporal multiplier for the calculated final time.
 *
 * Corresponds to formula in Excel cell S12 of sheet A-2
 */
const calculateFinalTimeToTargetValues = <Data extends {
    timeToTargetCondition: number | "30+" | "Not Possible ▲",
    habitatCreationInAdvance: number | "30+",
    habitatCreationDelay: number | "30+"
}>(data: Data) => {
    const { timeToTargetCondition, habitatCreationInAdvance, habitatCreationDelay } = data;

    let finalTimeToTargetCondition: number | "30+" | "Not Possible ▲";
    const normalisedHabitatCreationInAdvance = typeof habitatCreationInAdvance === "string" ? 30 : habitatCreationInAdvance;
    const normalisedHabitatCreationDelay = typeof habitatCreationDelay === "string" ? 30 : habitatCreationDelay;

    // If standard time is "Not Possible", final time is also "Not Possible"
    if (timeToTargetCondition === "Not Possible ▲") {
        finalTimeToTargetCondition = "Not Possible ▲";
    }
    // Handle "30+" standard time
    else if (timeToTargetCondition === "30+") {
        if (habitatCreationInAdvance === 0) {
            finalTimeToTargetCondition = "30+";
        } else {
            // 30 - advance (capped at 0)
            finalTimeToTargetCondition = Math.max(0, 30 - normalisedHabitatCreationInAdvance);
        }
    }
    // If advance >= standard time, final time is 0
    else if (normalisedHabitatCreationInAdvance >= timeToTargetCondition) {
        finalTimeToTargetCondition = 0;
    }
    // Calculate: standardTime - advance + delay
    else {
        const result = timeToTargetCondition - normalisedHabitatCreationInAdvance + normalisedHabitatCreationDelay;

        // Cap at "30+" if result > 30
        if (result > 30) {
            finalTimeToTargetCondition = "30+";
        } else {
            // Ensure non-negative result
            finalTimeToTargetCondition = Math.max(0, result);
        }
    }

    // Look up the temporal multiplier for the final time
    const multiplierKey = String(finalTimeToTargetCondition) as TemporalMultiplierKey;
    const multiplierResult = getTemporalMultiplier(multiplierKey);

    // Convert 'N/A' to undefined for calculations, keep numeric values
    const finalTimeToTargetMultiplier = multiplierResult === 'N/A' ? undefined : multiplierResult;

    return {
        ...data,
        finalTimeToTargetCondition,
        finalTimeToTargetMultiplier
    };
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
 * Corresponds to columns U-X in Excel sheet A-2
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
 * Calculates habitat units delivered for on-site habitat creation.
 *
 * Formula: Area × Distinctiveness Score × Condition Score × Strategic Significance Multiplier
 *          × Final Time to Target Multiplier × Difficulty Multiplier
 *
 * If finalTimeToTargetMultiplier is undefined (e.g., "Not Possible ▲"), returns 0 units.
 *
 * Corresponds to column Y in Excel sheet A-2
 */
const calculateHabitatUnitsDelivered = <Data extends {
    area: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
    finalTimeToTargetMultiplier: number | undefined,
    difficultyMultiplierApplied: number
}>(data: Data) => {
    const habitatUnitsDelivered =
        data.area *
        data.distinctivenessScore *
        data.conditionScore *
        data.strategicSignificanceMultiplier *
        (data.finalTimeToTargetMultiplier ?? 0) *
        data.difficultyMultiplierApplied;

    return {
        ...data,
        habitatUnitsDelivered
    };
}

export const onSiteHabitatCreationSchema = v.pipe(
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
    v.transform(calculateHabitatUnitsDelivered)
)
export type OnSiteHabitatCreationSchema = v.InferInput<typeof onSiteHabitatCreationSchema>


import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { creationHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { areaSchema, enrichWithCreationData, enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, yearsSchema } from '../schemaUtils';

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
 * Calculates the final time to target condition based on:
 * - Standard time to target condition (from habitat temporal multipliers)
 * - Years of habitat creation in advance
 * - Years of delay in starting habitat creation
 *
 * Formula: finalTime = standardTime - advance + delay
 * - Capped at "30+" if result > 30
 * - Returns 0 if advance >= standardTime
 * - Returns "Not Possible" if standardTime is "Not Possible ▲"
 *
 * Corresponds to formula in Excel cell S12 of sheet A-2
 */
const calculateFinalTimeToTargetCondition = <Data extends {
    timeToTargetCondition: number | "30+" | "Not Possible ▲",
    habitatCreationInAdvance: number,
    habitatCreationDelay: number
}>(data: Data) => {
    const { timeToTargetCondition, habitatCreationInAdvance, habitatCreationDelay } = data;

    // If standard time is "Not Possible", final time is also "Not Possible"
    if (timeToTargetCondition === "Not Possible ▲") {
        return {
            ...data,
            finalTimeToTargetCondition: "Not Possible ▲" as const
        };
    }

    // Handle "30+" standard time
    if (timeToTargetCondition === "30+") {
        if (habitatCreationInAdvance === 0) {
            return {
                ...data,
                finalTimeToTargetCondition: "30+" as const
            };
        }
        // 30 - advance (capped at 0)
        const result = Math.max(0, 30 - habitatCreationInAdvance);
        return {
            ...data,
            finalTimeToTargetCondition: result
        };
    }

    // If advance >= standard time, final time is 0
    if (habitatCreationInAdvance >= timeToTargetCondition) {
        return {
            ...data,
            finalTimeToTargetCondition: 0
        };
    }

    // Calculate: standardTime - advance + delay
    const result = timeToTargetCondition - habitatCreationInAdvance + habitatCreationDelay;

    // Cap at "30+" if result > 30
    if (result > 30) {
        return {
            ...data,
            finalTimeToTargetCondition: "30+" as const
        };
    }

    // Ensure non-negative result
    return {
        ...data,
        finalTimeToTargetCondition: Math.max(0, result)
    };
}

export const onSiteHabitatCreationSchema = v.pipe(
    inputSchema,
    v.check(s => isValidHabitat(s.broadHabitat, s.habitatType), "The broad habitat and habitat type are incompatible"),
    v.check(s => isValidCondition(s.broadHabitat, s.habitatType, s.condition), "The condition for this habitat is invalid"),
    v.check(
        s => !(s.habitatCreationInAdvance > 0 && s.habitatCreationDelay > 0),
        "Cannot have both habitat creation in advance and delay in starting habitat creation"
    ),
    v.transform(enrichWithHabitatData),
    v.transform(enrichWithCreationData),
    v.transform(calculateFinalTimeToTargetCondition)
)
export type OnSiteHabitatCreationSchema = v.InferInput<typeof onSiteHabitatCreationSchema>


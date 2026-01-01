import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { habitatTypeSchema } from '../habitatTypes';
import { distinctivenessSchema } from '../distinctivenessCategories';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { habitatByBroadAndType } from '../habitats';
import { areaSchema, freeTextSchema } from '../schemaUtils';

const yearsSchema = v.pipe(
    v.number(),
    v.integer(),
    v.toMinValue(0),
    v.toMaxValue(30),
)

const inputSchema =
    v.object({
        broadHabitat: broadHabitatSchema,
        habitatType: habitatTypeSchema,
        area: areaSchema,
        distinctiveness: distinctivenessSchema,
        condition: conditionSchema,
        strategicSignificance: strategicSignificanceSchema,
        habitatCreationInAdvance: v.optional(yearsSchema, 0),
        habitatCreationDelay: v.optional(yearsSchema, 0),
        userComments: freeTextSchema,
        planningAuthorityComments: freeTextSchema,
        habitatReferenceNumber: freeTextSchema,
    })
type OutputSchema = v.InferOutput<typeof inputSchema>

export const onSiteHabitatCreationSchema = v.pipe(
    inputSchema,
    v.check(isValidHabitat, "The broad habitat and habitat type are incompatible"),
    v.check(isValidCondition, "The condition for this habitat is invalid"),
)
export type OnSiteHabitatCreationSchema = v.InferInput<typeof onSiteHabitatCreationSchema>

function isValidHabitat({ broadHabitat, habitatType }: OutputSchema): boolean {
    return !!habitatByBroadAndType(broadHabitat, habitatType);
}

function isValidCondition({ broadHabitat, habitatType, condition }: OutputSchema): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    return Object.keys(habitat.conditions).includes(condition);
}

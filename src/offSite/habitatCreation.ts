import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { creationHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { habitatByBroadAndType } from '../habitats';
import { areaSchema, freeTextSchema, yearsSchema } from '../schemaUtils';
import { spatialRiskCategorySchema } from '../spatialRisk';

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

export const offSiteHabitatCreationSchema = v.pipe(
    inputSchema,
    v.check(isValidHabitat, "The broad habitat and habitat type are incompatible"),
    v.check(isValidCondition, "The condition for this habitat is invalid"),
)
export type OffSiteHabitatCreationSchema = v.InferInput<typeof offSiteHabitatCreationSchema>

function isValidHabitat({ broadHabitat, habitatType }: OutputSchema): boolean {
    return !!habitatByBroadAndType(broadHabitat, habitatType);
}

function isValidCondition({ broadHabitat, habitatType, condition }: OutputSchema): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    return Object.keys(habitat.conditions).includes(condition);
}

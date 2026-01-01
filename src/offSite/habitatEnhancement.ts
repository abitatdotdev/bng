import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { habitatTypeSchema } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { habitatByBroadAndType } from '../habitats';
import { freeTextSchema, yearsSchema } from '../schemaUtils';
import { offSiteHabitatBaselineSchema } from './habitatBaseline';

const inputSchema = v.object({
    baseline: offSiteHabitatBaselineSchema,
    broadHabitat: broadHabitatSchema,
    habitatType: habitatTypeSchema,
    condition: conditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatEnhancedInAdvance: v.optional(yearsSchema, 0),
    habitatEnhancedDelay: v.optional(yearsSchema, 0),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
})
type OutputSchema = v.InferOutput<typeof inputSchema>

export const offSiteHabitatEnhancementSchema = v.pipe(
    inputSchema,
    v.check(isValidHabitat, "The broad habitat and habitat type are incompatible"),
    v.check(isValidCondition, "The condition for this habitat is invalid"),
)
export type OffSiteHabitatEnhancementSchema = v.InferInput<typeof offSiteHabitatEnhancementSchema>

function isValidHabitat({ broadHabitat, habitatType }: OutputSchema): boolean {
    return !!habitatByBroadAndType(broadHabitat, habitatType);
}

function isValidCondition({ broadHabitat, habitatType, condition }: OutputSchema): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    return Object.keys(habitat.conditions).includes(condition);
}

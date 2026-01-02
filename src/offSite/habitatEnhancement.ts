import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { enhancedHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, yearsSchema } from '../schemaUtils';
import { offSiteHabitatBaselineSchema } from './habitatBaseline';

const inputSchema = v.object({
    baseline: offSiteHabitatBaselineSchema,
    broadHabitat: broadHabitatSchema,
    habitatType: enhancedHabitatType,
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
    v.check(s => isValidHabitat(s.broadHabitat, s.habitatType), "The broad habitat and habitat type are incompatible"),
    v.check(s => isValidCondition(s.broadHabitat, s.habitatType, s.condition), "The condition for this habitat is invalid"),
    v.transform(data => enrichWithHabitatData(data.baseline)),
    v.transform(enrichWithHabitatData),
)
export type OffSiteHabitatEnhancementSchema = v.InferInput<typeof offSiteHabitatEnhancementSchema>


import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { habitatTypeSchema } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { habitatByBroadAndType } from '../habitats';
import { yearsSchema } from '../schemaUtils';
import { onSiteHabitatBaselineSchema } from './habitatBaseline';

const inputSchema = v.object({
    baseline: onSiteHabitatBaselineSchema,
    broadHabitat: broadHabitatSchema,
    habitatType: habitatTypeSchema,
    condition: conditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatEnhancedInAdvance: v.optional(yearsSchema, 0),
    habitatEnhancedDelay: v.optional(yearsSchema, 0),
})
type OutputSchema = v.InferOutput<typeof inputSchema>

export const onSiteHabitatEnhancementSchema = v.pipe(
    inputSchema,
    v.check(isValidHabitat, "The broad habitat and habitat type are incompatible"),
    v.check(isValidCondition, "The condition for this habitat is invalid"),
)
export type OnSiteHabitatEnhancementSchema = v.InferInput<typeof onSiteHabitatEnhancementSchema>

function isValidHabitat({ broadHabitat, habitatType }: OutputSchema): boolean {
    return !!habitatByBroadAndType(broadHabitat, habitatType);
}

function isValidCondition({ broadHabitat, habitatType, condition }: OutputSchema): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    return Object.keys(habitat.conditions).includes(condition);
}

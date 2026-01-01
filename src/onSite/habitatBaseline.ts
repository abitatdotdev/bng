import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { habitatTypeSchema } from '../habitatTypes';
import { distinctivenessSchema } from '../distinctivenessCategories';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { habitatByBroadAndType } from '../habitats';

const areaSchema = v.pipe(
    v.number(),
    v.toMinValue(0),
)

const freeTextSchema = v.optional(v.string());

const inputSchema =
    v.object({
        broadHabitat: broadHabitatSchema,
        habitatType: habitatTypeSchema,
        irreplaceableHabitat: v.boolean(),
        area: areaSchema,
        distinctiveness: distinctivenessSchema,
        condition: conditionSchema,
        strategicSignificance: strategicSignificanceSchema,
        areaRetained: areaSchema,
        areaEnhanced: areaSchema,
        bespokeCompensationAgreed: freeTextSchema,
        userComments: freeTextSchema,
        planningAuthorityComments: freeTextSchema,
        habitatReferenceNumber: freeTextSchema,
    })
type InputSchema = v.InferOutput<typeof inputSchema>

export const onSiteHabitatBaselineSchema = v.pipe(
    inputSchema,
    v.check(isValidHabitat, "The broad habitat and habitat type are incompatible"),
    v.check(isValidIrreplaceable, "This habitat cannot be irreplaceable"),
    v.check(isValidCondition, "The condition for this habitat is invalid"),
)
export type OnSiteHabitatBaselineSchema = v.InferOutput<typeof onSiteHabitatBaselineSchema>

function isValidHabitat({ broadHabitat, habitatType }: InputSchema): boolean {
    return !!habitatByBroadAndType(broadHabitat, habitatType);
}

function isValidIrreplaceable({ broadHabitat, habitatType, irreplaceableHabitat }: InputSchema): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    if (!habitat.irreplaceable) return true
    return irreplaceableHabitat === habitat.irreplaceable;
}

function isValidCondition({ broadHabitat, habitatType, condition }: InputSchema): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    return Object.keys(habitat.conditions).includes(condition);
}

import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { baselineHabitatType } from '../habitatTypes';
import { distinctivenessSchema } from '../distinctivenessCategories';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { habitatByBroadAndType } from '../habitats';
import { areaSchema, freeTextSchema } from '../schemaUtils';
import { spatialRiskCategorySchema } from '../spatialRisk';

const inputSchema =
    v.object({
        broadHabitat: broadHabitatSchema,
        habitatType: baselineHabitatType,
        irreplaceableHabitat: v.boolean(),
        area: areaSchema,
        distinctiveness: distinctivenessSchema,
        condition: conditionSchema,
        strategicSignificance: strategicSignificanceSchema,
        spatialRiskCategory: spatialRiskCategorySchema,
        areaRetained: areaSchema,
        areaEnhanced: areaSchema,
        bespokeCompensationAgreed: freeTextSchema,
        userComments: freeTextSchema,
        planningAuthorityComments: freeTextSchema,
        habitatReferenceNumber: freeTextSchema,
        offSiteReferenceNumber: freeTextSchema,
    })
type OutputSchema = v.InferOutput<typeof inputSchema>

export const offSiteHabitatBaselineSchema = v.pipe(
    inputSchema,
    v.check(isValidHabitat, "The broad habitat and habitat type are incompatible"),
    v.check(isValidIrreplaceable, "This habitat cannot be irreplaceable"),
    v.check(isValidCondition, "The condition for this habitat is invalid"),
)
export type OffSiteHabitatBaselineSchema = v.InferInput<typeof offSiteHabitatBaselineSchema>

function isValidHabitat({ broadHabitat, habitatType }: OutputSchema): boolean {
    return !!habitatByBroadAndType(broadHabitat, habitatType);
}

function isValidIrreplaceable({ broadHabitat, habitatType, irreplaceableHabitat }: OutputSchema): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    if (!habitat.irreplaceable) return true
    return irreplaceableHabitat === habitat.irreplaceable;
}

function isValidCondition({ broadHabitat, habitatType, condition }: OutputSchema): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    return Object.keys(habitat.conditions).includes(condition);
}


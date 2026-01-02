import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { baselineHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { getStrategicSignificance, strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { habitatByBroadAndType } from '../habitats';
import { areaSchema, freeTextSchema } from '../schemaUtils';

const inputSchema =
    v.object({
        broadHabitat: broadHabitatSchema,
        habitatType: baselineHabitatType,
        irreplaceableHabitat: v.boolean(),
        area: areaSchema,
        condition: conditionSchema,
        strategicSignificance: strategicSignificanceSchema,
        areaRetained: areaSchema,
        areaEnhanced: areaSchema,
        bespokeCompensationAgreed: freeTextSchema,
        userComments: freeTextSchema,
        planningAuthorityComments: freeTextSchema,
        habitatReferenceNumber: freeTextSchema,
    })
type OutputSchema = v.InferOutput<typeof inputSchema>

export const onSiteHabitatBaselineSchema = v.pipe(
    inputSchema,
    v.check(isValidHabitat, "The broad habitat and habitat type are incompatible"),
    v.check(isValidIrreplaceable, "This habitat cannot be irreplaceable"),
    v.check(isValidCondition, "The condition for this habitat is invalid"),
    v.transform(data => {
        const habitat = habitatByBroadAndType(data.broadHabitat, data.habitatType)!;

        return {
            ...data,
            distinctiveness: habitat.distinctivenessCategory,
            distinctivenessScore: habitat.distinctivenessScore,

            // @ts-ignore-line This is covered by the isValidCondition check above
            conditionScore: habitat.conditions[data.condition],

            strategicSignificanceCategory: getStrategicSignificance(data.strategicSignificance).significance,
            strategicSignificanceMultiplier: getStrategicSignificance(data.strategicSignificance).multiplier,
        }
    }),
)
export type OnSiteHabitatBaselineSchema = v.InferInput<typeof onSiteHabitatBaselineSchema>
export type OnSiteHabitatBaseline = v.InferOutput<typeof onSiteHabitatBaselineSchema>

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

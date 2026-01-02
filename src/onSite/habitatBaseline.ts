import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { baselineHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { getStrategicSignificance, strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { habitatByBroadAndType } from '../habitats';
import { areaSchema, freeTextSchema, isValidCondition, isValidHabitat, isValidIrreplaceable } from '../schemaUtils';

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
    v.check(s => isValidHabitat(s.broadHabitat, s.habitatType), "The broad habitat and habitat type are incompatible"),
    v.check(s => isValidIrreplaceable(s.broadHabitat, s.habitatType, s.irreplaceableHabitat), "This habitat cannot be irreplaceable"),
    v.check(s => isValidCondition(s.broadHabitat, s.habitatType, s.condition), "The condition for this habitat is invalid"),
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


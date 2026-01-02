import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { baselineHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { addTotalHabitatUnits as enrichWithTotalHabitatUnits, areaSchema, enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, isValidIrreplaceable } from '../schemaUtils';
import { bespokeCompensationSchema } from '../bespokeCompensation';

const inputSchema =
    v.object({
        broadHabitat: broadHabitatSchema,
        habitatType: baselineHabitatType,
        irreplaceableHabitat: v.boolean(),
        area: areaSchema,
        condition: conditionSchema,
        strategicSignificance: strategicSignificanceSchema,
        areaRetained: v.optional(areaSchema, 0),
        areaEnhanced: v.optional(areaSchema, 0),
        bespokeCompensationAgreed: v.optional(bespokeCompensationSchema, "No"),
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
    v.transform(enrichWithHabitatData),
    v.transform(enrichWithBaselineUnitsData),
    // Checks from within the total habitat units cell (Q)
    // See https://opncd.ai/share/5IiLnaI4 for translation
    v.check(s => !(s.broadHabitat === "Individual trees" && s.areaEnhanced > 0 && s.irreplaceableHabitat), "You cannot enhance irreplaceable individual trees ▲"),
    v.check(s => !(
        s.irreplaceableHabitat
        && (s.areaRetained + s.areaEnhanced) < s.area
        && s.bespokeCompensationAgreed === "No"
    ), "Any loss unacceptable"),
    v.check(s => !(
        s.requiredAction === "Bespoke compensation likely to be required"
        && !(s.areaRetained > 0 || s.areaEnhanced > 0)
        && s.bespokeCompensationAgreed === "No"
    ), "Any loss unacceptable"),
    v.transform(enrichWithTotalHabitatUnits),
    // Checks from within the units lost cell (X)
    v.check(s => s.area - s.areaRetained - s.areaEnhanced >= 0, "Area sums do not add up"),
    v.check(s => !(s.bespokeCompensationAgreed === "Pending" && (s.requiredAction === "Same habitat required – bespoke compensation option ⚠" || s.requiredAction === "Bespoke compensation likely to be required")), "Bespoke compensation must be agreed"),
    v.check(s => s.requiredAction !== "Bespoke compensation likely to be required", "Any loss unacceptable"),
    v.transform(enrichWithUnitsLost),
)

export type OnSiteHabitatBaselineSchema = v.InferInput<typeof onSiteHabitatBaselineSchema>
export type OnSiteHabitatBaseline = v.InferOutput<typeof onSiteHabitatBaselineSchema>

export function enrichWithBaselineUnitsData<Data extends {
    irreplaceableHabitat: boolean; area: number; areaRetained: number; areaEnhanced: number; distinctivenessScore: number; conditionScore: number; strategicSignificanceMultiplier: number;
}>(data: Data) {
    const baselineUnitsRetained = data.areaRetained
        * data.distinctivenessScore
        * data.conditionScore
        * data.strategicSignificanceMultiplier;
    const baselineUnitsEnhanced = data.areaEnhanced
        * data.distinctivenessScore
        * data.conditionScore
        * data.strategicSignificanceMultiplier;
    const areaHabitatLost = data.area - data.areaRetained - data.areaEnhanced;
    return {
        ...data,
        baselineUnitsRetained: data.irreplaceableHabitat
            ? 0
            : baselineUnitsRetained,
        baselineUnitsEnhanced,
        areaHabitatLost,
    }
}

// See https://opncd.ai/share/4Z0sTzAw for translation
export function enrichWithUnitsLost<Data extends {
    areaHabitatLost: number,
    totalHabitatUnits: number,
    baselineUnitsRetained: number,
    baselineUnitsEnhanced: number,
}>(data: Data) {
    const unitsLost = data.areaHabitatLost === 0 ? 0 : data.totalHabitatUnits - data.baselineUnitsRetained - data.baselineUnitsEnhanced;
    return {
        ...data,
        unitsLost,
    };
}

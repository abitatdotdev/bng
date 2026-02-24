import * as v from 'valibot';
import { Decimal } from '../decimal';
import { broadHabitatSchema } from '../broadHabitats';
import { baselineHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { addTotalHabitatUnits as enrichWithTotalHabitatUnits, areaSchema, enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, isValidIrreplaceable } from '../schemaUtils';
import { bespokeCompensationSchema, type BespokeCompensation } from '../bespokeCompensation';
import type { SuggestedTradingActions } from '../distinctivenessCategories';

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
        && new Decimal(s.areaRetained).plus(s.areaEnhanced).lessThan(s.area)
        && s.bespokeCompensationAgreed === "No"
    ), "Any loss unacceptable"),
    v.check(s => !(
        s.requiredAction === "Bespoke compensation likely to be required"
        && !(s.areaRetained > 0 || s.areaEnhanced > 0)
        && s.bespokeCompensationAgreed === "No"
    ), "Any loss unacceptable"),
    v.transform(enrichWithTotalHabitatUnits),
    // Checks from within the units lost cell (X)
    // See https://opncd.ai/share/4Z0sTzAw for translation
    v.check(s => new Decimal(s.area).minus(s.areaRetained).minus(s.areaEnhanced).greaterThanOrEqualTo(0), "Area sums do not add up"),
    v.transform(enrichWithUnitsLost),
    v.transform(enrichWithVhdhBespokeCompensationUnits),
)

export type OnSiteHabitatBaselineSchema = v.InferInput<typeof onSiteHabitatBaselineSchema>
export type OnSiteHabitatBaseline = v.InferOutput<typeof onSiteHabitatBaselineSchema>

export function enrichWithBaselineUnitsData<Data extends {
    irreplaceableHabitat: boolean; area: number; areaRetained: number; areaEnhanced: number; distinctivenessScore: number; conditionScore: number; strategicSignificanceMultiplier: number;
}>(data: Data) {
    const baselineUnitsRetained = new Decimal(data.areaRetained)
        .mul(data.distinctivenessScore)
        .mul(data.conditionScore)
        .mul(data.strategicSignificanceMultiplier)
        .toNumber();
    const baselineUnitsEnhanced = new Decimal(data.areaEnhanced)
        .mul(data.distinctivenessScore)
        .mul(data.conditionScore)
        .mul(data.strategicSignificanceMultiplier)
        .toNumber();
    const areaHabitatLost = new Decimal(data.area)
        .minus(data.areaRetained)
        .minus(data.areaEnhanced)
        .toNumber();
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
    const unitsLost = data.areaHabitatLost === 0 ? 0 : new Decimal(data.totalHabitatUnits)
        .minus(data.baselineUnitsRetained)
        .minus(data.baselineUnitsEnhanced)
        .toNumber();
    return {
        ...data,
        unitsLost,
    };
}

/*
 * Calculates hidden cell AT, which is used later in the headline results
 */
export function enrichWithVhdhBespokeCompensationUnits<Data extends {
    bespokeCompensationAgreed: BespokeCompensation,
    requiredAction: SuggestedTradingActions,
    totalHabitatUnits: number,
    baselineUnitsRetained: number,
    baselineUnitsEnhanced: number,
}>(data: Data) {
    const vhdhBespokeCompensationUnits =
        (
            data.bespokeCompensationAgreed === "Yes"
            || data.bespokeCompensationAgreed === "Pending"
        ) && data.requiredAction === "Same habitat required – bespoke compensation option ⚠"
            ? new Decimal(data.totalHabitatUnits)
                .minus(data.baselineUnitsRetained)
                .minus(data.baselineUnitsEnhanced)
                .toNumber()
            : 0;

    return {
        ...data,
        vhdhBespokeCompensationUnits,
    }
}

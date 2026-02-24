import * as v from 'valibot';
import { Decimal } from '../decimal';
import { broadHabitatSchema } from '../broadHabitats';
import { baselineHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { areaSchema, enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, isValidIrreplaceable } from '../schemaUtils';
import { spatialRiskCategorySchema } from '../spatialRisk';
import { bespokeCompensationSchema, type BespokeCompensation } from '../bespokeCompensation';
import { enrichWithSpatialRisk as enrichWithSpatialRiskMultiplier } from './common';
import type { SuggestedTradingActions } from '../distinctivenessCategories';

const inputSchema =
    v.object({
        broadHabitat: broadHabitatSchema,
        habitatType: baselineHabitatType,
        irreplaceableHabitat: v.boolean(),
        area: areaSchema,
        condition: conditionSchema,
        strategicSignificance: strategicSignificanceSchema,
        spatialRiskCategory: spatialRiskCategorySchema,
        areaRetained: v.optional(areaSchema, 0),
        areaEnhanced: v.optional(areaSchema, 0),
        bespokeCompensationAgreed: v.optional(bespokeCompensationSchema, "No"),
        userComments: freeTextSchema,
        planningAuthorityComments: freeTextSchema,
        habitatReferenceNumber: freeTextSchema,
        offSiteReferenceNumber: freeTextSchema,
    })

export const offSiteHabitatBaselineSchema = v.pipe(
    inputSchema,
    v.check(s => isValidHabitat(s.broadHabitat, s.habitatType), "The broad habitat and habitat type are incompatible"),
    v.check(s => isValidIrreplaceable(s.broadHabitat, s.habitatType, s.irreplaceableHabitat), "This habitat cannot be irreplaceable"),
    v.check(s => isValidCondition(s.broadHabitat, s.habitatType, s.condition), "The condition for this habitat is invalid"),
    v.transform(enrichWithHabitatData),
    v.transform(enrichWithSpatialRiskMultiplier),
    v.transform(enrichWithBaselineUnitsData),
    v.transform(enrichWithTotalHabitatUnitsSRM),
    // Initial validation checks
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
    v.check(s => !(s.broadHabitat === "Individual trees" && s.areaEnhanced > 0 && s.irreplaceableHabitat), "Error - you cannot enhance irreplaceable individual trees ▲"),
    v.check(s => !(s.spatialRiskCategory && !s.offSiteReferenceNumber), "Off-site reference required ▲"),
    v.transform(enrichWithTotalHabitatUnits),
    // Checks from within the units lost cell (AA)
    v.check(s => new Decimal(s.area).minus(s.areaRetained).minus(s.areaEnhanced).greaterThanOrEqualTo(0), "Error in Areas ▲"),
    v.transform(enrichWithUnitsLost),
    v.transform(enrichWithVhdhBespokeCompensationUnits),
    v.transform(enrichWithBaselineUnitsRetainedSRM),
)
export type OffSiteHabitatBaselineSchema = v.InferInput<typeof offSiteHabitatBaselineSchema>
export type OffSiteHabitatBaseline = v.InferOutput<typeof offSiteHabitatBaselineSchema>

// Enrich with baseline units data (X, Y, Z columns)
export function enrichWithBaselineUnitsData<Data extends {
    irreplaceableHabitat: boolean;
    area: number;
    areaRetained: number;
    areaEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
    broadHabitat: string;
}>(data: Data) {
    const baselineUnitsRetained = data.irreplaceableHabitat
        ? 0
        : new Decimal(data.areaRetained)
            .mul(data.distinctivenessScore)
            .mul(data.conditionScore)
            .mul(data.strategicSignificanceMultiplier)
            .toNumber();

    const baselineUnitsEnhanced = (data.broadHabitat === "Individual trees" && data.areaEnhanced > 0 && data.irreplaceableHabitat)
        ? 0
        : new Decimal(data.areaEnhanced)
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
        baselineUnitsRetained,
        baselineUnitsEnhanced,
        areaHabitatLost,
    };
}

// Enrich with total habitat units (SRM) - Q column
export function enrichWithTotalHabitatUnitsSRM<Data extends {
    requiredAction: string;
    area: number;
    areaRetained: number;
    areaEnhanced: number;
    baselineUnitsRetained: number;
    baselineUnitsEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
    spatialRiskMultiplier: number;
}>(data: Data) {
    const bespokeRequired = data.requiredAction === "Bespoke compensation likely to be required";
    const hasRetention = data.areaRetained > 0;
    const hasEnhancement = data.areaEnhanced > 0;
    const hasBiodiversityGain = hasRetention || hasEnhancement;

    let totalHabitatUnitsSRM: number = 0;

    if (bespokeRequired && !hasBiodiversityGain) {
        totalHabitatUnitsSRM = new Decimal(data.area).mul(data.spatialRiskMultiplier).toNumber();
    } else if (bespokeRequired && hasBiodiversityGain) {
        totalHabitatUnitsSRM = new Decimal(data.baselineUnitsRetained)
            .plus(data.baselineUnitsEnhanced)
            .mul(data.spatialRiskMultiplier)
            .toNumber();
    } else {
        totalHabitatUnitsSRM = new Decimal(data.area)
            .mul(data.distinctivenessScore)
            .mul(data.conditionScore)
            .mul(data.strategicSignificanceMultiplier)
            .mul(data.spatialRiskMultiplier)
            .toNumber();
    }

    return {
        ...data,
        totalHabitatUnitsSRM,
    };
}

// Enrich with total habitat units - T column
export function enrichWithTotalHabitatUnits<Data extends {
    irreplaceableHabitat: boolean;
    area: number;
    areaRetained: number;
    areaEnhanced: number;
    bespokeCompensationAgreed: string;
    baselineUnitsRetained: number;
    baselineUnitsEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
    requiredAction: string;
    areaHabitatLost: number;
}>(data: Data) {
    const bespokeRequired = data.requiredAction === "Bespoke compensation likely to be required";
    const hasRetention = data.areaRetained > 0;
    const hasEnhancement = data.areaEnhanced > 0;
    const hasBiodiversityGain = hasRetention || hasEnhancement;

    let totalHabitatUnits: number = 0;

    if (data.irreplaceableHabitat) {
        totalHabitatUnits = new Decimal(data.areaRetained)
            .plus(data.areaEnhanced)
            .mul(data.distinctivenessScore)
            .mul(data.conditionScore)
            .mul(data.strategicSignificanceMultiplier)
            .toNumber();
    } else if (bespokeRequired && !hasBiodiversityGain && data.bespokeCompensationAgreed === "Yes") {
        totalHabitatUnits = 0;
    } else if (bespokeRequired && hasBiodiversityGain) {
        totalHabitatUnits = new Decimal(data.baselineUnitsRetained).plus(data.baselineUnitsEnhanced).toNumber();
    } else {
        totalHabitatUnits = new Decimal(data.area)
            .mul(data.distinctivenessScore)
            .mul(data.conditionScore)
            .mul(data.strategicSignificanceMultiplier)
            .toNumber();
    }

    return {
        ...data,
        totalHabitatUnits,
    };
}

// Enrich with units lost - AA column
export function enrichWithUnitsLost<Data extends {
    areaHabitatLost: number;
    totalHabitatUnits: number;
    baselineUnitsRetained: number;
    baselineUnitsEnhanced: number;
    bespokeCompensationAgreed: string;
    requiredAction: string;
}>(data: Data) {
    let unitsLost: number = 0;

    if (data.areaHabitatLost === 0) {
        unitsLost = 0;
    } else if (
        (data.requiredAction === "Same habitat required – bespoke compensation option ⚠" ||
            data.requiredAction === "Bespoke compensation likely to be required") &&
        data.bespokeCompensationAgreed === "Yes"
    ) {
        unitsLost = 0;
    } else {
        unitsLost = new Decimal(data.totalHabitatUnits)
            .minus(data.baselineUnitsRetained)
            .minus(data.baselineUnitsEnhanced)
            .toNumber();
    }

    return {
        ...data,
        unitsLost,
    };
}

/*
 * Calculates hidden cell AS, which is used later in the headline results
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

/*
 * Calculates hidden cell AY, which is used later in headline SRM results
 */
export function enrichWithBaselineUnitsRetainedSRM<Data extends {
    irreplaceableHabitat: boolean,
    areaRetained: number,
    distinctivenessScore: number,
    conditionScore: number,
    vhdhBespokeCompensationUnits: number,
    strategicSignificanceMultiplier: number,
    spatialRiskMultiplier: number,
}>(data: Data) {
    if (data.irreplaceableHabitat) return { ...data, baselineUnitsRetainedWithSRM: 0 };

    const baselineUnitsRetainedWithSRM =
        new Decimal(data.areaRetained)
            .mul(data.distinctivenessScore)
            .mul(data.conditionScore)
            .mul(data.strategicSignificanceMultiplier)
            .mul(data.spatialRiskMultiplier)
            .plus(new Decimal(data.vhdhBespokeCompensationUnits).mul(data.spatialRiskMultiplier))
            .toNumber()

    return {
        ...data,
        baselineUnitsRetainedWithSRM,
    }
}

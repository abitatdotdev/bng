import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { baselineHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { areaSchema, enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, isValidIrreplaceable } from '../schemaUtils';
import { getSpatialRiskMultiplier, spatialRiskCategorySchema } from '../spatialRisk';
import { bespokeCompensationSchema } from '../bespokeCompensation';

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
type OutputSchema = v.InferOutput<typeof inputSchema>

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
    v.check(s => !(s.broadHabitat === "Individual trees" && s.areaEnhanced > 0 && s.irreplaceableHabitat), "Error - you cannot enhance irreplaceable individual trees ▲"),
    v.check(s => !!s.habitatType || !s.irreplaceableHabitat, "Confirm irreplaceable habitat status ▲"),
    v.check(s => !(s.spatialRiskCategory && !s.offSiteReferenceNumber), "Off-site reference required ▲"),
    v.transform(enrichWithTotalHabitatUnits),
    // Checks from within the units lost cell (AA)
    v.check(s => s.area - s.areaRetained - s.areaEnhanced >= 0, "Error in Areas ▲"),
    v.check(s =>
        ["Same habitat required – bespoke compensation option ⚠",
            "Bespoke compensation likely to be required",
        ].includes(s.requiredAction)
            ? s.bespokeCompensationAgreed === "Yes"
            : true
        , "Bespoke compensation must be agreed ▲"),
    v.transform(enrichWithUnitsLost),
)
export type OffSiteHabitatBaselineSchema = v.InferInput<typeof offSiteHabitatBaselineSchema>
export type OffSiteHabitatBaseline = v.InferOutput<typeof offSiteHabitatBaselineSchema>

// Enrich with spatial risk multiplier
export function enrichWithSpatialRiskMultiplier<Data extends {
    spatialRiskCategory: string;
}>(data: Data) {
    const spatialRiskMultiplier = getSpatialRiskMultiplier(data.spatialRiskCategory as any);
    return {
        ...data,
        spatialRiskMultiplier,
    };
}

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
        : data.areaRetained * data.distinctivenessScore * data.conditionScore * data.strategicSignificanceMultiplier;

    const baselineUnitsEnhanced = (data.broadHabitat === "Individual trees" && data.areaEnhanced > 0 && data.irreplaceableHabitat)
        ? 0
        : data.areaEnhanced * data.distinctivenessScore * data.conditionScore * data.strategicSignificanceMultiplier;

    const areaHabitatLost = data.area - data.areaRetained - data.areaEnhanced;

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
        totalHabitatUnitsSRM = data.area * data.spatialRiskMultiplier;
    } else if (bespokeRequired && hasBiodiversityGain) {
        totalHabitatUnitsSRM = (data.baselineUnitsRetained + data.baselineUnitsEnhanced) * data.spatialRiskMultiplier;
    } else {
        totalHabitatUnitsSRM = data.area * data.distinctivenessScore * data.conditionScore * data.strategicSignificanceMultiplier * data.spatialRiskMultiplier;
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
        totalHabitatUnits = (data.areaRetained + data.areaEnhanced) * data.distinctivenessScore * data.conditionScore * data.strategicSignificanceMultiplier;
    } else if (bespokeRequired && !hasBiodiversityGain && data.bespokeCompensationAgreed === "Yes") {
        totalHabitatUnits = 0;
    } else if (bespokeRequired && hasBiodiversityGain) {
        totalHabitatUnits = data.baselineUnitsRetained + data.baselineUnitsEnhanced;
    } else {
        totalHabitatUnits = data.area * data.distinctivenessScore * data.conditionScore * data.strategicSignificanceMultiplier;
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
        unitsLost = data.totalHabitatUnits - data.baselineUnitsRetained - data.baselineUnitsEnhanced;
    }

    return {
        ...data,
        unitsLost,
    };
}


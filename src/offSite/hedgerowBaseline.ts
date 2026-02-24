import * as v from 'valibot';
import { allHedgerows, type HedgerowLabel } from '../hedgerows';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { hedgerowConditionSchema, type HedgerowCondition } from '../hedgerowCondition';
import { spatialRiskCategorySchema, getSpatialRiskMultiplier } from '../spatialRisk';
import { hedgerowTypeSchema } from '../hedgerowType';
import { Decimal } from '../decimal';

const inputSchema = v.object({
    habitatType: hedgerowTypeSchema,
    length: lengthSchema,
    condition: hedgerowConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    spatialRiskCategory: v.optional(spatialRiskCategorySchema),
    lengthRetained: v.optional(lengthSchema, 0),
    lengthEnhanced: v.optional(lengthSchema, 0),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
});

export const offSiteHedgerowBaselineSchema = v.pipe(
    inputSchema,
    // Validate that the habitat type is valid
    v.check(s => !!allHedgerows[s.habitatType], "Invalid hedgerow habitat type"),
    // Check if Non-native and ornamental hedgerow has only Poor condition
    v.check(
        s => !(s.habitatType === "Non-native and ornamental hedgerow" && s.condition !== "Poor"),
        "Non-native and ornamental hedgerow can only have Poor condition"
    ),
    v.check(
        s => new Decimal(s.lengthRetained).plus(s.lengthEnhanced).lessThanOrEqualTo(s.length),
        "Retained and enhanced lengths cannot exceed total length"
    ),
    // Enrich with hedgerow data
    v.transform(enrichWithHedgerowData),
    // Enrich with spatial risk multiplier
    v.transform(enrichWithSpatialRiskMultiplier),
    // Calculate baseline units
    v.transform(enrichWithBaselineUnitsData),
    // Calculate total hedgerow units SRM (with spatial risk)
    v.transform(enrichWithTotalHedgerowUnitsSRM),
    // Calculate total hedgerow units (without spatial risk)
    v.transform(enrichWithTotalHedgerowUnits),
    // Check that off-site reference is required when spatial risk is set
    v.check(
        s => !(s.spatialRiskCategory && !s.offSiteReferenceNumber),
        "Off-site reference required ▲"
    ),
    // Calculate units lost
    v.transform(enrichWithUnitsLost),
);

export type OffSiteHedgerowBaselineSchema = v.InferInput<typeof offSiteHedgerowBaselineSchema>;
export type OffSiteHedgerowBaseline = v.InferOutput<typeof offSiteHedgerowBaselineSchema>;

/**
 * Enrich data with hedgerow properties from the hedgerows lookup
 */
export function enrichWithHedgerowData<Data extends {
    habitatType: HedgerowLabel;
    condition: HedgerowCondition;
    strategicSignificance: StrategicSignificanceDescription;
}>(data: Data) {
    const hedgerow = allHedgerows[data.habitatType];

    // Get condition score - hedgerows use simplified scoring
    // Based on the metric: Good = 3, Moderate = 2, Poor = 1
    const conditionScoreMap: Record<HedgerowCondition, number> = {
        "Good": 3,
        "Moderate": 2,
        "Poor": 1,
    };

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    return {
        ...data,
        distinctiveness: hedgerow.distinctivenessCategory,
        distinctivenessScore: hedgerow.distinctivenessScore,
        conditionScore: conditionScoreMap[data.condition],
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        tradingRules: hedgerow.tradingRules,
    };
}

/**
 * Enrich data with spatial risk multiplier.
 * If spatialRiskCategory is not provided, defaults to 1.0 (no spatial risk adjustment)
 */
export function enrichWithSpatialRiskMultiplier<Data extends {
    spatialRiskCategory?: string;
}>(data: Data) {
    const spatialRiskMultiplier = data.spatialRiskCategory
        ? getSpatialRiskMultiplier(data.spatialRiskCategory as any)
        : 1.0;

    return {
        ...data,
        spatialRiskMultiplier,
    };
}

/**
 * Calculate baseline units for retained and enhanced portions
 */
export function enrichWithBaselineUnitsData<Data extends {
    lengthRetained: number;
    lengthEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
}>(data: Data) {
    const unitsRetained = new Decimal(data.lengthRetained)
        .mul(data.distinctivenessScore)
        .mul(data.conditionScore)
        .mul(data.strategicSignificanceMultiplier)
        .toNumber();

    const unitsEnhanced = new Decimal(data.lengthEnhanced)
        .mul(data.distinctivenessScore)
        .mul(data.conditionScore)
        .mul(data.strategicSignificanceMultiplier)
        .toNumber();

    return {
        ...data,
        unitsRetained,
        unitsEnhanced,
    };
}

/**
 * Calculate total hedgerow units SRM (with spatial risk multiplier)
 * This is column N in the Excel sheet - includes spatial risk
 */
export function enrichWithTotalHedgerowUnitsSRM<Data extends {
    length: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
    spatialRiskMultiplier: number;
}>(data: Data) {
    const totalHedgerowUnitsSRM = new Decimal(data.length)
        .mul(data.distinctivenessScore)
        .mul(data.conditionScore)
        .mul(data.strategicSignificanceMultiplier)
        .mul(data.spatialRiskMultiplier)
        .toNumber();

    return {
        ...data,
        totalHedgerowUnitsSRM,
    };
}

/**
 * Calculate total hedgerow units (without spatial risk multiplier)
 * This is column Q in the Excel sheet - baseline calculation
 */
export function enrichWithTotalHedgerowUnits<Data extends {
    length: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
}>(data: Data) {
    const totalHedgerowUnits = new Decimal(data.length)
        .mul(data.distinctivenessScore)
        .mul(data.conditionScore)
        .mul(data.strategicSignificanceMultiplier)
        .toNumber();

    return {
        ...data,
        totalHedgerowUnits,
    };
}

/**
 * Calculate length lost and units lost
 * Units lost is based on totalHedgerowUnits (without spatial risk), not totalHedgerowUnitsSRM
 */
export function enrichWithUnitsLost<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    totalHedgerowUnits: number;
    unitsRetained: number;
    unitsEnhanced: number;
}>(data: Data) {
    const lengthLost = new Decimal(data.length).minus(data.lengthRetained).minus(data.lengthEnhanced).toNumber();
    const unitsLost = lengthLost === 0 ? 0 : new Decimal(data.totalHedgerowUnits).minus(data.unitsRetained).minus(data.unitsEnhanced).toNumber();

    return {
        ...data,
        lengthLost,
        unitsLost,
    };
}

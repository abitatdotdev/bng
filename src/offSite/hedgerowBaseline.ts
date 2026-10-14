import { Decimal, toDecimal } from '../decimal';
import * as v from 'valibot';
import { allHedgerows, type HedgerowLabel } from '../hedgerows';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema, safeTransform } from '../schemaUtils';
import {
    getStrategicSignificance,
    type StrategicSignificanceDescription,
} from '../strategicSignificanceSchema';
import { hedgerowConditionSchema, type HedgerowCondition } from '../hedgerowCondition';
import { spatialRiskCategorySchema, getSpatialRiskMultiplier } from '../spatialRisk';
import { hedgerowTypeSchema } from '../hedgerowType';

import { calculateBaselineUnits, calculateTotalHedgerowUnits, calculateUnitsLost } from '../hedgerowCalc';

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
    v.transform((data) => ({
        ...data,
        length: data.length.toNumber(),
        lengthDecimal: data.length,
        lengthRetained: data.lengthRetained.toNumber(),
        lengthRetainedDecimal: data.lengthRetained,
        lengthEnhanced: data.lengthEnhanced.toNumber(),
        lengthEnhancedDecimal: data.lengthEnhanced,
    })),
    // Validate that the habitat type is valid
    v.forward(
        v.check((s) => !!allHedgerows[s.habitatType], 'Invalid hedgerow habitat type'),
        ['habitatType'],
    ),
    // Check if Non-native and ornamental hedgerow has only Poor condition
    v.forward(
        v.check(
            (s) => !(s.habitatType === 'Non-native and ornamental hedgerow' && s.condition !== 'Poor'),
            'Non-native and ornamental hedgerow can only have Poor condition',
        ),
        ['condition'],
    ),
    v.forward(
        v.check(
            (s) =>
                new Decimal(s.lengthRetainedDecimal)
                    .plus(s.lengthEnhancedDecimal)
                    .lessThanOrEqualTo(s.lengthDecimal),
            'Retained and enhanced lengths cannot exceed total length',
        ),
        ['length'],
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
    v.forward(
        v.check(
            (s) => !(s.spatialRiskCategory && !s.offSiteReferenceNumber),
            'Off-site reference required ▲',
        ),
        ['offSiteReferenceNumber'],
    ),
    // Calculate units lost
    v.transform(enrichWithUnitsLost),
);

export type OffSiteHedgerowBaselineSchema = v.InferInput<typeof offSiteHedgerowBaselineSchema>;
export type OffSiteHedgerowBaseline = v.InferOutput<typeof offSiteHedgerowBaselineSchema>;

export const offSiteHedgerowBaselineUncheckedSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        length: data.length.toNumber(),
        lengthDecimal: data.length,
        lengthRetained: data.lengthRetained.toNumber(),
        lengthRetainedDecimal: data.lengthRetained,
        lengthEnhanced: data.lengthEnhanced.toNumber(),
        lengthEnhancedDecimal: data.lengthEnhanced,
    })),
    safeTransform(enrichWithHedgerowData),
    safeTransform(enrichWithSpatialRiskMultiplier),
    safeTransform(enrichWithBaselineUnitsData),
    safeTransform(enrichWithTotalHedgerowUnitsSRM),
    safeTransform(enrichWithTotalHedgerowUnits),
    safeTransform(enrichWithUnitsLost),
);

/**
 * Enrich data with hedgerow properties from the hedgerows lookup
 */
export function enrichWithHedgerowData<
    Data extends {
        habitatType: HedgerowLabel;
        condition: HedgerowCondition;
        strategicSignificance: StrategicSignificanceDescription;
    },
>(data: Data) {
    const hedgerow = allHedgerows[data.habitatType];

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    return {
        ...data,
        distinctiveness: hedgerow.distinctivenessCategory,
        distinctivenessScore: hedgerow.distinctivenessScore,
        distinctivenessScoreDecimal: toDecimal(hedgerow.distinctivenessScore),
        conditionScore: hedgerow.conditions[data.condition],
        conditionScoreDecimal: toDecimal(hedgerow.conditions[data.condition]),
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        strategicSignificanceMultiplierDecimal: toDecimal(strategicSignificance.multiplier),
        tradingRules: hedgerow.tradingRules,
    };
}

/**
 * Enrich data with spatial risk multiplier.
 * If spatialRiskCategory is not provided, defaults to 1.0 (no spatial risk adjustment)
 */
export function enrichWithSpatialRiskMultiplier<
    Data extends {
        spatialRiskCategory?: string;
    },
>(data: Data) {
    const spatialRiskMultiplier = data.spatialRiskCategory
        ? getSpatialRiskMultiplier(data.spatialRiskCategory as any)
        : 1.0;

    return {
        ...data,
        spatialRiskMultiplier,
        spatialRiskMultiplierDecimal: toDecimal(spatialRiskMultiplier),
    };
}

export function enrichWithBaselineUnitsData<
    Data extends {
        lengthRetained: number;
        lengthRetainedDecimal: Decimal;
        lengthEnhanced: number;
        lengthEnhancedDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number;
        conditionScoreDecimal: Decimal;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateBaselineUnits(data) };
}

/**
 * Pure calculation: derives totalHedgerowUnitsSRM.
 */
export function calculateTotalHedgerowUnitsSRM(input: {
    length: number;
    lengthDecimal?: Decimal;
    distinctivenessScore: number;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: number;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: number;
    strategicSignificanceMultiplierDecimal?: Decimal;
    spatialRiskMultiplier: number;
    spatialRiskMultiplierDecimal?: Decimal;
}) {
    const totalHedgerowUnitsSRM = new Decimal(input.lengthDecimal ?? toDecimal(input.length))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(input.conditionScoreDecimal ?? toDecimal(input.conditionScore))
        .mul(input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier))
        .mul(input.spatialRiskMultiplierDecimal ?? toDecimal(input.spatialRiskMultiplier));

    return {
        totalHedgerowUnitsSRM: totalHedgerowUnitsSRM.toNumber(),
        totalHedgerowUnitsSRMDecimal: totalHedgerowUnitsSRM,
    };
}

export function enrichWithTotalHedgerowUnitsSRM<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number;
        conditionScoreDecimal: Decimal;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        spatialRiskMultiplier: number;
        spatialRiskMultiplierDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateTotalHedgerowUnitsSRM(data) };
}

export function enrichWithTotalHedgerowUnits<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number;
        conditionScoreDecimal: Decimal;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateTotalHedgerowUnits(data) };
}

export function enrichWithUnitsLost<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        lengthRetained: number;
        lengthRetainedDecimal: Decimal;
        lengthEnhanced: number;
        lengthEnhancedDecimal: Decimal;
        totalHedgerowUnits: number;
        totalHedgerowUnitsDecimal: Decimal;
        unitsRetained: number;
        unitsRetainedDecimal: Decimal;
        unitsEnhanced: number;
        unitsEnhancedDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateUnitsLost(data) };
}

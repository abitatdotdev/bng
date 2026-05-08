import * as v from 'valibot';
import { Decimal } from '../decimal';
import { allHedgerows, type HedgerowLabel } from '../hedgerows';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { hedgerowConditionSchema, type HedgerowCondition } from '../hedgerowCondition';
import { hedgerowTypeSchema } from '../hedgerowType';

const inputSchema = v.object({
    habitatType: hedgerowTypeSchema,
    length: lengthSchema,
    condition: hedgerowConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    lengthRetained: v.optional(lengthSchema, 0),
    lengthEnhanced: v.optional(lengthSchema, 0),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
});

export const onSiteHedgerowBaselineSchema = v.pipe(
    inputSchema,
    // Validate that the habitat type is valid
    v.check(s => !!allHedgerows[s.habitatType], "Invalid hedgerow habitat type"),
    // Check if Non-native and ornamental hedgerow has only Poor condition
    // Column I (Condition Score)
    v.check(
        s => !(s.habitatType === "Non-native and ornamental hedgerow" && s.condition !== "Poor"),
        "Non-native and ornamental hedgerow can only have Poor condition"
    ),
    // Check that retained + enhanced doesn't exceed total length
    // Column T (Length Lost)
    v.check(
        s => new Decimal(s.lengthRetained).plus(s.lengthEnhanced).lessThanOrEqualTo(s.length),
        "Retained and enhanced lengths cannot exceed total length"
    ),
    // Enrich with hedgerow data
    v.transform(enrichWithHedgerowData),
    // Calculate baseline units
    v.transform(enrichWithBaselineUnitsData),
    // Calculate total hedgerow units
    v.transform(enrichWithTotalHedgerowUnits),
    // Calculate units lost (Columns T, U)
    v.transform(enrichWithUnitsLost),
);

export type OnSiteHedgerowBaselineSchema = v.InferInput<typeof onSiteHedgerowBaselineSchema>;
export type OnSiteHedgerowBaseline = v.InferOutput<typeof onSiteHedgerowBaselineSchema>;

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
 * Calculate baseline units for retained and enhanced portions
 */
/**
 * Pure calculation: derives unitsRetained and unitsEnhanced for a hedgerow baseline.
 */
export function calculateBaselineUnits(input: {
    lengthRetained: number;
    lengthEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
}) {
    const unitsRetained = new Decimal(input.lengthRetained)
        .mul(input.distinctivenessScore)
        .mul(input.conditionScore)
        .mul(input.strategicSignificanceMultiplier)
        .toNumber();

    const unitsEnhanced = new Decimal(input.lengthEnhanced)
        .mul(input.distinctivenessScore)
        .mul(input.conditionScore)
        .mul(input.strategicSignificanceMultiplier)
        .toNumber();

    return { unitsRetained, unitsEnhanced };
}

export function enrichWithBaselineUnitsData<Data extends {
    lengthRetained: number;
    lengthEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
}>(data: Data) {
    return { ...data, ...calculateBaselineUnits(data) };
}

/**
 * Pure calculation: derives totalHedgerowUnits.
 */
export function calculateTotalHedgerowUnits(input: {
    length: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
}) {
    const totalHedgerowUnits = new Decimal(input.length)
        .mul(input.distinctivenessScore)
        .mul(input.conditionScore)
        .mul(input.strategicSignificanceMultiplier)
        .toNumber();

    return { totalHedgerowUnits };
}

export function enrichWithTotalHedgerowUnits<Data extends {
    length: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
}>(data: Data) {
    return { ...data, ...calculateTotalHedgerowUnits(data) };
}

/**
 * Pure calculation: derives lengthLost and unitsLost.
 */
export function calculateUnitsLost(input: {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    totalHedgerowUnits: number;
    unitsRetained: number;
    unitsEnhanced: number;
}) {
    const lengthLost = new Decimal(input.length)
        .minus(input.lengthRetained)
        .minus(input.lengthEnhanced)
        .toNumber();
    const unitsLost = lengthLost === 0 ? 0 : new Decimal(input.totalHedgerowUnits)
        .minus(input.unitsRetained)
        .minus(input.unitsEnhanced)
        .toNumber();

    return { lengthLost, unitsLost };
}

export function enrichWithUnitsLost<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    totalHedgerowUnits: number;
    unitsRetained: number;
    unitsEnhanced: number;
}>(data: Data) {
    return { ...data, ...calculateUnitsLost(data) };
}

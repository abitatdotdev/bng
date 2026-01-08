import * as v from 'valibot';
import { allHedgerows, type HedgerowLabel } from '../hedgerows';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { hedgerowConditionSchema, type HedgerowCondition } from '../hedgerowCondition';

// Length schema for hedgerows (in kilometers)
export const lengthSchema = v.pipe(
    v.number(),
    v.toMinValue(0),
);

// Hedgerow type schema
export const hedgerowTypeSchema = v.picklist(Object.keys(allHedgerows) as [HedgerowLabel, ...HedgerowLabel[]]);
export type HedgerowType = v.InferOutput<typeof hedgerowTypeSchema>;

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
        s => s.lengthRetained + s.lengthEnhanced <= s.length,
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
export function enrichWithBaselineUnitsData<Data extends {
    lengthRetained: number;
    lengthEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
}>(data: Data) {
    const unitsRetained = data.lengthRetained
        * data.distinctivenessScore
        * data.conditionScore
        * data.strategicSignificanceMultiplier;

    const unitsEnhanced = data.lengthEnhanced
        * data.distinctivenessScore
        * data.conditionScore
        * data.strategicSignificanceMultiplier;

    return {
        ...data,
        unitsRetained,
        unitsEnhanced,
    };
}

/**
 * Calculate total hedgerow units
 */
export function enrichWithTotalHedgerowUnits<Data extends {
    length: number;
    distinctivenessScore: number;
    conditionScore: number;
    strategicSignificanceMultiplier: number;
}>(data: Data) {
    const totalHedgerowUnits = data.length
        * data.distinctivenessScore
        * data.conditionScore
        * data.strategicSignificanceMultiplier;

    return {
        ...data,
        totalHedgerowUnits,
    };
}

/**
 * Calculate length lost and units lost
 */
export function enrichWithUnitsLost<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    totalHedgerowUnits: number;
    unitsRetained: number;
    unitsEnhanced: number;
}>(data: Data) {
    const lengthLost = data.length - data.lengthRetained - data.lengthEnhanced;
    const unitsLost = lengthLost === 0 ? 0 : data.totalHedgerowUnits - data.unitsRetained - data.unitsEnhanced;

    return {
        ...data,
        lengthLost,
        unitsLost,
    };
}

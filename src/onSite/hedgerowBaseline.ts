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
import { hedgerowTypeSchema } from '../hedgerowType';
import { calculateBaselineUnits, calculateTotalHedgerowUnits, calculateUnitsLost } from '../hedgerowCalc';
import { applyOnSiteHedgerowBaselineAvailability } from './hedgerowAvailability';

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
    // Column I (Condition Score)
    v.forward(
        v.check(
            (s) => !(s.habitatType === 'Non-native and ornamental hedgerow' && s.condition !== 'Poor'),
            'Non-native and ornamental hedgerow can only have Poor condition',
        ),
        ['condition'],
    ),
    // Check that retained + enhanced doesn't exceed total length
    // Column T (Length Lost)
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
    // Calculate baseline units
    v.transform(enrichWithBaselineUnitsData),
    // Calculate total hedgerow units
    v.transform(enrichWithTotalHedgerowUnits),
    // Calculate units lost (Columns T, U)
    v.transform(enrichWithUnitsLost),
    v.transform(applyOnSiteHedgerowBaselineAvailability),
);

export type OnSiteHedgerowBaselineSchema = v.InferInput<typeof onSiteHedgerowBaselineSchema>;
export type OnSiteHedgerowBaseline = v.InferOutput<typeof onSiteHedgerowBaselineSchema>;

export const onSiteHedgerowBaselineUncheckedSchema = v.pipe(
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
    safeTransform(enrichWithBaselineUnitsData),
    safeTransform(enrichWithTotalHedgerowUnits),
    safeTransform(enrichWithUnitsLost),
    safeTransform(applyOnSiteHedgerowBaselineAvailability),
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

    const conditionScore = hedgerow.conditions[data.condition];

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    return {
        ...data,
        distinctiveness: hedgerow.distinctivenessCategory,
        distinctivenessScore: hedgerow.distinctivenessScore,
        distinctivenessScoreDecimal: toDecimal(hedgerow.distinctivenessScore),
        conditionScore,
        conditionScoreDecimal: toDecimal(conditionScore),
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        strategicSignificanceMultiplierDecimal: toDecimal(strategicSignificance.multiplier),
        tradingRules: hedgerow.tradingRules,
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

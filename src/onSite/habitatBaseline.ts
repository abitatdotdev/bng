import { Decimal, toDecimal } from '../decimal';
import * as v from 'valibot';

import { broadHabitatSchema } from '../broadHabitats';
import { baselineHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import {
    addTotalHabitatUnits as enrichWithStandardTotalHabitatUnits,
    areaSchema,
    enrichWithHabitatData,
    freeTextSchema,
    isValidCondition,
    isValidHabitat,
    isValidIrreplaceable,
    safeTransform,
} from '../schemaUtils';
import { calculateBaselineUnits, calculateTotalHabitatUnits, calculateVhdhBespokeCompensationUnits } from '../habitatCalc';
import { areaBaselineAvailability } from '../areaCalculationRules';
import { bespokeCompensationSchema, type BespokeCompensation } from '../bespokeCompensation';
import type { SuggestedTradingActions } from '../distinctivenessCategories';

const inputSchema = v.object({
    broadHabitat: broadHabitatSchema,
    habitatType: baselineHabitatType,
    irreplaceableHabitat: v.boolean(),
    area: areaSchema,
    condition: conditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    areaRetained: v.optional(areaSchema, 0),
    areaEnhanced: v.optional(areaSchema, 0),
    bespokeCompensationAgreed: v.optional(bespokeCompensationSchema, 'No'),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
});

export const onSiteHabitatBaselineSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        area: data.area.toNumber(),
        areaDecimal: data.area,
        areaRetained: data.areaRetained.toNumber(),
        areaRetainedDecimal: data.areaRetained,
        areaEnhanced: data.areaEnhanced.toNumber(),
        areaEnhancedDecimal: data.areaEnhanced,
    })),
    v.forward(
        v.check(
            (s) => isValidHabitat(s.broadHabitat, s.habitatType),
            'The broad habitat and habitat type are incompatible',
        ),
        ['habitatType'],
    ),
    v.forward(
        v.check(
            (s) => isValidIrreplaceable(s.broadHabitat, s.habitatType, s.irreplaceableHabitat),
            'This habitat cannot be irreplaceable',
        ),
        ['irreplaceableHabitat'],
    ),
    v.forward(
        v.check(
            (s) => isValidCondition(s.broadHabitat, s.habitatType, s.condition),
            'The condition for this habitat is invalid',
        ),
        ['condition'],
    ),
    v.transform(enrichWithHabitatData),
    v.transform(enrichWithBaselineUnitsData),
    // Checks from within the total habitat units cell (Q)
    // See https://opncd.ai/share/5IiLnaI4 for translation
    v.forward(
        v.check(
            (s) =>
                !(
                    s.broadHabitat === 'Individual trees' &&
                    new Decimal(s.areaEnhancedDecimal).gt(0) &&
                    s.irreplaceableHabitat
                ),
            'You cannot enhance irreplaceable individual trees ▲',
        ),
        ['areaEnhanced'],
    ),
    v.forward(
        v.check(
            (s) =>
                !(
                    s.irreplaceableHabitat &&
                    new Decimal(s.areaRetainedDecimal).plus(s.areaEnhancedDecimal).lessThan(s.areaDecimal) &&
                    s.bespokeCompensationAgreed === 'No'
                ),
            'Any loss unacceptable',
        ),
        ['irreplaceableHabitat'],
    ),
    v.forward(
        v.check(
            (s) =>
                !(
                    s.requiredAction === 'Bespoke compensation likely to be required' &&
                    !(new Decimal(s.areaRetainedDecimal).gt(0) || new Decimal(s.areaEnhancedDecimal).gt(0)) &&
                    s.bespokeCompensationAgreed === 'No'
                ),
            'Any loss unacceptable',
        ),
        ['bespokeCompensationAgreed'],
    ),
    v.transform(enrichWithTotalHabitatUnits),
    // Checks from within the units lost cell (X)
    // See https://opncd.ai/share/4Z0sTzAw for translation
    v.forward(
        v.check(
            (s) =>
                new Decimal(s.areaDecimal)
                    .minus(s.areaRetainedDecimal)
                    .minus(s.areaEnhancedDecimal)
                    .greaterThanOrEqualTo(0),
            'Area sums do not add up',
        ),
        ['area'],
    ),
    v.transform(enrichWithUnitsLost),
    v.transform(enrichWithVhdhBespokeCompensationUnits),
);

export type OnSiteHabitatBaselineSchema = v.InferInput<typeof onSiteHabitatBaselineSchema>;
export type OnSiteHabitatBaseline = v.InferOutput<typeof onSiteHabitatBaselineSchema>;

export const onSiteHabitatBaselineUncheckedSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        area: data.area.toNumber(),
        areaDecimal: data.area,
        areaRetained: data.areaRetained.toNumber(),
        areaRetainedDecimal: data.areaRetained,
        areaEnhanced: data.areaEnhanced.toNumber(),
        areaEnhancedDecimal: data.areaEnhanced,
    })),
    safeTransform(enrichWithHabitatData),
    safeTransform(enrichWithBaselineUnitsData),
    safeTransform(enrichWithTotalHabitatUnits),
    safeTransform(enrichWithUnitsLost),
    safeTransform(enrichWithVhdhBespokeCompensationUnits),
);

export function enrichWithBaselineUnitsData<
    Data extends {
        irreplaceableHabitat: boolean;
        area: number;
        areaDecimal: Decimal;
        areaRetained: number;
        areaRetainedDecimal: Decimal;
        areaEnhanced: number;
        areaEnhancedDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number;
        conditionScoreDecimal: Decimal;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        requiredAction?: SuggestedTradingActions;
        bespokeCompensationAgreed?: BespokeCompensation;
    },
>(data: Data) {
    return {
        ...data,
        ...calculateBaselineUnits(data),
        areaCalculationAvailability: areaBaselineAvailability({
            ...data,
            offSite: false,
        }),
    };
}

function enrichWithTotalHabitatUnits<Data extends {
    irreplaceableHabitat: boolean;
    area: number;
    areaDecimal?: Decimal;
    areaRetained: number;
    areaRetainedDecimal?: Decimal;
    areaEnhanced: number;
    areaEnhancedDecimal?: Decimal;
    requiredAction: SuggestedTradingActions;
    bespokeCompensationAgreed: BespokeCompensation;
    baselineUnitsRetained: number;
    baselineUnitsRetainedDecimal: Decimal;
    baselineUnitsEnhanced: number;
    baselineUnitsEnhancedDecimal: Decimal;
    distinctivenessScore: number;
    distinctivenessScoreDecimal: Decimal;
    conditionScore: number;
    conditionScoreDecimal: Decimal;
    strategicSignificanceMultiplier: number;
    strategicSignificanceMultiplierDecimal: Decimal;
    areaCalculationAvailability?: ReturnType<typeof areaBaselineAvailability>;
}>(data: Data) {
    if (data.areaCalculationAvailability?.totalHabitatUnits === false) {
        return { ...data, totalHabitatUnits: 0, totalHabitatUnitsDecimal: toDecimal(0) };
    }
    return data.irreplaceableHabitat
        ? { ...data, ...calculateTotalHabitatUnits({ ...data, irreplaceableHabitat: true }) }
        : enrichWithStandardTotalHabitatUnits(data);
}

/**
 * Pure calculation: derives units lost. Returns only the computed value.
 */
export function calculateUnitsLost(input: {
    areaHabitatLost: number;
    areaHabitatLostDecimal?: Decimal;
    totalHabitatUnits: number;
    totalHabitatUnitsDecimal?: Decimal;
    baselineUnitsRetained: number;
    baselineUnitsRetainedDecimal?: Decimal;
    baselineUnitsEnhanced: number;
    baselineUnitsEnhancedDecimal?: Decimal;
    bespokeCompensationAgreed?: BespokeCompensation;
    requiredAction?: SuggestedTradingActions;
}) {
    const hasLoss = new Decimal(input.areaHabitatLostDecimal ?? toDecimal(input.areaHabitatLost)).gt(0);
    const compensationApplies = input.requiredAction === 'Same habitat required – bespoke compensation option ⚠' ||
        input.requiredAction === 'Bespoke compensation likely to be required';
    const compensationBlocksLoss = hasLoss && compensationApplies &&
        (input.bespokeCompensationAgreed === 'Yes' || input.bespokeCompensationAgreed === 'Pending');
    const unitsLost = !hasLoss || compensationBlocksLoss
        ? 0
        : new Decimal(input.totalHabitatUnitsDecimal ?? toDecimal(input.totalHabitatUnits))
              .minus(input.baselineUnitsRetainedDecimal ?? toDecimal(input.baselineUnitsRetained))
              .minus(input.baselineUnitsEnhancedDecimal ?? toDecimal(input.baselineUnitsEnhanced));
    return { unitsLost: toDecimal(unitsLost).toNumber(), unitsLostDecimal: toDecimal(unitsLost) };
}

// See https://opncd.ai/share/4Z0sTzAw for translation
export function enrichWithUnitsLost<
    Data extends {
        areaHabitatLost: number;
        areaHabitatLostDecimal: Decimal;
        totalHabitatUnits: number;
        totalHabitatUnitsDecimal: Decimal;
        baselineUnitsRetained: number;
        baselineUnitsRetainedDecimal: Decimal;
        baselineUnitsEnhanced: number;
        baselineUnitsEnhancedDecimal: Decimal;
        bespokeCompensationAgreed?: BespokeCompensation;
        requiredAction?: SuggestedTradingActions;
        areaCalculationAvailability?: ReturnType<typeof areaBaselineAvailability>;
    },
>(data: Data) {
    if (data.areaCalculationAvailability?.unitsLost === false) {
        return { ...data, unitsLost: 0, unitsLostDecimal: toDecimal(0) };
    }
    return { ...data, ...calculateUnitsLost(data) };
}

export function enrichWithVhdhBespokeCompensationUnits<
    Data extends {
        bespokeCompensationAgreed: BespokeCompensation;
        requiredAction: SuggestedTradingActions;
        areaCalculationAvailability?: ReturnType<typeof areaBaselineAvailability>;
        totalHabitatUnits: number;
        totalHabitatUnitsDecimal: Decimal;
        baselineUnitsRetained: number;
        baselineUnitsRetainedDecimal: Decimal;
        baselineUnitsEnhanced: number;
        baselineUnitsEnhancedDecimal: Decimal;
    },
>(data: Data) {
    if (data.areaCalculationAvailability?.vhdhBespokeCompensationUnits === false) {
        return { ...data, vhdhBespokeCompensationUnits: 0, vhdhBespokeCompensationUnitsDecimal: toDecimal(0) };
    }
    return { ...data, ...calculateVhdhBespokeCompensationUnits(data) };
}

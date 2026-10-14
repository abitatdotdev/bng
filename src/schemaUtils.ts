import { type Decimal, isFiniteQuantity, toDecimal, type Quantity } from './decimal';
import * as v from 'valibot';

import { habitatByBroadAndType, habitatByType, type Habitat } from './habitats';
import { type BroadHabitat } from './broadHabitats';
import { type BaselineHabitatType, type CreationHabitatType, type EnhancedHabitatType } from './habitatTypes';
import type { Condition } from './conditions';
import {
    getStrategicSignificance,
    type StrategicSignificance,
    type StrategicSignificanceDescription,
} from './strategicSignificanceSchema';
import { distinctivenessCategories, type SuggestedTradingActions } from './distinctivenessCategories';
import type { BespokeCompensation } from './bespokeCompensation';
import { calculateTotalHabitatUnits } from './habitatCalc';

/**
 * Like `v.transform`, but silently passes the input through unchanged if the
 * callback throws. Used by the *UncheckedSchema variants so that a row with a
 * missing lookup (e.g. an unknown habitat type) yields `undefined` derived
 * fields instead of failing the whole row.
 */
export function safeTransform<I, O>(fn: (input: I) => O) {
    return v.transform((input: I) => {
        try {
            return fn(input);
        } catch {
            return input as unknown as O;
        }
    });
}

export const quantitySchema = v.custom<Quantity>(
    isFiniteQuantity,
    'Expected a finite number, decimal string or Decimal',
);

export const areaSchema = v.pipe(
    quantitySchema,
    v.check((value) => toDecimal(value).gte(0), 'Expected a non-negative quantity'),
    v.transform(toDecimal),
    v.title('Area'),
    v.description('Habitat parcel area in hectares.'),
);

// Length schema for hedgerows and watercourses (in kilometers)
export const lengthSchema = v.pipe(
    quantitySchema,
    v.check((value) => toDecimal(value).gte(0), 'Expected a non-negative quantity'),
    v.transform(toDecimal),
    v.title('Length'),
    v.description('Hedgerow or watercourse length in kilometres.'),
);

export const freeTextSchema = v.optional(
    v.pipe(v.string(), v.description('Free-text field; not used in calculations.')),
);

export const isValidYearsQuantity = (value: Quantity) =>
    toDecimal(value).isInteger() && toDecimal(value).gte(0) && toDecimal(value).lte(30);

export const yearsSchema = v.union([
    v.pipe(
        quantitySchema,
        v.check(isValidYearsQuantity, 'Expected integer years between 0 and 30'),
        v.transform((value) => toDecimal(value).toNumber()),
    ),
    v.literal('30+'),
]);

export function isValidHabitat(
    broadHabitat: BroadHabitat,
    habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType,
): boolean {
    return !!habitatByBroadAndType(broadHabitat, habitatType);
}

export function isValidIrreplaceable(
    broadHabitat: BroadHabitat,
    habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType,
    irreplaceable: boolean,
): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false;

    if (!habitat.irreplaceable) return true;
    return irreplaceable === habitat.irreplaceable;
}

export function isValidCondition(
    broadHabitat: BroadHabitat,
    habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType,
    condition: Condition,
): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false;

    return Object.keys(habitat.conditions).includes(condition);
}

type EnrichedHabitatData = {
    _habitat: Habitat;
    distinctiveness: Habitat['distinctivenessCategory'];
    distinctivenessScore: Habitat['distinctivenessScore'];
    distinctivenessScoreDecimal: Decimal;
    // @ts-ignore-line
    conditionScore: Habitat['conditions'][Condition];
    conditionScoreDecimal: Decimal;
    strategicSignificanceCategory: StrategicSignificance['significance'];
    strategicSignificanceMultiplier: StrategicSignificance['multiplier'];
    strategicSignificanceMultiplierDecimal: Decimal;
    requiredAction: SuggestedTradingActions;
};

export const enrichWithHabitatData = <
    Data extends {
        broadHabitat: BroadHabitat;
        habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType;
        strategicSignificance: StrategicSignificanceDescription;
        condition: Condition;
        irreplaceableHabitat?: boolean;
    },
>(
    data: Data,
): Data & EnrichedHabitatData => {
    let habitat = habitatByBroadAndType(data.broadHabitat, data.habitatType);
    if (!habitat) {
        const fallback = habitatByType(data.habitatType);
        if (fallback) {
            console.warn(
                `Habitat lookup: "${data.broadHabitat}" + "${data.habitatType}" mismatch, falling back to type-only (-> "${fallback.broadHabitat}")`,
            );
            habitat = fallback;
        }
    }
    if (!habitat) throw new Error(`Unknown habitat: ${data.broadHabitat} / ${data.habitatType}`);

    const conditionScore = (habitat.conditions as Record<Condition, number>)[data.condition];
    return {
        ...data,
        _habitat: habitat,
        distinctiveness: habitat.distinctivenessCategory,
        distinctivenessScore: habitat.distinctivenessScore,
        distinctivenessScoreDecimal: toDecimal(habitat.distinctivenessScore),
        conditionScore,
        conditionScoreDecimal:
            typeof conditionScore === 'number' ? toDecimal(conditionScore) : conditionScore,
        strategicSignificanceCategory: getStrategicSignificance(data.strategicSignificance).significance,
        strategicSignificanceMultiplier: getStrategicSignificance(data.strategicSignificance).multiplier,
        strategicSignificanceMultiplierDecimal: toDecimal(
            getStrategicSignificance(data.strategicSignificance).multiplier,
        ),
        requiredAction: data.irreplaceableHabitat
            ? distinctivenessCategories['Irreplaceable'].suggestedAction
            : habitat.distinctivenessTradingRules,
    };
};

export const enrichWithCreationData = <
    Data extends {
        broadHabitat: BroadHabitat;
        habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType;
        condition: string;
    },
>(
    data: Data,
) => {
    let habitat = habitatByBroadAndType(data.broadHabitat, data.habitatType);
    if (!habitat) {
        const fallback = habitatByType(data.habitatType);
        if (fallback) {
            console.warn(
                `Habitat lookup: "${data.broadHabitat}" + "${data.habitatType}" mismatch, falling back to type-only (-> "${fallback.broadHabitat}")`,
            );
            habitat = fallback;
        }
    }
    if (!habitat) throw new Error(`Unknown habitat: ${data.broadHabitat} / ${data.habitatType}`);

    const timeToTargetCondition = (
        habitat.temporalMultipliers as Record<string, number | '30+' | 'Not Possible ▲'>
    )[data.condition]!;
    return {
        ...data,
        timeToTargetCondition,
        timeToTargetConditionDecimal:
            typeof timeToTargetCondition === 'number'
                ? toDecimal(timeToTargetCondition)
                : timeToTargetCondition,
    };
};

export function addTotalHabitatUnits<
    Data extends {
        irreplaceableHabitat: boolean;
        requiredAction: SuggestedTradingActions;
        area: number;
        areaDecimal?: Decimal;
        areaRetained: number;
        areaRetainedDecimal?: Decimal;
        areaEnhanced: number;
        areaEnhancedDecimal?: Decimal;
        bespokeCompensationAgreed: BespokeCompensation;
        baselineUnitsRetained: number;
        baselineUnitsRetainedDecimal?: Decimal;
        baselineUnitsEnhanced: number;
        baselineUnitsEnhancedDecimal?: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal?: Decimal;
        conditionScore: number;
        conditionScoreDecimal?: Decimal;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal?: Decimal;
    },
>(data: Data) {
    // On-site Excel zeros total habitat units for irreplaceable habitats
    // ("Irreplaceable habitat - no units generated ⚠"). Off-site has its own
    // enrichment path that uses calculateTotalHabitatUnits's irreplaceable branch.
    if (data.irreplaceableHabitat) {
        return { ...data, totalHabitatUnits: 0, totalHabitatUnitsDecimal: toDecimal(0) };
    }
    return { ...data, ...calculateTotalHabitatUnits(data) };
}

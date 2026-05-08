import * as v from 'valibot';
import { habitatByBroadAndType, type Habitat } from './habitats';
import { type BroadHabitat } from './broadHabitats';
import { type BaselineHabitatType, type CreationHabitatType, type EnhancedHabitatType } from './habitatTypes';
import type { Condition } from './conditions';
import { getStrategicSignificance, type StrategicSignificance, type StrategicSignificanceDescription } from './strategicSignificanceSchema';
import { distinctivenessCategories, type SuggestedTradingActions } from './distinctivenessCategories';
import type { BespokeCompensation } from './bespokeCompensation';

export const areaSchema = v.pipe(
    v.number(),
    v.toMinValue(0),
)

// Length schema for hedgerows and watercourses (in kilometers)
export const lengthSchema = v.pipe(
    v.number(),
    v.toMinValue(0),
);

export const freeTextSchema = v.optional(v.string());

export const yearsSchema =
    v.union([
        v.pipe(
            v.number(),
            v.integer(),
            v.toMinValue(0),
            v.toMaxValue(30),
        ),
        v.literal("30+")
    ])

export function isValidHabitat(broadHabitat: BroadHabitat, habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType): boolean {
    return !!habitatByBroadAndType(broadHabitat, habitatType);
}

export function isValidIrreplaceable(broadHabitat: BroadHabitat, habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType, irreplaceable: boolean): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    if (!habitat.irreplaceable) return true
    return irreplaceable === habitat.irreplaceable;
}

export function isValidCondition(broadHabitat: BroadHabitat, habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType, condition: Condition): boolean {
    const habitat = habitatByBroadAndType(broadHabitat, habitatType);
    if (!habitat) return false

    return Object.keys(habitat.conditions).includes(condition);
}

type EnrichedHabitatData = {
    _habitat: Habitat,
    distinctiveness: Habitat['distinctivenessCategory'],
    distinctivenessScore: Habitat['distinctivenessScore'],
    // @ts-ignore-line
    conditionScore: Habitat['conditions'][Condition],
    strategicSignificanceCategory: StrategicSignificance['significance'],
    strategicSignificanceMultiplier: StrategicSignificance['multiplier'],
    requiredAction: SuggestedTradingActions,
}

export const enrichWithHabitatData = <Data extends { broadHabitat: BroadHabitat, habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType, strategicSignificance: StrategicSignificanceDescription, irreplaceableHabitat?: boolean }>(data: Data): Data & EnrichedHabitatData => {
    const habitat = habitatByBroadAndType(data.broadHabitat, data.habitatType)!;

    return {
        ...data,
        _habitat: habitat,
        distinctiveness: habitat.distinctivenessCategory,
        distinctivenessScore: habitat.distinctivenessScore,

        // @ts-ignore-line This is covered by the isValidCondition check above
        conditionScore: habitat.conditions[data.condition],

        strategicSignificanceCategory: getStrategicSignificance(data.strategicSignificance).significance,
        strategicSignificanceMultiplier: getStrategicSignificance(data.strategicSignificance).multiplier,

        requiredAction: data.irreplaceableHabitat ? distinctivenessCategories['Irreplaceable'].suggestedAction : habitat.distinctivenessTradingRules,
    }
}

export const enrichWithCreationData = <Data extends { broadHabitat: BroadHabitat; habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType; condition: string; }>(data: Data) => {
    const habitat = habitatByBroadAndType(data.broadHabitat, data.habitatType)!;

    return {
        ...data,

        // @ts-ignore-line This is covered by the isValidCondition check above
        timeToTargetCondition: habitat.temporalMultipliers[data.condition],
    }
}

/**
 * Pure calculation: derives totalHabitatUnits.
 * Returns only the computed value.
 */
export function calculateTotalHabitatUnits(input: {
    requiredAction: SuggestedTradingActions,
    area: number,
    areaRetained: number,
    areaEnhanced: number,
    bespokeCompensationAgreed: BespokeCompensation,
    baselineUnitsRetained: number,
    baselineUnitsEnhanced: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
}) {
    const bespokeRequired = input.requiredAction === "Bespoke compensation likely to be required";
    const hasRetention = input.areaRetained > 0;
    const hasEnhancement = input.areaEnhanced > 0;
    const hasBiodiversityGain = hasRetention || hasEnhancement;

    let totalHabitatUnits: number = 0;

    if (bespokeRequired && !hasBiodiversityGain && input.bespokeCompensationAgreed === "Yes") {
        totalHabitatUnits = 0;
    } else if (bespokeRequired && hasBiodiversityGain) {
        totalHabitatUnits = input.baselineUnitsRetained + input.baselineUnitsEnhanced;
    } else {
        totalHabitatUnits = input.area * input.distinctivenessScore * input.conditionScore * input.strategicSignificanceMultiplier;
    }
    return { totalHabitatUnits };
}

export function addTotalHabitatUnits<Data extends {
    requiredAction: SuggestedTradingActions,
    area: number,
    areaRetained: number,
    areaEnhanced: number,
    bespokeCompensationAgreed: BespokeCompensation,
    baselineUnitsRetained: number,
    baselineUnitsEnhanced: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
}>(data: Data) {
    return { ...data, ...calculateTotalHabitatUnits(data) };
};

import * as v from 'valibot';
import { habitatByBroadAndType } from './habitats';
import { type BroadHabitat } from './broadHabitats';
import { type BaselineHabitatType, type CreationHabitatType, type EnhancedHabitatType } from './habitatTypes';
import type { Condition } from './conditions';

export const areaSchema = v.pipe(
    v.number(),
    v.toMinValue(0),
)

export const freeTextSchema = v.optional(v.string());

export const yearsSchema = v.pipe(
    v.number(),
    v.integer(),
    v.toMinValue(0),
    v.toMaxValue(30),
)

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

import { toDecimal, type Decimal } from '../decimal';
import {
    areaBaselineCalculationFacts,
    hasAreaEnhancementTimingConflict,
} from '../areaCalculationRules';
import type {
    AreaBaselineAvailability,
    AreaBaselineCalculationInput,
    AreaCreationTimingState,
    AreaEnhancementAvailability,
    AreaEnhancementMovementInput,
    AreaEnhancementMovementResult,
    AreaEnhancementMovementRow,
} from '../areaCalculationTypes';
import { calculateAreaEnhancementMovement } from '../areaCalculationRules';

function compensationLossState(input: AreaBaselineCalculationInput, compensationApplies: boolean) {
    if (input.bespokeCompensationAgreed === 'Yes' && compensationApplies) {
        return { lossReason: 'alternative-compensation' as const, lossMessage: 'Alternative Compensation ✓' as const };
    }
    if (input.bespokeCompensationAgreed === 'Pending' && compensationApplies) {
        return {
            lossReason: 'bespoke-compensation-pending' as const,
            lossMessage: 'Bespoke compensation must be agreed ▲' as const,
        };
    }
    return {};
}

export function onSiteAreaBaselineAvailability(input: AreaBaselineCalculationInput): AreaBaselineAvailability {
    const facts = areaBaselineCalculationFacts(input);
    const lossAvailable = !facts.allocationOverrun && !facts.compensationBlocksLoss;
    const totalAvailable = !facts.uncompensatedIrreplaceableLoss;
    const unavailableResults: AreaBaselineAvailability['unavailableResults'] = {};

    if (facts.allocationOverrun) {
        unavailableResults.areaHabitatLost = 'check-data';
        unavailableResults.unitsLost = 'check-data';
    }
    if (!lossAvailable) unavailableResults.unitsLost = 'check-data';
    if (!totalAvailable) unavailableResults.totalHabitatUnits = 'blank';
    if (!totalAvailable && input.requiredAction === 'Bespoke compensation likely to be required') {
        unavailableResults.totalHabitatUnitsSRM = 'blank';
    }
    if (!totalAvailable) unavailableResults.vhdhBespokeCompensationUnits = 'blank';

    const lossState = facts.allocationOverrun ? {} : compensationLossState(input, facts.compensationApplies);
    if (facts.allocationOverrun) {
        return {
            areaHabitatLost: false,
            unitsLost: false,
            totalHabitatUnits: totalAvailable,
            totalHabitatUnitsSRM: true,
            vhdhBespokeCompensationUnits: totalAvailable,
            unavailableResults,
            rule: 'allocation-overrun',
            message: 'Error in Areas ▲',
            ...lossState,
        };
    }

    if (facts.uncompensatedIrreplaceableLoss) {
        return {
            areaHabitatLost: true,
            unitsLost: lossAvailable,
            totalHabitatUnits: false,
            totalHabitatUnitsSRM: true,
            vhdhBespokeCompensationUnits: false,
            unavailableResults,
            rule: 'irreplaceable-loss-uncompensated',
            message: 'Any loss unacceptable',
            ...lossState,
        };
    }

    return {
        areaHabitatLost: true,
        unitsLost: lossAvailable,
        totalHabitatUnits: totalAvailable,
        totalHabitatUnitsSRM: true,
        vhdhBespokeCompensationUnits: totalAvailable,
        unavailableResults,
        ...lossState,
    };
}

type BaselineAvailabilityRow = { areaCalculationAvailability?: AreaBaselineAvailability };
type NumericResultRow = { totalHabitatUnits: number; totalHabitatUnitsDecimal: Decimal };
type LossResultRow = { unitsLost: number; unitsLostDecimal: Decimal };
type CompensationResultRow = { vhdhBespokeCompensationUnits: number; vhdhBespokeCompensationUnitsDecimal: Decimal };

export function applyOnSiteBaselineTotalAvailability<T extends BaselineAvailabilityRow & NumericResultRow>(data: T) {
    return data.areaCalculationAvailability?.totalHabitatUnits === false
        ? { ...data, totalHabitatUnits: 0, totalHabitatUnitsDecimal: toDecimal(0) }
        : data;
}

export function applyOnSiteBaselineLossAvailability<T extends BaselineAvailabilityRow & LossResultRow>(data: T) {
    return data.areaCalculationAvailability?.unitsLost === false
        ? { ...data, unitsLost: 0, unitsLostDecimal: toDecimal(0) }
        : data;
}

export function applyOnSiteCompensationAvailability<T extends BaselineAvailabilityRow & CompensationResultRow>(data: T) {
    return data.areaCalculationAvailability?.vhdhBespokeCompensationUnits === false
        ? { ...data, vhdhBespokeCompensationUnits: 0, vhdhBespokeCompensationUnitsDecimal: toDecimal(0) }
        : data;
}

export function calculateOnSiteAreaEnhancementMovement(
    row: AreaEnhancementMovementRow,
): AreaEnhancementMovementResult {
    const input: AreaEnhancementMovementInput = {
        requiredAction: row.baseline.requiredAction,
        baselineLabel: row._baselineHabitat.label,
        proposedLabel: row._habitat.label,
        baselineBroadHabitat: row.baseline.broadHabitat,
        proposedBroadHabitat: row.broadHabitat,
        proposedHabitatType: row.habitatType,
        baselineDistinctivenessCategory: row._baselineHabitat.distinctivenessCategory,
        proposedDistinctivenessCategory: row._habitat.distinctivenessCategory,
        baselineDistinctivenessScore: row._baselineHabitat.distinctivenessScore,
        proposedDistinctivenessScore: row.distinctivenessScore,
        baselineCondition: row.baseline.condition,
        proposedCondition: row.condition,
        baselineConditionScore: row.baseline.conditionScore,
        proposedConditionScore: row.conditionScore,
        irreplaceableHabitat: row.baseline.irreplaceableHabitat,
        bespokeWoodlandReplacementAllowed: false,
        irreplaceableWoodlandReplacementAllowed: false,
    };
    return calculateAreaEnhancementMovement(input);
}

type OnSiteEnhancementRow = {
    habitatUnitsDelivered: number;
    habitatUnitsDeliveredDecimal: Decimal;
    habitatEnhancedInAdvance: number | '30+';
    habitatEnhancedDelay: number | '30+';
    area: number;
    baseline: { irreplaceableHabitat: boolean; broadHabitat: string };
    movementAllowed: boolean;
    conditionAllowed: boolean;
    areaCalculationAvailability?: AreaEnhancementAvailability;
};

function onSiteEnhancementRule(data: OnSiteEnhancementRow, timingAllowed: boolean): AreaEnhancementAvailability['rule'] {
    if (!data.movementAllowed) return 'invalid-enhancement-movement';
    if (
        data.baseline.irreplaceableHabitat &&
        data.baseline.broadHabitat === 'Individual trees' &&
        data.area > 0
    ) return 'irreplaceable-individual-tree-enhancement';
    if (!data.conditionAllowed) return 'invalid-enhancement-condition';
    if (!timingAllowed) return 'enhancement-timing-conflict';
    return undefined;
}

export function applyOnSiteHabitatEnhancementAvailability<T extends OnSiteEnhancementRow>(data: T) {
    const timingAllowed = !hasAreaEnhancementTimingConflict(data.habitatEnhancedInAdvance, data.habitatEnhancedDelay);
    const rawAllowed = data.movementAllowed && data.conditionAllowed && timingAllowed && !(
        data.baseline.irreplaceableHabitat &&
        data.baseline.broadHabitat === 'Individual trees' &&
        data.area > 0
    );
    const unavailableResults: AreaEnhancementAvailability['unavailableResults'] = {};
    if (!rawAllowed) unavailableResults.habitatUnitsDelivered = 'blank';
    if (!(data.movementAllowed && data.conditionAllowed && timingAllowed)) {
        unavailableResults.habitatUnitsDeliveredWithSpatialRisk = 'blank';
    }
    const rule = onSiteEnhancementRule(data, timingAllowed);
    const message = rule === 'irreplaceable-individual-tree-enhancement'
        ? 'Error - you cannot enhance irreplaceable individual trees ▲'
        : rule === 'enhancement-timing-conflict'
          ? 'Error -both advance and delayed habitat creation ▲'
          : rule === 'invalid-enhancement-condition'
            ? 'Error - condition cannot be reduced ▲'
            : rule === 'invalid-enhancement-movement'
              ? 'Check Data ⚠'
              : undefined;

    return {
        ...data,
        ...(rawAllowed ? {} : { habitatUnitsDelivered: 0, habitatUnitsDeliveredDecimal: toDecimal(0) }),
        areaCalculationAvailability: {
            ...data.areaCalculationAvailability,
            habitatUnitsDelivered: rawAllowed,
            habitatUnitsDeliveredWithSpatialRisk: data.movementAllowed && data.conditionAllowed && timingAllowed,
            unavailableResults,
            ...(rule ? { rule, message } : {}),
        } satisfies AreaEnhancementAvailability,
    };
}

export function applyOnSiteHabitatCreationTiming<T extends {
    habitatCreationInAdvance: number | '30+';
    habitatCreationDelay: number | '30+';
    habitatUnitsDelivered: number;
    habitatUnitsDeliveredDecimal: Decimal;
}>(data: T) {
    const forbidden = hasAreaEnhancementTimingConflict(data.habitatCreationInAdvance, data.habitatCreationDelay);
    const creationTiming: AreaCreationTimingState = {
        rule: 'habitat-creation-timing-conflict',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error -both advance and delayed habitat creation ▲' as const } : {}),
        unavailableResults: forbidden
            ? {
                finalTimeToTargetCondition: 'check-data',
                finalTimeToTargetMultiplier: 'check-data',
                habitatUnitsDelivered: 'blank',
            }
            : {},
    };
    return {
        ...data,
        ...(forbidden ? { habitatUnitsDelivered: 0, habitatUnitsDeliveredDecimal: toDecimal(0) } : {}),
        creationTiming,
    };
}

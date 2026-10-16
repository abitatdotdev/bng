import { toDecimal, type Decimal } from '../decimal';
import {
    areaBaselineCalculationFacts,
    calculateAreaEnhancementMovement,
    hasAreaEnhancementTimingConflict,
    isAreaReferencePresent,
} from '../areaCalculationRules';
import type {
    AreaBaselineAvailability,
    AreaBaselineCalculationInput,
    AreaCreationAvailability,
    AreaCreationTimingState,
    AreaEnhancementAvailability,
    AreaEnhancementMovementInput,
    AreaEnhancementMovementResult,
    AreaEnhancementMovementRow,
} from '../areaCalculationTypes';
import type { SpatialRiskCategory } from '../spatialRisk';

type OffSiteAreaBaselineInput = AreaBaselineCalculationInput & { offSiteReferenceNumber?: string };

function compensationLossState(input: OffSiteAreaBaselineInput, compensationApplies: boolean) {
    if (input.bespokeCompensationAgreed === 'Yes' && compensationApplies) {
        return { lossReason: 'alternative-compensation' as const, lossMessage: 'Alternative Compensation ✓' as const };
    }
    if (input.bespokeCompensationAgreed === 'Pending' && compensationApplies) {
        return {
            lossReason: 'bespoke-compensation-pending' as const,
            lossMessage: 'Bespoke compensation must be agreed  ▲' as const,
        };
    }
    return {};
}

export function offSiteAreaBaselineAvailability(input: OffSiteAreaBaselineInput): AreaBaselineAvailability {
    const facts = areaBaselineCalculationFacts(input);
    const referencePresent = isAreaReferencePresent(input.offSiteReferenceNumber);
    const lossAvailable = !facts.allocationOverrun && !facts.compensationBlocksLoss;
    const totalAvailable = referencePresent && !facts.uncompensatedIrreplaceableLoss;
    const spatialTotalAvailable = referencePresent || input.requiredAction !== 'Bespoke compensation likely to be required';
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
            totalHabitatUnitsSRM: spatialTotalAvailable,
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
            totalHabitatUnitsSRM: spatialTotalAvailable,
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
        totalHabitatUnitsSRM: spatialTotalAvailable,
        vhdhBespokeCompensationUnits: totalAvailable,
        unavailableResults,
        ...lossState,
    };
}

type BaselineAvailabilityRow = { areaCalculationAvailability?: AreaBaselineAvailability };
type NumericResultRow = { totalHabitatUnits: number; totalHabitatUnitsDecimal: Decimal };
type SpatialTotalResultRow = { totalHabitatUnitsSRM: number; totalHabitatUnitsSRMDecimal: Decimal };
type LossResultRow = { unitsLost: number; unitsLostDecimal: Decimal };
type CompensationResultRow = { vhdhBespokeCompensationUnits: number; vhdhBespokeCompensationUnitsDecimal: Decimal };

export function applyOffSiteBaselineTotalAvailability<T extends BaselineAvailabilityRow & NumericResultRow>(data: T) {
    return data.areaCalculationAvailability?.totalHabitatUnits === false
        ? { ...data, totalHabitatUnits: 0, totalHabitatUnitsDecimal: toDecimal(0) }
        : data;
}

export function applyOffSiteBaselineSpatialTotalAvailability<T extends BaselineAvailabilityRow & SpatialTotalResultRow>(data: T) {
    return data.areaCalculationAvailability?.totalHabitatUnitsSRM === false
        ? { ...data, totalHabitatUnitsSRM: 0, totalHabitatUnitsSRMDecimal: toDecimal(0) }
        : data;
}

export function applyOffSiteBaselineLossAvailability<T extends BaselineAvailabilityRow & LossResultRow>(data: T) {
    return data.areaCalculationAvailability?.unitsLost === false
        ? { ...data, unitsLost: 0, unitsLostDecimal: toDecimal(0) }
        : data;
}

export function applyOffSiteCompensationAvailability<T extends BaselineAvailabilityRow & CompensationResultRow>(data: T) {
    return data.areaCalculationAvailability?.vhdhBespokeCompensationUnits === false
        ? { ...data, vhdhBespokeCompensationUnits: 0, vhdhBespokeCompensationUnitsDecimal: toDecimal(0) }
        : data;
}

export function calculateOffSiteAreaEnhancementMovement(
    row: AreaEnhancementMovementRow,
): AreaEnhancementMovementResult {
    const woodlandOtherBaseline = row._baselineHabitat.label.slice(0, 27) === 'Woodland and forest - Other';
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
        bespokeWoodlandReplacementAllowed: woodlandOtherBaseline,
        irreplaceableWoodlandReplacementAllowed:
            woodlandOtherBaseline && row.broadHabitat.slice(0, 8) === 'Woodland',
    };
    return calculateAreaEnhancementMovement(input);
}

type OffSiteEnhancementRow = {
    habitatUnitsDelivered: number;
    habitatUnitsDeliveredDecimal: Decimal;
    habitatUnitsDeliveredWithSpatialRisk: number;
    habitatUnitsDeliveredWithSpatialRiskDecimal: Decimal;
    habitatEnhancedInAdvance: number | '30+';
    habitatEnhancedDelay: number | '30+';
    area: number;
    baseline: { irreplaceableHabitat: boolean; broadHabitat: string };
    _baselineHabitat: { label: string };
    _habitat: { label: string };
    offSiteReferenceNumber?: string;
    movementAllowed: boolean;
    conditionAllowed: boolean;
    areaCalculationAvailability?: AreaEnhancementAvailability;
};

function offSiteEnhancementRule(data: OffSiteEnhancementRow, timingAllowed: boolean, referencePresent: boolean): AreaEnhancementAvailability['rule'] {
    if (!data.movementAllowed) return 'invalid-enhancement-movement';
    if (data.baseline.irreplaceableHabitat && data.baseline.broadHabitat === 'Individual trees' && data.area > 0) {
        return 'irreplaceable-individual-tree-enhancement';
    }
    if (!data.conditionAllowed) return 'invalid-enhancement-condition';
    if (!timingAllowed) return 'enhancement-timing-conflict';
    if (!referencePresent) return 'off-site-reference-required';
    return undefined;
}

function enhancementMessage(rule: AreaEnhancementAvailability['rule']): AreaEnhancementAvailability['message'] {
    if (rule === 'irreplaceable-individual-tree-enhancement') {
        return 'Error - you cannot enhance irreplaceable individual trees ▲';
    }
    if (rule === 'off-site-reference-required') return 'Off-site reference required ▲';
    if (rule === 'enhancement-timing-conflict') return 'Error -both advance and delayed habitat creation ▲';
    if (rule === 'invalid-enhancement-condition') return 'Error - condition cannot be reduced ▲';
    if (rule === 'invalid-enhancement-movement') return 'Check Data ⚠';
    return undefined;
}

export function applyOffSiteHabitatEnhancementAvailability<T extends OffSiteEnhancementRow>(data: T) {
    const timingAllowed = !hasAreaEnhancementTimingConflict(data.habitatEnhancedInAdvance, data.habitatEnhancedDelay);
    const referencePresent = isAreaReferencePresent(data.offSiteReferenceNumber);
    const semanticallyAvailable = data.movementAllowed && data.conditionAllowed && timingAllowed;
    const rawContributionAllowed = !(
        data.baseline.irreplaceableHabitat &&
        data.baseline.broadHabitat === 'Individual trees' &&
        data.area > 0
    );
    const preserveSpatialContribution =
        data.baseline.irreplaceableHabitat &&
        data.baseline.broadHabitat === 'Individual trees' &&
        data._baselineHabitat.label !== data._habitat.label;
    const spatialAvailable = preserveSpatialContribution
        ? timingAllowed && data.movementAllowed
        : semanticallyAvailable;
    const rawAvailable = semanticallyAvailable && referencePresent && rawContributionAllowed;
    const unavailableResults: AreaEnhancementAvailability['unavailableResults'] = {};
    if (!rawAvailable) unavailableResults.habitatUnitsDelivered = 'blank';
    if (!preserveSpatialContribution && !spatialAvailable) {
        unavailableResults.habitatUnitsDeliveredWithSpatialRisk = 'blank';
    }
    const rule = offSiteEnhancementRule(data, timingAllowed, referencePresent);

    return {
        ...data,
        ...(rawAvailable ? {} : { habitatUnitsDelivered: 0, habitatUnitsDeliveredDecimal: toDecimal(0) }),
        ...(spatialAvailable ? {} : {
            habitatUnitsDeliveredWithSpatialRisk: 0,
            habitatUnitsDeliveredWithSpatialRiskDecimal: toDecimal(0),
        }),
        areaCalculationAvailability: {
            ...data.areaCalculationAvailability,
            habitatUnitsDelivered: rawAvailable,
            habitatUnitsDeliveredWithSpatialRisk: spatialAvailable,
            unavailableResults,
            ...(rule ? { rule, message: enhancementMessage(rule) } : {}),
        } satisfies AreaEnhancementAvailability,
    };
}

type OffSiteCreationRow = {
    habitatCreationInAdvance: number | '30+';
    habitatCreationDelay: number | '30+';
    habitatUnitsDelivered: number;
    habitatUnitsDeliveredDecimal: Decimal;
    habitatUnitsDeliveredWithSpatialRisk: number;
    habitatUnitsDeliveredWithSpatialRiskDecimal: Decimal;
    finalTimeToTargetCondition: number | '30+' | 'Not Possible ▲';
    finalTimeToTargetMultiplier: number | 'Not Possible ▲' | undefined;
    spatialRiskCategory?: SpatialRiskCategory;
    offSiteReferenceNumber?: string;
    creationTiming?: AreaCreationTimingState;
    areaCalculationAvailability?: AreaCreationAvailability;
};

export function applyOffSiteHabitatCreationAvailability<T extends OffSiteCreationRow>(data: T) {
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
                habitatUnitsDeliveredWithSpatialRisk: 'blank',
            }
            : {},
    };
    const missingReference = Boolean(data.spatialRiskCategory) && !isAreaReferencePresent(data.offSiteReferenceNumber);
    const unavailableResults: AreaCreationAvailability['unavailableResults'] = {
        ...creationTiming.unavailableResults,
        ...data.areaCalculationAvailability?.unavailableResults,
        ...(missingReference ? { habitatUnitsDelivered: 'blank' } : {}),
    };
    const rule = missingReference
        ? 'off-site-reference-required'
        : data.areaCalculationAvailability?.rule ?? creationTiming.rule;
    const message = missingReference
        ? 'Off-site reference required ▲'
        : data.areaCalculationAvailability?.message ?? creationTiming.message;
    const availability: AreaCreationAvailability = {
        ...data.areaCalculationAvailability,
        habitatUnitsDelivered: !missingReference && unavailableResults.habitatUnitsDelivered !== 'blank',
        habitatUnitsDeliveredWithSpatialRisk: unavailableResults.habitatUnitsDeliveredWithSpatialRisk !== 'blank',
        unavailableResults,
        ...(rule ? { rule } : {}),
        status: creationTiming.status,
        ...(message ? { message } : {}),
    };

    return {
        ...data,
        ...(forbidden ? {
            habitatUnitsDelivered: 0,
            habitatUnitsDeliveredDecimal: toDecimal(0),
            habitatUnitsDeliveredWithSpatialRisk: 0,
            habitatUnitsDeliveredWithSpatialRiskDecimal: toDecimal(0),
        } : {}),
        ...(missingReference ? { habitatUnitsDelivered: 0, habitatUnitsDeliveredDecimal: toDecimal(0) } : {}),
        creationTiming,
        areaCalculationAvailability: availability,
    };
}

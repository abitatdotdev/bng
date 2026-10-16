import { Decimal, type Quantity, toDecimal } from './decimal';
import type {
    AreaBaselineAvailability,
    AreaBaselineRuleInput,
    AreaConditionChange,
    AreaCreationAvailability,
    AreaCreationTimingState,
    AreaDistinctivenessChange,
    AreaEnhancementAvailability,
    AreaEnhancementAvailabilityInput,
    AreaEnhancementAvailabilityOptions,
    AreaEnhancementMessage,
    AreaEnhancementMovementInput,
    AreaEnhancementMovementResult,
    AreaMovementError,
} from './areaCalculationTypes';
import type { SpatialRiskCategory } from './spatialRisk';

export type { AreaBaselineAvailability } from './areaCalculationTypes';

export const areaCalculationAvailabilityKey = 'areaCalculationAvailability' as const;

type AreaBaselineCalculationInput = AreaBaselineRuleInput & {
    area: Quantity;
    areaRetained: Quantity;
    areaEnhanced: Quantity;
    areaDecimal?: Decimal;
    areaRetainedDecimal?: Decimal;
    areaEnhancedDecimal?: Decimal;
};

type AreaEnhancementUnitRow = {
    habitatUnitsDelivered: number;
    habitatUnitsDeliveredDecimal: Decimal;
    habitatUnitsDeliveredWithSpatialRisk?: number;
    habitatUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
    offSiteReferenceNumber?: string;
    areaCalculationAvailability?: AreaEnhancementAvailability;
};

type AreaCreationUnitRow = {
    habitatUnitsDelivered: number;
    habitatUnitsDeliveredDecimal: Decimal;
    offSiteReferenceNumber?: string;
    spatialRiskCategory?: SpatialRiskCategory;
    areaCalculationAvailability?: AreaCreationAvailability;
    creationTiming?: AreaCreationTimingState;
};

function areaAmount(value: Quantity, decimalValue?: Decimal): Decimal {
    return decimalValue ?? toDecimal(value);
}

export function isAreaAllocationOverrun(input: Pick<AreaBaselineCalculationInput, 'area' | 'areaRetained' | 'areaEnhanced' | 'areaDecimal' | 'areaRetainedDecimal' | 'areaEnhancedDecimal'>): boolean {
    const allocated = areaAmount(input.areaRetained, input.areaRetainedDecimal)
        .plus(areaAmount(input.areaEnhanced, input.areaEnhancedDecimal));
    return allocated.greaterThan(areaAmount(input.area, input.areaDecimal));
}

function hasAreaBaselineLoss(input: AreaBaselineCalculationInput): boolean {
    return areaAmount(input.area, input.areaDecimal)
        .minus(areaAmount(input.areaRetained, input.areaRetainedDecimal))
        .minus(areaAmount(input.areaEnhanced, input.areaEnhancedDecimal))
        .greaterThan(0);
}

function baselineCompensationApplies(input: AreaBaselineRuleInput): boolean {
    return input.requiredAction === 'Same habitat required – bespoke compensation option ⚠' ||
        input.requiredAction === 'Bespoke compensation likely to be required';
}

function baselineCompensationBlocksLoss(input: AreaBaselineRuleInput): boolean {
    if (!baselineCompensationApplies(input)) return false;
    return input.bespokeCompensationAgreed === 'Yes' || input.bespokeCompensationAgreed === 'Pending';
}

function isBaselineReferencePresent(reference: string | undefined): boolean {
    return reference !== '' && reference !== undefined;
}

function compensationLossState(input: AreaBaselineCalculationInput): Pick<AreaBaselineAvailability, 'lossReason' | 'lossMessage'> {
    if (isAreaAllocationOverrun(input) || !baselineCompensationApplies(input)) return {};

    if (input.bespokeCompensationAgreed === 'Yes') {
        return { lossReason: 'alternative-compensation', lossMessage: 'Alternative Compensation ✓' };
    }

    if (input.bespokeCompensationAgreed !== 'Pending') return {};

    return input.offSite
        ? { lossReason: 'bespoke-compensation-pending', lossMessage: 'Bespoke compensation must be agreed  ▲' }
        : { lossReason: 'bespoke-compensation-pending', lossMessage: 'Bespoke compensation must be agreed ▲' };
}

function baselineUncompensatedLoss(input: AreaBaselineCalculationInput, hasLoss: boolean): boolean {
    if (!input.irreplaceableHabitat || !hasLoss) return false;
    return input.bespokeCompensationAgreed !== 'Yes' && input.bespokeCompensationAgreed !== 'Pending';
}

function baselineUnavailableResults(
    input: AreaBaselineCalculationInput,
    overrun: boolean,
    totalAvailable: boolean,
    lossAvailable: boolean,
): AreaBaselineAvailability['unavailableResults'] {
    const unavailableResults: AreaBaselineAvailability['unavailableResults'] = {};

    if (overrun) {
        unavailableResults.areaHabitatLost = 'check-data';
        unavailableResults.unitsLost = 'check-data';
    }
    if (!lossAvailable) unavailableResults.unitsLost = 'check-data';
    if (!totalAvailable) unavailableResults.totalHabitatUnits = 'blank';
    if (
        !totalAvailable &&
        input.requiredAction === 'Bespoke compensation likely to be required'
    ) {
        unavailableResults.totalHabitatUnitsSRM = 'blank';
    }
    if (!totalAvailable) unavailableResults.vhdhBespokeCompensationUnits = 'blank';

    return unavailableResults;
}

export function areaBaselineAvailability(input: AreaBaselineCalculationInput): AreaBaselineAvailability {
    const overrun = isAreaAllocationOverrun(input);
    const hasLoss = hasAreaBaselineLoss(input);
    const compensationBlocksLoss = baselineCompensationBlocksLoss(input);
    const referencePresent = isBaselineReferencePresent(input.offSiteReferenceNumber);
    const compensationUnacceptable = baselineUncompensatedLoss(input, hasLoss);
    const totalAvailable = !(input.offSite && !referencePresent) && !compensationUnacceptable;
    const lossAvailable = !overrun && !(hasLoss && compensationBlocksLoss);
    const totalHabitatUnitsSRMAvailable = !(
        input.offSite &&
        !referencePresent &&
        input.requiredAction === 'Bespoke compensation likely to be required'
    );
    const unavailableResults = baselineUnavailableResults(input, overrun, totalAvailable, lossAvailable);
    const lossState = compensationLossState(input);

    if (overrun) {
        return {
            areaHabitatLost: false,
            unitsLost: false,
            totalHabitatUnits: totalAvailable,
            totalHabitatUnitsSRM: totalHabitatUnitsSRMAvailable,
            vhdhBespokeCompensationUnits: totalAvailable,
            unavailableResults,
            rule: 'allocation-overrun',
            message: 'Error in Areas ▲',
            ...lossState,
        };
    }

    if (compensationUnacceptable) {
        return {
            areaHabitatLost: true,
            unitsLost: lossAvailable,
            totalHabitatUnits: false,
            totalHabitatUnitsSRM: totalHabitatUnitsSRMAvailable,
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
        totalHabitatUnitsSRM: totalHabitatUnitsSRMAvailable,
        vhdhBespokeCompensationUnits: totalAvailable,
        unavailableResults,
        ...lossState,
    };
}

export function isAreaReferencePresent(reference: string | undefined): boolean {
    return reference !== '' && reference !== undefined;
}

export function hasAreaEnhancementTimingConflict(advance: number | '30+', delay: number | '30+'): boolean {
    const hasAdvance = advance === '30+' || advance > 0;
    const hasDelay = delay === '30+' || delay > 0;
    return hasAdvance && hasDelay;
}

function isSameDistinctivenessTradingAction(action: AreaEnhancementMovementInput['requiredAction']): boolean {
    return action.startsWith('Same d');
}

function isSameBroadHabitatTradingAction(action: AreaEnhancementMovementInput['requiredAction']): boolean {
    return action.startsWith('Same b');
}

function isSameHabitatTradingAction(action: AreaEnhancementMovementInput['requiredAction']): boolean {
    return action.startsWith('Same h');
}

function isBespokeTradingAction(action: AreaEnhancementMovementInput['requiredAction']): boolean {
    return action.startsWith('Bespok');
}

function hasReducedDistinctiveness(input: AreaEnhancementMovementInput): boolean {
    return input.proposedDistinctivenessScore < input.baselineDistinctivenessScore;
}

function isOffSiteWoodlandOtherException(input: AreaEnhancementMovementInput): boolean {
    return input.offSite &&
        input.baselineLabel.slice(0, 27) === 'Woodland and forest - Other' &&
        input.proposedBroadHabitat.slice(0, 8) === 'Woodland';
}

function isAllowedBespokeWoodlandReplacement(input: AreaEnhancementMovementInput): boolean {
    return input.offSite && input.baselineLabel.slice(0, 27) === 'Woodland and forest - Other';
}

function calculateMovementError(input: AreaEnhancementMovementInput): AreaMovementError | undefined {
    const reduced = hasReducedDistinctiveness(input);

    if (isSameDistinctivenessTradingAction(input.requiredAction) && reduced) {
        return 'Error - Trading rules not satisfied ▲';
    }
    if (
        isSameBroadHabitatTradingAction(input.requiredAction) &&
        input.baselineBroadHabitat.slice(0, 5) !== input.proposedBroadHabitat.slice(0, 5) &&
        reduced
    ) {
        return 'Error - Trading rules not satisfied ▲';
    }
    if (isSameHabitatTradingAction(input.requiredAction) && input.baselineLabel !== input.proposedLabel) {
        return 'Error - Trading rules not satisfied ▲';
    }
    if (
        isBespokeTradingAction(input.requiredAction) &&
        input.baselineLabel !== input.proposedLabel &&
        !isAllowedBespokeWoodlandReplacement(input)
    ) {
        return 'Error - Trading rules not satisfied ▲';
    }
    if (reduced) return 'Error Trading Down ▲';
    if (
        input.proposedHabitatType === 'Littoral seagrass' &&
        input.baselineLabel !== 'Intertidal sediment - Littoral seagrass' &&
        input.baselineLabel !== 'Intertidal sediment - Littoral sand'
    ) {
        return 'Error - Enhancement not possible ▲';
    }
    if (
        input.proposedHabitatType === 'Artificial hard structures with integrated greening of grey infrastructure (IGGI)' &&
        input.baselineLabel !== 'Intertidal hard structures - Artificial hard structures with integrated greening of grey infrastructure (IGGI)' &&
        input.baselineLabel !== 'Intertidal hard structures - Artificial hard structures' &&
        input.baselineLabel !== 'Intertidal hard structures - Artificial features of hard structures'
    ) {
        return 'Error - Enhancement not possible ▲';
    }

    return undefined;
}

function distinctivenessMovementLabel(
    input: AreaEnhancementMovementInput,
    error: AreaMovementError | undefined,
): AreaDistinctivenessChange {
    if (error) return error;
    return `${input.baselineDistinctivenessCategory} - ${input.proposedDistinctivenessCategory}`;
}

function calculateConditionChange(
    input: AreaEnhancementMovementInput,
    distinctivenessChange: AreaDistinctivenessChange,
): AreaConditionChange {
    const differentHabitat = input.baselineLabel !== input.proposedLabel;
    const sameDistinctiveness = input.baselineDistinctivenessScore === input.proposedDistinctivenessScore;
    const specialWoodland = isOffSiteWoodlandOtherException(input);

    if (!specialWoodland && input.irreplaceableHabitat && differentHabitat) {
        return 'Error you cannot replace an irreplaceable habitat ▲';
    }
    if (
        input.baselineLabel.slice(0, 55) !== input.proposedLabel.slice(0, 55) &&
        distinctivenessChange === 'High - High'
    ) {
        return 'Error - Not like for like ▲';
    }
    const conditionReduced = input.baselineConditionScore !== undefined &&
        input.proposedConditionScore !== undefined &&
        input.baselineConditionScore > input.proposedConditionScore;

    if (sameDistinctiveness && conditionReduced) {
        return 'Error - Can not reduce condition ▲';
    }
    if (
        !specialWoodland &&
        sameDistinctiveness &&
        input.baselineConditionScore === input.proposedConditionScore
    ) {
        return 'Error - No enhancement ▲';
    }
    if (conditionReduced) {
        return 'Error - condition cannot be reduced ▲';
    }
    if (hasReducedDistinctiveness(input)) return 'Error Trading Down ▲';
    if (differentHabitat && input.baselineDistinctivenessScore < input.proposedDistinctivenessScore) {
        return `Lower Distinctiveness Habitat - ${input.proposedCondition}`;
    }

    return `${input.baselineCondition} - ${input.proposedCondition}`;
}

export function calculateAreaEnhancementMovement(input: AreaEnhancementMovementInput): AreaEnhancementMovementResult {
    const movementError = calculateMovementError(input);
    const distinctivenessChange = distinctivenessMovementLabel(input, movementError);
    const conditionChange = calculateConditionChange(input, distinctivenessChange);

    return {
        distinctivenessChange,
        conditionChange,
        enhancementPathway: conditionChange,
        movementAllowed: movementError === undefined,
        conditionAllowed: !conditionChange.startsWith('Error'),
    };
}

export function areaEnhancementAvailability(input: AreaEnhancementAvailabilityInput): AreaEnhancementAvailability {
    const semanticallyAvailable = input.movementAllowed && input.conditionAllowed && input.timingAllowed;
    const rawAvailable = semanticallyAvailable && input.rawReferencePresent !== false;

    return {
        habitatUnitsDelivered: rawAvailable,
        habitatUnitsDeliveredWithSpatialRisk: semanticallyAvailable,
        unavailableResults: unavailableEnhancementResults(semanticallyAvailable, rawAvailable, true),
    };
}

function unavailableEnhancementResults(
    semanticallyAvailable: boolean,
    rawAvailable: boolean,
    includeSpatialResult: boolean,
): AreaEnhancementAvailability['unavailableResults'] {
    const unavailableResults: AreaEnhancementAvailability['unavailableResults'] = {};
    if (!rawAvailable) unavailableResults.habitatUnitsDelivered = 'blank';
    if (includeSpatialResult && !semanticallyAvailable) {
        unavailableResults.habitatUnitsDeliveredWithSpatialRisk = 'blank';
    }
    return unavailableResults;
}

function areaEnhancementRule(input: AreaEnhancementAvailabilityOptions, rawReferencePresent: boolean): AreaEnhancementAvailability['rule'] {
    if (!input.movementAllowed) return 'invalid-enhancement-movement';
    if (input.rawContributionAllowed === false) return 'irreplaceable-individual-tree-enhancement';
    if (!input.conditionAllowed) return 'invalid-enhancement-condition';
    if (!input.timingAllowed) return 'enhancement-timing-conflict';
    if (!rawReferencePresent) return 'off-site-reference-required';
    return undefined;
}

function areaEnhancementRuleMessage(rule: AreaEnhancementAvailability['rule']): AreaEnhancementMessage | undefined {
    if (rule === 'irreplaceable-individual-tree-enhancement') {
        return 'Error - you cannot enhance irreplaceable individual trees ▲';
    }
    if (rule === 'off-site-reference-required') return 'Off-site reference required ▲';
    if (rule === 'enhancement-timing-conflict') return 'Error -both advance and delayed habitat creation ▲';
    if (rule === 'invalid-enhancement-condition') return 'Error - condition cannot be reduced ▲';
    if (rule === 'invalid-enhancement-movement') return 'Check Data ⚠';
    return undefined;
}

export function applyAreaEnhancementAvailability<T extends AreaEnhancementUnitRow>(
    data: T,
    input: AreaEnhancementAvailabilityOptions,
) {
    const rawReferencePresent = !input.requiresReference || isAreaReferencePresent(data.offSiteReferenceNumber);
    const availability = areaEnhancementAvailability({ ...input, rawReferencePresent });

    if (input.preserveSpatialContribution && data.habitatUnitsDeliveredWithSpatialRisk !== undefined) {
        availability.habitatUnitsDeliveredWithSpatialRisk = input.timingAllowed && input.movementAllowed;
    }

    const rawContributionAllowed = input.rawContributionAllowed !== false;
    const rawAvailable = availability.habitatUnitsDelivered && rawContributionAllowed;
    const spatialAvailable = availability.habitatUnitsDeliveredWithSpatialRisk;
    const unavailableResults = unavailableEnhancementResults(
        spatialAvailable,
        rawAvailable,
        !input.preserveSpatialContribution,
    );
    const rule = areaEnhancementRule(input, rawReferencePresent);
    const message = areaEnhancementRuleMessage(rule);

    return {
        ...data,
        ...(rawAvailable ? {} : { habitatUnitsDelivered: 0, habitatUnitsDeliveredDecimal: toDecimal(0) }),
        ...(spatialAvailable || data.habitatUnitsDeliveredWithSpatialRisk === undefined
            ? {}
            : { habitatUnitsDeliveredWithSpatialRisk: 0, habitatUnitsDeliveredWithSpatialRiskDecimal: toDecimal(0) }),
        areaCalculationAvailability: {
            ...data.areaCalculationAvailability,
            ...availability,
            habitatUnitsDelivered: rawAvailable,
            unavailableResults,
            rule,
            message,
        } satisfies AreaEnhancementAvailability,
    };
}

function creationUnavailableResults(
    timingResults: AreaCreationTimingState['unavailableResults'] | undefined,
    areaResults: AreaCreationAvailability['unavailableResults'] | undefined,
    missingReference: boolean,
): AreaCreationAvailability['unavailableResults'] {
    return {
        ...timingResults,
        ...areaResults,
        ...(missingReference ? { habitatUnitsDelivered: 'blank' } : {}),
    };
}

function areaCreationReferenceMessage(
    missingReference: boolean,
): AreaCreationAvailability['message'] {
    if (missingReference) return 'Off-site reference required ▲';
    return undefined;
}

export function applyAreaRawReferenceAvailability<T extends AreaCreationUnitRow>(data: T) {
    const missingReference = Boolean(data.spatialRiskCategory) && !isAreaReferencePresent(data.offSiteReferenceNumber);
    const unavailableResults = creationUnavailableResults(
        data.creationTiming?.unavailableResults,
        data.areaCalculationAvailability?.unavailableResults,
        missingReference,
    );
    const rule = missingReference
        ? 'off-site-reference-required'
        : data.areaCalculationAvailability?.rule ?? data.creationTiming?.rule;
    const message = areaCreationReferenceMessage(missingReference) ??
        data.areaCalculationAvailability?.message ?? data.creationTiming?.message;
    const availability: AreaCreationAvailability = {
        ...data.areaCalculationAvailability,
        habitatUnitsDelivered: !missingReference && unavailableResults.habitatUnitsDelivered !== 'blank',
        habitatUnitsDeliveredWithSpatialRisk: unavailableResults.habitatUnitsDeliveredWithSpatialRisk !== 'blank',
        unavailableResults,
        ...(rule ? { rule } : {}),
        ...(data.creationTiming?.status ? { status: data.creationTiming.status } : {}),
        ...(message ? { message } : {}),
    };

    if (!missingReference) return { ...data, areaCalculationAvailability: availability };

    return {
        ...data,
        habitatUnitsDelivered: 0,
        habitatUnitsDeliveredDecimal: toDecimal(0),
        areaCalculationAvailability: availability,
    };
}

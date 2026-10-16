import { Decimal, type Quantity, toDecimal } from './decimal';
import type {
    AreaBaselineCalculationInput,
    AreaEnhancementMovementInput,
    AreaEnhancementMovementResult,
    AreaConditionChange,
    AreaDistinctivenessChange,
    AreaMovementError,
} from './areaCalculationTypes';

function areaAmount(value: Quantity, decimalValue?: Decimal): Decimal {
    return decimalValue ?? toDecimal(value);
}

export function isAreaAllocationOverrun(input: Pick<AreaBaselineCalculationInput, 'area' | 'areaRetained' | 'areaEnhanced' | 'areaDecimal' | 'areaRetainedDecimal' | 'areaEnhancedDecimal'>): boolean {
    const allocated = areaAmount(input.areaRetained, input.areaRetainedDecimal)
        .plus(areaAmount(input.areaEnhanced, input.areaEnhancedDecimal));
    return allocated.greaterThan(areaAmount(input.area, input.areaDecimal));
}

export function hasAreaBaselineLoss(input: AreaBaselineCalculationInput): boolean {
    return areaAmount(input.area, input.areaDecimal)
        .minus(areaAmount(input.areaRetained, input.areaRetainedDecimal))
        .minus(areaAmount(input.areaEnhanced, input.areaEnhancedDecimal))
        .greaterThan(0);
}

export function baselineCompensationApplies(input: AreaBaselineCalculationInput): boolean {
    return input.requiredAction === 'Same habitat required – bespoke compensation option ⚠' ||
        input.requiredAction === 'Bespoke compensation likely to be required';
}

export function baselineCompensationBlocksLoss(input: AreaBaselineCalculationInput): boolean {
    if (!baselineCompensationApplies(input)) return false;
    return input.bespokeCompensationAgreed === 'Yes' || input.bespokeCompensationAgreed === 'Pending';
}

export function hasUncompensatedIrreplaceableAreaLoss(input: AreaBaselineCalculationInput, hasLoss: boolean): boolean {
    if (!input.irreplaceableHabitat || !hasLoss) return false;
    return input.bespokeCompensationAgreed !== 'Yes' && input.bespokeCompensationAgreed !== 'Pending';
}

export function areaBaselineCalculationFacts(input: AreaBaselineCalculationInput) {
    const allocationOverrun = isAreaAllocationOverrun(input);
    const hasLoss = hasAreaBaselineLoss(input);
    const compensationApplies = baselineCompensationApplies(input);
    const compensationBlocksLoss = hasLoss && baselineCompensationBlocksLoss(input);

    return {
        allocationOverrun,
        hasLoss,
        compensationApplies,
        compensationBlocksLoss,
        uncompensatedIrreplaceableLoss: hasUncompensatedIrreplaceableAreaLoss(input, hasLoss),
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
        !input.bespokeWoodlandReplacementAllowed
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
    const specialWoodland = input.irreplaceableWoodlandReplacementAllowed;

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

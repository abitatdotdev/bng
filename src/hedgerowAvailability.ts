import type { Decimal } from './decimal';
import type { HedgerowCondition } from './hedgerowCondition';
import type { Hedgerow } from './hedgerows';
import type { TimingStandard, TimingYear } from './linearTiming';
import { enhancementConditionAllowed } from './enhancementCondition';

export type HedgerowBaselineAllocation = {
    rule: 'hedgerow-baseline-allocation';
    status: 'allowed' | 'over-allocated';
    allocationState: 'allowed' | 'over-allocated';
    overAllocated: boolean;
    message?: 'Retained and enhanced lengths cannot exceed total length';
};

export type HedgerowEnhancementQuality = {
    rule: 'hedgerow-enhancement-quality';
    status: 'allowed' | 'no-enhancement';
    message?: 'Error - No enhancement ▲';
};

export type HedgerowConditionScore = Hedgerow['conditions'][HedgerowCondition];
export type HedgerowDistinctivenessScore = Hedgerow['distinctivenessScore'];

export type HedgerowAllocationLengths = {
    lengthDecimal: Decimal;
    lengthRetainedDecimal: Decimal;
    lengthEnhancedDecimal: Decimal;
};

export function assessHedgerowBaselineAllocation(
    lengths: HedgerowAllocationLengths,
): HedgerowBaselineAllocation {
    const overAllocated = lengths.lengthRetainedDecimal.plus(lengths.lengthEnhancedDecimal).gt(lengths.lengthDecimal);
    return {
        rule: 'hedgerow-baseline-allocation',
        status: overAllocated ? 'over-allocated' : 'allowed',
        allocationState: overAllocated ? 'over-allocated' : 'allowed',
        overAllocated,
        ...(overAllocated ? { message: 'Retained and enhanced lengths cannot exceed total length' as const } : {}),
    };
}

export type HedgerowEnhancementScores = {
    baselineDistinctivenessScore: HedgerowDistinctivenessScore;
    proposedDistinctivenessScore: HedgerowDistinctivenessScore;
    baselineConditionScore: HedgerowConditionScore;
    proposedConditionScore: HedgerowConditionScore;
};

export function assessHedgerowEnhancementQuality(scores: HedgerowEnhancementScores): HedgerowEnhancementQuality {
    const noEnhancement = scores.baselineDistinctivenessScore === scores.proposedDistinctivenessScore &&
        scores.baselineConditionScore === scores.proposedConditionScore;
    return {
        rule: 'hedgerow-enhancement-quality',
        status: noEnhancement ? 'no-enhancement' : 'allowed',
        ...(noEnhancement ? { message: 'Error - No enhancement ▲' as const } : {}),
    };
}

export type HedgerowEnhancementConditionDecision = {
    rule: 'enhancement-condition-reduction';
    status: 'allowed' | 'forbidden';
    message?: 'Error - Can not reduce condition ▲';
};

export function assessHedgerowEnhancementCondition(
    baselineConditionScore: HedgerowConditionScore,
    proposedConditionScore: HedgerowConditionScore,
): HedgerowEnhancementConditionDecision {
    const allowed = enhancementConditionAllowed(baselineConditionScore, proposedConditionScore);
    return {
        rule: 'enhancement-condition-reduction',
        status: allowed ? 'allowed' : 'forbidden',
        ...(!allowed ? { message: 'Error - Can not reduce condition ▲' as const } : {}),
    };
}

export function hasHedgerowTimingConflict(
    advance: TimingYear,
    delay: TimingYear,
    finalTimeToTargetCondition: TimingStandard | undefined,
): boolean {
    const bothPositive = (advance === '30+' || advance > 0) && (delay === '30+' || delay > 0);
    const finalFormulaReturnsSentinel = advance === '30+' || delay === '30+' || finalTimeToTargetCondition === '30+';
    return bothPositive && !finalFormulaReturnsSentinel;
}

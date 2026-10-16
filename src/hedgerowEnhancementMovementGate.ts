import type { HedgerowLabel } from './hedgerows';
import { getHedgerowEnhancementMovement } from './hedgerowEnhancementMovements';

export type HedgerowEnhancementUnavailableResult =
    | 'timeToTargetCondition'
    | 'finalTimeToTargetCondition'
    | 'standardOrAdjustedTimeToTargetCondition'
    | 'temporalMultiplier'
    | 'appliedDifficultyMultiplier'
    | 'finalDifficultyOfEnhancement'
    | 'finalTimeToTargetMultiplier'
    | 'hedgerowUnitsDelivered'
    | 'hedgerowUnitsDeliveredWithSpatialRisk';

export type HedgerowEnhancementMovementState = {
    rule: 'hedgerow-enhancement-movement';
    status: 'allowed' | 'forbidden';
    message: ReturnType<typeof getHedgerowEnhancementMovement>;
    unavailableResults: Partial<Record<HedgerowEnhancementUnavailableResult, 'check-data' | 'blank'>>;
};

export type HedgerowEnhancementMovementDecision = Pick<
    HedgerowEnhancementMovementState,
    'rule' | 'status' | 'message'
>;

export function assessHedgerowEnhancementMovement(
    baselineHabitatType: HedgerowLabel,
    proposedHabitatType: HedgerowLabel,
): HedgerowEnhancementMovementDecision {
    const message = getHedgerowEnhancementMovement(baselineHabitatType, proposedHabitatType);
    return {
        rule: 'hedgerow-enhancement-movement',
        status: message.startsWith('Error') ? 'forbidden' : 'allowed',
        message,
    };
}

import { Decimal } from './decimal';
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
    unavailableResults: Partial<
        Record<HedgerowEnhancementUnavailableResult, 'check-data' | 'blank'>
    >;
};

export function enrichHedgerowEnhancementMovement<T extends {
    baseline: { habitatType: HedgerowLabel };
    habitatType: HedgerowLabel;
}>(data: T, offSite = false): T & { enhancementMovement: HedgerowEnhancementMovementState } {
    const message = getHedgerowEnhancementMovement(data.baseline.habitatType, data.habitatType);
    const forbidden = message.startsWith('Error');
    const unavailableResults: HedgerowEnhancementMovementState['unavailableResults'] = forbidden
        ? {
              timeToTargetCondition: 'check-data',
              finalTimeToTargetCondition: 'check-data',
              standardOrAdjustedTimeToTargetCondition: 'check-data',
              temporalMultiplier: 'check-data',
              appliedDifficultyMultiplier: 'check-data',
              finalDifficultyOfEnhancement: 'check-data',
              hedgerowUnitsDelivered: 'blank',
              ...(offSite
                  ? {
                        finalTimeToTargetMultiplier: 'check-data' as const,
                        hedgerowUnitsDeliveredWithSpatialRisk: 'blank' as const,
                    }
                  : {}),
          }
        : {};

    return {
        ...data,
        enhancementMovement: {
            rule: 'hedgerow-enhancement-movement',
            status: forbidden ? 'forbidden' : 'allowed',
            message,
            unavailableResults,
        },
    };
}

export function gateHedgerowEnhancementMovement<T extends {
    enhancementMovement: HedgerowEnhancementMovementState;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
}>(data: T): T {
    if (data.enhancementMovement.status !== 'forbidden') return data;
    return {
        ...data,
        hedgerowUnitsDelivered: 0,
        hedgerowUnitsDeliveredDecimal: new Decimal(0),
        ...('hedgerowUnitsDeliveredWithSpatialRisk' in data
            ? {
                  hedgerowUnitsDeliveredWithSpatialRisk: 0,
                  hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(0),
              }
            : {}),
    };
}

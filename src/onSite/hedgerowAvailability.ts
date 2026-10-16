import type { Decimal } from '../decimal';
import type { HedgerowBaselineAllocation, HedgerowConditionScore, HedgerowDistinctivenessScore } from '../hedgerowAvailability';
import {
    assessHedgerowBaselineAllocation,
    assessHedgerowEnhancementCondition,
    assessHedgerowEnhancementQuality,
} from '../hedgerowAvailability';
import { assessHedgerowEnhancementMovement, type HedgerowEnhancementMovementState } from '../hedgerowEnhancementMovementGate';
import type { HedgerowCondition } from '../hedgerowCondition';
import type { HedgerowLabel } from '../hedgerows';
import { zeroUnavailableResults, zeroableResultPairs, type UnavailableResults } from '../resultAvailability';

export type OnSiteHedgerowBaselineAvailability = Omit<HedgerowBaselineAllocation, 'overAllocated'> & {
    missingSpatialRisk: false;
    missingOffSiteReference: false;
    offSite: false;
    unitsLostError: false;
    unavailableResults: UnavailableResults<'lengthLost' | 'unitsLost' | 'totalHedgerowUnits' | 'totalHedgerowUnitsSRM' | 'unitsRetainedWithSRM'>;
};

type HedgerowBaselineInput = {
    lengthDecimal: Decimal;
    lengthRetainedDecimal: Decimal;
    lengthEnhancedDecimal: Decimal;
    lengthLost: number;
    lengthLostDecimal: Decimal;
    unitsLost: number;
    unitsLostDecimal: Decimal;
};

const zeroBaselineResults = zeroUnavailableResults(zeroableResultPairs<HedgerowBaselineInput>()([
    ['lengthLost', 'lengthLostDecimal'],
    ['unitsLost', 'unitsLostDecimal'],
]));

export function applyOnSiteHedgerowBaselineAvailability<T extends HedgerowBaselineInput>(data: T): T & {
    hedgerowBaselineAvailability: OnSiteHedgerowBaselineAvailability;
} {
    const allocation = assessHedgerowBaselineAllocation(data);
    const { overAllocated, ...allocationMetadata } = allocation;
    const unavailableResults: OnSiteHedgerowBaselineAvailability['unavailableResults'] = overAllocated
        ? { lengthLost: 'check-data', unitsLost: 'check-data' }
        : {};
    const state: OnSiteHedgerowBaselineAvailability = {
        ...allocationMetadata,
        missingSpatialRisk: false,
        missingOffSiteReference: false,
        offSite: false,
        unitsLostError: false,
        unavailableResults,
    };
    const normalized = { ...data, hedgerowBaselineAvailability: state };
    return zeroBaselineResults(normalized, unavailableResults);
}

type HedgerowEnhancementQualityInput = {
    baseline: {
        habitatType: HedgerowLabel;
        condition: HedgerowCondition;
        distinctivenessScore: HedgerowDistinctivenessScore;
        conditionScore: HedgerowConditionScore;
    };
    habitatType: HedgerowLabel;
    condition: HedgerowCondition;
    distinctivenessScore: HedgerowDistinctivenessScore;
    conditionScore: HedgerowConditionScore;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
};

export type OnSiteHedgerowEnhancementQualityAvailability = ReturnType<typeof assessHedgerowEnhancementQuality> & {
    unavailableResults: UnavailableResults<
        | 'timeToTargetCondition'
        | 'finalTimeToTargetCondition'
        | 'temporalMultiplier'
        | 'appliedDifficultyMultiplier'
        | 'finalDifficultyOfEnhancement'
        | 'hedgerowUnitsDelivered'
    >;
};

const zeroEnhancementResults = zeroUnavailableResults(zeroableResultPairs<HedgerowEnhancementQualityInput>()([
    ['hedgerowUnitsDelivered', 'hedgerowUnitsDeliveredDecimal'],
]));

export function applyOnSiteHedgerowEnhancementQuality<T extends HedgerowEnhancementQualityInput>(data: T): T & {
    hedgerowEnhancementQuality: OnSiteHedgerowEnhancementQualityAvailability;
} {
    const decision = assessHedgerowEnhancementQuality({
        baselineDistinctivenessScore: data.baseline.distinctivenessScore,
        proposedDistinctivenessScore: data.distinctivenessScore,
        baselineConditionScore: data.baseline.conditionScore,
        proposedConditionScore: data.conditionScore,
    });
    const unavailableResults: OnSiteHedgerowEnhancementQualityAvailability['unavailableResults'] = decision.status === 'no-enhancement'
        ? {
              timeToTargetCondition: 'check-data',
              finalTimeToTargetCondition: 'check-data',
              temporalMultiplier: 'check-data',
              appliedDifficultyMultiplier: 'check-data',
              finalDifficultyOfEnhancement: 'check-data',
              hedgerowUnitsDelivered: 'blank',
          }
        : {};
    const state = { ...decision, unavailableResults };
    return zeroEnhancementResults({ ...data, hedgerowEnhancementQuality: state }, unavailableResults);
}

type OnSiteMovement = {
    baseline: { habitatType: HedgerowLabel };
    habitatType: HedgerowLabel;
};

const onsiteMovementUnavailableResults: HedgerowEnhancementMovementState['unavailableResults'] = {
    timeToTargetCondition: 'check-data',
    finalTimeToTargetCondition: 'check-data',
    standardOrAdjustedTimeToTargetCondition: 'check-data',
    temporalMultiplier: 'check-data',
    appliedDifficultyMultiplier: 'check-data',
    finalDifficultyOfEnhancement: 'check-data',
    hedgerowUnitsDelivered: 'blank',
};

export function addOnSiteHedgerowEnhancementMovement<T extends OnSiteMovement>(data: T): T & {
    enhancementMovement: HedgerowEnhancementMovementState;
} {
    const decision = assessHedgerowEnhancementMovement(data.baseline.habitatType, data.habitatType);
    return {
        ...data,
        enhancementMovement: {
            ...decision,
            unavailableResults: decision.status === 'forbidden' ? onsiteMovementUnavailableResults : {},
        },
    };
}

type OnSiteMovementResult = {
    enhancementMovement: HedgerowEnhancementMovementState;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
};

export function gateOnSiteHedgerowEnhancementMovement<T extends OnSiteMovementResult>(data: T): T {
    if (data.enhancementMovement.status !== 'forbidden') return data;
    return zeroEnhancementResults(data, data.enhancementMovement.unavailableResults);
}

export type OnSiteHedgerowEnhancementConditionAvailability = ReturnType<typeof assessHedgerowEnhancementCondition> & {
    unavailableResults: UnavailableResults<
        | 'timeToTargetCondition'
        | 'standardOrAdjustedTimeToTargetCondition'
        | 'finalTimeToTargetCondition'
        | 'temporalMultiplier'
        | 'appliedDifficultyMultiplier'
        | 'finalDifficultyOfEnhancement'
        | 'hedgerowUnitsDelivered'
    >;
};

type OnSiteConditionInput = {
    baseline: { conditionScore: HedgerowConditionScore };
    conditionScore: HedgerowConditionScore;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
};

const zeroConditionResults = zeroUnavailableResults(zeroableResultPairs<OnSiteConditionInput>()([
    ['hedgerowUnitsDelivered', 'hedgerowUnitsDeliveredDecimal'],
]));

export function applyOnSiteHedgerowEnhancementCondition<T extends OnSiteConditionInput>(data: T): T & {
    enhancementCondition: OnSiteHedgerowEnhancementConditionAvailability;
} {
    const decision = assessHedgerowEnhancementCondition(
        data.baseline.conditionScore,
        data.conditionScore,
    );
    const unavailableResults: OnSiteHedgerowEnhancementConditionAvailability['unavailableResults'] =
        decision.status === 'forbidden'
            ? {
                  timeToTargetCondition: 'check-data',
                  standardOrAdjustedTimeToTargetCondition: 'check-data',
                  finalTimeToTargetCondition: 'check-data',
                  temporalMultiplier: 'check-data',
                  appliedDifficultyMultiplier: 'check-data',
                  finalDifficultyOfEnhancement: 'check-data',
                  hedgerowUnitsDelivered: 'blank',
              }
            : {};
    return zeroConditionResults(
        { ...data, enhancementCondition: { ...decision, unavailableResults } },
        unavailableResults,
    );
}

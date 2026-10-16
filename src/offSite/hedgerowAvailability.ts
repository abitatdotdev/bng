import type { Decimal } from '../decimal';
import type { HedgerowCondition } from '../hedgerowCondition';
import type { HedgerowBaselineAllocation, HedgerowConditionScore, HedgerowDistinctivenessScore } from '../hedgerowAvailability';
import {
    assessHedgerowBaselineAllocation,
    assessHedgerowEnhancementCondition,
    assessHedgerowEnhancementQuality,
} from '../hedgerowAvailability';
import { assessHedgerowEnhancementMovement, type HedgerowEnhancementMovementState } from '../hedgerowEnhancementMovementGate';
import type { HedgerowLabel } from '../hedgerows';
import type { SpatialRiskCategory } from '../spatialRisk';
import { zeroUnavailableResults, zeroableResultPairs, type UnavailableResults } from '../resultAvailability';

export type OffSiteHedgerowBaselineAvailability = Omit<HedgerowBaselineAllocation, 'overAllocated'> & {
    missingSpatialRisk: boolean;
    missingOffSiteReference: boolean;
    offSite: true;
    unitsLostError: boolean;
    unavailableResults: UnavailableResults<
        | 'lengthLost'
        | 'unitsLost'
        | 'totalHedgerowUnits'
        | 'totalHedgerowUnitsSRM'
        | 'unitsRetainedWithSRM'
    >;
};

type HedgerowBaselineInput = {
    lengthDecimal: Decimal;
    lengthRetainedDecimal: Decimal;
    lengthEnhancedDecimal: Decimal;
    spatialRiskCategory?: SpatialRiskCategory;
    offSiteReferenceNumber?: string;
    lengthLost: number;
    lengthLostDecimal: Decimal;
    unitsLost: number;
    unitsLostDecimal: Decimal;
    totalHedgerowUnits: number;
    totalHedgerowUnitsDecimal: Decimal;
    totalHedgerowUnitsSRM: number;
    totalHedgerowUnitsSRMDecimal: Decimal;
    unitsRetainedWithSRM: number;
    unitsRetainedWithSRMDecimal: Decimal;
};

const zeroBaselineResults = zeroUnavailableResults(zeroableResultPairs<HedgerowBaselineInput>()([
    ['lengthLost', 'lengthLostDecimal'],
    ['unitsLost', 'unitsLostDecimal'],
    ['totalHedgerowUnits', 'totalHedgerowUnitsDecimal'],
    ['totalHedgerowUnitsSRM', 'totalHedgerowUnitsSRMDecimal'],
    ['unitsRetainedWithSRM', 'unitsRetainedWithSRMDecimal'],
]));

export function applyOffSiteHedgerowBaselineAvailability<T extends HedgerowBaselineInput>(data: T): T & {
    hedgerowBaselineAvailability: OffSiteHedgerowBaselineAvailability;
} {
    const allocation = assessHedgerowBaselineAllocation(data);
    const missingSpatialRisk = !data.spatialRiskCategory;
    const missingOffSiteReference = !!data.spatialRiskCategory && !data.offSiteReferenceNumber;
    const { overAllocated, ...allocationMetadata } = allocation;
    const unavailableResults: OffSiteHedgerowBaselineAvailability['unavailableResults'] = {};
    if (overAllocated) {
        unavailableResults.lengthLost = 'check-data';
        unavailableResults.unitsLost = 'check-data';
        unavailableResults.totalHedgerowUnits = 'check-data';
    }
    if (!overAllocated && (missingSpatialRisk || missingOffSiteReference)) {
        unavailableResults.totalHedgerowUnits = 'blank';
    }
    if (missingSpatialRisk) {
        unavailableResults.totalHedgerowUnitsSRM = 'blank';
        unavailableResults.unitsRetainedWithSRM = 'blank';
        unavailableResults.unitsLost = 'blank';
    }
    if (missingOffSiteReference) unavailableResults.unitsLost = 'check-data';
    const state: OffSiteHedgerowBaselineAvailability = {
        ...allocationMetadata,
        missingSpatialRisk,
        missingOffSiteReference,
        offSite: true,
        unitsLostError: missingOffSiteReference,
        unavailableResults,
    };
    return zeroBaselineResults({ ...data, hedgerowBaselineAvailability: state }, unavailableResults);
}

export type OffSiteHedgerowDeliveryAvailability = {
    rule: 'hedgerow-off-site-availability';
    unavailableResults: UnavailableResults<'hedgerowUnitsDelivered' | 'hedgerowUnitsDeliveredWithSpatialRisk'>;
};

type HedgerowDeliveryInput = {
    spatialRiskCategory?: SpatialRiskCategory;
    offSiteReferenceNumber?: string;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
    hedgerowUnitsDeliveredWithSpatialRisk: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal: Decimal;
};

const zeroDeliveryResults = zeroUnavailableResults(zeroableResultPairs<HedgerowDeliveryInput>()([
    ['hedgerowUnitsDelivered', 'hedgerowUnitsDeliveredDecimal'],
    ['hedgerowUnitsDeliveredWithSpatialRisk', 'hedgerowUnitsDeliveredWithSpatialRiskDecimal'],
]));

export function applyOffSiteHedgerowDeliveryAvailability<T extends HedgerowDeliveryInput>(data: T): T & {
    hedgerowOffSiteAvailability: OffSiteHedgerowDeliveryAvailability;
} {
    const unavailableResults: OffSiteHedgerowDeliveryAvailability['unavailableResults'] = {};
    if (!data.spatialRiskCategory) {
        unavailableResults.hedgerowUnitsDelivered = 'blank';
        unavailableResults.hedgerowUnitsDeliveredWithSpatialRisk = 'blank';
    } else if (!data.offSiteReferenceNumber) {
        unavailableResults.hedgerowUnitsDelivered = 'blank';
    }
    const state = { rule: 'hedgerow-off-site-availability' as const, unavailableResults };
    return zeroDeliveryResults({ ...data, hedgerowOffSiteAvailability: state }, unavailableResults);
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
    hedgerowUnitsDeliveredWithSpatialRisk: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal: Decimal;
};

export type OffSiteHedgerowEnhancementQualityAvailability = ReturnType<typeof assessHedgerowEnhancementQuality> & {
    unavailableResults: UnavailableResults<
        | 'timeToTargetCondition'
        | 'finalTimeToTargetCondition'
        | 'temporalMultiplier'
        | 'appliedDifficultyMultiplier'
        | 'finalDifficultyOfEnhancement'
        | 'hedgerowUnitsDelivered'
        | 'hedgerowUnitsDeliveredWithSpatialRisk'
    >;
};

const zeroEnhancementResults = zeroUnavailableResults(zeroableResultPairs<HedgerowEnhancementQualityInput>()([
    ['hedgerowUnitsDelivered', 'hedgerowUnitsDeliveredDecimal'],
    ['hedgerowUnitsDeliveredWithSpatialRisk', 'hedgerowUnitsDeliveredWithSpatialRiskDecimal'],
]));

export function applyOffSiteHedgerowEnhancementQuality<T extends HedgerowEnhancementQualityInput>(data: T): T & {
    hedgerowEnhancementQuality: OffSiteHedgerowEnhancementQualityAvailability;
} {
    const decision = assessHedgerowEnhancementQuality({
        baselineDistinctivenessScore: data.baseline.distinctivenessScore,
        proposedDistinctivenessScore: data.distinctivenessScore,
        baselineConditionScore: data.baseline.conditionScore,
        proposedConditionScore: data.conditionScore,
    });
    const unavailableResults: OffSiteHedgerowEnhancementQualityAvailability['unavailableResults'] = decision.status === 'no-enhancement'
        ? {
              timeToTargetCondition: 'check-data',
              finalTimeToTargetCondition: 'check-data',
              temporalMultiplier: 'check-data',
              appliedDifficultyMultiplier: 'check-data',
              finalDifficultyOfEnhancement: 'check-data',
              hedgerowUnitsDelivered: 'blank',
              hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
          }
        : {};
    const state = { ...decision, unavailableResults };
    return zeroEnhancementResults({ ...data, hedgerowEnhancementQuality: state }, unavailableResults);
}

type OffSiteMovement = {
    baseline: { habitatType: HedgerowLabel };
    habitatType: HedgerowLabel;
};

const offsiteMovementUnavailableResults: HedgerowEnhancementMovementState['unavailableResults'] = {
    timeToTargetCondition: 'check-data',
    finalTimeToTargetCondition: 'check-data',
    standardOrAdjustedTimeToTargetCondition: 'check-data',
    temporalMultiplier: 'check-data',
    appliedDifficultyMultiplier: 'check-data',
    finalDifficultyOfEnhancement: 'check-data',
    finalTimeToTargetMultiplier: 'check-data',
    hedgerowUnitsDelivered: 'blank',
    hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
};

export function addOffSiteHedgerowEnhancementMovement<T extends OffSiteMovement>(data: T): T & {
    enhancementMovement: HedgerowEnhancementMovementState;
} {
    const decision = assessHedgerowEnhancementMovement(data.baseline.habitatType, data.habitatType);
    return {
        ...data,
        enhancementMovement: {
            ...decision,
            unavailableResults: decision.status === 'forbidden' ? offsiteMovementUnavailableResults : {},
        },
    };
}

type OffSiteMovementResult = {
    enhancementMovement: HedgerowEnhancementMovementState;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
    hedgerowUnitsDeliveredWithSpatialRisk: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal: Decimal;
};

export function gateOffSiteHedgerowEnhancementMovement<T extends OffSiteMovementResult>(data: T): T {
    if (data.enhancementMovement.status !== 'forbidden') return data;
    return zeroEnhancementResults(data, data.enhancementMovement.unavailableResults);
}

export type OffSiteHedgerowEnhancementConditionAvailability = ReturnType<typeof assessHedgerowEnhancementCondition> & {
    unavailableResults: UnavailableResults<
        | 'timeToTargetCondition'
        | 'standardOrAdjustedTimeToTargetCondition'
        | 'finalTimeToTargetCondition'
        | 'temporalMultiplier'
        | 'appliedDifficultyMultiplier'
        | 'finalDifficultyOfEnhancement'
        | 'finalTimeToTargetMultiplier'
        | 'hedgerowUnitsDelivered'
        | 'hedgerowUnitsDeliveredWithSpatialRisk'
    >;
};

type OffSiteConditionInput = {
    baseline: { conditionScore: HedgerowConditionScore };
    conditionScore: HedgerowConditionScore;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
    hedgerowUnitsDeliveredWithSpatialRisk: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal: Decimal;
};

const zeroConditionResults = zeroUnavailableResults(zeroableResultPairs<OffSiteConditionInput>()([
    ['hedgerowUnitsDelivered', 'hedgerowUnitsDeliveredDecimal'],
    ['hedgerowUnitsDeliveredWithSpatialRisk', 'hedgerowUnitsDeliveredWithSpatialRiskDecimal'],
]));

export function applyOffSiteHedgerowEnhancementCondition<T extends OffSiteConditionInput>(data: T): T & {
    enhancementCondition: OffSiteHedgerowEnhancementConditionAvailability;
} {
    const decision = assessHedgerowEnhancementCondition(
        data.baseline.conditionScore,
        data.conditionScore,
    );
    const unavailableResults: OffSiteHedgerowEnhancementConditionAvailability['unavailableResults'] =
        decision.status === 'forbidden'
            ? {
                  timeToTargetCondition: 'check-data',
                  standardOrAdjustedTimeToTargetCondition: 'check-data',
                  finalTimeToTargetCondition: 'check-data',
                  temporalMultiplier: 'check-data',
                  appliedDifficultyMultiplier: 'check-data',
                  finalDifficultyOfEnhancement: 'check-data',
                  finalTimeToTargetMultiplier: 'check-data',
                  hedgerowUnitsDelivered: 'blank',
                  hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
              }
            : {};
    return zeroConditionResults(
        { ...data, enhancementCondition: { ...decision, unavailableResults } },
        unavailableResults,
    );
}

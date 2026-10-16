import type { Decimal } from '../decimal';
import type { Hedgerow } from '../hedgerows';
import type { HedgerowCondition } from '../hedgerowCondition';
import { hasHedgerowTimingConflict } from '../hedgerowAvailability';
import { isTimingYear, linearTimingGuidance, type LinearTimingGuidance, type TimingStandard, type TimingYear } from '../linearTiming';
import { zeroUnavailableResults, zeroableResultPairs, type UnavailableResults } from '../resultAvailability';

type OffSiteCreationTiming = {
    standardTimeToTargetCondition?: Hedgerow['yearsToTargetConditionViaCreation'][HedgerowCondition];
    habitatCreatedInAdvance: TimingYear;
    delayInStartingHabitatCreation: TimingYear;
};

export function addOffSiteHedgerowCreationTimingGuidance<T extends OffSiteCreationTiming>(data: T): T & {
    standardOrAdjustedTimeToTargetCondition?: LinearTimingGuidance;
} {
    const standard = data.standardTimeToTargetCondition;
    if (typeof standard !== 'number' && standard !== '30+') return data;
    return {
        ...data,
        standardOrAdjustedTimeToTargetCondition: linearTimingGuidance({
            standard,
            advance: data.habitatCreatedInAdvance,
            delay: data.delayInStartingHabitatCreation,
        }),
    };
}

type OffSiteEnhancementTiming = {
    timeToTargetCondition: TimingStandard;
    finalTimeToTargetCondition: TimingStandard;
    hedgerowEnhancedInAdvance: TimingYear;
    hedgerowEnhancedDelay: TimingYear;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
    hedgerowUnitsDeliveredWithSpatialRisk: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal: Decimal;
};

export type OffSiteHedgerowTimingAvailability = {
    rule: 'linear-timing-conflict';
    status: 'allowed' | 'forbidden';
    message?: 'Error -both advance and delayed habitat creation ▲';
    unavailableResults: UnavailableResults<
        | 'finalTimeToTargetCondition'
        | 'temporalMultiplier'
        | 'appliedDifficultyMultiplier'
        | 'finalDifficultyOfEnhancement'
        | 'hedgerowUnitsDelivered'
        | 'hedgerowUnitsDeliveredWithSpatialRisk'
    >;
};

const zeroEnhancementResults = zeroUnavailableResults(zeroableResultPairs<OffSiteEnhancementTiming>()([
    ['hedgerowUnitsDelivered', 'hedgerowUnitsDeliveredDecimal'],
    ['hedgerowUnitsDeliveredWithSpatialRisk', 'hedgerowUnitsDeliveredWithSpatialRiskDecimal'],
]));

export function addOffSiteHedgerowEnhancementTimingGuidance<T extends OffSiteEnhancementTiming>(data: T): T & {
    standardOrAdjustedTimeToTargetCondition?: LinearTimingGuidance;
} {
    if (!isTimingYear(data.timeToTargetCondition)) return data;
    return {
        ...data,
        standardOrAdjustedTimeToTargetCondition: linearTimingGuidance({
            standard: data.timeToTargetCondition,
            advance: data.hedgerowEnhancedInAdvance,
            delay: data.hedgerowEnhancedDelay,
        }),
    };
}

export function applyOffSiteHedgerowEnhancementTiming<T extends OffSiteEnhancementTiming>(data: T): T & {
    linearTimingAvailability: OffSiteHedgerowTimingAvailability;
} {
    const forbidden = hasHedgerowTimingConflict(
        data.hedgerowEnhancedInAdvance,
        data.hedgerowEnhancedDelay,
        data.finalTimeToTargetCondition,
    );
    const unavailableResults: OffSiteHedgerowTimingAvailability['unavailableResults'] = forbidden
        ? {
              finalTimeToTargetCondition: 'check-data',
              temporalMultiplier: 'check-data',
              appliedDifficultyMultiplier: 'check-data',
              finalDifficultyOfEnhancement: 'check-data',
              hedgerowUnitsDelivered: 'blank',
              hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
          }
        : {};
    const state: OffSiteHedgerowTimingAvailability = {
        rule: 'linear-timing-conflict',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error -both advance and delayed habitat creation ▲' as const } : {}),
        unavailableResults,
    };
    return zeroEnhancementResults({ ...data, linearTimingAvailability: state }, unavailableResults);
}

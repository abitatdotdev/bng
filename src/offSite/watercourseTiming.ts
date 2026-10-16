import { Decimal } from '../decimal';
import { zeroUnavailableResults, zeroableResultPairs, type UnavailableResults } from '../resultAvailability';
import { isTimingYear, linearTimingGuidance, type LinearTimingGuidance, type TimingStandard, type TimingYear } from '../linearTiming';

type CreationTimingUnavailableResult = 'finalTimeToTargetCondition' | 'temporalMultiplier' | 'appliedDifficulty' | 'unitsDelivered' | 'netUnitChangeWithSpatialRisk';
type EnhancementTimingUnavailableResult =
    | 'finalTimeToTargetCondition'
    | 'temporalMultiplier'
    | 'appliedDifficultyMultiplier'
    | 'watercourseUnitsDelivered'
    | 'watercourseUnitsDeliveredWithSpatialRisk';

export type WatercourseCreationTimingAvailability = {
    rule: 'linear-timing-conflict';
    status: 'allowed' | 'forbidden';
    message?: 'Error -both advance and delayed habitat creation ▲';
    unavailableResults: UnavailableResults<CreationTimingUnavailableResult>;
};

export type WatercourseEnhancementTimingAvailability = {
    rule: 'linear-timing-conflict';
    status: 'allowed' | 'forbidden';
    message?: 'Error -both advance and delayed habitat creation ▲';
    unavailableResults: UnavailableResults<EnhancementTimingUnavailableResult>;
};

type CreationUnitResults = {
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
    netUnitChangeWithSpatialRisk: number;
    netUnitChangeWithSpatialRiskDecimal: Decimal;
};
type EnhancementUnitResults = {
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    watercourseUnitsDeliveredWithSpatialRisk: number;
    watercourseUnitsDeliveredWithSpatialRiskDecimal: Decimal;
};
const zeroCreationResults = zeroUnavailableResults(zeroableResultPairs<CreationUnitResults>()([
    ['unitsDelivered', 'unitsDeliveredDecimal'],
    ['netUnitChangeWithSpatialRisk', 'netUnitChangeWithSpatialRiskDecimal'],
]));
const zeroEnhancementResults = zeroUnavailableResults(zeroableResultPairs<EnhancementUnitResults>()([
    ['watercourseUnitsDelivered', 'watercourseUnitsDeliveredDecimal'],
    ['watercourseUnitsDeliveredWithSpatialRisk', 'watercourseUnitsDeliveredWithSpatialRiskDecimal'],
]));

export function addOffSiteWatercourseCreationTimingGuidance<T extends {
    standardTimeToTarget: TimingStandard;
    habitatCreatedInAdvance: TimingYear;
    delayInStarting: TimingYear;
}>(data: T): T & { standardOrAdjustedTimeToTargetCondition?: LinearTimingGuidance } {
    if (!isTimingYear(data.standardTimeToTarget)) return data;
    return {
        ...data,
        standardOrAdjustedTimeToTargetCondition: linearTimingGuidance({
            standard: data.standardTimeToTarget,
            advance: data.habitatCreatedInAdvance,
            delay: data.delayInStarting,
        }),
    };
}

export function applyOffSiteWatercourseCreationTimingAvailability<T extends {
    habitatCreatedInAdvance: TimingYear;
    delayInStarting: TimingYear;
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
    netUnitChangeWithSpatialRisk: number;
    netUnitChangeWithSpatialRiskDecimal: Decimal;
}>(data: T): T & { linearTimingAvailability: WatercourseCreationTimingAvailability } {
    const forbidden = hasConflictingTiming(data.habitatCreatedInAdvance, data.delayInStarting);
    const unavailableResults: WatercourseCreationTimingAvailability['unavailableResults'] = forbidden
        ? {
              finalTimeToTargetCondition: 'check-data',
              temporalMultiplier: 'check-data',
              appliedDifficulty: 'check-data',
              unitsDelivered: 'blank',
              netUnitChangeWithSpatialRisk: 'blank',
          }
        : {};
    const linearTimingAvailability: WatercourseCreationTimingAvailability = {
        rule: 'linear-timing-conflict',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error -both advance and delayed habitat creation ▲' as const } : {}),
        unavailableResults,
    };
    return {
        ...zeroCreationResults(data, unavailableResults),
        linearTimingAvailability,
    };
}

export function addOffSiteWatercourseEnhancementTimingGuidance<T extends {
    timeToTargetCondition: TimingStandard;
    watercourseEnhancedInAdvance: TimingYear;
    watercourseEnhancedDelay: TimingYear;
}>(data: T): T & { standardOrAdjustedTimeToTargetCondition?: LinearTimingGuidance } {
    if (!isTimingYear(data.timeToTargetCondition)) return data;
    return {
        ...data,
        standardOrAdjustedTimeToTargetCondition: linearTimingGuidance({
            standard: data.timeToTargetCondition,
            advance: data.watercourseEnhancedInAdvance,
            delay: data.watercourseEnhancedDelay,
        }),
    };
}

export function applyOffSiteWatercourseEnhancementTimingAvailability<T extends {
    watercourseEnhancedInAdvance: TimingYear;
    watercourseEnhancedDelay: TimingYear;
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    watercourseUnitsDeliveredWithSpatialRisk: number;
    watercourseUnitsDeliveredWithSpatialRiskDecimal: Decimal;
}>(data: T): T & { linearTimingAvailability: WatercourseEnhancementTimingAvailability } {
    const forbidden = hasConflictingTiming(data.watercourseEnhancedInAdvance, data.watercourseEnhancedDelay);
    const unavailableResults: WatercourseEnhancementTimingAvailability['unavailableResults'] = forbidden
        ? {
              finalTimeToTargetCondition: 'check-data',
              temporalMultiplier: 'check-data',
              appliedDifficultyMultiplier: 'check-data',
              watercourseUnitsDelivered: 'blank',
              watercourseUnitsDeliveredWithSpatialRisk: 'blank',
          }
        : {};
    const linearTimingAvailability: WatercourseEnhancementTimingAvailability = {
        rule: 'linear-timing-conflict',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error -both advance and delayed habitat creation ▲' as const } : {}),
        unavailableResults,
    };
    return {
        ...zeroEnhancementResults(data, unavailableResults),
        linearTimingAvailability,
    };
}

function hasConflictingTiming(advance: TimingYear, delay: TimingYear): boolean {
    return isPositiveYear(advance) && isPositiveYear(delay);
}

function isPositiveYear(value: TimingYear): boolean {
    return value === '30+' || value > 0;
}

import { Decimal } from '../decimal';
import { zeroUnavailableResults, zeroableResultPairs, type UnavailableResults } from '../resultAvailability';
import { isTimingYear, linearTimingGuidance, type LinearTimingGuidance, type TimingStandard, type TimingYear } from '../linearTiming';

type CreationTimingUnavailableResult = 'finalTimeToTargetCondition' | 'temporalMultiplier' | 'appliedDifficulty' | 'unitsDelivered';
type EnhancementTimingUnavailableResult =
    | 'finalTimeToTargetCondition'
    | 'temporalMultiplier'
    | 'appliedDifficultyMultiplier'
    | 'watercourseUnitsDelivered';

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
    unavailableResults: UnavailableResults<
        EnhancementTimingUnavailableResult | 'watercourseUnitsDeliveredWithSpatialRisk'
    >;
};

type CreationUnitResults = { unitsDelivered: number; unitsDeliveredDecimal: Decimal };
type EnhancementUnitResults = { watercourseUnitsDelivered: number; watercourseUnitsDeliveredDecimal: Decimal };
const zeroCreationResults = zeroUnavailableResults(zeroableResultPairs<CreationUnitResults>()([
    ['unitsDelivered', 'unitsDeliveredDecimal'],
]));
const zeroEnhancementResults = zeroUnavailableResults(zeroableResultPairs<EnhancementUnitResults>()([
    ['watercourseUnitsDelivered', 'watercourseUnitsDeliveredDecimal'],
]));

export function addOnSiteWatercourseCreationTimingGuidance<T extends {
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

export function applyOnSiteWatercourseCreationTimingAvailability<T extends {
    habitatCreatedInAdvance: TimingYear;
    delayInStarting: TimingYear;
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
}>(data: T): T & { linearTimingAvailability: WatercourseCreationTimingAvailability } {
    const forbidden = hasConflictingTiming(data.habitatCreatedInAdvance, data.delayInStarting);
    const unavailableResults: WatercourseCreationTimingAvailability['unavailableResults'] = forbidden
        ? {
              finalTimeToTargetCondition: 'check-data',
              temporalMultiplier: 'check-data',
              appliedDifficulty: 'check-data',
              unitsDelivered: 'blank',
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

export function addOnSiteWatercourseEnhancementTimingGuidance<T extends {
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

export function applyOnSiteWatercourseEnhancementTimingAvailability<T extends {
    watercourseEnhancedInAdvance: TimingYear;
    watercourseEnhancedDelay: TimingYear;
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
}>(data: T): T & { linearTimingAvailability: WatercourseEnhancementTimingAvailability } {
    const forbidden = hasConflictingTiming(data.watercourseEnhancedInAdvance, data.watercourseEnhancedDelay);
    const unavailableResults: WatercourseEnhancementTimingAvailability['unavailableResults'] = forbidden
        ? {
              finalTimeToTargetCondition: 'check-data',
              temporalMultiplier: 'check-data',
              appliedDifficultyMultiplier: 'check-data',
              watercourseUnitsDelivered: 'blank',
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

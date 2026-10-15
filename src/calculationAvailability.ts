import { Decimal } from './decimal';

type ResultAvailability = 'check-data' | 'blank';
type TimingYears = number | '30+';
type ConditionScore = number | 'Not possible';
type CreationTimingResult =
    | 'finalTimeToTargetCondition'
    | 'finalTimeToTargetMultiplier'
    | 'habitatUnitsDelivered'
    | 'habitatUnitsDeliveredWithSpatialRisk';
type EnhancementConditionResult =
    | 'timeToTargetCondition'
    | 'standardOrAdjustedTimeToTargetCondition'
    | 'finalTimeToTargetCondition'
    | 'finalTimeToTargetMultiplier'
    | 'temporalMultiplier'
    | 'appliedDifficultyMultiplier'
    | 'finalDifficultyOfEnhancement'
    | 'hedgerowUnitsDelivered'
    | 'hedgerowUnitsDeliveredWithSpatialRisk'
    | 'watercourseUnitsDelivered'
    | 'watercourseUnitsDeliveredWithSpatialRisk';

export type HabitatCreationTimingState = {
    rule: 'habitat-creation-timing-conflict';
    status: 'allowed' | 'forbidden';
    message?: 'Error -both advance and delayed habitat creation ▲';
    unavailableResults: Partial<Record<CreationTimingResult, ResultAvailability>>;
};

export type EnhancementConditionState = {
    rule: 'enhancement-condition-reduction';
    status: 'allowed' | 'forbidden';
    message?: 'Error - Can not reduce condition ▲';
    unavailableResults: Partial<Record<EnhancementConditionResult, ResultAvailability>>;
};

export type WatercourseEnhancementMovementState = {
    rule: 'watercourse-enhancement-movement';
    status: 'allowed' | 'forbidden';
    message?: 'Error Trading Down ▲';
    unavailableResults: Partial<Record<
        | 'timeToTargetCondition'
        | 'standardOrAdjustedTimeToTargetCondition'
        | 'finalTimeToTargetCondition'
        | 'temporalMultiplier'
        | 'appliedDifficultyMultiplier'
        | 'watercourseUnitsDelivered'
        | 'watercourseUnitsDeliveredWithSpatialRisk',
        ResultAvailability
    >>;
};

const UNIT_RESULTS = [
    'habitatUnitsDelivered',
    'habitatUnitsDeliveredWithSpatialRisk',
    'hedgerowUnitsDelivered',
    'hedgerowUnitsDeliveredWithSpatialRisk',
    'watercourseUnitsDelivered',
    'watercourseUnitsDeliveredWithSpatialRisk',
] as const;

function withUnavailableUnitContributions<T extends object>(
    data: T,
    unavailableResults: Partial<Record<(typeof UNIT_RESULTS)[number], ResultAvailability>>,
): T {
    const result = { ...data };
    for (const field of UNIT_RESULTS) {
        if (unavailableResults[field] !== 'blank') continue;
        Object.assign(result, {
            [field]: 0,
            [`${field}Decimal`]: new Decimal(0),
        });
    }
    return result;
}

export function applyHabitatCreationTimingAvailability<T extends {
    habitatCreationInAdvance: TimingYears;
    habitatCreationDelay: TimingYears;
}>(data: T, offSite: boolean): T & { creationTiming: HabitatCreationTimingState } {
    const { habitatCreationInAdvance: advance, habitatCreationDelay: delay } = data;
    const forbidden = (advance === '30+' || advance > 0) && (delay === '30+' || delay > 0);
    const creationTiming: HabitatCreationTimingState = {
        rule: 'habitat-creation-timing-conflict',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error -both advance and delayed habitat creation ▲' as const } : {}),
        unavailableResults: forbidden
            ? {
                  finalTimeToTargetCondition: 'check-data',
                  finalTimeToTargetMultiplier: 'check-data',
                  habitatUnitsDelivered: 'blank',
                  ...(offSite ? { habitatUnitsDeliveredWithSpatialRisk: 'blank' as const } : {}),
              }
            : {},
    };
    return withUnavailableUnitContributions({ ...data, creationTiming }, creationTiming.unavailableResults);
}

export function applyEnhancementConditionAvailability<T extends {
    baseline: { conditionScore: ConditionScore };
    conditionScore: ConditionScore;
}>(
    data: T,
    kind: 'hedgerow' | 'watercourse',
    offSite: boolean,
): T & { enhancementCondition: EnhancementConditionState } {
    const forbidden = typeof data.baseline.conditionScore === 'number' &&
        typeof data.conditionScore === 'number' &&
        data.baseline.conditionScore > data.conditionScore;
    const enhancementCondition: EnhancementConditionState = {
        rule: 'enhancement-condition-reduction',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error - Can not reduce condition ▲' as const } : {}),
        unavailableResults: forbidden
            ? {
                  timeToTargetCondition: 'check-data',
                  standardOrAdjustedTimeToTargetCondition: 'check-data',
                  finalTimeToTargetCondition: 'check-data',
                  temporalMultiplier: 'check-data',
                  appliedDifficultyMultiplier: 'check-data',
                  ...(kind === 'hedgerow'
                      ? {
                            finalDifficultyOfEnhancement: 'check-data' as const,
                            hedgerowUnitsDelivered: 'blank' as const,
                            ...(offSite
                                ? {
                                      finalTimeToTargetMultiplier: 'check-data' as const,
                                      hedgerowUnitsDeliveredWithSpatialRisk: 'blank' as const,
                                  }
                                : {}),
                        }
                      : {
                            watercourseUnitsDelivered: 'blank' as const,
                            ...(offSite
                                ? { watercourseUnitsDeliveredWithSpatialRisk: 'blank' as const }
                                : {}),
                        }),
              }
            : {},
    };
    return withUnavailableUnitContributions({ ...data, enhancementCondition }, enhancementCondition.unavailableResults);
}

export function applyWatercourseEnhancementAvailability<T extends {
    baseline: { distinctivenessScore: number; conditionScore: ConditionScore };
    distinctivenessScore: number;
    conditionScore: ConditionScore;
}>(data: T, offSite: boolean): T & {
    enhancementCondition: EnhancementConditionState;
    enhancementMovement: WatercourseEnhancementMovementState;
} {
    const forbidden = data.baseline.distinctivenessScore > data.distinctivenessScore;
    const enhancementMovement: WatercourseEnhancementMovementState = {
        rule: 'watercourse-enhancement-movement',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error Trading Down ▲' as const } : {}),
        unavailableResults: forbidden
            ? {
                  timeToTargetCondition: 'check-data',
                  standardOrAdjustedTimeToTargetCondition: 'check-data',
                  finalTimeToTargetCondition: 'check-data',
                  temporalMultiplier: 'check-data',
                  appliedDifficultyMultiplier: 'check-data',
                  watercourseUnitsDelivered: 'blank',
                  ...(offSite
                      ? { watercourseUnitsDeliveredWithSpatialRisk: 'blank' as const }
                      : {}),
              }
            : {},
    };
    return withUnavailableUnitContributions(
        { ...applyEnhancementConditionAvailability(data, 'watercourse', offSite), enhancementMovement },
        enhancementMovement.unavailableResults,
    );
}

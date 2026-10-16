import { Decimal } from './decimal';
import type { HedgerowCondition } from './hedgerowCondition';
import type { Hedgerow, HedgerowLabel } from './hedgerows';
import type { SpatialRiskCategory, WatercourseSpatialRiskCategory } from './spatialRisk';
import type { Watercourse } from './watercourses';
import type { WatercourseType } from './watercourseType';
import type { WatercourseEncroachment, RiparianEncroachment } from './watercourseEncroachment';
import type { WatercourseCondition } from './watercourseCondition';
import type { EnhancementConditionState, WatercourseEnhancementMovementState } from './calculationAvailability';

type Availability = 'blank' | 'check-data';
type HedgerowDistinctivenessScore = Hedgerow['distinctivenessScore'];
type HedgerowConditionScore = Hedgerow['conditions'][HedgerowCondition];

export type HedgerowOffSiteAvailability = {
    rule: 'hedgerow-off-site-availability';
    unavailableResults: Partial<Record<'hedgerowUnitsDelivered' | 'hedgerowUnitsDeliveredWithSpatialRisk', Availability>>;
};

export type HedgerowEnhancementQuality = {
    rule: 'hedgerow-enhancement-quality';
    status: 'allowed' | 'no-enhancement';
    message?: 'Error - No enhancement ▲';
    unavailableResults: Partial<Record<'timeToTargetCondition' | 'finalTimeToTargetCondition' | 'temporalMultiplier' | 'appliedDifficultyMultiplier' | 'finalDifficultyOfEnhancement' | 'hedgerowUnitsDelivered' | 'hedgerowUnitsDeliveredWithSpatialRisk', Availability>>;
};

export type LinearTimingAvailability = {
    rule: 'linear-timing-conflict';
    status: 'allowed' | 'forbidden';
    message?: 'Error -both advance and delayed habitat creation ▲';
    unavailableResults: Partial<Record<'finalTimeToTargetCondition' | 'temporalMultiplier' | 'appliedDifficultyMultiplier' | 'finalDifficultyOfEnhancement' | 'watercourseUnitsDelivered' | 'watercourseUnitsDeliveredWithSpatialRisk' | 'hedgerowUnitsDelivered' | 'hedgerowUnitsDeliveredWithSpatialRisk', Availability>>;
};

export type WatercourseCreationTimingAvailability = Omit<LinearTimingAvailability, 'unavailableResults'> & {
    unavailableResults: LinearTimingAvailability['unavailableResults'] & {
        appliedDifficulty?: Availability;
        unitsDelivered?: Availability;
        netUnitChangeWithSpatialRisk?: Availability;
    };
};

export type WatercourseBaselineAvailability = {
    rule: 'watercourse-baseline-availability';
    invalidEncroachment: boolean;
    overAllocated: boolean;
    splitAllocation: boolean;
    retainedExceedsLength: boolean;
    unitsLostUnavailable: boolean;
    unavailableResults: Partial<Record<'totalWatercourseUnits' | 'totalWatercourseUnitsSRM' | 'unitsRetained' | 'unitsRetainedWithSRM' | 'unitsEnhanced' | 'unitsLost' | 'vhdhBespokeCompensationUnits', Availability>>;
};

export type WatercourseOffSiteAvailability = {
    rule: 'watercourse-off-site-availability';
    unavailableResults: Partial<Record<'watercourseUnitsDelivered' | 'watercourseUnitsDeliveredWithSpatialRisk' | 'unitsDelivered' | 'netUnitChangeWithSpatialRisk', Availability>>;
};

export type WatercourseEnhancementUnitReview = {
    rule: 'enhancement-unit-review';
    status: 'review' | 'clear' | 'unavailable';
    requiredUnits: number;
    requiredUnitsDecimal: Decimal;
    deficit: number;
    deficitDecimal: Decimal;
};

type EnhancementUnavailableResults = Partial<Record<
    | 'watercourseUnitsDelivered'
    | 'unitsDelivered'
    | 'hedgerowUnitsDelivered'
    | 'watercourseUnitsDeliveredWithSpatialRisk'
    | 'hedgerowUnitsDeliveredWithSpatialRisk',
    Availability
>>;

export type HedgerowBaselineAvailability = {
    rule: 'hedgerow-baseline-allocation';
    status: 'allowed' | 'over-allocated';
    allocationState: 'allowed' | 'over-allocated';
    missingSpatialRisk: boolean;
    missingOffSiteReference: boolean;
    offSite: boolean;
    unitsLostError: boolean;
    message?: 'Retained and enhanced lengths cannot exceed total length';
    unavailableResults: Partial<Record<'lengthLost' | 'unitsLost' | 'totalHedgerowUnits' | 'totalHedgerowUnitsSRM' | 'unitsRetainedWithSRM', Availability>>;
};

export type LinearTimingGuidance =
    | 'Error -both advance and delayed habitat creation ▲'
    | 'Check details - Is there evidence that habitat has reached target condition? ⚠'
    | 'Check details - Is there evidence habitat creation started/in place? ⚠'
    | 'Check details- Delay in starting habitat in required condition? ⚠'
    | 'Standard time to target condition applied';

const ZEROABLE_RESULT_FIELDS = [
    ['lengthLost', 'lengthLostDecimal'],
    ['unitsLost', 'unitsLostDecimal'],
    ['totalHedgerowUnits', 'totalHedgerowUnitsDecimal'],
    ['totalHedgerowUnitsSRM', 'totalHedgerowUnitsSRMDecimal'],
    ['unitsRetainedWithSRM', 'unitsRetainedWithSRMDecimal'],
    ['hedgerowUnitsDelivered', 'hedgerowUnitsDeliveredDecimal'],
    ['hedgerowUnitsDeliveredWithSpatialRisk', 'hedgerowUnitsDeliveredWithSpatialRiskDecimal'],
    ['totalWatercourseUnits', 'totalWatercourseUnitsDecimal'],
    ['totalWatercourseUnitsSRM', 'totalWatercourseUnitsSRMDecimal'],
    ['unitsRetained', 'unitsRetainedDecimal'],
    ['unitsEnhanced', 'unitsEnhancedDecimal'],
    ['vhdhBespokeCompensationUnits', 'vhdhBespokeCompensationUnitsDecimal'],
    ['watercourseUnitsDelivered', 'watercourseUnitsDeliveredDecimal'],
    ['watercourseUnitsDeliveredWithSpatialRisk', 'watercourseUnitsDeliveredWithSpatialRiskDecimal'],
    ['unitsDelivered', 'unitsDeliveredDecimal'],
    ['netUnitChangeWithSpatialRisk', 'netUnitChangeWithSpatialRiskDecimal'],
] as const;

type ZeroableResult = (typeof ZEROABLE_RESULT_FIELDS)[number][0];
type ZeroableResultPair = {
    [Field in ZeroableResult]: readonly [Field, `${Field}Decimal`];
}[ZeroableResult];
const ZEROABLE_RESULT_PAIRS: readonly ZeroableResultPair[] = ZEROABLE_RESULT_FIELDS;
type AvailabilityResult =
    | ZeroableResult
    | 'timeToTargetCondition'
    | 'finalTimeToTargetCondition'
    | 'temporalMultiplier'
    | 'appliedDifficultyMultiplier'
    | 'finalDifficultyOfEnhancement'
    | 'appliedDifficulty';
type AvailabilityMap = Partial<Record<AvailabilityResult, Availability>>;

function zeroUnavailableResults<T extends object>(data: T, unavailableResults: AvailabilityMap): T {
    const result = { ...data };
    for (const [field, decimalField] of ZEROABLE_RESULT_PAIRS) {
        if (unavailableResults[field] === undefined) continue;
        Object.assign(result, { [field]: 0, [decimalField]: new Decimal(0) });
    }
    return result;
}

type TimingYear = number | '30+';
type TimingStandard = TimingYear | 'N/A' | 'Not Possible ▲' | 'Not possible ▲';
type TimingGuidanceInput = {
    standardTimeToTargetCondition?: TimingStandard;
    standardTimeToTarget?: TimingStandard;
    timeToTargetCondition?: TimingStandard;
    habitatCreatedInAdvance?: TimingYear;
    hedgerowEnhancedInAdvance?: TimingYear;
    watercourseEnhancedInAdvance?: TimingYear;
    delayInStartingHabitatCreation?: TimingYear;
    delayInStarting?: TimingYear;
    hedgerowEnhancedDelay?: TimingYear;
    watercourseEnhancedDelay?: TimingYear;
};

export function addLinearTimingGuidance<T extends object>(
    data: T & TimingGuidanceInput,
): T & { standardOrAdjustedTimeToTargetCondition?: LinearTimingGuidance } {
    const standard = data.standardTimeToTargetCondition ?? data.standardTimeToTarget ?? data.timeToTargetCondition;
    if (standard === undefined || (typeof standard !== 'number' && standard !== '30+')) return data;
    const advance = data.habitatCreatedInAdvance ?? data.hedgerowEnhancedInAdvance ?? data.watercourseEnhancedInAdvance ?? 0;
    const delay = data.delayInStartingHabitatCreation ?? data.delayInStarting ?? data.hedgerowEnhancedDelay ?? data.watercourseEnhancedDelay ?? 0;
    const guidance = linearTimingGuidance(standard, advance, delay);
    return { ...data, standardOrAdjustedTimeToTargetCondition: guidance };
}

function linearTimingGuidance(standard: TimingYear, advance: TimingYear, delay: TimingYear): LinearTimingGuidance {
    const advanceIsPositive = advance === '30+' || advance > 0;
    const delayIsPositive = delay === '30+' || delay > 0;
    if (advanceIsPositive && delayIsPositive) return 'Error -both advance and delayed habitat creation ▲';
    if (advance === '30+' || (typeof advance === 'number' && typeof standard === 'number' && advance >= standard)) {
        return 'Check details - Is there evidence that habitat has reached target condition? ⚠';
    }
    if (advanceIsPositive) return 'Check details - Is there evidence habitat creation started/in place? ⚠';
    if (delayIsPositive) return 'Check details- Delay in starting habitat in required condition? ⚠';
    return 'Standard time to target condition applied';
}

export function applyHedgerowBaselineAvailability<T extends object>(data: T & {
    habitatType: HedgerowLabel;
    condition: HedgerowCondition;
    length: number;
    lengthDecimal: Decimal;
    lengthRetained: number;
    lengthRetainedDecimal: Decimal;
    lengthEnhanced: number;
    lengthEnhancedDecimal: Decimal;
    lengthLost?: number;
    lengthLostDecimal?: Decimal;
    unitsLost?: number;
    unitsLostDecimal?: Decimal;
    totalHedgerowUnits?: number;
    totalHedgerowUnitsDecimal?: Decimal;
    totalHedgerowUnitsSRM?: number;
    totalHedgerowUnitsSRMDecimal?: Decimal;
    unitsRetainedWithSRM?: number;
    unitsRetainedWithSRMDecimal?: Decimal;
    spatialRiskCategory?: SpatialRiskCategory;
    offSiteReferenceNumber?: string;
}, offSite = false): T & { hedgerowBaselineAvailability: HedgerowBaselineAvailability } {
    const overAllocated = data.lengthRetainedDecimal.plus(data.lengthEnhancedDecimal).gt(data.lengthDecimal);
    const missingSpatialRisk = offSite && !data.spatialRiskCategory;
    const missingOffSiteReference = offSite && !!data.spatialRiskCategory && !data.offSiteReferenceNumber;
    const unavailableResults = hedgerowBaselineUnavailableResults(
        overAllocated,
        offSite,
        missingSpatialRisk,
        missingOffSiteReference,
    );
    const state: HedgerowBaselineAvailability = {
        rule: 'hedgerow-baseline-allocation',
        status: overAllocated ? 'over-allocated' : 'allowed',
        allocationState: overAllocated ? 'over-allocated' : 'allowed',
        missingSpatialRisk,
        missingOffSiteReference,
        offSite,
        unitsLostError: missingOffSiteReference,
        ...(overAllocated ? { message: 'Retained and enhanced lengths cannot exceed total length' as const } : {}),
        unavailableResults,
    };
    const normalized = { ...data, hedgerowBaselineAvailability: state };
    return zeroUnavailableResults(normalized, unavailableResults);
}

function hedgerowBaselineUnavailableResults(
    overAllocated: boolean,
    offSite: boolean,
    missingSpatialRisk: boolean,
    missingOffSiteReference: boolean,
): HedgerowBaselineAvailability['unavailableResults'] {
    const unavailableResults: HedgerowBaselineAvailability['unavailableResults'] = {};
    if (overAllocated) {
        unavailableResults.lengthLost = 'check-data';
        unavailableResults.unitsLost = 'check-data';
    }
    if (offSite && overAllocated) unavailableResults.totalHedgerowUnits = 'check-data';
    if (offSite && !overAllocated && (missingSpatialRisk || missingOffSiteReference)) {
        unavailableResults.totalHedgerowUnits = 'blank';
    }
    if (missingSpatialRisk) {
        unavailableResults.totalHedgerowUnitsSRM = 'blank';
        unavailableResults.unitsRetainedWithSRM = 'blank';
        unavailableResults.unitsLost = 'blank';
    }
    if (missingOffSiteReference) unavailableResults.unitsLost = 'check-data';
    return unavailableResults;
}

export function applyHedgerowOffSiteAvailability<T extends object>(data: T & {
    spatialRiskCategory?: SpatialRiskCategory;
    offSiteReferenceNumber?: string;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
    hedgerowUnitsDeliveredWithSpatialRisk?: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
}): T & { hedgerowOffSiteAvailability: HedgerowOffSiteAvailability } {
    const unavailableResults: HedgerowOffSiteAvailability['unavailableResults'] = {};
    if (!data.spatialRiskCategory) {
        unavailableResults.hedgerowUnitsDelivered = 'blank';
        unavailableResults.hedgerowUnitsDeliveredWithSpatialRisk = 'blank';
    } else if (!data.offSiteReferenceNumber) {
        unavailableResults.hedgerowUnitsDelivered = 'blank';
    }
    const state = { rule: 'hedgerow-off-site-availability' as const, unavailableResults };
    return zeroUnavailableResults({ ...data, hedgerowOffSiteAvailability: state }, unavailableResults);
}

export function applyHedgerowEnhancementQuality<T extends object>(data: T & {
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
    hedgerowUnitsDeliveredWithSpatialRisk?: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
}, offSite: boolean): T & { hedgerowEnhancementQuality: HedgerowEnhancementQuality } {
    const noEnhancement = data.baseline.distinctivenessScore === data.distinctivenessScore &&
        data.baseline.conditionScore === data.conditionScore;
    const unavailableResults: HedgerowEnhancementQuality['unavailableResults'] = noEnhancement ? {
        timeToTargetCondition: 'check-data',
        finalTimeToTargetCondition: 'check-data',
        temporalMultiplier: 'check-data',
        appliedDifficultyMultiplier: 'check-data',
        finalDifficultyOfEnhancement: 'check-data',
        hedgerowUnitsDelivered: 'blank',
        ...(offSite ? { hedgerowUnitsDeliveredWithSpatialRisk: 'blank' } : {}),
    } : {};
    const state: HedgerowEnhancementQuality = {
        rule: 'hedgerow-enhancement-quality',
        status: noEnhancement ? 'no-enhancement' : 'allowed',
        ...(noEnhancement ? { message: 'Error - No enhancement ▲' as const } : {}),
        unavailableResults,
    };
    return zeroUnavailableResults({ ...data, hedgerowEnhancementQuality: state }, unavailableResults);
}

export function applyLinearTimingAvailability<T extends object>(
    data: T & {
    timeToTargetCondition?: TimingStandard;
    finalTimeToTargetCondition?: TimingStandard;
    watercourseUnitsDelivered?: number;
    watercourseUnitsDeliveredDecimal?: Decimal;
    watercourseUnitsDeliveredWithSpatialRisk?: number;
    watercourseUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
    hedgerowUnitsDelivered?: number;
    hedgerowUnitsDeliveredDecimal?: Decimal;
    hedgerowUnitsDeliveredWithSpatialRisk?: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
    },
    kind: 'hedgerow' | 'watercourse',
    offSite: boolean,
    advance: number | '30+',
    delay: number | '30+',
): T & { linearTimingAvailability: LinearTimingAvailability } {
    const bothPositive = (advance === '30+' || advance > 0) && (delay === '30+' || delay > 0);
    const hedgeFinalIsAvailable =
        advance === '30+' || delay === '30+' || data.finalTimeToTargetCondition === '30+';
    const forbidden = bothPositive && (kind === 'watercourse' || !hedgeFinalIsAvailable);
    const unavailableResults: LinearTimingAvailability['unavailableResults'] = forbidden
        ? timingUnavailableResults(kind, offSite)
        : {};
    const state: LinearTimingAvailability = {
        rule: 'linear-timing-conflict',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error -both advance and delayed habitat creation ▲' as const } : {}),
        unavailableResults,
    };
    return zeroUnavailableResults({ ...data, linearTimingAvailability: state }, unavailableResults);
}

function timingUnavailableResults(kind: 'hedgerow' | 'watercourse', offSite: boolean): LinearTimingAvailability['unavailableResults'] {
    const shared = {
        finalTimeToTargetCondition: 'check-data' as const,
        temporalMultiplier: 'check-data' as const,
        appliedDifficultyMultiplier: 'check-data' as const,
    };
    if (kind === 'hedgerow') {
        return {
            ...shared,
            finalDifficultyOfEnhancement: 'check-data',
            hedgerowUnitsDelivered: 'blank',
            ...(offSite ? { hedgerowUnitsDeliveredWithSpatialRisk: 'blank' as const } : {}),
        };
    }
    return {
        ...shared,
        watercourseUnitsDelivered: 'blank',
        ...(offSite ? { watercourseUnitsDeliveredWithSpatialRisk: 'blank' as const } : {}),
    };
}

export function applyWatercourseBaselineAvailability<T extends object>(data: T & {
    watercourseType: WatercourseType;
    condition: WatercourseCondition;
    watercourseEncroachment: WatercourseEncroachment;
    riparianEncroachment: RiparianEncroachment;
    length: number;
    lengthDecimal?: Decimal;
    lengthRetained: number;
    lengthRetainedDecimal?: Decimal;
    lengthEnhanced: number;
    lengthEnhancedDecimal?: Decimal;
    lengthLost: number;
    lengthLostDecimal: Decimal;
    totalWatercourseUnits: number;
    totalWatercourseUnitsDecimal: Decimal;
    unitsRetained: number;
    unitsRetainedDecimal: Decimal;
    unitsEnhanced: number;
    unitsEnhancedDecimal: Decimal;
    unitsLost: number;
    unitsLostDecimal: Decimal;
    totalWatercourseUnitsSRM?: number;
    totalWatercourseUnitsSRMDecimal?: Decimal;
    vhdhBespokeCompensationUnits: number;
    vhdhBespokeCompensationUnitsDecimal: Decimal;
    unitsRetainedWithSRM?: number;
    unitsRetainedWithSRMDecimal?: Decimal;
}): T & { watercourseBaselineAvailability: WatercourseBaselineAvailability } {
    const invalidEncroachment = hasInvalidWatercourseEncroachment(
        data.watercourseType,
        data.watercourseEncroachment,
        data.riparianEncroachment,
    );
    const length = new Decimal(data.lengthDecimal ?? data.length);
    const lengthRetained = new Decimal(data.lengthRetainedDecimal ?? data.lengthRetained);
    const lengthEnhanced = new Decimal(data.lengthEnhancedDecimal ?? data.lengthEnhanced);
    const overAllocated = lengthRetained.plus(lengthEnhanced).gt(length);
    const splitAllocation = overAllocated && lengthRetained.gt(0) && lengthEnhanced.gt(0);
    const excessiveRetained = lengthRetained.gt(length);
    const unitsLostUnavailable = excessiveRetained || splitAllocation;
    const unavailableResults = watercourseBaselineUnavailableResults(
        invalidEncroachment,
        splitAllocation,
        excessiveRetained,
        unitsLostUnavailable,
        data.totalWatercourseUnitsSRM !== undefined,
        data.unitsRetainedWithSRM !== undefined,
    );
    const lengthLost = Decimal.max(0, data.lengthLostDecimal);
    const normalized = { ...data, lengthLost: lengthLost.toNumber(), lengthLostDecimal: lengthLost };
    const state: WatercourseBaselineAvailability = { rule: 'watercourse-baseline-availability', invalidEncroachment, overAllocated, splitAllocation, retainedExceedsLength: excessiveRetained, unitsLostUnavailable, unavailableResults };
    return zeroUnavailableResults({ ...normalized, watercourseBaselineAvailability: state }, unavailableResults);
}

function hasInvalidWatercourseEncroachment(
    watercourseType: WatercourseType,
    watercourseEncroachment: WatercourseEncroachment,
    riparianEncroachment: RiparianEncroachment,
): boolean {
    const isCulvert = watercourseType === 'Culvert';
    const hasCulvertValue = watercourseEncroachment === 'N/A - Culvert' || riparianEncroachment === 'N/A - Culvert';
    if (isCulvert) return watercourseEncroachment !== 'N/A - Culvert' || riparianEncroachment !== 'N/A - Culvert';
    return hasCulvertValue;
}

function watercourseBaselineUnavailableResults(
    invalidEncroachment: boolean,
    splitAllocation: boolean,
    retainedExceedsLength: boolean,
    unitsLostUnavailable: boolean,
    hasSpatialRiskTotal: boolean,
    hasRetainedSpatialRiskTotal: boolean,
): WatercourseBaselineAvailability['unavailableResults'] {
    if (invalidEncroachment) {
        return {
            totalWatercourseUnits: 'blank',
            ...(hasSpatialRiskTotal ? { totalWatercourseUnitsSRM: 'blank' as const } : {}),
            unitsRetained: 'blank',
            ...(hasRetainedSpatialRiskTotal ? { unitsRetainedWithSRM: 'blank' as const } : {}),
            unitsEnhanced: 'blank',
            unitsLost: 'check-data',
            vhdhBespokeCompensationUnits: 'blank',
        };
    }

    const unavailableResults: WatercourseBaselineAvailability['unavailableResults'] = {};
    if (splitAllocation) {
        unavailableResults.totalWatercourseUnits = 'blank';
        if (hasSpatialRiskTotal) unavailableResults.totalWatercourseUnitsSRM = 'blank';
    }
    if (retainedExceedsLength) {
        unavailableResults.unitsRetained = 'blank';
        if (hasRetainedSpatialRiskTotal) unavailableResults.unitsRetainedWithSRM = 'blank';
    }
    if (unitsLostUnavailable) unavailableResults.unitsLost = 'check-data';
    return unavailableResults;
}

export function applyWatercourseOffSiteAvailability<T extends object>(data: T & {
    offSiteReferenceNumber?: string;
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    watercourseUnitsDeliveredWithSpatialRisk?: number;
    watercourseUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
}): T & { watercourseOffSiteAvailability: WatercourseOffSiteAvailability } {
    const unavailableResults: WatercourseOffSiteAvailability['unavailableResults'] = data.offSiteReferenceNumber
        ? {}
        : { watercourseUnitsDelivered: 'blank' };
    const state = { rule: 'watercourse-off-site-availability' as const, unavailableResults };
    return zeroUnavailableResults({ ...data, watercourseOffSiteAvailability: state }, unavailableResults);
}

export function applyWatercourseCreationTimingAvailability<T extends object>(data: T & {
    habitatCreatedInAdvance: number | '30+';
    delayInStarting: number | '30+';
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
    netUnitChangeWithSpatialRisk?: number;
    netUnitChangeWithSpatialRiskDecimal?: Decimal;
}, offSite: boolean): T & { linearTimingAvailability: WatercourseCreationTimingAvailability } {
    const forbidden = (data.habitatCreatedInAdvance === '30+' || data.habitatCreatedInAdvance > 0) &&
        (data.delayInStarting === '30+' || data.delayInStarting > 0);
    const unavailableResults: WatercourseCreationTimingAvailability['unavailableResults'] = forbidden
        ? {
              finalTimeToTargetCondition: 'check-data',
              temporalMultiplier: 'check-data',
              appliedDifficulty: 'check-data',
              unitsDelivered: 'blank' as const,
              ...(offSite ? { netUnitChangeWithSpatialRisk: 'blank' as const } : {}),
          }
        : {};
    const state: WatercourseCreationTimingAvailability = {
        rule: 'linear-timing-conflict',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error -both advance and delayed habitat creation ▲' as const } : {}),
        unavailableResults,
    };
    return zeroUnavailableResults({ ...data, linearTimingAvailability: state }, unavailableResults);
}

export function applyWatercourseCreationReferenceAvailability<T extends object>(data: T & {
    offSiteReferenceNumber?: string;
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
    netUnitChangeWithSpatialRisk?: number;
    netUnitChangeWithSpatialRiskDecimal?: Decimal;
}): T & { watercourseOffSiteAvailability: WatercourseOffSiteAvailability } {
    const unavailableResults: WatercourseOffSiteAvailability['unavailableResults'] = data.offSiteReferenceNumber
        ? {}
        : { unitsDelivered: 'blank' };
    const state = { rule: 'watercourse-off-site-availability' as const, unavailableResults };
    return zeroUnavailableResults({ ...data, watercourseOffSiteAvailability: state }, unavailableResults);
}

export function applyWatercourseEnhancementUnitReview<T extends object>(data: T & {
    baseline: {
        watercourseType?: WatercourseType;
        condition?: WatercourseCondition;
        length: number;
        lengthDecimal?: Decimal;
        lengthRetained: number;
        lengthRetainedDecimal?: Decimal;
        lengthEnhanced: number;
        lengthEnhancedDecimal?: Decimal;
        totalWatercourseUnits: number;
        totalWatercourseUnitsDecimal?: Decimal;
        unitsRetained: number;
        unitsRetainedDecimal?: Decimal;
        unitsEnhanced: number;
        unitsEnhancedDecimal?: Decimal;
        watercourseBaselineAvailability?: {
            unavailableResults?: Partial<Record<'totalWatercourseUnits' | 'unitsRetained' | 'unitsEnhanced', Availability>>;
        };
    };
    watercourseType?: WatercourseType;
    condition?: WatercourseCondition;
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    enhancementCondition?: { unavailableResults?: EnhancementConditionState['unavailableResults'] };
    enhancementMovement?: { unavailableResults?: WatercourseEnhancementMovementState['unavailableResults'] };
    linearTimingAvailability?: { unavailableResults?: EnhancementUnavailableResults & LinearTimingAvailability['unavailableResults'] };
    watercourseOffSiteAvailability?: { unavailableResults?: EnhancementUnavailableResults & WatercourseOffSiteAvailability['unavailableResults'] };
}): T & { enhancementUnitReview: WatercourseEnhancementUnitReview } {
    const baseline = data.baseline;
    const baselineAvailability = baseline.watercourseBaselineAvailability?.unavailableResults ?? {};
    const deliveryUnavailable = hasUnavailableWatercourseDelivery(data.enhancementCondition?.unavailableResults) ||
        hasUnavailableWatercourseDelivery(data.enhancementMovement?.unavailableResults) ||
        hasUnavailableWatercourseDelivery(data.linearTimingAvailability?.unavailableResults) ||
        hasUnavailableWatercourseDelivery(data.watercourseOffSiteAvailability?.unavailableResults);
    const unavailable = deliveryUnavailable ||
        baselineAvailability.totalWatercourseUnits !== undefined ||
        baselineAvailability.unitsRetained !== undefined ||
        baselineAvailability.unitsEnhanced !== undefined;
    const length = new Decimal(baseline.lengthDecimal ?? baseline.length);
    const lengthRetained = new Decimal(baseline.lengthRetainedDecimal ?? baseline.lengthRetained);
    const lengthEnhanced = new Decimal(baseline.lengthEnhancedDecimal ?? baseline.lengthEnhanced);
    const fullUnits = new Decimal(baseline.totalWatercourseUnitsDecimal ?? baseline.totalWatercourseUnits);
    const retainedUnits = new Decimal(baseline.unitsRetainedDecimal ?? baseline.unitsRetained);
    const enhancedUnits = new Decimal(baseline.unitsEnhancedDecimal ?? baseline.unitsEnhanced);
    const overEnhancedUnits = enhancedUnits.gt(fullUnits);
    const overAllocated = lengthRetained.plus(lengthEnhanced).gt(length);
    const requiredUnitsDecimal = requiredEnhancementUnits(overEnhancedUnits, overAllocated, fullUnits, retainedUnits, enhancedUnits);
    const deficitDecimal = Decimal.max(0, requiredUnitsDecimal.minus(data.watercourseUnitsDeliveredDecimal));
    const status = enhancementUnitReviewStatus(unavailable, requiredUnitsDecimal, data.watercourseUnitsDeliveredDecimal);
    return {
        ...data,
        enhancementUnitReview: {
            rule: 'enhancement-unit-review',
            status,
            requiredUnits: requiredUnitsDecimal.toNumber(),
            requiredUnitsDecimal,
            deficit: deficitDecimal.toNumber(),
            deficitDecimal,
        },
    };
}

function enhancementUnitReviewStatus(
    unavailable: boolean,
    requiredUnits: Decimal,
    deliveredUnits: Decimal,
): WatercourseEnhancementUnitReview['status'] {
    if (unavailable) return 'unavailable';
    if (requiredUnits.gt(deliveredUnits)) return 'review';
    return 'clear';
}

function hasUnavailableWatercourseDelivery(availability: EnhancementUnavailableResults | undefined): boolean {
    return availability?.watercourseUnitsDelivered !== undefined || availability?.unitsDelivered !== undefined;
}

function requiredEnhancementUnits(
    enhancedUnitsExceedFullBaseline: boolean,
    allocationExceedsLength: boolean,
    fullBaselineUnits: Decimal,
    retainedUnits: Decimal,
    enhancedUnits: Decimal,
): Decimal {
    if (enhancedUnitsExceedFullBaseline) return fullBaselineUnits;
    if (allocationExceedsLength) return fullBaselineUnits.minus(retainedUnits);
    return enhancedUnits;
}

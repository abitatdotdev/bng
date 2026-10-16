import { Decimal } from './decimal';

type Availability = 'blank' | 'check-data';

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

function zeroResults<T extends object>(data: T, fields: readonly string[]): T {
    const result = { ...data } as Record<string, unknown>;
    for (const field of fields) {
        result[field] = 0;
        result[`${field}Decimal`] = new Decimal(0);
    }
    return result as T;
}

export function addLinearTimingGuidance<T extends object>(
    data: T,
): T & { standardOrAdjustedTimeToTargetCondition?: LinearTimingGuidance } {
    const fields = data as Record<string, unknown>;
    const standard = fields.standardTimeToTargetCondition ?? fields.standardTimeToTarget ?? fields.timeToTargetCondition;
    if (standard === undefined || standard === 'N/A' || typeof standard !== 'number' && standard !== '30+') return data;
    const advance = fields.habitatCreatedInAdvance ?? fields.hedgerowEnhancedInAdvance ?? fields.watercourseEnhancedInAdvance ?? 0;
    const delay = fields.delayInStartingHabitatCreation ?? fields.delayInStarting ?? fields.hedgerowEnhancedDelay ?? fields.watercourseEnhancedDelay ?? 0;
    const positive = (value: unknown) => value === '30+' || typeof value === 'number' && value > 0;
    let guidance: LinearTimingGuidance = 'Standard time to target condition applied';
    if (positive(advance) && positive(delay)) {
        guidance = 'Error -both advance and delayed habitat creation ▲';
    } else if (advance === '30+' || (typeof standard === 'number' && typeof advance === 'number' && advance >= standard)) {
        guidance = 'Check details - Is there evidence that habitat has reached target condition? ⚠';
    } else if (positive(advance)) {
        guidance = 'Check details - Is there evidence habitat creation started/in place? ⚠';
    } else if (positive(delay)) {
        guidance = 'Check details- Delay in starting habitat in required condition? ⚠';
    }
    return { ...data, standardOrAdjustedTimeToTargetCondition: guidance };
}

export function applyHedgerowBaselineAvailability<T extends {
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
    spatialRiskCategory?: string;
    offSiteReferenceNumber?: string;
}>(data: T, offSite = false): T & { hedgerowBaselineAvailability: HedgerowBaselineAvailability } {
    const overAllocated = data.lengthRetainedDecimal.plus(data.lengthEnhancedDecimal).gt(data.lengthDecimal);
    const missingSpatialRisk = offSite && !data.spatialRiskCategory;
    const missingOffSiteReference = offSite && !!data.spatialRiskCategory && !data.offSiteReferenceNumber;
    const unavailableResults: HedgerowBaselineAvailability['unavailableResults'] = {
        ...(overAllocated ? { lengthLost: 'check-data' as const, unitsLost: 'check-data' as const } : {}),
        ...(offSite && overAllocated
            ? { totalHedgerowUnits: 'check-data' as const }
            : offSite && (missingSpatialRisk || missingOffSiteReference)
              ? { totalHedgerowUnits: 'blank' as const }
              : {}),
        ...(missingSpatialRisk ? { totalHedgerowUnitsSRM: 'blank' as const, unitsRetainedWithSRM: 'blank' as const } : {}),
        ...(missingOffSiteReference ? { unitsLost: 'check-data' as const } : {}),
        ...(missingSpatialRisk ? { unitsLost: 'blank' as const } : {}),
    };
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
    const normalized = overAllocated
        ? zeroResults({ ...data, hedgerowBaselineAvailability: state }, ['lengthLost', 'unitsLost'])
        : { ...data, hedgerowBaselineAvailability: state };
    return zeroResults(normalized, Object.keys(unavailableResults).filter((field) => field !== 'lengthLost'));
}

export function applyHedgerowOffSiteAvailability<T extends {
    spatialRiskCategory?: string;
    offSiteReferenceNumber?: string;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
    hedgerowUnitsDeliveredWithSpatialRisk?: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
}>(data: T): T & { hedgerowOffSiteAvailability: HedgerowOffSiteAvailability } {
    const unavailableResults: HedgerowOffSiteAvailability['unavailableResults'] = {};
    if (!data.spatialRiskCategory) {
        unavailableResults.hedgerowUnitsDelivered = 'blank';
        unavailableResults.hedgerowUnitsDeliveredWithSpatialRisk = 'blank';
    } else if (!data.offSiteReferenceNumber) {
        unavailableResults.hedgerowUnitsDelivered = 'blank';
    }
    const state = { rule: 'hedgerow-off-site-availability' as const, unavailableResults };
    return zeroResults({ ...data, hedgerowOffSiteAvailability: state }, Object.keys(unavailableResults));
}

export function applyHedgerowEnhancementQuality<T extends {
    baseline: { distinctivenessScore: number; conditionScore: number };
    distinctivenessScore: number;
    conditionScore: number;
    hedgerowUnitsDelivered: number;
    hedgerowUnitsDeliveredDecimal: Decimal;
    hedgerowUnitsDeliveredWithSpatialRisk?: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
}>(data: T, offSite: boolean): T & { hedgerowEnhancementQuality: HedgerowEnhancementQuality } {
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
    return zeroResults({ ...data, hedgerowEnhancementQuality: state }, Object.keys(unavailableResults).filter((key) => key.startsWith('hedgerowUnits')));
}

export function applyLinearTimingAvailability<T extends {
    timeToTargetCondition?: number | string;
    finalTimeToTargetCondition?: number | string;
    watercourseUnitsDelivered?: number;
    watercourseUnitsDeliveredDecimal?: Decimal;
    watercourseUnitsDeliveredWithSpatialRisk?: number;
    watercourseUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
    hedgerowUnitsDelivered?: number;
    hedgerowUnitsDeliveredDecimal?: Decimal;
    hedgerowUnitsDeliveredWithSpatialRisk?: number;
    hedgerowUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
}>(
    data: T,
    kind: 'hedgerow' | 'watercourse',
    offSite: boolean,
    advance: number | '30+',
    delay: number | '30+',
): T & { linearTimingAvailability: LinearTimingAvailability } {
    const bothPositive = (advance === '30+' || advance > 0) && (delay === '30+' || delay > 0);
    const hedgeFinalIsAvailable =
        advance === '30+' || delay === '30+' || data.finalTimeToTargetCondition === '30+';
    const forbidden = bothPositive && (kind === 'watercourse' || !hedgeFinalIsAvailable);
    const fields = kind === 'hedgerow'
        ? ['hedgerowUnitsDelivered', ...(offSite ? ['hedgerowUnitsDeliveredWithSpatialRisk'] : [])]
        : ['watercourseUnitsDelivered', ...(offSite ? ['watercourseUnitsDeliveredWithSpatialRisk'] : [])];
    const unavailableResults: LinearTimingAvailability['unavailableResults'] = forbidden ? {
        finalTimeToTargetCondition: 'check-data',
        temporalMultiplier: 'check-data',
        appliedDifficultyMultiplier: 'check-data',
        ...(kind === 'hedgerow' ? { finalDifficultyOfEnhancement: 'check-data' as const } : {}),
        ...Object.fromEntries(fields.map((field) => [field, 'blank' as const])),
    } : {};
    const state: LinearTimingAvailability = {
        rule: 'linear-timing-conflict',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error -both advance and delayed habitat creation ▲' as const } : {}),
        unavailableResults,
    };
    return zeroResults({ ...data, linearTimingAvailability: state }, forbidden ? fields : []);
}

export function applyWatercourseBaselineAvailability<T extends {
    watercourseType: string;
    watercourseEncroachment: string;
    riparianEncroachment: string;
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
}>(data: T): T & { watercourseBaselineAvailability: WatercourseBaselineAvailability } {
    const isCulvert = data.watercourseType === 'Culvert';
    const invalidEncroachment =
        (isCulvert && (data.watercourseEncroachment !== 'N/A - Culvert' || data.riparianEncroachment !== 'N/A - Culvert')) ||
        (!isCulvert && (data.watercourseEncroachment === 'N/A - Culvert' || data.riparianEncroachment === 'N/A - Culvert'));
    const length = new Decimal(data.lengthDecimal ?? data.length);
    const lengthRetained = new Decimal(data.lengthRetainedDecimal ?? data.lengthRetained);
    const lengthEnhanced = new Decimal(data.lengthEnhancedDecimal ?? data.lengthEnhanced);
    const overAllocated = lengthRetained.plus(lengthEnhanced).gt(length);
    const splitAllocation = overAllocated && lengthRetained.gt(0) && lengthEnhanced.gt(0);
    const excessiveRetained = lengthRetained.gt(length);
    const unitsLostUnavailable = excessiveRetained || splitAllocation;
    const unavailableResults: WatercourseBaselineAvailability['unavailableResults'] = invalidEncroachment
        ? { totalWatercourseUnits: 'blank', ...(data.totalWatercourseUnitsSRM !== undefined ? { totalWatercourseUnitsSRM: 'blank' as const } : {}), unitsRetained: 'blank', ...(data.unitsRetainedWithSRM !== undefined ? { unitsRetainedWithSRM: 'blank' as const } : {}), unitsEnhanced: 'blank', unitsLost: 'check-data', vhdhBespokeCompensationUnits: 'blank' }
        : {
            ...(splitAllocation ? { totalWatercourseUnits: 'blank' as const, ...(data.totalWatercourseUnitsSRM !== undefined ? { totalWatercourseUnitsSRM: 'blank' as const } : {}) } : {}),
            ...(excessiveRetained ? { unitsRetained: 'blank' as const, ...(data.unitsRetainedWithSRM !== undefined ? { unitsRetainedWithSRM: 'blank' as const } : {}) } : {}),
            ...(unitsLostUnavailable ? { unitsLost: 'check-data' as const } : {}),
        };
    const lengthLost = Decimal.max(0, data.lengthLostDecimal);
    const normalized = { ...data, lengthLost: lengthLost.toNumber(), lengthLostDecimal: lengthLost };
    const state: WatercourseBaselineAvailability = { rule: 'watercourse-baseline-availability', invalidEncroachment, overAllocated, splitAllocation, retainedExceedsLength: excessiveRetained, unitsLostUnavailable, unavailableResults };
    return zeroResults({ ...normalized, watercourseBaselineAvailability: state }, Object.keys(unavailableResults));
}

export function applyWatercourseOffSiteAvailability<T extends {
    offSiteReferenceNumber?: string;
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    watercourseUnitsDeliveredWithSpatialRisk?: number;
    watercourseUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
}>(data: T): T & { watercourseOffSiteAvailability: WatercourseOffSiteAvailability } {
    const unavailableResults: WatercourseOffSiteAvailability['unavailableResults'] = data.offSiteReferenceNumber
        ? {}
        : { watercourseUnitsDelivered: 'blank' };
    const state = { rule: 'watercourse-off-site-availability' as const, unavailableResults };
    return zeroResults({ ...data, watercourseOffSiteAvailability: state }, Object.keys(unavailableResults));
}

export function applyWatercourseCreationTimingAvailability<T extends {
    habitatCreatedInAdvance: number | '30+';
    delayInStarting: number | '30+';
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
    netUnitChangeWithSpatialRisk?: number;
    netUnitChangeWithSpatialRiskDecimal?: Decimal;
}>(data: T, offSite: boolean): T & { linearTimingAvailability: WatercourseCreationTimingAvailability } {
    const forbidden = (data.habitatCreatedInAdvance === '30+' || data.habitatCreatedInAdvance > 0) &&
        (data.delayInStarting === '30+' || data.delayInStarting > 0);
    const fields = ['unitsDelivered', ...(offSite ? ['netUnitChangeWithSpatialRisk'] : [])];
    const unavailableResults: WatercourseCreationTimingAvailability['unavailableResults'] = forbidden ? {
        finalTimeToTargetCondition: 'check-data',
        temporalMultiplier: 'check-data',
        appliedDifficulty: 'check-data',
        ...Object.fromEntries(fields.map((field) => [field, 'blank' as const])),
    } : {};
    const state: WatercourseCreationTimingAvailability = {
        rule: 'linear-timing-conflict',
        status: forbidden ? 'forbidden' : 'allowed',
        ...(forbidden ? { message: 'Error -both advance and delayed habitat creation ▲' as const } : {}),
        unavailableResults,
    };
    return zeroResults({ ...data, linearTimingAvailability: state }, forbidden ? fields : []);
}

export function applyWatercourseCreationReferenceAvailability<T extends {
    offSiteReferenceNumber?: string;
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
    netUnitChangeWithSpatialRisk?: number;
    netUnitChangeWithSpatialRiskDecimal?: Decimal;
}>(data: T): T & { watercourseOffSiteAvailability: WatercourseOffSiteAvailability } {
    const unavailableResults: WatercourseOffSiteAvailability['unavailableResults'] = data.offSiteReferenceNumber
        ? {}
        : { unitsDelivered: 'blank' };
    const state = { rule: 'watercourse-off-site-availability' as const, unavailableResults };
    return zeroResults({ ...data, watercourseOffSiteAvailability: state }, ['unitsDelivered'].filter((field) => unavailableResults[field as 'unitsDelivered']));
}

export function applyWatercourseEnhancementUnitReview<T extends {
    baseline: {
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
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    enhancementCondition?: { unavailableResults?: Record<string, Availability> };
    enhancementMovement?: { unavailableResults?: Record<string, Availability> };
    linearTimingAvailability?: { unavailableResults?: Record<string, Availability> };
    watercourseOffSiteAvailability?: { unavailableResults?: Record<string, Availability> };
}>(data: T): T & { enhancementUnitReview: WatercourseEnhancementUnitReview } {
    const baseline = data.baseline;
    const baselineAvailability = baseline.watercourseBaselineAvailability?.unavailableResults ?? {};
    const deliveryUnavailable = [
        data.enhancementCondition?.unavailableResults,
        data.enhancementMovement?.unavailableResults,
        data.linearTimingAvailability?.unavailableResults,
        data.watercourseOffSiteAvailability?.unavailableResults,
    ].some((availability) =>
        availability?.watercourseUnitsDelivered !== undefined || availability?.unitsDelivered !== undefined,
    );
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
    const requiredUnitsDecimal = overEnhancedUnits
        ? fullUnits
        : overAllocated
          ? fullUnits.minus(retainedUnits)
          : enhancedUnits;
    const deficitDecimal = Decimal.max(0, requiredUnitsDecimal.minus(data.watercourseUnitsDeliveredDecimal));
    const status = unavailable
        ? 'unavailable'
        : requiredUnitsDecimal.gt(data.watercourseUnitsDeliveredDecimal)
          ? 'review'
          : 'clear';
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

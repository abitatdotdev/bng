import { Decimal } from '../decimal';
import { enhancementConditionAllowed } from '../enhancementCondition';
import { zeroUnavailableResults, zeroableResultPairs, type UnavailableResults } from '../resultAvailability';
import {
    decideWatercourseBaseline,
    watercourseEnhancementMovementAllowed,
    watercourseEnhancementUnitReview,
    type WatercourseEnhancementUnitReview as UnitReview,
} from '../watercourseAvailability';
import type { WatercourseType } from '../watercourseType';
import type { WatercourseEncroachment, RiparianEncroachment } from '../watercourseEncroachment';
import type { WatercourseCondition } from '../watercourseCondition';

type BaselineResult = 'totalWatercourseUnits' | 'unitsRetained' | 'unitsEnhanced' | 'unitsLost' | 'vhdhBespokeCompensationUnits';
type BaselineNumericResults = {
    [Field in BaselineResult]: number;
} & {
    [Field in `${BaselineResult}Decimal`]: Decimal;
};

export type WatercourseBaselineAvailability = {
    rule: 'watercourse-baseline-availability';
    invalidEncroachment: boolean;
    overAllocated: boolean;
    splitAllocation: boolean;
    retainedExceedsLength: boolean;
    unitsLostUnavailable: boolean;
    unavailableResults: UnavailableResults<BaselineResult>;
};

const zeroBaselineResults = zeroUnavailableResults(zeroableResultPairs<BaselineNumericResults>()([
    ['totalWatercourseUnits', 'totalWatercourseUnitsDecimal'],
    ['unitsRetained', 'unitsRetainedDecimal'],
    ['unitsEnhanced', 'unitsEnhancedDecimal'],
    ['unitsLost', 'unitsLostDecimal'],
    ['vhdhBespokeCompensationUnits', 'vhdhBespokeCompensationUnitsDecimal'],
]));

export function applyOnSiteWatercourseBaselineAvailability<T extends {
    watercourseType: WatercourseType;
    watercourseEncroachment: WatercourseEncroachment;
    riparianEncroachment: RiparianEncroachment;
    length: number;
    lengthDecimal: Decimal;
    lengthRetained: number;
    lengthRetainedDecimal: Decimal;
    lengthEnhanced: number;
    lengthEnhancedDecimal: Decimal;
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
    vhdhBespokeCompensationUnits: number;
    vhdhBespokeCompensationUnitsDecimal: Decimal;
}>(data: T): T & { watercourseBaselineAvailability: WatercourseBaselineAvailability } {
    const decision = decideWatercourseBaseline({
        watercourseType: data.watercourseType,
        watercourseEncroachment: data.watercourseEncroachment,
        riparianEncroachment: data.riparianEncroachment,
        length: data.lengthDecimal,
        lengthRetained: data.lengthRetainedDecimal,
        lengthEnhanced: data.lengthEnhancedDecimal,
        lengthLost: data.lengthLostDecimal,
    });
    const unavailableResults: WatercourseBaselineAvailability['unavailableResults'] = {};

    if (decision.invalidEncroachment) {
        unavailableResults.totalWatercourseUnits = 'blank';
        unavailableResults.unitsRetained = 'blank';
        unavailableResults.unitsEnhanced = 'blank';
        unavailableResults.unitsLost = 'check-data';
        unavailableResults.vhdhBespokeCompensationUnits = 'blank';
    } else {
        if (decision.splitAllocation) unavailableResults.totalWatercourseUnits = 'blank';
        if (decision.retainedExceedsLength) unavailableResults.unitsRetained = 'blank';
        if (decision.unitsLostUnavailable) unavailableResults.unitsLost = 'check-data';
    }

    const state: WatercourseBaselineAvailability = {
        rule: 'watercourse-baseline-availability',
        invalidEncroachment: decision.invalidEncroachment,
        overAllocated: decision.overAllocated,
        splitAllocation: decision.splitAllocation,
        retainedExceedsLength: decision.retainedExceedsLength,
        unitsLostUnavailable: decision.unitsLostUnavailable,
        unavailableResults,
    };
    const normalized = zeroBaselineResults(data, unavailableResults);
    return {
        ...normalized,
        lengthLost: decision.lengthLost.toNumber(),
        lengthLostDecimal: decision.lengthLost,
        watercourseBaselineAvailability: state,
    };
}

type EnhancementResult =
    | 'timeToTargetCondition'
    | 'standardOrAdjustedTimeToTargetCondition'
    | 'finalTimeToTargetCondition'
    | 'temporalMultiplier'
    | 'appliedDifficultyMultiplier'
    | 'watercourseUnitsDelivered'
    | 'watercourseUnitsDeliveredWithSpatialRisk';

export type WatercourseEnhancementConditionAvailability = {
    rule: 'enhancement-condition-reduction';
    status: 'allowed' | 'forbidden';
    message?: 'Error - Can not reduce condition ▲';
    unavailableResults: UnavailableResults<EnhancementResult>;
};

export type WatercourseEnhancementMovementAvailability = {
    rule: 'watercourse-enhancement-movement';
    status: 'allowed' | 'forbidden';
    message?: 'Error Trading Down ▲';
    unavailableResults: UnavailableResults<EnhancementResult>;
};

export type WatercourseEnhancementAvailability = {
    enhancementCondition: WatercourseEnhancementConditionAvailability;
    enhancementMovement: WatercourseEnhancementMovementAvailability;
};

const zeroEnhancementResults = zeroUnavailableResults(zeroableResultPairs<{
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
}>()([
    ['watercourseUnitsDelivered', 'watercourseUnitsDeliveredDecimal'],
]));

export function applyOnSiteWatercourseEnhancementAvailability<T extends {
    baseline: { watercourseType: WatercourseType; conditionScore: number | 'Not possible' };
    watercourseType: WatercourseType;
    conditionScore: number | 'Not possible';
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
}>(data: T): T & WatercourseEnhancementAvailability {
    const conditionAllowed = enhancementConditionAllowed(
        data.baseline.conditionScore,
        data.conditionScore,
    );
    const movementAllowed = watercourseEnhancementMovementAllowed(
        data.baseline.watercourseType,
        data.watercourseType,
    );
    const conditionUnavailableResults = conditionAllowed ? {} : {
        timeToTargetCondition: 'check-data',
        standardOrAdjustedTimeToTargetCondition: 'check-data',
        finalTimeToTargetCondition: 'check-data',
        temporalMultiplier: 'check-data',
        appliedDifficultyMultiplier: 'check-data',
        watercourseUnitsDelivered: 'blank',
    } satisfies UnavailableResults<EnhancementResult>;
    const conditionState: WatercourseEnhancementConditionAvailability = {
        rule: 'enhancement-condition-reduction',
        status: conditionAllowed ? 'allowed' : 'forbidden',
        ...(!conditionAllowed ? { message: 'Error - Can not reduce condition ▲' as const } : {}),
        unavailableResults: conditionUnavailableResults,
    };
    const movementUnavailableResults = movementAllowed ? {} : {
        timeToTargetCondition: 'check-data',
        standardOrAdjustedTimeToTargetCondition: 'check-data',
        finalTimeToTargetCondition: 'check-data',
        temporalMultiplier: 'check-data',
        appliedDifficultyMultiplier: 'check-data',
        watercourseUnitsDelivered: 'blank',
    } satisfies UnavailableResults<EnhancementResult>;
    const movementState: WatercourseEnhancementMovementAvailability = {
        rule: 'watercourse-enhancement-movement',
        status: movementAllowed ? 'allowed' : 'forbidden',
        ...(!movementAllowed ? { message: 'Error Trading Down ▲' as const } : {}),
        unavailableResults: movementUnavailableResults,
    };
    const combinedUnavailableResults = {
        ...conditionUnavailableResults,
        ...movementUnavailableResults,
    };
    const normalized = zeroEnhancementResults(data, combinedUnavailableResults);
    return {
        ...normalized,
        enhancementCondition: conditionState,
        enhancementMovement: movementState,
    };
}

export function applyOnSiteWatercourseEnhancementUnitReview<T extends {
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
            unavailableResults?: UnavailableResults<'totalWatercourseUnits' | 'unitsRetained' | 'unitsEnhanced'>;
        };
    };
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    enhancementCondition?: { unavailableResults?: UnavailableResults<EnhancementResult> };
    enhancementMovement?: { unavailableResults?: UnavailableResults<EnhancementResult> };
    linearTimingAvailability?: { unavailableResults?: UnavailableResults<EnhancementResult> };
}>(data: T): T & { enhancementUnitReview: UnitReview } {
    return {
        ...data,
        enhancementUnitReview: watercourseEnhancementUnitReview({
            unavailable: hasUnavailableDelivery(data) || hasUnavailableBaseline(data.baseline),
            baselineLength: new Decimal(data.baseline.lengthDecimal ?? data.baseline.length),
            baselineLengthRetained: new Decimal(data.baseline.lengthRetainedDecimal ?? data.baseline.lengthRetained),
            baselineLengthEnhanced: new Decimal(data.baseline.lengthEnhancedDecimal ?? data.baseline.lengthEnhanced),
            fullBaselineUnits: new Decimal(data.baseline.totalWatercourseUnitsDecimal ?? data.baseline.totalWatercourseUnits),
            retainedUnits: new Decimal(data.baseline.unitsRetainedDecimal ?? data.baseline.unitsRetained),
            enhancedUnits: new Decimal(data.baseline.unitsEnhancedDecimal ?? data.baseline.unitsEnhanced),
            deliveredUnits: data.watercourseUnitsDeliveredDecimal,
        }),
    };
}

function hasUnavailableDelivery(data: {
    enhancementCondition?: { unavailableResults?: UnavailableResults<EnhancementResult> };
    enhancementMovement?: { unavailableResults?: UnavailableResults<EnhancementResult> };
    linearTimingAvailability?: { unavailableResults?: UnavailableResults<EnhancementResult> };
}): boolean {
    return data.enhancementCondition?.unavailableResults?.watercourseUnitsDelivered !== undefined ||
        data.enhancementMovement?.unavailableResults?.watercourseUnitsDelivered !== undefined ||
        data.linearTimingAvailability?.unavailableResults?.watercourseUnitsDelivered !== undefined;
}

function hasUnavailableBaseline(baseline: {
    watercourseBaselineAvailability?: {
        unavailableResults?: UnavailableResults<'totalWatercourseUnits' | 'unitsRetained' | 'unitsEnhanced'>;
    };
}): boolean {
    const unavailable = baseline.watercourseBaselineAvailability?.unavailableResults;
    return unavailable?.totalWatercourseUnits !== undefined || unavailable?.unitsRetained !== undefined ||
        unavailable?.unitsEnhanced !== undefined;
}

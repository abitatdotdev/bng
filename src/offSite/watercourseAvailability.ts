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

type BaselineResult =
    | 'totalWatercourseUnits'
    | 'totalWatercourseUnitsSRM'
    | 'unitsRetained'
    | 'unitsRetainedWithSRM'
    | 'unitsEnhanced'
    | 'unitsLost'
    | 'vhdhBespokeCompensationUnits';
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
    ['totalWatercourseUnitsSRM', 'totalWatercourseUnitsSRMDecimal'],
    ['unitsRetained', 'unitsRetainedDecimal'],
    ['unitsRetainedWithSRM', 'unitsRetainedWithSRMDecimal'],
    ['unitsEnhanced', 'unitsEnhancedDecimal'],
    ['unitsLost', 'unitsLostDecimal'],
    ['vhdhBespokeCompensationUnits', 'vhdhBespokeCompensationUnitsDecimal'],
]));

export function applyOffSiteWatercourseBaselineAvailability<T extends {
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
    totalWatercourseUnitsSRM: number;
    totalWatercourseUnitsSRMDecimal: Decimal;
    unitsRetained: number;
    unitsRetainedDecimal: Decimal;
    unitsRetainedWithSRM: number;
    unitsRetainedWithSRMDecimal: Decimal;
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
        unavailableResults.totalWatercourseUnitsSRM = 'blank';
        unavailableResults.unitsRetained = 'blank';
        unavailableResults.unitsRetainedWithSRM = 'blank';
        unavailableResults.unitsEnhanced = 'blank';
        unavailableResults.unitsLost = 'check-data';
        unavailableResults.vhdhBespokeCompensationUnits = 'blank';
    } else {
        if (decision.splitAllocation) {
            unavailableResults.totalWatercourseUnits = 'blank';
            unavailableResults.totalWatercourseUnitsSRM = 'blank';
        }
        if (decision.retainedExceedsLength) {
            unavailableResults.unitsRetained = 'blank';
            unavailableResults.unitsRetainedWithSRM = 'blank';
        }
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

export type WatercourseEnhancementAvailability = {
    enhancementCondition: {
        rule: 'enhancement-condition-reduction';
        status: 'allowed' | 'forbidden';
        message?: 'Error - Can not reduce condition ▲';
        unavailableResults: UnavailableResults<EnhancementResult>;
    };
    enhancementMovement: {
        rule: 'watercourse-enhancement-movement';
        status: 'allowed' | 'forbidden';
        message?: 'Error Trading Down ▲';
        unavailableResults: UnavailableResults<EnhancementResult>;
    };
};

type EnhancementUnitResults = {
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    watercourseUnitsDeliveredWithSpatialRisk: number;
    watercourseUnitsDeliveredWithSpatialRiskDecimal: Decimal;
};
const zeroEnhancementResults = zeroUnavailableResults(zeroableResultPairs<EnhancementUnitResults>()([
    ['watercourseUnitsDelivered', 'watercourseUnitsDeliveredDecimal'],
    ['watercourseUnitsDeliveredWithSpatialRisk', 'watercourseUnitsDeliveredWithSpatialRiskDecimal'],
]));

export function applyOffSiteWatercourseEnhancementAvailability<T extends {
    baseline: { watercourseType: WatercourseType; conditionScore: number | 'Not possible' };
    watercourseType: WatercourseType;
    conditionScore: number | 'Not possible';
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    watercourseUnitsDeliveredWithSpatialRisk: number;
    watercourseUnitsDeliveredWithSpatialRiskDecimal: Decimal;
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
        watercourseUnitsDeliveredWithSpatialRisk: 'blank',
    } satisfies UnavailableResults<EnhancementResult>;
    const conditionState: WatercourseEnhancementAvailability['enhancementCondition'] = {
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
        watercourseUnitsDeliveredWithSpatialRisk: 'blank',
    } satisfies UnavailableResults<EnhancementResult>;
    const movementState: WatercourseEnhancementAvailability['enhancementMovement'] = {
        rule: 'watercourse-enhancement-movement',
        status: movementAllowed ? 'allowed' : 'forbidden',
        ...(!movementAllowed ? { message: 'Error Trading Down ▲' as const } : {}),
        unavailableResults: movementUnavailableResults,
    };
    const normalized = zeroEnhancementResults(data, {
        ...conditionUnavailableResults,
        ...movementUnavailableResults,
    });
    return {
        ...normalized,
        enhancementCondition: conditionState,
        enhancementMovement: movementState,
    };
}

type OffSiteResult =
    | 'watercourseUnitsDelivered'
    | 'watercourseUnitsDeliveredWithSpatialRisk'
    | 'unitsDelivered'
    | 'netUnitChangeWithSpatialRisk';

export type WatercourseOffSiteAvailability = {
    rule: 'watercourse-off-site-availability';
    unavailableResults: UnavailableResults<OffSiteResult>;
};

export function applyOffSiteWatercourseEnhancementReferenceAvailability<T extends {
    offSiteReferenceNumber?: string;
    watercourseUnitsDelivered: number;
    watercourseUnitsDeliveredDecimal: Decimal;
    watercourseUnitsDeliveredWithSpatialRisk: number;
    watercourseUnitsDeliveredWithSpatialRiskDecimal: Decimal;
}>(data: T): T & { watercourseOffSiteAvailability: WatercourseOffSiteAvailability } {
    const unavailableResults: WatercourseOffSiteAvailability['unavailableResults'] = data.offSiteReferenceNumber
        ? {}
        : { watercourseUnitsDelivered: 'blank' };
    const normalized = zeroEnhancementResults(data, unavailableResults);
    return {
        ...normalized,
        watercourseOffSiteAvailability: {
            rule: 'watercourse-off-site-availability',
            unavailableResults,
        },
    };
}

type CreationReferenceResult = 'unitsDelivered' | 'netUnitChangeWithSpatialRisk';

export type WatercourseCreationReferenceAvailability = {
    rule: 'watercourse-off-site-availability';
    unavailableResults: UnavailableResults<CreationReferenceResult>;
};

type CreationUnitResults = {
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
    netUnitChangeWithSpatialRisk: number;
    netUnitChangeWithSpatialRiskDecimal: Decimal;
};
const zeroCreationResults = zeroUnavailableResults(zeroableResultPairs<CreationUnitResults>()([
    ['unitsDelivered', 'unitsDeliveredDecimal'],
    ['netUnitChangeWithSpatialRisk', 'netUnitChangeWithSpatialRiskDecimal'],
]));

export function applyOffSiteWatercourseCreationReferenceAvailability<T extends {
    offSiteReferenceNumber?: string;
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
    netUnitChangeWithSpatialRisk: number;
    netUnitChangeWithSpatialRiskDecimal: Decimal;
}>(data: T): T & { watercourseOffSiteAvailability: WatercourseCreationReferenceAvailability } {
    const unavailableResults: WatercourseCreationReferenceAvailability['unavailableResults'] = data.offSiteReferenceNumber
        ? {}
        : { unitsDelivered: 'blank' };
    const normalized = zeroCreationResults(data, unavailableResults);
    return {
        ...normalized,
        watercourseOffSiteAvailability: {
            rule: 'watercourse-off-site-availability',
            unavailableResults,
        },
    };
}

export function applyOffSiteWatercourseEnhancementUnitReview<T extends {
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
    watercourseOffSiteAvailability?: { unavailableResults?: UnavailableResults<EnhancementResult> };
}>(data: T): T & { enhancementUnitReview: UnitReview } {
    const baseline = data.baseline;
    const baselineUnavailable = baseline.watercourseBaselineAvailability?.unavailableResults;
    const unavailable = hasUnavailableDelivery(data) ||
        baselineUnavailable?.totalWatercourseUnits !== undefined ||
        baselineUnavailable?.unitsRetained !== undefined ||
        baselineUnavailable?.unitsEnhanced !== undefined;
    return {
        ...data,
        enhancementUnitReview: watercourseEnhancementUnitReview({
            unavailable,
            baselineLength: new Decimal(baseline.lengthDecimal ?? baseline.length),
            baselineLengthRetained: new Decimal(baseline.lengthRetainedDecimal ?? baseline.lengthRetained),
            baselineLengthEnhanced: new Decimal(baseline.lengthEnhancedDecimal ?? baseline.lengthEnhanced),
            fullBaselineUnits: new Decimal(baseline.totalWatercourseUnitsDecimal ?? baseline.totalWatercourseUnits),
            retainedUnits: new Decimal(baseline.unitsRetainedDecimal ?? baseline.unitsRetained),
            enhancedUnits: new Decimal(baseline.unitsEnhancedDecimal ?? baseline.unitsEnhanced),
            deliveredUnits: data.watercourseUnitsDeliveredDecimal,
        }),
    };
}

function hasUnavailableDelivery(data: {
    enhancementCondition?: { unavailableResults?: UnavailableResults<EnhancementResult> };
    enhancementMovement?: { unavailableResults?: UnavailableResults<EnhancementResult> };
    linearTimingAvailability?: { unavailableResults?: UnavailableResults<EnhancementResult> };
    watercourseOffSiteAvailability?: { unavailableResults?: UnavailableResults<EnhancementResult> };
}): boolean {
    return data.enhancementCondition?.unavailableResults?.watercourseUnitsDelivered !== undefined ||
        data.enhancementMovement?.unavailableResults?.watercourseUnitsDelivered !== undefined ||
        data.linearTimingAvailability?.unavailableResults?.watercourseUnitsDelivered !== undefined ||
        data.watercourseOffSiteAvailability?.unavailableResults?.watercourseUnitsDelivered !== undefined;
}

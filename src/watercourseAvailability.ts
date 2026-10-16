import { Decimal } from './decimal';
import type { WatercourseType } from './watercourseType';
import type { WatercourseEncroachment, RiparianEncroachment } from './watercourseEncroachment';
import { allWatercourses, type Watercourse } from './watercourses';
import { enhancementConditionAllowed } from './enhancementCondition';

export type WatercourseBaselineDecision = {
    invalidEncroachment: boolean;
    overAllocated: boolean;
    splitAllocation: boolean;
    retainedExceedsLength: boolean;
    unitsLostUnavailable: boolean;
    lengthLost: Decimal;
};

export function decideWatercourseBaseline(input: {
    watercourseType: WatercourseType;
    watercourseEncroachment: WatercourseEncroachment;
    riparianEncroachment: RiparianEncroachment;
    length: Decimal;
    lengthRetained: Decimal;
    lengthEnhanced: Decimal;
    lengthLost: Decimal;
}): WatercourseBaselineDecision {
    const invalidEncroachment = hasInvalidEncroachment(
        input.watercourseType,
        input.watercourseEncroachment,
        input.riparianEncroachment,
    );
    const overAllocated = input.lengthRetained.plus(input.lengthEnhanced).greaterThan(input.length);
    const splitAllocation = overAllocated && input.lengthRetained.greaterThan(0) && input.lengthEnhanced.greaterThan(0);
    const retainedExceedsLength = input.lengthRetained.greaterThan(input.length);

    return {
        invalidEncroachment,
        overAllocated,
        splitAllocation,
        retainedExceedsLength,
        unitsLostUnavailable: retainedExceedsLength || splitAllocation,
        lengthLost: Decimal.max(0, input.lengthLost),
    };
}

function hasInvalidEncroachment(
    watercourseType: WatercourseType,
    watercourseEncroachment: WatercourseEncroachment,
    riparianEncroachment: RiparianEncroachment,
): boolean {
    const isCulvert = watercourseType === 'Culvert';
    const hasCulvertValue = watercourseEncroachment === 'N/A - Culvert' || riparianEncroachment === 'N/A - Culvert';
    return isCulvert
        ? watercourseEncroachment !== 'N/A - Culvert' || riparianEncroachment !== 'N/A - Culvert'
        : hasCulvertValue;
}

export function watercourseEnhancementMovementAllowed(
    baselineWatercourseType: WatercourseType,
    proposedWatercourseType: WatercourseType,
): boolean {
    const baselineScore: Watercourse['distinctivenessScore'] = allWatercourses[baselineWatercourseType].distinctivenessScore;
    const proposedScore: Watercourse['distinctivenessScore'] = allWatercourses[proposedWatercourseType].distinctivenessScore;
    return !(baselineScore > proposedScore);
}

export type WatercourseEnhancementUnitReview = {
    rule: 'enhancement-unit-review';
    status: 'review' | 'clear' | 'unavailable';
    requiredUnits: number;
    requiredUnitsDecimal: Decimal;
    deficit: number;
    deficitDecimal: Decimal;
};

export function watercourseEnhancementUnitReview(input: {
    unavailable: boolean;
    baselineLength: Decimal;
    baselineLengthRetained: Decimal;
    baselineLengthEnhanced: Decimal;
    fullBaselineUnits: Decimal;
    retainedUnits: Decimal;
    enhancedUnits: Decimal;
    deliveredUnits: Decimal;
}): WatercourseEnhancementUnitReview {
    const enhancedUnitsExceedFullBaseline = input.enhancedUnits.greaterThan(input.fullBaselineUnits);
    const allocationExceedsLength = input.baselineLengthRetained.plus(input.baselineLengthEnhanced)
        .greaterThan(input.baselineLength);
    const requiredUnitsDecimal = requiredEnhancementUnits(
        enhancedUnitsExceedFullBaseline,
        allocationExceedsLength,
        input.fullBaselineUnits,
        input.retainedUnits,
        input.enhancedUnits,
    );
    const deficitDecimal = Decimal.max(0, requiredUnitsDecimal.minus(input.deliveredUnits));

    return {
        rule: 'enhancement-unit-review',
        status: input.unavailable
            ? 'unavailable'
            : requiredUnitsDecimal.greaterThan(input.deliveredUnits)
                ? 'review'
                : 'clear',
        requiredUnits: requiredUnitsDecimal.toNumber(),
        requiredUnitsDecimal,
        deficit: deficitDecimal.toNumber(),
        deficitDecimal,
    };
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

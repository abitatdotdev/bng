import { Decimal, toDecimal } from './decimal';
import { getTemporalMultiplier, type TemporalMultiplierKey } from './temporalMultipliers';

export type AreaTargetTime = number | '30+' | 'Not Possible ▲';
export type AreaTimingYears = number | '30+';

export function hasAreaHabitatReachedTarget(
    standardTime: AreaTargetTime,
    advance: AreaTimingYears,
) {
    if (standardTime === 'Not Possible ▲') return false;
    // Excel compares the text 30+ above numeric years, without converting it to 30.
    if (advance === '30+') return true;
    return typeof standardTime === 'number' && advance >= standardTime;
}

export function calculateAreaEnhancementTimingEvidence(
    standardTime: AreaTargetTime,
    advance: AreaTimingYears,
    delay: AreaTimingYears,
) {
    if ((advance === '30+' || advance > 0) && (delay === '30+' || delay > 0)) {
        return 'Error -both advance and delayed habitat creation ▲';
    }
    if (hasAreaHabitatReachedTarget(standardTime, advance) && delay === 0) {
        return 'Check details - Is there evidence that habitat has reached target condition? ⚠';
    }
    if (advance === '30+' || advance > 0) {
        return 'Check details - Is there evidence habitat creation started/in place? ⚠';
    }
    if (delay === '30+' || delay > 0) {
        return 'Check details- Delay in starting habitat in required condition? ⚠';
    }
    return 'Standard time to target condition applied';
}

export function calculateFinalTimeToTargetCondition<
    Data extends {
        timeToTargetCondition: AreaTargetTime;
        advance: AreaTimingYears;
        delay: AreaTimingYears;
    },
>(data: Data) {
    const { timeToTargetCondition, advance, delay } = data;
    const normalisedAdvance = typeof advance === 'string' ? 30 : advance;
    const normalisedDelay = typeof delay === 'string' ? 30 : delay;
    const finalTimeToTargetCondition = finalTimeToTargetResult(
        timeToTargetCondition,
        advance,
        normalisedAdvance,
        normalisedDelay,
    );

    return {
        ...data,
        finalTimeToTargetCondition,
        finalTimeToTargetConditionDecimal:
            typeof finalTimeToTargetCondition === 'number'
                ? toDecimal(finalTimeToTargetCondition)
                : finalTimeToTargetCondition,
    };
}

function finalTimeToTargetResult(
    targetTime: AreaTargetTime,
    advance: AreaTimingYears,
    normalisedAdvance: number,
    normalisedDelay: number,
): AreaTargetTime {
    if (targetTime === 'Not Possible ▲') return 'Not Possible ▲';
    if (targetTime === '30+') {
        if (advance === 0) return '30+';
        return Decimal.max(0, new Decimal(30).minus(normalisedAdvance)).toNumber();
    }
    if (normalisedAdvance >= targetTime) return 0;

    const adjustedTime = new Decimal(targetTime)
        .minus(normalisedAdvance)
        .plus(normalisedDelay)
        .toNumber();
    if (adjustedTime > 30) return '30+';
    return Decimal.max(0, adjustedTime).toNumber();
}

export function lookupFinalTimeToTargetMultiplier<
    Data extends {
        finalTimeToTargetCondition: AreaTargetTime;
    },
>(data: Data) {
    const multiplierKey = String(data.finalTimeToTargetCondition) as TemporalMultiplierKey;
    const multiplierResult = getTemporalMultiplier(multiplierKey);

    const finalTimeToTargetMultiplier = multiplierResult === 'N/A' ? undefined : multiplierResult;

    return {
        ...data,
        finalTimeToTargetMultiplier,
        finalTimeToTargetMultiplierDecimal:
            typeof finalTimeToTargetMultiplier === 'number'
                ? toDecimal(finalTimeToTargetMultiplier)
                : finalTimeToTargetMultiplier,
    };
}

export function calculateFinalTimeToTargetValues<
    Data extends {
        timeToTargetCondition: AreaTargetTime;
        advance: AreaTimingYears;
        delay: AreaTimingYears;
    },
>(data: Data) {
    return lookupFinalTimeToTargetMultiplier(calculateFinalTimeToTargetCondition(data));
}

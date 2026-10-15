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

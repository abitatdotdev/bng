export type TimingYear = number | '30+';

export type TimingStandard = TimingYear | 'N/A' | 'Not Possible ▲' | 'Not possible ▲';

export type LinearTimingGuidance =
    | 'Error -both advance and delayed habitat creation ▲'
    | 'Check details - Is there evidence that habitat has reached target condition? ⚠'
    | 'Check details - Is there evidence habitat creation started/in place? ⚠'
    | 'Check details- Delay in starting habitat in required condition? ⚠'
    | 'Standard time to target condition applied';

export type LinearTimingInput = {
    standard: TimingYear;
    advance: TimingYear;
    delay: TimingYear;
};

export function isTimingYear(value: TimingStandard | undefined): value is TimingYear {
    return typeof value === 'number' || value === '30+';
}

export function linearTimingGuidance({ standard, advance, delay }: LinearTimingInput): LinearTimingGuidance {
    const advanceIsPositive = advance === '30+' || advance > 0;
    const delayIsPositive = delay === '30+' || delay > 0;
    if (advanceIsPositive && delayIsPositive) return 'Error -both advance and delayed habitat creation ▲';
    if (advance === '30+' || (typeof standard === 'number' && typeof advance === 'number' && advance >= standard)) {
        return 'Check details - Is there evidence that habitat has reached target condition? ⚠';
    }
    if (advanceIsPositive) return 'Check details - Is there evidence habitat creation started/in place? ⚠';
    if (delayIsPositive) return 'Check details- Delay in starting habitat in required condition? ⚠';
    return 'Standard time to target condition applied';
}

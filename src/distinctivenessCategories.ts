import * as v from 'valibot';

export const distinctivenessSchema = v.picklist([
    'V.High',
    'High',
    'Medium',
    'Low',
    'V. Low',
    'Irreplaceable',
])

export const distinctivenessCategories = {
    vHigh: { score: 8 as const, suggestedAction: 'Same habitat required – bespoke compensation option ⚠' as const },
    high: { score: 6 as const, suggestedAction: 'Same habitat required =' as const },
    medium: { score: 4 as const, suggestedAction: 'Same broad habitat or a higher distinctiveness habitat required (≥)' as const },
    low: { score: 2 as const, suggestedAction: 'Same distinctiveness or better habitat required ≥' as const },
    vLow: { score: 0 as const, suggestedAction: 'Compensation Not Required' as const },
    irreplaceable: { score: Infinity, suggestedAction: 'Bespoke compensation likely to be required' as const }
} as const;


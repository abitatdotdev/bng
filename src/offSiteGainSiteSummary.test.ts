import { describe, expect, test } from 'bun:test';
import {
    calculateOffSiteGainSiteSummary,
    hasOffSiteGainSiteLoss,
    type OffSiteGainSiteContribution,
} from './offSiteGainSiteSummary';

describe('calculateOffSiteGainSiteSummary', () => {
    test('aggregates contributions for the same trimmed gain-site reference', () => {
        const contributions: OffSiteGainSiteContribution[] = [
            { reference: ' Site A ', baseline: 10, retained: 2, created: 3 },
            { reference: 'Site A', baseline: 4, retained: 1, enhanced: 5 },
            { reference: 'Site B', baseline: 2, created: 2 },
        ];

        expect(calculateOffSiteGainSiteSummary(contributions)).toMatchObject([
            {
                reference: 'Site A',
                baseline: 14,
                retained: 3,
                created: 3,
                enhanced: 5,
                netChange: -3,
                isLoss: true,
            },
            {
                reference: 'Site B',
                baseline: 2,
                retained: 0,
                created: 2,
                enhanced: 0,
                netChange: 0,
                isLoss: false,
            },
        ]);
    });

    test('treats omitted unit values as zero and preserves decimal arithmetic', () => {
        const result = calculateOffSiteGainSiteSummary([
            { reference: 'Decimal Site', baseline: 0.3 },
            { reference: 'Decimal Site', created: 0.1, enhanced: 0.2 },
        ]);

        expect(result).toMatchObject([
            {
                reference: 'Decimal Site',
                baseline: 0.3,
                retained: 0,
                created: 0.1,
                enhanced: 0.2,
                netChange: 0,
                isLoss: false,
            },
        ]);
    });

    test('ignores blank references and returns no groups for empty input', () => {
        expect(calculateOffSiteGainSiteSummary([
            { reference: '   ', baseline: 10 },
            { reference: '\t', created: 2 },
        ])).toEqual([]);
        expect(calculateOffSiteGainSiteSummary([])).toEqual([]);
    });

    test('marks a site as loss only when its aggregated net change is negative', () => {
        const result = calculateOffSiteGainSiteSummary([
            { reference: 'Loss', baseline: 5, retained: 4 },
            { reference: 'Break even', baseline: 4, created: 4 },
            { reference: 'Gain', baseline: 2, created: 3 },
            { reference: 'Zero balance' },
        ]);

        expect(result.map(({ reference, netChange, isLoss }) => ({ reference, netChange, isLoss }))).toEqual([
            { reference: 'Loss', netChange: -1, isLoss: true },
            { reference: 'Break even', netChange: 0, isLoss: false },
            { reference: 'Gain', netChange: 1, isLoss: false },
            { reference: 'Zero balance', netChange: 0, isLoss: false },
        ]);
    });
});

describe('hasOffSiteGainSiteLoss', () => {
    test('returns true when any gain site is flagged as a loss', () => {
        const results = calculateOffSiteGainSiteSummary([
            { reference: 'Gain', baseline: 1, created: 2 },
            { reference: 'Loss', baseline: 2, retained: 1 },
        ]);

        expect(hasOffSiteGainSiteLoss(results)).toBeTrue();
    });

    test('returns false when there are no losses or no results', () => {
        expect(hasOffSiteGainSiteLoss(calculateOffSiteGainSiteSummary([
            { reference: 'Break even', baseline: 2, retained: 2 },
            { reference: 'Gain', created: 1 },
        ]))).toBeFalse();
        expect(hasOffSiteGainSiteLoss([])).toBeFalse();
    });
});

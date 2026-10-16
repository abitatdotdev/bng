import { describe, expect, test } from 'bun:test';
import {
    calculateOffSiteGainSiteSummary,
    hasOffSiteGainSiteLoss,
    type OffSiteGainSiteContribution,
} from './offSiteGainSiteSummary';

describe('calculateOffSiteGainSiteSummary', () => {
    test('matches workbook reference criteria while preserving labels', () => {
        const contributions: OffSiteGainSiteContribution[] = [
            { reference: 'A', baseline: 1 },
            { reference: 'a', created: 1 },
            { reference: ' A', baseline: 1 },
            { reference: ' ', baseline: 1 },
        ];

        expect(calculateOffSiteGainSiteSummary(contributions)).toMatchObject([
            {
                reference: 'A',
                baseline: 1,
                created: 1,
                netChange: 0,
                isLoss: false,
            },
            {
                reference: ' A',
                baseline: 1,
                netChange: -1,
                isLoss: true,
            },
            { reference: ' ', baseline: 1, netChange: -1, isLoss: true },
        ]);
    });

    test('uses wildcard and escaped-wildcard criteria', () => {
        expect(calculateOffSiteGainSiteSummary([
            { reference: '*', baseline: 1 },
            { reference: 'other', created: 1 },
        ])).toMatchObject([
            { reference: '*', baseline: 1, created: 1, netChange: 0 },
            { reference: 'other', created: 1, netChange: 1 },
        ]);

        expect(calculateOffSiteGainSiteSummary([
            { reference: '~*', baseline: 1 },
            { reference: '*', created: 1 },
        ])).toMatchObject([
            { reference: '~*', baseline: 0, created: 1, netChange: 1 },
            { reference: '*', baseline: 1, created: 1, netChange: 0 },
        ]);
    });

    test('matches probed Excel operator criteria across text reference cells', () => {
        const source: OffSiteGainSiteContribution[] = [
            { reference: 'A', baseline: 1 }, { reference: 'a', baseline: 2 },
            { reference: ' A', baseline: 3 }, { reference: ' ', baseline: 4 },
            { reference: '*', baseline: 5 }, { reference: '?', baseline: 6 },
            { reference: '~', baseline: 7 }, { reference: '0', baseline: 8 },
            { reference: '01', baseline: 9 }, { reference: '1', baseline: 10 },
            { reference: '10', baseline: 11 }, { reference: 'B', baseline: 12 },
        ];
        const criteria = ['=0', '=00', '=1', '<>1', '<1', '<=1', '>1', '>=1', '=1*', '<>1*', '=*', '<>*', '=~*', '=A*', '<>A*'];
        const results = calculateOffSiteGainSiteSummary([
            ...source,
            ...criteria.map((reference) => ({ reference, baseline: 0 })),
        ]);
        const totalFor = (reference: string) => results.find((result) => result.reference === reference)?.baseline;

        expect(totalFor('=0')).toBe(8);
        expect(totalFor('=00')).toBe(8);
        expect(totalFor('=1')).toBe(19);
        expect(totalFor('<>1')).toBe(78);
        expect(totalFor('<1')).toBe(0);
        expect(totalFor('<=1')).toBe(0);
        expect(totalFor('>1')).toBe(0);
        expect(totalFor('>=1')).toBe(0);
        expect(totalFor('=1*')).toBe(21);
        expect(totalFor('<>1*')).toBe(57);
        expect(totalFor('=*')).toBe(78);
        expect(totalFor('<>*')).toBe(0);
        expect(totalFor('=~*')).toBe(5);
        expect(totalFor('=A*')).toBe(3);
        expect(totalFor('<>A*')).toBe(75);
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

    test('ignores literal blank references and returns no groups for empty input', () => {
        expect(calculateOffSiteGainSiteSummary([{ reference: '', baseline: 10 }])).toEqual([]);
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

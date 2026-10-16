import { describe, expect, test } from 'bun:test';
import { featuresFromInput } from './featuresFromInput';

describe('featuresFromInput Start metadata', () => {
    test('keeps Start fields outside the 18 AllFeatures arrays and returns semantic issues', () => {
        const result = featuresFromInput({
            startPage: {
                completedBy: '',
                dateOfMetricCompletion: '',
                netGainTarget: '0.05',
                netGainTargetEntered: true,
                containsMetricDeviations: 'Yes',
            },
        });

        expect(Object.keys(result.features)).toHaveLength(18);
        expect(result.projectIssues.map(({ rule }) => rule)).toEqual([
            'completed-by-date-required',
            'completed-by-date-required',
            'minimum-target',
            'metric-deviations',
        ]);
        expect(result.issues).toEqual([]);
    });

    test('reports malformed target input without throwing', () => {
        const result = featuresFromInput({ startPage: {
            completedBy: 'Surveyor',
            dateOfMetricCompletion: '2026-10-16',
            netGainTarget: ' 0.1 ' as never,
        } });

        expect(result.projectIssues).toMatchObject([
            { field: 'netGainTarget', rule: 'invalid-start-input', kind: 'parse' },
        ]);
    });


    test('reports non-object Start metadata and invalid booleans as project parse issues', () => {
        const malformedShape = featuresFromInput({ startPage: null as never });
        expect(malformedShape.projectIssues).toContainEqual({
            sheet: 'start',
            field: 'startPage',
            rule: 'invalid-start-input',
            message: 'Invalid Start metadata: expected an object',
            kind: 'parse',
        });
        expect(malformedShape).not.toHaveProperty('startPage');

        const malformedField = featuresFromInput({
            startPage: { netGainTargetEntered: 'yes' as never },
        });
        expect(malformedField.projectIssues).toContainEqual(
            expect.objectContaining({ field: 'netGainTargetEntered', rule: 'invalid-start-input', kind: 'parse' }),
        );
    });

    test('uses workbook literal-empty checks and treats blank entered target as omitted', () => {
        const result = featuresFromInput({
            startPage: {
                completedBy: ' ',
                dateOfMetricCompletion: ' ',
                netGainTargetEntered: true,
            },
        });

        expect(result.projectIssues).toEqual([]);
    });
});

import { describe, expect, test } from 'bun:test';
import { parseFile } from '../src/parsers/parseFile';
import { parseStartPage } from '../src/parsers/startPage';
import type { SheetView } from '../src/parsers/excelHelpers';

describe('Start page parser', () => {
    test('parses Start!F11:F22 from a metric workbook', () => {
        const parsed = parseFile('./examples/less-simple.xlsm');

        expect(parsed.startPage).toEqual({
            planningAuthority: 'Cheshire West and Cheshire',
            projectName: 'Eaton Homes Phase 4 Beeston',
            applicant: 'Eaton Homes Phase 4 Beeston',
            applicationType: 'Full',
            planningApplicationReference: undefined,
            completedBy: 'Roy Leigh',
            dateOfMetricCompletion: '2024-01-23',
            reviewer: undefined,
            calculationIteration: undefined,
            planningAuthorityReviewer: undefined,
            dateOfPlanningAuthorityReview: undefined,
            netGainTarget: 0.1,
        });
    });

    test('normalizes text, dates and percentage strings', () => {
        const cells = new Map<string, string | number>([
            ['10:5', '  Authority  '],
            ['16:5', 45587],
            ['18:5', '3a'],
            ['20:5', '2025-02-03'],
            ['21:5', '20%'],
        ]);
        const sheet: SheetView = {
            getCell: (row, col) => cells.get(`${row}:${col}`) ?? null,
        };

        expect(parseStartPage(sheet)).toMatchObject({
            planningAuthority: 'Authority',
            dateOfMetricCompletion: '2024-10-22',
            calculationIteration: '3a',
            dateOfPlanningAuthorityReview: '2025-02-03',
            netGainTarget: 0.2,
        });
    });
});

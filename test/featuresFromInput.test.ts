import { describe, expect, test } from 'bun:test';

import { decodeCol } from '../src/parsers/cellRef';
import {
    getSheet,
    sheetJsView,
    type SheetView,
} from '../src/parsers/excelHelpers';
import parseFile, { findAllDataRows, parseWorkbook } from '../src/parsers/parseFile';
import {
    parseOffSiteHabitatBaselineRow,
    parseOffSiteHabitatCreationRow,
    parseOffSiteHabitatEnhancementRow,
    parseOffSiteHedgerowBaselineRow,
    parseOffSiteHedgerowCreationRow,
    parseOffSiteHedgerowEnhancementRow,
    parseOffSiteWatercourseBaselineRow,
    parseOffSiteWatercourseCreationRow,
    parseOffSiteWatercourseEnhancementRow,
    parseOnSiteHabitatBaselineRow,
    parseOnSiteHabitatCreationRow,
    parseOnSiteHabitatEnhancementRow,
    parseOnSiteHedgerowBaselineRow,
    parseOnSiteHedgerowCreationRow,
    parseOnSiteHedgerowEnhancementRow,
    parseOnSiteWatercourseBaselineRow,
    parseOnSiteWatercourseCreationRow,
    parseOnSiteWatercourseEnhancementRow,
} from '../src/parsers/rowParsers';
import {
    offSiteHabitatBaselineSpec,
    offSiteHabitatCreationSpec,
    offSiteHabitatEnhancementSpec,
    offSiteHedgerowBaselineSpec,
    offSiteHedgerowCreationSpec,
    offSiteHedgerowEnhancementSpec,
    offSiteWatercourseBaselineSpec,
    offSiteWatercourseCreationSpec,
    offSiteWatercourseEnhancementSpec,
    onSiteHabitatBaselineSpec,
    onSiteHabitatCreationSpec,
    onSiteHabitatEnhancementSpec,
    onSiteHedgerowBaselineSpec,
    onSiteHedgerowCreationSpec,
    onSiteHedgerowEnhancementSpec,
    onSiteWatercourseBaselineSpec,
    onSiteWatercourseCreationSpec,
    onSiteWatercourseEnhancementSpec,
    type SheetSpec,
} from '../src/parsers/columnMappings';
import { featuresFromInput, type BngInput } from '../src/parsers/featuresFromInput';
import { headlineResults } from '../src/headlineResults';
import { tradingSummaries } from '../src/tradingSummaries';
import { unitShortfall } from '../src/unitShortfall';

const EXAMPLE = './examples/simple-unlocked.xlsm';

// The 12 baseline/creation sheets: their row parser takes only their own sheet.
const simpleSheets: [
    keyof BngInput,
    SheetSpec,
    (sheet: SheetView, row: number) => unknown,
][] = [
    ['onSiteHabitatBaselines', onSiteHabitatBaselineSpec, parseOnSiteHabitatBaselineRow],
    ['onSiteHabitatCreations', onSiteHabitatCreationSpec, parseOnSiteHabitatCreationRow],
    ['offSiteHabitatBaselines', offSiteHabitatBaselineSpec, parseOffSiteHabitatBaselineRow],
    ['offSiteHabitatCreations', offSiteHabitatCreationSpec, parseOffSiteHabitatCreationRow],
    ['onSiteHedgerowBaselines', onSiteHedgerowBaselineSpec, parseOnSiteHedgerowBaselineRow],
    ['onSiteHedgerowCreations', onSiteHedgerowCreationSpec, parseOnSiteHedgerowCreationRow],
    ['offSiteHedgerowBaselines', offSiteHedgerowBaselineSpec, parseOffSiteHedgerowBaselineRow],
    ['offSiteHedgerowCreations', offSiteHedgerowCreationSpec, parseOffSiteHedgerowCreationRow],
    ['onSiteWatercourseBaselines', onSiteWatercourseBaselineSpec, parseOnSiteWatercourseBaselineRow],
    ['onSiteWatercourseCreations', onSiteWatercourseCreationSpec, parseOnSiteWatercourseCreationRow],
    ['offSiteWatercourseBaselines', offSiteWatercourseBaselineSpec, parseOffSiteWatercourseBaselineRow],
    ['offSiteWatercourseCreations', offSiteWatercourseCreationSpec, parseOffSiteWatercourseCreationRow],
];

// The 6 enhancement sheets: their row parser also needs the paired baseline
// sheet, which it reads to embed the baseline input under `baseline`.
const enhancementSheets: [
    keyof BngInput,
    SheetSpec,
    SheetSpec,
    (baselineSheet: SheetView, sheet: SheetView, row: number) => unknown,
][] = [
    ['onSiteHabitatEnhancements', onSiteHabitatEnhancementSpec, onSiteHabitatBaselineSpec, parseOnSiteHabitatEnhancementRow],
    ['offSiteHabitatEnhancements', offSiteHabitatEnhancementSpec, offSiteHabitatBaselineSpec, parseOffSiteHabitatEnhancementRow],
    ['onSiteHedgerowEnhancements', onSiteHedgerowEnhancementSpec, onSiteHedgerowBaselineSpec, parseOnSiteHedgerowEnhancementRow],
    ['offSiteHedgerowEnhancements', offSiteHedgerowEnhancementSpec, offSiteHedgerowBaselineSpec, parseOffSiteHedgerowEnhancementRow],
    ['onSiteWatercourseEnhancements', onSiteWatercourseEnhancementSpec, onSiteWatercourseBaselineSpec, parseOnSiteWatercourseEnhancementRow],
    ['offSiteWatercourseEnhancements', offSiteWatercourseEnhancementSpec, offSiteWatercourseBaselineSpec, parseOffSiteWatercourseEnhancementRow],
];

// Reconstruct the raw JSON input (`BngInput`) that a REST caller would send,
// by extracting the *input* row shapes from a real workbook with the same
// row parsers `parseFile` uses. Feeding this to `featuresFromInput` must
// reproduce exactly what `parseFile` produces from the same workbook.
function inputFromWorkbook(fileName: string): BngInput {
    const workbook = parseWorkbook(fileName);
    const input: Record<string, unknown[]> = {};

    for (const [key, spec, parseRow] of simpleSheets) {
        const sheet = sheetJsView(getSheet(workbook, spec.name)!);
        const rows = findAllDataRows(sheet, decodeCol(spec.dataDetectionColumn), spec.startRow);
        input[key] = rows.map((row) => parseRow(sheet, row));
    }

    for (const [key, spec, baselineSpec, parseRow] of enhancementSheets) {
        const sheet = sheetJsView(getSheet(workbook, spec.name)!);
        const baselineSheet = sheetJsView(getSheet(workbook, baselineSpec.name)!);
        const rows = findAllDataRows(sheet, decodeCol(spec.dataDetectionColumn), spec.startRow);
        input[key] = rows.map((row) => parseRow(baselineSheet, sheet, row));
    }

    return input as BngInput;
}

describe('featuresFromInput', () => {
    test('empty input yields all-empty, frozen features and no issues', () => {
        const { features, issues } = featuresFromInput({});
        expect(issues).toEqual([]);
        expect(Object.isFrozen(features)).toBe(true);
        expect(features.onSiteHabitatBaselines).toEqual([]);
        expect(features.offSiteWatercourseEnhancements).toEqual([]);
    });

    test('missing keys are treated as empty arrays', () => {
        const { features } = featuresFromInput({ onSiteHabitatBaselines: [] });
        // Every one of the 18 keys is present even when the input omitted it.
        const byKey = features as unknown as Record<string, unknown[]>;
        for (const [key] of [...simpleSheets, ...enhancementSheets]) {
            expect(byKey[key]).toEqual([]);
        }
    });

    test('validate:true collects per-row issues instead of throwing', () => {
        const { features, issues } = featuresFromInput(
            {
                // Nonsense broad-habitat/type combo: parses shape, fails checks.
                onSiteHabitatBaselines: [{ broadHabitat: 'not-a-habitat' } as never],
            },
            { validate: true },
        );
        expect(issues.length).toBeGreaterThan(0);
        expect(issues[0].sheet).toBe('onSiteHabitatBaselines');
        expect(issues[0].index).toBe(0);
        // The bad row is dropped, not included.
        expect(features.onSiteHabitatBaselines).toEqual([]);
    });

    // The core guarantee: JSON in == xlsm in. Extract the inputs a caller
    // would post from a real workbook and assert `featuresFromInput`
    // reproduces `parseFile` byte-for-byte, then that the calculators agree.
    describe('round-trips a real workbook (== parseFile)', () => {
        const input = inputFromWorkbook(EXAMPLE);
        const fromJson = featuresFromInput(input, { validate: false }).features;
        const fromFile = parseFile(EXAMPLE, { validate: false });

        test('assembled AllFeatures is identical', () => {
            expect(fromJson).toEqual(fromFile);
        });

        test('headlineResults / tradingSummaries / unitShortfall agree', () => {
            const jsonSums = tradingSummaries(fromJson);
            const fileSums = tradingSummaries(fromFile);
            expect(jsonSums).toEqual(fileSums);

            const jsonHeadline = headlineResults(fromJson, jsonSums);
            const fileHeadline = headlineResults(fromFile, fileSums);
            expect(jsonHeadline).toEqual(fileHeadline);

            expect(unitShortfall(fromJson, jsonHeadline, jsonSums)).toEqual(
                unitShortfall(fromFile, fileHeadline, fileSums),
            );
        });
    });
});

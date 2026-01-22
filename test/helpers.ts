import XLSX from 'xlsx';
import { describe } from "bun:test";
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { parseWorkbook } from '../src/parsers/parseFile';

// All example sheets from the default location
const exampleMetricsFileNames =
    existsSync('./test/metrics') ?
        (await readdir('./test/metrics'))
            .filter(f => f.includes('.xlsx') || f.includes('.xlsm'))
            // Blacklist some files
            .filter(name =>
                ![
                    // seems to have uncompleted tree rows - they don't look valid to me
                    'BCP_APP_24_00318_F.xlsx',
                    // random zeros in D-2
                    'Lake District_7_2024_2105.xlsm',
                    // incompatible broad habitat/habitat type in A-2 row 13
                    'Rother_RR_2024_1825_P.xlsx',
                    // invalid entries in A-3 Bespoke Compensation field
                    'Bath and North East Somerset_240_1231_FUL.xlsm',
                    // missing condition in A-1 row 20
                    'BCP_APP_24_00939_F.xlsx',
                    // invalid combination of broad habitat and habitat type in A-3 row 12
                    'EAST_HAMPSHIRE_60033.xlsm',
                    // invalid row in C-3 (looks incomplete)
                    'Warrington_2024_012222_FUL.xlsm',
                ].includes(name)
            )
            .map(f => [`./test/metrics/${f}`])
        : []

export const EXCEL_FILES = [
    ["./examples/simple-unlocked.xlsm"],
    ...exampleMetricsFileNames.slice(0, 250),
]
// Whitelist to help with test isolation when debugging
// .filter(([name]) => name === './test/metrics/Warrington_2024_012222_FUL.xlsm')

type ExcelFileTest = (workbook: XLSX.WorkBook, fileName: string) => void

/**
  * Run the given test against the example metric spreadsheets.
  *
  * @param files A list of files to test against. 
  * @param test The test to execute. Receives the file name and the excel workbook object
  */
export const testExcelFiles = (files: typeof EXCEL_FILES, test: ExcelFileTest): void =>
    describe.each(files)(
        "%s", fileName => {
            try {
                const workbook = parseWorkbook(fileName);
                console.info(`Testing ${fileName}...`)
                test(workbook, fileName)
            } catch {
                describe.skip("Not a valid version to compare against", () => { });
                return;
            }
        }
    )

/**
 * Helper to normalize numeric values for comparison (handles floating point precision)
 */
export function normalizeNumber(value: any): number {
    if (typeof value === "number") {
        return Math.round(value * 100000000) / 100000000; // 8 decimal places
    }
    return 0;
}

/**
 * Helper to compare two numeric values with tolerance
 */
export function expectCloseTo(actual: number, expected: number, tolerance: number = 0.0001, fieldName?: string) {
    const diff = Math.abs(actual - expected);
    if (diff >= tolerance) {
        throw new Error(`${fieldName || 'Value'} mismatch: expected ${expected}, got ${actual} (diff: ${diff})`);
    }
}

const MAX_DATA_ROWS = 100;


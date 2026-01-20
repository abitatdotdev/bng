import XLSX from 'xlsx';
import { describe, expect } from "bun:test";
import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import * as v from 'valibot';

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

// Default, simplest, built-in example.
const EXCEL_FILE = './examples/simple-unlocked.xlsm';

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
            const sheetsToGrab = [
                // 'Introduction',
                // 'Start',
                // 'Main Menu',
                // 'Unit shortfall summary',
                // 'Results',
                'Headline Results',
                // 'Detailed Results',
                // 'Trading Summary Area Habitats',
                // 'Trading Summary Hedgerows',
                // "Trading Summary WaterC's",
                // 'Off-site gain site summary',
                // 'Irreplaceable Habitats',
                'A-1 On-Site Habitat Baseline',
                'A-2 On-Site Habitat Creation',
                'A-3 On-Site Habitat Enhancement',
                'D-1 Off-Site Habitat Baseline',
                'D-2 Off-Site Habitat Creation',
                'D-3 Off-Site Habitat Enhancment',
                'B-1 On-Site Hedge Baseline',
                'B-2 On-Site Hedge Creation',
                'B-3 On-Site Hedge Enhancement',
                'E-1 Off-Site Hedge Baseline',
                'E-2 Off-Site Hedge Creation',
                'E-3 Off-Site Hedge Enhancement',
                "C-1 On-Site WaterC' Baseline",
                "C-2 On-Site WaterC' Creation",
                "C-3 On-Site WaterC' Enhancement",
                "F-1 Off-Site WaterC' Baseline",
                "F-2 Off-Site WaterC' Creation",
                'F-3 Off-Site WaterC Enhancement',
                // 'Unit shortfall calculations',
                // 'G-1 All Habitats',
                // 'G-2 Habitat groups',
                // 'G-3 Multipliers',
                // 'G-4 Temporal multipliers',
                // 'G-5 Enhancement Temporal',
                // 'G-6 Hedgerow Data',
                // "G-7 WaterC' Data",
                // 'G-8 Condition Look up',
                'Version History',
                // 'Phase 1 Translation Tool',
                // 'Technical Data',
                // 'Lists'
            ]
            const workbook = getWorkbook(fileName, sheetsToGrab);
            const versionSheet = getSheet(workbook, "Version History");
            if (!versionSheet) {
                describe.skip("Not a valid version to compare against", () => { });
                return;
            }
            console.info(`Testing ${fileName}...`)
            test(workbook, fileName)
        }
    )

export function getWorkbook(fileName = EXCEL_FILE, sheets: string[]) {
    const buffer = readFileSync(fileName);
    return XLSX.read(buffer, {
        cellFormula: false,
        cellHTML: false,
        sheetRows: MAX_DATA_ROWS,
        sheets
    });
}

export function getSheet(workbook: XLSX.WorkBook, sheetName: string) {
    return workbook.Sheets[sheetName];
}

/**
 * Cache for sheet data converted to array of arrays
 * Uses WeakMap so memory is freed when sheets are garbage collected
 */
const sheetDataCache = new WeakMap<XLSX.WorkSheet, any[][]>();

/**
 * Helper function to get cell value from worksheet
 * Uses cached array of arrays for faster access
 */
export function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): any {
    // Try to get cached data
    let data = sheetDataCache.get(sheet);

    if (!data) {
        // Convert sheet to array of arrays and cache it
        data = XLSX.utils.sheet_to_json(
            sheet,
            {
                header: 1,
                raw: true,
                // Always use the whole sheet
                range: `A1:ZZ${MAX_DATA_ROWS}`
            }
        ) as any[][];
        sheetDataCache.set(sheet, data);
    }

    // Access the cell from the cached array
    if (row < data.length && data[row] && col < data[row].length) {
        const value = data[row][col];
        return value === undefined ? null : value;
    }

    return null;
}

/**
 * Helper to convert Excel true/false to boolean
 */
export function parseBoolean(value: any): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const lower = value.toLowerCase();
        return lower === "yes" || lower === "true" || lower === "y";
    }
    return false;
}

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

const dataValueSchema = v.union([
    v.pipe(v.string(), v.trim(), v.minLength(1)),
    v.pipe(v.number()),
])
const MAX_DATA_ROWS = 100;
/**
 * Find all data rows in a sheet
 */
export function findAllDataRows(sheet: XLSX.WorkSheet, columnToCheckPresence: number, startRow: number = 10, maxRows: number = MAX_DATA_ROWS): number[] {
    const dataRows: number[] = [];
    let consecutiveEmpty = 0;
    for (let row = startRow; row < startRow + maxRows; row++) {
        const value = getCellValue(sheet, row, columnToCheckPresence);
        const parsed = v.safeParse(dataValueSchema, value);
        if (parsed.success && parsed.output !== "Broad Habitat") {
            dataRows.push(row);
            consecutiveEmpty = 0;
        } else {
            consecutiveEmpty++;
            if (consecutiveEmpty > 10) break; // Stop after 10 empty rows
        }
    }
    return dataRows;
}

export function findRow(sheet: XLSX.WorkSheet, columnToCheckPresence: number, value: unknown, maxRows: number = MAX_DATA_ROWS): number | null {
    for (let row = 0; row < maxRows; row++) {
        const cellValue = getCellValue(sheet, row, columnToCheckPresence);
        if (value === cellValue) return row;
    }
    return null;
}

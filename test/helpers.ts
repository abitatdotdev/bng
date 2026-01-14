import XLSX from 'xlsx';
import { describe } from "bun:test";
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';

// All example sheets from the default location
const exampleMetricsFileNames =
    existsSync('./test/metrics') ?
        (await readdir('./test/metrics'))
            .filter(f => f.includes('.xlsx') || f.includes('.xlsm'))
            .map(f => [`./test/metrics/${f}`])
        : []

// Default, simplest, built-in example.
const EXCEL_FILE = './examples/simple-unlocked.xlsm';

export const EXCEL_FILES = [
    ["./examples/simple-unlocked.xlsm"],
    ...exampleMetricsFileNames,
]

type ExcelFileTest = (workbook: XLSX.WorkBook, fileName: string) => void
/**
    * Run the given test against the example metric spreadsheets.
    *
    * @param files A list of files to test against. 
    * @param test The test to execute. Receives the file name and the excel workbook object
    */
export const testExcelFiles = (files: typeof EXCEL_FILES, test: ExcelFileTest): void =>
    describe.each(files.slice(0, 10))(
        "%s", fileName => test(getWorkbook(fileName), fileName)
    )

export function getWorkbook(fileName = EXCEL_FILE) {
    return XLSX.readFile(fileName);
}

export function getSheet(workbook: XLSX.WorkBook, sheetName: string) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
    }
    return sheet;
}

/**
 * Helper function to get cell value from worksheet
 */
export function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): any {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[cellRef];
    return cell ? cell.v : null;
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

/**
 * Find all data rows in a sheet
 */
export function findAllDataRows(sheet: XLSX.WorkSheet, broadHabitatCol: number, startRow: number = 10, maxRows: number = 250): number[] {
    const dataRows: number[] = [];
    for (let row = startRow; row < startRow + maxRows; row++) {
        const value = getCellValue(sheet, row, broadHabitatCol);
        if (value && typeof value === "string" && value.trim() !== "" && value.trim() !== "Broad Habitat") {
            dataRows.push(row);
        }
    }
    return dataRows;
}

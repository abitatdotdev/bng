import XLSX, { utils } from 'xlsx';

/**
 * Maximum number of rows to process in Excel sheets
 */
export const MAX_DATA_ROWS = 200;

/**
 * Cache for sheet data converted to array of arrays
 * Uses WeakMap so memory is freed when sheets are garbage collected
 */
const sheetDataCache = new WeakMap<XLSX.WorkSheet, any[][]>();


export function getSheet(workbook: XLSX.WorkBook, sheetName: string) {
    return workbook.Sheets[sheetName];
}

/**
 * Helper function to get cell value from worksheet
 * Uses cached array of arrays for faster access
 */
export function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): any {
    // Try to get cached data
    let data = sheetDataCache.get(sheet);

    if (!data) {
        // Convert sheet to array of arrays and cache it
        data = utils.sheet_to_json(
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
 * Find a specific row in a sheet by matching a value in a given column
 */
export function findRow(sheet: XLSX.WorkSheet, columnToCheckPresence: number, value: unknown, maxRows: number = MAX_DATA_ROWS): number | null {
    for (let row = 0; row < maxRows; row++) {
        const cellValue = getCellValue(sheet, row, columnToCheckPresence);
        if (value === cellValue) return row;
    }
    return null;
}

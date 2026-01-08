import { test, describe } from "bun:test";
import * as v from 'valibot';
import XLSX from 'xlsx';
import { onSiteHedgerowBaselineSchema } from "./hedgerowBaseline";

const EXCEL_FILE = './examples/simple-unlocked.xlsm';

/**
 * Helper function to get cell value from worksheet
 */
function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): any {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[cellRef];
    return cell ? cell.v : null;
}

/**
 * Helper to normalize numeric values for comparison (handles floating point precision)
 */
function normalizeNumber(value: any): number {
    if (typeof value === "number") {
        return Math.round(value * 100000000) / 100000000; // 8 decimal places
    }
    return 0;
}

/**
 * Helper to compare two numeric values with tolerance
 */
function expectCloseTo(actual: number, expected: number, tolerance: number = 0.0001, fieldName?: string) {
    const diff = Math.abs(actual - expected);
    if (diff >= tolerance) {
        throw new Error(`${fieldName || 'Value'} mismatch: expected ${expected}, got ${actual} (diff: ${diff})`);
    }
}

/**
 * Find all hedgerow data rows in a sheet
 * Checks column D (Habitat type) for non-empty values
 */
function findAllDataRows(sheet: XLSX.WorkSheet, habitatTypeCol: number, startRow: number = 9, maxRows: number = 250): number[] {
    const dataRows: number[] = [];
    for (let row = startRow; row < startRow + maxRows; row++) {
        const value = getCellValue(sheet, row, habitatTypeCol);
        if (value && typeof value === "string" && value.trim() !== "" && value.trim() !== "Habitat type") {
            dataRows.push(row);
        }
    }
    return dataRows;
}

describe("B-1 On-Site Hedge Baseline - Excel Comparison", () => {
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = 'B-1 On-Site Hedge Baseline';
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
    }

    // Find all data rows (D column = habitat type, 0-indexed as 3)
    const dataRows = findAllDataRows(sheet, 3);

    if (dataRows.length === 0) {
        test.skip("no on-site hedgerow baseline data in test file", () => {});
        return;
    }

    dataRows.forEach((dataRow) => {
        test(`row ${dataRow + 1} matches pipeline calculations`, () => {
            // Extract input values from Excel
            // Column mapping (0-indexed) - see docs/excel-column-mappings.md:
            // D (3): Habitat Type
            // E (4): Length (km)
            // H (7): Condition
            // J (9): Strategic Significance
            // P (15): Length Retained (km)
            // Q (16): Length Enhanced (km)
            // V (21): User Comments
            // W (22): Planning Authority Comments
            // X (23): Habitat Reference Number

            const inputData = {
                habitatType: getCellValue(sheet, dataRow, 3), // D
                length: normalizeNumber(getCellValue(sheet, dataRow, 4)), // E
                condition: getCellValue(sheet, dataRow, 7), // H
                strategicSignificance: getCellValue(sheet, dataRow, 9), // J
                lengthRetained: normalizeNumber(getCellValue(sheet, dataRow, 15)) || 0, // P
                lengthEnhanced: normalizeNumber(getCellValue(sheet, dataRow, 16)) || 0, // Q
                userComments: String(getCellValue(sheet, dataRow, 21) || ""), // V
                planningAuthorityComments: String(getCellValue(sheet, dataRow, 22) || ""), // W
                habitatReferenceNumber: String(getCellValue(sheet, dataRow, 23) || ""), // X
            };

            // Parse through the pipeline
            const result = v.safeParse(onSiteHedgerowBaselineSchema, inputData);

            if (!result.success) {
                console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
            }

            const parsed = result.output;

            // Get calculated values from Excel
            // Calculated column indices (0-indexed) - see docs/excel-column-mappings.md:
            // F (5): Distinctiveness
            // G (6): Distinctiveness Score
            // I (8): Condition Score
            // L (11): Strategic Significance Multiplier
            // N (13): Total Hedgerow Units
            // R (17): Units Retained
            // S (18): Units Enhanced
            // T (19): Length Lost
            // U (20): Units Lost

            const excelDistinctivenessScore = getCellValue(sheet, dataRow, 6); // G
            const excelConditionScore = getCellValue(sheet, dataRow, 8); // I
            const excelStrategicMultiplier = getCellValue(sheet, dataRow, 11); // L
            const excelTotalHedgerowUnits = getCellValue(sheet, dataRow, 13); // N
            const excelUnitsRetained = getCellValue(sheet, dataRow, 17); // R
            const excelUnitsEnhanced = getCellValue(sheet, dataRow, 18); // S
            const excelLengthLost = getCellValue(sheet, dataRow, 19); // T
            const excelUnitsLost = getCellValue(sheet, dataRow, 20); // U

            // Compare values - only log on failure
            try {
                if (excelDistinctivenessScore !== null && typeof excelDistinctivenessScore === "number") {
                    expectCloseTo(parsed.distinctivenessScore, excelDistinctivenessScore, 0.0001, "Distinctiveness Score");
                }
                if (excelConditionScore !== null && typeof excelConditionScore === "number") {
                    expectCloseTo(parsed.conditionScore, excelConditionScore, 0.0001, "Condition Score");
                }
                if (excelStrategicMultiplier !== null && typeof excelStrategicMultiplier === "number") {
                    expectCloseTo(parsed.strategicSignificanceMultiplier, excelStrategicMultiplier, 0.0001, "Strategic Multiplier");
                }
                if (excelTotalHedgerowUnits !== null && typeof excelTotalHedgerowUnits === "number") {
                    expectCloseTo(parsed.totalHedgerowUnits, excelTotalHedgerowUnits, 0.0001, "Total Hedgerow Units");
                }
                if (excelUnitsRetained !== null && typeof excelUnitsRetained === "number") {
                    expectCloseTo(parsed.unitsRetained, excelUnitsRetained, 0.0001, "Units Retained");
                }
                if (excelUnitsEnhanced !== null && typeof excelUnitsEnhanced === "number") {
                    expectCloseTo(parsed.unitsEnhanced, excelUnitsEnhanced, 0.0001, "Units Enhanced");
                }
                if (excelLengthLost !== null && typeof excelLengthLost === "number") {
                    expectCloseTo(parsed.lengthLost, excelLengthLost, 0.0001, "Length Lost");
                }
                if (excelUnitsLost !== null && typeof excelUnitsLost === "number") {
                    expectCloseTo(parsed.unitsLost, excelUnitsLost, 0.0001, "Units Lost");
                }
            } catch (error) {
                console.error(`\nRow ${dataRow + 1} - FAILED`);
                console.error("Input data:", inputData);
                console.error("\nExcel values:");
                console.error("  Distinctiveness Score:", excelDistinctivenessScore);
                console.error("  Condition Score:", excelConditionScore);
                console.error("  Strategic Multiplier:", excelStrategicMultiplier);
                console.error("  Total Hedgerow Units:", excelTotalHedgerowUnits);
                console.error("  Units Retained:", excelUnitsRetained);
                console.error("  Units Enhanced:", excelUnitsEnhanced);
                console.error("  Length Lost:", excelLengthLost);
                console.error("  Units Lost:", excelUnitsLost);
                console.error("\nParsed values:");
                console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                console.error("  Condition Score:", parsed.conditionScore);
                console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                console.error("  Total Hedgerow Units:", parsed.totalHedgerowUnits);
                console.error("  Units Retained:", parsed.unitsRetained);
                console.error("  Units Enhanced:", parsed.unitsEnhanced);
                console.error("  Length Lost:", parsed.lengthLost);
                console.error("  Units Lost:", parsed.unitsLost);
                throw error;
            }
        });
    });
});

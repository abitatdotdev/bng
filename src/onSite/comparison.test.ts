import { expect, test, describe } from "bun:test";
import * as v from 'valibot';
import XLSX from 'xlsx';
import { onSiteHabitatBaselineSchema } from "./habitatBaseline";
import { onSiteHabitatCreationSchema } from "./habitatCreation";
import { onSiteHabitatEnhancementSchema } from "./habitatEnhancement";

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
 * Helper to convert Excel true/false to boolean
 */
function parseBoolean(value: any): boolean {
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
 * Find all data rows in a sheet
 */
function findAllDataRows(sheet: XLSX.WorkSheet, broadHabitatCol: number, startRow: number = 11, maxRows: number = 250): number[] {
    const dataRows: number[] = [];
    for (let row = startRow; row < startRow + maxRows; row++) {
        const value = getCellValue(sheet, row, broadHabitatCol);
        if (value && typeof value === "string" && value.trim() !== "") {
            dataRows.push(row);
        }
    }
    return dataRows;
}

describe("A-1 On-Site Habitat Baseline - Excel Comparison", () => {
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = 'A-1 On-Site Habitat Baseline';
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
    }

    // Find all data rows (E column = broad habitat, 0-indexed as 4)
    const dataRows = findAllDataRows(sheet, 4);

    dataRows.forEach((dataRow) => {
        test(`row ${dataRow + 1} matches pipeline calculations`, () => {
            // Extract input values from Excel
            // Column mapping (0-indexed):
            // E (4): Broad Habitat
            // F (5): Habitat Type
            // G (6): Irreplaceable Habitat (Yes/No)
            // H (7): Area (hectares)
            // K (10): Condition
            // M (12): Strategic Significance
            // S (18): Area Retained (hectares)
            // T (19): Area Enhanced (hectares)
            // Y (24): Bespoke Compensation Agreed (Yes/No/Pending)

            const inputData = {
                broadHabitat: getCellValue(sheet, dataRow, 4), // E
                habitatType: getCellValue(sheet, dataRow, 5), // F
                irreplaceableHabitat: parseBoolean(getCellValue(sheet, dataRow, 6)), // G
                area: normalizeNumber(getCellValue(sheet, dataRow, 7)), // H
                condition: getCellValue(sheet, dataRow, 10), // K
                strategicSignificance: getCellValue(sheet, dataRow, 12), // M
                areaRetained: normalizeNumber(getCellValue(sheet, dataRow, 18)) || 0, // S
                areaEnhanced: normalizeNumber(getCellValue(sheet, dataRow, 19)) || 0, // T
                bespokeCompensationAgreed: getCellValue(sheet, dataRow, 24) || "No", // Y
                userComments: "",
                planningAuthorityComments: "",
                habitatReferenceNumber: String(getCellValue(sheet, dataRow, 3) || ""), // D
            };

            // Parse through the pipeline
            const result = v.safeParse(onSiteHabitatBaselineSchema, inputData);

            if (!result.success) {
                console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
            }

            const parsed = result.output;

            // Get calculated values from Excel
            // Calculated column indices (0-indexed):
            // J (9): Distinctiveness Score
            // L (11): Condition Score
            // O (14): Strategic Significance Multiplier
            // U (20): Baseline Units (Retained)
            // V (21): Baseline Units (Enhanced)
            // Q (16): Total Habitat Units
            // W (22): Area Habitat Lost
            // X (23): Units Lost

            const excelDistinctivenessScore = getCellValue(sheet, dataRow, 9); // J
            const excelConditionScore = getCellValue(sheet, dataRow, 11); // L
            const excelStrategicMultiplier = getCellValue(sheet, dataRow, 14); // O
            const excelBaselineUnitsRetained = getCellValue(sheet, dataRow, 20); // U
            const excelBaselineUnitsEnhanced = getCellValue(sheet, dataRow, 21); // V
            const excelTotalHabitatUnits = getCellValue(sheet, dataRow, 16); // Q
            const excelAreaHabitatLost = getCellValue(sheet, dataRow, 22); // W
            const excelUnitsLost = getCellValue(sheet, dataRow, 23); // X

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
                if (excelBaselineUnitsRetained !== null && typeof excelBaselineUnitsRetained === "number") {
                    expectCloseTo(parsed.baselineUnitsRetained, excelBaselineUnitsRetained, 0.0001, "Baseline Units Retained");
                }
                if (excelBaselineUnitsEnhanced !== null && typeof excelBaselineUnitsEnhanced === "number") {
                    expectCloseTo(parsed.baselineUnitsEnhanced, excelBaselineUnitsEnhanced, 0.0001, "Baseline Units Enhanced");
                }
                if (excelTotalHabitatUnits !== null && typeof excelTotalHabitatUnits === "number") {
                    expectCloseTo(parsed.totalHabitatUnits, excelTotalHabitatUnits, 0.0001, "Total Habitat Units");
                }
                if (excelAreaHabitatLost !== null && typeof excelAreaHabitatLost === "number") {
                    expectCloseTo(parsed.areaHabitatLost, excelAreaHabitatLost, 0.0001, "Area Habitat Lost");
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
                console.error("  Baseline Units Retained:", excelBaselineUnitsRetained);
                console.error("  Baseline Units Enhanced:", excelBaselineUnitsEnhanced);
                console.error("  Total Habitat Units:", excelTotalHabitatUnits);
                console.error("  Area Habitat Lost:", excelAreaHabitatLost);
                console.error("  Units Lost:", excelUnitsLost);
                console.error("\nParsed values:");
                console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                console.error("  Condition Score:", parsed.conditionScore);
                console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                console.error("  Baseline Units Retained:", parsed.baselineUnitsRetained);
                console.error("  Baseline Units Enhanced:", parsed.baselineUnitsEnhanced);
                console.error("  Total Habitat Units:", parsed.totalHabitatUnits);
                console.error("  Area Habitat Lost:", parsed.areaHabitatLost);
                console.error("  Units Lost:", parsed.unitsLost);
                throw error;
            }
        });
    });
});

describe("A-2 On-Site Habitat Creation - Excel Comparison", () => {
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = 'A-2 On-Site Habitat Creation';
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found`);
    }

    // Find all data rows (D column = broad habitat, 0-indexed as 3)
    const dataRows = findAllDataRows(sheet, 3);

    dataRows.forEach((dataRow) => {
        test(`row ${dataRow + 1} matches pipeline calculations`, () => {
            // Extract input values from Excel
            // Column mapping (0-indexed):
            // D (3): Broad Habitat
            // E (4): Habitat Type
            // G (6): Area (hectares)
            // J (9): Condition
            // L (11): Strategic Significance
            // P (15): Habitat Creation in Advance (years)
            // Q (16): Habitat Creation Delay (years)

            const inputData = {
                broadHabitat: getCellValue(sheet, dataRow, 3), // D
                habitatType: getCellValue(sheet, dataRow, 4), // E
                area: normalizeNumber(getCellValue(sheet, dataRow, 6)), // G
                condition: getCellValue(sheet, dataRow, 9), // J
                strategicSignificance: getCellValue(sheet, dataRow, 11), // L
                habitatCreationInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 15)) || 0, // P
                habitatCreationDelay: normalizeNumber(getCellValue(sheet, dataRow, 16)) || 0, // Q
                userComments: "",
                planningAuthorityComments: "",
                habitatReferenceNumber: String(getCellValue(sheet, dataRow, 1) || ""), // B
            };

            // Parse through the pipeline
            const result = v.safeParse(onSiteHabitatCreationSchema, inputData);

            if (!result.success) {
                console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
            }

            const parsed = result.output;

            // Get calculated values from Excel
            // Calculated column indices (0-indexed):
            // I (8): Distinctiveness Score
            // K (10): Condition Score
            // N (13): Strategic Significance Multiplier
            // O (14): Standard Time to Target
            // S (18): Final Time to Target
            // T (19): Final Time Multiplier
            // X (23): Difficulty Multiplier
            // Y (24): Habitat Units Delivered

            const excelDistinctivenessScore = getCellValue(sheet, dataRow, 8); // I
            const excelConditionScore = getCellValue(sheet, dataRow, 10); // K
            const excelStrategicMultiplier = getCellValue(sheet, dataRow, 13); // N
            const excelTimeToTarget = getCellValue(sheet, dataRow, 14); // O
            const excelFinalTimeToTarget = getCellValue(sheet, dataRow, 18); // S
            const excelFinalTimeMultiplier = getCellValue(sheet, dataRow, 19); // T
            const excelDifficultyMultiplier = getCellValue(sheet, dataRow, 23); // X
            const excelHabitatUnitsDelivered = getCellValue(sheet, dataRow, 24); // Y

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
                if (excelTimeToTarget !== null && typeof excelTimeToTarget === "number") {
                    expect(parsed.timeToTargetCondition).toEqual(excelTimeToTarget);
                }
                if (excelFinalTimeToTarget !== null && typeof excelFinalTimeToTarget === "number") {
                    expect(parsed.finalTimeToTargetCondition).toEqual(excelFinalTimeToTarget);
                }
                if (excelFinalTimeMultiplier !== null && typeof excelFinalTimeMultiplier === "number") {
                    expectCloseTo(parsed.finalTimeToTargetMultiplier ?? 0, excelFinalTimeMultiplier, 0.0001, "Final Time Multiplier");
                }
                if (excelDifficultyMultiplier !== null && typeof excelDifficultyMultiplier === "number") {
                    expectCloseTo(parsed.difficultyMultiplierApplied, excelDifficultyMultiplier, 0.0001, "Difficulty Multiplier");
                }
                if (excelHabitatUnitsDelivered !== null && typeof excelHabitatUnitsDelivered === "number") {
                    expectCloseTo(parsed.habitatUnitsDelivered, excelHabitatUnitsDelivered, 0.0001, "Habitat Units Delivered");
                }
            } catch (error) {
                console.error(`\nRow ${dataRow + 1} - FAILED`);
                console.error("Input data:", inputData);
                console.error("\nExcel values:");
                console.error("  Distinctiveness Score:", excelDistinctivenessScore);
                console.error("  Condition Score:", excelConditionScore);
                console.error("  Strategic Multiplier:", excelStrategicMultiplier);
                console.error("  Time to Target:", excelTimeToTarget);
                console.error("  Final Time to Target:", excelFinalTimeToTarget);
                console.error("  Final Time Multiplier:", excelFinalTimeMultiplier);
                console.error("  Difficulty Multiplier:", excelDifficultyMultiplier);
                console.error("  Habitat Units Delivered:", excelHabitatUnitsDelivered);
                console.error("\nParsed values:");
                console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                console.error("  Condition Score:", parsed.conditionScore);
                console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                console.error("  Time to Target:", parsed.timeToTargetCondition);
                console.error("  Final Time to Target:", parsed.finalTimeToTargetCondition);
                console.error("  Final Time Multiplier:", parsed.finalTimeToTargetMultiplier);
                console.error("  Difficulty Multiplier:", parsed.difficultyMultiplierApplied);
                console.error("  Habitat Units Delivered:", parsed.habitatUnitsDelivered);
                throw error;
            }
        });
    });
});

describe("A-3 On-Site Habitat Enhancement - Excel Comparison", () => {
    test.skip("enhancement tests require baseline data linkage", () => {
        // This test requires proper baseline data from A-1
        // The A-3 sheet references A-1 for baseline habitat information
        // TODO: Implement this test with proper baseline data lookup
    });
});

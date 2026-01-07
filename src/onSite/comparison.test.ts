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
 * Helper function to get cell value by address (e.g., "A1")
 */
function getCellValueByAddress(sheet: XLSX.WorkSheet, address: string): any {
    const cell = sheet[address];
    return cell ? cell.v : null;
}

/**
 * Helper to find the first data row (non-empty row after headers)
 */
function findFirstDataRow(sheet: XLSX.WorkSheet, startRow: number = 11): number {
    // Row 12 (0-indexed as 11) is typically the first data row in BNG sheets
    for (let row = startRow; row < startRow + 100; row++) {
        const broadHabitat = getCellValue(sheet, row, 1); // Column B
        if (broadHabitat && broadHabitat !== "" && typeof broadHabitat === "string") {
            return row;
        }
    }
    throw new Error("No data row found in sheet");
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
function expectCloseTo(actual: number, expected: number, tolerance: number = 0.0001) {
    const diff = Math.abs(actual - expected);
    expect(diff).toBeLessThan(tolerance);
}

describe("A-1 On-Site Habitat Baseline - Excel Comparison", () => {
    test("first data row matches pipeline calculations", () => {
        // Read the Excel file
        const workbook = XLSX.readFile(EXCEL_FILE);
        const sheetName = 'A-1 On-Site Habitat Baseline';
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
            throw new Error(`Sheet "${sheetName}" not found`);
        }

        // First data row is row 12 (0-indexed as 11)
        const dataRow = 11;
        console.log(`Testing A-1 data row ${dataRow + 1}`);

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

        console.log("Input data:", inputData);

        // Parse through the pipeline
        const result = v.safeParse(onSiteHabitatBaselineSchema, inputData);

        if (!result.success) {
            console.error("Validation errors:", result.issues);
            throw new Error(`Pipeline validation failed: ${JSON.stringify(result.issues)}`);
        }

        const parsed = result.output;

        // Now compare calculated values with Excel
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

        console.log("Excel values:");
        console.log("  Distinctiveness Score:", excelDistinctivenessScore);
        console.log("  Condition Score:", excelConditionScore);
        console.log("  Strategic Multiplier:", excelStrategicMultiplier);
        console.log("  Baseline Units Retained:", excelBaselineUnitsRetained);
        console.log("  Baseline Units Enhanced:", excelBaselineUnitsEnhanced);
        console.log("  Total Habitat Units:", excelTotalHabitatUnits);
        console.log("  Area Habitat Lost:", excelAreaHabitatLost);
        console.log("  Units Lost:", excelUnitsLost);

        console.log("\nParsed values:");
        console.log("  Distinctiveness Score:", parsed.distinctivenessScore);
        console.log("  Condition Score:", parsed.conditionScore);
        console.log("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
        console.log("  Baseline Units Retained:", parsed.baselineUnitsRetained);
        console.log("  Baseline Units Enhanced:", parsed.baselineUnitsEnhanced);
        console.log("  Total Habitat Units:", parsed.totalHabitatUnits);
        console.log("  Area Habitat Lost:", parsed.areaHabitatLost);
        console.log("  Units Lost:", parsed.unitsLost);

        // Compare values (if Excel has the value)
        if (excelDistinctivenessScore !== null) {
            expectCloseTo(parsed.distinctivenessScore, excelDistinctivenessScore);
        }
        if (excelConditionScore !== null) {
            expectCloseTo(parsed.conditionScore, excelConditionScore);
        }
        if (excelStrategicMultiplier !== null) {
            expectCloseTo(parsed.strategicSignificanceMultiplier, excelStrategicMultiplier);
        }
        if (excelBaselineUnitsRetained !== null) {
            expectCloseTo(parsed.baselineUnitsRetained, excelBaselineUnitsRetained);
        }
        if (excelBaselineUnitsEnhanced !== null) {
            expectCloseTo(parsed.baselineUnitsEnhanced, excelBaselineUnitsEnhanced);
        }
        if (excelTotalHabitatUnits !== null) {
            expectCloseTo(parsed.totalHabitatUnits, excelTotalHabitatUnits);
        }
        if (excelAreaHabitatLost !== null) {
            expectCloseTo(parsed.areaHabitatLost, excelAreaHabitatLost);
        }
        if (excelUnitsLost !== null) {
            expectCloseTo(parsed.unitsLost, excelUnitsLost);
        }
    });
});

describe("A-2 On-Site Habitat Creation - Excel Comparison", () => {
    test("first data row matches pipeline calculations", () => {
        // Read the Excel file
        const workbook = XLSX.readFile(EXCEL_FILE);
        const sheetName = 'A-2 On-Site Habitat Creation';
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
            throw new Error(`Sheet "${sheetName}" not found`);
        }

        // First data row is row 12 (0-indexed as 11)
        const dataRow = 11;
        console.log(`Testing A-2 data row ${dataRow + 1}`);

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

        console.log("Input data:", inputData);

        // Parse through the pipeline
        const result = v.safeParse(onSiteHabitatCreationSchema, inputData);

        if (!result.success) {
            console.error("Validation errors:", result.issues);
            throw new Error(`Pipeline validation failed: ${JSON.stringify(result.issues)}`);
        }

        const parsed = result.output;

        // Compare calculated values with Excel
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

        console.log("Excel values:");
        console.log("  Distinctiveness Score:", excelDistinctivenessScore);
        console.log("  Condition Score:", excelConditionScore);
        console.log("  Strategic Multiplier:", excelStrategicMultiplier);
        console.log("  Time to Target:", excelTimeToTarget);
        console.log("  Final Time to Target:", excelFinalTimeToTarget);
        console.log("  Final Time Multiplier:", excelFinalTimeMultiplier);
        console.log("  Difficulty Multiplier:", excelDifficultyMultiplier);
        console.log("  Habitat Units Delivered:", excelHabitatUnitsDelivered);

        console.log("\nParsed values:");
        console.log("  Distinctiveness Score:", parsed.distinctivenessScore);
        console.log("  Condition Score:", parsed.conditionScore);
        console.log("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
        console.log("  Time to Target:", parsed.timeToTargetCondition);
        console.log("  Final Time to Target:", parsed.finalTimeToTargetCondition);
        console.log("  Final Time Multiplier:", parsed.finalTimeToTargetMultiplier);
        console.log("  Difficulty Multiplier:", parsed.difficultyMultiplierApplied);
        console.log("  Habitat Units Delivered:", parsed.habitatUnitsDelivered);

        // Compare values
        if (excelDistinctivenessScore !== null) {
            expectCloseTo(parsed.distinctivenessScore, excelDistinctivenessScore);
        }
        if (excelConditionScore !== null) {
            expectCloseTo(parsed.conditionScore, excelConditionScore);
        }
        if (excelStrategicMultiplier !== null) {
            expectCloseTo(parsed.strategicSignificanceMultiplier, excelStrategicMultiplier);
        }
        if (excelTimeToTarget !== null && typeof excelTimeToTarget === "number") {
            expect(parsed.timeToTargetCondition).toEqual(excelTimeToTarget);
        }
        if (excelFinalTimeToTarget !== null && typeof excelFinalTimeToTarget === "number") {
            expect(parsed.finalTimeToTargetCondition).toEqual(excelFinalTimeToTarget);
        }
        if (excelFinalTimeMultiplier !== null) {
            expectCloseTo(parsed.finalTimeToTargetMultiplier ?? 0, excelFinalTimeMultiplier);
        }
        if (excelDifficultyMultiplier !== null) {
            expectCloseTo(parsed.difficultyMultiplierApplied, excelDifficultyMultiplier);
        }
        if (excelHabitatUnitsDelivered !== null) {
            expectCloseTo(parsed.habitatUnitsDelivered, excelHabitatUnitsDelivered);
        }
    });
});

describe("A-3 On-Site Habitat Enhancement - Excel Comparison", () => {
    test.skip("first data row matches pipeline calculations", () => {
        // This test requires proper baseline data from A-1
        // The A-3 sheet references A-1 for baseline habitat information
        // For now, skipping this test as it requires more complex setup

        // Read the Excel files
        const workbook = XLSX.readFile(EXCEL_FILE);

        // Read both baseline and enhancement sheets
        const baselineSheetName = 'A-1 On-Site Habitat Baseline';
        const enhancementSheetName = 'A-3 On-Site Habitat Enhancement';

        const baselineSheet = workbook.Sheets[baselineSheetName];
        const enhancementSheet = workbook.Sheets[enhancementSheetName];

        if (!baselineSheet || !enhancementSheet) {
            throw new Error("Required sheets not found");
        }

        // First data rows
        const baselineDataRow = 11;  // Row 12
        const enhancementDataRow = 11;  // Row 12

        console.log(`Testing A-3 data row ${enhancementDataRow + 1} with baseline row ${baselineDataRow + 1}`);

        // First, parse the baseline row
        const baselineInputData = {
            broadHabitat: getCellValue(baselineSheet, baselineDataRow, 4), // E
            habitatType: getCellValue(baselineSheet, baselineDataRow, 5), // F
            irreplaceableHabitat: parseBoolean(getCellValue(baselineSheet, baselineDataRow, 6)), // G
            area: normalizeNumber(getCellValue(baselineSheet, baselineDataRow, 7)), // H
            condition: getCellValue(baselineSheet, baselineDataRow, 10), // K
            strategicSignificance: getCellValue(baselineSheet, baselineDataRow, 12), // M
            areaRetained: normalizeNumber(getCellValue(baselineSheet, baselineDataRow, 18)) || 0, // S
            areaEnhanced: normalizeNumber(getCellValue(baselineSheet, baselineDataRow, 19)) || 0, // T
            bespokeCompensationAgreed: getCellValue(baselineSheet, baselineDataRow, 24) || "No", // Y
            userComments: "",
            planningAuthorityComments: "",
            habitatReferenceNumber: getCellValue(baselineSheet, baselineDataRow, 3) || "", // D
        };

        const baselineResult = v.safeParse(onSiteHabitatBaselineSchema, baselineInputData);

        if (!baselineResult.success) {
            console.error("Baseline validation errors:", baselineResult.issues);
            throw new Error(`Baseline pipeline validation failed`);
        }

        const baseline = baselineResult.output;

        // Now parse the enhancement row
        // Column mapping for A-3 (0-indexed):
        // Q (16): Proposed Broad Habitat
        // R (17): Proposed Habitat Type
        // Y (24): Proposed Condition
        // Plus baseline reference in E (4)

        const enhancementInputData = {
            baseline: baseline,
            broadHabitat: getCellValue(enhancementSheet, enhancementDataRow, 16), // Q
            habitatType: getCellValue(enhancementSheet, enhancementDataRow, 17), // R
            condition: getCellValue(enhancementSheet, enhancementDataRow, 24), // Y
            strategicSignificance: getCellValue(baselineSheet, baselineDataRow, 12), // M (from baseline)
            habitatEnhancedInAdvance: 0, // Would need to find these columns in the actual sheet
            habitatEnhancedDelay: 0,
            userComments: "",
            planningAuthorityComments: "",
            habitatReferenceNumber: getCellValue(enhancementSheet, enhancementDataRow, 4) || "", // E
        };

        console.log("Enhancement input data:", enhancementInputData);

        // Parse through the pipeline
        const result = v.safeParse(onSiteHabitatEnhancementSchema, enhancementInputData);

        if (!result.success) {
            console.error("Enhancement validation errors:", result.issues);
            throw new Error(`Enhancement pipeline validation failed: ${JSON.stringify(result.issues)}`);
        }

        const parsed = result.output;

        // Compare calculated values with Excel
        // Calculated column indices for A-3 (0-indexed):
        // V (21): Area
        // X (23): Distinctiveness Score
        // Z (25): Condition Score
        // Plus other calculated values...
        const excelArea = getCellValue(enhancementSheet, enhancementDataRow, 21); // V
        const excelDistinctivenessScore = getCellValue(enhancementSheet, enhancementDataRow, 23); // X
        const excelConditionScore = getCellValue(enhancementSheet, enhancementDataRow, 25); // Z
        const excelStrategicMultiplier = getCellValue(baselineSheet, baselineDataRow, 14); // O (from baseline)
        const excelEnhancementPathway = ""; // Would need to locate this column
        const excelTimeToTarget = 0; // Would need to locate this column
        const excelFinalTimeToTarget = 0; // Would need to locate this column
        const excelFinalTimeMultiplier = 0; // Would need to locate this column
        const excelDifficultyMultiplier = 0; // Would need to locate this column
        const excelHabitatUnitsDelivered = 0; // Would need to locate this column

        console.log("Excel values:");
        console.log("  Area:", excelArea);
        console.log("  Distinctiveness Score:", excelDistinctivenessScore);
        console.log("  Condition Score:", excelConditionScore);
        console.log("  Strategic Multiplier:", excelStrategicMultiplier);
        console.log("  Enhancement Pathway:", excelEnhancementPathway);
        console.log("  Time to Target:", excelTimeToTarget);
        console.log("  Final Time to Target:", excelFinalTimeToTarget);
        console.log("  Final Time Multiplier:", excelFinalTimeMultiplier);
        console.log("  Difficulty Multiplier:", excelDifficultyMultiplier);
        console.log("  Habitat Units Delivered:", excelHabitatUnitsDelivered);

        console.log("\nParsed values:");
        console.log("  Area:", parsed.area);
        console.log("  Distinctiveness Score:", parsed.distinctivenessScore);
        console.log("  Condition Score:", parsed.conditionScore);
        console.log("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
        console.log("  Enhancement Pathway:", parsed.enhancementPathway);
        console.log("  Time to Target:", parsed.timeToTargetCondition);
        console.log("  Final Time to Target:", parsed.finalTimeToTargetCondition);
        console.log("  Final Time Multiplier:", parsed.finalTimeToTargetMultiplier);
        console.log("  Difficulty Multiplier:", parsed.difficultyMultiplierApplied);
        console.log("  Habitat Units Delivered:", parsed.habitatUnitsDelivered);

        // Compare values
        if (excelArea !== null) {
            expectCloseTo(parsed.area, excelArea);
        }
        if (excelDistinctivenessScore !== null) {
            expectCloseTo(parsed.distinctivenessScore, excelDistinctivenessScore);
        }
        if (excelConditionScore !== null) {
            expectCloseTo(parsed.conditionScore, excelConditionScore);
        }
        if (excelStrategicMultiplier !== null) {
            expectCloseTo(parsed.strategicSignificanceMultiplier, excelStrategicMultiplier);
        }
        if (excelEnhancementPathway !== null) {
            expect(parsed.enhancementPathway).toEqual(excelEnhancementPathway);
        }
        if (excelTimeToTarget !== null && typeof excelTimeToTarget === "number") {
            expect(parsed.timeToTargetCondition).toEqual(excelTimeToTarget);
        }
        if (excelFinalTimeToTarget !== null && typeof excelFinalTimeToTarget === "number") {
            expect(parsed.finalTimeToTargetCondition).toEqual(excelFinalTimeToTarget);
        }
        if (excelFinalTimeMultiplier !== null) {
            expectCloseTo(parsed.finalTimeToTargetMultiplier ?? 0, excelFinalTimeMultiplier);
        }
        if (excelDifficultyMultiplier !== null) {
            expectCloseTo(parsed.difficultyMultiplierApplied, excelDifficultyMultiplier);
        }
        if (excelHabitatUnitsDelivered !== null) {
            expectCloseTo(parsed.habitatUnitsDelivered, excelHabitatUnitsDelivered);
        }
    });
});

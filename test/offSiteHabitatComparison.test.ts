import { expect, test, describe } from "bun:test";
import * as v from 'valibot';
import { EXCEL_FILES, expectCloseTo, findAllDataRows, getCellValue, getSheet, normalizeNumber, testExcelFiles, parseBoolean } from './helpers';
import { offSiteHabitatBaselineSchema } from "../src/offSite/habitatBaseline";
import { offSiteHabitatCreationSchema } from "../src/offSite/habitatCreation";

testExcelFiles(EXCEL_FILES.slice(0, 20), (workbook) => {
    describe("D-1 Off-Site Habitat Baseline - Excel Comparison", () => {
        const sheet = getSheet(workbook, 'D-1 Off-Site Habitat Baseline');

        // Find all data rows (E column = broad habitat, 0-indexed as 4)
        const dataRows = findAllDataRows(sheet, 4);

        if (dataRows.length === 0) {
            test.skip("no off-site baseline data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                // Extract input values from Excel
                // Column mapping (0-indexed):
                const inputData = {
                    // E (4): Broad Habitat
                    broadHabitat: getCellValue(sheet, dataRow, 4),
                    // F (5): Habitat Type
                    habitatType: getCellValue(sheet, dataRow, 5),
                    // G (6): Irreplaceable Habitat (Yes/No)
                    irreplaceableHabitat: parseBoolean(getCellValue(sheet, dataRow, 6)),
                    // H (7): Area (hectares)
                    area: normalizeNumber(getCellValue(sheet, dataRow, 7)),
                    // K (10): Condition
                    condition: getCellValue(sheet, dataRow, 10),
                    // M (12): Strategic Significance
                    strategicSignificance: getCellValue(sheet, dataRow, 12),
                    // R (17): Spatial Risk Category
                    spatialRiskCategory: getCellValue(sheet, dataRow, 17) || "Low",
                    // V (21): Area Retained (hectares)
                    areaRetained: normalizeNumber(getCellValue(sheet, dataRow, 21)) || 0,
                    // W (22): Area Enhanced (hectares)
                    areaEnhanced: normalizeNumber(getCellValue(sheet, dataRow, 22)) || 0,
                    // AB (27): Bespoke Compensation Agreed (Yes/No/Pending)
                    bespokeCompensationAgreed: getCellValue(sheet, dataRow, 27) || "No",
                    // AC (28): User comments
                    userComments: getCellValue(sheet, dataRow, 28) || undefined,
                    // AD (29): Planning authority comments
                    planningAuthorityComments: getCellValue(sheet, dataRow, 29) || undefined,
                    // AE (30): Planning authority comments
                    habitatReferenceNumber: String(getCellValue(sheet, dataRow, 30) || ""),
                    // AF (31): Planning authority comments
                    offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 31) || ""),
                };

                // Parse through the pipeline
                const result = v.safeParse(offSiteHabitatBaselineSchema, inputData);

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
                // Q (16): Total Habitat Units (SRM)
                // S (18): Spatial Risk Multiplier
                // T (19): Total Habitat Units
                // X (23): Baseline Units (Retained)
                // Y (24): Baseline Units (Enhanced)
                // Z (25): Area Habitat Lost
                // AA (26): Units Lost

                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 9); // J
                const excelConditionScore = getCellValue(sheet, dataRow, 11); // L
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 14); // O
                const excelSpatialRiskMultiplier = getCellValue(sheet, dataRow, 18); // S
                const excelBaselineUnitsRetained = getCellValue(sheet, dataRow, 23); // X
                const excelBaselineUnitsEnhanced = getCellValue(sheet, dataRow, 24); // Y
                const excelTotalHabitatUnitsSRM = getCellValue(sheet, dataRow, 16); // Q
                const excelTotalHabitatUnits = getCellValue(sheet, dataRow, 19); // T
                const excelAreaHabitatLost = getCellValue(sheet, dataRow, 25); // Z
                const excelUnitsLost = getCellValue(sheet, dataRow, 26); // AA

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
                    if (excelSpatialRiskMultiplier !== null && typeof excelSpatialRiskMultiplier === "number") {
                        expectCloseTo(parsed.spatialRiskMultiplier, excelSpatialRiskMultiplier, 0.0001, "Spatial Risk Multiplier");
                    }
                    if (excelBaselineUnitsRetained !== null && typeof excelBaselineUnitsRetained === "number") {
                        expectCloseTo(parsed.baselineUnitsRetained, excelBaselineUnitsRetained, 0.0001, "Baseline Units Retained");
                    }
                    if (excelBaselineUnitsEnhanced !== null && typeof excelBaselineUnitsEnhanced === "number") {
                        expectCloseTo(parsed.baselineUnitsEnhanced, excelBaselineUnitsEnhanced, 0.0001, "Baseline Units Enhanced");
                    }
                    if (excelTotalHabitatUnitsSRM !== null && typeof excelTotalHabitatUnitsSRM === "number") {
                        expectCloseTo(parsed.totalHabitatUnitsSRM, excelTotalHabitatUnitsSRM, 0.0001, "Total Habitat Units (SRM)");
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
                    console.error("  Spatial Risk Multiplier:", excelSpatialRiskMultiplier);
                    console.error("  Baseline Units Retained:", excelBaselineUnitsRetained);
                    console.error("  Baseline Units Enhanced:", excelBaselineUnitsEnhanced);
                    console.error("  Total Habitat Units (SRM):", excelTotalHabitatUnitsSRM);
                    console.error("  Total Habitat Units:", excelTotalHabitatUnits);
                    console.error("  Area Habitat Lost:", excelAreaHabitatLost);
                    console.error("  Units Lost:", excelUnitsLost);
                    console.error("\nParsed values:");
                    console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                    console.error("  Condition Score:", parsed.conditionScore);
                    console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                    console.error("  Spatial Risk Multiplier:", parsed.spatialRiskMultiplier);
                    console.error("  Baseline Units Retained:", parsed.baselineUnitsRetained);
                    console.error("  Baseline Units Enhanced:", parsed.baselineUnitsEnhanced);
                    console.error("  Total Habitat Units (SRM):", parsed.totalHabitatUnitsSRM);
                    console.error("  Total Habitat Units:", parsed.totalHabitatUnits);
                    console.error("  Area Habitat Lost:", parsed.areaHabitatLost);
                    console.error("  Units Lost:", parsed.unitsLost);
                    throw error;
                }
            });
        });
    });

    describe("D-2 Off-Site Habitat Creation - Excel Comparison", () => {
        const sheet = getSheet(workbook, 'D-2 Off-Site Habitat Creation');

        // Find all data rows (D column = broad habitat, 0-indexed as 3)
        const dataRows = findAllDataRows(sheet, 3);

        if (dataRows.length === 0) {
            test.skip("no off-site creation data in test file", () => { });
            return;
        }

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
                // Y (24): Spatial Risk Category

                const inputData = {
                    broadHabitat: getCellValue(sheet, dataRow, 3), // D
                    habitatType: getCellValue(sheet, dataRow, 4), // E
                    area: normalizeNumber(getCellValue(sheet, dataRow, 6)), // G
                    condition: getCellValue(sheet, dataRow, 9), // J
                    strategicSignificance: getCellValue(sheet, dataRow, 11), // L
                    habitatCreationInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 15)) || 0, // P
                    habitatCreationDelay: normalizeNumber(getCellValue(sheet, dataRow, 16)) || 0, // Q
                    spatialRiskCategory: getCellValue(sheet, dataRow, 24) || "Low", // Y
                    userComments: "",
                    planningAuthorityComments: "",
                    habitatReferenceNumber: String(getCellValue(sheet, dataRow, 30) || ""), // AE
                    offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 31) || ""), // AF
                    baselineReferenceNumber: String(getCellValue(sheet, dataRow, 32) || ""), // AG
                };

                // Parse through the pipeline
                const result = v.safeParse(offSiteHabitatCreationSchema, inputData);

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
                // Z (25): Spatial Risk Multiplier
                // AA (26): Habitat Units Delivered (with SRM)
                // AB (27): Habitat Units Delivered

                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 8); // I
                const excelConditionScore = getCellValue(sheet, dataRow, 10); // K
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 13); // N
                const excelTimeToTarget = getCellValue(sheet, dataRow, 14); // O
                const excelFinalTimeToTarget = getCellValue(sheet, dataRow, 18); // S
                const excelFinalTimeMultiplier = getCellValue(sheet, dataRow, 19); // T
                const excelDifficultyMultiplier = getCellValue(sheet, dataRow, 23); // X
                const excelSpatialRiskMultiplier = getCellValue(sheet, dataRow, 25); // Z
                const excelHabitatUnitsDeliveredWithSRM = getCellValue(sheet, dataRow, 26); // AA
                const excelHabitatUnitsDelivered = getCellValue(sheet, dataRow, 27); // AB

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
                    if (excelSpatialRiskMultiplier !== null && typeof excelSpatialRiskMultiplier === "number") {
                        expectCloseTo(parsed.spatialRiskMultiplier, excelSpatialRiskMultiplier, 0.0001, "Spatial Risk Multiplier");
                    }
                    if (excelHabitatUnitsDeliveredWithSRM !== null && typeof excelHabitatUnitsDeliveredWithSRM === "number") {
                        expectCloseTo(parsed.habitatUnitsDeliveredWithSpatialRisk, excelHabitatUnitsDeliveredWithSRM, 0.0001, "Habitat Units Delivered (with SRM)");
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
                    console.error("  Spatial Risk Multiplier:", excelSpatialRiskMultiplier);
                    console.error("  Habitat Units Delivered (with SRM):", excelHabitatUnitsDeliveredWithSRM);
                    console.error("  Habitat Units Delivered:", excelHabitatUnitsDelivered);
                    console.error("\nParsed values:");
                    console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                    console.error("  Condition Score:", parsed.conditionScore);
                    console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                    console.error("  Time to Target:", parsed.timeToTargetCondition);
                    console.error("  Final Time to Target:", parsed.finalTimeToTargetCondition);
                    console.error("  Final Time Multiplier:", parsed.finalTimeToTargetMultiplier);
                    console.error("  Difficulty Multiplier:", parsed.difficultyMultiplierApplied);
                    console.error("  Spatial Risk Multiplier:", parsed.spatialRiskMultiplier);
                    console.error("  Habitat Units Delivered (with SRM):", parsed.habitatUnitsDeliveredWithSpatialRisk);
                    console.error("  Habitat Units Delivered:", parsed.habitatUnitsDelivered);
                    throw error;
                }
            });
        });
    });

    describe("D-3 Off-Site Habitat Enhancement - Excel Comparison", () => {
        test.skip("enhancement tests require baseline data linkage", () => {
            // This test requires proper baseline data from D-1
            // The D-3 sheet references D-1 for baseline habitat information
            // TODO: Implement this test with proper baseline data lookup
        });
    });
});

import { test, describe } from "bun:test";
import * as v from 'valibot';
import { EXCEL_FILES, expectCloseTo, findAllDataRows, getCellValue, getSheet, normalizeNumber, testExcelFiles } from './helpers';
import { onSiteHedgerowBaselineSchema } from "../src/onSite/hedgerowBaseline";
import { onSiteHedgerowCreationSchema } from "../src/onSite/hedgerowCreation";
import { onSiteHedgerowEnhancementSchema } from "../src/onSite/hedgerowEnhancement";
import { offSiteHedgerowBaselineSchema } from "../src/offSite/hedgerowBaseline";
import { offSiteHedgerowCreationSchema } from "../src/offSite/hedgerowCreation";
import { offSiteHedgerowEnhancementSchema } from "../src/offSite/hedgerowEnhancement";

testExcelFiles(EXCEL_FILES.slice(0, 10), (workbook) => {
    describe("B-1 On-Site Hedge Baseline", () => {
        const sheet = getSheet(workbook, 'B-1 On-Site Hedge Baseline');

        // Find all data rows (D column = habitat type, 0-indexed as 3, starting from row 9)
        const dataRows = findAllDataRows(sheet, 3, 9);

        if (dataRows.length === 0) {
            test.skip("no on-site hedgerow baseline data in test file", () => { });
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

    describe("B-2 On-Site Hedge Creation", () => {
        const sheet = getSheet(workbook, 'B-2 On-Site Hedge Creation');

        // Find all data rows (D column = habitat type, 0-indexed as 3, starting from row 11)
        const dataRows = findAllDataRows(sheet, 3, 11);

        if (dataRows.length === 0) {
            test.skip("no on-site hedgerow creation data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                // Extract input values from Excel
                // Column mapping (0-indexed) - see docs/excel-column-mappings.md:
                // D (3): Habitat type
                // E (4): Length (km)
                // H (7): Condition
                // J (9): Strategic Significance
                // N (13): Habitat created in advance (years)
                // O (14): Delay in starting habitat creation (years)
                // X (23): User Comments
                // Y (24): Planning Authority Comments
                // Z (25): Habitat Reference Number

                const inputData = {
                    habitatType: getCellValue(sheet, dataRow, 3), // D
                    length: normalizeNumber(getCellValue(sheet, dataRow, 4)), // E
                    condition: getCellValue(sheet, dataRow, 7), // H
                    strategicSignificance: getCellValue(sheet, dataRow, 9), // J
                    habitatCreatedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 13)) || 0, // N
                    delayInStartingHabitatCreation: normalizeNumber(getCellValue(sheet, dataRow, 14)) || 0, // O
                    userComments: String(getCellValue(sheet, dataRow, 23) || ""), // X
                    planningAuthorityComments: String(getCellValue(sheet, dataRow, 24) || ""), // Y
                    habitatReferenceNumber: String(getCellValue(sheet, dataRow, 25) || ""), // Z
                };

                // Parse through the pipeline
                const result = v.safeParse(onSiteHedgerowCreationSchema, inputData);

                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }

                const parsed = result.output;

                // Get calculated values from Excel
                // Calculated column indices (0-indexed) - see docs/excel-column-mappings.md:
                // G (6): Distinctiveness Score
                // I (8): Condition Score
                // L (11): Strategic Significance Multiplier
                // M (12): Standard Time to Target Condition (years)
                // Q (16): Final time to target condition (years)
                // R (17): Final time to target multiplier
                // V (21): Difficulty multiplier applied
                // W (22): Net Unit Change

                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 6); // G
                const excelConditionScore = getCellValue(sheet, dataRow, 8); // I
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 11); // L
                const excelStandardTimeToTarget = getCellValue(sheet, dataRow, 12); // M
                const excelFinalTimeToTarget = getCellValue(sheet, dataRow, 16); // Q
                const excelTemporalMultiplier = getCellValue(sheet, dataRow, 17); // R
                const excelDifficultyMultiplier = getCellValue(sheet, dataRow, 21); // V
                const excelHedgerowUnitsDelivered = getCellValue(sheet, dataRow, 22); // W

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
                    if (excelStandardTimeToTarget !== null && typeof excelStandardTimeToTarget === "number") {
                        expectCloseTo(parsed.standardTimeToTargetCondition as number, excelStandardTimeToTarget, 0.0001, "Standard Time to Target");
                    }
                    if (excelFinalTimeToTarget !== null) {
                        if (typeof excelFinalTimeToTarget === "number") {
                            expectCloseTo(parsed.finalTimeToTargetCondition as number, excelFinalTimeToTarget, 0.0001, "Final Time to Target");
                        } else if (typeof excelFinalTimeToTarget === "string") {
                            if (parsed.finalTimeToTargetCondition !== excelFinalTimeToTarget) {
                                throw new Error(`Final Time to Target mismatch: expected ${excelFinalTimeToTarget}, got ${parsed.finalTimeToTargetCondition}`);
                            }
                        }
                    }
                    if (excelTemporalMultiplier !== null && typeof excelTemporalMultiplier === "number") {
                        expectCloseTo(parsed.temporalMultiplier as number, excelTemporalMultiplier, 0.0001, "Temporal Multiplier");
                    }
                    if (excelDifficultyMultiplier !== null && typeof excelDifficultyMultiplier === "number") {
                        expectCloseTo(parsed.difficultyMultiplier, excelDifficultyMultiplier, 0.0001, "Difficulty Multiplier");
                    }
                    if (excelHedgerowUnitsDelivered !== null && typeof excelHedgerowUnitsDelivered === "number") {
                        expectCloseTo(parsed.hedgerowUnitsDelivered, excelHedgerowUnitsDelivered, 0.0001, "Hedgerow Units Delivered");
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    console.error("\nExcel values:");
                    console.error("  Distinctiveness Score:", excelDistinctivenessScore);
                    console.error("  Condition Score:", excelConditionScore);
                    console.error("  Strategic Multiplier:", excelStrategicMultiplier);
                    console.error("  Standard Time to Target:", excelStandardTimeToTarget);
                    console.error("  Final Time to Target:", excelFinalTimeToTarget);
                    console.error("  Temporal Multiplier:", excelTemporalMultiplier);
                    console.error("  Difficulty Multiplier:", excelDifficultyMultiplier);
                    console.error("  Hedgerow Units Delivered:", excelHedgerowUnitsDelivered);
                    console.error("\nParsed values:");
                    console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                    console.error("  Condition Score:", parsed.conditionScore);
                    console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                    console.error("  Standard Time to Target:", parsed.standardTimeToTargetCondition);
                    console.error("  Final Time to Target:", parsed.finalTimeToTargetCondition);
                    console.error("  Temporal Multiplier:", parsed.temporalMultiplier);
                    console.error("  Difficulty Multiplier:", parsed.difficultyMultiplier);
                    console.error("  Hedgerow Units Delivered:", parsed.hedgerowUnitsDelivered);
                    throw error;
                }
            });
        });
    });

    describe("B-3 On-Site Hedge Enhancement", () => {
        const sheet = getSheet(workbook, 'B-3 On-Site Hedge Enhancement');


        // Also need the baseline sheet to build baseline objects
        const baselineSheetName = 'B-1 On-Site Hedge Baseline';
        const baselineSheet = workbook.Sheets[baselineSheetName];

        if (!baselineSheet) {
            throw new Error(`Sheet "${baselineSheetName}" not found`);
        }

        // Build a map of baseline references to parsed baseline data
        const baselineMap = new Map();
        const baselineDataRows = findAllDataRows(baselineSheet, 3, 9);

        baselineDataRows.forEach((dataRow) => {
            const baselineRef = getCellValue(baselineSheet, dataRow, 36); // AK column (0-indexed as 36)

            if (!baselineRef) return;

            const inputData = {
                habitatType: getCellValue(baselineSheet, dataRow, 3), // D
                length: normalizeNumber(getCellValue(baselineSheet, dataRow, 4)), // E
                condition: getCellValue(baselineSheet, dataRow, 7), // H
                strategicSignificance: getCellValue(baselineSheet, dataRow, 9), // J
                lengthRetained: normalizeNumber(getCellValue(baselineSheet, dataRow, 15)) || 0, // P
                lengthEnhanced: normalizeNumber(getCellValue(baselineSheet, dataRow, 16)) || 0, // Q
                userComments: String(getCellValue(baselineSheet, dataRow, 21) || ""), // V
                planningAuthorityComments: String(getCellValue(baselineSheet, dataRow, 22) || ""), // W
                habitatReferenceNumber: String(getCellValue(baselineSheet, dataRow, 23) || ""), // X
            };

            const result = v.safeParse(onSiteHedgerowBaselineSchema, inputData);
            if (result.success) {
                baselineMap.set(baselineRef, result.output);
            }
        });

        // Find all data rows in enhancement sheet (B column = baseline ref, 0-indexed as 1, starting from row 11)
        // Column B has the baseline reference
        const dataRows = findAllDataRows(sheet, 1, 11);

        if (dataRows.length === 0) {
            test.skip("no on-site hedgerow enhancement data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                // Extract input values from Excel
                // Column mapping (0-indexed) - based on B-3 sheet structure:
                // B (1): Baseline ref
                // M (12): Proposed habitat type
                // S (18): Proposed condition
                // U (20): Strategic Significance
                // W (22): Hedgerow enhanced in advance (years)
                // X (23): Delay in starting hedgerow enhancement (years)
                // AB (27): User Comments
                // AC (28): Planning Authority Comments
                // AD (29): Habitat Reference Number

                const baselineRef = getCellValue(sheet, dataRow, 1); // B
                const baseline = baselineMap.get(baselineRef);

                if (!baseline) {
                    // Skip rows without valid baseline reference
                    return;
                }

                const inputData = {
                    baseline,
                    habitatType: getCellValue(sheet, dataRow, 12), // M
                    condition: getCellValue(sheet, dataRow, 18), // S
                    strategicSignificance: getCellValue(sheet, dataRow, 20), // U
                    hedgerowEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 22)) || 0, // W
                    hedgerowEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, 23)) || 0, // X
                    userComments: String(getCellValue(sheet, dataRow, 27) || ""), // AB
                    planningAuthorityComments: String(getCellValue(sheet, dataRow, 28) || ""), // AC
                    habitatReferenceNumber: String(getCellValue(sheet, dataRow, 29) || ""), // AD
                };

                // Parse through the pipeline
                const result = v.safeParse(onSiteHedgerowEnhancementSchema, inputData);

                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }

                const parsed = result.output;

                // Get calculated values from Excel
                // Calculated column indices (0-indexed):
                // D (3): Length (km)
                // R (17): Distinctiveness Score
                // T (19): Condition Score
                // V (21): Strategic Significance Multiplier
                // Y (24): Time to target condition (years)
                // Z (25): Final time to target condition (years)
                // AA (26): Temporal multiplier
                // AE (30): Difficulty multiplier applied
                // AF (31): Net Unit Change

                const excelLength = getCellValue(sheet, dataRow, 3); // D
                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 17); // R
                const excelConditionScore = getCellValue(sheet, dataRow, 19); // T
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 21); // V
                const excelTimeToTarget = getCellValue(sheet, dataRow, 24); // Y
                const excelFinalTimeToTarget = getCellValue(sheet, dataRow, 25); // Z
                const excelTemporalMultiplier = getCellValue(sheet, dataRow, 26); // AA
                const excelDifficultyMultiplier = getCellValue(sheet, dataRow, 30); // AE
                const excelHedgerowUnitsDelivered = getCellValue(sheet, dataRow, 31); // AF

                // Compare values - only log on failure
                try {
                    if (excelLength !== null && typeof excelLength === "number") {
                        expectCloseTo(parsed.length, excelLength, 0.0001, "Length");
                    }
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
                        expectCloseTo(parsed.timeToTargetCondition as number, excelTimeToTarget, 0.0001, "Time to Target");
                    }
                    if (excelFinalTimeToTarget !== null) {
                        if (typeof excelFinalTimeToTarget === "number") {
                            expectCloseTo(parsed.finalTimeToTargetCondition as number, excelFinalTimeToTarget, 0.0001, "Final Time to Target");
                        } else if (typeof excelFinalTimeToTarget === "string") {
                            if (parsed.finalTimeToTargetCondition !== excelFinalTimeToTarget) {
                                throw new Error(`Final Time to Target mismatch: expected ${excelFinalTimeToTarget}, got ${parsed.finalTimeToTargetCondition}`);
                            }
                        }
                    }
                    if (excelTemporalMultiplier !== null && typeof excelTemporalMultiplier === "number") {
                        expectCloseTo(parsed.temporalMultiplier as number, excelTemporalMultiplier, 0.0001, "Temporal Multiplier");
                    }
                    if (excelDifficultyMultiplier !== null && typeof excelDifficultyMultiplier === "number") {
                        expectCloseTo(parsed.difficultyMultiplierApplied, excelDifficultyMultiplier, 0.0001, "Difficulty Multiplier");
                    }
                    if (excelHedgerowUnitsDelivered !== null && typeof excelHedgerowUnitsDelivered === "number") {
                        expectCloseTo(parsed.hedgerowUnitsDelivered, excelHedgerowUnitsDelivered, 0.0001, "Hedgerow Units Delivered");
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    console.error("\nExcel values:");
                    console.error("  Length:", excelLength);
                    console.error("  Distinctiveness Score:", excelDistinctivenessScore);
                    console.error("  Condition Score:", excelConditionScore);
                    console.error("  Strategic Multiplier:", excelStrategicMultiplier);
                    console.error("  Time to Target:", excelTimeToTarget);
                    console.error("  Final Time to Target:", excelFinalTimeToTarget);
                    console.error("  Temporal Multiplier:", excelTemporalMultiplier);
                    console.error("  Difficulty Multiplier:", excelDifficultyMultiplier);
                    console.error("  Hedgerow Units Delivered:", excelHedgerowUnitsDelivered);
                    console.error("\nParsed values:");
                    console.error("  Length:", parsed.length);
                    console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                    console.error("  Condition Score:", parsed.conditionScore);
                    console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                    console.error("  Time to Target:", parsed.timeToTargetCondition);
                    console.error("  Final Time to Target:", parsed.finalTimeToTargetCondition);
                    console.error("  Temporal Multiplier:", parsed.temporalMultiplier);
                    console.error("  Difficulty Multiplier:", parsed.difficultyMultiplierApplied);
                    console.error("  Hedgerow Units Delivered:", parsed.hedgerowUnitsDelivered);
                    throw error;
                }
            });
        });
    });

    describe("E-1 Off-Site Hedge Baseline", () => {
        const sheet = getSheet(workbook, 'E-1 Off-Site Hedge Baseline');


        // Find all data rows (D column = habitat type, 0-indexed as 3, starting from row 9)
        const dataRows = findAllDataRows(sheet, 3, 9);

        if (dataRows.length === 0) {
            test.skip("no off-site hedgerow baseline data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                // Extract input values from Excel
                // Column mapping (0-indexed) for E-1:
                // D (3): Habitat Type
                // E (4): Length (km)
                // H (7): Condition
                // J (9): Strategic Significance
                // O (14): Spatial Risk Category
                // S (18): Length Retained (km)
                // T (19): Length Enhanced (km)
                // Y (24): User Comments
                // Z (25): Planning Authority Comments
                // AA (26): Habitat Reference Number
                // AB (27): Off-site Reference Number

                const inputData = {
                    habitatType: getCellValue(sheet, dataRow, 3), // D
                    length: normalizeNumber(getCellValue(sheet, dataRow, 4)), // E
                    condition: getCellValue(sheet, dataRow, 7), // H
                    strategicSignificance: getCellValue(sheet, dataRow, 9), // J
                    spatialRiskCategory: getCellValue(sheet, dataRow, 14) || undefined, // O
                    lengthRetained: normalizeNumber(getCellValue(sheet, dataRow, 18)) || 0, // S
                    lengthEnhanced: normalizeNumber(getCellValue(sheet, dataRow, 19)) || 0, // T
                    userComments: String(getCellValue(sheet, dataRow, 24) || ""), // Y
                    planningAuthorityComments: String(getCellValue(sheet, dataRow, 25) || ""), // Z
                    habitatReferenceNumber: String(getCellValue(sheet, dataRow, 26) || ""), // AA
                    offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 27) || ""), // AB
                };

                // Parse through the pipeline
                const result = v.safeParse(offSiteHedgerowBaselineSchema, inputData);

                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }

                const parsed = result.output;

                // Get calculated values from Excel
                // Calculated column indices (0-indexed) for E-1:
                // F (5): Distinctiveness
                // G (6): Distinctiveness Score
                // I (8): Condition Score
                // L (11): Strategic Significance Multiplier
                // P (15): Spatial Risk Multiplier
                // N (13): Total Hedgerow Units SRM (with spatial risk)
                // Q (16): Total Hedgerow Units (without spatial risk)
                // U (20): Units Retained
                // V (21): Units Enhanced
                // W (22): Length Lost
                // X (23): Units Lost

                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 6); // G
                const excelConditionScore = getCellValue(sheet, dataRow, 8); // I
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 11); // L
                const excelSpatialRiskMultiplier = getCellValue(sheet, dataRow, 15); // P
                const excelTotalHedgerowUnitsSRM = getCellValue(sheet, dataRow, 13); // N
                const excelTotalHedgerowUnits = getCellValue(sheet, dataRow, 16); // Q
                const excelUnitsRetained = getCellValue(sheet, dataRow, 20); // U
                const excelUnitsEnhanced = getCellValue(sheet, dataRow, 21); // V
                const excelLengthLost = getCellValue(sheet, dataRow, 22); // W
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
                    if (excelSpatialRiskMultiplier !== null && typeof excelSpatialRiskMultiplier === "number") {
                        expectCloseTo(parsed.spatialRiskMultiplier, excelSpatialRiskMultiplier, 0.0001, "Spatial Risk Multiplier");
                    }
                    if (excelTotalHedgerowUnitsSRM !== null && typeof excelTotalHedgerowUnitsSRM === "number") {
                        expectCloseTo(parsed.totalHedgerowUnitsSRM, excelTotalHedgerowUnitsSRM, 0.0001, "Total Hedgerow Units SRM");
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
                    console.error("  Spatial Risk Multiplier:", excelSpatialRiskMultiplier);
                    console.error("  Total Hedgerow Units SRM:", excelTotalHedgerowUnitsSRM);
                    console.error("  Total Hedgerow Units:", excelTotalHedgerowUnits);
                    console.error("  Units Retained:", excelUnitsRetained);
                    console.error("  Units Enhanced:", excelUnitsEnhanced);
                    console.error("  Length Lost:", excelLengthLost);
                    console.error("  Units Lost:", excelUnitsLost);
                    console.error("\nParsed values:");
                    console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                    console.error("  Condition Score:", parsed.conditionScore);
                    console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                    console.error("  Spatial Risk Multiplier:", parsed.spatialRiskMultiplier);
                    console.error("  Total Hedgerow Units SRM:", parsed.totalHedgerowUnitsSRM);
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

    // TODO: make enhancement comparisons work properly
    describe.skip("E-3 Off-Site Hedge Enhancement", () => {
        const sheet = getSheet(workbook, 'E-3 Off-Site Hedge Enhancement');

        // Also need the baseline sheet to build baseline objects
        const baselineSheet = getSheet(workbook, 'E-1 Off-Site Hedge Baseline');

        // Build a map of baseline references to parsed baseline data
        const baselineMap = new Map();
        const baselineDataRows = findAllDataRows(baselineSheet, 3, 9);

        baselineDataRows.forEach((dataRow) => {
            const baselineRef = getCellValue(baselineSheet, dataRow, 39); // AN column (0-indexed as 39)

            if (!baselineRef) return;

            const inputData = {
                habitatType: getCellValue(baselineSheet, dataRow, 3), // D
                length: normalizeNumber(getCellValue(baselineSheet, dataRow, 4)), // E
                condition: getCellValue(baselineSheet, dataRow, 7), // H
                strategicSignificance: getCellValue(baselineSheet, dataRow, 9), // J
                spatialRiskCategory: getCellValue(baselineSheet, dataRow, 14) || undefined, // O
                lengthRetained: normalizeNumber(getCellValue(baselineSheet, dataRow, 18)) || 0, // S
                lengthEnhanced: normalizeNumber(getCellValue(baselineSheet, dataRow, 19)) || 0, // T
                userComments: String(getCellValue(baselineSheet, dataRow, 24) || ""), // Y
                planningAuthorityComments: String(getCellValue(baselineSheet, dataRow, 25) || ""), // Z
                habitatReferenceNumber: String(getCellValue(baselineSheet, dataRow, 26) || ""), // AA
                offSiteReferenceNumber: String(getCellValue(baselineSheet, dataRow, 27) || ""), // AB
            };

            const result = v.safeParse(offSiteHedgerowBaselineSchema, inputData);
            if (result.success) {
                baselineMap.set(baselineRef, result.output);
            }
        });

        // Find all data rows in enhancement sheet (B column = baseline ref, 0-indexed as 1, starting from row 11)
        // Column B has the baseline reference
        const dataRows = findAllDataRows(sheet, 1, 11);

        if (dataRows.length === 0) {
            test.skip("no off-site hedgerow enhancement data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                // Extract input values from Excel
                // Column mapping (0-indexed) - based on E-3 sheet structure:
                // B (1): Baseline ref
                // M (12): Proposed habitat type
                // S (18): Proposed condition
                // U (20): Strategic Significance
                // W (22): Hedgerow enhanced in advance (years)
                // X (23): Delay in starting hedgerow enhancement (years)
                // AE (30): User Comments
                // AF (31): Planning Authority Comments
                // AG (32): Habitat Reference Number
                // AH (33): Off-site Reference Number

                const baselineRef = getCellValue(sheet, dataRow, 1); // B
                const baseline = baselineMap.get(baselineRef);

                if (!baseline) {
                    // Skip rows without valid baseline reference
                    return;
                }

                const inputData = {
                    baseline,
                    habitatType: getCellValue(sheet, dataRow, 12), // M
                    condition: getCellValue(sheet, dataRow, 18), // S
                    strategicSignificance: getCellValue(sheet, dataRow, 20), // U
                    hedgerowEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 22)) || 0, // W
                    hedgerowEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, 23)) || 0, // X
                    userComments: String(getCellValue(sheet, dataRow, 30) || ""), // AE
                    planningAuthorityComments: String(getCellValue(sheet, dataRow, 31) || ""), // AF
                    habitatReferenceNumber: String(getCellValue(sheet, dataRow, 32) || ""), // AG
                    offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 33) || ""), // AH
                };

                // Parse through the pipeline
                const result = v.safeParse(offSiteHedgerowEnhancementSchema, inputData);

                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }

                const parsed = result.output;

                // Get calculated values from Excel
                // Calculated column indices (0-indexed):
                // D (3): Length (km)
                // R (17): Distinctiveness Score
                // T (19): Condition Score
                // V (21): Strategic Significance Multiplier
                // Y (24): Time to target condition (years)
                // Z (25): Final time to target condition (years)
                // AA (26): Temporal multiplier
                // AB (27): Spatial Risk Multiplier
                // AD (29): Difficulty multiplier applied
                // AJ (35): Hedgerow Units Delivered With Spatial Risk (with SRM)
                // AK (36): Hedgerow Units Delivered (without SRM)

                const excelLength = getCellValue(sheet, dataRow, 3); // D
                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 17); // R
                const excelConditionScore = getCellValue(sheet, dataRow, 19); // T
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 21); // V
                const excelTimeToTarget = getCellValue(sheet, dataRow, 24); // Y
                const excelFinalTimeToTarget = getCellValue(sheet, dataRow, 25); // Z
                const excelTemporalMultiplier = getCellValue(sheet, dataRow, 26); // AA
                const excelSpatialRiskMultiplier = getCellValue(sheet, dataRow, 27); // AB
                const excelDifficultyMultiplier = getCellValue(sheet, dataRow, 29); // AD
                const excelHedgerowUnitsDeliveredWithSpatialRisk = getCellValue(sheet, dataRow, 35); // AJ
                const excelHedgerowUnitsDelivered = getCellValue(sheet, dataRow, 36); // AK

                // Compare values - only log on failure
                try {
                    if (excelLength !== null && typeof excelLength === "number") {
                        expectCloseTo(parsed.length, excelLength, 0.0001, "Length");
                    }
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
                        expectCloseTo(parsed.timeToTargetCondition as number, excelTimeToTarget, 0.0001, "Time to Target");
                    }
                    if (excelFinalTimeToTarget !== null) {
                        if (typeof excelFinalTimeToTarget === "number") {
                            expectCloseTo(parsed.finalTimeToTargetCondition as number, excelFinalTimeToTarget, 0.0001, "Final Time to Target");
                        } else if (typeof excelFinalTimeToTarget === "string") {
                            if (parsed.finalTimeToTargetCondition !== excelFinalTimeToTarget) {
                                throw new Error(`Final Time to Target mismatch: expected ${excelFinalTimeToTarget}, got ${parsed.finalTimeToTargetCondition}`);
                            }
                        }
                    }
                    if (excelTemporalMultiplier !== null && typeof excelTemporalMultiplier === "number") {
                        expectCloseTo(parsed.temporalMultiplier as number, excelTemporalMultiplier, 0.0001, "Temporal Multiplier");
                    }
                    if (excelSpatialRiskMultiplier !== null && typeof excelSpatialRiskMultiplier === "number") {
                        expectCloseTo(parsed.spatialRiskMultiplier, excelSpatialRiskMultiplier, 0.0001, "Spatial Risk Multiplier");
                    }
                    if (excelDifficultyMultiplier !== null && typeof excelDifficultyMultiplier === "number") {
                        expectCloseTo(parsed.difficultyMultiplierApplied, excelDifficultyMultiplier, 0.0001, "Difficulty Multiplier");
                    }
                    if (excelHedgerowUnitsDeliveredWithSpatialRisk !== null && typeof excelHedgerowUnitsDeliveredWithSpatialRisk === "number") {
                        expectCloseTo(parsed.hedgerowUnitsDeliveredWithSpatialRisk, excelHedgerowUnitsDeliveredWithSpatialRisk, 0.0001, "Hedgerow Units Delivered With Spatial Risk");
                    }
                    if (excelHedgerowUnitsDelivered !== null && typeof excelHedgerowUnitsDelivered === "number") {
                        expectCloseTo(parsed.hedgerowUnitsDelivered, excelHedgerowUnitsDelivered, 0.0001, "Hedgerow Units Delivered");
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    console.error("\nExcel values:");
                    console.error("  Length:", excelLength);
                    console.error("  Distinctiveness Score:", excelDistinctivenessScore);
                    console.error("  Condition Score:", excelConditionScore);
                    console.error("  Strategic Multiplier:", excelStrategicMultiplier);
                    console.error("  Time to Target:", excelTimeToTarget);
                    console.error("  Final Time to Target:", excelFinalTimeToTarget);
                    console.error("  Temporal Multiplier:", excelTemporalMultiplier);
                    console.error("  Spatial Risk Multiplier:", excelSpatialRiskMultiplier);
                    console.error("  Difficulty Multiplier:", excelDifficultyMultiplier);
                    console.error("  Hedgerow Units Delivered With Spatial Risk:", excelHedgerowUnitsDeliveredWithSpatialRisk);
                    console.error("  Hedgerow Units Delivered:", excelHedgerowUnitsDelivered);
                    console.error("\nParsed values:");
                    console.error("  Length:", parsed.length);
                    console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                    console.error("  Condition Score:", parsed.conditionScore);
                    console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                    console.error("  Time to Target:", parsed.timeToTargetCondition);
                    console.error("  Final Time to Target:", parsed.finalTimeToTargetCondition);
                    console.error("  Temporal Multiplier:", parsed.temporalMultiplier);
                    console.error("  Spatial Risk Multiplier:", parsed.spatialRiskMultiplier);
                    console.error("  Difficulty Multiplier:", parsed.difficultyMultiplierApplied);
                    console.error("  Hedgerow Units Delivered With Spatial Risk:", parsed.hedgerowUnitsDeliveredWithSpatialRisk);
                    console.error("  Hedgerow Units Delivered:", parsed.hedgerowUnitsDelivered);
                    throw error;
                }
            });
        });
    });

    describe("E-2 Off-Site Hedge Creation", () => {
        const sheet = getSheet(workbook, 'E-2 Off-Site Hedge Creation');

        // Find all data rows (D column = habitat type, 0-indexed as 3, starting from row 12)
        const dataRows = findAllDataRows(sheet, 3, 11);

        if (dataRows.length === 0) {
            test.skip("no off-site hedgerow creation data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                // Extract input values from Excel
                // Column mapping (0-indexed) for E-2:
                // D (3): Habitat type
                // E (4): Length (km)
                // H (7): Condition
                // J (9): Strategic Significance
                // M (12): Spatial Risk Category
                // P (15): Habitat created in advance (years)
                // Q (16): Delay in starting habitat creation (years)
                // AA (26): User Comments
                // AB (27): Planning Authority Comments
                // AC (28): Habitat Reference Number
                // AD (29): Off-site Reference Number
                // AE (30): Baseline Reference Number

                const inputData = {
                    habitatType: getCellValue(sheet, dataRow, 3), // D
                    length: normalizeNumber(getCellValue(sheet, dataRow, 4)), // E
                    condition: getCellValue(sheet, dataRow, 7), // H
                    strategicSignificance: getCellValue(sheet, dataRow, 9), // J
                    spatialRiskCategory: getCellValue(sheet, dataRow, 12) || undefined, // M
                    habitatCreatedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 15)) || 0, // P
                    delayInStartingHabitatCreation: normalizeNumber(getCellValue(sheet, dataRow, 16)) || 0, // Q
                    userComments: String(getCellValue(sheet, dataRow, 26) || ""), // AA
                    planningAuthorityComments: String(getCellValue(sheet, dataRow, 27) || ""), // AB
                    habitatReferenceNumber: String(getCellValue(sheet, dataRow, 28) || ""), // AC
                    offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 29) || ""), // AD
                    baselineReferenceNumber: String(getCellValue(sheet, dataRow, 30) || ""), // AE
                };

                // Parse through the pipeline
                const result = v.safeParse(offSiteHedgerowCreationSchema, inputData);

                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }

                const parsed = result.output;

                // Get calculated values from Excel
                // Calculated column indices (0-indexed) for E-2:
                // F (5): Distinctiveness
                // G (6): Distinctiveness Score
                // I (8): Condition Score
                // K (10): Strategic Significance Category
                // L (11): Strategic Significance Multiplier
                // N (13): Spatial Risk Multiplier
                // O (14): Standard Time to Target Condition
                // S (18): Final time to target condition
                // T (19): Temporal multiplier
                // X (23): Difficulty multiplier
                // Y (24): Hedgerow Units Delivered With Spatial Risk (with SRM)
                // Z (25): Hedgerow Units Delivered (without SRM)

                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 6); // G
                const excelConditionScore = getCellValue(sheet, dataRow, 8); // I
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 11); // L
                const excelSpatialRiskMultiplier = getCellValue(sheet, dataRow, 13); // N
                const excelStandardTimeToTarget = getCellValue(sheet, dataRow, 14); // O
                const excelFinalTimeToTarget = getCellValue(sheet, dataRow, 18); // S
                const excelTemporalMultiplier = getCellValue(sheet, dataRow, 19); // T
                const excelDifficultyMultiplier = getCellValue(sheet, dataRow, 23); // X
                const excelHedgerowUnitsDeliveredWithSpatialRisk = getCellValue(sheet, dataRow, 24); // Y
                const excelHedgerowUnitsDelivered = getCellValue(sheet, dataRow, 25); // Z

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
                    if (excelStandardTimeToTarget !== null && typeof excelStandardTimeToTarget === "number") {
                        expectCloseTo(parsed.standardTimeToTargetCondition as number, excelStandardTimeToTarget, 0.0001, "Standard Time to Target");
                    }
                    if (excelFinalTimeToTarget !== null) {
                        if (typeof excelFinalTimeToTarget === "number") {
                            expectCloseTo(parsed.finalTimeToTargetCondition as number, excelFinalTimeToTarget, 0.0001, "Final Time to Target");
                        } else if (typeof excelFinalTimeToTarget === "string") {
                            if (parsed.finalTimeToTargetCondition !== excelFinalTimeToTarget) {
                                throw new Error(`Final Time to Target mismatch: expected ${excelFinalTimeToTarget}, got ${parsed.finalTimeToTargetCondition}`);
                            }
                        }
                    }
                    if (excelTemporalMultiplier !== null && typeof excelTemporalMultiplier === "number") {
                        expectCloseTo(parsed.temporalMultiplier as number, excelTemporalMultiplier, 0.0001, "Temporal Multiplier");
                    }
                    if (excelDifficultyMultiplier !== null && typeof excelDifficultyMultiplier === "number") {
                        expectCloseTo(parsed.difficultyMultiplier, excelDifficultyMultiplier, 0.0001, "Difficulty Multiplier");
                    }
                    if (excelHedgerowUnitsDeliveredWithSpatialRisk !== null && typeof excelHedgerowUnitsDeliveredWithSpatialRisk === "number") {
                        expectCloseTo(parsed.hedgerowUnitsDeliveredWithSpatialRisk, excelHedgerowUnitsDeliveredWithSpatialRisk, 0.0001, "Hedgerow Units Delivered With Spatial Risk");
                    }
                    if (excelHedgerowUnitsDelivered !== null && typeof excelHedgerowUnitsDelivered === "number") {
                        expectCloseTo(parsed.hedgerowUnitsDelivered, excelHedgerowUnitsDelivered, 0.0001, "Hedgerow Units Delivered");
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    console.error("\nExcel values:");
                    console.error("  Distinctiveness Score:", excelDistinctivenessScore);
                    console.error("  Condition Score:", excelConditionScore);
                    console.error("  Strategic Multiplier:", excelStrategicMultiplier);
                    console.error("  Spatial Risk Multiplier:", excelSpatialRiskMultiplier);
                    console.error("  Standard Time to Target:", excelStandardTimeToTarget);
                    console.error("  Final Time to Target:", excelFinalTimeToTarget);
                    console.error("  Temporal Multiplier:", excelTemporalMultiplier);
                    console.error("  Difficulty Multiplier:", excelDifficultyMultiplier);
                    console.error("  Hedgerow Units Delivered With Spatial Risk:", excelHedgerowUnitsDeliveredWithSpatialRisk);
                    console.error("  Hedgerow Units Delivered:", excelHedgerowUnitsDelivered);
                    console.error("\nParsed values:");
                    console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                    console.error("  Condition Score:", parsed.conditionScore);
                    console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                    console.error("  Spatial Risk Multiplier:", parsed.spatialRiskMultiplier);
                    console.error("  Standard Time to Target:", parsed.standardTimeToTargetCondition);
                    console.error("  Final Time to Target:", parsed.finalTimeToTargetCondition);
                    console.error("  Temporal Multiplier:", parsed.temporalMultiplier);
                    console.error("  Difficulty Multiplier:", parsed.difficultyMultiplier);
                    console.error("  Hedgerow Units Delivered With Spatial Risk:", parsed.hedgerowUnitsDeliveredWithSpatialRisk);
                    console.error("  Hedgerow Units Delivered:", parsed.hedgerowUnitsDelivered);
                    throw error;
                }
            });
        });
    });
})

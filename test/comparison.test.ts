import { describe, test, expect } from "bun:test"
import * as v from 'valibot';
import { EXCEL_FILES, expectCloseTo, testExcelFiles } from './helpers';
import { getCellValue, getSheet } from '../src/parsers/excelHelpers';
import { parseOffSiteHabitatBaselineRow, parseOffSiteHabitatCreationRow, parseOffSiteHabitatEnhancementRow, parseOffSiteHedgerowBaselineRow, parseOffSiteHedgerowCreationRow, parseOffSiteHedgerowEnhancementRow, parseOnSiteHabitatBaselineRow, parseOnSiteHabitatCreationRow, parseOnSiteHabitatEnhancementRow, parseOnSiteHedgerowBaselineRow, parseOnSiteHedgerowCreationRow, parseOnSiteHedgerowEnhancementRow } from "../src/parsers/rowParsers";
import { onSiteHabitatBaselineSchema } from "../src/onSite/habitatBaseline";
import { onSiteHabitatCreationSchema } from "../src/onSite/habitatCreation";
import { offSiteHabitatBaselineSchema } from "../src/offSite/habitatBaseline";
import { offSiteHabitatCreationSchema } from "../src/offSite/habitatCreation";
import { onSiteHedgerowBaselineSchema } from "../src/onSite/hedgerowBaseline";
import { onSiteHedgerowCreationSchema } from "../src/onSite/hedgerowCreation";
import { onSiteHedgerowEnhancementSchema } from "../src/onSite/hedgerowEnhancement";
import { offSiteHedgerowBaselineSchema } from "../src/offSite/hedgerowBaseline";
import { offSiteHedgerowCreationSchema } from "../src/offSite/hedgerowCreation";
import { offSiteHedgerowEnhancementSchema } from "../src/offSite/hedgerowEnhancement";
import { onSiteHabitatEnhancementSchema } from "../src/onSite/habitatEnhancement";
import { offSiteHabitatEnhancementSchema } from "../src/offSite/habitatEnhancement";
import parseFile, { findAllDataRows } from "../src/parsers/parseFile";

testExcelFiles(EXCEL_FILES, (workbook, fileName) => {
    describe("Headline Results", () => {
        const parsed = parseFile(fileName);
        const result = parsed.headlineResults;

        const headlineSheet = getSheet(workbook, 'Headline Results')!;

        test("calculates on-site habitat baseline", () => {
            const excelValue = getCellValue(headlineSheet, 7, 7); // H8 (0-indexed row 7)
            expectCloseTo(result.onSiteHabitatBaseline, excelValue, 0.01, "On-site Habitat Baseline");
        });

        test("calculates on-site hedgerow baseline", () => {
            const excelValue = getCellValue(headlineSheet, 8, 7); // H9
            expectCloseTo(result.onSiteHedgerowBaseline, excelValue, 0.01, "On-site Hedgerow Baseline");
        });

        test("calculates on-site watercourse baseline", () => {
            const excelValue = getCellValue(headlineSheet, 9, 7); // H10
            expectCloseTo(result.onSiteWatercourseBaseline, excelValue, 0.01, "On-site Watercourse Baseline");
        });

        test("calculates on-site habitat post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 11, 7); // H12
            expectCloseTo(result.onSiteHabitatPostIntervention, excelValue, 0.01, "On-site Habitat Post-intervention");
        });

        test("calculates on-site hedgerow post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 12, 7); // H13
            expectCloseTo(result.onSiteHedgerowPostIntervention, excelValue, 0.01, "On-site Hedgerow Post-intervention");
        });

        test("calculates on-site watercourse post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 13, 7); // H14
            expectCloseTo(result.onSiteWatercoursePostIntervention, excelValue, 0.01, "On-site Watercourse Post-intervention");
        });

        test("calculates on-site habitat net change", () => {
            const excelUnits = getCellValue(headlineSheet, 15, 7); // H16
            const excelPercentage = getCellValue(headlineSheet, 15, 9); // J16

            expectCloseTo(result.onSiteHabitatNetChange.units, excelUnits, 0.01, "On-site Habitat Net Change Units");
            expectCloseTo(result.onSiteHabitatNetChange.percentage, excelPercentage * 100, 0.1, "On-site Habitat Net Change Percentage");
        });

        test("calculates on-site hedgerow net change", () => {
            const excelUnits = getCellValue(headlineSheet, 16, 7); // H17
            const excelPercentage = getCellValue(headlineSheet, 16, 9); // J17

            expectCloseTo(result.onSiteHedgerowNetChange.units, excelUnits, 0.01, "On-site Hedgerow Net Change Units");
            expectCloseTo(result.onSiteHedgerowNetChange.percentage, excelPercentage * 100, 0.1, "On-site Hedgerow Net Change Percentage");
        });

        test("calculates on-site watercourse net change", () => {
            const excelUnits = getCellValue(headlineSheet, 17, 7); // H18
            const excelPercentage = getCellValue(headlineSheet, 17, 9); // J18

            expectCloseTo(result.onSiteWatercourseNetChange.units, excelUnits, 0.01, "On-site Watercourse Net Change Units");
            expectCloseTo(result.onSiteWatercourseNetChange.percentage, excelPercentage * 100, 0.1, "On-site Watercourse Net Change Percentage");
        });

        test("calculates off-site habitat baseline", () => {
            const excelValue = getCellValue(headlineSheet, 19, 7); // H20
            expectCloseTo(result.offSiteHabitatBaseline, excelValue, 0.01, "Off-site Habitat Baseline");
        });

        test("calculates off-site hedgerow baseline", () => {
            const excelValue = getCellValue(headlineSheet, 20, 7); // H21
            expectCloseTo(result.offSiteHedgerowBaseline, excelValue, 0.01, "Off-site Hedgerow Baseline");
        });

        test("calculates off-site watercourse baseline", () => {
            const excelValue = getCellValue(headlineSheet, 21, 7); // H22
            expectCloseTo(result.offSiteWatercourseBaseline, excelValue, 0.01, "Off-site Watercourse Baseline");
        });

        test("calculates off-site habitat post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 23, 7); // H24
            expectCloseTo(result.offSiteHabitatPostIntervention, excelValue, 0.01, "Off-site Habitat Post-intervention");
        });

        test("calculates off-site hedgerow post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 24, 7); // H25
            expectCloseTo(result.offSiteHedgerowPostIntervention, excelValue, 0.01, "Off-site Hedgerow Post-intervention");
        });

        test("calculates off-site watercourse post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 25, 7); // H26
            expectCloseTo(result.offSiteWatercoursePostIntervention, excelValue, 0.01, "Off-site Watercourse Post-intervention");
        });

        test("calculates off-site habitat net change", () => {
            const excelUnits = getCellValue(headlineSheet, 27, 7); // H28
            const excelPercentage = getCellValue(headlineSheet, 27, 9); // J28

            expectCloseTo(result.offSiteHabitatNetChange.units, excelUnits, 0.01, "Off-site Habitat Net Change Units");
            expectCloseTo(result.offSiteHabitatNetChange.percentage, excelPercentage * 100, 0.1, "Off-site Habitat Net Change Percentage");
        });

        test("calculates off-site hedgerow net change", () => {
            const excelUnits = getCellValue(headlineSheet, 28, 7); // H29
            const excelPercentage = getCellValue(headlineSheet, 28, 9); // J29

            expectCloseTo(result.offSiteHedgerowNetChange.units, excelUnits, 0.01, "Off-site Hedgerow Net Change Units");
            expectCloseTo(result.offSiteHedgerowNetChange.percentage, excelPercentage * 100, 0.1, "Off-site Hedgerow Net Change Percentage");
        });

        test("calculates off-site watercourse net change", () => {
            const excelUnits = getCellValue(headlineSheet, 29, 7); // H30
            const excelPercentage = getCellValue(headlineSheet, 29, 9); // J30

            expectCloseTo(result.offSiteWatercourseNetChange.units, excelUnits, 0.01, "Off-site Watercourse Net Change Units");
            expectCloseTo(result.offSiteWatercourseNetChange.percentage, excelPercentage * 100, 0.1, "Off-site Watercourse Net Change Percentage");
        });

        test("calculates off-site habitat net change with SRM", () => {
            const excelUnits = getCellValue(headlineSheet, 31, 7); // H32

            if (result.offSiteHabitatNetChange.units <= 0) {
                expect(excelUnits).toEqual("N/A")
                expect(result.offSiteHabitatNetChangeWithSRM).toEqual("N/A")
            } else {
                if (typeof result.offSiteHabitatNetChangeWithSRM !== "number") return;
                expectCloseTo(result.offSiteHabitatNetChangeWithSRM, excelUnits, 0.01, "Off-site Habitat Net Change with SRM Units");
            }
        });

        test("calculates off-site hedgerow net change with SRM", () => {
            const excelUnits = getCellValue(headlineSheet, 32, 7); // H33

            if (result.offSiteHedgerowNetChange.units <= 0) {
                expect(excelUnits).toEqual("N/A")
                expect(result.offSiteHedgerowNetChangeWithSRM).toEqual("N/A")
            } else {
                if (typeof result.offSiteHedgerowNetChangeWithSRM !== "number") return;
                expectCloseTo(result.offSiteHedgerowNetChangeWithSRM, excelUnits, 0.01, "Off-site Hedgerow Net Change with SRM Units");
            }
        });

        test("calculates off-site watercourse net change with SRM", () => {
            const excelUnits = getCellValue(headlineSheet, 33, 7); // H34

            if (result.offSiteWatercourseNetChange.units <= 0) {
                expect(excelUnits).toEqual("N/A")
                expect(result.offSiteWatercourseNetChangeWithSRM).toEqual("N/A")
            } else {
                if (typeof result.offSiteWatercourseNetChangeWithSRM !== "number") return;
                expectCloseTo(result.offSiteWatercourseNetChangeWithSRM, excelUnits, 0.01, "Off-site Watercourse Net Change with SRM Units");
            }
        });

        test("calculates combined net unit change", () => {
            const excelHabitat = getCellValue(headlineSheet, 36, 7); // H37
            const excelHedgerow = getCellValue(headlineSheet, 37, 7); // H38
            const excelWatercourse = getCellValue(headlineSheet, 38, 7); // H39

            expectCloseTo(result.combinedNetUnitChange.habitat, excelHabitat, 0.01, "Combined Net Unit Change - Habitat");
            expectCloseTo(result.combinedNetUnitChange.hedgerow, excelHedgerow, 0.01, "Combined Net Unit Change - Hedgerow");
            expectCloseTo(result.combinedNetUnitChange.watercourse, excelWatercourse, 0.01, "Combined Net Unit Change - Watercourse");
        });

        test("calculates total SRM deductions", () => {
            const excelHabitat = parseFloat(getCellValue(headlineSheet, 40, 7)); // H41
            const excelHedgerow = parseFloat(getCellValue(headlineSheet, 41, 7)); // H42
            const excelWatercourse = parseFloat(getCellValue(headlineSheet, 42, 7)); // H43

            expectCloseTo(result.totalSRMDeductions.habitat, excelHabitat, 0.01, "Total SRM Deductions - Habitat");
            expectCloseTo(result.totalSRMDeductions.hedgerow, excelHedgerow, 0.01, "Total SRM Deductions - Hedgerow");
            expectCloseTo(result.totalSRMDeductions.watercourse, excelWatercourse, 0.01, "Total SRM Deductions - Watercourse");
        });

        test("calculates final total net unit change", () => {
            const habitatValue = getCellValue(headlineSheet, 46, 7); // H47
            const hedgerowValue = getCellValue(headlineSheet, 47, 7); // H48
            const watercourseValue = getCellValue(headlineSheet, 48, 7); // H49

            expectCloseTo(result.totalNetUnitChange.habitat, habitatValue, 0.01, "Total Net Unit Change - Habitat");
            expectCloseTo(result.totalNetUnitChange.hedgerow, hedgerowValue, 0.01, "Total Net Unit Change - Hedgerow");
            expectCloseTo(result.totalNetUnitChange.watercourse, watercourseValue, 0.01, "Total Net Unit Change - Watercourse");
        });

        test("calculates final total net percentage change", () => {
            const habitatValue = getCellValue(headlineSheet, 50, 7); // H51
            const hedgerowValue = getCellValue(headlineSheet, 51, 7); // H52
            const watercourseValue = getCellValue(headlineSheet, 52, 7); // H53

            expectCloseTo(result.totalNetPercentageChange.habitat, habitatValue, 0.01, "Total Net Percentage Change - Habitat");
            expectCloseTo(result.totalNetPercentageChange.hedgerow, hedgerowValue, 0.01, "Total Net Percentage Change - Hedgerow");
            expectCloseTo(result.totalNetPercentageChange.watercourse, watercourseValue, 0.01, "Total Net Percentage Change - Watercourse");
        });

        test("calculates trading rules satisfied", () => {
            const excelValue = getCellValue(headlineSheet, 54, 5) // F55
            const booleanExcelValue = excelValue.trim() === "No - Check Trading Summaries ▲" ? false : true;
            expect(result.tradingRulesSatisfied).toEqual(booleanExcelValue);
        })

        test("calculates unit deficit", () => {
            const habitatValue = getCellValue(headlineSheet, 60, 7) // H61
            const hedgerowValue = getCellValue(headlineSheet, 61, 7) // H62
            const watercourseValue = getCellValue(headlineSheet, 62, 7) // H63

            expectCloseTo(result.habitatUnitSummary.unitDeficit, habitatValue, 0.01, "Unit Deficit - Habitat");
            expectCloseTo(result.hedgerowUnitSummary.unitDeficit, hedgerowValue, 0.01, "Unit Deficit - Hedgerow");
            expectCloseTo(result.watercourseUnitSummary.unitDeficit, watercourseValue, 0.01, "Unit Deficit - Watercourse");
        })
    });

    describe("A-1 On-Site Habitat Baseline", () => {
        const sheet = getSheet(workbook, 'A-1 On-Site Habitat Baseline')!;

        // Find all data rows (E column = broad habitat, 0-indexed as 4)
        const dataRows = findAllDataRows(sheet, 4);

        if (dataRows.length === 0) {
            test.skip("no on-site baseline data in test file", () => { });
            return;
        }

        test.each(dataRows)("row %d matches pipeline calculations", (dataRow) => {
            const inputData = parseOnSiteHabitatBaselineRow(sheet, dataRow);
            const result = v.safeParse(onSiteHabitatBaselineSchema, inputData);

            if (!result.success) {
                console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                expect(result.success).toBeTrue();
                return;
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

    describe("A-2 On-Site Habitat Creation", () => {
        const sheet = getSheet(workbook, 'A-2 On-Site Habitat Creation')!;

        // Find all data rows (Y column = habitat units delivered, 0-indexed as 24)
        // This is the most likely to show a full row since it only calculates after loads is filled in already
        const dataRows = findAllDataRows(sheet, 24);

        if (dataRows.length === 0) {
            test.skip("no on-site creation data in test file", () => { });
            return;
        }

        test.each(dataRows)("row %d matches pipeline calculations", (dataRow) => {
            const inputData = parseOnSiteHabitatCreationRow(sheet, dataRow);
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
                console.error("\nInput data:")
                console.error(inputData)
                throw error;
            }
        });
    });

    describe("A-3 On-Site Habitat Enhancement", () => {
        const sheet = getSheet(workbook, 'A-3 On-Site Habitat Enhancement')!;
        const baselineSheet = getSheet(workbook, 'A-1 On-Site Habitat Baseline')!;

        // Find all data rows (AQ column = habitat reference number, 0-indexed as 42, starting from row 12)
        // However, let's use column B (1) which has the baseline reference as it's more reliable
        const dataRows = findAllDataRows(sheet, 1, 11);

        if (dataRows.length === 0) {
            test.skip("no on-site habitat enhancement data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOnSiteHabitatEnhancementRow(baselineSheet, sheet, dataRow);
                const result = v.safeParse(onSiteHabitatEnhancementSchema, inputData);

                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }

                const parsed = result.output;

                // Get calculated values from Excel
                // Calculated column indices (0-indexed) - see docs/excel-column-mappings.md:
                // U (20): Area (hectares)
                // X (23): Distinctiveness Score
                // Z (25): Condition Score
                // AC (28): Strategic Significance Multiplier
                // AD (29): Standard Time to Target Condition (years)
                // AH (33): Final Time to Target Condition (years)
                // AI (34): Final Time to Target Multiplier
                // AM (38): Difficulty Multiplier Applied
                // AN (39): Habitat Units Delivered

                const excelArea = getCellValue(sheet, dataRow, 20); // U
                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 23); // X
                const excelConditionScore = getCellValue(sheet, dataRow, 25); // Z
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 28); // AC
                const excelTimeToTarget = getCellValue(sheet, dataRow, 29); // AD
                const excelFinalTimeToTarget = getCellValue(sheet, dataRow, 33); // AH
                const excelFinalTimeMultiplier = getCellValue(sheet, dataRow, 34); // AI
                const excelDifficultyMultiplier = getCellValue(sheet, dataRow, 38); // AM
                const excelHabitatUnitsDelivered = getCellValue(sheet, dataRow, 39); // AN

                // Compare values - only log on failure
                try {
                    if (excelArea !== null && typeof excelArea === "number") {
                        expectCloseTo(parsed.area, excelArea, 0.0001, "Area");
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
                    if (excelFinalTimeMultiplier !== null && typeof excelFinalTimeMultiplier === "number") {
                        expectCloseTo(parsed.finalTimeToTargetMultiplier as number, excelFinalTimeMultiplier, 0.0001, "Final Time to Target Multiplier");
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
                    console.error("  Area:", excelArea);
                    console.error("  Distinctiveness Score:", excelDistinctivenessScore);
                    console.error("  Condition Score:", excelConditionScore);
                    console.error("  Strategic Multiplier:", excelStrategicMultiplier);
                    console.error("  Time to Target:", excelTimeToTarget);
                    console.error("  Final Time to Target:", excelFinalTimeToTarget);
                    console.error("  Temporal Multiplier:", excelFinalTimeMultiplier);
                    console.error("  Difficulty Multiplier:", excelDifficultyMultiplier);
                    console.error("  Habitat Units Delivered:", excelHabitatUnitsDelivered);
                    console.error("\nParsed values:");
                    console.error("  Area:", parsed.area);
                    console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                    console.error("  Condition Score:", parsed.conditionScore);
                    console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                    console.error("  Time to Target:", parsed.timeToTargetCondition);
                    console.error("  Final Time to Target:", parsed.finalTimeToTargetCondition);
                    console.error("  Difficulty Multiplier:", parsed.difficultyMultiplierApplied);
                    console.error("  Habitat Units Delivered:", parsed.habitatUnitsDelivered);
                    throw error;
                }
            });
        });
    });

    describe("B-1 On-Site Hedge Baseline", () => {
        const sheet = getSheet(workbook, 'B-1 On-Site Hedge Baseline')!;

        // Find all data rows (D column = habitat type, 0-indexed as 3, starting from row 10)
        const dataRows = findAllDataRows(sheet, 3, 9);

        if (dataRows.length === 0) {
            test.skip("no on-site hedgerow baseline data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOnSiteHedgerowBaselineRow(sheet, dataRow);
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
        const sheet = getSheet(workbook, 'B-2 On-Site Hedge Creation')!;

        // Find all data rows (D column = habitat type, 0-indexed as 3, starting from row 11)
        const dataRows = findAllDataRows(sheet, 3, 11);

        if (dataRows.length === 0) {
            test.skip("no on-site hedgerow creation data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOnSiteHedgerowCreationRow(sheet, dataRow);
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
        const sheet = getSheet(workbook, 'B-3 On-Site Hedge Enhancement')!;
        const baselineSheet = getSheet(workbook, 'B-1 On-Site Hedge Baseline')!;

        // Find all data rows in enhancement sheet (B column = baseline ref, 0-indexed as 1, starting from row 11)
        // Column B has the baseline reference
        const dataRows = findAllDataRows(sheet, 1, 11);

        if (dataRows.length === 0) {
            test.skip("no on-site hedgerow enhancement data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOnSiteHedgerowEnhancementRow(baselineSheet, sheet, dataRow);
                const result = v.safeParse(onSiteHedgerowEnhancementSchema, inputData);

                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }

                const parsed = result.output;

                // Get calculated values from Excel
                // Calculated column indices (0-indexed):
                // P (15): Length
                // R (17): Distinctiveness Score
                // T (19): Condition Score
                // W (22): Strategic Significance Multiplier
                // X (23): Time to target condition (years)
                // AB (27): Final time to target condition (years)
                // AC (28): Temporal multiplier
                // AG (32): Difficulty multiplier applied
                // AH (33): Units delivered

                const excelLength = getCellValue(sheet, dataRow, 15); // P
                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 17); // R
                const excelConditionScore = getCellValue(sheet, dataRow, 19); // T
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 22); // W
                const excelTimeToTarget = getCellValue(sheet, dataRow, 23); // X
                const excelFinalTimeToTarget = getCellValue(sheet, dataRow, 27); // AB
                const excelTemporalMultiplier = getCellValue(sheet, dataRow, 28); // AC
                const excelDifficultyMultiplier = getCellValue(sheet, dataRow, 32); // AG
                const excelHedgerowUnitsDelivered = getCellValue(sheet, dataRow, 33); // AH

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

    describe("D-1 Off-Site Habitat Baseline - Excel Comparison", () => {
        const sheet = getSheet(workbook, 'D-1 Off-Site Habitat Baseline')!;

        // Find all data rows (E column = broad habitat, 0-indexed as 4)
        const dataRows = findAllDataRows(sheet, 4);

        if (dataRows.length === 0) {
            test.skip("no off-site baseline data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOffSiteHabitatBaselineRow(sheet, dataRow);
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
        const sheet = getSheet(workbook, 'D-2 Off-Site Habitat Creation')!;

        // Find all data rows (D column = broad habitat, 0-indexed as 3)
        const dataRows = findAllDataRows(sheet, 3);

        if (dataRows.length === 0) {
            test.skip("no off-site creation data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOffSiteHabitatCreationRow(sheet, dataRow);
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

    describe("D-3 Off-Site Habitat Enhancement", () => {
        const sheet = getSheet(workbook, 'D-3 Off-Site Habitat Enhancment')!; // Note: typo in actual Excel sheet name
        const baselineSheet = getSheet(workbook, 'D-1 Off-Site Habitat Baseline')!;

        // Find all data rows (E column = baseline reference, 0-indexed as 4, starting from row 12)
        const dataRows = findAllDataRows(sheet, 4, 11);

        if (dataRows.length === 0) {
            test.skip("no off-site habitat enhancement data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOffSiteHabitatEnhancementRow(baselineSheet, sheet, dataRow);
                const result = v.safeParse(offSiteHabitatEnhancementSchema, inputData);

                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, result.issues);
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }

                const parsed = result.output;

                // Get calculated values from Excel
                // Calculated column indices (0-indexed) - see docs/excel-column-mappings.md:
                // V (21): Area (hectares)
                // X (23): Distinctiveness Score (proposed)
                // Z (25): Condition Score (proposed)
                // AC (28): Strategic Significance Multiplier
                // AD (29): Standard Time to Target Condition (years)
                // AH (33): Final Time to Target Condition (years)
                // AI (34): Final Time to Target Multiplier
                // AM (38): Difficulty Multiplier Applied
                // AO (40): Spatial Risk Multiplier
                // AP (41): Habitat Units Delivered (inc SRM)
                // AQ (42): Habitat Units Delivered (without SRM)

                const excelArea = getCellValue(sheet, dataRow, 21); // V
                const excelDistinctivenessScore = getCellValue(sheet, dataRow, 23); // X
                const excelConditionScore = getCellValue(sheet, dataRow, 25); // Z
                const excelStrategicMultiplier = getCellValue(sheet, dataRow, 28); // AC
                const excelTimeToTarget = getCellValue(sheet, dataRow, 29); // AD
                const excelFinalTimeToTarget = getCellValue(sheet, dataRow, 33); // AH
                const excelFinalTimeMultiplier = getCellValue(sheet, dataRow, 34); // AI
                const excelDifficultyMultiplier = getCellValue(sheet, dataRow, 38); // AM
                const excelSpatialRiskMultiplier = getCellValue(sheet, dataRow, 40); // AO
                const excelHabitatUnitsDeliveredWithSpatialRisk = getCellValue(sheet, dataRow, 41); // AP
                const excelHabitatUnitsDelivered = getCellValue(sheet, dataRow, 42); // AQ

                // Compare values - only log on failure
                try {
                    if (excelArea !== null && typeof excelArea === "number") {
                        expectCloseTo(parsed.area, excelArea, 0.0001, "Area");
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
                    if (excelFinalTimeMultiplier !== null && typeof excelFinalTimeMultiplier === "number") {
                        expectCloseTo(parsed.finalTimeToTargetMultiplier as number, excelFinalTimeMultiplier, 0.0001, "Final Time to Target Multiplier");
                    }
                    if (excelDifficultyMultiplier !== null && typeof excelDifficultyMultiplier === "number") {
                        expectCloseTo(parsed.difficultyMultiplierApplied, excelDifficultyMultiplier, 0.0001, "Difficulty Multiplier");
                    }
                    if (excelSpatialRiskMultiplier !== null && typeof excelSpatialRiskMultiplier === "number") {
                        expectCloseTo(parsed.spatialRiskMultiplier, excelSpatialRiskMultiplier, 0.0001, "Spatial Risk Multiplier");
                    }
                    if (excelHabitatUnitsDeliveredWithSpatialRisk !== null && typeof excelHabitatUnitsDeliveredWithSpatialRisk === "number") {
                        expectCloseTo(parsed.habitatUnitsDeliveredWithSpatialRisk, excelHabitatUnitsDeliveredWithSpatialRisk, 0.0001, "Habitat Units Delivered (with SRM)");
                    }
                    if (excelHabitatUnitsDelivered !== null && typeof excelHabitatUnitsDelivered === "number") {
                        expectCloseTo(parsed.habitatUnitsDelivered, excelHabitatUnitsDelivered, 0.0001, "Habitat Units Delivered");
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    console.error("\nExcel values:");
                    console.error("  Area:", excelArea);
                    console.error("  Distinctiveness Score:", excelDistinctivenessScore);
                    console.error("  Condition Score:", excelConditionScore);
                    console.error("  Strategic Multiplier:", excelStrategicMultiplier);
                    console.error("  Time to Target:", excelTimeToTarget);
                    console.error("  Final Time to Target:", excelFinalTimeToTarget);
                    console.error("  Final Time to Target Multiplier:", excelFinalTimeMultiplier);
                    console.error("  Difficulty Multiplier:", excelDifficultyMultiplier);
                    console.error("  Spatial Risk Multiplier:", excelSpatialRiskMultiplier);
                    console.error("  Habitat Units Delivered (with SRM):", excelHabitatUnitsDeliveredWithSpatialRisk);
                    console.error("  Habitat Units Delivered:", excelHabitatUnitsDelivered);
                    console.error("\nParsed values:");
                    console.error("  Area:", parsed.area);
                    console.error("  Distinctiveness Score:", parsed.distinctivenessScore);
                    console.error("  Condition Score:", parsed.conditionScore);
                    console.error("  Strategic Multiplier:", parsed.strategicSignificanceMultiplier);
                    console.error("  Time to Target:", parsed.timeToTargetCondition);
                    console.error("  Final Time to Target:", parsed.finalTimeToTargetCondition);
                    console.error("  Final Time to Target Multiplier:", parsed.finalTimeToTargetMultiplier);
                    console.error("  Difficulty Multiplier:", parsed.difficultyMultiplierApplied);
                    console.error("  Spatial Risk Multiplier:", parsed.spatialRiskMultiplier);
                    console.error("  Habitat Units Delivered (with SRM):", parsed.habitatUnitsDeliveredWithSpatialRisk);
                    console.error("  Habitat Units Delivered:", parsed.habitatUnitsDelivered);
                    throw error;
                }
            });
        });
    });

    describe("E-1 Off-Site Hedge Baseline", () => {
        const sheet = getSheet(workbook, 'E-1 Off-Site Hedge Baseline')!;

        // Find all data rows (D column = habitat type, 0-indexed as 3, starting from row 9)
        const dataRows = findAllDataRows(sheet, 3, 9);

        if (dataRows.length === 0) {
            test.skip("no off-site hedgerow baseline data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOffSiteHedgerowBaselineRow(sheet, dataRow);
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

    describe("E-2 Off-Site Hedge Creation", () => {
        const sheet = getSheet(workbook, 'E-2 Off-Site Hedge Creation')!;

        // Find all data rows (D column = habitat type, 0-indexed as 3, starting from row 12)
        const dataRows = findAllDataRows(sheet, 3, 11);

        if (dataRows.length === 0) {
            test.skip("no off-site hedgerow creation data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOffSiteHedgerowCreationRow(sheet, dataRow);
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

    // NOTE: this doesn't seem to process any rows in any sheets (not a massive surprise)
    describe("E-3 Off-Site Hedge Enhancement", () => {
        const sheet = getSheet(workbook, 'E-3 Off-Site Hedge Enhancement')!;
        const baselineSheet = getSheet(workbook, 'E-1 Off-Site Hedge Baseline')!;

        // Column B has the baseline reference
        const dataRows = findAllDataRows(sheet, 1, 11);

        if (dataRows.length === 0) {
            test.skip("no off-site hedgerow enhancement data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOffSiteHedgerowEnhancementRow(baselineSheet, sheet, dataRow);
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
})

import { describe, test, expect } from "bun:test"
import XLSX from 'xlsx';
import * as v from 'valibot';
import { EXCEL_FILES, expectCloseTo, testExcelFiles } from './helpers';
import { getCellValue, getSheet } from '../src/parsers/excelHelpers';
import { parseOffSiteHabitatBaselineRow, parseOffSiteHabitatCreationRow, parseOffSiteHabitatEnhancementRow, parseOffSiteHedgerowBaselineRow, parseOffSiteHedgerowCreationRow, parseOffSiteHedgerowEnhancementRow, parseOnSiteHabitatBaselineRow, parseOnSiteHabitatCreationRow, parseOnSiteHabitatEnhancementRow, parseOnSiteHedgerowBaselineRow, parseOnSiteHedgerowCreationRow, parseOnSiteHedgerowEnhancementRow, parseOnSiteWatercourseBaselineRow, parseOnSiteWatercourseCreationRow, parseOnSiteWatercourseEnhancementRow, parseOffSiteWatercourseBaselineRow, parseOffSiteWatercourseCreationRow, parseOffSiteWatercourseEnhancementRow } from "../src/parsers/rowParsers";
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
import { onSiteWatercourseBaselineSchema } from "../src/onSite/watercourseBaseline";
import { onSiteWatercourseCreationSchema } from "../src/onSite/watercourseCreation";
import { onSiteWatercourseEnhancementSchema } from "../src/onSite/watercourseEnhancement";
import { offSiteWatercourseBaselineSchema } from "../src/offSite/watercourseBaseline";
import { offSiteWatercourseCreationSchema } from "../src/offSite/watercourseCreation";
import { offSiteWatercourseEnhancementSchema } from "../src/offSite/watercourseEnhancement";
import parseFile, { findAllDataRows } from "../src/parsers/parseFile";
import { headlineResults } from "../src/headlineResults";
import { tradingSummaries } from "../src/tradingSummaries";
import { unitShortfall } from "../src/unitShortfall";

testExcelFiles(EXCEL_FILES, (workbook, fileName) => {
    const parsed = parseFile(fileName);
    const trading = tradingSummaries(parsed);
    // parseWorkbook doesn't load the 'Start' sheet, so re-read for F22 (configured net-gain target).
    const fullWorkbook = XLSX.readFile(fileName, { sheets: ['Start'], cellFormula: false, cellHTML: false });
    const startSheet = getSheet(fullWorkbook, 'Start');
    const f22 = startSheet ? getCellValue(startSheet, 21, 5) : null; // F22 (0-indexed row 21, col 5)
    const netGainTarget = typeof f22 === 'number' && f22 > 0 ? f22 : 0.1;
    const headline = headlineResults(parsed, trading, { netGainTarget });
    const shortfall = unitShortfall(parsed, headline, trading);

    describe("Headline Results", () => {
        const headlineSheet = getSheet(workbook, 'Headline Results')!;

        test("calculates on-site habitat baseline", () => {
            const excelValue = getCellValue(headlineSheet, 7, 7); // H8 (0-indexed row 7)
            expectCloseTo(headline.onSiteHabitatBaseline, excelValue, 0.01, "On-site Habitat Baseline");
        });

        test("calculates on-site hedgerow baseline", () => {
            const excelValue = getCellValue(headlineSheet, 8, 7); // H9
            expectCloseTo(headline.onSiteHedgerowBaseline, excelValue, 0.01, "On-site Hedgerow Baseline");
        });

        test("calculates on-site watercourse baseline", () => {
            const excelValue = getCellValue(headlineSheet, 9, 7); // H10
            expectCloseTo(headline.onSiteWatercourseBaseline, excelValue, 0.01, "On-site Watercourse Baseline");
        });

        test("calculates on-site habitat post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 11, 7); // H12
            expectCloseTo(headline.onSiteHabitatPostIntervention, excelValue, 0.01, "On-site Habitat Post-intervention");
        });

        test("calculates on-site hedgerow post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 12, 7); // H13
            expectCloseTo(headline.onSiteHedgerowPostIntervention, excelValue, 0.01, "On-site Hedgerow Post-intervention");
        });

        test("calculates on-site watercourse post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 13, 7); // H14
            expectCloseTo(headline.onSiteWatercoursePostIntervention, excelValue, 0.01, "On-site Watercourse Post-intervention");
        });

        test("calculates on-site habitat net change", () => {
            const excelUnits = getCellValue(headlineSheet, 15, 7); // H16
            const excelPercentage = getCellValue(headlineSheet, 15, 9); // J16

            expectCloseTo(headline.onSiteHabitatNetChange.units, excelUnits, 0.01, "On-site Habitat Net Change Units");
            expectCloseTo(headline.onSiteHabitatNetChange.percentage, excelPercentage * 100, 0.1, "On-site Habitat Net Change Percentage");
        });

        test("calculates on-site hedgerow net change", () => {
            const excelUnits = getCellValue(headlineSheet, 16, 7); // H17
            const excelPercentage = getCellValue(headlineSheet, 16, 9); // J17

            expectCloseTo(headline.onSiteHedgerowNetChange.units, excelUnits, 0.01, "On-site Hedgerow Net Change Units");
            expectCloseTo(headline.onSiteHedgerowNetChange.percentage, excelPercentage * 100, 0.1, "On-site Hedgerow Net Change Percentage");
        });

        test("calculates on-site watercourse net change", () => {
            const excelUnits = getCellValue(headlineSheet, 17, 7); // H18
            const excelPercentage = getCellValue(headlineSheet, 17, 9); // J18

            expectCloseTo(headline.onSiteWatercourseNetChange.units, excelUnits, 0.01, "On-site Watercourse Net Change Units");
            expectCloseTo(headline.onSiteWatercourseNetChange.percentage, excelPercentage * 100, 0.1, "On-site Watercourse Net Change Percentage");
        });

        test("calculates off-site habitat baseline", () => {
            const excelValue = getCellValue(headlineSheet, 19, 7); // H20
            expectCloseTo(headline.offSiteHabitatBaseline, excelValue, 0.01, "Off-site Habitat Baseline");
        });

        test("calculates off-site hedgerow baseline", () => {
            const excelValue = getCellValue(headlineSheet, 20, 7); // H21
            expectCloseTo(headline.offSiteHedgerowBaseline, excelValue, 0.01, "Off-site Hedgerow Baseline");
        });

        test("calculates off-site watercourse baseline", () => {
            const excelValue = getCellValue(headlineSheet, 21, 7); // H22
            expectCloseTo(headline.offSiteWatercourseBaseline, excelValue, 0.01, "Off-site Watercourse Baseline");
        });

        test("calculates off-site habitat post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 23, 7); // H24
            expectCloseTo(headline.offSiteHabitatPostIntervention, excelValue, 0.01, "Off-site Habitat Post-intervention");
        });

        test("calculates off-site hedgerow post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 24, 7); // H25
            expectCloseTo(headline.offSiteHedgerowPostIntervention, excelValue, 0.01, "Off-site Hedgerow Post-intervention");
        });

        test("calculates off-site watercourse post-intervention", () => {
            const excelValue = getCellValue(headlineSheet, 25, 7); // H26
            expectCloseTo(headline.offSiteWatercoursePostIntervention, excelValue, 0.01, "Off-site Watercourse Post-intervention");
        });

        test("calculates off-site habitat net change", () => {
            const excelUnits = getCellValue(headlineSheet, 27, 7); // H28
            const excelPercentage = getCellValue(headlineSheet, 27, 9); // J28

            expectCloseTo(headline.offSiteHabitatNetChange.units, excelUnits, 0.01, "Off-site Habitat Net Change Units");
            expectCloseTo(headline.offSiteHabitatNetChange.percentage, excelPercentage * 100, 0.1, "Off-site Habitat Net Change Percentage");
        });

        test("calculates off-site hedgerow net change", () => {
            const excelUnits = getCellValue(headlineSheet, 28, 7); // H29
            const excelPercentage = getCellValue(headlineSheet, 28, 9); // J29

            expectCloseTo(headline.offSiteHedgerowNetChange.units, excelUnits, 0.01, "Off-site Hedgerow Net Change Units");
            expectCloseTo(headline.offSiteHedgerowNetChange.percentage, excelPercentage * 100, 0.1, "Off-site Hedgerow Net Change Percentage");
        });

        test("calculates off-site watercourse net change", () => {
            const excelUnits = getCellValue(headlineSheet, 29, 7); // H30
            const excelPercentage = getCellValue(headlineSheet, 29, 9); // J30

            expectCloseTo(headline.offSiteWatercourseNetChange.units, excelUnits, 0.01, "Off-site Watercourse Net Change Units");
            expectCloseTo(headline.offSiteWatercourseNetChange.percentage, excelPercentage * 100, 0.1, "Off-site Watercourse Net Change Percentage");
        });

        test("calculates off-site habitat net change with SRM", () => {
            const excelUnits = getCellValue(headlineSheet, 31, 7); // H32

            if (headline.offSiteHabitatNetChange.units <= 0) {
                expect(excelUnits).toEqual("N/A")
                expect(headline.offSiteHabitatNetChangeWithSRM).toEqual("N/A")
            } else {
                if (typeof headline.offSiteHabitatNetChangeWithSRM !== "number") return;
                expectCloseTo(headline.offSiteHabitatNetChangeWithSRM, excelUnits, 0.01, "Off-site Habitat Net Change with SRM Units");
            }
        });

        test("calculates off-site hedgerow net change with SRM", () => {
            const excelUnits = getCellValue(headlineSheet, 32, 7); // H33

            if (headline.offSiteHedgerowNetChange.units <= 0) {
                expect(excelUnits).toEqual("N/A")
                expect(headline.offSiteHedgerowNetChangeWithSRM).toEqual("N/A")
            } else {
                if (typeof headline.offSiteHedgerowNetChangeWithSRM !== "number") return;
                expectCloseTo(headline.offSiteHedgerowNetChangeWithSRM, excelUnits, 0.01, "Off-site Hedgerow Net Change with SRM Units");
            }
        });

        test("calculates off-site watercourse net change with SRM", () => {
            const excelUnits = getCellValue(headlineSheet, 33, 7); // H34

            if (headline.offSiteWatercourseNetChange.units <= 0) {
                expect(excelUnits).toEqual("N/A")
                expect(headline.offSiteWatercourseNetChangeWithSRM).toEqual("N/A")
            } else {
                if (typeof headline.offSiteWatercourseNetChangeWithSRM !== "number") return;
                expectCloseTo(headline.offSiteWatercourseNetChangeWithSRM, excelUnits, 0.01, "Off-site Watercourse Net Change with SRM Units");
            }
        });

        test("calculates combined net unit change", () => {
            const excelHabitat = getCellValue(headlineSheet, 36, 7); // H37
            const excelHedgerow = getCellValue(headlineSheet, 37, 7); // H38
            const excelWatercourse = getCellValue(headlineSheet, 38, 7); // H39

            expectCloseTo(headline.combinedNetUnitChange.habitat, excelHabitat, 0.01, "Combined Net Unit Change - Habitat");
            expectCloseTo(headline.combinedNetUnitChange.hedgerow, excelHedgerow, 0.01, "Combined Net Unit Change - Hedgerow");
            expectCloseTo(headline.combinedNetUnitChange.watercourse, excelWatercourse, 0.01, "Combined Net Unit Change - Watercourse");
        });

        test("calculates total SRM deductions", () => {
            const excelHabitat = parseFloat(getCellValue(headlineSheet, 40, 7)); // H41
            const excelHedgerow = parseFloat(getCellValue(headlineSheet, 41, 7)); // H42
            const excelWatercourse = parseFloat(getCellValue(headlineSheet, 42, 7)); // H43

            expectCloseTo(headline.totalSRMDeductions.habitat, excelHabitat, 0.01, "Total SRM Deductions - Habitat");
            expectCloseTo(headline.totalSRMDeductions.hedgerow, excelHedgerow, 0.01, "Total SRM Deductions - Hedgerow");
            expectCloseTo(headline.totalSRMDeductions.watercourse, excelWatercourse, 0.01, "Total SRM Deductions - Watercourse");
        });

        test("calculates final total net unit change", () => {
            const habitatValue = getCellValue(headlineSheet, 46, 7); // H47
            const hedgerowValue = getCellValue(headlineSheet, 47, 7); // H48
            const watercourseValue = getCellValue(headlineSheet, 48, 7); // H49

            expectCloseTo(headline.totalNetUnitChange.habitat, habitatValue, 0.01, "Total Net Unit Change - Habitat");
            expectCloseTo(headline.totalNetUnitChange.hedgerow, hedgerowValue, 0.01, "Total Net Unit Change - Hedgerow");
            expectCloseTo(headline.totalNetUnitChange.watercourse, watercourseValue, 0.01, "Total Net Unit Change - Watercourse");
        });

        test("calculates final total net percentage change", () => {
            const habitatValue = getCellValue(headlineSheet, 50, 7); // H51
            const hedgerowValue = getCellValue(headlineSheet, 51, 7); // H52
            const watercourseValue = getCellValue(headlineSheet, 52, 7); // H53

            expectCloseTo(headline.totalNetPercentageChange.habitat, habitatValue, 0.01, "Total Net Percentage Change - Habitat");
            expectCloseTo(headline.totalNetPercentageChange.hedgerow, hedgerowValue, 0.01, "Total Net Percentage Change - Hedgerow");
            expectCloseTo(headline.totalNetPercentageChange.watercourse, watercourseValue, 0.01, "Total Net Percentage Change - Watercourse");
        });

        test("calculates trading rules satisfied", () => {
            const excelValue = getCellValue(headlineSheet, 54, 5) // F55
            const booleanExcelValue = excelValue.trim() === "No - Check Trading Summaries ▲" ? false : true;
            expect(headline.tradingRulesSatisfied).toEqual(booleanExcelValue);
        })

        test("calculates unit deficit", () => {
            const habitatValue = getCellValue(headlineSheet, 60, 7) // H61
            const hedgerowValue = getCellValue(headlineSheet, 61, 7) // H62
            const watercourseValue = getCellValue(headlineSheet, 62, 7) // H63

            expectCloseTo(headline.habitatUnitSummary.unitDeficit, habitatValue, 0.01, "Unit Deficit - Habitat");
            expectCloseTo(headline.hedgerowUnitSummary.unitDeficit, hedgerowValue, 0.01, "Unit Deficit - Hedgerow");
            expectCloseTo(headline.watercourseUnitSummary.unitDeficit, watercourseValue, 0.01, "Unit Deficit - Watercourse");
        })
    });

    describe("Unit Shortfall", () => {
        const unitShortfallSheet = getSheet(workbook, 'Unit shortfall calculations')!;

        test("detects very high distinctiveness losses (guard clause)", () => {
            const excelGuardCell = getCellValue(unitShortfallSheet, 15, 4); // E16
            const excelHasVeryHighLosses = typeof excelGuardCell === 'string' && excelGuardCell.includes('ERROR');

            expect(shortfall.hasVeryHighLosses).toBe(excelHasVeryHighLosses);
        });

        test("calculates A5 (V.High) tier shortfall", () => {
            const excelShortfall = getCellValue(unitShortfallSheet, 12, 5); // F13
            const excelSrmShortfall = getCellValue(unitShortfallSheet, 12, 6); // G13

            expectCloseTo(shortfall.tierShortfalls.habitats.a5.shortfall, excelShortfall, 0.01, "A5 Tier Shortfall");
            expectCloseTo(shortfall.tierShortfalls.habitats.a5.srmShortfall, excelSrmShortfall, 0.01, "A5 Tier SRM Shortfall");
        });

        test("calculates A4 (High) tier shortfall", () => {
            const excelShortfall = getCellValue(unitShortfallSheet, 11, 5); // F12
            const excelSrmShortfall = getCellValue(unitShortfallSheet, 11, 6); // G12

            expectCloseTo(shortfall.tierShortfalls.habitats.a4.shortfall, excelShortfall, 0.01, "A4 Tier Shortfall");
            expectCloseTo(shortfall.tierShortfalls.habitats.a4.srmShortfall, excelSrmShortfall, 0.01, "A4 Tier SRM Shortfall");
        });

        test("calculates A3 (Medium) tier shortfall", () => {
            const excelShortfall = getCellValue(unitShortfallSheet, 10, 5); // F11
            const excelSrmShortfall = getCellValue(unitShortfallSheet, 10, 6); // G11

            expectCloseTo(shortfall.tierShortfalls.habitats.a3.shortfall, excelShortfall, 0.01, "A3 Tier Shortfall");
            expectCloseTo(shortfall.tierShortfalls.habitats.a3.srmShortfall, excelSrmShortfall, 0.01, "A3 Tier SRM Shortfall");
        });

        test("calculates A2 (Low) tier shortfall", () => {
            const excelShortfall = getCellValue(unitShortfallSheet, 9, 5); // F10
            const excelSrmShortfall = getCellValue(unitShortfallSheet, 9, 6); // G10

            expectCloseTo(shortfall.tierShortfalls.habitats.a2.shortfall, excelShortfall, 0.01, "A2 Tier Shortfall");
            expectCloseTo(shortfall.tierShortfalls.habitats.a2.srmShortfall, excelSrmShortfall, 0.01, "A2 Tier SRM Shortfall");
        });

        test("calculates A1 (V.Low) tier shortfall with balancing logic", () => {
            const excelShortfall = getCellValue(unitShortfallSheet, 8, 5); // F9
            const excelSrmShortfall = getCellValue(unitShortfallSheet, 8, 6); // G9

            expectCloseTo(shortfall.tierShortfalls.habitats.a1.shortfall, excelShortfall, 0.01, "A1 Tier Shortfall");
            expectCloseTo(shortfall.tierShortfalls.habitats.a1.srmShortfall, excelSrmShortfall, 0.01, "A1 Tier SRM Shortfall");
        });

        test("calculates hedgerow feature shortfall", () => {
            const excelShortfall = getCellValue(unitShortfallSheet, 13, 5); // F14
            const excelSrmShortfall = getCellValue(unitShortfallSheet, 13, 6); // G14

            expectCloseTo(shortfall.tierShortfalls.hedgerows.shortfall, excelShortfall, 0.01, "Hedgerow Shortfall");
            expectCloseTo(shortfall.tierShortfalls.hedgerows.srmShortfall, excelSrmShortfall, 0.01, "Hedgerow SRM Shortfall");
        });

        test("calculates watercourse feature shortfall", () => {
            const excelShortfall = getCellValue(unitShortfallSheet, 14, 5); // F15
            const excelSrmShortfall = getCellValue(unitShortfallSheet, 14, 6); // G15

            expectCloseTo(shortfall.tierShortfalls.watercourses.shortfall, excelShortfall, 0.01, "Watercourse Shortfall");
            expectCloseTo(shortfall.tierShortfalls.watercourses.srmShortfall, excelSrmShortfall, 0.01, "Watercourse SRM Shortfall");
        });
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
                // Calculated column indices (0-indexed) — input columns come from src/parsers/columnMappings.ts; output columns below are derived empirically from observed sheets:
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
                // Calculated column indices (0-indexed) — input columns come from src/parsers/columnMappings.ts; output columns below are derived empirically from observed sheets:
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
                // Calculated column indices (0-indexed) — input columns come from src/parsers/columnMappings.ts; output columns below are derived empirically from observed sheets:
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
                // Calculated column indices (0-indexed) — input columns come from src/parsers/columnMappings.ts; output columns below are derived empirically from observed sheets:
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

    describe("C-1 On-Site Watercourse Baseline", () => {
        const sheet = getSheet(workbook, "C-1 On-Site WaterC' Baseline")!;
        // E (4) = length input
        const dataRows = findAllDataRows(sheet, 4, 9);

        if (dataRows.length === 0) {
            test.skip("no on-site watercourse baseline data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOnSiteWatercourseBaselineRow(sheet, dataRow);
                const result = v.safeParse(onSiteWatercourseBaselineSchema, inputData);
                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, v.flatten(result.issues));
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }
                const parsed = result.output;

                // G(6) distinct score, I(8) condition score, L(11) strategic mult,
                // R(17) total units (incl encroachment), W(22) units retained,
                // X(23) units enhanced, Y(24) length lost, Z(25) units lost
                const checks: Array<[number, keyof typeof parsed | string, any, string]> = [
                    [6, 'distinctivenessScore', parsed.distinctivenessScore, "Distinctiveness Score"],
                    [8, 'conditionScore', parsed.conditionScore, "Condition Score"],
                    [11, 'strategicSignificanceMultiplier', parsed.strategicSignificanceMultiplier, "Strategic Multiplier"],
                    [17, 'totalWatercourseUnits', parsed.totalWatercourseUnits, "Total Watercourse Units"],
                    [22, 'unitsRetained', parsed.unitsRetained, "Units Retained"],
                    [23, 'unitsEnhanced', parsed.unitsEnhanced, "Units Enhanced"],
                    [24, 'lengthLost', parsed.lengthLost, "Length Lost"],
                    [25, 'unitsLost', parsed.unitsLost, "Units Lost"],
                ];

                try {
                    for (const [col, , value, label] of checks) {
                        const excel = getCellValue(sheet, dataRow, col);
                        if (excel !== null && typeof excel === "number" && typeof value === "number") {
                            expectCloseTo(value, excel, 0.0001, label);
                        }
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    for (const [col, , value, label] of checks) {
                        console.error(`  ${label}: excel=${getCellValue(sheet, dataRow, col)} parsed=${value}`);
                    }
                    throw error;
                }
            });
        });
    });

    describe("C-2 On-Site Watercourse Creation", () => {
        const sheet = getSheet(workbook, "C-2 On-Site WaterC' Creation")!;
        // D (3) = length input
        const dataRows = findAllDataRows(sheet, 3, 11);

        if (dataRows.length === 0) {
            test.skip("no on-site watercourse creation data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOnSiteWatercourseCreationRow(sheet, dataRow);
                const result = v.safeParse(onSiteWatercourseCreationSchema, inputData);
                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, v.flatten(result.issues));
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }
                const parsed = result.output;

                // F(5) distinctiveness, H(7) condition score, K(10) strategic mult,
                // L(11) std TTT, P(15) final TTT, Q(16) temporal mult,
                // U(20) difficulty mult, W(22) watercourse encroachment mult,
                // Y(24) riparian encroachment mult, Z(25) units delivered
                const checks: Array<[number, any, string]> = [
                    [5, parsed.distinctivenessScore, "Distinctiveness Score"],
                    [7, parsed.conditionScore, "Condition Score"],
                    [10, parsed.strategicSignificanceMultiplier, "Strategic Multiplier"],
                    [11, parsed.standardTimeToTarget, "Standard Time to Target"],
                    [15, parsed.finalTimeToTarget, "Final Time to Target"],
                    [16, parsed.temporalMultiplier, "Temporal Multiplier"],
                    [20, parsed.difficultyMultiplier, "Difficulty Multiplier"],
                    [22, parsed.watercourseEncroachmentMultiplier, "Watercourse Encroachment Multiplier"],
                    [24, parsed.riparianEncroachmentMultiplier, "Riparian Encroachment Multiplier"],
                    [25, parsed.unitsDelivered, "Units Delivered"],
                ];

                try {
                    for (const [col, value, label] of checks) {
                        const excel = getCellValue(sheet, dataRow, col);
                        if (excel !== null && typeof excel === "number" && typeof value === "number") {
                            expectCloseTo(value, excel, 0.0001, label);
                        }
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    for (const [col, value, label] of checks) {
                        console.error(`  ${label}: excel=${getCellValue(sheet, dataRow, col)} parsed=${value}`);
                    }
                    throw error;
                }
            });
        });
    });

    describe("C-3 On-Site Watercourse Enhancement", () => {
        const sheet = getSheet(workbook, "C-3 On-Site WaterC' Enhancement")!;
        const baselineSheet = getSheet(workbook, "C-1 On-Site WaterC' Baseline")!;
        // B (1) = baseline ref (auto-populated VLOOKUP); use it for row detection
        const dataRows = findAllDataRows(sheet, 1, 11);

        if (dataRows.length === 0) {
            test.skip("no on-site watercourse enhancement data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOnSiteWatercourseEnhancementRow(baselineSheet, sheet, dataRow);
                const result = v.safeParse(onSiteWatercourseEnhancementSchema, inputData);
                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, v.flatten(result.issues));
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }
                const parsed = result.output;

                // S(18) proposed distinct score, U(20) proposed condition score,
                // X(23) strategic sig mult, Y(24) std TTT, AC(28) final TTT,
                // AD(29) temporal mult, AH(33) difficulty mult applied,
                // AJ(35) single-bank riparian mult, AL(37) both-banks mult,
                // AM(38) final watercourse units delivered.
                // Schema's `watercourseEncroachmentMultiplier` is the mult of the
                // `watercourseEncroachment` input (column AI single-bank); the
                // `riparianEncroachmentMultiplier` is mult of `riparianEncroachment`
                // (column AK both-banks). Naming is historical.
                const checks: Array<[number, any, string]> = [
                    [18, parsed.distinctivenessScore, "Proposed Distinctiveness Score"],
                    [20, parsed.conditionScore, "Proposed Condition Score"],
                    [23, parsed.strategicSignificanceMultiplier, "Strategic Significance Multiplier"],
                    [28, parsed.finalTimeToTargetCondition, "Final Time to Target Condition"],
                    [29, parsed.temporalMultiplier, "Temporal Multiplier"],
                    [33, parsed.difficultyMultiplierApplied, "Difficulty Multiplier Applied"],
                    [35, parsed.watercourseEncroachmentMultiplier, "Single-Bank Encroachment Multiplier"],
                    [37, parsed.riparianEncroachmentMultiplier, "Both-Banks Encroachment Multiplier"],
                    [38, parsed.watercourseUnitsDelivered, "Watercourse Units Delivered"],
                ];

                try {
                    for (const [col, value, label] of checks) {
                        const excel = getCellValue(sheet, dataRow, col);
                        if (excel !== null && typeof excel === "number" && typeof value === "number") {
                            expectCloseTo(value, excel, 0.0001, label);
                        }
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    for (const [col, value, label] of checks) {
                        console.error(`  ${label}: excel=${getCellValue(sheet, dataRow, col)} parsed=${value}`);
                    }
                    throw error;
                }
            });
        });
    });

    describe("F-1 Off-Site Watercourse Baseline", () => {
        const sheet = getSheet(workbook, "F-1 Off-Site WaterC' Baseline")!;
        const dataRows = findAllDataRows(sheet, 4, 9);

        if (dataRows.length === 0) {
            test.skip("no off-site watercourse baseline data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOffSiteWatercourseBaselineRow(sheet, dataRow);
                const result = v.safeParse(offSiteWatercourseBaselineSchema, inputData);
                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, v.flatten(result.issues));
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }
                const parsed = result.output;

                // G(6) distinct score, I(8) condition score, L(11) strategic mult,
                // R(17) total with SRM, T(19) spatial risk mult, U(20) total without SRM,
                // Z(25) unitsRetained, AA(26) unitsEnhanced, AB(27) lengthLost, AC(28) unitsLost
                const checks: Array<[number, any, string]> = [
                    [6, parsed.distinctivenessScore, "Distinctiveness Score"],
                    [8, parsed.conditionScore, "Condition Score"],
                    [11, parsed.strategicSignificanceMultiplier, "Strategic Multiplier"],
                    [17, parsed.totalWatercourseUnitsSRM, "Total Watercourse Units (SRM)"],
                    [19, parsed.spatialRiskMultiplier, "Spatial Risk Multiplier"],
                    [20, parsed.totalWatercourseUnits, "Total Watercourse Units"],
                    [25, parsed.unitsRetained, "Units Retained"],
                    [26, parsed.unitsEnhanced, "Units Enhanced"],
                    [27, parsed.lengthLost, "Length Lost"],
                    [28, parsed.unitsLost, "Units Lost"],
                ];

                try {
                    for (const [col, value, label] of checks) {
                        const excel = getCellValue(sheet, dataRow, col);
                        if (excel !== null && typeof excel === "number" && typeof value === "number") {
                            expectCloseTo(value, excel, 0.0001, label);
                        }
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    for (const [col, value, label] of checks) {
                        console.error(`  ${label}: excel=${getCellValue(sheet, dataRow, col)} parsed=${value}`);
                    }
                    throw error;
                }
            });
        });
    });

    describe("F-2 Off-Site Watercourse Creation", () => {
        const sheet = getSheet(workbook, "F-2 Off-Site WaterC' Creation")!;
        const dataRows = findAllDataRows(sheet, 3, 11);

        if (dataRows.length === 0) {
            test.skip("no off-site watercourse creation data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOffSiteWatercourseCreationRow(sheet, dataRow);
                const result = v.safeParse(offSiteWatercourseCreationSchema, inputData);
                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, v.flatten(result.issues));
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }
                const parsed = result.output;

                // F(5) distinctiveness, H(7) condition score, K(10) strategic mult,
                // L(11) std TTT, P(15) final TTT, Q(16) temporal mult,
                // U(20) difficulty mult, W(22) watercourse encroachment mult,
                // Y(24) riparian encroachment mult, Z(25) units delivered (without SRM)
                const checks: Array<[number, any, string]> = [
                    [5, parsed.distinctivenessScore, "Distinctiveness Score"],
                    [7, parsed.conditionScore, "Condition Score"],
                    [10, parsed.strategicSignificanceMultiplier, "Strategic Multiplier"],
                    [11, parsed.standardTimeToTarget, "Standard Time to Target"],
                    [15, parsed.finalTimeToTarget, "Final Time to Target"],
                    [16, parsed.temporalMultiplier, "Temporal Multiplier"],
                    [20, parsed.difficultyMultiplier, "Difficulty Multiplier"],
                    [22, parsed.watercourseEncroachmentMultiplier, "Watercourse Encroachment Multiplier"],
                    [24, parsed.riparianEncroachmentMultiplier, "Riparian Encroachment Multiplier"],
                    [25, parsed.unitsDelivered, "Net Unit Change"],
                ];

                try {
                    for (const [col, value, label] of checks) {
                        const excel = getCellValue(sheet, dataRow, col);
                        if (excel !== null && typeof excel === "number" && typeof value === "number") {
                            expectCloseTo(value, excel, 0.0001, label);
                        }
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    for (const [col, value, label] of checks) {
                        console.error(`  ${label}: excel=${getCellValue(sheet, dataRow, col)} parsed=${value}`);
                    }
                    throw error;
                }
            });
        });
    });

    describe("F-3 Off-Site Watercourse Enhancement", () => {
        const sheet = getSheet(workbook, 'F-3 Off-Site WaterC Enhancement')!;
        const baselineSheet = getSheet(workbook, "F-1 Off-Site WaterC' Baseline")!;
        const dataRows = findAllDataRows(sheet, 1, 11);

        if (dataRows.length === 0) {
            test.skip("no off-site watercourse enhancement data in test file", () => { });
            return;
        }

        dataRows.forEach((dataRow) => {
            test(`row ${dataRow + 1} matches pipeline calculations`, () => {
                const inputData = parseOffSiteWatercourseEnhancementRow(baselineSheet, sheet, dataRow);
                const result = v.safeParse(offSiteWatercourseEnhancementSchema, inputData);
                if (!result.success) {
                    console.error(`Row ${dataRow + 1} - Input data:`, inputData);
                    console.error(`Row ${dataRow + 1} - Validation errors:`, v.flatten(result.issues));
                    throw new Error(`Pipeline validation failed for row ${dataRow + 1}`);
                }
                const parsed = result.output;

                // S(18) proposed distinct score, U(20) proposed condition score,
                // X(23) strategic mult, AC(28) final TTT, AD(29) temporal mult,
                // AH(33) difficulty mult applied, AJ(35) riparian mult,
                // AL(37) both-banks mult, AN(39) spatial risk mult,
                // AO(40) units delivered with SRM, AP(41) units delivered without SRM
                const checks: Array<[number, any, string]> = [
                    [18, parsed.distinctivenessScore, "Proposed Distinctiveness Score"],
                    [20, parsed.conditionScore, "Proposed Condition Score"],
                    [23, parsed.strategicSignificanceMultiplier, "Strategic Significance Multiplier"],
                    [28, parsed.finalTimeToTargetCondition, "Final Time to Target Condition"],
                    [29, parsed.temporalMultiplier, "Temporal Multiplier"],
                    [33, parsed.difficultyMultiplierApplied, "Difficulty Multiplier Applied"],
                    [35, parsed.watercourseEncroachmentMultiplier, "Single-Bank Encroachment Multiplier"],
                    [37, parsed.riparianEncroachmentMultiplier, "Both-Banks Encroachment Multiplier"],
                    [39, parsed.spatialRiskMultiplier, "Spatial Risk Multiplier"],
                    [40, parsed.watercourseUnitsDeliveredWithSpatialRisk, "Watercourse Units Delivered With Spatial Risk"],
                    [41, parsed.watercourseUnitsDelivered, "Watercourse Units Delivered"],
                ];

                try {
                    for (const [col, value, label] of checks) {
                        const excel = getCellValue(sheet, dataRow, col);
                        if (excel !== null && typeof excel === "number" && typeof value === "number") {
                            expectCloseTo(value, excel, 0.0001, label);
                        }
                    }
                } catch (error) {
                    console.error(`\nRow ${dataRow + 1} - FAILED`);
                    console.error("Input data:", inputData);
                    for (const [col, value, label] of checks) {
                        console.error(`  ${label}: excel=${getCellValue(sheet, dataRow, col)} parsed=${value}`);
                    }
                    throw error;
                }
            });
        });
    });
})

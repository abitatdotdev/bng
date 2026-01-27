import { read, readFile, type ParsingOptions, type Sheet, type WorkBook, type WorkSheet } from "xlsx";
import * as v from 'valibot';
import {
    parseOnSiteHabitatBaselineRow,
    parseOnSiteHabitatCreationRow,
    parseOnSiteHabitatEnhancementRow,
    parseOffSiteHabitatBaselineRow,
    parseOffSiteHabitatCreationRow,
    parseOffSiteHabitatEnhancementRow,
    parseOnSiteHedgerowBaselineRow,
    parseOnSiteHedgerowCreationRow,
    parseOnSiteHedgerowEnhancementRow,
    parseOffSiteHedgerowBaselineRow,
    parseOffSiteHedgerowEnhancementRow,
    parseOffSiteHedgerowCreationRow,
    parseOnSiteWatercourseBaselineRow,
    parseOnSiteWatercourseCreationRow,
    parseOnSiteWatercourseEnhancementRow,
    parseOffSiteWatercourseBaselineRow,
    parseOffSiteWatercourseCreationRow,
    parseOffSiteWatercourseEnhancementRow
} from './rowParsers';
import { getCellValue, getSheet, MAX_DATA_ROWS } from "./excelHelpers";
import { onSiteHabitatBaselineSchema } from "../onSite/habitatBaseline";
import { onSiteHabitatCreationSchema } from "../onSite/habitatCreation";
import { offSiteHabitatBaselineSchema } from "../offSite/habitatBaseline";
import { offSiteHabitatCreationSchema } from "../offSite/habitatCreation";
import { onSiteHedgerowBaselineSchema } from "../onSite/hedgerowBaseline";
import { onSiteHedgerowCreationSchema } from "../onSite/hedgerowCreation";
import { onSiteHedgerowEnhancementSchema } from "../onSite/hedgerowEnhancement";
import { offSiteHedgerowBaselineSchema } from "../offSite/hedgerowBaseline";
import { offSiteHedgerowCreationSchema } from "../offSite/hedgerowCreation";
import { offSiteHedgerowEnhancementSchema } from "../offSite/hedgerowEnhancement";
import { headlineResults, type HeadlineResults } from "../headlineResults";
import { type AllFeatures } from '../features';
import { onSiteHabitatEnhancementSchema } from "../onSite/habitatEnhancement";
import { offSiteHabitatEnhancementSchema } from "../offSite/habitatEnhancement";
import { onSiteWatercourseBaselineSchema } from "../onSite/watercourseBaseline";
import { onSiteWatercourseCreationSchema } from "../onSite/watercourseCreation";
import { onSiteWatercourseEnhancementSchema } from "../onSite/watercourseEnhancement";
import { offSiteWatercourseBaselineSchema } from "../offSite/watercourseBaseline";
import { offSiteWatercourseCreationSchema } from "../offSite/watercourseCreation";
import { offSiteWatercourseEnhancementSchema } from "../offSite/watercourseEnhancement";


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

const options: ParsingOptions = {
    cellFormula: false,
    cellHTML: false,
    sheetRows: MAX_DATA_ROWS,
    sheets: sheetsToGrab,
}

/**
 * Parse a statutory metric file and get the underlying workbook object
 *
 * ```ts
// for local files
const workbook =  parseFile("MY_BNG_METRIC.xlsm");
// for in-memory files, like those in a website input field
const workbook = parseFile(await file.arrayBuffer());
```
 * Throws an error when the metric version is unsupported.
 */
export function parseWorkbook(file: string | ArrayBuffer) {
    let workbook: WorkBook;


    if (typeof file === "string") {
        workbook = readFile(file, options);
    } else {
        workbook = read(file, options);
    }

    const versionSheet = getSheet(workbook, "Version History");
    if (!versionSheet) {
        throw new Error("Not a valid version to compare against");
    }

    return workbook
}

interface ParsedMetric {
    parsedRows: AllFeatures,
    headlineResults: HeadlineResults,
}

/**
 * Parse a statutory metric file and to get all rows and calculated results
 *
 * ```ts
// for local files
const localResults =  parseFile("MY_BNG_METRIC.xlsm");
// for in-memory files, like those in a website input field
const results = parseFile(await file.arrayBuffer());
```
 * Throws an error when the metric version is unsupported.
 */
export function parseFile(file: string | ArrayBuffer): ParsedMetric {
    const workbook = parseWorkbook(file);

    // Parse all input sheets using shared parsers
    // Using exact column indices and start rows from working comparison tests
    const onSiteHabitatBaselines = parseAllRows(
        workbook,
        'A-1 On-Site Habitat Baseline',
        onSiteHabitatBaselineSchema,
        4, // E column (broad habitat)
        parseOnSiteHabitatBaselineRow
        // Uses default startRow (10)
    );

    const onSiteHabitatCreations = parseAllRows(
        workbook,
        'A-2 On-Site Habitat Creation',
        onSiteHabitatCreationSchema,
        24, // Y column (habitat units delivered)
        parseOnSiteHabitatCreationRow
        // Uses default startRow (10)
    );

    const onSiteHabitatEnhancements = parseAllEnhancementRows(
        workbook,
        'A-1 On-Site Habitat Baseline',
        'A-3 On-Site Habitat Enhancement',
        onSiteHabitatEnhancementSchema,
        4, // E column (baseline habitat ref)
        parseOnSiteHabitatEnhancementRow,
        11 // start on row 12
    );

    const offSiteHabitatBaselines = parseAllRows(
        workbook,
        'D-1 Off-Site Habitat Baseline',
        offSiteHabitatBaselineSchema,
        4, // E column
        parseOffSiteHabitatBaselineRow
        // Uses default startRow (10)
    );

    const offSiteHabitatCreations = parseAllRows(
        workbook,
        'D-2 Off-Site Habitat Creation',
        offSiteHabitatCreationSchema,
        3, // D column (from offSiteHabitatComparison.test.ts)
        parseOffSiteHabitatCreationRow
        // Uses default startRow (10)
    );

    const offSiteHabitatEnhancements = parseAllEnhancementRows(
        workbook,
        'D-1 Off-Site Habitat Baseline',
        'D-3 Off-Site Habitat Enhancment',
        offSiteHabitatEnhancementSchema,
        4, // E column
        parseOffSiteHabitatEnhancementRow,
        11 // starts on row 12
    );


    const onSiteHedgerowBaselines = parseAllRows(
        workbook,
        'B-1 On-Site Hedge Baseline',
        onSiteHedgerowBaselineSchema,
        3, // D column (hedgerow type)
        parseOnSiteHedgerowBaselineRow,
        9 // Start at row 10 (array index 9)
    );

    const onSiteHedgerowCreations = parseAllRows(
        workbook,
        'B-2 On-Site Hedge Creation',
        onSiteHedgerowCreationSchema,
        3, // D column (hedgerow type)
        parseOnSiteHedgerowCreationRow,
        11 // Start at row 12 (array index 11)
    );

    const onSiteHedgerowEnhancements = parseAllEnhancementRows(
        workbook,
        'B-1 On-Site Hedge Baseline',
        'B-3 On-Site Hedge Enhancement',
        onSiteHedgerowEnhancementSchema,
        1, // B column (baseline ref)
        parseOnSiteHedgerowEnhancementRow,
        11 // Start at row 12 (array index 11)
    );

    const offSiteHedgerowBaselines = parseAllRows(
        workbook,
        'E-1 Off-Site Hedge Baseline',
        offSiteHedgerowBaselineSchema,
        3, // D column (hedgerow type)
        parseOffSiteHedgerowBaselineRow,
        9 // Start at row 10 (array index 9)
    );

    const offSiteHedgerowCreations = parseAllRows(
        workbook,
        'E-2 Off-Site Hedge Creation',
        offSiteHedgerowCreationSchema,
        3, // D column (hedgerow type)
        parseOffSiteHedgerowCreationRow,
        11 // Start at row 12 (array index 11)
    );

    const offSiteHedgerowEnhancements = parseAllEnhancementRows(
        workbook,
        'E-1 Off-Site Hedge Baseline',
        'E-3 Off-Site Hedge Enhancement',
        offSiteHedgerowEnhancementSchema,
        1, // B column (baseline ref)
        parseOffSiteHedgerowEnhancementRow,
        11 // Start at row 12 (array index 11)
    );

    const onSiteWatercourseBaselines = parseAllRows(
        workbook,
        "C-1 On-Site WaterC' Baseline",
        onSiteWatercourseBaselineSchema,
        4, // E column
        parseOnSiteWatercourseBaselineRow,
        9 // start at row 10
    );

    const onSiteWatercourseCreations = parseAllRows(
        workbook,
        "C-2 On-Site WaterC' Creation",
        onSiteWatercourseCreationSchema,
        2, // C column
        parseOnSiteWatercourseCreationRow,
        11 // start at row 12
    );

    const onSiteWatercourseEnhancements = parseAllEnhancementRows(
        workbook,
        "C-1 On-Site WaterC' Baseline",
        "C-3 On-Site WaterC' Enhancement",
        onSiteWatercourseEnhancementSchema,
        13, // N column
        parseOnSiteWatercourseEnhancementRow,
        11 // start at row 12
    );

    const offSiteWatercourseBaselines = parseAllRows(
        workbook,
        "F-1 Off-Site WaterC' Baseline",
        offSiteWatercourseBaselineSchema,
        4, // E column
        parseOffSiteWatercourseBaselineRow,
        9 // start at row 10
    );

    const offSiteWatercourseCreations = parseAllRows(
        workbook,
        "F-2 Off-Site WaterC' Creation",
        offSiteWatercourseCreationSchema,
        2, // C column
        parseOffSiteWatercourseCreationRow,
        11 // start at row 12
    );

    const offSiteWatercourseEnhancements = parseAllEnhancementRows(
        workbook,
        'F-1 Off-Site WaterC Baseline',
        'F-3 Off-Site WaterC Enhancement',
        offSiteWatercourseEnhancementSchema,
        41, // AP column
        parseOffSiteWatercourseEnhancementRow,
        11 // start at row 12
    );

    // Create the input object
    const parsedRows: AllFeatures = {
        onSiteHabitatBaselines,
        onSiteHabitatCreations,
        onSiteHabitatEnhancements,
        offSiteHabitatBaselines,
        offSiteHabitatCreations,
        offSiteHabitatEnhancements,
        onSiteHedgerowBaselines,
        onSiteHedgerowCreations,
        onSiteHedgerowEnhancements,
        offSiteHedgerowBaselines,
        offSiteHedgerowCreations,
        offSiteHedgerowEnhancements,
        onSiteWatercourseBaselines,
        onSiteWatercourseCreations,
        onSiteWatercourseEnhancements,
        offSiteWatercourseBaselines,
        offSiteWatercourseCreations,
        offSiteWatercourseEnhancements,
    };

    const calculatedHeadlineResults = headlineResults(parsedRows);


    return {
        parsedRows,
        headlineResults: calculatedHeadlineResults,
    }
}
export default parseFile;

// Helper function to parse all rows from a sheet
function parseAllRows<Schema extends v.BaseSchema<any, any, any>, Input extends v.InferInput<Schema>, Output extends v.InferOutput<Schema>>(
    workbook: WorkBook,
    sheetName: string,
    schema: Schema,
    columnToCheck: number,
    parseRow: (sheet: Sheet, row: number) => Input,
    startRow: number = 10 // Most sheets have data starting at row 11 (0-indexed row 10)
): Output[] {
    const sheet = getSheet(workbook, sheetName)!;

    const dataRows = findAllDataRows(sheet, columnToCheck, startRow);
    const results: Output[] = [];

    for (const row of dataRows) {
        const inputData = parseRow(sheet, row);
        const result = v.safeParse(schema, inputData);

        if (result.success) {
            results.push(result.output);
        } else {
            console.error(`Error: parsing ${sheetName} row ${row}`, v.flatten(result.issues));
            throw new Error(`Error: parsing ${sheetName} row ${row}`);
        }
    }

    return results;
}

function parseAllEnhancementRows<Schema extends v.BaseSchema<any, any, any>, Input extends v.InferInput<Schema>, Output extends v.InferOutput<Schema>>(
    workbook: WorkBook,
    baselineSheetName: string,
    sheetName: string,
    schema: Schema,
    columnToCheck: number,
    parseRow: (baselineSheet: Sheet, sheet: Sheet, row: number) => Input,
    startRow: number = 10 // Most sheets have data starting at row 11 (0-indexed row 10)
): Output[] {
    const sheet = getSheet(workbook, sheetName)!;
    const baselineSheet = getSheet(workbook, baselineSheetName)!;

    const dataRows = findAllDataRows(sheet, columnToCheck, startRow);
    const results: Output[] = [];

    for (const row of dataRows) {
        const inputData = parseRow(baselineSheet, sheet, row);
        const result = v.safeParse(schema, inputData);

        if (result.success) {
            results.push(result.output);
        } else {
            console.error(`Error: parsing ${sheetName} row ${row}`, v.flatten(result.issues));
            throw new Error(`Error: parsing ${sheetName} row ${row}`);
        }
    }

    return results;
}

const dataValueSchema = v.union([
    v.pipe(v.string(), v.trim(), v.minLength(1)),
    v.pipe(v.number()),
])

/**
 * Find all data rows in a sheet
 */
export function findAllDataRows(sheet: WorkSheet, columnToCheckPresence: number, startRow: number = 10, maxRows: number = MAX_DATA_ROWS): number[] {
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

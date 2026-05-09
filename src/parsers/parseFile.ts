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
import { onSiteHabitatBaselineSchema, onSiteHabitatBaselineUncheckedSchema } from "../onSite/habitatBaseline";
import { onSiteHabitatCreationSchema, onSiteHabitatCreationUncheckedSchema } from "../onSite/habitatCreation";
import { offSiteHabitatBaselineSchema, offSiteHabitatBaselineUncheckedSchema } from "../offSite/habitatBaseline";
import { offSiteHabitatCreationSchema, offSiteHabitatCreationUncheckedSchema } from "../offSite/habitatCreation";
import { onSiteHedgerowBaselineSchema, onSiteHedgerowBaselineUncheckedSchema } from "../onSite/hedgerowBaseline";
import { onSiteHedgerowCreationSchema, onSiteHedgerowCreationUncheckedSchema } from "../onSite/hedgerowCreation";
import { onSiteHedgerowEnhancementSchema, onSiteHedgerowEnhancementUncheckedSchema } from "../onSite/hedgerowEnhancement";
import { offSiteHedgerowBaselineSchema, offSiteHedgerowBaselineUncheckedSchema } from "../offSite/hedgerowBaseline";
import { offSiteHedgerowCreationSchema, offSiteHedgerowCreationUncheckedSchema } from "../offSite/hedgerowCreation";
import { offSiteHedgerowEnhancementSchema, offSiteHedgerowEnhancementUncheckedSchema } from "../offSite/hedgerowEnhancement";
import { type AllFeatures } from '../features';
import { onSiteHabitatEnhancementSchema, onSiteHabitatEnhancementUncheckedSchema } from "../onSite/habitatEnhancement";
import { offSiteHabitatEnhancementSchema, offSiteHabitatEnhancementUncheckedSchema } from "../offSite/habitatEnhancement";
import { onSiteWatercourseBaselineSchema, onSiteWatercourseBaselineUncheckedSchema } from "../onSite/watercourseBaseline";
import { onSiteWatercourseCreationSchema, onSiteWatercourseCreationUncheckedSchema } from "../onSite/watercourseCreation";
import { onSiteWatercourseEnhancementSchema, onSiteWatercourseEnhancementUncheckedSchema } from "../onSite/watercourseEnhancement";
import { offSiteWatercourseBaselineSchema, offSiteWatercourseBaselineUncheckedSchema } from "../offSite/watercourseBaseline";
import { offSiteWatercourseCreationSchema, offSiteWatercourseCreationUncheckedSchema } from "../offSite/watercourseCreation";
import { offSiteWatercourseEnhancementSchema, offSiteWatercourseEnhancementUncheckedSchema } from "../offSite/watercourseEnhancement";

const sheetsToGrab = [
    // 'Introduction',
    // 'Start',
    // 'Main Menu',
    // 'Unit shortfall summary',
    // 'Results',
    'Headline Results',
    // 'Detailed Results',
    'Trading Summary Area Habitats',
    'Trading Summary Hedgerows',
    "Trading Summary WaterC's",
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
    'Unit shortfall calculations',
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

/**
 * Parse a statutory metric file and to get all parsed rows
 *
 * ```ts
// for local files
const localResults =  parseFile("MY_BNG_METRIC.xlsm");
// for in-memory files, like those in a website input field
const results = parseFile(await file.arrayBuffer());
```
 * Throws an error when the metric version is unsupported.
 */
export interface ParseFileOptions {
    /**
     * When true (default), every row is run through the full validating schema
     * (`v.check` business-logic guards included) and the first failure throws.
     *
     * When false, business-logic checks are skipped: each row passes through
     * the input shape parser (so picklists and field types are still parsed)
     * and then through the same enrichment/calculation transforms. If a
     * transform throws (e.g. an unknown habitat lookup), the row is passed on
     * with whatever fields had already been computed; downstream unit values
     * for that row will be `undefined`. Other rows are unaffected.
     *
     * Rows whose input shape itself can't be parsed (e.g. an unrecognised
     * picklist value) are logged and skipped.
     */
    validate?: boolean;
}

export function parseFile(file: string | ArrayBuffer, options: ParseFileOptions = {}): AllFeatures {
    const validate = options.validate !== false;
    const workbook = parseWorkbook(file);

    const schemas = validate ? checkedSchemas : uncheckedSchemas;

    // Parse all input sheets using shared parsers
    // Using exact column indices and start rows from working comparison tests
    const onSiteHabitatBaselines = parseAllRows(
        workbook,
        'A-1 On-Site Habitat Baseline',
        schemas.onSiteHabitatBaseline,
        4, // E column (broad habitat)
        parseOnSiteHabitatBaselineRow,
        undefined,
        validate,
    );

    const onSiteHabitatCreations = parseAllRows(
        workbook,
        'A-2 On-Site Habitat Creation',
        schemas.onSiteHabitatCreation,
        24, // Y column (habitat units delivered)
        parseOnSiteHabitatCreationRow,
        undefined,
        validate,
    );

    const onSiteHabitatEnhancements = parseAllEnhancementRows(
        workbook,
        'A-1 On-Site Habitat Baseline',
        'A-3 On-Site Habitat Enhancement',
        schemas.onSiteHabitatEnhancement,
        4, // E column (baseline habitat ref)
        parseOnSiteHabitatEnhancementRow,
        11, // start on row 12
        validate,
    );

    const offSiteHabitatBaselines = parseAllRows(
        workbook,
        'D-1 Off-Site Habitat Baseline',
        schemas.offSiteHabitatBaseline,
        4, // E column
        parseOffSiteHabitatBaselineRow,
        undefined,
        validate,
    );

    const offSiteHabitatCreations = parseAllRows(
        workbook,
        'D-2 Off-Site Habitat Creation',
        schemas.offSiteHabitatCreation,
        3, // D column (from offSiteHabitatComparison.test.ts)
        parseOffSiteHabitatCreationRow,
        undefined,
        validate,
    );

    const offSiteHabitatEnhancements = parseAllEnhancementRows(
        workbook,
        'D-1 Off-Site Habitat Baseline',
        'D-3 Off-Site Habitat Enhancment',
        schemas.offSiteHabitatEnhancement,
        4, // E column
        parseOffSiteHabitatEnhancementRow,
        11, // starts on row 12
        validate,
    );


    const onSiteHedgerowBaselines = parseAllRows(
        workbook,
        'B-1 On-Site Hedge Baseline',
        schemas.onSiteHedgerowBaseline,
        3, // D column (hedgerow type)
        parseOnSiteHedgerowBaselineRow,
        9, // Start at row 10 (array index 9)
        validate,
    );

    const onSiteHedgerowCreations = parseAllRows(
        workbook,
        'B-2 On-Site Hedge Creation',
        schemas.onSiteHedgerowCreation,
        3, // D column (hedgerow type)
        parseOnSiteHedgerowCreationRow,
        11, // Start at row 12 (array index 11)
        validate,
    );

    const onSiteHedgerowEnhancements = parseAllEnhancementRows(
        workbook,
        'B-1 On-Site Hedge Baseline',
        'B-3 On-Site Hedge Enhancement',
        schemas.onSiteHedgerowEnhancement,
        1, // B column (baseline ref)
        parseOnSiteHedgerowEnhancementRow,
        11, // Start at row 12 (array index 11)
        validate,
    );

    const offSiteHedgerowBaselines = parseAllRows(
        workbook,
        'E-1 Off-Site Hedge Baseline',
        schemas.offSiteHedgerowBaseline,
        3, // D column (hedgerow type)
        parseOffSiteHedgerowBaselineRow,
        9, // Start at row 10 (array index 9)
        validate,
    );

    const offSiteHedgerowCreations = parseAllRows(
        workbook,
        'E-2 Off-Site Hedge Creation',
        schemas.offSiteHedgerowCreation,
        3, // D column (hedgerow type)
        parseOffSiteHedgerowCreationRow,
        11, // Start at row 12 (array index 11)
        validate,
    );

    const offSiteHedgerowEnhancements = parseAllEnhancementRows(
        workbook,
        'E-1 Off-Site Hedge Baseline',
        'E-3 Off-Site Hedge Enhancement',
        schemas.offSiteHedgerowEnhancement,
        1, // B column (baseline ref)
        parseOffSiteHedgerowEnhancementRow,
        11, // Start at row 12 (array index 11)
        validate,
    );

    const onSiteWatercourseBaselines = parseAllRows(
        workbook,
        "C-1 On-Site WaterC' Baseline",
        schemas.onSiteWatercourseBaseline,
        4, // E column
        parseOnSiteWatercourseBaselineRow,
        9, // start at row 10
        validate,
    );

    const onSiteWatercourseCreations = parseAllRows(
        workbook,
        "C-2 On-Site WaterC' Creation",
        schemas.onSiteWatercourseCreation,
        2, // C column
        parseOnSiteWatercourseCreationRow,
        11, // start at row 12
        validate,
    );

    const onSiteWatercourseEnhancements = parseAllEnhancementRows(
        workbook,
        "C-1 On-Site WaterC' Baseline",
        "C-3 On-Site WaterC' Enhancement",
        schemas.onSiteWatercourseEnhancement,
        13, // N column
        parseOnSiteWatercourseEnhancementRow,
        11, // start at row 12
        validate,
    );

    const offSiteWatercourseBaselines = parseAllRows(
        workbook,
        "F-1 Off-Site WaterC' Baseline",
        schemas.offSiteWatercourseBaseline,
        4, // E column
        parseOffSiteWatercourseBaselineRow,
        9, // start at row 10
        validate,
    );

    const offSiteWatercourseCreations = parseAllRows(
        workbook,
        "F-2 Off-Site WaterC' Creation",
        schemas.offSiteWatercourseCreation,
        2, // C column
        parseOffSiteWatercourseCreationRow,
        11, // start at row 12
        validate,
    );

    const offSiteWatercourseEnhancements = parseAllEnhancementRows(
        workbook,
        "F-1 Off-Site WaterC' Baseline",
        'F-3 Off-Site WaterC Enhancement',
        schemas.offSiteWatercourseEnhancement,
        41, // AP column
        parseOffSiteWatercourseEnhancementRow,
        11, // start at row 12
        validate,
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


    // NOTE: various downstream implementations rely on this object being frozen
    // in order to cache computed results. Create a new version by spreading if necessary.
    return Object.freeze(parsedRows);
}
export default parseFile;

const checkedSchemas = {
    onSiteHabitatBaseline: onSiteHabitatBaselineSchema,
    onSiteHabitatCreation: onSiteHabitatCreationSchema,
    onSiteHabitatEnhancement: onSiteHabitatEnhancementSchema,
    offSiteHabitatBaseline: offSiteHabitatBaselineSchema,
    offSiteHabitatCreation: offSiteHabitatCreationSchema,
    offSiteHabitatEnhancement: offSiteHabitatEnhancementSchema,
    onSiteHedgerowBaseline: onSiteHedgerowBaselineSchema,
    onSiteHedgerowCreation: onSiteHedgerowCreationSchema,
    onSiteHedgerowEnhancement: onSiteHedgerowEnhancementSchema,
    offSiteHedgerowBaseline: offSiteHedgerowBaselineSchema,
    offSiteHedgerowCreation: offSiteHedgerowCreationSchema,
    offSiteHedgerowEnhancement: offSiteHedgerowEnhancementSchema,
    onSiteWatercourseBaseline: onSiteWatercourseBaselineSchema,
    onSiteWatercourseCreation: onSiteWatercourseCreationSchema,
    onSiteWatercourseEnhancement: onSiteWatercourseEnhancementSchema,
    offSiteWatercourseBaseline: offSiteWatercourseBaselineSchema,
    offSiteWatercourseCreation: offSiteWatercourseCreationSchema,
    offSiteWatercourseEnhancement: offSiteWatercourseEnhancementSchema,
} as const;

const uncheckedSchemas = {
    onSiteHabitatBaseline: onSiteHabitatBaselineUncheckedSchema,
    onSiteHabitatCreation: onSiteHabitatCreationUncheckedSchema,
    onSiteHabitatEnhancement: onSiteHabitatEnhancementUncheckedSchema,
    offSiteHabitatBaseline: offSiteHabitatBaselineUncheckedSchema,
    offSiteHabitatCreation: offSiteHabitatCreationUncheckedSchema,
    offSiteHabitatEnhancement: offSiteHabitatEnhancementUncheckedSchema,
    onSiteHedgerowBaseline: onSiteHedgerowBaselineUncheckedSchema,
    onSiteHedgerowCreation: onSiteHedgerowCreationUncheckedSchema,
    onSiteHedgerowEnhancement: onSiteHedgerowEnhancementUncheckedSchema,
    offSiteHedgerowBaseline: offSiteHedgerowBaselineUncheckedSchema,
    offSiteHedgerowCreation: offSiteHedgerowCreationUncheckedSchema,
    offSiteHedgerowEnhancement: offSiteHedgerowEnhancementUncheckedSchema,
    onSiteWatercourseBaseline: onSiteWatercourseBaselineUncheckedSchema,
    onSiteWatercourseCreation: onSiteWatercourseCreationUncheckedSchema,
    onSiteWatercourseEnhancement: onSiteWatercourseEnhancementUncheckedSchema,
    offSiteWatercourseBaseline: offSiteWatercourseBaselineUncheckedSchema,
    offSiteWatercourseCreation: offSiteWatercourseCreationUncheckedSchema,
    offSiteWatercourseEnhancement: offSiteWatercourseEnhancementUncheckedSchema,
} as const;

// Helper function to parse all rows from a sheet
function parseAllRows<Schema extends v.BaseSchema<any, any, any>, Input extends v.InferInput<Schema>, Output extends v.InferOutput<Schema>>(
    workbook: WorkBook,
    sheetName: string,
    schema: Schema,
    columnToCheck: number,
    parseRow: (sheet: Sheet, row: number) => Input,
    startRow: number = 10, // Most sheets have data starting at row 11 (0-indexed row 10)
    throwOnFailure: boolean = true,
): Output[] {
    const sheet = getSheet(workbook, sheetName)!;

    const dataRows = findAllDataRows(sheet, columnToCheck, startRow);
    const results: Output[] = [];

    for (const row of dataRows) {
        const inputData = parseRow(sheet, row);
        const result = v.safeParse(schema, inputData);

        if (result.success) {
            results.push(result.output);
        } else if (throwOnFailure) {
            console.error(`Error: parsing ${sheetName} row ${row}`, v.flatten(result.issues));
            throw new Error(`Error: parsing ${sheetName} row ${row}`);
        } else {
            console.warn(`Skipping ${sheetName} row ${row}: input shape failed`, v.flatten(result.issues));
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
    startRow: number = 10, // Most sheets have data starting at row 11 (0-indexed row 10)
    throwOnFailure: boolean = true,
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
        } else if (throwOnFailure) {
            console.error(`Error: parsing ${sheetName} row ${row}`, v.flatten(result.issues));
            throw new Error(`Error: parsing ${sheetName} row ${row}`);
        } else {
            console.warn(`Skipping ${sheetName} row ${row}: input shape failed`, v.flatten(result.issues));
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

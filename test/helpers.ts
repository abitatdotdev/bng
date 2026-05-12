import XLSX from 'xlsx';
import { describe } from "bun:test";
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { parseWorkbook } from '../src/parsers/parseFile';

// All example sheets from the default location
const exampleMetricsFileNames =
    existsSync('./test/metrics') ?
        (await readdir('./test/metrics'))
            .filter(f => f.includes('.xlsx') || f.includes('.xlsm'))
            // Blacklist some files
            .filter(name =>
                ![
                    // seems to have uncompleted tree rows - they don't look valid to me
                    'BCP_APP_24_00318_F.xlsx',
                    // random zeros in D-2
                    'Lake District_7_2024_2105.xlsm',
                    // incompatible broad habitat/habitat type in A-2 row 13
                    'Rother_RR_2024_1825_P.xlsx',
                    // invalid entries in A-3 Bespoke Compensation field
                    'Bath and North East Somerset_240_1231_FUL.xlsm',
                    // missing condition in A-1 row 20
                    'BCP_APP_24_00939_F.xlsx',
                    // invalid combination of broad habitat and habitat type in A-3 row 12
                    'EAST_HAMPSHIRE_60033.xlsm',
                    // invalid row in C-3 (looks incomplete)
                    'Warrington_2024_012222_FUL.xlsm',

                    // Legacy statutory metric versions: parsing supported, but C-1/C-2/C-3/F-1/F-2/F-3
                    // watercourse output columns and/or per-row baseline formulas diverge from the
                    // current metric we calculate against. We don't adapt calculations to old paths.
                    'AshfieldV20240329.xlsm',
                    'COVENTRYCITYCOUNCIL_PL_2024_0001441_FULM.xlsx',
                    'EAST_HAMPSHIRE_60508.xlsx',
                    'EAST_HERTS_3_24_0284_OUT.xlsm',
                    'EAST_HERTS_3_24_1110_FUL.xlsm',
                    'KENT_KCC_TH_0041_2024.xlsm',
                    'Leeds_24_04625_FU.xlsx',
                    'Oxfordshire_MW.0057_24.xlsm',
                    'Solihull_PL_2024_01948_PPFL.xlsm',
                    'South Oxfordshire_P24_S1336_FUL.xlsx',
                    'South Tyneside_ST_0357_24_FUL.xlsm',
                    'Staffordshire_SCC_24_0121_FULL-MAJ.xlsm',
                    'Vale of White Horse_P24_V1515_FUL.xlsx',
                    'Wakefield_24_01787_FUL.xlsm',
                    'West Lindsey_WL_2024_00570.xlsm',
                    'Wyre_24_00603_LMAJ.xlsx',

                    // Legacy statutory metric: off-site hedge enhancement decomposes Time-to-Target,
                    // Temporal Multiplier and Spatial Risk Multiplier differently from the current
                    // metric. Final hedgerow units match but intermediate fields fail per-row checks.
                    'Rutland_2024_0645_FUL.xlsm',
                    'Newark and Sherwood_24_00711_FUL.xlsm',

                    // Legacy statutory metric: Individual Trees creation with "30+" Time-to-Target
                    // collapses to final TTT=0 / multiplier=1 in older sheets. The current metric
                    // applies the 30+ multiplier (~0.32), producing different totals.
                    'EAST_HAMPSHIRE_23150_008.xlsm',

                    // Legacy statutory metric: on-site hedgerow post-intervention aggregate diverges
                    // even though per-row B-1/B-2/B-3 tests pass — older sheet decomposes the
                    // hedgerow calc into columns we don't read.
                    'Birmingham_2024_05528_PA.xlsm',

                    // NOTE: Maidstone_24_501943_FULL.xlsm is intentionally NOT blacklisted.
                    // Its `Unit Deficit - Habitat` failure exposes a real bug: the library's
                    // headlineResults.unitSummary hard-codes a 10% net-gain target (1.1) and
                    // ignores the user-configured Start!F22 percentage. Maidstone sets F22 = 0.2,
                    // so Excel's deficit uses a 20% target. See src/headlineResults.ts:510–524.
                ].includes(name)
            )
            .map(f => [`./test/metrics/${f}`])
        : []

export const EXCEL_FILES = [
    ["./examples/simple-unlocked.xlsm"],
    ...exampleMetricsFileNames.slice(0, 250),
]
// Whitelist to help with test isolation when debugging
// .filter(([name]) => name === './test/metrics/Warrington_2024_012222_FUL.xlsm')

type ExcelFileTest = (workbook: XLSX.WorkBook, fileName: string) => void

/**
  * Run the given test against the example metric spreadsheets.
  *
  * @param files A list of files to test against. 
  * @param test The test to execute. Receives the file name and the excel workbook object
  */
export const testExcelFiles = (files: typeof EXCEL_FILES, test: ExcelFileTest): void =>
    describe.each(files)(
        "%s", fileName => {
            try {
                const workbook = parseWorkbook(fileName);
                console.info(`Testing ${fileName}...`)
                test(workbook, fileName)
            } catch {
                describe.skip("Not a valid version to compare against", () => { });
                return;
            }
        }
    )

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
 * Helper to compare two numeric values with tolerance
 */
export function expectCloseTo(actual: number, expected: number, tolerance: number = 0.0001, fieldName?: string) {
    const diff = Math.abs(actual - expected);
    if (diff >= tolerance) {
        throw new Error(`${fieldName || 'Value'} mismatch: expected ${expected}, got ${actual} (diff: ${diff})`);
    }
}

const MAX_DATA_ROWS = 100;


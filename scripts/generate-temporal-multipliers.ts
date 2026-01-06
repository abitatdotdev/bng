#!/usr/bin/env bun

import XLSX from 'xlsx';
import fs from 'fs';

/**
 * Get cell value from worksheet
 */
function getCellValue(sheet: XLSX.WorkSheet, row: number, col: number): any {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[cellRef];
    return cell ? cell.v : null;
}

/**
 * Read temporal multipliers from Excel
 */
function readTemporalMultipliers(filePath: string) {
    console.log(`Reading Excel file: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = 'G-4 Temporal multipliers';

    if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found in workbook`);
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        throw new Error(`Sheet "${sheetName}" not found in workbook`);
    }

    // Read data from A4:C37
    const startRow = 3;  // Row 4 (0-indexed)
    const endRow = 36;   // Row 37 (0-indexed)

    const multipliers: Array<{ key: string; multiplier: number }> = [];

    for (let row = startRow; row <= endRow; row++) {
        const key = getCellValue(sheet, row, 0);  // Column A
        const multiplier = getCellValue(sheet, row, 2);  // Column C

        if (key !== null && key !== undefined) {
            // Handle N/A values from Excel
            let multiplierValue: number | string;
            if (multiplier === null || multiplier === undefined || String(multiplier).toUpperCase() === 'N/A') {
                multiplierValue = '"N/A"';  // Will be output as string literal in TS
            } else {
                multiplierValue = typeof multiplier === 'number' ? multiplier : parseFloat(String(multiplier));
            }

            multipliers.push({
                key: String(key),
                multiplier: multiplierValue as number
            });
        }
    }

    console.log(`Read ${multipliers.length} temporal multiplier entries`);
    return multipliers;
}

/**
 * Generate TypeScript code for temporal multipliers
 */
function generateTypeScriptCode(multipliers: Array<{ key: string; multiplier: number }>) {
    let code = `// THIS FILE IS GENERATED AUTOMATICALLY
// Temporal multipliers from G-4 Temporal multipliers sheet (A4:C37)
// Maps years to target condition time to reach target condition multiplier

export const temporalMultipliers = {
`;

    multipliers.forEach((entry, index) => {
        // Format the key - if it's a number, keep it as number, otherwise quote it
        const formattedKey = /^\d+$/.test(entry.key) ? entry.key : `'${entry.key}'`;

        // Format the value - if it's the special "N/A" string marker, output as string, otherwise as number
        const formattedValue = entry.multiplier === '"N/A"' as any ? "'N/A'" : entry.multiplier;

        code += `    ${formattedKey}: ${formattedValue}`;

        if (index < multipliers.length - 1) {
            code += ',\n';
        } else {
            code += '\n';
        }
    });

    code += `} as const;

export type TemporalMultiplierKey = keyof typeof temporalMultipliers;

/**
 * Looks up a temporal multiplier value based on the years to target condition
 * Corresponds to VLOOKUP formula in Excel: VLOOKUP(years,'G-4 Temporal multipliers'!$A$4:$C$37,3,FALSE)
 *
 * @param years - Number of years to reach target condition, or special keys like "30+" or "Not Possible ▲"
 * @returns The temporal multiplier value, or undefined if not found
 */
export function getTemporalMultiplier(years: TemporalMultiplierKey): number | undefined {
    return temporalMultipliers[years];
}

/**
 * Looks up a temporal multiplier with error handling similar to Excel's IFERROR
 * Corresponds to: IFERROR(IF(value="Check Data ⚠","Check Data ⚠",VLOOKUP(...)),"")
 *
 * @param value - The input value (years or special key)
 * @returns The multiplier value, "Check Data ⚠" if input is invalid, or empty string on error
 */
export function lookupTemporalMultiplier(value: string | number): number | string {
    if (value === "Check Data ⚠") {
        return "Check Data ⚠";
    }

    try {
        const key = String(value) as TemporalMultiplierKey;
        const multiplier = getTemporalMultiplier(key);

        if (multiplier === undefined) {
            return "";
        }

        return multiplier;
    } catch (error) {
        return "";
    }
}
`;

    return code;
}

/**
 * Main function
 */
async function main() {
    try {
        // Get file path from command line or use default
        const filePath = process.argv[2] || './examples/simple-unlocked.xlsm';

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Read temporal multipliers from Excel
        const multipliers = readTemporalMultipliers(filePath);

        // Generate TypeScript code
        const typeScriptCode = generateTypeScriptCode(multipliers);

        // Output the code
        console.log('\n' + '='.repeat(80));
        console.log('Generated TypeScript Code:');
        console.log('='.repeat(80));

        // Save to file
        const outputPath = './src/temporalMultipliers.ts';
        fs.writeFileSync(outputPath, typeScriptCode);
        console.log(`\nCode saved to: ${outputPath}`);

    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Run the script
main();

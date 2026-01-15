#!/usr/bin/env bun

import XLSX from 'xlsx';
import fs from 'fs';

// Column indices (0-based) for G-7 WaterC' Data sheet
const COLUMNS = {
    habitatDescription: 1,            // B
    distinctivenessCategory: 2,       // C
    distinctivenessScore: 3,          // D
    technicalDifficultyCreation: 4,   // E
    technicalDifficultyEnhancement: 5,// F
    tradingRules: 6,                  // G
    conditionGood: 7,                 // H
    conditionFairlyGood: 8,           // I
    conditionModerate: 9,             // J
    conditionFairlyPoor: 10,          // K
    conditionPoor: 11,                // L
};

// Temporal multipliers start at column M
const TEMPORAL_CREATION_START = 12;  // Column M

// Enhancement temporal matrix starts at column T
const ENHANCEMENT_TEMPORAL_START = 19;  // Column T (baseline condition labels)
const ENHANCEMENT_TEMPORAL_DATA_START = 20;  // Column U (first data column)

/**
 * Get cell value from worksheet
 */
function getCellValue(sheet, row, col) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[cellRef];
    return cell ? cell.v : null;
}

/**
 * Escape special characters in strings for TypeScript output
 */
function escapeString(str) {
    if (!str) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

/**
 * Convert distinctiveness category
 */
function convertDistinctivenessCategory(rawValue) {
    if (!rawValue) return 'Low';
    const cleaned = String(rawValue).trim();
    if (cleaned === "V.low") return "V.Low";
    if (cleaned === "V.high") return "V.High";
    return cleaned;
}

/**
 * Read watercourse data from G-7 WaterC' Data sheet
 */
function readWatercourseData(filePath) {
    console.log(`Reading Excel file: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = "G-7 WaterC' Data";

    if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found in workbook`);
    }

    const sheet = workbook.Sheets[sheetName];

    // Data rows: 4-8 (0-indexed: 3-7)
    const startRow = 3;
    const endRow = 7;

    const watercourses = [];

    for (let row = startRow; row <= endRow; row++) {
        const habitatDescription = getCellValue(sheet, row, COLUMNS.habitatDescription);
        if (!habitatDescription) continue;

        const habitatDescStr = String(habitatDescription).trim();

        const watercourse = {
            label: habitatDescStr,
            distinctivenessCategory: null,
            distinctivenessScore: 0,
            technicalDifficultyCreation: null,
            technicalDifficultyEnhancement: null,
            tradingRules: null,
            conditions: {},
            yearsToTargetConditionViaCreation: {},
        };

        // Process distinctiveness
        const rawCategory = getCellValue(sheet, row, COLUMNS.distinctivenessCategory);
        if (rawCategory) {
            watercourse.distinctivenessCategory = convertDistinctivenessCategory(rawCategory);
        }

        const distinctivenessScore = getCellValue(sheet, row, COLUMNS.distinctivenessScore);
        if (distinctivenessScore !== null) {
            watercourse.distinctivenessScore = parseFloat(distinctivenessScore) || 0;
        }

        // Read technical difficulties
        const techDiffC = getCellValue(sheet, row, COLUMNS.technicalDifficultyCreation);
        if (techDiffC) {
            watercourse.technicalDifficultyCreation = String(techDiffC).trim();
        }
        const techDiffE = getCellValue(sheet, row, COLUMNS.technicalDifficultyEnhancement);
        if (techDiffE) {
            watercourse.technicalDifficultyEnhancement = String(techDiffE).trim();
        }


        // Read trading rules from column G
        const tradingRules = getCellValue(sheet, row, COLUMNS.tradingRules);
        if (tradingRules) {
            watercourse.tradingRules = String(tradingRules).trim();
        }

        // Read condition scores (H-L)
        const conditionGood = getCellValue(sheet, row, COLUMNS.conditionGood);
        const conditionFairlyGood = getCellValue(sheet, row, COLUMNS.conditionFairlyGood);
        const conditionModerate = getCellValue(sheet, row, COLUMNS.conditionModerate);
        const conditionFairlyPoor = getCellValue(sheet, row, COLUMNS.conditionFairlyPoor);
        const conditionPoor = getCellValue(sheet, row, COLUMNS.conditionPoor);

        if (conditionGood !== null && conditionGood !== undefined && conditionGood !== '') {
            const stringValue = String(conditionGood).trim().toLowerCase();
            if (stringValue.includes('not possible') || stringValue.includes('n/a')) {
                watercourse.conditions['Good'] = 'Not possible';
            } else {
                const parsed = parseFloat(conditionGood);
                if (!isNaN(parsed)) {
                    watercourse.conditions['Good'] = parsed;
                }
            }
        }
        if (conditionFairlyGood !== null && conditionFairlyGood !== undefined && conditionFairlyGood !== '') {
            const stringValue = String(conditionFairlyGood).trim().toLowerCase();
            if (stringValue.includes('not possible') || stringValue.includes('n/a')) {
                watercourse.conditions['Fairly Good'] = 'Not possible';
            } else {
                const parsed = parseFloat(conditionFairlyGood);
                if (!isNaN(parsed)) {
                    watercourse.conditions['Fairly Good'] = parsed;
                }
            }
        }
        if (conditionModerate !== null && conditionModerate !== undefined && conditionModerate !== '') {
            const stringValue = String(conditionModerate).trim().toLowerCase();
            if (stringValue.includes('not possible') || stringValue.includes('n/a')) {
                watercourse.conditions['Moderate'] = 'Not possible';
            } else {
                const parsed = parseFloat(conditionModerate);
                if (!isNaN(parsed)) {
                    watercourse.conditions['Moderate'] = parsed;
                }
            }
        }
        if (conditionFairlyPoor !== null && conditionFairlyPoor !== undefined && conditionFairlyPoor !== '') {
            const stringValue = String(conditionFairlyPoor).trim().toLowerCase();
            if (stringValue.includes('not possible') || stringValue.includes('n/a')) {
                watercourse.conditions['Fairly Poor'] = 'Not possible';
            } else {
                const parsed = parseFloat(conditionFairlyPoor);
                if (!isNaN(parsed)) {
                    watercourse.conditions['Fairly Poor'] = parsed;
                }
            }
        }
        if (conditionPoor !== null && conditionPoor !== undefined && conditionPoor !== '') {
            const stringValue = String(conditionPoor).trim().toLowerCase();
            if (stringValue.includes('not possible') || stringValue.includes('n/a')) {
                watercourse.conditions['Poor'] = 'Not possible';
            } else {
                const parsed = parseFloat(conditionPoor);
                if (!isNaN(parsed)) {
                    watercourse.conditions['Poor'] = parsed;
                }
            }
        }

        // Read temporal multipliers for creation (starting at column M)
        // Assuming 5 columns for the 5 conditions
        const conditions = ['Poor', 'Fairly Poor', 'Moderate', 'Fairly Good', 'Good'];
        for (let i = 0; i < conditions.length; i++) {
            const value = getCellValue(sheet, row, TEMPORAL_CREATION_START + i);
            if (value !== null && value !== undefined && value !== '') {
                const stringValue = String(value).trim();
                if (stringValue === '30+') {
                    watercourse.yearsToTargetConditionViaCreation[conditions[i]] = '30+';
                } else if (stringValue.toLowerCase().includes('not possible')) {
                    watercourse.yearsToTargetConditionViaCreation[conditions[i]] = stringValue;
                } else {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                        watercourse.yearsToTargetConditionViaCreation[conditions[i]] = parsed;
                    }
                }
            }
        }

        watercourses.push(watercourse);
    }

    console.log(`Read ${watercourses.length} watercourse types from Excel`);
    return watercourses;
}

/**
 * Read watercourse enhancement temporal matrix from G-7 WaterC' Data sheet
 * Source: columns T through Y, rows 4-9
 * Maps baseline condition -> proposed condition to years to reach target
 */
function readEnhancementTemporalMatrix(filePath) {
    console.log(`Reading enhancement temporal matrix from: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = "G-7 WaterC' Data";

    if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found in workbook`);
    }

    const sheet = workbook.Sheets[sheetName];

    // Data rows: 4-9 (0-indexed: 3-8) for baseline conditions
    const startRow = 3;
    const endRow = 8;

    // Target conditions in order (columns U-Y)
    const conditions = ['Poor', 'Fairly Poor', 'Moderate', 'Fairly Good', 'Good'];

    const matrix = {};

    for (let row = startRow; row <= endRow; row++) {
        // Get baseline condition label from column T
        const baselineCondition = getCellValue(sheet, row, ENHANCEMENT_TEMPORAL_START);
        if (!baselineCondition) continue;

        const baselineLabel = String(baselineCondition).trim();

        // Read the 5 target condition values (columns U-Y)
        for (let i = 0; i < conditions.length; i++) {
            const targetCondition = conditions[i];
            const value = getCellValue(sheet, row, ENHANCEMENT_TEMPORAL_DATA_START + i);

            const key = `${baselineLabel} to ${targetCondition}`;

            if (value !== null && value !== undefined && value !== '') {
                const stringValue = String(value).trim().toLowerCase();
                if (stringValue === 'n/a' || stringValue.includes('not possible')) {
                    matrix[key] = 'N/A';
                } else {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) {
                        matrix[key] = parsed;
                    }
                }
            }
        }
    }

    console.log(`Read ${Object.keys(matrix).length} enhancement pathway entries from Excel`);
    return matrix;
}

/**
 * Generate TypeScript code for enhancement temporal matrix
 */
function generateEnhancementTemporalMatrixCode(matrix) {
    let code = `// THIS FILE IS GENERATED AUTOMATICALLY\n`;
    code += `// Source: G-7 WaterC' Data sheet, columns T through Y\n\n`;
    code += `/**\n`;
    code += ` * Watercourse enhancement temporal matrix\n`;
    code += ` * Maps baseline condition -> proposed condition to years to reach target\n`;
    code += ` */\n`;
    code += `export const watercourseEnhancementTemporalMatrix: Record<string, number | "N/A"> = {\n`;

    // Group by baseline condition for cleaner output
    const conditions = ['Poor', 'Fairly Poor', 'Moderate', 'Fairly Good', 'Good'];

    conditions.forEach((baselineCondition, baselineIndex) => {
        code += `    // From ${baselineCondition} baseline\n`;

        conditions.forEach((targetCondition) => {
            const key = `${baselineCondition} to ${targetCondition}`;
            const value = matrix[key];

            if (value !== undefined) {
                const formattedValue = typeof value === 'string' ? `"${value}"` : value;
                code += `    "${key}": ${formattedValue},\n`;
            }
        });

        if (baselineIndex < conditions.length - 1) {
            code += '\n';
        }
    });

    code += '};\n';

    return code;
}

/**
 * Generate TypeScript code for watercourse objects
 */
function generateTypeScriptCode(watercourses) {
    let code = `// THIS FILE IS GENERATED AUTOMATICALLY
import { difficulty } from "./difficulty";
import { distinctivenessCategories } from "./distinctivenessCategories";

export const allWatercourses = {
`;

    watercourses.forEach((watercourse, index) => {
        code += `    '${escapeString(watercourse.label)}': {\n`;
        code += `        label: '${escapeString(watercourse.label)}',\n`;
        code += `        distinctivenessCategory: ${watercourse.distinctivenessCategory ? `'${watercourse.distinctivenessCategory}'` : 'null'},\n`;
        code += `        distinctivenessScore: ${watercourse.distinctivenessCategory ? `distinctivenessCategories["${watercourse.distinctivenessCategory}"].score` : watercourse.distinctivenessScore},\n`;
        code += `        irreplaceable: ${watercourse.irreplaceable},\n`;
        code += `        tradingRules: ${watercourse.tradingRules ? `'${escapeString(watercourse.tradingRules)}'` : 'null'},\n`;
        code += `        technicalDifficultyOfCreation: ${watercourse.technicalDifficultyCreation ? `'${escapeString(watercourse.technicalDifficultyCreation)}'` : 'null'},\n`;
        code += `        technicalDifficultyOfEnhancement: ${watercourse.technicalDifficultyEnhancement ? `'${escapeString(watercourse.technicalDifficultyEnhancement)}'` : 'null'},\n`;

        // Conditions
        if (Object.keys(watercourse.conditions).length > 0) {
            code += `        conditions: {\n`;
            Object.entries(watercourse.conditions).forEach(([condition, score]) => {
                const formattedValue = typeof score === 'string' ? `'${escapeString(score)}'` : score;
                code += `            '${condition}': ${formattedValue},\n`;
            });
            code += `        },\n`;
        } else {
            code += `        conditions: {},\n`;
        }

        // Creation temporal data
        if (Object.keys(watercourse.yearsToTargetConditionViaCreation).length > 0) {
            code += `        yearsToTargetConditionViaCreation: {\n`;
            Object.entries(watercourse.yearsToTargetConditionViaCreation).forEach(([condition, value]) => {
                const formattedValue = typeof value === 'string' ? `'${escapeString(value)}'` : value;
                code += `            '${condition}': ${formattedValue},\n`;
            });
            code += `        },\n`;
        } else {
            code += `        yearsToTargetConditionViaCreation: null,\n`;
        }

        code += '    }';

        if (index < watercourses.length - 1) {
            code += ',\n';
        } else {
            code += '\n';
        }
    });

    code += '} as const;\n\n';
    code += `export type WatercourseMap = typeof allWatercourses;\n`;
    code += `type WatercourseMapLabel = keyof WatercourseMap;\n`;
    code += `export type Watercourse = WatercourseMap[WatercourseMapLabel];\n`;
    code += `export type WatercourseLabel = Watercourse['label'];\n\n`;
    code += `export function watercourseByLabel(label: WatercourseLabel): Watercourse | undefined {\n`;
    code += `    return allWatercourses[label];\n`;
    code += `}\n`;

    return code;
}

/**
 * Main function
 */
async function main() {
    try {
        const filePath = process.argv[2] || '../examples/simple.xlsm';

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Read watercourse data from G-7 sheet
        const watercourses = readWatercourseData(filePath);

        // Generate TypeScript code for watercourses
        const typeScriptCode = generateTypeScriptCode(watercourses);

        // Save watercourses to file
        const watercoursesOutputPath = '../src/watercourses.ts';
        fs.writeFileSync(watercoursesOutputPath, typeScriptCode);
        console.log(`\nWatercourses code saved to: ${watercoursesOutputPath}`);
        console.log(`Generated ${watercourses.length} watercourse types`);

        // Read enhancement temporal matrix from G-7 sheet
        const enhancementMatrix = readEnhancementTemporalMatrix(filePath);

        // Generate TypeScript code for enhancement temporal matrix
        const enhancementMatrixCode = generateEnhancementTemporalMatrixCode(enhancementMatrix);

        // Save enhancement temporal matrix to file
        const matrixOutputPath = '../src/watercourseEnhancementTemporalMatrix.ts';
        fs.writeFileSync(matrixOutputPath, enhancementMatrixCode);
        console.log(`\nEnhancement temporal matrix saved to: ${matrixOutputPath}`);
        console.log(`Generated ${Object.keys(enhancementMatrix).length} enhancement pathway entries`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();

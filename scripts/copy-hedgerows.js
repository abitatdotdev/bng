#!/usr/bin/env bun

import XLSX from 'xlsx';
import fs from 'fs';

// Column indices (0-based) for G-6 Hedgerow Data sheet
const COLUMNS = {
    habitatDescription: 1,           // B
    distinctivenessCategory: 2,      // C
    distinctivenessScore: 3,         // D
    creationPoor: 4,                 // E
    creationModerate: 6,             // G
    creationGood: 8,                 // I
    enhancementPoorModerate: 10,     // K
    enhancementPoorGood: 12,         // M
    technicalDifficultyCreation: 31, // AF
    technicalDifficultyEnhancement: 32, // AG
    conditionCategory: 35,           // AJ
    conditionScore: 36,              // AK
};

// Enhancement pathway columns (S-AB: indices 18-27)
const ENHANCEMENT_PATHWAYS_START = 18; // Column S
const ENHANCEMENT_PATHWAYS_END = 27;   // Column AB

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
    return cleaned;
}

/**
 * Read enhancement pathway names from G-6 header row
 */
function readEnhancementPathwayNames() {
    const workbook = XLSX.readFile('./examples/simple.xlsm');
    const worksheet = workbook.Sheets['G-6 Hedgerow Data'];

    const pathwayNames = [];
    const headerRow = 1; // Row 2 (0-indexed)

    for (let col = ENHANCEMENT_PATHWAYS_START; col <= ENHANCEMENT_PATHWAYS_END; col++) {
        const pathwayName = getCellValue(worksheet, headerRow, col);
        if (pathwayName) {
            pathwayNames.push(String(pathwayName).trim());
        }
    }

    console.log(`Found ${pathwayNames.length} enhancement pathways`);
    return pathwayNames;
}

/**
 * Read hedgerow data from G-6 Hedgerow Data sheet
 */
function readHedgerowData(filePath, enhancementPathwayNames) {
    console.log(`Reading Excel file: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = 'G-6 Hedgerow Data';

    if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found in workbook`);
    }

    const sheet = workbook.Sheets[sheetName];

    // Data rows: 3-15 (0-indexed: 2-14)
    const startRow = 2;
    const endRow = 14;

    const hedgerows = [];

    for (let row = startRow; row <= endRow; row++) {
        const habitatDescription = getCellValue(sheet, row, COLUMNS.habitatDescription);
        if (!habitatDescription) continue;

        const habitatDescStr = String(habitatDescription).trim();

        const hedgerow = {
            label: habitatDescStr,
            distinctivenessCategory: null,
            distinctivenessScore: 0,
            creationTemporal: {},
            enhancementTemporal: {},
            enhancementPathways: {},
            technicalDifficultyCreation: null,
            technicalDifficultyCreationMultiplier: 1,
            technicalDifficultyEnhancement: null,
            technicalDifficultyEnhancementMultiplier: 1,
            conditions: null,
        };

        // Process distinctiveness
        const rawCategory = getCellValue(sheet, row, COLUMNS.distinctivenessCategory);
        if (rawCategory) {
            hedgerow.distinctivenessCategory = convertDistinctivenessCategory(rawCategory);
        }

        const distinctivenessScore = getCellValue(sheet, row, COLUMNS.distinctivenessScore);
        if (distinctivenessScore !== null) {
            hedgerow.distinctivenessScore = parseFloat(distinctivenessScore) || 0;
        }

        // Read technical difficulty directly from G-6 (columns AF and AG)
        const techDiffCreation = getCellValue(sheet, row, COLUMNS.technicalDifficultyCreation);
        if (techDiffCreation) {
            hedgerow.technicalDifficultyCreation = String(techDiffCreation).trim();
        }

        const techDiffEnhancement = getCellValue(sheet, row, COLUMNS.technicalDifficultyEnhancement);
        if (techDiffEnhancement) {
            hedgerow.technicalDifficultyEnhancement = String(techDiffEnhancement).trim();
        }

        // Read condition data directly from G-6 (columns AJ and AK)
        const conditionCategory = getCellValue(sheet, row, COLUMNS.conditionCategory);
        const conditionScore = getCellValue(sheet, row, COLUMNS.conditionScore);
        if (conditionCategory && conditionScore) {
            hedgerow.conditions = {};
            const category = String(conditionCategory).trim();
            const score = parseFloat(conditionScore);
            if (!isNaN(score)) {
                hedgerow.conditions[category] = score;
            }
        }

        // Read creation temporal data
        const creationPoor = getCellValue(sheet, row, COLUMNS.creationPoor);
        const creationModerate = getCellValue(sheet, row, COLUMNS.creationModerate);
        const creationGood = getCellValue(sheet, row, COLUMNS.creationGood);

        if (creationPoor !== null && creationPoor !== undefined && creationPoor !== '') {
            const parsed = parseFloat(creationPoor);
            if (!isNaN(parsed)) hedgerow.creationTemporal.Poor = parsed;
        }
        if (creationModerate !== null && creationModerate !== undefined && creationModerate !== '') {
            const parsed = parseFloat(creationModerate);
            if (!isNaN(parsed)) hedgerow.creationTemporal.Moderate = parsed;
        }
        if (creationGood !== null && creationGood !== undefined && creationGood !== '') {
            const parsed = parseFloat(creationGood);
            if (!isNaN(parsed)) hedgerow.creationTemporal.Good = parsed;
        }

        // Read enhancement temporal data (through condition)
        const enhPoorModerate = getCellValue(sheet, row, COLUMNS.enhancementPoorModerate);
        const enhPoorGood = getCellValue(sheet, row, COLUMNS.enhancementPoorGood);

        if (enhPoorModerate !== null && enhPoorModerate !== undefined && enhPoorModerate !== '') {
            const parsed = parseFloat(enhPoorModerate);
            if (!isNaN(parsed)) hedgerow.enhancementTemporal['Poor to Moderate'] = parsed;
        }
        if (enhPoorGood !== null && enhPoorGood !== undefined && enhPoorGood !== '') {
            const parsed = parseFloat(enhPoorGood);
            if (!isNaN(parsed)) hedgerow.enhancementTemporal['Poor to Good'] = parsed;
        }

        // Read enhancement pathways (through distinctiveness)
        enhancementPathwayNames.forEach((pathwayName, index) => {
            const col = ENHANCEMENT_PATHWAYS_START + index;
            const value = getCellValue(sheet, row, col);

            if (value !== null && value !== undefined && value !== '') {
                const parsed = parseFloat(value);
                if (!isNaN(parsed)) {
                    hedgerow.enhancementPathways[pathwayName] = parsed;
                }
            }
        });

        hedgerows.push(hedgerow);
    }

    console.log(`Read ${hedgerows.length} hedgerow types from Excel`);
    return hedgerows;
}

/**
 * Generate TypeScript code for hedgerow objects
 */
function generateTypeScriptCode(hedgerows) {
    let code = `// THIS FILE IS GENERATED AUTOMATICALLY
import { difficulty } from "./difficulty";
import { distinctivenessCategories } from "./distinctivenessCategories";

export const allHedgerows = {
`;

    hedgerows.forEach((hedgerow, index) => {
        code += `    '${escapeString(hedgerow.label)}': {\n`;
        code += `        label: '${escapeString(hedgerow.label)}',\n`;
        code += `        distinctivenessCategory: ${hedgerow.distinctivenessCategory ? `'${hedgerow.distinctivenessCategory}'` : 'null'},\n`;
        code += `        distinctivenessScore: ${hedgerow.distinctivenessCategory ? `distinctivenessCategories["${hedgerow.distinctivenessCategory}"].score` : hedgerow.distinctivenessScore},\n`;
        code += `        technicalDifficultyCreation: ${hedgerow.technicalDifficultyCreation ? `'${escapeString(hedgerow.technicalDifficultyCreation)}'` : 'null'},\n`;
        code += `        technicalDifficultyCreationMultiplier: ${hedgerow.technicalDifficultyCreation ? `difficulty['${escapeString(hedgerow.technicalDifficultyCreation)}']` : '1'},\n`;
        code += `        technicalDifficultyEnhancement: ${hedgerow.technicalDifficultyEnhancement ? `'${escapeString(hedgerow.technicalDifficultyEnhancement)}'` : 'null'},\n`;
        code += `        technicalDifficultyEnhancementMultiplier: ${hedgerow.technicalDifficultyEnhancement ? `difficulty['${escapeString(hedgerow.technicalDifficultyEnhancement)}']` : '1'},\n`;

        // Creation temporal data
        if (Object.keys(hedgerow.creationTemporal).length > 0) {
            code += `        creationTemporal: {\n`;
            Object.entries(hedgerow.creationTemporal).forEach(([condition, value]) => {
                code += `            '${condition}': ${value},\n`;
            });
            code += `        },\n`;
        } else {
            code += `        creationTemporal: null,\n`;
        }

        // Enhancement temporal data
        if (Object.keys(hedgerow.enhancementTemporal).length > 0) {
            code += `        enhancementTemporal: {\n`;
            Object.entries(hedgerow.enhancementTemporal).forEach(([pathway, value]) => {
                code += `            '${escapeString(pathway)}': ${value},\n`;
            });
            code += `        },\n`;
        } else {
            code += `        enhancementTemporal: null,\n`;
        }

        // Enhancement pathways
        if (Object.keys(hedgerow.enhancementPathways).length > 0) {
            code += `        enhancementPathways: {\n`;
            Object.entries(hedgerow.enhancementPathways).forEach(([pathway, value]) => {
                code += `            '${escapeString(pathway)}': ${value},\n`;
            });
            code += `        },\n`;
        } else {
            code += `        enhancementPathways: null,\n`;
        }

        // Conditions
        if (hedgerow.conditions) {
            code += `        conditions: {\n`;
            Object.entries(hedgerow.conditions).forEach(([condition, value]) => {
                code += `            '${condition}': ${value},\n`;
            });
            code += `        },\n`;
        } else {
            code += `        conditions: null,\n`;
        }

        code += '    }';

        if (index < hedgerows.length - 1) {
            code += ',\n';
        } else {
            code += '\n';
        }
    });

    code += '} as const;\n\n';
    code += `export type HedgerowMap = typeof allHedgerows;\n`;
    code += `type HedgerowMapLabel = keyof HedgerowMap;\n`;
    code += `export type Hedgerow = HedgerowMap[HedgerowMapLabel];\n`;
    code += `export type HedgerowLabel = Hedgerow['label'];\n\n`;
    code += `export function hedgerowByLabel(label: HedgerowLabel): Hedgerow | undefined {\n`;
    code += `    return allHedgerows[label];\n`;
    code += `}\n`;

    return code;
}

/**
 * Main function
 */
async function main() {
    try {
        const filePath = process.argv[2] || './examples/simple.xlsm';

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Read enhancement pathway names
        const enhancementPathwayNames = readEnhancementPathwayNames();

        // Read hedgerow data (includes embedded difficulty and condition data from G-6)
        const hedgerows = readHedgerowData(filePath, enhancementPathwayNames);

        // Generate TypeScript code
        const typeScriptCode = generateTypeScriptCode(hedgerows);

        // Save to file
        const outputPath = './src/hedgerows.ts';
        fs.writeFileSync(outputPath, typeScriptCode);
        console.log(`\nCode saved to: ${outputPath}`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();

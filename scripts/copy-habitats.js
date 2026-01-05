#!/usr/bin/env bun

import XLSX from 'xlsx';
import fs from 'fs';
import { readFileSync } from 'fs';

// Condition columns from conditions.tsv
const conditionColumns = [
    'Good',
    'Fairly Good',
    'Moderate',
    'Fairly Poor',
    'Poor',
    'Condition Assessment N/A',
    'N/A - Other'
];

const distinctivenessScores = {
    'V.High': 8,
    'High': 6,
    'Medium': 4,
    'Low': 2,
    'V.Low': 0,
};

const distinctivenessTradingRules = {
    'V.High': 'Same habitat required – bespoke compensation option ⚠',
    'High': 'Same habitat required =',
    'Medium': 'Same broad habitat or a higher distinctiveness habitat required (≥)',
    'Low': 'Same distinctiveness or better habitat required ≥',
    'V.Low': 'Compensation Not Required',
};

const difficultyMap = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Very High': 'vHigh',
};

const difficultyMultipliers = {
    low: 1,
    medium: 0.67,
    high: 0.33,
    vHigh: 0.1,
};

// Column indices (0-based)
const COLUMNS = {
    label: 1,           // B
    type: 0,           // A
    code: 2,            // C
    level1: 3,          // D
    level2Code: 4,      // E
    level2Label: 5,     // F
    level3Code: 6,      // G
    level3Label: 7,     // H
    level4Code: 8,      // I
    level4Label: 9,     // J
    distinctivenessCategory: 10,  // K
    distinctivenessScore: 11,     // L
    distinctivenessTradingRules: 12,  // M
    technicalDifficultyCreation: 13,  // N
    technicalDifficultyCreationMultiplier: 14,  // O
    technicalDifficultyEnhancement: 15,  // P
    technicalDifficultyEnhancementMultiplier: 16,  // Q
    description: 17,    // R
    conditionAssessmentNotes: 18,  // S
    irreplaceable: 19,  // T
};

/**
 * Get cell value from worksheet
 */
function getCellValue(sheet, row, col) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = sheet[cellRef];
    return cell ? cell.v : null;
}

/**
 * Convert Yes/No to boolean
 */
function toMaybeBoolean(value) {
    if (value === null || value === undefined || value === '' || value === 'Yes/No') return undefined;
    return String(value).toLowerCase() === 'yes';
}

/**
 * Convert distinctiveness category
 */
function convertDistinctivenessCategory(rawValue) {
    if (!rawValue) return 'low';
    const cleaned = String(rawValue).trim();
    if (cleaned === "V.low") return "V.Low"
    return cleaned
}

/**
 * Convert difficulty level
 */
function convertDifficulty(rawValue) {
    if (!rawValue) return 'low';
    const normalized = String(rawValue).trim();
    return difficultyMap[normalized] || 'low';
}

/**
 * Get multiplier value
 */
function getMultiplier(difficulty) {
    const normalized = convertDifficulty(difficulty);
    return difficultyMultipliers[normalized] || 1;
}

/**
 * Get distinctiveness score
 */
function getDistinctivenessScore(category) {
    const normalized = convertDistinctivenessCategory(category);
    return distinctivenessScores[normalized] || 0;
}

/**
 * Get trading rules
 */
function getTradingRules(category) {
    const normalized = convertDistinctivenessCategory(category);
    return distinctivenessTradingRules[normalized] || 'Compensation Not Required';
}

function getBroadHabitat(label) {
    return label.split(' - ')[0];
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

const conditionKeys = [
    "Good",
    "Fairly Good",
    "Moderate",
    "Fairly Poor",
    "Poor",
    "Condition Assessment N/A",
    "N/A - Other",
]
/**
 * Read conditions sheet
 */
function readConditionsData() {
    const workbook = XLSX.readFile('./examples/simple.xlsm');
    const worksheet = workbook.Sheets['G-8 Condition Look up'];
    const data = XLSX.utils.sheet_to_json(worksheet, { range: 'A3:H135' });

    const conditionMap = {};

    data.forEach(row => {
        const name = row["Habitat Description"]
        conditionMap[name] = {}

        for (const key of conditionKeys) {
            const value = row[key]
            const parsed = parseFloat(value);
            if (isNaN(parsed)) continue
            conditionMap[name][key] = parsed
        }
    });

    console.log(`Read conditions for ${Object.keys(conditionMap).length} habitats`);
    return conditionMap;
}

/**
 * Read Excel file and extract habitat data
 */
function readHabitatData(filePath, conditionMap) {
    console.log(`Reading Excel file: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheetName = 'G-1 All Habitats';

    if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found in workbook`);
    }

    const sheet = workbook.Sheets[sheetName];

    // Get the range of data (A3:T135)
    const startRow = 2;  // Row 3 (0-indexed)
    const endRow = 134;  // Row 135 (0-indexed)

    const habitats = [];

    for (let row = startRow; row <= endRow; row++) {
        // Check if row has data (at least the label column)
        const label = getCellValue(sheet, row, COLUMNS.label);
        if (!label) continue;

        const labelStr = String(label).trim();

        const habitat = {
            label: labelStr,
            broadHabitat: String(getBroadHabitat(labelStr)),
            type: String(getCellValue(sheet, row, COLUMNS.type) || '').trim(),
            code: String(getCellValue(sheet, row, COLUMNS.code) || '').trim(),
            level1: String(getCellValue(sheet, row, COLUMNS.level1) || '').trim(),
            level2Code: String(getCellValue(sheet, row, COLUMNS.level2Code) || '').trim(),
            level2Label: String(getCellValue(sheet, row, COLUMNS.level2Label) || '').trim(),
            level3Code: String(getCellValue(sheet, row, COLUMNS.level3Code) || '').trim(),
            level3Label: String(getCellValue(sheet, row, COLUMNS.level3Label) || '').trim(),
            level4Code: String(getCellValue(sheet, row, COLUMNS.level4Code) || '').trim(),
            level4Label: String(getCellValue(sheet, row, COLUMNS.level4Label) || '').trim(),
            distinctivenessCategory: null,
            distinctivenessScore: 0,
            distinctivenessTradingRules: '',
            technicalDifficultyCreation: null,
            technicalDifficultyCreationMultiplier: 1,
            technicalDifficultyEnhancement: null,
            technicalDifficultyEnhancementMultiplier: 1,
            description: String(getCellValue(sheet, row, COLUMNS.description) || '').trim(),
            conditionAssessmentNotes: String(getCellValue(sheet, row, COLUMNS.conditionAssessmentNotes) || '').trim(),
            irreplaceable: false,
            conditions: null,
        };

        // Add condition data if available
        if (conditionMap[labelStr]) {
            habitat.conditions = conditionMap[labelStr];
        }

        // Process distinctiveness category
        const rawCategory = getCellValue(sheet, row, COLUMNS.distinctivenessCategory);
        if (rawCategory) {
            const category = convertDistinctivenessCategory(rawCategory);
            habitat.distinctivenessCategory = category;
            habitat.distinctivenessScore = getDistinctivenessScore(category);
            habitat.distinctivenessTradingRules = getTradingRules(category);
        }

        // Process technical difficulty creation
        const rawCreationDifficulty = getCellValue(sheet, row, COLUMNS.technicalDifficultyCreation);
        if (rawCreationDifficulty) {
            const difficulty = convertDifficulty(rawCreationDifficulty);
            habitat.technicalDifficultyCreation = difficulty;
            habitat.technicalDifficultyCreationMultiplier = getMultiplier(difficulty);
        }

        // Process technical difficulty enhancement
        const rawEnhancementDifficulty = getCellValue(sheet, row, COLUMNS.technicalDifficultyEnhancement);
        if (rawEnhancementDifficulty) {
            const difficulty = convertDifficulty(rawEnhancementDifficulty);
            habitat.technicalDifficultyEnhancement = difficulty;
            habitat.technicalDifficultyEnhancementMultiplier = getMultiplier(difficulty);
        }

        // Process irreplaceable
        const rawIrreplaceable = getCellValue(sheet, row, COLUMNS.irreplaceable);
        habitat.irreplaceable = toMaybeBoolean(rawIrreplaceable);

        habitats.push(habitat);
    }

    console.log(`Read ${habitats.length} habitats from Excel`);
    return habitats;
}

/**
 * Generate TypeScript code for habitat objects
 */
function generateTypeScriptCode(habitats) {
    let code = `// THIS FILE IS GENERATED AUTOMATICALLY
import { type BroadHabitat } from "./broadHabitats";
import { difficulty } from "./difficulty"
import { distinctivenessCategories } from "./distinctivenessCategories"
import type { BaselineHabitatType, CreationHabitatType, EnhancedHabitatType } from "./habitatTypes";

export const allHabitats = {
`

    habitats.forEach((habitat, index) => {
        code += `    '${escapeString(`${habitat.broadHabitat} - ${habitat.type}`)}': {\n`;
        code += `        label: '${escapeString(habitat.label)}',\n`;
        code += `        broadHabitat: '${escapeString(habitat.broadHabitat)}',\n`;
        code += `        type: '${escapeString(habitat.type)}',\n`;
        code += `        code: '${escapeString(habitat.code)}',\n`;
        code += `        level1: '${escapeString(habitat.level1)}',\n`;
        code += `        level2Code: '${escapeString(habitat.level2Code)}',\n`;
        code += `        level2Label: '${escapeString(habitat.level2Label)}',\n`;
        code += `        level3Code: '${escapeString(habitat.level3Code)}',\n`;
        code += `        level3Label: '${escapeString(habitat.level3Label)}',\n`;
        code += `        level4Code: '${escapeString(habitat.level4Code)}',\n`;
        code += `        level4Label: '${escapeString(habitat.level4Label)}',\n`;
        code += `        distinctivenessCategory: ${habitat.distinctivenessCategory ? `'${habitat.distinctivenessCategory}'` : 'null'},\n`;
        code += `        distinctivenessScore: ${habitat.distinctivenessCategory ? `distinctivenessCategories["${habitat.distinctivenessCategory}"].score` : 'null'},\n`;
        code += `        distinctivenessTradingRules: ${habitat.distinctivenessCategory ? `distinctivenessCategories["${habitat.distinctivenessCategory}"].suggestedAction` : "''"},\n`;
        code += `        technicalDifficultyCreation: ${habitat.technicalDifficultyCreation ? `'${habitat.technicalDifficultyCreation}'` : 'null'},\n`;
        code += `        technicalDifficultyCreationMultiplier: ${habitat.technicalDifficultyCreation ? `difficulty.${habitat.technicalDifficultyCreation}` : '1'},\n`;
        code += `        technicalDifficultyEnhancement: ${habitat.technicalDifficultyEnhancement ? `'${habitat.technicalDifficultyEnhancement}'` : 'null'},\n`;
        code += `        technicalDifficultyEnhancementMultiplier: ${habitat.technicalDifficultyEnhancement ? `difficulty.${habitat.technicalDifficultyEnhancement}` : '1'},\n`;
        code += `        description: '${escapeString(habitat.description)}',\n`;
        code += `        conditionAssessmentNotes: '${escapeString(habitat.conditionAssessmentNotes)}',\n`;
        code += `        irreplaceable: ${habitat.irreplaceable},\n`;
        if (habitat.conditions) {
            code += `        conditions: {\n`;
            Object.entries(habitat.conditions).forEach(([condition, value]) => {
                code += `            '${condition}': ${value},\n`;
            });
            code += `        },\n`;
        } else {
            code += `        conditions: null,\n`;
        }
        code += '    }';

        if (index < habitats.length - 1) {
            code += ',\n';
        } else {
            code += '\n';
        }
    });

    code += '} as const';
    code += `
export type HabitatMap = typeof allHabitats;
type HabitatMapLabel = keyof HabitatMap;
export type Habitat = HabitatMap[HabitatMapLabel]
export type HabitatLabel = Habitat['label']

export function habitatByLabel(label: HabitatLabel): Habitat | undefined {
    return Object.values(allHabitats).find(h => h.label === label);
}
export function habitatByBroadAndType(broadHabitat: BroadHabitat, habitatType: BaselineHabitatType | CreationHabitatType | EnhancedHabitatType): Habitat | undefined {
    return Object.values(allHabitats).find(h => h.broadHabitat === broadHabitat && h.type === habitatType);
}

`

    return code;
}

/**
 * Main function
 */
async function main() {
    try {
        // Get file path from command line or use default
        const filePath = process.argv[2] || './examples/simple.xlsm';

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        // Read conditions data
        const conditionMap = readConditionsData();

        // Read habitat data from Excel
        const habitats = readHabitatData(filePath, conditionMap);

        // Generate TypeScript code
        const typeScriptCode = generateTypeScriptCode(habitats);

        // Output the code
        console.log('\n' + '='.repeat(80));
        console.log('Generated TypeScript Code:');

        // Optionally save to file
        const outputPath = './src/habitats.ts';
        fs.writeFileSync(outputPath, typeScriptCode);
        console.log(`\nCode saved to: ${outputPath}`);

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();

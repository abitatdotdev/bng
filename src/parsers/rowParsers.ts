import type XLSX from 'xlsx'
import { findRow, getCellValue, normalizeNumber, parseBoolean } from './excelHelpers';
import type { OnSiteHedgerowBaselineSchema } from '../onSite/hedgerowBaseline';
import type { OnSiteHedgerowEnhancementSchema } from '../onSite/hedgerowEnhancement';
import type { OnSiteWatercourseBaselineSchema } from '../onSite/watercourseBaseline';
import type { OnSiteWatercourseCreationSchema } from '../onSite/watercourseCreation';
import type { OnSiteWatercourseEnhancementSchema } from '../onSite/watercourseEnhancement';
import type { OffSiteWatercourseBaselineSchema } from '../offSite/watercourseBaseline';
import type { OffSiteWatercourseCreationSchema } from '../offSite/watercourseCreation';
import type { OffSiteWatercourseEnhancementSchema } from '../offSite/watercourseEnhancement';
import type { OnSiteHabitatBaselineSchema } from '../onSite/habitatBaseline';
import type { OnSiteHabitatCreationSchema } from '../onSite/habitatCreation';
import type { OnSiteHabitatEnhancementSchema } from '../onSite/habitatEnhancement';
import type { OffSiteHabitatBaselineSchema } from '../offSite/habitatBaseline';
import type { OffSiteHabitatCreationSchema } from '../offSite/habitatCreation';
import type { OffSiteHabitatEnhancementSchema } from '../offSite/habitatEnhancement';
import type { OnSiteHedgerowCreationSchema } from '../onSite/hedgerowCreation';
import type { OffSiteHedgerowBaselineSchema } from '../offSite/hedgerowBaseline';
import type { OffSiteHedgerowEnhancementSchema } from '../offSite/hedgerowEnhancement';
import type { OffSiteHedgerowCreationSchema } from '../offSite/hedgerowCreation';

export function parseOnSiteHabitatBaselineRow(sheet: XLSX.Sheet, dataRow: number): OnSiteHabitatBaselineSchema {
    // Extract input values from Excel
    // Column mapping (0-indexed):
    // E (4): Broad Habitat
    // F (5): Habitat Type
    // G (6): Irreplaceable Habitat (Yes/No)
    // H (7): Area (hectares)
    // K (10): Condition
    // M (12): Strategic Significance
    // S (18): Area Retained (hectares)
    // T (19): Area Enhanced (hectares)
    // Y (24): Bespoke Compensation Agreed (Yes/No/Pending)
    return {
        broadHabitat: getCellValue(sheet, dataRow, 4), // E
        habitatType: getCellValue(sheet, dataRow, 5), // F
        irreplaceableHabitat: parseBoolean(getCellValue(sheet, dataRow, 6)), // G
        area: normalizeNumber(getCellValue(sheet, dataRow, 7)), // H
        condition: getCellValue(sheet, dataRow, 10), // K
        strategicSignificance: getCellValue(sheet, dataRow, 12), // M
        areaRetained: normalizeNumber(getCellValue(sheet, dataRow, 18)) || 0, // S
        areaEnhanced: normalizeNumber(getCellValue(sheet, dataRow, 19)) || 0, // T
        bespokeCompensationAgreed: getCellValue(sheet, dataRow, 24) || undefined, // Y
        userComments: "",
        planningAuthorityComments: "",
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 3) || ""), // D
    };
}

export function parseOnSiteHabitatCreationRow(sheet: XLSX.Sheet, dataRow: number): OnSiteHabitatCreationSchema {
    // Extract input values from Excel
    // Column mapping (0-indexed):
    // D (3): Broad Habitat
    // E (4): Habitat Type
    // G (6): Area (hectares)
    // J (9): Condition
    // L (11): Strategic Significance
    // P (15): Habitat Creation in Advance (years)
    // Q (16): Habitat Creation Delay (years)

    return {
        broadHabitat: getCellValue(sheet, dataRow, 3), // D
        habitatType: getCellValue(sheet, dataRow, 4), // E
        area: normalizeNumber(getCellValue(sheet, dataRow, 6)), // G
        condition: getCellValue(sheet, dataRow, 9), // J
        strategicSignificance: getCellValue(sheet, dataRow, 11), // L
        habitatCreationInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 15)) || 0, // P
        habitatCreationDelay: normalizeNumber(getCellValue(sheet, dataRow, 16)) || 0, // Q
        userComments: "",
        planningAuthorityComments: "",
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 1) || ""), // B
    };
};

export function parseOnSiteHabitatEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OnSiteHabitatEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, 4); // E
    const baselineRow = findRow(baselineSheet, 3, baselineRef); // D
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOnSiteHabitatBaselineRow(baselineSheet, baselineRow);

    // Extract input values from Excel
    // Column mapping (0-indexed) - based on B-3 sheet structure:
    // B (1): Baseline ref
    // Q (16): Proposed broad habitat
    // R (17): Proposed habitat type
    // Y (24): Proposed condition
    // AA (26): Strategic Significance
    // AE (30): Hedgerow enhanced in advance (years)
    // AF (31): Delay in starting hedgerow enhancement (years)
    // AO (40): User Comments
    // AP (41): Planning Authority Comments
    // AQ (42): Habitat Reference Number
    return {
        baseline: baselineData,
        broadHabitat: getCellValue(sheet, dataRow, 16), // Q
        habitatType: getCellValue(sheet, dataRow, 17), // R
        condition: getCellValue(sheet, dataRow, 24), // Y
        strategicSignificance: getCellValue(sheet, dataRow, 26), // AA
        habitatEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 30)) || 0, // AE
        habitatEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, 31)) || 0, // AF
        userComments: String(getCellValue(sheet, dataRow, 40) || ""), // AO
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 41) || ""), // AP
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 42) || ""), // AQ
    }
}


export function parseOffSiteHabitatBaselineRow(sheet: XLSX.Sheet, dataRow: number): OffSiteHabitatBaselineSchema {
    return {
        // E (4): Broad Habitat
        broadHabitat: getCellValue(sheet, dataRow, 4),
        // F (5): Habitat Type
        habitatType: getCellValue(sheet, dataRow, 5),
        // G (6): Irreplaceable Habitat (Yes/No)
        irreplaceableHabitat: parseBoolean(getCellValue(sheet, dataRow, 6)),
        // H (7): Area (hectares)
        area: normalizeNumber(getCellValue(sheet, dataRow, 7)),
        // K (10): Condition
        condition: getCellValue(sheet, dataRow, 10),
        // M (12): Strategic Significance
        strategicSignificance: getCellValue(sheet, dataRow, 12),
        // R (17): Spatial Risk Category
        spatialRiskCategory: getCellValue(sheet, dataRow, 17) || "Low",
        // V (21): Area Retained (hectares)
        areaRetained: normalizeNumber(getCellValue(sheet, dataRow, 21)) || 0,
        // W (22): Area Enhanced (hectares)
        areaEnhanced: normalizeNumber(getCellValue(sheet, dataRow, 22)) || 0,
        // AB (27): Bespoke Compensation Agreed (Yes/No/Pending)
        bespokeCompensationAgreed: getCellValue(sheet, dataRow, 27) || undefined,
        // AC (28): User comments
        userComments: getCellValue(sheet, dataRow, 28) || undefined,
        // AD (29): Planning authority comments
        planningAuthorityComments: getCellValue(sheet, dataRow, 29) || undefined,
        // AE (30): Planning authority comments
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 30) || ""),
        // AF (31): Planning authority comments
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 31) || ""),
    }
};

export function parseOffSiteHabitatCreationRow(sheet: XLSX.Sheet, dataRow: number): OffSiteHabitatCreationSchema {
    // Extract input values from Excel
    // Column mapping (0-indexed):
    // D (3): Broad Habitat
    // E (4): Habitat Type
    // G (6): Area (hectares)
    // J (9): Condition
    // L (11): Strategic Significance
    // P (15): Habitat Creation in Advance (years)
    // Q (16): Habitat Creation Delay (years)
    // Y (24): Spatial Risk Category

    return {
        broadHabitat: getCellValue(sheet, dataRow, 3), // D
        habitatType: getCellValue(sheet, dataRow, 4), // E
        area: normalizeNumber(getCellValue(sheet, dataRow, 6)), // G
        condition: getCellValue(sheet, dataRow, 9), // J
        strategicSignificance: getCellValue(sheet, dataRow, 11), // L
        habitatCreationInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 15)) || 0, // P
        habitatCreationDelay: normalizeNumber(getCellValue(sheet, dataRow, 16)) || 0, // Q
        spatialRiskCategory: getCellValue(sheet, dataRow, 24) || "Low", // Y
        userComments: "",
        planningAuthorityComments: "",
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 30) || ""), // AE
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 31) || ""), // AF
        baselineReferenceNumber: String(getCellValue(sheet, dataRow, 32) || ""), // AG
    };
}

export function parseOffSiteHabitatEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OffSiteHabitatEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, 4); // E
    const baselineRow = findRow(baselineSheet, 3, baselineRef); // D
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOffSiteHabitatBaselineRow(baselineSheet, baselineRow);

    // Extract input values from Excel
    // Column mapping (0-indexed) - based on B-3 sheet structure:
    // E (4): Baseline ref
    // Q (16): Proposed broad habitat
    // R (17): Proposed habitat type
    // Y (24): Proposed condition
    // AA (26): Strategic Significance
    // AE (30): Habitat enhanced in advance (years)
    // AF (31): Delay in starting habitat enhancement (years)
    // AR (43): User Comments
    // AS (44): Planning Authority Comments
    // AT (45): Habitat Reference Number
    // AU (46): Off-site reference
    return {
        baseline: baselineData,
        broadHabitat: getCellValue(sheet, dataRow, 16), // Q
        habitatType: getCellValue(sheet, dataRow, 17), // R
        condition: getCellValue(sheet, dataRow, 24), // Y
        strategicSignificance: getCellValue(sheet, dataRow, 26), // AA
        habitatEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 30)) || 0, // AE
        habitatEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, 31)) || 0, // AF
        userComments: String(getCellValue(sheet, dataRow, 43) || ""), // AR
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 44) || ""), // AS
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 45) || ""), // AT
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 46) || ""), // AU
    }
}

export function parseOnSiteHedgerowBaselineRow(sheet: XLSX.Sheet, dataRow: number): OnSiteHedgerowBaselineSchema {
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

    return {
        habitatType: getCellValue(sheet, dataRow, 3), // D
        length: normalizeNumber(getCellValue(sheet, dataRow, 4)), // E
        condition: getCellValue(sheet, dataRow, 7), // H
        strategicSignificance: getCellValue(sheet, dataRow, 9), // J
        lengthRetained: normalizeNumber(getCellValue(sheet, dataRow, 15)) || 0, // P
        lengthEnhanced: normalizeNumber(getCellValue(sheet, dataRow, 16)) || 0, // Q
        userComments: String(getCellValue(sheet, dataRow, 21) || ""), // V
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 22) || ""), // W
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 23) || ""), // X
    }
}

export function parseOnSiteHedgerowCreationRow(sheet: XLSX.Sheet, dataRow: number): OnSiteHedgerowCreationSchema {
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

    return {
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
}

export function parseOnSiteHedgerowEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OnSiteHedgerowEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, 1); // B
    const baselineRow = findRow(baselineSheet, 1, baselineRef); // B
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOnSiteHedgerowBaselineRow(baselineSheet, baselineRow);

    // Extract input values from Excel
    // Column mapping (0-indexed) - based on B-3 sheet structure:
    // B (1): Baseline ref
    // M (12): Proposed habitat type
    // S (18): Proposed condition
    // U (20): Strategic Significance
    // Y (24): Hedgerow enhanced in advance (years)
    // Z (25): Delay in starting hedgerow enhancement (years)
    // AI (34): User Comments
    // AJ (35): Planning Authority Comments
    // AK (36): Habitat Reference Number
    return {
        baseline: baselineData,
        habitatType: getCellValue(sheet, dataRow, 12), // M
        condition: getCellValue(sheet, dataRow, 18), // S
        strategicSignificance: getCellValue(sheet, dataRow, 20), // U
        hedgerowEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 24)) || 0, // W
        hedgerowEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, 25)) || 0, // X
        userComments: String(getCellValue(sheet, dataRow, 34) || ""), // AB
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 35) || ""), // AC
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 36) || ""), // AD
    }
}

export function parseOffSiteHedgerowBaselineRow(sheet: XLSX.Sheet, dataRow: number): OffSiteHedgerowBaselineSchema {
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

    return {
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
}

export function parseOffSiteHedgerowEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OffSiteHedgerowEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, 1); // B
    const baselineRow = findRow(baselineSheet, 1, baselineRef); // B
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOffSiteHedgerowBaselineRow(baselineSheet, baselineRow);

    // Extract input values from Excel
    // Column mapping (0-indexed) - based on E-3 sheet structure:
    // B (1): Baseline ref
    // M (12): Proposed habitat type
    // S (18): Proposed condition
    // U (20): Strategic Significance
    // Y (24): Hedgerow enhanced in advance (years)
    // Z (25): Delay in starting hedgerow enhancement (years)
    // AL (37): User Comments
    // AM (38): Planning Authority Comments
    // AN (39): Habitat Reference Number
    // AO (40): Off-site Reference Number
    return {
        baseline: baselineData,
        habitatType: getCellValue(sheet, dataRow, 12), // M
        condition: getCellValue(sheet, dataRow, 18), // S
        strategicSignificance: getCellValue(sheet, dataRow, 20), // U
        hedgerowEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 24)) || 0, // Y
        hedgerowEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, 25)) || 0, // Z
        userComments: String(getCellValue(sheet, dataRow, 37) || ""), // AL
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 38) || ""), // AM
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 39) || ""), // AN
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 40) || ""), // AO
    }
}

export function parseOffSiteHedgerowCreationRow(sheet: XLSX.Sheet, dataRow: number): OffSiteHedgerowCreationSchema {
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

    return {
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
}

export function parseOnSiteWatercourseBaselineRow(sheet: XLSX.Sheet, dataRow: number): OnSiteWatercourseBaselineSchema {
    // Extract input values from Excel
    // Column mapping (0-indexed) - see docs/excel-column-mappings.md:
    // D (3): Watercourse type
    // E (4): Length (km)
    // H (7): Condition
    // J (9): Strategic Significance
    // M (12): Watercourse encroachment
    // O (14): Extent of encroachment
    // U (20): Length retained
    // V (21): Length enhanced
    // AA (26): Bespoke compensation agreed
    // AB (27): User comments
    // AC (28): Planning Authority Comments
    // AD (29): Habitat Reference Number

    return {
        watercourseType: getCellValue(sheet, dataRow, 3), // D
        length: normalizeNumber(getCellValue(sheet, dataRow, 4)), // E
        condition: getCellValue(sheet, dataRow, 7), // H
        strategicSignificance: getCellValue(sheet, dataRow, 9), // J
        watercourseEncroachment: getCellValue(sheet, dataRow, 12), // M
        riparianEncroachment: getCellValue(sheet, dataRow, 14), // O
        lengthRetained: normalizeNumber(getCellValue(sheet, dataRow, 20)) || 0, // U
        lengthEnhanced: normalizeNumber(getCellValue(sheet, dataRow, 21)) || 0, // V
        bespokeCompensation: getCellValue(sheet, dataRow, 26) || undefined, // AA
        userComments: String(getCellValue(sheet, dataRow, 27) || ""), // AB
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 28) || ""), // AC
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 29) || ""), // AD
    };
}

export function parseOnSiteWatercourseCreationRow(sheet: XLSX.Sheet, dataRow: number): OnSiteWatercourseCreationSchema {
    // Extract input values from Excel
    // Column mapping (0-indexed) - see docs/excel-column-mappings.md:
    // C (2): Watercourse type
    // D (3): Length (km)
    // G (6): Condition
    // I (8): Strategic Significance
    // M (12): Habitat created in advance
    // N (13): Delay starting habitat creation
    // V (21): Extent of encroachment
    // X (23): Extent of encroachment for both banks
    // AA (26): User comments
    // AB (27): Planning Authority Comments
    // AC (28): Habitat Reference Number

    return {
        watercourseType: getCellValue(sheet, dataRow, 2), // C
        length: normalizeNumber(getCellValue(sheet, dataRow, 3)), // D
        condition: getCellValue(sheet, dataRow, 6), // G
        strategicSignificance: getCellValue(sheet, dataRow, 8), // I
        delayInStarting: getCellValue(sheet, dataRow, 13) || undefined, // N
        watercourseEncroachment: getCellValue(sheet, dataRow, 21), // V
        riparianEncroachment: getCellValue(sheet, dataRow, 23), // X
        userComments: String(getCellValue(sheet, dataRow, 26) || ""), // AA
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 27) || ""), // AB
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 28) || ""), // AC
    };
}

export function parseOnSiteWatercourseEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OnSiteWatercourseEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, 1); // B
    const baselineRow = findRow(baselineSheet, 2, baselineRef); // C
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOnSiteWatercourseBaselineRow(baselineSheet, baselineRow);

    // Extract input values from Excel
    // Column mapping (0-indexed) - based on B-3 sheet structure:
    // B (1): Baseline ref
    // N (13): Proposed habitat type
    // T (19): Proposed condition
    // V (21): Strategic Significance
    // Z (25): Habitat enhanced in advance (years)
    // AA (26): Delay in starting hedgerow enhancement (years)
    // AI (34): Extent of encroachment
    // AK (36): Extent of encroachment for both banks
    // AN (39): User Comments
    // AO (40): Planning Authority Comments
    // AP (41): Habitat Reference Number
    return {
        baseline: baselineData,
        watercourseType: getCellValue(sheet, dataRow, 13), // N
        condition: getCellValue(sheet, dataRow, 19), // T
        strategicSignificance: getCellValue(sheet, dataRow, 21), // V
        watercourseEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 25)) || 0, // Z
        watercourseEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, 26)) || 0, // AA
        watercourseEncroachment: String(getCellValue(sheet, dataRow, 34) || ""), // AI
        riparianEncroachment: String(getCellValue(sheet, dataRow, 36) || ""), // AI
        userComments: String(getCellValue(sheet, dataRow, 39) || ""), // AN
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 40) || ""), // AO
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 41) || ""), // AP
    }
}



export function parseOffSiteWatercourseBaselineRow(sheet: XLSX.Sheet, dataRow: number): OffSiteWatercourseBaselineSchema {
    // Extract input values from Excel
    // Column mapping (0-indexed) - see docs/excel-column-mappings.md:
    // D (3): Watercourse type
    // E (4): Length (km)
    // H (7): Condition
    // J (9): Strategic Significance
    // M (12): Watercourse encroachment
    // O (14): Riparian encroachment
    // S (18): Spatial risk category
    // X (23): Length retained
    // Y (24): Length enhanced
    // AD (29): Bespoke compensation agreed
    // AE (30): User comments
    // AF (31): Planning Authority Comments
    // AG (32): Habitat Reference Number
    // AH (33): Off-site reference

    return {
        watercourseType: getCellValue(sheet, dataRow, 3), // D
        length: normalizeNumber(getCellValue(sheet, dataRow, 4)), // E
        condition: getCellValue(sheet, dataRow, 7), // H
        strategicSignificance: getCellValue(sheet, dataRow, 9), // J
        watercourseEncroachment: getCellValue(sheet, dataRow, 12), // M
        riparianEncroachment: getCellValue(sheet, dataRow, 14), // O
        spatialRiskCategory: getCellValue(sheet, dataRow, 18), // S
        lengthRetained: normalizeNumber(getCellValue(sheet, dataRow, 23)) || 0, // X
        lengthEnhanced: normalizeNumber(getCellValue(sheet, dataRow, 24)) || 0, // Y
        bespokeCompensation: getCellValue(sheet, dataRow, 29) || undefined, // AD
        userComments: String(getCellValue(sheet, dataRow, 30) || ""), // AE
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 31) || ""), // AF
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 32) || ""), // AG
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, 33) || ""), // AH
    };
}

export function parseOffSiteWatercourseCreationRow(sheet: XLSX.Sheet, dataRow: number): OffSiteWatercourseCreationSchema {
    // Extract input values from Excel
    // Column mapping (0-indexed) - see docs/excel-column-mappings.md:
    // C (2): Watercourse type
    // D (3): Length (km)
    // G (6): Condition
    // I (8): Strategic Significance
    // M (12): Habitat created in advance
    // N (13): Delay starting habitat creation
    // V (21): Extent of encroachment
    // X (23): Extent of encroachment for both banks
    // Z (25): Spatial risk cataegory
    // AD (29): User comments
    // AE (30): Planning Authority Comments
    // AF (31): Habitat Reference Number
    // AG (32): Off-site Reference Number

    return {
        watercourseType: getCellValue(sheet, dataRow, 2), // C
        length: normalizeNumber(getCellValue(sheet, dataRow, 3)), // D
        condition: getCellValue(sheet, dataRow, 6), // G
        strategicSignificance: getCellValue(sheet, dataRow, 8), // I
        habitatCreatedInAdvance: getCellValue(sheet, dataRow, 12), // M
        delayInStarting: getCellValue(sheet, dataRow, 13) || undefined, // N
        watercourseEncroachment: getCellValue(sheet, dataRow, 21), // V
        riparianEncroachment: getCellValue(sheet, dataRow, 23), // X
        spatialRiskCategory: getCellValue(sheet, dataRow, 25), // Z
        userComments: String(getCellValue(sheet, dataRow, 26) || ""), // AD
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 27) || ""), // AE
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 28) || ""), // AF
    };
}

export function parseOffSiteWatercourseEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OffSiteWatercourseEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, 1); // B
    const baselineRow = findRow(baselineSheet, 2, baselineRef); // C
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOffSiteWatercourseBaselineRow(baselineSheet, baselineRow);

    // Extract input values from Excel
    // Column mapping (0-indexed) - based on B-3 sheet structure:
    // B (1): Baseline ref
    // N (13): Proposed habitat type
    // T (19): Proposed condition
    // V (21): Strategic Significance
    // Z (25): Habitat enhanced in advance (years)
    // AA (26): Delay in starting hedgerow enhancement (years)
    // AI (34): Extent of encroachment
    // AK (36): Extent of encroachment for both banks
    // AN (39): User Comments
    // AO (40): Planning Authority Comments
    // AP (41): Habitat Reference Number
    // AQ (42): Off-site Reference Number
    return {
        baseline: baselineData,
        watercourseType: getCellValue(sheet, dataRow, 13), // N
        condition: getCellValue(sheet, dataRow, 19), // T
        strategicSignificance: getCellValue(sheet, dataRow, 21), // V
        watercourseEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, 25)) || 0, // Z
        watercourseEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, 26)) || 0, // AA
        watercourseEncroachment: String(getCellValue(sheet, dataRow, 34) || ""), // AI
        riparianEncroachment: String(getCellValue(sheet, dataRow, 36) || ""), // AI
        userComments: String(getCellValue(sheet, dataRow, 39) || ""), // AN
        planningAuthorityComments: String(getCellValue(sheet, dataRow, 40) || ""), // AO
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, 41) || ""), // AP
    }
}

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
    return {
        broadHabitat: getCellValue(sheet, dataRow, "E"),
        habitatType: getCellValue(sheet, dataRow, "F"),
        irreplaceableHabitat: parseBoolean(getCellValue(sheet, dataRow, "G")),
        area: normalizeNumber(getCellValue(sheet, dataRow, "H")),
        condition: getCellValue(sheet, dataRow, "K"),
        strategicSignificance: getCellValue(sheet, dataRow, "M"),
        areaRetained: normalizeNumber(getCellValue(sheet, dataRow, "S")) || 0,
        areaEnhanced: normalizeNumber(getCellValue(sheet, dataRow, "T")) || 0,
        bespokeCompensationAgreed: getCellValue(sheet, dataRow, "Y") || undefined,
        userComments: String(getCellValue(sheet, dataRow, "Z") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AA") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AB") || ""),
    };
}

export function parseOnSiteHabitatCreationRow(sheet: XLSX.Sheet, dataRow: number): OnSiteHabitatCreationSchema {
    return {
        broadHabitat: getCellValue(sheet, dataRow, "D"),
        habitatType: getCellValue(sheet, dataRow, "E"),
        area: normalizeNumber(getCellValue(sheet, dataRow, "G")),
        condition: getCellValue(sheet, dataRow, "J"),
        strategicSignificance: getCellValue(sheet, dataRow, "L"),
        habitatCreationInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "P")) || 0,
        habitatCreationDelay: normalizeNumber(getCellValue(sheet, dataRow, "Q")) || 0,
        userComments: String(getCellValue(sheet, dataRow, "Z") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AA") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AB") || ""),
    };
};

export function parseOnSiteHabitatEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OnSiteHabitatEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, "E");
    const baselineRow = findRow(baselineSheet, 3, baselineRef); // D
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOnSiteHabitatBaselineRow(baselineSheet, baselineRow);

    return {
        baseline: baselineData,
        broadHabitat: getCellValue(sheet, dataRow, "Q"),
        habitatType: getCellValue(sheet, dataRow, "R"),
        condition: getCellValue(sheet, dataRow, "Y"),
        strategicSignificance: getCellValue(sheet, dataRow, "AA"),
        habitatEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "AE")) || 0,
        habitatEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, "AF")) || 0,
        userComments: String(getCellValue(sheet, dataRow, "AO") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AP") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AQ") || ""),
    }
}


export function parseOffSiteHabitatBaselineRow(sheet: XLSX.Sheet, dataRow: number): OffSiteHabitatBaselineSchema {
    return {
        broadHabitat: getCellValue(sheet, dataRow, "E"),
        habitatType: getCellValue(sheet, dataRow, "F"),
        irreplaceableHabitat: parseBoolean(getCellValue(sheet, dataRow, "G")),
        area: normalizeNumber(getCellValue(sheet, dataRow, "H")),
        condition: getCellValue(sheet, dataRow, "K"),
        strategicSignificance: getCellValue(sheet, dataRow, "M"),
        spatialRiskCategory: getCellValue(sheet, dataRow, "R") || "Low",
        areaRetained: normalizeNumber(getCellValue(sheet, dataRow, "V")) || 0,
        areaEnhanced: normalizeNumber(getCellValue(sheet, dataRow, "W")) || 0,
        bespokeCompensationAgreed: getCellValue(sheet, dataRow, "AB") || undefined,
        userComments: getCellValue(sheet, dataRow, "AC") || undefined,
        planningAuthorityComments: getCellValue(sheet, dataRow, "AD") || undefined,
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AE") || ""),
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, "AF") || ""),
    }
};

export function parseOffSiteHabitatCreationRow(sheet: XLSX.Sheet, dataRow: number): OffSiteHabitatCreationSchema {
    return {
        broadHabitat: getCellValue(sheet, dataRow, "D"),
        habitatType: getCellValue(sheet, dataRow, "E"),
        area: normalizeNumber(getCellValue(sheet, dataRow, "G")),
        condition: getCellValue(sheet, dataRow, "J"),
        strategicSignificance: getCellValue(sheet, dataRow, "L"),
        habitatCreationInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "P")) || 0,
        habitatCreationDelay: normalizeNumber(getCellValue(sheet, dataRow, "Q")) || 0,
        spatialRiskCategory: getCellValue(sheet, dataRow, "Y") || "Low",
        userComments: String(getCellValue(sheet, dataRow, "AC") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AD") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AE") || ""),
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, "AF") || ""),
        baselineReferenceNumber: String(getCellValue(sheet, dataRow, "AG") || ""),
    };
}

export function parseOffSiteHabitatEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OffSiteHabitatEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, "E");
    const baselineRow = findRow(baselineSheet, 3, baselineRef); // D
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOffSiteHabitatBaselineRow(baselineSheet, baselineRow);

    return {
        baseline: baselineData,
        broadHabitat: getCellValue(sheet, dataRow, "Q"),
        habitatType: getCellValue(sheet, dataRow, "R"),
        condition: getCellValue(sheet, dataRow, "Y"),
        strategicSignificance: getCellValue(sheet, dataRow, "AA"),
        habitatEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "AE")) || 0,
        habitatEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, "AF")) || 0,
        userComments: String(getCellValue(sheet, dataRow, "AR") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AS") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AT") || ""),
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, "AU") || ""),
    }
}

export function parseOnSiteHedgerowBaselineRow(sheet: XLSX.Sheet, dataRow: number): OnSiteHedgerowBaselineSchema {
    return {
        habitatType: getCellValue(sheet, dataRow, "D"),
        length: normalizeNumber(getCellValue(sheet, dataRow, "E")),
        condition: getCellValue(sheet, dataRow, "H"),
        strategicSignificance: getCellValue(sheet, dataRow, "J"),
        lengthRetained: normalizeNumber(getCellValue(sheet, dataRow, "P")) || 0,
        lengthEnhanced: normalizeNumber(getCellValue(sheet, dataRow, "Q")) || 0,
        userComments: String(getCellValue(sheet, dataRow, "V") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "W") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "X") || ""),
    }
}

export function parseOnSiteHedgerowCreationRow(sheet: XLSX.Sheet, dataRow: number): OnSiteHedgerowCreationSchema {
    return {
        habitatType: getCellValue(sheet, dataRow, "D"),
        length: normalizeNumber(getCellValue(sheet, dataRow, "E")),
        condition: getCellValue(sheet, dataRow, "H"),
        strategicSignificance: getCellValue(sheet, dataRow, "J"),
        habitatCreatedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "N")) || 0,
        delayInStartingHabitatCreation: normalizeNumber(getCellValue(sheet, dataRow, "O")) || 0,
        userComments: String(getCellValue(sheet, dataRow, "X") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "Y") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "Z") || ""),
    };
}

export function parseOnSiteHedgerowEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OnSiteHedgerowEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, "B");
    const baselineRow = findRow(baselineSheet, 1, baselineRef); // B
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOnSiteHedgerowBaselineRow(baselineSheet, baselineRow);

    return {
        baseline: baselineData,
        habitatType: getCellValue(sheet, dataRow, "M"),
        condition: getCellValue(sheet, dataRow, "S"),
        strategicSignificance: getCellValue(sheet, dataRow, "U"),
        hedgerowEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "Y")) || 0,
        hedgerowEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, "Z")) || 0,
        userComments: String(getCellValue(sheet, dataRow, "AI") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AJ") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AK") || ""),
    }
}

export function parseOffSiteHedgerowBaselineRow(sheet: XLSX.Sheet, dataRow: number): OffSiteHedgerowBaselineSchema {
    return {
        habitatType: getCellValue(sheet, dataRow, "D"),
        length: normalizeNumber(getCellValue(sheet, dataRow, "E")),
        condition: getCellValue(sheet, dataRow, "H"),
        strategicSignificance: getCellValue(sheet, dataRow, "J"),
        spatialRiskCategory: getCellValue(sheet, dataRow, "O") || undefined,
        lengthRetained: normalizeNumber(getCellValue(sheet, dataRow, "S")) || 0,
        lengthEnhanced: normalizeNumber(getCellValue(sheet, dataRow, "T")) || 0,
        userComments: String(getCellValue(sheet, dataRow, "Y") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "Z") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AA") || ""),
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, "AB") || ""),
    };
}

export function parseOffSiteHedgerowEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OffSiteHedgerowEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, "B");
    const baselineRow = findRow(baselineSheet, 1, baselineRef); // B
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOffSiteHedgerowBaselineRow(baselineSheet, baselineRow);

    return {
        baseline: baselineData,
        habitatType: getCellValue(sheet, dataRow, "M"),
        condition: getCellValue(sheet, dataRow, "S"),
        strategicSignificance: getCellValue(sheet, dataRow, "U"),
        hedgerowEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "Y")) || 0,
        hedgerowEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, "Z")) || 0,
        userComments: String(getCellValue(sheet, dataRow, "AL") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AM") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AN") || ""),
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, "AO") || ""),
    }
}

export function parseOffSiteHedgerowCreationRow(sheet: XLSX.Sheet, dataRow: number): OffSiteHedgerowCreationSchema {
    return {
        habitatType: getCellValue(sheet, dataRow, "D"),
        length: normalizeNumber(getCellValue(sheet, dataRow, "E")),
        condition: getCellValue(sheet, dataRow, "H"),
        strategicSignificance: getCellValue(sheet, dataRow, "J"),
        spatialRiskCategory: getCellValue(sheet, dataRow, "M") || undefined,
        habitatCreatedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "P")) || 0,
        delayInStartingHabitatCreation: normalizeNumber(getCellValue(sheet, dataRow, "Q")) || 0,
        userComments: String(getCellValue(sheet, dataRow, "AA") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AB") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AC") || ""),
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, "AD") || ""),
        baselineReferenceNumber: String(getCellValue(sheet, dataRow, "AE") || ""),
    };
}

export function parseOnSiteWatercourseBaselineRow(sheet: XLSX.Sheet, dataRow: number): OnSiteWatercourseBaselineSchema {
    return {
        watercourseType: getCellValue(sheet, dataRow, "D"),
        length: normalizeNumber(getCellValue(sheet, dataRow, "E")),
        condition: getCellValue(sheet, dataRow, "H"),
        strategicSignificance: getCellValue(sheet, dataRow, "J"),
        watercourseEncroachment: getCellValue(sheet, dataRow, "M"),
        riparianEncroachment: getCellValue(sheet, dataRow, "O"),
        lengthRetained: normalizeNumber(getCellValue(sheet, dataRow, "U")) || 0,
        lengthEnhanced: normalizeNumber(getCellValue(sheet, dataRow, "V")) || 0,
        bespokeCompensation: getCellValue(sheet, dataRow, "AA") || undefined,
        userComments: String(getCellValue(sheet, dataRow, "AB") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AC") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AD") || ""),
    };
}

export function parseOnSiteWatercourseCreationRow(sheet: XLSX.Sheet, dataRow: number): OnSiteWatercourseCreationSchema {
    return {
        watercourseType: getCellValue(sheet, dataRow, "C"),
        length: normalizeNumber(getCellValue(sheet, dataRow, "D")),
        condition: getCellValue(sheet, dataRow, "G"),
        strategicSignificance: getCellValue(sheet, dataRow, "I"),
        delayInStarting: getCellValue(sheet, dataRow, "N") || undefined,
        watercourseEncroachment: getCellValue(sheet, dataRow, "V"),
        riparianEncroachment: getCellValue(sheet, dataRow, "X"),
        userComments: String(getCellValue(sheet, dataRow, "AA") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AB") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AC") || ""),
    };
}

export function parseOnSiteWatercourseEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OnSiteWatercourseEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, "B");
    const baselineRow = findRow(baselineSheet, 2, baselineRef); // C
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOnSiteWatercourseBaselineRow(baselineSheet, baselineRow);

    return {
        baseline: baselineData,
        watercourseType: getCellValue(sheet, dataRow, "N"),
        condition: getCellValue(sheet, dataRow, "T"),
        strategicSignificance: getCellValue(sheet, dataRow, "V"),
        watercourseEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "Z")) || 0,
        watercourseEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, "AA")) || 0,
        watercourseEncroachment: String(getCellValue(sheet, dataRow, "AI") || ""),
        riparianEncroachment: String(getCellValue(sheet, dataRow, "AK") || ""),
        userComments: String(getCellValue(sheet, dataRow, "AN") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AO") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AP") || ""),
    }
}



export function parseOffSiteWatercourseBaselineRow(sheet: XLSX.Sheet, dataRow: number): OffSiteWatercourseBaselineSchema {
    return {
        watercourseType: getCellValue(sheet, dataRow, "D"),
        length: normalizeNumber(getCellValue(sheet, dataRow, "E")),
        condition: getCellValue(sheet, dataRow, "H"),
        strategicSignificance: getCellValue(sheet, dataRow, "J"),
        watercourseEncroachment: getCellValue(sheet, dataRow, "M"),
        riparianEncroachment: getCellValue(sheet, dataRow, "O"),
        spatialRiskCategory: getCellValue(sheet, dataRow, "S"),
        lengthRetained: normalizeNumber(getCellValue(sheet, dataRow, "X")) || 0,
        lengthEnhanced: normalizeNumber(getCellValue(sheet, dataRow, "Y")) || 0,
        bespokeCompensation: getCellValue(sheet, dataRow, "AD") || undefined,
        userComments: String(getCellValue(sheet, dataRow, "AE") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AF") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AG") || ""),
        offSiteReferenceNumber: String(getCellValue(sheet, dataRow, "AH") || ""),
    };
}

export function parseOffSiteWatercourseCreationRow(sheet: XLSX.Sheet, dataRow: number): OffSiteWatercourseCreationSchema {
    return {
        watercourseType: getCellValue(sheet, dataRow, "C"),
        length: normalizeNumber(getCellValue(sheet, dataRow, "D")),
        condition: getCellValue(sheet, dataRow, "G"),
        strategicSignificance: getCellValue(sheet, dataRow, "I"),
        habitatCreatedInAdvance: getCellValue(sheet, dataRow, "M"),
        delayInStarting: getCellValue(sheet, dataRow, "N") || undefined,
        watercourseEncroachment: getCellValue(sheet, dataRow, "V"),
        riparianEncroachment: getCellValue(sheet, dataRow, "X"),
        spatialRiskCategory: getCellValue(sheet, dataRow, "Z"),
        userComments: String(getCellValue(sheet, dataRow, "AD") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AE") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AF") || ""),
    };
}

export function parseOffSiteWatercourseEnhancementRow(baselineSheet: XLSX.Sheet, sheet: XLSX.Sheet, dataRow: number): OffSiteWatercourseEnhancementSchema {
    const baselineRef = getCellValue(sheet, dataRow, "B");
    const baselineRow = findRow(baselineSheet, 2, baselineRef); // C
    if (!baselineRow) throw Error("Unable to parse baseline row from ref: " + baselineRef);
    const baselineData = parseOffSiteWatercourseBaselineRow(baselineSheet, baselineRow);

    return {
        baseline: baselineData,
        watercourseType: getCellValue(sheet, dataRow, "N"),
        condition: getCellValue(sheet, dataRow, "T"),
        strategicSignificance: getCellValue(sheet, dataRow, "V"),
        watercourseEnhancedInAdvance: normalizeNumber(getCellValue(sheet, dataRow, "Z")) || 0,
        watercourseEnhancedDelay: normalizeNumber(getCellValue(sheet, dataRow, "AA")) || 0,
        watercourseEncroachment: String(getCellValue(sheet, dataRow, "AI") || ""),
        riparianEncroachment: String(getCellValue(sheet, dataRow, "AK") || ""),
        userComments: String(getCellValue(sheet, dataRow, "AQ") || ""),
        planningAuthorityComments: String(getCellValue(sheet, dataRow, "AR") || ""),
        habitatReferenceNumber: String(getCellValue(sheet, dataRow, "AS") || ""),
    }
}

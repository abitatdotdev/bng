import type { WorkSheet } from 'xlsx';
import { getCellValue, type SheetView } from './excelHelpers';

/** Project metadata entered on the workbook's Start sheet. */
export interface StartPage {
    planningAuthority?: string;
    projectName?: string;
    applicant?: string;
    applicationType?: string;
    planningApplicationReference?: string;
    completedBy?: string;
    dateOfMetricCompletion?: string;
    reviewer?: string;
    calculationIteration?: string | number;
    planningAuthorityReviewer?: string;
    dateOfPlanningAuthorityReview?: string;
    /** Decimal net-gain target: for example, 10% is represented as `0.1`. */
    netGainTarget?: number;
}

function optionalString(value: unknown): string | undefined {
    if (value == null) return undefined;
    const text = String(value).trim();
    return text.length > 0 ? text : undefined;
}

function optionalStringOrNumber(value: unknown): string | number | undefined {
    return typeof value === 'number' && Number.isFinite(value)
        ? value
        : optionalString(value);
}

/** Convert an Excel serial date to a timezone-independent ISO calendar date. */
function excelDate(value: unknown): string | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return optionalString(value);

    // Excel's 1900 date system includes the fictitious 1900-02-29. Using its
    // Unix-epoch offset accounts for that compatibility quirk.
    const milliseconds = Math.round((value - 25569) * 86_400_000);
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

function netGainTarget(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return undefined;

    const text = value.trim();
    if (text.length === 0) return undefined;
    const percentage = text.endsWith('%');
    const parsed = Number(percentage ? text.slice(0, -1) : text);
    if (!Number.isFinite(parsed)) return undefined;
    return percentage ? parsed / 100 : parsed;
}

/** Parse cells F11:F22 from the statutory metric Start sheet. */
export function parseStartPage(sheet: SheetView | WorkSheet): StartPage {
    const value = (excelRow: number) => getCellValue(sheet, excelRow - 1, 5);

    return {
        planningAuthority: optionalString(value(11)),
        projectName: optionalString(value(12)),
        applicant: optionalString(value(13)),
        applicationType: optionalString(value(14)),
        planningApplicationReference: optionalString(value(15)),
        completedBy: optionalString(value(16)),
        dateOfMetricCompletion: excelDate(value(17)),
        reviewer: optionalString(value(18)),
        calculationIteration: optionalStringOrNumber(value(19)),
        planningAuthorityReviewer: optionalString(value(20)),
        dateOfPlanningAuthorityReview: excelDate(value(21)),
        netGainTarget: netGainTarget(value(22)),
    };
}

import { describe, expect, test } from 'bun:test';
import type { WorkBook } from 'xlsx';
import { loadWorkbookFixture, workbookBytes, workbookInput } from '../../test/workbookFixtures';
import {
    offSiteWatercourseBaselineSpec,
    offSiteWatercourseCreationSpec,
    offSiteWatercourseEnhancementSpec,
    type SheetSpec,
} from './columnMappings';
import { parseFile } from './parseFile';
import { parseFileStream } from './streaming/parseFileStream';

function writeRow(workbook: WorkBook, spec: SheetSpec, values: Record<string, string | number>) {
    const sheet = workbook.Sheets[spec.name]!;
    for (const [field, { column }] of Object.entries(spec.columns)) {
        const value = values[field];
        if (value !== undefined) {
            sheet[`${column}${spec.startRow + 1}`] = { t: typeof value === 'number' ? 'n' : 's', v: value };
        }
    }
}

function referenceWorkbook(creationReference: string | number, enhancementReference: string | number) {
    const workbook = loadWorkbookFixture('mixed-onsite-interventions');
    const common = {
        watercourseType: 'Ditches',
        strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
        watercourseEncroachment: 'No Encroachment',
        riparianEncroachment: 'No Encroachment/ No Encroachment',
        spatialRiskCategory: 'Outside operational catchment',
    };
    writeRow(workbook, offSiteWatercourseBaselineSpec, {
        ...common, ref: 1, length: 1, lengthRetained: 0, lengthEnhanced: 0.5,
        condition: 'Poor', offSiteReferenceNumber: 'baseline-site',
    });
    writeRow(workbook, offSiteWatercourseCreationSpec, {
        ...common, length: 0.5, condition: 'Moderate', habitatCreatedInAdvance: 30,
        offSiteReferenceNumber: creationReference,
    });
    writeRow(workbook, offSiteWatercourseEnhancementSpec, {
        ...common, baselineRef: 1, condition: 'Moderate', watercourseEnhancedInAdvance: 30,
        offSiteReferenceNumber: enhancementReference,
    });
    // The existing parser detects F-3 rows by a populated cached AP cell.
    workbook.Sheets[offSiteWatercourseEnhancementSpec.name]!.AP12 = { t: 'n', v: 4 };
    return workbookBytes(workbook);
}

async function streamReferences(bytes: Uint8Array, validate: boolean) {
    const rows = [];
    for await (const result of parseFileStream(bytes, { validate })) {
        if (result.kind === 'offSiteWatercourseCreation' || result.kind === 'offSiteWatercourseEnhancement') {
            rows.push(result.row);
        }
    }
    return rows;
}

describe('watercourse workbook references', () => {
    for (const validate of [true, false]) {
        test(`preserves independent F-2/F-3 references in eager and streaming parsing (validate: ${validate})`, async () => {
            const bytes = referenceWorkbook('creation-site', 'enhancement-site');
            const eager = parseFile(workbookInput(bytes), { validate });
            const creation = eager.offSiteWatercourseCreations[0]!;
            const enhancement = eager.offSiteWatercourseEnhancements[0]!;
            expect(creation.offSiteReferenceNumber).toBe('creation-site');
            expect(enhancement.offSiteReferenceNumber).toBe('enhancement-site');
            expect(enhancement.baseline.offSiteReferenceNumber).toBe('baseline-site');
            expect(await streamReferences(bytes, validate)).toEqual([creation, enhancement]);
        });

        test(`preserves numeric zero references as text (validate: ${validate})`, async () => {
            const bytes = referenceWorkbook(0, 0);
            const eager = parseFile(workbookInput(bytes), { validate });
            expect(eager.offSiteWatercourseCreations[0]!.offSiteReferenceNumber).toBe('0');
            expect(eager.offSiteWatercourseEnhancements[0]!.offSiteReferenceNumber).toBe('0');
            expect((await streamReferences(bytes, validate)).map(row => row.offSiteReferenceNumber)).toEqual(['0', '0']);
        });
    }

    test('checked parsers report missing references while unchecked parsers retain the rows and spatial units', async () => {
        const bytes = referenceWorkbook('', '');
        expect(() => parseFile(workbookInput(bytes))).toThrow("F-2 Off-Site WaterC' Creation");
        await expect(streamReferences(bytes, true)).rejects.toThrow("F-2 Off-Site WaterC' Creation");
        const eager = parseFile(workbookInput(bytes), { validate: false });
        const creation = eager.offSiteWatercourseCreations[0]!;
        const enhancement = eager.offSiteWatercourseEnhancements[0]!;
        expect(creation.unitsDeliveredDecimal.toFixed()).toBe('0');
        expect(creation.netUnitChangeWithSpatialRiskDecimal.toFixed()).toBe('2');
        expect(enhancement.watercourseUnitsDeliveredDecimal.toFixed()).toBe('0');
        expect(enhancement.watercourseUnitsDeliveredWithSpatialRiskDecimal.toFixed()).toBe('2');
        expect(await streamReferences(bytes, false)).toEqual([creation, enhancement]);
    });
});

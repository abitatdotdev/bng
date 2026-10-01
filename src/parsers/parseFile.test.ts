import { describe, expect, test } from 'bun:test';
import XLSX from 'xlsx';
import { parseFile } from './parseFile';
import { headlineResults } from '../headlineResults';
import { tradingSummaries } from '../tradingSummaries';
import { parseFileStream } from './streaming/parseFileStream';
import { allSheetSpecs, type SheetSpec } from './columnMappings';
import type { AllFeatures } from '../features';
import { loadWorkbookFixture, workbookBytes, workbookInput, workbookScenarios } from '../../test/workbookFixtures';

function atPath(value: unknown, path: string): unknown {
    return path.split('.').reduce((current: any, key) => current?.[key], value);
}

describe('parseFile', () => {
    for (const scenario of workbookScenarios) {
        test(scenario.description, () => {
            const bytes = workbookBytes(loadWorkbookFixture(scenario.id));
            const features = parseFile(workbookInput(bytes));
            const trading = tradingSummaries(features);
            const calculated = { features, trading, headline: headlineResults(features, trading) };
            for (const comparison of scenario.comparisons) {
                const actual = atPath(calculated, comparison.libraryPath);
                // Convert the workbook's display labels to the public API's types.
                const expected = comparison.excelValue === 'Yes ✓' ? true
                    : comparison.excelValue === '0.00' ? 0 : comparison.excelValue;
                if (typeof expected === 'number') {
                    expect(typeof actual).toBe('number');
                    expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(1e-8);
                } else {
                    expect(actual).toBe(expected);
                }
            }
            if (scenario.id === 'retained-hedgerows') expect(features.onSiteHedgerowBaselines).toHaveLength(192);
        });
    }

    // Populate each sheet at physical rows 200, 201 and its last valid input row,
    // with long gaps between entries. Include a valid-looking row in the totals
    // position so excluding it depends on range bounds, rather than empty cells.
    test('reads sparse inputs through the last valid row, links late baselines and excludes totals in every sheet', async () => {
        const original = loadWorkbookFixture('mixed-onsite-interventions');
        const workbook = structuredClone(original);
        const expectedBuckets: (keyof AllFeatures)[] = [];
        for (const spec of allSheetSpecs as readonly SheetSpec[]) {
            const sourceName = spec.name.replace(/^[DEF]/, letter => ({ D: 'A', E: 'B', F: 'C' })[letter]!).replace('Off-Site', 'On-Site').replace('Enhancment', 'Enhancement').replace('WaterC Enhancement', "WaterC' Enhancement");
            const sourceSpec = allSheetSpecs.find(s => s.name === sourceName)!;
            const sourceSheet = original.Sheets[sourceName]!;
            const sheet = workbook.Sheets[spec.name]!;
            const sample = Object.fromEntries(Object.entries(sourceSpec.columns).map(([field, column]) => [field, sourceSheet[`${column.column}${sourceSpec.startRow + 1}`]]));
            for (const key of Object.keys(sheet)) {
                if (!key.startsWith('!') && XLSX.utils.decode_cell(key).r >= spec.startRow) delete sheet[key];
            }
            const isBaseline = spec.name.includes('Baseline');
            const baselineSpec = allSheetSpecs.find(s => s.name.startsWith(spec.name.slice(0, 1) + '-1'))!;
            for (const row of [199, 200, spec.endRow - 1, spec.endRow]) {
                for (const [field, column] of Object.entries(spec.columns)) {
                    let cell = sample[field];
                    if (field === 'ref' && isBaseline) cell = { t: 'n', v: row + 1 };
                    if (field === 'baselineRef') cell = { t: 'n', v: baselineSpec.endRow };
                    if (field === 'habitatReferenceNumber') cell = { t: 's', v: `${spec.name}:${row + 1}` };
                    if (field === 'offSiteReferenceNumber') cell = { t: 's', v: 'gain-site' };
                    if (field === 'spatialRiskCategory') cell = { t: 's', v: /^[CF]/.test(spec.name) ? 'Within waterbody catchment' : 'Compensation inside LPA boundary or NCA of impact site' };
                    if (cell) sheet[`${column.column}${row + 1}`] = { ...cell, f: undefined };
                }
                // Some sheets detect rows using a calculated column outside the inputs.
                const detection = `${spec.dataDetectionColumn}${row + 1}`;
                if (!sheet[detection]) sheet[detection] = { t: 'n', v: 1 };
            }
            sheet['!ref'] = 'A1:BZ260';
            const site = /^[ABC]/.test(spec.name) ? 'onSite' : 'offSite';
            const family = /Habitat/.test(spec.name) ? 'Habitat' : /Hedge/.test(spec.name) ? 'Hedgerow' : 'Watercourse';
            const action = isBaseline ? 'Baseline' : spec.name.includes('Creation') ? 'Creation' : 'Enhancement';
            expectedBuckets.push(`${site}${family}${action}s` as keyof AllFeatures);
        }
        const bytes = workbookBytes(workbook);
        const eager = parseFile(workbookInput(bytes));
        for (const key of expectedBuckets) {
            expect(eager[key]).toHaveLength(3);
            const spec = allSheetSpecs[expectedBuckets.indexOf(key)]!;
            expect(eager[key].map(row => row.habitatReferenceNumber)).toEqual([200, 201, spec.endRow].map(r => `${spec.name}:${r}`));
            if (key.includes('Enhancement')) {
                for (const row of eager[key] as { baseline: { habitatReferenceNumber?: string } }[]) {
                    const baselineSpec = allSheetSpecs.find(s => s.name.startsWith(spec.name[0] + '-1'))!;
                    expect(row.baseline.habitatReferenceNumber).toBe(`${baselineSpec.name}:${baselineSpec.endRow}`);
                }
            }
        }
        const streamed = Object.fromEntries(expectedBuckets.map(key => [key, []])) as unknown as AllFeatures;
        for await (const result of parseFileStream(bytes)) (streamed[`${result.kind}s` as keyof AllFeatures] as unknown[]).push(result.row);
        const { startPage, ...rows } = eager;
        expect(streamed).toEqual(rows);
    });
});

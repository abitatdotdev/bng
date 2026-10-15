import { describe, expect, test } from 'bun:test';
import * as node from '../index';
import * as browser from '../browser';
import { buildInputsJsonSchema } from '../../scripts/generateJsonSchema';

const baseline = {
    watercourseType: 'Ditches',
    length: '1',
    lengthEnhanced: '0.5',
    condition: 'Poor',
    strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
    watercourseEncroachment: 'No Encroachment',
    riparianEncroachment: 'No Encroachment/ No Encroachment',
    spatialRiskCategory: 'Outside operational catchment',
    offSiteReferenceNumber: 'baseline-site',
} as const;

const cases = [
    {
        key: 'offSiteWatercourseCreations',
        row: {
            ...baseline,
            condition: 'Moderate',
            length: '0.5',
            habitatCreatedInAdvance: 30,
        },
    },
    {
        key: 'offSiteWatercourseEnhancements',
        row: {
            baseline,
            watercourseType: 'Ditches',
            condition: 'Moderate',
            strategicSignificance: baseline.strategicSignificance,
            watercourseEncroachment: baseline.watercourseEncroachment,
            riparianEncroachment: baseline.riparianEncroachment,
            watercourseEnhancedInAdvance: 30,
        },
    },
] as const;

function contributions(row: node.OffSiteWatercourseCreation | node.OffSiteWatercourseEnhancement) {
    return 'unitsDelivered' in row
        ? { raw: row.unitsDelivered, exact: row.unitsDeliveredDecimal, spatial: row.netUnitChangeWithSpatialRiskDecimal }
        : { raw: row.watercourseUnitsDelivered, exact: row.watercourseUnitsDeliveredDecimal, spatial: row.watercourseUnitsDeliveredWithSpatialRiskDecimal };
}

for (const entry of cases) {
    describe(entry.key, () => {
        for (const validate of [true, false]) {
            test(`preserves the independent reference through Node/browser parsing (validate: ${validate})`, () => {
                const reference = '  gain-site 🌿  ';
                const input = { [entry.key]: [{ ...entry.row, offSiteReferenceNumber: reference }] };
                for (const api of [node, browser]) {
                    const result = api.featuresFromInput(input, { validate });
                    expect(result.issues).toEqual([]);
                    const row = result.features[entry.key][0]!;
                    expect(row.offSiteReferenceNumber).toBe(reference);
                    expect(contributions(row).raw).toBe(4);
                    expect(contributions(row).exact.toFixed()).toBe('4');
                    expect(contributions(row).spatial.toFixed()).toBe('2');
                    if ('baseline' in row) {
                        expect(row.baseline.offSiteReferenceNumber).toBe('baseline-site');
                    }
                }
            });
        }

        for (const reference of [undefined, '']) {
            test(`reports a missing reference at the input field (${JSON.stringify(reference)})`, () => {
                const validRow = { ...entry.row, offSiteReferenceNumber: 'valid-site' };
                const missingRow = { ...entry.row, offSiteReferenceNumber: reference };
                const input = { [entry.key]: [validRow, missingRow] };
                for (const api of [node, browser]) {
                    const checked = api.featuresFromInput(input);
                    expect(checked.features[entry.key]).toHaveLength(1);
                    expect(checked.issues).toEqual([{
                        sheet: entry.key,
                        index: 1,
                        issues: { nested: { offSiteReferenceNumber: ['Off-site reference required ▲'] } },
                    }]);

                    const unchecked = api.featuresFromInput(input, { validate: false });
                    expect(unchecked.issues).toEqual([]);
                    expect(unchecked.features[entry.key]).toHaveLength(2);
                    const row = unchecked.features[entry.key][1]!;
                    expect(row.offSiteReferenceNumber).toBe(reference);
                    expect(contributions(row).raw).toBe(0);
                    expect(contributions(row).exact.toFixed()).toBe('0');
                    expect(contributions(row).spatial.toFixed()).toBe('2');
                }
            });
        }

        test('preserves whitespace as content under the workbook literal-empty reference check', () => {
            for (const api of [node, browser]) {
                for (const validate of [true, false]) {
                    const result = api.featuresFromInput({
                        [entry.key]: [{ ...entry.row, offSiteReferenceNumber: '   ' }],
                    }, { validate });
                    expect(result.issues).toEqual([]);
                    const row = result.features[entry.key][0]!;
                    expect(row.offSiteReferenceNumber).toBe('   ');
                    expect(contributions(row).exact.toFixed()).toBe('4');
                }
            }
        });

        test('rejects malformed reference inputs in checked and unchecked modes', () => {
            for (const validate of [true, false]) {
                for (const reference of [0, {}, null]) {
                    const result = node.featuresFromInput({
                        [entry.key]: [{ ...entry.row, offSiteReferenceNumber: reference }],
                    } as unknown as node.BngInput, { validate });
                    expect(result.features[entry.key]).toHaveLength(0);
                    expect(result.issues[0]).toMatchObject({
                        issues: { nested: { offSiteReferenceNumber: expect.any(Array) } },
                    });
                }
            }
        });
    });
}

test('publishes independent optional reference inputs in JSON Schema', () => {
    const schema = buildInputsJsonSchema();
    for (const key of ['offSiteWatercourseCreation', 'offSiteWatercourseEnhancement']) {
        const row = schema.$defs[key] as { properties: { offSiteReferenceNumber: { type: string } }; required?: string[] };
        expect(row?.properties?.offSiteReferenceNumber?.type).toBe('string');
        expect(row?.required ?? []).not.toContain('offSiteReferenceNumber');
    }
});

import { describe, expect, test } from 'bun:test';
import { parseFile } from './parseFile';

const SAMPLE = './examples/simple-unlocked.xlsm';

describe('parseFile({ validate: false })', () => {
    test('produces the same row counts as the validated parse on a clean workbook', () => {
        const validated = parseFile(SAMPLE);
        const unchecked = parseFile(SAMPLE, { validate: false });

        const sheetKeys = Object.keys(validated).filter(k => k !== '__id') as Array<
            Exclude<keyof typeof validated, '__id'>
        >;

        for (const key of sheetKeys) {
            expect((unchecked[key] as unknown[]).length).toBe(
                (validated[key] as unknown[]).length,
            );
        }
    });

    test('produces the same numeric unit values as the validated parse on a clean workbook', () => {
        const validated = parseFile(SAMPLE);
        const unchecked = parseFile(SAMPLE, { validate: false });

        // Spot-check a few representative numeric fields across feature types.
        const totalsValidated = {
            baseline: validated.onSiteHabitatBaselines.reduce(
                (acc, r) => acc + (r.baselineUnitsRetained ?? 0),
                0,
            ),
            creation: validated.onSiteHabitatCreations.reduce(
                (acc, r) => acc + (r.habitatUnitsDelivered ?? 0),
                0,
            ),
            hedgerow: validated.onSiteHedgerowBaselines.reduce(
                (acc, r) => acc + (r.totalHedgerowUnits ?? 0),
                0,
            ),
        };
        const totalsUnchecked = {
            baseline: unchecked.onSiteHabitatBaselines.reduce(
                (acc, r) => acc + (r.baselineUnitsRetained ?? 0),
                0,
            ),
            creation: unchecked.onSiteHabitatCreations.reduce(
                (acc, r) => acc + (r.habitatUnitsDelivered ?? 0),
                0,
            ),
            hedgerow: unchecked.onSiteHedgerowBaselines.reduce(
                (acc, r) => acc + (r.totalHedgerowUnits ?? 0),
                0,
            ),
        };

        expect(totalsUnchecked.baseline).toBeCloseTo(totalsValidated.baseline, 8);
        expect(totalsUnchecked.creation).toBeCloseTo(totalsValidated.creation, 8);
        expect(totalsUnchecked.hedgerow).toBeCloseTo(totalsValidated.hedgerow, 8);
    });
});

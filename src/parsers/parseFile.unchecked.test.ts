import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { parseFile } from './parseFile';
import { onSiteHabitatBaselineUncheckedSchema } from '../onSite/habitatBaseline';

const SAMPLE = './examples/simple-unlocked.xlsm';
const validated = parseFile(SAMPLE);
const unchecked = parseFile(SAMPLE, { validate: false });

describe('parseFile({ validate: false })', () => {
    test('produces the same row counts as the validated parse on a clean workbook', () => {
        const sheetKeys = Object.keys(validated) as Array<keyof typeof validated>;

        for (const key of sheetKeys) {
            expect((unchecked[key] as unknown[]).length).toBe(
                (validated[key] as unknown[]).length,
            );
        }
    });

    test('a row with an invalid habitat combination produces undefined (never NaN) unit values', () => {
        // broadHabitat and habitatType are both valid picklist entries individually,
        // but their combination is invalid — habitatByBroadAndType returns undefined,
        // so enrichWithHabitatData throws and safeTransform passes the row through.
        const result = v.safeParse(onSiteHabitatBaselineUncheckedSchema, {
            broadHabitat: 'Grassland',
            habitatType: 'Fens (upland and lowland)',
            irreplaceableHabitat: false,
            area: 2,
            condition: 'Good',
            strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
            areaRetained: 1,
            areaEnhanced: 0,
            bespokeCompensationAgreed: 'No',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: '',
        });

        expect(result.success).toBe(true);
        if (!result.success) return;

        const row = result.output as Record<string, unknown>;
        const numericFields = [
            'distinctivenessScore',
            'conditionScore',
            'strategicSignificanceMultiplier',
            'baselineUnitsRetained',
            'baselineUnitsEnhanced',
            'areaHabitatLost',
            'totalHabitatUnits',
            'unitsLost',
            'vhdhBespokeCompensationUnits',
        ];
        for (const field of numericFields) {
            const value = row[field];
            expect(typeof value === 'number' ? Number.isNaN(value) : false).toBe(false);
        }
    });

    test('produces the same numeric unit values as the validated parse on a clean workbook', () => {
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

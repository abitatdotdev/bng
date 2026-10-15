import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import {
    onSiteHedgerowEnhancementSchema,
    onSiteHedgerowEnhancementUncheckedSchema,
} from './onSite/hedgerowEnhancement';
import {
    offSiteHedgerowEnhancementSchema,
    offSiteHedgerowEnhancementUncheckedSchema,
} from './offSite/hedgerowEnhancement';

const strategicSignificance = 'Area/compensation not in local strategy/ no local strategy';
const spatialRiskCategory =
    'Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA';
const sites = [
    {
        name: 'on-site',
        checked: onSiteHedgerowEnhancementSchema,
        unchecked: onSiteHedgerowEnhancementUncheckedSchema,
    },
    {
        name: 'off-site',
        checked: offSiteHedgerowEnhancementSchema,
        unchecked: offSiteHedgerowEnhancementUncheckedSchema,
    },
] as const;
const movements = [
    {
        baseline: 'Species-rich native hedgerow',
        proposed: 'Native hedgerow with trees',
        condition: 'Moderate',
        message: 'Error - Enhancement not possible ▲',
    },
    {
        baseline: 'Non-native and ornamental hedgerow',
        proposed: 'Native hedgerow',
        condition: 'Poor',
        message: 'Error - Enhancement not possible ▲',
    },
    {
        baseline: 'Native hedgerow with trees',
        proposed: 'Native hedgerow',
        condition: 'Moderate',
        message: 'Error Trading Down ▲',
    },
] as const;
const timings = [
    { name: 'ordinary timing', hedgerowEnhancedInAdvance: 0, hedgerowEnhancedDelay: 0 },
    { name: 'advance 30+', hedgerowEnhancedInAdvance: '30+', hedgerowEnhancedDelay: 0 },
    { name: 'delay 30+', hedgerowEnhancedInAdvance: 0, hedgerowEnhancedDelay: '30+' },
] as const;

function baseline(habitatType: (typeof movements)[number]['baseline'] | 'Native hedgerow') {
    return {
        habitatType,
        condition: 'Poor',
        length: '0.5',
        lengthRetained: '0.3',
        lengthEnhanced: '0.2',
        strategicSignificance,
        spatialRiskCategory,
        offSiteReferenceNumber: 'baseline-site',
    } as const;
}

for (const site of sites) {
    describe(site.name, () => {
        for (const movement of movements) {
            for (const timing of timings) {
                test(`withholds ${movement.baseline} to ${movement.proposed} with ${timing.name}`, () => {
                    const input = {
                        baseline: baseline(movement.baseline),
                        habitatType: movement.proposed,
                        condition: movement.condition,
                        strategicSignificance,
                        habitatReferenceNumber: 'editable-row',
                        offSiteReferenceNumber: 'enhancement-site',
                        userComments: 'Preserve the proposed movement',
                        ...timing,
                    };
                    const checked = v.safeParse(site.checked, input);
                    expect(checked.success).toBeFalse();
                    if (!checked.success) {
                        expect(v.flatten(checked.issues).nested?.habitatType).toContain(
                            movement.message,
                        );
                    }

                    const row = v.parse(site.unchecked, input);
                    expect(row.habitatType).toBe(movement.proposed);
                    expect(row.userComments).toBe(input.userComments);
                    expect(row.habitatReferenceNumber).toBe('editable-row');
                    expect(row.hedgerowEnhancedInAdvance).toBe(timing.hedgerowEnhancedInAdvance);
                    expect(row.hedgerowEnhancedDelay).toBe(timing.hedgerowEnhancedDelay);
                    expect(row.length).toBe(0.2);
                    expect(row.lengthDecimal.toFixed()).toBe('0.2');
                    expect(row.baseline.lengthRetained).toBe(0.3);
                    expect(row.baseline.unitsRetained).toBeGreaterThan(0);
                    expect(row.baseline.totalHedgerowUnits).toBeGreaterThan(0);
                    expect(row.hedgerowUnitsDelivered).toBe(0);
                    expect(row.hedgerowUnitsDeliveredDecimal.toFixed()).toBe('0');
                    expect(row.enhancementMovement.rule).toBe('hedgerow-enhancement-movement');
                    expect(row.enhancementMovement.status).toBe('forbidden');
                    expect(row.enhancementMovement.message).toBe(movement.message);
                    expect(row.enhancementMovement.unavailableResults).toMatchObject({
                        timeToTargetCondition: 'check-data',
                        finalTimeToTargetCondition: 'check-data',
                        temporalMultiplier: 'check-data',
                        appliedDifficultyMultiplier: 'check-data',
                        finalDifficultyOfEnhancement: 'check-data',
                        hedgerowUnitsDelivered: 'blank',
                    });
                    expect(row.enhancementMovement.unavailableResults).not.toHaveProperty(
                        'difficultyMultiplierApplied',
                    );
                    expect(row.enhancementMovement.unavailableResults).not.toHaveProperty(
                        'standardDifficultyOfEnhancement',
                    );
                    expect(row.difficultyMultiplierApplied).toBe(1);
                    expect(row.difficultyMultiplierAppliedDecimal.toFixed()).toBe('1');
                    if ('hedgerowUnitsDeliveredWithSpatialRisk' in row) {
                        expect(row.offSiteReferenceNumber).toBe('enhancement-site');
                        expect(row.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);
                        expect(row.hedgerowUnitsDeliveredWithSpatialRiskDecimal.toFixed()).toBe('0');
                        expect(row.enhancementMovement.unavailableResults).toMatchObject({
                            finalTimeToTargetMultiplier: 'check-data',
                            hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
                        });
                    }
                });
            }
        }

        test('keeps a supported movement available, including genuinely zero delivery', () => {
            for (const lengthEnhanced of ['0.2', '0']) {
                const input = {
                    baseline: { ...baseline('Native hedgerow'), lengthEnhanced },
                    habitatType: 'Native hedgerow',
                    condition: 'Moderate',
                    strategicSignificance,
                };
                for (const schema of [site.checked, site.unchecked]) {
                    const row = v.parse(schema, input);
                    expect(row.enhancementMovement.status).toBe('allowed');
                    expect(row.enhancementMovement.unavailableResults).toEqual({});
                    if (lengthEnhanced === '0') {
                        expect(row.hedgerowUnitsDeliveredDecimal.isZero()).toBeTrue();
                    } else {
                        expect(row.hedgerowUnitsDeliveredDecimal.gt(0)).toBeTrue();
                    }
                }
            }
        });

        test('keeps movement availability independent of condition and timing failures', () => {
            const input = {
                baseline: baseline('Native hedgerow'),
                habitatType: 'Native hedgerow',
                condition: 'Moderate',
                strategicSignificance,
            };
            for (const rowInput of [
                { ...input, baseline: { ...input.baseline, condition: 'Good' } },
                { ...input, hedgerowEnhancedInAdvance: '30+', hedgerowEnhancedDelay: 5 },
            ]) {
                const row = v.parse(site.unchecked, rowInput);
                expect(row.enhancementMovement.status).toBe('allowed');
                expect(row.enhancementMovement.unavailableResults).toEqual({});
                expect(row.hedgerowUnitsDeliveredDecimal.isZero()).toBe(rowInput.baseline.condition === 'Good');
                expect(v.safeParse(site.checked, rowInput).success).toBeFalse();
            }
        });
    });
}

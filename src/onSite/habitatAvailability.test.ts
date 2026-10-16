import { describe, expect, it } from 'bun:test';
import { Decimal } from '../decimal';
import { applyOnSiteHabitatCreationTiming, applyOnSiteHabitatEnhancementAvailability, onSiteAreaBaselineAvailability } from './habitatAvailability';

describe('on-site habitat baseline availability', () => {
    const input = {
        area: 1,
        areaDecimal: new Decimal(1),
        areaRetained: 0.25,
        areaRetainedDecimal: new Decimal('0.25'),
        areaEnhanced: 0.25,
        areaEnhancedDecimal: new Decimal('0.25'),
        irreplaceableHabitat: false,
        requiredAction: 'Same habitat required – bespoke compensation option ⚠' as const,
        bespokeCompensationAgreed: 'No' as const,
    };

    it('preserves independent baseline results on allocation overrun and prioritizes its message', () => {
        const state = onSiteAreaBaselineAvailability({
            ...input,
            area: 0.4,
            areaDecimal: new Decimal('0.4'),
            bespokeCompensationAgreed: 'Yes',
        });

        expect(state).toMatchObject({
            areaHabitatLost: false,
            unitsLost: false,
            totalHabitatUnits: true,
            rule: 'allocation-overrun',
            message: 'Error in Areas ▲',
        });
        expect(state.lossReason).toBeUndefined();
        expect(state.unavailableResults).toEqual({ areaHabitatLost: 'check-data', unitsLost: 'check-data' });
    });

    it('marks agreed compensation as an alternative and preserves the on-site pending label', () => {
        expect(onSiteAreaBaselineAvailability({ ...input, bespokeCompensationAgreed: 'Yes' })).toMatchObject({
            unitsLost: false,
            lossReason: 'alternative-compensation',
            lossMessage: 'Alternative Compensation ✓',
            unavailableResults: { unitsLost: 'check-data' },
        });
        expect(onSiteAreaBaselineAvailability({ ...input, bespokeCompensationAgreed: 'Pending' }).lossMessage)
            .toBe('Bespoke compensation must be agreed ▲');
    });

    it('gates an uncompensated irreplaceable loss without hiding the loss-area result', () => {
        const state = onSiteAreaBaselineAvailability({ ...input, irreplaceableHabitat: true });
        expect(state).toMatchObject({
            areaHabitatLost: true,
            totalHabitatUnits: false,
            vhdhBespokeCompensationUnits: false,
            rule: 'irreplaceable-loss-uncompensated',
            message: 'Any loss unacceptable',
            unavailableResults: {
                totalHabitatUnits: 'blank',
                vhdhBespokeCompensationUnits: 'blank',
            },
        });
    });
});

describe('on-site habitat enhancement and creation availability', () => {
    const enhancement = {
        habitatUnitsDelivered: 6,
        habitatUnitsDeliveredDecimal: new Decimal(6),
        habitatEnhancedInAdvance: 0 as number | '30+',
        habitatEnhancedDelay: 0 as number | '30+',
        area: 1,
        baseline: { irreplaceableHabitat: false, broadHabitat: 'Grassland' },
        movementAllowed: true,
        conditionAllowed: true,
    };

    it('uses movement, tree, condition, then timing precedence and zeroes raw delivery', () => {
        const cases = [
            [{ movementAllowed: false, baseline: { irreplaceableHabitat: true, broadHabitat: 'Individual trees' }, conditionAllowed: false, habitatEnhancedInAdvance: 1, habitatEnhancedDelay: 1 }, 'invalid-enhancement-movement', 'Check Data ⚠'],
            [{ baseline: { irreplaceableHabitat: true, broadHabitat: 'Individual trees' }, conditionAllowed: false, habitatEnhancedInAdvance: 1, habitatEnhancedDelay: 1 }, 'irreplaceable-individual-tree-enhancement', 'Error - you cannot enhance irreplaceable individual trees ▲'],
            [{ conditionAllowed: false, habitatEnhancedInAdvance: 1, habitatEnhancedDelay: 1 }, 'invalid-enhancement-condition', 'Error - condition cannot be reduced ▲'],
            [{ habitatEnhancedInAdvance: 1, habitatEnhancedDelay: 1 }, 'enhancement-timing-conflict', 'Error -both advance and delayed habitat creation ▲'],
        ] as const;

        for (const [changes, rule, message] of cases) {
            const row = applyOnSiteHabitatEnhancementAvailability({ ...enhancement, ...changes });
            expect(row.habitatUnitsDelivered).toBe(0);
            expect(row.habitatUnitsDeliveredDecimal.toNumber()).toBe(0);
            expect(row.areaCalculationAvailability).toMatchObject({ rule, message });
        }
    });

    it('zeros delivery for a timing conflict and exposes only the workbook timing results', () => {
        const row = applyOnSiteHabitatCreationTiming({
            habitatCreationInAdvance: '30+',
            habitatCreationDelay: 1,
            habitatUnitsDelivered: 5,
            habitatUnitsDeliveredDecimal: new Decimal(5),
        });
        expect(row.habitatUnitsDelivered).toBe(0);
        expect(row.habitatUnitsDeliveredDecimal.toNumber()).toBe(0);
        expect(row.creationTiming).toMatchObject({
            status: 'forbidden',
            message: 'Error -both advance and delayed habitat creation ▲',
            unavailableResults: {
                finalTimeToTargetCondition: 'check-data',
                finalTimeToTargetMultiplier: 'check-data',
                habitatUnitsDelivered: 'blank',
            },
        });
    });
});

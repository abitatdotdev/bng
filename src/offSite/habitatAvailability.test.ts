import { describe, expect, it } from 'bun:test';
import { Decimal } from '../decimal';
import { offSiteAreaBaselineAvailability, applyOffSiteHabitatCreationAvailability, applyOffSiteHabitatEnhancementAvailability } from './habitatAvailability';

describe('off-site habitat baseline availability', () => {
    const input = {
        area: 1,
        areaDecimal: new Decimal(1),
        areaRetained: 0.25,
        areaRetainedDecimal: new Decimal('0.25'),
        areaEnhanced: 0.25,
        areaEnhancedDecimal: new Decimal('0.25'),
        irreplaceableHabitat: false,
        requiredAction: 'Bespoke compensation likely to be required' as const,
        bespokeCompensationAgreed: 'No' as const,
    };

    it('gates formula-dependent results for a literal empty reference and keeps whitespace present', () => {
        const missing = offSiteAreaBaselineAvailability({ ...input, offSiteReferenceNumber: '' });
        expect(missing).toMatchObject({
            totalHabitatUnits: false,
            totalHabitatUnitsSRM: false,
            vhdhBespokeCompensationUnits: false,
            areaHabitatLost: true,
            unavailableResults: {
                totalHabitatUnits: 'blank',
                totalHabitatUnitsSRM: 'blank',
                vhdhBespokeCompensationUnits: 'blank',
            },
        });
        expect(offSiteAreaBaselineAvailability({ ...input, offSiteReferenceNumber: ' ' }).totalHabitatUnits).toBeTrue();
    });

    it('keeps the off-site pending compensation label', () => {
        const row = offSiteAreaBaselineAvailability({
            ...input,
            requiredAction: 'Same habitat required – bespoke compensation option ⚠',
            bespokeCompensationAgreed: 'Pending',
            offSiteReferenceNumber: 'GS-01',
        });
        expect(row.lossMessage).toBe('Bespoke compensation must be agreed  ▲');
    });
});

describe('off-site habitat enhancement and creation availability', () => {
    const enhancement = {
        habitatUnitsDelivered: 6,
        habitatUnitsDeliveredDecimal: new Decimal(6),
        habitatUnitsDeliveredWithSpatialRisk: 3,
        habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(3),
        habitatEnhancedInAdvance: 0 as number | '30+',
        habitatEnhancedDelay: 0 as number | '30+',
        area: 1,
        baseline: { irreplaceableHabitat: false, broadHabitat: 'Grassland' },
        _baselineHabitat: { label: 'Grassland - Other neutral grassland' },
        _habitat: { label: 'Grassland - Other neutral grassland' },
        movementAllowed: true,
        conditionAllowed: true,
        offSiteReferenceNumber: 'GS-01',
    };

    it('applies movement, tree, condition, timing, then reference precedence', () => {
        const cases = [
            [{ movementAllowed: false, conditionAllowed: false, habitatEnhancedInAdvance: 1, habitatEnhancedDelay: 1, offSiteReferenceNumber: '' }, 'invalid-enhancement-movement', 'Check Data ⚠'],
            [{ baseline: { irreplaceableHabitat: true, broadHabitat: 'Individual trees' }, conditionAllowed: false, habitatEnhancedInAdvance: 1, habitatEnhancedDelay: 1, offSiteReferenceNumber: '' }, 'irreplaceable-individual-tree-enhancement', 'Error - you cannot enhance irreplaceable individual trees ▲'],
            [{ conditionAllowed: false, habitatEnhancedInAdvance: 1, habitatEnhancedDelay: 1, offSiteReferenceNumber: '' }, 'invalid-enhancement-condition', 'Error - condition cannot be reduced ▲'],
            [{ habitatEnhancedInAdvance: 1, habitatEnhancedDelay: 1, offSiteReferenceNumber: '' }, 'enhancement-timing-conflict', 'Error -both advance and delayed habitat creation ▲'],
            [{ offSiteReferenceNumber: '' }, 'off-site-reference-required', 'Off-site reference required ▲'],
        ] as const;

        for (const [changes, rule, message] of cases) {
            const row = applyOffSiteHabitatEnhancementAvailability({ ...enhancement, ...changes });
            expect(row.areaCalculationAvailability).toMatchObject({ rule, message });
        }
    });

    it('keeps spatial delivery on reference-only failure and gates both contributions on condition failure', () => {
        const referenceOnly = applyOffSiteHabitatEnhancementAvailability({ ...enhancement, offSiteReferenceNumber: '' });
        expect(referenceOnly.habitatUnitsDelivered).toBe(0);
        expect(referenceOnly.habitatUnitsDeliveredWithSpatialRisk).toBe(3);
        expect(referenceOnly.habitatUnitsDeliveredWithSpatialRiskDecimal.toNumber()).toBe(3);

        const semanticFailure = applyOffSiteHabitatEnhancementAvailability({ ...enhancement, conditionAllowed: false });
        expect(semanticFailure.habitatUnitsDelivered).toBe(0);
        expect(semanticFailure.habitatUnitsDeliveredWithSpatialRisk).toBe(0);
        expect(semanticFailure.habitatUnitsDeliveredWithSpatialRiskDecimal.toNumber()).toBe(0);
    });

    it('retains the D-3 raw tree gate independently from spatial delivery', () => {
        const row = applyOffSiteHabitatEnhancementAvailability({
            ...enhancement,
            baseline: { irreplaceableHabitat: true, broadHabitat: 'Individual trees' },
            _baselineHabitat: { label: 'Individual trees - Rural tree' },
            _habitat: { label: 'Woodland and forest - Other coniferous woodland' },
        });
        expect(row.habitatUnitsDelivered).toBe(0);
        expect(row.habitatUnitsDeliveredDecimal.toNumber()).toBe(0);
        expect(row.habitatUnitsDeliveredWithSpatialRisk).toBe(3);
        expect(row.areaCalculationAvailability).toMatchObject({
            habitatUnitsDelivered: false,
            habitatUnitsDeliveredWithSpatialRisk: true,
            rule: 'irreplaceable-individual-tree-enhancement',
            message: 'Error - you cannot enhance irreplaceable individual trees ▲',
            unavailableResults: { habitatUnitsDelivered: 'blank' },
        });
    });

    it('merges creation timing failure with independent raw reference failure', () => {
        const row = applyOffSiteHabitatCreationAvailability({
            habitatCreationInAdvance: 5,
            habitatCreationDelay: 3,
            habitatUnitsDelivered: 4,
            habitatUnitsDeliveredDecimal: new Decimal(4),
            habitatUnitsDeliveredWithSpatialRisk: 2,
            habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(2),
            finalTimeToTargetCondition: 1,
            finalTimeToTargetMultiplier: 1,
            spatialRiskCategory: 'This metric is being used by an off-site provider',
            offSiteReferenceNumber: '',
        });
        expect(row.areaCalculationAvailability).toMatchObject({
            rule: 'off-site-reference-required',
            status: 'forbidden',
            unavailableResults: {
                habitatUnitsDelivered: 'blank',
                habitatUnitsDeliveredWithSpatialRisk: 'blank',
                finalTimeToTargetCondition: 'check-data',
                finalTimeToTargetMultiplier: 'check-data',
            },
        });
        expect(row.habitatUnitsDelivered).toBe(0);
        expect(row.habitatUnitsDeliveredWithSpatialRisk).toBe(0);
    });
});

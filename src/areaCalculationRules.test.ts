import { describe, expect, it } from 'bun:test';
import { Decimal } from './decimal';
import {
    applyAreaEnhancementAvailability,
    areaBaselineAvailability,
    calculateAreaEnhancementMovement,
    hasAreaEnhancementTimingConflict,
    isAreaAllocationOverrun,
    isAreaReferencePresent,
} from './areaCalculationRules';
import type { AreaEnhancementMovementInput } from './areaCalculationTypes';

const movementInput = (changes: Partial<AreaEnhancementMovementInput> = {}): AreaEnhancementMovementInput => ({
    requiredAction: 'Same broad habitat or a higher distinctiveness habitat required (≥)',
    baselineLabel: 'Grassland - Other neutral grassland',
    proposedLabel: 'Grassland - Other neutral grassland',
    baselineBroadHabitat: 'Grassland',
    proposedBroadHabitat: 'Grassland',
    proposedHabitatType: 'Other neutral grassland',
    baselineDistinctivenessCategory: 'Medium',
    proposedDistinctivenessCategory: 'Medium',
    baselineDistinctivenessScore: 4,
    proposedDistinctivenessScore: 4,
    baselineCondition: 'Moderate',
    proposedCondition: 'Good',
    baselineConditionScore: 2,
    proposedConditionScore: 3,
    irreplaceableHabitat: false,
    offSite: false,
    ...changes,
});

const baselineInput = (changes: Partial<Parameters<typeof areaBaselineAvailability>[0]> = {}) => ({
    area: 1,
    areaDecimal: new Decimal(1),
    areaRetained: 0.25,
    areaRetainedDecimal: new Decimal('0.25'),
    areaEnhanced: 0.25,
    areaEnhancedDecimal: new Decimal('0.25'),
    irreplaceableHabitat: false,
    requiredAction: 'Same habitat required – bespoke compensation option ⚠' as const,
    bespokeCompensationAgreed: 'No' as const,
    ...changes,
});

describe('area baseline calculation rules', () => {
    it('detects allocation overrun using exact Decimal companions', () => {
        expect(isAreaAllocationOverrun(baselineInput({ area: 0.3, areaDecimal: new Decimal('0.3') }))).toBeTrue();
        expect(isAreaAllocationOverrun(baselineInput({ area: 0.5, areaDecimal: new Decimal('0.5') }))).toBeFalse();
    });

    it('keeps the overrun result-specific and takes precedence over compensation labels', () => {
        const state = areaBaselineAvailability(baselineInput({
            area: 0.4,
            areaDecimal: new Decimal('0.4'),
            bespokeCompensationAgreed: 'Yes',
        }));

        expect(state).toMatchObject({
            areaHabitatLost: false,
            unitsLost: false,
            totalHabitatUnits: true,
            rule: 'allocation-overrun',
            message: 'Error in Areas ▲',
        });
        expect(state.lossReason).toBeUndefined();
        expect(state.unavailableResults).toEqual({
            areaHabitatLost: 'check-data',
            unitsLost: 'check-data',
        });
    });

    it('marks bespoke compensation as an alternative when agreed', () => {
        expect(areaBaselineAvailability(baselineInput({
            bespokeCompensationAgreed: 'Yes',
        }))).toMatchObject({
            unitsLost: false,
            lossReason: 'alternative-compensation',
            lossMessage: 'Alternative Compensation ✓',
            unavailableResults: { unitsLost: 'check-data' },
        });
    });

    it('preserves the site-specific pending compensation message', () => {
        const onSite = areaBaselineAvailability(baselineInput({ bespokeCompensationAgreed: 'Pending' }));
        const offSite = areaBaselineAvailability(baselineInput({
            bespokeCompensationAgreed: 'Pending',
            offSite: true,
            offSiteReferenceNumber: 'GS-01',
        }));

        expect(onSite.lossMessage).toBe('Bespoke compensation must be agreed ▲');
        expect(offSite.lossMessage).toBe('Bespoke compensation must be agreed  ▲');
    });

    it('gates uncompensated irreplaceable loss without hiding the loss-area result', () => {
        const state = areaBaselineAvailability(baselineInput({ irreplaceableHabitat: true }));

        expect(state).toMatchObject({
            areaHabitatLost: true,
            totalHabitatUnits: false,
            vhdhBespokeCompensationUnits: false,
            rule: 'irreplaceable-loss-uncompensated',
            message: 'Any loss unacceptable',
        });
        expect(state.unavailableResults).toMatchObject({
            totalHabitatUnits: 'blank',
            vhdhBespokeCompensationUnits: 'blank',
        });
    });

    it('uses literal empty-reference semantics and gates only the formula-dependent off-site results', () => {
        expect(isAreaReferencePresent(undefined)).toBeFalse();
        expect(isAreaReferencePresent('')).toBeFalse();
        expect(isAreaReferencePresent(' ')).toBeTrue();
        expect(isAreaReferencePresent('0')).toBeTrue();

        const state = areaBaselineAvailability(baselineInput({
            offSite: true,
            requiredAction: 'Bespoke compensation likely to be required',
            offSiteReferenceNumber: '',
        }));
        expect(state).toMatchObject({
            totalHabitatUnits: false,
            totalHabitatUnitsSRM: false,
            vhdhBespokeCompensationUnits: false,
            areaHabitatLost: true,
        });
        expect(state.unavailableResults).toMatchObject({
            totalHabitatUnits: 'blank',
            totalHabitatUnitsSRM: 'blank',
            vhdhBespokeCompensationUnits: 'blank',
        });
    });
});

describe('area enhancement movement rules', () => {
    it('checks same-distinctiveness reduction before the generic trading-down branch', () => {
        const result = calculateAreaEnhancementMovement(movementInput({
            requiredAction: 'Same distinctiveness or better habitat required ≥',
            proposedLabel: 'Grassland - Modified grassland',
            proposedHabitatType: 'Modified grassland',
            proposedDistinctivenessCategory: 'Low',
            proposedDistinctivenessScore: 2,
        }));
        expect(result.distinctivenessChange).toBe('Error - Trading rules not satisfied ▲');
        expect(result.movementAllowed).toBeFalse();
    });

    it('checks broad-habitat mismatch before generic trading-down', () => {
        const result = calculateAreaEnhancementMovement(movementInput({
            requiredAction: 'Same broad habitat or a higher distinctiveness habitat required (≥)',
            baselineLabel: 'Woodland and forest - Lowland mixed deciduous woodland',
            proposedLabel: 'Grassland - Modified grassland',
            baselineBroadHabitat: 'Woodland and forest',
            proposedBroadHabitat: 'Grassland',
            proposedHabitatType: 'Modified grassland',
            baselineDistinctivenessCategory: 'High',
            proposedDistinctivenessCategory: 'Low',
            baselineDistinctivenessScore: 6,
            proposedDistinctivenessScore: 2,
        }));
        expect(result.distinctivenessChange).toBe('Error - Trading rules not satisfied ▲');
    });

    it('requires the same label for the same-habitat action', () => {
        const result = calculateAreaEnhancementMovement(movementInput({
            requiredAction: 'Same habitat required =',
            proposedLabel: 'Grassland - Modified grassland',
            proposedHabitatType: 'Modified grassland',
        }));
        expect(result.movementAllowed).toBeFalse();
        expect(result.distinctivenessChange).toBe('Error - Trading rules not satisfied ▲');
    });

    it('applies the bespoke replacement exception only to off-site woodland-other rows', () => {
        const input = movementInput({
            requiredAction: 'Bespoke compensation likely to be required',
            baselineLabel: 'Woodland and forest - Other woodland; broadleaved',
            proposedLabel: 'Woodland and forest - Lowland mixed deciduous woodland',
            baselineBroadHabitat: 'Woodland and forest',
            proposedBroadHabitat: 'Woodland and forest',
            proposedHabitatType: 'Lowland mixed deciduous woodland',
            baselineDistinctivenessCategory: 'Medium',
            proposedDistinctivenessCategory: 'High',
            baselineDistinctivenessScore: 4,
            proposedDistinctivenessScore: 6,
            irreplaceableHabitat: true,
        });
        const onSite = calculateAreaEnhancementMovement(input);
        const offSite = calculateAreaEnhancementMovement({ ...input, offSite: true });

        expect(onSite.conditionChange).toBe('Error you cannot replace an irreplaceable habitat ▲');
        expect(offSite.conditionChange).toBe('Lower Distinctiveness Habitat - Good');
        expect(offSite.conditionAllowed).toBeTrue();
    });

    it('rejects seagrass and IGGI unless the source label is in the formula allow-list', () => {
        expect(calculateAreaEnhancementMovement(movementInput({
            proposedHabitatType: 'Littoral seagrass',
        })).distinctivenessChange).toBe('Error - Enhancement not possible ▲');
        expect(calculateAreaEnhancementMovement(movementInput({
            proposedHabitatType: 'Artificial hard structures with integrated greening of grey infrastructure (IGGI)',
        })).distinctivenessChange).toBe('Error - Enhancement not possible ▲');
        expect(calculateAreaEnhancementMovement(movementInput({
            proposedHabitatType: 'Littoral seagrass',
            baselineLabel: 'Intertidal sediment - Littoral sand',
            baselineBroadHabitat: 'Intertidal sediment',
            proposedBroadHabitat: 'Intertidal sediment',
        })).movementAllowed).toBeTrue();
        expect(calculateAreaEnhancementMovement(movementInput({
            proposedHabitatType: 'Artificial hard structures with integrated greening of grey infrastructure (IGGI)',
            baselineLabel: 'Intertidal hard structures - Artificial features of hard structures',
            baselineBroadHabitat: 'Intertidal hard structures',
            proposedBroadHabitat: 'Intertidal hard structures',
        })).movementAllowed).toBeTrue();
    });

    it('resolves condition predicates in workbook order', () => {
        const irreplaceable = calculateAreaEnhancementMovement(movementInput({
            irreplaceableHabitat: true,
            proposedLabel: 'Grassland - Modified grassland',
            proposedHabitatType: 'Modified grassland',
        }));
        expect(irreplaceable.conditionChange).toBe('Error you cannot replace an irreplaceable habitat ▲');

        const highHigh = calculateAreaEnhancementMovement(movementInput({
            baselineDistinctivenessCategory: 'High',
            proposedDistinctivenessCategory: 'High',
            baselineDistinctivenessScore: 6,
            proposedDistinctivenessScore: 6,
            proposedLabel: 'Grassland - Modified grassland',
            proposedHabitatType: 'Modified grassland',
        }));
        expect(highHigh.conditionChange).toBe('Error - Not like for like ▲');

        const sameBandReduction = calculateAreaEnhancementMovement(movementInput({
            proposedCondition: 'Poor',
            proposedConditionScore: 0,
        }));
        expect(sameBandReduction.conditionChange).toBe('Error - Can not reduce condition ▲');

        const unchanged = calculateAreaEnhancementMovement(movementInput({
            proposedCondition: 'Moderate',
            proposedConditionScore: 2,
        }));
        expect(unchanged.conditionChange).toBe('Error - No enhancement ▲');

        const differentBandReduction = calculateAreaEnhancementMovement(movementInput({
            proposedDistinctivenessCategory: 'Low',
            proposedDistinctivenessScore: 2,
            proposedCondition: 'Poor',
            proposedConditionScore: 0,
        }));
        expect(differentBandReduction.conditionChange).toBe('Error - condition cannot be reduced ▲');

        const distinctivenessReduction = calculateAreaEnhancementMovement(movementInput({
            proposedDistinctivenessCategory: 'Low',
            proposedDistinctivenessScore: 2,
            proposedCondition: 'Good',
            proposedConditionScore: 3,
        }));
        expect(distinctivenessReduction.conditionChange).toBe('Error Trading Down ▲');

        const improvedLowerBand = calculateAreaEnhancementMovement(movementInput({
            proposedLabel: 'Grassland - Modified grassland',
            proposedHabitatType: 'Modified grassland',
            proposedDistinctivenessCategory: 'High',
            proposedDistinctivenessScore: 6,
        }));
        expect(improvedLowerBand.conditionChange).toBe('Lower Distinctiveness Habitat - Good');
    });
});

describe('area enhancement availability precedence', () => {
    it('detects positive numeric and sentinel timing conflicts only when both are active', () => {
        expect(hasAreaEnhancementTimingConflict(1, 1)).toBeTrue();
        expect(hasAreaEnhancementTimingConflict('30+', 1)).toBeTrue();
        expect(hasAreaEnhancementTimingConflict(1, '30+')).toBeTrue();
        expect(hasAreaEnhancementTimingConflict(0, '30+')).toBeFalse();
        expect(hasAreaEnhancementTimingConflict('30+', 0)).toBeFalse();
    });

    it('keeps the D-3 raw tree gate independent from spatial delivery', () => {
        const result = applyAreaEnhancementAvailability({
            habitatUnitsDelivered: 6.5583738888,
            habitatUnitsDeliveredDecimal: new Decimal('6.5583738888'),
            habitatUnitsDeliveredWithSpatialRisk: 3.2791869444,
            habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal('3.2791869444'),
        }, {
            movementAllowed: true,
            conditionAllowed: true,
            timingAllowed: true,
            preserveSpatialContribution: true,
            rawContributionAllowed: false,
        });

        expect(result.habitatUnitsDelivered).toBe(0);
        expect(result.habitatUnitsDeliveredDecimal.toNumber()).toBe(0);
        expect(result.habitatUnitsDeliveredWithSpatialRisk).toBe(3.2791869444);
        expect(result.areaCalculationAvailability).toMatchObject({
            habitatUnitsDelivered: false,
            habitatUnitsDeliveredWithSpatialRisk: true,
            rule: 'irreplaceable-individual-tree-enhancement',
            message: 'Error - you cannot enhance irreplaceable individual trees ▲',
            unavailableResults: { habitatUnitsDelivered: 'blank' },
        });
    });

    it('uses movement, tree, condition, timing, then reference precedence', () => {
        const row = {
            habitatUnitsDelivered: 2,
            habitatUnitsDeliveredDecimal: new Decimal(2),
            habitatUnitsDeliveredWithSpatialRisk: 1,
            habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(1),
            offSiteReferenceNumber: '',
        };
        const cases = [
            [{ movementAllowed: false, rawContributionAllowed: false, conditionAllowed: false, timingAllowed: false, requiresReference: true }, 'invalid-enhancement-movement', 'Check Data ⚠'],
            [{ movementAllowed: true, rawContributionAllowed: false, conditionAllowed: false, timingAllowed: false, requiresReference: true }, 'irreplaceable-individual-tree-enhancement', 'Error - you cannot enhance irreplaceable individual trees ▲'],
            [{ movementAllowed: true, rawContributionAllowed: true, conditionAllowed: false, timingAllowed: false, requiresReference: true }, 'invalid-enhancement-condition', 'Error - condition cannot be reduced ▲'],
            [{ movementAllowed: true, rawContributionAllowed: true, conditionAllowed: true, timingAllowed: false, requiresReference: true }, 'enhancement-timing-conflict', 'Error -both advance and delayed habitat creation ▲'],
            [{ movementAllowed: true, rawContributionAllowed: true, conditionAllowed: true, timingAllowed: true, requiresReference: true }, 'off-site-reference-required', 'Off-site reference required ▲'],
        ] as const;

        for (const [input, rule, message] of cases) {
            const result = applyAreaEnhancementAvailability(row, input);
            expect(result.areaCalculationAvailability).toMatchObject({ rule, message });
        }
    });

    it('preserves spatial delivery on reference-only failure but gates both results on semantic failure', () => {
        const row = {
            habitatUnitsDelivered: 2,
            habitatUnitsDeliveredDecimal: new Decimal(2),
            habitatUnitsDeliveredWithSpatialRisk: 1,
            habitatUnitsDeliveredWithSpatialRiskDecimal: new Decimal(1),
            offSiteReferenceNumber: '',
        };
        const referenceOnly = applyAreaEnhancementAvailability(row, {
            movementAllowed: true,
            conditionAllowed: true,
            timingAllowed: true,
            requiresReference: true,
        });
        expect(referenceOnly.habitatUnitsDelivered).toBe(0);
        expect(referenceOnly.habitatUnitsDeliveredWithSpatialRisk).toBe(1);

        const semanticFailure = applyAreaEnhancementAvailability(row, {
            movementAllowed: true,
            conditionAllowed: false,
            timingAllowed: true,
        });
        expect(semanticFailure.habitatUnitsDelivered).toBe(0);
        expect(semanticFailure.habitatUnitsDeliveredWithSpatialRisk).toBe(0);
        expect(semanticFailure.habitatUnitsDeliveredWithSpatialRiskDecimal?.toNumber()).toBe(0);
    });
});

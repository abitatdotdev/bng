import { describe, expect, it } from 'bun:test';
import { Decimal } from './decimal';
import {
    areaBaselineCalculationFacts,
    calculateAreaEnhancementMovement,
    hasAreaEnhancementTimingConflict,
    isAreaAllocationOverrun,
    isAreaReferencePresent,
} from './areaCalculationRules';
import type { AreaBaselineCalculationInput, AreaEnhancementMovementInput } from './areaCalculationTypes';

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
    bespokeWoodlandReplacementAllowed: false,
    irreplaceableWoodlandReplacementAllowed: false,
    ...changes,
});

const baselineInput = (changes: Partial<AreaBaselineCalculationInput> = {}) => ({
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

    it('derives baseline formula facts from exact Decimal operands', () => {
        const facts = areaBaselineCalculationFacts(baselineInput({
            area: 0.4,
            areaDecimal: new Decimal('0.4'),
            bespokeCompensationAgreed: 'Yes',
        }));
        expect(facts).toMatchObject({ allocationOverrun: true, hasLoss: false, compensationApplies: true });
    });

    it('compares workbook reference cells literally without trimming', () => {
        expect(isAreaReferencePresent(undefined)).toBeFalse();
        expect(isAreaReferencePresent('')).toBeFalse();
        expect(isAreaReferencePresent(' ')).toBeTrue();
        expect(isAreaReferencePresent('0')).toBeTrue();
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

    it('applies normalized bespoke and irreplaceable woodland replacement facts', () => {
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
        const offSite = calculateAreaEnhancementMovement({
            ...input,
            bespokeWoodlandReplacementAllowed: true,
            irreplaceableWoodlandReplacementAllowed: true,
        });

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

});

import { describe, expect, it } from 'bun:test';
import { Decimal } from '../decimal';
import { featuresFromInput } from '../parsers/featuresFromInput';
import {
    applyOnSiteWatercourseBaselineAvailability,
    applyOnSiteWatercourseEnhancementAvailability,
    applyOnSiteWatercourseEnhancementUnitReview,
} from './watercourseAvailability';
import {
    addOnSiteWatercourseCreationTimingGuidance,
    addOnSiteWatercourseEnhancementTimingGuidance,
    applyOnSiteWatercourseCreationTimingAvailability,
    applyOnSiteWatercourseEnhancementTimingAvailability,
} from './watercourseTiming';

function baseline(overrides: Partial<{
    watercourseType: 'Priority habitat' | 'Culvert';
    watercourseEncroachment: 'No Encroachment' | 'N/A - Culvert';
    riparianEncroachment: 'No Encroachment/ No Encroachment' | 'N/A - Culvert';
    length: number;
    lengthDecimal: Decimal;
    lengthRetained: number;
    lengthRetainedDecimal: Decimal;
    lengthEnhanced: number;
    lengthEnhancedDecimal: Decimal;
    lengthLost: number;
    lengthLostDecimal: Decimal;
    totalWatercourseUnits: number;
    totalWatercourseUnitsDecimal: Decimal;
    unitsRetained: number;
    unitsRetainedDecimal: Decimal;
    unitsEnhanced: number;
    unitsEnhancedDecimal: Decimal;
    unitsLost: number;
    unitsLostDecimal: Decimal;
    vhdhBespokeCompensationUnits: number;
    vhdhBespokeCompensationUnitsDecimal: Decimal;
}> = {}) {
    return {
        watercourseType: 'Priority habitat' as const,
        watercourseEncroachment: 'No Encroachment' as const,
        riparianEncroachment: 'No Encroachment/ No Encroachment' as const,
        length: 1,
        lengthDecimal: new Decimal(1),
        lengthRetained: 0,
        lengthRetainedDecimal: new Decimal(0),
        lengthEnhanced: 0,
        lengthEnhancedDecimal: new Decimal(0),
        lengthLost: 0,
        lengthLostDecimal: new Decimal(0),
        totalWatercourseUnits: 16,
        totalWatercourseUnitsDecimal: new Decimal(16),
        unitsRetained: 0,
        unitsRetainedDecimal: new Decimal(0),
        unitsEnhanced: 0,
        unitsEnhancedDecimal: new Decimal(0),
        unitsLost: 0,
        unitsLostDecimal: new Decimal(0),
        vhdhBespokeCompensationUnits: 0,
        vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
        ...overrides,
    };
}

describe('on-site watercourse workbook rules', () => {
    it('uses exact allocation comparisons, clamps enhancement-only loss, and gates invalid baseline totals selectively', () => {
        const exactFit = applyOnSiteWatercourseBaselineAvailability(baseline({
            length: 0.3,
            lengthDecimal: new Decimal('0.3'),
            lengthRetained: 0.1,
            lengthRetainedDecimal: new Decimal('0.1'),
            lengthEnhanced: 0.2,
            lengthEnhancedDecimal: new Decimal('0.2'),
        }));
        expect(exactFit.watercourseBaselineAvailability.overAllocated).toBe(false);

        const enhancementOnlyOverage = applyOnSiteWatercourseBaselineAvailability(baseline({
            lengthEnhanced: 1.5,
            lengthEnhancedDecimal: new Decimal('1.5'),
            lengthLost: -0.5,
            lengthLostDecimal: new Decimal('-0.5'),
        }));
        expect(enhancementOnlyOverage.lengthLost).toBe(0);
        expect(enhancementOnlyOverage.unitsLost).toBe(0);
        expect(enhancementOnlyOverage.watercourseBaselineAvailability.unavailableResults.unitsLost).toBeUndefined();

        const retainedOverage = applyOnSiteWatercourseBaselineAvailability(baseline({
            lengthRetained: 1.5,
            lengthRetainedDecimal: new Decimal('1.5'),
            unitsRetained: 24,
            unitsRetainedDecimal: new Decimal(24),
            unitsLost: -8,
            unitsLostDecimal: new Decimal(-8),
        }));
        expect(retainedOverage.unitsRetained).toBe(0);
        expect(retainedOverage.unitsLost).toBe(0);
        expect(retainedOverage.watercourseBaselineAvailability.unavailableResults.unitsLost).toBe('check-data');

        const splitOverage = applyOnSiteWatercourseBaselineAvailability(baseline({
            lengthRetained: 0.75,
            lengthRetainedDecimal: new Decimal('0.75'),
            lengthEnhanced: 0.75,
            lengthEnhancedDecimal: new Decimal('0.75'),
        }));
        expect(splitOverage.watercourseBaselineAvailability.unavailableResults.totalWatercourseUnits).toBe('blank');
        expect(splitOverage.watercourseBaselineAvailability.unavailableResults.unitsLost).toBe('check-data');

        const invalidEncroachment = applyOnSiteWatercourseBaselineAvailability(baseline({
            watercourseType: 'Culvert',
            lengthLost: 0.5,
            lengthLostDecimal: new Decimal('0.5'),
            unitsLost: 4,
            unitsLostDecimal: new Decimal(4),
        }));
        expect(invalidEncroachment.lengthLost).toBe(0.5);
        expect(invalidEncroachment.unitsLost).toBe(0);
        expect(invalidEncroachment.watercourseBaselineAvailability.unavailableResults.totalWatercourseUnits).toBe('blank');
    });

    it('marks condition and distinctiveness reductions unavailable without changing unrelated row results', () => {
        const result = applyOnSiteWatercourseEnhancementAvailability({
            baseline: { watercourseType: 'Priority habitat', conditionScore: 4 },
            watercourseType: 'Ditches',
            conditionScore: 2,
            watercourseUnitsDelivered: 5,
            watercourseUnitsDeliveredDecimal: new Decimal(5),
            retainedUnits: 3,
        });
        expect(result.enhancementCondition.status).toBe('forbidden');
        expect(result.enhancementCondition.unavailableResults.watercourseUnitsDelivered).toBe('blank');
        expect(result.enhancementMovement.status).toBe('forbidden');
        expect(result.watercourseUnitsDelivered).toBe(0);
        expect(result.retainedUnits).toBe(3);
    });

    it('uses workbook cap branches and suppresses review when its source totals are unavailable', () => {
        const ordinaryShortfall = applyOnSiteWatercourseEnhancementUnitReview({
            baseline: {
                length: 1,
                lengthRetained: 0.25,
                lengthEnhanced: 0.25,
                totalWatercourseUnits: 4,
                unitsRetained: 1,
                unitsEnhanced: 1,
            },
            watercourseUnitsDelivered: 0.9999999999999999,
            watercourseUnitsDeliveredDecimal: new Decimal('0.9999999999999999'),
        });
        expect(ordinaryShortfall.enhancementUnitReview.status).toBe('review');
        expect(ordinaryShortfall.enhancementUnitReview.requiredUnitsDecimal.toFixed()).toBe('1');
        expect(ordinaryShortfall.enhancementUnitReview.deficitDecimal.toFixed()).toBe('0.0000000000000001');

        const enhancedOverage = applyOnSiteWatercourseEnhancementUnitReview({
            baseline: {
                length: 1,
                lengthRetained: 0.25,
                lengthEnhanced: 1.25,
                totalWatercourseUnits: 4,
                unitsRetained: 1,
                unitsEnhanced: 5,
            },
            watercourseUnitsDelivered: 4,
            watercourseUnitsDeliveredDecimal: new Decimal(4),
        });
        expect(enhancedOverage.enhancementUnitReview.requiredUnitsDecimal.toFixed()).toBe('4');
        expect(enhancedOverage.enhancementUnitReview.status).toBe('clear');

        const splitOverage = applyOnSiteWatercourseEnhancementUnitReview({
            baseline: {
                length: 1,
                lengthRetained: 0.75,
                lengthEnhanced: 0.75,
                totalWatercourseUnits: 4,
                unitsRetained: 2,
                unitsEnhanced: 3,
            },
            watercourseUnitsDelivered: 1,
            watercourseUnitsDeliveredDecimal: new Decimal(1),
        });
        expect(splitOverage.enhancementUnitReview.requiredUnitsDecimal.toFixed()).toBe('2');
        expect(splitOverage.enhancementUnitReview.status).toBe('review');

        const unavailableTotals = applyOnSiteWatercourseEnhancementUnitReview({
            baseline: {
                ...baseline({ lengthRetained: 0.2, unitsRetained: 2 }),
                watercourseBaselineAvailability: { unavailableResults: { unitsRetained: 'blank' as const } },
            },
            watercourseUnitsDelivered: 4,
            watercourseUnitsDeliveredDecimal: new Decimal(4),
        });
        expect(unavailableTotals.enhancementUnitReview.status).toBe('unavailable');
    });

    it('adds exact timing guidance only for numeric standards and gates conflicting timing outputs', () => {
        const guidance = addOnSiteWatercourseEnhancementTimingGuidance({
            timeToTargetCondition: 20,
            watercourseEnhancedInAdvance: 1,
            watercourseEnhancedDelay: 0,
        });
        expect(guidance.standardOrAdjustedTimeToTargetCondition).toBeDefined();
        expect(addOnSiteWatercourseEnhancementTimingGuidance({
            timeToTargetCondition: 'N/A',
            watercourseEnhancedInAdvance: 1,
            watercourseEnhancedDelay: 0,
        })).not.toHaveProperty('standardOrAdjustedTimeToTargetCondition');

        const conflict = applyOnSiteWatercourseEnhancementTimingAvailability({
            watercourseEnhancedInAdvance: '30+',
            watercourseEnhancedDelay: 1,
            watercourseUnitsDelivered: 5,
            watercourseUnitsDeliveredDecimal: new Decimal(5),
        });
        expect(conflict.watercourseUnitsDelivered).toBe(0);
        expect(conflict.linearTimingAvailability.unavailableResults.appliedDifficultyMultiplier).toBe('check-data');

        const creationConflict = applyOnSiteWatercourseCreationTimingAvailability({
            habitatCreatedInAdvance: 1,
            delayInStarting: 1,
            unitsDelivered: 6,
            unitsDeliveredDecimal: new Decimal(6),
        });
        expect(creationConflict.unitsDelivered).toBe(0);
        expect(creationConflict.linearTimingAvailability.status).toBe('forbidden');
    });

    it('rolls back unchecked timing metadata when an invalid Culvert/Good row cannot finish review', () => {
        const { features, issues } = featuresFromInput({
            onSiteWatercourseEnhancements: [{
                watercourseType: 'Culvert',
                condition: 'Good',
                strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
                watercourseEncroachment: 'No Encroachment',
                riparianEncroachment: 'No Encroachment/ No Encroachment',
                baseline: {
                    watercourseType: 'Culvert',
                    condition: 'Poor',
                    length: '1',
                    strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
                    watercourseEncroachment: 'No Encroachment',
                    riparianEncroachment: 'No Encroachment/ No Encroachment',
                    lengthEnhanced: '0.5',
                },
            }],
        }, { validate: false });

        expect(issues).toHaveLength(0);
        expect(features.onSiteWatercourseEnhancements).toHaveLength(1);
        const [row] = features.onSiteWatercourseEnhancements;
        expect(row).not.toHaveProperty('standardOrAdjustedTimeToTargetCondition');
        expect(row).not.toHaveProperty('linearTimingAvailability');
    });
});

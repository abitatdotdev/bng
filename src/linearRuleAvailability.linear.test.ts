import { describe, expect, it } from 'bun:test';
import { Decimal } from './decimal';
import { onSiteWatercourseCreationUncheckedSchema } from './onSite/watercourseCreation';
import * as v from 'valibot';
import {
    addLinearTimingGuidance,
    applyHedgerowBaselineAvailability,
    applyHedgerowEnhancementQuality,
    applyHedgerowOffSiteAvailability,
    applyLinearTimingAvailability,
    applyWatercourseCreationTimingAvailability,
    applyWatercourseEnhancementUnitReview,
    applyWatercourseBaselineAvailability,
} from './linearRuleAvailability';

describe('linear calculation availability', () => {
    it('marks unchanged hedgerow quality unavailable and keeps improved quality numeric', () => {
        const unchanged = applyHedgerowEnhancementQuality({
            baseline: { habitatType: 'Species-rich native hedgerow with trees - associated with bank or ditch', condition: 'Moderate', distinctivenessScore: 8, conditionScore: 2 },
            habitatType: 'Species-rich native hedgerow with trees - associated with bank or ditch',
            condition: 'Moderate',
            distinctivenessScore: 8,
            conditionScore: 2,
            timeToTargetCondition: 4,
            temporalMultiplier: 1.2,
            appliedDifficultyMultiplier: 0.8,
            finalDifficultyOfEnhancement: 'Low',
            hedgerowUnitsDelivered: 3,
            hedgerowUnitsDeliveredDecimal: new Decimal(3),
            hedgerowUnitsDeliveredWithSpatialRisk: 2.4,
            hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal('2.4'),
        }, true);
        expect(unchanged.hedgerowEnhancementQuality.status).toBe('no-enhancement');
        expect(unchanged.hedgerowEnhancementQuality.unavailableResults).toMatchObject({
            timeToTargetCondition: 'check-data',
            temporalMultiplier: 'check-data',
            appliedDifficultyMultiplier: 'check-data',
            finalDifficultyOfEnhancement: 'check-data',
            hedgerowUnitsDelivered: 'blank',
            hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
        });
        expect(unchanged.hedgerowUnitsDelivered).toBe(0);
        expect(unchanged.hedgerowUnitsDeliveredDecimal.isZero()).toBe(true);
        expect(unchanged.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);
        expect(unchanged.hedgerowUnitsDeliveredWithSpatialRiskDecimal.isZero()).toBe(true);
        expect(unchanged.timeToTargetCondition).toBe(4);
        expect(unchanged.temporalMultiplier).toBe(1.2);

        const improved = applyHedgerowEnhancementQuality({
            ...unchanged,
            baseline: { ...unchanged.baseline, condition: 'Poor', conditionScore: 1 },
            condition: 'Good',
            conditionScore: 3,
            hedgerowUnitsDelivered: 3,
            hedgerowUnitsDeliveredDecimal: new Decimal(3),
            hedgerowUnitsDeliveredWithSpatialRisk: 2.4,
            hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal('2.4'),
        }, true);
        expect(improved.hedgerowEnhancementQuality.status).toBe('allowed');
        expect(improved.hedgerowUnitsDelivered).toBe(3);
        expect(improved.hedgerowUnitsDeliveredWithSpatialRisk).toBe(2.4);
    });

    it('keeps off-site raw and spatial hedge results independent', () => {
        const base = {
            spatialRiskCategory: 'Compensation inside LPA boundary or NCA of impact site' as const,
            hedgerowUnitsDelivered: 4,
            hedgerowUnitsDeliveredDecimal: new Decimal(4),
            hedgerowUnitsDeliveredWithSpatialRisk: 3,
            hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(3),
        };

        const missingReference = applyHedgerowOffSiteAvailability(base);
        expect(missingReference.hedgerowUnitsDelivered).toBe(0);
        expect(missingReference.hedgerowUnitsDeliveredWithSpatialRisk).toBe(3);

        const missingRisk = applyHedgerowOffSiteAvailability({ ...base, offSiteReferenceNumber: 'REF-1', spatialRiskCategory: undefined });
        expect(missingRisk.hedgerowUnitsDelivered).toBe(0);
        expect(missingRisk.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);
    });

    it('selects timing guidance by the workbook precedence for standard, advance and delay', () => {
        const source = { standardTimeToTargetCondition: 5 };
        expect(addLinearTimingGuidance(source).standardOrAdjustedTimeToTargetCondition)
            .toBe('Standard time to target condition applied');
        expect(addLinearTimingGuidance({ ...source, habitatCreatedInAdvance: 5 })
            .standardOrAdjustedTimeToTargetCondition)
            .toBe('Check details - Is there evidence that habitat has reached target condition? ⚠');
        expect(addLinearTimingGuidance({ ...source, habitatCreatedInAdvance: 2 })
            .standardOrAdjustedTimeToTargetCondition)
            .toBe('Check details - Is there evidence habitat creation started/in place? ⚠');
        expect(addLinearTimingGuidance({ ...source, delayInStarting: 1 })
            .standardOrAdjustedTimeToTargetCondition)
            .toBe('Check details- Delay in starting habitat in required condition? ⚠');
        expect(addLinearTimingGuidance({ ...source, habitatCreatedInAdvance: 1, delayInStarting: 1 })
            .standardOrAdjustedTimeToTargetCondition)
            .toBe('Error -both advance and delayed habitat creation ▲');
        expect(addLinearTimingGuidance({ ...source, habitatCreatedInAdvance: '30+' })
            .standardOrAdjustedTimeToTargetCondition)
            .toBe('Check details - Is there evidence that habitat has reached target condition? ⚠');
        expect(addLinearTimingGuidance({ timeToTargetCondition: 'N/A' }))
            .not.toHaveProperty('standardOrAdjustedTimeToTargetCondition');
    });

    it('gates numeric hedge conflicts while preserving sentinel and overflow results', () => {
        const base = {
            timeToTargetCondition: 10,
            finalTimeToTargetCondition: 10,
            hedgerowUnitsDelivered: 5,
            hedgerowUnitsDeliveredDecimal: new Decimal(5),
        };
        const conflicted = applyLinearTimingAvailability(base, 'hedgerow', false, 1, 1);
        expect(conflicted.hedgerowUnitsDelivered).toBe(0);
        expect(conflicted).not.toHaveProperty('advance');
        expect(conflicted).not.toHaveProperty('delay');
        expect(applyLinearTimingAvailability({ ...base, finalTimeToTargetCondition: 0 }, 'hedgerow', false, '30+', 1).hedgerowUnitsDelivered).toBe(5);
        expect(applyLinearTimingAvailability({ ...base, finalTimeToTargetCondition: '30+' }, 'hedgerow', false, 1, '30+').hedgerowUnitsDelivered).toBe(5);
        expect(applyLinearTimingAvailability({ ...base, finalTimeToTargetCondition: '30+' }, 'hedgerow', false, 10, 25).hedgerowUnitsDelivered).toBe(5);
    });

    it('gates water timing conflicts with numeric and sentinel years', () => {
        const base = {
            watercourseUnitsDelivered: 5,
            watercourseUnitsDeliveredDecimal: new Decimal(5),
            watercourseUnitsDeliveredWithSpatialRisk: 4,
            watercourseUnitsDeliveredWithSpatialRiskDecimal: new Decimal(4),
        };
        const result = applyLinearTimingAvailability(base, 'watercourse', true, '30+', 1);
        expect(result.watercourseUnitsDelivered).toBe(0);
        expect(result.watercourseUnitsDeliveredWithSpatialRisk).toBe(0);
    });

    it('zeros only the conflicted water creation contribution and keeps allowed sentinels', () => {
        const source = {
            habitatCreatedInAdvance: 1 as const,
            delayInStarting: 1 as const,
            unitsDelivered: 6,
            unitsDeliveredDecimal: new Decimal(6),
            netUnitChangeWithSpatialRisk: 4.5,
            netUnitChangeWithSpatialRiskDecimal: new Decimal('4.5'),
        };
        const conflict = applyWatercourseCreationTimingAvailability(source, true);
        expect(conflict.unitsDelivered).toBe(0);
        expect(conflict.unitsDeliveredDecimal.isZero()).toBe(true);
        expect(conflict.netUnitChangeWithSpatialRisk).toBe(0);
        expect(conflict.linearTimingAvailability.unavailableResults.appliedDifficulty).toBe('check-data');

        const sentinel = applyWatercourseCreationTimingAvailability({
            ...source,
            habitatCreatedInAdvance: 0,
            delayInStarting: '30+',
        }, true);
        expect(sentinel.unitsDelivered).toBe(6);
        expect(sentinel.netUnitChangeWithSpatialRisk).toBe(4.5);
        expect(sentinel.linearTimingAvailability.status).toBe('allowed');
    });

    it('keeps water creation difficulty candidates while marking only the guidance result unavailable', () => {
        const result = v.parse(onSiteWatercourseCreationUncheckedSchema, {
            watercourseType: 'Ditches',
            length: 1,
            condition: 'Moderate',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 1,
            delayInStarting: 1,
            watercourseEncroachment: 'No Encroachment',
            riparianEncroachment: 'No Encroachment/ No Encroachment',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-001',
        });

        expect(result.unitsDelivered).toBe(0);
        expect(result.unitsDeliveredDecimal.isZero()).toBe(true);
        expect(result.appliedDifficulty).toBe('Standard difficulty applied');
        expect(result.linearTimingAvailability.unavailableResults.appliedDifficulty).toBe('check-data');
        expect(result.finalDifficultyOfCreation).toBe(result.standardDifficulty);
        expect(result.difficultyMultiplierDecimal.eq(result.difficultyMultiplier)).toBe(true);
    });

    it('uses exact Decimal lengths and keeps allocation result gates selective', () => {
        const base = {
            watercourseType: 'Priority habitat' as const,
            condition: 'Good' as const,
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
            totalWatercourseUnitsSRM: 12,
            totalWatercourseUnitsSRMDecimal: new Decimal(12),
            unitsRetainedWithSRM: 0,
            unitsRetainedWithSRMDecimal: new Decimal(0),
            vhdhBespokeCompensationUnits: 0,
            vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
        };

        const exactFit = applyWatercourseBaselineAvailability({
            ...base,
            length: 0.3,
            lengthDecimal: new Decimal('0.3'),
            lengthRetained: 0.1,
            lengthRetainedDecimal: new Decimal('0.1'),
            lengthEnhanced: 0.2,
            lengthEnhancedDecimal: new Decimal('0.2'),
        });
        expect(exactFit.watercourseBaselineAvailability.overAllocated).toBe(false);

        const enhancementOnly = applyWatercourseBaselineAvailability({
            ...base,
            lengthEnhanced: 1.5,
            lengthEnhancedDecimal: new Decimal('1.5'),
            lengthLost: -0.5,
            lengthLostDecimal: new Decimal('-0.5'),
        });
        expect(enhancementOnly.lengthLost).toBe(0);
        expect(enhancementOnly.unitsLost).toBe(0);
        expect(enhancementOnly.watercourseBaselineAvailability.unavailableResults.unitsLost).toBeUndefined();

        const retainedOnly = applyWatercourseBaselineAvailability({
            ...base,
            lengthRetained: 1.5,
            lengthRetainedDecimal: new Decimal('1.5'),
            unitsRetained: 24,
            unitsRetainedDecimal: new Decimal(24),
            lengthLost: -0.5,
            lengthLostDecimal: new Decimal('-0.5'),
            unitsLost: -8,
            unitsLostDecimal: new Decimal(-8),
        });
        expect(retainedOnly.unitsRetained).toBe(0);
        expect(retainedOnly.unitsLost).toBe(0);
        expect(retainedOnly.watercourseBaselineAvailability.unavailableResults.unitsLost).toBe('check-data');

        const split = applyWatercourseBaselineAvailability({
            ...base,
            lengthRetained: 0.75,
            lengthRetainedDecimal: new Decimal('0.75'),
            lengthEnhanced: 0.75,
            lengthEnhancedDecimal: new Decimal('0.75'),
        });
        expect(split.watercourseBaselineAvailability.unavailableResults.totalWatercourseUnits).toBe('blank');
        expect(split.watercourseBaselineAvailability.unavailableResults.unitsLost).toBe('check-data');
        expect(split.unitsRetained).toBe(0);

        const invalidEncroachment = applyWatercourseBaselineAvailability({
            ...base,
            watercourseType: 'Culvert' as const,
            watercourseEncroachment: 'No Encroachment',
            riparianEncroachment: 'No Encroachment/ No Encroachment',
            lengthLost: 0.5,
            lengthLostDecimal: new Decimal('0.5'),
            unitsLost: 4,
            unitsLostDecimal: new Decimal(4),
        });
        expect(invalidEncroachment.lengthLost).toBe(0.5);
        expect(invalidEncroachment.unitsLost).toBe(0);
    });

    it('reports hedgerow baseline allocation without erasing row candidates', () => {
        const result = applyHedgerowBaselineAvailability({
            habitatType: 'Species-rich native hedgerow',
            condition: 'Good',
            length: 1,
            lengthDecimal: new Decimal(1),
            lengthRetained: 2,
            lengthRetainedDecimal: new Decimal(2),
            lengthEnhanced: 0,
            lengthEnhancedDecimal: new Decimal(0),
            unitsRetained: 8,
        });
        expect(result.hedgerowBaselineAvailability.status).toBe('over-allocated');
        expect(result.unitsRetained).toBe(8);
    });

    it('distinguishes missing off-site risk blanks from missing-reference errors', () => {
        const row = {
            habitatType: 'Species-rich native hedgerow' as const,
            condition: 'Good' as const,
            length: 1,
            lengthDecimal: new Decimal(1),
            lengthRetained: 0.2,
            lengthRetainedDecimal: new Decimal('0.2'),
            lengthEnhanced: 0,
            lengthEnhancedDecimal: new Decimal(0),
            unitsLost: 0.8,
            unitsLostDecimal: new Decimal('0.8'),
        };
        const missingRisk = applyHedgerowBaselineAvailability(row, true);
        expect(missingRisk.hedgerowBaselineAvailability.missingSpatialRisk).toBe(true);
        expect(missingRisk.hedgerowBaselineAvailability.unavailableResults.unitsLost).toBe('blank');
        expect(missingRisk.unitsLost).toBe(0);
        expect(missingRisk.hedgerowBaselineAvailability.unitsLostError).toBe(false);

        const missingReference = applyHedgerowBaselineAvailability({
            ...row,
            spatialRiskCategory: 'Compensation inside LPA boundary or NCA of impact site' as const,
        }, true);
        expect(missingReference.hedgerowBaselineAvailability.missingOffSiteReference).toBe(true);
        expect(missingReference.hedgerowBaselineAvailability.unavailableResults.unitsLost).toBe('check-data');
        expect(missingReference.hedgerowBaselineAvailability.unitsLostError).toBe(true);
    });

    it('compares watercourse delivery against the workbook baseline requirement without changing delivery', () => {
        const base = {
            baseline: {
                length: 1,
                lengthDecimal: new Decimal(1),
                lengthRetained: 0.25,
                lengthRetainedDecimal: new Decimal('0.25'),
                lengthEnhanced: 0.25,
                lengthEnhancedDecimal: new Decimal('0.25'),
                totalWatercourseUnits: 4,
                totalWatercourseUnitsDecimal: new Decimal(4),
                unitsRetained: 1,
                unitsRetainedDecimal: new Decimal(1),
                unitsEnhanced: 1,
                unitsEnhancedDecimal: new Decimal(1),
            },
            watercourseUnitsDelivered: 0.9999999999999999,
            watercourseUnitsDeliveredDecimal: new Decimal('0.9999999999999999'),
        };
        const review = applyWatercourseEnhancementUnitReview(base);
        expect(review.enhancementUnitReview.status).toBe('review');
        expect(review.enhancementUnitReview.requiredUnitsDecimal.toFixed()).toBe('1');
        expect(review.enhancementUnitReview.deficitDecimal.toFixed()).toBe('0.0000000000000001');
        expect(review.watercourseUnitsDeliveredDecimal.toFixed()).toBe('0.9999999999999999');

        const enhancedOverage = applyWatercourseEnhancementUnitReview({
            ...base,
            baseline: {
                ...base.baseline,
                lengthEnhanced: 1.25,
                lengthEnhancedDecimal: new Decimal('1.25'),
                unitsEnhanced: 5,
                unitsEnhancedDecimal: new Decimal(5),
            },
            watercourseUnitsDelivered: 4,
            watercourseUnitsDeliveredDecimal: new Decimal(4),
        });
        expect(enhancedOverage.enhancementUnitReview.requiredUnitsDecimal.toFixed()).toBe('4');
        expect(enhancedOverage.enhancementUnitReview.status).toBe('clear');

        const splitOverage = applyWatercourseEnhancementUnitReview({
            ...base,
            baseline: {
                ...base.baseline,
                lengthRetained: 0.75,
                lengthRetainedDecimal: new Decimal('0.75'),
                lengthEnhanced: 0.75,
                lengthEnhancedDecimal: new Decimal('0.75'),
                unitsRetained: 2,
                unitsRetainedDecimal: new Decimal(2),
                unitsEnhanced: 3,
                unitsEnhancedDecimal: new Decimal(3),
            },
        });
        expect(splitOverage.enhancementUnitReview.requiredUnitsDecimal.toFixed()).toBe('2');
        expect(splitOverage.enhancementUnitReview.status).toBe('review');

        const unavailable = applyWatercourseEnhancementUnitReview({
            ...base,
            baseline: {
                ...base.baseline,
                watercourseBaselineAvailability: {
                    unavailableResults: { unitsRetained: 'blank' as const },
                },
            },
        });
        expect(unavailable.enhancementUnitReview.status).toBe('unavailable');
    });
});

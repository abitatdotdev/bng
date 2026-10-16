import { describe, expect, it } from 'bun:test';
import { Decimal } from '../decimal';
import { featuresFromInput } from '../parsers/featuresFromInput';
import {
    applyOffSiteWatercourseBaselineAvailability,
    applyOffSiteWatercourseCreationReferenceAvailability,
    applyOffSiteWatercourseEnhancementAvailability,
    applyOffSiteWatercourseEnhancementReferenceAvailability,
    applyOffSiteWatercourseEnhancementUnitReview,
} from './watercourseAvailability';
import {
    addOffSiteWatercourseCreationTimingGuidance,
    addOffSiteWatercourseEnhancementTimingGuidance,
    applyOffSiteWatercourseCreationTimingAvailability,
    applyOffSiteWatercourseEnhancementTimingAvailability,
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
    totalWatercourseUnitsSRM: number;
    totalWatercourseUnitsSRMDecimal: Decimal;
    unitsRetained: number;
    unitsRetainedDecimal: Decimal;
    unitsRetainedWithSRM: number;
    unitsRetainedWithSRMDecimal: Decimal;
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
        lengthRetained: 0.2,
        lengthRetainedDecimal: new Decimal('0.2'),
        lengthEnhanced: 0,
        lengthEnhancedDecimal: new Decimal(0),
        lengthLost: 0.8,
        lengthLostDecimal: new Decimal('0.8'),
        totalWatercourseUnits: 16,
        totalWatercourseUnitsDecimal: new Decimal(16),
        totalWatercourseUnitsSRM: 12,
        totalWatercourseUnitsSRMDecimal: new Decimal(12),
        unitsRetained: 3.2,
        unitsRetainedDecimal: new Decimal('3.2'),
        unitsRetainedWithSRM: 2.4,
        unitsRetainedWithSRMDecimal: new Decimal('2.4'),
        unitsEnhanced: 0,
        unitsEnhancedDecimal: new Decimal(0),
        unitsLost: 12.8,
        unitsLostDecimal: new Decimal('12.8'),
        vhdhBespokeCompensationUnits: 0,
        vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
        ...overrides,
    };
}

describe('off-site watercourse workbook rules', () => {
    it('gates invalid and split baselines, retaining exact loss and allocation metadata', () => {
        const split = applyOffSiteWatercourseBaselineAvailability(baseline({
            lengthRetained: 0.75,
            lengthRetainedDecimal: new Decimal('0.75'),
            lengthEnhanced: 0.75,
            lengthEnhancedDecimal: new Decimal('0.75'),
        }));
        expect(split.watercourseBaselineAvailability.splitAllocation).toBe(true);
        expect(split.watercourseBaselineAvailability.unavailableResults.totalWatercourseUnitsSRM).toBe('blank');
        expect(split.watercourseBaselineAvailability.unavailableResults.unitsLost).toBe('check-data');
        expect(split.unitsRetainedWithSRM).toBe(2.4);

        const invalid = applyOffSiteWatercourseBaselineAvailability(baseline({
            watercourseType: 'Culvert',
            lengthLost: 0.5,
            lengthLostDecimal: new Decimal('0.5'),
            unitsLost: 8,
            unitsLostDecimal: new Decimal(8),
        }));
        expect(invalid.lengthLost).toBe(0.5);
        expect(invalid.unitsLost).toBe(0);
        expect(invalid.watercourseBaselineAvailability.invalidEncroachment).toBe(true);
    });

    it('gates missing gain-site references independently from spatial-risk contributions', () => {
        const missingEnhancementReference = applyOffSiteWatercourseEnhancementReferenceAvailability({
            watercourseUnitsDelivered: 5,
            watercourseUnitsDeliveredDecimal: new Decimal(5),
            watercourseUnitsDeliveredWithSpatialRisk: 4,
            watercourseUnitsDeliveredWithSpatialRiskDecimal: new Decimal(4),
        });
        expect(missingEnhancementReference.watercourseUnitsDelivered).toBe(0);
        expect(missingEnhancementReference.watercourseUnitsDeliveredWithSpatialRisk).toBe(4);
        expect(missingEnhancementReference.watercourseOffSiteAvailability.unavailableResults.watercourseUnitsDelivered).toBe('blank');

        const missingCreationReference = applyOffSiteWatercourseCreationReferenceAvailability({
            unitsDelivered: 6,
            unitsDeliveredDecimal: new Decimal(6),
            netUnitChangeWithSpatialRisk: 4.5,
            netUnitChangeWithSpatialRiskDecimal: new Decimal('4.5'),
        });
        expect(missingCreationReference.unitsDelivered).toBe(0);
        expect(missingCreationReference.netUnitChangeWithSpatialRisk).toBe(4.5);
        expect(missingCreationReference.watercourseOffSiteAvailability.unavailableResults.unitsDelivered).toBe('blank');
    });

    it('reports condition and movement rules while keeping source row values available', () => {
        const result = applyOffSiteWatercourseEnhancementAvailability({
            baseline: { watercourseType: 'Priority habitat', conditionScore: 4 },
            watercourseType: 'Ditches',
            conditionScore: 2,
            watercourseUnitsDelivered: 5,
            watercourseUnitsDeliveredDecimal: new Decimal(5),
            watercourseUnitsDeliveredWithSpatialRisk: 4,
            watercourseUnitsDeliveredWithSpatialRiskDecimal: new Decimal(4),
        });
        expect(result.enhancementCondition.status).toBe('forbidden');
        expect(result.enhancementMovement.status).toBe('forbidden');
        expect(result.watercourseUnitsDelivered).toBe(0);
        expect(result.watercourseUnitsDeliveredWithSpatialRisk).toBe(0);
    });

    it('checks cap branches and suppresses review if a required baseline result is unavailable', () => {
        const reviewed = applyOffSiteWatercourseEnhancementUnitReview({
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
        expect(reviewed.enhancementUnitReview.status).toBe('review');
        expect(reviewed.enhancementUnitReview.requiredUnitsDecimal.toFixed()).toBe('2');

        const unavailable = applyOffSiteWatercourseEnhancementUnitReview({
            baseline: {
                ...baseline(),
                watercourseBaselineAvailability: { unavailableResults: { totalWatercourseUnits: 'blank' as const } },
            },
            watercourseUnitsDelivered: 10,
            watercourseUnitsDeliveredDecimal: new Decimal(10),
        });
        expect(unavailable.enhancementUnitReview.status).toBe('unavailable');
    });

    it('adds timing guidance only for numeric standards and gates conflict outputs', () => {
        const creationGuidance = addOffSiteWatercourseCreationTimingGuidance({
            standardTimeToTarget: 20,
            habitatCreatedInAdvance: 1,
            delayInStarting: 0,
        });
        expect(creationGuidance.standardOrAdjustedTimeToTargetCondition).toBeDefined();
        expect(addOffSiteWatercourseCreationTimingGuidance({
            standardTimeToTarget: 'Not Possible ▲',
            habitatCreatedInAdvance: 1,
            delayInStarting: 0,
        })).not.toHaveProperty('standardOrAdjustedTimeToTargetCondition');
        expect(addOffSiteWatercourseEnhancementTimingGuidance({
            timeToTargetCondition: 'N/A',
            watercourseEnhancedInAdvance: '30+',
            watercourseEnhancedDelay: 0,
        })).not.toHaveProperty('standardOrAdjustedTimeToTargetCondition');

        const creationConflict = applyOffSiteWatercourseCreationTimingAvailability({
            habitatCreatedInAdvance: 1,
            delayInStarting: 1,
            unitsDelivered: 6,
            unitsDeliveredDecimal: new Decimal(6),
            netUnitChangeWithSpatialRisk: 4.5,
            netUnitChangeWithSpatialRiskDecimal: new Decimal('4.5'),
        });
        expect(creationConflict.unitsDelivered).toBe(0);
        expect(creationConflict.netUnitChangeWithSpatialRisk).toBe(0);

        const enhancementConflict = applyOffSiteWatercourseEnhancementTimingAvailability({
            watercourseEnhancedInAdvance: '30+',
            watercourseEnhancedDelay: 1,
            watercourseUnitsDelivered: 5,
            watercourseUnitsDeliveredDecimal: new Decimal(5),
            watercourseUnitsDeliveredWithSpatialRisk: 4,
            watercourseUnitsDeliveredWithSpatialRiskDecimal: new Decimal(4),
        });
        expect(enhancementConflict.watercourseUnitsDelivered).toBe(0);
        expect(enhancementConflict.watercourseUnitsDeliveredWithSpatialRisk).toBe(0);
    });

    it('rolls back unchecked timing and reference metadata when invalid Culvert/Good review fails', () => {
        const { features, issues } = featuresFromInput({
            offSiteWatercourseEnhancements: [{
                watercourseType: 'Culvert',
                condition: 'Good',
                strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
                watercourseEncroachment: 'No Encroachment',
                riparianEncroachment: 'No Encroachment/ No Encroachment',
                offSiteReferenceNumber: 'GS',
                baseline: {
                    watercourseType: 'Culvert',
                    condition: 'Poor',
                    length: '1',
                    strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
                    watercourseEncroachment: 'No Encroachment',
                    riparianEncroachment: 'No Encroachment/ No Encroachment',
                    spatialRiskCategory: 'Outside waterbody catchment, but within operational catchment',
                    offSiteReferenceNumber: 'GS',
                    lengthEnhanced: '0.5',
                },
                watercourseEnhancedInAdvance: 0,
                watercourseEnhancedDelay: '30+',
            }],
        }, { validate: false });

        expect(issues).toHaveLength(0);
        expect(features.offSiteWatercourseEnhancements).toHaveLength(1);
        const [row] = features.offSiteWatercourseEnhancements;
        expect(row).not.toHaveProperty('standardOrAdjustedTimeToTargetCondition');
        expect(row).not.toHaveProperty('linearTimingAvailability');
        expect(row).not.toHaveProperty('watercourseOffSiteAvailability');
    });
});

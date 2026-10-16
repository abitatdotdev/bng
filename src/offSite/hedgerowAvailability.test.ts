import { expect, test } from 'bun:test';
import { Decimal } from '../decimal';
import type { SpatialRiskCategory } from '../spatialRisk';
import {
    addOffSiteHedgerowEnhancementMovement,
    applyOffSiteHedgerowBaselineAvailability,
    applyOffSiteHedgerowDeliveryAvailability,
    applyOffSiteHedgerowEnhancementCondition,
    applyOffSiteHedgerowEnhancementQuality,
    gateOffSiteHedgerowEnhancementMovement,
} from './hedgerowAvailability';
import { applyOffSiteHedgerowEnhancementTiming } from './hedgerowTiming';

const risk: SpatialRiskCategory = 'Compensation inside LPA boundary or NCA of impact site';
const baselineQuality = {
    habitatType: 'Native hedgerow',
    condition: 'Moderate',
    distinctivenessScore: 2,
    conditionScore: 2,
} as const;

test('off-site baseline allocation and missing-risk/reference results stay selective', () => {
    const exactFit = applyOffSiteHedgerowBaselineAvailability({
        lengthDecimal: new Decimal('0.3'),
        lengthRetainedDecimal: new Decimal('0.1'),
        lengthEnhancedDecimal: new Decimal('0.2'),
        lengthLost: 0,
        lengthLostDecimal: new Decimal(0),
        unitsLost: 0,
        unitsLostDecimal: new Decimal(0),
        totalHedgerowUnits: 0.6,
        totalHedgerowUnitsDecimal: new Decimal('0.6'),
        totalHedgerowUnitsSRM: 0.6,
        totalHedgerowUnitsSRMDecimal: new Decimal('0.6'),
        unitsRetainedWithSRM: 0.2,
        unitsRetainedWithSRMDecimal: new Decimal('0.2'),
        spatialRiskCategory: risk,
        offSiteReferenceNumber: 'REF-1',
    });
    expect(exactFit.hedgerowBaselineAvailability.status).toBe('allowed');

    const base = {
        lengthDecimal: new Decimal(1),
        lengthRetainedDecimal: new Decimal('0.2'),
        lengthEnhancedDecimal: new Decimal(0),
        lengthLost: 0.8,
        lengthLostDecimal: new Decimal('0.8'),
        unitsLost: 0.8,
        unitsLostDecimal: new Decimal('0.8'),
        totalHedgerowUnits: 1,
        totalHedgerowUnitsDecimal: new Decimal(1),
        totalHedgerowUnitsSRM: 1,
        totalHedgerowUnitsSRMDecimal: new Decimal(1),
        unitsRetainedWithSRM: 0.2,
        unitsRetainedWithSRMDecimal: new Decimal('0.2'),
    };
    const missingRisk = applyOffSiteHedgerowBaselineAvailability(base);
    expect(missingRisk.hedgerowBaselineAvailability.missingSpatialRisk).toBe(true);
    expect(missingRisk.hedgerowBaselineAvailability.unavailableResults).toMatchObject({
        totalHedgerowUnits: 'blank',
        totalHedgerowUnitsSRM: 'blank',
        unitsRetainedWithSRM: 'blank',
        unitsLost: 'blank',
    });
    expect(missingRisk.unitsLost).toBe(0);
    expect(missingRisk.totalHedgerowUnitsSRM).toBe(0);

    const missingReference = applyOffSiteHedgerowBaselineAvailability({
        ...base,
        spatialRiskCategory: risk,
    });
    expect(missingReference.hedgerowBaselineAvailability.missingOffSiteReference).toBe(true);
    expect(missingReference.hedgerowBaselineAvailability.unitsLostError).toBe(true);
    expect(missingReference.hedgerowBaselineAvailability.unavailableResults.unitsLost).toBe('check-data');
    expect(missingReference.unitsLost).toBe(0);
    expect(missingReference.totalHedgerowUnitsSRM).toBe(1);
});

test('off-site delivery keeps raw and spatial-risk results independent', () => {
    const source = {
        spatialRiskCategory: risk,
        offSiteReferenceNumber: 'REF-1',
        hedgerowUnitsDelivered: 4,
        hedgerowUnitsDeliveredDecimal: new Decimal(4),
        hedgerowUnitsDeliveredWithSpatialRisk: 3,
        hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(3),
    };
    const missingReference = applyOffSiteHedgerowDeliveryAvailability({
        ...source,
        offSiteReferenceNumber: undefined,
    });
    expect(missingReference.hedgerowOffSiteAvailability.unavailableResults).toEqual({
        hedgerowUnitsDelivered: 'blank',
    });
    expect(missingReference.hedgerowUnitsDelivered).toBe(0);
    expect(missingReference.hedgerowUnitsDeliveredWithSpatialRisk).toBe(3);

    const missingRisk = applyOffSiteHedgerowDeliveryAvailability({
        ...source,
        spatialRiskCategory: undefined,
    });
    expect(missingRisk.hedgerowOffSiteAvailability.unavailableResults).toEqual({
        hedgerowUnitsDelivered: 'blank',
        hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
    });
    expect(missingRisk.hedgerowUnitsDelivered).toBe(0);
    expect(missingRisk.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);
});

test('quality and timing gates preserve candidates and zero both off-site deliveries selectively', () => {
    const unchanged = applyOffSiteHedgerowEnhancementQuality({
        baseline: baselineQuality,
        habitatType: 'Native hedgerow',
        condition: 'Moderate',
        distinctivenessScore: 2,
        conditionScore: 2,
        timeToTargetCondition: 4,
        temporalMultiplier: 1.2,
        appliedDifficultyMultiplier: 0.8,
        finalDifficultyOfEnhancement: 'Low',
        hedgerowUnitsDelivered: 3,
        hedgerowUnitsDeliveredDecimal: new Decimal(3),
        hedgerowUnitsDeliveredWithSpatialRisk: 2.4,
        hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal('2.4'),
    });
    expect(unchanged.hedgerowEnhancementQuality.status).toBe('no-enhancement');
    expect(unchanged.hedgerowEnhancementQuality.unavailableResults).toMatchObject({
        timeToTargetCondition: 'check-data',
        temporalMultiplier: 'check-data',
        hedgerowUnitsDelivered: 'blank',
        hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
    });
    expect(unchanged.timeToTargetCondition).toBe(4);
    expect(unchanged.temporalMultiplier).toBe(1.2);
    expect(unchanged.hedgerowUnitsDelivered).toBe(0);
    expect(unchanged.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);

    const improved = applyOffSiteHedgerowEnhancementQuality({
        ...unchanged,
        condition: 'Good',
        conditionScore: 3,
        hedgerowUnitsDelivered: 2.5,
        hedgerowUnitsDeliveredDecimal: new Decimal('2.5'),
        hedgerowUnitsDeliveredWithSpatialRisk: 2,
        hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(2),
    });
    expect(improved.hedgerowEnhancementQuality.status).toBe('allowed');
    expect(improved.hedgerowUnitsDelivered).toBe(2.5);
    expect(improved.hedgerowUnitsDeliveredWithSpatialRisk).toBe(2);

    const timing = {
        timeToTargetCondition: 10,
        finalTimeToTargetCondition: 10,
        hedgerowEnhancedInAdvance: 1,
        hedgerowEnhancedDelay: 1,
        hedgerowUnitsDelivered: 5,
        hedgerowUnitsDeliveredDecimal: new Decimal(5),
        hedgerowUnitsDeliveredWithSpatialRisk: 4,
        hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(4),
    };
    const conflict = applyOffSiteHedgerowEnhancementTiming(timing);
    expect(conflict.linearTimingAvailability.status).toBe('forbidden');
    expect(conflict.hedgerowUnitsDelivered).toBe(0);
    expect(conflict.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);

    const overflow = applyOffSiteHedgerowEnhancementTiming({
        ...timing,
        hedgerowEnhancedDelay: 25,
        finalTimeToTargetCondition: '30+',
    });
    expect(overflow.linearTimingAvailability.status).toBe('allowed');
    expect(overflow.hedgerowUnitsDelivered).toBe(5);
    expect(overflow.hedgerowUnitsDeliveredWithSpatialRisk).toBe(4);
});

test('condition and movement adapters carry off-site-specific withholding results', () => {
    const reduced = applyOffSiteHedgerowEnhancementCondition({
        baseline: { conditionScore: 3 },
        conditionScore: 2,
        hedgerowUnitsDelivered: 3,
        hedgerowUnitsDeliveredDecimal: new Decimal(3),
        hedgerowUnitsDeliveredWithSpatialRisk: 2,
        hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(2),
    });
    expect(reduced.enhancementCondition.status).toBe('forbidden');
    expect(reduced.enhancementCondition.unavailableResults).toMatchObject({
        finalDifficultyOfEnhancement: 'check-data',
        finalTimeToTargetMultiplier: 'check-data',
        hedgerowUnitsDelivered: 'blank',
        hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
    });
    expect(reduced.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);

    const movement = gateOffSiteHedgerowEnhancementMovement(addOffSiteHedgerowEnhancementMovement({
        baseline: { habitatType: 'Species-rich native hedgerow' },
        habitatType: 'Native hedgerow',
        hedgerowUnitsDelivered: 3,
        hedgerowUnitsDeliveredDecimal: new Decimal(3),
        hedgerowUnitsDeliveredWithSpatialRisk: 2,
        hedgerowUnitsDeliveredWithSpatialRiskDecimal: new Decimal(2),
    }));
    expect(movement.enhancementMovement.status).toBe('forbidden');
    expect(movement.enhancementMovement.unavailableResults).toMatchObject({
        finalTimeToTargetMultiplier: 'check-data',
        hedgerowUnitsDelivered: 'blank',
        hedgerowUnitsDeliveredWithSpatialRisk: 'blank',
    });
    expect(movement.hedgerowUnitsDelivered).toBe(0);
    expect(movement.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);
});

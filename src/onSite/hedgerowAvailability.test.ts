import { expect, test } from 'bun:test';
import { Decimal } from '../decimal';
import {
    addOnSiteHedgerowEnhancementMovement,
    applyOnSiteHedgerowBaselineAvailability,
    applyOnSiteHedgerowEnhancementCondition,
    applyOnSiteHedgerowEnhancementQuality,
    gateOnSiteHedgerowEnhancementMovement,
} from './hedgerowAvailability';
import { applyOnSiteHedgerowEnhancementTiming } from './hedgerowTiming';

const baselineQuality = {
    habitatType: 'Native hedgerow',
    condition: 'Moderate',
    distinctivenessScore: 2,
    conditionScore: 2,
} as const;

test('baseline allocation uses exact lengths and only gates loss outputs when overallocated', () => {
    const exactFit = applyOnSiteHedgerowBaselineAvailability({
        lengthDecimal: new Decimal('0.3'),
        lengthRetainedDecimal: new Decimal('0.1'),
        lengthEnhancedDecimal: new Decimal('0.2'),
        lengthLost: 0,
        lengthLostDecimal: new Decimal(0),
        unitsLost: 0,
        unitsLostDecimal: new Decimal(0),
        unitsRetained: 0.6,
        unitsRetainedDecimal: new Decimal('0.6'),
    });
    expect(exactFit.hedgerowBaselineAvailability.status).toBe('allowed');
    expect(exactFit.hedgerowBaselineAvailability).toMatchObject({
        missingSpatialRisk: false,
        missingOffSiteReference: false,
        offSite: false,
        unitsLostError: false,
    });

    const overallocated = applyOnSiteHedgerowBaselineAvailability({
        lengthDecimal: new Decimal(1),
        lengthRetainedDecimal: new Decimal(0.7),
        lengthEnhancedDecimal: new Decimal('0.4'),
        lengthLost: -0.1,
        lengthLostDecimal: new Decimal('-0.1'),
        unitsLost: -0.2,
        unitsLostDecimal: new Decimal('-0.2'),
        unitsRetained: 1.4,
        unitsRetainedDecimal: new Decimal('1.4'),
    });
    expect(overallocated.hedgerowBaselineAvailability.status).toBe('over-allocated');
    expect(overallocated.hedgerowBaselineAvailability.unavailableResults).toMatchObject({
        lengthLost: 'check-data',
        unitsLost: 'check-data',
    });
    expect(overallocated.lengthLost).toBe(0);
    expect(overallocated.unitsLost).toBe(0);
    expect(overallocated.unitsRetained).toBe(1.4);
});

test('quality distinguishes unchanged scores from any evidenced improvement', () => {
    const unchanged = applyOnSiteHedgerowEnhancementQuality({
        baseline: baselineQuality,
        habitatType: 'Native hedgerow',
        condition: 'Moderate',
        distinctivenessScore: 2,
        conditionScore: 2,
        timeToTargetCondition: 5,
        temporalMultiplier: 0.8,
        hedgerowUnitsDelivered: 3,
        hedgerowUnitsDeliveredDecimal: new Decimal(3),
    });
    expect(unchanged.hedgerowEnhancementQuality.status).toBe('no-enhancement');
    expect(unchanged.hedgerowEnhancementQuality.unavailableResults).toMatchObject({
        timeToTargetCondition: 'check-data',
        temporalMultiplier: 'check-data',
        hedgerowUnitsDelivered: 'blank',
    });
    expect(unchanged.timeToTargetCondition).toBe(5);
    expect(unchanged.temporalMultiplier).toBe(0.8);
    expect(unchanged.hedgerowUnitsDelivered).toBe(0);
    expect(unchanged.hedgerowUnitsDeliveredDecimal.isZero()).toBeTrue();

    const improved = applyOnSiteHedgerowEnhancementQuality({
        ...unchanged,
        condition: 'Good',
        conditionScore: 3,
        hedgerowUnitsDelivered: 2.5,
        hedgerowUnitsDeliveredDecimal: new Decimal('2.5'),
    });
    expect(improved.hedgerowEnhancementQuality.status).toBe('allowed');
    expect(improved.hedgerowUnitsDelivered).toBe(2.5);
});

test('numeric timing conflicts gate delivery while sentinel and overflow formulas retain it', () => {
    const source = {
        timeToTargetCondition: 10,
        finalTimeToTargetCondition: 10,
        hedgerowEnhancedInAdvance: 1,
        hedgerowEnhancedDelay: 1,
        hedgerowUnitsDelivered: 5,
        hedgerowUnitsDeliveredDecimal: new Decimal(5),
    };
    const conflict = applyOnSiteHedgerowEnhancementTiming(source);
    expect(conflict.linearTimingAvailability.status).toBe('forbidden');
    expect(conflict.hedgerowUnitsDelivered).toBe(0);
    expect(conflict.hedgerowUnitsDeliveredDecimal.isZero()).toBeTrue();

    const sentinel = applyOnSiteHedgerowEnhancementTiming({
        ...source,
        hedgerowEnhancedInAdvance: '30+',
        finalTimeToTargetCondition: 0,
    });
    expect(sentinel.linearTimingAvailability.status).toBe('allowed');
    expect(sentinel.hedgerowUnitsDelivered).toBe(5);

    const overflow = applyOnSiteHedgerowEnhancementTiming({
        ...source,
        hedgerowEnhancedInAdvance: 1,
        hedgerowEnhancedDelay: 25,
        finalTimeToTargetCondition: '30+',
    });
    expect(overflow.linearTimingAvailability.status).toBe('allowed');
    expect(overflow.hedgerowUnitsDelivered).toBe(5);
});

test('condition and movement adapters expose their specific withholding maps', () => {
    const reduced = applyOnSiteHedgerowEnhancementCondition({
        baseline: { conditionScore: 3 },
        conditionScore: 2,
        hedgerowUnitsDelivered: 3,
        hedgerowUnitsDeliveredDecimal: new Decimal(3),
    });
    expect(reduced.enhancementCondition.status).toBe('forbidden');
    expect(reduced.enhancementCondition.unavailableResults).toMatchObject({
        standardOrAdjustedTimeToTargetCondition: 'check-data',
        finalDifficultyOfEnhancement: 'check-data',
        hedgerowUnitsDelivered: 'blank',
    });
    expect(reduced.hedgerowUnitsDelivered).toBe(0);

    const movement = gateOnSiteHedgerowEnhancementMovement(addOnSiteHedgerowEnhancementMovement({
        baseline: { habitatType: 'Species-rich native hedgerow' },
        habitatType: 'Native hedgerow',
        hedgerowUnitsDelivered: 3,
        hedgerowUnitsDeliveredDecimal: new Decimal(3),
    }));
    expect(movement.enhancementMovement.status).toBe('forbidden');
    expect(movement.enhancementMovement.unavailableResults).toMatchObject({
        finalTimeToTargetCondition: 'check-data',
        hedgerowUnitsDelivered: 'blank',
    });
    expect(movement.hedgerowUnitsDelivered).toBe(0);
});

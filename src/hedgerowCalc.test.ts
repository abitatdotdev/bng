import { expect, test } from 'bun:test';
import { calculateFinalTimeToTargetCondition } from './hedgerowCalc';

test('returns zero when the standard creation time is zero', () => {
    expect(calculateFinalTimeToTargetCondition({ standardTimeToTargetCondition: 0, habitatCreatedInAdvance: 0, delayInStartingHabitatCreation: 0 }).finalTimeToTargetCondition).toBe(0);
});

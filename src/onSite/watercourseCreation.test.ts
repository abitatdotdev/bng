import { describe, test, expect } from 'bun:test';
import * as v from 'valibot';
import {
    onSiteWatercourseCreationSchema,
    type OnSiteWatercourseCreationSchema,
    enrichWithWatercourseData,
    enrichWithTemporalData,
    enrichWithDifficultyData,
    enrichWithEncroachmentData,
    enrichWithNetUnitChange,
} from './watercourseCreation';

describe('onSiteWatercourseCreationSchema', () => {
    test('should validate a basic watercourse creation', () => {
        const input: OnSiteWatercourseCreationSchema = {
            watercourseType: 'Ditches',
            length: 1.5,
            condition: 'Moderate',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            watercourseEncroachment: 'Full',
            riparianEncroachment: 'None',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-001',
        };

        const result = v.parse(onSiteWatercourseCreationSchema, input);

        expect(result.distinctiveness).toBe('Medium');
        expect(result.distinctivenessScore).toBe(4);
        expect(result.conditionScore).toBe(2);
        expect(result.netUnitChange).toBeGreaterThan(0);
    });

    test('should reject both advance and delay being set', () => {
        const input: OnSiteWatercourseCreationSchema = {
            watercourseType: 'Ditches',
            length: 1.5,
            condition: 'Moderate',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 2,
            delayInStarting: 3,
            watercourseEncroachment: 'Full',
            riparianEncroachment: 'None',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-001',
        };

        expect(() => v.parse(onSiteWatercourseCreationSchema, input)).toThrow();
    });

    test('should reject culvert with non-culvert encroachment', () => {
        const input: OnSiteWatercourseCreationSchema = {
            watercourseType: 'Culvert',
            length: 0.5,
            condition: 'Poor',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            watercourseEncroachment: 'Full', // Should be N/A - Culvert
            riparianEncroachment: 'N/A - Culvert',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-002',
        };

        expect(() => v.parse(onSiteWatercourseCreationSchema, input)).toThrow();
    });

    test('should accept culvert with N/A - Culvert encroachment', () => {
        const input: OnSiteWatercourseCreationSchema = {
            watercourseType: 'Culvert',
            length: 0.5,
            condition: 'Poor',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            watercourseEncroachment: 'N/A - Culvert',
            riparianEncroachment: 'N/A - Culvert',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-002',
        };

        const result = v.parse(onSiteWatercourseCreationSchema, input);
        expect(result.watercourseType).toBe('Culvert');
        expect(result.netUnitChange).toBeGreaterThan(0);
    });

    test('should reject invalid condition for watercourse type', () => {
        const input: OnSiteWatercourseCreationSchema = {
            watercourseType: 'Culvert',
            length: 0.5,
            condition: 'Good', // Not possible for Culvert
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            watercourseEncroachment: 'N/A - Culvert',
            riparianEncroachment: 'N/A - Culvert',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-003',
        };

        expect(() => v.parse(onSiteWatercourseCreationSchema, input)).toThrow();
    });
});

describe('enrichWithWatercourseData', () => {
    test('should enrich data with watercourse properties', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Moderate' as const,
            strategicSignificance: 'Location ecologically desirable but not in local strategy' as const,
        };

        const result = enrichWithWatercourseData(input);

        expect(result.distinctiveness).toBe('Medium');
        expect(result.distinctivenessScore).toBe(4);
        expect(result.conditionScore).toBe(2);
        expect(result.standardTimeToTarget).toBe(2);
        expect(result.standardDifficulty).toBe('Low');
    });

    test('should handle watercourse with no years to target data', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Good' as const, // Not in yearsToTargetConditionViaCreation map
            strategicSignificance: 'Location ecologically desirable but not in local strategy' as const,
        };

        const result = enrichWithWatercourseData(input);

        expect(result.standardTimeToTarget).toBe(0);
    });

    test('should handle priority habitat', () => {
        const input = {
            watercourseType: 'Priority habitat' as const,
            condition: 'Moderate' as const,
            strategicSignificance: 'Formally identified in local strategy' as const,
        };

        const result = enrichWithWatercourseData(input);

        expect(result.distinctiveness).toBe('V.High');
        expect(result.distinctivenessScore).toBe(8);
        expect(result.conditionScore).toBe(2);
        expect(result.standardTimeToTarget).toBe(8);
        expect(result.standardDifficulty).toBe('Medium');
    });
});

describe('enrichWithTemporalData', () => {
    test('should calculate temporal multiplier with no advance or delay', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Moderate' as const,
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            standardTimeToTarget: 2,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(2);
        expect(result.temporalMultiplier).toBe(0.931225);
        expect(result.isDitchFairlyCategory).toBe(false);
    });

    test('should reduce time with advance creation', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Moderate' as const,
            habitatCreatedInAdvance: 1,
            delayInStarting: 0,
            standardTimeToTarget: 2,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(1);
        expect(result.temporalMultiplier).toBe(0.965);
    });

    test('should increase time with delay', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Moderate' as const,
            habitatCreatedInAdvance: 0,
            delayInStarting: 3,
            standardTimeToTarget: 2,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(5);
        expect(result.temporalMultiplier).toBe(0.8368287006);
    });

    test('should cap time at 30 years', () => {
        const input = {
            watercourseType: 'Priority habitat' as const,
            condition: 'Moderate' as const,
            habitatCreatedInAdvance: 0,
            delayInStarting: 25,
            standardTimeToTarget: 8,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(30);
        expect(result.temporalMultiplier).toBe(0.3434151104);
    });

    test('should not go below 0 years', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Moderate' as const,
            habitatCreatedInAdvance: 5,
            delayInStarting: 0,
            standardTimeToTarget: 2,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(0);
        expect(result.temporalMultiplier).toBe(1);
    });

    test('should detect ditch fairly category', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Fairly Poor' as const,
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            standardTimeToTarget: 0,
        };

        const result = enrichWithTemporalData(input);

        expect(result.isDitchFairlyCategory).toBe(true);
    });
});

describe('enrichWithDifficultyData', () => {
    test('should use standard difficulty for non-ditch', () => {
        const input = {
            watercourseType: 'Priority habitat' as const,
            condition: 'Moderate' as const,
            standardDifficulty: 'Medium',
            isDitchFairlyCategory: false,
            habitatCreatedInAdvance: 0,
        };

        const result = enrichWithDifficultyData(input);

        expect(result.appliedDifficulty).toBe('Medium');
        expect(result.difficultyMultiplier).toBe(1.1);
    });

    test('should use low difficulty for ditch fairly category with advance creation', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Fairly Poor' as const,
            standardDifficulty: 'Low',
            isDitchFairlyCategory: true,
            habitatCreatedInAdvance: 2,
        };

        const result = enrichWithDifficultyData(input);

        expect(result.appliedDifficulty).toBe('Low');
        expect(result.difficultyMultiplier).toBe(1);
    });

    test('should use standard difficulty for ditch fairly category without advance creation', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Fairly Poor' as const,
            standardDifficulty: 'Low',
            isDitchFairlyCategory: true,
            habitatCreatedInAdvance: 0,
        };

        const result = enrichWithDifficultyData(input);

        expect(result.appliedDifficulty).toBe('Low');
        expect(result.difficultyMultiplier).toBe(1);
    });

    test('should handle high difficulty', () => {
        const input = {
            watercourseType: 'Other rivers and streams' as const,
            condition: 'Good' as const,
            standardDifficulty: 'High',
            isDitchFairlyCategory: false,
            habitatCreatedInAdvance: 0,
        };

        const result = enrichWithDifficultyData(input);

        expect(result.appliedDifficulty).toBe('High');
        expect(result.difficultyMultiplier).toBe(1.5);
    });
});

describe('enrichWithEncroachmentData', () => {
    test('should calculate encroachment multipliers', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            watercourseEncroachment: 'Full' as const,
            riparianEncroachment: 'None' as const,
        };

        const result = enrichWithEncroachmentData(input);

        expect(result.watercourseEncroachmentMultiplier).toBe(1);
        expect(result.riparianEncroachmentMultiplier).toBe(1);
    });

    test('should handle partial encroachment', () => {
        const input = {
            watercourseType: 'Other rivers and streams' as const,
            watercourseEncroachment: '50%' as const,
            riparianEncroachment: 'Within 10m' as const,
        };

        const result = enrichWithEncroachmentData(input);

        expect(result.watercourseEncroachmentMultiplier).toBe(0.7);
        expect(result.riparianEncroachmentMultiplier).toBe(0.9);
    });

    test('should handle N/A - Culvert encroachment', () => {
        const input = {
            watercourseType: 'Culvert' as const,
            watercourseEncroachment: 'N/A - Culvert' as const,
            riparianEncroachment: 'N/A - Culvert' as const,
        };

        const result = enrichWithEncroachmentData(input);

        expect(result.watercourseEncroachmentMultiplier).toBe(1);
        expect(result.riparianEncroachmentMultiplier).toBe(1);
    });

    test('should handle no encroachment', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            watercourseEncroachment: 'None' as const,
            riparianEncroachment: 'Within 50m' as const,
        };

        const result = enrichWithEncroachmentData(input);

        expect(result.watercourseEncroachmentMultiplier).toBe(0.25);
        expect(result.riparianEncroachmentMultiplier).toBe(0.67);
    });
});

describe('enrichWithNetUnitChange', () => {
    test('should calculate net unit change', () => {
        const input = {
            length: 1.5,
            distinctivenessScore: 4,
            conditionScore: 2 as number | 'Not possible',
            strategicSignificanceMultiplier: 1.1,
            temporalMultiplier: 0.98,
            difficultyMultiplier: 1,
            watercourseEncroachmentMultiplier: 1,
            riparianEncroachmentMultiplier: 1,
        };

        const result = enrichWithNetUnitChange(input);

        // 1.5 * 4 * 2 * 1.1 * 0.98 * 1 * 1 * 1 = 12.936
        expect(result.netUnitChange).toBeCloseTo(12.936, 2);
    });

    test('should calculate net unit change with multiple multipliers', () => {
        const input = {
            length: 2,
            distinctivenessScore: 8,
            conditionScore: 2.5 as number | 'Not possible',
            strategicSignificanceMultiplier: 1.15,
            temporalMultiplier: 0.95,
            difficultyMultiplier: 1.1,
            watercourseEncroachmentMultiplier: 0.7,
            riparianEncroachmentMultiplier: 0.9,
        };

        const result = enrichWithNetUnitChange(input);

        // 2 * 8 * 2.5 * 1.15 * 0.95 * 1.1 * 0.7 * 0.9 = 30.2841
        expect(result.netUnitChange).toBeCloseTo(30.2841, 2);
    });
});

describe('Integration tests', () => {
    test('should calculate complete watercourse creation scenario', () => {
        const input: OnSiteWatercourseCreationSchema = {
            watercourseType: 'Other rivers and streams',
            length: 2.5,
            condition: 'Moderate',
            strategicSignificance: 'Formally identified in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 2,
            watercourseEncroachment: '75%',
            riparianEncroachment: 'Within 10m',
            userComments: 'New river creation project',
            planningAuthorityComments: 'Approved with conditions',
            habitatReferenceNumber: 'WC-100',
        };

        const result = v.parse(onSiteWatercourseCreationSchema, input);

        expect(result.watercourseType).toBe('Other rivers and streams');
        expect(result.distinctiveness).toBe('High');
        expect(result.distinctivenessScore).toBe(6);
        expect(result.conditionScore).toBe(2);
        expect(result.strategicSignificanceMultiplier).toBe(1.15);
        expect(result.finalTimeToTarget).toBe(7); // 5 + 2 delay
        expect(result.temporalMultiplier).toBe(0.7792758067);
        expect(result.appliedDifficulty).toBe('Medium');
        expect(result.difficultyMultiplier).toBe(1.1);
        expect(result.watercourseEncroachmentMultiplier).toBe(0.85);
        expect(result.riparianEncroachmentMultiplier).toBe(0.9);
        expect(result.netUnitChange).toBeGreaterThan(0);
    });

    test('should handle canal creation with advance', () => {
        const input: OnSiteWatercourseCreationSchema = {
            watercourseType: 'Canals',
            length: 1.0,
            condition: 'Moderate',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 1,
            delayInStarting: 0,
            watercourseEncroachment: 'Full',
            riparianEncroachment: 'None',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-200',
        };

        const result = v.parse(onSiteWatercourseCreationSchema, input);

        expect(result.watercourseType).toBe('Canals');
        expect(result.distinctiveness).toBe('Medium');
        expect(result.standardTimeToTarget).toBe(1);
        expect(result.finalTimeToTarget).toBe(0); // 1 - 1 advance
        expect(result.temporalMultiplier).toBe(1); // 0 years = multiplier 1
        expect(result.netUnitChange).toBeGreaterThan(0);
    });
});

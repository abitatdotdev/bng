import { describe, test, expect } from 'bun:test';
import * as v from 'valibot';
import {
    offSiteWatercourseCreationSchema,
    type OffSiteWatercourseCreationSchema,
    enrichWithWatercourseData,
    enrichWithTemporalData,
    enrichWithDifficultyData,
    enrichWithEncroachmentData,
    enrichWithNetUnitChange,
} from './watercourseCreation';

describe('offSiteWatercourseCreationSchema', () => {
    test('should validate a basic watercourse creation', () => {
        const input: OffSiteWatercourseCreationSchema = {
            watercourseType: 'Ditches',
            length: 1.5,
            condition: 'Moderate',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            watercourseEncroachment: 'Full',
            riparianEncroachment: 'None',
            spatialRiskCategory: 'Compensation inside LPA boundary or NCA of impact site',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-001',
        };

        const result = v.parse(offSiteWatercourseCreationSchema, input);

        expect(result.distinctiveness).toBe('Medium');
        expect(result.distinctivenessScore).toBe(4);
        expect(result.conditionScore).toBe(2);
        expect(result.netUnitChange).toBeGreaterThan(0);
    });

    test('should reject both advance and delay being set', () => {
        const input: OffSiteWatercourseCreationSchema = {
            watercourseType: 'Ditches',
            length: 1.5,
            condition: 'Moderate',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 2,
            delayInStarting: 3,
            watercourseEncroachment: 'Full',
            riparianEncroachment: 'None',
            spatialRiskCategory: 'Compensation inside LPA boundary or NCA of impact site',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-001',
        };

        expect(() => v.parse(offSiteWatercourseCreationSchema, input)).toThrow();
    });

    test('should reject culvert with non-culvert encroachment', () => {
        const input: OffSiteWatercourseCreationSchema = {
            watercourseType: 'Culvert',
            length: 0.5,
            condition: 'Poor',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            watercourseEncroachment: 'Full', // Should be N/A - Culvert
            riparianEncroachment: 'N/A - Culvert',
            spatialRiskCategory: 'Compensation inside LPA boundary or NCA of impact site',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-002',
        };

        expect(() => v.parse(offSiteWatercourseCreationSchema, input)).toThrow();
    });

    test('should accept culvert with N/A - Culvert encroachment', () => {
        const input: OffSiteWatercourseCreationSchema = {
            watercourseType: 'Culvert',
            length: 0.5,
            condition: 'Poor',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            watercourseEncroachment: 'N/A - Culvert',
            riparianEncroachment: 'N/A - Culvert',
            spatialRiskCategory: 'Compensation inside LPA boundary or NCA of impact site',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-002',
        };

        const result = v.parse(offSiteWatercourseCreationSchema, input);
        expect(result.watercourseType).toBe('Culvert');
        expect(result.netUnitChange).toBeGreaterThan(0);
    });

    test('should reject invalid condition for watercourse type', () => {
        const input: OffSiteWatercourseCreationSchema = {
            watercourseType: 'Culvert',
            length: 0.5,
            condition: 'Good', // Not possible for Culvert
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            watercourseEncroachment: 'N/A - Culvert',
            riparianEncroachment: 'N/A - Culvert',
            spatialRiskCategory: 'Compensation inside LPA boundary or NCA of impact site',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-003',
        };

        expect(() => v.parse(offSiteWatercourseCreationSchema, input)).toThrow();
    });

    test('should accept various spatial risk categories', () => {
        const spatialRiskCategories = [
            'Compensation inside LPA boundary or NCA of impact site',
            'Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA',
            'Compensation outside LPA or NCA of impact site and neighbouring LPA or NCA',
        ] as const;

        spatialRiskCategories.forEach(spatialRiskCategory => {
            const input: OffSiteWatercourseCreationSchema = {
                watercourseType: 'Ditches',
                length: 1.5,
                condition: 'Moderate',
                strategicSignificance: 'Location ecologically desirable but not in local strategy',
                habitatCreatedInAdvance: 0,
                delayInStarting: 0,
                watercourseEncroachment: 'Full',
                riparianEncroachment: 'None',
                spatialRiskCategory,
                userComments: '',
                planningAuthorityComments: '',
                habitatReferenceNumber: 'WC-001',
            };

            const result = v.parse(offSiteWatercourseCreationSchema, input);
            expect(result.spatialRiskCategory).toBe(spatialRiskCategory);
        });
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
            condition: 'Good' as const,
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
        expect(result.strategicSignificanceMultiplier).toBe(1.15);
    });
});

describe('enrichWithTemporalData', () => {
    test('should calculate final time to target with no advance or delay', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Moderate' as const,
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            standardTimeToTarget: 2,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(2);
        expect(result.temporalMultiplier).toBeGreaterThan(0);
        expect(result.isDitchFairlyCategory).toBe(false);
    });

    test('should calculate final time to target with advance', () => {
        const input = {
            watercourseType: 'Other rivers and streams' as const,
            condition: 'Moderate' as const,
            habitatCreatedInAdvance: 3,
            delayInStarting: 0,
            standardTimeToTarget: 5,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(2);
    });

    test('should calculate final time to target with delay', () => {
        const input = {
            watercourseType: 'Other rivers and streams' as const,
            condition: 'Moderate' as const,
            habitatCreatedInAdvance: 0,
            delayInStarting: 3,
            standardTimeToTarget: 5,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(8);
    });

    test('should cap final time to target at 30', () => {
        const input = {
            watercourseType: 'Priority habitat' as const,
            condition: 'Good' as const,
            habitatCreatedInAdvance: 0,
            delayInStarting: 50,
            standardTimeToTarget: 5,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(30);
    });

    test('should ensure minimum of 0 for final time', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Moderate' as const,
            habitatCreatedInAdvance: 10,
            delayInStarting: 0,
            standardTimeToTarget: 2,
        };

        const result = enrichWithTemporalData(input);

        expect(result.finalTimeToTarget).toBe(0);
    });

    test('should identify ditch fairly category', () => {
        const input1 = {
            watercourseType: 'Ditches' as const,
            condition: 'Fairly Poor' as const,
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            standardTimeToTarget: 2,
        };

        const result1 = enrichWithTemporalData(input1);
        expect(result1.isDitchFairlyCategory).toBe(true);

        const input2 = {
            watercourseType: 'Ditches' as const,
            condition: 'Fairly Good' as const,
            habitatCreatedInAdvance: 0,
            delayInStarting: 0,
            standardTimeToTarget: 2,
        };

        const result2 = enrichWithTemporalData(input2);
        expect(result2.isDitchFairlyCategory).toBe(true);
    });
});

describe('enrichWithDifficultyData', () => {
    test('should apply standard difficulty', () => {
        const input = {
            watercourseType: 'Other rivers and streams' as const,
            condition: 'Moderate' as const,
            standardDifficulty: 'Medium',
            isDitchFairlyCategory: false,
            habitatCreatedInAdvance: 0,
        };

        const result = enrichWithDifficultyData(input);

        expect(result.appliedDifficulty).toBe('Medium');
        expect(result.difficultyMultiplier).toBe(1.1);
    });

    test('should apply low difficulty for ditch fairly category with advance', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Fairly Good' as const,
            standardDifficulty: 'Low',
            isDitchFairlyCategory: true,
            habitatCreatedInAdvance: 5,
        };

        const result = enrichWithDifficultyData(input);

        expect(result.appliedDifficulty).toBe('Low');
        expect(result.difficultyMultiplier).toBe(1);
    });

    test('should not apply low difficulty for ditch fairly category without advance', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            condition: 'Fairly Good' as const,
            standardDifficulty: 'Low',
            isDitchFairlyCategory: true,
            habitatCreatedInAdvance: 0,
        };

        const result = enrichWithDifficultyData(input);

        expect(result.appliedDifficulty).toBe('Low');
        expect(result.difficultyMultiplier).toBe(1);
    });

    test('should handle all difficulty levels', () => {
        const difficulties = [
            { level: 'Low', multiplier: 1 },
            { level: 'Medium', multiplier: 1.1 },
            { level: 'High', multiplier: 1.5 },
            { level: 'Very High', multiplier: 2 },
        ];

        difficulties.forEach(({ level, multiplier }) => {
            const input = {
                watercourseType: 'Other rivers and streams' as const,
                condition: 'Moderate' as const,
                standardDifficulty: level,
                isDitchFairlyCategory: false,
                habitatCreatedInAdvance: 0,
            };

            const result = enrichWithDifficultyData(input);
            expect(result.difficultyMultiplier).toBe(multiplier);
        });
    });
});

describe('enrichWithEncroachmentData', () => {
    test('should calculate encroachment multipliers', () => {
        const input = {
            watercourseType: 'Other rivers and streams' as const,
            watercourseEncroachment: 'Full' as const,
            riparianEncroachment: 'None' as const,
        };

        const result = enrichWithEncroachmentData(input);

        expect(result.watercourseEncroachmentMultiplier).toBe(1);
        expect(result.riparianEncroachmentMultiplier).toBe(1);
    });

    test('should handle partial encroachment', () => {
        const input = {
            watercourseType: 'Ditches' as const,
            watercourseEncroachment: '50%' as const,
            riparianEncroachment: 'Within 10m' as const,
        };

        const result = enrichWithEncroachmentData(input);

        expect(result.watercourseEncroachmentMultiplier).toBe(0.7);
        expect(result.riparianEncroachmentMultiplier).toBe(0.9);
    });

    test('should handle culvert encroachment', () => {
        const input = {
            watercourseType: 'Culvert' as const,
            watercourseEncroachment: 'N/A - Culvert' as const,
            riparianEncroachment: 'N/A - Culvert' as const,
        };

        const result = enrichWithEncroachmentData(input);

        expect(result.watercourseEncroachmentMultiplier).toBe(1);
        expect(result.riparianEncroachmentMultiplier).toBe(1);
    });
});

describe('enrichWithNetUnitChange', () => {
    test('should calculate net unit change - basic case', () => {
        const input = {
            length: 1,
            distinctivenessScore: 4,
            conditionScore: 2 as number | 'Not possible',
            strategicSignificanceMultiplier: 1.1,
            temporalMultiplier: 0.67,
            difficultyMultiplier: 1,
            watercourseEncroachmentMultiplier: 1,
            riparianEncroachmentMultiplier: 1,
        };

        const result = enrichWithNetUnitChange(input);

        // 1 * 4 * 2 * 1.1 * 0.67 * 1 * 1 * 1 = 5.896
        expect(result.netUnitChange).toBeCloseTo(5.896, 3);
    });

    test('should calculate net unit change - with encroachment', () => {
        const input = {
            length: 2,
            distinctivenessScore: 6,
            conditionScore: 2.5 as number | 'Not possible',
            strategicSignificanceMultiplier: 1.15,
            temporalMultiplier: 0.82,
            difficultyMultiplier: 1.1,
            watercourseEncroachmentMultiplier: 0.7,
            riparianEncroachmentMultiplier: 0.9,
        };

        const result = enrichWithNetUnitChange(input);

        // 2 * 6 * 2.5 * 1.15 * 0.82 * 1.1 * 0.7 * 0.9
        const expected = 2 * 6 * 2.5 * 1.15 * 0.82 * 1.1 * 0.7 * 0.9;
        expect(result.netUnitChange).toBeCloseTo(expected, 3);
    });

    test('should handle zero length', () => {
        const input = {
            length: 0,
            distinctivenessScore: 4,
            conditionScore: 2 as number | 'Not possible',
            strategicSignificanceMultiplier: 1.1,
            temporalMultiplier: 0.67,
            difficultyMultiplier: 1,
            watercourseEncroachmentMultiplier: 1,
            riparianEncroachmentMultiplier: 1,
        };

        const result = enrichWithNetUnitChange(input);

        expect(result.netUnitChange).toBe(0);
    });
});

describe('full schema integration tests', () => {
    test('should process complete watercourse creation', () => {
        const input: OffSiteWatercourseCreationSchema = {
            watercourseType: 'Other rivers and streams',
            length: 2.5,
            condition: 'Moderate',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 2,
            delayInStarting: 0,
            watercourseEncroachment: '75%',
            riparianEncroachment: 'Within 10m',
            spatialRiskCategory: 'Compensation inside LPA boundary or NCA of impact site',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-004',
        };

        const result = v.parse(offSiteWatercourseCreationSchema, input);

        expect(result.distinctivenessScore).toBe(6);
        expect(result.conditionScore).toBe(2);
        expect(result.strategicSignificanceMultiplier).toBe(1.1);
        expect(result.watercourseEncroachmentMultiplier).toBe(0.85);
        expect(result.riparianEncroachmentMultiplier).toBe(0.9);
        expect(result.finalTimeToTarget).toBeGreaterThanOrEqual(0);
        expect(result.netUnitChange).toBeGreaterThan(0);
    });

    test('should calculate units with maximum temporal discount', () => {
        const input: OffSiteWatercourseCreationSchema = {
            watercourseType: 'Priority habitat',
            length: 1,
            condition: 'Good',
            strategicSignificance: 'Formally identified in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 30,
            watercourseEncroachment: 'Full',
            riparianEncroachment: 'None',
            spatialRiskCategory: 'Compensation inside LPA boundary or NCA of impact site',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-005',
        };

        const result = v.parse(offSiteWatercourseCreationSchema, input);

        // With 30 year delay, temporal multiplier should be 0.3434151104
        expect(result.finalTimeToTarget).toBe(30);
        expect(result.temporalMultiplier).toBeCloseTo(0.3434151104, 5);
        expect(result.netUnitChange).toBeGreaterThan(0);
    });
});

import { describe, test, expect } from 'bun:test';
import * as v from 'valibot';
import {
    onSiteWatercourseCreationSchema,
    type OnSiteWatercourseCreationSchema,
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

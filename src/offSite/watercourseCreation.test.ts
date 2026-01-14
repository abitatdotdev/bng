import { describe, test, expect } from 'bun:test';
import * as v from 'valibot';
import {
    offSiteWatercourseCreationSchema,
    type OffSiteWatercourseCreationSchema,
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

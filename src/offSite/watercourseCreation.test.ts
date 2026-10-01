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
            watercourseEncroachment: 'No Encroachment',
            riparianEncroachment: 'No Encroachment/ No Encroachment',
            spatialRiskCategory: 'Within waterbody catchment',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-001',
        };

        const result = v.parse(offSiteWatercourseCreationSchema, input);

        expect(result.distinctiveness).toBe('Medium');
        expect(result.distinctivenessScore).toBe(4);
        expect(result.conditionScore).toBe(2);
        expect(result.unitsDelivered).toBeGreaterThan(0);
    });

    test('should reject both advance and delay being set', () => {
        const input: OffSiteWatercourseCreationSchema = {
            watercourseType: 'Ditches',
            length: 1.5,
            condition: 'Moderate',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            habitatCreatedInAdvance: 2,
            delayInStarting: 3,
            watercourseEncroachment: 'No Encroachment',
            riparianEncroachment: 'No Encroachment/ No Encroachment',
            spatialRiskCategory: 'Within waterbody catchment',
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
            spatialRiskCategory: 'Within waterbody catchment',
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
            spatialRiskCategory: 'Within waterbody catchment',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-002',
        };

        const result = v.parse(offSiteWatercourseCreationSchema, input);
        expect(result.watercourseType).toBe('Culvert');
        expect(result.unitsDelivered).toBeGreaterThan(0);
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
            spatialRiskCategory: 'Within waterbody catchment',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-003',
        };

        expect(() => v.parse(offSiteWatercourseCreationSchema, input)).toThrow();
    });

    test('should accept various spatial risk categories', () => {
        const spatialRiskCategories = [
            'Within waterbody catchment',
            'Outside waterbody catchment, but within operational catchment',
            'Outside operational catchment',
        ] as const;

        spatialRiskCategories.forEach(spatialRiskCategory => {
            const input: OffSiteWatercourseCreationSchema = {
                watercourseType: 'Ditches',
                length: 1.5,
                condition: 'Moderate',
                strategicSignificance: 'Location ecologically desirable but not in local strategy',
                habitatCreatedInAdvance: 0,
                delayInStarting: 0,
                watercourseEncroachment: 'No Encroachment',
                riparianEncroachment: 'No Encroachment/ No Encroachment',
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
            watercourseEncroachment: 'Minor',
            riparianEncroachment: 'Moderate/ Minor',
            spatialRiskCategory: 'Within waterbody catchment',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-004',
        };

        const result = v.parse(offSiteWatercourseCreationSchema, input);

        expect(result.distinctivenessScore).toBe(6);
        expect(result.conditionScore).toBe(2);
        expect(result.strategicSignificanceMultiplier).toBe(1.1);
        expect(result.watercourseEncroachmentMultiplier).toBe(0.8);
        expect(result.riparianEncroachmentMultiplier).toBe(0.9);
        expect(result.finalTimeToTarget).toBeGreaterThanOrEqual(0);
        expect(result.unitsDelivered).toBeGreaterThan(0);
    });

    test('should calculate units with maximum temporal discount', () => {
        const input: OffSiteWatercourseCreationSchema = {
            watercourseType: 'Priority habitat',
            length: 1,
            condition: 'Good',
            strategicSignificance: 'Formally identified in local strategy',
            habitatCreatedInAdvance: 0,
            delayInStarting: 30,
            watercourseEncroachment: 'No Encroachment',
            riparianEncroachment: 'No Encroachment/ No Encroachment',
            spatialRiskCategory: 'Within waterbody catchment',
            userComments: '',
            planningAuthorityComments: '',
            habitatReferenceNumber: 'WC-005',
        };

        const result = v.parse(offSiteWatercourseCreationSchema, input);

        // Standard time plus delay exceeds 30, so use the sentinel multiplier.
        expect(result.finalTimeToTarget).toBe("30+");
        expect(result.temporalMultiplier).toBeCloseTo(0.3197967361, 10);
        expect(result.unitsDelivered).toBeGreaterThan(0);
    });
});


describe('creation time adjustments', () => {
    const schema = offSiteWatercourseCreationSchema;
    for (const [delay, time, multiplier, units] of [[24, 29, 0.3558705807, 1.907466312552], [25, 30, 0.3434151104, 1.840704991744], ['30+', '30+', 0.3197967361, 1.714110505496]] as const) {
        test(`applies the ${time}-year temporal multiplier after a ${delay}-year delay`, () => {
            const result = v.parse(schema, {
                watercourseType: 'Ditches', length: 1, condition: 'Moderate',
                strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
                delayInStarting: delay,
                watercourseEncroachment: 'No Encroachment', riparianEncroachment: 'No Encroachment/ No Encroachment',
                spatialRiskCategory: 'Within waterbody catchment', offSiteReferenceNumber: 'gain-site',
            });
            expect(result.finalTimeToTarget).toBe(time);
            expect(result.temporalMultiplier).toBe(multiplier);
            expect(Math.abs(result.unitsDelivered - units)).toBeLessThanOrEqual(1e-8);
        });
    }
    test('habitat created over 30 years in advance delivers undiscounted units', () => {
        const result = v.parse(schema, {
            watercourseType: 'Ditches', length: 1, condition: 'Moderate',
            strategicSignificance: 'Area/compensation not in local strategy/ no local strategy',
            habitatCreatedInAdvance: '30+',
            watercourseEncroachment: 'No Encroachment', riparianEncroachment: 'No Encroachment/ No Encroachment',
            spatialRiskCategory: 'Within waterbody catchment', offSiteReferenceNumber: 'gain-site',
        });
        expect(result.finalTimeToTarget).toBe(0);
        expect(result.temporalMultiplier).toBe(1);
        expect(result.unitsDelivered).toBe(8);
    });
});

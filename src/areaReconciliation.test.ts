import { describe, expect, test } from 'bun:test';
import { calculateAreaReconciliation, countsTowardsSiteArea } from './areaReconciliation';
import { featuresFromInput, type BngInput } from './parsers/featuresFromInput';

const baseline = {
    broadHabitat: 'Grassland',
    habitatType: 'Modified grassland',
    condition: 'Moderate',
    strategicSignificance: 'Location ecologically desirable but not in local strategy',
    irreplaceableHabitat: false,
    area: 1,
    areaRetained: 0.79,
    areaEnhanced: 0.2,
} as const;

function reconcile(input: BngInput) {
    return calculateAreaReconciliation(featuresFromInput(input, { validate: false }).features);
}

describe('area reconciliation', () => {
    test('uses the workbook 0.01 creation tolerance and exact enhancement equality', () => {
        const result = reconcile({
            onSiteHabitatBaselines: [baseline],
            onSiteHabitatCreations: [{
                broadHabitat: 'Grassland',
                habitatType: 'Modified grassland',
                condition: 'Moderate',
                strategicSignificance: 'Location ecologically desirable but not in local strategy',
                area: 0.02,
            }],
            onSiteHabitatEnhancements: [{
                baseline: { ...baseline, areaEnhanced: '0.2000000000000001' },
                broadHabitat: 'Grassland',
                habitatType: 'Modified grassland',
                condition: 'Moderate',
                strategicSignificance: 'Location ecologically desirable but not in local strategy',
            }],
        });

        expect(result.onSite.creationMatchesLoss).toBe(true);
        expect(result.onSite.enhancementMatchesBaseline).toBe(false);
        expect(result.onSite.enhancementDifference.toString()).toBe('1e-16');
    });

    test('keeps irreplaceable headline presence separate from narrow area exclusions', () => {
        const result = reconcile({
            onSiteHabitatBaselines: [
                { ...baseline, broadHabitat: 'Individual trees', habitatType: 'Rural tree', area: 2, irreplaceableHabitat: true },
                { ...baseline, broadHabitat: 'Intertidal hard structures', habitatType: 'Artificial hard structures', area: 3, irreplaceableHabitat: true },
                { ...baseline, area: 1, irreplaceableHabitat: true },
            ],
            offSiteHabitatBaselines: [{
                ...baseline,
                spatialRiskCategory: 'Compensation outside LPA or NCA of impact site and neighbouring LPA or NCA',
                offSiteReferenceNumber: 'OFF-001',
                area: 0,
                irreplaceableHabitat: true,
            }],
        });

        expect(countsTowardsSiteArea('Artificial hard structures')).toBe(false);
        expect(result.irreplaceableHabitatPresent).toBe(true);
        expect(result.onSite.irreplaceableArea.toString()).toBe('4');
        expect(result.offSite.irreplaceableArea.toString()).toBe('0');
    });

    test('excludes tree creation area from the workbook creation total', () => {
        const result = reconcile({
            onSiteHabitatCreations: [
                {
                    broadHabitat: 'Grassland',
                    habitatType: 'Modified grassland',
                    condition: 'Moderate',
                    strategicSignificance: 'Location ecologically desirable but not in local strategy',
                    area: 0.25,
                },
                {
                    broadHabitat: 'Individual trees',
                    habitatType: 'Rural tree',
                    condition: 'Moderate',
                    strategicSignificance: 'Location ecologically desirable but not in local strategy',
                    area: 2,
                },
            ],
        });

        expect(result.onSite.createdArea.toString()).toBe('0.25');
    });
});

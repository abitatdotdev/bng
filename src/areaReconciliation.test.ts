import { describe, expect, test } from 'bun:test';
import { calculateAreaReconciliation, countsTowardsSiteArea } from './areaReconciliation';
import type { AllFeatures } from './features';

function emptyFeatures(overrides: Partial<AllFeatures> = {}): AllFeatures {
    return {
        onSiteHabitatBaselines: [], onSiteHabitatCreations: [], onSiteHabitatEnhancements: [],
        offSiteHabitatBaselines: [], offSiteHabitatCreations: [], offSiteHabitatEnhancements: [],
        onSiteHedgerowBaselines: [], onSiteHedgerowCreations: [], onSiteHedgerowEnhancements: [],
        offSiteHedgerowBaselines: [], offSiteHedgerowCreations: [], offSiteHedgerowEnhancements: [],
        onSiteWatercourseBaselines: [], onSiteWatercourseCreations: [], onSiteWatercourseEnhancements: [],
        offSiteWatercourseBaselines: [], offSiteWatercourseCreations: [], offSiteWatercourseEnhancements: [],
        ...overrides,
    };
}

describe('area reconciliation', () => {
    test('uses the workbook 0.01 creation tolerance and exact enhancement equality', () => {
        const result = calculateAreaReconciliation(emptyFeatures({
            onSiteHabitatBaselines: [{ habitatType: 'Modified grassland', area: 1, areaHabitatLost: 1, areaEnhanced: 0.2 } as never],
            onSiteHabitatCreations: [{ habitatType: 'Other neutral grassland', area: 0.99 } as never],
            onSiteHabitatEnhancements: [{ habitatType: 'Other neutral grassland', area: '0.2000000000000001' } as never],
        }));

        expect(result.onSite.creationMatchesLoss).toBe(true);
        expect(result.onSite.enhancementMatchesBaseline).toBe(false);
        expect(result.onSite.enhancementDifference.toString()).toBe('1e-16');
    });

    test('keeps irreplaceable headline presence separate from narrow area exclusions', () => {
        const result = calculateAreaReconciliation(emptyFeatures({
            onSiteHabitatBaselines: [
                { habitatType: 'Rural tree', area: 2, irreplaceableHabitat: true } as never,
                { habitatType: 'Artificial hard structures', area: 3, irreplaceableHabitat: true } as never,
                { habitatType: 'Modified grassland', area: 1, irreplaceableHabitat: true } as never,
            ],
            offSiteHabitatBaselines: [{ habitatType: 'Modified grassland', area: 0, irreplaceableHabitat: true } as never],
        }));

        expect(countsTowardsSiteArea('Artificial hard structures')).toBe(false);
        expect(result.irreplaceableHabitatPresent).toBe(true);
        expect(result.onSite.irreplaceableArea.toString()).toBe('4');
        expect(result.offSite.irreplaceableArea.toString()).toBe('0');
    });
});

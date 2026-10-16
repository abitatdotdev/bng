import { expect, test } from 'bun:test';
import { featuresFromInput } from './parsers/featuresFromInput';

test('unchecked habitat-specific condition keeps habitat enrichment when its score lookup is absent', () => {
    const { features, issues } = featuresFromInput({
        onSiteHabitatBaselines: [{
            broadHabitat: 'Grassland',
            habitatType: 'Other neutral grassland',
            area: 1,
            condition: 'N/A - Other',
            strategicSignificance: 'Location ecologically desirable but not in local strategy',
            irreplaceableHabitat: false,
        }],
    }, { validate: false });

    const [row] = features.onSiteHabitatBaselines;
    expect(issues).toEqual([]);
    expect(row?._habitat.label).toBe('Grassland - Other neutral grassland');
    expect(row?.distinctivenessScore).toBe(4);
    expect(row?.conditionScore).toBeUndefined();
    expect(row?.conditionScoreDecimal).toBeUndefined();
    expect(row?.areaCalculationAvailability).toBeDefined();
});

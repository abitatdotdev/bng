import type {
    AreaBaselineUnavailableResults,
    AreaEnhancementMovementInput,
} from './areaCalculationTypes';

const validMovement: AreaEnhancementMovementInput = {
    requiredAction: 'Same broad habitat or a higher distinctiveness habitat required (≥)',
    baselineLabel: 'Grassland - Other neutral grassland',
    proposedLabel: 'Grassland - Other neutral grassland',
    baselineBroadHabitat: 'Grassland',
    proposedBroadHabitat: 'Grassland',
    proposedHabitatType: 'Other neutral grassland',
    baselineDistinctivenessCategory: 'Medium',
    proposedDistinctivenessCategory: 'Medium',
    baselineDistinctivenessScore: 4,
    proposedDistinctivenessScore: 4,
    baselineCondition: 'Moderate',
    proposedCondition: 'Good',
    baselineConditionScore: 2,
    proposedConditionScore: 3,
    irreplaceableHabitat: false,
    offSite: false,
};

// @ts-expect-error Broad habitat must come from the workbook domain.
const invalidBroadHabitat: AreaEnhancementMovementInput = { ...validMovement, proposedBroadHabitat: 'Bog' };
// @ts-expect-error Condition scores come from generated habitat condition maps.
const invalidConditionScore: AreaEnhancementMovementInput = { ...validMovement, baselineConditionScore: 99 };
const invalidBaselineResults: AreaBaselineUnavailableResults = {
    // @ts-expect-error Delivery belongs to the enhancement/creation result families.
    habitatUnitsDelivered: 'blank',
};

void invalidBroadHabitat;
void invalidConditionScore;
void invalidBaselineResults;

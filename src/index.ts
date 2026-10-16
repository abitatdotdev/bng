export * from './parsers';
export * from './headlineResults';
export * from './tradingSummaries';
export * from './unitShortfall';
export * from './groupings';
export * from './temporalMultipliers';
export * from './watercourseEnhancementTemporalMatrix';
export * from './operatorHelpers';
export type { DistinctivenessCategory } from './distinctivenessCategories';
export {
    getSpatialRiskMultiplier,
    getWatercourseSpatialRiskMultiplier,
    type SpatialRiskCategory,
    type WatercourseSpatialRiskCategory,
} from './spatialRisk';
export { getStrategicSignificance } from './strategicSignificanceSchema';

import { allHabitats } from './habitats';
import { allHedgerows } from './hedgerows';
import { allWatercourses } from './watercourses';

export const data = {
    habitats: allHabitats,
    hedgerows: allHedgerows,
    watercourses: allWatercourses
}
export * from './offSiteGainSiteSummary';

export { Decimal, toDecimal, type Quantity } from './decimal';
export { quantitySchema, areaSchema, lengthSchema, yearsSchema } from './schemaUtils';

export type { HedgerowEnhancementMovement } from './hedgerowEnhancementMovements';
export type {
    HedgerowEnhancementMovementState,
    HedgerowEnhancementUnavailableResult,
} from './hedgerowEnhancementMovementGate';

export type {
    HabitatCreationTimingState,
    EnhancementConditionState,
    WatercourseEnhancementMovementState,
} from './calculationAvailability';

export { calculateAreaReconciliation, countsTowardsSiteArea } from './areaReconciliation';
export { calculateWorkbookAggregateAvailability } from './workbookAggregateAvailability';
export type {
    HedgerowOffSiteAvailability,
    HedgerowEnhancementQuality,
    HedgerowBaselineAvailability,
    LinearTimingAvailability,
    WatercourseBaselineAvailability,
    WatercourseOffSiteAvailability,
    WatercourseEnhancementUnitReview,
} from './linearRuleAvailability';
export type { AreaBaselineAvailability } from './areaCalculationRules';

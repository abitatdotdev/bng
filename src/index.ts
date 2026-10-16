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
import type { AllFeatures } from './features';

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

export { calculateAreaReconciliation, countsTowardsSiteArea } from './areaReconciliation';
export { calculateWorkbookAggregateAvailability } from './workbookAggregateAvailability';

type HabitatCreation = AllFeatures['onSiteHabitatCreations'][number] | AllFeatures['offSiteHabitatCreations'][number];
type HedgerowEnhancement = AllFeatures['onSiteHedgerowEnhancements'][number] | AllFeatures['offSiteHedgerowEnhancements'][number];
type WatercourseEnhancement = AllFeatures['onSiteWatercourseEnhancements'][number] | AllFeatures['offSiteWatercourseEnhancements'][number];
type WatercourseCreation = AllFeatures['onSiteWatercourseCreations'][number] | AllFeatures['offSiteWatercourseCreations'][number];
type OffSiteHedgerowDelivery = AllFeatures['offSiteHedgerowCreations'][number] | AllFeatures['offSiteHedgerowEnhancements'][number];
type OffSiteWatercourseDelivery = AllFeatures['offSiteWatercourseCreations'][number] | AllFeatures['offSiteWatercourseEnhancements'][number];

export type HabitatCreationTimingState = HabitatCreation['creationTiming'];
export type EnhancementConditionState = (HedgerowEnhancement | WatercourseEnhancement)['enhancementCondition'];
export type WatercourseEnhancementMovementState = WatercourseEnhancement['enhancementMovement'];
export type HedgerowOffSiteAvailability = OffSiteHedgerowDelivery['hedgerowOffSiteAvailability'];
export type HedgerowEnhancementQuality = HedgerowEnhancement['hedgerowEnhancementQuality'];
export type HedgerowBaselineAvailability = (
    AllFeatures['onSiteHedgerowBaselines'][number] | AllFeatures['offSiteHedgerowBaselines'][number]
)['hedgerowBaselineAvailability'];
export type LinearTimingAvailability = (HedgerowEnhancement | WatercourseCreation | WatercourseEnhancement)['linearTimingAvailability'];
export type WatercourseBaselineAvailability = (
    AllFeatures['onSiteWatercourseBaselines'][number] | AllFeatures['offSiteWatercourseBaselines'][number]
)['watercourseBaselineAvailability'];
export type WatercourseOffSiteAvailability = OffSiteWatercourseDelivery['watercourseOffSiteAvailability'];
export type { WatercourseEnhancementUnitReview } from './watercourseAvailability';
export type {
    AreaBaselineAvailability,
    AreaCreationAvailability,
    AreaEnhancementAvailability,
    AreaEnhancementMovementInput,
    AreaEnhancementMovementResult,
} from './areaCalculationTypes';
export type { WorkbookSheet, WorkbookTotalField } from './workbookAggregateAvailability';

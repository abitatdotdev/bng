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

import { toDecimal } from '../decimal';
import { getWatercourseSpatialRiskMultiplier, type WatercourseSpatialRiskCategory } from '../spatialRisk';

export function enrichWithWatercourseSpatialRisk<Data extends { spatialRiskCategory: WatercourseSpatialRiskCategory }>(
    data: Data,
) {
    const spatialRiskMultiplier = getWatercourseSpatialRiskMultiplier(data.spatialRiskCategory);

    return {
        ...data,
        spatialRiskMultiplier,
        spatialRiskMultiplierDecimal: toDecimal(spatialRiskMultiplier),
    };
}

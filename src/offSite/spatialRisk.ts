import { toDecimal } from '../decimal';
import { getSpatialRiskMultiplier, type SpatialRiskCategory } from '../spatialRisk';

export function enrichWithSpatialRisk<Data extends { spatialRiskCategory: SpatialRiskCategory }>(data: Data) {
    const spatialRiskMultiplier = getSpatialRiskMultiplier(data.spatialRiskCategory);

    return {
        ...data,
        spatialRiskMultiplier,
        spatialRiskMultiplierDecimal: toDecimal(spatialRiskMultiplier),
    };
}

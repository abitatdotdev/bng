import * as v from 'valibot';

export const spatialRiskCategorySchema = v.picklist([
    "Compensation inside LPA boundary or NCA of impact site",
    "Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA",
    "Compensation outside LPA or NCA of impact site and neighbouring LPA or NCA",
    "This metric is being used by an off-site provider",
    "Intertidal habitats - Compensation inside Marine Plan Area of impact site",
    "Intertidal habitats - Compensation outside same Marine Plan Area but in neighbouring Marine Plan Area",
    "Intertidal habitats - Compensation outside Marine Plan Area of impact site and beyond neighbouring Marine Plan Area",
])

export type SpatialRiskCategory = v.InferOutput<typeof spatialRiskCategorySchema>

const spatialRiskMultipliers: Record<SpatialRiskCategory, number> = {
    "Compensation inside LPA boundary or NCA of impact site": 1,
    "Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA": 0.75,
    "Compensation outside LPA or NCA of impact site and neighbouring LPA or NCA": 0.5,
    "This metric is being used by an off-site provider": 1,
    "Intertidal habitats - Compensation inside Marine Plan Area of impact site": 1,
    "Intertidal habitats - Compensation outside same Marine Plan Area but in neighbouring Marine Plan Area": 0.75,
    "Intertidal habitats - Compensation outside Marine Plan Area of impact site and beyond neighbouring Marine Plan Area": 0.5,
}

export function getSpatialRiskMultiplier(category: SpatialRiskCategory): number {
    return spatialRiskMultipliers[category];
}

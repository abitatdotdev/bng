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

import * as v from 'valibot';

export const broadHabitatSchema = v.picklist([
    "Cropland",
    "Grassland",
    "Heathland and shrub",
    "Lakes",
    "Sparsely vegetated land",
    "Urban",
    "Wetland",
    "Woodland and forest",
    "Coastal lagoons",
    "Rocky shore",
    "Coastal saltmarsh",
    "Intertidal sediment",
    "Intertidal hard structures",
    "Watercourse footprint",
    "Individual trees",
    "",
])
export type BroadHabitat = v.InferOutput<typeof broadHabitatSchema>;

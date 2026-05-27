import * as v from 'valibot';
import { fuzzyPicklist } from './valibotPipes';

const broadHabitats = [
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
] as const;

export const broadHabitatSchema = v.pipe(
    fuzzyPicklist(broadHabitats),
    v.title('Broad habitat'),
    v.description('The broad category for the habitat.'),
);
export type BroadHabitat = v.InferOutput<typeof broadHabitatSchema>;

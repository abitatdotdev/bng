import * as v from 'valibot';

export const watercourseTypeSchema = v.picklist([
    "Priority habitat",
    "Other rivers and streams",
    "Ditches",
    "Canals",
    "Culvert",
]);

export type WatercourseType = v.InferOutput<typeof watercourseTypeSchema>;

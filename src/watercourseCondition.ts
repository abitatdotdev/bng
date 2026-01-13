import * as v from 'valibot';

export const watercourseConditionSchema = v.picklist([
    "Good",
    "Fairly Good",
    "Moderate",
    "Fairly Poor",
    "Poor",
]);

export type WatercourseCondition = v.InferOutput<typeof watercourseConditionSchema>;

import * as v from 'valibot';

export const hedgerowConditionSchema = v.picklist([
    "Good",
    "Moderate",
    "Poor",
]);
export type HedgerowCondition = v.InferOutput<typeof hedgerowConditionSchema>;



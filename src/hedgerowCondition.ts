import * as v from 'valibot';

export const hedgerowConditionSchema = v.pipe(
    v.string(),
    v.trim(),
    v.picklist([
        "Good",
        "Moderate",
        "Poor",
    ])
);
export type HedgerowCondition = v.InferOutput<typeof hedgerowConditionSchema>;



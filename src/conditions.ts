import * as v from 'valibot';

export const conditionSchema = v.union([
    v.literal("Good"),
    v.literal("Fairly Good"),
    v.literal("Moderate"),
    v.literal("Fairly Poor"),
    v.literal("Poor"),
    v.literal("Condition Assessment N/A"),
    v.literal("N/A - Other"),
])
export type Condition = v.InferOutput<typeof conditionSchema>


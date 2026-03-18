import * as v from 'valibot';

const conditions = [
    "Good",
    "Fairly Good",
    "Moderate",
    "Fairly Poor",
    "Poor",
    "Condition Assessment N/A",
    "N/A - Other",
] as const;

const conditionLookup = new Map(conditions.map(c => [c.toLowerCase(), c]));

export const conditionSchema = v.pipe(
    v.string(), v.trim(),
    v.transform(s => conditionLookup.get(s.toLowerCase()) ?? s),
    v.picklist(conditions),
)
export type Condition = v.InferOutput<typeof conditionSchema>


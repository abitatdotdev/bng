import * as v from 'valibot';

export const yearsToTargetCondition = {
    "Good": 10,
    "Fairly Good": 8,
    "Moderate": 5,
    "Fairly Poor": 2,
    "Poor": 1,
} as const

export const watercourseConditionSchema = v.pipe(
    v.string(),
    v.trim(),
    v.picklist(Object.keys(yearsToTargetCondition) as (keyof typeof yearsToTargetCondition)[]),
);

export type WatercourseCondition = v.InferOutput<typeof watercourseConditionSchema>;


import * as v from 'valibot';

export const yearsToTargetCondition = {
    "Good": 10,
    "Fairly Good": 8,
    "Moderate": 5,
    "Fairly Poor": 2,
    "Poor": 1,
} as const

const watercourseConditions = Object.keys(yearsToTargetCondition) as (keyof typeof yearsToTargetCondition)[];
const watercourseConditionLookup = new Map(watercourseConditions.map(c => [c.toLowerCase(), c]));

export const watercourseConditionSchema = v.pipe(
    v.string(),
    v.trim(),
    v.transform(s => watercourseConditionLookup.get(s.toLowerCase()) ?? s),
    v.picklist(watercourseConditions),
);

export type WatercourseCondition = v.InferOutput<typeof watercourseConditionSchema>;


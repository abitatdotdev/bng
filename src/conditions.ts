import * as v from 'valibot';
import { fuzzyPicklist } from './valibotPipes';

const conditions = [
    "Good",
    "Fairly Good",
    "Moderate",
    "Fairly Poor",
    "Poor",
    "Condition Assessment N/A",
    "N/A - Other",
] as const;

export const conditionSchema = v.pipe(
    fuzzyPicklist(conditions),
    v.title('Habitat condition'),
    v.description('Outcome of the condition assessment for the habitat parcel.'),
);
export type Condition = v.InferOutput<typeof conditionSchema>


import * as v from 'valibot';
import { allHedgerows, type HedgerowLabel } from './hedgerows';

export const hedgerowTypeSchema = v.picklist(Object.keys(allHedgerows) as [HedgerowLabel, ...HedgerowLabel[]]);
export type HedgerowType = v.InferOutput<typeof hedgerowTypeSchema>;


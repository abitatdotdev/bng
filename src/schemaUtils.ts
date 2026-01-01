import * as v from 'valibot';

export const areaSchema = v.pipe(
    v.number(),
    v.toMinValue(0),
)

export const freeTextSchema = v.optional(v.string());


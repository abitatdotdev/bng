import * as v from 'valibot';

export const areaSchema = v.pipe(
    v.number(),
    v.toMinValue(0),
)

export const freeTextSchema = v.optional(v.string());

export const yearsSchema = v.pipe(
    v.number(),
    v.integer(),
    v.toMinValue(0),
    v.toMaxValue(30),
)


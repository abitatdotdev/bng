import * as v from 'valibot';

export const strategicSignificanceSchema = v.union([
    v.literal("Formally identified in local strategy"),
    v.literal("Location ecologically desirable but not in local strategy"),
    v.literal("Area/compensation not in local strategy/ no local strategy"),
]);


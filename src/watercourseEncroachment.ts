import * as v from 'valibot';

// Watercourse encroachment multipliers
export const watercourseEncroachmentMultipliers = {
    "N/A - Culvert": 1,
    "Full": 1,
    "75%": 0.85,
    "50%": 0.7,
    "25%": 0.55,
    "10%": 0.4,
    "None": 0.25,
} as const;

// Watercourse encroachment levels for creation
export const watercourseEncroachmentCreationSchema = v.picklist(Object.keys(watercourseEncroachmentMultipliers) as (keyof typeof watercourseEncroachmentMultipliers)[]);
export type WatercourseEncroachment = v.InferInput<typeof watercourseEncroachmentCreationSchema>

// Riparian encroachment multipliers
export const riparianEncroachmentMultipliers = {
    "N/A - Culvert": 1,
    "None": 1,
    "Within 10m": 0.9,
    "Within 50m": 0.67,
} as const;

// Riparian encroachment levels for creation
export const riparianEncroachmentCreationSchema = v.picklist(Object.keys(riparianEncroachmentMultipliers) as (keyof typeof riparianEncroachmentMultipliers)[]);
export type RiparianEncroachment = v.InferInput<typeof riparianEncroachmentCreationSchema>


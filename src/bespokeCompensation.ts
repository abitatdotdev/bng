import * as v from 'valibot';

export const bespokeCompensation = [
    "Yes",
    "No",
    "Pending",
] as const
export type BespokeCompensation = typeof bespokeCompensation[number];

export const bespokeCompensationSchema = v.pipe(
    v.string(),
    v.trim(),
    v.picklist(bespokeCompensation),
)

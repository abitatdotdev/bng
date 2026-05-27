import * as v from 'valibot';
import { fuzzyPicklist } from './valibotPipes';

export const bespokeCompensation = [
    "Yes",
    "No",
    "Pending",
] as const
export type BespokeCompensation = typeof bespokeCompensation[number];

export const bespokeCompensationSchema = v.pipe(
    fuzzyPicklist(bespokeCompensation),
    v.title('Bespoke compensation agreed'),
    v.description('Whether bespoke compensation has been agreed for an irreplaceable habitat.'),
);

import * as v from 'valibot';
import { Decimal } from '../decimal';
import { allWatercourses } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema } from '../schemaUtils';
import { watercourseConditionSchema } from '../watercourseCondition';
import { watercourseTypeSchema } from '../watercourseType';
import {
    enrichWithBaselineWatercourseData,
    enrichWithBaselineUnitsData,
    enrichWithTotalWatercourseUnits,
    enrichWithUnitsLost
} from '../watercourses/shared';
import { riparianEncroachmentSchema, watercourseEncroachmentSchema } from '../watercourseEncroachment';
import { bespokeCompensationSchema, type BespokeCompensation } from '../bespokeCompensation';

const inputSchema = v.object({
    watercourseType: watercourseTypeSchema,
    length: lengthSchema,
    condition: watercourseConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    watercourseEncroachment: watercourseEncroachmentSchema,
    riparianEncroachment: riparianEncroachmentSchema,
    lengthRetained: v.optional(lengthSchema, 0),
    lengthEnhanced: v.optional(lengthSchema, 0),
    bespokeCompensation: v.optional(bespokeCompensationSchema, "No"),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
});

export const onSiteWatercourseBaselineSchema = v.pipe(
    inputSchema,
    // Validate that the watercourse type is valid
    v.check(s => !!allWatercourses[s.watercourseType], "Invalid watercourse type"),
    // Check that retained + enhanced doesn't exceed total length
    v.check(
        s => new Decimal(s.lengthRetained).plus(s.lengthEnhanced).lessThanOrEqualTo(s.length),
        "Retained and enhanced lengths cannot exceed total length"
    ),
    // Validate encroachment consistency with watercourse type
    v.check(
        s => s.watercourseType === 'Culvert' ? s.watercourseEncroachment === 'N/A - Culvert' : s.watercourseEncroachment !== 'N/A - Culvert',
        "Culvert watercourses must use 'N/A - Culvert' for watercourse encroachment"
    ),
    v.check(
        s => s.watercourseType === 'Culvert' ? s.riparianEncroachment === 'N/A - Culvert' : s.riparianEncroachment !== 'N/A - Culvert',
        "Culvert watercourses must use 'N/A - Culvert' for riparian encroachment"
    ),
    // Enrich with watercourse data
    v.transform(enrichWithBaselineWatercourseData),
    // Validate that the condition is possible for this watercourse type
    v.check(
        s => typeof s.conditionScore === 'number',
        "The selected condition is not possible for this watercourse type"
    ),
    // Calculate baseline units
    v.transform(enrichWithBaselineUnitsData),
    // Calculate total watercourse units
    v.transform(enrichWithTotalWatercourseUnits),
    // Calculate units lost
    v.transform(enrichWithUnitsLost),
    v.transform(enrichWithVhdhBespokeCompensationUnits),
);

export type OnSiteWatercourseBaselineSchema = v.InferInput<typeof onSiteWatercourseBaselineSchema>;
export type OnSiteWatercourseBaseline = v.InferOutput<typeof onSiteWatercourseBaselineSchema>;
/*
 * Pure calculation of hidden cell AT, used later in the headline results.
 */
export function calculateVhdhBespokeCompensationUnits(input: {
    bespokeCompensation: BespokeCompensation,
    tradingRules: typeof allWatercourses[keyof typeof allWatercourses]['tradingRules'],
    totalWatercourseUnits: number,
    lengthRetained: number,
    lengthEnhanced: number,
}) {
    const vhdhBespokeCompensationUnits =
        (
            input.bespokeCompensation === "Yes"
            || input.bespokeCompensation === "Pending"
        ) && input.tradingRules === "Same habitat required – bespoke compensation option ⚠"
            ? new Decimal(input.totalWatercourseUnits).minus(input.lengthRetained).minus(input.lengthEnhanced).toNumber()
            : 0;

    return { vhdhBespokeCompensationUnits };
}

export function enrichWithVhdhBespokeCompensationUnits<Data extends {
    bespokeCompensation: BespokeCompensation,
    tradingRules: typeof allWatercourses[keyof typeof allWatercourses]['tradingRules'],
    totalWatercourseUnits: number,
    lengthRetained: number,
    lengthEnhanced: number,
}>(data: Data) {
    return { ...data, ...calculateVhdhBespokeCompensationUnits(data) };
}

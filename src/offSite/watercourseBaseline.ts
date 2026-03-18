import * as v from 'valibot';
import { allWatercourses } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema } from '../schemaUtils';
import { watercourseConditionSchema } from '../watercourseCondition';
import { watercourseTypeSchema } from '../watercourseType';
import { spatialRiskCategorySchema } from '../spatialRisk';
import { enrichWithSpatialRisk } from './common';
import { Decimal } from '../decimal';
import {
    enrichWithBaselineWatercourseData,
    enrichWithBaselineUnitsData,
    enrichWithTotalWatercourseUnits,
    enrichWithUnitsLost
} from '../watercourses/shared';
import { riparianEncroachmentSchema, watercourseEncroachmentSchema } from '../watercourseEncroachment';

const inputSchema = v.object({
    watercourseType: watercourseTypeSchema,
    length: lengthSchema,
    condition: watercourseConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    watercourseEncroachment: watercourseEncroachmentSchema,
    riparianEncroachment: riparianEncroachmentSchema,
    spatialRiskCategory: spatialRiskCategorySchema,
    lengthRetained: v.optional(lengthSchema, 0),
    lengthEnhanced: v.optional(lengthSchema, 0),
    proposedLength: v.optional(lengthSchema),
    bespokeCompensation: v.optional(
        v.pipe(
            v.string(),
            v.trim(),
            v.picklist(["Yes", "No", "Pending"])
        ), "No"),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
});

export const offSiteWatercourseBaselineSchema = v.pipe(
    inputSchema,
    v.check(s => !!allWatercourses[s.watercourseType], "Invalid watercourse type"),
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
    // Enrich with spatial risk multiplier
    v.transform(enrichWithSpatialRisk),
    // Check that off-site reference is provided when spatial risk is present
    v.check(
        s => !(s.spatialRiskCategory && !s.offSiteReferenceNumber),
        "Off-site reference required ▲"
    ),
    // Calculate baseline units
    v.transform(enrichWithBaselineUnitsData),
    // Calculate total watercourse units (SRM)
    v.transform(enrichWithTotalWatercourseUnitsSRM),
    // Calculate total watercourse units (without spatial risk)
    v.transform(enrichWithTotalWatercourseUnits),
    // Calculate units lost
    v.transform(enrichWithUnitsLost),
);

export type OffSiteWatercourseBaselineSchema = v.InferInput<typeof offSiteWatercourseBaselineSchema>;
export type OffSiteWatercourseBaseline = v.InferOutput<typeof offSiteWatercourseBaselineSchema>;

/**
 * Calculate total watercourse units (SRM) - includes spatial risk multiplier
 * This is the "Total river units (SRM)" column in the Excel sheet
 */
export function enrichWithTotalWatercourseUnitsSRM<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number | 'Not possible';
    strategicSignificanceMultiplier: number;
    watercourseEncroachmentMultiplier: number;
    riparianEncroachmentMultiplier: number;
    spatialRiskMultiplier: number;
}>(data: Data) {
    // At this point, validation has ensured conditionScore is a number
    const conditionScore = data.conditionScore as number;

    const totalWatercourseUnitsSRM = new Decimal(data.length)
        .mul(data.distinctivenessScore)
        .mul(conditionScore)
        .mul(data.strategicSignificanceMultiplier)
        .mul(data.watercourseEncroachmentMultiplier)
        .mul(data.riparianEncroachmentMultiplier)
        .mul(data.spatialRiskMultiplier)
        .toNumber();

    return {
        ...data,
        totalWatercourseUnitsSRM,
    };
}


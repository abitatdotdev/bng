import * as v from 'valibot';
import { allWatercourses } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema } from '../schemaUtils';
import { watercourseConditionSchema } from '../watercourseCondition';
import { watercourseTypeSchema } from '../watercourseType';
import { riparianEncroachmentSchema, watercourseEncroachmentSchema } from '../watercourseEncroachment';
import { spatialRiskCategorySchema, getSpatialRiskMultiplier } from '../spatialRisk';
import { Decimal } from '../decimal';
import {
    enrichWithCreationWatercourseData,
    enrichWithTemporalData,
    enrichWithDifficultyData,
    enrichCreationWithEncroachmentData,
    enrichWithUnitsDelivered
} from '../watercourses/shared';

const inputSchema = v.object({
    watercourseType: watercourseTypeSchema,
    length: lengthSchema,
    condition: watercourseConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatCreatedInAdvance: v.optional(v.number(), 0),
    delayInStarting: v.optional(v.number(), 0),
    watercourseEncroachment: watercourseEncroachmentSchema,
    riparianEncroachment: riparianEncroachmentSchema,
    spatialRiskCategory: spatialRiskCategorySchema,
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
});

/**
 * Enriches watercourse creation data with spatial risk multiplier
 * Looks up the multiplier based on the spatial risk category
 */
export function enrichWithSpatialRiskMultiplier<Data extends {
    spatialRiskCategory: string;
}>(data: Data) {
    const spatialRiskMultiplier = getSpatialRiskMultiplier(data.spatialRiskCategory as any);

    return {
        ...data,
        spatialRiskMultiplier,
    };
}

/**
 * Calculates SRM-adjusted net unit change for off-site watercourse creation
 * netUnitChangeWithSpatialRisk = netUnitChange * spatialRiskMultiplier
 */
/**
 * Pure calculation: derives netUnitChangeWithSpatialRisk.
 */
export function calculateNetUnitChangeWithSpatialRisk(input: {
    unitsDelivered: number;
    spatialRiskMultiplier: number;
}) {
    const netUnitChangeWithSpatialRisk = new Decimal(input.unitsDelivered).mul(input.spatialRiskMultiplier).toNumber();

    return { netUnitChangeWithSpatialRisk };
}

export function enrichWithWatercourseUnitsDeliveredWithSpatialRisk<Data extends {
    unitsDelivered: number;
    spatialRiskMultiplier: number;
}>(data: Data) {
    return { ...data, ...calculateNetUnitChangeWithSpatialRisk(data) };
}

export const offSiteWatercourseCreationSchema = v.pipe(
    inputSchema,
    // Validate that the watercourse type is valid
    v.check(s => !!allWatercourses[s.watercourseType], "Invalid watercourse type"),
    // Validate temporal inputs - can't have both advance and delay
    v.check(
        s => !(s.habitatCreatedInAdvance > 0 && s.delayInStarting > 0),
        "Cannot have both habitat created in advance and delay in starting"
    ),
    // Enrich with watercourse data
    v.transform(enrichWithCreationWatercourseData),
    // Validate that the condition is possible for this watercourse type
    v.check(
        s => typeof s.conditionScore === 'number',
        "The selected condition is not possible for this watercourse type"
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
    // Enrich with spatial risk multiplier
    v.transform(enrichWithSpatialRiskMultiplier),
    // Calculate temporal adjustments
    v.transform(enrichWithTemporalData),
    // Calculate difficulty multiplier
    v.transform(enrichWithDifficultyData),
    // Calculate encroachment multipliers
    v.transform(enrichCreationWithEncroachmentData),
    // Calculate final net unit change
    v.transform(enrichWithUnitsDelivered),
    // Calculate SRM-adjusted net unit change
    v.transform(enrichWithWatercourseUnitsDeliveredWithSpatialRisk),
);

export type OffSiteWatercourseCreationSchema = v.InferInput<typeof offSiteWatercourseCreationSchema>;
export type OffSiteWatercourseCreation = v.InferOutput<typeof offSiteWatercourseCreationSchema>;

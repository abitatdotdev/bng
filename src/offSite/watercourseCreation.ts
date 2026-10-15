import { Decimal, toDecimal } from '../decimal';
import * as v from 'valibot';
import { allWatercourses } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema, safeTransform, yearsSchema } from '../schemaUtils';
import { watercourseConditionSchema } from '../watercourseCondition';
import { watercourseTypeSchema } from '../watercourseType';
import { riparianEncroachmentSchema, watercourseEncroachmentSchema } from '../watercourseEncroachment';
import { watercourseSpatialRiskCategorySchema, getWatercourseSpatialRiskMultiplier } from '../spatialRisk';

import {
    enrichWithCreationWatercourseData,
    enrichWithTemporalData,
    enrichWithDifficultyData,
    enrichCreationWithEncroachmentData,
    enrichWithUnitsDelivered,
} from '../watercourses/shared';

const inputSchema = v.object({
    watercourseType: watercourseTypeSchema,
    length: lengthSchema,
    condition: watercourseConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatCreatedInAdvance: v.optional(yearsSchema, 0),
    delayInStarting: v.optional(yearsSchema, 0),
    watercourseEncroachment: watercourseEncroachmentSchema,
    riparianEncroachment: riparianEncroachmentSchema,
    spatialRiskCategory: watercourseSpatialRiskCategorySchema,
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: v.optional(v.pipe(v.string(), v.description('Independent off-site gain-site reference (F-2 AG).'))),
});

function excludeUnreferencedRawUnits<T extends {
    spatialRiskCategory: string;
    offSiteReferenceNumber?: string;
    unitsDelivered: number;
    unitsDeliveredDecimal: Decimal;
}>(data: T): T {
    if (!data.spatialRiskCategory || data.offSiteReferenceNumber) return data;
    return { ...data, unitsDelivered: 0, unitsDeliveredDecimal: new Decimal(0) };
}

/**
 * Enriches watercourse creation data with spatial risk multiplier
 * Looks up the multiplier based on the spatial risk category
 */
export function enrichWithSpatialRiskMultiplier<
    Data extends {
        spatialRiskCategory: string;
    },
>(data: Data) {
    const spatialRiskMultiplier = getWatercourseSpatialRiskMultiplier(data.spatialRiskCategory as any);

    return {
        ...data,
        spatialRiskMultiplier,
        spatialRiskMultiplierDecimal: toDecimal(spatialRiskMultiplier),
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
    unitsDeliveredDecimal?: Decimal;
    spatialRiskMultiplier: number;
    spatialRiskMultiplierDecimal?: Decimal;
}) {
    const netUnitChangeWithSpatialRisk = new Decimal(
        input.unitsDeliveredDecimal ?? toDecimal(input.unitsDelivered),
    ).mul(input.spatialRiskMultiplierDecimal ?? toDecimal(input.spatialRiskMultiplier));

    return {
        netUnitChangeWithSpatialRisk: netUnitChangeWithSpatialRisk.toNumber(),
        netUnitChangeWithSpatialRiskDecimal: netUnitChangeWithSpatialRisk,
    };
}

export function enrichWithWatercourseUnitsDeliveredWithSpatialRisk<
    Data extends {
        unitsDelivered: number;
        unitsDeliveredDecimal: Decimal;
        spatialRiskMultiplier: number;
        spatialRiskMultiplierDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateNetUnitChangeWithSpatialRisk(data) };
}

export const offSiteWatercourseCreationSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        length: data.length.toNumber(),
        lengthDecimal: data.length,
        habitatCreatedInAdvance: data.habitatCreatedInAdvance,
        habitatCreatedInAdvanceDecimal:
            typeof data.habitatCreatedInAdvance === 'number'
                ? toDecimal(data.habitatCreatedInAdvance)
                : data.habitatCreatedInAdvance,
        delayInStarting: data.delayInStarting,
        delayInStartingDecimal:
            typeof data.delayInStarting === 'number' ? toDecimal(data.delayInStarting) : data.delayInStarting,
    })),
    // Validate that the watercourse type is valid
    v.forward(
        v.check((s) => !!allWatercourses[s.watercourseType], 'Invalid watercourse type'),
        ['watercourseType'],
    ),
    // Validate temporal inputs - can't have both advance and delay
    v.check(
        (s) =>
            !(
                (typeof s.habitatCreatedInAdvance === 'string' || s.habitatCreatedInAdvance > 0) &&
                (typeof s.delayInStarting === 'string' || s.delayInStarting > 0)
            ),
        'Cannot have both habitat created in advance and delay in starting',
    ),
    // Enrich with watercourse data
    v.transform(enrichWithCreationWatercourseData),
    // Validate that the condition is possible for this watercourse type
    v.forward(
        v.check(
            (s) => typeof s.conditionScore === 'number',
            'The selected condition is not possible for this watercourse type',
        ),
        ['condition'],
    ),
    // Validate encroachment consistency with watercourse type
    v.forward(
        v.check(
            (s) =>
                s.watercourseType === 'Culvert'
                    ? s.watercourseEncroachment === 'N/A - Culvert'
                    : s.watercourseEncroachment !== 'N/A - Culvert',
            "Culvert watercourses must use 'N/A - Culvert' for watercourse encroachment",
        ),
        ['watercourseEncroachment'],
    ),
    v.forward(
        v.check(
            (s) =>
                s.watercourseType === 'Culvert'
                    ? s.riparianEncroachment === 'N/A - Culvert'
                    : s.riparianEncroachment !== 'N/A - Culvert',
            "Culvert watercourses must use 'N/A - Culvert' for riparian encroachment",
        ),
        ['riparianEncroachment'],
    ),
    // Enrich with spatial risk multiplier
    v.transform(enrichWithSpatialRiskMultiplier),
    v.forward(
        v.check(
            (s) => !s.spatialRiskCategory || Boolean(s.offSiteReferenceNumber),
            'Off-site reference required ▲',
        ),
        ['offSiteReferenceNumber'],
    ),
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

export const offSiteWatercourseCreationUncheckedSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        length: data.length.toNumber(),
        lengthDecimal: data.length,
        habitatCreatedInAdvance: data.habitatCreatedInAdvance,
        habitatCreatedInAdvanceDecimal:
            typeof data.habitatCreatedInAdvance === 'number'
                ? toDecimal(data.habitatCreatedInAdvance)
                : data.habitatCreatedInAdvance,
        delayInStarting: data.delayInStarting,
        delayInStartingDecimal:
            typeof data.delayInStarting === 'number' ? toDecimal(data.delayInStarting) : data.delayInStarting,
    })),
    safeTransform(enrichWithCreationWatercourseData),
    safeTransform(enrichWithSpatialRiskMultiplier),
    safeTransform(enrichWithTemporalData),
    safeTransform(enrichWithDifficultyData),
    safeTransform(enrichCreationWithEncroachmentData),
    safeTransform(enrichWithUnitsDelivered),
    safeTransform(enrichWithWatercourseUnitsDeliveredWithSpatialRisk),
    // F-2 AC requires a reference; AB calculates spatial units independently.
    safeTransform(excludeUnreferencedRawUnits),
);

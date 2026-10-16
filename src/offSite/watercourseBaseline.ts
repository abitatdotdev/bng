import { Decimal, toDecimal } from '../decimal';
import * as v from 'valibot';
import { allWatercourses } from '../watercourses';
import { applyOffSiteWatercourseBaselineAvailability } from './watercourseAvailability';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema, safeTransform } from '../schemaUtils';
import { watercourseConditionSchema } from '../watercourseCondition';
import { watercourseTypeSchema } from '../watercourseType';
import { watercourseSpatialRiskCategorySchema } from '../spatialRisk';
import { enrichWithWatercourseSpatialRisk } from './common';

import {
    enrichWithBaselineWatercourseData,
    enrichWithBaselineUnitsData,
    enrichWithTotalWatercourseUnits,
    enrichWithUnitsLost,
} from '../watercourses/shared';
import { riparianEncroachmentSchema, watercourseEncroachmentSchema } from '../watercourseEncroachment';
import { enrichWithVhdhBespokeCompensationUnits } from '../onSite/watercourseBaseline';
import { fuzzyPicklist } from '../valibotPipes';

const inputSchema = v.object({
    watercourseType: watercourseTypeSchema,
    length: lengthSchema,
    condition: watercourseConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    watercourseEncroachment: watercourseEncroachmentSchema,
    riparianEncroachment: riparianEncroachmentSchema,
    spatialRiskCategory: watercourseSpatialRiskCategorySchema,
    lengthRetained: v.optional(lengthSchema, 0),
    lengthEnhanced: v.optional(lengthSchema, 0),
    bespokeCompensation: v.optional(fuzzyPicklist(['Yes', 'No', 'Pending'] as const), 'No'),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
});

export const offSiteWatercourseBaselineSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        length: data.length.toNumber(),
        lengthDecimal: data.length,
        lengthRetained: data.lengthRetained.toNumber(),
        lengthRetainedDecimal: data.lengthRetained,
        lengthEnhanced: data.lengthEnhanced.toNumber(),
        lengthEnhancedDecimal: data.lengthEnhanced,
    })),
    v.forward(
        v.check((s) => !!allWatercourses[s.watercourseType], 'Invalid watercourse type'),
        ['watercourseType'],
    ),
    v.forward(
        v.check(
            (s) =>
                new Decimal(s.lengthRetainedDecimal)
                    .plus(s.lengthEnhancedDecimal)
                    .lessThanOrEqualTo(s.lengthDecimal),
            'Retained and enhanced lengths cannot exceed total length',
        ),
        ['length'],
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
    // Enrich with watercourse data
    v.transform(enrichWithBaselineWatercourseData),
    // Validate that the condition is possible for this watercourse type
    v.forward(
        v.check(
            (s) => typeof s.conditionScore === 'number',
            'The selected condition is not possible for this watercourse type',
        ),
        ['condition'],
    ),
    // Enrich with spatial risk multiplier
    v.transform(enrichWithWatercourseSpatialRisk),
    // Check that off-site reference is provided when spatial risk is present
    v.forward(
        v.check(
            (s) => !(s.spatialRiskCategory && !s.offSiteReferenceNumber),
            'Off-site reference required ▲',
        ),
        ['offSiteReferenceNumber'],
    ),
    // Calculate baseline units
    v.transform(enrichWithBaselineUnitsData),
    // Calculate total watercourse units (SRM)
    v.transform(enrichWithTotalWatercourseUnitsSRM),
    // Calculate total watercourse units (without spatial risk)
    v.transform(enrichWithTotalWatercourseUnits),
    // Calculate units lost
    v.transform(enrichWithUnitsLost),
    v.transform(enrichWithVhdhBespokeCompensationUnits),
    v.transform(enrichWithUnitsRetainedWithSRM),
    v.transform(applyOffSiteWatercourseBaselineAvailability),
);

export type OffSiteWatercourseBaselineSchema = v.InferInput<typeof offSiteWatercourseBaselineSchema>;
export type OffSiteWatercourseBaseline = v.InferOutput<typeof offSiteWatercourseBaselineSchema>;

export const offSiteWatercourseBaselineUncheckedSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        length: data.length.toNumber(),
        lengthDecimal: data.length,
        lengthRetained: data.lengthRetained.toNumber(),
        lengthRetainedDecimal: data.lengthRetained,
        lengthEnhanced: data.lengthEnhanced.toNumber(),
        lengthEnhancedDecimal: data.lengthEnhanced,
    })),
    safeTransform(enrichWithBaselineWatercourseData),
    safeTransform(enrichWithWatercourseSpatialRisk),
    safeTransform(enrichWithBaselineUnitsData),
    safeTransform(enrichWithTotalWatercourseUnitsSRM),
    safeTransform(enrichWithTotalWatercourseUnits),
    safeTransform(enrichWithUnitsLost),
    safeTransform(enrichWithVhdhBespokeCompensationUnits),
    safeTransform(enrichWithUnitsRetainedWithSRM),
    safeTransform(applyOffSiteWatercourseBaselineAvailability),
);

/**
 * Calculate total watercourse units (SRM) - includes spatial risk multiplier
 * This is the "Total river units (SRM)" column in the Excel sheet
 */
/**
 * Pure calculation: derives totalWatercourseUnitsSRM.
 */
export function calculateTotalWatercourseUnitsSRM(input: {
    length: number;
    lengthDecimal?: Decimal;
    distinctivenessScore: number;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: number | 'Not possible';
    strategicSignificanceMultiplier: number;
    strategicSignificanceMultiplierDecimal?: Decimal;
    watercourseEncroachmentMultiplier: number;
    watercourseEncroachmentMultiplierDecimal?: Decimal;
    riparianEncroachmentMultiplier: number;
    riparianEncroachmentMultiplierDecimal?: Decimal;
    spatialRiskMultiplier: number;
    spatialRiskMultiplierDecimal?: Decimal;
}) {
    const conditionScore = input.conditionScore as number;

    const totalWatercourseUnitsSRM = new Decimal(input.lengthDecimal ?? toDecimal(input.length))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(conditionScore)
        .mul(input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier))
        .mul(
            input.watercourseEncroachmentMultiplierDecimal ??
                toDecimal(input.watercourseEncroachmentMultiplier),
        )
        .mul(input.riparianEncroachmentMultiplierDecimal ?? toDecimal(input.riparianEncroachmentMultiplier))
        .mul(input.spatialRiskMultiplierDecimal ?? toDecimal(input.spatialRiskMultiplier));

    return {
        totalWatercourseUnitsSRM: totalWatercourseUnitsSRM.toNumber(),
        totalWatercourseUnitsSRMDecimal: totalWatercourseUnitsSRM,
    };
}

export function enrichWithUnitsRetainedWithSRM<Data extends {
    unitsRetained: number;
    unitsRetainedDecimal: Decimal;
    vhdhBespokeCompensationUnits: number;
    vhdhBespokeCompensationUnitsDecimal: Decimal;
    spatialRiskMultiplier: number;
    spatialRiskMultiplierDecimal: Decimal;
}>(data: Data) {
    const unitsRetainedWithSRMDecimal = new Decimal(data.unitsRetainedDecimal)
        .plus(data.vhdhBespokeCompensationUnitsDecimal)
        .mul(data.spatialRiskMultiplierDecimal);
    return {
        ...data,
        unitsRetainedWithSRM: unitsRetainedWithSRMDecimal.toNumber(),
        unitsRetainedWithSRMDecimal,
    };
}

export function enrichWithTotalWatercourseUnitsSRM<
    Data extends {
        length: number;
        lengthDecimal: Decimal;
        lengthRetained: number;
        lengthRetainedDecimal: Decimal;
        lengthEnhanced: number;
        lengthEnhancedDecimal: Decimal;
        distinctivenessScore: number;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: number | 'Not possible';
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        watercourseEncroachmentMultiplier: number;
        watercourseEncroachmentMultiplierDecimal: Decimal;
        riparianEncroachmentMultiplier: number;
        riparianEncroachmentMultiplierDecimal: Decimal;
        spatialRiskMultiplier: number;
        spatialRiskMultiplierDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateTotalWatercourseUnitsSRM(data) };
}

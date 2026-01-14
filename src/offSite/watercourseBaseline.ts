import * as v from 'valibot';
import { allWatercourses, type WatercourseLabel } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { watercourseConditionSchema, type WatercourseCondition } from '../watercourseCondition';
import { watercourseTypeSchema } from '../watercourseType';
import { spatialRiskCategorySchema } from '../spatialRisk';
import { enrichWithSpatialRisk } from './common';

// Watercourse encroachment levels
const watercourseEncroachmentSchema = v.picklist([
    "Full",
    "75%",
    "50%",
    "25%",
    "10%",
    "None",
]);

// Riparian encroachment levels
const riparianEncroachmentSchema = v.picklist([
    "None",
    "Within 10m",
    "Within 50m",
]);

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
    bespokeCompensation: v.optional(v.picklist(["Yes", "No", "Pending"]), "No"),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
});

export const offSiteWatercourseBaselineSchema = v.pipe(
    inputSchema,
    // Validate that the watercourse type is valid
    v.check(s => !!allWatercourses[s.watercourseType], "Invalid watercourse type"),
    // Check that retained + enhanced doesn't exceed total length
    v.check(
        s => s.lengthRetained + s.lengthEnhanced <= s.length,
        "Retained and enhanced lengths cannot exceed total length"
    ),
    // Enrich with watercourse data
    v.transform(enrichWithWatercourseData),
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
 * Enrich data with watercourse properties from the watercourses lookup
 */
export function enrichWithWatercourseData<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    watercourseType: WatercourseLabel;
    condition: WatercourseCondition;
    strategicSignificance: StrategicSignificanceDescription;
    watercourseEncroachment: string;
    riparianEncroachment: string;
}>(data: Data) {
    const watercourse = allWatercourses[data.watercourseType];

    // Get condition score from watercourse lookup
    // Note: conditionScore can be 'Not possible' string or a number
    const conditionScore = watercourse.conditions[data.condition] as number | 'Not possible';

    // Watercourse encroachment multipliers
    const watercourseEncroachmentMap = {
        "Full": 1,
        "75%": 0.85,
        "50%": 0.7,
        "25%": 0.55,
        "10%": 0.4,
        "None": 0.25,
    } as const;

    // Riparian encroachment multipliers
    const riparianEncroachmentMap = {
        "None": 1,
        "Within 10m": 0.9,
        "Within 50m": 0.67,
    } as const;

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    // Type-safe lookups with assertion since values are from picklist
    const watercourseEncroachmentMultiplier = watercourseEncroachmentMap[data.watercourseEncroachment as keyof typeof watercourseEncroachmentMap];
    const riparianEncroachmentMultiplier = riparianEncroachmentMap[data.riparianEncroachment as keyof typeof riparianEncroachmentMap];

    return {
        ...data,
        distinctiveness: watercourse.distinctivenessCategory,
        distinctivenessScore: watercourse.distinctivenessScore,
        conditionScore,
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        watercourseEncroachmentMultiplier,
        riparianEncroachmentMultiplier,
        tradingRules: watercourse.tradingRules,
        irreplaceable: watercourse.irreplaceable,
    };
}

/**
 * Calculate baseline units for retained and enhanced portions
 */
export function enrichWithBaselineUnitsData<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number | 'Not possible';
    strategicSignificanceMultiplier: number;
    watercourseEncroachmentMultiplier: number;
    riparianEncroachmentMultiplier: number;
}>(data: Data) {
    // At this point, validation has ensured conditionScore is a number
    const conditionScore = data.conditionScore as number;
    const unitsRetained = data.lengthRetained
        * data.distinctivenessScore
        * conditionScore
        * data.strategicSignificanceMultiplier
        * data.watercourseEncroachmentMultiplier
        * data.riparianEncroachmentMultiplier;

    const unitsEnhanced = data.lengthEnhanced
        * data.distinctivenessScore
        * conditionScore
        * data.strategicSignificanceMultiplier
        * data.watercourseEncroachmentMultiplier
        * data.riparianEncroachmentMultiplier;

    return {
        ...data,
        unitsRetained,
        unitsEnhanced,
    };
}

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

    const totalWatercourseUnitsSRM = data.length
        * data.distinctivenessScore
        * conditionScore
        * data.strategicSignificanceMultiplier
        * data.watercourseEncroachmentMultiplier
        * data.riparianEncroachmentMultiplier
        * data.spatialRiskMultiplier;

    return {
        ...data,
        totalWatercourseUnitsSRM,
    };
}

/**
 * Calculate total watercourse units (without spatial risk multiplier)
 * This is the "Total watercourse units" column in the Excel sheet
 */
export function enrichWithTotalWatercourseUnits<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    distinctivenessScore: number;
    conditionScore: number | 'Not possible';
    strategicSignificanceMultiplier: number;
    watercourseEncroachmentMultiplier: number;
    riparianEncroachmentMultiplier: number;
}>(data: Data) {
    // At this point, validation has ensured conditionScore is a number
    const conditionScore = data.conditionScore as number;

    const totalWatercourseUnits = data.length
        * data.distinctivenessScore
        * conditionScore
        * data.strategicSignificanceMultiplier
        * data.watercourseEncroachmentMultiplier
        * data.riparianEncroachmentMultiplier;

    return {
        ...data,
        totalWatercourseUnits,
    };
}

/**
 * Calculate length lost and units lost
 */
export function enrichWithUnitsLost<Data extends {
    length: number;
    lengthRetained: number;
    lengthEnhanced: number;
    totalWatercourseUnits: number;
    unitsRetained: number;
    unitsEnhanced: number;
}>(data: Data) {
    const lengthLost = data.length - data.lengthRetained - data.lengthEnhanced;
    const unitsLost = lengthLost === 0 ? 0 :
        data.totalWatercourseUnits - data.unitsRetained - data.unitsEnhanced;

    return {
        ...data,
        lengthLost,
        unitsLost,
    };
}

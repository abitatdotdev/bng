import * as v from 'valibot';
import { allWatercourses, type WatercourseLabel } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { watercourseConditionSchema, type WatercourseCondition } from '../watercourseCondition';
import { watercourseTypeSchema } from '../watercourseType';

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
    lengthRetained: v.optional(lengthSchema, 0),
    lengthEnhanced: v.optional(lengthSchema, 0),
    bespokeCompensation: v.optional(v.picklist(["Yes", "No", "Pending"]), "No"),
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
    // Calculate baseline units
    v.transform(enrichWithBaselineUnitsData),
    // Calculate total watercourse units
    v.transform(enrichWithTotalWatercourseUnits),
    // Calculate units lost
    v.transform(enrichWithUnitsLost),
);

export type OnSiteWatercourseBaselineSchema = v.InferInput<typeof onSiteWatercourseBaselineSchema>;
export type OnSiteWatercourseBaseline = v.InferOutput<typeof onSiteWatercourseBaselineSchema>;

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
 * Calculate total watercourse units
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

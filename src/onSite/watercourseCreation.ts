import * as v from 'valibot';
import { allWatercourses, type WatercourseLabel } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { watercourseConditionSchema, type WatercourseCondition } from '../watercourseCondition';
import { watercourseTypeSchema } from '../watercourseType';
import { riparianEncroachmentCreationSchema, riparianEncroachmentMultipliers, watercourseEncroachmentCreationSchema, watercourseEncroachmentMultipliers, type WatercourseEncroachment, type RiparianEncroachment } from '../watercourseEncroachment';
import { getTemporalMultiplier } from '../temporalMultipliers';

const inputSchema = v.object({
    watercourseType: watercourseTypeSchema,
    length: lengthSchema,
    condition: watercourseConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatCreatedInAdvance: v.optional(v.number(), 0),
    delayInStarting: v.optional(v.number(), 0),
    watercourseEncroachment: watercourseEncroachmentCreationSchema,
    riparianEncroachment: riparianEncroachmentCreationSchema,
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
});

export const onSiteWatercourseCreationSchema = v.pipe(
    inputSchema,
    // Validate that the watercourse type is valid
    v.check(s => !!allWatercourses[s.watercourseType], "Invalid watercourse type"),
    // Validate temporal inputs - can't have both advance and delay
    v.check(
        s => !(s.habitatCreatedInAdvance > 0 && s.delayInStarting > 0),
        "Cannot have both habitat created in advance and delay in starting"
    ),
    // Enrich with watercourse data
    v.transform(enrichWithWatercourseData),
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
    // Calculate temporal adjustments
    v.transform(enrichWithTemporalData),
    // Calculate difficulty multiplier
    v.transform(enrichWithDifficultyData),
    // Calculate encroachment multipliers
    v.transform(enrichWithEncroachmentData),
    // Calculate final net unit change
    v.transform(enrichWithNetUnitChange),
);

export type OnSiteWatercourseCreationSchema = v.InferInput<typeof onSiteWatercourseCreationSchema>;
export type OnSiteWatercourseCreation = v.InferOutput<typeof onSiteWatercourseCreationSchema>;

/**
 * Enrich data with watercourse properties from the watercourses lookup
 */
export function enrichWithWatercourseData<Data extends {
    watercourseType: WatercourseLabel;
    condition: WatercourseCondition;
    strategicSignificance: StrategicSignificanceDescription;
}>(data: Data) {
    const watercourse = allWatercourses[data.watercourseType];

    // Get condition score from watercourse lookup
    const conditionScore = watercourse.conditions[data.condition] as number | 'Not possible';

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    // Get time to target condition for creation
    // This looks up the years required to reach the target condition
    // If the condition is not in the map or the map is null, default to 0
    const yearsMap = watercourse.yearsToTargetConditionViaCreation as Record<string, number> | null;
    const standardTimeToTarget = yearsMap?.[data.condition] ?? 0;

    return {
        ...data,
        distinctiveness: watercourse.distinctivenessCategory,
        distinctivenessScore: watercourse.distinctivenessScore,
        conditionScore,
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        standardTimeToTarget,
        standardDifficulty: watercourse.technicalDifficulty,
        tradingRules: watercourse.tradingRules,
        irreplaceable: watercourse.irreplaceable,
    };
}

/**
 * Calculate temporal adjustments and multiplier
 */
export function enrichWithTemporalData<Data extends {
    watercourseType: WatercourseLabel;
    condition: WatercourseCondition;
    habitatCreatedInAdvance: number;
    delayInStarting: number;
    standardTimeToTarget: number;
}>(data: Data) {
    // Calculate adjusted time to target
    let finalTimeToTarget = data.standardTimeToTarget + data.delayInStarting - data.habitatCreatedInAdvance;

    // Cap at 30+ years
    if (finalTimeToTarget > 30) {
        finalTimeToTarget = 30;
    }

    // Ensure minimum of 0
    if (finalTimeToTarget < 0) {
        finalTimeToTarget = 0;
    }

    const temporalMultiplier = getTemporalMultiplier(finalTimeToTarget as any) as number;

    // Check for special ditch category (Ditches with Fairly Poor or Fairly Good)
    const isDitchFairlyCategory = data.watercourseType === 'Ditches' &&
        (data.condition === 'Fairly Poor' || data.condition === 'Fairly Good');

    return {
        ...data,
        finalTimeToTarget,
        temporalMultiplier,
        isDitchFairlyCategory,
    };
}

/**
 * Calculate difficulty multiplier
 */
export function enrichWithDifficultyData<Data extends {
    watercourseType: WatercourseLabel;
    condition: WatercourseCondition;
    standardDifficulty: string;
    isDitchFairlyCategory: boolean;
    habitatCreatedInAdvance: number;
}>(data: Data) {
    // Determine if low difficulty applies
    // Low difficulty applies when:
    // - It's a ditch in fairly category AND habitat created in advance > 0
    const appliedDifficulty = (data.isDitchFairlyCategory && data.habitatCreatedInAdvance > 0)
        ? 'Low'
        : data.standardDifficulty;

    // Get difficulty multiplier from lookup
    // These values come from the G-3 Multipliers table
    const difficultyMultipliers: Record<string, number> = {
        'Low': 1,
        'Medium': 1.1,
        'High': 1.5,
        'Very High': 2,
    };

    const difficultyMultiplier = difficultyMultipliers[appliedDifficulty] ?? 1;

    return {
        ...data,
        appliedDifficulty,
        difficultyMultiplier,
    };
}

/**
 * Calculate encroachment multipliers
 */
export function enrichWithEncroachmentData<Data extends {
    watercourseType: WatercourseLabel;
    watercourseEncroachment: WatercourseEncroachment;
    riparianEncroachment: RiparianEncroachment;
}>(data: Data) {
    const watercourseEncroachmentMultiplier = watercourseEncroachmentMultipliers[data.watercourseEncroachment];
    const riparianEncroachmentMultiplier = riparianEncroachmentMultipliers[data.riparianEncroachment];

    return {
        ...data,
        watercourseEncroachmentMultiplier,
        riparianEncroachmentMultiplier,
    };
}

/**
 * Calculate final net unit change
 */
export function enrichWithNetUnitChange<Data extends {
    length: number;
    distinctivenessScore: number;
    conditionScore: number | 'Not possible';
    strategicSignificanceMultiplier: number;
    temporalMultiplier: number;
    difficultyMultiplier: number;
    watercourseEncroachmentMultiplier: number;
    riparianEncroachmentMultiplier: number;
}>(data: Data) {
    // At this point, validation has ensured conditionScore is a number
    const conditionScore = data.conditionScore as number;

    const netUnitChange = data.length
        * data.distinctivenessScore
        * conditionScore
        * data.strategicSignificanceMultiplier
        * data.temporalMultiplier
        * data.difficultyMultiplier
        * data.watercourseEncroachmentMultiplier
        * data.riparianEncroachmentMultiplier;

    return {
        ...data,
        netUnitChange,
    };
}

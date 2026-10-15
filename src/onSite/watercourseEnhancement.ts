import { toDecimal } from '../decimal';
import { applyWatercourseEnhancementAvailability } from '../calculationAvailability';
import * as v from 'valibot';
import { allWatercourses } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, safeTransform, yearsSchema } from '../schemaUtils';
import { watercourseConditionSchema } from '../watercourseCondition';
import {
    onSiteWatercourseBaselineSchema,
    onSiteWatercourseBaselineUncheckedSchema,
} from './watercourseBaseline';
import { watercourseTypeSchema } from '../watercourseType';
import { riparianEncroachmentSchema, watercourseEncroachmentSchema } from '../watercourseEncroachment';
import {
    enrichBaselineWatercourseData,
    enrichProposedWatercourseData,
    addEnhancementPathway,
    lookupEnhancementTimeToTarget,
    calculateFinalTimeToTargetValues,
    determineEnhancementDifficulty,
    enrichEnhancementWithEncroachmentData,
    calculateEnhancementUnitsDelivered,
} from '../watercourses/shared';

const inputSchema = v.object({
    baseline: onSiteWatercourseBaselineSchema,
    watercourseType: watercourseTypeSchema,
    condition: watercourseConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    watercourseEnhancedInAdvance: v.optional(yearsSchema, 0),
    watercourseEnhancedDelay: v.optional(yearsSchema, 0),
    watercourseEncroachment: watercourseEncroachmentSchema,
    riparianEncroachment: riparianEncroachmentSchema,
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
});

export const onSiteWatercourseEnhancementSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        watercourseEnhancedInAdvance: data.watercourseEnhancedInAdvance,
        watercourseEnhancedInAdvanceDecimal:
            typeof data.watercourseEnhancedInAdvance === 'number'
                ? toDecimal(data.watercourseEnhancedInAdvance)
                : data.watercourseEnhancedInAdvance,
        watercourseEnhancedDelay: data.watercourseEnhancedDelay,
        watercourseEnhancedDelayDecimal:
            typeof data.watercourseEnhancedDelay === 'number'
                ? toDecimal(data.watercourseEnhancedDelay)
                : data.watercourseEnhancedDelay,
    })),

    // Basic validations
    v.forward(
        v.check((s) => !!allWatercourses[s.watercourseType], 'Invalid watercourse type'),
        ['watercourseType'],
    ),
    v.check(
        (s) =>
            !(
                (typeof s.watercourseEnhancedInAdvance === 'string' || s.watercourseEnhancedInAdvance > 0) &&
                (typeof s.watercourseEnhancedDelay === 'string' || s.watercourseEnhancedDelay > 0)
            ),
        'Cannot have both watercourse enhanced in advance and delay in starting watercourse enhancement',
    ),

    // Extract baseline data and length
    v.transform(enrichBaselineWatercourseData),

    // Enrich proposed watercourse data
    v.transform(enrichProposedWatercourseData),

    // Validate that the condition is possible for this watercourse type
    v.forward(
        v.check(
            (s) => typeof s.conditionScore === 'number',
            'The selected condition is not possible for this watercourse type',
        ),
        ['condition'],
    ),

    // Validation checks for enhancement
    v.check((data) => {
        const baseline = data._baselineWatercourse;
        const proposed = allWatercourses[data.watercourseType];

        // Cannot reduce distinctiveness (trading down)
        return proposed.distinctivenessScore >= baseline.distinctivenessScore;
    }, 'Trading rules not satisfied - watercourse distinctiveness cannot be reduced'),
    v.forward(
        v.check(
            (data) => !((data.conditionScore as number) < (data._baselineCondition as number)),
            'Enhancement cannot reduce condition',
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

    // Calculate enhancement pathway label
    v.transform(addEnhancementPathway),

    // Temporal calculation
    v.transform(lookupEnhancementTimeToTarget),
    v.transform(calculateFinalTimeToTargetValues),

    // Difficulty logic
    v.transform(determineEnhancementDifficulty),

    // Encroachment multipliers
    v.transform(enrichEnhancementWithEncroachmentData),

    // Final calculation
    v.transform(calculateEnhancementUnitsDelivered),
    v.transform((data) => applyWatercourseEnhancementAvailability(data, false)),
);

export type OnSiteWatercourseEnhancementSchema = v.InferInput<typeof onSiteWatercourseEnhancementSchema>;
export type OnSiteWatercourseEnhancement = v.InferOutput<typeof onSiteWatercourseEnhancementSchema>;

const uncheckedInputSchema = v.object({
    ...inputSchema.entries,
    baseline: onSiteWatercourseBaselineUncheckedSchema,
});

export const onSiteWatercourseEnhancementUncheckedSchema = v.pipe(
    uncheckedInputSchema,
    v.transform((data) => ({
        ...data,
        watercourseEnhancedInAdvance: data.watercourseEnhancedInAdvance,
        watercourseEnhancedInAdvanceDecimal:
            typeof data.watercourseEnhancedInAdvance === 'number'
                ? toDecimal(data.watercourseEnhancedInAdvance)
                : data.watercourseEnhancedInAdvance,
        watercourseEnhancedDelay: data.watercourseEnhancedDelay,
        watercourseEnhancedDelayDecimal:
            typeof data.watercourseEnhancedDelay === 'number'
                ? toDecimal(data.watercourseEnhancedDelay)
                : data.watercourseEnhancedDelay,
    })),
    safeTransform(enrichBaselineWatercourseData),
    safeTransform(enrichProposedWatercourseData),
    safeTransform(addEnhancementPathway),
    safeTransform(lookupEnhancementTimeToTarget),
    safeTransform(calculateFinalTimeToTargetValues),
    safeTransform(determineEnhancementDifficulty),
    safeTransform(enrichEnhancementWithEncroachmentData),
    safeTransform(calculateEnhancementUnitsDelivered),
    safeTransform((data) => applyWatercourseEnhancementAvailability(data, false)),
);

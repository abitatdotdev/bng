import * as v from 'valibot';
import { allWatercourses } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, yearsSchema } from '../schemaUtils';
import { watercourseConditionSchema } from '../watercourseCondition';
import { offSiteWatercourseBaselineSchema } from './watercourseBaseline';
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
    calculateEnhancementUnitsDelivered
} from '../watercourses/shared';
import { enrichWithSpatialRisk } from './common';
import { Decimal } from '../decimal';


const inputSchema = v.object({
    baseline: offSiteWatercourseBaselineSchema,
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

export const offSiteWatercourseEnhancementSchema = v.pipe(
    inputSchema,

    // Basic validations
    v.check(s => !!allWatercourses[s.watercourseType], "Invalid watercourse type"),
    v.check(
        s => !(
            (typeof s.watercourseEnhancedInAdvance === "string" || s.watercourseEnhancedInAdvance > 0)
            && (typeof s.watercourseEnhancedDelay === "string" || s.watercourseEnhancedDelay > 0)
        ),
        "Cannot have both watercourse enhanced in advance and delay in starting watercourse enhancement"
    ),

    // Use proposed length from baseline if available (for re-meandering scenarios)
    v.transform(data => {
        const proposedLength = data.baseline.proposedLength;
        return proposedLength ? { ...data, length: proposedLength } : data;
    }),

    // Extract baseline data and length
    v.transform(enrichBaselineWatercourseData),

    // Enrich proposed watercourse data
    v.transform(enrichProposedWatercourseData),

    // Validate that the condition is possible for this watercourse type
    v.check(
        s => typeof s.conditionScore === 'number',
        "The selected condition is not possible for this watercourse type"
    ),

    // Validation checks for enhancement
    v.check(
        data => {
            const baseline = data._baselineWatercourse;
            const proposed = allWatercourses[data.watercourseType];

            // Cannot reduce distinctiveness (trading down)
            return proposed.distinctivenessScore >= baseline.distinctivenessScore;
        },
        "Trading rules not satisfied - watercourse distinctiveness cannot be reduced"
    ),
    v.check(
        data => {
            const baselineCondition = data._baselineCondition as number;
            const proposedCondition = data.conditionScore as number;
            const baselineD = data._baselineWatercourse.distinctivenessScore;
            const proposedD = data.distinctivenessScore;

            // Cannot reduce condition
            if (proposedCondition < baselineCondition) {
                return false;
            }

            // If same condition, must have distinctiveness upgrade
            if (proposedCondition === baselineCondition) {
                return proposedD > baselineD;
            }

            return true;
        },
        "Enhancement must improve condition or distinctiveness"
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

    // Calculate enhancement pathway label
    v.transform(addEnhancementPathway),

    // Temporal calculation
    v.transform(lookupEnhancementTimeToTarget),
    v.transform(calculateFinalTimeToTargetValues),

    // Difficulty logic
    v.transform(determineEnhancementDifficulty),

    // Encroachment multipliers
    v.transform(enrichEnhancementWithEncroachmentData),

    // Final calculations
    v.transform(calculateEnhancementUnitsDelivered),
    v.transform(d => enrichWithSpatialRisk({ ...d, spatialRiskCategory: d.baseline.spatialRiskCategory })),
    v.transform(enrichWithWatercourseUnitsDeliveredWithSpatialRisk),
)

export type OffSiteWatercourseEnhancementSchema = v.InferInput<typeof offSiteWatercourseEnhancementSchema>
export type OffSiteWatercourseEnhancement = v.InferOutput<typeof offSiteWatercourseEnhancementSchema>

/**
 * Calculates SRM-adjusted watercourse units delivered for off-site watercourse enhancement
 * watercourseUnitsDeliveredWithSpatialRisk = watercourseUnitsDelivered * spatialRiskMultiplier
 */
export function enrichWithWatercourseUnitsDeliveredWithSpatialRisk<Data extends {
    watercourseUnitsDelivered: number;
    spatialRiskMultiplier: number;
}>(data: Data) {
    const watercourseUnitsDeliveredWithSpatialRisk = new Decimal(data.watercourseUnitsDelivered).mul(data.spatialRiskMultiplier).toNumber();

    return {
        ...data,
        watercourseUnitsDeliveredWithSpatialRisk,
    };
}



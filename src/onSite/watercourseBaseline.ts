import * as v from 'valibot';
import { allWatercourses, type WatercourseLabel } from '../watercourses';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, lengthSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { watercourseConditionSchema, type WatercourseCondition } from '../watercourseCondition';
import { watercourseTypeSchema } from '../watercourseType';
import {
    enrichWithBaselineWatercourseData,
    enrichWithBaselineUnitsData,
    enrichWithTotalWatercourseUnits,
    enrichWithUnitsLost
} from '../watercourses/shared';

// Watercourse encroachment levels
const watercourseEncroachmentSchema = v.pipe(
    v.string(),
    v.trim(),
    v.picklist([
        "Full",
        "75%",
        "50%",
        "25%",
        "10%",
        "None",
    ]));

// Riparian encroachment levels
const riparianEncroachmentSchema = v.pipe(
    v.string(),
    v.trim(),
    v.picklist([
        "None",
        "Within 10m",
        "Within 50m",
    ]));

const inputSchema = v.object({
    watercourseType: watercourseTypeSchema,
    length: lengthSchema,
    condition: watercourseConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    watercourseEncroachment: watercourseEncroachmentSchema,
    riparianEncroachment: riparianEncroachmentSchema,
    lengthRetained: v.optional(lengthSchema, 0),
    lengthEnhanced: v.optional(lengthSchema, 0),
    bespokeCompensation: v.optional(
        v.pipe(
            v.string(),
            v.trim(),
            v.picklist(["Yes", "No", "Pending"])
        ), "No"),
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
);

export type OnSiteWatercourseBaselineSchema = v.InferInput<typeof onSiteWatercourseBaselineSchema>;
export type OnSiteWatercourseBaseline = v.InferOutput<typeof onSiteWatercourseBaselineSchema>;


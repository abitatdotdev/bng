import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { enhancedHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, yearsSchema } from '../schemaUtils';
import { onSiteHabitatBaselineSchema } from './habitatBaseline';
import { habitatByBroadAndType } from '../habitats';
import { getTemporalMultiplier, type TemporalMultiplierKey } from '../temporalMultipliers';
import { difficulty } from '../difficulty';

const inputSchema = v.object({
    baseline: onSiteHabitatBaselineSchema,
    broadHabitat: broadHabitatSchema,
    habitatType: enhancedHabitatType,
    condition: conditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatEnhancedInAdvance: v.optional(yearsSchema, 0),
    habitatEnhancedDelay: v.optional(yearsSchema, 0),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
})
type OutputSchema = v.InferOutput<typeof inputSchema>

/**
 * Extract baseline habitat data including area
 * The baseline contains the area that is being enhanced
 */
const enrichBaselineHabitatData = <Data extends {
    baseline: any
}>(data: Data) => {
    const { baseline } = data;

    return {
        ...data,
        area: baseline.areaEnhanced,
        _baselineHabitat: baseline._habitat,
        _baselineCondition: baseline.conditionScore,
    };
}

/**
 * Add enhancement pathway label
 * Format: "baseline condition - proposed condition"
 */
const addEnhancementPathway = <Data extends {
    baseline: any,
    condition: string
}>(data: Data) => {
    const baselineCondition = data.baseline.condition;
    const proposedCondition = data.condition;
    const enhancementPathway = `${baselineCondition} - ${proposedCondition}`;

    return {
        ...data,
        enhancementPathway
    };
}

/**
 * Lookup enhancement time to target from habitat enhancement temporal multipliers
 * Uses the enhancement pathway (baseline→proposed condition) to find years to target
 */
const lookupEnhancementTimeToTarget = <Data extends {
    broadHabitat: string,
    habitatType: string,
    enhancementPathway: string
}>(data: Data) => {
    const habitat = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

    // Get enhancement temporal multipliers for this habitat
    const enhancementTemporal = habitat.enhancementTemporalMultipliers;

    // Lookup time to target for this enhancement pathway
    let timeToTargetCondition: number | "30+" | "Not Possible ▲" = "Not Possible ▲";

    if (enhancementTemporal) {
        const pathway = data.enhancementPathway as keyof typeof enhancementTemporal;
        if (pathway in enhancementTemporal) {
            const value = enhancementTemporal[pathway];
            timeToTargetCondition = value as any;
        }
    }

    return {
        ...data,
        timeToTargetCondition
    };
}

/**
 * Calculate final time to target condition based on:
 * - Standard enhancement time (from enhancement temporal multipliers)
 * - Years of habitat enhanced in advance
 * - Years of delay in starting enhancement
 *
 * Reuses the same logic as habitat creation
 */
const calculateFinalTimeToTargetValues = <Data extends {
    timeToTargetCondition: number | "30+" | "Not Possible ▲",
    habitatEnhancedInAdvance: number | "30+",
    habitatEnhancedDelay: number | "30+"
}>(data: Data) => {
    const { timeToTargetCondition, habitatEnhancedInAdvance, habitatEnhancedDelay } = data;

    let finalTimeToTargetCondition: number | "30+" | "Not Possible ▲";
    const normalisedHabitatEnhancedInAdvance = typeof habitatEnhancedInAdvance === "string" ? 30 : habitatEnhancedInAdvance;
    const normalisedHabitatEnhancedDelay = typeof habitatEnhancedDelay === "string" ? 30 : habitatEnhancedDelay;

    // If standard time is "Not Possible", final time is also "Not Possible"
    if (timeToTargetCondition === "Not Possible ▲") {
        finalTimeToTargetCondition = "Not Possible ▲";
    }
    // Handle "30+" standard time
    else if (timeToTargetCondition === "30+") {
        if (habitatEnhancedInAdvance === 0) {
            finalTimeToTargetCondition = "30+";
        } else {
            // 30 - advance (capped at 0)
            finalTimeToTargetCondition = Math.max(0, 30 - normalisedHabitatEnhancedInAdvance);
        }
    }
    // If advance >= standard time, final time is 0
    else if (normalisedHabitatEnhancedInAdvance >= timeToTargetCondition) {
        finalTimeToTargetCondition = 0;
    }
    // Calculate: standardTime - advance + delay
    else {
        const result = timeToTargetCondition - normalisedHabitatEnhancedInAdvance + normalisedHabitatEnhancedDelay;

        // Cap at "30+" if result > 30
        if (result > 30) {
            finalTimeToTargetCondition = "30+";
        } else {
            // Ensure non-negative result
            finalTimeToTargetCondition = Math.max(0, result);
        }
    }

    // Look up the temporal multiplier for the final time
    const multiplierKey = String(finalTimeToTargetCondition) as TemporalMultiplierKey;
    const multiplierResult = getTemporalMultiplier(multiplierKey);

    // Convert 'N/A' to undefined for calculations, keep numeric values
    const finalTimeToTargetMultiplier = multiplierResult === 'N/A' ? undefined : multiplierResult;

    return {
        ...data,
        finalTimeToTargetCondition,
        finalTimeToTargetMultiplier
    };
}

/**
 * Determine enhancement difficulty based on whether habitat reached target before losses
 * Simpler than creation difficulty logic
 */
const determineEnhancementDifficulty = <Data extends {
    broadHabitat: string,
    habitatType: string,
    timeToTargetCondition: number | "30+" | "Not Possible ▲",
    habitatEnhancedInAdvance: number | "30+",
    finalTimeToTargetCondition: number | "30+" | "Not Possible ▲"
}>(data: Data) => {
    const habitat = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

    // Normalize habitatEnhancedInAdvance for comparisons
    const normalisedHabitatEnhancedInAdvance = typeof data.habitatEnhancedInAdvance === "string" ? 30 : data.habitatEnhancedInAdvance;

    // Standard difficulty of enhancement
    const standardDifficultyOfEnhancement = habitat.technicalDifficultyEnhancement;

    // Determine if habitat has reached target condition (advance >= standard time)
    const hasReachedTargetCondition =
        normalisedHabitatEnhancedInAdvance > 0 &&
        data.finalTimeToTargetCondition === 0;

    // Applied difficulty multiplier
    let appliedDifficultyMultiplier: string;
    if (hasReachedTargetCondition) {
        appliedDifficultyMultiplier = "Low Difficulty - only applicable if all habitat created before losses ⚠";
    } else {
        appliedDifficultyMultiplier = "Standard difficulty applied";
    }

    // Final difficulty of enhancement
    let finalDifficultyOfEnhancement: keyof typeof difficulty;
    if (appliedDifficultyMultiplier === "Low Difficulty - only applicable if all habitat created before losses ⚠") {
        finalDifficultyOfEnhancement = "Low";
    } else {
        finalDifficultyOfEnhancement = standardDifficultyOfEnhancement;
    }

    // Difficulty multiplier applied
    const difficultyMultiplierApplied = difficulty[finalDifficultyOfEnhancement];

    return {
        ...data,
        standardDifficultyOfEnhancement,
        appliedDifficultyMultiplier,
        finalDifficultyOfEnhancement,
        difficultyMultiplierApplied
    };
}

/**
 * Calculate habitat units delivered from enhancement as NET GAIN over baseline
 *
 * Formula:
 * - Calculate proposed units: Area × Proposed Distinctiveness × Proposed Condition
 * - Calculate baseline units: Area × Baseline Distinctiveness × Baseline Condition
 * - Calculate delta with multipliers: (Proposed - Baseline) × Difficulty × Temporal
 * - Add back baseline units: Delta + Baseline
 * - Apply strategic significance: Result × Strategic
 *
 * Special case: If baseline condition > proposed condition (condition reduced),
 * use proposed condition as baseline condition for calculation
 */
const calculateEnhancementUnitsDelivered = <Data extends {
    area: number,
    _baselineHabitat: any,
    _baselineCondition: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
    finalTimeToTargetMultiplier: number | undefined,
    difficultyMultiplierApplied: number
}>(data: Data) => {
    const area = data.area;
    const baselineD = data._baselineHabitat.distinctivenessScore;
    const baselineC = data._baselineCondition;
    const proposedD = data.distinctivenessScore;
    const proposedC = data.conditionScore;
    const strategic = data.strategicSignificanceMultiplier;
    const difficulty = data.difficultyMultiplierApplied;
    const temporal = data.finalTimeToTargetMultiplier ?? 0;

    // Special case: baseline condition > proposed condition (condition reduced)
    // Use proposed condition as the effective baseline condition
    const effectiveBaselineC = baselineC > proposedC ? proposedC : baselineC;

    // Calculate proposed units
    const proposedUnits = area * proposedD * proposedC;

    // Calculate baseline units (with effective condition)
    const baselineUnits = area * baselineD * effectiveBaselineC;

    // Calculate delta with multipliers
    const delta = (proposedUnits - baselineUnits) * difficulty * temporal;

    // Add back baseline units and apply strategic significance
    const habitatUnitsDelivered = (delta + baselineUnits) * strategic;

    return {
        ...data,
        habitatUnitsDelivered
    };
}

export const onSiteHabitatEnhancementSchema = v.pipe(
    inputSchema,

    // Basic validations
    v.check(s => isValidHabitat(s.broadHabitat, s.habitatType), "The broad habitat and habitat type are incompatible"),
    v.check(s => isValidCondition(s.broadHabitat, s.habitatType, s.condition), "The condition for this habitat is invalid"),
    v.check(
        s => !(
            (typeof s.habitatEnhancedInAdvance === "string" || s.habitatEnhancedInAdvance > 0)
            && (typeof s.habitatEnhancedDelay === "string" || s.habitatEnhancedDelay > 0)
        ),
        "Cannot have both habitat enhanced in advance and delay in starting habitat enhancement"
    ),

    // Extract baseline data and area
    v.transform(enrichBaselineHabitatData),

    // Enrich proposed habitat data
    v.transform(enrichWithHabitatData),

    // Validation checks for enhancement
    v.check(
        data => {
            const baseline = data._baselineHabitat;
            const proposed = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

            // V.High/High: Same habitat required
            if (['V.High', 'High'].includes(baseline.distinctivenessCategory)) {
                return baseline.label === proposed.label;
            }

            // Medium: Same broad habitat or higher distinctiveness
            if (baseline.distinctivenessCategory === 'Medium') {
                return baseline.broadHabitat === proposed.broadHabitat
                    || proposed.distinctivenessScore >= baseline.distinctivenessScore;
            }

            // Low: Same distinctiveness or better
            if (baseline.distinctivenessCategory === 'Low') {
                return proposed.distinctivenessScore >= baseline.distinctivenessScore;
            }

            return true;
        },
        "Trading rules not satisfied - habitat distinctiveness mismatch"
    ),
    v.check(
        data => {
            const baselineCondition = data._baselineCondition;
            const proposedCondition = data.conditionScore;
            const baselineD = data._baselineHabitat.distinctivenessScore;
            const proposedD = data.distinctivenessScore;

            // Cannot reduce condition
            if (baselineCondition > proposedCondition) {
                return false;
            }

            // If same condition, must have distinctiveness upgrade
            if (baselineCondition === proposedCondition) {
                return proposedD > baselineD;
            }

            return true;
        },
        "Enhancement does not improve habitat quality"
    ),
    v.check(
        data => {
            const baseline = data._baselineHabitat;
            const proposed = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

            // Cannot replace irreplaceable habitat with different habitat
            if (baseline.irreplaceable && baseline.label !== proposed.label) {
                return false;
            }

            return true;
        },
        "Cannot replace an irreplaceable habitat with a different habitat"
    ),
    v.check(
        data => {
            const baseline = data._baselineHabitat;
            const proposed = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

            // Special habitat validation: Littoral seagrass
            if (proposed.type === "Littoral seagrass") {
                const allowedBaselines = [
                    "Intertidal sediment - Littoral seagrass",
                    "Intertidal sediment - Littoral sand"
                ];
                return allowedBaselines.includes(baseline.label);
            }

            // Special habitat validation: IGGI (Integrated Greening of Grey Infrastructure)
            if (proposed.type === "Artificial hard structures with integrated greening of grey infrastructure (IGGI)") {
                const allowedBaselines = [
                    "Intertidal hard structures - Artificial hard structures with integrated greening of grey infrastructure (IGGI)",
                    "Intertidal hard structures - Artificial hard structures",
                    "Intertidal hard structures - Artificial features of hard structures"
                ];
                return allowedBaselines.includes(baseline.label);
            }

            return true;
        },
        "Enhancement not possible for this habitat type from the selected baseline"
    ),

    // Calculate enhancement pathway label
    v.transform(addEnhancementPathway),

    // Temporal calculation
    v.transform(lookupEnhancementTimeToTarget),
    v.transform(calculateFinalTimeToTargetValues),

    // Difficulty logic
    v.transform(determineEnhancementDifficulty),

    // Final calculation
    v.transform(calculateEnhancementUnitsDelivered),
)
export type OnSiteHabitatEnhancementSchema = v.InferInput<typeof onSiteHabitatEnhancementSchema>

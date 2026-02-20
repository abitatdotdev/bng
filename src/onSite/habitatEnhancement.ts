import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { enhancedHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, yearsSchema } from '../schemaUtils';
import { onSiteHabitatBaselineSchema, type OnSiteHabitatBaseline } from './habitatBaseline';
import { habitatByBroadAndType, type Habitat } from '../habitats';
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

/**
 * Extract baseline habitat data including area
 * The baseline contains the area that is being enhanced
 */
const enrichBaselineHabitatData = <Data extends {
    baseline: OnSiteHabitatBaseline
}>(data: Data) => {
    const { baseline } = data;
    const baselineHabitat = habitatByBroadAndType(baseline.broadHabitat, baseline.habitatType)!

    return {
        ...data,
        area: baseline.areaEnhanced,
        _baselineHabitat: baselineHabitat,
        _baselineCondition: baseline.conditionScore,
    };
}

/**
 * Lookup enhancement time to target from habitat enhancement temporal multipliers
 * Uses the enhancement pathway (baseline→proposed condition) to find years to target
 */
const lookupEnhancementTimeToTarget = <Data extends {
    _habitat: Habitat,
    conditionChange: ReturnType<typeof addDistinctivenessAndConditionChange>['conditionChange'],
}>(data: Data) => {
    // Get enhancement temporal multipliers for this habitat
    const enhancementTemporal = data._habitat.enhancementTemporalMultipliers;
    const conditionChange = data.conditionChange;

    const timeToTargetCondition = enhancementTemporal[conditionChange as keyof typeof enhancementTemporal];
    if (!timeToTargetCondition) return { ...data, timeToTargetCondition: "Not Possible ▲" as const }

    return {
        ...data,
        timeToTargetCondition
    };
}

/**
 * Calculate final time to target condition based on:
 * - Column AD: Standard enhancement time (from enhancement temporal multipliers)
 * - Column AE: Years of habitat enhanced in advance (input)
 * - Column AF: Years of delay in starting enhancement (input)
 * - Column AG: Standard or adjusted time to target condition
 * - Column AH: Final time to target condition (years)
 * - Column AI: Final time to target multiplier
 *
 * Matches Excel columns AD-AI in sheet A-3
 */
const calculateFinalTimeToTargetValues = <Data extends {
    timeToTargetCondition: number | "30+" | "Not Possible ▲",
    habitatEnhancedInAdvance: number | "30+",
    habitatEnhancedDelay: number | "30+"
}>(data: Data) => {
    const { timeToTargetCondition, habitatEnhancedInAdvance, habitatEnhancedDelay } = data;

    // Column AD: Standard time to target condition (years)
    // Already calculated in lookupEnhancementTimeToTarget as timeToTargetCondition
    const standardTimeToTargetCondition = timeToTargetCondition;

    // Column AE: Habitat enhanced in advance (years) - input data
    // Column AF: Delay in starting habitat enhancement (years) - input data

    // Column AG: Standard or adjusted time to target condition
    // Determine which adjustment applies
    let standardOrAdjustedTimeToTargetCondition: string;
    const hasAdvance = typeof habitatEnhancedInAdvance === "string" || habitatEnhancedInAdvance > 0;
    const hasDelay = typeof habitatEnhancedDelay === "string" || habitatEnhancedDelay > 0;

    if (hasAdvance) {
        const normalisedAdvance = typeof habitatEnhancedInAdvance === "string" ? 30 : habitatEnhancedInAdvance;
        const normalisedStandardTime = typeof timeToTargetCondition === "string" ?
            (timeToTargetCondition === "30+" ? 30 : Infinity) : timeToTargetCondition;

        if (normalisedAdvance >= normalisedStandardTime) {
            standardOrAdjustedTimeToTargetCondition = "Check details - Is there evidence that habitat has reached target condition? ⚠";
        } else {
            standardOrAdjustedTimeToTargetCondition = "Check details - Is there evidence habitat creation started/in place? ⚠";
        }
    } else if (hasDelay) {
        standardOrAdjustedTimeToTargetCondition = "Check details- Delay in starting habitat in required condition? ⚠";
    } else {
        standardOrAdjustedTimeToTargetCondition = "Standard time to target condition applied";
    }

    // Column AH: Final time to target condition (years)
    // Calculate based on standard time, advance, and delay
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
        } else if (habitatEnhancedInAdvance === "30+") {
            finalTimeToTargetCondition = 0;
        } else if (normalisedHabitatEnhancedInAdvance < 30) {
            finalTimeToTargetCondition = 30 - normalisedHabitatEnhancedInAdvance;
        } else {
            finalTimeToTargetCondition = 30 - normalisedHabitatEnhancedInAdvance;
        }
    }
    // If advance > standard time, final time is 0
    else if (normalisedHabitatEnhancedInAdvance > timeToTargetCondition) {
        finalTimeToTargetCondition = 0;
    }
    // If delay is "30+", result is "30+"
    else if (habitatEnhancedDelay === "30+") {
        finalTimeToTargetCondition = "30+";
    }
    // Calculate: standardTime + delay - advance
    else {
        const result = timeToTargetCondition + normalisedHabitatEnhancedDelay - normalisedHabitatEnhancedInAdvance;

        // Cap at "30+" if result > 30
        if (result > 30) {
            finalTimeToTargetCondition = "30+";
        } else {
            // Ensure non-negative result
            finalTimeToTargetCondition = Math.max(0, result);
        }
    }

    // Column AI: Final time to target multiplier
    // Look up the temporal multiplier for the final time
    const multiplierKey = String(finalTimeToTargetCondition) as TemporalMultiplierKey;
    const multiplierResult = getTemporalMultiplier(multiplierKey);

    // Convert 'N/A' to undefined for calculations, keep numeric values
    const finalTimeToTargetMultiplier = multiplierResult === 'N/A' ? undefined : multiplierResult;

    return {
        ...data,
        standardTimeToTargetCondition,
        standardOrAdjustedTimeToTargetCondition,
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
 * Add distinctiveness and condition change labels
 * Matches Excel columns T and U
 */
const addDistinctivenessAndConditionChange = <Data extends {
    baseline: any,
    _baselineHabitat: any,
    broadHabitat: string,
    habitatType: string,
    condition: string,
    distinctiveness: string,
    distinctivenessScore: number
}>(data: Data) => {
    const baselineHabitat = data._baselineHabitat;
    const proposedHabitat = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

    // Column T: Distinctiveness Change
    // Format: "baseline distinctiveness - proposed distinctiveness"
    const distinctivenessChange = `${baselineHabitat.distinctivenessCategory} - ${data.distinctiveness}`;

    // Column U: Condition Change
    // If habitat changes AND distinctiveness improves, prefix with "Lower Distinctiveness Habitat"
    // Otherwise, show baseline condition - proposed condition
    let conditionChange: string;
    const isHabitatChange = baselineHabitat.label !== proposedHabitat.label;
    const isDistinctivenessUpgrade = data.distinctivenessScore > baselineHabitat.distinctivenessScore;

    if (isHabitatChange && isDistinctivenessUpgrade) {
        conditionChange = `Lower Distinctiveness Habitat - ${data.condition}`;
    } else {
        conditionChange = `${data.baseline.condition} - ${data.condition}`;
    }

    return {
        ...data,
        distinctivenessChange,
        conditionChange
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

    // Add distinctiveness and condition change labels
    v.transform(addDistinctivenessAndConditionChange),

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

    // Temporal calculation
    v.transform(lookupEnhancementTimeToTarget),
    v.transform(calculateFinalTimeToTargetValues),

    // Difficulty logic
    v.transform(determineEnhancementDifficulty),

    // Final calculation
    v.transform(calculateEnhancementUnitsDelivered),
)

export type OnSiteHabitatEnhancementSchema = v.InferInput<typeof onSiteHabitatEnhancementSchema>
export type OnSiteHabitatEnhancement = v.InferOutput<typeof onSiteHabitatEnhancementSchema>

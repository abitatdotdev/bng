import * as v from 'valibot';
import { Decimal } from '../decimal';
import { allHedgerows, type HedgerowLabel } from '../hedgerows';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { freeTextSchema, yearsSchema } from '../schemaUtils';
import { getStrategicSignificance, type StrategicSignificanceDescription } from '../strategicSignificanceSchema';
import { hedgerowConditionSchema, type HedgerowCondition } from '../hedgerowCondition';
import { difficulty } from '../difficulty';
import { hedgerowTypeSchema } from '../hedgerowType';
import { offSiteHedgerowBaselineSchema, type OffSiteHedgerowBaseline } from './hedgerowBaseline';
import { enrichWithSpatialRisk } from './common';
import { lookupTemporalMultiplier } from '../temporalMultipliers';

const inputSchema = v.object({
    baseline: offSiteHedgerowBaselineSchema,
    habitatType: hedgerowTypeSchema,
    condition: hedgerowConditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    hedgerowEnhancedInAdvance: v.optional(yearsSchema, 0),
    hedgerowEnhancedDelay: v.optional(yearsSchema, 0),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
});

/**
 * Extract baseline hedgerow data including length
 * The baseline contains the length that is being enhanced
 */
const enrichBaselineHedgerowData = <Data extends {
    baseline: OffSiteHedgerowBaseline
}>(data: Data) => {
    const { baseline } = data;

    return {
        ...data,
        length: baseline.lengthEnhanced,
        _baselineHedgerow: {
            label: baseline.habitatType,
            distinctivenessScore: baseline.distinctivenessScore,
            distinctivenessCategory: baseline.distinctiveness,
        },
        _baselineCondition: baseline.conditionScore,
    };
}

/**
 * Enrich data with proposed hedgerow properties from the hedgerows lookup
 */
const enrichProposedHedgerowData = <Data extends {
    habitatType: HedgerowLabel;
    condition: HedgerowCondition;
    strategicSignificance: StrategicSignificanceDescription;
}>(data: Data) => {
    const hedgerow = allHedgerows[data.habitatType];

    // Get condition score - hedgerows use simplified scoring
    // Based on the metric: Good = 3, Moderate = 2, Poor = 1
    const conditionScoreMap: Record<HedgerowCondition, number> = {
        "Good": 3,
        "Moderate": 2,
        "Poor": 1,
    };

    const strategicSignificance = getStrategicSignificance(data.strategicSignificance);

    return {
        ...data,
        distinctiveness: hedgerow.distinctivenessCategory,
        distinctivenessScore: hedgerow.distinctivenessScore,
        conditionScore: conditionScoreMap[data.condition],
        strategicSignificanceCategory: strategicSignificance.significance,
        strategicSignificanceMultiplier: strategicSignificance.multiplier,
        tradingRules: hedgerow.tradingRules,
        technicalDifficultyEnhancement: hedgerow.technicalDifficultyEnhancement,
        technicalDifficultyEnhancementMultiplier: hedgerow.technicalDifficultyEnhancementMultiplier,
    };
}

/**
 * Add enhancement pathway label
 * Format: "baseline condition to proposed condition"
 */
const addEnhancementPathway = <Data extends {
    baseline: OffSiteHedgerowBaseline,
    condition: HedgerowCondition
}>(data: Data) => {
    const baselineCondition = data.baseline.condition;
    const proposedCondition = data.condition;
    const enhancementPathway = `${baselineCondition} to ${proposedCondition}`;

    return {
        ...data,
        enhancementPathway
    };
}

/**
 * Lookup enhancement time to target from hedgerow enhancement temporal data
 * Uses the enhancement pathway (baseline→proposed condition) to find years to target
 */
const lookupEnhancementTimeToTarget = <Data extends {
    habitatType: HedgerowLabel,
    enhancementPathway: string
}>(data: Data) => {
    const hedgerow = allHedgerows[data.habitatType];

    // Get enhancement temporal data for this hedgerow
    const enhancementTemporal = hedgerow.yearsToTargetConditionViaEnhancement;

    // Lookup time to target for this enhancement pathway
    let timeToTargetCondition: number | "30+" | "Not possible ▲" = "Not possible ▲";

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
 * Helper to convert years value to number for arithmetic
 */
function yearsToNumber(years: number | "30+"): number {
    return years === "30+" ? 31 : years;
}

/**
 * Calculate final time to target condition based on:
 * - Standard enhancement time (from enhancement temporal data)
 * - Years of hedgerow enhanced in advance
 * - Years of delay in starting enhancement
 */
const calculateFinalTimeToTargetValues = <Data extends {
    timeToTargetCondition: number | "30+" | "Not possible ▲",
    hedgerowEnhancedInAdvance: number | "30+",
    hedgerowEnhancedDelay: number | "30+"
}>(data: Data) => {
    const { timeToTargetCondition, hedgerowEnhancedInAdvance, hedgerowEnhancedDelay } = data;

    let finalTimeToTargetCondition: number | "30+" | "Not possible ▲";
    const normalisedHedgerowEnhancedInAdvance = yearsToNumber(hedgerowEnhancedInAdvance);
    const normalisedHedgerowEnhancedDelay = yearsToNumber(hedgerowEnhancedDelay);

    // If standard time is "Not possible", final time is also "Not possible"
    if (timeToTargetCondition === "Not possible ▲") {
        finalTimeToTargetCondition = "Not possible ▲";
    }
    // Handle "30+" standard time
    else if (timeToTargetCondition === "30+") {
        if (hedgerowEnhancedInAdvance === 0) {
            finalTimeToTargetCondition = "30+";
        } else {
            // 30 - advance (capped at 0)
            const result = new Decimal(31).minus(normalisedHedgerowEnhancedInAdvance).plus(normalisedHedgerowEnhancedDelay).toNumber();
            if (result >= 30) {
                finalTimeToTargetCondition = "30+";
            } else {
                finalTimeToTargetCondition = Decimal.max(0, result).toNumber();
            }
        }
    }
    // If advance >= standard time, final time is 0
    else if (normalisedHedgerowEnhancedInAdvance >= timeToTargetCondition) {
        finalTimeToTargetCondition = 0;
    }
    // Calculate: standardTime - advance + delay
    else {
        const result = new Decimal(timeToTargetCondition).minus(normalisedHedgerowEnhancedInAdvance).plus(normalisedHedgerowEnhancedDelay).toNumber();

        // Cap at "30+" if result > 30
        if (result > 30) {
            finalTimeToTargetCondition = "30+";
        } else {
            // Ensure non-negative result
            finalTimeToTargetCondition = Decimal.max(0, result).toNumber();
        }
    }

    // Look up the temporal multiplier for the final time
    const temporalMultiplier = typeof finalTimeToTargetCondition === 'number' || finalTimeToTargetCondition === '30+'
        ? lookupTemporalMultiplier(finalTimeToTargetCondition)
        : finalTimeToTargetCondition;

    // Convert temporal multiplier from string to number or undefined for calculations
    const finalTimeToTargetMultiplier = typeof temporalMultiplier === 'number' ? temporalMultiplier : undefined;

    return {
        ...data,
        finalTimeToTargetCondition,
        temporalMultiplier,
        finalTimeToTargetMultiplier
    };
}

/**
 * Determine enhancement difficulty based on whether hedgerow reached target before losses
 */
const determineEnhancementDifficulty = <Data extends {
    habitatType: HedgerowLabel,
    timeToTargetCondition: number | "30+" | "Not possible ▲",
    hedgerowEnhancedInAdvance: number | "30+",
    finalTimeToTargetCondition: number | "30+" | "Not possible ▲",
    technicalDifficultyEnhancement: string,
    technicalDifficultyEnhancementMultiplier: number
}>(data: Data) => {
    const hedgerow = allHedgerows[data.habitatType];

    // Normalize hedgerowEnhancedInAdvance for comparisons
    const normalisedHedgerowEnhancedInAdvance = typeof data.hedgerowEnhancedInAdvance === "string" ? 30 : data.hedgerowEnhancedInAdvance;

    // Standard difficulty of enhancement
    const standardDifficultyOfEnhancement = hedgerow.technicalDifficultyEnhancement;

    // Determine if hedgerow has reached target condition (advance >= standard time)
    const hasReachedTargetCondition =
        normalisedHedgerowEnhancedInAdvance > 0 &&
        data.finalTimeToTargetCondition === 0;

    // Applied difficulty multiplier
    let appliedDifficultyMultiplier: string;
    if (hasReachedTargetCondition) {
        appliedDifficultyMultiplier = "Low Difficulty - only applicable if all hedgerow enhanced before losses ⚠";
    } else {
        appliedDifficultyMultiplier = "Standard difficulty applied";
    }

    // Final difficulty of enhancement
    let finalDifficultyOfEnhancement: keyof typeof difficulty;
    if (appliedDifficultyMultiplier === "Low Difficulty - only applicable if all hedgerow enhanced before losses ⚠") {
        finalDifficultyOfEnhancement = "Low";
    } else {
        finalDifficultyOfEnhancement = standardDifficultyOfEnhancement as keyof typeof difficulty;
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
 * Enriches data with spatial risk multiplier from baseline.
 */
const enrichWithSpatialRiskData = <Data extends {
    baseline: OffSiteHedgerowBaseline
}>(data: Data) => {
    return enrichWithSpatialRisk({
        ...data,
        spatialRiskCategory: data.baseline.spatialRiskCategory || 'Low'
    });
}

/**
 * Calculate hedgerow units delivered from enhancement as NET GAIN over baseline
 *
 * Formula:
 * - Calculate proposed units: Length × Proposed Distinctiveness × Proposed Condition
 * - Calculate baseline units: Length × Baseline Distinctiveness × Baseline Condition
 * - Calculate delta with multipliers: (Proposed - Baseline) × Difficulty × Temporal
 * - Add back baseline units: Delta + Baseline
 * - Apply strategic significance: Result × Strategic
 *
 * For off-site, calculates two values:
 * 1. hedgerowUnitsDeliveredWithSpatialRisk: includes spatial risk multiplier (column AJ in Excel)
 * 2. hedgerowUnitsDelivered: without spatial risk multiplier (column AK in Excel)
 *
 * Special case: If baseline condition > proposed condition (condition reduced),
 * use proposed condition as baseline condition for calculation
 */
const calculateEnhancementUnitsDelivered = <Data extends {
    length: number,
    _baselineHedgerow: any,
    _baselineCondition: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
    finalTimeToTargetMultiplier: number | undefined,
    difficultyMultiplierApplied: number,
    spatialRiskMultiplier: number
}>(data: Data) => {
    const length = data.length;
    const baselineD = data._baselineHedgerow.distinctivenessScore;
    const baselineC = data._baselineCondition;
    const proposedD = data.distinctivenessScore;
    const proposedC = data.conditionScore;
    const strategic = data.strategicSignificanceMultiplier;
    const difficulty = data.difficultyMultiplierApplied;
    const temporal = data.finalTimeToTargetMultiplier ?? 0;
    const spatialRisk = data.spatialRiskMultiplier;

    // Special case: baseline condition > proposed condition (condition reduced)
    // Use proposed condition as the effective baseline condition
    const effectiveBaselineC = baselineC > proposedC ? proposedC : baselineC;

    // Calculate proposed units
    const proposedUnits = new Decimal(length).mul(proposedD).mul(proposedC);

    // Calculate baseline units (with effective condition)
    const baselineUnits = new Decimal(length).mul(baselineD).mul(effectiveBaselineC);

    // Calculate delta with multipliers
    const delta = proposedUnits.minus(baselineUnits).mul(difficulty).mul(temporal);

    // Add back baseline units and apply strategic significance
    const baseUnits = delta.plus(baselineUnits).mul(strategic);

    // Two calculations: with and without spatial risk multiplier
    const hedgerowUnitsDeliveredWithSpatialRisk = baseUnits.mul(spatialRisk).toNumber();
    const hedgerowUnitsDelivered = baseUnits.toNumber();

    return {
        ...data,
        hedgerowUnitsDeliveredWithSpatialRisk,
        hedgerowUnitsDelivered
    };
}

export const offSiteHedgerowEnhancementSchema = v.pipe(
    inputSchema,

    // Basic validations
    v.check(s => !!allHedgerows[s.habitatType], "Invalid hedgerow habitat type"),
    v.check(
        s => !(s.habitatType === "Non-native and ornamental hedgerow" && s.condition !== "Poor"),
        "Non-native and ornamental hedgerow can only have Poor condition"
    ),
    v.check(
        s => !(
            (typeof s.hedgerowEnhancedInAdvance === "string" || s.hedgerowEnhancedInAdvance > 0)
            && (typeof s.hedgerowEnhancedDelay === "string" || s.hedgerowEnhancedDelay > 0)
        ),
        "Cannot have both hedgerow enhanced in advance and delay in starting hedgerow enhancement"
    ),

    // Extract baseline data and length
    v.transform(enrichBaselineHedgerowData),

    // Enrich proposed hedgerow data
    v.transform(enrichProposedHedgerowData),

    // Validation checks for enhancement
    v.check(
        data => {
            const baseline = data._baselineHedgerow;
            const proposed = allHedgerows[data.habitatType];

            // V.High/High: Same hedgerow required (like for like)
            if (['V.High', 'High'].includes(baseline.distinctivenessCategory)) {
                return baseline.label === proposed.label;
            }

            // Medium: Same distinctiveness or higher
            if (baseline.distinctivenessCategory === 'Medium') {
                return proposed.distinctivenessScore >= baseline.distinctivenessScore;
            }

            // Low: Same distinctiveness or better
            if (baseline.distinctivenessCategory === 'Low') {
                return proposed.distinctivenessScore >= baseline.distinctivenessScore;
            }

            return true;
        },
        "Trading rules not satisfied - hedgerow distinctiveness mismatch"
    ),
    v.check(
        data => {
            const baselineCondition = data._baselineCondition;
            const proposedCondition = data.conditionScore;
            const baselineD = data._baselineHedgerow.distinctivenessScore;
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
        "Enhancement does not improve hedgerow quality"
    ),

    // Calculate enhancement pathway label
    v.transform(addEnhancementPathway),

    // Temporal calculation
    v.transform(lookupEnhancementTimeToTarget),
    v.transform(calculateFinalTimeToTargetValues),

    // Difficulty logic
    v.transform(determineEnhancementDifficulty),

    // Spatial risk multiplier
    v.transform(enrichWithSpatialRiskData),

    // Final calculation
    v.transform(calculateEnhancementUnitsDelivered),
)

export type OffSiteHedgerowEnhancementSchema = v.InferInput<typeof offSiteHedgerowEnhancementSchema>
export type OffSiteHedgerowEnhancement = v.InferOutput<typeof offSiteHedgerowEnhancementSchema>

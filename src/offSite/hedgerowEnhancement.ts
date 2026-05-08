import * as v from 'valibot';
import { Decimal } from '../decimal';
import { allHedgerows, type HedgerowLabel, type Hedgerow } from '../hedgerows';
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
    const hedgerow = allHedgerows[baseline.habitatType];

    return {
        ...data,
        length: baseline.lengthEnhanced,
        _baselineHedgerow: {
            ...hedgerow,
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
/**
 * Pure calculation: derives the enhancementPathway label.
 */
export function calculateEnhancementPathway(input: {
    baselineCondition: HedgerowCondition,
    proposedCondition: HedgerowCondition
}) {
    return { enhancementPathway: `${input.baselineCondition} to ${input.proposedCondition}` };
}

const addEnhancementPathway = <Data extends {
    baseline: OffSiteHedgerowBaseline,
    condition: HedgerowCondition
}>(data: Data) => {
    return {
        ...data,
        ...calculateEnhancementPathway({
            baselineCondition: data.baseline.condition,
            proposedCondition: data.condition
        })
    };
}

/**
 * Pure calculation: resolves the enhancement time-to-target by branching on
 * distinctiveness then doing a key lookup into the appropriate pathway map.
 */
export function calculateEnhancementTimeToTarget(input: {
    baselineDistinctivenessScore: Hedgerow['distinctivenessScore'],
    distinctivenessScore: Hedgerow['distinctivenessScore'],
    yearsToTargetConditionViaDistinctiveness: Hedgerow['yearsToTargetConditionViaDistinctiveness'] | undefined,
    yearsToTargetConditionViaEnhancement: Hedgerow['yearsToTargetConditionViaEnhancement'] | undefined,
    habitatType: HedgerowLabel,
    enhancementPathway: string,
}) {
    const notPossible = { timeToTargetCondition: "Not possible ▲" as const };

    if (input.baselineDistinctivenessScore < input.distinctivenessScore) {
        const pathways = input.yearsToTargetConditionViaDistinctiveness;
        if (!pathways) return notPossible;

        const timeToTargetCondition = pathways[input.habitatType as keyof typeof pathways] as number | "30+" | undefined;
        if (!timeToTargetCondition) return notPossible;

        return { timeToTargetCondition };
    }

    const enhancementTemporal = input.yearsToTargetConditionViaEnhancement;
    if (!enhancementTemporal) return notPossible;

    const pathway = input.enhancementPathway as keyof typeof enhancementTemporal;
    if (!(pathway in enhancementTemporal)) return notPossible;

    const timeToTargetCondition = enhancementTemporal[pathway] as number | "30+" | "Not possible ▲";
    return { timeToTargetCondition };
}

const lookupEnhancementTimeToTarget = <Data extends {
    _baselineHedgerow: Pick<Hedgerow, 'distinctivenessScore' | 'yearsToTargetConditionViaDistinctiveness'>,
    distinctivenessScore: Hedgerow['distinctivenessScore'],
    habitatType: HedgerowLabel,
    enhancementPathway: string
}>(data: Data) => {
    const hedgerow = allHedgerows[data.habitatType];
    return {
        ...data,
        ...calculateEnhancementTimeToTarget({
            baselineDistinctivenessScore: data._baselineHedgerow.distinctivenessScore,
            distinctivenessScore: data.distinctivenessScore,
            yearsToTargetConditionViaDistinctiveness: data._baselineHedgerow.yearsToTargetConditionViaDistinctiveness,
            yearsToTargetConditionViaEnhancement: hedgerow.yearsToTargetConditionViaEnhancement,
            habitatType: data.habitatType,
            enhancementPathway: data.enhancementPathway,
        }),
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
const calculateFinalTimeToTargetCondition = <Data extends {
    timeToTargetCondition: number | "30+" | "Not possible ▲",
    hedgerowEnhancedInAdvance: number | "30+",
    hedgerowEnhancedDelay: number | "30+"
}>(data: Data) => {
    const { timeToTargetCondition, hedgerowEnhancedInAdvance, hedgerowEnhancedDelay } = data;

    let finalTimeToTargetCondition: number | "30+" | "Not possible ▲";
    const normalisedHedgerowEnhancedInAdvance = yearsToNumber(hedgerowEnhancedInAdvance);
    const normalisedHedgerowEnhancedDelay = yearsToNumber(hedgerowEnhancedDelay);

    if (timeToTargetCondition === "Not possible ▲") {
        finalTimeToTargetCondition = "Not possible ▲";
    }
    else if (timeToTargetCondition === "30+") {
        if (hedgerowEnhancedInAdvance === 0) {
            finalTimeToTargetCondition = "30+";
        } else {
            const result = new Decimal(31).minus(normalisedHedgerowEnhancedInAdvance).plus(normalisedHedgerowEnhancedDelay).toNumber();
            if (result >= 30) {
                finalTimeToTargetCondition = "30+";
            } else {
                finalTimeToTargetCondition = Decimal.max(0, result).toNumber();
            }
        }
    }
    else if (normalisedHedgerowEnhancedInAdvance >= timeToTargetCondition) {
        finalTimeToTargetCondition = 0;
    }
    else {
        const result = new Decimal(timeToTargetCondition).minus(normalisedHedgerowEnhancedInAdvance).plus(normalisedHedgerowEnhancedDelay).toNumber();

        if (result > 30) {
            finalTimeToTargetCondition = "30+";
        } else {
            finalTimeToTargetCondition = Decimal.max(0, result).toNumber();
        }
    }

    return {
        ...data,
        finalTimeToTargetCondition,
    };
}

const lookupTemporalMultiplierStep = <Data extends {
    finalTimeToTargetCondition: number | "30+" | "Not possible ▲"
}>(data: Data) => {
    const finalTimeToTargetCondition = data.finalTimeToTargetCondition;
    const temporalMultiplier = typeof finalTimeToTargetCondition === 'number' || finalTimeToTargetCondition === '30+'
        ? lookupTemporalMultiplier(finalTimeToTargetCondition)
        : finalTimeToTargetCondition;

    const finalTimeToTargetMultiplier = typeof temporalMultiplier === 'number' ? temporalMultiplier : undefined;

    return {
        ...data,
        temporalMultiplier,
        finalTimeToTargetMultiplier
    };
}

/**
 * Determine enhancement difficulty based on whether hedgerow reached target before losses
 */
/**
 * Pure calculation: derives all hedgerow enhancement difficulty fields from
 * resolved standard difficulty.
 */
export function calculateEnhancementDifficulty(input: {
    hedgerowEnhancedInAdvance: number | "30+",
    finalTimeToTargetCondition: number | "30+" | "Not possible ▲",
    standardDifficultyOfEnhancement: string,
}) {
    const normalisedHedgerowEnhancedInAdvance = typeof input.hedgerowEnhancedInAdvance === "string" ? 30 : input.hedgerowEnhancedInAdvance;

    const hasReachedTargetCondition =
        normalisedHedgerowEnhancedInAdvance > 0 &&
        input.finalTimeToTargetCondition === 0;

    let appliedDifficultyMultiplier: string;
    if (hasReachedTargetCondition) {
        appliedDifficultyMultiplier = "Low Difficulty - only applicable if all hedgerow enhanced before losses ⚠";
    } else {
        appliedDifficultyMultiplier = "Standard difficulty applied";
    }

    let finalDifficultyOfEnhancement: keyof typeof difficulty;
    if (appliedDifficultyMultiplier === "Low Difficulty - only applicable if all hedgerow enhanced before losses ⚠") {
        finalDifficultyOfEnhancement = "Low";
    } else {
        finalDifficultyOfEnhancement = input.standardDifficultyOfEnhancement as keyof typeof difficulty;
    }

    const difficultyMultiplierApplied = difficulty[finalDifficultyOfEnhancement];

    return {
        standardDifficultyOfEnhancement: input.standardDifficultyOfEnhancement,
        appliedDifficultyMultiplier,
        finalDifficultyOfEnhancement,
        difficultyMultiplierApplied,
    };
}

const determineEnhancementDifficulty = <Data extends {
    habitatType: HedgerowLabel,
    timeToTargetCondition: number | "30+" | "Not possible ▲",
    hedgerowEnhancedInAdvance: number | "30+",
    finalTimeToTargetCondition: number | "30+" | "Not possible ▲",
    technicalDifficultyEnhancement: string,
    technicalDifficultyEnhancementMultiplier: number
}>(data: Data) => {
    const hedgerow = allHedgerows[data.habitatType];

    return {
        ...data,
        ...calculateEnhancementDifficulty({
            hedgerowEnhancedInAdvance: data.hedgerowEnhancedInAdvance,
            finalTimeToTargetCondition: data.finalTimeToTargetCondition,
            standardDifficultyOfEnhancement: hedgerow.technicalDifficultyEnhancement,
        }),
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
/**
 * Pure calculation: derives hedgerowUnitsDelivered (with and without spatial risk) for an enhancement.
 */
export function calculateEnhancementUnitsDeliveredPure(input: {
    length: number,
    baselineDistinctivenessScore: number,
    baselineConditionScore: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
    finalTimeToTargetMultiplier: number | undefined,
    difficultyMultiplierApplied: number,
    spatialRiskMultiplier: number
}) {
    const length = input.length;
    const baselineD = input.baselineDistinctivenessScore;
    const baselineC = input.baselineConditionScore;
    const proposedD = input.distinctivenessScore;
    const proposedC = input.conditionScore;
    const strategic = input.strategicSignificanceMultiplier;
    const difficulty = input.difficultyMultiplierApplied;
    const temporal = input.finalTimeToTargetMultiplier ?? 0;
    const spatialRisk = input.spatialRiskMultiplier;

    const effectiveBaselineC = baselineC > proposedC ? proposedC : baselineC;
    const proposedUnits = new Decimal(length).mul(proposedD).mul(proposedC);
    const baselineUnits = new Decimal(length).mul(baselineD).mul(effectiveBaselineC);
    const delta = proposedUnits.minus(baselineUnits).mul(difficulty).mul(temporal);
    const baseUnits = delta.plus(baselineUnits).mul(strategic);

    const hedgerowUnitsDeliveredWithSpatialRisk = baseUnits.mul(spatialRisk).toNumber();
    const hedgerowUnitsDelivered = baseUnits.toNumber();

    return { hedgerowUnitsDeliveredWithSpatialRisk, hedgerowUnitsDelivered };
}

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
    return {
        ...data,
        ...calculateEnhancementUnitsDeliveredPure({
            length: data.length,
            baselineDistinctivenessScore: data._baselineHedgerow.distinctivenessScore,
            baselineConditionScore: data._baselineCondition,
            distinctivenessScore: data.distinctivenessScore,
            conditionScore: data.conditionScore,
            strategicSignificanceMultiplier: data.strategicSignificanceMultiplier,
            finalTimeToTargetMultiplier: data.finalTimeToTargetMultiplier,
            difficultyMultiplierApplied: data.difficultyMultiplierApplied,
            spatialRiskMultiplier: data.spatialRiskMultiplier,
        })
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
    v.transform(calculateFinalTimeToTargetCondition),
    v.transform(lookupTemporalMultiplierStep),

    // Difficulty logic
    v.transform(determineEnhancementDifficulty),

    // Spatial risk multiplier
    v.transform(enrichWithSpatialRiskData),

    // Final calculation
    v.transform(calculateEnhancementUnitsDelivered),
)

export type OffSiteHedgerowEnhancementSchema = v.InferInput<typeof offSiteHedgerowEnhancementSchema>
export type OffSiteHedgerowEnhancement = v.InferOutput<typeof offSiteHedgerowEnhancementSchema>

import * as v from 'valibot';
import { broadHabitatSchema } from '../broadHabitats';
import { enhancedHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import { enrichWithHabitatData, freeTextSchema, isValidCondition, isValidHabitat, yearsSchema } from '../schemaUtils';
import { offSiteHabitatBaselineSchema } from './habitatBaseline';
import { habitatByBroadAndType } from '../habitats';
import { difficulty } from '../difficulty';
import { calculateFinalTimeToTargetCondition as calculateFinalTimeToTargetConditionCommon, lookupFinalTimeToTargetMultiplier, enrichWithSpatialRisk } from './common';
import { Decimal } from '../decimal';

const inputSchema = v.object({
    baseline: offSiteHabitatBaselineSchema,
    broadHabitat: broadHabitatSchema,
    habitatType: enhancedHabitatType,
    condition: conditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    habitatEnhancedInAdvance: v.optional(yearsSchema, 0),
    habitatEnhancedDelay: v.optional(yearsSchema, 0),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
})

/**
 * Extract baseline habitat data including area
 * The baseline contains the area that is being enhanced
 */
/**
 * Pure restructure: extracts baseline-derived fields onto a flat object.
 */
export function calculateBaselineHabitatData(input: { baseline: any }) {
    return {
        area: input.baseline.areaEnhanced,
        _baselineHabitat: input.baseline._habitat,
        _baselineCondition: input.baseline.conditionScore,
    };
}

const enrichBaselineHabitatData = <Data extends {
    baseline: any
}>(data: Data) => {
    return { ...data, ...calculateBaselineHabitatData(data) };
}

/**
 * Calculate distinctiveness change label (Column T in Excel)
 * Format: "<baseline distinctiveness band> - <proposed distinctiveness band>"
 * Example: "Low - Medium", "High - High"
 */
const addDistinctivenessChange = <Data extends {
    _baselineHabitat: any,
    broadHabitat: string,
    habitatType: string
}>(data: Data) => {
    const baselineHabitat = data._baselineHabitat;
    const proposedHabitat = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

    const baselineDistinctivenessCategory = baselineHabitat.distinctivenessCategory;
    const proposedDistinctivenessCategory = proposedHabitat.distinctivenessCategory;

    const distinctivenessChange = `${baselineDistinctivenessCategory} - ${proposedDistinctivenessCategory}`;

    return {
        ...data,
        distinctivenessChange
    };
}

/**
 * Calculate enhancement pathway label (Column U in Excel)
 * This determines the correct pathway for temporal multiplier lookup
 *
 * Format depends on distinctiveness change:
 * - If upgrading distinctiveness (baseline < proposed): "Lower Distinctiveness Habitat - <proposed condition>"
 * - Otherwise: "<baseline condition> - <proposed condition>"
 */
const addEnhancementPathway = <Data extends {
    baseline: any,
    broadHabitat: string,
    habitatType: string,
    condition: string,
    _baselineHabitat: any
}>(data: Data) => {
    const baselineCondition = data.baseline.condition;
    const proposedCondition = data.condition;

    // Get baseline and proposed habitat labels to check if they're different
    const baselineHabitat = data._baselineHabitat;
    const proposedHabitat = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

    const habitatChanged = baselineHabitat.label !== proposedHabitat.label;
    const baselineDistinctiveness = baselineHabitat.distinctivenessScore;
    const proposedDistinctiveness = proposedHabitat.distinctivenessScore;

    // If upgrading from lower distinctiveness habitat to higher, use special pathway
    let conditionChange: string;
    if (habitatChanged && baselineDistinctiveness < proposedDistinctiveness) {
        conditionChange = `Lower Distinctiveness Habitat - ${proposedCondition}`;
    } else {
        conditionChange = `${baselineCondition} - ${proposedCondition}`;
    }

    return {
        ...data,
        enhancementPathway: conditionChange,
        conditionChange
    };
}

/**
 * Lookup enhancement time to target from habitat enhancement temporal multipliers (Column AD in Excel)
 *
 * Excel formula (AD12):
 * INDEX(EnhanceTemporal, MATCH(S12, EnhanceHabitat, 0), MATCH(U12, EnhanceCondition, 0))
 *
 * Where:
 * - S12 is the proposed habitat type (broadHabitat + habitatType)
 * - U12 is conditionChange (Column U) - the enhancement pathway
 *
 * This uses conditionChange to lookup the temporal multiplier from the habitat's enhancement temporal table.
 */
const enrichWithTimeToTargetCondition = <Data extends {
    broadHabitat: string,
    habitatType: string,
    conditionChange: string
}>(data: Data) => {
    const habitat = habitatByBroadAndType(data.broadHabitat as any, data.habitatType as any)!;

    // Get enhancement temporal multipliers for this habitat (EnhanceTemporal table in Excel)
    const enhancementTemporal = habitat.enhancementTemporalMultipliers;

    // Lookup time to target using conditionChange (Column U) as the key
    // This matches: INDEX(EnhanceTemporal, MATCH(habitat), MATCH(conditionChange))
    let timeToTargetCondition: number | "30+" | "Not Possible ▲" = "Not Possible ▲";

    if (enhancementTemporal) {
        const pathway = data.conditionChange as keyof typeof enhancementTemporal;
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
 */
const calculateFinalTimeToTargetCondition = <Data extends {
    timeToTargetCondition: number | "30+" | "Not Possible ▲",
    habitatEnhancedInAdvance: number | "30+",
    habitatEnhancedDelay: number | "30+"
}>(data: Data) => {
    return calculateFinalTimeToTargetConditionCommon({
        ...data,
        advance: data.habitatEnhancedInAdvance,
        delay: data.habitatEnhancedDelay,
    });
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
 * Enriches data with spatial risk multiplier from baseline.
 */
const enrichWithSpatialRiskData = <Data extends {
    baseline: any
}>(data: Data) => {
    return enrichWithSpatialRisk({
        ...data,
        spatialRiskCategory: data.baseline.spatialRiskCategory
    });
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
 * For off-site, calculates two values:
 * 1. habitatUnitsDeliveredWithSpatialRisk: includes spatial risk multiplier (column AP in Excel)
 * 2. habitatUnitsDelivered: without spatial risk multiplier (column AQ in Excel)
 *
 * Special case: If baseline condition > proposed condition (condition reduced),
 * use proposed condition as baseline condition for calculation
 */
/**
 * Pure calculation: derives habitatUnitsDelivered (with and without spatial risk) for an enhancement.
 */
export function calculateEnhancementUnitsDeliveredPure(input: {
    area: number,
    baselineDistinctivenessScore: number,
    baselineConditionScore: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
    finalTimeToTargetMultiplier: number | undefined,
    difficultyMultiplierApplied: number,
    spatialRiskMultiplier: number
}) {
    const area = input.area;
    const baselineD = input.baselineDistinctivenessScore;
    const baselineC = input.baselineConditionScore;
    const proposedD = input.distinctivenessScore;
    const proposedC = input.conditionScore;
    const strategic = input.strategicSignificanceMultiplier;
    const difficulty = input.difficultyMultiplierApplied;
    const temporal = input.finalTimeToTargetMultiplier ?? 0;
    const spatialRisk = input.spatialRiskMultiplier;

    const effectiveBaselineC = baselineC > proposedC ? proposedC : baselineC;
    const proposedUnits = new Decimal(area).mul(proposedD).mul(proposedC);
    const baselineUnits = new Decimal(area).mul(baselineD).mul(effectiveBaselineC);
    const delta = proposedUnits.minus(baselineUnits).mul(difficulty).mul(temporal);
    const baseUnits = delta.plus(baselineUnits).mul(strategic);

    const habitatUnitsDeliveredWithSpatialRisk = baseUnits.mul(spatialRisk).toNumber();
    const habitatUnitsDelivered = baseUnits.toNumber();

    return { habitatUnitsDeliveredWithSpatialRisk, habitatUnitsDelivered };
}

const calculateEnhancementUnitsDelivered = <Data extends {
    area: number,
    _baselineHabitat: any,
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
            area: data.area,
            baselineDistinctivenessScore: data._baselineHabitat.distinctivenessScore,
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

export const offSiteHabitatEnhancementSchema = v.pipe(
    inputSchema,
    v.check(s => isValidHabitat(s.broadHabitat, s.habitatType), "The broad habitat and habitat type are incompatible"),
    v.check(s => isValidCondition(s.broadHabitat, s.habitatType, s.condition), "The condition for this habitat is invalid"),
    v.check(
        s => !(
            (s.habitatEnhancedInAdvance === "30+" || s.habitatEnhancedInAdvance > 0)
            && (s.habitatEnhancedDelay === "30+" || s.habitatEnhancedDelay > 0)
        ),
        "Cannot have both habitat enhanced in advance and delay in starting habitat enhancement"
    ),
    v.transform(enrichBaselineHabitatData),
    v.transform(enrichWithHabitatData),
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
    v.transform(addDistinctivenessChange),
    v.transform(addEnhancementPathway),
    v.transform(enrichWithTimeToTargetCondition),
    v.transform(calculateFinalTimeToTargetCondition),
    v.transform(lookupFinalTimeToTargetMultiplier),
    v.transform(determineEnhancementDifficulty),
    v.transform(enrichWithSpatialRiskData),
    v.transform(calculateEnhancementUnitsDelivered),
)

export type OffSiteHabitatEnhancementSchema = v.InferInput<typeof offSiteHabitatEnhancementSchema>
export type OffSiteHabitatEnhancement = v.InferOutput<typeof offSiteHabitatEnhancementSchema>


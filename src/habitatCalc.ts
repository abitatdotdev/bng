import { Decimal } from './decimal';

/**
 * Pure calculation: derives habitatUnitsDelivered for habitat creation and (when
 * spatialRiskMultiplier is supplied) habitatUnitsDeliveredWithSpatialRisk.
 */
export function calculateHabitatUnitsDelivered(input: {
    area: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
    finalTimeToTargetMultiplier: number | undefined,
    difficultyMultiplierApplied: number,
    spatialRiskMultiplier?: number,
}) {
    const habitatUnitsDelivered = new Decimal(input.area)
        .mul(input.distinctivenessScore)
        .mul(input.conditionScore)
        .mul(input.strategicSignificanceMultiplier)
        .mul(input.finalTimeToTargetMultiplier ?? 0)
        .mul(input.difficultyMultiplierApplied)
        .toNumber();

    const habitatUnitsDeliveredWithSpatialRisk = new Decimal(habitatUnitsDelivered)
        .mul(input.spatialRiskMultiplier ?? 1)
        .toNumber();

    return { habitatUnitsDelivered, habitatUnitsDeliveredWithSpatialRisk };
}

/**
 * Pure calculation: derives habitatUnitsDelivered for an enhancement and (when
 * spatialRiskMultiplier is supplied) habitatUnitsDeliveredWithSpatialRisk.
 */
export function calculateEnhancementUnitsDelivered(input: {
    area: number,
    baselineDistinctivenessScore: number,
    baselineConditionScore: number,
    distinctivenessScore: number,
    conditionScore: number,
    strategicSignificanceMultiplier: number,
    finalTimeToTargetMultiplier: number | undefined,
    difficultyMultiplierApplied: number,
    spatialRiskMultiplier?: number,
}) {
    const area = input.area;
    const baselineD = input.baselineDistinctivenessScore;
    const baselineC = input.baselineConditionScore;
    const proposedD = input.distinctivenessScore;
    const proposedC = input.conditionScore;
    const strategic = input.strategicSignificanceMultiplier;
    const difficulty = input.difficultyMultiplierApplied;
    const temporal = input.finalTimeToTargetMultiplier ?? 0;

    const effectiveBaselineC = baselineC > proposedC ? proposedC : baselineC;
    const proposedUnits = new Decimal(area).mul(proposedD).mul(proposedC);
    const baselineUnits = new Decimal(area).mul(baselineD).mul(effectiveBaselineC);
    const delta = proposedUnits.minus(baselineUnits).mul(difficulty).mul(temporal);
    const baseUnits = delta.plus(baselineUnits).mul(strategic);

    const habitatUnitsDelivered = baseUnits.toNumber();
    const habitatUnitsDeliveredWithSpatialRisk = baseUnits.mul(input.spatialRiskMultiplier ?? 1).toNumber();

    return { habitatUnitsDelivered, habitatUnitsDeliveredWithSpatialRisk };
}

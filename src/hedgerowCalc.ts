import { isFiniteQuantity, type Quantity, Decimal, toDecimal } from './decimal';
import type { HedgerowCondition } from './hedgerowCondition';
import type { Hedgerow, HedgerowLabel } from './hedgerows';

/**
 * Pure calculation: derives unitsRetained and unitsEnhanced for a hedgerow baseline.
 */
export function calculateBaselineUnits(input: {
    lengthRetained: Quantity;
    lengthRetainedDecimal?: Decimal;
    lengthEnhanced: Quantity;
    lengthEnhancedDecimal?: Decimal;
    distinctivenessScore: Quantity;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: Quantity;
    strategicSignificanceMultiplierDecimal?: Decimal;
}) {
    const unitsRetained = new Decimal(input.lengthRetainedDecimal ?? toDecimal(input.lengthRetained))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(input.conditionScoreDecimal ?? toDecimal(input.conditionScore))
        .mul(
            input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier),
        );

    const unitsEnhanced = new Decimal(input.lengthEnhancedDecimal ?? toDecimal(input.lengthEnhanced))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(input.conditionScoreDecimal ?? toDecimal(input.conditionScore))
        .mul(
            input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier),
        );

    return {
        unitsRetained: unitsRetained.toNumber(),
        unitsRetainedDecimal: unitsRetained,
        unitsEnhanced: unitsEnhanced.toNumber(),
        unitsEnhancedDecimal: unitsEnhanced,
    };
}

/**
 * Pure calculation: derives totalHedgerowUnits.
 */
export function calculateTotalHedgerowUnits(input: {
    length: Quantity;
    lengthDecimal?: Decimal;
    distinctivenessScore: Quantity;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: Quantity;
    strategicSignificanceMultiplierDecimal?: Decimal;
}) {
    const totalHedgerowUnits = new Decimal(input.lengthDecimal ?? toDecimal(input.length))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(input.conditionScoreDecimal ?? toDecimal(input.conditionScore))
        .mul(
            input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier),
        );

    return {
        totalHedgerowUnits: totalHedgerowUnits.toNumber(),
        totalHedgerowUnitsDecimal: totalHedgerowUnits,
    };
}

/**
 * Pure calculation: derives lengthLost and unitsLost.
 */
export function calculateUnitsLost(input: {
    length: Quantity;
    lengthDecimal?: Decimal;
    lengthRetained: Quantity;
    lengthRetainedDecimal?: Decimal;
    lengthEnhanced: Quantity;
    lengthEnhancedDecimal?: Decimal;
    totalHedgerowUnits: Quantity;
    totalHedgerowUnitsDecimal?: Decimal;
    unitsRetained: Quantity;
    unitsRetainedDecimal?: Decimal;
    unitsEnhanced: Quantity;
    unitsEnhancedDecimal?: Decimal;
}) {
    const lengthLost = new Decimal(input.lengthDecimal ?? toDecimal(input.length))
        .minus(input.lengthRetainedDecimal ?? toDecimal(input.lengthRetained))
        .minus(input.lengthEnhancedDecimal ?? toDecimal(input.lengthEnhanced));
    const unitsLost = lengthLost.isZero()
        ? 0
        : new Decimal(input.totalHedgerowUnitsDecimal ?? toDecimal(input.totalHedgerowUnits))
              .minus(input.unitsRetainedDecimal ?? toDecimal(input.unitsRetained))
              .minus(input.unitsEnhancedDecimal ?? toDecimal(input.unitsEnhanced));

    return {
        lengthLost: lengthLost.toNumber(),
        lengthLostDecimal: lengthLost,
        unitsLost: toDecimal(unitsLost).toNumber(),
        unitsLostDecimal: toDecimal(unitsLost),
    };
}

/**
 * Pure calculation: derives the enhancementPathway label "<baseline> to <proposed>".
 */
export function calculateEnhancementPathway(input: {
    baselineCondition: HedgerowCondition;
    proposedCondition: HedgerowCondition;
}) {
    return { enhancementPathway: `${input.baselineCondition} to ${input.proposedCondition}` };
}

/**
 * Final creation time follows the B-2/E-2 formula branches. Numeric 30
 * and the "30+" sentinel have different temporal multipliers.
 */
export function calculateFinalTimeToTargetCondition(input: {
    standardTimeToTargetCondition: number | string | undefined;
    habitatCreatedInAdvance: number | '30+';
    delayInStartingHabitatCreation: number | '30+';
}) {
    const standard = input.standardTimeToTargetCondition;
    const advance = input.habitatCreatedInAdvance;
    const delay = input.delayInStartingHabitatCreation;
    let finalTimeToTargetCondition: number | string | undefined;

    if (standard === undefined) {
        finalTimeToTargetCondition = undefined;
    } else if (standard !== '30+' && typeof standard === 'string') {
        finalTimeToTargetCondition = standard;
    } else if (advance === '30+') {
        finalTimeToTargetCondition = 0;
    } else if (delay === '30+') {
        finalTimeToTargetCondition = '30+';
    } else if (standard === '30+') {
        finalTimeToTargetCondition = advance > 0 ? new Decimal(30).minus(advance).toNumber() : '30+';
    } else {
        const delayedTime = new Decimal(standard).plus(delay);
        finalTimeToTargetCondition = delayedTime.gt(30)
            ? '30+'
            : Decimal.max(0, delayedTime.minus(advance)).toNumber();
    }

    return {
        finalTimeToTargetCondition,
        finalTimeToTargetConditionDecimal:
            typeof finalTimeToTargetCondition === 'number'
                ? toDecimal(finalTimeToTargetCondition)
                : finalTimeToTargetCondition,
    };
}

/**
 * Pure calculation: resolves the enhancement time-to-target by branching on
 * distinctiveness then doing a key lookup into the appropriate pathway map.
 */
export function calculateEnhancementTimeToTarget(input: {
    baselineDistinctivenessScore: Hedgerow['distinctivenessScore'];
    distinctivenessScore: Hedgerow['distinctivenessScore'];
    yearsToTargetConditionViaDistinctiveness:
        Hedgerow['yearsToTargetConditionViaDistinctiveness'] | undefined;
    yearsToTargetConditionViaEnhancement: Hedgerow['yearsToTargetConditionViaEnhancement'] | undefined;
    habitatType: HedgerowLabel;
    enhancementPathway: string;
}): {
    timeToTargetCondition: number | '30+' | 'Not possible ▲';
    timeToTargetConditionDecimal: Decimal | '30+' | 'Not possible ▲';
} {
    const notPossible = {
        timeToTargetCondition: 'Not possible ▲' as const,
        timeToTargetConditionDecimal: 'Not possible ▲' as const,
    };

    if (input.baselineDistinctivenessScore < input.distinctivenessScore) {
        const pathways = input.yearsToTargetConditionViaDistinctiveness;
        if (!pathways) return notPossible;

        const value = pathways[input.habitatType as keyof typeof pathways] as number | '30+' | undefined;
        if (!value) return notPossible;
        return {
            timeToTargetCondition: value,
            timeToTargetConditionDecimal: typeof value === 'number' ? toDecimal(value) : value,
        };
    }

    const enhancementTemporal = input.yearsToTargetConditionViaEnhancement;
    if (!enhancementTemporal) return notPossible;

    const pathway = input.enhancementPathway as keyof typeof enhancementTemporal;
    if (!(pathway in enhancementTemporal)) return notPossible;

    const timeToTargetCondition = enhancementTemporal[pathway] as number | '30+' | 'Not possible ▲';
    return {
        timeToTargetCondition,
        timeToTargetConditionDecimal:
            typeof timeToTargetCondition === 'number'
                ? toDecimal(timeToTargetCondition)
                : timeToTargetCondition,
    };
}

/**
 * Pure calculation: derives hedgerowUnitsDelivered and (when spatialRiskMultiplier is
 * supplied) hedgerowUnitsDeliveredWithSpatialRisk.
 */
export function calculateHedgerowUnitsDelivered(input: {
    length: Quantity;
    lengthDecimal?: Decimal;
    distinctivenessScore: Quantity;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: Quantity;
    strategicSignificanceMultiplierDecimal?: Decimal;
    temporalMultiplier: Quantity | string | undefined;
    temporalMultiplierDecimal?: Decimal | string;
    difficultyMultiplier: Quantity;
    difficultyMultiplierDecimal?: Decimal;
    spatialRiskMultiplier?: Quantity;
    spatialRiskMultiplierDecimal?: Decimal;
}) {
    const temporalMultiplierValue =
        typeof input.temporalMultiplier === 'number' ||
        Decimal.isDecimal(input.temporalMultiplier) ||
        (typeof input.temporalMultiplier === 'string' && isFiniteQuantity(input.temporalMultiplier))
            ? new Decimal(
                  (input.temporalMultiplierDecimal ??
                      (input.temporalMultiplier === undefined
                          ? undefined
                          : toDecimal(input.temporalMultiplier))) as Decimal,
              )
            : 0;

    const hedgerowUnitsDelivered = new Decimal(input.lengthDecimal ?? toDecimal(input.length))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(input.conditionScoreDecimal ?? toDecimal(input.conditionScore))
        .mul(input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier))
        .mul(temporalMultiplierValue)
        .mul(input.difficultyMultiplierDecimal ?? toDecimal(input.difficultyMultiplier));

    const hedgerowUnitsDeliveredWithSpatialRisk = new Decimal(hedgerowUnitsDelivered).mul(
        input.spatialRiskMultiplierDecimal ??
            (input.spatialRiskMultiplier === undefined
                ? undefined
                : toDecimal(input.spatialRiskMultiplier)) ??
            1,
    );

    return {
        hedgerowUnitsDelivered: hedgerowUnitsDelivered.toNumber(),
        hedgerowUnitsDeliveredDecimal: hedgerowUnitsDelivered,
        hedgerowUnitsDeliveredWithSpatialRisk: hedgerowUnitsDeliveredWithSpatialRisk.toNumber(),
        hedgerowUnitsDeliveredWithSpatialRiskDecimal: hedgerowUnitsDeliveredWithSpatialRisk,
    };
}

/**
 * Pure calculation: derives hedgerowUnitsDelivered for an enhancement and (when
 * spatialRiskMultiplier is supplied) hedgerowUnitsDeliveredWithSpatialRisk.
 */
export function calculateEnhancementUnitsDelivered(input: {
    length: Quantity;
    lengthDecimal?: Decimal;
    baselineDistinctivenessScore: Quantity;
    baselineDistinctivenessScoreDecimal?: Decimal;
    baselineConditionScore: Quantity;
    baselineConditionScoreDecimal?: Decimal;
    distinctivenessScore: Quantity;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: Quantity;
    strategicSignificanceMultiplierDecimal?: Decimal;
    temporalMultiplier: Quantity | string | undefined;
    temporalMultiplierDecimal?: Decimal | string;
    difficultyMultiplierApplied: Quantity;
    difficultyMultiplierAppliedDecimal?: Decimal;
    spatialRiskMultiplier?: Quantity;
    spatialRiskMultiplierDecimal?: Decimal;
}) {
    const length = input.lengthDecimal ?? toDecimal(input.length);
    const baselineD =
        input.baselineDistinctivenessScoreDecimal ?? toDecimal(input.baselineDistinctivenessScore);
    const baselineC = input.baselineConditionScoreDecimal ?? toDecimal(input.baselineConditionScore);
    const proposedD = input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore);
    const proposedC = input.conditionScoreDecimal ?? toDecimal(input.conditionScore);
    const strategic =
        input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier);
    const difficulty =
        input.difficultyMultiplierAppliedDecimal ?? toDecimal(input.difficultyMultiplierApplied);
    const temporal =
        typeof input.temporalMultiplier === 'number' ||
        Decimal.isDecimal(input.temporalMultiplier) ||
        (typeof input.temporalMultiplier === 'string' && isFiniteQuantity(input.temporalMultiplier))
            ? new Decimal(
                  (input.temporalMultiplierDecimal ??
                      (input.temporalMultiplier === undefined
                          ? undefined
                          : toDecimal(input.temporalMultiplier))) as Decimal,
              )
            : 0;

    const effectiveBaselineC = new Decimal(baselineC).gt(proposedC) ? proposedC : baselineC;
    const proposedUnits = new Decimal(length).mul(proposedD).mul(proposedC);
    const baselineUnits = new Decimal(length).mul(baselineD).mul(effectiveBaselineC);
    const delta = proposedUnits.minus(baselineUnits).mul(difficulty).mul(temporal);
    const baseUnits = delta.plus(baselineUnits).mul(strategic);

    const hedgerowUnitsDelivered = baseUnits;
    const hedgerowUnitsDeliveredWithSpatialRisk = baseUnits.mul(
        input.spatialRiskMultiplierDecimal ??
            (input.spatialRiskMultiplier === undefined
                ? undefined
                : toDecimal(input.spatialRiskMultiplier)) ??
            1,
    );

    return {
        hedgerowUnitsDelivered: hedgerowUnitsDelivered.toNumber(),
        hedgerowUnitsDeliveredDecimal: hedgerowUnitsDelivered,
        hedgerowUnitsDeliveredWithSpatialRisk: hedgerowUnitsDeliveredWithSpatialRisk.toNumber(),
        hedgerowUnitsDeliveredWithSpatialRiskDecimal: hedgerowUnitsDeliveredWithSpatialRisk,
    };
}

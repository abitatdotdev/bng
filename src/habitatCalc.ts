import { type Quantity, Decimal, toDecimal } from './decimal';
import type { BespokeCompensation } from './bespokeCompensation';
import type { SuggestedTradingActions } from './distinctivenessCategories';
import { isAreaAllocationOverrun } from './areaCalculationRules';

function conditionScoreDecimal(score: Quantity | undefined, decimalScore?: Decimal): Decimal {
    if (decimalScore !== undefined) return decimalScore;
    if (score === undefined) throw new Error('Habitat condition score is unavailable');
    return toDecimal(score);
}

/**
 * Pure calculation: derives baseline units retained/enhanced and area habitat lost.
 *
 * Off-site enhancement of irreplaceable Individual trees is gated to 0; pass
 * `broadHabitat` to enable that branch. On-site callers omit it (the schema
 * already rejects this combination before the value is observed).
 */
export function calculateBaselineUnits(input: {
    irreplaceableHabitat: boolean;
    area: Quantity;
    areaDecimal?: Decimal;
    areaRetained: Quantity;
    areaRetainedDecimal?: Decimal;
    areaEnhanced: Quantity;
    areaEnhancedDecimal?: Decimal;
    distinctivenessScore: Quantity;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity | undefined;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: Quantity;
    strategicSignificanceMultiplierDecimal?: Decimal;
    broadHabitat?: string;
}) {
    const distinctivenessScore = toDecimal(
        input.distinctivenessScoreDecimal ?? input.distinctivenessScore ?? 0,
    );
    const conditionScore = toDecimal(input.conditionScoreDecimal ?? input.conditionScore ?? 0);
    const strategicSignificanceMultiplier = toDecimal(
        input.strategicSignificanceMultiplierDecimal ?? input.strategicSignificanceMultiplier ?? 0,
    );

    const baselineUnitsRetained = input.irreplaceableHabitat
        ? 0
        : new Decimal(input.areaRetainedDecimal ?? toDecimal(input.areaRetained))
              .mul(distinctivenessScore)
              .mul(conditionScore)
              .mul(strategicSignificanceMultiplier);

    const baselineUnitsEnhanced =
        input.broadHabitat === 'Individual trees' &&
        new Decimal(input.areaEnhancedDecimal ?? toDecimal(input.areaEnhanced)).gt(0) &&
        input.irreplaceableHabitat
            ? 0
            : new Decimal(input.areaEnhancedDecimal ?? toDecimal(input.areaEnhanced))
                  .mul(distinctivenessScore)
                  .mul(conditionScore)
                  .mul(strategicSignificanceMultiplier);

    const areaHabitatLost = isAreaAllocationOverrun(input)
        ? toDecimal(0)
        : new Decimal(input.areaDecimal ?? toDecimal(input.area))
              .minus(input.areaRetainedDecimal ?? toDecimal(input.areaRetained))
              .minus(input.areaEnhancedDecimal ?? toDecimal(input.areaEnhanced));

    return {
        baselineUnitsRetained: toDecimal(baselineUnitsRetained).toNumber(),
        baselineUnitsRetainedDecimal: toDecimal(baselineUnitsRetained),
        baselineUnitsEnhanced: toDecimal(baselineUnitsEnhanced).toNumber(),
        baselineUnitsEnhancedDecimal: toDecimal(baselineUnitsEnhanced),
        areaHabitatLost: areaHabitatLost.toNumber(),
        areaHabitatLostDecimal: areaHabitatLost,
    };
}

/**
 * Pure calculation of hidden cell AT/AS, used later in the headline results.
 */
export function calculateVhdhBespokeCompensationUnits(input: {
    bespokeCompensationAgreed: BespokeCompensation;
    requiredAction: SuggestedTradingActions;
    totalHabitatUnits: Quantity;
    totalHabitatUnitsDecimal?: Decimal;
    baselineUnitsRetained: Quantity;
    baselineUnitsRetainedDecimal?: Decimal;
    baselineUnitsEnhanced: Quantity;
    baselineUnitsEnhancedDecimal?: Decimal;
}) {
    const vhdhBespokeCompensationUnits =
        (input.bespokeCompensationAgreed === 'Yes' || input.bespokeCompensationAgreed === 'Pending') &&
        input.requiredAction === 'Same habitat required – bespoke compensation option ⚠'
            ? new Decimal(input.totalHabitatUnitsDecimal ?? toDecimal(input.totalHabitatUnits))
                  .minus(input.baselineUnitsRetainedDecimal ?? toDecimal(input.baselineUnitsRetained))
                  .minus(input.baselineUnitsEnhancedDecimal ?? toDecimal(input.baselineUnitsEnhanced))
            : 0;

    return {
        vhdhBespokeCompensationUnits: toDecimal(vhdhBespokeCompensationUnits).toNumber(),
        vhdhBespokeCompensationUnitsDecimal: toDecimal(vhdhBespokeCompensationUnits),
    };
}

/**
 * Pure calculation: derives totalHabitatUnits.
 *
 * `irreplaceableHabitat` activates the irreplaceable branch (off-site behaviour).
 * Omit or pass `false` to skip it (on-site behaviour).
 */
export function calculateTotalHabitatUnits(input: {
    requiredAction: SuggestedTradingActions;
    area: Quantity;
    areaDecimal?: Decimal;
    areaRetained: Quantity;
    areaRetainedDecimal?: Decimal;
    areaEnhanced: Quantity;
    areaEnhancedDecimal?: Decimal;
    bespokeCompensationAgreed: BespokeCompensation;
    baselineUnitsRetained: Quantity;
    baselineUnitsRetainedDecimal?: Decimal;
    baselineUnitsEnhanced: Quantity;
    baselineUnitsEnhancedDecimal?: Decimal;
    distinctivenessScore: Quantity;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity | undefined;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: Quantity;
    strategicSignificanceMultiplierDecimal?: Decimal;
    irreplaceableHabitat?: boolean;
    totalHabitatUnits?: Quantity;
    totalHabitatUnitsDecimal?: Decimal;
}) {
    const bespokeRequired = input.requiredAction === 'Bespoke compensation likely to be required';
    const hasRetention = new Decimal(input.areaRetainedDecimal ?? toDecimal(input.areaRetained)).gt(0);
    const hasEnhancement = new Decimal(input.areaEnhancedDecimal ?? toDecimal(input.areaEnhanced)).gt(0);
    const hasBiodiversityGain = hasRetention || hasEnhancement;

    const distinctivenessScore = toDecimal(
        input.distinctivenessScoreDecimal ?? input.distinctivenessScore ?? 0,
    );
    const conditionScore = toDecimal(input.conditionScoreDecimal ?? input.conditionScore ?? 0);
    const strategicSignificanceMultiplier = toDecimal(
        input.strategicSignificanceMultiplierDecimal ?? input.strategicSignificanceMultiplier ?? 0,
    );

    let totalHabitatUnits: Quantity = 0;

    if (input.irreplaceableHabitat) {
        totalHabitatUnits = new Decimal(input.areaEnhancedDecimal ?? toDecimal(input.areaEnhanced))
            .mul(distinctivenessScore)
            .mul(conditionScore)
            .mul(strategicSignificanceMultiplier);
    } else if (bespokeRequired && !hasBiodiversityGain && input.bespokeCompensationAgreed === 'Yes') {
        totalHabitatUnits = 0;
    } else if (bespokeRequired && hasBiodiversityGain) {
        totalHabitatUnits = new Decimal(
            input.baselineUnitsRetainedDecimal ?? toDecimal(input.baselineUnitsRetained),
        ).plus(input.baselineUnitsEnhancedDecimal ?? toDecimal(input.baselineUnitsEnhanced));
    } else {
        totalHabitatUnits = new Decimal(input.areaDecimal ?? toDecimal(input.area))
            .mul(distinctivenessScore)
            .mul(conditionScore)
            .mul(strategicSignificanceMultiplier);
    }

    return {
        totalHabitatUnits: toDecimal(totalHabitatUnits).toNumber(),
        totalHabitatUnitsDecimal: toDecimal(totalHabitatUnits),
    };
}

/**
 * Pure calculation: derives habitatUnitsDelivered for habitat creation and (when
 * spatialRiskMultiplier is supplied) habitatUnitsDeliveredWithSpatialRisk.
 */
export function calculateHabitatUnitsDelivered(input: {
    area: Quantity;
    areaDecimal?: Decimal;
    distinctivenessScore: Quantity;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity | undefined;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: Quantity;
    strategicSignificanceMultiplierDecimal?: Decimal;
    finalTimeToTargetMultiplier: Quantity | undefined;
    finalTimeToTargetMultiplierDecimal?: Decimal;
    difficultyMultiplierApplied: Quantity;
    difficultyMultiplierAppliedDecimal?: Decimal;
    spatialRiskMultiplier?: Quantity;
    spatialRiskMultiplierDecimal?: Decimal;
}) {
    const habitatUnitsDelivered = new Decimal(input.areaDecimal ?? toDecimal(input.area))
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(conditionScoreDecimal(input.conditionScore, input.conditionScoreDecimal))
        .mul(input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier))
        .mul(
            input.finalTimeToTargetMultiplierDecimal ??
                (input.finalTimeToTargetMultiplier === undefined
                    ? undefined
                    : toDecimal(input.finalTimeToTargetMultiplier)) ??
                0,
        )
        .mul(input.difficultyMultiplierAppliedDecimal ?? toDecimal(input.difficultyMultiplierApplied));

    const habitatUnitsDeliveredWithSpatialRisk = new Decimal(habitatUnitsDelivered).mul(
        input.spatialRiskMultiplierDecimal ??
            (input.spatialRiskMultiplier === undefined
                ? undefined
                : toDecimal(input.spatialRiskMultiplier)) ??
            1,
    );

    return {
        habitatUnitsDelivered: habitatUnitsDelivered.toNumber(),
        habitatUnitsDeliveredDecimal: habitatUnitsDelivered,
        habitatUnitsDeliveredWithSpatialRisk: habitatUnitsDeliveredWithSpatialRisk.toNumber(),
        habitatUnitsDeliveredWithSpatialRiskDecimal: habitatUnitsDeliveredWithSpatialRisk,
    };
}

/**
 * Pure calculation: derives habitatUnitsDelivered for an enhancement and (when
 * spatialRiskMultiplier is supplied) habitatUnitsDeliveredWithSpatialRisk.
 */
export function calculateEnhancementUnitsDelivered(input: {
    area: Quantity;
    areaDecimal?: Decimal;
    baselineDistinctivenessScore: Quantity;
    baselineDistinctivenessScoreDecimal?: Decimal;
    baselineConditionScore: Quantity | undefined;
    baselineConditionScoreDecimal?: Decimal;
    distinctivenessScore: Quantity;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity | undefined;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: Quantity;
    strategicSignificanceMultiplierDecimal?: Decimal;
    finalTimeToTargetMultiplier: Quantity | undefined;
    finalTimeToTargetMultiplierDecimal?: Decimal;
    difficultyMultiplierApplied: Quantity;
    difficultyMultiplierAppliedDecimal?: Decimal;
    spatialRiskMultiplier?: Quantity;
    spatialRiskMultiplierDecimal?: Decimal;
}) {
    const area = input.areaDecimal ?? toDecimal(input.area);
    const baselineD =
        input.baselineDistinctivenessScoreDecimal ?? toDecimal(input.baselineDistinctivenessScore);
    const baselineC = conditionScoreDecimal(input.baselineConditionScore, input.baselineConditionScoreDecimal);
    const proposedD = input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore);
    const proposedC = conditionScoreDecimal(input.conditionScore, input.conditionScoreDecimal);
    const strategic =
        input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier);
    const difficulty =
        input.difficultyMultiplierAppliedDecimal ?? toDecimal(input.difficultyMultiplierApplied);
    const temporal =
        input.finalTimeToTargetMultiplierDecimal ??
        (input.finalTimeToTargetMultiplier === undefined
            ? undefined
            : toDecimal(input.finalTimeToTargetMultiplier)) ??
        0;

    const effectiveBaselineC = new Decimal(baselineC).gt(proposedC) ? proposedC : baselineC;
    const proposedUnits = new Decimal(area).mul(proposedD).mul(proposedC);
    const baselineUnits = new Decimal(area).mul(baselineD).mul(effectiveBaselineC);
    const delta = proposedUnits.minus(baselineUnits).mul(difficulty).mul(temporal);
    const baseUnits = delta.plus(baselineUnits).mul(strategic);

    const habitatUnitsDelivered = baseUnits;
    const habitatUnitsDeliveredWithSpatialRisk = baseUnits.mul(
        input.spatialRiskMultiplierDecimal ??
            (input.spatialRiskMultiplier === undefined
                ? undefined
                : toDecimal(input.spatialRiskMultiplier)) ??
            1,
    );

    return {
        habitatUnitsDelivered: habitatUnitsDelivered.toNumber(),
        habitatUnitsDeliveredDecimal: habitatUnitsDelivered,
        habitatUnitsDeliveredWithSpatialRisk: habitatUnitsDeliveredWithSpatialRisk.toNumber(),
        habitatUnitsDeliveredWithSpatialRiskDecimal: habitatUnitsDeliveredWithSpatialRisk,
    };
}

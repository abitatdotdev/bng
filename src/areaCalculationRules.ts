import { Decimal, type Quantity, toDecimal } from './decimal';

export const areaCalculationAvailabilityKey = 'areaCalculationAvailability' as const;

export type AreaBaselineAvailability = {
    areaHabitatLost: boolean;
    unitsLost: boolean;
    totalHabitatUnits: boolean;
    totalHabitatUnitsSRM: boolean;
    vhdhBespokeCompensationUnits: boolean;
    unavailableResults: Partial<Record<string, 'check-data' | 'blank'>>;
    rule?: string;
    message?: string;
    lossReason?: 'alternative-compensation' | 'bespoke-compensation-pending';
    lossMessage?: string;
};

export function isAreaAllocationOverrun(input: {
    area: Quantity;
    areaRetained: Quantity;
    areaEnhanced: Quantity;
    areaDecimal?: Decimal;
    areaRetainedDecimal?: Decimal;
    areaEnhancedDecimal?: Decimal;
}) {
    return new Decimal(input.areaRetainedDecimal ?? toDecimal(input.areaRetained))
        .plus(input.areaEnhancedDecimal ?? toDecimal(input.areaEnhanced))
        .greaterThan(input.areaDecimal ?? toDecimal(input.area));
}

export function areaBaselineAvailability(input: {
    area: Quantity;
    areaRetained: Quantity;
    areaEnhanced: Quantity;
    areaDecimal?: Decimal;
    areaRetainedDecimal?: Decimal;
    areaEnhancedDecimal?: Decimal;
    irreplaceableHabitat: boolean;
    bespokeCompensationAgreed?: string;
    requiredAction?: string;
    offSiteReferenceNumber?: string;
    offSite?: boolean;
}) {
    const overrun = isAreaAllocationOverrun(input);
    const hasLoss = new Decimal(input.areaDecimal ?? toDecimal(input.area))
        .minus(input.areaRetainedDecimal ?? toDecimal(input.areaRetained))
        .minus(input.areaEnhancedDecimal ?? toDecimal(input.areaEnhanced))
        .greaterThan(0);
    const compensationApplies = input.requiredAction === 'Same habitat required – bespoke compensation option ⚠' ||
        input.requiredAction === 'Bespoke compensation likely to be required';
    const compensationBlocksLoss = compensationApplies && (
        input.bespokeCompensationAgreed === 'Yes' || input.bespokeCompensationAgreed === 'Pending'
    );
    const referencePresent = input.offSiteReferenceNumber !== '' && input.offSiteReferenceNumber !== undefined;
    const compensationUnacceptable = input.irreplaceableHabitat && hasLoss &&
        input.bespokeCompensationAgreed !== 'Yes' && input.bespokeCompensationAgreed !== 'Pending';
    const lossReason = !overrun && compensationApplies
        ? input.bespokeCompensationAgreed === 'Yes'
            ? 'alternative-compensation' as const
            : input.bespokeCompensationAgreed === 'Pending'
                ? 'bespoke-compensation-pending' as const
                : undefined
        : undefined;
    const lossMessage = lossReason === 'alternative-compensation'
        ? 'Alternative Compensation ✓'
        : lossReason === 'bespoke-compensation-pending'
            ? input.offSite
                ? 'Bespoke compensation must be agreed  ▲'
                : 'Bespoke compensation must be agreed ▲'
            : undefined;
    const totalAvailable = !(input.offSite && !referencePresent) && !compensationUnacceptable;
    const lossAvailable = !overrun && !(hasLoss && compensationBlocksLoss);
    const creditAvailable = true;

    const unavailableResults: Partial<Record<string, 'check-data' | 'blank'>> = {};
    if (overrun) {
        unavailableResults.areaHabitatLost = 'check-data';
        unavailableResults.unitsLost = 'check-data';
    }
    if (!lossAvailable) unavailableResults.unitsLost = 'check-data';
    if (!totalAvailable) unavailableResults.totalHabitatUnits = 'blank';
    if (!totalAvailable && input.requiredAction === 'Bespoke compensation likely to be required') {
        unavailableResults.totalHabitatUnitsSRM = 'blank';
    }
    if (!creditAvailable || !totalAvailable) unavailableResults.vhdhBespokeCompensationUnits = 'blank';

    return {
        areaHabitatLost: !overrun,
        unitsLost: lossAvailable,
        totalHabitatUnits: totalAvailable,
        totalHabitatUnitsSRM: !(input.offSite && !referencePresent && input.requiredAction === 'Bespoke compensation likely to be required'),
        vhdhBespokeCompensationUnits: creditAvailable && totalAvailable,
        unavailableResults,
        rule: overrun ? 'allocation-overrun' : compensationUnacceptable ? 'irreplaceable-loss-uncompensated' : undefined,
        message: overrun ? 'Error in Areas ▲' : compensationUnacceptable ? 'Any loss unacceptable' : undefined,
        lossReason,
        lossMessage,
    } satisfies AreaBaselineAvailability;
}

export function isAreaReferencePresent(reference: string | undefined) {
    return reference !== '' && reference !== undefined;
}

export function hasAreaEnhancementTimingConflict(advance: number | '30+', delay: number | '30+') {
    return (advance === '30+' || advance > 0) && (delay === '30+' || delay > 0);
}

export function calculateAreaEnhancementMovement(input: {
    requiredAction: string;
    baselineLabel: string;
    proposedLabel: string;
    baselineBroadHabitat: string;
    proposedBroadHabitat: string;
    proposedHabitatType: string;
    baselineDistinctivenessCategory: string;
    proposedDistinctivenessCategory: string;
    baselineDistinctivenessScore: number;
    proposedDistinctivenessScore: number;
    baselineCondition: string;
    proposedCondition: string;
    baselineConditionScore: number;
    proposedConditionScore: number;
    irreplaceableHabitat: boolean;
    offSite: boolean;
}) {
    const sameAction = input.requiredAction;
    const differentHabitat = input.baselineLabel !== input.proposedLabel;
    const sameDistinctiveness = input.baselineDistinctivenessScore === input.proposedDistinctivenessScore;
    const scoreReduced = input.proposedDistinctivenessScore < input.baselineDistinctivenessScore;
    let movementError: string | undefined;
    if (sameAction.startsWith('Same d') && scoreReduced) {
        movementError = 'Error - Trading rules not satisfied ▲';
    } else if (
        sameAction.startsWith('Same b') &&
        input.baselineBroadHabitat.slice(0, 5) !== input.proposedBroadHabitat.slice(0, 5) &&
        scoreReduced
    ) {
        movementError = 'Error - Trading rules not satisfied ▲';
    } else if (sameAction.startsWith('Same h') && differentHabitat) {
        movementError = 'Error - Trading rules not satisfied ▲';
    } else if (
        sameAction.startsWith('Bespok') &&
        differentHabitat &&
        !(input.offSite && input.baselineLabel.slice(0, 27) === 'Woodland and forest - Other')
    ) {
        movementError = 'Error - Trading rules not satisfied ▲';
    } else if (scoreReduced) {
        movementError = 'Error Trading Down ▲';
    } else if (
        input.proposedHabitatType === 'Littoral seagrass' &&
        ![
            'Intertidal sediment - Littoral seagrass',
            'Intertidal sediment - Littoral sand',
        ].includes(input.baselineLabel)
    ) {
        movementError = 'Error - Enhancement not possible ▲';
    } else if (
        input.proposedHabitatType === 'Artificial hard structures with integrated greening of grey infrastructure (IGGI)' &&
        ![
            'Intertidal hard structures - Artificial hard structures with integrated greening of grey infrastructure (IGGI)',
            'Intertidal hard structures - Artificial hard structures',
            'Intertidal hard structures - Artificial features of hard structures',
        ].includes(input.baselineLabel)
    ) {
        movementError = 'Error - Enhancement not possible ▲';
    }

    const distinctivenessChange = movementError ?? `${input.baselineDistinctivenessCategory} - ${input.proposedDistinctivenessCategory}`;
    const specialWoodland = input.offSite && input.baselineLabel.slice(0, 27) === 'Woodland and forest - Other' &&
        input.proposedBroadHabitat.slice(0, 8) === 'Woodland';
    let conditionChange: string;
    if (!specialWoodland && input.irreplaceableHabitat && differentHabitat) {
        conditionChange = 'Error you cannot replace an irreplaceable habitat ▲';
    } else if (
        input.baselineLabel.slice(0, 55) !== input.proposedLabel.slice(0, 55) &&
        distinctivenessChange === 'High - High'
    ) {
        conditionChange = 'Error - Not like for like ▲';
    } else if (sameDistinctiveness && input.baselineConditionScore > input.proposedConditionScore) {
        conditionChange = 'Error - Can not reduce condition ▲';
    } else if (
        !specialWoodland &&
        sameDistinctiveness &&
        input.baselineConditionScore === input.proposedConditionScore
    ) {
        conditionChange = 'Error - No enhancement ▲';
    } else if (input.baselineConditionScore > input.proposedConditionScore) {
        conditionChange = 'Error - condition cannot be reduced ▲';
    } else if (scoreReduced) {
        conditionChange = 'Error Trading Down ▲';
    } else if (differentHabitat && input.baselineDistinctivenessScore < input.proposedDistinctivenessScore) {
        conditionChange = `Lower Distinctiveness Habitat - ${input.proposedCondition}`;
    } else {
        conditionChange = `${input.baselineCondition} - ${input.proposedCondition}`;
    }
    return {
        distinctivenessChange,
        conditionChange,
        enhancementPathway: conditionChange,
        movementAllowed: !movementError,
        conditionAllowed: !conditionChange.startsWith('Error'),
    };
}

export function areaEnhancementAvailability(input: {
    movementAllowed: boolean;
    conditionAllowed: boolean;
    timingAllowed: boolean;
    rawReferencePresent?: boolean;
}) {
    const semanticallyAvailable = input.movementAllowed && input.conditionAllowed && input.timingAllowed;
    return {
        habitatUnitsDelivered: semanticallyAvailable && input.rawReferencePresent !== false,
        habitatUnitsDeliveredWithSpatialRisk: semanticallyAvailable,
    };
}

export function applyAreaEnhancementAvailability<T extends {
    habitatUnitsDelivered: number;
    habitatUnitsDeliveredDecimal: Decimal;
    habitatUnitsDeliveredWithSpatialRisk?: number;
    habitatUnitsDeliveredWithSpatialRiskDecimal?: Decimal;
    areaCalculationAvailability?: Record<string, unknown>;
    offSiteReferenceNumber?: string;
}>(data: T, input: {
    movementAllowed: boolean;
    conditionAllowed: boolean;
    timingAllowed: boolean;
    requiresReference?: boolean;
    preserveSpatialContribution?: boolean;
    rawContributionAllowed?: boolean;
}) {
    const rawReferencePresent = !input.requiresReference || isAreaReferencePresent(data.offSiteReferenceNumber);
    const availability = areaEnhancementAvailability({
        ...input,
        rawReferencePresent,
    });
    if (input.preserveSpatialContribution && data.habitatUnitsDeliveredWithSpatialRisk !== undefined) {
        availability.habitatUnitsDeliveredWithSpatialRisk = input.timingAllowed && input.movementAllowed;
    }
    const unavailableResults: Partial<Record<string, 'check-data' | 'blank'>> = {};
    if (!input.movementAllowed || !input.conditionAllowed || !input.timingAllowed) {
        unavailableResults.habitatUnitsDelivered = 'blank';
        if (data.habitatUnitsDeliveredWithSpatialRisk !== undefined && !input.preserveSpatialContribution) {
            unavailableResults.habitatUnitsDeliveredWithSpatialRisk = 'blank';
        }
    }
    if (!rawReferencePresent || input.rawContributionAllowed === false) unavailableResults.habitatUnitsDelivered = 'blank';
    const rule = !input.movementAllowed
        ? 'invalid-enhancement-movement'
        : input.rawContributionAllowed === false
          ? 'irreplaceable-individual-tree-enhancement'
        : !input.conditionAllowed
          ? 'invalid-enhancement-condition'
          : !input.timingAllowed
            ? 'enhancement-timing-conflict'
            : !rawReferencePresent
              ? 'off-site-reference-required'
              : undefined;
    const message = rule === 'irreplaceable-individual-tree-enhancement'
        ? 'Error - you cannot enhance irreplaceable individual trees ▲'
        : rule === 'off-site-reference-required'
        ? 'Off-site reference required ▲'
        : rule === 'enhancement-timing-conflict'
          ? 'Error -both advance and delayed habitat creation ▲'
          : rule === 'invalid-enhancement-condition'
            ? 'Error - condition cannot be reduced ▲'
            : rule === 'invalid-enhancement-movement'
              ? 'Check Data ⚠'
              : undefined;
    const rawAvailable = availability.habitatUnitsDelivered && input.rawContributionAllowed !== false;
    const spatialAvailable = availability.habitatUnitsDeliveredWithSpatialRisk;
    return {
        ...data,
        ...(rawAvailable ? {} : { habitatUnitsDelivered: 0, habitatUnitsDeliveredDecimal: toDecimal(0) }),
        ...(spatialAvailable || data.habitatUnitsDeliveredWithSpatialRisk === undefined
            ? {}
            : { habitatUnitsDeliveredWithSpatialRisk: 0, habitatUnitsDeliveredWithSpatialRiskDecimal: toDecimal(0) }),
        areaCalculationAvailability: {
            ...data.areaCalculationAvailability,
            ...availability,
            habitatUnitsDelivered: rawAvailable,
            unavailableResults,
            rule,
            message,
        },
    };
}

export function applyAreaRawReferenceAvailability<T extends {
    habitatUnitsDelivered: number;
    habitatUnitsDeliveredDecimal: Decimal;
    offSiteReferenceNumber?: string;
    spatialRiskCategory?: string;
    areaCalculationAvailability?: Record<string, unknown>;
    creationTiming?: {
        rule?: string;
        status?: string;
        message?: string;
        unavailableResults?: Partial<Record<string, 'check-data' | 'blank'>>;
    };
}>(data: T) {
    const missingReference = Boolean(data.spatialRiskCategory) && !isAreaReferencePresent(data.offSiteReferenceNumber);
    const currentAvailability = data.areaCalculationAvailability ?? {};
    const currentUnavailableResults = currentAvailability.unavailableResults as
        | Partial<Record<string, 'check-data' | 'blank'>>
        | undefined;
    const unavailableResults: Partial<Record<string, 'check-data' | 'blank'>> = {
        ...data.creationTiming?.unavailableResults,
        ...currentUnavailableResults,
        ...(missingReference ? { habitatUnitsDelivered: 'blank' as const } : {}),
    };
    const availability = {
        ...data.creationTiming,
        ...currentAvailability,
        habitatUnitsDelivered: !missingReference && unavailableResults.habitatUnitsDelivered !== 'blank',
        habitatUnitsDeliveredWithSpatialRisk: unavailableResults.habitatUnitsDeliveredWithSpatialRisk !== 'blank',
        unavailableResults,
        ...(missingReference ? {
            rule: 'off-site-reference-required',
            message: 'Off-site reference required ▲',
        } : {}),
    };
    if (!missingReference) return { ...data, areaCalculationAvailability: availability };
    return {
        ...data,
        habitatUnitsDelivered: 0,
        habitatUnitsDeliveredDecimal: toDecimal(0),
        areaCalculationAvailability: availability,
    };
}

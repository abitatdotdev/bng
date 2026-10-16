import type { BespokeCompensation } from './bespokeCompensation';
import type { BroadHabitat } from './broadHabitats';
import type { Condition } from './conditions';
import type { DistinctivenessCategory, SuggestedTradingActions } from './distinctivenessCategories';
import type { Habitat, HabitatLabel } from './habitats';
import type { BaselineHabitatType, CreationHabitatType, EnhancedHabitatType } from './habitatTypes';

type Values<T extends object> = T[keyof T];
type ConditionValues<T> = T extends { conditions: infer Conditions }
    ? Conditions extends object
        ? Values<Conditions>
        : never
    : never;

export type HabitatConditionScore<T = Habitat> = T extends unknown ? ConditionValues<T> : never;
export type AreaHabitatType = BaselineHabitatType | CreationHabitatType | EnhancedHabitatType;
export type AreaDistinctivenessScore = Habitat['distinctivenessScore'];

export type AreaBaselineResult =
    | 'areaHabitatLost'
    | 'unitsLost'
    | 'totalHabitatUnits'
    | 'totalHabitatUnitsSRM'
    | 'vhdhBespokeCompensationUnits'
    | 'baselineUnitsRetainedWithSRM';

export type AreaEnhancementResult = 'habitatUnitsDelivered' | 'habitatUnitsDeliveredWithSpatialRisk';
export type AreaCreationResult =
    | 'habitatUnitsDelivered'
    | 'habitatUnitsDeliveredWithSpatialRisk'
    | 'finalTimeToTargetCondition'
    | 'finalTimeToTargetMultiplier';
export type AreaUnavailableResultStatus = 'check-data' | 'blank';
export type AreaBaselineUnavailableResults = Partial<Record<AreaBaselineResult, AreaUnavailableResultStatus>>;
export type AreaEnhancementUnavailableResults = Partial<Record<AreaEnhancementResult, AreaUnavailableResultStatus>>;
export type AreaCreationUnavailableResults = Partial<Record<AreaCreationResult, AreaUnavailableResultStatus>>;

export type AreaBaselineRule = 'allocation-overrun' | 'irreplaceable-loss-uncompensated';
export type AreaEnhancementRule =
    | 'invalid-enhancement-movement'
    | 'irreplaceable-individual-tree-enhancement'
    | 'invalid-enhancement-condition'
    | 'enhancement-timing-conflict'
    | 'off-site-reference-required';
export type AreaCreationRule = 'habitat-creation-timing-conflict' | 'off-site-reference-required';

export type AreaBaselineMessage = 'Error in Areas ▲' | 'Any loss unacceptable';
export type AreaEnhancementMessage =
    | 'Error - you cannot enhance irreplaceable individual trees ▲'
    | 'Off-site reference required ▲'
    | 'Error -both advance and delayed habitat creation ▲'
    | 'Error - condition cannot be reduced ▲'
    | 'Check Data ⚠';
export type AreaCreationMessage = 'Error -both advance and delayed habitat creation ▲' | 'Off-site reference required ▲';
export type AreaCompensationMessage = 'Alternative Compensation ✓' | 'Bespoke compensation must be agreed ▲' | 'Bespoke compensation must be agreed  ▲';

export type AreaBaselineAvailability = {
    areaHabitatLost: boolean;
    unitsLost: boolean;
    totalHabitatUnits: boolean;
    totalHabitatUnitsSRM: boolean;
    vhdhBespokeCompensationUnits: boolean;
    unavailableResults: AreaBaselineUnavailableResults;
    rule?: AreaBaselineRule;
    message?: AreaBaselineMessage;
    lossReason?: 'alternative-compensation' | 'bespoke-compensation-pending';
    lossMessage?: AreaCompensationMessage;
};

export type AreaEnhancementAvailability = {
    habitatUnitsDelivered: boolean;
    habitatUnitsDeliveredWithSpatialRisk: boolean;
    unavailableResults: AreaEnhancementUnavailableResults;
    rule?: AreaEnhancementRule;
    message?: AreaEnhancementMessage;
};

export type AreaCreationAvailability = {
    habitatUnitsDelivered: boolean;
    habitatUnitsDeliveredWithSpatialRisk: boolean;
    unavailableResults: AreaCreationUnavailableResults;
    rule?: AreaCreationRule;
    status?: 'allowed' | 'forbidden';
    message?: AreaCreationMessage;
};

export type AreaEnhancementMovementInput = {
    requiredAction: SuggestedTradingActions;
    baselineLabel: HabitatLabel;
    proposedLabel: HabitatLabel;
    baselineBroadHabitat: BroadHabitat;
    proposedBroadHabitat: BroadHabitat;
    proposedHabitatType: EnhancedHabitatType;
    baselineDistinctivenessCategory: DistinctivenessCategory;
    proposedDistinctivenessCategory: DistinctivenessCategory;
    baselineDistinctivenessScore: AreaDistinctivenessScore;
    proposedDistinctivenessScore: AreaDistinctivenessScore;
    baselineCondition: Condition;
    proposedCondition: Condition;
    baselineConditionScore: HabitatConditionScore | undefined;
    proposedConditionScore: HabitatConditionScore | undefined;
    irreplaceableHabitat: boolean;
    offSite: boolean;
};

export type AreaEnhancementMovementRow = {
    baseline: {
        requiredAction: SuggestedTradingActions;
        broadHabitat: BroadHabitat;
        condition: Condition;
        conditionScore: HabitatConditionScore | undefined;
        irreplaceableHabitat: boolean;
    };
    _baselineHabitat: Habitat;
    _habitat: Habitat;
    condition: Condition;
    conditionScore: HabitatConditionScore | undefined;
    broadHabitat: BroadHabitat;
    habitatType: EnhancedHabitatType;
    distinctivenessScore: AreaDistinctivenessScore;
};

export type AreaMovementError =
    | 'Error - Trading rules not satisfied ▲'
    | 'Error Trading Down ▲'
    | 'Error - Enhancement not possible ▲';
export type AreaConditionError =
    | 'Error you cannot replace an irreplaceable habitat ▲'
    | 'Error - Not like for like ▲'
    | 'Error - Can not reduce condition ▲'
    | 'Error - No enhancement ▲'
    | 'Error - condition cannot be reduced ▲'
    | 'Error Trading Down ▲';
export type AreaDistinctivenessChange = `${DistinctivenessCategory} - ${DistinctivenessCategory}` | AreaMovementError;
export type AreaConditionChange =
    | `${Condition} - ${Condition}`
    | `Lower Distinctiveness Habitat - ${Condition}`
    | AreaConditionError;

export type AreaEnhancementMovementResult = {
    distinctivenessChange: AreaDistinctivenessChange;
    conditionChange: AreaConditionChange;
    enhancementPathway: AreaConditionChange;
    movementAllowed: boolean;
    conditionAllowed: boolean;
};

export type AreaEnhancementAvailabilityInput = {
    movementAllowed: boolean;
    conditionAllowed: boolean;
    timingAllowed: boolean;
    rawReferencePresent?: boolean;
};

export type AreaEnhancementAvailabilityOptions = AreaEnhancementAvailabilityInput & {
    requiresReference?: boolean;
    preserveSpatialContribution?: boolean;
    rawContributionAllowed?: boolean;
};

export type AreaCreationTimingState = {
    rule: 'habitat-creation-timing-conflict';
    status: 'allowed' | 'forbidden';
    message?: AreaCreationMessage;
    unavailableResults: AreaCreationUnavailableResults;
};

export type AreaBaselineRuleInput = {
    irreplaceableHabitat: boolean;
    bespokeCompensationAgreed?: BespokeCompensation;
    requiredAction?: SuggestedTradingActions;
    offSiteReferenceNumber?: string;
    offSite?: boolean;
};

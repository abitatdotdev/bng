import { Decimal, toDecimal, type Quantity } from '../decimal';
import * as v from 'valibot';

import { broadHabitatSchema } from '../broadHabitats';
import { baselineHabitatType } from '../habitatTypes';
import { conditionSchema } from '../conditions';
import { strategicSignificanceSchema } from '../strategicSignificanceSchema';
import {
    areaSchema,
    enrichWithHabitatData,
    freeTextSchema,
    isValidCondition,
    isValidHabitat,
    isValidIrreplaceable,
    safeTransform,
} from '../schemaUtils';
import { spatialRiskCategorySchema } from '../spatialRisk';
import { bespokeCompensationSchema, type BespokeCompensation } from '../bespokeCompensation';
import { enrichWithSpatialRisk as enrichWithSpatialRiskMultiplier } from './common';
import type { SuggestedTradingActions } from '../distinctivenessCategories';
import {
    calculateBaselineUnits,
    calculateTotalHabitatUnits,
    calculateVhdhBespokeCompensationUnits,
} from '../habitatCalc';
import {
    applyOffSiteBaselineLossAvailability,
    applyOffSiteBaselineSpatialTotalAvailability,
    applyOffSiteBaselineTotalAvailability,
    applyOffSiteCompensationAvailability,
    offSiteAreaBaselineAvailability,
} from './habitatAvailability';
import type { AreaDistinctivenessScore, HabitatConditionScore } from '../areaCalculationTypes';

function toConditionScoreDecimal(score: Quantity | undefined, decimalScore?: Decimal): Decimal {
    if (decimalScore !== undefined) return decimalScore;
    if (score === undefined) throw new Error('Habitat condition score is unavailable');
    return toDecimal(score);
}

const inputSchema = v.object({
    broadHabitat: broadHabitatSchema,
    habitatType: baselineHabitatType,
    irreplaceableHabitat: v.boolean(),
    area: areaSchema,
    condition: conditionSchema,
    strategicSignificance: strategicSignificanceSchema,
    spatialRiskCategory: spatialRiskCategorySchema,
    areaRetained: v.optional(areaSchema, 0),
    areaEnhanced: v.optional(areaSchema, 0),
    bespokeCompensationAgreed: v.optional(bespokeCompensationSchema, 'No'),
    userComments: freeTextSchema,
    planningAuthorityComments: freeTextSchema,
    habitatReferenceNumber: freeTextSchema,
    offSiteReferenceNumber: freeTextSchema,
});

export const offSiteHabitatBaselineSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        area: data.area.toNumber(),
        areaDecimal: data.area,
        areaRetained: data.areaRetained.toNumber(),
        areaRetainedDecimal: data.areaRetained,
        areaEnhanced: data.areaEnhanced.toNumber(),
        areaEnhancedDecimal: data.areaEnhanced,
    })),
    v.forward(
        v.check(
            (s) => isValidHabitat(s.broadHabitat, s.habitatType),
            'The broad habitat and habitat type are incompatible',
        ),
        ['habitatType'],
    ),
    v.forward(
        v.check(
            (s) => isValidIrreplaceable(s.broadHabitat, s.habitatType, s.irreplaceableHabitat),
            'This habitat cannot be irreplaceable',
        ),
        ['irreplaceableHabitat'],
    ),
    v.forward(
        v.check(
            (s) => isValidCondition(s.broadHabitat, s.habitatType, s.condition),
            'The condition for this habitat is invalid',
        ),
        ['condition'],
    ),
    v.transform(enrichWithHabitatData),
    v.transform(enrichWithSpatialRiskMultiplier),
    v.transform(enrichWithBaselineUnitsData),
    // Initial validation checks
    v.forward(
        v.check(
            (s) =>
                !(
                    s.irreplaceableHabitat &&
                    new Decimal(s.areaRetainedDecimal).plus(s.areaEnhancedDecimal).lessThan(s.areaDecimal) &&
                    s.bespokeCompensationAgreed === 'No'
                ),
            'Any loss unacceptable',
        ),
        ['irreplaceableHabitat'],
    ),
    v.forward(
        v.check(
            (s) =>
                !(
                    s.requiredAction === 'Bespoke compensation likely to be required' &&
                    !(new Decimal(s.areaRetainedDecimal).gt(0) || new Decimal(s.areaEnhancedDecimal).gt(0)) &&
                    s.bespokeCompensationAgreed === 'No'
                ),
            'Any loss unacceptable',
        ),
        ['bespokeCompensationAgreed'],
    ),
    v.forward(
        v.check(
            (s) =>
                !(
                    s.broadHabitat === 'Individual trees' &&
                    new Decimal(s.areaEnhancedDecimal).gt(0) &&
                    s.irreplaceableHabitat
                ),
            'Error - you cannot enhance irreplaceable individual trees ▲',
        ),
        ['areaEnhanced'],
    ),
    v.forward(
        v.check(
            (s) => !(s.spatialRiskCategory && !s.offSiteReferenceNumber),
            'Off-site reference required ▲',
        ),
        ['offSiteReferenceNumber'],
    ),
    v.transform(enrichWithTotalHabitatUnits),
    v.transform(enrichWithTotalHabitatUnitsSRM),
    // Checks from within the units lost cell (AA)
    v.forward(
        v.check(
            (s) =>
                new Decimal(s.areaDecimal)
                    .minus(s.areaRetainedDecimal)
                    .minus(s.areaEnhancedDecimal)
                    .greaterThanOrEqualTo(0),
            'Error in Areas ▲',
        ),
        ['area'],
    ),
    v.transform(enrichWithUnitsLost),
    v.transform(enrichWithVhdhBespokeCompensationUnits),
    v.transform(enrichWithBaselineUnitsRetainedSRM),
);
export type OffSiteHabitatBaselineSchema = v.InferInput<typeof offSiteHabitatBaselineSchema>;
export type OffSiteHabitatBaseline = v.InferOutput<typeof offSiteHabitatBaselineSchema>;

export const offSiteHabitatBaselineUncheckedSchema = v.pipe(
    inputSchema,
    v.transform((data) => ({
        ...data,
        area: data.area.toNumber(),
        areaDecimal: data.area,
        areaRetained: data.areaRetained.toNumber(),
        areaRetainedDecimal: data.areaRetained,
        areaEnhanced: data.areaEnhanced.toNumber(),
        areaEnhancedDecimal: data.areaEnhanced,
    })),
    safeTransform(enrichWithHabitatData),
    safeTransform(enrichWithSpatialRiskMultiplier),
    safeTransform(enrichWithBaselineUnitsData),
    safeTransform(enrichWithTotalHabitatUnits),
    safeTransform(enrichWithTotalHabitatUnitsSRM),
    safeTransform(enrichWithUnitsLost),
    safeTransform(enrichWithVhdhBespokeCompensationUnits),
    safeTransform(enrichWithBaselineUnitsRetainedSRM),
);

export function enrichWithBaselineUnitsData<
    Data extends {
        irreplaceableHabitat: boolean;
        area: number;
        areaDecimal: Decimal;
        areaRetained: number;
        areaRetainedDecimal: Decimal;
        areaEnhanced: number;
        areaEnhancedDecimal: Decimal;
        distinctivenessScore: AreaDistinctivenessScore;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: HabitatConditionScore | undefined;
        conditionScoreDecimal: Decimal | undefined;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        broadHabitat: string;
        requiredAction?: SuggestedTradingActions;
        bespokeCompensationAgreed?: BespokeCompensation;
        offSiteReferenceNumber?: string;
    },
>(data: Data) {
    return {
        ...data,
        ...calculateBaselineUnits(data),
        areaCalculationAvailability: offSiteAreaBaselineAvailability(data),
    };
}

/**
 * Pure calculation: derives totalHabitatUnitsSRM.
 */
export function calculateTotalHabitatUnitsSRM(input: {
    requiredAction: string;
    area: number;
    areaDecimal?: Decimal;
    areaRetained: number;
    areaRetainedDecimal?: Decimal;
    areaEnhanced: number;
    areaEnhancedDecimal?: Decimal;
    baselineUnitsRetained: number;
    baselineUnitsRetainedDecimal?: Decimal;
    baselineUnitsEnhanced: number;
    baselineUnitsEnhancedDecimal?: Decimal;
    distinctivenessScore: number;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity | undefined;
    conditionScoreDecimal?: Decimal;
    strategicSignificanceMultiplier: number;
    strategicSignificanceMultiplierDecimal?: Decimal;
    totalHabitatUnits?: number;
    totalHabitatUnitsDecimal?: Decimal;
    spatialRiskMultiplier: number;
    spatialRiskMultiplierDecimal?: Decimal;
}) {
    const bespokeRequired = input.requiredAction === 'Bespoke compensation likely to be required';
    const hasRetention = new Decimal(input.areaRetainedDecimal ?? toDecimal(input.areaRetained)).gt(0);
    const hasEnhancement = new Decimal(input.areaEnhancedDecimal ?? toDecimal(input.areaEnhanced)).gt(0);
    const hasBiodiversityGain = hasRetention || hasEnhancement;

    let totalHabitatUnitsSRM: number | Decimal = 0;

    if (bespokeRequired && !hasBiodiversityGain) {
        totalHabitatUnitsSRM = new Decimal(
            input.totalHabitatUnitsDecimal ?? toDecimal(input.totalHabitatUnits ?? 0),
        ).mul(input.spatialRiskMultiplierDecimal ?? toDecimal(input.spatialRiskMultiplier));
    } else if (bespokeRequired && hasBiodiversityGain) {
        totalHabitatUnitsSRM = new Decimal(
            input.baselineUnitsRetainedDecimal ?? toDecimal(input.baselineUnitsRetained),
        )
            .plus(input.baselineUnitsEnhancedDecimal ?? toDecimal(input.baselineUnitsEnhanced))
            .mul(input.spatialRiskMultiplierDecimal ?? toDecimal(input.spatialRiskMultiplier));
    } else {
        totalHabitatUnitsSRM = new Decimal(input.areaDecimal ?? toDecimal(input.area))
            .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
            .mul(toConditionScoreDecimal(input.conditionScore, input.conditionScoreDecimal))
            .mul(
                input.strategicSignificanceMultiplierDecimal ??
                    toDecimal(input.strategicSignificanceMultiplier),
            )
            .mul(input.spatialRiskMultiplierDecimal ?? toDecimal(input.spatialRiskMultiplier));
    }

    return {
        totalHabitatUnitsSRM: totalHabitatUnitsSRM.toNumber(),
        totalHabitatUnitsSRMDecimal: totalHabitatUnitsSRM,
    };
}

export function enrichWithTotalHabitatUnitsSRM<
    Data extends {
        requiredAction: SuggestedTradingActions;
        area: number;
        areaDecimal: Decimal;
        areaRetained: number;
        areaRetainedDecimal: Decimal;
        areaEnhanced: number;
        areaEnhancedDecimal: Decimal;
        baselineUnitsRetained: number;
        baselineUnitsRetainedDecimal: Decimal;
        baselineUnitsEnhanced: number;
        baselineUnitsEnhancedDecimal: Decimal;
        distinctivenessScore: AreaDistinctivenessScore;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: HabitatConditionScore | undefined;
        conditionScoreDecimal: Decimal | undefined;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        spatialRiskMultiplier: number;
        spatialRiskMultiplierDecimal: Decimal;
        totalHabitatUnits: number;
        totalHabitatUnitsDecimal: Decimal;
        areaCalculationAvailability?: ReturnType<typeof offSiteAreaBaselineAvailability>;
    },
>(data: Data) {
    return applyOffSiteBaselineSpatialTotalAvailability({ ...data, ...calculateTotalHabitatUnitsSRM(data) });
}

export function enrichWithTotalHabitatUnits<
    Data extends {
        irreplaceableHabitat: boolean;
        area: number;
        areaDecimal: Decimal;
        areaRetained: number;
        areaRetainedDecimal: Decimal;
        areaEnhanced: number;
        areaEnhancedDecimal: Decimal;
        bespokeCompensationAgreed: BespokeCompensation;
        baselineUnitsRetained: number;
        baselineUnitsRetainedDecimal: Decimal;
        baselineUnitsEnhanced: number;
        baselineUnitsEnhancedDecimal: Decimal;
        distinctivenessScore: AreaDistinctivenessScore;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: HabitatConditionScore | undefined;
        conditionScoreDecimal: Decimal | undefined;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        requiredAction: SuggestedTradingActions;
        areaHabitatLost: number;
        areaHabitatLostDecimal: Decimal;
        areaCalculationAvailability?: ReturnType<typeof offSiteAreaBaselineAvailability>;
    },
>(data: Data) {
    return applyOffSiteBaselineTotalAvailability({ ...data, ...calculateTotalHabitatUnits(data) });
}

/**
 * Pure calculation: derives unitsLost.
 */
export function calculateUnitsLost(input: {
    areaHabitatLost: number;
    areaHabitatLostDecimal?: Decimal;
    totalHabitatUnits: number;
    totalHabitatUnitsDecimal?: Decimal;
    baselineUnitsRetained: number;
    baselineUnitsRetainedDecimal?: Decimal;
    baselineUnitsEnhanced: number;
    baselineUnitsEnhancedDecimal?: Decimal;
    bespokeCompensationAgreed: string;
    requiredAction: string;
}) {
    let unitsLost: number | Decimal = 0;

    if (new Decimal(input.areaHabitatLostDecimal ?? toDecimal(input.areaHabitatLost)).isZero()) {
        unitsLost = 0;
    } else if (
        (input.requiredAction === 'Same habitat required – bespoke compensation option ⚠' ||
            input.requiredAction === 'Bespoke compensation likely to be required') &&
        (input.bespokeCompensationAgreed === 'Yes' || input.bespokeCompensationAgreed === 'Pending')
    ) {
        unitsLost = 0;
    } else {
        unitsLost = new Decimal(input.totalHabitatUnitsDecimal ?? toDecimal(input.totalHabitatUnits))
            .minus(input.baselineUnitsRetainedDecimal ?? toDecimal(input.baselineUnitsRetained))
            .minus(input.baselineUnitsEnhancedDecimal ?? toDecimal(input.baselineUnitsEnhanced));
    }

    return { unitsLost: toDecimal(unitsLost).toNumber(), unitsLostDecimal: toDecimal(unitsLost) };
}

export function enrichWithUnitsLost<
    Data extends {
        areaHabitatLost: number;
        areaHabitatLostDecimal: Decimal;
        totalHabitatUnits: number;
        totalHabitatUnitsDecimal: Decimal;
        baselineUnitsRetained: number;
        baselineUnitsRetainedDecimal: Decimal;
        baselineUnitsEnhanced: number;
        baselineUnitsEnhancedDecimal: Decimal;
        bespokeCompensationAgreed: string;
        requiredAction: string;
        areaCalculationAvailability?: ReturnType<typeof offSiteAreaBaselineAvailability>;
    },
>(data: Data) {
    return applyOffSiteBaselineLossAvailability({ ...data, ...calculateUnitsLost(data) });
}

export function enrichWithVhdhBespokeCompensationUnits<
    Data extends {
        bespokeCompensationAgreed: BespokeCompensation;
        requiredAction: SuggestedTradingActions;
        totalHabitatUnits: number;
        totalHabitatUnitsDecimal: Decimal;
        baselineUnitsRetained: number;
        baselineUnitsRetainedDecimal: Decimal;
        baselineUnitsEnhanced: number;
        baselineUnitsEnhancedDecimal: Decimal;
        areaCalculationAvailability?: ReturnType<typeof offSiteAreaBaselineAvailability>;
    },
>(data: Data) {
    return applyOffSiteCompensationAvailability({ ...data, ...calculateVhdhBespokeCompensationUnits(data) });
}

/**
 * Pure calculation of hidden cell AY, used later in headline SRM results.
 */
export function calculateBaselineUnitsRetainedSRM(input: {
    irreplaceableHabitat: boolean;
    areaRetained: number;
    areaRetainedDecimal?: Decimal;
    distinctivenessScore: number;
    distinctivenessScoreDecimal?: Decimal;
    conditionScore: Quantity | undefined;
    conditionScoreDecimal?: Decimal;
    vhdhBespokeCompensationUnits: number;
    vhdhBespokeCompensationUnitsDecimal?: Decimal;
    strategicSignificanceMultiplier: number;
    strategicSignificanceMultiplierDecimal?: Decimal;
    spatialRiskMultiplier: number;
    spatialRiskMultiplierDecimal?: Decimal;
}) {
    if (input.irreplaceableHabitat)
        return { baselineUnitsRetainedWithSRM: 0, baselineUnitsRetainedWithSRMDecimal: toDecimal(0) };

    const baselineUnitsRetainedWithSRM = new Decimal(
        input.areaRetainedDecimal ?? toDecimal(input.areaRetained),
    )
        .mul(input.distinctivenessScoreDecimal ?? toDecimal(input.distinctivenessScore))
        .mul(toConditionScoreDecimal(input.conditionScore, input.conditionScoreDecimal))
        .mul(input.strategicSignificanceMultiplierDecimal ?? toDecimal(input.strategicSignificanceMultiplier))
        .mul(input.spatialRiskMultiplierDecimal ?? toDecimal(input.spatialRiskMultiplier))
        .plus(
            new Decimal(
                input.vhdhBespokeCompensationUnitsDecimal ?? toDecimal(input.vhdhBespokeCompensationUnits),
            ).mul(input.spatialRiskMultiplierDecimal ?? toDecimal(input.spatialRiskMultiplier)),
        );

    return {
        baselineUnitsRetainedWithSRM: baselineUnitsRetainedWithSRM.toNumber(),
        baselineUnitsRetainedWithSRMDecimal: baselineUnitsRetainedWithSRM,
    };
}

export function enrichWithBaselineUnitsRetainedSRM<
    Data extends {
        irreplaceableHabitat: boolean;
        areaRetained: number;
        areaRetainedDecimal: Decimal;
        distinctivenessScore: AreaDistinctivenessScore;
        distinctivenessScoreDecimal: Decimal;
        conditionScore: HabitatConditionScore | undefined;
        conditionScoreDecimal: Decimal | undefined;
        vhdhBespokeCompensationUnits: number;
        vhdhBespokeCompensationUnitsDecimal: Decimal;
        strategicSignificanceMultiplier: number;
        strategicSignificanceMultiplierDecimal: Decimal;
        spatialRiskMultiplier: number;
        spatialRiskMultiplierDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateBaselineUnitsRetainedSRM(data) };
}

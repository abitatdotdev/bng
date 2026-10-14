import { Decimal, type Quantity, toDecimal } from './decimal';
import type { AllFeatures } from './features';
import { type HeadlineResults } from './headlineResults';
import { type HabitatLabel } from './habitats';
import { valuesByHabitat } from './groupings/habitats';
import { cumulativeBroadHabitatChangeDecimal } from './tradingSummaries/habitats';
import { type TradingSummaries } from './tradingSummaries';
import type { BroadHabitat } from './broadHabitats';

const ZERO = new Decimal(0);

function sumMatchingD(values: (number | Decimal)[], matches: (value: Decimal) => boolean): Decimal {
    return values.reduce((sum: Decimal, value) => {
        const decimal = new Decimal(value);
        return matches(decimal) ? sum.plus(decimal) : sum;
    }, ZERO);
}

/**
 * Checks if there are very high distinctiveness losses
 * Corresponds to the guard clause: IF(OR('Trading Summary Area Habitats'!$K$13<0, 'Trading Summary WaterC''s'!$I$13<0)
 * Note: Hedgerows are deliberately excluded from this check
 */
function hasVeryHighLosses(tradingSummaries: TradingSummaries): boolean {
    // Returns true if EITHER habitat or watercourse very high tier is NOT satisfied (has net losses)
    return !tradingSummaries.habitats.vHighSatisfied || !tradingSummaries.watercourses.vHighSatisfied;
}

/**
 * Calculates feature-specific shortfall (for hedgerows and watercourses)
 * Corresponds to cells F14 and F15 logic in the Unit Shortfall sheet
 *
 * Original formula (hedgerow example, but same for watercourses):
 * IF((G147*-1)<G4, G4, IF(G4<=0, (G147*-1), IF(G4>=F4-E4, (G147*-1), (G147*-1)+G4)))
 *
 * Formula pattern:
 * hedgerowFinalLosses = G147
 * deficit = G4
 * requiredGap = F4-E4
 * IF(
 *     -hedgerowFinalLosses < deficit,
 *     deficit,
 *     IF(
 *         deficit<=0,
 *         -hedgerowFinalLosses,
 *         IF(
 *             deficit >= requiredGap,
 *             -hedgerowFinalLosses,
 *             -hedgerowFinalLosses + deficit
 *         )
 *     )
 * )
 */
export function featureShortfallDecimal(
    finalLosses: Quantity,
    deficit: Quantity,
    requiredGap: Quantity,
): Decimal {
    return featureShortfallD(new Decimal(finalLosses), new Decimal(deficit), new Decimal(requiredGap));
}

export function featureShortfall(finalLosses: Quantity, deficit: Quantity, requiredGap: Quantity): number {
    return featureShortfallDecimal(finalLosses, deficit, requiredGap).toNumber();
}

function featureShortfallD(finalLosses: Decimal, deficit: Decimal, requiredGap: Decimal): Decimal {
    // NOTE: weird formulas are there to match the original excel style
    if (finalLosses.neg().lt(deficit)) {
        return deficit;
    }

    if (deficit.lte(ZERO)) {
        return finalLosses.neg();
    }

    if (deficit.gte(requiredGap)) {
        return finalLosses.neg();
    }

    return finalLosses.neg().plus(deficit);
}

/**
 * Calculates A1 tier balancing shortfall (the most complex tier)
 * Corresponds to cell F9 logic in the Unit Shortfall sheet
 *
 * A1 is the "balancing tier" that absorbs whatever shortfall remains
 * after higher tiers (A5-A2) have been accounted for
 *
 * Original formula:
 * =IFERROR(IF(OR('Trading Summary Area Habitats'!$K$13<0,'Trading Summary WaterC''s'!$I$13<0),"ERROR", IF((F13+F12+F11+F10+((H65+M122+G138)*-1))>=G3, ((H65+M122+G138)*-1), IF((F13+F12+F11+F10+((H65+M122+G138)*-1))>=(G3-(F3-E3)), (((H65+M122+G138)*-1)+(G3-(F13+F12+F11+F10+((H65+M122+G138)*-1)))), IF(G3<=0,((H65+M122+G138)*-1), IF((F13+F12+F11+F10+((H65+M122+G138)*-1))<G3,(G3-(F10+F11+F12+F13)), IF(G3>=F3-E3, ((H65+M122+G138)*-1)+(F3-E3), ((H65+M122+G138)*-1)+G3)))))),"Error")
 *
 * Cleaned formula:
 *
 * IF(
 *   OR(
 *     'Trading Summary Area Habitats'!$K$13<0,
 *     'Trading Summary WaterC''s'!$I$13<0
 *   ),
 *   "ERROR",
 *   IF(
 *     (
 *       F13+F12+F11+F10
 *       +((H65+M122+G138)*-1)
 *       >=G3
 *     ),
 *     (H65+M122+G138)*-1,
 *     IF(
 *       (
 *         F13+F12+F11+F10
 *         +((H65+M122+G138)*-1)
 *         >=G3-(F3-E3)
 *       ),
 *       (
 *         ((H65+M122+G138)*-1)
 *         +(
 *           G3
 *           -(
 *             F13+F12+F11+F10
 *             +(
 *               (H65+M122+G138)*-1
 *              )
 *            )
 *          )
 *        ),
 *        IF(
 *          G3<=0,
 *          ((H65+M122+G138)*-1),
 *          IF(
 *            (
 *              F13+F12+F11+F10
 *              +((H65+M122+G138)*-1)
 *            )<G3,
 *            (G3-(F10+F11+F12+F13)),
 *            IF(
 *              G3>=F3-E3,
 *              ((H65+M122+G138)*-1)+(F3-E3),
 *              ((H65+M122+G138)*-1)+G3
 *            )
 *          )
 *        )
 *      )
 *   )
 * )
 *
 * Annotated formula:
 *
 * a2ToA5Shortfalls = F13+F12+F11+F10
 * allA1Losses = H65+M122+G138
 * habitatUnitDeficit = G3
 * unitGap = (F3 - E3)
 * IF(
 *     a2ToA5Shortfalls - allA1Losses >= habitatUnitDeficit,
 *     -allA1Losses,
 *     IF(
 *         a2ToA5Shortfalls - allA1Losses >= habitatUnitDeficit - unitGap
 *         (
 *             -allA1Losses
 *             + habitatUnitDeficit
 *             - a2ToA5Shortfalls
 *             + allA1Losses
 *         ),
 *         IF(
 *             habitatUnitDeficit<=0,
 *             -allA1Losses,
 *             IF(
 *                 a2ToA5Shortfalls - allA1Losses < habitatUnitDeficit,
 *                 (habitatUnitDeficit - a2ToA5Shortfalls),
 *                 IF(
 *                     habitatUnitDeficit >= unitGap,
 *                     -allA1Losses + unitGap,
 *                     -allA1Losses + habitatUnitDeficit
 *                 )
 *             )
 *         )
 *     )
 * )
 */
export function a1BalancingShortfallDecimal(
    headline: HeadlineResults,
    shortfalls: { a2: Quantity; a3: Quantity; a4: Quantity; a5: Quantity },
    details: ReturnType<typeof buildTierDetail>,
): Decimal {
    return a1BalancingShortfallD(
        headline,
        {
            a2: new Decimal(toDecimal(shortfalls.a2)),
            a3: new Decimal(toDecimal(shortfalls.a3)),
            a4: new Decimal(toDecimal(shortfalls.a4)),
            a5: new Decimal(toDecimal(shortfalls.a5)),
        },
        details,
    );
}

export function a1BalancingShortfall(
    headline: HeadlineResults,
    shortfalls: { a2: Quantity; a3: Quantity; a4: Quantity; a5: Quantity },
    details: ReturnType<typeof buildTierDetail>,
): number {
    return a1BalancingShortfallDecimal(headline, shortfalls, details).toNumber();
}

/** Decimal implementation; the exported function preserves the number API. */
function a1BalancingShortfallD(
    headline: HeadlineResults,
    shortfalls: { a2: Decimal; a3: Decimal; a4: Decimal; a5: Decimal },
    details: ReturnType<typeof buildTierDetail>,
): Decimal {
    const a2ToA5Shortfalls = shortfalls.a2.plus(shortfalls.a3).plus(shortfalls.a4).plus(shortfalls.a5);
    const allA1Losses = new Decimal(details.high.a1.lossesInTierDecimal)
        .plus(details.medium.a1.finalLossesDecimal)
        .plus(details.low.a1.finalLossesDecimal);
    const habitatUnitDeficit = new Decimal(headline.habitatUnitSummary.unitDeficitDecimal);
    const unitGap = new Decimal(headline.habitatUnitSummary.requiredUnitsDecimal).minus(
        headline.habitatUnitSummary.baselineUnitsDecimal,
    );

    // NOTE: the following formulas are a bit weird,
    // but they match the excel formulas as closely as possible.
    const a2ToA5MinusA1 = a2ToA5Shortfalls.minus(allA1Losses);

    if (a2ToA5MinusA1.gte(habitatUnitDeficit)) {
        return allA1Losses.neg();
    }

    if (a2ToA5MinusA1.gte(habitatUnitDeficit.minus(unitGap))) {
        // -allA1Losses + habitatUnitDeficit - a2ToA5Shortfalls + allA1Losses
        // simplifies to: habitatUnitDeficit - a2ToA5Shortfalls
        return habitatUnitDeficit.minus(a2ToA5Shortfalls);
    }

    if (habitatUnitDeficit.lte(ZERO)) {
        return allA1Losses.neg();
    }

    if (a2ToA5MinusA1.lt(habitatUnitDeficit)) {
        return habitatUnitDeficit.minus(a2ToA5Shortfalls);
    }

    if (habitatUnitDeficit.gte(unitGap)) {
        return allA1Losses.neg().plus(unitGap);
    }

    return allA1Losses.neg().plus(habitatUnitDeficit);
}

/**
 * Calculates habitat tier shortfall with A1 balancing logic
 * Corresponds to rows 9-13 (F9-F13) in the Unit Shortfall sheet
 */
function habitatTierShortfall(headlineResults: HeadlineResults, details: ReturnType<typeof buildTierDetail>) {
    const a5 = new Decimal(details.high.a5.lossesInTierDecimal).neg();
    const a4 = new Decimal(details.high.a4.lossesInTierDecimal)
        .plus(details.medium.a4.finalLossesDecimal)
        .neg();
    const a3 = new Decimal(details.high.a3.lossesInTierDecimal).neg();
    const a2 = new Decimal(details.high.a2.lossesInTierDecimal)
        .plus(details.medium.a2.finalLossesDecimal)
        .neg();

    const shortfalls = { a2, a3, a4, a5 };

    const a1 = a1BalancingShortfallD(headlineResults, shortfalls, details);

    return {
        a1: a1.toNumber(),
        a1Decimal: a1,
        a2: a2.toNumber(),
        a2Decimal: a2,
        a3: a3.toNumber(),
        a3Decimal: a3,
        a4: a4.toNumber(),
        a4Decimal: a4,
        a5: a5.toNumber(),
        a5Decimal: a5,
    };
}

function highTierDetail(features: AllFeatures, habitats: HabitatLabel[]) {
    const byHabitat = valuesByHabitat(features);
    const unitChange = habitats.map(
        (label) => byHabitat[label as HabitatLabel].unitChangeIncludingOffSiteDecimal,
    );
    const lossesInTier = sumMatchingD(unitChange, (value) => value.lt(ZERO));
    return {
        unitChange: unitChange.map((value) => value.toNumber()),
        unitChangeDecimal: unitChange,
        lossesInTier: lossesInTier.toNumber(),
        lossesInTierDecimal: lossesInTier,
    };
}

function mediumTierDetail(features: AllFeatures) {
    const byHabitat = valuesByHabitat(features);
    const cumulativeChanges = cumulativeBroadHabitatChangeDecimal(features, 'Medium');

    // calculate broad habitat and unit gain available
    const a1HabitatGroups: [BroadHabitat, Decimal][] = [
        ['Cropland', ZERO],
        [
            'Grassland',
            (
                [
                    // first set of labels G76:G80
                    'Grassland - Traditional orchards',
                    'Grassland - Floodplain wetland mosaic and CFGM',
                    'Grassland - Lowland calcareous grassland',
                    'Grassland - Tall herb communities (H6430)',
                    'Grassland - Upland calcareous grassland',
                    // second set of labels 'Trading Summary Area Habitats'!F13:F15
                    'Grassland - Lowland dry acid grassland',
                    'Grassland - Lowland meadows',
                    'Grassland - Upland hay meadows',
                ] satisfies HabitatLabel[]
            ).reduce((sum: Decimal, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSiteDecimal;
                return new Decimal(value).gt(ZERO) ? sum.plus(value) : sum;
            }, ZERO),
        ],
        [
            'Heathland and shrub',
            (
                [
                    // first set of labels G81:G83
                    'Heathland and shrub - Lowland heathland',
                    'Heathland and shrub - Dunes with sea buckthorn (H2160)',
                    'Heathland and shrub - Upland heathland',
                    // second set of labels 'Trading Summary Area Habitats'!F16
                    'Heathland and shrub - Mountain heaths and willow scrub',
                ] satisfies HabitatLabel[]
            ).reduce((sum: Decimal, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSiteDecimal;
                return new Decimal(value).gt(ZERO) ? sum.plus(value) : sum;
            }, ZERO),
        ],
        [
            'Urban',
            (['Urban - Open mosaic habitats on previously developed land'] satisfies HabitatLabel[]).reduce(
                (sum: Decimal, label) => {
                    const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSiteDecimal;
                    return new Decimal(value).gt(ZERO) ? sum.plus(value) : sum;
                },
                ZERO,
            ),
        ],
        ['Individual trees', ZERO],
    ];
    const a2HabitatGroups: [BroadHabitat, Decimal][] = [
        [
            'Woodland and forest',
            (
                [
                    // first set of labels G97:G104
                    'Woodland and forest - Felled',
                    'Woodland and forest - Lowland beech and yew woodland',
                    'Woodland and forest - Lowland mixed deciduous woodland',
                    'Woodland and forest - Native pine woodlands',
                    'Woodland and forest - Upland birchwoods',
                    'Woodland and forest - Upland mixed ashwoods',
                    'Woodland and forest - Upland oakwood',
                    'Woodland and forest - Wet woodland',
                    // second set of labels 'Trading Summary Area Habitats'!F27
                    'Woodland and forest - Wood-pasture and parkland',
                ] satisfies HabitatLabel[]
            ).reduce((sum: Decimal, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSiteDecimal;
                return new Decimal(value).gt(ZERO) ? sum.plus(value) : sum;
            }, ZERO),
        ],
        [
            'Intertidal sediment',
            (
                [
                    // first set of labels G105:G117
                    'Coastal lagoons - Coastal lagoons',
                    'Rocky shore - High energy littoral rock',
                    'Rocky shore - Moderate energy littoral rock',
                    'Rocky shore - Low energy littoral rock',
                    'Rocky shore - Features of littoral rock',
                    'Intertidal sediment - Littoral mud',
                    'Intertidal sediment - Littoral mixed sediments',
                    'Coastal saltmarsh - Saltmarshes and saline reedbeds',
                    'Intertidal sediment - Littoral biogenic reefs - Mussels',
                    'Intertidal sediment - Littoral biogenic reefs - Sabellaria',
                    'Intertidal sediment - Features of littoral sediment',
                    'Intertidal sediment - Littoral muddy sand',
                    'Intertidal sediment - Littoral seagrass',
                    // second set of labels 'Trading Summary Area Habitats'!F28:F32
                    'Rocky shore - High energy littoral rock - on peat, clay or chalk',
                    'Rocky shore - Moderate energy littoral rock - on peat, clay or chalk',
                    'Rocky shore - Low energy littoral rock - on peat, clay or chalk',
                    'Rocky shore - Features of littoral rock - on peat, clay or chalk',
                    'Intertidal sediment - Littoral seagrass on peat, clay or chalk',
                ] satisfies HabitatLabel[]
            ).reduce((sum: Decimal, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSiteDecimal;
                return new Decimal(value).gt(ZERO) ? sum.plus(value) : sum;
            }, ZERO),
        ],
    ];
    const a4HabitatGroups: [BroadHabitat, Decimal][] = [
        [
            'Lakes',
            (
                [
                    // first set of labels G84:G90
                    'Lakes - High alkalinity lakes',
                    'Lakes - Low alkalinity lakes',
                    'Lakes - Marl lakes',
                    'Lakes - Moderate alkalinity lakes',
                    'Lakes - Peat lakes',
                    'Lakes - Ponds (priority habitat)',
                    'Lakes - Temporary lakes ponds and pools (H3170)',
                    // second set of labels 'Trading Summary Area Habitats'!F17
                    'Lakes - Aquifer fed naturally fluctuating water bodies',
                ] satisfies HabitatLabel[]
            ).reduce((sum: Decimal, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSiteDecimal;
                return new Decimal(value).gt(ZERO) ? sum.plus(value) : sum;
            }, ZERO),
        ],
        [
            'Sparsely vegetated land',
            (
                [
                    // first set of labels G91:94
                    'Sparsely vegetated land - Coastal sand dunes',
                    'Sparsely vegetated land - Coastal vegetated shingle',
                    'Sparsely vegetated land - Inland rock outcrop and scree habitats',
                    'Sparsely vegetated land - Maritime cliff and slopes',
                    // second set of labels 'Trading Summary Area Habitats'!F18:19
                    'Sparsely vegetated land - Calaminarian grasslands',
                    'Sparsely vegetated land - Limestone pavement',
                ] satisfies HabitatLabel[]
            ).reduce((sum: Decimal, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSiteDecimal;
                return new Decimal(value).gt(ZERO) ? sum.plus(value) : sum;
            }, ZERO),
        ],
        [
            'Wetland',
            (
                [
                    // first set of labels G96
                    'Wetland - Reedbeds',
                    // second set of labels 'Trading Summary Area Habitats'!F20:26
                    'Wetland - Blanket bog',
                    'Wetland - Depressions on peat substrates (H7150)',
                    'Wetland - Fens (upland and lowland)',
                    'Wetland - Lowland raised bog',
                    'Wetland - Oceanic valley mire[1] (D2.1)',
                    'Wetland - Purple moor grass and rush pastures',
                    'Wetland - Transition mires and quaking bogs (H7140)',
                ] satisfies HabitatLabel[]
            ).reduce((sum: Decimal, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSiteDecimal;
                return new Decimal(value).gt(ZERO) ? sum.plus(value) : sum;
            }, ZERO),
        ],
    ];

    const a1Rule1 = a1HabitatGroups.map(([broadHabitat, unitGainAvailable]) => {
        const lossesRequiringOffset = cumulativeChanges[broadHabitat]?.lt(0)
            ? cumulativeChanges[broadHabitat]
            : 0;
        return unitGainAvailable.plus(lossesRequiringOffset);
    });
    const a2Rule1 = a2HabitatGroups.map(([broadHabitat, unitGainAvailable]) => {
        const lossesRequiringOffset = cumulativeChanges[broadHabitat]?.lt(0)
            ? cumulativeChanges[broadHabitat]
            : 0;
        return unitGainAvailable.plus(lossesRequiringOffset);
    });
    const a4Rule1 = a4HabitatGroups.map(([broadHabitat, unitGainAvailable]) => {
        const lossesRequiringOffset = cumulativeChanges[broadHabitat]?.lt(0)
            ? cumulativeChanges[broadHabitat]
            : 0;
        return unitGainAvailable.plus(lossesRequiringOffset);
    });
    const rule1Sum = sumMatchingD([a1Rule1, a2Rule1, a4Rule1].flat(), (value) => value.gt(ZERO));

    const a1Rule2 = sumMatchingD(a1Rule1, (value) => value.lt(ZERO));
    const a2Rule2 = sumMatchingD(a2Rule1, (value) => value.lt(ZERO));
    const a4Rule2 = sumMatchingD(a4Rule1, (value) => value.lt(ZERO)).plus(rule1Sum);
    const rule2Sum = sumMatchingD([a1Rule2, a2Rule2, a4Rule2], (value) => value.gt(ZERO));

    const a1Rule3 = sumMatchingD([a1Rule2], (value) => value.lt(ZERO));
    const a2Rule3 = sumMatchingD([a2Rule2], (value) => value.lt(ZERO)).plus(rule2Sum);
    const a4Rule3 = sumMatchingD([a4Rule2], (value) => value.lt(ZERO));
    const rule3Sum = sumMatchingD([a1Rule3, a2Rule3, a4Rule3], (value) => value.gt(ZERO));

    const a1Rule4 = a1Rule3.plus(rule3Sum);
    const a2Rule4 = a2Rule3.lt(ZERO) ? a2Rule3 : ZERO;
    const a4Rule4 = a4Rule3.lt(ZERO) ? a4Rule3 : ZERO;

    const a1FinalLosses = a1Rule4.lt(ZERO) ? a1Rule4 : ZERO;
    const a2FinalLosses = a2Rule4.lt(ZERO) ? a2Rule4 : ZERO;
    const a4FinalLosses = a4Rule4.lt(ZERO) ? a4Rule4 : ZERO;

    return {
        a1: {
            rule1: a1Rule1.map((value) => value).map((value) => value.toNumber()),
            rule1Decimal: a1Rule1.map((value) => value),
            rule2: a1Rule2.toNumber(),
            rule2Decimal: a1Rule2,
            rule3: a1Rule3.toNumber(),
            rule3Decimal: a1Rule3,
            rule4: a1Rule4.toNumber(),
            rule4Decimal: a1Rule4,
            finalLosses: a1FinalLosses.toNumber(),
            finalLossesDecimal: a1FinalLosses,
        },
        a2: {
            rule1: a2Rule1.map((value) => value).map((value) => value.toNumber()),
            rule1Decimal: a2Rule1.map((value) => value),
            rule2: a2Rule2.toNumber(),
            rule2Decimal: a2Rule2,
            rule3: a2Rule3.toNumber(),
            rule3Decimal: a2Rule3,
            rule4: a2Rule4.toNumber(),
            rule4Decimal: a2Rule4,
            finalLosses: a2FinalLosses.toNumber(),
            finalLossesDecimal: a2FinalLosses,
        },
        a4: {
            rule1: a4Rule1.map((value) => value).map((value) => value.toNumber()),
            rule1Decimal: a4Rule1.map((value) => value),
            rule2: a4Rule2.toNumber(),
            rule2Decimal: a4Rule2,
            rule3: a4Rule3.toNumber(),
            rule3Decimal: a4Rule3,
            rule4: a4Rule4.toNumber(),
            rule4Decimal: a4Rule4,
            finalLosses: a4FinalLosses.toNumber(),
            finalLossesDecimal: a4FinalLosses,
        },
    };
}

function lowTierDetail(tradingSummaries: TradingSummaries, mediumTier: ReturnType<typeof mediumTierDetail>) {
    const netUnitChange = tradingSummaries.habitats.details.low.netChangeInUnitsDecimal;
    const unitChangeFollowingOffset = new Decimal(netUnitChange.lt(0) ? netUnitChange : 0).plus(
        tradingSummaries.habitats.details.medium.unitsAvailableToOffsetDownwardsDecimal,
    );
    const unitsRemainingAfterRule5 = unitChangeFollowingOffset.plus(
        sumMatchingD(
            [mediumTier.a1.rule4Decimal, mediumTier.a2.rule4Decimal, mediumTier.a4.rule4Decimal],
            (value) => value.gt(ZERO),
        ),
    );
    const finalLosses = unitsRemainingAfterRule5.lt(ZERO) ? unitsRemainingAfterRule5 : ZERO;

    return {
        a1: {
            netUnitChange: netUnitChange.toNumber(),
            netUnitChangeDecimal: netUnitChange,
            unitChangeFollowingOffset: unitChangeFollowingOffset.toNumber(),
            unitChangeFollowingOffsetDecimal: unitChangeFollowingOffset,
            unitsRemainingAfterRule5: unitsRemainingAfterRule5.toNumber(),
            unitsRemainingAfterRule5Decimal: unitsRemainingAfterRule5,
            finalLosses: finalLosses.toNumber(),
            finalLossesDecimal: finalLosses,
        },
    };
}

function hedgerowDetail(tradingSummaries: TradingSummaries) {
    const finalLosses = [
        tradingSummaries.hedgerows.details.vHigh.remainingLossesDecimal,
        tradingSummaries.hedgerows.details.high.surplusUnitsMinusDeficitDecimal,
        tradingSummaries.hedgerows.details.medium.cumulativeSurplusDecimal,
        tradingSummaries.hedgerows.details.low.cumulativeSurplusDecimal,
        tradingSummaries.hedgerows.details.vLow.cumulativeSurplusDecimal,
    ].reduce((sum, num) => {
        const value = new Decimal(num);
        return value.lt(ZERO) ? sum.plus(value) : sum;
    }, ZERO);

    return {
        finalLosses: finalLosses.toNumber(),
        finalLossesDecimal: finalLosses,
    };
}

function watercourseDetail(tradingSummaries: TradingSummaries) {
    const finalLosses = [
        tradingSummaries.watercourses.details.vHigh.remainingLossesDecimal,
        tradingSummaries.watercourses.details.high.remainingLossesDecimal,
        tradingSummaries.watercourses.details.medium.remainingLossesDecimal,
        tradingSummaries.watercourses.details.low.cumulativeSurplusDecimal,
    ].reduce((sum, num) => {
        const value = new Decimal(num);
        return value.lt(ZERO) ? sum.plus(value) : sum;
    }, ZERO);

    return {
        finalLosses: finalLosses.toNumber(),
        finalLossesDecimal: finalLosses,
    };
}

/**
 * Builds tier detail arrays with individual habitat/hedgerow/watercourse net changes
 * Used for detailed reporting in Section 3 of the Unit Shortfall sheet
 */
function buildTierDetail(features: AllFeatures, tradingSummaries: TradingSummaries) {
    const vh = {
        a5: {
            netGains:
                tradingSummaries.habitats.details.vHigh.unitsAvailableToOffsetDownwardsDecimal.toNumber(),
            netGainsDecimal: tradingSummaries.habitats.details.vHigh.unitsAvailableToOffsetDownwardsDecimal,
            netLosses: tradingSummaries.habitats.details.vHigh.remainingLossesDecimal.toNumber(),
            netLossesDecimal: tradingSummaries.habitats.details.vHigh.remainingLossesDecimal,
        },
    };

    const high = {
        a5: highTierDetail(features, [
            'Lakes - High alkalinity lakes',
            'Lakes - Low alkalinity lakes',
            'Lakes - Marl lakes',
            'Lakes - Moderate alkalinity lakes',
            'Lakes - Peat lakes',
        ]),
        a4: highTierDetail(features, [
            'Grassland - Floodplain wetland mosaic and CFGM',
            'Lakes - Ponds (priority habitat)',
            'Lakes - Temporary lakes ponds and pools (H3170)',
            'Sparsely vegetated land - Coastal sand dunes',
            'Sparsely vegetated land - Coastal vegetated shingle',
            'Sparsely vegetated land - Inland rock outcrop and scree habitats',
            'Sparsely vegetated land - Maritime cliff and slopes',
            'Woodland and forest - Lowland mixed deciduous woodland',
            'Woodland and forest - Native pine woodlands',
            'Woodland and forest - Upland mixed ashwoods',
            'Woodland and forest - Upland oakwood',
            'Coastal lagoons - Coastal lagoons',
            'Rocky shore - High energy littoral rock',
            'Rocky shore - Moderate energy littoral rock',
            'Rocky shore - Low energy littoral rock',
            'Rocky shore - Features of littoral rock',
            'Coastal saltmarsh - Saltmarshes and saline reedbeds',
        ]),
        a3: highTierDetail(features, [
            'Woodland and forest - Felled',
            'Woodland and forest - Lowland beech and yew woodland',
            'Woodland and forest - Upland birchwoods',
            'Woodland and forest - Wet woodland',
            'Intertidal sediment - Littoral mud',
            'Intertidal sediment - Littoral mixed sediments',
            'Intertidal sediment - Littoral biogenic reefs - Mussels',
            'Intertidal sediment - Littoral biogenic reefs - Sabellaria',
            'Intertidal sediment - Features of littoral sediment',
            'Intertidal sediment - Littoral muddy sand',
            'Intertidal sediment - Littoral seagrass',
        ]),
        a2: highTierDetail(features, [
            'Grassland - Lowland calcareous grassland',
            'Grassland - Tall herb communities (H6430)',
            'Grassland - Upland calcareous grassland',
            'Heathland and shrub - Lowland heathland',
            'Heathland and shrub - Dunes with sea buckthorn (H2160)',
            'Heathland and shrub - Upland heathland',
            'Urban - Open mosaic habitats on previously developed land',
        ]),
        a1: highTierDetail(features, ['Grassland - Traditional orchards', 'Wetland - Reedbeds']),
    };

    const medium = mediumTierDetail(features);
    const low = lowTierDetail(tradingSummaries, medium);

    const hedgerows = hedgerowDetail(tradingSummaries);

    const watercourses = watercourseDetail(tradingSummaries);

    return {
        vh,
        high,
        medium,
        low,
        hedgerows,
        watercourses,
    };
}

/**
 * Main unit shortfall calculation function
 * Calculates unit shortfalls by tier with Spatial Risk Multiplier applied
 * Corresponds to the "Unit Shortfall calculations" sheet
 */
export function unitShortfall(
    features: AllFeatures,
    headline: HeadlineResults,
    tradingSummaries: TradingSummaries,
) {
    // Build tier detail (the lower sections of the sheet)
    const tierDetail = buildTierDetail(features, tradingSummaries);

    const veryHighLossesDetected = hasVeryHighLosses(tradingSummaries);

    // Calculate habitat tier shortfalls (A5-A1)
    const habitatShortfalls = habitatTierShortfall(headline, tierDetail);

    const hedgerowShortfall = featureShortfallD(
        new Decimal(tierDetail.hedgerows.finalLossesDecimal),
        new Decimal(headline.hedgerowUnitSummary.unitDeficitDecimal),
        new Decimal(headline.hedgerowUnitSummary.requiredUnitsDecimal).minus(
            headline.hedgerowUnitSummary.baselineUnitsDecimal,
        ),
    );

    const watercourseShortfall = featureShortfallD(
        new Decimal(tierDetail.watercourses.finalLossesDecimal),
        new Decimal(headline.watercourseUnitSummary.unitDeficitDecimal),
        new Decimal(headline.watercourseUnitSummary.requiredUnitsDecimal).minus(
            headline.watercourseUnitSummary.baselineUnitsDecimal,
        ),
    );

    const tierShortfallshabitatsa5ShortfallDecimal = habitatShortfalls.a5Decimal;
    const tierShortfallshabitatsa5SrmShortfallDecimal = new Decimal(habitatShortfalls.a5Decimal).mul(2);
    const tierShortfallshabitatsa4ShortfallDecimal = habitatShortfalls.a4Decimal;
    const tierShortfallshabitatsa4SrmShortfallDecimal = new Decimal(habitatShortfalls.a4Decimal).mul(2);
    const tierShortfallshabitatsa3ShortfallDecimal = habitatShortfalls.a3Decimal;
    const tierShortfallshabitatsa3SrmShortfallDecimal = new Decimal(habitatShortfalls.a3Decimal).mul(2);
    const tierShortfallshabitatsa2ShortfallDecimal = habitatShortfalls.a2Decimal;
    const tierShortfallshabitatsa2SrmShortfallDecimal = new Decimal(habitatShortfalls.a2Decimal).mul(2);
    const tierShortfallshabitatsa1ShortfallDecimal = habitatShortfalls.a1Decimal;
    const tierShortfallshabitatsa1SrmShortfallDecimal = new Decimal(habitatShortfalls.a1Decimal).mul(2);
    const tierShortfallshedgerowsSrmShortfallDecimal = hedgerowShortfall.mul(2);
    const tierShortfallswatercoursesSrmShortfallDecimal = watercourseShortfall.mul(2);
    return {
        hasVeryHighLosses: veryHighLossesDetected,
        tierShortfalls: {
            habitats: {
                a5: {
                    shortfall: tierShortfallshabitatsa5ShortfallDecimal.toNumber(),
                    shortfallDecimal: tierShortfallshabitatsa5ShortfallDecimal,
                    srmShortfall: tierShortfallshabitatsa5SrmShortfallDecimal.toNumber(),
                    srmShortfallDecimal: tierShortfallshabitatsa5SrmShortfallDecimal,
                },
                a4: {
                    shortfall: tierShortfallshabitatsa4ShortfallDecimal.toNumber(),
                    shortfallDecimal: tierShortfallshabitatsa4ShortfallDecimal,
                    srmShortfall: tierShortfallshabitatsa4SrmShortfallDecimal.toNumber(),
                    srmShortfallDecimal: tierShortfallshabitatsa4SrmShortfallDecimal,
                },
                a3: {
                    shortfall: tierShortfallshabitatsa3ShortfallDecimal.toNumber(),
                    shortfallDecimal: tierShortfallshabitatsa3ShortfallDecimal,
                    srmShortfall: tierShortfallshabitatsa3SrmShortfallDecimal.toNumber(),
                    srmShortfallDecimal: tierShortfallshabitatsa3SrmShortfallDecimal,
                },
                a2: {
                    shortfall: tierShortfallshabitatsa2ShortfallDecimal.toNumber(),
                    shortfallDecimal: tierShortfallshabitatsa2ShortfallDecimal,
                    srmShortfall: tierShortfallshabitatsa2SrmShortfallDecimal.toNumber(),
                    srmShortfallDecimal: tierShortfallshabitatsa2SrmShortfallDecimal,
                },
                a1: {
                    shortfall: tierShortfallshabitatsa1ShortfallDecimal.toNumber(),
                    shortfallDecimal: tierShortfallshabitatsa1ShortfallDecimal,
                    srmShortfall: tierShortfallshabitatsa1SrmShortfallDecimal.toNumber(),
                    srmShortfallDecimal: tierShortfallshabitatsa1SrmShortfallDecimal,
                },
            },
            hedgerows: {
                shortfall: hedgerowShortfall.toNumber(),
                shortfallDecimal: hedgerowShortfall,
                srmShortfall: tierShortfallshedgerowsSrmShortfallDecimal.toNumber(),
                srmShortfallDecimal: tierShortfallshedgerowsSrmShortfallDecimal,
            },
            watercourses: {
                shortfall: watercourseShortfall.toNumber(),
                shortfallDecimal: watercourseShortfall,
                srmShortfall: tierShortfallswatercoursesSrmShortfallDecimal.toNumber(),
                srmShortfallDecimal: tierShortfallswatercoursesSrmShortfallDecimal,
            },
        },
        tierDetail,
    };
}

export type UnitShortfallResult = ReturnType<typeof unitShortfall>;

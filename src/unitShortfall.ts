import { Decimal } from './decimal';
import type { AllFeatures } from './features';
import { type HeadlineResults } from './headlineResults';
import { type HabitatLabel } from './habitats';
import { valuesByHabitat } from './groupings/habitats';
import { cumulativeBroadHabitatChange } from './tradingSummaries/habitats';
import { type TradingSummaries } from './tradingSummaries';
import type { BroadHabitat } from './broadHabitats';


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
export function featureShortfall(finalLosses: number, deficit: number, requiredGap: number): number {
    // NOTE: weird formulas are there to match the original excel style
    if (-finalLosses < deficit) {
        return deficit;
    }

    if (deficit <= 0) {
        return -finalLosses;
    }

    if (deficit >= requiredGap) {
        return -finalLosses;
    }

    return new Decimal(-finalLosses).plus(deficit).toNumber();
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
export function a1BalancingShortfall(
    headline: HeadlineResults,
    shortfalls: { a2: number; a3: number; a4: number; a5: number; },
    details: ReturnType<typeof buildTierDetail>
): number {
    const a2ToA5Shortfalls = new Decimal(shortfalls.a2)
        .plus(shortfalls.a3)
        .plus(shortfalls.a4)
        .plus(shortfalls.a5)
        .toNumber();
    const allA1Losses = new Decimal(details.high.a1.lossesInTier)
        .plus(details.medium.a1.finalLosses)
        .plus(details.low.a1.finalLosses)
        .toNumber();
    const habitatUnitDeficit = headline.habitatUnitSummary.unitDeficit;
    const unitGap = new Decimal(headline.habitatUnitSummary.requiredUnits)
        .minus(headline.habitatUnitSummary.baselineUnits)
        .toNumber();

    // NOTE: the following formulas are a bit weird,
    // but they match the excel formulas as closely as possible.
    const a2ToA5MinusA1 = new Decimal(a2ToA5Shortfalls).minus(allA1Losses).toNumber();

    if (a2ToA5MinusA1 >= habitatUnitDeficit) {
        return -allA1Losses;
    }

    if (a2ToA5MinusA1 >= habitatUnitDeficit - unitGap) {
        // -allA1Losses + habitatUnitDeficit - a2ToA5Shortfalls + allA1Losses
        // simplifies to: habitatUnitDeficit - a2ToA5Shortfalls
        return new Decimal(habitatUnitDeficit).minus(a2ToA5Shortfalls).toNumber();
    }

    if (habitatUnitDeficit <= 0) {
        return -allA1Losses;
    }

    if (a2ToA5MinusA1 < habitatUnitDeficit) {
        return new Decimal(habitatUnitDeficit).minus(a2ToA5Shortfalls).toNumber();
    }

    if (habitatUnitDeficit >= unitGap) {
        return new Decimal(-allA1Losses).plus(unitGap).toNumber();
    }

    return new Decimal(-allA1Losses).plus(habitatUnitDeficit).toNumber();
}

/**
 * Calculates habitat tier shortfall with A1 balancing logic
 * Corresponds to rows 9-13 (F9-F13) in the Unit Shortfall sheet
 */
function habitatTierShortfall(
    headlineResults: HeadlineResults,
    details: ReturnType<typeof buildTierDetail>
): { a5: number; a4: number; a3: number; a2: number; a1: number } {
    const a5 = new Decimal(details.high.a5.lossesInTier).neg().toNumber();
    const a4 = new Decimal(details.high.a4.lossesInTier).plus(details.medium.a4.finalLosses).neg().toNumber();
    const a3 = new Decimal(details.high.a3.lossesInTier).neg().toNumber();
    const a2 = new Decimal(details.high.a2.lossesInTier).plus(details.medium.a2.finalLosses).neg().toNumber();

    const shortfalls = { a2, a3, a4, a5 }

    const a1 = a1BalancingShortfall(headlineResults, shortfalls, details);

    return { a1, a2, a3, a4, a5 };
}

function highTierDetail(features: AllFeatures, habitats: HabitatLabel[]) {
    const byHabitat = valuesByHabitat(features);
    const unitChange = habitats.map(label => byHabitat[label as HabitatLabel].unitChangeIncludingOffSite)
    const lossesInTier = unitChange.reduce((sum: number, num: number) => num < 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)
    return {
        unitChange,
        lossesInTier,
    }
}

function mediumTierDetail(features: AllFeatures) {
    const byHabitat = valuesByHabitat(features);
    const cumulativeChanges = cumulativeBroadHabitatChange(features, "Medium");

    // calculate broad habitat and unit gain available
    const a1HabitatGroups: [BroadHabitat, number][] = [
        [
            "Cropland",
            0,
        ],
        [
            "Grassland",
            ([
                // first set of labels G76:G80
                "Grassland - Traditional orchards",
                "Grassland - Floodplain wetland mosaic and CFGM",
                "Grassland - Lowland calcareous grassland",
                "Grassland - Tall herb communities (H6430)",
                "Grassland - Upland calcareous grassland",
                // second set of labels 'Trading Summary Area Habitats'!F13:F15
                "Grassland - Lowland dry acid grassland",
                "Grassland - Lowland meadows",
                "Grassland - Upland hay meadows",
            ] satisfies HabitatLabel[]).reduce((sum, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSite;
                return value > 0 ? new Decimal(sum).plus(value).toNumber() : sum;
            }, 0),
        ],
        [
            "Heathland and shrub",
            ([
                // first set of labels G81:G83
                "Heathland and shrub - Lowland heathland",
                "Heathland and shrub - Dunes with sea buckthorn (H2160)",
                "Heathland and shrub - Upland heathland",
                // second set of labels 'Trading Summary Area Habitats'!F16
                "Heathland and shrub - Mountain heaths and willow scrub"
            ] satisfies HabitatLabel[]).reduce((sum, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSite;
                return value > 0 ? new Decimal(sum).plus(value).toNumber() : sum;
            }, 0),
        ],
        [
            "Urban",
            ([
                "Urban - Open mosaic habitats on previously developed land",
            ] satisfies HabitatLabel[]).reduce((sum, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSite;
                return value > 0 ? new Decimal(sum).plus(value).toNumber() : sum;
            }, 0),
        ],
        ["Individual trees", 0],
    ]
    const a2HabitatGroups: [BroadHabitat, number][] = [
        [
            "Woodland and forest",
            ([
                // first set of labels G97:G104
                "Woodland and forest - Felled",
                "Woodland and forest - Lowland beech and yew woodland",
                "Woodland and forest - Lowland mixed deciduous woodland",
                "Woodland and forest - Native pine woodlands",
                "Woodland and forest - Upland birchwoods",
                "Woodland and forest - Upland mixed ashwoods",
                "Woodland and forest - Upland oakwood",
                "Woodland and forest - Wet woodland",
                // second set of labels 'Trading Summary Area Habitats'!F27
                "Woodland and forest - Wood-pasture and parkland",
            ] satisfies HabitatLabel[]).reduce((sum, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSite;
                return value > 0 ? new Decimal(sum).plus(value).toNumber() : sum;
            }, 0),
        ],
        [
            "Intertidal sediment",
            ([
                // first set of labels G105:G117
                "Coastal lagoons - Coastal lagoons",
                "Rocky shore - High energy littoral rock",
                "Rocky shore - Moderate energy littoral rock",
                "Rocky shore - Low energy littoral rock",
                "Rocky shore - Features of littoral rock",
                "Intertidal sediment - Littoral mud",
                "Intertidal sediment - Littoral mixed sediments",
                "Coastal saltmarsh - Saltmarshes and saline reedbeds",
                "Intertidal sediment - Littoral biogenic reefs - Mussels",
                "Intertidal sediment - Littoral biogenic reefs - Sabellaria",
                "Intertidal sediment - Features of littoral sediment",
                "Intertidal sediment - Littoral muddy sand",
                "Intertidal sediment - Littoral seagrass",
                // second set of labels 'Trading Summary Area Habitats'!F28:F32
                "Rocky shore - High energy littoral rock - on peat, clay or chalk",
                "Rocky shore - Moderate energy littoral rock - on peat, clay or chalk",
                "Rocky shore - Low energy littoral rock - on peat, clay or chalk",
                "Rocky shore - Features of littoral rock - on peat, clay or chalk",
                "Intertidal sediment - Littoral seagrass on peat, clay or chalk",
            ] satisfies HabitatLabel[]).reduce((sum, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSite;
                return value > 0 ? new Decimal(sum).plus(value).toNumber() : sum;
            }, 0),
        ],
    ]
    const a4HabitatGroups: [BroadHabitat, number][] = [
        [
            "Lakes",
            ([
                // first set of labels G84:G90
                "Lakes - High alkalinity lakes",
                "Lakes - Low alkalinity lakes",
                "Lakes - Marl lakes",
                "Lakes - Moderate alkalinity lakes",
                "Lakes - Peat lakes",
                "Lakes - Ponds (priority habitat)",
                "Lakes - Temporary lakes ponds and pools (H3170)",
                // second set of labels 'Trading Summary Area Habitats'!F17
                "Lakes - Aquifer fed naturally fluctuating water bodies",
            ] satisfies HabitatLabel[]).reduce((sum, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSite;
                return value > 0 ? new Decimal(sum).plus(value).toNumber() : sum;
            }, 0),
        ],
        [
            "Sparsely vegetated land",
            ([
                // first set of labels G91:94
                "Sparsely vegetated land - Coastal sand dunes",
                "Sparsely vegetated land - Coastal vegetated shingle",
                "Sparsely vegetated land - Inland rock outcrop and scree habitats",
                "Sparsely vegetated land - Maritime cliff and slopes",
                // second set of labels 'Trading Summary Area Habitats'!F18:19
                "Sparsely vegetated land - Calaminarian grasslands",
                "Sparsely vegetated land - Limestone pavement",
            ] satisfies HabitatLabel[]).reduce((sum, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSite;
                return value > 0 ? new Decimal(sum).plus(value).toNumber() : sum;
            }, 0),
        ],
        [
            "Wetland",
            ([
                // first set of labels G96
                "Wetland - Reedbeds",
                // second set of labels 'Trading Summary Area Habitats'!F20:26
                "Wetland - Blanket bog",
                "Wetland - Depressions on peat substrates (H7150)",
                "Wetland - Fens (upland and lowland)",
                "Wetland - Lowland raised bog",
                "Wetland - Oceanic valley mire[1] (D2.1)",
                "Wetland - Purple moor grass and rush pastures",
                "Wetland - Transition mires and quaking bogs (H7140)",
            ] satisfies HabitatLabel[]).reduce((sum, label) => {
                const value = byHabitat[label as HabitatLabel].unitChangeIncludingOffSite;
                return value > 0 ? new Decimal(sum).plus(value).toNumber() : sum;
            }, 0),
        ],
    ]

    const a1Rule1 = a1HabitatGroups.map(([broadHabitat, unitGainAvailable]) => {
        const lossesRequiringOffset = cumulativeChanges[broadHabitat] < 0 ? cumulativeChanges[broadHabitat] : 0;
        const remainingAvailableAfterRule1 = new Decimal(unitGainAvailable).plus(lossesRequiringOffset).toNumber();

        return remainingAvailableAfterRule1
    })
    const a2Rule1 = a2HabitatGroups.map(([broadHabitat, unitGainAvailable]) => {
        const lossesRequiringOffset = cumulativeChanges[broadHabitat] < 0 ? cumulativeChanges[broadHabitat] : 0;
        const remainingAvailableAfterRule1 = new Decimal(unitGainAvailable).plus(lossesRequiringOffset).toNumber();

        return remainingAvailableAfterRule1
    })
    const a4Rule1 = a4HabitatGroups.map(([broadHabitat, unitGainAvailable]) => {
        const lossesRequiringOffset = cumulativeChanges[broadHabitat] < 0 ? cumulativeChanges[broadHabitat] : 0;
        const remainingAvailableAfterRule1 = new Decimal(unitGainAvailable).plus(lossesRequiringOffset).toNumber();

        return remainingAvailableAfterRule1
    })
    const rule1Sum = [a1Rule1, a2Rule1, a4Rule1].flat().reduce((sum: number, num: number) => num > 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)

    const a1Rule2 = a1Rule1.reduce((sum: number, num: number) => num < 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)
    const a2Rule2 = a2Rule1.reduce((sum: number, num: number) => num < 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)
    const a4Rule2 = new Decimal(
        a4Rule1.reduce((sum: number, num: number) => num < 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)
    ).plus(rule1Sum).toNumber();
    const rule2Sum = [a1Rule2, a2Rule2, a4Rule2].reduce((sum: number, num: number) => num > 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)

    const a1Rule3 = [a1Rule2].reduce((sum: number, num: number) => num < 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)
    const a2Rule3 = new Decimal([a2Rule2].reduce((sum: number, num: number) => num < 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)).plus(rule2Sum).toNumber();
    const a4Rule3 = [a4Rule2].reduce((sum: number, num: number) => num < 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)
    const rule3Sum = [a1Rule3, a2Rule3, a4Rule3].reduce((sum: number, num: number) => num > 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)

    const a1Rule4 = new Decimal(a1Rule3).plus(rule3Sum).toNumber();
    const a2Rule4 = a2Rule3 < 0 ? a2Rule3 : 0;
    const a4Rule4 = a4Rule3 < 0 ? a4Rule3 : 0;

    const a1FinalLosses = a1Rule4 < 0 ? a1Rule4 : 0;
    const a2FinalLosses = a2Rule4 < 0 ? a2Rule4 : 0;
    const a4FinalLosses = a4Rule4 < 0 ? a4Rule4 : 0;

    return {
        a1: { rule1: a1Rule1, rule2: a1Rule2, rule3: a1Rule3, rule4: a1Rule4, finalLosses: a1FinalLosses },
        a2: { rule1: a2Rule1, rule2: a2Rule2, rule3: a2Rule3, rule4: a2Rule4, finalLosses: a2FinalLosses },
        a4: { rule1: a4Rule1, rule2: a4Rule2, rule3: a4Rule3, rule4: a4Rule4, finalLosses: a4FinalLosses },
    }
}

function lowTierDetail(tradingSummaries: TradingSummaries, mediumTier: ReturnType<typeof mediumTierDetail>) {
    const netUnitChange = tradingSummaries.habitats.details.low.netChangeInUnits;
    const unitChangeFollowingOffset = new Decimal(netUnitChange < 0 ? netUnitChange : 0)
        .plus(tradingSummaries.habitats.details.medium.unitsAvailableToOffsetDownwards)
        .toNumber();
    const unitsRemainingAfterRule5 = new Decimal(unitChangeFollowingOffset)
        .plus([mediumTier.a1.rule4, mediumTier.a2.rule4, mediumTier.a4.rule4].reduce((sum: number, num: number) => num > 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0))
        .toNumber();
    const finalLosses = unitsRemainingAfterRule5 < 0 ? unitsRemainingAfterRule5 : 0;

    return {
        a1: { netUnitChange, unitChangeFollowingOffset, unitsRemainingAfterRule5, finalLosses },
    }
}

function hedgerowDetail(tradingSummaries: TradingSummaries) {
    const finalLosses = [
        tradingSummaries.hedgerows.details.vHigh.remainingLosses,
        tradingSummaries.hedgerows.details.high.surplusUnitsMinusDeficit,
        tradingSummaries.hedgerows.details.medium.cumulativeSurplus,
        tradingSummaries.hedgerows.details.low.cumulativeSurplus,
        tradingSummaries.hedgerows.details.vLow.cumulativeSurplus,
    ].reduce((sum: number, num: number) => num < 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)

    return {
        finalLosses,
    }
}

function watercourseDetail(tradingSummaries: TradingSummaries) {
    const finalLosses = [
        tradingSummaries.watercourses.details.vHigh.remainingLosses,
        tradingSummaries.watercourses.details.high.remainingLosses,
        tradingSummaries.watercourses.details.medium.remainingLosses,
        tradingSummaries.watercourses.details.low.cumulativeSurplus,
    ].reduce((sum: number, num: number) => num < 0 ? new Decimal(sum).plus(num).toNumber() : sum, 0)

    return {
        finalLosses,
    }
}

/**
 * Builds tier detail arrays with individual habitat/hedgerow/watercourse net changes
 * Used for detailed reporting in Section 3 of the Unit Shortfall sheet
 */
function buildTierDetail(features: AllFeatures, tradingSummaries: TradingSummaries) {
    const vh = {
        a5: {
            netGains: tradingSummaries.habitats.details.vHigh.unitsAvailableToOffsetDownwards,
            netLosses: tradingSummaries.habitats.details.vHigh.remainingLosses,
        }
    }

    const high = {
        a5: highTierDetail(features, [
            "Lakes - High alkalinity lakes",
            "Lakes - Low alkalinity lakes",
            "Lakes - Marl lakes",
            "Lakes - Moderate alkalinity lakes",
            "Lakes - Peat lakes",
        ]),
        a4: highTierDetail(features, [
            "Grassland - Floodplain wetland mosaic and CFGM",
            "Lakes - Ponds (priority habitat)",
            "Lakes - Temporary lakes ponds and pools (H3170)",
            "Sparsely vegetated land - Coastal sand dunes",
            "Sparsely vegetated land - Coastal vegetated shingle",
            "Sparsely vegetated land - Inland rock outcrop and scree habitats",
            "Sparsely vegetated land - Maritime cliff and slopes",
            "Woodland and forest - Lowland mixed deciduous woodland",
            "Woodland and forest - Native pine woodlands",
            "Woodland and forest - Upland mixed ashwoods",
            "Woodland and forest - Upland oakwood",
            "Coastal lagoons - Coastal lagoons",
            "Rocky shore - High energy littoral rock",
            "Rocky shore - Moderate energy littoral rock",
            "Rocky shore - Low energy littoral rock",
            "Rocky shore - Features of littoral rock",
            "Coastal saltmarsh - Saltmarshes and saline reedbeds",
        ]),
        a3: highTierDetail(features, [
            "Woodland and forest - Felled",
            "Woodland and forest - Lowland beech and yew woodland",
            "Woodland and forest - Upland birchwoods",
            "Woodland and forest - Wet woodland",
            "Intertidal sediment - Littoral mud",
            "Intertidal sediment - Littoral mixed sediments",
            "Intertidal sediment - Littoral biogenic reefs - Mussels",
            "Intertidal sediment - Littoral biogenic reefs - Sabellaria",
            "Intertidal sediment - Features of littoral sediment",
            "Intertidal sediment - Littoral muddy sand",
            "Intertidal sediment - Littoral seagrass",
        ]),
        a2: highTierDetail(features, [
            "Grassland - Lowland calcareous grassland",
            "Grassland - Tall herb communities (H6430)",
            "Grassland - Upland calcareous grassland",
            "Heathland and shrub - Lowland heathland",
            "Heathland and shrub - Dunes with sea buckthorn (H2160)",
            "Heathland and shrub - Upland heathland",
            "Urban - Open mosaic habitats on previously developed land",
        ]),
        a1: highTierDetail(features, [
            "Grassland - Traditional orchards",
            "Wetland - Reedbeds",
        ])
    }

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
    }
}

/**
 * Main unit shortfall calculation function
 * Calculates unit shortfalls by tier with Spatial Risk Multiplier applied
 * Corresponds to the "Unit Shortfall calculations" sheet
 */
export function unitShortfall(features: AllFeatures, headline: HeadlineResults, tradingSummaries: TradingSummaries) {
    // Build tier detail (the lower sections of the sheet)
    const tierDetail = buildTierDetail(features, tradingSummaries);

    const veryHighLossesDetected = hasVeryHighLosses(tradingSummaries);

    // Calculate habitat tier shortfalls (A5-A1)
    const habitatShortfalls = habitatTierShortfall(headline, tierDetail);

    const hedgerowShortfall = featureShortfall(
        tierDetail.hedgerows.finalLosses,
        headline.hedgerowUnitSummary.unitDeficit,
        new Decimal(headline.hedgerowUnitSummary.requiredUnits).minus(headline.hedgerowUnitSummary.baselineUnits).toNumber()
    );

    const watercourseShortfall = featureShortfall(
        tierDetail.watercourses.finalLosses,
        headline.watercourseUnitSummary.unitDeficit,
        new Decimal(headline.watercourseUnitSummary.requiredUnits).minus(headline.watercourseUnitSummary.baselineUnits).toNumber()
    );

    return {
        hasVeryHighLosses: veryHighLossesDetected,
        tierShortfalls: {
            habitats: {
                a5: {
                    shortfall: habitatShortfalls.a5,
                    srmShortfall: new Decimal(habitatShortfalls.a5).mul(2).toNumber(), // SRM application: * 2
                },
                a4: {
                    shortfall: habitatShortfalls.a4,
                    srmShortfall: new Decimal(habitatShortfalls.a4).mul(2).toNumber(),
                },
                a3: {
                    shortfall: habitatShortfalls.a3,
                    srmShortfall: new Decimal(habitatShortfalls.a3).mul(2).toNumber(),
                },
                a2: {
                    shortfall: habitatShortfalls.a2,
                    srmShortfall: new Decimal(habitatShortfalls.a2).mul(2).toNumber(),
                },
                a1: {
                    shortfall: habitatShortfalls.a1,
                    srmShortfall: new Decimal(habitatShortfalls.a1).mul(2).toNumber(),
                },
            },
            hedgerows: {
                shortfall: hedgerowShortfall,
                srmShortfall: new Decimal(hedgerowShortfall).mul(2).toNumber(), // SRM application: * 2
            },
            watercourses: {
                shortfall: watercourseShortfall,
                srmShortfall: new Decimal(watercourseShortfall).mul(2).toNumber(), // SRM application: * 2
            },
        },
        tierDetail,
    };
}

export type UnitShortfallResult = ReturnType<typeof unitShortfall>;

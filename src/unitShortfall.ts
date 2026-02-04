import type { AllFeatures } from './features';
import type { HeadlineResults } from './headlineResults';
import { allHabitats } from './habitats';
import { allHedgerows } from './hedgerows';
import { allWatercourses } from './watercourses';
import { valuesByHabitat } from './groupings/habitats';
import { valuesByHedgerow } from './groupings/hedgerows';
import { valuesByWatercourse } from './groupings/watercourses';
import { habitatTradingSummary } from './tradingSummaries/habitats';
import { watercourseTradingSummary } from './tradingSummaries/watercourses';

/**
 * Calculates tier losses for habitats by distinctiveness category
 * Sums unitChangeIncludingOffSite for all habitats in each tier, capturing only negative values
 * Corresponds to Section 3 tier detail aggregation in the Unit Shortfall sheet
 */
function habitatTierLosses(features: AllFeatures): Record<string, number> {
    const byHabitat = valuesByHabitat(features);
    const result: Record<string, number> = {};

    for (const habitat of Object.values(allHabitats)) {
        const change = byHabitat[habitat.label]?.unitChangeIncludingOffSite ?? 0;
        if (change < 0) {
            const tier = habitat.distinctivenessCategory;
            result[tier] = (result[tier] ?? 0) + change;
        }
    }

    return result; // values are negative; sign-flipped by callers
}

/**
 * Calculates tier losses for hedgerows by distinctiveness category
 * Sums overallUnitChange for all hedgerows in each tier, capturing only negative values
 * Corresponds to hedgerow tier detail aggregation in the Unit Shortfall sheet
 */
function hedgerowTierLosses(features: AllFeatures): Record<string, number> {
    const byHedgerow = valuesByHedgerow(features);
    const result: Record<string, number> = {};

    for (const hedgerow of Object.values(allHedgerows)) {
        const change = byHedgerow[hedgerow.label]?.overallUnitChange ?? 0;
        if (change < 0) {
            const tier = hedgerow.distinctivenessCategory;
            result[tier] = (result[tier] ?? 0) + change;
        }
    }

    return result; // values are negative; sign-flipped by callers
}

/**
 * Calculates tier losses for watercourses by distinctiveness category
 * Sums overallUnitChange for all watercourses in each tier, capturing only negative values
 * Corresponds to watercourse tier detail aggregation in the Unit Shortfall sheet
 */
function watercourseTierLosses(features: AllFeatures): Record<string, number> {
    const byWatercourse = valuesByWatercourse(features);
    const result: Record<string, number> = {};

    for (const watercourse of Object.values(allWatercourses)) {
        const change = byWatercourse[watercourse.label]?.overallUnitChange ?? 0;
        if (change < 0) {
            const tier = watercourse.distinctivenessCategory;
            result[tier] = (result[tier] ?? 0) + change;
        }
    }

    return result; // values are negative; sign-flipped by callers
}

/**
 * Checks if there are very high distinctiveness losses
 * Corresponds to the guard clause: IF(OR('Trading Summary Area Habitats'!$K$13<0, 'Trading Summary WaterC''s'!$I$13<0)
 * Note: Hedgerows are deliberately excluded from this check
 */
function hasVeryHighLosses(features: AllFeatures): boolean {
    const habitatTrading = habitatTradingSummary(features);
    const watercourseTrading = watercourseTradingSummary(features);

    // Returns true if EITHER habitat or watercourse very high tier is NOT satisfied (has net losses)
    return !habitatTrading.vHighSatisfied || !watercourseTrading.vHighSatisfied;
}

/**
 * Calculates feature-specific shortfall (for hedgerows and watercourses)
 * Corresponds to cells F14 and F15 logic in the Unit Shortfall sheet
 *
 * Formula pattern:
 * IF((rawTierLoss*-1)<deficit, deficit,
 *   IF(deficit<=0, (rawTierLoss*-1),
 *     IF(deficit>=requiredGap, (rawTierLoss*-1),
 *       (rawTierLoss*-1)+deficit)))
 */
function featureShortfall(rawTierLoss: number, deficit: number, requiredGap: number): number {
    const loss = rawTierLoss * -1; // Convert negative loss to positive shortfall

    if (loss < deficit) {
        return deficit;
    }

    if (deficit <= 0) {
        return loss;
    }

    if (deficit >= requiredGap) {
        return loss;
    }

    return loss + deficit;
}

/**
 * Calculates A1 tier balancing shortfall (the most complex tier)
 * Corresponds to cell F9 logic in the Unit Shortfall sheet
 *
 * A1 is the "balancing tier" that absorbs whatever shortfall remains
 * after higher tiers (A5-A2) have been accounted for
 */
function a1BalancingShortfall(
    a1RawLoss: number,           // sum of A1-tier losses (negative, will be flipped)
    higherTierTotal: number,     // A2+A3+A4+A5 shortfalls (already positive)
    deficit: number,             // overall feature deficit from HeadlineResults
    requiredGap: number          // requiredUnits - baselineUnits
): number {
    const a1Loss = a1RawLoss * -1; // Convert negative loss to positive shortfall
    const combinedShortfall = higherTierTotal + a1Loss;

    // Case 1: Combined shortfall already meets or exceeds the overall deficit
    if (combinedShortfall >= deficit) {
        return a1Loss;
    }

    // Case 2: Combined shortfall >= (deficit - requiredGap)
    if (combinedShortfall >= (deficit - requiredGap)) {
        return a1Loss + (deficit - combinedShortfall);
    }

    // Case 3: No overall deficit (deficit <= 0)
    if (deficit <= 0) {
        return a1Loss;
    }

    // Case 4: Combined shortfall < deficit
    if (combinedShortfall < deficit) {
        return deficit - higherTierTotal;
    }

    // Case 5: deficit >= requiredGap
    if (deficit >= requiredGap) {
        return a1Loss + requiredGap;
    }

    // Case 6: Default case
    return a1Loss + deficit;
}

/**
 * Calculates habitat tier shortfall with A1 balancing logic
 * Corresponds to rows 9-13 (F9-F13) in the Unit Shortfall sheet
 */
function habitatTierShortfall(
    tierLosses: Record<string, number>,
    overallDeficit: number,
    baselineUnits: number,
    requiredUnits: number
): { a5: number; a4: number; a3: number; a2: number; a1: number } {
    const requiredGap = requiredUnits - baselineUnits;

    // A5-A2: straightforward sign-flip of tier losses
    const a5 = (tierLosses['V.High'] ?? 0) * -1;
    const a4 = (tierLosses['High'] ?? 0) * -1;
    const a3 = (tierLosses['Medium'] ?? 0) * -1;
    const a2 = (tierLosses['Low'] ?? 0) * -1;

    // A1: balancing tier with complex conditional logic
    const a1RawLoss = tierLosses['V.Low'] ?? 0;
    const higherTierTotal = a5 + a4 + a3 + a2;
    const a1 = a1BalancingShortfall(a1RawLoss, higherTierTotal, overallDeficit, requiredGap);

    return { a5, a4, a3, a2, a1 };
}

/**
 * Builds tier detail arrays with individual habitat/hedgerow/watercourse net changes
 * Used for detailed reporting in Section 3 of the Unit Shortfall sheet
 */
function buildTierDetail(features: AllFeatures) {
    const byHabitat = valuesByHabitat(features);
    const byHedgerow = valuesByHedgerow(features);
    const byWatercourse = valuesByWatercourse(features);

    const habitats = Object.values(allHabitats)
        .map(habitat => ({
            habitat: habitat.label,
            tier: habitat.distinctivenessCategory,
            netChange: byHabitat[habitat.label]?.unitChangeIncludingOffSite ?? 0,
        }))
        .filter(item => item.netChange < 0); // Only include losses

    const hedgerows = Object.values(allHedgerows)
        .map(hedgerow => ({
            hedgerow: hedgerow.label,
            tier: hedgerow.distinctivenessCategory,
            netChange: byHedgerow[hedgerow.label]?.overallUnitChange ?? 0,
        }))
        .filter(item => item.netChange < 0); // Only include losses

    const watercourses = Object.values(allWatercourses)
        .map(watercourse => ({
            watercourse: watercourse.label,
            tier: watercourse.distinctivenessCategory,
            netChange: byWatercourse[watercourse.label]?.overallUnitChange ?? 0,
        }))
        .filter(item => item.netChange < 0); // Only include losses

    return { habitats, hedgerows, watercourses };
}

/**
 * Main unit shortfall calculation function
 * Calculates unit shortfalls by tier with Spatial Risk Multiplier applied
 * Corresponds to the "Unit Shortfall calculations" sheet
 */
export function unitShortfall(features: AllFeatures, headline: HeadlineResults) {
    // Guard clause - check for very high distinctiveness losses
    const veryHighLossesDetected = hasVeryHighLosses(features);

    // Calculate tier losses for each feature type
    const habitatLosses = habitatTierLosses(features);
    const hedgerowLosses = hedgerowTierLosses(features);
    const watercourseLosses = watercourseTierLosses(features);

    // Calculate habitat tier shortfalls (A5-A1)
    const habitatShortfalls = habitatTierShortfall(
        habitatLosses,
        headline.habitatUnitSummary.unitDeficit,
        headline.habitatUnitSummary.baselineUnits,
        headline.habitatUnitSummary.requiredUnits
    );

    // Calculate hedgerow shortfall
    // Combine all hedgerow tier losses into a single value
    const totalHedgerowLoss = Object.values(hedgerowLosses).reduce((sum, loss) => sum + loss, 0);
    const hedgerowShortfall = featureShortfall(
        totalHedgerowLoss,
        headline.hedgerowUnitSummary.unitDeficit,
        headline.hedgerowUnitSummary.requiredUnits - headline.hedgerowUnitSummary.baselineUnits
    );

    // Calculate watercourse shortfall
    // Combine all watercourse tier losses into a single value
    const totalWatercourseLoss = Object.values(watercourseLosses).reduce((sum, loss) => sum + loss, 0);
    const watercourseShortfall = featureShortfall(
        totalWatercourseLoss,
        headline.watercourseUnitSummary.unitDeficit,
        headline.watercourseUnitSummary.requiredUnits - headline.watercourseUnitSummary.baselineUnits
    );

    // Build tier detail for reporting
    const tierDetail = buildTierDetail(features);

    return {
        hasVeryHighLosses: veryHighLossesDetected,

        summary: {
            habitats: {
                baselineUnits: headline.habitatUnitSummary.baselineUnits,
                requiredUnits: headline.habitatUnitSummary.requiredUnits,
                unitDeficit: headline.habitatUnitSummary.unitDeficit,
            },
            hedgerows: {
                baselineUnits: headline.hedgerowUnitSummary.baselineUnits,
                requiredUnits: headline.hedgerowUnitSummary.requiredUnits,
                unitDeficit: headline.hedgerowUnitSummary.unitDeficit,
            },
            watercourses: {
                baselineUnits: headline.watercourseUnitSummary.baselineUnits,
                requiredUnits: headline.watercourseUnitSummary.requiredUnits,
                unitDeficit: headline.watercourseUnitSummary.unitDeficit,
            },
        },

        tierShortfalls: {
            habitats: {
                a5: {
                    shortfall: habitatShortfalls.a5,
                    srmShortfall: habitatShortfalls.a5 * 2, // SRM application: * 2
                },
                a4: {
                    shortfall: habitatShortfalls.a4,
                    srmShortfall: habitatShortfalls.a4 * 2,
                },
                a3: {
                    shortfall: habitatShortfalls.a3,
                    srmShortfall: habitatShortfalls.a3 * 2,
                },
                a2: {
                    shortfall: habitatShortfalls.a2,
                    srmShortfall: habitatShortfalls.a2 * 2,
                },
                a1: {
                    shortfall: habitatShortfalls.a1,
                    srmShortfall: habitatShortfalls.a1 * 2,
                },
            },
            hedgerows: {
                shortfall: hedgerowShortfall,
                srmShortfall: hedgerowShortfall * 2, // SRM application: * 2
            },
            watercourses: {
                shortfall: watercourseShortfall,
                srmShortfall: watercourseShortfall * 2, // SRM application: * 2
            },
        },

        tierDetail,
    };
}

export type UnitShortfallResult = ReturnType<typeof unitShortfall>;

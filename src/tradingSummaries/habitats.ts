import { Decimal, type Quantity } from '../decimal';
import type { BroadHabitat } from '../broadHabitats';
import type { DistinctivenessCategory } from '../distinctivenessCategories';
import { type AllFeatures } from '../features';
import { valuesByHabitat } from '../groupings';
import { allHabitats, type HabitatLabel } from '../habitats';

const ZERO = new Decimal(0);
const sumD = (values: Quantity[]) => values.reduce<Decimal>((sum, value) => sum.plus(value), ZERO);

function projectWideUnitChange(features: AllFeatures, label: HabitatLabel) {
    return valuesByHabitat(features)[label]!.unitChangeIncludingOffSiteDecimal;
}

function unitLosses(features: AllFeatures, label: HabitatLabel) {
    return valuesByHabitat(features)[label]!.unitsRequiredOffSiteDecimal;
}

const lossesNotYetAccountedFor = unitLosses;

function cumulativeBroadHabitatChangeD(
    features: AllFeatures,
    distinctivenessCategory: DistinctivenessCategory,
) {
    return Object.values(allHabitats)
        .filter((h) => h.distinctivenessCategory === distinctivenessCategory)
        .reduce(
            (changes, habitat) => {
                // Trading Summary G113 = SUM(F113:F115): medium intertidal
                // sediment and IGGI share one balance before sign splitting.
                const group =
                    distinctivenessCategory === 'Medium' &&
                    habitat.broadHabitat === 'Intertidal hard structures'
                        ? 'Intertidal sediment'
                        : habitat.broadHabitat;
                changes[group] = (changes[group] ?? ZERO).plus(
                    projectWideUnitChange(features, habitat.label),
                );
                return changes;
            },
            {} as Partial<Record<BroadHabitat, Decimal>>,
        );
}

export function cumulativeBroadHabitatChangeDecimal(
    features: AllFeatures,
    distinctivenessCategory: DistinctivenessCategory,
) {
    return cumulativeBroadHabitatChangeD(features, distinctivenessCategory) as Record<BroadHabitat, Decimal>;
}

export function cumulativeBroadHabitatChange(
    features: AllFeatures,
    distinctivenessCategory: DistinctivenessCategory,
) {
    return Object.fromEntries(
        Object.entries(cumulativeBroadHabitatChangeDecimal(features, distinctivenessCategory)).map(
            ([habitat, change]) => [habitat, change.toNumber()],
        ),
    ) as Record<BroadHabitat, number>;
}

function labelsFor(category: DistinctivenessCategory) {
    return Object.values(allHabitats)
        .filter((h) => h.distinctivenessCategory === category)
        .map((h) => h.label);
}

function unitsAvailableToOffsetDownwards(features: AllFeatures, label: HabitatLabel) {
    const change = projectWideUnitChange(features, label);
    return change.gt(0) ? change : 0;
}

function unitsAvailableToOffsetUpwards(features: AllFeatures, label: HabitatLabel) {
    const change = projectWideUnitChange(features, label);
    return change.lt(0) ? change : 0;
}

function veryHighDistinctivenessSummaryD(features: AllFeatures) {
    const labels = labelsFor('V.High');
    return {
        unitsAvailableToOffsetDownwards: sumD(
            labels.map((label) => unitsAvailableToOffsetDownwards(features, label)),
        ),
        remainingLosses: sumD(labels.map((label) => unitLosses(features, label))),
    };
}

function highDistinctivenessSummaryD(features: AllFeatures) {
    const labels = labelsFor('High');
    return {
        unitsAvailableToOffsetDownwards: sumD(
            labels.map((label) => unitsAvailableToOffsetDownwards(features, label)),
        ),
        remainingLosses: sumD(labels.map((label) => lossesNotYetAccountedFor(features, label))),
    };
}

function mediumDistinctivenessSummaryD(features: AllFeatures) {
    const changes = Object.values(cumulativeBroadHabitatChangeD(features, 'Medium'));
    const availableDownwards = changes.reduce((sum, change) => (change.gt(0) ? sum.plus(change) : sum), ZERO);
    const availableUpwards = changes.reduce((sum, change) => (change.lt(0) ? sum.plus(change) : sum), ZERO);
    const vHigh = veryHighDistinctivenessSummaryD(features);
    const high = highDistinctivenessSummaryD(features);
    const surplusUnitsMinusDeficit = vHigh.unitsAvailableToOffsetDownwards
        .plus(high.unitsAvailableToOffsetDownwards)
        .plus(availableUpwards);
    return {
        unitsAvailableToOffsetDownwards: availableDownwards,
        unitsAvailableToOffsetUpwards: availableUpwards,
        surplusUnitsMinusDeficit,
        cumulativeSurplus: surplusUnitsMinusDeficit.plus(availableDownwards),
    };
}

function lowDistinctivenessSummaryD(features: AllFeatures) {
    const netChangeInUnits = sumD(labelsFor('Low').map((label) => projectWideUnitChange(features, label)));
    const mediumSurplus = mediumDistinctivenessSummaryD(features).cumulativeSurplus;
    return {
        netChangeInUnits,
        cumulativeSurplus: mediumSurplus.gt(0) ? netChangeInUnits.plus(mediumSurplus) : netChangeInUnits,
    };
}

export function habitatTradingSummary(features: AllFeatures) {
    const detailsD = {
        vHigh: veryHighDistinctivenessSummaryD(features),
        high: highDistinctivenessSummaryD(features),
        medium: mediumDistinctivenessSummaryD(features),
        low: lowDistinctivenessSummaryD(features),
    };
    const details = {
        vHigh: {
            unitsAvailableToOffsetDownwards: detailsD.vHigh.unitsAvailableToOffsetDownwards.toNumber(),
            unitsAvailableToOffsetDownwardsDecimal: detailsD.vHigh.unitsAvailableToOffsetDownwards,
            remainingLosses: detailsD.vHigh.remainingLosses.toNumber(),
            remainingLossesDecimal: detailsD.vHigh.remainingLosses,
        },
        high: {
            unitsAvailableToOffsetDownwards: detailsD.high.unitsAvailableToOffsetDownwards.toNumber(),
            unitsAvailableToOffsetDownwardsDecimal: detailsD.high.unitsAvailableToOffsetDownwards,
            remainingLosses: detailsD.high.remainingLosses.toNumber(),
            remainingLossesDecimal: detailsD.high.remainingLosses,
        },
        medium: {
            unitsAvailableToOffsetDownwards: detailsD.medium.unitsAvailableToOffsetDownwards.toNumber(),
            unitsAvailableToOffsetDownwardsDecimal: detailsD.medium.unitsAvailableToOffsetDownwards,
            unitsAvailableToOffsetUpwards: detailsD.medium.unitsAvailableToOffsetUpwards.toNumber(),
            unitsAvailableToOffsetUpwardsDecimal: detailsD.medium.unitsAvailableToOffsetUpwards,
            surplusUnitsMinusDeficit: detailsD.medium.surplusUnitsMinusDeficit.toNumber(),
            surplusUnitsMinusDeficitDecimal: detailsD.medium.surplusUnitsMinusDeficit,
            cumulativeSurplus: detailsD.medium.cumulativeSurplus.toNumber(),
            cumulativeSurplusDecimal: detailsD.medium.cumulativeSurplus,
        },
        low: {
            netChangeInUnits: detailsD.low.netChangeInUnits.toNumber(),
            netChangeInUnitsDecimal: detailsD.low.netChangeInUnits,
            cumulativeSurplus: detailsD.low.cumulativeSurplus.toNumber(),
            cumulativeSurplusDecimal: detailsD.low.cumulativeSurplus,
        },
    };
    return {
        details,
        vHighSatisfied: detailsD.vHigh.remainingLosses.gte(0),
        highSatisfied: detailsD.high.remainingLosses.gte(0),
        mediumSatisfied: detailsD.vHigh.unitsAvailableToOffsetDownwards
            .plus(detailsD.high.unitsAvailableToOffsetDownwards)
            .plus(detailsD.medium.unitsAvailableToOffsetUpwards)
            .gte(0),
        lowSatisfied: detailsD.low.cumulativeSurplus.gte(0),
    };
}

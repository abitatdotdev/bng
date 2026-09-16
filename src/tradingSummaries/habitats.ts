import { Decimal } from "../decimal";
import type { BroadHabitat } from "../broadHabitats";
import type { DistinctivenessCategory } from "../distinctivenessCategories";
import { type AllFeatures } from "../features";
import { valuesByHabitat } from "../groupings";
import { allHabitats, type HabitatLabel } from "../habitats";

const ZERO = new Decimal(0);
const sumD = (values: number[]) => values.reduce((sum, value) => sum.plus(value), ZERO);

function projectWideUnitChange(features: AllFeatures, label: HabitatLabel) {
    return valuesByHabitat(features)[label]!.unitChangeIncludingOffSite;
}

function unitLosses(features: AllFeatures, label: HabitatLabel) {
    return valuesByHabitat(features)[label]!.unitsRequiredOffSite;
}

const lossesNotYetAccountedFor = unitLosses;

function cumulativeBroadHabitatChangeD(features: AllFeatures, distinctivenessCategory: DistinctivenessCategory) {
    return Object.values(allHabitats)
        .filter(h => h.distinctivenessCategory === distinctivenessCategory)
        .reduce((changes, habitat) => {
            changes[habitat.broadHabitat] = (changes[habitat.broadHabitat] ?? ZERO).plus(projectWideUnitChange(features, habitat.label));
            return changes;
        }, {} as Partial<Record<BroadHabitat, Decimal>>);
}

export function cumulativeBroadHabitatChange(features: AllFeatures, distinctivenessCategory: DistinctivenessCategory) {
    return Object.fromEntries(Object.entries(cumulativeBroadHabitatChangeD(features, distinctivenessCategory))
        .map(([habitat, change]) => [habitat, change.toNumber()])) as { [K in BroadHabitat]: number };
}

function labelsFor(category: DistinctivenessCategory) {
    return Object.values(allHabitats).filter(h => h.distinctivenessCategory === category).map(h => h.label);
}

function unitsAvailableToOffsetDownwards(features: AllFeatures, label: HabitatLabel) {
    const change = projectWideUnitChange(features, label);
    return change > 0 ? change : 0;
}

function unitsAvailableToOffsetUpwards(features: AllFeatures, label: HabitatLabel) {
    const change = projectWideUnitChange(features, label);
    return change < 0 ? change : 0;
}

function veryHighDistinctivenessSummaryD(features: AllFeatures) {
    const labels = labelsFor("V.High");
    return { unitsAvailableToOffsetDownwards: sumD(labels.map(label => unitsAvailableToOffsetDownwards(features, label))), remainingLosses: sumD(labels.map(label => unitLosses(features, label))) };
}

function highDistinctivenessSummaryD(features: AllFeatures) {
    const labels = labelsFor("High");
    return { unitsAvailableToOffsetDownwards: sumD(labels.map(label => unitsAvailableToOffsetDownwards(features, label))), remainingLosses: sumD(labels.map(label => lossesNotYetAccountedFor(features, label))) };
}

function mediumDistinctivenessSummaryD(features: AllFeatures) {
    const changes = Object.values(cumulativeBroadHabitatChangeD(features, "Medium"));
    const availableDownwards = changes.reduce((sum, change) => change.gt(0) ? sum.plus(change) : sum, ZERO);
    const availableUpwards = changes.reduce((sum, change) => change.lt(0) ? sum.plus(change) : sum, ZERO);
    const vHigh = veryHighDistinctivenessSummaryD(features);
    const high = highDistinctivenessSummaryD(features);
    const surplusUnitsMinusDeficit = vHigh.unitsAvailableToOffsetDownwards.plus(high.unitsAvailableToOffsetDownwards).plus(availableUpwards);
    return { unitsAvailableToOffsetDownwards: availableDownwards, unitsAvailableToOffsetUpwards: availableUpwards, surplusUnitsMinusDeficit, cumulativeSurplus: surplusUnitsMinusDeficit.plus(availableDownwards) };
}

function lowDistinctivenessSummaryD(features: AllFeatures) {
    const netChangeInUnits = sumD(labelsFor("Low").map(label => projectWideUnitChange(features, label)));
    const mediumSurplus = mediumDistinctivenessSummaryD(features).cumulativeSurplus;
    return { netChangeInUnits, cumulativeSurplus: mediumSurplus.gt(0) ? netChangeInUnits.plus(mediumSurplus) : netChangeInUnits };
}

export function habitatTradingSummary(features: AllFeatures) {
    const detailsD = { vHigh: veryHighDistinctivenessSummaryD(features), high: highDistinctivenessSummaryD(features), medium: mediumDistinctivenessSummaryD(features), low: lowDistinctivenessSummaryD(features) };
    const details = {
        vHigh: { unitsAvailableToOffsetDownwards: detailsD.vHigh.unitsAvailableToOffsetDownwards.toNumber(), remainingLosses: detailsD.vHigh.remainingLosses.toNumber() },
        high: { unitsAvailableToOffsetDownwards: detailsD.high.unitsAvailableToOffsetDownwards.toNumber(), remainingLosses: detailsD.high.remainingLosses.toNumber() },
        medium: { unitsAvailableToOffsetDownwards: detailsD.medium.unitsAvailableToOffsetDownwards.toNumber(), unitsAvailableToOffsetUpwards: detailsD.medium.unitsAvailableToOffsetUpwards.toNumber(), surplusUnitsMinusDeficit: detailsD.medium.surplusUnitsMinusDeficit.toNumber(), cumulativeSurplus: detailsD.medium.cumulativeSurplus.toNumber() },
        low: { netChangeInUnits: detailsD.low.netChangeInUnits.toNumber(), cumulativeSurplus: detailsD.low.cumulativeSurplus.toNumber() },
    };
    return {
        details,
        vHighSatisfied: detailsD.vHigh.remainingLosses.gte(0),
        highSatisfied: detailsD.high.remainingLosses.gte(0),
        mediumSatisfied: detailsD.vHigh.unitsAvailableToOffsetDownwards.plus(detailsD.high.unitsAvailableToOffsetDownwards).plus(detailsD.medium.unitsAvailableToOffsetUpwards).gte(0),
        lowSatisfied: detailsD.low.cumulativeSurplus.gte(0),
    };
}

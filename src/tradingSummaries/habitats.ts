import { Decimal } from "../decimal";
import type { BroadHabitat } from "../broadHabitats";
import type { DistinctivenessCategory } from "../distinctivenessCategories";
import { type AllFeatures } from "../features";
import { valuesByHabitat } from "../groupings";
import { allHabitats, type Habitat, type HabitatLabel } from "../habitats";

function onSiteUnitChange(features: AllFeatures, label: HabitatLabel) {
    const { netUnitChangeOnSite } = valuesByHabitat(features)[label]!
    return netUnitChangeOnSite;
}

function offSiteUnitChange(features: AllFeatures, label: HabitatLabel) {
    const { offSiteNetUnitChange } = valuesByHabitat(features)[label]!
    return offSiteNetUnitChange;
}

function projectWideUnitChange(features: AllFeatures, label: HabitatLabel) {
    const { unitChangeIncludingOffSite } = valuesByHabitat(features)[label]!
    return unitChangeIncludingOffSite;
}

function unitLosses(features: AllFeatures, label: HabitatLabel) {
    const { unitsRequiredOffSite } = valuesByHabitat(features)[label]!
    return unitsRequiredOffSite;
}

// This is simply to match the column name for high distinctiveness summaries
const lossesNotYetAccountedFor = unitLosses;

export function cumulativeBroadHabitatChange(features: AllFeatures, distinctivenessCategory: DistinctivenessCategory) {
    return Object.values(allHabitats)
        .filter(h => h.distinctivenessCategory === distinctivenessCategory)
        .reduce((acc, h) => {
            const existing = acc[h.broadHabitat] || 0;
            acc[h.broadHabitat] = new Decimal(existing).plus(projectWideUnitChange(features, h.label)).toNumber()
            return acc;
        }, {} as { [K in BroadHabitat]: number })
}

/**
  * Here we depart from the spreadsheet to make the function signatures more similar
  * and retain the possibility of simple programming paradigms later.
  *
  * Rather than calculate this in one hit for each group, we're choosing to calculate
  * it for each row and then sum them later.
  *
  * To calculate cells K12, K40, K88 - sum this over all habitats in the group
  */
function unitsAvailableToOffsetDownwards(features: AllFeatures, label: HabitatLabel) {
    const change = projectWideUnitChange(features, label);
    return change > 0 ? change : 0;
}


function unitsAvailableToOffsetUpwards(features: AllFeatures, label: HabitatLabel) {
    const change = projectWideUnitChange(features, label);
    return change < 0 ? change : 0;
}

function veryHighDistinctivenessSummary(features: AllFeatures) {
    const labels = Object.values(allHabitats)
        .filter(h => h.distinctivenessCategory === "V.High")
        .map(f => f.label);

    return {
        unitsAvailableToOffsetDownwards:
            labels
                .map(label => unitsAvailableToOffsetDownwards(features, label))
                .reduce((acc: number, num: number) => new Decimal(acc).plus(num).toNumber(), 0),
        remainingLosses:
            labels
                .map(label => unitLosses(features, label))
                .reduce((acc: number, num: number) => new Decimal(acc).plus(num).toNumber(), 0),
    }
}

function highDistinctivenessSummary(features: AllFeatures) {
    const labels = Object.values(allHabitats)
        .filter(h => h.distinctivenessCategory === "High")
        .map(f => f.label);

    return {
        unitsAvailableToOffsetDownwards:
            labels
                .map(label => unitsAvailableToOffsetDownwards(features, label))
                .reduce((acc: number, num: number) => new Decimal(acc).plus(num).toNumber(), 0),
        remainingLosses:
            labels
                .map(label => lossesNotYetAccountedFor(features, label))
                .reduce((acc: number, num: number) => new Decimal(acc).plus(num).toNumber(), 0),
    }
}

function mediumDistinctivenessSummary(features: AllFeatures) {
    const cumulativeBroadHabitatChanges =
        Object.values(cumulativeBroadHabitatChange(features, "Medium"))

    const availableDownwards =
        cumulativeBroadHabitatChanges
            .reduce((acc: number, num: number) => num > 0 ? new Decimal(acc).plus(num).toNumber() : acc, 0)
    const availableUpwards =
        cumulativeBroadHabitatChanges
            .reduce((acc: number, num: number) => num < 0 ? new Decimal(acc).plus(num).toNumber() : acc, 0)

    const vHighAvailable = veryHighDistinctivenessSummary(features).unitsAvailableToOffsetDownwards;
    const highAvailable = highDistinctivenessSummary(features).unitsAvailableToOffsetDownwards;
    const surplusUnitsMinusDeficit = new Decimal(vHighAvailable).plus(highAvailable).plus(availableUpwards).toNumber();

    const cumulativeSurplus = new Decimal(surplusUnitsMinusDeficit).plus(availableDownwards).toNumber();

    return {
        unitsAvailableToOffsetDownwards: availableDownwards,
        unitsAvailableToOffsetUpwards: availableUpwards,
        surplusUnitsMinusDeficit,
        cumulativeSurplus,
    }
}

function lowDistinctivenessSummary(features: AllFeatures) {
    const labels = Object.values(allHabitats)
        .filter(h => h.distinctivenessCategory === "Low")
        .map(f => f.label);

    const netChangeInUnits = labels.map(l => projectWideUnitChange(features, l)).reduce((sum: number, num: number) => new Decimal(sum).plus(num).toNumber(), 0);

    const mediumSurplus = mediumDistinctivenessSummary(features).cumulativeSurplus;
    const cumulativeSurplus = mediumSurplus > 0 ? new Decimal(netChangeInUnits).plus(mediumSurplus).toNumber() : netChangeInUnits;

    return {
        netChangeInUnits,
        cumulativeSurplus,
    }
}

function vHighUnitLosses(features: AllFeatures) {
    const labels = Object.values(allHabitats)
        .filter(h => h.distinctivenessCategory === "V.High")
        .map(f => f.label);

    return labels
        .map(l => unitLosses(features, l))
        .reduce((sum: number, num: number) => new Decimal(sum).plus(num).toNumber(), 0)
}

export function habitatTradingSummary(features: AllFeatures) {
    const details = {
        vHigh: veryHighDistinctivenessSummary(features),
        high: highDistinctivenessSummary(features),
        medium: mediumDistinctivenessSummary(features),
        low: lowDistinctivenessSummary(features),
    }

    return {
        details,
        vHighSatisfied: vHighUnitLosses(features) >= 0,
        highSatisfied: details.high.remainingLosses >= 0,
        mediumSatisfied: new Decimal(details.vHigh.unitsAvailableToOffsetDownwards)
            .plus(details.high.unitsAvailableToOffsetDownwards)
            .plus(details.medium.unitsAvailableToOffsetUpwards)
            .greaterThanOrEqualTo(0),
        lowSatisfied: details.low.cumulativeSurplus >= 0
    }
}

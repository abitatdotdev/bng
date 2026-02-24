import { Decimal } from "../decimal";
import { type AllFeatures } from "../features";
import { valuesByHedgerow } from "../groupings";
import { allHedgerows, type HedgerowLabel } from "../hedgerows";

function onSiteUnitChange(features: AllFeatures, label: HedgerowLabel) {
    const { netUnitChangeOnSite } = valuesByHedgerow(features)[label]!
    return netUnitChangeOnSite;
}

function offSiteUnitChange(features: AllFeatures, label: HedgerowLabel) {
    const { offSiteNetUnitChange } = valuesByHedgerow(features)[label]!
    return offSiteNetUnitChange;
}

function projectWideUnitChange(features: AllFeatures, label: HedgerowLabel) {
    const { overallUnitChange } = valuesByHedgerow(features)[label]!
    return overallUnitChange;
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
function unitsAvailableToOffsetDownwards(features: AllFeatures, label: HedgerowLabel) {
    const change = projectWideUnitChange(features, label);
    return change > 0 ? change : 0;
}


function unitsAvailableToOffsetUpwards(features: AllFeatures, label: HedgerowLabel) {
    const change = projectWideUnitChange(features, label);
    return change < 0 ? change : 0;
}

// This and unitsAvailableToOffsetUpwards are computationally the same things,
// though when you're at v.high distinctiveness there is nowhere to offset to upwards.
const remainingLosses = unitsAvailableToOffsetUpwards;

function veryHighDistinctivenessSummary(features: AllFeatures) {
    const labels = Object.values(allHedgerows)
        .filter(h => h.distinctivenessCategory === "V.High")
        .map(f => f.label);

    return {
        unitsAvailableToOffsetDownwards:
            labels
                .map(label => unitsAvailableToOffsetDownwards(features, label))
                .reduce((acc: number, num: number) => new Decimal(acc).plus(num).toNumber(), 0),
        remainingLosses:
            labels
                .map(label => remainingLosses(features, label))
                .reduce((acc: number, num: number) => new Decimal(acc).plus(num).toNumber(), 0),
    }
}

function highDistinctivenessSummary(features: AllFeatures) {
    const labels = Object.values(allHedgerows)
        .filter(h => h.distinctivenessCategory === "High")
        .map(f => f.label);

    const availableDownwards = labels
        .map(label => unitsAvailableToOffsetDownwards(features, label))
        .reduce((acc: number, num: number) => new Decimal(acc).plus(num).toNumber(), 0);
    const availableUpwards = labels
        .map(label => unitsAvailableToOffsetUpwards(features, label))
        .reduce((acc: number, num: number) => new Decimal(acc).plus(num).toNumber(), 0)

    const vHighAvailable = veryHighDistinctivenessSummary(features).unitsAvailableToOffsetDownwards;
    const surplusUnitsMinusDeficit = new Decimal(vHighAvailable).plus(availableUpwards).toNumber();

    return {
        unitsAvailableToOffsetDownwards: availableDownwards,
        unitsAvailableToOffsetUpwards: availableUpwards,
        surplusUnitsMinusDeficit,
    }
}

function mediumDistinctivenessSummary(features: AllFeatures) {
    const labels = Object.values(allHedgerows)
        .filter(h => h.distinctivenessCategory === "Medium")
        .map(f => f.label);

    const highAvailable = highDistinctivenessSummary(features).unitsAvailableToOffsetDownwards;
    const highSurplus = Decimal.max(highDistinctivenessSummary(features).surplusUnitsMinusDeficit, 0).toNumber();
    const unitsAvailableFromUpwards = new Decimal(highAvailable).plus(highSurplus).toNumber();

    const netChangeInUnits = labels.map(l => projectWideUnitChange(features, l)).reduce((sum: number, num: number) => new Decimal(sum).plus(num).toNumber(), 0);

    const cumulativeSurplus = new Decimal(netChangeInUnits).plus(unitsAvailableFromUpwards).toNumber();

    return {
        unitsAvailableToOffsetUpwards: unitsAvailableFromUpwards,
        netChangeInUnits,
        cumulativeSurplus,
    }
}

function lowDistinctivenessSummary(features: AllFeatures) {
    const labels = Object.values(allHedgerows)
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

function veryLowDistinctivenessSummary(features: AllFeatures) {
    const labels = Object.values(allHedgerows)
        .filter(h => h.distinctivenessCategory === "V.Low")
        .map(f => f.label);

    const netChangeInUnits = labels.map(l => projectWideUnitChange(features, l)).reduce((sum: number, num: number) => new Decimal(sum).plus(num).toNumber(), 0);

    const lowSurplus = lowDistinctivenessSummary(features).cumulativeSurplus;
    const cumulativeSurplus = lowSurplus > 0 ? new Decimal(netChangeInUnits).plus(lowSurplus).toNumber() : netChangeInUnits;

    return {
        netChangeInUnits,
        cumulativeSurplus,
    }
}

export function hedgerowTradingSummary(features: AllFeatures) {
    const details = {
        vHigh: veryHighDistinctivenessSummary(features),
        high: highDistinctivenessSummary(features),
        medium: mediumDistinctivenessSummary(features),
        low: lowDistinctivenessSummary(features),
        vLow: veryLowDistinctivenessSummary(features),
    }

    return {
        details,
        vHighSatisfied: details.vHigh.remainingLosses >= 0,
        highSatisfied: new Decimal(details.vHigh.unitsAvailableToOffsetDownwards)
            .plus(details.high.unitsAvailableToOffsetUpwards)
            .greaterThanOrEqualTo(0),
        mediumSatisfied: details.medium.cumulativeSurplus >= 0,
        lowSatisfied: details.low.cumulativeSurplus >= 0,
        vLowSatisfied: details.vLow.cumulativeSurplus >= 0,
    }
}

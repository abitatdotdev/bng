import type { DistinctivenessCategory } from "../distinctivenessCategories";
import { type AllFeatures } from "../features";
import { valuesByWatercourse } from "../groupings";
import { allWatercourses, type WatercourseLabel } from "../watercourses";

function onSiteUnitChange(features: AllFeatures, label: WatercourseLabel) {
    const { netUnitChangeOnSite } = valuesByWatercourse(features)[label]!
    return netUnitChangeOnSite;
}

function offSiteUnitChange(features: AllFeatures, label: WatercourseLabel) {
    const { offSiteNetUnitChange } = valuesByWatercourse(features)[label]!
    return offSiteNetUnitChange;
}

function projectWideUnitChange(features: AllFeatures, label: WatercourseLabel) {
    const { overallUnitChange } = valuesByWatercourse(features)[label]!
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
function unitsAvailableToOffsetDownwards(features: AllFeatures, label: WatercourseLabel) {
    const change = projectWideUnitChange(features, label);
    return change > 0 ? change : 0;
}


function unitsAvailableToOffsetUpwards(features: AllFeatures, label: WatercourseLabel) {
    const change = projectWideUnitChange(features, label);
    return change < 0 ? change : 0;
}

function labelsFor(distinctivenessCategory: DistinctivenessCategory) {
    return Object.values(allWatercourses)
        .filter(h => h.distinctivenessCategory === distinctivenessCategory)
        .map(f => f.label);
}

function veryHighDistinctivenessSummary(features: AllFeatures) {
    const labels = labelsFor("V.High");

    const remainingLosses = Math.min(
        labels
            .map(label => projectWideUnitChange(features, label))
            .reduce((acc, num) => acc + num, 0),
        0
    )

    return {
        unitsAvailableToOffsetDownwards:
            labels
                .map(label => unitsAvailableToOffsetDownwards(features, label))
                .reduce((acc, num) => acc + num, 0),
        remainingLosses,
    }
}

function highDistinctivenessSummary(features: AllFeatures) {
    const labels = labelsFor("High");
    const availableDownwards = Math.max(
        labels
            .map(label => projectWideUnitChange(features, label))
            .reduce((acc, num) => acc + num, 0),
        0
    )

    const remainingLosses =
        labels
            .map(label => projectWideUnitChange(features, label))
            .reduce((acc, num) => acc + num, 0)

    return {
        unitsAvailableToOffsetDownwards: availableDownwards,
        remainingLosses,
    }
}

function mediumDistinctivenessSummary(features: AllFeatures) {
    const labels = labelsFor("Medium");

    const availableDownwards = labels
        .map(label => unitsAvailableToOffsetDownwards(features, label))
        .reduce((acc, num) => acc + num, 0)

    const remainingLosses = labels
        .map(label => unitsAvailableToOffsetUpwards(features, label))
        .reduce((acc, num) => acc + num, 0)

    return {
        unitsAvailableToOffsetDownwards: availableDownwards,
        remainingLosses,
    }
}

function lowDistinctivenessSummary(features: AllFeatures) {
    const labels = labelsFor("Low");
    const netChangeInUnits = labels.map(l => projectWideUnitChange(features, l)).reduce((sum, num) => sum + num, 0);
    const cumulativeSurplus = (
        veryHighDistinctivenessSummary(features).unitsAvailableToOffsetDownwards
        + highDistinctivenessSummary(features).unitsAvailableToOffsetDownwards
        + mediumDistinctivenessSummary(features).unitsAvailableToOffsetDownwards
        + netChangeInUnits
    )

    return {
        netChangeInUnits,
        cumulativeSurplus,
    }
}

export function watercourseTradingSummary(features: AllFeatures) {
    const details = {
        vHigh: veryHighDistinctivenessSummary(features),
        high: highDistinctivenessSummary(features),
        medium: mediumDistinctivenessSummary(features),
        low: lowDistinctivenessSummary(features),
    }

    return {
        details,
        vHighSatisfied: labelsFor("V.High").map(l => projectWideUnitChange(features, l)).reduce((sum, num) => sum + num, 0) >= 0,
        highSatisfied: details.high.remainingLosses >= 0,
        mediumSatisfied: details.medium.remainingLosses >= 0,
        lowSatisfied: details.low.cumulativeSurplus >= 0,
    }
}

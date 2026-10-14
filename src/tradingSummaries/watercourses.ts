import { Decimal, type Quantity } from '../decimal';
import type { DistinctivenessCategory } from '../distinctivenessCategories';
import { type AllFeatures } from '../features';
import { valuesByWatercourse } from '../groupings';
import { allWatercourses, type WatercourseLabel } from '../watercourses';

const ZERO = new Decimal(0);
const sumD = (values: Quantity[]) => values.reduce<Decimal>((sum, value) => sum.plus(value), ZERO);
function projectWideUnitChange(features: AllFeatures, label: WatercourseLabel) {
    return valuesByWatercourse(features)[label]!.overallUnitChangeDecimal;
}
function unitsAvailableToOffsetDownwards(features: AllFeatures, label: WatercourseLabel) {
    const change = projectWideUnitChange(features, label);
    return change.gt(0) ? change : 0;
}
function unitsAvailableToOffsetUpwards(features: AllFeatures, label: WatercourseLabel) {
    const change = projectWideUnitChange(features, label);
    return change.lt(0) ? change : 0;
}
function labelsFor(category: DistinctivenessCategory) {
    return Object.values(allWatercourses)
        .filter((h) => h.distinctivenessCategory === category)
        .map((h) => h.label);
}

function veryHighDistinctivenessSummaryD(features: AllFeatures) {
    const labels = labelsFor('V.High');
    const netChange = sumD(labels.map((label) => projectWideUnitChange(features, label)));
    return {
        unitsAvailableToOffsetDownwards: sumD(
            labels.map((label) => unitsAvailableToOffsetDownwards(features, label)),
        ),
        remainingLosses: Decimal.min(netChange, ZERO),
    };
}
function highDistinctivenessSummaryD(features: AllFeatures) {
    const netChange = sumD(labelsFor('High').map((label) => projectWideUnitChange(features, label)));
    return { unitsAvailableToOffsetDownwards: Decimal.max(netChange, ZERO), remainingLosses: netChange };
}
function mediumDistinctivenessSummaryD(features: AllFeatures) {
    const labels = labelsFor('Medium');
    return {
        unitsAvailableToOffsetDownwards: sumD(
            labels.map((label) => unitsAvailableToOffsetDownwards(features, label)),
        ),
        remainingLosses: sumD(labels.map((label) => unitsAvailableToOffsetUpwards(features, label))),
    };
}
function lowDistinctivenessSummaryD(features: AllFeatures) {
    const netChangeInUnits = sumD(labelsFor('Low').map((label) => projectWideUnitChange(features, label)));
    const cumulativeSurplus = veryHighDistinctivenessSummaryD(features)
        .unitsAvailableToOffsetDownwards.plus(
            highDistinctivenessSummaryD(features).unitsAvailableToOffsetDownwards,
        )
        .plus(mediumDistinctivenessSummaryD(features).unitsAvailableToOffsetDownwards)
        .plus(netChangeInUnits);
    return { netChangeInUnits, cumulativeSurplus };
}

export function watercourseTradingSummary(features: AllFeatures) {
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
            remainingLosses: detailsD.medium.remainingLosses.toNumber(),
            remainingLossesDecimal: detailsD.medium.remainingLosses,
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
        vHighSatisfied: sumD(labelsFor('V.High').map((label) => projectWideUnitChange(features, label))).gte(
            0,
        ),
        highSatisfied: detailsD.high.remainingLosses.gte(0),
        mediumSatisfied: detailsD.medium.remainingLosses.gte(0),
        lowSatisfied: detailsD.low.cumulativeSurplus.gte(0),
    };
}

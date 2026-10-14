import { Decimal, type Quantity } from '../decimal';
import { type AllFeatures } from '../features';
import { valuesByHedgerow } from '../groupings';
import { allHedgerows, type HedgerowLabel } from '../hedgerows';

const ZERO = new Decimal(0);
const sumD = (values: Quantity[]) => values.reduce<Decimal>((sum, value) => sum.plus(value), ZERO);

function projectWideUnitChange(features: AllFeatures, label: HedgerowLabel) {
    return valuesByHedgerow(features)[label]!.overallUnitChangeDecimal;
}
function labelsFor(category: 'V.High' | 'High' | 'Medium' | 'Low' | 'V.Low') {
    return Object.values(allHedgerows)
        .filter((h) => h.distinctivenessCategory === category)
        .map((h) => h.label);
}
function unitsAvailableToOffsetDownwards(features: AllFeatures, label: HedgerowLabel) {
    const change = projectWideUnitChange(features, label);
    return change.gt(0) ? change : 0;
}
function unitsAvailableToOffsetUpwards(features: AllFeatures, label: HedgerowLabel) {
    const change = projectWideUnitChange(features, label);
    return change.lt(0) ? change : 0;
}
const remainingLosses = unitsAvailableToOffsetUpwards;

function veryHighDistinctivenessSummaryD(features: AllFeatures) {
    const labels = labelsFor('V.High');
    return {
        unitsAvailableToOffsetDownwards: sumD(
            labels.map((label) => unitsAvailableToOffsetDownwards(features, label)),
        ),
        remainingLosses: sumD(labels.map((label) => remainingLosses(features, label))),
    };
}
function highDistinctivenessSummaryD(features: AllFeatures) {
    const labels = labelsFor('High');
    const availableDownwards = sumD(labels.map((label) => unitsAvailableToOffsetDownwards(features, label)));
    const availableUpwards = sumD(labels.map((label) => unitsAvailableToOffsetUpwards(features, label)));
    return {
        unitsAvailableToOffsetDownwards: availableDownwards,
        unitsAvailableToOffsetUpwards: availableUpwards,
        surplusUnitsMinusDeficit:
            veryHighDistinctivenessSummaryD(features).unitsAvailableToOffsetDownwards.plus(availableUpwards),
    };
}
function mediumDistinctivenessSummaryD(features: AllFeatures) {
    const high = highDistinctivenessSummaryD(features);
    const unitsAvailableFromUpwards = high.unitsAvailableToOffsetDownwards.plus(
        Decimal.max(high.surplusUnitsMinusDeficit, ZERO),
    );
    const netChangeInUnits = sumD(labelsFor('Medium').map((label) => projectWideUnitChange(features, label)));
    return {
        unitsAvailableToOffsetUpwards: unitsAvailableFromUpwards,
        netChangeInUnits,
        cumulativeSurplus: netChangeInUnits.plus(unitsAvailableFromUpwards),
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
function veryLowDistinctivenessSummaryD(features: AllFeatures) {
    const netChangeInUnits = sumD(labelsFor('V.Low').map((label) => projectWideUnitChange(features, label)));
    const lowSurplus = lowDistinctivenessSummaryD(features).cumulativeSurplus;
    return {
        netChangeInUnits,
        cumulativeSurplus: lowSurplus.gt(0) ? netChangeInUnits.plus(lowSurplus) : netChangeInUnits,
    };
}

export function hedgerowTradingSummary(features: AllFeatures) {
    const detailsD = {
        vHigh: veryHighDistinctivenessSummaryD(features),
        high: highDistinctivenessSummaryD(features),
        medium: mediumDistinctivenessSummaryD(features),
        low: lowDistinctivenessSummaryD(features),
        vLow: veryLowDistinctivenessSummaryD(features),
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
            unitsAvailableToOffsetUpwards: detailsD.high.unitsAvailableToOffsetUpwards.toNumber(),
            unitsAvailableToOffsetUpwardsDecimal: detailsD.high.unitsAvailableToOffsetUpwards,
            surplusUnitsMinusDeficit: detailsD.high.surplusUnitsMinusDeficit.toNumber(),
            surplusUnitsMinusDeficitDecimal: detailsD.high.surplusUnitsMinusDeficit,
        },
        medium: {
            unitsAvailableToOffsetUpwards: detailsD.medium.unitsAvailableToOffsetUpwards.toNumber(),
            unitsAvailableToOffsetUpwardsDecimal: detailsD.medium.unitsAvailableToOffsetUpwards,
            netChangeInUnits: detailsD.medium.netChangeInUnits.toNumber(),
            netChangeInUnitsDecimal: detailsD.medium.netChangeInUnits,
            cumulativeSurplus: detailsD.medium.cumulativeSurplus.toNumber(),
            cumulativeSurplusDecimal: detailsD.medium.cumulativeSurplus,
        },
        low: {
            netChangeInUnits: detailsD.low.netChangeInUnits.toNumber(),
            netChangeInUnitsDecimal: detailsD.low.netChangeInUnits,
            cumulativeSurplus: detailsD.low.cumulativeSurplus.toNumber(),
            cumulativeSurplusDecimal: detailsD.low.cumulativeSurplus,
        },
        vLow: {
            netChangeInUnits: detailsD.vLow.netChangeInUnits.toNumber(),
            netChangeInUnitsDecimal: detailsD.vLow.netChangeInUnits,
            cumulativeSurplus: detailsD.vLow.cumulativeSurplus.toNumber(),
            cumulativeSurplusDecimal: detailsD.vLow.cumulativeSurplus,
        },
    };
    return {
        details,
        vHighSatisfied: detailsD.vHigh.remainingLosses.gte(0),
        highSatisfied: detailsD.vHigh.unitsAvailableToOffsetDownwards
            .plus(detailsD.high.unitsAvailableToOffsetUpwards)
            .gte(0),
        mediumSatisfied: detailsD.medium.cumulativeSurplus.gte(0),
        lowSatisfied: detailsD.low.cumulativeSurplus.gte(0),
        vLowSatisfied: detailsD.vLow.cumulativeSurplus.gte(0),
    };
}

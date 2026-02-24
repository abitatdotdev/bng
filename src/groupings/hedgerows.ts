import type { AllFeatures } from '../features';
import { allHedgerows, hedgerowByLabel, isHedgerow, type Hedgerow, type HedgerowLabel } from "../hedgerows";
import { Decimal } from '../decimal';

type ValuesByHedgerow = {
    [Label in HedgerowLabel]: {
        existingLengthBaselineOnSite: number,
        existingUnitsBaselineOnSite: number,
        existingLengthRetainedOnSite: number,
        existingUnitsRetainedOnSite: number,
        existingLengthLostOnSite: number,
        existingUnitsLostBaselineOnSite: number,
        proposedLengthCreationOnSitePostDevelopment: number,
        proposedUnitsCreationOnSitePostDevelopment: number,
        proposedLengthEnhancementOnSitePostDevelopment: number,
        proposedUnitsEnhancementOnSitePostDevelopment: number,
        totalProposedLengthOnSitePostDevelopment: number,
        totalProposedUnitsOnSitePostDevelopment: number,
        netLengthChangeOnSite: number,
        netUnitChangeOnSite: number,
        existingLengthOffSite: number,
        existingUnitsOffSite: number,
        retainedLengthOffSite: number,
        retainedUnitsOffSite: number,
        proposedLengthCreationOffSite: number,
        proposedUnitsCreationOffSite: number,
        proposedLengthEnhancementOffSite: number,
        proposedUnitsEnhancementOffSite: number,
        totalProposedLengthOffSite: number,
        totalProposedUnitsOffSite: number,
        offSiteNetLengthChange: number,
        offSiteNetUnitChange: number,
        overallLengthChange: number,
        overallUnitChange: number,
    }
}

export const valuesByHedgerow = (inputData: AllFeatures): ValuesByHedgerow => {
    const hedgerowLabels = Object.keys(allHedgerows) as HedgerowLabel[];
    return typeSafeObjectFromEntries(
        hedgerowLabels.map(label => {
            const hedgerow = hedgerowByLabel(label)!;

            return [
                label,
                {
                    existingLengthBaselineOnSite: calculateExistingLengthBaselineOnSite(inputData, hedgerow),
                    existingUnitsBaselineOnSite: calculateExistingUnitsBaselineOnSite(inputData, hedgerow),
                    existingLengthRetainedOnSite: calculateExistingLengthRetainedOnSite(inputData, hedgerow),
                    existingUnitsRetainedOnSite: calculateExistingUnitsRetainedOnSite(inputData, hedgerow),
                    existingLengthLostOnSite: calculateExistingLengthLostOnSite(inputData, hedgerow),
                    existingUnitsLostBaselineOnSite: calculateExistingUnitsLostBaselineOnSite(inputData, hedgerow),
                    proposedLengthCreationOnSitePostDevelopment: calculateProposedLengthCreationOnSitePostDevelopment(inputData, hedgerow),
                    proposedUnitsCreationOnSitePostDevelopment: calculateProposedUnitsCreationOnSitePostDevelopment(inputData, hedgerow),
                    proposedLengthEnhancementOnSitePostDevelopment: calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, hedgerow),
                    proposedUnitsEnhancementOnSitePostDevelopment: calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, hedgerow),
                    totalProposedLengthOnSitePostDevelopment: calculateTotalProposedLengthOnSitePostDevelopment(inputData, hedgerow),
                    totalProposedUnitsOnSitePostDevelopment: calculateTotalProposedUnitsOnSitePostDevelopment(inputData, hedgerow),
                    netLengthChangeOnSite: calculateNetLengthChangeOnSite(inputData, hedgerow),
                    netUnitChangeOnSite: calculateNetUnitChangeOnSite(inputData, hedgerow),
                    existingLengthOffSite: calculateExistingLengthOffSite(inputData, hedgerow),
                    existingUnitsOffSite: calculateExistingUnitsOffSite(inputData, hedgerow),
                    retainedLengthOffSite: calculateRetainedLengthOffSite(inputData, hedgerow),
                    retainedUnitsOffSite: calculateRetainedUnitsOffSite(inputData, hedgerow),
                    proposedLengthCreationOffSite: calculateProposedLengthCreationOffSite(inputData, hedgerow),
                    proposedUnitsCreationOffSite: calculateProposedUnitsCreationOffSite(inputData, hedgerow),
                    proposedLengthEnhancementOffSite: calculateProposedLengthEnhancementOffSite(inputData, hedgerow),
                    proposedUnitsEnhancementOffSite: calculateProposedUnitsEnhancementOffSite(inputData, hedgerow),
                    totalProposedLengthOffSite: calculateTotalProposedLengthOffSite(inputData, hedgerow),
                    totalProposedUnitsOffSite: calculateTotalProposedUnitsOffSite(inputData, hedgerow),
                    offSiteNetLengthChange: calculateOffSiteNetLengthChange(inputData, hedgerow),
                    offSiteNetUnitChange: calculateOffSiteNetUnitChange(inputData, hedgerow),
                    overallLengthChange: calculateOverallLengthChange(inputData, hedgerow),
                    overallUnitChange: calculateOverallUnitChange(inputData, hedgerow),
                },
            ]
        }))
}

function calculateExistingLengthBaselineOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.length).toNumber(), 0);
}
function calculateExistingUnitsBaselineOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.totalHedgerowUnits).toNumber(), 0);
}
function calculateExistingLengthRetainedOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.lengthRetained).toNumber(), 0);
}
function calculateExistingUnitsRetainedOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.unitsRetained).toNumber(), 0);
}
function calculateExistingLengthLostOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.lengthLost).toNumber(), 0);
}
function calculateExistingUnitsLostBaselineOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.unitsLost).toNumber(), 0);
}
function calculateProposedLengthCreationOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowCreations
        .filter(creation => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => new Decimal(sum).plus(creation.length).toNumber(), 0);
}
function calculateProposedUnitsCreationOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowCreations
        .filter(creation => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => new Decimal(sum).plus(creation.hedgerowUnitsDelivered).toNumber(), 0);
}
function calculateProposedLengthEnhancementOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowEnhancements
        .filter(enhancement => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => new Decimal(sum).plus(enhancement.length).toNumber(), 0);
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowEnhancements
        .filter(enhancement => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => new Decimal(sum).plus(enhancement.hedgerowUnitsDelivered).toNumber(), 0);
}
function calculateTotalProposedLengthOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateExistingLengthRetainedOnSite(inputData, hedgerow))
        .plus(calculateProposedLengthCreationOnSitePostDevelopment(inputData, hedgerow))
        .plus(calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, hedgerow))
        .toNumber();
}
function calculateTotalProposedUnitsOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateExistingUnitsRetainedOnSite(inputData, hedgerow))
        .plus(calculateProposedUnitsCreationOnSitePostDevelopment(inputData, hedgerow))
        .plus(calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, hedgerow))
        .toNumber();
}
function calculateNetLengthChangeOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateTotalProposedLengthOnSitePostDevelopment(inputData, hedgerow))
        .minus(calculateExistingLengthBaselineOnSite(inputData, hedgerow))
        .toNumber();
}
function calculateNetUnitChangeOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateTotalProposedUnitsOnSitePostDevelopment(inputData, hedgerow))
        .minus(calculateExistingUnitsBaselineOnSite(inputData, hedgerow))
        .toNumber();
}
function calculateExistingLengthOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.length).toNumber(), 0);
}
function calculateExistingUnitsOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.totalHedgerowUnits).toNumber(), 0);
}
function calculateRetainedLengthOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.lengthRetained).toNumber(), 0);
}
function calculateRetainedUnitsOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.unitsRetained).toNumber(), 0);
}
function calculateProposedLengthCreationOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowCreations
        .filter(creation => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => new Decimal(sum).plus(creation.length).toNumber(), 0);
}
function calculateProposedUnitsCreationOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowCreations
        .filter(creation => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => new Decimal(sum).plus(creation.hedgerowUnitsDelivered).toNumber(), 0);
}
function calculateProposedLengthEnhancementOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowEnhancements
        .filter(enhancement => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => new Decimal(sum).plus(enhancement.length).toNumber(), 0);
}
function calculateProposedUnitsEnhancementOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowEnhancements
        .filter(enhancement => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => new Decimal(sum).plus(enhancement.hedgerowUnitsDelivered).toNumber(), 0);
}
function calculateTotalProposedLengthOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateRetainedLengthOffSite(inputData, hedgerow))
        .plus(calculateProposedLengthCreationOffSite(inputData, hedgerow))
        .plus(calculateProposedLengthEnhancementOffSite(inputData, hedgerow))
        .toNumber();
}
function calculateTotalProposedUnitsOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateRetainedUnitsOffSite(inputData, hedgerow))
        .plus(calculateProposedUnitsCreationOffSite(inputData, hedgerow))
        .plus(calculateProposedUnitsEnhancementOffSite(inputData, hedgerow))
        .toNumber();
}
function calculateOffSiteNetLengthChange(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateTotalProposedLengthOffSite(inputData, hedgerow))
        .minus(calculateExistingLengthOffSite(inputData, hedgerow))
        .toNumber();
}
function calculateOffSiteNetUnitChange(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateTotalProposedUnitsOffSite(inputData, hedgerow))
        .minus(calculateExistingUnitsOffSite(inputData, hedgerow))
        .toNumber();
}
function calculateOverallLengthChange(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateNetLengthChangeOnSite(inputData, hedgerow))
        .plus(calculateOffSiteNetLengthChange(inputData, hedgerow))
        .toNumber();
}
function calculateOverallUnitChange(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return new Decimal(calculateNetUnitChangeOnSite(inputData, hedgerow))
        .plus(calculateOffSiteNetUnitChange(inputData, hedgerow))
        .toNumber();
}

// from https://stackoverflow.com/questions/69019873/how-can-i-get-typed-object-entries-and-object-fromentries-in-typescript
const typeSafeObjectFromEntries = <
    const T extends ReadonlyArray<readonly [PropertyKey, unknown]>
>(
    entries: T
): { [K in T[number]as K[0]]: K[1] } => {
    return Object.fromEntries(entries) as { [K in T[number]as K[0]]: K[1] };
};

import type { AllFeatures } from '../features';
import { allHedgerows, hedgerowByLabel, isHedgerow, type Hedgerow, type HedgerowLabel } from "../hedgerows";

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
        .reduce((sum, baseline) => sum + baseline.length, 0);
}
function calculateExistingUnitsBaselineOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.totalHedgerowUnits, 0);
}
function calculateExistingLengthRetainedOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.lengthRetained, 0);
}
function calculateExistingUnitsRetainedOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.unitsRetained, 0);
}
function calculateExistingLengthLostOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.lengthLost, 0);
}
function calculateExistingUnitsLostBaselineOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.unitsLost, 0);
}
function calculateProposedLengthCreationOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowCreations
        .filter(creation => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => sum + creation.length, 0);
}
function calculateProposedUnitsCreationOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowCreations
        .filter(creation => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => sum + creation.hedgerowUnitsDelivered, 0);
}
function calculateProposedLengthEnhancementOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowEnhancements
        .filter(enhancement => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => sum + enhancement.length, 0);
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .onSiteHedgerowEnhancements
        .filter(enhancement => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => sum + enhancement.hedgerowUnitsDelivered, 0);
}
function calculateTotalProposedLengthOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return (
        calculateExistingLengthRetainedOnSite(inputData, hedgerow)
        + calculateProposedLengthCreationOnSitePostDevelopment(inputData, hedgerow)
        + calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, hedgerow)
    );
}
function calculateTotalProposedUnitsOnSitePostDevelopment(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return (
        calculateExistingUnitsRetainedOnSite(inputData, hedgerow)
        + calculateProposedUnitsCreationOnSitePostDevelopment(inputData, hedgerow)
        + calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, hedgerow)
    );
}
function calculateNetLengthChangeOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return (
        calculateTotalProposedLengthOnSitePostDevelopment(inputData, hedgerow)
        - calculateExistingLengthBaselineOnSite(inputData, hedgerow)
    )
}
function calculateNetUnitChangeOnSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return (
        calculateTotalProposedUnitsOnSitePostDevelopment(inputData, hedgerow)
        - calculateExistingUnitsBaselineOnSite(inputData, hedgerow)
    )
}
function calculateExistingLengthOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.length, 0);
}
function calculateExistingUnitsOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.totalHedgerowUnits, 0);
}
function calculateRetainedLengthOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.lengthRetained, 0);
}
function calculateRetainedUnitsOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.unitsRetained, 0);
}
function calculateProposedLengthCreationOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.lengthLost, 0);
}
function calculateProposedUnitsCreationOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowBaselines
        .filter(baseline => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum + baseline.unitsLost, 0);
}
function calculateProposedLengthEnhancementOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowCreations
        .filter(creation => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => sum + creation.length, 0);
}
function calculateProposedUnitsEnhancementOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowCreations
        .filter(creation => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => sum + creation.hedgerowUnitsDelivered, 0);
}
function calculateTotalProposedLengthOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowEnhancements
        .filter(enhancement => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => sum + enhancement.length, 0);
}
function calculateTotalProposedUnitsOffSite(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return inputData
        .offSiteHedgerowEnhancements
        .filter(enhancement => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => sum + enhancement.hedgerowUnitsDelivered, 0);
}
function calculateOffSiteNetLengthChange(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return (
        calculateTotalProposedLengthOffSite(inputData, hedgerow)
        - calculateExistingLengthOffSite(inputData, hedgerow)
    );
}
function calculateOffSiteNetUnitChange(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return (
        calculateTotalProposedUnitsOffSite(inputData, hedgerow)
        - calculateExistingUnitsOffSite(inputData, hedgerow)
    )
}
function calculateOverallLengthChange(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return (
        calculateNetLengthChangeOnSite(inputData, hedgerow)
        + calculateOffSiteNetLengthChange(inputData, hedgerow)
    )
}
function calculateOverallUnitChange(inputData: AllFeatures, hedgerow: Hedgerow): number {
    return (
        calculateNetUnitChangeOnSite(inputData, hedgerow)
        + calculateOffSiteNetUnitChange(inputData, hedgerow)
    )
}

// from https://stackoverflow.com/questions/69019873/how-can-i-get-typed-object-entries-and-object-fromentries-in-typescript
const typeSafeObjectFromEntries = <
    const T extends ReadonlyArray<readonly [PropertyKey, unknown]>
>(
    entries: T
): { [K in T[number]as K[0]]: K[1] } => {
    return Object.fromEntries(entries) as { [K in T[number]as K[0]]: K[1] };
};

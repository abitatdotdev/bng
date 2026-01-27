import type { HeadlineResultsInput } from "../headlineResults"
import { allWatercourses, watercourseByLabel, isWatercourse, type Watercourse, type WatercourseLabel } from "../watercourses";

type ValuesByWatercourse = {
    [Label in WatercourseLabel]: {
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

export const valuesByWatercourse = (inputData: HeadlineResultsInput): ValuesByWatercourse => {
    const watercourseLabels = Object.keys(allWatercourses) as WatercourseLabel[];
    return typeSafeObjectFromEntries(
        watercourseLabels.map(label => {
            const watercourse = watercourseByLabel(label)!;

            return [
                label,
                {
                    existingLengthBaselineOnSite: calculateExistingLengthBaselineOnSite(inputData, watercourse),
                    existingUnitsBaselineOnSite: calculateExistingUnitsBaselineOnSite(inputData, watercourse),
                    existingLengthRetainedOnSite: calculateExistingLengthRetainedOnSite(inputData, watercourse),
                    existingUnitsRetainedOnSite: calculateExistingUnitsRetainedOnSite(inputData, watercourse),
                    existingLengthLostOnSite: calculateExistingLengthLostOnSite(inputData, watercourse),
                    existingUnitsLostBaselineOnSite: calculateExistingUnitsLostBaselineOnSite(inputData, watercourse),
                    proposedLengthCreationOnSitePostDevelopment: calculateProposedLengthCreationOnSitePostDevelopment(inputData, watercourse),
                    proposedUnitsCreationOnSitePostDevelopment: calculateProposedUnitsCreationOnSitePostDevelopment(inputData, watercourse),
                    proposedLengthEnhancementOnSitePostDevelopment: calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, watercourse),
                    proposedUnitsEnhancementOnSitePostDevelopment: calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, watercourse),
                    totalProposedLengthOnSitePostDevelopment: calculateTotalProposedLengthOnSitePostDevelopment(inputData, watercourse),
                    totalProposedUnitsOnSitePostDevelopment: calculateTotalProposedUnitsOnSitePostDevelopment(inputData, watercourse),
                    netLengthChangeOnSite: calculateNetLengthChangeOnSite(inputData, watercourse),
                    netUnitChangeOnSite: calculateNetUnitChangeOnSite(inputData, watercourse),
                    existingLengthOffSite: calculateExistingLengthOffSite(inputData, watercourse),
                    existingUnitsOffSite: calculateExistingUnitsOffSite(inputData, watercourse),
                    retainedLengthOffSite: calculateRetainedLengthOffSite(inputData, watercourse),
                    retainedUnitsOffSite: calculateRetainedUnitsOffSite(inputData, watercourse),
                    proposedLengthCreationOffSite: calculateProposedLengthCreationOffSite(inputData, watercourse),
                    proposedUnitsCreationOffSite: calculateProposedUnitsCreationOffSite(inputData, watercourse),
                    proposedLengthEnhancementOffSite: calculateProposedLengthEnhancementOffSite(inputData, watercourse),
                    proposedUnitsEnhancementOffSite: calculateProposedUnitsEnhancementOffSite(inputData, watercourse),
                    totalProposedLengthOffSite: calculateTotalProposedLengthOffSite(inputData, watercourse),
                    totalProposedUnitsOffSite: calculateTotalProposedUnitsOffSite(inputData, watercourse),
                    offSiteNetLengthChange: calculateOffSiteNetLengthChange(inputData, watercourse),
                    offSiteNetUnitChange: calculateOffSiteNetUnitChange(inputData, watercourse),
                    overallLengthChange: calculateOverallLengthChange(inputData, watercourse),
                    overallUnitChange: calculateOverallUnitChange(inputData, watercourse),
                },
            ]
        }))
}

function calculateExistingLengthBaselineOnSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.length, 0);
}
function calculateExistingUnitsBaselineOnSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.totalWatercourseUnits, 0);
}
function calculateExistingLengthRetainedOnSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.lengthRetained, 0);
}
function calculateExistingUnitsRetainedOnSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.unitsRetained, 0);
}
function calculateExistingLengthLostOnSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.lengthLost, 0);
}
function calculateExistingUnitsLostBaselineOnSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.unitsLost, 0);
}
function calculateProposedLengthCreationOnSitePostDevelopment(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseCreations
        .filter(creation => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum + creation.length, 0);
}
function calculateProposedUnitsCreationOnSitePostDevelopment(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseCreations
        .filter(creation => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum + creation.unitsDelivered, 0);
}
function calculateProposedLengthEnhancementOnSitePostDevelopment(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseEnhancements
        .filter(enhancement => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum + enhancement.length, 0);
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseEnhancements
        .filter(enhancement => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum + enhancement.watercourseUnitsDelivered, 0);
}
function calculateTotalProposedLengthOnSitePostDevelopment(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return (
        calculateExistingLengthRetainedOnSite(inputData, watercourse)
        + calculateProposedLengthCreationOnSitePostDevelopment(inputData, watercourse)
        + calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, watercourse)
    );
}
function calculateTotalProposedUnitsOnSitePostDevelopment(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return (
        calculateExistingUnitsRetainedOnSite(inputData, watercourse)
        + calculateProposedUnitsCreationOnSitePostDevelopment(inputData, watercourse)
        + calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, watercourse)
    );
}
function calculateNetLengthChangeOnSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return (
        calculateTotalProposedLengthOnSitePostDevelopment(inputData, watercourse)
        - calculateExistingLengthBaselineOnSite(inputData, watercourse)
    )
}
function calculateNetUnitChangeOnSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return (
        calculateTotalProposedUnitsOnSitePostDevelopment(inputData, watercourse)
        - calculateExistingUnitsBaselineOnSite(inputData, watercourse)
    )
}
function calculateExistingLengthOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.length, 0);
}
function calculateExistingUnitsOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.totalWatercourseUnits, 0);
}
function calculateRetainedLengthOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.lengthRetained, 0);
}
function calculateRetainedUnitsOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.unitsRetained, 0);
}
function calculateProposedLengthCreationOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.lengthLost, 0);
}
function calculateProposedUnitsCreationOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum + baseline.unitsLost, 0);
}
function calculateProposedLengthEnhancementOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseCreations
        .filter(creation => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum + creation.length, 0);
}
function calculateProposedUnitsEnhancementOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseCreations
        .filter(creation => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum + creation.unitsDelivered, 0);
}
function calculateTotalProposedLengthOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseEnhancements
        .filter(enhancement => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum + enhancement.length, 0);
}
function calculateTotalProposedUnitsOffSite(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseEnhancements
        .filter(enhancement => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum + enhancement.watercourseUnitsDelivered, 0);
}
function calculateOffSiteNetLengthChange(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return (
        calculateTotalProposedLengthOffSite(inputData, watercourse)
        - calculateExistingLengthOffSite(inputData, watercourse)
    );
}
function calculateOffSiteNetUnitChange(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return (
        calculateTotalProposedUnitsOffSite(inputData, watercourse)
        - calculateExistingUnitsOffSite(inputData, watercourse)
    )
}
function calculateOverallLengthChange(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return (
        calculateNetLengthChangeOnSite(inputData, watercourse)
        + calculateOffSiteNetLengthChange(inputData, watercourse)
    )
}
function calculateOverallUnitChange(inputData: HeadlineResultsInput, watercourse: Watercourse): number {
    return (
        calculateNetUnitChangeOnSite(inputData, watercourse)
        + calculateOffSiteNetUnitChange(inputData, watercourse)
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

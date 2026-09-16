import type { AllFeatures } from '../features';
import { allWatercourses, watercourseByLabel, isWatercourse, type Watercourse, type WatercourseLabel } from "../watercourses";
import { Decimal } from '../decimal';

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

const watercourseLabels = Object.keys(allWatercourses) as WatercourseLabel[];
const ZERO = new Decimal(0);

const valuesByWatercourseCache = new WeakMap<AllFeatures, ValuesByWatercourse>();

/**
 * Calculate values per watercourse type.
 * NOTE: input data must not be mutated - results are cached per input object identity.
 */
export const valuesByWatercourse = (inputData: AllFeatures): ValuesByWatercourse => {
    const cached = valuesByWatercourseCache.get(inputData);
    if (cached) return cached;

    const results = typeSafeObjectFromEntries(
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

    valuesByWatercourseCache.set(inputData, results);
    return results;
}

function calculateExistingLengthBaselineOnSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.length), ZERO).toNumber();
}
function calculateExistingUnitsBaselineOnSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.totalWatercourseUnits), ZERO).toNumber();
}
function calculateExistingLengthRetainedOnSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.lengthRetained), ZERO).toNumber();
}
function calculateExistingUnitsRetainedOnSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.unitsRetained), ZERO).toNumber();
}
function calculateExistingLengthLostOnSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.lengthLost), ZERO).toNumber();
}
function calculateExistingUnitsLostBaselineOnSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.unitsLost), ZERO).toNumber();
}
function calculateProposedLengthCreationOnSitePostDevelopment(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseCreations
        .filter(creation => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum.plus(creation.length), ZERO).toNumber();
}
function calculateProposedUnitsCreationOnSitePostDevelopment(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseCreations
        .filter(creation => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum.plus(creation.unitsDelivered), ZERO).toNumber();
}
function calculateProposedLengthEnhancementOnSitePostDevelopment(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseEnhancements
        .filter(enhancement => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum.plus(enhancement.length), ZERO).toNumber();
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .onSiteWatercourseEnhancements
        .filter(enhancement => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum.plus(enhancement.watercourseUnitsDelivered), ZERO).toNumber();
}
function calculateTotalProposedLengthOnSitePostDevelopment(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateExistingLengthRetainedOnSite(inputData, watercourse))
        .plus(calculateProposedLengthCreationOnSitePostDevelopment(inputData, watercourse))
        .plus(calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, watercourse))
        .toNumber();
}
function calculateTotalProposedUnitsOnSitePostDevelopment(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateExistingUnitsRetainedOnSite(inputData, watercourse))
        .plus(calculateProposedUnitsCreationOnSitePostDevelopment(inputData, watercourse))
        .plus(calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, watercourse))
        .toNumber();
}
function calculateNetLengthChangeOnSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateTotalProposedLengthOnSitePostDevelopment(inputData, watercourse))
        .minus(calculateExistingLengthBaselineOnSite(inputData, watercourse))
        .toNumber();
}
function calculateNetUnitChangeOnSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateTotalProposedUnitsOnSitePostDevelopment(inputData, watercourse))
        .minus(calculateExistingUnitsBaselineOnSite(inputData, watercourse))
        .toNumber();
}
function calculateExistingLengthOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.length), ZERO).toNumber();
}
function calculateExistingUnitsOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.totalWatercourseUnits), ZERO).toNumber();
}
function calculateRetainedLengthOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.lengthRetained), ZERO).toNumber();
}
function calculateRetainedUnitsOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseBaselines
        .filter(baseline => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.unitsRetained), ZERO).toNumber();
}
function calculateProposedLengthCreationOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseCreations
        .filter(creation => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum.plus(creation.length), ZERO).toNumber();
}
function calculateProposedUnitsCreationOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseCreations
        .filter(creation => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum.plus(creation.unitsDelivered), ZERO).toNumber();
}
function calculateProposedLengthEnhancementOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseEnhancements
        .filter(enhancement => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum.plus(enhancement.length), ZERO).toNumber();
}
function calculateProposedUnitsEnhancementOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return inputData
        .offSiteWatercourseEnhancements
        .filter(enhancement => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum.plus(enhancement.watercourseUnitsDelivered), ZERO).toNumber();
}
function calculateTotalProposedLengthOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateRetainedLengthOffSite(inputData, watercourse))
        .plus(calculateProposedLengthCreationOffSite(inputData, watercourse))
        .plus(calculateProposedLengthEnhancementOffSite(inputData, watercourse))
        .toNumber();
}
function calculateTotalProposedUnitsOffSite(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateRetainedUnitsOffSite(inputData, watercourse))
        .plus(calculateProposedUnitsCreationOffSite(inputData, watercourse))
        .plus(calculateProposedUnitsEnhancementOffSite(inputData, watercourse))
        .toNumber();
}
function calculateOffSiteNetLengthChange(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateTotalProposedLengthOffSite(inputData, watercourse))
        .minus(calculateExistingLengthOffSite(inputData, watercourse))
        .toNumber();
}
function calculateOffSiteNetUnitChange(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateTotalProposedUnitsOffSite(inputData, watercourse))
        .minus(calculateExistingUnitsOffSite(inputData, watercourse))
        .toNumber();
}
function calculateOverallLengthChange(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateNetLengthChangeOnSite(inputData, watercourse))
        .plus(calculateOffSiteNetLengthChange(inputData, watercourse))
        .toNumber();
}
function calculateOverallUnitChange(inputData: AllFeatures, watercourse: Watercourse): number {
    return new Decimal(calculateNetUnitChangeOnSite(inputData, watercourse))
        .plus(calculateOffSiteNetUnitChange(inputData, watercourse))
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

import type { AllFeatures } from '../features';
import { allHabitats, habitatByLabel, isHabitat, type Habitat, type HabitatLabel } from "../habitats"
import { Decimal } from '../decimal';

type ValuesByHabitat = {
    [Label in HabitatLabel]: {
        existingAreaBaselineOnSite: number,
        existingUnitsBaselineOnSite: number,
        existingAreaRetainedOnSite: number,
        existingUnitsRetainedOnSite: number,
        existingAreaLostOnSite: number,
        existingUnitsLostBaselineOnSite: number,
        proposedAreaCreationOnSitePostDevelopment: number,
        proposedUnitsCreationOnSitePostDevelopment: number,
        proposedAreaEnhancementOnSitePostDevelopment: number,
        proposedUnitsEnhancementOnSitePostDevelopment: number,
        totalProposedAreaOnSitePostDevelopment: number,
        totalProposedUnitsOnSitePostDevelopment: number,
        netAreaChangeOnSite: number,
        netUnitChangeOnSite: number,
        existingAreaOffSite: number,
        existingUnitsOffSite: number,
        retainedAreaOffSite: number,
        retainedUnitsOffSite: number,
        proposedAreaCreationOffSite: number,
        proposedUnitsCreationOffSite: number,
        proposedAreaEnhancementOffSite: number,
        proposedUnitsEnhancementOffSite: number,
        totalProposedAreaOffSite: number,
        totalProposedUnitsOffSite: number,
        offSiteNetAreaChange: number,
        offSiteNetUnitChange: number,
        overallAreaChange: number,
        overallUnitChange: number,
        // from distinctiveness groupings
        // column BE
        unitChangeIncludingOffSite: number,
        // column BF
        unitsRequiredOffSite: number,
    }
}

const habitatLabels = Object.keys(allHabitats) as HabitatLabel[];

const valuesByHabitatCache = new WeakMap<AllFeatures, ValuesByHabitat>();

/**
    * Calculate values per habitat type.
    * NOTE: input data must not be mutated - results are cached per input object identity.
    */
export const valuesByHabitat = (inputData: AllFeatures): ValuesByHabitat => {
    const cached = valuesByHabitatCache.get(inputData);
    if (cached) return cached;

    const results = typeSafeObjectFromEntries(
        habitatLabels.map(label => {
            const habitat = habitatByLabel(label)!;

            return [
                label,
                {
                    existingAreaBaselineOnSite: calculateExistingAreaBaselineOnSite(inputData, habitat),
                    existingUnitsBaselineOnSite: calculateExistingUnitsBaselineOnSite(inputData, habitat),
                    existingAreaRetainedOnSite: calculateExistingAreaRetainedOnSite(inputData, habitat),
                    existingUnitsRetainedOnSite: calculateExistingUnitsRetainedOnSite(inputData, habitat),
                    existingAreaLostOnSite: calculateExistingAreaLostOnSite(inputData, habitat),
                    existingUnitsLostBaselineOnSite: calculateExistingUnitsLostBaselineOnSite(inputData, habitat),
                    proposedAreaCreationOnSitePostDevelopment: calculateProposedAreaCreationOnSitePostDevelopment(inputData, habitat),
                    proposedUnitsCreationOnSitePostDevelopment: calculateProposedUnitsCreationOnSitePostDevelopment(inputData, habitat),
                    proposedAreaEnhancementOnSitePostDevelopment: calculateProposedAreaEnhancementOnSitePostDevelopment(inputData, habitat),
                    proposedUnitsEnhancementOnSitePostDevelopment: calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, habitat),
                    totalProposedAreaOnSitePostDevelopment: calculateTotalProposedAreaOnSitePostDevelopment(inputData, habitat),
                    totalProposedUnitsOnSitePostDevelopment: calculateTotalProposedUnitsOnSitePostDevelopment(inputData, habitat),
                    netAreaChangeOnSite: calculateNetAreaChangeOnSite(inputData, habitat),
                    netUnitChangeOnSite: calculateNetUnitChangeOnSite(inputData, habitat),
                    existingAreaOffSite: calculateExistingAreaOffSite(inputData, habitat),
                    existingUnitsOffSite: calculateExistingUnitsOffSite(inputData, habitat),
                    retainedAreaOffSite: calculateRetainedAreaOffSite(inputData, habitat),
                    retainedUnitsOffSite: calculateRetainedUnitsOffSite(inputData, habitat),
                    proposedAreaCreationOffSite: calculateProposedAreaCreationOffSite(inputData, habitat),
                    proposedUnitsCreationOffSite: calculateProposedUnitsCreationOffSite(inputData, habitat),
                    proposedAreaEnhancementOffSite: calculateProposedAreaEnhancementOffSite(inputData, habitat),
                    proposedUnitsEnhancementOffSite: calculateProposedUnitsEnhancementOffSite(inputData, habitat),
                    totalProposedAreaOffSite: calculateTotalProposedAreaOffSite(inputData, habitat),
                    totalProposedUnitsOffSite: calculateTotalProposedUnitsOffSite(inputData, habitat),
                    offSiteNetAreaChange: calculateOffSiteNetAreaChange(inputData, habitat),
                    offSiteNetUnitChange: calculateOffSiteNetUnitChange(inputData, habitat),
                    overallAreaChange: calculateOverallAreaChange(inputData, habitat),
                    overallUnitChange: calculateOverallUnitChange(inputData, habitat),
                    unitChangeIncludingOffSite: calculateUnitChangeIncludingOffSite(inputData, habitat),
                    unitsRequiredOffSite: calculateUnitsRequiredOffSite(inputData, habitat),
                },
            ]
        }))

    valuesByHabitatCache.set(inputData, results);
    return results;
}

function calculateExistingAreaBaselineOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.area).toNumber(), 0);
}
function calculateExistingUnitsBaselineOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.totalHabitatUnits).toNumber(), 0);
}
function calculateExistingAreaRetainedOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.areaRetained).toNumber(), 0);
}
function calculateExistingUnitsRetainedOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.baselineUnitsRetained).plus(baseline.vhdhBespokeCompensationUnits).toNumber(), 0);
}
function calculateExistingAreaLostOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.areaHabitatLost).toNumber(), 0);
}
function calculateExistingUnitsLostBaselineOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.unitsLost).toNumber(), 0);
}
function calculateProposedAreaCreationOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => new Decimal(sum).plus(creation.area).toNumber(), 0);
}
function calculateProposedUnitsCreationOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => new Decimal(sum).plus(creation.habitatUnitsDelivered).toNumber(), 0);
}
function calculateProposedAreaEnhancementOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => new Decimal(sum).plus(enhancement.area).toNumber(), 0);
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => new Decimal(sum).plus(enhancement.habitatUnitsDelivered).toNumber(), 0);
}
function calculateTotalProposedAreaOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateExistingAreaRetainedOnSite(inputData, habitat))
        .plus(calculateProposedAreaCreationOnSitePostDevelopment(inputData, habitat))
        .plus(calculateProposedAreaEnhancementOnSitePostDevelopment(inputData, habitat))
        .toNumber();
}
function calculateTotalProposedUnitsOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateExistingUnitsRetainedOnSite(inputData, habitat))
        .plus(calculateProposedUnitsCreationOnSitePostDevelopment(inputData, habitat))
        .plus(calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, habitat))
        .toNumber();
}
function calculateNetAreaChangeOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateTotalProposedAreaOnSitePostDevelopment(inputData, habitat))
        .minus(calculateExistingAreaBaselineOnSite(inputData, habitat))
        .toNumber();
}
function calculateNetUnitChangeOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateTotalProposedUnitsOnSitePostDevelopment(inputData, habitat))
        .minus(calculateExistingUnitsBaselineOnSite(inputData, habitat))
        .toNumber();
}
function calculateExistingAreaOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.area).toNumber(), 0);
}
function calculateExistingUnitsOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.totalHabitatUnits).toNumber(), 0);
}
function calculateRetainedAreaOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.areaRetained).toNumber(), 0);
}
function calculateRetainedUnitsOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => new Decimal(sum).plus(baseline.baselineUnitsRetained).plus(baseline.vhdhBespokeCompensationUnits).toNumber(), 0);
}
function calculateProposedAreaCreationOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => new Decimal(sum).plus(creation.area).toNumber(), 0);
}
function calculateProposedUnitsCreationOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => new Decimal(sum).plus(creation.habitatUnitsDelivered).toNumber(), 0);
}
function calculateProposedAreaEnhancementOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => new Decimal(sum).plus(enhancement.area).toNumber(), 0);
}
function calculateProposedUnitsEnhancementOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => new Decimal(sum).plus(enhancement.habitatUnitsDelivered).toNumber(), 0);
}
function calculateTotalProposedAreaOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateRetainedAreaOffSite(inputData, habitat))
        .plus(calculateProposedAreaCreationOffSite(inputData, habitat))
        .plus(calculateProposedAreaEnhancementOffSite(inputData, habitat))
        .toNumber();
}
function calculateTotalProposedUnitsOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateRetainedUnitsOffSite(inputData, habitat))
        .plus(calculateProposedUnitsCreationOffSite(inputData, habitat))
        .plus(calculateProposedUnitsEnhancementOffSite(inputData, habitat))
        .toNumber();
}
function calculateOffSiteNetAreaChange(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateTotalProposedAreaOffSite(inputData, habitat))
        .minus(calculateExistingAreaOffSite(inputData, habitat))
        .toNumber();
}
function calculateOffSiteNetUnitChange(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateTotalProposedUnitsOffSite(inputData, habitat))
        .minus(calculateExistingUnitsOffSite(inputData, habitat))
        .toNumber();
}
function calculateOverallAreaChange(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateNetAreaChangeOnSite(inputData, habitat))
        .plus(calculateOffSiteNetAreaChange(inputData, habitat))
        .toNumber();
}
function calculateOverallUnitChange(inputData: AllFeatures, habitat: Habitat): number {
    return new Decimal(calculateNetUnitChangeOnSite(inputData, habitat))
        .plus(calculateOffSiteNetUnitChange(inputData, habitat))
        .toNumber();
}

/** This seems the same as calculateOverallUnitChange in calculation, but we follow the sheet for now */
function calculateUnitChangeIncludingOffSite(inputData: AllFeatures, habitat: Habitat): any {
    return new Decimal(calculateNetUnitChangeOnSite(inputData, habitat))
        .plus(calculateOffSiteNetUnitChange(inputData, habitat))
        .toNumber();
}

function calculateUnitsRequiredOffSite(inputData: AllFeatures, habitat: Habitat): any {
    const unitChange = calculateUnitChangeIncludingOffSite(inputData, habitat)
    return unitChange < 0 ? unitChange : 0;
}


// from https://stackoverflow.com/questions/69019873/how-can-i-get-typed-object-entries-and-object-fromentries-in-typescript
const typeSafeObjectFromEntries = <
    const T extends ReadonlyArray<readonly [PropertyKey, unknown]>
>(
    entries: T
): { [K in T[number]as K[0]]: K[1] } => {
    return Object.fromEntries(entries) as { [K in T[number]as K[0]]: K[1] };
};

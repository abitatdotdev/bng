import type { AllFeatures } from '../features';
import { allHabitats, habitatByLabel, isHabitat, type Habitat, type HabitatLabel } from "../habitats"

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

export const valuesByHabitat = (inputData: AllFeatures): ValuesByHabitat => {
    const habitatLabels = Object.keys(allHabitats) as HabitatLabel[];
    return typeSafeObjectFromEntries(
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
}

function calculateExistingAreaBaselineOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.area, 0);
}
function calculateExistingUnitsBaselineOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.totalHabitatUnits, 0);
}
function calculateExistingAreaRetainedOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.areaRetained, 0);
}
function calculateExistingUnitsRetainedOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.baselineUnitsRetained + baseline.vhdhBespokeCompensationUnits, 0);
}
function calculateExistingAreaLostOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.areaHabitatLost, 0);
}
function calculateExistingUnitsLostBaselineOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.unitsLost, 0);
}
function calculateProposedAreaCreationOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum + creation.area, 0);
}
function calculateProposedUnitsCreationOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum + creation.habitatUnitsDelivered, 0);
}
function calculateProposedAreaEnhancementOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum + enhancement.area, 0);
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .onSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum + enhancement.habitatUnitsDelivered, 0);
}
function calculateTotalProposedAreaOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return (
        calculateExistingAreaRetainedOnSite(inputData, habitat)
        + calculateProposedAreaCreationOnSitePostDevelopment(inputData, habitat)
        + calculateProposedAreaEnhancementOnSitePostDevelopment(inputData, habitat)
    );
}
function calculateTotalProposedUnitsOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): number {
    return (
        calculateExistingUnitsRetainedOnSite(inputData, habitat)
        + calculateProposedUnitsCreationOnSitePostDevelopment(inputData, habitat)
        + calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, habitat)
    );
}
function calculateNetAreaChangeOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return (
        calculateTotalProposedAreaOnSitePostDevelopment(inputData, habitat)
        - calculateExistingAreaBaselineOnSite(inputData, habitat)
    )
}
function calculateNetUnitChangeOnSite(inputData: AllFeatures, habitat: Habitat): number {
    return (
        calculateTotalProposedUnitsOnSitePostDevelopment(inputData, habitat)
        - calculateExistingUnitsBaselineOnSite(inputData, habitat)
    )
}
function calculateExistingAreaOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.area, 0);
}
function calculateExistingUnitsOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.totalHabitatUnits, 0);
}
function calculateRetainedAreaOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.areaRetained, 0);
}
function calculateRetainedUnitsOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.baselineUnitsRetained + baseline.vhdhBespokeCompensationUnits, 0);
}
function calculateProposedAreaCreationOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.areaHabitatLost, 0);
}
function calculateProposedUnitsCreationOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.unitsLost, 0);
}
function calculateProposedAreaEnhancementOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum + creation.area, 0);
}
function calculateProposedUnitsEnhancementOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum + creation.habitatUnitsDelivered, 0);
}
function calculateTotalProposedAreaOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum + enhancement.area, 0);
}
function calculateTotalProposedUnitsOffSite(inputData: AllFeatures, habitat: Habitat): number {
    return inputData
        .offSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum + enhancement.habitatUnitsDelivered, 0);
}
function calculateOffSiteNetAreaChange(inputData: AllFeatures, habitat: Habitat): number {
    return (
        calculateTotalProposedAreaOffSite(inputData, habitat)
        - calculateExistingAreaOffSite(inputData, habitat)
    );
}
function calculateOffSiteNetUnitChange(inputData: AllFeatures, habitat: Habitat): number {
    return (
        calculateTotalProposedUnitsOffSite(inputData, habitat)
        - calculateExistingUnitsOffSite(inputData, habitat)
    )
}
function calculateOverallAreaChange(inputData: AllFeatures, habitat: Habitat): number {
    return (
        calculateNetAreaChangeOnSite(inputData, habitat)
        + calculateOffSiteNetAreaChange(inputData, habitat)
    )
}
function calculateOverallUnitChange(inputData: AllFeatures, habitat: Habitat): number {
    return (
        calculateNetUnitChangeOnSite(inputData, habitat)
        + calculateOffSiteNetUnitChange(inputData, habitat)
    )
}

/** This seems the same as calculateOverallUnitChange in calculation, but we follow the sheet for now */
function calculateUnitChangeIncludingOffSite(inputData: AllFeatures, habitat: Habitat): any {
    return (
        calculateNetUnitChangeOnSite(inputData, habitat)
        + calculateOffSiteNetUnitChange(inputData, habitat)
    )
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

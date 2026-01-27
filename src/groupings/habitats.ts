import type { HeadlineResultsInput } from "../headlineResults"
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
    }
}

export const valuesByHabitat = (inputData: HeadlineResultsInput): ValuesByHabitat => {
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
                },
            ]
        }))
}

function calculateExistingAreaBaselineOnSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.area, 0);
}
function calculateExistingUnitsBaselineOnSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.totalHabitatUnits, 0);
}
function calculateExistingAreaRetainedOnSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.areaRetained, 0);
}
function calculateExistingUnitsRetainedOnSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.baselineUnitsRetained + baseline.vhdhBespokeCompensationUnits, 0);
}
function calculateExistingAreaLostOnSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.areaHabitatLost, 0);
}
function calculateExistingUnitsLostBaselineOnSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.unitsLost, 0);
}
function calculateProposedAreaCreationOnSitePostDevelopment(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum + creation.area, 0);
}
function calculateProposedUnitsCreationOnSitePostDevelopment(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum + creation.habitatUnitsDelivered, 0);
}
function calculateProposedAreaEnhancementOnSitePostDevelopment(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum + enhancement.area, 0);
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .onSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum + enhancement.habitatUnitsDelivered, 0);
}
function calculateTotalProposedAreaOnSitePostDevelopment(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return (
        calculateExistingAreaRetainedOnSite(inputData, habitat)
        + calculateProposedAreaCreationOnSitePostDevelopment(inputData, habitat)
        + calculateProposedAreaEnhancementOnSitePostDevelopment(inputData, habitat)
    );
}
function calculateTotalProposedUnitsOnSitePostDevelopment(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return (
        calculateExistingUnitsRetainedOnSite(inputData, habitat)
        + calculateProposedUnitsCreationOnSitePostDevelopment(inputData, habitat)
        + calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, habitat)
    );
}
function calculateNetAreaChangeOnSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return (
        calculateTotalProposedAreaOnSitePostDevelopment(inputData, habitat)
        - calculateExistingAreaBaselineOnSite(inputData, habitat)
    )
}
function calculateNetUnitChangeOnSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return (
        calculateTotalProposedUnitsOnSitePostDevelopment(inputData, habitat)
        - calculateExistingUnitsBaselineOnSite(inputData, habitat)
    )
}
function calculateExistingAreaOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.area, 0);
}
function calculateExistingUnitsOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.totalHabitatUnits, 0);
}
function calculateRetainedAreaOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.areaRetained, 0);
}
function calculateRetainedUnitsOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.baselineUnitsRetained + baseline.vhdhBespokeCompensationUnits, 0);
}
function calculateProposedAreaCreationOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.areaHabitatLost, 0);
}
function calculateProposedUnitsCreationOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatBaselines
        .filter(baseline => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum + baseline.unitsLost, 0);
}
function calculateProposedAreaEnhancementOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum + creation.area, 0);
}
function calculateProposedUnitsEnhancementOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatCreations
        .filter(creation => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum + creation.habitatUnitsDelivered, 0);
}
function calculateTotalProposedAreaOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum + enhancement.area, 0);
}
function calculateTotalProposedUnitsOffSite(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return inputData
        .offSiteHabitatEnhancements
        .filter(enhancement => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum + enhancement.habitatUnitsDelivered, 0);
}
function calculateOffSiteNetAreaChange(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return (
        calculateTotalProposedAreaOffSite(inputData, habitat)
        - calculateExistingAreaOffSite(inputData, habitat)
    );
}
function calculateOffSiteNetUnitChange(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return (
        calculateTotalProposedUnitsOffSite(inputData, habitat)
        - calculateExistingUnitsOffSite(inputData, habitat)
    )
}
function calculateOverallAreaChange(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return (
        calculateNetAreaChangeOnSite(inputData, habitat)
        + calculateOffSiteNetAreaChange(inputData, habitat)
    )
}
function calculateOverallUnitChange(inputData: HeadlineResultsInput, habitat: Habitat): number {
    return (
        calculateNetUnitChangeOnSite(inputData, habitat)
        + calculateOffSiteNetUnitChange(inputData, habitat)
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

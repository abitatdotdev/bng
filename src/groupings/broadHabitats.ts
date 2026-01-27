import type { AllFeatures } from '../features';
import { habitatByLabel, type HabitatLabel } from "../habitats"
import type { BroadHabitat } from "../broadHabitats";
import { valuesByHabitat } from "./habitats";

type ValuesByBroadHabitat = {
    [Label in BroadHabitat]: {
        onSiteExistingArea: number,
        onSiteExistingValue: number,
        onSiteProposedArea: number,
        onSiteProposedValue: number,
        onSiteAreaChange: number,
        onSiteUnitChange: number,
        offSiteExistingArea: number,
        offSiteExistingValue: number,
        offSiteProposedArea: number,
        offSiteProposedValue: number,
        offSiteAreaChange: number,
        offSiteUnitChange: number,
    }
}

export const valuesByBroadHabitat = (inputData: AllFeatures): ValuesByBroadHabitat => {
    const byHabitat = valuesByHabitat(inputData);

    return Object.entries(byHabitat).reduce((results, [habitatLabel, values]) => {
        const habitat = habitatByLabel(habitatLabel as HabitatLabel)!;
        const broadHabitat = habitat.broadHabitat;
        const broadHabitatResults = results[broadHabitat] || {
            onSiteExistingArea: 0,
            onSiteExistingValue: 0,
            onSiteProposedArea: 0,
            onSiteProposedValue: 0,
            onSiteAreaChange: 0,
            onSiteUnitChange: 0,
            offSiteExistingArea: 0,
            offSiteExistingValue: 0,
            offSiteProposedArea: 0,
            offSiteProposedValue: 0,
            offSiteAreaChange: 0,
            offSiteUnitChange: 0,
        }

        results[broadHabitat] = {
            onSiteExistingArea: broadHabitatResults.onSiteExistingArea + values.existingAreaBaselineOnSite,
            onSiteExistingValue: broadHabitatResults.onSiteExistingValue + values.existingUnitsBaselineOnSite,
            onSiteProposedArea: broadHabitatResults.onSiteProposedArea + values.totalProposedAreaOnSitePostDevelopment,
            onSiteProposedValue: broadHabitatResults.onSiteProposedValue + values.totalProposedUnitsOnSitePostDevelopment,
            onSiteAreaChange: broadHabitatResults.onSiteAreaChange + values.netAreaChangeOnSite,
            onSiteUnitChange: broadHabitatResults.onSiteUnitChange + values.netUnitChangeOnSite,
            offSiteExistingArea: broadHabitatResults.offSiteExistingArea + values.existingAreaOffSite,
            offSiteExistingValue: broadHabitatResults.offSiteExistingValue + values.existingUnitsOffSite,
            offSiteProposedArea: broadHabitatResults.offSiteProposedArea + values.totalProposedAreaOffSite,
            offSiteProposedValue: broadHabitatResults.offSiteProposedValue + values.totalProposedUnitsOffSite,
            offSiteAreaChange: broadHabitatResults.offSiteAreaChange + values.offSiteNetAreaChange,
            offSiteUnitChange: broadHabitatResults.offSiteUnitChange + values.offSiteNetUnitChange,
        }

        return results;
    }, {} as ValuesByBroadHabitat)
}

import type { AllFeatures } from '../features';
import { habitatByLabel, type HabitatLabel } from "../habitats"
import type { BroadHabitat } from "../broadHabitats";
import { valuesByHabitat } from "./habitats";
import { Decimal } from '../decimal';

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
            onSiteExistingArea: new Decimal(broadHabitatResults.onSiteExistingArea).plus(values.existingAreaBaselineOnSite).toNumber(),
            onSiteExistingValue: new Decimal(broadHabitatResults.onSiteExistingValue).plus(values.existingUnitsBaselineOnSite).toNumber(),
            onSiteProposedArea: new Decimal(broadHabitatResults.onSiteProposedArea).plus(values.totalProposedAreaOnSitePostDevelopment).toNumber(),
            onSiteProposedValue: new Decimal(broadHabitatResults.onSiteProposedValue).plus(values.totalProposedUnitsOnSitePostDevelopment).toNumber(),
            onSiteAreaChange: new Decimal(broadHabitatResults.onSiteAreaChange).plus(values.netAreaChangeOnSite).toNumber(),
            onSiteUnitChange: new Decimal(broadHabitatResults.onSiteUnitChange).plus(values.netUnitChangeOnSite).toNumber(),
            offSiteExistingArea: new Decimal(broadHabitatResults.offSiteExistingArea).plus(values.existingAreaOffSite).toNumber(),
            offSiteExistingValue: new Decimal(broadHabitatResults.offSiteExistingValue).plus(values.existingUnitsOffSite).toNumber(),
            offSiteProposedArea: new Decimal(broadHabitatResults.offSiteProposedArea).plus(values.totalProposedAreaOffSite).toNumber(),
            offSiteProposedValue: new Decimal(broadHabitatResults.offSiteProposedValue).plus(values.totalProposedUnitsOffSite).toNumber(),
            offSiteAreaChange: new Decimal(broadHabitatResults.offSiteAreaChange).plus(values.offSiteNetAreaChange).toNumber(),
            offSiteUnitChange: new Decimal(broadHabitatResults.offSiteUnitChange).plus(values.offSiteNetUnitChange).toNumber(),
        }

        return results;
    }, {} as ValuesByBroadHabitat)
}

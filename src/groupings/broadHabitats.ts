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

type DecimalValuesByBroadHabitat = {
    [Label in BroadHabitat]: {
        [Key in keyof ValuesByBroadHabitat[Label]]: Decimal
    }
}

const ZERO = new Decimal(0);

const emptyValuesD = (): DecimalValuesByBroadHabitat[BroadHabitat] => ({
    onSiteExistingArea: ZERO,
    onSiteExistingValue: ZERO,
    onSiteProposedArea: ZERO,
    onSiteProposedValue: ZERO,
    onSiteAreaChange: ZERO,
    onSiteUnitChange: ZERO,
    offSiteExistingArea: ZERO,
    offSiteExistingValue: ZERO,
    offSiteProposedArea: ZERO,
    offSiteProposedValue: ZERO,
    offSiteAreaChange: ZERO,
    offSiteUnitChange: ZERO,
});

const toNumbers = (values: DecimalValuesByBroadHabitat[BroadHabitat]): ValuesByBroadHabitat[BroadHabitat] => ({
    onSiteExistingArea: values.onSiteExistingArea.toNumber(),
    onSiteExistingValue: values.onSiteExistingValue.toNumber(),
    onSiteProposedArea: values.onSiteProposedArea.toNumber(),
    onSiteProposedValue: values.onSiteProposedValue.toNumber(),
    onSiteAreaChange: values.onSiteAreaChange.toNumber(),
    onSiteUnitChange: values.onSiteUnitChange.toNumber(),
    offSiteExistingArea: values.offSiteExistingArea.toNumber(),
    offSiteExistingValue: values.offSiteExistingValue.toNumber(),
    offSiteProposedArea: values.offSiteProposedArea.toNumber(),
    offSiteProposedValue: values.offSiteProposedValue.toNumber(),
    offSiteAreaChange: values.offSiteAreaChange.toNumber(),
    offSiteUnitChange: values.offSiteUnitChange.toNumber(),
});

export const valuesByBroadHabitat = (inputData: AllFeatures): ValuesByBroadHabitat => {
    const byHabitat = valuesByHabitat(inputData);

    const results = Object.entries(byHabitat).reduce((results, [habitatLabel, values]) => {
        const habitat = habitatByLabel(habitatLabel as HabitatLabel)!;
        const broadHabitat = habitat.broadHabitat;
        const broadHabitatResults = results[broadHabitat] || emptyValuesD();

        results[broadHabitat] = {
            onSiteExistingArea: broadHabitatResults.onSiteExistingArea.plus(values.existingAreaBaselineOnSite),
            onSiteExistingValue: broadHabitatResults.onSiteExistingValue.plus(values.existingUnitsBaselineOnSite),
            onSiteProposedArea: broadHabitatResults.onSiteProposedArea.plus(values.totalProposedAreaOnSitePostDevelopment),
            onSiteProposedValue: broadHabitatResults.onSiteProposedValue.plus(values.totalProposedUnitsOnSitePostDevelopment),
            onSiteAreaChange: broadHabitatResults.onSiteAreaChange.plus(values.netAreaChangeOnSite),
            onSiteUnitChange: broadHabitatResults.onSiteUnitChange.plus(values.netUnitChangeOnSite),
            offSiteExistingArea: broadHabitatResults.offSiteExistingArea.plus(values.existingAreaOffSite),
            offSiteExistingValue: broadHabitatResults.offSiteExistingValue.plus(values.existingUnitsOffSite),
            offSiteProposedArea: broadHabitatResults.offSiteProposedArea.plus(values.totalProposedAreaOffSite),
            offSiteProposedValue: broadHabitatResults.offSiteProposedValue.plus(values.totalProposedUnitsOffSite),
            offSiteAreaChange: broadHabitatResults.offSiteAreaChange.plus(values.offSiteNetAreaChange),
            offSiteUnitChange: broadHabitatResults.offSiteUnitChange.plus(values.offSiteNetUnitChange),
        }

        return results;
    }, {} as DecimalValuesByBroadHabitat);

    return Object.entries(results).reduce((numberResults, [label, values]) => {
        numberResults[label as BroadHabitat] = toNumbers(values);
        return numberResults;
    }, {} as ValuesByBroadHabitat);
}

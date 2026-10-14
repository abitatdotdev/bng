import { Decimal } from '../decimal';
import type { AllFeatures } from '../features';
import { habitatByLabel, type HabitatLabel } from '../habitats';
import type { BroadHabitat } from '../broadHabitats';
import { valuesByHabitat } from './habitats';

type ValuesByBroadHabitat = {
    [Label in BroadHabitat]: {
        onSiteExistingArea: number;
        onSiteExistingAreaDecimal: Decimal;
        onSiteExistingValue: number;
        onSiteExistingValueDecimal: Decimal;
        onSiteProposedArea: number;
        onSiteProposedAreaDecimal: Decimal;
        onSiteProposedValue: number;
        onSiteProposedValueDecimal: Decimal;
        onSiteAreaChange: number;
        onSiteAreaChangeDecimal: Decimal;
        onSiteUnitChange: number;
        onSiteUnitChangeDecimal: Decimal;
        offSiteExistingArea: number;
        offSiteExistingAreaDecimal: Decimal;
        offSiteExistingValue: number;
        offSiteExistingValueDecimal: Decimal;
        offSiteProposedArea: number;
        offSiteProposedAreaDecimal: Decimal;
        offSiteProposedValue: number;
        offSiteProposedValueDecimal: Decimal;
        offSiteAreaChange: number;
        offSiteAreaChangeDecimal: Decimal;
        offSiteUnitChange: number;
        offSiteUnitChangeDecimal: Decimal;
    };
};

type DecimalValuesByBroadHabitat = {
    [Label in BroadHabitat]: {
        onSiteExistingArea: Decimal;
        onSiteExistingValue: Decimal;
        onSiteProposedArea: Decimal;
        onSiteProposedValue: Decimal;
        onSiteAreaChange: Decimal;
        onSiteUnitChange: Decimal;
        offSiteExistingArea: Decimal;
        offSiteExistingValue: Decimal;
        offSiteProposedArea: Decimal;
        offSiteProposedValue: Decimal;
        offSiteAreaChange: Decimal;
        offSiteUnitChange: Decimal;
    };
};

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

const toNumbers = (
    values: DecimalValuesByBroadHabitat[BroadHabitat],
): ValuesByBroadHabitat[BroadHabitat] => ({
    onSiteExistingArea: values.onSiteExistingArea.toNumber(),
    onSiteExistingAreaDecimal: values.onSiteExistingArea,
    onSiteExistingValue: values.onSiteExistingValue.toNumber(),
    onSiteExistingValueDecimal: values.onSiteExistingValue,
    onSiteProposedArea: values.onSiteProposedArea.toNumber(),
    onSiteProposedAreaDecimal: values.onSiteProposedArea,
    onSiteProposedValue: values.onSiteProposedValue.toNumber(),
    onSiteProposedValueDecimal: values.onSiteProposedValue,
    onSiteAreaChange: values.onSiteAreaChange.toNumber(),
    onSiteAreaChangeDecimal: values.onSiteAreaChange,
    onSiteUnitChange: values.onSiteUnitChange.toNumber(),
    onSiteUnitChangeDecimal: values.onSiteUnitChange,
    offSiteExistingArea: values.offSiteExistingArea.toNumber(),
    offSiteExistingAreaDecimal: values.offSiteExistingArea,
    offSiteExistingValue: values.offSiteExistingValue.toNumber(),
    offSiteExistingValueDecimal: values.offSiteExistingValue,
    offSiteProposedArea: values.offSiteProposedArea.toNumber(),
    offSiteProposedAreaDecimal: values.offSiteProposedArea,
    offSiteProposedValue: values.offSiteProposedValue.toNumber(),
    offSiteProposedValueDecimal: values.offSiteProposedValue,
    offSiteAreaChange: values.offSiteAreaChange.toNumber(),
    offSiteAreaChangeDecimal: values.offSiteAreaChange,
    offSiteUnitChange: values.offSiteUnitChange.toNumber(),
    offSiteUnitChangeDecimal: values.offSiteUnitChange,
});

export const valuesByBroadHabitat = (inputData: AllFeatures): ValuesByBroadHabitat => {
    const byHabitat = valuesByHabitat(inputData);

    const results = Object.entries(byHabitat).reduce((results, [habitatLabel, values]) => {
        const habitat = habitatByLabel(habitatLabel as HabitatLabel)!;
        const broadHabitat = habitat.broadHabitat;
        const broadHabitatResults = results[broadHabitat] || emptyValuesD();

        results[broadHabitat] = {
            onSiteExistingArea: broadHabitatResults.onSiteExistingArea.plus(
                values.existingAreaBaselineOnSiteDecimal,
            ),
            onSiteExistingValue: broadHabitatResults.onSiteExistingValue.plus(
                values.existingUnitsBaselineOnSiteDecimal,
            ),
            onSiteProposedArea: broadHabitatResults.onSiteProposedArea.plus(
                values.totalProposedAreaOnSitePostDevelopmentDecimal,
            ),
            onSiteProposedValue: broadHabitatResults.onSiteProposedValue.plus(
                values.totalProposedUnitsOnSitePostDevelopmentDecimal,
            ),
            onSiteAreaChange: broadHabitatResults.onSiteAreaChange.plus(values.netAreaChangeOnSiteDecimal),
            onSiteUnitChange: broadHabitatResults.onSiteUnitChange.plus(values.netUnitChangeOnSiteDecimal),
            offSiteExistingArea: broadHabitatResults.offSiteExistingArea.plus(
                values.existingAreaOffSiteDecimal,
            ),
            offSiteExistingValue: broadHabitatResults.offSiteExistingValue.plus(
                values.existingUnitsOffSiteDecimal,
            ),
            offSiteProposedArea: broadHabitatResults.offSiteProposedArea.plus(
                values.totalProposedAreaOffSiteDecimal,
            ),
            offSiteProposedValue: broadHabitatResults.offSiteProposedValue.plus(
                values.totalProposedUnitsOffSiteDecimal,
            ),
            offSiteAreaChange: broadHabitatResults.offSiteAreaChange.plus(values.offSiteNetAreaChangeDecimal),
            offSiteUnitChange: broadHabitatResults.offSiteUnitChange.plus(values.offSiteNetUnitChangeDecimal),
        };

        return results;
    }, {} as DecimalValuesByBroadHabitat);

    return Object.entries(results).reduce((numberResults, [label, values]) => {
        numberResults[label as BroadHabitat] = toNumbers(values);
        return numberResults;
    }, {} as ValuesByBroadHabitat);
};

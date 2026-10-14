import { Decimal } from '../decimal';
import type { AllFeatures } from '../features';
import { allHabitats, habitatByLabel, isHabitat, type Habitat, type HabitatLabel } from '../habitats';

type ValuesByHabitat = {
    [Label in HabitatLabel]: {
        existingAreaBaselineOnSite: number;
        existingAreaBaselineOnSiteDecimal: Decimal;
        existingUnitsBaselineOnSite: number;
        existingUnitsBaselineOnSiteDecimal: Decimal;
        existingAreaRetainedOnSite: number;
        existingAreaRetainedOnSiteDecimal: Decimal;
        existingUnitsRetainedOnSite: number;
        existingUnitsRetainedOnSiteDecimal: Decimal;
        existingAreaLostOnSite: number;
        existingAreaLostOnSiteDecimal: Decimal;
        existingUnitsLostBaselineOnSite: number;
        existingUnitsLostBaselineOnSiteDecimal: Decimal;
        proposedAreaCreationOnSitePostDevelopment: number;
        proposedAreaCreationOnSitePostDevelopmentDecimal: Decimal;
        proposedUnitsCreationOnSitePostDevelopment: number;
        proposedUnitsCreationOnSitePostDevelopmentDecimal: Decimal;
        proposedAreaEnhancementOnSitePostDevelopment: number;
        proposedAreaEnhancementOnSitePostDevelopmentDecimal: Decimal;
        proposedUnitsEnhancementOnSitePostDevelopment: number;
        proposedUnitsEnhancementOnSitePostDevelopmentDecimal: Decimal;
        totalProposedAreaOnSitePostDevelopment: number;
        totalProposedAreaOnSitePostDevelopmentDecimal: Decimal;
        totalProposedUnitsOnSitePostDevelopment: number;
        totalProposedUnitsOnSitePostDevelopmentDecimal: Decimal;
        netAreaChangeOnSite: number;
        netAreaChangeOnSiteDecimal: Decimal;
        netUnitChangeOnSite: number;
        netUnitChangeOnSiteDecimal: Decimal;
        existingAreaOffSite: number;
        existingAreaOffSiteDecimal: Decimal;
        existingUnitsOffSite: number;
        existingUnitsOffSiteDecimal: Decimal;
        retainedAreaOffSite: number;
        retainedAreaOffSiteDecimal: Decimal;
        retainedUnitsOffSite: number;
        retainedUnitsOffSiteDecimal: Decimal;
        proposedAreaCreationOffSite: number;
        proposedAreaCreationOffSiteDecimal: Decimal;
        proposedUnitsCreationOffSite: number;
        proposedUnitsCreationOffSiteDecimal: Decimal;
        proposedAreaEnhancementOffSite: number;
        proposedAreaEnhancementOffSiteDecimal: Decimal;
        proposedUnitsEnhancementOffSite: number;
        proposedUnitsEnhancementOffSiteDecimal: Decimal;
        totalProposedAreaOffSite: number;
        totalProposedAreaOffSiteDecimal: Decimal;
        totalProposedUnitsOffSite: number;
        totalProposedUnitsOffSiteDecimal: Decimal;
        offSiteNetAreaChange: number;
        offSiteNetAreaChangeDecimal: Decimal;
        offSiteNetUnitChange: number;
        offSiteNetUnitChangeDecimal: Decimal;
        overallAreaChange: number;
        overallAreaChangeDecimal: Decimal;
        overallUnitChange: number;
        overallUnitChangeDecimal: Decimal;
        // from distinctiveness groupings
        // column BE
        unitChangeIncludingOffSite: number;
        unitChangeIncludingOffSiteDecimal: Decimal;
        // column BF
        unitsRequiredOffSite: number;
        unitsRequiredOffSiteDecimal: Decimal;
    };
};

const habitatLabels = Object.keys(allHabitats) as HabitatLabel[];
const ZERO = new Decimal(0);

const valuesByHabitatCache = new WeakMap<AllFeatures, ValuesByHabitat>();

/**
 * Calculate values per habitat type.
 * NOTE: input data must not be mutated - results are cached per input object identity.
 */
export const valuesByHabitat = (inputData: AllFeatures): ValuesByHabitat => {
    const cached = valuesByHabitatCache.get(inputData);
    if (cached) return cached;

    const results = typeSafeObjectFromEntries(
        habitatLabels.map((label) => {
            const habitat = habitatByLabel(label)!;

            const existingAreaBaselineOnSiteDecimal = calculateExistingAreaBaselineOnSite(inputData, habitat);
            const existingUnitsBaselineOnSiteDecimal = calculateExistingUnitsBaselineOnSite(
                inputData,
                habitat,
            );
            const existingAreaRetainedOnSiteDecimal = calculateExistingAreaRetainedOnSite(inputData, habitat);
            const existingUnitsRetainedOnSiteDecimal = calculateExistingUnitsRetainedOnSite(
                inputData,
                habitat,
            );
            const existingAreaLostOnSiteDecimal = calculateExistingAreaLostOnSite(inputData, habitat);
            const existingUnitsLostBaselineOnSiteDecimal = calculateExistingUnitsLostBaselineOnSite(
                inputData,
                habitat,
            );
            const proposedAreaCreationOnSitePostDevelopmentDecimal =
                calculateProposedAreaCreationOnSitePostDevelopment(inputData, habitat);
            const proposedUnitsCreationOnSitePostDevelopmentDecimal =
                calculateProposedUnitsCreationOnSitePostDevelopment(inputData, habitat);
            const proposedAreaEnhancementOnSitePostDevelopmentDecimal =
                calculateProposedAreaEnhancementOnSitePostDevelopment(inputData, habitat);
            const proposedUnitsEnhancementOnSitePostDevelopmentDecimal =
                calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, habitat);
            const totalProposedAreaOnSitePostDevelopmentDecimal =
                calculateTotalProposedAreaOnSitePostDevelopment(inputData, habitat);
            const totalProposedUnitsOnSitePostDevelopmentDecimal =
                calculateTotalProposedUnitsOnSitePostDevelopment(inputData, habitat);
            const netAreaChangeOnSiteDecimal = calculateNetAreaChangeOnSite(inputData, habitat);
            const netUnitChangeOnSiteDecimal = calculateNetUnitChangeOnSite(inputData, habitat);
            const existingAreaOffSiteDecimal = calculateExistingAreaOffSite(inputData, habitat);
            const existingUnitsOffSiteDecimal = calculateExistingUnitsOffSite(inputData, habitat);
            const retainedAreaOffSiteDecimal = calculateRetainedAreaOffSite(inputData, habitat);
            const retainedUnitsOffSiteDecimal = calculateRetainedUnitsOffSite(inputData, habitat);
            const proposedAreaCreationOffSiteDecimal = calculateProposedAreaCreationOffSite(
                inputData,
                habitat,
            );
            const proposedUnitsCreationOffSiteDecimal = calculateProposedUnitsCreationOffSite(
                inputData,
                habitat,
            );
            const proposedAreaEnhancementOffSiteDecimal = calculateProposedAreaEnhancementOffSite(
                inputData,
                habitat,
            );
            const proposedUnitsEnhancementOffSiteDecimal = calculateProposedUnitsEnhancementOffSite(
                inputData,
                habitat,
            );
            const totalProposedAreaOffSiteDecimal = calculateTotalProposedAreaOffSite(inputData, habitat);
            const totalProposedUnitsOffSiteDecimal = calculateTotalProposedUnitsOffSite(inputData, habitat);
            const offSiteNetAreaChangeDecimal = calculateOffSiteNetAreaChange(inputData, habitat);
            const offSiteNetUnitChangeDecimal = calculateOffSiteNetUnitChange(inputData, habitat);
            const overallAreaChangeDecimal = calculateOverallAreaChange(inputData, habitat);
            const overallUnitChangeDecimal = calculateOverallUnitChange(inputData, habitat);
            const unitChangeIncludingOffSiteDecimal = calculateUnitChangeIncludingOffSite(inputData, habitat);
            const unitsRequiredOffSiteDecimal = calculateUnitsRequiredOffSite(inputData, habitat);
            return [
                label,
                {
                    existingAreaBaselineOnSite: existingAreaBaselineOnSiteDecimal.toNumber(),
                    existingAreaBaselineOnSiteDecimal,
                    existingUnitsBaselineOnSite: existingUnitsBaselineOnSiteDecimal.toNumber(),
                    existingUnitsBaselineOnSiteDecimal,
                    existingAreaRetainedOnSite: existingAreaRetainedOnSiteDecimal.toNumber(),
                    existingAreaRetainedOnSiteDecimal,
                    existingUnitsRetainedOnSite: existingUnitsRetainedOnSiteDecimal.toNumber(),
                    existingUnitsRetainedOnSiteDecimal,
                    existingAreaLostOnSite: existingAreaLostOnSiteDecimal.toNumber(),
                    existingAreaLostOnSiteDecimal,
                    existingUnitsLostBaselineOnSite: existingUnitsLostBaselineOnSiteDecimal.toNumber(),
                    existingUnitsLostBaselineOnSiteDecimal,
                    proposedAreaCreationOnSitePostDevelopment:
                        proposedAreaCreationOnSitePostDevelopmentDecimal.toNumber(),
                    proposedAreaCreationOnSitePostDevelopmentDecimal,
                    proposedUnitsCreationOnSitePostDevelopment:
                        proposedUnitsCreationOnSitePostDevelopmentDecimal.toNumber(),
                    proposedUnitsCreationOnSitePostDevelopmentDecimal,
                    proposedAreaEnhancementOnSitePostDevelopment:
                        proposedAreaEnhancementOnSitePostDevelopmentDecimal.toNumber(),
                    proposedAreaEnhancementOnSitePostDevelopmentDecimal,
                    proposedUnitsEnhancementOnSitePostDevelopment:
                        proposedUnitsEnhancementOnSitePostDevelopmentDecimal.toNumber(),
                    proposedUnitsEnhancementOnSitePostDevelopmentDecimal,
                    totalProposedAreaOnSitePostDevelopment:
                        totalProposedAreaOnSitePostDevelopmentDecimal.toNumber(),
                    totalProposedAreaOnSitePostDevelopmentDecimal,
                    totalProposedUnitsOnSitePostDevelopment:
                        totalProposedUnitsOnSitePostDevelopmentDecimal.toNumber(),
                    totalProposedUnitsOnSitePostDevelopmentDecimal,
                    netAreaChangeOnSite: netAreaChangeOnSiteDecimal.toNumber(),
                    netAreaChangeOnSiteDecimal,
                    netUnitChangeOnSite: netUnitChangeOnSiteDecimal.toNumber(),
                    netUnitChangeOnSiteDecimal,
                    existingAreaOffSite: existingAreaOffSiteDecimal.toNumber(),
                    existingAreaOffSiteDecimal,
                    existingUnitsOffSite: existingUnitsOffSiteDecimal.toNumber(),
                    existingUnitsOffSiteDecimal,
                    retainedAreaOffSite: retainedAreaOffSiteDecimal.toNumber(),
                    retainedAreaOffSiteDecimal,
                    retainedUnitsOffSite: retainedUnitsOffSiteDecimal.toNumber(),
                    retainedUnitsOffSiteDecimal,
                    proposedAreaCreationOffSite: proposedAreaCreationOffSiteDecimal.toNumber(),
                    proposedAreaCreationOffSiteDecimal,
                    proposedUnitsCreationOffSite: proposedUnitsCreationOffSiteDecimal.toNumber(),
                    proposedUnitsCreationOffSiteDecimal,
                    proposedAreaEnhancementOffSite: proposedAreaEnhancementOffSiteDecimal.toNumber(),
                    proposedAreaEnhancementOffSiteDecimal,
                    proposedUnitsEnhancementOffSite: proposedUnitsEnhancementOffSiteDecimal.toNumber(),
                    proposedUnitsEnhancementOffSiteDecimal,
                    totalProposedAreaOffSite: totalProposedAreaOffSiteDecimal.toNumber(),
                    totalProposedAreaOffSiteDecimal,
                    totalProposedUnitsOffSite: totalProposedUnitsOffSiteDecimal.toNumber(),
                    totalProposedUnitsOffSiteDecimal,
                    offSiteNetAreaChange: offSiteNetAreaChangeDecimal.toNumber(),
                    offSiteNetAreaChangeDecimal,
                    offSiteNetUnitChange: offSiteNetUnitChangeDecimal.toNumber(),
                    offSiteNetUnitChangeDecimal,
                    overallAreaChange: overallAreaChangeDecimal.toNumber(),
                    overallAreaChangeDecimal,
                    overallUnitChange: overallUnitChangeDecimal.toNumber(),
                    overallUnitChangeDecimal,
                    unitChangeIncludingOffSite: unitChangeIncludingOffSiteDecimal.toNumber(),
                    unitChangeIncludingOffSiteDecimal,
                    unitsRequiredOffSite: unitsRequiredOffSiteDecimal.toNumber(),
                    unitsRequiredOffSiteDecimal,
                },
            ];
        }),
    );

    valuesByHabitatCache.set(inputData, results);
    return results;
};

function calculateExistingAreaBaselineOnSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.onSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum.plus(baseline.areaDecimal), ZERO);
}
function calculateExistingUnitsBaselineOnSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.onSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum.plus(baseline.totalHabitatUnitsDecimal), ZERO);
}
function calculateExistingAreaRetainedOnSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.onSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum.plus(baseline.areaRetainedDecimal), ZERO);
}
function calculateExistingUnitsRetainedOnSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.onSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce(
            (sum, baseline) =>
                sum
                    .plus(baseline.baselineUnitsRetainedDecimal)
                    .plus(baseline.vhdhBespokeCompensationUnitsDecimal),
            ZERO,
        );
}
function calculateExistingAreaLostOnSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.onSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum.plus(baseline.areaHabitatLostDecimal), ZERO);
}
function calculateExistingUnitsLostBaselineOnSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.onSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum.plus(baseline.unitsLostDecimal), ZERO);
}
function calculateProposedAreaCreationOnSitePostDevelopment(
    inputData: AllFeatures,
    habitat: Habitat,
): Decimal {
    return inputData.onSiteHabitatCreations
        .filter((creation) => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum.plus(creation.areaDecimal), ZERO);
}
function calculateProposedUnitsCreationOnSitePostDevelopment(
    inputData: AllFeatures,
    habitat: Habitat,
): Decimal {
    return inputData.onSiteHabitatCreations
        .filter((creation) => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum.plus(creation.habitatUnitsDeliveredDecimal), ZERO);
}
function calculateProposedAreaEnhancementOnSitePostDevelopment(
    inputData: AllFeatures,
    habitat: Habitat,
): Decimal {
    return inputData.onSiteHabitatEnhancements
        .filter((enhancement) => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum.plus(enhancement.areaDecimal), ZERO);
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(
    inputData: AllFeatures,
    habitat: Habitat,
): Decimal {
    return inputData.onSiteHabitatEnhancements
        .filter((enhancement) => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum.plus(enhancement.habitatUnitsDeliveredDecimal), ZERO);
}
function calculateTotalProposedAreaOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateExistingAreaRetainedOnSite(inputData, habitat))
        .plus(calculateProposedAreaCreationOnSitePostDevelopment(inputData, habitat))
        .plus(calculateProposedAreaEnhancementOnSitePostDevelopment(inputData, habitat));
}
function calculateTotalProposedUnitsOnSitePostDevelopment(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateExistingUnitsRetainedOnSite(inputData, habitat))
        .plus(calculateProposedUnitsCreationOnSitePostDevelopment(inputData, habitat))
        .plus(calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, habitat));
}
function calculateNetAreaChangeOnSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateTotalProposedAreaOnSitePostDevelopment(inputData, habitat)).minus(
        calculateExistingAreaBaselineOnSite(inputData, habitat),
    );
}
function calculateNetUnitChangeOnSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateTotalProposedUnitsOnSitePostDevelopment(inputData, habitat)).minus(
        calculateExistingUnitsBaselineOnSite(inputData, habitat),
    );
}
function calculateExistingAreaOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.offSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum.plus(baseline.areaDecimal), ZERO);
}
function calculateExistingUnitsOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.offSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum.plus(baseline.totalHabitatUnitsDecimal), ZERO);
}
function calculateRetainedAreaOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.offSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce((sum, baseline) => sum.plus(baseline.areaRetainedDecimal), ZERO);
}
function calculateRetainedUnitsOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.offSiteHabitatBaselines
        .filter((baseline) => isHabitat(baseline, habitat))
        .reduce(
            (sum, baseline) =>
                sum
                    .plus(baseline.baselineUnitsRetainedDecimal)
                    .plus(baseline.vhdhBespokeCompensationUnitsDecimal),
            ZERO,
        );
}
function calculateProposedAreaCreationOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.offSiteHabitatCreations
        .filter((creation) => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum.plus(creation.areaDecimal), ZERO);
}
function calculateProposedUnitsCreationOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.offSiteHabitatCreations
        .filter((creation) => isHabitat(creation, habitat))
        .reduce((sum, creation) => sum.plus(creation.habitatUnitsDeliveredDecimal), ZERO);
}
function calculateProposedAreaEnhancementOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.offSiteHabitatEnhancements
        .filter((enhancement) => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum.plus(enhancement.areaDecimal), ZERO);
}
function calculateProposedUnitsEnhancementOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return inputData.offSiteHabitatEnhancements
        .filter((enhancement) => isHabitat(enhancement, habitat))
        .reduce((sum, enhancement) => sum.plus(enhancement.habitatUnitsDeliveredDecimal), ZERO);
}
function calculateTotalProposedAreaOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateRetainedAreaOffSite(inputData, habitat))
        .plus(calculateProposedAreaCreationOffSite(inputData, habitat))
        .plus(calculateProposedAreaEnhancementOffSite(inputData, habitat));
}
function calculateTotalProposedUnitsOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateRetainedUnitsOffSite(inputData, habitat))
        .plus(calculateProposedUnitsCreationOffSite(inputData, habitat))
        .plus(calculateProposedUnitsEnhancementOffSite(inputData, habitat));
}
function calculateOffSiteNetAreaChange(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateTotalProposedAreaOffSite(inputData, habitat)).minus(
        calculateExistingAreaOffSite(inputData, habitat),
    );
}
function calculateOffSiteNetUnitChange(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateTotalProposedUnitsOffSite(inputData, habitat)).minus(
        calculateExistingUnitsOffSite(inputData, habitat),
    );
}
function calculateOverallAreaChange(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateNetAreaChangeOnSite(inputData, habitat)).plus(
        calculateOffSiteNetAreaChange(inputData, habitat),
    );
}
function calculateOverallUnitChange(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateNetUnitChangeOnSite(inputData, habitat)).plus(
        calculateOffSiteNetUnitChange(inputData, habitat),
    );
}

/** This seems the same as calculateOverallUnitChange in calculation, but we follow the sheet for now */
function calculateUnitChangeIncludingOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    return new Decimal(calculateNetUnitChangeOnSite(inputData, habitat)).plus(
        calculateOffSiteNetUnitChange(inputData, habitat),
    );
}

function calculateUnitsRequiredOffSite(inputData: AllFeatures, habitat: Habitat): Decimal {
    const unitChange = calculateUnitChangeIncludingOffSite(inputData, habitat);
    return unitChange.lt(0) ? unitChange : ZERO;
}

// from https://stackoverflow.com/questions/69019873/how-can-i-get-typed-object-entries-and-object-fromentries-in-typescript
const typeSafeObjectFromEntries = <const T extends ReadonlyArray<readonly [PropertyKey, unknown]>>(
    entries: T,
): { [K in T[number] as K[0]]: K[1] } => {
    return Object.fromEntries(entries) as { [K in T[number] as K[0]]: K[1] };
};

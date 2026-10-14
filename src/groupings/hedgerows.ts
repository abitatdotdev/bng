import { Decimal } from '../decimal';
import type { AllFeatures } from '../features';
import { allHedgerows, hedgerowByLabel, isHedgerow, type Hedgerow, type HedgerowLabel } from '../hedgerows';

type ValuesByHedgerow = {
    [Label in HedgerowLabel]: {
        existingLengthBaselineOnSite: number;
        existingLengthBaselineOnSiteDecimal: Decimal;
        existingUnitsBaselineOnSite: number;
        existingUnitsBaselineOnSiteDecimal: Decimal;
        existingLengthRetainedOnSite: number;
        existingLengthRetainedOnSiteDecimal: Decimal;
        existingUnitsRetainedOnSite: number;
        existingUnitsRetainedOnSiteDecimal: Decimal;
        existingLengthLostOnSite: number;
        existingLengthLostOnSiteDecimal: Decimal;
        existingUnitsLostBaselineOnSite: number;
        existingUnitsLostBaselineOnSiteDecimal: Decimal;
        proposedLengthCreationOnSitePostDevelopment: number;
        proposedLengthCreationOnSitePostDevelopmentDecimal: Decimal;
        proposedUnitsCreationOnSitePostDevelopment: number;
        proposedUnitsCreationOnSitePostDevelopmentDecimal: Decimal;
        proposedLengthEnhancementOnSitePostDevelopment: number;
        proposedLengthEnhancementOnSitePostDevelopmentDecimal: Decimal;
        proposedUnitsEnhancementOnSitePostDevelopment: number;
        proposedUnitsEnhancementOnSitePostDevelopmentDecimal: Decimal;
        totalProposedLengthOnSitePostDevelopment: number;
        totalProposedLengthOnSitePostDevelopmentDecimal: Decimal;
        totalProposedUnitsOnSitePostDevelopment: number;
        totalProposedUnitsOnSitePostDevelopmentDecimal: Decimal;
        netLengthChangeOnSite: number;
        netLengthChangeOnSiteDecimal: Decimal;
        netUnitChangeOnSite: number;
        netUnitChangeOnSiteDecimal: Decimal;
        existingLengthOffSite: number;
        existingLengthOffSiteDecimal: Decimal;
        existingUnitsOffSite: number;
        existingUnitsOffSiteDecimal: Decimal;
        retainedLengthOffSite: number;
        retainedLengthOffSiteDecimal: Decimal;
        retainedUnitsOffSite: number;
        retainedUnitsOffSiteDecimal: Decimal;
        proposedLengthCreationOffSite: number;
        proposedLengthCreationOffSiteDecimal: Decimal;
        proposedUnitsCreationOffSite: number;
        proposedUnitsCreationOffSiteDecimal: Decimal;
        proposedLengthEnhancementOffSite: number;
        proposedLengthEnhancementOffSiteDecimal: Decimal;
        proposedUnitsEnhancementOffSite: number;
        proposedUnitsEnhancementOffSiteDecimal: Decimal;
        totalProposedLengthOffSite: number;
        totalProposedLengthOffSiteDecimal: Decimal;
        totalProposedUnitsOffSite: number;
        totalProposedUnitsOffSiteDecimal: Decimal;
        offSiteNetLengthChange: number;
        offSiteNetLengthChangeDecimal: Decimal;
        offSiteNetUnitChange: number;
        offSiteNetUnitChangeDecimal: Decimal;
        overallLengthChange: number;
        overallLengthChangeDecimal: Decimal;
        overallUnitChange: number;
        overallUnitChangeDecimal: Decimal;
    };
};

const hedgerowLabels = Object.keys(allHedgerows) as HedgerowLabel[];
const ZERO = new Decimal(0);

const valuesByHedgerowCache = new WeakMap<AllFeatures, ValuesByHedgerow>();

/**
 * Calculate values per hedgerow type.
 * NOTE: input data must not be mutated - results are cached per input object identity.
 */
export const valuesByHedgerow = (inputData: AllFeatures): ValuesByHedgerow => {
    const cached = valuesByHedgerowCache.get(inputData);
    if (cached) return cached;

    const results = typeSafeObjectFromEntries(
        hedgerowLabels.map((label) => {
            const hedgerow = hedgerowByLabel(label)!;

            const existingLengthBaselineOnSiteDecimal = calculateExistingLengthBaselineOnSite(
                inputData,
                hedgerow,
            );
            const existingUnitsBaselineOnSiteDecimal = calculateExistingUnitsBaselineOnSite(
                inputData,
                hedgerow,
            );
            const existingLengthRetainedOnSiteDecimal = calculateExistingLengthRetainedOnSite(
                inputData,
                hedgerow,
            );
            const existingUnitsRetainedOnSiteDecimal = calculateExistingUnitsRetainedOnSite(
                inputData,
                hedgerow,
            );
            const existingLengthLostOnSiteDecimal = calculateExistingLengthLostOnSite(inputData, hedgerow);
            const existingUnitsLostBaselineOnSiteDecimal = calculateExistingUnitsLostBaselineOnSite(
                inputData,
                hedgerow,
            );
            const proposedLengthCreationOnSitePostDevelopmentDecimal =
                calculateProposedLengthCreationOnSitePostDevelopment(inputData, hedgerow);
            const proposedUnitsCreationOnSitePostDevelopmentDecimal =
                calculateProposedUnitsCreationOnSitePostDevelopment(inputData, hedgerow);
            const proposedLengthEnhancementOnSitePostDevelopmentDecimal =
                calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, hedgerow);
            const proposedUnitsEnhancementOnSitePostDevelopmentDecimal =
                calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, hedgerow);
            const totalProposedLengthOnSitePostDevelopmentDecimal =
                calculateTotalProposedLengthOnSitePostDevelopment(inputData, hedgerow);
            const totalProposedUnitsOnSitePostDevelopmentDecimal =
                calculateTotalProposedUnitsOnSitePostDevelopment(inputData, hedgerow);
            const netLengthChangeOnSiteDecimal = calculateNetLengthChangeOnSite(inputData, hedgerow);
            const netUnitChangeOnSiteDecimal = calculateNetUnitChangeOnSite(inputData, hedgerow);
            const existingLengthOffSiteDecimal = calculateExistingLengthOffSite(inputData, hedgerow);
            const existingUnitsOffSiteDecimal = calculateExistingUnitsOffSite(inputData, hedgerow);
            const retainedLengthOffSiteDecimal = calculateRetainedLengthOffSite(inputData, hedgerow);
            const retainedUnitsOffSiteDecimal = calculateRetainedUnitsOffSite(inputData, hedgerow);
            const proposedLengthCreationOffSiteDecimal = calculateProposedLengthCreationOffSite(
                inputData,
                hedgerow,
            );
            const proposedUnitsCreationOffSiteDecimal = calculateProposedUnitsCreationOffSite(
                inputData,
                hedgerow,
            );
            const proposedLengthEnhancementOffSiteDecimal = calculateProposedLengthEnhancementOffSite(
                inputData,
                hedgerow,
            );
            const proposedUnitsEnhancementOffSiteDecimal = calculateProposedUnitsEnhancementOffSite(
                inputData,
                hedgerow,
            );
            const totalProposedLengthOffSiteDecimal = calculateTotalProposedLengthOffSite(
                inputData,
                hedgerow,
            );
            const totalProposedUnitsOffSiteDecimal = calculateTotalProposedUnitsOffSite(inputData, hedgerow);
            const offSiteNetLengthChangeDecimal = calculateOffSiteNetLengthChange(inputData, hedgerow);
            const offSiteNetUnitChangeDecimal = calculateOffSiteNetUnitChange(inputData, hedgerow);
            const overallLengthChangeDecimal = calculateOverallLengthChange(inputData, hedgerow);
            const overallUnitChangeDecimal = calculateOverallUnitChange(inputData, hedgerow);
            return [
                label,
                {
                    existingLengthBaselineOnSite: existingLengthBaselineOnSiteDecimal.toNumber(),
                    existingLengthBaselineOnSiteDecimal,
                    existingUnitsBaselineOnSite: existingUnitsBaselineOnSiteDecimal.toNumber(),
                    existingUnitsBaselineOnSiteDecimal,
                    existingLengthRetainedOnSite: existingLengthRetainedOnSiteDecimal.toNumber(),
                    existingLengthRetainedOnSiteDecimal,
                    existingUnitsRetainedOnSite: existingUnitsRetainedOnSiteDecimal.toNumber(),
                    existingUnitsRetainedOnSiteDecimal,
                    existingLengthLostOnSite: existingLengthLostOnSiteDecimal.toNumber(),
                    existingLengthLostOnSiteDecimal,
                    existingUnitsLostBaselineOnSite: existingUnitsLostBaselineOnSiteDecimal.toNumber(),
                    existingUnitsLostBaselineOnSiteDecimal,
                    proposedLengthCreationOnSitePostDevelopment:
                        proposedLengthCreationOnSitePostDevelopmentDecimal.toNumber(),
                    proposedLengthCreationOnSitePostDevelopmentDecimal,
                    proposedUnitsCreationOnSitePostDevelopment:
                        proposedUnitsCreationOnSitePostDevelopmentDecimal.toNumber(),
                    proposedUnitsCreationOnSitePostDevelopmentDecimal,
                    proposedLengthEnhancementOnSitePostDevelopment:
                        proposedLengthEnhancementOnSitePostDevelopmentDecimal.toNumber(),
                    proposedLengthEnhancementOnSitePostDevelopmentDecimal,
                    proposedUnitsEnhancementOnSitePostDevelopment:
                        proposedUnitsEnhancementOnSitePostDevelopmentDecimal.toNumber(),
                    proposedUnitsEnhancementOnSitePostDevelopmentDecimal,
                    totalProposedLengthOnSitePostDevelopment:
                        totalProposedLengthOnSitePostDevelopmentDecimal.toNumber(),
                    totalProposedLengthOnSitePostDevelopmentDecimal,
                    totalProposedUnitsOnSitePostDevelopment:
                        totalProposedUnitsOnSitePostDevelopmentDecimal.toNumber(),
                    totalProposedUnitsOnSitePostDevelopmentDecimal,
                    netLengthChangeOnSite: netLengthChangeOnSiteDecimal.toNumber(),
                    netLengthChangeOnSiteDecimal,
                    netUnitChangeOnSite: netUnitChangeOnSiteDecimal.toNumber(),
                    netUnitChangeOnSiteDecimal,
                    existingLengthOffSite: existingLengthOffSiteDecimal.toNumber(),
                    existingLengthOffSiteDecimal,
                    existingUnitsOffSite: existingUnitsOffSiteDecimal.toNumber(),
                    existingUnitsOffSiteDecimal,
                    retainedLengthOffSite: retainedLengthOffSiteDecimal.toNumber(),
                    retainedLengthOffSiteDecimal,
                    retainedUnitsOffSite: retainedUnitsOffSiteDecimal.toNumber(),
                    retainedUnitsOffSiteDecimal,
                    proposedLengthCreationOffSite: proposedLengthCreationOffSiteDecimal.toNumber(),
                    proposedLengthCreationOffSiteDecimal,
                    proposedUnitsCreationOffSite: proposedUnitsCreationOffSiteDecimal.toNumber(),
                    proposedUnitsCreationOffSiteDecimal,
                    proposedLengthEnhancementOffSite: proposedLengthEnhancementOffSiteDecimal.toNumber(),
                    proposedLengthEnhancementOffSiteDecimal,
                    proposedUnitsEnhancementOffSite: proposedUnitsEnhancementOffSiteDecimal.toNumber(),
                    proposedUnitsEnhancementOffSiteDecimal,
                    totalProposedLengthOffSite: totalProposedLengthOffSiteDecimal.toNumber(),
                    totalProposedLengthOffSiteDecimal,
                    totalProposedUnitsOffSite: totalProposedUnitsOffSiteDecimal.toNumber(),
                    totalProposedUnitsOffSiteDecimal,
                    offSiteNetLengthChange: offSiteNetLengthChangeDecimal.toNumber(),
                    offSiteNetLengthChangeDecimal,
                    offSiteNetUnitChange: offSiteNetUnitChangeDecimal.toNumber(),
                    offSiteNetUnitChangeDecimal,
                    overallLengthChange: overallLengthChangeDecimal.toNumber(),
                    overallLengthChangeDecimal,
                    overallUnitChange: overallUnitChangeDecimal.toNumber(),
                    overallUnitChangeDecimal,
                },
            ];
        }),
    );

    valuesByHedgerowCache.set(inputData, results);
    return results;
};

function calculateExistingLengthBaselineOnSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.onSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.lengthDecimal), ZERO);
}
function calculateExistingUnitsBaselineOnSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.onSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.totalHedgerowUnitsDecimal), ZERO);
}
function calculateExistingLengthRetainedOnSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.onSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.lengthRetainedDecimal), ZERO);
}
function calculateExistingUnitsRetainedOnSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.onSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.unitsRetainedDecimal), ZERO);
}
function calculateExistingLengthLostOnSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.onSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.lengthLostDecimal), ZERO);
}
function calculateExistingUnitsLostBaselineOnSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.onSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.unitsLostDecimal), ZERO);
}
function calculateProposedLengthCreationOnSitePostDevelopment(
    inputData: AllFeatures,
    hedgerow: Hedgerow,
): Decimal {
    return inputData.onSiteHedgerowCreations
        .filter((creation) => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => sum.plus(creation.lengthDecimal), ZERO);
}
function calculateProposedUnitsCreationOnSitePostDevelopment(
    inputData: AllFeatures,
    hedgerow: Hedgerow,
): Decimal {
    return inputData.onSiteHedgerowCreations
        .filter((creation) => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => sum.plus(creation.hedgerowUnitsDeliveredDecimal), ZERO);
}
function calculateProposedLengthEnhancementOnSitePostDevelopment(
    inputData: AllFeatures,
    hedgerow: Hedgerow,
): Decimal {
    return inputData.onSiteHedgerowEnhancements
        .filter((enhancement) => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => sum.plus(enhancement.lengthDecimal), ZERO);
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(
    inputData: AllFeatures,
    hedgerow: Hedgerow,
): Decimal {
    return inputData.onSiteHedgerowEnhancements
        .filter((enhancement) => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => sum.plus(enhancement.hedgerowUnitsDeliveredDecimal), ZERO);
}
function calculateTotalProposedLengthOnSitePostDevelopment(
    inputData: AllFeatures,
    hedgerow: Hedgerow,
): Decimal {
    return new Decimal(calculateExistingLengthRetainedOnSite(inputData, hedgerow))
        .plus(calculateProposedLengthCreationOnSitePostDevelopment(inputData, hedgerow))
        .plus(calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, hedgerow));
}
function calculateTotalProposedUnitsOnSitePostDevelopment(
    inputData: AllFeatures,
    hedgerow: Hedgerow,
): Decimal {
    return new Decimal(calculateExistingUnitsRetainedOnSite(inputData, hedgerow))
        .plus(calculateProposedUnitsCreationOnSitePostDevelopment(inputData, hedgerow))
        .plus(calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, hedgerow));
}
function calculateNetLengthChangeOnSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return new Decimal(calculateTotalProposedLengthOnSitePostDevelopment(inputData, hedgerow)).minus(
        calculateExistingLengthBaselineOnSite(inputData, hedgerow),
    );
}
function calculateNetUnitChangeOnSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return new Decimal(calculateTotalProposedUnitsOnSitePostDevelopment(inputData, hedgerow)).minus(
        calculateExistingUnitsBaselineOnSite(inputData, hedgerow),
    );
}
function calculateExistingLengthOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.offSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.lengthDecimal), ZERO);
}
function calculateExistingUnitsOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.offSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.totalHedgerowUnitsDecimal), ZERO);
}
function calculateRetainedLengthOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.offSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.lengthRetainedDecimal), ZERO);
}
function calculateRetainedUnitsOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.offSiteHedgerowBaselines
        .filter((baseline) => isHedgerow(baseline, hedgerow))
        .reduce((sum, baseline) => sum.plus(baseline.unitsRetainedDecimal), ZERO);
}
function calculateProposedLengthCreationOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.offSiteHedgerowCreations
        .filter((creation) => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => sum.plus(creation.lengthDecimal), ZERO);
}
function calculateProposedUnitsCreationOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.offSiteHedgerowCreations
        .filter((creation) => isHedgerow(creation, hedgerow))
        .reduce((sum, creation) => sum.plus(creation.hedgerowUnitsDeliveredDecimal), ZERO);
}
function calculateProposedLengthEnhancementOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.offSiteHedgerowEnhancements
        .filter((enhancement) => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => sum.plus(enhancement.lengthDecimal), ZERO);
}
function calculateProposedUnitsEnhancementOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return inputData.offSiteHedgerowEnhancements
        .filter((enhancement) => isHedgerow(enhancement, hedgerow))
        .reduce((sum, enhancement) => sum.plus(enhancement.hedgerowUnitsDeliveredDecimal), ZERO);
}
function calculateTotalProposedLengthOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return new Decimal(calculateRetainedLengthOffSite(inputData, hedgerow))
        .plus(calculateProposedLengthCreationOffSite(inputData, hedgerow))
        .plus(calculateProposedLengthEnhancementOffSite(inputData, hedgerow));
}
function calculateTotalProposedUnitsOffSite(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return new Decimal(calculateRetainedUnitsOffSite(inputData, hedgerow))
        .plus(calculateProposedUnitsCreationOffSite(inputData, hedgerow))
        .plus(calculateProposedUnitsEnhancementOffSite(inputData, hedgerow));
}
function calculateOffSiteNetLengthChange(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return new Decimal(calculateTotalProposedLengthOffSite(inputData, hedgerow)).minus(
        calculateExistingLengthOffSite(inputData, hedgerow),
    );
}
function calculateOffSiteNetUnitChange(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return new Decimal(calculateTotalProposedUnitsOffSite(inputData, hedgerow)).minus(
        calculateExistingUnitsOffSite(inputData, hedgerow),
    );
}
function calculateOverallLengthChange(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return new Decimal(calculateNetLengthChangeOnSite(inputData, hedgerow)).plus(
        calculateOffSiteNetLengthChange(inputData, hedgerow),
    );
}
function calculateOverallUnitChange(inputData: AllFeatures, hedgerow: Hedgerow): Decimal {
    return new Decimal(calculateNetUnitChangeOnSite(inputData, hedgerow)).plus(
        calculateOffSiteNetUnitChange(inputData, hedgerow),
    );
}

// from https://stackoverflow.com/questions/69019873/how-can-i-get-typed-object-entries-and-object-fromentries-in-typescript
const typeSafeObjectFromEntries = <const T extends ReadonlyArray<readonly [PropertyKey, unknown]>>(
    entries: T,
): { [K in T[number] as K[0]]: K[1] } => {
    return Object.fromEntries(entries) as { [K in T[number] as K[0]]: K[1] };
};

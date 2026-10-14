import { Decimal } from '../decimal';
import type { AllFeatures } from '../features';
import {
    allWatercourses,
    watercourseByLabel,
    isWatercourse,
    type Watercourse,
    type WatercourseLabel,
} from '../watercourses';

type ValuesByWatercourse = {
    [Label in WatercourseLabel]: {
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
        watercourseLabels.map((label) => {
            const watercourse = watercourseByLabel(label)!;

            const existingLengthBaselineOnSiteDecimal = calculateExistingLengthBaselineOnSite(
                inputData,
                watercourse,
            );
            const existingUnitsBaselineOnSiteDecimal = calculateExistingUnitsBaselineOnSite(
                inputData,
                watercourse,
            );
            const existingLengthRetainedOnSiteDecimal = calculateExistingLengthRetainedOnSite(
                inputData,
                watercourse,
            );
            const existingUnitsRetainedOnSiteDecimal = calculateExistingUnitsRetainedOnSite(
                inputData,
                watercourse,
            );
            const existingLengthLostOnSiteDecimal = calculateExistingLengthLostOnSite(inputData, watercourse);
            const existingUnitsLostBaselineOnSiteDecimal = calculateExistingUnitsLostBaselineOnSite(
                inputData,
                watercourse,
            );
            const proposedLengthCreationOnSitePostDevelopmentDecimal =
                calculateProposedLengthCreationOnSitePostDevelopment(inputData, watercourse);
            const proposedUnitsCreationOnSitePostDevelopmentDecimal =
                calculateProposedUnitsCreationOnSitePostDevelopment(inputData, watercourse);
            const proposedLengthEnhancementOnSitePostDevelopmentDecimal =
                calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, watercourse);
            const proposedUnitsEnhancementOnSitePostDevelopmentDecimal =
                calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, watercourse);
            const totalProposedLengthOnSitePostDevelopmentDecimal =
                calculateTotalProposedLengthOnSitePostDevelopment(inputData, watercourse);
            const totalProposedUnitsOnSitePostDevelopmentDecimal =
                calculateTotalProposedUnitsOnSitePostDevelopment(inputData, watercourse);
            const netLengthChangeOnSiteDecimal = calculateNetLengthChangeOnSite(inputData, watercourse);
            const netUnitChangeOnSiteDecimal = calculateNetUnitChangeOnSite(inputData, watercourse);
            const existingLengthOffSiteDecimal = calculateExistingLengthOffSite(inputData, watercourse);
            const existingUnitsOffSiteDecimal = calculateExistingUnitsOffSite(inputData, watercourse);
            const retainedLengthOffSiteDecimal = calculateRetainedLengthOffSite(inputData, watercourse);
            const retainedUnitsOffSiteDecimal = calculateRetainedUnitsOffSite(inputData, watercourse);
            const proposedLengthCreationOffSiteDecimal = calculateProposedLengthCreationOffSite(
                inputData,
                watercourse,
            );
            const proposedUnitsCreationOffSiteDecimal = calculateProposedUnitsCreationOffSite(
                inputData,
                watercourse,
            );
            const proposedLengthEnhancementOffSiteDecimal = calculateProposedLengthEnhancementOffSite(
                inputData,
                watercourse,
            );
            const proposedUnitsEnhancementOffSiteDecimal = calculateProposedUnitsEnhancementOffSite(
                inputData,
                watercourse,
            );
            const totalProposedLengthOffSiteDecimal = calculateTotalProposedLengthOffSite(
                inputData,
                watercourse,
            );
            const totalProposedUnitsOffSiteDecimal = calculateTotalProposedUnitsOffSite(
                inputData,
                watercourse,
            );
            const offSiteNetLengthChangeDecimal = calculateOffSiteNetLengthChange(inputData, watercourse);
            const offSiteNetUnitChangeDecimal = calculateOffSiteNetUnitChange(inputData, watercourse);
            const overallLengthChangeDecimal = calculateOverallLengthChange(inputData, watercourse);
            const overallUnitChangeDecimal = calculateOverallUnitChange(inputData, watercourse);
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

    valuesByWatercourseCache.set(inputData, results);
    return results;
};

function calculateExistingLengthBaselineOnSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.onSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.lengthDecimal), ZERO);
}
function calculateExistingUnitsBaselineOnSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.onSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.totalWatercourseUnitsDecimal), ZERO);
}
function calculateExistingLengthRetainedOnSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.onSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.lengthRetainedDecimal), ZERO);
}
function calculateExistingUnitsRetainedOnSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.onSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce(
            (sum, baseline) =>
                sum.plus(baseline.unitsRetainedDecimal).plus(baseline.vhdhBespokeCompensationUnitsDecimal ?? ZERO),
            ZERO,
        );
}
function calculateExistingLengthLostOnSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.onSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.lengthLostDecimal), ZERO);
}
function calculateExistingUnitsLostBaselineOnSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.onSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.unitsLostDecimal), ZERO);
}
function calculateProposedLengthCreationOnSitePostDevelopment(
    inputData: AllFeatures,
    watercourse: Watercourse,
): Decimal {
    return inputData.onSiteWatercourseCreations
        .filter((creation) => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum.plus(creation.lengthDecimal), ZERO);
}
function calculateProposedUnitsCreationOnSitePostDevelopment(
    inputData: AllFeatures,
    watercourse: Watercourse,
): Decimal {
    return inputData.onSiteWatercourseCreations
        .filter((creation) => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum.plus(creation.unitsDeliveredDecimal), ZERO);
}
function calculateProposedLengthEnhancementOnSitePostDevelopment(
    inputData: AllFeatures,
    watercourse: Watercourse,
): Decimal {
    return inputData.onSiteWatercourseEnhancements
        .filter((enhancement) => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum.plus(enhancement.lengthDecimal), ZERO);
}
function calculateProposedUnitsEnhancementOnSitePostDevelopment(
    inputData: AllFeatures,
    watercourse: Watercourse,
): Decimal {
    return inputData.onSiteWatercourseEnhancements
        .filter((enhancement) => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum.plus(enhancement.watercourseUnitsDeliveredDecimal), ZERO);
}
function calculateTotalProposedLengthOnSitePostDevelopment(
    inputData: AllFeatures,
    watercourse: Watercourse,
): Decimal {
    return new Decimal(calculateExistingLengthRetainedOnSite(inputData, watercourse))
        .plus(calculateProposedLengthCreationOnSitePostDevelopment(inputData, watercourse))
        .plus(calculateProposedLengthEnhancementOnSitePostDevelopment(inputData, watercourse));
}
function calculateTotalProposedUnitsOnSitePostDevelopment(
    inputData: AllFeatures,
    watercourse: Watercourse,
): Decimal {
    return new Decimal(calculateExistingUnitsRetainedOnSite(inputData, watercourse))
        .plus(calculateProposedUnitsCreationOnSitePostDevelopment(inputData, watercourse))
        .plus(calculateProposedUnitsEnhancementOnSitePostDevelopment(inputData, watercourse));
}
function calculateNetLengthChangeOnSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return new Decimal(calculateTotalProposedLengthOnSitePostDevelopment(inputData, watercourse)).minus(
        calculateExistingLengthBaselineOnSite(inputData, watercourse),
    );
}
function calculateNetUnitChangeOnSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return new Decimal(calculateTotalProposedUnitsOnSitePostDevelopment(inputData, watercourse)).minus(
        calculateExistingUnitsBaselineOnSite(inputData, watercourse),
    );
}
function calculateExistingLengthOffSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.offSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.lengthDecimal), ZERO);
}
function calculateExistingUnitsOffSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.offSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.totalWatercourseUnitsDecimal), ZERO);
}
function calculateRetainedLengthOffSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.offSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce((sum, baseline) => sum.plus(baseline.lengthRetainedDecimal), ZERO);
}
function calculateRetainedUnitsOffSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.offSiteWatercourseBaselines
        .filter((baseline) => isWatercourse(baseline, watercourse))
        .reduce(
            (sum, baseline) =>
                sum.plus(baseline.unitsRetainedDecimal).plus(baseline.vhdhBespokeCompensationUnitsDecimal ?? ZERO),
            ZERO,
        );
}
function calculateProposedLengthCreationOffSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.offSiteWatercourseCreations
        .filter((creation) => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum.plus(creation.lengthDecimal), ZERO);
}
function calculateProposedUnitsCreationOffSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.offSiteWatercourseCreations
        .filter((creation) => isWatercourse(creation, watercourse))
        .reduce((sum, creation) => sum.plus(creation.unitsDeliveredDecimal), ZERO);
}
function calculateProposedLengthEnhancementOffSite(
    inputData: AllFeatures,
    watercourse: Watercourse,
): Decimal {
    return inputData.offSiteWatercourseEnhancements
        .filter((enhancement) => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum.plus(enhancement.lengthDecimal), ZERO);
}
function calculateProposedUnitsEnhancementOffSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return inputData.offSiteWatercourseEnhancements
        .filter((enhancement) => isWatercourse(enhancement, watercourse))
        .reduce((sum, enhancement) => sum.plus(enhancement.watercourseUnitsDeliveredDecimal), ZERO);
}
function calculateTotalProposedLengthOffSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return new Decimal(calculateRetainedLengthOffSite(inputData, watercourse))
        .plus(calculateProposedLengthCreationOffSite(inputData, watercourse))
        .plus(calculateProposedLengthEnhancementOffSite(inputData, watercourse));
}
function calculateTotalProposedUnitsOffSite(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return new Decimal(calculateRetainedUnitsOffSite(inputData, watercourse))
        .plus(calculateProposedUnitsCreationOffSite(inputData, watercourse))
        .plus(calculateProposedUnitsEnhancementOffSite(inputData, watercourse));
}
function calculateOffSiteNetLengthChange(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return new Decimal(calculateTotalProposedLengthOffSite(inputData, watercourse)).minus(
        calculateExistingLengthOffSite(inputData, watercourse),
    );
}
function calculateOffSiteNetUnitChange(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return new Decimal(calculateTotalProposedUnitsOffSite(inputData, watercourse)).minus(
        calculateExistingUnitsOffSite(inputData, watercourse),
    );
}
function calculateOverallLengthChange(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return new Decimal(calculateNetLengthChangeOnSite(inputData, watercourse)).plus(
        calculateOffSiteNetLengthChange(inputData, watercourse),
    );
}
function calculateOverallUnitChange(inputData: AllFeatures, watercourse: Watercourse): Decimal {
    return new Decimal(calculateNetUnitChangeOnSite(inputData, watercourse)).plus(
        calculateOffSiteNetUnitChange(inputData, watercourse),
    );
}

// from https://stackoverflow.com/questions/69019873/how-can-i-get-typed-object-entries-and-object-fromentries-in-typescript
const typeSafeObjectFromEntries = <const T extends ReadonlyArray<readonly [PropertyKey, unknown]>>(
    entries: T,
): { [K in T[number] as K[0]]: K[1] } => {
    return Object.fromEntries(entries) as { [K in T[number] as K[0]]: K[1] };
};

import { Decimal, toDecimal } from './decimal';
import type { BespokeCompensation } from './bespokeCompensation';
import { allWatercourses } from './watercourses';

export function calculateVhdhBespokeCompensationUnits(input: {
    bespokeCompensation: BespokeCompensation;
    tradingRules: (typeof allWatercourses)[keyof typeof allWatercourses]['tradingRules'];
    totalWatercourseUnits: number;
    totalWatercourseUnitsDecimal?: Decimal;
    unitsRetained: number;
    unitsRetainedDecimal?: Decimal;
    unitsEnhanced: number;
    unitsEnhancedDecimal?: Decimal;
}) {
    const vhdhBespokeCompensationUnits =
        (input.bespokeCompensation === 'Yes' || input.bespokeCompensation === 'Pending') &&
        input.tradingRules === 'Same habitat required – bespoke compensation option ⚠'
            ? new Decimal(input.totalWatercourseUnitsDecimal ?? toDecimal(input.totalWatercourseUnits))
                  .minus(input.unitsRetainedDecimal ?? toDecimal(input.unitsRetained))
                  .minus(input.unitsEnhancedDecimal ?? toDecimal(input.unitsEnhanced))
            : 0;

    return {
        vhdhBespokeCompensationUnits: toDecimal(vhdhBespokeCompensationUnits).toNumber(),
        vhdhBespokeCompensationUnitsDecimal: toDecimal(vhdhBespokeCompensationUnits),
    };
}

export function enrichWithVhdhBespokeCompensationUnits<
    Data extends {
        bespokeCompensation: BespokeCompensation;
        tradingRules: (typeof allWatercourses)[keyof typeof allWatercourses]['tradingRules'];
        totalWatercourseUnits: number;
        totalWatercourseUnitsDecimal: Decimal;
        unitsRetained: number;
        unitsRetainedDecimal: Decimal;
        unitsEnhanced: number;
        unitsEnhancedDecimal: Decimal;
    },
>(data: Data) {
    return { ...data, ...calculateVhdhBespokeCompensationUnits(data) };
}

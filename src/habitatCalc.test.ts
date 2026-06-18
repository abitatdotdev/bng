import { expect, test, describe } from "bun:test";
import {
    calculateBaselineUnits,
    calculateTotalHabitatUnits,
} from './habitatCalc';

describe("calculateBaselineUnits with undefined score inputs", () => {
    // Simulates the unchecked-schema path where an invalid broadHabitat/habitatType
    // combo (e.g. "Heathland and shrub" + "Introduced shrub") causes
    // enrichWithHabitatData to throw and safeTransform to silently swallow,
    // leaving score fields undefined on the parsed row.
    test("returns numeric zeros (not undefined / NaN) when score inputs are undefined", () => {
        const result = calculateBaselineUnits({
            irreplaceableHabitat: false,
            area: 1.5,
            areaRetained: 1.5,
            areaEnhanced: 0,
            distinctivenessScore: undefined as unknown as number,
            conditionScore: undefined as unknown as number,
            strategicSignificanceMultiplier: undefined as unknown as number,
        });
        expect(result.baselineUnitsRetained).toBe(0);
        expect(result.baselineUnitsEnhanced).toBe(0);
        expect(result.areaHabitatLost).toBe(0);
    });
});

describe("calculateTotalHabitatUnits with undefined score inputs", () => {
    test("returns numeric zero (not undefined / NaN) when score inputs are undefined", () => {
        const result = calculateTotalHabitatUnits({
            requiredAction: "Same habitat required =",
            area: 1.5,
            areaRetained: 1.5,
            areaEnhanced: 0,
            bespokeCompensationAgreed: "No",
            baselineUnitsRetained: 0,
            baselineUnitsEnhanced: 0,
            distinctivenessScore: undefined as unknown as number,
            conditionScore: undefined as unknown as number,
            strategicSignificanceMultiplier: undefined as unknown as number,
        });
        expect(result.totalHabitatUnits).toBe(0);
    });
});

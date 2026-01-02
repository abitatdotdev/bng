import { expect, test } from "bun:test";
import { addTotalHabitatUnits, isValidIrreplaceable } from "./schemaUtils";

test("addTotalHabitatUnits - bespoke required and compensation agreed", () => {
    const data = {
        requiredAction: "Bespoke compensation likely to be required" as const,
        area: 100,
        areaRetained: 0,
        areaEnhanced: 0,
        bespokeCompensationAgreed: "Yes" as const,
        baselineUnitsRetained: 10,
        baselineUnitsEnhanced: 20,
        distinctivenessScore: 1.5,
        conditionScore: 0.8,
        strategicSignificanceMultiplier: 1.2,
    };

    const result = addTotalHabitatUnits(data);
    expect(result.totalHabitatUnits).toBe(0);
});

test("addTotalHabitatUnits - bespoke required with no bespoke compensation", () => {
    const data = {
        requiredAction: "Bespoke compensation likely to be required" as const,
        area: 100,
        areaRetained: 50,
        areaEnhanced: 0,
        bespokeCompensationAgreed: "No" as const,
        baselineUnitsRetained: 15,
        baselineUnitsEnhanced: 25,
        distinctivenessScore: 1.5,
        conditionScore: 0.8,
        strategicSignificanceMultiplier: 1.2,
    };

    const result = addTotalHabitatUnits(data);
    expect(result.totalHabitatUnits).toBe(40);
});

test("addTotalHabitatUnits - standard calculation", () => {
    const data = {
        requiredAction: "Compensation Not Required" as const,
        area: 100,
        areaRetained: 0,
        areaEnhanced: 0,
        bespokeCompensationAgreed: "No" as const,
        baselineUnitsRetained: 0,
        baselineUnitsEnhanced: 0,
        distinctivenessScore: 2,
        conditionScore: 0.75,
        strategicSignificanceMultiplier: 1.5,
    };

    const result = addTotalHabitatUnits(data);
    expect(result.totalHabitatUnits).toBe(225);
});

test("isValidIrreplaceable - non-irreplaceable habitats", () => {
    expect(isValidIrreplaceable("Woodland and forest", "Other coniferous woodland", false)).toBe(true);
    expect(isValidIrreplaceable("Woodland and forest", "Other coniferous woodland", true)).toBe(true);
});

test("isValidIrreplaceable - irreplaceable habitats", () => {
    expect(isValidIrreplaceable("Sparsely vegetated land", "Coastal sand dunes", true)).toBe(true);
    expect(isValidIrreplaceable("Sparsely vegetated land", "Coastal sand dunes", false)).toBe(false);
});

test("isValidIrreplaceable - invalid habitat combinations", () => {
    expect(isValidIrreplaceable("Individual trees", "Felled", true)).toBe(false);
    expect(isValidIrreplaceable("Individual trees", "Felled", false)).toBe(false);
});

test("isValidIrreplaceable - individual trees urban tree", () => {
    expect(isValidIrreplaceable("Individual trees", "Urban tree", true)).toBe(true);
    expect(isValidIrreplaceable("Individual trees", "Urban tree", false)).toBe(true);
});

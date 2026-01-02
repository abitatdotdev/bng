import { expect, test } from "bun:test";
import { addTotalHabitatUnits } from "./schemaUtils";

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

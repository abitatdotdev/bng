import { afterEach, expect, spyOn, test } from "bun:test";
import { addTotalHabitatUnits, enrichWithCreationData, enrichWithHabitatData, isValidIrreplaceable } from "./schemaUtils";

let warnSpy: ReturnType<typeof spyOn<Console, "warn">> | undefined;
afterEach(() => {
    warnSpy?.mockRestore();
    warnSpy = undefined;
});

test("addTotalHabitatUnits - bespoke required and compensation agreed", () => {
    const data = {
        irreplaceableHabitat: false,
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
        irreplaceableHabitat: false,
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
        irreplaceableHabitat: false,
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

test("addTotalHabitatUnits - irreplaceable zeros total units", () => {
    const data = {
        irreplaceableHabitat: true,
        requiredAction: "Compensation Not Required" as const,
        area: 0.0765,
        areaRetained: 0.0765,
        areaEnhanced: 0,
        bespokeCompensationAgreed: "No" as const,
        baselineUnitsRetained: 0,
        baselineUnitsEnhanced: 0,
        distinctivenessScore: 4,
        conditionScore: 3,
        strategicSignificanceMultiplier: 1,
    };

    const result = addTotalHabitatUnits(data);
    expect(result.totalHabitatUnits).toBe(0);
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

test("enrichWithHabitatData - falls back to type-only lookup on broad/type mismatch", () => {
    warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    const data = {
        broadHabitat: "Heathland and shrub" as const,
        habitatType: "Introduced shrub" as const,
        condition: "Condition Assessment N/A" as const,
        strategicSignificance: "Area/compensation not in local strategy/ no local strategy" as const,
        irreplaceableHabitat: false,
    };

    const result = enrichWithHabitatData(data);

    expect(result.broadHabitat).toBe("Heathland and shrub");
    expect(result._habitat.broadHabitat).toBe("Urban");
    expect(result._habitat.type).toBe("Introduced shrub");
    expect(result.distinctivenessScore).toBe(2);
    expect(result.conditionScore).toBe(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const warnMsg = String(warnSpy.mock.calls[0]?.[0] ?? "");
    expect(warnMsg).toContain("Heathland and shrub");
    expect(warnMsg).toContain("Introduced shrub");
});

test("enrichWithHabitatData - throws on totally unknown type", () => {
    warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    expect(() =>
        enrichWithHabitatData({
            broadHabitat: "Heathland and shrub" as const,
            // @ts-expect-error intentionally invalid
            habitatType: "Definitely not a real habitat type",
            condition: "Condition Assessment N/A",
            strategicSignificance: "Area/compensation not in local strategy/ no local strategy" as const,
            irreplaceableHabitat: false,
        })
    ).toThrow(/Unknown habitat/);
});

test("enrichWithCreationData - falls back to type-only lookup on broad/type mismatch", () => {
    warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    const result = enrichWithCreationData({
        broadHabitat: "Heathland and shrub" as const,
        habitatType: "Introduced shrub" as const,
        condition: "Condition Assessment N/A",
    });

    expect(result.broadHabitat).toBe("Heathland and shrub");
    expect(result.timeToTargetCondition).toBe(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const warnMsg = String(warnSpy.mock.calls[0]?.[0] ?? "");
    expect(warnMsg).toContain("Heathland and shrub");
    expect(warnMsg).toContain("Introduced shrub");
});

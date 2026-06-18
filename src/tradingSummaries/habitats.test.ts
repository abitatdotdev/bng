import { expect, test, describe } from "bun:test";
import { cumulativeBroadHabitatChange, habitatTradingSummary } from "./habitats";
import { type AllFeatures } from "../features";

function emptyFixture(overrides: Partial<AllFeatures> = {}): AllFeatures {
    return {
        onSiteHabitatBaselines: [],
        onSiteHabitatCreations: [],
        onSiteHabitatEnhancements: [],
        offSiteHabitatBaselines: [],
        offSiteHabitatCreations: [],
        offSiteHabitatEnhancements: [],
        onSiteHedgerowBaselines: [],
        onSiteHedgerowCreations: [],
        onSiteHedgerowEnhancements: [],
        offSiteHedgerowBaselines: [],
        offSiteHedgerowCreations: [],
        offSiteHedgerowEnhancements: [],
        onSiteWatercourseBaselines: [],
        onSiteWatercourseCreations: [],
        onSiteWatercourseEnhancements: [],
        offSiteWatercourseBaselines: [],
        offSiteWatercourseCreations: [],
        offSiteWatercourseEnhancements: [],
        ...overrides,
    };
}

// Habitat fixtures use broadHabitat + habitatType (the type field, not the label)
// V.High: broadHabitat="Grassland", habitatType="Lowland dry acid grassland"
// High:   broadHabitat="Grassland", habitatType="Traditional orchards"
// Medium: broadHabitat="Cropland",  habitatType="Arable field margins cultivated annually"
// Low:    broadHabitat="Cropland",  habitatType="Cereal crops"

describe("habitatTradingSummary", () => {
    test("all satisfied when no features present", () => {
        const result = habitatTradingSummary(emptyFixture());
        expect(result.vHighSatisfied).toBeTrue();
        expect(result.highSatisfied).toBeTrue();
        expect(result.mediumSatisfied).toBeTrue();
        expect(result.lowSatisfied).toBeTrue();
    });

    describe("vHighSatisfied", () => {
        test("satisfied when V.High habitat has net gain", () => {
            const input = emptyFixture({
                onSiteHabitatCreations: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", habitatUnitsDelivered: 10, area: 1 } as any,
                ],
            });
            expect(habitatTradingSummary(input).vHighSatisfied).toBeTrue();
        });

        test("satisfied when V.High habitat breaks even", () => {
            const input = emptyFixture({
                onSiteHabitatBaselines: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", totalHabitatUnits: 10, area: 10, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 10, unitsLost: 10 } as any,
                ],
                onSiteHabitatCreations: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", habitatUnitsDelivered: 10, area: 10 } as any,
                ],
            });
            expect(habitatTradingSummary(input).vHighSatisfied).toBeTrue();
        });

        test("not satisfied when V.High habitat has net loss", () => {
            const input = emptyFixture({
                onSiteHabitatBaselines: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", totalHabitatUnits: 20, area: 20, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 20, unitsLost: 20 } as any,
                ],
                onSiteHabitatCreations: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", habitatUnitsDelivered: 5, area: 5 } as any,
                ],
            });
            expect(habitatTradingSummary(input).vHighSatisfied).toBeFalse();
        });

        test("considers multiple V.High habitats together", () => {
            // One V.High gains 10, another V.High loses 15 -> net -5, not satisfied
            const input = emptyFixture({
                onSiteHabitatBaselines: [
                    { broadHabitat: "Grassland", habitatType: "Lowland meadows", totalHabitatUnits: 15, area: 15, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 15, unitsLost: 15 } as any,
                ],
                onSiteHabitatCreations: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", habitatUnitsDelivered: 10, area: 10 } as any,
                ],
            });
            expect(habitatTradingSummary(input).vHighSatisfied).toBeFalse();
        });
    });

    describe("highSatisfied", () => {
        test("satisfied when High habitat has net gain", () => {
            const input = emptyFixture({
                onSiteHabitatCreations: [
                    { broadHabitat: "Grassland", habitatType: "Lowland calcareous grassland", habitatUnitsDelivered: 10, area: 1 } as any,
                ],
            });
            expect(habitatTradingSummary(input).highSatisfied).toBeTrue();
        });

        test("not satisfied when High habitat has net loss", () => {
            const input = emptyFixture({
                onSiteHabitatBaselines: [
                    { broadHabitat: "Grassland", habitatType: "Lowland calcareous grassland", totalHabitatUnits: 20, area: 20, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 20, unitsLost: 20 } as any,
                ],
                onSiteHabitatCreations: [
                    { broadHabitat: "Grassland", habitatType: "Lowland calcareous grassland", habitatUnitsDelivered: 5, area: 5 } as any,
                ],
            });
            expect(habitatTradingSummary(input).highSatisfied).toBeFalse();
        });

        test("V.High surplus does not offset High losses via remainingLosses", () => {
            // highSatisfied checks sum of unitsRequiredOffSite for High habitats
            // unitsRequiredOffSite = min(unitChangeIncludingOffSite, 0) — purely per-habitat
            const input = emptyFixture({
                onSiteHabitatCreations: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", habitatUnitsDelivered: 50, area: 1 } as any,
                ],
                onSiteHabitatBaselines: [
                    { broadHabitat: "Grassland", habitatType: "Lowland calcareous grassland", totalHabitatUnits: 15, area: 15, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 15, unitsLost: 15 } as any,
                ],
            });
            expect(habitatTradingSummary(input).highSatisfied).toBeFalse();
        });
    });

    describe("mediumSatisfied", () => {
        test("satisfied when Medium habitat has net gain", () => {
            const input = emptyFixture({
                onSiteHabitatCreations: [
                    { broadHabitat: "Cropland", habitatType: "Arable field margins cultivated annually", habitatUnitsDelivered: 10, area: 1 } as any,
                ],
            });
            expect(habitatTradingSummary(input).mediumSatisfied).toBeTrue();
        });

        test("not satisfied when Medium has net loss and no higher-level surplus", () => {
            const input = emptyFixture({
                onSiteHabitatBaselines: [
                    { broadHabitat: "Cropland", habitatType: "Arable field margins cultivated annually", totalHabitatUnits: 20, area: 20, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 20, unitsLost: 20 } as any,
                ],
            });
            expect(habitatTradingSummary(input).mediumSatisfied).toBeFalse();
        });

        test("V.High and High surpluses offset Medium losses", () => {
            // Medium loses 10 units (upwards = -10)
            // V.High gains 5 (available downwards = 5), High gains 6 (available downwards = 6)
            // mediumSatisfied = vHighAvailable + highAvailable + mediumUpwards >= 0
            //                 = 5 + 6 + (-10) = 1 >= 0
            const input = emptyFixture({
                onSiteHabitatCreations: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", habitatUnitsDelivered: 5, area: 1 } as any,
                    { broadHabitat: "Grassland", habitatType: "Lowland calcareous grassland", habitatUnitsDelivered: 6, area: 1 } as any,
                ],
                onSiteHabitatBaselines: [
                    { broadHabitat: "Cropland", habitatType: "Arable field margins cultivated annually", totalHabitatUnits: 10, area: 10, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 10, unitsLost: 10 } as any,
                ],
            });
            expect(habitatTradingSummary(input).mediumSatisfied).toBeTrue();
        });

        test.only("medium surpluses cross-broad net towards overall tier success", () => {
            // Medium Grassland loses 10 units
            // Medium Shrub gains 11 units
            // Medium satisfied
            const input = emptyFixture({
                onSiteHabitatCreations: [
                    { broadHabitat: "Grassland", habitatType: "Other lowland acid grassland", habitatUnitsDelivered: 10, area: 1 } as any,
                    { broadHabitat: "Heathland and Shrub", habitatType: "Blackthorn scrub", habitatUnitsDelivered: 21, area: 1 } as any,
                ],
                onSiteHabitatBaselines: [
                    { broadHabitat: "Grassland", habitatType: "Other lowland acid grassland", totalHabitatUnits: 10, area: 10, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 20, unitsLost: 20 } as any,
                ],
            });
            console.info(habitatTradingSummary(input));
            expect(habitatTradingSummary(input).mediumSatisfied).toBeTrue();
        });
    });

    describe("lowSatisfied", () => {
        test("satisfied when Low habitat has net gain", () => {
            const input = emptyFixture({
                onSiteHabitatCreations: [
                    { broadHabitat: "Cropland", habitatType: "Cereal crops", habitatUnitsDelivered: 10, area: 1 } as any,
                ],
            });
            expect(habitatTradingSummary(input).lowSatisfied).toBeTrue();
        });

        test("not satisfied when Low has net loss and no surplus from above", () => {
            const input = emptyFixture({
                onSiteHabitatBaselines: [
                    { broadHabitat: "Cropland", habitatType: "Cereal crops", totalHabitatUnits: 20, area: 20, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 20, unitsLost: 20 } as any,
                ],
            });
            expect(habitatTradingSummary(input).lowSatisfied).toBeFalse();
        });

        test("Medium cumulative surplus carries down to Low", () => {
            // Medium gains 15, Low loses 10 -> cumulative surplus = 15 + (-10) = 5 >= 0
            const input = emptyFixture({
                onSiteHabitatCreations: [
                    { broadHabitat: "Cropland", habitatType: "Arable field margins cultivated annually", habitatUnitsDelivered: 15, area: 1 } as any,
                ],
                onSiteHabitatBaselines: [
                    { broadHabitat: "Cropland", habitatType: "Cereal crops", totalHabitatUnits: 10, area: 10, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 10, unitsLost: 10 } as any,
                ],
            });
            expect(habitatTradingSummary(input).lowSatisfied).toBeTrue();
        });

        test("negative Medium cumulative surplus does not carry down", () => {
            // Medium loses 5 (cumulative surplus < 0), Low loses 3
            // lowSatisfied uses only Low's netChangeInUnits = -3 < 0
            const input = emptyFixture({
                onSiteHabitatBaselines: [
                    { broadHabitat: "Cropland", habitatType: "Arable field margins cultivated annually", totalHabitatUnits: 5, area: 5, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 5, unitsLost: 5 } as any,
                    { broadHabitat: "Cropland", habitatType: "Cereal crops", totalHabitatUnits: 3, area: 3, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 3, unitsLost: 3 } as any,
                ],
            });
            expect(habitatTradingSummary(input).lowSatisfied).toBeFalse();
        });
    });

    describe("off-site contributions", () => {
        test("off-site enhancement contributes to unit change", () => {
            // On-site baseline loses 10, off-site enhancement gains 12
            // offSiteNetUnitChange = offSiteEnhancements units - offSiteBaselines units = 12 - 0 = 12
            // unitChangeIncludingOffSite = -10 + 12 = +2, satisfied
            const input = emptyFixture({
                onSiteHabitatBaselines: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", totalHabitatUnits: 10, area: 10, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 10, unitsLost: 10 } as any,
                ],
                offSiteHabitatEnhancements: [
                    { broadHabitat: "Grassland", habitatType: "Lowland dry acid grassland", habitatUnitsDelivered: 12, area: 12 } as any,
                ],
            });
            expect(habitatTradingSummary(input).vHighSatisfied).toBeTrue();
        });
    });
});

describe("cumulativeBroadHabitatChange", () => {
    test("returns zero for broads with habitats at the requested distinctiveness when no features present", () => {
        const result = cumulativeBroadHabitatChange(emptyFixture(), "High");
        // Grassland has at least one habitat type at High distinctiveness
        // (e.g. Traditional orchards) so the key is populated with 0.
        expect(result.Grassland).toBe(0);
    });

    test("groups per-broad unit change at the requested distinctiveness category", () => {
        const input = emptyFixture({
            onSiteHabitatBaselines: [
                { broadHabitat: "Grassland", habitatType: "Traditional orchards", totalHabitatUnits: 10, area: 10, areaRetained: 0, baselineUnitsRetained: 0, vhdhBespokeCompensationUnits: 0, areaHabitatLost: 10, unitsLost: 10 } as any,
            ],
            onSiteHabitatCreations: [
                { broadHabitat: "Grassland", habitatType: "Traditional orchards", habitatUnitsDelivered: 4, area: 4 } as any,
            ],
        });
        const high = cumulativeBroadHabitatChange(input, "High");
        expect(high.Grassland).toBe(-6);
        // A Grassland-only loss leaves Medium tier unchanged.
        const medium = cumulativeBroadHabitatChange(input, "Medium");
        expect(medium.Grassland ?? 0).toBe(0);
    });
});

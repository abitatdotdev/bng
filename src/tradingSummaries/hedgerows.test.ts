import { expect, test, describe } from "bun:test";
import { hedgerowTradingSummary } from "./hedgerows";
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

// V.High hedgerow: "Species-rich native hedgerow with trees - associated with bank or ditch"
// High hedgerow: "Species-rich native hedgerow with trees"
// Medium hedgerow: "Species-rich native hedgerow"
// Low hedgerow: "Native hedgerow"
// V.Low hedgerow: "Non-native and ornamental hedgerow"

describe("hedgerowTradingSummary (hedgerows)", () => {
    test("all satisfied when no features present", () => {
        const result = hedgerowTradingSummary(emptyFixture());
        expect(result.vHighSatisfied).toBeTrue();
        expect(result.highSatisfied).toBeTrue();
        expect(result.mediumSatisfied).toBeTrue();
        expect(result.lowSatisfied).toBeTrue();
        expect(result.vLowSatisfied).toBeTrue();
    });

    describe("vHighSatisfied", () => {
        test("satisfied when V.High hedgerow has net gain", () => {
            const input = emptyFixture({
                onSiteHedgerowCreations: [
                    { habitatType: "Species-rich native hedgerow with trees - associated with bank or ditch", hedgerowUnitsDelivered: 10, length: 100 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).vHighSatisfied).toBeTrue();
        });

        test("satisfied when V.High hedgerow breaks even", () => {
            const input = emptyFixture({
                onSiteHedgerowBaselines: [
                    { habitatType: "Species-rich native hedgerow with trees - associated with bank or ditch", totalHedgerowUnits: 10, length: 100, lengthRetained: 0, unitsRetained: 0, lengthLost: 100, unitsLost: 10 } as any,
                ],
                onSiteHedgerowCreations: [
                    { habitatType: "Species-rich native hedgerow with trees - associated with bank or ditch", hedgerowUnitsDelivered: 10, length: 100 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).vHighSatisfied).toBeTrue();
        });

        test("not satisfied when V.High hedgerow has net loss", () => {
            const input = emptyFixture({
                onSiteHedgerowBaselines: [
                    { habitatType: "Species-rich native hedgerow with trees - associated with bank or ditch", totalHedgerowUnits: 20, length: 200, lengthRetained: 0, unitsRetained: 0, lengthLost: 200, unitsLost: 20 } as any,
                ],
                onSiteHedgerowCreations: [
                    { habitatType: "Species-rich native hedgerow with trees - associated with bank or ditch", hedgerowUnitsDelivered: 5, length: 50 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).vHighSatisfied).toBeFalse();
        });
    });

    describe("highSatisfied", () => {
        test("satisfied when High hedgerow has net gain", () => {
            const input = emptyFixture({
                onSiteHedgerowCreations: [
                    { habitatType: "Species-rich native hedgerow with trees", hedgerowUnitsDelivered: 10, length: 100 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).highSatisfied).toBeTrue();
        });

        test("not satisfied when High has net loss and no V.High surplus", () => {
            const input = emptyFixture({
                onSiteHedgerowBaselines: [
                    { habitatType: "Species-rich native hedgerow with trees", totalHedgerowUnits: 15, length: 150, lengthRetained: 0, unitsRetained: 0, lengthLost: 150, unitsLost: 15 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).highSatisfied).toBeFalse();
        });

        test("V.High surplus offsets High losses", () => {
            // V.High gains 20 (available downwards), High loses 10 (upwards = -10)
            // highSatisfied = vHighAvailable + highUpwards >= 0 => 20 + (-10) = 10 >= 0
            const input = emptyFixture({
                onSiteHedgerowCreations: [
                    { habitatType: "Species-rich native hedgerow with trees - associated with bank or ditch", hedgerowUnitsDelivered: 20, length: 200 } as any,
                ],
                onSiteHedgerowBaselines: [
                    { habitatType: "Species-rich native hedgerow with trees", totalHedgerowUnits: 10, length: 100, lengthRetained: 0, unitsRetained: 0, lengthLost: 100, unitsLost: 10 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).highSatisfied).toBeTrue();
        });
    });

    describe("mediumSatisfied", () => {
        test("satisfied when Medium hedgerow has net gain", () => {
            const input = emptyFixture({
                onSiteHedgerowCreations: [
                    { habitatType: "Species-rich native hedgerow", hedgerowUnitsDelivered: 10, length: 100 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).mediumSatisfied).toBeTrue();
        });

        test("not satisfied when Medium has net loss and no surplus from above", () => {
            const input = emptyFixture({
                onSiteHedgerowBaselines: [
                    { habitatType: "Species-rich native hedgerow", totalHedgerowUnits: 20, length: 200, lengthRetained: 0, unitsRetained: 0, lengthLost: 200, unitsLost: 20 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).mediumSatisfied).toBeFalse();
        });

        test("High surplus carries down to Medium", () => {
            // High gains 15 (available downwards), Medium loses 10
            // unitsAvailableFromUpwards = highAvailable + max(highSurplus, 0) = 15 + 15 = 30
            // cumulativeSurplus = -10 + 30 = 20 >= 0
            const input = emptyFixture({
                onSiteHedgerowCreations: [
                    { habitatType: "Species-rich native hedgerow with trees", hedgerowUnitsDelivered: 15, length: 150 } as any,
                ],
                onSiteHedgerowBaselines: [
                    { habitatType: "Species-rich native hedgerow", totalHedgerowUnits: 10, length: 100, lengthRetained: 0, unitsRetained: 0, lengthLost: 100, unitsLost: 10 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).mediumSatisfied).toBeTrue();
        });
    });

    describe("lowSatisfied", () => {
        test("satisfied when Low hedgerow has net gain", () => {
            const input = emptyFixture({
                onSiteHedgerowCreations: [
                    { habitatType: "Native hedgerow", hedgerowUnitsDelivered: 10, length: 100 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).lowSatisfied).toBeTrue();
        });

        test("not satisfied when Low has net loss and no surplus from above", () => {
            const input = emptyFixture({
                onSiteHedgerowBaselines: [
                    { habitatType: "Native hedgerow", totalHedgerowUnits: 15, length: 150, lengthRetained: 0, unitsRetained: 0, lengthLost: 150, unitsLost: 15 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).lowSatisfied).toBeFalse();
        });

        test("Medium cumulative surplus carries down to Low", () => {
            // Medium gains 10, Low loses 5 -> Low cumulativeSurplus = -5 + 10 = 5 >= 0
            const input = emptyFixture({
                onSiteHedgerowCreations: [
                    { habitatType: "Species-rich native hedgerow", hedgerowUnitsDelivered: 10, length: 100 } as any,
                ],
                onSiteHedgerowBaselines: [
                    { habitatType: "Native hedgerow", totalHedgerowUnits: 5, length: 50, lengthRetained: 0, unitsRetained: 0, lengthLost: 50, unitsLost: 5 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).lowSatisfied).toBeTrue();
        });

        test("negative Medium surplus does not carry down", () => {
            // Medium loses 5 (cumulative surplus < 0), Low loses 3
            // lowSatisfied = netChange only = -3 < 0
            const input = emptyFixture({
                onSiteHedgerowBaselines: [
                    { habitatType: "Species-rich native hedgerow", totalHedgerowUnits: 5, length: 50, lengthRetained: 0, unitsRetained: 0, lengthLost: 50, unitsLost: 5 } as any,
                    { habitatType: "Native hedgerow", totalHedgerowUnits: 3, length: 30, lengthRetained: 0, unitsRetained: 0, lengthLost: 30, unitsLost: 3 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).lowSatisfied).toBeFalse();
        });
    });

    describe("vLowSatisfied", () => {
        test("satisfied when V.Low hedgerow has net gain", () => {
            const input = emptyFixture({
                onSiteHedgerowCreations: [
                    { habitatType: "Non-native and ornamental hedgerow", hedgerowUnitsDelivered: 10, length: 100 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).vLowSatisfied).toBeTrue();
        });

        test("not satisfied when V.Low has net loss and no surplus from above", () => {
            const input = emptyFixture({
                onSiteHedgerowBaselines: [
                    { habitatType: "Non-native and ornamental hedgerow", totalHedgerowUnits: 10, length: 100, lengthRetained: 0, unitsRetained: 0, lengthLost: 100, unitsLost: 10 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).vLowSatisfied).toBeFalse();
        });

        test("Low cumulative surplus carries down to V.Low", () => {
            // Low gains 8, V.Low loses 5 -> V.Low cumulativeSurplus = -5 + 8 = 3 >= 0
            const input = emptyFixture({
                onSiteHedgerowCreations: [
                    { habitatType: "Native hedgerow", hedgerowUnitsDelivered: 8, length: 80 } as any,
                ],
                onSiteHedgerowBaselines: [
                    { habitatType: "Non-native and ornamental hedgerow", totalHedgerowUnits: 5, length: 50, lengthRetained: 0, unitsRetained: 0, lengthLost: 50, unitsLost: 5 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).vLowSatisfied).toBeTrue();
        });

        test("negative Low surplus does not carry down", () => {
            // Low loses 3, V.Low loses 2 -> V.Low cumulativeSurplus = -2 (Low surplus not applied)
            const input = emptyFixture({
                onSiteHedgerowBaselines: [
                    { habitatType: "Native hedgerow", totalHedgerowUnits: 3, length: 30, lengthRetained: 0, unitsRetained: 0, lengthLost: 30, unitsLost: 3 } as any,
                    { habitatType: "Non-native and ornamental hedgerow", totalHedgerowUnits: 2, length: 20, lengthRetained: 0, unitsRetained: 0, lengthLost: 20, unitsLost: 2 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).vLowSatisfied).toBeFalse();
        });
    });

    describe("off-site contributions", () => {
        test("off-site enhancement contributes to hedgerow unit change", () => {
            // On-site baseline loses 10
            // offSiteNetUnitChange = offSiteEnhancements units - offSiteBaselines units = 12 - 0 = 12
            // overallUnitChange = -10 + 12 = +2 > 0, no remaining loss, satisfied
            const input = emptyFixture({
                onSiteHedgerowBaselines: [
                    { habitatType: "Species-rich native hedgerow with trees - associated with bank or ditch", totalHedgerowUnits: 10, length: 100, lengthRetained: 0, unitsRetained: 0, lengthLost: 100, unitsLost: 10 } as any,
                ],
                offSiteHedgerowEnhancements: [
                    { habitatType: "Species-rich native hedgerow with trees - associated with bank or ditch", hedgerowUnitsDelivered: 12, length: 120 } as any,
                ],
            });
            expect(hedgerowTradingSummary(input).vHighSatisfied).toBeTrue();
        });
    });
});

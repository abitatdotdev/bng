import { Decimal } from "../decimal";
import { expect, test, describe } from "bun:test";
import { watercourseTradingSummary } from "./watercourses";
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

// V.High watercourse: "Priority habitat"
// High watercourse: "Other rivers and streams"
// Medium watercourse: "Ditches", "Canals"
// Low watercourse: "Culvert"

describe("watercourseTradingSummary", () => {
    test("all satisfied when no features present", () => {
        const result = watercourseTradingSummary(emptyFixture());
        expect(result.vHighSatisfied).toBeTrue();
        expect(result.highSatisfied).toBeTrue();
        expect(result.mediumSatisfied).toBeTrue();
        expect(result.lowSatisfied).toBeTrue();
    });

    describe("vHighSatisfied", () => {
        test("satisfied when V.High watercourse has net gain", () => {
            const input = emptyFixture({
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Priority habitat",
                        unitsDelivered: 10,
                        unitsDeliveredDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).vHighSatisfied).toBeTrue();
        });

        test("satisfied when V.High watercourse breaks even", () => {
            const input = emptyFixture({
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Priority habitat",
                        totalWatercourseUnits: 10,
                        totalWatercourseUnitsDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 100,
                        lengthLostDecimal: new Decimal(100),
                        unitsLost: 10,
                        unitsLostDecimal: new Decimal(10),
                    } as any,
                ],
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Priority habitat",
                        unitsDelivered: 10,
                        unitsDeliveredDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).vHighSatisfied).toBeTrue();
        });

        test("not satisfied when V.High watercourse has net loss", () => {
            const input = emptyFixture({
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Priority habitat",
                        totalWatercourseUnits: 20,
                        totalWatercourseUnitsDecimal: new Decimal(20),
                        length: 200,
                        lengthDecimal: new Decimal(200),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 200,
                        lengthLostDecimal: new Decimal(200),
                        unitsLost: 20,
                        unitsLostDecimal: new Decimal(20),
                    } as any,
                ],
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Priority habitat",
                        unitsDelivered: 5,
                        unitsDeliveredDecimal: new Decimal(5),
                        length: 50,
                        lengthDecimal: new Decimal(50),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).vHighSatisfied).toBeFalse();
        });
    });

    describe("highSatisfied", () => {
        test("satisfied when High watercourse has net gain", () => {
            const input = emptyFixture({
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Other rivers and streams",
                        unitsDelivered: 10,
                        unitsDeliveredDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).highSatisfied).toBeTrue();
        });

        test("satisfied when High breaks even", () => {
            const input = emptyFixture({
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Other rivers and streams",
                        totalWatercourseUnits: 10,
                        totalWatercourseUnitsDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 100,
                        lengthLostDecimal: new Decimal(100),
                        unitsLost: 10,
                        unitsLostDecimal: new Decimal(10),
                    } as any,
                ],
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Other rivers and streams",
                        unitsDelivered: 10,
                        unitsDeliveredDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).highSatisfied).toBeTrue();
        });

        test("not satisfied when High watercourse has net loss", () => {
            const input = emptyFixture({
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Other rivers and streams",
                        totalWatercourseUnits: 15,
                        totalWatercourseUnitsDecimal: new Decimal(15),
                        length: 150,
                        lengthDecimal: new Decimal(150),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 150,
                        lengthLostDecimal: new Decimal(150),
                        unitsLost: 15,
                        unitsLostDecimal: new Decimal(15),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).highSatisfied).toBeFalse();
        });
    });

    describe("mediumSatisfied", () => {
        test("satisfied when Medium watercourse has net gain", () => {
            const input = emptyFixture({
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Ditches",
                        unitsDelivered: 10,
                        unitsDeliveredDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).mediumSatisfied).toBeTrue();
        });

        test("not satisfied when Medium has net loss", () => {
            const input = emptyFixture({
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Ditches",
                        totalWatercourseUnits: 10,
                        totalWatercourseUnitsDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 100,
                        lengthLostDecimal: new Decimal(100),
                        unitsLost: 10,
                        unitsLostDecimal: new Decimal(10),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).mediumSatisfied).toBeFalse();
        });

        test("not satisfied when one Medium watercourse loses even if another gains", () => {
            // remainingLosses = sum of per-watercourse negative changes
            // Ditches gains 8 (upwards=0), Canals loses 5 (upwards=-5) -> remainingLosses = -5 < 0
            const input = emptyFixture({
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Ditches",
                        unitsDelivered: 8,
                        unitsDeliveredDecimal: new Decimal(8),
                        length: 80,
                        lengthDecimal: new Decimal(80),
                    } as any,
                ],
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Canals",
                        totalWatercourseUnits: 5,
                        totalWatercourseUnitsDecimal: new Decimal(5),
                        length: 50,
                        lengthDecimal: new Decimal(50),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 50,
                        lengthLostDecimal: new Decimal(50),
                        unitsLost: 5,
                        unitsLostDecimal: new Decimal(5),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).mediumSatisfied).toBeFalse();
        });

        test("satisfied when all Medium watercourses have net gain", () => {
            // Ditches gains 3, Canals gains 2 -> remainingLosses = 0 + 0 = 0 >= 0
            const input = emptyFixture({
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Ditches",
                        unitsDelivered: 3,
                        unitsDeliveredDecimal: new Decimal(3),
                        length: 30,
                        lengthDecimal: new Decimal(30),
                    } as any,
                    {
                        watercourseType: "Canals",
                        unitsDelivered: 2,
                        unitsDeliveredDecimal: new Decimal(2),
                        length: 20,
                        lengthDecimal: new Decimal(20),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).mediumSatisfied).toBeTrue();
        });
    });

    describe("lowSatisfied", () => {
        test("satisfied when Low watercourse has net gain", () => {
            const input = emptyFixture({
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Culvert",
                        unitsDelivered: 10,
                        unitsDeliveredDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).lowSatisfied).toBeTrue();
        });

        test("not satisfied when Low has net loss and no surplus from above", () => {
            const input = emptyFixture({
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Culvert",
                        totalWatercourseUnits: 10,
                        totalWatercourseUnitsDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 100,
                        lengthLostDecimal: new Decimal(100),
                        unitsLost: 10,
                        unitsLostDecimal: new Decimal(10),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).lowSatisfied).toBeFalse();
        });

        test("higher level surpluses carry down to Low", () => {
            // V.High gains 5 (downwards=5), High gains 3 (downwards=3), Medium gains 4 (downwards=4)
            // cumulativeSurplus = 5 + 3 + 4 + (-10) = 2 >= 0
            const input = emptyFixture({
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Priority habitat",
                        unitsDelivered: 5,
                        unitsDeliveredDecimal: new Decimal(5),
                        length: 50,
                        lengthDecimal: new Decimal(50),
                    } as any,
                    {
                        watercourseType: "Other rivers and streams",
                        unitsDelivered: 3,
                        unitsDeliveredDecimal: new Decimal(3),
                        length: 30,
                        lengthDecimal: new Decimal(30),
                    } as any,
                    {
                        watercourseType: "Ditches",
                        unitsDelivered: 4,
                        unitsDeliveredDecimal: new Decimal(4),
                        length: 40,
                        lengthDecimal: new Decimal(40),
                    } as any,
                ],
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Culvert",
                        totalWatercourseUnits: 10,
                        totalWatercourseUnitsDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 100,
                        lengthLostDecimal: new Decimal(100),
                        unitsLost: 10,
                        unitsLostDecimal: new Decimal(10),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).lowSatisfied).toBeTrue();
        });

        test("not satisfied when higher surpluses insufficient", () => {
            // V.High gains 2 (downwards=2), High gains 1 (downwards=1), Medium gains 1 (downwards=1)
            // cumulativeSurplus = 2 + 1 + 1 + (-10) = -6 < 0
            const input = emptyFixture({
                onSiteWatercourseCreations: [
                    {
                        watercourseType: "Priority habitat",
                        unitsDelivered: 2,
                        unitsDeliveredDecimal: new Decimal(2),
                        length: 20,
                        lengthDecimal: new Decimal(20),
                    } as any,
                    {
                        watercourseType: "Other rivers and streams",
                        unitsDelivered: 1,
                        unitsDeliveredDecimal: new Decimal(1),
                        length: 10,
                        lengthDecimal: new Decimal(10),
                    } as any,
                    {
                        watercourseType: "Ditches",
                        unitsDelivered: 1,
                        unitsDeliveredDecimal: new Decimal(1),
                        length: 10,
                        lengthDecimal: new Decimal(10),
                    } as any,
                ],
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Culvert",
                        totalWatercourseUnits: 10,
                        totalWatercourseUnitsDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 100,
                        lengthLostDecimal: new Decimal(100),
                        unitsLost: 10,
                        unitsLostDecimal: new Decimal(10),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).lowSatisfied).toBeFalse();
        });
    });

    describe("off-site contributions", () => {
        test("off-site enhancement contributes to watercourse unit change", () => {
            // On-site baseline loses 10
            // offSiteNetUnitChange = offSiteEnhancements units - offSiteBaselines units = 12 - 0 = 12
            // overallUnitChange = -10 + 12 = +2 >= 0, satisfied
            const input = emptyFixture({
                onSiteWatercourseBaselines: [
                    {
                        watercourseType: "Priority habitat",
                        totalWatercourseUnits: 10,
                        totalWatercourseUnitsDecimal: new Decimal(10),
                        length: 100,
                        lengthDecimal: new Decimal(100),
                        lengthRetained: 0,
                        lengthRetainedDecimal: new Decimal(0),
                        unitsRetained: 0,
                        unitsRetainedDecimal: new Decimal(0),
                        lengthLost: 100,
                        lengthLostDecimal: new Decimal(100),
                        unitsLost: 10,
                        unitsLostDecimal: new Decimal(10),
                    } as any,
                ],
                offSiteWatercourseEnhancements: [
                    {
                        watercourseType: "Priority habitat",
                        watercourseUnitsDelivered: 12,
                        watercourseUnitsDeliveredDecimal: new Decimal(12),
                        length: 120,
                        lengthDecimal: new Decimal(120),
                    } as any,
                ],
            });
            expect(watercourseTradingSummary(input).vHighSatisfied).toBeTrue();
        });
    });
});

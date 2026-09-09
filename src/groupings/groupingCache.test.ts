import { describe, expect, test } from "bun:test";
import type { AllFeatures } from "../features";
import { valuesByHedgerow } from "./hedgerows";
import { valuesByWatercourse } from "./watercourses";

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

describe("grouping caches", () => {
    test("reuses hedgerow values for the same input object", () => {
        const input = emptyFixture();

        expect(valuesByHedgerow(input)).toBe(valuesByHedgerow(input));
    });

    test("recalculates hedgerow values for a new input object", () => {
        const original = emptyFixture();
        const changed = {
            ...original,
            onSiteHedgerowCreations: [
                {
                    habitatType: "Native hedgerow",
                    hedgerowUnitsDelivered: 3,
                    length: 10,
                } as AllFeatures["onSiteHedgerowCreations"][number],
            ],
        };

        expect(valuesByHedgerow(original)["Native hedgerow"].overallUnitChange).toBe(0);
        expect(valuesByHedgerow(changed)["Native hedgerow"].overallUnitChange).toBe(3);
    });

    test("reuses watercourse values for the same input object", () => {
        const input = emptyFixture();

        expect(valuesByWatercourse(input)).toBe(valuesByWatercourse(input));
    });

    test("recalculates watercourse values for a new input object", () => {
        const original = emptyFixture();
        const changed = {
            ...original,
            onSiteWatercourseCreations: [
                {
                    watercourseType: "Ditches",
                    unitsDelivered: 4,
                    length: 10,
                } as AllFeatures["onSiteWatercourseCreations"][number],
            ],
        };

        expect(valuesByWatercourse(original).Ditches.overallUnitChange).toBe(0);
        expect(valuesByWatercourse(changed).Ditches.overallUnitChange).toBe(4);
    });
});

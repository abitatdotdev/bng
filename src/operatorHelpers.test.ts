import { expect, test, describe } from "bun:test";
import {
    calculateDifficultyMultiplier,
    standardYearsToTarget,
    strategicSignificanceMultiplier,
} from "./operatorHelpers";
import { difficulty } from "./difficulty";
import { allHedgerows } from "./hedgerows";

describe("calculateDifficultyMultiplier", () => {
    test("baseline role → neutral", () => {
        expect(
            calculateDifficultyMultiplier({ role: "baseline", standardDifficulty: "High" }),
        ).toBe(1);
    });

    test("creation with standard Medium → Medium multiplier", () => {
        expect(
            calculateDifficultyMultiplier({ role: "creation", standardDifficulty: "Medium" }),
        ).toBe(difficulty.Medium);
    });

    test("enhancement with standard High → High multiplier", () => {
        expect(
            calculateDifficultyMultiplier({ role: "enhancement", standardDifficulty: "High" }),
        ).toBe(difficulty.High);
    });

    test("inAdvance downgrades to Low (1.0)", () => {
        expect(
            calculateDifficultyMultiplier({
                role: "creation",
                standardDifficulty: "High",
                inAdvance: true,
            }),
        ).toBe(difficulty.Low);
    });

    test("missing standardDifficulty → 1.0 fallback", () => {
        expect(
            calculateDifficultyMultiplier({ role: "creation", standardDifficulty: null }),
        ).toBe(1);
    });
});

describe("strategicSignificanceMultiplier", () => {
    test("canonical High description → 1.15", () => {
        expect(
            strategicSignificanceMultiplier("Formally identified in local strategy"),
        ).toBe(1.15);
    });

    test("Medium description → 1.1", () => {
        expect(
            strategicSignificanceMultiplier(
                "Location ecologically desirable but not in local strategy",
            ),
        ).toBe(1.1);
    });

    test("Low description → 1.0", () => {
        expect(
            strategicSignificanceMultiplier(
                "Area/compensation not in local strategy/ no local strategy",
            ),
        ).toBe(1);
    });

    test("bucketed category string → matches by prefix", () => {
        expect(strategicSignificanceMultiplier("High strategic significance")).toBe(1.15);
        expect(strategicSignificanceMultiplier("Medium strategic significance")).toBe(1.1);
        expect(strategicSignificanceMultiplier("Low strategic significance")).toBe(1);
    });

    test("missing / unknown → 1.0", () => {
        expect(strategicSignificanceMultiplier(null)).toBe(1);
        expect(strategicSignificanceMultiplier(undefined)).toBe(1);
        expect(strategicSignificanceMultiplier("nonsense")).toBe(1);
    });
});

describe("standardYearsToTarget", () => {
    test("habitat creation: Modified grassland → Good = 7", () => {
        expect(
            standardYearsToTarget("Grassland - Modified grassland", null, "Good", "creation"),
        ).toBe(7);
    });

    test("habitat enhancement: Modified grassland Poor → Good = 15", () => {
        expect(
            standardYearsToTarget(
                "Grassland - Modified grassland",
                "Poor",
                "Good",
                "enhancement",
            ),
        ).toBe(15);
    });

    test("hedgerow creation: Species-rich-with-trees-with-bank Good = 20", () => {
        expect(
            standardYearsToTarget(
                "Species-rich native hedgerow with trees - associated with bank or ditch",
                null,
                "Good",
                "creation",
            ),
        ).toBe(20);
    });

    test("hedgerow enhancement: Poor to Good = 10", () => {
        expect(
            standardYearsToTarget(
                "Species-rich native hedgerow with trees - associated with bank or ditch",
                "Poor",
                "Good",
                "enhancement",
            ),
        ).toBe(10);
    });

    test("hedgerow distinctiveness pathway", () => {
        expect(
            standardYearsToTarget(
                "Species-rich native hedgerow with trees",
                null,
                "Species-rich native hedgerow with trees - associated with bank or ditch",
                "distinctiveness",
            ),
        ).toBe(5);
    });

    test("disqualified ('Not Possible ▲') passes through the sentinel", () => {
        // Cropland habitats have 'Not Possible ▲' for every target condition.
        // The helper now returns the raw sentinel so callers can route it
        // through lookupTemporalMultiplier instead of collapsing to 0.
        expect(
            standardYearsToTarget(
                "Cropland - Arable field margins cultivated annually",
                null,
                "Good",
                "creation",
            ),
        ).toBe("Not Possible ▲");
    });

    test("habitat enhancement: Lowland mixed deciduous woodland Poor → Good = '30+'", () => {
        // Regression: previously returned 0 because the lookup value is a
        // string sentinel, which silently collapsed enhancement scoring to
        // creation-form arithmetic in downstream consumers.
        expect(
            standardYearsToTarget(
                "Woodland and forest - Lowland mixed deciduous woodland",
                "Poor",
                "Good",
                "enhancement",
            ),
        ).toBe("30+");
    });

    test("habitat enhancement: 'Not Possible ▲' sentinel passes through", () => {
        // Cropland enhancement Poor → Good is 'Not Possible ▲'.
        expect(
            standardYearsToTarget(
                "Cropland - Arable field margins cultivated annually",
                "Poor",
                "Good",
                "enhancement",
            ),
        ).toBe("Not Possible ▲");
    });

    test("watercourse creation: Ditches → Moderate = 5, from the shared condition table", () => {
        // Regression: this read the per-type `yearsToTargetConditionViaCreation`
        // (Ditches → Moderate = 2), which is not the table the metric uses.
        // The 3-year gap reads downstream as a phantom "created in advance"
        // credit — it inflates the temporal multiplier from 0.965^5 to
        // 0.965^2, over-valuing the stock by 11.3%.
        expect(standardYearsToTarget("Ditches", null, "Moderate", "creation")).toBe(5);
    });

    test("watercourse creation: condition table is shared across types", () => {
        // No watercourse type carries its own creation table — the times come
        // from the target condition alone, so every type agrees. Mirrors the
        // enhancement case below.
        for (const label of [
            "Priority habitat",
            "Other rivers and streams",
            "Ditches",
            "Canals",
            "Culvert",
        ]) {
            expect(standardYearsToTarget(label, null, "Moderate", "creation")).toBe(5);
        }
    });

    test("watercourse creation: every condition matches the metric's table", () => {
        // `yearsToTargetCondition` in src/watercourseCondition.ts — the same
        // table `enrichWithCreationWatercourseData` drives the row pipeline from.
        const expected = {
            "Good": 10,
            "Fairly Good": 8,
            "Moderate": 5,
            "Fairly Poor": 2,
            "Poor": 1,
        } as const;
        for (const [condition, years] of Object.entries(expected)) {
            expect(standardYearsToTarget("Ditches", null, condition, "creation")).toBe(years);
        }
    });

    test("hedgerow creation still reads its own per-type table", () => {
        // Hedgerows genuinely DO hold creation times per type — the
        // watercourse fix must not divert them to the watercourse table.
        expect(
            standardYearsToTarget("Native hedgerow", null, "Moderate", "creation"),
        ).toBe(allHedgerows["Native hedgerow"].yearsToTargetConditionViaCreation["Moderate"]);
    });

    test("watercourse enhancement: Ditches Poor → Moderate = 4", () => {
        expect(standardYearsToTarget("Ditches", "Poor", "Moderate", "enhancement")).toBe(4);
    });

    test("watercourse enhancement: pathway matrix is shared across types", () => {
        // No watercourse type carries its own enhancement table — the times
        // come from the condition pathway alone, so every type agrees.
        for (const label of ["Priority habitat", "Other rivers and streams", "Canals", "Culvert"]) {
            expect(standardYearsToTarget(label, "Poor", "Moderate", "enhancement")).toBe(4);
        }
        expect(standardYearsToTarget("Ditches", "Moderate", "Good", "enhancement")).toBe(4);
        expect(standardYearsToTarget("Ditches", "Poor", "Good", "enhancement")).toBe(8);
        expect(standardYearsToTarget("Ditches", "Good", "Good", "enhancement")).toBe(1);
    });

    test("watercourse enhancement: downgrade pathway is not possible", () => {
        // "Good to Moderate" is 'N/A' in the matrix — normalise to the same
        // sentinel the habitat tables use so callers short-circuit on it.
        expect(standardYearsToTarget("Ditches", "Good", "Moderate", "enhancement")).toBe(
            "Not Possible ▲",
        );
    });

    test("unknown habitat label → 0", () => {
        expect(standardYearsToTarget("Nonsense habitat", null, "Good", "creation")).toBe(0);
    });
});

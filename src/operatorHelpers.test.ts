import { expect, test, describe } from "bun:test";
import {
    calculateDifficultyMultiplier,
    standardYearsToTarget,
    strategicSignificanceMultiplier,
} from "./operatorHelpers";
import { difficulty } from "./difficulty";

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

    test("unknown habitat label → 0", () => {
        expect(standardYearsToTarget("Nonsense habitat", null, "Good", "creation")).toBe(0);
    });
});

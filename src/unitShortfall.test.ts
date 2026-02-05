import { describe, test, expect } from "bun:test";
import { featureShortfall, a1BalancingShortfall } from "./unitShortfall";
import type { HeadlineResults } from "./headlineResults";

describe("featureShortfall", () => {
    test("returns deficit when -finalLosses < deficit", () => {
        // -(-5) = 5 < 10
        const result = featureShortfall(-5, 10, 20);
        expect(result).toBe(10);
    });

    test("returns -finalLosses when deficit is zero", () => {
        // deficit = 0 <= 0
        const result = featureShortfall(-5, 0, 20);
        expect(result).toBe(5);
    });

    test("returns -finalLosses when deficit is negative", () => {
        // deficit = -2 <= 0
        const result = featureShortfall(-5, -2, 20);
        expect(result).toBe(5);
    });

    test("returns deficit when -finalLosses < deficit (even if deficit >= requiredGap)", () => {
        // -(-5) = 5 < 20, so first condition catches this
        // deficit = 20 >= requiredGap = 15, but first check takes precedence
        const result = featureShortfall(-5, 20, 15);
        expect(result).toBe(20); // returns deficit, not -finalLosses
    });

    test("returns -finalLosses + deficit in the else case", () => {
        // -(-10) = 10 not < 5, deficit = 5 not <= 0, deficit = 5 not >= 20
        // returns -(-10) + 5 = 15
        const result = featureShortfall(-10, 5, 20);
        expect(result).toBe(15);
    });

    test("handles edge case with exact values", () => {
        // -(-8) = 8 < 10, so first condition is met
        // deficit = 10 exactly equals requiredGap = 10
        const result = featureShortfall(-8, 10, 10);
        expect(result).toBe(10); // returns deficit since -finalLosses < deficit
    });

    test("returns -finalLosses when deficit >= requiredGap (after passing first two checks)", () => {
        // -(-15) = 15 not < 10, deficit = 10 not <= 0, deficit = 10 >= requiredGap = 8
        const result = featureShortfall(-15, 10, 8);
        expect(result).toBe(15); // returns -finalLosses
    });

    test("handles case where -finalLosses equals deficit", () => {
        // -(-7) = 7 not < 7, deficit = 7 not <= 0, deficit = 7 not >= 20
        const result = featureShortfall(-7, 7, 20);
        expect(result).toBe(14); // returns -(-7) + 7 = 14
    });
});

describe("a1BalancingShortfall", () => {
    // Helper to create mock headline results
    const createHeadline = (
        unitDeficit: number,
        requiredUnits: number,
        baselineUnits: number
    ): HeadlineResults => ({
        habitatUnitSummary: {
            target: 1.1,
            unitDeficit,
            requiredUnits,
            baselineUnits,
        },
        hedgerowUnitSummary: {
            target: 1.1,
            unitDeficit: 0,
            requiredUnits: 0,
            baselineUnits: 0,
        },
        watercourseUnitSummary: {
            target: 1.1,
            unitDeficit: 0,
            requiredUnits: 0,
            baselineUnits: 0,
        },
    } as HeadlineResults);

    // Helper to create mock tier details
    const createDetails = (highA1: number, mediumA1: number, lowA1: number) => ({
        high: {
            a1: { lossesInTier: highA1, unitChange: [] },
            a2: { lossesInTier: 0, unitChange: [] },
            a3: { lossesInTier: 0, unitChange: [] },
            a4: { lossesInTier: 0, unitChange: [] },
            a5: { lossesInTier: 0, unitChange: [] },
        },
        medium: {
            a1: { rule1: [], rule2: 0, rule3: 0, rule4: 0, finalLosses: mediumA1 },
            a2: { rule1: [], rule2: 0, rule3: 0, rule4: 0, finalLosses: 0 },
            a4: { rule1: [], rule2: 0, rule3: 0, rule4: 0, finalLosses: 0 },
        },
        low: {
            a1: {
                netUnitChange: 0,
                unitChangeFollowingOffset: 0,
                unitsRemainingAfterRule5: 0,
                finalLosses: lowA1,
            },
        },
        vh: {
            a5: { netGains: 0, netLosses: 0 },
        },
        hedgerows: { finalLosses: 0 },
        watercourses: { finalLosses: 0 },
    });

    test("returns -allA1Losses when a2ToA5Shortfalls - allA1Losses >= habitatUnitDeficit", () => {
        // a2ToA5Shortfalls = 50, allA1Losses = 10, habitatUnitDeficit = 30
        // 50 - 10 = 40 >= 30 → returns -10
        const headline = createHeadline(30, 100, 70);
        const shortfalls = { a2: 10, a3: 15, a4: 10, a5: 15 }; // sum = 50
        const details = createDetails(-5, -3, -2); // sum = -10

        const result = a1BalancingShortfall(headline, shortfalls, details);
        expect(result).toBe(10);
    });

    test("returns complex calculation when a2ToA5Shortfalls - allA1Losses >= habitatUnitDeficit - unitGap", () => {
        // unitGap = 30, habitatUnitDeficit = 35
        // a2ToA5Shortfalls = 20, allA1Losses = -10
        // Check 1: 20 - (-10) = 30 >= 35? NO
        // Check 2: 30 >= 35 - 30 = 5? YES
        // returns -(-10) + 35 - 20 + (-10) = 10 + 35 - 20 - 10 = 15
        const headline = createHeadline(35, 100, 70);
        const shortfalls = { a2: 5, a3: 5, a4: 5, a5: 5 }; // sum = 20
        const details = createDetails(-4, -3, -3); // sum = -10

        const result = a1BalancingShortfall(headline, shortfalls, details);
        expect(result).toBe(15);
    });

    test("returns -allA1Losses when habitatUnitDeficit <= 0", () => {
        // habitatUnitDeficit = 0 <= 0
        const headline = createHeadline(0, 100, 100);
        const shortfalls = { a2: 5, a3: 5, a4: 5, a5: 5 };
        const details = createDetails(-4, -3, -3); // sum = -10

        const result = a1BalancingShortfall(headline, shortfalls, details);
        expect(result).toBe(10);
    });

    test("returns -allA1Losses when habitatUnitDeficit is negative", () => {
        // habitatUnitDeficit = -5 <= 0
        const headline = createHeadline(-5, 100, 105);
        const shortfalls = { a2: 5, a3: 5, a4: 5, a5: 5 };
        const details = createDetails(-4, -3, -3); // sum = -10

        const result = a1BalancingShortfall(headline, shortfalls, details);
        expect(result).toBe(10);
    });

    test("returns habitatUnitDeficit - a2ToA5Shortfalls when a2ToA5 - allA1 < deficit", () => {
        // unitGap = 10, habitatUnitDeficit = 26
        // a2ToA5Shortfalls = 10, allA1Losses = -5
        // Check 1: 10 - (-5) = 15 >= 26? NO
        // Check 2: 15 >= 26 - 10 = 16? NO
        // Check 3: 26 <= 0? NO
        // Check 4: 15 < 26? YES → returns 26 - 10 = 16
        const headline = createHeadline(26, 100, 90);
        const shortfalls = { a2: 2, a3: 3, a4: 2, a5: 3 }; // sum = 10
        const details = createDetails(-2, -2, -1); // sum = -5

        const result = a1BalancingShortfall(headline, shortfalls, details);
        expect(result).toBe(16);
    });

    test("handles scenario where all A1 losses equal zero", () => {
        // When allA1Losses = 0, different branches may be reached
        // unitGap = 30, habitatUnitDeficit = 35
        // a2ToA5Shortfalls = 40, allA1Losses = 0
        // Check 1: 40 - 0 = 40 >= 35? YES → returns -0
        const headline = createHeadline(35, 100, 70);
        const shortfalls = { a2: 10, a3: 10, a4: 10, a5: 10 }; // sum = 40
        const details = createDetails(0, 0, 0); // sum = 0

        const result = a1BalancingShortfall(headline, shortfalls, details);
        // Result is -0 due to -allA1Losses where allA1Losses = 0
        expect(Math.abs(result)).toBe(0);
    });

    test("handles scenario with moderate deficit", () => {
        // unitGap = 30, habitatUnitDeficit = 15
        // a2ToA5Shortfalls = 20, allA1Losses = -10
        // Check 1: 20 - (-10) = 30 >= 15? YES → returns -(-10) = 10
        const headline = createHeadline(15, 100, 70); // unitGap = 30
        const shortfalls = { a2: 5, a3: 5, a4: 5, a5: 5 }; // sum = 20
        const details = createDetails(-3, -3, -4); // sum = -10

        const result = a1BalancingShortfall(headline, shortfalls, details);
        expect(result).toBe(10);
    });

    test("handles edge case with zero values", () => {
        const headline = createHeadline(0, 100, 100);
        const shortfalls = { a2: 0, a3: 0, a4: 0, a5: 0 };
        const details = createDetails(0, 0, 0);

        const result = a1BalancingShortfall(headline, shortfalls, details);
        // Result can be 0 or -0, both are valid
        expect(Math.abs(result)).toBe(0);
    });
});

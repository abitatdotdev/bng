import { expect, test } from "bun:test";
import * as v from 'valibot';
import {
    onSiteWatercourseBaselineSchema,
    enrichWithWatercourseData,
    enrichWithBaselineUnitsData,
    enrichWithTotalWatercourseUnits,
    enrichWithUnitsLost,
    type OnSiteWatercourseBaselineSchema
} from "./watercourseBaseline";

export function fixture(overrides: Partial<OnSiteWatercourseBaselineSchema> = {}): OnSiteWatercourseBaselineSchema {
    return {
        watercourseType: "Other rivers and streams",
        length: 1,
        condition: "Moderate",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "Full",
        riparianEncroachment: "None",
        lengthRetained: 1,
        lengthEnhanced: 0,
        bespokeCompensation: "No",
        userComments: "",
        planningAuthorityComments: "",
        habitatReferenceNumber: "",
        ...overrides,
    }
}

// Validation Tests
test("valid watercourse types", () => {
    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ watercourseType: "Priority habitat" })
    ).success).toBeTrue();

    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ watercourseType: "Other rivers and streams" })
    ).success).toBeTrue();

    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ watercourseType: "Ditches" })
    ).success).toBeTrue();

    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ watercourseType: "Canals" })
    ).success).toBeTrue();

    // Culvert only supports "Poor" condition
    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ watercourseType: "Culvert", condition: "Poor" })
    ).success).toBeTrue();
});

test("invalid watercourse type", () => {
    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ watercourseType: "Invalid type" as any })
    ).success).toBeFalse();
});

test("invalid condition for watercourse type", () => {
    // Culvert does not support "Moderate" condition (only "Poor")
    const result = v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ watercourseType: "Culvert", condition: "Moderate" })
    );
    expect(result.success).toBeFalse();
    if (!result.success) {
        expect(result.issues[0].message).toContain("not possible");
    }
});

test("valid conditions for all watercourse types", () => {
    const conditions = ["Good", "Fairly Good", "Moderate", "Fairly Poor", "Poor"] as const;

    conditions.forEach(condition => {
        expect(v.safeParse(onSiteWatercourseBaselineSchema,
            fixture({ watercourseType: "Priority habitat", condition })
        ).success).toBeTrue();

        expect(v.safeParse(onSiteWatercourseBaselineSchema,
            fixture({ watercourseType: "Other rivers and streams", condition })
        ).success).toBeTrue();
    });
});

test("length arithmetic validation - valid", () => {
    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ length: 1, lengthRetained: 0.6, lengthEnhanced: 0.4 })
    ).success).toBeTrue();

    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ length: 2.5, lengthRetained: 1.5, lengthEnhanced: 1.0 })
    ).success).toBeTrue();

    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ length: 1, lengthRetained: 1, lengthEnhanced: 0 })
    ).success).toBeTrue();
});

test("length arithmetic validation - invalid", () => {
    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ length: 1, lengthRetained: 0.7, lengthEnhanced: 0.5 })
    ).success).toBeFalse();

    expect(v.safeParse(onSiteWatercourseBaselineSchema,
        fixture({ length: 1, lengthRetained: 1.5, lengthEnhanced: 0 })
    ).success).toBeFalse();
});

test("valid encroachment combinations", () => {
    const watercourseEncroachments = ["Full", "75%", "50%", "25%", "10%", "None"] as const;
    const riparianEncroachments = ["None", "Within 10m", "Within 50m"] as const;

    watercourseEncroachments.forEach(wEnc => {
        riparianEncroachments.forEach(rEnc => {
            expect(v.safeParse(onSiteWatercourseBaselineSchema,
                fixture({ watercourseEncroachment: wEnc, riparianEncroachment: rEnc })
            ).success).toBeTrue();
        });
    });
});

// Enrichment Function Tests
test("enrichWithWatercourseData - Priority habitat", () => {
    const result = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 0.7,
        lengthEnhanced: 0.3,
        watercourseType: "Priority habitat",
        condition: "Good",
        strategicSignificance: "Formally identified in local strategy",
        watercourseEncroachment: "Full",
        riparianEncroachment: "None",
    });

    expect(result.distinctiveness).toEqual("V.High");
    expect(result.distinctivenessScore).toEqual(8);
    expect(result.conditionScore).toEqual(3);
    expect(result.strategicSignificanceMultiplier).toEqual(1.15);
    expect(result.watercourseEncroachmentMultiplier).toEqual(1);
    expect(result.riparianEncroachmentMultiplier).toEqual(1);
    expect(result.tradingRules).toContain("Same habitat required");
});

test("enrichWithWatercourseData - Other rivers and streams", () => {
    const result = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 0.8,
        lengthEnhanced: 0.2,
        watercourseType: "Other rivers and streams",
        condition: "Moderate",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "50%",
        riparianEncroachment: "Within 10m",
    });

    expect(result.distinctiveness).toEqual("High");
    expect(result.distinctivenessScore).toEqual(6);
    expect(result.conditionScore).toEqual(2);
    expect(result.strategicSignificanceMultiplier).toEqual(1.1);
    expect(result.watercourseEncroachmentMultiplier).toEqual(0.7);
    expect(result.riparianEncroachmentMultiplier).toEqual(0.9);
});

test("enrichWithWatercourseData - Ditches", () => {
    const result = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 1,
        lengthEnhanced: 0,
        watercourseType: "Ditches",
        condition: "Poor",
        strategicSignificance: "Area/compensation not in local strategy/ no local strategy",
        watercourseEncroachment: "None",
        riparianEncroachment: "Within 50m",
    });

    expect(result.distinctiveness).toEqual("Medium");
    expect(result.distinctivenessScore).toEqual(4);
    expect(result.conditionScore).toEqual(1);
    expect(result.strategicSignificanceMultiplier).toEqual(1);
    expect(result.watercourseEncroachmentMultiplier).toEqual(0.25);
    expect(result.riparianEncroachmentMultiplier).toEqual(0.67);
});

test("enrichWithWatercourseData - encroachment multipliers", () => {
    const result1 = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 0.5,
        lengthEnhanced: 0.5,
        watercourseType: "Canals",
        condition: "Fairly Good",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "75%",
        riparianEncroachment: "None",
    });
    expect(result1.watercourseEncroachmentMultiplier).toEqual(0.85);

    const result2 = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 0.5,
        lengthEnhanced: 0.5,
        watercourseType: "Canals",
        condition: "Fairly Good",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "25%",
        riparianEncroachment: "None",
    });
    expect(result2.watercourseEncroachmentMultiplier).toEqual(0.55);

    const result3 = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 0.5,
        lengthEnhanced: 0.5,
        watercourseType: "Canals",
        condition: "Fairly Good",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "10%",
        riparianEncroachment: "None",
    });
    expect(result3.watercourseEncroachmentMultiplier).toEqual(0.4);
});

test("enrichWithBaselineUnitsData calculations", () => {
    // Create a properly typed input by using enrichWithWatercourseData first
    const enriched = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 0.5,
        lengthEnhanced: 0.3,
        watercourseType: "Priority habitat",
        condition: "Good",
        strategicSignificance: "Formally identified in local strategy",
        watercourseEncroachment: "50%",
        riparianEncroachment: "Within 10m",
    });

    const result = enrichWithBaselineUnitsData(enriched);

    // Expected: 0.5 * 8 * 3 * 1.15 * 0.7 * 0.9
    expect(result.unitsRetained).toBeCloseTo(0.5 * 8 * 3 * 1.15 * 0.7 * 0.9, 5);
    // Expected: 0.3 * 8 * 3 * 1.15 * 0.7 * 0.9
    expect(result.unitsEnhanced).toBeCloseTo(0.3 * 8 * 3 * 1.15 * 0.7 * 0.9, 5);
});

test("enrichWithBaselineUnitsData - zero lengths", () => {
    const enriched = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 0,
        lengthEnhanced: 0,
        watercourseType: "Other rivers and streams",
        condition: "Moderate",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "Full",
        riparianEncroachment: "None",
    });

    const result = enrichWithBaselineUnitsData(enriched);

    expect(result.unitsRetained).toEqual(0);
    expect(result.unitsEnhanced).toEqual(0);
});

test("enrichWithTotalWatercourseUnits calculation", () => {
    const enriched = enrichWithWatercourseData({
        length: 1.2,
        lengthRetained: 0.8,
        lengthEnhanced: 0.2,
        watercourseType: "Other rivers and streams",
        condition: "Moderate",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "75%",
        riparianEncroachment: "Within 50m",
    });

    const withUnits = enrichWithBaselineUnitsData(enriched);

    const result = enrichWithTotalWatercourseUnits(withUnits);

    // Expected: 1.2 * 6 * 2 * 1.1 * 0.85 * 0.67
    expect(result.totalWatercourseUnits).toBeCloseTo(1.2 * 6 * 2 * 1.1 * 0.85 * 0.67, 5);
});

test("enrichWithTotalWatercourseUnits - Priority habitat", () => {
    const enriched = enrichWithWatercourseData({
        length: 2,
        lengthRetained: 1.5,
        lengthEnhanced: 0.5,
        watercourseType: "Priority habitat",
        condition: "Good",
        strategicSignificance: "Formally identified in local strategy",
        watercourseEncroachment: "Full",
        riparianEncroachment: "None",
    });

    const withUnits = enrichWithBaselineUnitsData(enriched);

    const result = enrichWithTotalWatercourseUnits(withUnits);

    // Expected: 2 * 8 * 3 * 1.15 * 1 * 1 = 55.2
    expect(result.totalWatercourseUnits).toBeCloseTo(55.2, 5);
});

test("enrichWithUnitsLost - full retention", () => {
    const enriched = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 1,
        lengthEnhanced: 0,
        watercourseType: "Ditches",
        condition: "Moderate",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "Full",
        riparianEncroachment: "None",
    });

    const withUnits = enrichWithBaselineUnitsData(enriched);

    const withTotal = enrichWithTotalWatercourseUnits(withUnits);
    const result = enrichWithUnitsLost(withTotal);

    expect(result.lengthLost).toEqual(0);
    expect(result.unitsLost).toEqual(0);
});

test("enrichWithUnitsLost - partial retention", () => {
    const enriched = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 0.5,
        lengthEnhanced: 0.3,
        watercourseType: "Canals",
        condition: "Fairly Good",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "Full",
        riparianEncroachment: "None",
    });

    const withUnits = enrichWithBaselineUnitsData(enriched);

    const withTotal = enrichWithTotalWatercourseUnits(withUnits);
    const result = enrichWithUnitsLost(withTotal);

    expect(result.lengthLost).toBeCloseTo(0.2, 5);
    // Units lost calculation depends on actual multipliers
    expect(result.unitsLost).toBeGreaterThan(0);
});

test("enrichWithUnitsLost - total loss", () => {
    const enriched = enrichWithWatercourseData({
        length: 1,
        lengthRetained: 0,
        lengthEnhanced: 0,
        watercourseType: "Culvert",
        condition: "Poor",
        strategicSignificance: "Area/compensation not in local strategy/ no local strategy",
        watercourseEncroachment: "Full",
        riparianEncroachment: "None",
    });

    const withUnits = enrichWithBaselineUnitsData(enriched);

    const withTotal = enrichWithTotalWatercourseUnits(withUnits);
    const result = enrichWithUnitsLost(withTotal);

    expect(result.lengthLost).toEqual(1);
    if (result.totalWatercourseUnits !== undefined) {
        expect(result.unitsLost).toEqual(result.totalWatercourseUnits);
    }
});

// Full Schema Tests
test("full schema validation and calculation - Priority habitat", () => {
    const result = v.parse(onSiteWatercourseBaselineSchema, fixture({
        watercourseType: "Priority habitat",
        length: 1,
        condition: "Good",
        strategicSignificance: "Formally identified in local strategy",
        watercourseEncroachment: "Full",
        riparianEncroachment: "None",
        lengthRetained: 0.7,
        lengthEnhanced: 0.3,
    }));

    expect(result.distinctivenessScore).toEqual(8);
    expect(result.conditionScore).toEqual(3);
    expect(result.strategicSignificanceMultiplier).toEqual(1.15);
    expect(result.watercourseEncroachmentMultiplier).toEqual(1);
    expect(result.riparianEncroachmentMultiplier).toEqual(1);

    // Total units: 1 * 8 * 3 * 1.15 * 1 * 1 = 27.6
    expect(result.totalWatercourseUnits).toBeCloseTo(27.6, 5);
    // Units retained: 0.7 * 8 * 3 * 1.15 * 1 * 1 = 19.32
    expect(result.unitsRetained).toBeCloseTo(19.32, 5);
    // Units enhanced: 0.3 * 8 * 3 * 1.15 * 1 * 1 = 8.28
    expect(result.unitsEnhanced).toBeCloseTo(8.28, 5);
    // Length lost: 0
    expect(result.lengthLost).toBeCloseTo(0, 5);
    expect(result.unitsLost).toBeCloseTo(0, 5);
});

test("full schema validation and calculation - Ditches with encroachment", () => {
    const result = v.parse(onSiteWatercourseBaselineSchema, fixture({
        watercourseType: "Ditches",
        length: 2,
        condition: "Moderate",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        watercourseEncroachment: "50%",
        riparianEncroachment: "Within 10m",
        lengthRetained: 1.5,
        lengthEnhanced: 0,
    }));

    expect(result.distinctivenessScore).toEqual(4);
    expect(result.conditionScore).toEqual(2);
    expect(result.strategicSignificanceMultiplier).toEqual(1.1);
    expect(result.watercourseEncroachmentMultiplier).toEqual(0.7);
    expect(result.riparianEncroachmentMultiplier).toEqual(0.9);

    // Total units: 2 * 4 * 2 * 1.1 * 0.7 * 0.9 = 11.0880
    expect(result.totalWatercourseUnits).toBeCloseTo(11.0880, 5);
    // Units retained: 1.5 * 4 * 2 * 1.1 * 0.7 * 0.9 = 8.316
    expect(result.unitsRetained).toBeCloseTo(8.316, 5);
    // Units enhanced: 0
    expect(result.unitsEnhanced).toEqual(0);
    // Length lost: 0.5
    expect(result.lengthLost).toBeCloseTo(0.5, 5);
    // Units lost: 11.0880 - 8.316 = 2.772
    expect(result.unitsLost).toBeCloseTo(2.772, 5);
});

test("full schema validation and calculation - Culvert with minimal encroachment", () => {
    const result = v.parse(onSiteWatercourseBaselineSchema, fixture({
        watercourseType: "Culvert",
        length: 0.5,
        condition: "Poor",
        strategicSignificance: "Area/compensation not in local strategy/ no local strategy",
        watercourseEncroachment: "None",
        riparianEncroachment: "Within 50m",
        lengthRetained: 0.5,
        lengthEnhanced: 0,
    }));

    expect(result.distinctivenessScore).toEqual(2);
    expect(result.conditionScore).toEqual(1);
    expect(result.strategicSignificanceMultiplier).toEqual(1);
    expect(result.watercourseEncroachmentMultiplier).toEqual(0.25);
    expect(result.riparianEncroachmentMultiplier).toEqual(0.67);

    // Total units: 0.5 * 2 * 1 * 1 * 0.25 * 0.67 = 0.1675
    expect(result.totalWatercourseUnits).toBeCloseTo(0.1675, 5);
    // Units retained: 0.5 * 2 * 1 * 1 * 0.25 * 0.67 = 0.1675
    expect(result.unitsRetained).toBeCloseTo(0.1675, 5);
    // No loss
    expect(result.lengthLost).toEqual(0);
    expect(result.unitsLost).toEqual(0);
});

test("full schema validation - all conditions", () => {
    const conditions = ["Good", "Fairly Good", "Moderate", "Fairly Poor", "Poor"] as const;
    const expectedScores = [3, 2.5, 2, 1.5, 1];

    conditions.forEach((condition, index) => {
        const result = v.parse(onSiteWatercourseBaselineSchema, fixture({
            watercourseType: "Other rivers and streams",
            condition,
        }));

        expect(result.conditionScore).toBeDefined();
        // @ts-expect-error Not possible not accounted for - that's okay
        expect(result.conditionScore).toEqual(expectedScores[index]);
    });
});

import { expect, test } from "bun:test";
import * as v from 'valibot';
import { onSiteHabitatBaselineSchema, enrichWithBaselineUnitsData, type OnSiteHabitatBaselineSchema } from "./habitatBaseline";

export function fixture(overrides: Partial<OnSiteHabitatBaselineSchema> = {}): OnSiteHabitatBaselineSchema {
    return {
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        area: 1,
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        condition: "Good",
        irreplaceableHabitat: false,
        ...overrides,
    }
}

test("valid combinations of broad habitat and habitat type", () => {
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ broadHabitat: "Woodland and forest", habitatType: "Felled" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree" })).success).toBeTrue()

    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Felled" })).success).toBeFalse()
})

test("irreplaceable habitat validation", () => {
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ irreplaceableHabitat: false })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ broadHabitat: "Sparsely vegetated land", habitatType: "Coastal sand dunes", irreplaceableHabitat: true })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ broadHabitat: "Sparsely vegetated land", habitatType: "Coastal sand dunes", irreplaceableHabitat: false })).success).toBeFalse()

    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree", irreplaceableHabitat: undefined })).success).toBeFalse()
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree", irreplaceableHabitat: true })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree", irreplaceableHabitat: false })).success).toBeTrue()
})

test("condition validation", () => {
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ condition: "Good" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ condition: "Moderate" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ condition: "Poor" })).success).toBeTrue()

    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ condition: "Condition Assessment N/A" })).success).toBeFalse()
    expect(v.safeParse(onSiteHabitatBaselineSchema, fixture({ condition: "N/A - Other" })).success).toBeFalse()
})

test("enrichWithBaselineUnitsData calculations", () => {
    const inputData = {
        irreplaceableHabitat: false,
        area: 10,
        areaRetained: 6,
        areaEnhanced: 3,
        distinctivenessScore: 2,
        conditionScore: 0.8,
        strategicSignificanceMultiplier: 1.5,
    }

    const result = enrichWithBaselineUnitsData(inputData)

    expect(result.baselineUnitsRetained).toBe(6 * 2 * 0.8 * 1.5)
    expect(result.baselineUnitsEnhanced).toBe(3 * 2 * 0.8 * 1.5)
    expect(result.areaHabitatLost).toBe(10 - 6 - 3)
    expect(result).toMatchObject(inputData)
})

test("enrichWithBaselineUnitsData with zero areas", () => {
    const inputData = {
        irreplaceableHabitat: false,
        area: 5,
        areaRetained: 0,
        areaEnhanced: 0,
        distinctivenessScore: 1,
        conditionScore: 1,
        strategicSignificanceMultiplier: 1,
    }

    const result = enrichWithBaselineUnitsData(inputData)

    expect(result.baselineUnitsRetained).toBe(0)
    expect(result.baselineUnitsEnhanced).toBe(0)
    expect(result.areaHabitatLost).toBe(5)
})

test("enrichWithBaselineUnitsData full retention", () => {
    const inputData = {
        irreplaceableHabitat: false,
        area: 8,
        areaRetained: 8,
        areaEnhanced: 0,
        distinctivenessScore: 3,
        conditionScore: 0.9,
        strategicSignificanceMultiplier: 2,
    }

    const result = enrichWithBaselineUnitsData(inputData)

    expect(result.baselineUnitsRetained).toBe(8 * 3 * 0.9 * 2)
    expect(result.baselineUnitsEnhanced).toBe(0)
    expect(result.areaHabitatLost).toBe(0)
})

test("enrichWithBaselineUnitsData zero when irreplaceable", () => {
    const inputData = {
        irreplaceableHabitat: true,
        area: 8,
        areaRetained: 8,
        areaEnhanced: 0,
        distinctivenessScore: 3,
        conditionScore: 0.9,
        strategicSignificanceMultiplier: 2,
    }

    const result = enrichWithBaselineUnitsData(inputData)

    expect(result.baselineUnitsRetained).toBe(0)
    expect(result.baselineUnitsEnhanced).toBe(0)
    expect(result.areaHabitatLost).toBe(0)
})

import { expect, test } from "bun:test";
import * as v from 'valibot';
import { offSiteHabitatBaselineSchema, type OffSiteHabitatBaselineSchema } from "./habitatBaseline";

export function fixture(overrides: Partial<OffSiteHabitatBaselineSchema> = {}): OffSiteHabitatBaselineSchema {
    return {
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        area: 1,
        distinctiveness: "Medium",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        condition: "Good",
        irreplaceableHabitat: false,
        spatialRiskCategory: "This metric is being used by an off-site provider",
        areaEnhanced: 0,
        areaRetained: 0,
        ...overrides,
    }
}

test("valid combinations of broad habitat and habitat type", () => {
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ broadHabitat: "Woodland and forest", habitatType: "Felled" })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree" })).success).toBeTrue()

    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Felled" })).success).toBeFalse()
})

test("irreplaceable habitat validation", () => {
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ irreplaceableHabitat: false })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ broadHabitat: "Sparsely vegetated land", habitatType: "Coastal sand dunes", irreplaceableHabitat: true })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ broadHabitat: "Sparsely vegetated land", habitatType: "Coastal sand dunes", irreplaceableHabitat: false })).success).toBeFalse()

    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree", irreplaceableHabitat: undefined })).success).toBeFalse()
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree", irreplaceableHabitat: true })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree", irreplaceableHabitat: false })).success).toBeTrue()
})

test("condition validation", () => {
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ condition: "Good" })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ condition: "Moderate" })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ condition: "Poor" })).success).toBeTrue()

    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ condition: "Condition Assessment N/A" })).success).toBeFalse()
    expect(v.safeParse(offSiteHabitatBaselineSchema, fixture({ condition: "N/A - Other" })).success).toBeFalse()
})


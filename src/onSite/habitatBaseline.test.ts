import { expect, test } from "bun:test";
import * as v from 'valibot';
import { onSiteHabitatBaselineSchema, type OnSiteHabitatBaselineSchema } from "./habitatBaseline";

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


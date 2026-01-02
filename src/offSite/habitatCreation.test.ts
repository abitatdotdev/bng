import { expect, test } from "bun:test";
import * as v from 'valibot';
import { offSiteHabitatCreationSchema, type OffSiteHabitatCreationSchema } from "./habitatCreation";

export function fixture(overrides: Partial<OffSiteHabitatCreationSchema> = {}): OffSiteHabitatCreationSchema {
    return {
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        area: 1,
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        spatialRiskCategory: "This metric is being used by an off-site provider",
        condition: "Good",
        ...overrides,
    }
}

test("valid combinations of broad habitat and habitat type", () => {
    expect(v.safeParse(offSiteHabitatCreationSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree" })).success).toBeTrue()

    expect(v.safeParse(offSiteHabitatCreationSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Lowland" })).success).toBeFalse()
})

test("condition validation", () => {
    expect(v.safeParse(offSiteHabitatCreationSchema, fixture({ condition: "Good" })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatCreationSchema, fixture({ condition: "Moderate" })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatCreationSchema, fixture({ condition: "Poor" })).success).toBeTrue()

    expect(v.safeParse(offSiteHabitatCreationSchema, fixture({ condition: "Condition Assessment N/A" })).success).toBeFalse()
    expect(v.safeParse(offSiteHabitatCreationSchema, fixture({ condition: "N/A - Other" })).success).toBeFalse()
})

test("default years values", () => {
    expect(v.parse(offSiteHabitatCreationSchema, fixture()).habitatCreationInAdvance).toEqual(0)
    expect(v.parse(offSiteHabitatCreationSchema, fixture()).habitatCreationDelay).toEqual(0)
})

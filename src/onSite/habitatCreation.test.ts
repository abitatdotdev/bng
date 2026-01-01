import { expect, test } from "bun:test";
import * as v from 'valibot';
import { onSiteHabitatCreationSchema, type OnSiteHabitatCreationSchema } from "./habitatCreation";

export function fixture(overrides: Partial<OnSiteHabitatCreationSchema> = {}): OnSiteHabitatCreationSchema {
    return {
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        area: 1,
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        condition: "Good",
        ...overrides,
    }
}

test("valid combinations of broad habitat and habitat type", () => {
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ broadHabitat: "Woodland and forest", habitatType: "Felled" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree" })).success).toBeTrue()

    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Felled" })).success).toBeFalse()
})

test("condition validation", () => {
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "Good" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "Moderate" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "Poor" })).success).toBeTrue()

    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "Condition Assessment N/A" })).success).toBeFalse()
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "N/A - Other" })).success).toBeFalse()
})

test("default years values", () => {
    expect(v.parse(onSiteHabitatCreationSchema, fixture()).habitatCreationInAdvance).toEqual(0)
    expect(v.parse(onSiteHabitatCreationSchema, fixture()).habitatCreationDelay).toEqual(0)
})

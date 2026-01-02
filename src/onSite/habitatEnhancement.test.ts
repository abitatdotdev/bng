import { expect, test } from "bun:test";
import * as v from 'valibot';
import { onSiteHabitatEnhancementSchema, type OnSiteHabitatEnhancementSchema } from "./habitatEnhancement";

export function fixture(overrides: Partial<OnSiteHabitatEnhancementSchema> = {}): OnSiteHabitatEnhancementSchema {
    return {
        baseline: {
            broadHabitat: "Woodland and forest",
            habitatType: "Lowland mixed deciduous woodland",
            area: 1,
            strategicSignificance: "Location ecologically desirable but not in local strategy",
            condition: "Good",
            irreplaceableHabitat: false,
            areaEnhanced: 0,
            areaRetained: 1,
        },
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        condition: "Good",
        ...overrides,
    }
}

test("valid combinations of broad habitat and habitat type", () => {
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree" })).success).toBeTrue()

    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Lowland" })).success).toBeFalse()
})

test("condition validation", () => {
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "Good" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "Moderate" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "Poor" })).success).toBeTrue()

    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "Condition Assessment N/A" })).success).toBeFalse()
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "N/A - Other" })).success).toBeFalse()
})

test("validates baseline schema as well", () => {
    const fix = fixture()
    fix.baseline.broadHabitat = "Urban"
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fix).success).toBeFalse()
})

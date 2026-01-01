import { expect, test } from "bun:test";
import * as v from 'valibot';
import { offSiteHabitatEnhancementSchema, type OffSiteHabitatEnhancementSchema } from "./habitatEnhancement";

export function fixture(overrides: Partial<OffSiteHabitatEnhancementSchema> = {}): OffSiteHabitatEnhancementSchema {
    return {
        baseline: {
            broadHabitat: "Woodland and forest",
            habitatType: "Lowland mixed deciduous woodland",
            area: 1,
            distinctiveness: "Medium",
            strategicSignificance: "Location ecologically desirable but not in local strategy",
            spatialRiskCategory: "This metric is being used by an off-site provider",
            condition: "Good",
            irreplaceableHabitat: false,
            areaEnhanced: 0,
            areaRetained: 0,
        },
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        condition: "Good",
        ...overrides,
    }
}

test("valid combinations of broad habitat and habitat type", () => {
    expect(v.safeParse(offSiteHabitatEnhancementSchema, fixture({ broadHabitat: "Woodland and forest", habitatType: "Felled" })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatEnhancementSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree" })).success).toBeTrue()

    expect(v.safeParse(offSiteHabitatEnhancementSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Felled" })).success).toBeFalse()
})

test("condition validation", () => {
    expect(v.safeParse(offSiteHabitatEnhancementSchema, fixture({ condition: "Good" })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatEnhancementSchema, fixture({ condition: "Moderate" })).success).toBeTrue()
    expect(v.safeParse(offSiteHabitatEnhancementSchema, fixture({ condition: "Poor" })).success).toBeTrue()

    expect(v.safeParse(offSiteHabitatEnhancementSchema, fixture({ condition: "Condition Assessment N/A" })).success).toBeFalse()
    expect(v.safeParse(offSiteHabitatEnhancementSchema, fixture({ condition: "N/A - Other" })).success).toBeFalse()
})

test("validates baseline schema as well", () => {
    const fix = fixture()
    fix.baseline.broadHabitat = "Urban"
    expect(v.safeParse(offSiteHabitatEnhancementSchema, fix).success).toBeFalse()
})

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
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree" })).success).toBeTrue()

    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Lowland" })).success).toBeFalse()
})

test("conditions can only match available options", () => {
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "Good" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "Moderate" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "Poor" })).success).toBeTrue()

    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "Condition Assessment N/A" })).success).toBeFalse()
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({ condition: "N/A - Other" })).success).toBeFalse()
})

test("years values default to zero", () => {
    expect(v.parse(onSiteHabitatCreationSchema, fixture()).habitatCreationInAdvance).toEqual(0)
    expect(v.parse(onSiteHabitatCreationSchema, fixture()).habitatCreationDelay).toEqual(0)
})

test("cannot have both advanced and delayed habitat creation", () => {
    const result = v.safeParse(onSiteHabitatCreationSchema, fixture({
        habitatCreationInAdvance: 5,
        habitatCreationDelay: 3
    }))
    expect(result.success).toBeFalse()
    if (!result.success) {
        expect(result.issues[0].message).toContain("Cannot have both habitat creation in advance and delay")
    }
})

test("can have advance without delay", () => {
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({
        habitatCreationInAdvance: 5,
        habitatCreationDelay: 0
    })).success).toBeTrue()
})

test("can have delay without advance", () => {
    expect(v.safeParse(onSiteHabitatCreationSchema, fixture({
        habitatCreationInAdvance: 0,
        habitatCreationDelay: 5
    })).success).toBeTrue()
})

test("final time to target condition - no advance or delay", () => {
    // Lowland calcareous grassland in Good condition has 20 years standard time
    const result = v.parse(onSiteHabitatCreationSchema, fixture({
        broadHabitat: "Grassland",
        habitatType: "Lowland calcareous grassland",
        condition: "Good",
        habitatCreationInAdvance: 0,
        habitatCreationDelay: 0
    }))
    expect(result.finalTimeToTargetCondition).toEqual(20)
    expect(result.finalTimeToTargetMultiplier).toBeCloseTo(0.4903952635, 5)
})

test("final time to target condition - with advance", () => {
    // Lowland calcareous grassland in Good condition: 20 years standard - 5 years advance = 15 years
    const result = v.parse(onSiteHabitatCreationSchema, fixture({
        broadHabitat: "Grassland",
        habitatType: "Lowland calcareous grassland",
        condition: "Good",
        habitatCreationInAdvance: 5,
        habitatCreationDelay: 0
    }))
    expect(result.finalTimeToTargetCondition).toEqual(15)
    expect(result.finalTimeToTargetMultiplier).toBeCloseTo(0.5860163055, 5)
})

test("final time to target condition - with delay", () => {
    // Lowland calcareous grassland in Good condition: 20 years standard + 5 years delay = 25 years
    const result = v.parse(onSiteHabitatCreationSchema, fixture({
        broadHabitat: "Grassland",
        habitatType: "Lowland calcareous grassland",
        condition: "Good",
        habitatCreationInAdvance: 0,
        habitatCreationDelay: 5
    }))
    expect(result.finalTimeToTargetCondition).toEqual(25)
})

test("final time to target condition - advance >= standard time returns 0", () => {
    // Lowland calcareous grassland in Good condition: 20 years standard - 20 years advance = 0
    const result = v.parse(onSiteHabitatCreationSchema, fixture({
        broadHabitat: "Grassland",
        habitatType: "Lowland calcareous grassland",
        condition: "Good",
        habitatCreationInAdvance: 20,
        habitatCreationDelay: 0
    }))
    expect(result.finalTimeToTargetCondition).toEqual(0)
    expect(result.finalTimeToTargetMultiplier).toEqual(1)

    // 20 years standard - 25 years advance = 0 (capped)
    const result2 = v.parse(onSiteHabitatCreationSchema, fixture({
        broadHabitat: "Grassland",
        habitatType: "Lowland calcareous grassland",
        condition: "Good",
        habitatCreationInAdvance: 25,
        habitatCreationDelay: 0
    }))
    expect(result2.finalTimeToTargetCondition).toEqual(0)
    expect(result2.finalTimeToTargetMultiplier).toEqual(1)
})

test("final time to target condition - result > 30 gets capped to 30+", () => {
    // Upland calcareous grassland in Good condition: 25 years + 10 years delay = 35, caps to "30+"
    const result = v.parse(onSiteHabitatCreationSchema, fixture({
        broadHabitat: "Grassland",
        habitatType: "Upland calcareous grassland",
        condition: "Good",
        habitatCreationInAdvance: 0,
        habitatCreationDelay: 10
    }))
    expect(result.finalTimeToTargetCondition).toEqual("30+")
    expect(result.finalTimeToTargetMultiplier).toBeCloseTo(0.3197967361, 5)
})

test("final time to target condition - 30+ standard time stays as 30+", () => {
    // Lowland mixed deciduous woodland in Good condition: "30+" standard time
    const result = v.parse(onSiteHabitatCreationSchema, fixture({
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        condition: "Good",
        habitatCreationInAdvance: 0,
        habitatCreationDelay: 0
    }))
    expect(result.finalTimeToTargetCondition).toEqual("30+")
    expect(result.finalTimeToTargetMultiplier).toBeCloseTo(0.3197967361, 5)
})

test("final time to target condition - advance reduces 30+ standard time", () => {
    // Lowland mixed deciduous woodland in Good condition: "30+" - 5 years advance = 25 years
    const result = v.parse(onSiteHabitatCreationSchema, fixture({
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        condition: "Good",
        habitatCreationInAdvance: 5,
        habitatCreationDelay: 0
    }))
    expect(result.finalTimeToTargetCondition).toEqual(25)
})

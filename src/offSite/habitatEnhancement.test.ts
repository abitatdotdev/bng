import { expect, test } from "bun:test";
import { offSiteHabitatEnhancementSchema, type OffSiteHabitatEnhancementSchema } from "./habitatEnhancement";
import * as v from 'valibot';

expect.extend({
    toBeParseableBy:
        function <TSchema extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>>(
            input: unknown,
            schema: TSchema,
        ) {
            const result = v.safeParse(schema, input);
            return {
                pass: !!result.success,
                // @ts-expect-error TS2339
                message: () => `Parsing error.\nExpected ${this.utils.printReceived(input)} \nResult: ${this.utils.printReceived(result)}`,
            }
        },
})

export function fixture(overrides: Partial<OffSiteHabitatEnhancementSchema> = {}): OffSiteHabitatEnhancementSchema {
    return {
        baseline: {
            broadHabitat: "Woodland and forest",
            habitatType: "Lowland mixed deciduous woodland",
            area: 1,
            strategicSignificance: "Location ecologically desirable but not in local strategy",
            spatialRiskCategory: "This metric is being used by an off-site provider",
            condition: "Good",
            irreplaceableHabitat: false,
            areaEnhanced: 0,
            areaRetained: 0,
            offSiteReferenceNumber: "OFF-001",
        },
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        condition: "Good",
        ...overrides,
    }
}

test("valid combinations of broad habitat and habitat type", () => {
    expect(fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree" })).toBeParseableBy(offSiteHabitatEnhancementSchema)

    expect(fixture({ broadHabitat: "Individual trees", habitatType: "Lowland" })).not.toBeParseableBy(offSiteHabitatEnhancementSchema)
})

// TEST: improve tests by checking specific conditions
test.skip("condition validation", () => {
    expect(fixture({ condition: "Good" })).toBeParseableBy(offSiteHabitatEnhancementSchema)

    expect(fixture({ condition: "Moderate" })).toBeParseableBy(offSiteHabitatEnhancementSchema)

    expect(fixture({ condition: "Poor" })).not.toBeParseableBy(offSiteHabitatEnhancementSchema)

    expect(fixture({ condition: "Condition Assessment N/A" })).not.toBeParseableBy(offSiteHabitatEnhancementSchema)
    expect(fixture({ condition: "N/A - Other" })).not.toBeParseableBy(offSiteHabitatEnhancementSchema)
})

test("validates baseline schema as well", () => {
    const fix = fixture()
    fix.baseline.broadHabitat = "Urban"
    expect(fix).not.toBeParseableBy(offSiteHabitatEnhancementSchema)
})

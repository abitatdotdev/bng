import { expect, test } from "bun:test";
import { offSiteHabitatBaselineSchema, offSiteHabitatBaselineUncheckedSchema, type OffSiteHabitatBaselineSchema } from "./habitatBaseline";
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
                message: () => `Expected ${this.utils.printReceived(input)} to be parseable. \nIssues: ${this.utils.printReceived(result.issues)}`,
            }
        },
})

export function fixture(overrides: Partial<OffSiteHabitatBaselineSchema> = {}): OffSiteHabitatBaselineSchema {
    return {
        broadHabitat: "Woodland and forest",
        habitatType: "Other coniferous woodland",
        area: 1,
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        condition: "Poor",
        irreplaceableHabitat: false,
        spatialRiskCategory: "This metric is being used by an off-site provider",
        areaRetained: 1,
        offSiteReferenceNumber: "OFF-001",
        ...overrides,
    }
}

test("valid combinations of broad habitat and habitat type", () => {
    expect(fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree" })).toBeParseableBy(offSiteHabitatBaselineSchema)

    expect(fixture({ broadHabitat: "Individual trees", habitatType: "Lowland" })).not.toBeParseableBy(offSiteHabitatBaselineSchema)
})

test("irreplaceable habitat validation", () => {
    expect(fixture({ irreplaceableHabitat: false })).toBeParseableBy(offSiteHabitatBaselineSchema)

    expect(fixture({ broadHabitat: "Sparsely vegetated land", habitatType: "Coastal sand dunes", irreplaceableHabitat: true, bespokeCompensationAgreed: "Yes" })).toBeParseableBy(offSiteHabitatBaselineSchema)

    expect(fixture({ broadHabitat: "Sparsely vegetated land", habitatType: "Coastal sand dunes", irreplaceableHabitat: false })).not.toBeParseableBy(offSiteHabitatBaselineSchema)

    expect(fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree", irreplaceableHabitat: undefined })).not.toBeParseableBy(offSiteHabitatBaselineSchema)

    expect(fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree", irreplaceableHabitat: true, bespokeCompensationAgreed: "Yes" })).toBeParseableBy(offSiteHabitatBaselineSchema)

    expect(fixture({ broadHabitat: "Individual trees", habitatType: "Urban tree", irreplaceableHabitat: false })).toBeParseableBy(offSiteHabitatBaselineSchema)
})

test("condition validation", () => {
    expect(fixture({ condition: "Good", bespokeCompensationAgreed: "Yes" })).toBeParseableBy(offSiteHabitatBaselineSchema)

    expect(fixture({ condition: "Moderate" })).toBeParseableBy(offSiteHabitatBaselineSchema)

    expect(fixture({ condition: "Poor" })).toBeParseableBy(offSiteHabitatBaselineSchema)

    expect(fixture({ condition: "Condition Assessment N/A" })).not.toBeParseableBy(offSiteHabitatBaselineSchema)
    expect(fixture({ condition: "N/A - Other" })).not.toBeParseableBy(offSiteHabitatBaselineSchema)
})

test("irreplaceable habitats cannot lose any area", () => {
    const okay = fixture({
        broadHabitat: "Individual trees",
        habitatType: "Rural tree",
        area: 0.0765,
        condition: "Good",
        strategicSignificance: "Area/compensation not in local strategy/ no local strategy",
        areaRetained: 0.0765,
        irreplaceableHabitat: true,
    })
    expect(v.safeParse(offSiteHabitatBaselineSchema, okay).success).toBeTrue()
    const notOkay = fixture({
        broadHabitat: "Individual trees",
        habitatType: "Rural tree",
        area: 0.0765,
        condition: "Good",
        strategicSignificance: "Area/compensation not in local strategy/ no local strategy",
        areaRetained: 0.0765 - 0.001,
        irreplaceableHabitat: true,
    })
    expect(v.safeParse(offSiteHabitatBaselineSchema, notOkay).success).toBeFalse()
})

test("irreplaceable off-site total and no-allocation spatial total follow the raw total", () => {
    const allocated = v.parse(offSiteHabitatBaselineUncheckedSchema, fixture({
        broadHabitat: "Wetland",
        habitatType: "Blanket bog",
        condition: "Moderate",
        strategicSignificance: "Area/compensation not in local strategy/ no local strategy",
        area: 1,
        areaRetained: 0.25,
        areaEnhanced: 0.25,
        irreplaceableHabitat: true,
        bespokeCompensationAgreed: "Yes",
    }));
    const noAllocation = v.parse(offSiteHabitatBaselineUncheckedSchema, fixture({
        broadHabitat: "Wetland",
        habitatType: "Blanket bog",
        condition: "Moderate",
        strategicSignificance: "Area/compensation not in local strategy/ no local strategy",
        area: 1,
        areaRetained: 0,
        areaEnhanced: 0,
        irreplaceableHabitat: true,
        bespokeCompensationAgreed: "Yes",
    }));
    expect(allocated.totalHabitatUnits).toEqual(4);
    expect(allocated.totalHabitatUnitsSRM).toEqual(4);
    expect(noAllocation.totalHabitatUnits).toEqual(0);
    expect(noAllocation.totalHabitatUnitsSRM).toEqual(0);
});

test("blank off-site reference marks only dependent raw baseline values unavailable", () => {
    const parsed = v.parse(offSiteHabitatBaselineUncheckedSchema, fixture({
        broadHabitat: "Grassland",
        habitatType: "Other neutral grassland",
        condition: "Moderate",
        strategicSignificance: "Area/compensation not in local strategy/ no local strategy",
        area: 1,
        areaRetained: 0,
        areaEnhanced: 0,
        offSiteReferenceNumber: "",
    }));
    expect(parsed.totalHabitatUnits).toEqual(0);
    expect(parsed.totalHabitatUnitsSRM).toBeGreaterThan(0);
    expect(parsed.areaCalculationAvailability.unavailableResults.totalHabitatUnits).toEqual("blank");
});

import timingPathwayWorkbook from '../timingPathwayWorkbook.fixture.json';
import { expect, test } from "bun:test";
import * as v from 'valibot';
import { onSiteHabitatEnhancementSchema, onSiteHabitatEnhancementUncheckedSchema, type OnSiteHabitatEnhancementSchema } from "./habitatEnhancement";

export function fixture(overrides: Partial<OnSiteHabitatEnhancementSchema> = {}): OnSiteHabitatEnhancementSchema {
    return {
        baseline: {
            broadHabitat: "Woodland and forest",
            habitatType: "Lowland mixed deciduous woodland",
            area: 1,
            strategicSignificance: "Location ecologically desirable but not in local strategy",
            condition: "Poor",  // Changed from "Good" to "Poor" for valid enhancement
            irreplaceableHabitat: false,
            areaEnhanced: 1,  // Changed from 0 to 1 - area being enhanced
            areaRetained: 0,  // Changed from 1 to 0
        },
        broadHabitat: "Woodland and forest",
        habitatType: "Lowland mixed deciduous woodland",
        strategicSignificance: "Location ecologically desirable but not in local strategy",
        condition: "Good",  // Enhancing from Poor to Good
        ...overrides,
    }
}

test("valid combinations of broad habitat and habitat type", () => {
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({
        baseline: {
            broadHabitat: "Individual trees",
            habitatType: "Urban tree",
            area: 1,
            strategicSignificance: "Location ecologically desirable but not in local strategy",
            condition: "Poor",
            irreplaceableHabitat: false,
            areaEnhanced: 1,
            areaRetained: 0,
        },
        broadHabitat: "Individual trees",
        habitatType: "Urban tree"
    })).success).toBeTrue()

    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ broadHabitat: "Individual trees", habitatType: "Lowland" })).success).toBeFalse()
})

test("condition validation", () => {
    // Valid enhancements: Poor (baseline) → better condition
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "Good" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "Moderate" })).success).toBeTrue()
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "Fairly Poor" })).success).toBeTrue()

    // Invalid: Same condition without distinctiveness upgrade
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "Poor" })).success).toBeFalse()

    // Invalid condition types for enhancement
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "Condition Assessment N/A" })).success).toBeFalse()
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fixture({ condition: "N/A - Other" })).success).toBeFalse()
})

test("validates baseline schema as well", () => {
    const fix = fixture()
    fix.baseline.broadHabitat = "Urban"
    expect(v.safeParse(onSiteHabitatEnhancementSchema, fix).success).toBeFalse()
})

test("adds distinctivenessChange and conditionChange properties", () => {
    const result = v.safeParse(onSiteHabitatEnhancementSchema, fixture())
    expect(result.success).toBeTrue()

    if (result.success) {
        // Verify distinctivenessChange property exists
        expect(result.output.distinctivenessChange).toBeDefined()
        expect(result.output.distinctivenessChange).toBe("High - High")

        // Verify conditionChange property exists
        expect(result.output.conditionChange).toBeDefined()
        expect(result.output.conditionChange).toBe("Poor - Good")
    }
})

test("conditionChange shows 'Lower Distinctiveness Habitat' when habitat changes with distinctiveness upgrade", () => {
    // Enhancement from Low distinctiveness to Medium distinctiveness with habitat change
    const result = v.safeParse(onSiteHabitatEnhancementSchema, fixture({
        baseline: {
            broadHabitat: "Grassland",
            habitatType: "Modified grassland",  // Low distinctiveness (2)
            area: 1,
            strategicSignificance: "Location ecologically desirable but not in local strategy",
            condition: "Poor",
            irreplaceableHabitat: false,
            areaEnhanced: 1,
            areaRetained: 0,
        },
        broadHabitat: "Grassland",
        habitatType: "Other lowland acid grassland",  // Medium distinctiveness (4)
        condition: "Moderate",
    }))

    expect(result.success).toBeTrue()

    if (result.success) {
        // Should show "Low - Medium" for distinctiveness change
        expect(result.output.distinctivenessChange).toBe("Low - Medium")

        // Should show "Lower Distinctiveness Habitat - Moderate" for condition change
        expect(result.output.conditionChange).toBe("Lower Distinctiveness Habitat - Moderate")
    }
})



for (const workbookCase of timingPathwayWorkbook.cases.filter((entry) => entry.sheet === 'A-3')) {
    test(`${workbookCase.gap ?? 'Workbook control'}: ${workbookCase.id}`, () => {
        for (const schema of [onSiteHabitatEnhancementSchema, onSiteHabitatEnhancementUncheckedSchema]) {
            const result = v.parse(schema, workbookCase.input);
            expect(result.finalTimeToTargetCondition).toBe(workbookCase.excel.finalTime);
            expect(result.finalTimeToTargetMultiplier).toBe(1);
            expect(result).toMatchObject({
                timeToTargetCondition: workbookCase.excel.standardTime,
                standardOrAdjustedTimeToTargetCondition: workbookCase.excel.timingEvidence,
                appliedDifficultyMultiplier: workbookCase.excel.appliedDifficulty,
                finalDifficultyOfEnhancement: workbookCase.excel.finalDifficulty,
                difficultyMultiplierApplied: workbookCase.excel.difficultyMultiplier,
            });
            expect(result.habitatUnitsDelivered).toBeCloseTo(workbookCase.excel.units, 10);
            expect(result.habitatUnitsDeliveredDecimal.toNumber()).toBe(result.habitatUnitsDelivered);
            expect(result.difficultyMultiplierAppliedDecimal.toNumber()).toBe(result.difficultyMultiplierApplied);
        }
    });
}

for (const [advance, delay] of [[2, 3], ['30+', 3], [2, '30+'], ['30+', '30+']] as const) {
    test(`enhancement timing evidence reports conflicting advance ${advance} and delay ${delay}`, () => {
        const result = v.parse(onSiteHabitatEnhancementUncheckedSchema, fixture({
            habitatEnhancedInAdvance: advance,
            habitatEnhancedDelay: delay,
        }));
        expect(result.standardOrAdjustedTimeToTargetCondition).toBe('Error -both advance and delayed habitat creation ▲');
    });
}

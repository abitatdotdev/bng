import { expect, test } from "bun:test";
import * as v from 'valibot';
import { baselineHabitatType, creationHabitatType, enhancedHabitatType } from './habitatTypes';

test("Felled only allowed in baseline habitats", () => {
    expect(v.safeParse(baselineHabitatType, "Felled").success).toBeTrue();
    expect(v.safeParse(creationHabitatType, "Felled").success).toBeFalse();
    expect(v.safeParse(enhancedHabitatType, "Felled").success).toBeFalse();
})

test("Replacement for felled only allowed in enhanced habitats", () => {
    expect(v.safeParse(baselineHabitatType, "Replacement for felled woodland").success).toBeFalse();
    expect(v.safeParse(creationHabitatType, "Replacement for felled woodland").success).toBeFalse();
    expect(v.safeParse(enhancedHabitatType, "Replacement for felled woodland").success).toBeTrue();
})

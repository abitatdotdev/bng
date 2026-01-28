import { expect, test } from "bun:test";
import { habitatByBroadAndType, habitatByLabel } from './habitats';


test("fetching by broad habitat and habitat type", () => {
    expect(habitatByBroadAndType("Woodland and forest", "Felled")).toBeDefined();
    // @ts-ignore-line
    expect(habitatByBroadAndType("Woodland and forest", "Nonsense")).toBeUndefined();
})

test("fetching by label", () => {
    expect(habitatByLabel("Woodland and forest - Felled")).toBeDefined();
    // @ts-ignore-line
    expect(habitatByLabel("Woodland and forest - Nonsense")).toBeUndefined();
    //
    // test the single case where the non-matching label and broad/type combo still matches
    expect(habitatByLabel('Woodland and forest - Replacement for felled woodland' as any)).toBeDefined();
})

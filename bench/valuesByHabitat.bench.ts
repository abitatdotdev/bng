import { valuesByHabitat } from "../src/groupings/habitats";
import type { AllFeatures } from "../src/features";

function makeFeatures(id: number, size: number): AllFeatures {
    const baselines = Array.from({ length: size }, () => ({
        broadHabitat: "Grassland",
        habitatType: "Lowland dry acid grassland",
        totalHabitatUnits: 10,
        area: 10,
        areaRetained: 0,
        baselineUnitsRetained: 0,
        vhdhBespokeCompensationUnits: 0,
        areaHabitatLost: 10,
        unitsLost: 10,
    })) as any;
    const creations = Array.from({ length: size }, () => ({
        broadHabitat: "Grassland",
        habitatType: "Lowland dry acid grassland",
        habitatUnitsDelivered: 10,
        area: 10,
    })) as any;
    return {
        __id: id,
        onSiteHabitatBaselines: baselines,
        onSiteHabitatCreations: creations,
        onSiteHabitatEnhancements: [],
        offSiteHabitatBaselines: [],
        offSiteHabitatCreations: [],
        offSiteHabitatEnhancements: [],
        onSiteHedgerowBaselines: [],
        onSiteHedgerowCreations: [],
        onSiteHedgerowEnhancements: [],
        offSiteHedgerowBaselines: [],
        offSiteHedgerowCreations: [],
        offSiteHedgerowEnhancements: [],
        onSiteWatercourseBaselines: [],
        onSiteWatercourseCreations: [],
        onSiteWatercourseEnhancements: [],
        offSiteWatercourseBaselines: [],
        offSiteWatercourseCreations: [],
        offSiteWatercourseEnhancements: [],
    } as AllFeatures;
}

function bench(label: string, iterations: number, fn: () => void) {
    // warm up
    for (let i = 0; i < 3; i++) fn();
    const samples: number[] = [];
    for (let s = 0; s < 5; s++) {
        const start = Bun.nanoseconds();
        for (let i = 0; i < iterations; i++) fn();
        samples.push(Bun.nanoseconds() - start);
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)]!;
    const perOp = median / iterations;
    console.log(`${label.padEnd(40)} ${(median / 1e6).toFixed(2)} ms total | ${perOp.toFixed(0)} ns/op`);
}

// Cold: fresh object each time -> always misses cache, recomputes
{
    const ITER = 2000;
    let i = 0;
    bench("cold (fresh object, recompute)", ITER, () => {
        valuesByHabitat(makeFeatures(i++, 50));
    });
}

// Hot: same object reused -> cache hit on every call
{
    const ITER = 200_000;
    const features = makeFeatures(1_000_000, 50);
    bench("hot (cache hit, same object)", ITER, () => {
        valuesByHabitat(features);
    });
}

// Mixed: 100 distinct objects rotated -> all cached after first pass
{
    const ITER = 200_000;
    const pool = Array.from({ length: 100 }, (_, k) => makeFeatures(2_000_000 + k, 50));
    let k = 0;
    bench("warm pool (100 cached objects)", ITER, () => {
        valuesByHabitat(pool[k++ % pool.length]!);
    });
}

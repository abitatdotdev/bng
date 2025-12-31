import { assert } from "@std/assert";
import { allHabitats } from "../habitats";
import type { BroadHabitat, Habitat, HabitatTypeByBroadHabitat } from "../types";

class OnSiteHabitat<
    H extends Habitat,
    BH extends BroadHabitat
> {
    habitatData: H;
    irreplaceable: boolean;

    constructor(
        public broadHabitat: BH,
        public habitatType: HabitatTypeByBroadHabitat<BH>,
        /* Area in hectares */
        public area: number,
        irreplaceable?: boolean,
    ) {
        this.habitatData = allHabitats.find(h => h.level2Code === broadHabitat && h.type === habitatType) as H;

        let resolvedIrreplaceable = this.habitatData.irreplaceable || irreplaceable;
        assert(!!resolvedIrreplaceable, `${this.habitatData.label} must have it's "irreplaceable" value defined`);
        this.irreplaceable = resolvedIrreplaceable;
    }

    get isIrreplaceableHabitat(): boolean | undefined {
        return this.habitatData.irreplaceable;
    }
}


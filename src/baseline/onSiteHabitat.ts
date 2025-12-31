import { assert } from "@std/assert";
import { allHabitats } from "../habitats";
import type { BroadHabitat, Habitat, HabitatTypeByBroadHabitat } from "../types";

class OnSiteHabitat<
    H extends Habitat,
    BH extends BroadHabitat
> {
    data: H;
    public irreplaceable: boolean;
    public distinctiveness: Habitat['distinctivenessCategory']

    constructor(
        public broadHabitat: BH,
        public habitatType: HabitatTypeByBroadHabitat<BH>,
        /* Area in hectares */
        public area: number,
        irreplaceable?: boolean,
    ) {
        this.data = allHabitats.find(h => h.level2Code === broadHabitat && h.type === habitatType) as H;

        let resolvedIrreplaceable = this.data.irreplaceable || irreplaceable;
        assert(!!resolvedIrreplaceable, `${this.data.label} must have it's "irreplaceable" value defined`);
        this.irreplaceable = resolvedIrreplaceable;

        this.distinctiveness = this.data.distinctivenessCategory;
    }
}


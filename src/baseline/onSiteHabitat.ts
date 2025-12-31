import { allHabitats } from "../habitats";
import type { BroadHabitat, Habitat, HabitatTypeByBroadHabitat } from "../types";

class OnSiteHabitat<
    H extends Habitat,
    BH extends BroadHabitat
> {
    habitatData: H;

    constructor(
        public broadHabitat: BH,
        public habitatType: HabitatTypeByBroadHabitat<BH>,
        /* Area in hectares */
        public area: number,
    ) {
        this.habitatData = allHabitats.find(h => h.level2Code === broadHabitat && h.type === habitatType) as H;
    }

    get isIrreplaceableHabitat() {
        return this.habitatData.irreplaceable;
    }
}


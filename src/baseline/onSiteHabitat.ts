import type { BroadHabitat, HabitatTypeByBroadHabitat } from "../types";

class OnSiteHabitat<
    BH extends BroadHabitat
> {
    constructor(
        public broadHabitat: BH,
        public habitatType: HabitatTypeByBroadHabitat<BH>,
    ) { }
}


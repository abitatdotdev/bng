import { assert } from "@std/assert";
import { allHabitats, type Habitat, type HabitatLabel } from "../habitats";

export class OnSiteHabitat<L extends HabitatLabel, H extends Habitat<L>> {
    data: H;
    public irreplaceable: boolean;

    constructor(
        public label: L,
        /* Area in hectares */
        public area: number,
        public condition: keyof H['conditions'],
        irreplaceable?: boolean,
    ) {
        this.data = allHabitats[label] as H;

        let resolvedIrreplaceable = this.data.irreplaceable || irreplaceable;
        assert(!!resolvedIrreplaceable, `${this.data.label} must have it's "irreplaceable" value defined`);
        this.irreplaceable = resolvedIrreplaceable;
    }

    get distinctiveness() { return this.data.distinctivenessCategory }
    get distinctivenessScore() { return this.data.distinctivenessScore }
}


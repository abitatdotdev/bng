import { assert } from "@std/assert";
import { getHabitat, type Habitat, type HabitatLabel } from "../habitats";

export class OnSiteHabitat<L extends HabitatLabel> {
    data: Habitat<L>;
    public irreplaceable: boolean;

    constructor(
        public label: L,
        /* Area in hectares */
        public area: number,
        public condition: keyof Habitat<L>['conditions'],
        irreplaceable?: boolean,
    ) {
        this.data = getHabitat(label);

        let resolvedIrreplaceable = this.data.irreplaceable || irreplaceable;
        assert(!!resolvedIrreplaceable, `${this.data.label} must have it's "irreplaceable" value defined`);
        this.irreplaceable = resolvedIrreplaceable;
    }

    get distinctiveness() { return this.data.distinctivenessCategory }
    get distinctivenessScore() { return this.data.distinctivenessScore }

    get conditionScore() {
        return this.data.conditions[this.condition];
    }
}

const test = new OnSiteHabitat("Grassland - Modified grassland", 2, "Good")
test.condition

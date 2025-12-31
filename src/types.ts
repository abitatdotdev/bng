import { allHabitats } from "./habitats";

export type Habitat = typeof allHabitats[number]
export type HabitatType = Habitat['type']
export type BroadHabitat = Habitat['level2Label']

type isBroadHabitat<H extends Habitat, BH extends BroadHabitat> = H extends { 'level2Label': BH } ? H : never;
export type HabitatTypeByBroadHabitat<BH extends BroadHabitat> = isBroadHabitat<Habitat, BH>['type'];


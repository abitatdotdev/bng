import * as v from 'valibot';
import { onSiteHabitatBaselineSchema } from '../src/onSite/habitatBaseline';

const row = v.parse(onSiteHabitatBaselineSchema, {
    broadHabitat: "Grassland",
    habitatType: "Modified grassland",
    irreplaceableHabitat: false,
    area: 0.176,
    condition: "Poor",
    strategicSignificance: "Formally identified in local strategy",
    areaRetained: 0.072,
})

console.info(row);

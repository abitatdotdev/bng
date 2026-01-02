import * as v from 'valibot';
import { onSiteHabitatBaselineSchema } from '../src/onSite/habitatBaseline';

const row = v.parse(onSiteHabitatBaselineSchema, {
    broadHabitat: "Woodland and forest",
    habitatType: "Native pine woodlands",
    irreplaceableHabitat: true,
    area: 1,
    condition: "Fairly Good",
    strategicSignificance: "Location ecologically desirable but not in local strategy",
    areaRetained: 1,
})

console.info(row);

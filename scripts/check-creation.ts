import * as v from 'valibot';
import { onSiteHabitatCreationSchema } from '../src/onSite/habitatCreation';

const row = v.safeParse(onSiteHabitatCreationSchema, {
    broadHabitat: "Individual trees",
    habitatType: "Urban tree",
    irreplaceableHabitat: true,
    area: 0.0814,
    condition: "Moderate",
    strategicSignificance: "Formally identified in local strategy",
})

console.info(row);

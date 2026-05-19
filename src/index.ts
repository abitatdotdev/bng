export * from './parsers';
export * from './headlineResults';
export * from './tradingSummaries';
export * from './unitShortfall';
export * from './groupings';
export type { DistinctivenessCategory } from './distinctivenessCategories';

import { allHabitats } from './habitats';
import { allHedgerows } from './hedgerows';
import { allWatercourses } from './watercourses';

export const data = {
    habitats: allHabitats,
    hedgerows: allHedgerows,
    watercourses: allWatercourses
}

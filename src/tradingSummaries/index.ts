import type { AllFeatures } from '../features';
import { habitatTradingSummary } from './habitats';
import { hedgerowTradingSummary } from './hedgerows';
import { watercourseTradingSummary } from './watercourses';

export { habitatTradingSummary } from './habitats';
export { hedgerowTradingSummary } from './hedgerows';
export { watercourseTradingSummary } from './watercourses';

export type TradingSummaries = {
    habitats: ReturnType<typeof habitatTradingSummary>,
    hedgerows: ReturnType<typeof hedgerowTradingSummary>,
    watercourses: ReturnType<typeof watercourseTradingSummary>,
}

export const tradingSummaries = (features: AllFeatures): TradingSummaries => {
    return {
        habitats: habitatTradingSummary(features),
        hedgerows: hedgerowTradingSummary(features),
        watercourses: watercourseTradingSummary(features),
    }
}

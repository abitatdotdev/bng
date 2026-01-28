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

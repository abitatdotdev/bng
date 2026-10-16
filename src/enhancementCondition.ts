export type EnhancementConditionScore = number | 'Not possible';

export function enhancementConditionAllowed(
    baseline: EnhancementConditionScore,
    proposed: EnhancementConditionScore,
): boolean {
    return !(typeof baseline === 'number' && typeof proposed === 'number' && baseline > proposed);
}

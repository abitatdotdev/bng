import { toDecimal } from './decimal';
import { difficulty } from './difficulty';

/**
 * Pure calculation: derives enhancement difficulty fields shared by habitat,
 * hedgerow and watercourse enhancement schemas.
 *
 * Callers resolve the standard difficulty and family-specific warning label.
 * Area habitats also pass the target-reached decision from their timing evidence.
 */
export function calculateEnhancementDifficulty<S extends string>(input: {
    enhancedInAdvance: number | '30+';
    finalTimeToTargetCondition: number | '30+' | S;
    standardDifficultyOfEnhancement: keyof typeof difficulty;
    lowDifficultyMessage: string;
    hasReachedTargetCondition?: boolean;
}) {
    const normalisedEnhancedInAdvance =
        typeof input.enhancedInAdvance === 'string' ? 30 : input.enhancedInAdvance;

    const hasReachedTargetCondition =
        input.hasReachedTargetCondition ??
        (normalisedEnhancedInAdvance > 0 && input.finalTimeToTargetCondition === 0);

    let appliedDifficultyMultiplier: string;
    let finalDifficultyOfEnhancement: keyof typeof difficulty;
    if (hasReachedTargetCondition) {
        appliedDifficultyMultiplier = input.lowDifficultyMessage;
        finalDifficultyOfEnhancement = 'Low';
    } else {
        appliedDifficultyMultiplier = 'Standard difficulty applied';
        finalDifficultyOfEnhancement = input.standardDifficultyOfEnhancement;
    }

    const difficultyMultiplierApplied = difficulty[finalDifficultyOfEnhancement];

    return {
        standardDifficultyOfEnhancement: input.standardDifficultyOfEnhancement,
        appliedDifficultyMultiplier,
        finalDifficultyOfEnhancement,
        difficultyMultiplierApplied,
        difficultyMultiplierAppliedDecimal: toDecimal(difficultyMultiplierApplied),
    };
}

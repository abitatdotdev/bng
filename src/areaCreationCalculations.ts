import { toDecimal } from './decimal';
import type { CreationHabitatType } from './habitatTypes';
import type { Habitat } from './habitats';
import { hasAreaHabitatReachedTarget, type AreaTargetTime, type AreaTimingYears } from './areaTiming';
import { difficulty } from './difficulty';
import type { AreaDistinctivenessScore } from './areaCalculationTypes';

export function calculateStandardOrAdjustedTimeToTarget(
    normalisedHabitatCreationInAdvance: number,
    habitatCreationInAdvance: AreaTimingYears,
    normalisedHabitatCreationDelay: number,
    habitatCreationDelay: AreaTimingYears,
    distinctivenessScore: AreaDistinctivenessScore,
    timeToTargetCondition: AreaTargetTime,
    timeToPoorCondition: Habitat['temporalMultipliers']['Poor'],
) {
    if (
        (normalisedHabitatCreationInAdvance > 0 || habitatCreationInAdvance === '30+') &&
        (normalisedHabitatCreationDelay > 0 || habitatCreationDelay === '30+')
    ) {
        return 'Error -both advance and delayed habitat creation ▲' as const;
    }

    if (distinctivenessScore === 0) {
        return 'Standard time to target condition applied' as const;
    }

    if (hasAreaHabitatReachedTarget(timeToTargetCondition, habitatCreationInAdvance)) {
        return 'Check details - Is there evidence that habitat has reached target condition? ⚠' as const;
    }

    if (timeToTargetCondition === 'Not Possible ▲' && normalisedHabitatCreationInAdvance > 0) {
        return '' as const;
    }

    if (
        timeToPoorCondition !== 'Not Possible ▲' &&
        typeof timeToPoorCondition === 'number' &&
        normalisedHabitatCreationInAdvance >= timeToPoorCondition &&
        normalisedHabitatCreationInAdvance > 0
    ) {
        return 'Check details - Is there evidence habitat creation started and the threshold for Poor condition reached? ⚠' as const;
    }

    if (
        timeToTargetCondition !== 'Not Possible ▲' &&
        timeToTargetCondition !== '30+' &&
        normalisedHabitatCreationInAdvance < timeToTargetCondition &&
        normalisedHabitatCreationInAdvance > 0
    ) {
        return 'Check details - Is there evidence habitat creation in place? ⚠' as const;
    }

    if (normalisedHabitatCreationDelay > 0 || habitatCreationDelay === '30+') {
        return 'Check details- Delay in starting habitat in required condition? ⚠' as const;
    }

    if (normalisedHabitatCreationInAdvance > 0 || habitatCreationInAdvance === '30+') {
        return 'Check details - Is there evidence habitat creation started/in place? ⚠' as const;
    }

    return 'Standard time to target condition applied' as const;
}

export function calculateDifficultyData(input: {
    habitatType: CreationHabitatType;
    standardOrAdjustedTimeToTarget: ReturnType<typeof calculateStandardOrAdjustedTimeToTarget>;
    timeToTargetCondition: AreaTargetTime;
    habitatCreationInAdvance: AreaTimingYears;
    standardDifficultyOfCreation: Habitat['technicalDifficultyCreation'];
    technicalDifficultyEnhancement: Habitat['technicalDifficultyEnhancement'];
}) {
    const appliedDifficultyMultiplier = calculateAppliedDifficultyMultiplier(
        input.standardOrAdjustedTimeToTarget,
        input.habitatType,
    );
    const finalDifficultyOfCreation = calculateFinalDifficultyOfCreation(
        appliedDifficultyMultiplier,
        input.timeToTargetCondition,
        input.habitatCreationInAdvance,
        input.standardDifficultyOfCreation,
        input.technicalDifficultyEnhancement,
    );
    const difficultyMultiplierApplied = calculateDifficultyMultiplierApplied(finalDifficultyOfCreation);

    return {
        standardDifficultyOfCreation: input.standardDifficultyOfCreation,
        appliedDifficultyMultiplier,
        finalDifficultyOfCreation,
        difficultyMultiplierApplied,
        difficultyMultiplierAppliedDecimal: toDecimal(difficultyMultiplierApplied),
    };
}

export function calculateFinalDifficultyOfCreation(
    appliedDifficultyMultiplier: ReturnType<typeof calculateAppliedDifficultyMultiplier>,
    timeToTargetCondition: AreaTargetTime,
    habitatCreationInAdvance: AreaTimingYears,
    standardDifficultyOfCreation: Habitat['technicalDifficultyCreation'],
    technicalDifficultyEnhancement: Habitat['technicalDifficultyEnhancement'],
) {
    if (
        appliedDifficultyMultiplier === 'Standard difficulty applied' &&
        timeToTargetCondition !== 'Not Possible ▲' &&
        !hasAreaHabitatReachedTarget(timeToTargetCondition, habitatCreationInAdvance)
    ) {
        return standardDifficultyOfCreation;
    }
    if (
        appliedDifficultyMultiplier ===
            'Low Difficulty - only applicable if all habitat created before losses ⚠' &&
        hasAreaHabitatReachedTarget(timeToTargetCondition, habitatCreationInAdvance)
    ) {
        return 'Low';
    }

    return technicalDifficultyEnhancement;
}

export function calculateAppliedDifficultyMultiplier(
    standardOrAdjustedTimeToTarget: ReturnType<typeof calculateStandardOrAdjustedTimeToTarget>,
    type: CreationHabitatType,
) {
    if (
        standardOrAdjustedTimeToTarget ===
        'Check details - Is there evidence that habitat has reached target condition? ⚠'
    ) {
        return 'Low Difficulty - only applicable if all habitat created before losses ⚠';
    }

    if (
        standardOrAdjustedTimeToTarget ===
            'Check details - Is there evidence habitat creation started and the threshold for Poor condition reached? ⚠' &&
        ![
            'Traditional orchards',
            'Ornamental lake or pond',
            'Ponds (non-priority habitat)',
            'Ruderal/Ephemeral',
            'Tall forbs',
            'Developed land; sealed surface',
        ].includes(type)
    ) {
        return 'Enhancement difficulty applied';
    }

    return 'Standard difficulty applied';
}

export function calculateDifficultyMultiplierApplied(
    finalDifficultyOfCreation: ReturnType<typeof calculateFinalDifficultyOfCreation>,
) {
    return difficulty[finalDifficultyOfCreation];
}

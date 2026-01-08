import { getSpatialRiskMultiplier } from '../spatialRisk';
import { getTemporalMultiplier, type TemporalMultiplierKey } from '../temporalMultipliers';

/**
 * Calculates the final time to target condition and its corresponding multiplier based on:
 * - Standard time to target condition
 * - Years of advance work
 * - Years of delay in starting work
 *
 * Formula: finalTime = standardTime - advance + delay
 * - Capped at "30+" if result > 30
 * - Returns 0 if advance >= standardTime
 * - Returns "Not Possible" if standardTime is "Not Possible ▲"
 *
 * Also looks up the temporal multiplier for the calculated final time.
 */
export function calculateFinalTimeToTargetValues<Data extends {
    timeToTargetCondition: number | "30+" | "Not Possible ▲",
    advance: number | "30+",
    delay: number | "30+"
}>(data: Data) {
    const { timeToTargetCondition, advance, delay } = data;

    let finalTimeToTargetCondition: number | "30+" | "Not Possible ▲";
    const normalisedAdvance = typeof advance === "string" ? 30 : advance;
    const normalisedDelay = typeof delay === "string" ? 30 : delay;

    // If standard time is "Not Possible", final time is also "Not Possible"
    if (timeToTargetCondition === "Not Possible ▲") {
        finalTimeToTargetCondition = "Not Possible ▲";
    }
    // Handle "30+" standard time
    else if (timeToTargetCondition === "30+") {
        if (advance === 0) {
            finalTimeToTargetCondition = "30+";
        } else {
            // 30 - advance (capped at 0)
            finalTimeToTargetCondition = Math.max(0, 30 - normalisedAdvance);
        }
    }
    // If advance >= standard time, final time is 0
    else if (normalisedAdvance >= timeToTargetCondition) {
        finalTimeToTargetCondition = 0;
    }
    // Calculate: standardTime - advance + delay
    else {
        const result = timeToTargetCondition - normalisedAdvance + normalisedDelay;

        // Cap at "30+" if result > 30
        if (result > 30) {
            finalTimeToTargetCondition = "30+";
        } else {
            // Ensure non-negative result
            finalTimeToTargetCondition = Math.max(0, result);
        }
    }

    // Look up the temporal multiplier for the final time
    const multiplierKey = String(finalTimeToTargetCondition) as TemporalMultiplierKey;
    const multiplierResult = getTemporalMultiplier(multiplierKey);

    // Convert 'N/A' to undefined for calculations, keep numeric values
    const finalTimeToTargetMultiplier = multiplierResult === 'N/A' ? undefined : multiplierResult;

    return {
        ...data,
        finalTimeToTargetCondition,
        finalTimeToTargetMultiplier
    };
}

/**
 * Enriches data with spatial risk multiplier.
 *
 * Looks up the multiplier value based on the spatial risk category.
 */
export function enrichWithSpatialRisk<Data extends {
    spatialRiskCategory: string
}>(data: Data) {
    const spatialRiskMultiplier = getSpatialRiskMultiplier(data.spatialRiskCategory as any);

    return {
        ...data,
        spatialRiskMultiplier
    };
}

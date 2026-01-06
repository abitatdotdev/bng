// THIS FILE IS GENERATED AUTOMATICALLY
// Temporal multipliers from G-4 Temporal multipliers sheet (A4:C37)
// Maps years to target condition time to reach target condition multiplier

export const temporalMultipliers = {
    0: 1,
    1: 0.965,
    2: 0.931225,
    3: 0.898632125,
    4: 0.8671800005999999,
    5: 0.8368287006,
    6: 0.8075396961,
    7: 0.7792758067,
    8: 0.7520011535000001,
    9: 0.7256811131,
    10: 0.7002822741999999,
    11: 0.6757723946,
    12: 0.6521203607,
    13: 0.6292961481,
    14: 0.6072707829,
    15: 0.5860163055000001,
    16: 0.5655057348,
    17: 0.5457130340999999,
    18: 0.5266130779,
    19: 0.5081816202,
    20: 0.4903952635,
    21: 0.4732314293,
    22: 0.4566683292,
    23: 0.44068493770000006,
    24: 0.4252609649,
    25: 0.4103768311,
    26: 0.396013642,
    27: 0.3821531646,
    28: 0.36877780379999997,
    29: 0.3558705807,
    30: 0.3434151104,
    31: 0.3313955815,
    '30+': 0.3197967361,
    'Not Possible ▲': 'N/A'
} as const;

export type TemporalMultiplierKey = keyof typeof temporalMultipliers;

/**
 * Looks up a temporal multiplier value based on the years to target condition
 * Corresponds to VLOOKUP formula in Excel: VLOOKUP(years,'G-4 Temporal multipliers'!$A$4:$C$37,3,FALSE)
 *
 * @param years - Number of years to reach target condition, or special keys like "30+" or "Not Possible ▲"
 * @returns The temporal multiplier value, or undefined if not found
 */
export function getTemporalMultiplier(years: TemporalMultiplierKey) {
    return temporalMultipliers[years];
}

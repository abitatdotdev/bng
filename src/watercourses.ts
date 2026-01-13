// THIS FILE IS GENERATED AUTOMATICALLY
import { difficulty } from "./difficulty";
import { distinctivenessCategories } from "./distinctivenessCategories";

export const allWatercourses = {
    'Priority habitat': {
        label: 'Priority habitat',
        distinctivenessCategory: 'V.High',
        distinctivenessScore: distinctivenessCategories["V.High"].score,
        irreplaceable: false,
        tradingRules: 'Same habitat required – bespoke compensation option ⚠',
        technicalDifficulty: 'Medium',
        conditions: {
            'Good': 3,
            'Fairly Good': 2.5,
            'Moderate': 2,
            'Fairly Poor': 1.5,
            'Poor': 1,
        },
        yearsToTargetConditionViaCreation: {
            'Moderate': 8,
        },
    },
    'Other rivers and streams': {
        label: 'Other rivers and streams',
        distinctivenessCategory: 'High',
        distinctivenessScore: distinctivenessCategories["High"].score,
        irreplaceable: false,
        tradingRules: 'Same habitat required =',
        technicalDifficulty: 'Medium',
        conditions: {
            'Good': 3,
            'Fairly Good': 2.5,
            'Moderate': 2,
            'Fairly Poor': 1.5,
            'Poor': 1,
        },
        yearsToTargetConditionViaCreation: {
            'Moderate': 5,
        },
    },
    'Ditches': {
        label: 'Ditches',
        distinctivenessCategory: 'Medium',
        distinctivenessScore: distinctivenessCategories["Medium"].score,
        irreplaceable: false,
        tradingRules: 'Same habitat required =',
        technicalDifficulty: 'Low',
        conditions: {
            'Good': 3,
            'Fairly Good': 2.5,
            'Moderate': 2,
            'Fairly Poor': 1.5,
            'Poor': 1,
        },
        yearsToTargetConditionViaCreation: {
            'Moderate': 2,
        },
    },
    'Canals': {
        label: 'Canals',
        distinctivenessCategory: 'Medium',
        distinctivenessScore: distinctivenessCategories["Medium"].score,
        irreplaceable: false,
        tradingRules: 'Same habitat required =',
        technicalDifficulty: 'Low',
        conditions: {
            'Good': 3,
            'Fairly Good': 2.5,
            'Moderate': 2,
            'Fairly Poor': 1.5,
            'Poor': 1,
        },
        yearsToTargetConditionViaCreation: {
            'Moderate': 1,
        },
    },
    'Culvert': {
        label: 'Culvert',
        distinctivenessCategory: 'Low',
        distinctivenessScore: distinctivenessCategories["Low"].score,
        irreplaceable: false,
        tradingRules: 'Better distinctiveness habitat required',
        technicalDifficulty: 'N/A',
        conditions: {
            'Good': 'Not possible',
            'Fairly Good': 'Not possible',
            'Moderate': 'Not possible',
            'Fairly Poor': 'Not possible',
            'Poor': 1,
        },
        yearsToTargetConditionViaCreation: null,
    }
} as const;

export type WatercourseMap = typeof allWatercourses;
type WatercourseMapLabel = keyof WatercourseMap;
export type Watercourse = WatercourseMap[WatercourseMapLabel];
export type WatercourseLabel = Watercourse['label'];

export function watercourseByLabel(label: WatercourseLabel): Watercourse | undefined {
    return allWatercourses[label];
}

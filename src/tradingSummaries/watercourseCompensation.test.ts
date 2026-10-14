import { expect, test, describe } from 'bun:test';
import { Decimal, type Quantity } from '../decimal';
import { featuresFromInput, type BngInput } from '../parsers/featuresFromInput';
import { valuesByWatercourse } from '../groupings/watercourses';
import { headlineResults } from '../headlineResults';
import { tradingSummaries } from './index';

type CompensationStatus = 'Yes' | 'Pending' | 'No' | undefined;

function baselineInput(
    site: 'onSite' | 'offSite',
    bespokeCompensation?: CompensationStatus,
    watercourseType: 'Priority habitat' | 'Ditches' = 'Priority habitat',
    length: Quantity = 1,
    lengthRetained: Quantity = 0.5,
): BngInput {
    const common = {
        watercourseType,
        length,
        condition: 'Moderate' as const,
        strategicSignificance: 'Area/compensation not in local strategy/ no local strategy' as const,
        watercourseEncroachment: 'No Encroachment' as const,
        riparianEncroachment: 'No Encroachment/ No Encroachment' as const,
        lengthRetained,
        lengthEnhanced: 0,
        userComments: '',
        planningAuthorityComments: '',
        habitatReferenceNumber: '',
        ...(bespokeCompensation === undefined ? {} : { bespokeCompensation }),
    };

    if (site === 'onSite') return { onSiteWatercourseBaselines: [common] };

    return {
        offSiteWatercourseBaselines: [
            {
                ...common,
                spatialRiskCategory: 'Within waterbody catchment',
                offSiteReferenceNumber: 'OFF-001',
            },
        ],
    };
}

function parsed(input: BngInput) {
    const result = featuresFromInput(input);
    expect(result.issues).toEqual([]);
    return result.features;
}

function priorityChange(features: ReturnType<typeof parsed>) {
    return valuesByWatercourse(features)['Priority habitat']!.overallUnitChangeDecimal;
}

describe('watercourse bespoke compensation in trading', () => {
    for (const site of ['onSite', 'offSite'] as const) {
        describe(site, () => {
            test.each([
                ['Yes', true],
                ['Pending', true],
                ['No', false],
                ['unset', false],
            ] as const)('%s compensation follows the baseline row into trading', (status, tradingSatisfied) => {
                const bespokeCompensation = status === 'unset' ? undefined : status;
                const features = parsed(baselineInput(site, bespokeCompensation));
                const baseline =
                    site === 'onSite'
                        ? features.onSiteWatercourseBaselines[0]!
                        : features.offSiteWatercourseBaselines[0]!;

                expect(baseline.totalWatercourseUnitsDecimal.eq(16)).toBeTrue();
                expect(baseline.unitsRetainedDecimal.eq(8)).toBeTrue();
                expect(baseline.vhdhBespokeCompensationUnitsDecimal.eq(tradingSatisfied ? 8 : 0)).toBeTrue();
                expect(priorityChange(features).eq(tradingSatisfied ? 0 : -8)).toBeTrue();
                expect(tradingSummaries(features).watercourses.vHighSatisfied).toBe(tradingSatisfied);
            });

            test('calculates the same compensation when validation is disabled', () => {
                const input = baselineInput(site, 'Yes');
                const checked = parsed(input);
                const uncheckedResult = featuresFromInput(input, { validate: false });
                expect(uncheckedResult.issues).toEqual([]);
                const unchecked = uncheckedResult.features;
                const baseline =
                    site === 'onSite'
                        ? unchecked.onSiteWatercourseBaselines[0]!
                        : unchecked.offSiteWatercourseBaselines[0]!;

                expect(priorityChange(checked).eq(0)).toBeTrue();
                expect(priorityChange(unchecked).eq(0)).toBeTrue();
                expect(baseline.unitsRetainedDecimal.eq(8)).toBeTrue();
                expect(baseline.vhdhBespokeCompensationUnitsDecimal.eq(8)).toBeTrue();
            });
        });
    }

    test('credits each qualifying row across on-site and off-site baselines exactly once', () => {
        const features = parsed({
            onSiteWatercourseBaselines: [
                baselineInput('onSite', 'Yes').onSiteWatercourseBaselines![0]!,
                baselineInput('onSite', 'Pending').onSiteWatercourseBaselines![0]!,
            ],
            offSiteWatercourseBaselines: baselineInput('offSite', 'Yes').offSiteWatercourseBaselines,
        });
        const summary = valuesByWatercourse(features)['Priority habitat']!;

        expect(summary.existingUnitsBaselineOnSiteDecimal.eq(32)).toBeTrue();
        expect(summary.existingUnitsBaselineOnSite).toBe(32);
        expect(summary.existingUnitsRetainedOnSiteDecimal.eq(32)).toBeTrue();
        expect(summary.existingUnitsRetainedOnSite).toBe(32);
        expect(summary.existingUnitsOffSiteDecimal.eq(16)).toBeTrue();
        expect(summary.existingUnitsOffSite).toBe(16);
        expect(summary.retainedUnitsOffSiteDecimal.eq(16)).toBeTrue();
        expect(summary.retainedUnitsOffSite).toBe(16);
        expect(summary.overallUnitChangeDecimal.eq(0)).toBeTrue();
        expect(summary.overallUnitChange).toBe(0);
        expect(tradingSummaries(features).watercourses.vHighSatisfied).toBeTrue();
    });

    test('keeps headline totals and raw retained units separate from trading compensation', () => {
        const features = parsed(baselineInput('onSite', 'Yes'));
        const baseline = features.onSiteWatercourseBaselines[0]!;
        const headline = headlineResults(features, tradingSummaries(features));

        expect(baseline.unitsRetainedDecimal.eq(8)).toBeTrue();
        expect(headline.onSiteWatercourseBaselineDecimal.eq(16)).toBeTrue();
        expect(headline.onSiteWatercoursePostInterventionDecimal.eq(16)).toBeTrue();
        expect(headline.onSiteWatercourseNetChange.unitsDecimal.eq(0)).toBeTrue();
        expect(priorityChange(features).eq(0)).toBeTrue();
    });

    test('off-site headline includes bespoke compensation before spatial risk adjustment', () => {
        const input = baselineInput('offSite', 'Yes');
        input.offSiteWatercourseBaselines![0]!.spatialRiskCategory = 'Outside operational catchment';
        const features = parsed(input);
        const baseline = features.offSiteWatercourseBaselines[0]!;
        const headline = headlineResults(features, tradingSummaries(features));

        expect(baseline.spatialRiskMultiplier).toBe(0.5);
        expect(baseline.unitsRetainedDecimal.eq(8)).toBeTrue();
        expect(baseline.vhdhBespokeCompensationUnitsDecimal.eq(8)).toBeTrue();
        expect(headline.offSiteWatercourseBaselineDecimal.eq(16)).toBeTrue();
        expect(headline.offSiteWatercoursePostInterventionDecimal.eq(16)).toBeTrue();
        expect(headline.offSiteWatercourseNetChange.unitsDecimal.eq(0)).toBeTrue();
    });

    test('ordinary Ditches keep bespoke compensation out of watercourse trading', () => {
        const features = parsed(baselineInput('onSite', 'Yes', 'Ditches'));
        const baseline = features.onSiteWatercourseBaselines[0]!;

        expect(baseline.vhdhBespokeCompensationUnitsDecimal.eq(0)).toBeTrue();
        expect(valuesByWatercourse(features).Ditches!.overallUnitChangeDecimal.eq(-4)).toBeTrue();
        expect(tradingSummaries(features).watercourses.mediumSatisfied).toBeFalse();
    });

    test('preserves tiny decimal-string losses alongside a compensated baseline', () => {
        const tinyUncompensated = baselineInput(
            'onSite',
            'No',
            'Priority habitat',
            '0.000000000000001',
            '0.0000000000000005',
        ).onSiteWatercourseBaselines![0]!;
        const features = parsed({
            onSiteWatercourseBaselines: [
                baselineInput('onSite', 'Yes').onSiteWatercourseBaselines![0]!,
                tinyUncompensated,
            ],
        });
        const baseline = features.onSiteWatercourseBaselines[1]!;
        const change = priorityChange(features);

        expect(baseline.lengthDecimal.eq(new Decimal('0.000000000000001'))).toBeTrue();
        expect(baseline.totalWatercourseUnitsDecimal.eq(new Decimal('0.000000000000016'))).toBeTrue();
        expect(baseline.unitsRetainedDecimal.eq(new Decimal('0.000000000000008'))).toBeTrue();
        expect(change.eq('-0.000000000000008')).toBeTrue();
        expect(change.lt(0)).toBeTrue();
        expect(tradingSummaries(features).watercourses.vHighSatisfied).toBeFalse();
    });
});

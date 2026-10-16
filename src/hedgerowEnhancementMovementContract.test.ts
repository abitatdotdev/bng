import { expect, test } from 'bun:test';
import * as browser from './browser';
import * as node from './index';
import type { BngInput, InputIssue } from './index';

const strategicSignificance = 'Location ecologically desirable but not in local strategy';
const spatialRiskCategory =
    'Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA';

function required<T>(value: T | undefined): T {
    if (value === undefined) throw new Error('Expected an item');
    return value;
}

function habitatTypeIssues(issue: InputIssue): string[] {
    const nested = issue.issues.nested;
    if (!nested || !('habitatType' in nested) || !Array.isArray(nested.habitatType)) return [];
    return nested.habitatType.filter((message): message is string => typeof message === 'string');
}

function baseline(habitatType: string, offSite: boolean) {
    return {
        habitatType,
        condition: 'Poor',
        length: '0.5',
        lengthRetained: '0.3',
        lengthEnhanced: '0.2',
        strategicSignificance,
        ...(offSite
            ? {
                  spatialRiskCategory,
                  offSiteReferenceNumber: 'baseline-site',
              }
            : {}),
    };
}

function enhancement(
    baselineType: string,
    habitatType: string,
    condition: string,
    offSite: boolean,
    timing: { hedgerowEnhancedDelay?: string | number } = {},
) {
    return {
        baseline: baseline(baselineType, offSite),
        habitatType,
        condition,
        strategicSignificance,
        hedgerowEnhancedInAdvance: 0,
        hedgerowEnhancedDelay: 0,
        habitatReferenceNumber: `${baselineType}-enhancement`,
        ...timing,
        ...(offSite ? { offSiteReferenceNumber: 'enhancement-site' } : {}),
    };
}

function inputFor(offSite: boolean): BngInput {
    const baselines = [
        baseline('Species-rich native hedgerow', offSite),
        baseline('Line of trees', offSite),
    ];
    const enhancements = [
        enhancement('Line of trees', 'Line of trees', 'Good', offSite, {
            hedgerowEnhancedDelay: '30+',
        }),
        enhancement(
            'Species-rich native hedgerow',
            'Native hedgerow with trees',
            'Moderate',
            offSite,
        ),
    ];

    return offSite
        ? {
              offSiteHedgerowBaselines: baselines,
              offSiteHedgerowEnhancements: enhancements,
          }
        : {
              onSiteHedgerowBaselines: baselines,
              onSiteHedgerowEnhancements: enhancements,
          };
}

function withoutForbiddenEnhancement(input: BngInput, offSite: boolean): BngInput {
    if (offSite) {
        return {
            ...input,
            offSiteHedgerowEnhancements: (input.offSiteHedgerowEnhancements ?? []).slice(0, 1),
        };
    }
    return {
        ...input,
        onSiteHedgerowEnhancements: (input.onSiteHedgerowEnhancements ?? []).slice(0, 1),
    };
}

const entrypoints = [
    { name: 'node', api: node },
    { name: 'browser', api: browser },
] as const;

for (const { name, api } of entrypoints) {
    for (const offSite of [false, true]) {
        const location = offSite ? 'off-site' : 'on-site';

        test(`${name} ${location} entrypoint gates forbidden movement contributions in aggregates`, () => {
            const input = inputFor(offSite);
            const checked = api.featuresFromInput(input);
            const unchecked = api.featuresFromInput(input, { validate: false });
            const withoutForbidden = api.featuresFromInput(
                withoutForbiddenEnhancement(input, offSite),
                { validate: false },
            );
            const sheet = offSite
                ? 'offSiteHedgerowEnhancements'
                : 'onSiteHedgerowEnhancements';
            const baselines = offSite
                ? unchecked.features.offSiteHedgerowBaselines
                : unchecked.features.onSiteHedgerowBaselines;
            const enhancements = offSite
                ? unchecked.features.offSiteHedgerowEnhancements
                : unchecked.features.onSiteHedgerowEnhancements;
            const allowed = required(enhancements[0]);
            const blocked = required(enhancements[1]);

            expect(checked.issues).toHaveLength(1);
            const checkedIssue = required(checked.issues[0]);
            expect(checkedIssue).toMatchObject({ sheet, index: 1 });
            expect(habitatTypeIssues(checkedIssue)).toContain('Error - Enhancement not possible ▲');
            const checkedEnhancements = offSite
                ? checked.features.offSiteHedgerowEnhancements
                : checked.features.onSiteHedgerowEnhancements;
            expect(checkedEnhancements).toHaveLength(1);

            expect(blocked.enhancementMovement).toMatchObject({
                status: 'forbidden',
                message: 'Error - Enhancement not possible ▲',
            });
            expect(blocked.habitatType).toBe('Native hedgerow with trees');
            expect(blocked.length).toBe(0.2);
            expect(blocked.lengthDecimal.toFixed()).toBe('0.2');
            expect(blocked.hedgerowUnitsDelivered).toBe(0);
            expect(blocked.hedgerowUnitsDeliveredDecimal.isZero()).toBeTrue();
            expect(blocked.baseline.totalHedgerowUnitsDecimal.gt(0)).toBeTrue();
            expect(blocked.baseline.unitsRetainedDecimal.gt(0)).toBeTrue();
            expect(required(baselines[0]).unitsRetainedDecimal.gt(0)).toBeTrue();

            expect(allowed.enhancementMovement.status).toBe('allowed');
            expect(allowed.hedgerowEnhancedDelay).toBe('30+');
            expect(allowed.finalTimeToTargetCondition).toBe('30+');
            expect(allowed.hedgerowUnitsDeliveredDecimal.gt(0)).toBeTrue();
            expect('hedgerowUnitsDeliveredWithSpatialRisk' in blocked).toBe(offSite);
            if ('hedgerowUnitsDeliveredWithSpatialRisk' in blocked) {
                expect(blocked.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);
                expect(blocked.hedgerowUnitsDeliveredWithSpatialRiskDecimal.isZero()).toBeTrue();
            }
            expect('hedgerowUnitsDeliveredWithSpatialRisk' in allowed).toBe(offSite);
            if ('hedgerowUnitsDeliveredWithSpatialRisk' in allowed) {
                expect(allowed.hedgerowUnitsDeliveredWithSpatialRiskDecimal.eq(
                    allowed.hedgerowUnitsDeliveredDecimal.times('0.75'),
                )).toBeTrue();
            }

            expect(required(checkedEnhancements[0]).habitatType).toBe('Line of trees');

            const fullTrading = api.tradingSummaries(unchecked.features);
            const withoutTrading = api.tradingSummaries(withoutForbidden.features);
            expect(fullTrading.hedgerows).toEqual(withoutTrading.hedgerows);
            const fullHeadline = api.headlineResults(unchecked.features, fullTrading);
            const withoutHeadline = api.headlineResults(withoutForbidden.features, withoutTrading);
            const { aggregateAvailability: fullAvailability, ...fullResults } = fullHeadline;
            const { aggregateAvailability: withoutAvailability, ...withoutResults } = withoutHeadline;
            expect(fullResults).toEqual(withoutResults);
            const aggregateSheet = offSite ? 'E-3' : 'B-3';
            expect(
                fullAvailability.inputTotals[aggregateSheet].length.valueDecimal
                    .minus(withoutAvailability.inputTotals[aggregateSheet].length.valueDecimal)
                    .toFixed(),
            ).toBe('0.2');

            const fullByType = api.valuesByHedgerow(unchecked.features);
            const withoutByType = api.valuesByHedgerow(withoutForbidden.features);
            const fullTarget = fullByType['Native hedgerow with trees'];
            const withoutTarget = withoutByType['Native hedgerow with trees'];
            if (offSite) {
                expect(
                    fullTarget.proposedLengthEnhancementOffSiteDecimal
                        .minus(withoutTarget.proposedLengthEnhancementOffSiteDecimal)
                        .toFixed(),
                ).toBe('0.2');
            } else {
                expect(
                    fullTarget.proposedLengthEnhancementOnSitePostDevelopmentDecimal
                        .minus(withoutTarget.proposedLengthEnhancementOnSitePostDevelopmentDecimal)
                        .toFixed(),
                ).toBe('0.2');
            }
        });

        test(`${name} ${location} entrypoint reports movement trading-down`, () => {
            const row = enhancement(
                'Native hedgerow with trees',
                'Native hedgerow',
                'Moderate',
                offSite,
            );
            const input = offSite
                ? { offSiteHedgerowEnhancements: [row] }
                : { onSiteHedgerowEnhancements: [row] };
            const checked = api.featuresFromInput(input);
            const unchecked = api.featuresFromInput(input, { validate: false });
            const checkedIssue = required(checked.issues[0]);
            const uncheckedRow = offSite
                ? required(unchecked.features.offSiteHedgerowEnhancements[0])
                : required(unchecked.features.onSiteHedgerowEnhancements[0]);

            expect(checkedIssue).toMatchObject({ index: 0 });
            expect(habitatTypeIssues(checkedIssue)).toContain('Error Trading Down ▲');
            expect(uncheckedRow.enhancementMovement).toMatchObject({
                status: 'forbidden',
                message: 'Error Trading Down ▲',
            });
            expect(uncheckedRow.hedgerowUnitsDeliveredDecimal.isZero()).toBeTrue();
        });
    }
}

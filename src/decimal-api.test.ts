import { describe, expect, test } from 'bun:test';
import DecimalJs from 'decimal.js';
import * as v from 'valibot';
import * as bng from './index';
import * as browser from './browser';
import { calculateHedgerowUnitsDelivered } from './hedgerowCalc';
import { buildInputsJsonSchema } from '../scripts/generateJsonSchema';

const measurement = '0.123456789123456789';
const strategicSignificance = 'Area/compensation not in local strategy/ no local strategy' as const;
const spatialRiskCategory =
    'Compensation outside LPA or NCA of impact site, but in neighbouring LPA or NCA' as const;
const waterRisk = 'Outside waterbody catchment, but within operational catchment' as const;

function allSheets(quantity: bng.Quantity): bng.BngInput {
    const habitat = {
        broadHabitat: 'Grassland',
        habitatType: 'Modified grassland',
        strategicSignificance,
        offSiteReferenceNumber: 'site',
    } as const;
    const hedge = {
        habitatType: 'Native hedgerow',
        strategicSignificance,
        offSiteReferenceNumber: 'site',
    } as const;
    const water = {
        watercourseType: 'Ditches',
        strategicSignificance,
        offSiteReferenceNumber: 'site',
        watercourseEncroachment: 'No Encroachment',
        riparianEncroachment: 'No Encroachment/ No Encroachment',
    } as const;
    const areaBaseline = {
        ...habitat,
        area: quantity,
        areaEnhanced: quantity,
        condition: 'Poor',
        irreplaceableHabitat: false,
    } as const;
    const hedgeBaseline = {
        ...hedge,
        length: quantity,
        lengthEnhanced: quantity,
        condition: 'Poor',
    } as const;
    const waterBaseline = {
        ...water,
        length: quantity,
        lengthEnhanced: quantity,
        condition: 'Poor',
    } as const;
    const areaCreation = {
        ...habitat,
        area: quantity,
        condition: 'Moderate',
        habitatCreationInAdvance: '30+',
    } as const;
    const hedgeCreation = {
        ...hedge,
        length: quantity,
        condition: 'Moderate',
        habitatCreatedInAdvance: '30+',
    } as const;
    const waterCreation = {
        ...water,
        length: quantity,
        condition: 'Moderate',
        habitatCreatedInAdvance: '30+',
    } as const;
    const areaEnhancement = { ...habitat, condition: 'Moderate', habitatEnhancedInAdvance: '30+' } as const;
    const hedgeEnhancement = { ...hedge, condition: 'Moderate', hedgerowEnhancedInAdvance: '30+' } as const;
    const waterEnhancement = {
        ...water,
        condition: 'Moderate',
        watercourseEnhancedInAdvance: '30+',
    } as const;
    return {
        onSiteHabitatBaselines: [areaBaseline],
        offSiteHabitatBaselines: [{ ...areaBaseline, spatialRiskCategory }],
        onSiteHedgerowBaselines: [hedgeBaseline],
        offSiteHedgerowBaselines: [{ ...hedgeBaseline, spatialRiskCategory }],
        onSiteWatercourseBaselines: [waterBaseline],
        offSiteWatercourseBaselines: [{ ...waterBaseline, spatialRiskCategory: waterRisk }],
        onSiteHabitatCreations: [areaCreation],
        offSiteHabitatCreations: [{ ...areaCreation, spatialRiskCategory }],
        onSiteHedgerowCreations: [hedgeCreation],
        offSiteHedgerowCreations: [{ ...hedgeCreation, spatialRiskCategory }],
        onSiteWatercourseCreations: [waterCreation],
        offSiteWatercourseCreations: [{ ...waterCreation, spatialRiskCategory: waterRisk }],
        onSiteHabitatEnhancements: [{ ...areaEnhancement, baseline: areaBaseline }],
        offSiteHabitatEnhancements: [
            { ...areaEnhancement, baseline: { ...areaBaseline, spatialRiskCategory } },
        ],
        onSiteHedgerowEnhancements: [{ ...hedgeEnhancement, baseline: hedgeBaseline }],
        offSiteHedgerowEnhancements: [
            { ...hedgeEnhancement, baseline: { ...hedgeBaseline, spatialRiskCategory } },
        ],
        onSiteWatercourseEnhancements: [{ ...waterEnhancement, baseline: waterBaseline }],
        offSiteWatercourseEnhancements: [
            { ...waterEnhancement, baseline: { ...waterBaseline, spatialRiskCategory: waterRisk } },
        ],
    };
}

function expectPairedNumbers(value: unknown): void {
    if (!value || typeof value !== 'object' || DecimalJs.isDecimal(value)) return;
    if (Array.isArray(value)) {
        value.forEach(expectPairedNumbers);
        return;
    }
    const record = value as Record<string, unknown>;
    for (const [key, item] of Object.entries(record)) {
        if (key.startsWith('_') || key.endsWith('Decimal') || key === 'yearsToTargetConditionViaEnhancement')
            continue;
        if (DecimalJs.isDecimal(item)) throw new Error(`${key} must retain its numeric projection`);
        if (typeof item === 'number') {
            const companion = record[`${key}Decimal`] as bng.Decimal;
            expect(DecimalJs.isDecimal(companion), key).toBeTrue();
            expect(companion.toNumber()).toBe(item);
        } else {
            expectPairedNumbers(item);
        }
    }
}

describe('Decimal API', () => {
    for (const [representation, inputQuantity] of [
        ['Decimal', new DecimalJs(measurement)],
        ['string', measurement],
    ] as const) {
        for (const validate of [true, false]) {
            test(`preserves measurement and delivered units across all 18 sheets (${representation}, validate=${validate})`, () => {
                const { features, issues } = bng.featuresFromInput(allSheets(inputQuantity), {
                    validate,
                });
                expect(issues).toEqual([]);
                for (const rows of Object.values(features)) {
                    expect(rows).toHaveLength(1);
                    const row = rows[0]!;
                    expectPairedNumbers(row);
                    expect('habitatTypeDecimal' in row).toBeFalse();
                    expect('conditionDecimal' in row).toBeFalse();
                    const quantity = 'areaDecimal' in row ? row.areaDecimal : row.lengthDecimal;
                    expect(quantity.toString()).toBe(measurement);
                    if ('habitatUnitsDeliveredDecimal' in row)
                        expect(row.habitatUnitsDeliveredDecimal.toString()).toBe('0.493827156493827156');
                    if ('hedgerowUnitsDeliveredDecimal' in row)
                        expect(row.hedgerowUnitsDeliveredDecimal.toString()).toBe('0.493827156493827156');
                    if ('unitsDeliveredDecimal' in row)
                        expect(row.unitsDeliveredDecimal.toString()).toBe('0.987654312987654312');
                    if ('watercourseUnitsDeliveredDecimal' in row)
                        expect(row.watercourseUnitsDeliveredDecimal.toString()).toBe('0.987654312987654312');
                }
                const trading = bng.tradingSummaries(features);
                const headline = bng.headlineResults(features, trading);
                const shortfall = bng.unitShortfall(features, headline, trading);
                expectPairedNumbers(trading);
                expectPairedNumbers(headline);
                expectPairedNumbers(shortfall);
                expect(headline.onSiteHabitatPostInterventionDecimal.toString()).toBe('0.987654312987654312');
                expect(headline.onSiteWatercoursePostInterventionDecimal.toString()).toBe(
                    '1.975308625975308624',
                );
                expect(headline.offSiteHabitatNetChangeWithSRMDecimal.toString()).toBe(
                    '0.5555555510555555505',
                );
                expect(
                    bng
                        .valuesByHabitat(features)
                        [
                            'Grassland - Modified grassland'
                        ].totalProposedUnitsOnSitePostDevelopmentDecimal.toString(),
                ).toBe('0.987654312987654312');
                expect(
                    bng.valuesByBroadHabitat(features).Grassland.onSiteProposedValueDecimal.toString(),
                ).toBe('0.987654312987654312');
                expect(
                    bng
                        .valuesByHedgerow(features)
                        ['Native hedgerow'].totalProposedUnitsOnSitePostDevelopmentDecimal.toString(),
                ).toBe('0.987654312987654312');
                expect(
                    bng
                        .valuesByWatercourse(features)
                        .Ditches.totalProposedUnitsOnSitePostDevelopmentDecimal.toString(),
                ).toBe('1.975308625975308624');
                const exactMap = bng.cumulativeBroadHabitatChangeDecimal(features, 'Low');
                expect(Object.keys(exactMap)).toEqual(
                    Object.keys(bng.cumulativeBroadHabitatChange(features, 'Low')),
                );
                expect(exactMap.Grassland.toString()).toBe('1.481481469481481468');
            });
        }
    }

    test('accepts cloned constructors and keeps arithmetic independent of application Decimal configuration', () => {
        const foreign = DecimalJs.clone({ precision: 40, rounding: DecimalJs.ROUND_DOWN });
        const original = DecimalJs.precision;
        try {
            DecimalJs.set({ precision: 3 });
            const { features, issues } = bng.featuresFromInput(allSheets(new foreign(measurement)));
            expect(issues).toEqual([]);
            expect(features.onSiteHabitatCreations[0]!.habitatUnitsDeliveredDecimal.toString()).toBe(
                '0.493827156493827156',
            );
        } finally {
            DecimalJs.set({ precision: original });
        }
    });

    for (const validate of [true, false]) {
        test(`rejects malformed numeric input with field and row issues (validate=${validate})`, () => {
            const invalid = [
                NaN,
                Infinity,
                -Infinity,
                new DecimalJs(NaN),
                new DecimalJs(Infinity),
                new DecimalJs(-Infinity),
                '',
                ' ',
                'NaN',
                'Infinity',
                '-Infinity',
                '1e-3',
                '0x10',
                '1,000',
                '1.2.3',
                {},
                { toString: () => '0.1' },
                { toStringTag: '[object Decimal]' },
                { toStringTag: '[object Decimal]', toString: () => 'bad' },
                { toStringTag: '[object Decimal]', toString: () => '1' },
            ];
            for (const area of invalid) {
                const { features, issues } = bng.featuresFromInput(
                    {
                        onSiteHabitatBaselines: [{ ...allSheets(1).onSiteHabitatBaselines![0]!, area }],
                    } as bng.BngInput,
                    { validate },
                );
                expect(features.onSiteHabitatBaselines).toHaveLength(0);
                expect(issues[0]).toMatchObject({ sheet: 'onSiteHabitatBaselines', index: 0 });
                expect(
                    (issues[0]!.issues.nested as Record<string, string[]> | undefined)?.area,
                ).toBeDefined();
            }
        });
    }

    test('keeps checked and unchecked business validation distinct', () => {
        const input = {
            onSiteHabitatCreations: [
                {
                    ...allSheets(1).onSiteHabitatCreations![0]!,
                    habitatCreationInAdvance: 2,
                    habitatCreationDelay: 2,
                },
            ],
        };
        expect(bng.featuresFromInput(input).issues).toHaveLength(1);
        const unchecked = bng.featuresFromInput(input, { validate: false });
        expect(unchecked.issues).toEqual([]);
        expectPairedNumbers(unchecked.features.onSiteHabitatCreations[0]);
    });

    test('keeps scalar helpers numeric and exposes their exact counterparts', () => {
        const { features } = bng.featuresFromInput(allSheets(new DecimalJs(measurement)));
        expect(bng.calculateOnSiteHabitatBaseline(features.onSiteHabitatBaselines)).toBe(0.24691357824691357);
        expect(bng.calculateOnSiteHabitatBaselineDecimal(features.onSiteHabitatBaselines).toString()).toBe(
            '0.246913578246913578',
        );
        expect(bng.featureShortfallDecimal(new DecimalJs('-0.123456789123456789'), 0, 1).toString()).toBe(
            measurement,
        );
    });

    test('recognizes tiny gain-site losses hidden by number projections', () => {
        const [result] = bng.calculateOffSiteGainSiteSummary([
            { reference: 'site', baseline: new DecimalJs('1.000000000000000001'), created: 1 },
        ]);
        expect(result!.baseline).toBe(result!.created);
        expect(result!.netChangeDecimal.toString()).toBe('-1e-18');
        expect(bng.hasOffSiteGainSiteLoss([result!])).toBeTrue();
    });

    test('uses feature Decimal companions for downstream arithmetic', () => {
        const { features } = bng.featuresFromInput(allSheets(new DecimalJs(measurement)));
        const row = features.onSiteHabitatCreations[0]!;
        const changed = { ...features, onSiteHabitatCreations: [{ ...row, habitatUnitsDelivered: 999 }] };
        expect(
            bng
                .calculateOnSiteHabitatPostInterventionDecimal([], changed.onSiteHabitatCreations, [])
                .toString(),
        ).toBe('0.493827156493827156');
        expect(
            bng
                .valuesByHabitat(changed)
                [
                    'Grassland - Modified grassland'
                ].proposedUnitsCreationOnSitePostDevelopmentDecimal.toString(),
        ).toBe('0.493827156493827156');
    });

    test('preserves unavailable states and timing sentinels', () => {
        const { features } = bng.featuresFromInput({});
        const headline = bng.headlineResults(features, bng.tradingSummaries(features));
        expect(headline.offSiteHabitatNetChangeWithSRM).toBe('N/A');
        expect(headline.offSiteHabitatNetChangeWithSRMDecimal).toBe('N/A');
        expect(headline.onSiteHabitatNetChange.percentageDecimal.isZero()).toBeTrue();
        expect(v.parse(bng.yearsSchema, '30+')).toBe('30+');
        const row = v.parse(bng.onSiteHedgerowCreationSchema, {
            habitatType: 'Native hedgerow',
            length: 1,
            condition: 'Poor',
            strategicSignificance,
            delayInStartingHabitatCreation: '30+',
        });
        expect(row.finalTimeToTargetCondition).toBe('30+');
        expect(row.finalTimeToTargetConditionDecimal).toBe('30+');
    });

    test('serializes companions as strings accepted by the quantity schema', () => {
        const { features } = bng.featuresFromInput(allSheets(new DecimalJs(measurement)));
        const row = features.onSiteHabitatBaselines[0]!;
        const json = JSON.parse(JSON.stringify(row));
        expect(typeof json.area).toBe('number');
        expect(json.areaDecimal).toBe(measurement);
        expect(DecimalJs.isDecimal(json.areaDecimal)).toBeFalse();
        expect(bng.toDecimal(json.areaDecimal).toString()).toBe(measurement);
        expect(v.parse(bng.quantitySchema, json.areaDecimal).toString()).toBe(measurement);
    });

    test('publishes the same API and schemas through both entrypoints', () => {
        expect(browser.Decimal).toBe(bng.Decimal);
        expect(browser.onSiteHabitatBaselineSchema).toBe(bng.onSiteHabitatBaselineSchema);
        expect(browser.calculateOnSiteHabitatBaselineDecimal).toBe(bng.calculateOnSiteHabitatBaselineDecimal);
        const schema = buildInputsJsonSchema();
        const definition = schema.$defs.onSiteHabitatBaseline as {
            properties: { area: { anyOf: unknown[] } };
        };
        expect(definition.properties.area.anyOf[0]).toMatchObject({ type: 'number', minimum: 0 });
        expect(definition.properties.area.anyOf[1]).toMatchObject({ type: 'string' });
    });
});

test('trading and shortfalls use exact losses when delivered and baseline number fields match', () => {
    const { features, issues } = bng.featuresFromInput({
        onSiteHedgerowBaselines: [
            { habitatType: 'Native hedgerow', length: 1, condition: 'Poor', strategicSignificance },
        ],
        onSiteHedgerowCreations: [
            {
                habitatType: 'Native hedgerow',
                length: new DecimalJs('0.999999999999999999'),
                condition: 'Poor',
                strategicSignificance,
                habitatCreatedInAdvance: '30+',
            },
        ],
    });
    expect(issues).toEqual([]);
    expect(features.onSiteHedgerowBaselines[0]!.totalHedgerowUnits).toBe(
        features.onSiteHedgerowCreations[0]!.hedgerowUnitsDelivered,
    );
    const trading = bng.tradingSummaries(features);
    const headline = bng.headlineResults(features, trading);
    const shortfall = bng.unitShortfall(features, headline, trading);
    expect(trading.hedgerows.details.low.cumulativeSurplusDecimal.toString()).toBe('-2e-18');
    expect(trading.hedgerows.lowSatisfied).toBeFalse();
    expect(headline.onSiteHedgerowNetChange.unitsDecimal.toString()).toBe('-2e-18');
    expect(shortfall.tierShortfalls.hedgerows.shortfallDecimal.toString()).toBe('0.200000000000000002');
    expect(shortfall.tierShortfalls.hedgerows.srmShortfallDecimal.toString()).toBe('0.400000000000000004');
});

test('combined intertidal trading splits its exact balance before the Medium cascade', () => {
    const { features, issues } = bng.featuresFromInput({
        onSiteHabitatBaselines: [
            {
                broadHabitat: 'Intertidal sediment',
                habitatType: 'Littoral sand',
                area: 1,
                condition: 'Poor',
                irreplaceableHabitat: false,
                strategicSignificance,
            },
        ],
        onSiteHabitatCreations: [
            {
                broadHabitat: 'Intertidal hard structures',
                habitatType:
                    'Artificial hard structures with integrated greening of grey infrastructure (IGGI)',
                area: new DecimalJs('0.999999999999999999'),
                condition: 'Poor',
                strategicSignificance,
                habitatCreationInAdvance: 1,
            },
        ],
    });
    expect(issues).toEqual([]);
    const trading = bng.habitatTradingSummary(features);
    expect(
        bng.cumulativeBroadHabitatChangeDecimal(features, 'Medium')['Intertidal sediment']!.toString(),
    ).toBe('-4e-18');
    expect(trading.details.medium.unitsAvailableToOffsetUpwardsDecimal.toString()).toBe('-4e-18');
    expect(trading.mediumSatisfied).toBeFalse();
});

test('watercourse compensation keeps its Decimal through spatial adjustments and headline deductions', () => {
    const { features, issues } = bng.featuresFromInput({
        offSiteWatercourseBaselines: [
            {
                watercourseType: 'Priority habitat',
                length: new DecimalJs('1.000000000000000001'),
                lengthRetained: 0.5,
                condition: 'Moderate',
                strategicSignificance,
                watercourseEncroachment: 'No Encroachment',
                riparianEncroachment: 'No Encroachment/ No Encroachment',
                bespokeCompensation: 'Yes',
                spatialRiskCategory: waterRisk,
                offSiteReferenceNumber: 'site',
            },
        ],
        offSiteWatercourseCreations: [{ ...allSheets(1).offSiteWatercourseCreations![0]! }],
    });
    expect(issues).toEqual([]);
    expect(features.offSiteWatercourseBaselines[0]!.vhdhBespokeCompensationUnitsDecimal.toString()).toBe(
        '8.000000000000000016',
    );
    const headline = bng.headlineResults(features, bng.tradingSummaries(features));
    expect(headline.offSiteWatercoursePostInterventionDecimal.toString()).toBe('24.000000000000000016');
    expect(headline.offSiteWatercourseNetChange.unitsDecimal.toString()).toBe('8');
    expect(headline.offSiteWatercourseNetChangeWithSRMDecimal.toString()).toBe('6');
    expect(headline.totalSRMDeductions.watercourseDecimal.toString()).toBe('2');
});

test('numeric timing inputs accept Decimals while sentinel timing stays explicit', () => {
    expect(v.parse(bng.yearsSchema, new DecimalJs(5))).toBe(5);
    expect(v.safeParse(bng.yearsSchema, new DecimalJs('5.1')).success).toBeFalse();
    expect(v.safeParse(bng.yearsSchema, new DecimalJs(Infinity)).success).toBeFalse();
    const schema = buildInputsJsonSchema();
    const definition = schema.$defs.onSiteHabitatCreation as {
        properties: { habitatCreationInAdvance: { anyOf: unknown[] } };
    };
    expect(
        (definition.properties.habitatCreationInAdvance.anyOf[0] as { anyOf: unknown[] }).anyOf[0],
    ).toMatchObject({
        type: 'integer',
        minimum: 0,
        maximum: 30,
    });
});

test('missing measurements are malformed while optional retained quantities default to zero', () => {
    const input = allSheets(1).onSiteHabitatBaselines![0]!;
    for (const validate of [true, false]) {
        const { area: omitted, ...withoutArea } = input;
        expect(
            bng.featuresFromInput({ onSiteHabitatBaselines: [withoutArea] } as bng.BngInput, { validate })
                .issues,
        ).toHaveLength(1);
    }
    const { features } = bng.featuresFromInput({ onSiteHabitatBaselines: [input] });
    expect(features.onSiteHabitatBaselines[0]!.baselineUnitsRetainedDecimal.isZero()).toBeTrue();
});

test('numeric strings keep year constraints and explicit timing sentinels', () => {
    for (const value of ['5', '05', '+5.0', '.0', '-0']) {
        expect(v.parse(bng.yearsSchema, value)).toBe(Number(value));
    }
    expect(v.parse(bng.yearsSchema, '30+')).toBe('30+');
    for (const value of ['5.1', '31', '-1', 'NaN', 'Infinity', '1e1', ' 5 ', '']) {
        expect(v.safeParse(bng.yearsSchema, value).success).toBeFalse();
    }
    const input = {
        onSiteHabitatCreations: [
            {
                ...allSheets(measurement).onSiteHabitatCreations![0]!,
                habitatCreationInAdvance: '5',
                habitatCreationDelay: '0',
            },
        ],
    };
    const { features, issues } = bng.featuresFromInput(input);
    expect(issues).toEqual([]);
    expect(features.onSiteHabitatCreations[0]!.habitatCreationInAdvance).toBe(5);
    expect(features.onSiteHabitatCreations[0]!.habitatCreationInAdvanceDecimal.toString()).toBe('5');
});

test('gain-site contributions accept strings without losing a tiny net loss', () => {
    const [result] = bng.calculateOffSiteGainSiteSummary([
        { reference: 'site', baseline: '1.000000000000000001', created: '1' },
    ]);
    expect(result!.netChangeDecimal.toString()).toBe('-1e-18');
    expect(result!.isLoss).toBeTrue();
});

test('JSON Schema string measurements and years follow the runtime validation', () => {
    const definitions = buildInputsJsonSchema().$defs;
    const area = (
        definitions.onSiteHabitatBaseline as { properties: { area: { anyOf: { pattern?: string }[] } } }
    ).properties.area;
    const areaPattern = new RegExp(area.anyOf[1]!.pattern!);
    for (const value of ['0', '00.5', '.5', '+1.25', '-0', '-.0', measurement, '-1', '', '1e-3', ' 1 ']) {
        expect(areaPattern.test(value)).toBe(v.safeParse(bng.areaSchema, value).success);
    }
    const creation = definitions.onSiteHabitatCreation as {
        properties: { habitatCreationInAdvance: { anyOf: { anyOf: { pattern?: string }[] }[] } };
    };
    const yearPattern = new RegExp(creation.properties.habitatCreationInAdvance.anyOf[0]!.anyOf[1]!.pattern!);
    for (const value of [
        '0',
        '5',
        '05',
        '+5.0',
        '30',
        '030.00',
        '.0',
        '-.0',
        '-0',
        '-00.00',
        '-1',
        '31',
        '5.1',
        '1e1',
        '',
        ' 5 ',
    ]) {
        expect(yearPattern.test(value)).toBe(v.safeParse(bng.yearsSchema, value).success);
    }
});

test('quantity helpers accept numeric string operands without treating them as unavailable states', () => {
    const delivered = calculateHedgerowUnitsDelivered({
        length: measurement,
        distinctivenessScore: '2',
        conditionScore: '2',
        strategicSignificanceMultiplier: '1',
        temporalMultiplier: '1',
        difficultyMultiplier: '1',
    });
    expect(delivered.hedgerowUnitsDeliveredDecimal.toString()).toBe('0.493827156493827156');
    expect(bng.calculateOnSiteHabitatNetChange('1', '1.000000000000000001').unitsDecimal.toString()).toBe(
        '1e-18',
    );
});

test('hedgerow timing lookup tables keep their original labels', () => {
    const { features, issues } = bng.featuresFromInput(allSheets(measurement));
    expect(issues).toEqual([]);
    expect(Object.keys(features.onSiteHedgerowEnhancements[0]!.yearsToTargetConditionViaEnhancement)).toEqual(
        Object.keys(bng.data.hedgerows['Native hedgerow'].yearsToTargetConditionViaEnhancement),
    );
});

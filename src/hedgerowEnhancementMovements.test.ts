import { expect, test } from 'bun:test';
import { allHedgerows } from './hedgerows';
import { getHedgerowEnhancementMovement } from './hedgerowEnhancementMovements';

test('uses the G-6 movement axes for every hedgerow pair', () => {
    const labels = Object.keys(allHedgerows) as (keyof typeof allHedgerows)[];

    for (const baseline of labels) {
        for (const proposed of labels) {
            expect(getHedgerowEnhancementMovement(baseline, proposed)).toBeTypeOf('string');
        }
    }
});

test('marks the G7 species-rich to native-with-trees movement as not possible', () => {
    expect(
        getHedgerowEnhancementMovement(
            'Species-rich native hedgerow',
            'Native hedgerow with trees',
        ),
    ).toBe('Error - Enhancement not possible ▲');
});

test('allows the reverse high-distinctiveness upgrade and rejects its reverse', () => {
    expect(
        getHedgerowEnhancementMovement(
            'Species-rich native hedgerow with trees',
            'Species-rich native hedgerow with trees - associated with bank or ditch',
        ),
    ).toBe('High - V.High');

    expect(
        getHedgerowEnhancementMovement(
            'Species-rich native hedgerow with trees - associated with bank or ditch',
            'Species-rich native hedgerow with trees',
        ),
    ).toBe('Error Trading Down ▲');
});

test('keeps trading-down and same-type controls distinct', () => {
    expect(
        getHedgerowEnhancementMovement('Native hedgerow', 'Non-native and ornamental hedgerow'),
    ).toBe('Error Trading Down ▲');
    expect(getHedgerowEnhancementMovement('Native hedgerow', 'Native hedgerow')).toBe('Low - Low');
    expect(
        getHedgerowEnhancementMovement(
            'Non-native and ornamental hedgerow',
            'Non-native and ornamental hedgerow',
        ),
    ).toBe('V.Low - V.Low');
});

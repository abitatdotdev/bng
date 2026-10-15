import { expect, test } from 'bun:test';
import * as v from 'valibot';
import workbook from './hedgerowEnhancementMovementWorkbook.fixture.json';
import { getHedgerowEnhancementMovement } from './hedgerowEnhancementMovements';
import type { HedgerowLabel } from './hedgerows';
import { onSiteHedgerowEnhancementUncheckedSchema } from './onSite/hedgerowEnhancement';
import { offSiteHedgerowEnhancementUncheckedSchema } from './offSite/hedgerowEnhancement';

test('matches all 169 G-6 hedgerow movement cells', () => {
    const matrix = workbook.movementMatrix;
    for (const [row, baseline] of matrix.sources.entries()) {
        for (const [column, proposed] of matrix.targets.entries()) {
            const movement = getHedgerowEnhancementMovement(
                baseline as HedgerowLabel,
                proposed as HedgerowLabel,
            );
            expect(matrix.matrix[row]?.[column]).toBe(movement);
        }
    }
});

for (const example of workbook.cases) {
    test(`matches recalculated Excel availability and delivery: ${example.id}`, () => {
        const row = v.parse(
            example.offSite
                ? offSiteHedgerowEnhancementUncheckedSchema
                : onSiteHedgerowEnhancementUncheckedSchema,
            example.input,
        );
        const excel = example.excel;
        const movement = row.enhancementMovement;
        expect(excel.N12).toBe(movement.message);
        expect(excel.AG12).toBe(row.difficultyMultiplierApplied);
        expect(excel.AD12).toBe(row.standardDifficultyOfEnhancement);

        if (movement.status === 'forbidden') {
            for (const [field, cell] of [
                ['timeToTargetCondition', 'X12'],
                ['standardOrAdjustedTimeToTargetCondition', 'AA12'],
                ['finalTimeToTargetCondition', 'AB12'],
                ['temporalMultiplier', 'AC12'],
                ['appliedDifficultyMultiplier', 'AE12'],
                ['finalDifficultyOfEnhancement', 'AF12'],
            ] as const) {
                expect(excel[cell].toString().toLowerCase()).toBe('check data ⚠');
                expect(movement.unavailableResults[field]).toBe('check-data');
            }
            expect(excel[example.offSite ? 'AK12' : 'AH12']).toBe('');
            expect(movement.unavailableResults.hedgerowUnitsDelivered).toBe('blank');
            expect(row.hedgerowUnitsDelivered).toBe(0);
            expect(row.hedgerowUnitsDeliveredDecimal.isZero()).toBeTrue();
            if ('hedgerowUnitsDeliveredWithSpatialRisk' in row) {
                expect(excel.AJ12).toBe('');
                expect(movement.unavailableResults.hedgerowUnitsDeliveredWithSpatialRisk).toBe('blank');
                expect(movement.unavailableResults.finalTimeToTargetMultiplier).toBe('check-data');
                expect(row.hedgerowUnitsDeliveredWithSpatialRisk).toBe(0);
                expect(row.hedgerowUnitsDeliveredWithSpatialRiskDecimal.isZero()).toBeTrue();
            }
        } else {
            expect(movement.unavailableResults).toEqual({});
            expect(excel.X12).toBe(row.timeToTargetCondition);
            expect(excel.AB12).toBe(row.finalTimeToTargetCondition);
            expect(row.temporalMultiplier).toBe(excel.AC12);
            expect(row.hedgerowUnitsDelivered).toBeCloseTo(
                Number(excel[example.offSite ? 'AK12' : 'AH12']), 10,
            );
            if ('hedgerowUnitsDeliveredWithSpatialRisk' in row) {
                expect(row.hedgerowUnitsDeliveredWithSpatialRisk).toBeCloseTo(Number(excel.AJ12), 10);
            }
        }
    });
}

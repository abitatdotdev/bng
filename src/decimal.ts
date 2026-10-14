import DecimalJs from 'decimal.js';
import * as v from 'valibot';

export type Decimal = DecimalJs;
// Host applications may configure their own Decimal constructor.
export const Decimal = DecimalJs.clone({ precision: 20, rounding: DecimalJs.ROUND_HALF_UP });
export type Quantity = number | Decimal | string;

function isDecimalInstance(value: unknown): value is Decimal {
    try {
        if (!DecimalJs.isDecimal(value)) return false;
        const converted = new Decimal(value);
        return converted.isFinite() && new Decimal(converted.toString()).isFinite();
    } catch {
        return false;
    }
}

const DecimalSchema = v.pipe(
    v.union([
        v.pipe(v.string(), v.decimal('The decimal is badly formatted.')),
        v.number(),
        v.custom<Decimal>(isDecimalInstance, 'Expected a Decimal instance'),
    ]),
    v.transform((s) => (s instanceof DecimalJs ? s : new Decimal(s))),
    v.check((s) => s.isFinite()),
);

export function toDecimal(value: Quantity): Decimal {
    const result = v.parse(DecimalSchema, value);
    return result;
}

export function isFiniteQuantity(value: unknown): value is Quantity {
    try {
        toDecimal(value as Quantity);
        return true;
    } catch {
        return false;
    }
}

export function sumArrDecimal(nums: Quantity[]): Decimal {
    return nums.reduce<Decimal>((acc, n) => acc.plus(toDecimal(n)), new Decimal(0));
}

export function sumArr(nums: Quantity[]): number {
    return sumArrDecimal(nums).toNumber();
}

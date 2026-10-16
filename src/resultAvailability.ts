import { Decimal } from './decimal';

export type UnavailableResult = 'blank' | 'check-data';
export type UnavailableResults<Fields extends string> = Partial<Record<Fields, UnavailableResult>>;

export type NumberKey<T extends object> = {
    [Field in keyof T]-?: [Exclude<T[Field], undefined>] extends [number] ? Field : never;
}[keyof T] & string;

export type DecimalKey<T extends object> = {
    [Field in keyof T]-?: [Exclude<T[Field], undefined>] extends [Decimal] ? Field : never;
}[keyof T] & string;

type DecimalCompanion<T extends object, Field extends NumberKey<T>> = Extract<DecimalKey<T>, `${Field}Decimal`>;

export type ZeroableResultPair<T extends object> = {
    [Field in NumberKey<T>]: readonly [Field, DecimalCompanion<T, Field>];
}[NumberKey<T>];

type PairData<Pairs extends readonly (readonly [string, string])[]> = {
    [Pair in Pairs[number] as Pair[0]]: number;
} & {
    [Pair in Pairs[number] as Pair[1]]: Decimal;
};

export function zeroableResultPairs<T extends object>() {
    return <Pairs extends readonly ZeroableResultPair<T>[]>(pairs: Pairs): Pairs => pairs;
}

export function zeroUnavailableResults<const Pairs extends readonly (readonly [string, string])[]>(fields: Pairs) {
    return function <T extends object, Fields extends string>(
        data: T & PairData<Pairs>,
        unavailableResults: UnavailableResults<Fields>,
    ): T {
        const result = { ...data };
        for (const [field, decimalField] of fields) {
            if (!Object.hasOwn(unavailableResults, field)) continue;
            Object.assign(result, { [field]: 0, [decimalField]: new Decimal(0) });
        }
        return result;
    };
}

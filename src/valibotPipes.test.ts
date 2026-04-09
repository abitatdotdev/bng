import * as v from 'valibot';
import { describe, it, expect } from 'bun:test';
import { fuzzyPicklist } from './valibotPipes';

describe('fuzzyPicklist', () => {
    const schema = fuzzyPicklist(['Foo', 'Bar']);

    it('should work on uppercase', () => {
        const parsed = v.parse(schema, 'FOO');
        expect(parsed).toEqual('Foo');
    });
    it('should work on lowercase', () => {
        const parsed = v.parse(schema, 'bar');
        expect(parsed).toEqual('Bar');
    });
    it('should work on mixed case', () => {
        const parsed = v.parse(schema, 'bAr');
        expect(parsed).toEqual('Bar');
    });
    it('should trim the input', () => {
        const parsed = v.parse(schema, ' foo ');
        expect(parsed).toEqual('Foo');
    });
})

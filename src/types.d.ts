import { BaseSchema, BaseIssue } from 'valibot';

interface CustomMatchers {
    toBeParseableBy(schema: BaseSchema<unknown, unknown, BaseIssue<unknown>>): any;
}

declare module "bun:test" {
    interface Matchers extends CustomMatchers { }
}


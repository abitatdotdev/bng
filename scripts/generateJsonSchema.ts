import * as v from 'valibot';
import { toJsonSchema } from '@valibot/to-json-schema';

import { onSiteHabitatBaselineSchema } from '../src/onSite/habitatBaseline';
import { onSiteHabitatCreationSchema } from '../src/onSite/habitatCreation';
import { onSiteHabitatEnhancementSchema } from '../src/onSite/habitatEnhancement';
import { onSiteHedgerowBaselineSchema } from '../src/onSite/hedgerowBaseline';
import { onSiteHedgerowCreationSchema } from '../src/onSite/hedgerowCreation';
import { onSiteHedgerowEnhancementSchema } from '../src/onSite/hedgerowEnhancement';
import { onSiteWatercourseBaselineSchema } from '../src/onSite/watercourseBaseline';
import { onSiteWatercourseCreationSchema } from '../src/onSite/watercourseCreation';
import { onSiteWatercourseEnhancementSchema } from '../src/onSite/watercourseEnhancement';

import { offSiteHabitatBaselineSchema } from '../src/offSite/habitatBaseline';
import { offSiteHabitatCreationSchema } from '../src/offSite/habitatCreation';
import { offSiteHabitatEnhancementSchema } from '../src/offSite/habitatEnhancement';
import { offSiteHedgerowBaselineSchema } from '../src/offSite/hedgerowBaseline';
import { offSiteHedgerowCreationSchema } from '../src/offSite/hedgerowCreation';
import { offSiteHedgerowEnhancementSchema } from '../src/offSite/hedgerowEnhancement';
import { offSiteWatercourseBaselineSchema } from '../src/offSite/watercourseBaseline';
import { offSiteWatercourseCreationSchema } from '../src/offSite/watercourseCreation';
import { offSiteWatercourseEnhancementSchema } from '../src/offSite/watercourseEnhancement';

const schemas = {
    onSiteHabitatBaseline: onSiteHabitatBaselineSchema,
    onSiteHabitatCreation: onSiteHabitatCreationSchema,
    onSiteHabitatEnhancement: onSiteHabitatEnhancementSchema,
    onSiteHedgerowBaseline: onSiteHedgerowBaselineSchema,
    onSiteHedgerowCreation: onSiteHedgerowCreationSchema,
    onSiteHedgerowEnhancement: onSiteHedgerowEnhancementSchema,
    onSiteWatercourseBaseline: onSiteWatercourseBaselineSchema,
    onSiteWatercourseCreation: onSiteWatercourseCreationSchema,
    onSiteWatercourseEnhancement: onSiteWatercourseEnhancementSchema,
    offSiteHabitatBaseline: offSiteHabitatBaselineSchema,
    offSiteHabitatCreation: offSiteHabitatCreationSchema,
    offSiteHabitatEnhancement: offSiteHabitatEnhancementSchema,
    offSiteHedgerowBaseline: offSiteHedgerowBaselineSchema,
    offSiteHedgerowCreation: offSiteHedgerowCreationSchema,
    offSiteHedgerowEnhancement: offSiteHedgerowEnhancementSchema,
    offSiteWatercourseBaseline: offSiteWatercourseBaselineSchema,
    offSiteWatercourseCreation: offSiteWatercourseCreationSchema,
    offSiteWatercourseEnhancement: offSiteWatercourseEnhancementSchema,
};

const catalog = v.object(schemas);

const jsonSchema = toJsonSchema(catalog, {
    typeMode: 'input',
    errorMode: 'ignore',
    target: 'draft-2020-12',
});

type AnySchema = {
    type?: string;
    options?: readonly string[];
    pipe?: readonly AnySchema[];
    entries?: Record<string, AnySchema>;
    wrapped?: AnySchema;
    default?: unknown;
};

// Find the innermost picklist options reachable from a schema (descends through
// pipes and optional wrappers). Returns null if no picklist is present.
function findPicklistOptions(schema: AnySchema | undefined): readonly string[] | null {
    if (!schema) return null;
    if (schema.type === 'picklist' && schema.options) return schema.options;
    if (schema.type === 'optional' && schema.wrapped) return findPicklistOptions(schema.wrapped);
    if (schema.pipe) {
        for (let i = schema.pipe.length - 1; i >= 0; i--) {
            const found = findPicklistOptions(schema.pipe[i]);
            if (found) return found;
        }
    }
    return null;
}

// Walk a valibot object schema (possibly wrapped in pipes/optionals) and yield
// [propertyName, picklistOptions] for each property whose value is a picklist.
function* picklistPropsOf(
    schema: AnySchema | undefined,
): Generator<[string, readonly string[]]> {
    if (!schema) return;
    if (schema.type === 'object' && schema.entries) {
        for (const [name, entry] of Object.entries(schema.entries)) {
            const opts = findPicklistOptions(entry);
            if (opts) yield [name, opts];
        }
        return;
    }
    if (schema.pipe) {
        for (const item of schema.pipe) yield* picklistPropsOf(item);
    }
}

const defs = (jsonSchema as { properties?: Record<string, { properties?: Record<string, { enum?: readonly string[] }> }> }).properties ?? {};

for (const [name, valibotSchema] of Object.entries(schemas)) {
    const defEntry = defs[name];
    if (!defEntry?.properties) continue;
    for (const [propName, options] of picklistPropsOf(valibotSchema as unknown as AnySchema)) {
        const prop = defEntry.properties[propName];
        if (prop) prop.enum = [...options];
    }
}

const { $schema, properties = {} } = jsonSchema as {
    $schema?: string;
    properties?: Record<string, unknown>;
};

const output = {
    $schema,
    $id: 'https://abitat.dev/schemas/bng/inputs.json',
    title: '@abitat/bng input schemas',
    description: 'Input shapes for every BNG parcel schema. Reference any entry via `#/$defs/<name>`.',
    $defs: properties,
};

await Bun.write(
    'dist/schemas/inputs.json',
    JSON.stringify(output, null, 2) + '\n',
);

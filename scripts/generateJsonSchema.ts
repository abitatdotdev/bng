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

type AnyAction = {
    kind?: string;
    type?: string;
    title?: string;
    description?: string;
    options?: readonly string[];
    pipe?: readonly AnyAction[];
    entries?: Record<string, AnyAction>;
    wrapped?: AnyAction;
};

type PropMeta = {
    enum?: readonly string[];
    title?: string;
    description?: string;
};

// Walk into a schema collecting picklist options and metadata (title/description),
// descending through pipes and optional wrappers.
function collectMeta(schema: AnyAction | undefined, meta: PropMeta = {}): PropMeta {
    if (!schema) return meta;
    if (schema.kind === 'metadata' && schema.type === 'title' && !meta.title) {
        meta.title = schema.title;
    }
    if (schema.kind === 'metadata' && schema.type === 'description' && !meta.description) {
        meta.description = schema.description;
    }
    if (schema.type === 'picklist' && schema.options && !meta.enum) {
        meta.enum = schema.options;
    }
    if (schema.type === 'optional' && schema.wrapped) collectMeta(schema.wrapped, meta);
    if (schema.pipe) for (const item of schema.pipe) collectMeta(item, meta);
    return meta;
}

// Walk a valibot object schema (possibly wrapped in pipes/optionals) and yield
// [propertyName, collectedMetadata] for each property.
function* propsOf(
    schema: AnyAction | undefined,
): Generator<[string, PropMeta]> {
    if (!schema) return;
    if (schema.type === 'object' && schema.entries) {
        for (const [name, entry] of Object.entries(schema.entries)) {
            yield [name, collectMeta(entry)];
        }
        return;
    }
    if (schema.pipe) {
        for (const item of schema.pipe) yield* propsOf(item);
    }
}

const defs = (jsonSchema as { properties?: Record<string, { properties?: Record<string, PropMeta> }> }).properties ?? {};

for (const [name, valibotSchema] of Object.entries(schemas)) {
    const defEntry = defs[name];
    if (!defEntry?.properties) continue;
    for (const [propName, meta] of propsOf(valibotSchema as unknown as AnyAction)) {
        const prop = defEntry.properties[propName];
        if (!prop) continue;
        if (meta.enum && !prop.enum) prop.enum = [...meta.enum];
        if (meta.title && !prop.title) prop.title = meta.title;
        if (meta.description && !prop.description) prop.description = meta.description;
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

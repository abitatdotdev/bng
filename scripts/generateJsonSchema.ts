import * as v from 'valibot';
import { isFiniteQuantity } from '../src/decimal';
import { isValidYearsQuantity } from '../src/schemaUtils';
import { toJsonSchema } from '@valibot/to-json-schema';
import { bngStartPageInputSchema } from '../src/parsers/featuresFromInput';

import pkg from '../package.json' with { type: 'json' };

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

export function buildInputsJsonSchema() {
const schemas = {
    startPage: bngStartPageInputSchema,
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
    overrideAction({ valibotAction, jsonSchema }) {
        if (valibotAction.type === 'check' && 'requirement' in valibotAction && valibotAction.requirement === isValidYearsQuantity) {
            return {
                anyOf: [
                    { type: 'integer', minimum: 0, maximum: 30 },
                    { type: 'string', pattern: /^(?:\+?0*(?:[0-9]|[12][0-9]|30)(?:\.0+)?|[+-]?0*\.0+|-0+(?:\.0+)?)$/.source },
                ],
            };
        }
    },
    overrideSchema({ valibotSchema }) {
        if (valibotSchema.type === 'custom' && 'check' in valibotSchema && valibotSchema.check === isFiniteQuantity) {
            return {
                anyOf: [
                    { type: 'number', minimum: 0 },
                    { type: 'string', pattern: /^(?:\+?(?:\d*\.)?\d+|-0+(?:\.0+)?|-\.0+)$/.source },
                ],
            };
        }
    },
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

type JsonSchemaNode = {
    anyOf?: JsonSchemaNode[];
    description?: string;
    enum?: string[];
    minimum?: number;
    pattern?: string;
    properties?: Record<string, JsonSchemaNode>;
    title?: string;
    type?: string;
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

const defs = (jsonSchema as JsonSchemaNode).properties ?? {};

if (defs.startPage?.properties) {
    // Targets below zero remain valid quantities and trigger the minimum-target rule.
    defs.startPage.properties.netGainTarget = {
        anyOf: [
            { type: 'number' },
            { type: 'string', pattern: /^[+-]?(?:\d*\.)?\d+$/.source },
        ],
    };
}

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

    return {
        $schema,
        $id: 'https://abitatdotdev.github.io/bng/inputs.json',
        title: 'BNG Metric Input Schema',
        description: 'Input shapes for every BNG parcel schema. Reference any entry via `#/$defs/<name>`.',
        version: pkg.version,
        $defs: properties,
    };
}

if (import.meta.main) {
    await Bun.write(
        'dist/schemas/inputs.json',
        JSON.stringify(buildInputsJsonSchema(), null, 2) + '\n',
    );
}

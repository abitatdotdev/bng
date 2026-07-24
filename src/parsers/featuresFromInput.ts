import * as v from 'valibot';
import type { AllFeatures } from '../features';

import { onSiteHabitatBaselineSchema, onSiteHabitatBaselineUncheckedSchema } from '../onSite/habitatBaseline';
import { onSiteHabitatCreationSchema, onSiteHabitatCreationUncheckedSchema } from '../onSite/habitatCreation';
import { onSiteHabitatEnhancementSchema, onSiteHabitatEnhancementUncheckedSchema } from '../onSite/habitatEnhancement';
import { onSiteHedgerowBaselineSchema, onSiteHedgerowBaselineUncheckedSchema } from '../onSite/hedgerowBaseline';
import { onSiteHedgerowCreationSchema, onSiteHedgerowCreationUncheckedSchema } from '../onSite/hedgerowCreation';
import { onSiteHedgerowEnhancementSchema, onSiteHedgerowEnhancementUncheckedSchema } from '../onSite/hedgerowEnhancement';
import { onSiteWatercourseBaselineSchema, onSiteWatercourseBaselineUncheckedSchema } from '../onSite/watercourseBaseline';
import { onSiteWatercourseCreationSchema, onSiteWatercourseCreationUncheckedSchema } from '../onSite/watercourseCreation';
import { onSiteWatercourseEnhancementSchema, onSiteWatercourseEnhancementUncheckedSchema } from '../onSite/watercourseEnhancement';
import { offSiteHabitatBaselineSchema, offSiteHabitatBaselineUncheckedSchema } from '../offSite/habitatBaseline';
import { offSiteHabitatCreationSchema, offSiteHabitatCreationUncheckedSchema } from '../offSite/habitatCreation';
import { offSiteHabitatEnhancementSchema, offSiteHabitatEnhancementUncheckedSchema } from '../offSite/habitatEnhancement';
import { offSiteHedgerowBaselineSchema, offSiteHedgerowBaselineUncheckedSchema } from '../offSite/hedgerowBaseline';
import { offSiteHedgerowCreationSchema, offSiteHedgerowCreationUncheckedSchema } from '../offSite/hedgerowCreation';
import { offSiteHedgerowEnhancementSchema, offSiteHedgerowEnhancementUncheckedSchema } from '../offSite/hedgerowEnhancement';
import { offSiteWatercourseBaselineSchema, offSiteWatercourseBaselineUncheckedSchema } from '../offSite/watercourseBaseline';
import { offSiteWatercourseCreationSchema, offSiteWatercourseCreationUncheckedSchema } from '../offSite/watercourseCreation';
import { offSiteWatercourseEnhancementSchema, offSiteWatercourseEnhancementUncheckedSchema } from '../offSite/watercourseEnhancement';

/**
 * The JSON input contract for {@link featuresFromInput}: one optional array
 * per metric sheet, each element the input shape for that sheet. Mirrors the
 * published input JSON Schema (`inputs.json`) — every key optional, so
 * partial submissions are allowed. Missing keys are treated as empty.
 *
 * Keys are exactly the plural `AllFeatures` keys, so the assembled result
 * *is* an `AllFeatures`. Enhancement rows carry their paired baseline inline
 * under a nested `baseline` field (the schema's `inputSchema` requires it),
 * so this is a flat per-array fan-out — no cross-array baseline threading,
 * unlike `parseFile`'s sheet-pairing in `parseAllEnhancementRows`.
 *
 * Written out explicitly rather than derived from `schemaConfig` so the
 * declaration emit stays serializable (a `typeof schemaConfig` union of 18
 * `as const` valibot schemas overflows tsc's serialization limit — TS7056).
 */
export type BngInput = {
    onSiteHabitatBaselines?: v.InferInput<typeof onSiteHabitatBaselineSchema>[];
    onSiteHabitatCreations?: v.InferInput<typeof onSiteHabitatCreationSchema>[];
    onSiteHabitatEnhancements?: v.InferInput<typeof onSiteHabitatEnhancementSchema>[];
    offSiteHabitatBaselines?: v.InferInput<typeof offSiteHabitatBaselineSchema>[];
    offSiteHabitatCreations?: v.InferInput<typeof offSiteHabitatCreationSchema>[];
    offSiteHabitatEnhancements?: v.InferInput<typeof offSiteHabitatEnhancementSchema>[];
    onSiteHedgerowBaselines?: v.InferInput<typeof onSiteHedgerowBaselineSchema>[];
    onSiteHedgerowCreations?: v.InferInput<typeof onSiteHedgerowCreationSchema>[];
    onSiteHedgerowEnhancements?: v.InferInput<typeof onSiteHedgerowEnhancementSchema>[];
    offSiteHedgerowBaselines?: v.InferInput<typeof offSiteHedgerowBaselineSchema>[];
    offSiteHedgerowCreations?: v.InferInput<typeof offSiteHedgerowCreationSchema>[];
    offSiteHedgerowEnhancements?: v.InferInput<typeof offSiteHedgerowEnhancementSchema>[];
    onSiteWatercourseBaselines?: v.InferInput<typeof onSiteWatercourseBaselineSchema>[];
    onSiteWatercourseCreations?: v.InferInput<typeof onSiteWatercourseCreationSchema>[];
    onSiteWatercourseEnhancements?: v.InferInput<typeof onSiteWatercourseEnhancementSchema>[];
    offSiteWatercourseBaselines?: v.InferInput<typeof offSiteWatercourseBaselineSchema>[];
    offSiteWatercourseCreations?: v.InferInput<typeof offSiteWatercourseCreationSchema>[];
    offSiteWatercourseEnhancements?: v.InferInput<typeof offSiteWatercourseEnhancementSchema>[];
};

/** A `BngInput` / `AllFeatures` array key — one of the 18 metric sheets. */
export type BngInputKey = keyof BngInput;

/**
 * Pairs each sheet key with its checked (business-logic guards on) and
 * unchecked (guards stripped) valibot schema. Internal + explicitly typed so
 * declaration emit doesn't try to serialize the wide `as const` inference.
 */
const schemaConfig: Record<BngInputKey, { checked: v.GenericSchema; unchecked: v.GenericSchema }> = {
    onSiteHabitatBaselines: { checked: onSiteHabitatBaselineSchema, unchecked: onSiteHabitatBaselineUncheckedSchema },
    onSiteHabitatCreations: { checked: onSiteHabitatCreationSchema, unchecked: onSiteHabitatCreationUncheckedSchema },
    onSiteHabitatEnhancements: { checked: onSiteHabitatEnhancementSchema, unchecked: onSiteHabitatEnhancementUncheckedSchema },
    offSiteHabitatBaselines: { checked: offSiteHabitatBaselineSchema, unchecked: offSiteHabitatBaselineUncheckedSchema },
    offSiteHabitatCreations: { checked: offSiteHabitatCreationSchema, unchecked: offSiteHabitatCreationUncheckedSchema },
    offSiteHabitatEnhancements: { checked: offSiteHabitatEnhancementSchema, unchecked: offSiteHabitatEnhancementUncheckedSchema },
    onSiteHedgerowBaselines: { checked: onSiteHedgerowBaselineSchema, unchecked: onSiteHedgerowBaselineUncheckedSchema },
    onSiteHedgerowCreations: { checked: onSiteHedgerowCreationSchema, unchecked: onSiteHedgerowCreationUncheckedSchema },
    onSiteHedgerowEnhancements: { checked: onSiteHedgerowEnhancementSchema, unchecked: onSiteHedgerowEnhancementUncheckedSchema },
    offSiteHedgerowBaselines: { checked: offSiteHedgerowBaselineSchema, unchecked: offSiteHedgerowBaselineUncheckedSchema },
    offSiteHedgerowCreations: { checked: offSiteHedgerowCreationSchema, unchecked: offSiteHedgerowCreationUncheckedSchema },
    offSiteHedgerowEnhancements: { checked: offSiteHedgerowEnhancementSchema, unchecked: offSiteHedgerowEnhancementUncheckedSchema },
    onSiteWatercourseBaselines: { checked: onSiteWatercourseBaselineSchema, unchecked: onSiteWatercourseBaselineUncheckedSchema },
    onSiteWatercourseCreations: { checked: onSiteWatercourseCreationSchema, unchecked: onSiteWatercourseCreationUncheckedSchema },
    onSiteWatercourseEnhancements: { checked: onSiteWatercourseEnhancementSchema, unchecked: onSiteWatercourseEnhancementUncheckedSchema },
    offSiteWatercourseBaselines: { checked: offSiteWatercourseBaselineSchema, unchecked: offSiteWatercourseBaselineUncheckedSchema },
    offSiteWatercourseCreations: { checked: offSiteWatercourseCreationSchema, unchecked: offSiteWatercourseCreationUncheckedSchema },
    offSiteWatercourseEnhancements: { checked: offSiteWatercourseEnhancementSchema, unchecked: offSiteWatercourseEnhancementUncheckedSchema },
};

/** A validation failure for a single input row, located by sheet + index. */
export type InputIssue = {
    /** The `AllFeatures` / `BngInput` key the row came from. */
    sheet: BngInputKey;
    /** Zero-based index of the row within its input array. */
    index: number;
    /** Flattened valibot issues for the row. */
    issues: ReturnType<typeof v.flatten>;
};

export type FeaturesFromInputOptions = {
    /**
     * When `true` (default) every row runs through the checked schema
     * (`v.check` business-logic guards included). When `false`, guards are
     * stripped: rows still parse their input shape and run enrichment +
     * unit-value transforms, so lookup misses yield `undefined` unit values
     * rather than failing. Matches `parseFile`'s `validate` flag.
     */
    validate?: boolean;
};

export type FeaturesFromInputResult = {
    /** The assembled, frozen `AllFeatures` — only successfully parsed rows. */
    features: AllFeatures;
    /** Every row that failed to parse, in input order. Empty on full success. */
    issues: InputIssue[];
};

/**
 * Assemble an `AllFeatures` from plain JSON input — the stateless,
 * serverless counterpart to `parseFile` (which only reads `.xlsm`).
 *
 * Each of the 18 input arrays is run through its matching data-parser
 * schema; successful rows land in the corresponding `AllFeatures` array and
 * failures are collected into `issues` (rather than thrown, as `parseFile`
 * does) so a request/response caller can surface every problem at once.
 *
 * ```ts
 * const { features, issues } = featuresFromInput({
 *   onSiteHabitatBaselines: [{ broadHabitat: 'Grassland', ... }],
 * });
 * const sums = tradingSummaries(features);
 * const headline = headlineResults(features, sums);
 * ```
 */
export function featuresFromInput(
    input: BngInput,
    options: FeaturesFromInputOptions = {},
): FeaturesFromInputResult {
    const validate = options.validate !== false;
    const issues: InputIssue[] = [];

    // Built key-by-key from `schemaConfig`; keys are exactly the `AllFeatures`
    // keys, so the finished record satisfies `AllFeatures`.
    const features = {} as Record<BngInputKey, unknown[]>;

    for (const key of Object.keys(schemaConfig) as BngInputKey[]) {
        const schema = validate ? schemaConfig[key].checked : schemaConfig[key].unchecked;
        const rows = input[key] ?? [];
        const parsed: unknown[] = [];

        rows.forEach((row, index) => {
            const result = v.safeParse(schema as v.GenericSchema, row);
            if (result.success) {
                parsed.push(result.output);
            } else {
                issues.push({ sheet: key, index, issues: v.flatten(result.issues) });
            }
        });

        features[key] = parsed;
    }

    // Freeze to match `parseFile` — downstream calculators cache against a
    // stable object identity and assume the shape doesn't mutate.
    return { features: Object.freeze(features) as unknown as AllFeatures, issues };
}

import { Decimal, toDecimal, type Quantity } from './decimal';
import type { AllFeatures } from './features';
export type OffSiteGainSiteContribution = {
    reference: string;
    baseline?: Quantity;
    baselineDecimal?: Decimal;
    retained?: Quantity;
    retainedDecimal?: Decimal;
    created?: Quantity;
    createdDecimal?: Decimal;
    enhanced?: Quantity;
    enhancedDecimal?: Decimal;
};

export type OffSiteGainSiteResult = {
    reference: string;
    baseline: number;
    baselineDecimal: Decimal;
    retained: number;
    retainedDecimal: Decimal;
    created: number;
    createdDecimal: Decimal;
    enhanced: number;
    enhancedDecimal: Decimal;
    netChange: number;
    netChangeDecimal: Decimal;
    isLoss: boolean;
};

const amount = (value: Quantity | undefined) => toDecimal(value === undefined ? 0 : value);

function criteriaPattern(criteria: string): RegExp | null {
    let pattern = '^';
    let hasWildcard = false;
    let hasEscapedWildcard = false;
    for (let index = 0; index < criteria.length; index += 1) {
        const character = criteria[index]!;
        if (character === '~' && index + 1 < criteria.length && ['*', '?'].includes(criteria[index + 1]!)) {
            pattern += criteria[++index]!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            hasEscapedWildcard = true;
        } else if (character === '*') {
            pattern += '.*';
            hasWildcard = true;
        } else if (character === '?') {
            pattern += '.';
            hasWildcard = true;
        } else {
            pattern += character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }
    return hasWildcard || hasEscapedWildcard ? new RegExp(`${pattern}$`, 'i') : null;
}

function numericReference(reference: string): number | undefined {
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(reference)) return undefined;
    const number = Number(reference);
    return Number.isFinite(number) ? number : undefined;
}

function matchesCriterion(reference: string, criteria: string): boolean {
    const operator = /^(>=|<=|<>|=|>|<)(.*)$/.exec(criteria);
    if (operator) {
        const [, symbol, operand] = operator;
        const pattern = criteriaPattern(operand!);
        if (pattern && (symbol === '=' || symbol === '<>')) {
            const matches = pattern.test(reference);
            return symbol === '=' ? matches : !matches;
        }
        const numericOperand = numericReference(operand!);
        if (numericOperand !== undefined) {
            if (symbol === '=') return numericReference(reference) === numericOperand;
            if (symbol === '<>') return true;
            return false;
        }
        if (operand === '') return symbol === '<>';
        const comparison = reference.toLocaleLowerCase('en-GB').localeCompare(operand!.toLocaleLowerCase('en-GB'), 'en-GB');
        switch (symbol) {
            case '=': return comparison === 0;
            case '<>': return comparison !== 0;
            case '>': return comparison > 0;
            case '>=': return comparison >= 0;
            case '<': return comparison < 0;
            case '<=': return comparison <= 0;
        }
    }

    const pattern = criteriaPattern(criteria);
    if (pattern) return pattern.test(reference);
    const numericCriteria = numericReference(criteria);
    if (numericCriteria !== undefined) return numericReference(reference) === numericCriteria;
    return reference.toLocaleLowerCase('en-GB') === criteria.toLocaleLowerCase('en-GB');
}

function nonEmptyReference(reference: string): boolean {
    return reference !== '';
}

function uniqueReferences(contributions: OffSiteGainSiteContribution[]): string[] {
    const seen = new Set<string>();
    const references: string[] = [];
    for (const { reference } of contributions) {
        if (!nonEmptyReference(reference)) continue;
        const key = reference.toLocaleLowerCase('en-GB');
        if (seen.has(key)) continue;
        seen.add(key);
        references.push(reference);
    }
    return references;
}

/** Groups off-site metric contributions by gain-site reference and identifies losses. */
export function calculateOffSiteGainSiteSummary(
    contributions: OffSiteGainSiteContribution[],
): OffSiteGainSiteResult[] {
    return uniqueReferences(contributions).map((reference) => {
        const group = contributions.reduce(
            (totals, contribution) => {
                if (!matchesCriterion(contribution.reference, reference)) return totals;
                totals.baseline = totals.baseline.plus(amount(contribution.baselineDecimal ?? contribution.baseline));
                totals.retained = totals.retained.plus(amount(contribution.retainedDecimal ?? contribution.retained));
                totals.created = totals.created.plus(amount(contribution.createdDecimal ?? contribution.created));
                totals.enhanced = totals.enhanced.plus(amount(contribution.enhancedDecimal ?? contribution.enhanced));
                return totals;
            },
            {
                baseline: new Decimal(0),
                retained: new Decimal(0),
                created: new Decimal(0),
                enhanced: new Decimal(0),
            },
        );
        const netChange = group.retained.plus(group.created).plus(group.enhanced).minus(group.baseline);
        const hasBalance =
            !group.baseline.isZero() ||
            !group.retained.isZero() ||
            !group.created.isZero() ||
            !group.enhanced.isZero();
        return {
            reference,
            baseline: group.baseline.toNumber(),
            baselineDecimal: group.baseline,
            retained: group.retained.toNumber(),
            retainedDecimal: group.retained,
            created: group.created.toNumber(),
            createdDecimal: group.created,
            enhanced: group.enhanced.toNumber(),
            enhancedDecimal: group.enhanced,
            netChange: netChange.toNumber(),
            netChangeDecimal: netChange,
            isLoss: hasBalance && netChange.isNegative(),
        };
    });
}

function decimalField(row: Record<string, unknown>, field: string): Decimal {
    const value = row[field];
    if (Decimal.isDecimal(value) && value.isFinite()) return value;
    const numeric = row[field.replace(/Decimal$/, '')];
    return typeof numeric === 'number' && Number.isFinite(numeric) ? new Decimal(numeric) : new Decimal(0);
}

function referenceField(row: Record<string, unknown>): string {
    const value = row.offSiteReferenceNumber;
    if (typeof value === 'string' && value !== '') return value;
    const baseline = row.baseline as Record<string, unknown> | undefined;
    const baselineReference = baseline?.offSiteReferenceNumber;
    return typeof baselineReference === 'string' ? baselineReference : typeof value === 'string' ? value : '';
}

function baselineContributions(
    baselineRows: Record<string, unknown>[],
    unitField: string,
    retainedField: string,
): OffSiteGainSiteContribution[] {
    return baselineRows.map((row) => ({
        reference: referenceField(row),
        baseline: decimalField(row, unitField),
        retained: decimalField(row, retainedField),
    }));
}

function deliveredContributions(
    deliveredRows: Record<string, unknown>[],
    unitField: string,
    kind: 'created' | 'enhanced',
): OffSiteGainSiteContribution[] {
    return deliveredRows.map((row) => ({
        reference: referenceField(row),
        [kind]: decimalField(row, unitField),
    }));
}

/** Builds the three workbook gain-site summaries from their source sheets. */
export function calculateOffSiteGainSiteSummaries(features: AllFeatures) {
    const habitat = [
        ...baselineContributions(
            features.offSiteHabitatBaselines as unknown as Record<string, unknown>[],
            'totalHabitatUnitsDecimal',
            'baselineUnitsRetainedDecimal',
        ),
        ...deliveredContributions(
            features.offSiteHabitatCreations as unknown as Record<string, unknown>[],
            'habitatUnitsDeliveredDecimal',
            'created',
        ),
        ...deliveredContributions(
            features.offSiteHabitatEnhancements as unknown as Record<string, unknown>[],
            'habitatUnitsDeliveredDecimal',
            'enhanced',
        ),
    ];
    const hedgerow = [
        ...baselineContributions(
            features.offSiteHedgerowBaselines as unknown as Record<string, unknown>[],
            'totalHedgerowUnitsDecimal',
            'unitsRetainedDecimal',
        ),
        ...deliveredContributions(
            features.offSiteHedgerowCreations as unknown as Record<string, unknown>[],
            'hedgerowUnitsDeliveredDecimal',
            'created',
        ),
        ...deliveredContributions(
            features.offSiteHedgerowEnhancements as unknown as Record<string, unknown>[],
            'hedgerowUnitsDeliveredDecimal',
            'enhanced',
        ),
    ];
    const watercourse = [
        ...baselineContributions(
            features.offSiteWatercourseBaselines as unknown as Record<string, unknown>[],
            'totalWatercourseUnitsDecimal',
            'unitsRetainedDecimal',
        ),
        ...deliveredContributions(
            features.offSiteWatercourseCreations as unknown as Record<string, unknown>[],
            'unitsDeliveredDecimal',
            'created',
        ),
        ...deliveredContributions(
            features.offSiteWatercourseEnhancements as unknown as Record<string, unknown>[],
            'watercourseUnitsDeliveredDecimal',
            'enhanced',
        ),
    ];
    return {
        habitat: calculateOffSiteGainSiteSummary(habitat),
        hedgerow: calculateOffSiteGainSiteSummary(hedgerow),
        watercourse: calculateOffSiteGainSiteSummary(watercourse),
    };
}

/** Returns true when any gain site with a non-zero balance has a net unit loss. */
export function hasOffSiteGainSiteLoss(results: Pick<OffSiteGainSiteResult, 'isLoss'>[]): boolean {
    return results.some(({ isLoss }) => isLoss);
}

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

type ReferencedRow = {
    offSiteReferenceNumber?: string;
    baseline?: { offSiteReferenceNumber?: string };
};

const amount = (value: Quantity | undefined): Decimal => toDecimal(value ?? 0);

function criteriaPattern(criteria: string): RegExp | undefined {
    let pattern = '^';
    let hasWildcard = false;
    let hasEscapedWildcard = false;
    for (let index = 0; index < criteria.length; index += 1) {
        const character = criteria[index]!;
        const nextCharacter = criteria[index + 1];
        if (character === '~' && nextCharacter && ['*', '?'].includes(nextCharacter)) {
            pattern += nextCharacter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            index += 1;
            hasEscapedWildcard = true;
            continue;
        }
        if (character === '*') {
            pattern += '.*';
            hasWildcard = true;
            continue;
        }
        if (character === '?') {
            pattern += '.';
            hasWildcard = true;
            continue;
        }
        pattern += character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    if (!hasWildcard && !hasEscapedWildcard) return undefined;
    return new RegExp(`${pattern}$`, 'i');
}

function numericReference(reference: string): number | undefined {
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(reference)) return undefined;
    const number = Number(reference);
    return Number.isFinite(number) ? number : undefined;
}

function matchesOperator(reference: string, symbol: string, operand: string): boolean | undefined {
    const pattern = criteriaPattern(operand);
    if (pattern && (symbol === '=' || symbol === '<>')) {
        const matches = pattern.test(reference);
        return symbol === '=' ? matches : !matches;
    }

    const numericOperand = numericReference(operand);
    if (numericOperand !== undefined) {
        if (symbol === '=') return numericReference(reference) === numericOperand;
        if (symbol === '<>') return true;
        return false;
    }
    if (operand === '') return symbol === '<>';

    const comparison = reference.toLocaleLowerCase('en-GB').localeCompare(operand.toLocaleLowerCase('en-GB'), 'en-GB');
    switch (symbol) {
        case '=': return comparison === 0;
        case '<>': return comparison !== 0;
        case '>': return comparison > 0;
        case '>=': return comparison >= 0;
        case '<': return comparison < 0;
        case '<=': return comparison <= 0;
        default: return undefined;
    }
}

function matchesCriterion(reference: string, criteria: string): boolean {
    const operator = /^(>=|<=|<>|=|>|<)(.*)$/.exec(criteria);
    if (operator) return matchesOperator(reference, operator[1]!, operator[2]!) ?? false;

    const pattern = criteriaPattern(criteria);
    if (pattern) return pattern.test(reference);
    const numericCriteria = numericReference(criteria);
    if (numericCriteria !== undefined) return numericReference(reference) === numericCriteria;
    return reference.toLocaleLowerCase('en-GB') === criteria.toLocaleLowerCase('en-GB');
}

function referenceOf(row: ReferencedRow): string {
    const directReference = row.offSiteReferenceNumber;
    if (directReference) return directReference;
    return row.baseline?.offSiteReferenceNumber ?? directReference ?? '';
}

function uniqueReferences(contributions: readonly OffSiteGainSiteContribution[]): string[] {
    const seen = new Set<string>();
    const references: string[] = [];
    for (const { reference } of contributions) {
        if (reference === '') continue;
        const key = reference.toLocaleLowerCase('en-GB');
        if (seen.has(key)) continue;
        seen.add(key);
        references.push(reference);
    }
    return references;
}

function sumContributionGroup(
    contributions: readonly OffSiteGainSiteContribution[],
    reference: string,
) {
    const totals = {
        baseline: new Decimal(0),
        retained: new Decimal(0),
        created: new Decimal(0),
        enhanced: new Decimal(0),
    };
    for (const contribution of contributions) {
        if (!matchesCriterion(contribution.reference, reference)) continue;
        totals.baseline = totals.baseline.plus(amount(contribution.baselineDecimal ?? contribution.baseline));
        totals.retained = totals.retained.plus(amount(contribution.retainedDecimal ?? contribution.retained));
        totals.created = totals.created.plus(amount(contribution.createdDecimal ?? contribution.created));
        totals.enhanced = totals.enhanced.plus(amount(contribution.enhancedDecimal ?? contribution.enhanced));
    }
    return totals;
}

function makeGainSiteResult(reference: string, contributions: readonly OffSiteGainSiteContribution[]): OffSiteGainSiteResult {
    const group = sumContributionGroup(contributions, reference);
    const netChange = group.retained.plus(group.created).plus(group.enhanced).minus(group.baseline);
    const hasBalance = Object.values(group).some((value) => !value.isZero());
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
}

/** Groups off-site metric contributions by gain-site reference and identifies losses. */
export function calculateOffSiteGainSiteSummary(
    contributions: OffSiteGainSiteContribution[],
): OffSiteGainSiteResult[] {
    return uniqueReferences(contributions).map((reference) => makeGainSiteResult(reference, contributions));
}

function baselineContribution(reference: string, baseline: Quantity, retained: Quantity): OffSiteGainSiteContribution {
    return { reference, baseline, retained };
}

function createdContribution(reference: string, created: Quantity): OffSiteGainSiteContribution {
    return { reference, created };
}

function enhancedContribution(reference: string, enhanced: Quantity): OffSiteGainSiteContribution {
    return { reference, enhanced };
}

function habitatContributions(features: AllFeatures): OffSiteGainSiteContribution[] {
    const baselines = features.offSiteHabitatBaselines.map((row) =>
        baselineContribution(referenceOf(row), row.totalHabitatUnitsDecimal, row.baselineUnitsRetainedDecimal),
    );
    const creations = features.offSiteHabitatCreations.map((row) =>
        createdContribution(referenceOf(row), row.habitatUnitsDeliveredDecimal),
    );
    const enhancements = features.offSiteHabitatEnhancements.map((row) =>
        enhancedContribution(referenceOf(row), row.habitatUnitsDeliveredDecimal),
    );
    return [...baselines, ...creations, ...enhancements];
}

function hedgerowContributions(features: AllFeatures): OffSiteGainSiteContribution[] {
    const baselines = features.offSiteHedgerowBaselines.map((row) =>
        baselineContribution(referenceOf(row), row.totalHedgerowUnitsDecimal, row.unitsRetainedDecimal),
    );
    const creations = features.offSiteHedgerowCreations.map((row) =>
        createdContribution(referenceOf(row), row.hedgerowUnitsDeliveredDecimal),
    );
    const enhancements = features.offSiteHedgerowEnhancements.map((row) =>
        enhancedContribution(referenceOf(row), row.hedgerowUnitsDeliveredDecimal),
    );
    return [...baselines, ...creations, ...enhancements];
}

function watercourseContributions(features: AllFeatures): OffSiteGainSiteContribution[] {
    const baselines = features.offSiteWatercourseBaselines.map((row) =>
        baselineContribution(referenceOf(row), row.totalWatercourseUnitsDecimal, row.unitsRetainedDecimal),
    );
    const creations = features.offSiteWatercourseCreations.map((row) =>
        createdContribution(referenceOf(row), row.unitsDeliveredDecimal),
    );
    const enhancements = features.offSiteWatercourseEnhancements.map((row) =>
        enhancedContribution(referenceOf(row), row.watercourseUnitsDeliveredDecimal),
    );
    return [...baselines, ...creations, ...enhancements];
}

/** Builds the three workbook gain-site summaries from their source sheets. */
export function calculateOffSiteGainSiteSummaries(features: AllFeatures) {
    return {
        habitat: calculateOffSiteGainSiteSummary(habitatContributions(features)),
        hedgerow: calculateOffSiteGainSiteSummary(hedgerowContributions(features)),
        watercourse: calculateOffSiteGainSiteSummary(watercourseContributions(features)),
    };
}

/** Returns true when any gain site with a non-zero balance has a net unit loss. */
export function hasOffSiteGainSiteLoss(results: Pick<OffSiteGainSiteResult, 'isLoss'>[]): boolean {
    return results.some(({ isLoss }) => isLoss);
}

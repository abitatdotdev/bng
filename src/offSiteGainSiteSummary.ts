import { Decimal, toDecimal, type Quantity } from './decimal';
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

/** Groups off-site metric contributions by gain-site reference and identifies losses. */
export function calculateOffSiteGainSiteSummary(
    contributions: OffSiteGainSiteContribution[],
): OffSiteGainSiteResult[] {
    const groups = new Map<
        string,
        {
            baseline: Decimal;
            retained: Decimal;
            created: Decimal;
            enhanced: Decimal;
        }
    >();

    for (const contribution of contributions) {
        const reference = contribution.reference.trim();
        if (!reference) continue;

        const group = groups.get(reference) ?? {
            baseline: new Decimal(0),
            retained: new Decimal(0),
            created: new Decimal(0),
            enhanced: new Decimal(0),
        };
        group.baseline = group.baseline.plus(amount(contribution.baselineDecimal ?? contribution.baseline));
        group.retained = group.retained.plus(amount(contribution.retainedDecimal ?? contribution.retained));
        group.created = group.created.plus(amount(contribution.createdDecimal ?? contribution.created));
        group.enhanced = group.enhanced.plus(amount(contribution.enhancedDecimal ?? contribution.enhanced));
        groups.set(reference, group);
    }

    return [...groups].map(([reference, group]) => {
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

/** Returns true when any gain site with a non-zero balance has a net unit loss. */
export function hasOffSiteGainSiteLoss(results: Pick<OffSiteGainSiteResult, 'isLoss'>[]): boolean {
    return results.some(({ isLoss }) => isLoss);
}

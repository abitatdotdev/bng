import Decimal from 'decimal.js';

export type OffSiteGainSiteContribution = {
    reference: string;
    baseline?: number;
    retained?: number;
    created?: number;
    enhanced?: number;
};

export type OffSiteGainSiteResult = {
    reference: string;
    baseline: number;
    retained: number;
    created: number;
    enhanced: number;
    netChange: number;
    isLoss: boolean;
};

const amount = (value: number | undefined) => new Decimal(value ?? 0);

/** Groups off-site metric contributions by gain-site reference and identifies losses. */
export function calculateOffSiteGainSiteSummary(
    contributions: OffSiteGainSiteContribution[],
): OffSiteGainSiteResult[] {
    const groups = new Map<string, {
        baseline: Decimal;
        retained: Decimal;
        created: Decimal;
        enhanced: Decimal;
    }>();

    for (const contribution of contributions) {
        const reference = contribution.reference.trim();
        if (!reference) continue;

        const group = groups.get(reference) ?? {
            baseline: new Decimal(0),
            retained: new Decimal(0),
            created: new Decimal(0),
            enhanced: new Decimal(0),
        };
        group.baseline = group.baseline.plus(amount(contribution.baseline));
        group.retained = group.retained.plus(amount(contribution.retained));
        group.created = group.created.plus(amount(contribution.created));
        group.enhanced = group.enhanced.plus(amount(contribution.enhanced));
        groups.set(reference, group);
    }

    return [...groups].map(([reference, group]) => {
        const netChange = group.retained.plus(group.created).plus(group.enhanced).minus(group.baseline);
        const hasBalance = !group.baseline.isZero() || !group.retained.isZero() ||
            !group.created.isZero() || !group.enhanced.isZero();
        return {
            reference,
            baseline: group.baseline.toNumber(),
            retained: group.retained.toNumber(),
            created: group.created.toNumber(),
            enhanced: group.enhanced.toNumber(),
            netChange: netChange.toNumber(),
            isLoss: hasBalance && netChange.isNegative(),
        };
    });
}

/** Returns true when any gain site with a non-zero balance has a net unit loss. */
export function hasOffSiteGainSiteLoss(results: OffSiteGainSiteResult[]): boolean {
    return results.some(({ isLoss }) => isLoss);
}

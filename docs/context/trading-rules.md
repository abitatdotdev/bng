# Trading Rules

How distinctiveness tiers interact in `src/tradingSummaries/`, and how to read the `unitsAvailableToOffset{Upwards,Downwards}` naming without getting it confused with the tier hierarchy.

## Tier cascade (between tiers)

Surpluses flow **downwards** through the distinctiveness hierarchy (V.High → High → Medium → Low). Deficits never flow upwards.

- **V.High** losses cannot be offset by any other tier — they require bespoke or like-for-like compensation. `vHighSatisfied` is true only when V.High net losses are ≥ 0 on their own.
- **High** losses cannot be offset by V.High surplus either. `highSatisfied` looks only at High's own `remainingLosses`.
- **Medium** losses *can* draw on V.High and High surpluses (their `unitsAvailableToOffsetDownwards`).
- **Low** losses can draw on Medium's `cumulativeSurplus`, which has already cascaded V.High and High surpluses into it.

Medium has an extra wrinkle: it is netted **per broad habitat** first. A medium surplus in one broad habitat offsets a medium deficit in the *same* broad habitat, but medium surpluses do **not** cross broad-habitat boundaries within the tier.

## "Upwards" / "Downwards" (within a tier)

The naming mirrors the spreadsheet's column labels and is about the **sign of the net change**, not movement between tiers. Picture each habitat row as a ledger entry:

- A **positive** change (surplus) pushes the running total *up*.
- A **negative** change (deficit) pulls it *down*.

So:

- `unitsAvailableToOffsetDownwards` = the positive contributions — units available to push a deficit back *up toward zero* (i.e. to offset a downward pull).
- `unitsAvailableToOffsetUpwards` = the negative contributions — losses still pulling the total *down*, which need to be offset *upward*.

Read it as "what direction does this value need to be pushed to reach satisfaction", not "which tier does it flow between". The cross-tier cascade described above is a separate concept layered on top: once each tier's downward-offset capacity (its surplus) and upward-offset need (its deficit) are summed, the trading rules let higher-tier surplus be applied against lower-tier deficit.

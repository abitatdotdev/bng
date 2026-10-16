import { Decimal } from './decimal';
import { applyWatercourseBaselineAvailability } from './linearRuleAvailability';

const validBaseline = {
    watercourseType: 'Ditches' as const,
    condition: 'Moderate' as const,
    watercourseEncroachment: 'No Encroachment' as const,
    riparianEncroachment: 'No Encroachment/ No Encroachment' as const,
    length: 1,
    lengthRetained: 0,
    lengthEnhanced: 0,
    lengthLost: 1,
    lengthLostDecimal: new Decimal(1),
    totalWatercourseUnits: 10,
    totalWatercourseUnitsDecimal: new Decimal(10),
    unitsRetained: 0,
    unitsRetainedDecimal: new Decimal(0),
    unitsEnhanced: 0,
    unitsEnhancedDecimal: new Decimal(0),
    unitsLost: 10,
    unitsLostDecimal: new Decimal(10),
    vhdhBespokeCompensationUnits: 0,
    vhdhBespokeCompensationUnitsDecimal: new Decimal(0),
};

function domainFieldsRejectUnknownValues() {
    // @ts-expect-error Watercourse type comes from the metric domain.
    applyWatercourseBaselineAvailability({ ...validBaseline, watercourseType: 'Bog' });
    // @ts-expect-error Condition comes from the metric domain.
    applyWatercourseBaselineAvailability({ ...validBaseline, condition: 'Excellent' });
    // @ts-expect-error Encroachment comes from the metric domain.
    applyWatercourseBaselineAvailability({ ...validBaseline, watercourseEncroachment: 'Severe' });
}

void domainFieldsRejectUnknownValues;

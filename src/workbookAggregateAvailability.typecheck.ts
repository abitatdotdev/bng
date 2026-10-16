import type { WorkbookTotalField } from './workbookAggregateAvailability';

const hedgerowTotal: WorkbookTotalField<'E-1'> = 'unitsRetainedWithSRM';
const habitatTotal: WorkbookTotalField<'A-1'> = 'totalHabitatUnits';

// @ts-expect-error E-1 totals cannot select fields from other workbook sheets.
const wrongSheetTotal: WorkbookTotalField<'E-1'> = 'totalHabitatUnits';
// @ts-expect-error E-1 exposes the real retained SRM companion field name.
const wrongE1Field: WorkbookTotalField<'E-1'> = 'baselineUnitsRetainedWithSRM';

void hedgerowTotal;
void habitatTotal;
void wrongSheetTotal;
void wrongE1Field;

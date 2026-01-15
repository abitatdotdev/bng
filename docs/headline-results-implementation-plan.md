# Plan: Implement "Headline Results" Sheet

## Overview
The "Headline Results" sheet is an aggregation/summary sheet that consolidates data from all input sheets (A-1/2/3, B-1/2/3, C-1/2/3, D-1/2/3, E-1/2/3, F-1/2/3) to calculate final biodiversity net gain metrics.

## Key Findings from Research

### Excel Sheet Structure
The Headline Results sheet contains these main sections:
1. **On-site Baseline** - Total habitat units before intervention
2. **On-site Post-Intervention** - Units after retention/creation/enhancement
3. **On-site Net Change** - Units and percentage change
4. **Off-site Baseline** - Off-site starting habitat value
5. **Off-site Post-Intervention** - Off-site units after interventions
6. **Off-site Net Change** - Off-site units and percentage change
7. **Off-site Unit Change with SRM** - Off-site gains adjusted by Spatial Risk Multiplier
8. **Combined Net Unit Change** - Total of all on-site and off-site changes
9. **SRM Deductions** - Spatial Risk Multiplier adjustments
10. **Final Total Net Unit Change** - Final summary metric

### Data Sources
The sheet aggregates from:
- **Habitats**: A-1/2/3 (on-site), D-1/2/3 (off-site)
- **Hedgerows**: B-1/2/3 (on-site), E-1/2/3 (off-site)
- **Watercourses**: C-1/2/3 (on-site), F-1/2/3 (off-site)

### Codebase Patterns
- Uses Valibot schema validation for input data
- Simple calculation functions aggregate results
- No current aggregation sheet implementation exists
- Test pattern: unit tests with fixtures + Excel comparison tests

## Implementation Approach

**Simple Function-Based Calculations**
Instead of using Valibot pipeline transforms, this implementation uses simple calculation functions:
- Input schema validates the structure of arrays
- Pure calculation functions aggregate and compute results
- Main `calculateHeadlineResults()` function orchestrates all calculations

## Implementation Task List

Each task below can be researched and planned individually:

### Task 1: Create Core Data Structure
**File**: `src/headlineResults.ts`
- Define input schema that accepts arrays of all sheet types:
  - `onSiteHabitatBaselines`, `onSiteHabitatCreations`, `onSiteHabitatEnhancements`
  - `offSiteHabitatBaselines`, `offSiteHabitatCreations`, `offSiteHabitatEnhancements`
  - `onSiteHedgerowBaselines`, `onSiteHedgerowCreations`, `onSiteHedgerowEnhancements`
  - `offSiteHedgerowBaselines`, `offSiteHedgerowCreations`, `offSiteHedgerowEnhancements`
  - `onSiteWatercourseBaselines`, `onSiteWatercourseCreations`, `onSiteWatercourseEnhancements`
  - `offSiteWatercourseBaselines`, `offSiteWatercourseCreations`, `offSiteWatercourseEnhancements`
- Use Valibot schema for validation only (no pipeline transforms)

### Task 2: Implement On-Site Habitat Calculations
**File**: `src/headlineResults.ts`
- Create function `calculateOnSiteHabitatBaseline()` - sums baseline habitat units from A-1
- Create function `calculateOnSiteHabitatPostIntervention()` - sums retained/enhanced units from A-1 + created units from A-2 + enhanced units from A-3
- Create function `calculateOnSiteHabitatNetChange()` - calculates net change in units and percentage

### Task 3: Implement Off-Site Habitat Calculations
**File**: `src/headlineResults.ts`
- Create function `calculateOffSiteHabitatBaseline()` - sums baseline habitat units from D-1
- Create function `calculateOffSiteHabitatPostIntervention()` - sums retained/enhanced units from D-1 + created units from D-2 + enhanced units from D-3
- Create function `calculateOffSiteHabitatNetChange()` - calculates net change
- Create function `calculateOffSiteHabitatNetChangeWithSRM()` - applies Spatial Risk Multiplier to off-site gains

### Task 4: Implement On-Site Hedgerow Calculations
**File**: `src/headlineResults.ts`
- Create function `calculateOnSiteHedgerowBaseline()` - sums baseline hedgerow units from B-1
- Create function `calculateOnSiteHedgerowPostIntervention()` - sums from B-1/2/3
- Create function `calculateOnSiteHedgerowNetChange()` - calculates net change

### Task 5: Implement Off-Site Hedgerow Calculations
**File**: `src/headlineResults.ts`
- Create function `calculateOffSiteHedgerowBaseline()` - sums from E-1
- Create function `calculateOffSiteHedgerowPostIntervention()` - sums from E-1/2/3
- Create function `calculateOffSiteHedgerowNetChange()` - calculates net change
- Create function `calculateOffSiteHedgerowNetChangeWithSRM()` - applies SRM

### Task 6: Implement On-Site Watercourse Calculations
**File**: `src/headlineResults.ts`
- Create function `calculateOnSiteWatercourseBaseline()` - sums from C-1
- Create function `calculateOnSiteWatercoursePostIntervention()` - sums from C-1/2/3
- Create function `calculateOnSiteWatercourseNetChange()` - calculates net change

### Task 7: Implement Off-Site Watercourse Calculations
**File**: `src/headlineResults.ts`
- Create function `calculateOffSiteWatercourseBaseline()` - sums from F-1
- Create function `calculateOffSiteWatercoursePostIntervention()` - sums from F-1/2/3
- Create function `calculateOffSiteWatercourseNetChange()` - calculates net change
- Create function `calculateOffSiteWatercourseNetChangeWithSRM()` - applies SRM

### Task 8: Implement Combined Calculations
**File**: `src/headlineResults.ts`
- Create function `calculateCombinedNetUnitChange()` - totals all on-site and off-site net changes
- Create function `calculateTotalSRMDeductions()` - sums all spatial risk multiplier deductions
- Create function `calculateFinalTotalNetUnitChange()` - computes final summary metric with all adjustments

### Task 9: Create Main Calculation Function
**File**: `src/headlineResults.ts`
- Create main `calculateHeadlineResults()` function that:
  - Takes validated input data
  - Calls all calculation functions in order
  - Returns complete headline results object
- Export TypeScript types: `HeadlineResultsInput` and `HeadlineResults`

### Task 10: Create Unit Tests
**File**: `src/headlineResults.test.ts`
- Create fixture function for test data
- Write unit tests for each enrichment function
- Test edge cases (empty arrays, zero values, missing data)
- Follow existing test patterns from other sheets

### Task 11: Create Excel Comparison Test
**File**: `test/headlineResultsComparison.test.ts`
- Load `examples/simple-unlocked.xlsm`
- Read Headline Results sheet data
- Parse all input sheet data (A-1/2/3, B-1/2/3, C-1/2/3, D-1/2/3, E-1/2/3, F-1/2/3)
- Pass to `headlineResultsSchema`
- Compare calculated values against Excel output
- Use existing test helpers from `test/helpers.ts`

### Task 12: Documentation
**File**: `README.md` or `docs/`
- Document the Headline Results implementation
- Explain the aggregation approach
- Provide usage examples

## Critical Files
- `/Users/neverstew/dev/abitat/bng/src/headlineResults.ts` - New file to create
- `/Users/neverstew/dev/abitat/bng/src/headlineResults.test.ts` - New file to create
- `/Users/neverstew/dev/abitat/bng/test/headlineResultsComparison.test.ts` - New file to create
- `/Users/neverstew/dev/abitat/bng/examples/simple-unlocked.xlsm` - Reference Excel file
- `/Users/neverstew/dev/abitat/bng/src/schemaUtils.ts` - Common utilities (may need new aggregation helpers)
- `/Users/neverstew/dev/abitat/bng/test/helpers.ts` - Test utilities

## Verification
After implementation:
1. Run unit tests: `bun test src/headlineResults.test.ts`
2. Run Excel comparison test: `bun test test/headlineResultsComparison.test.ts`
3. Check TypeScript compilation: `tsc --noEmit`
4. Verify all calculated values match Excel output exactly

## Notes
- Each enrichment function should be simple and focused on one calculation
- Follow the existing pattern of non-mutating transforms (spread objects with additions)
- Spatial Risk Multiplier is only applied to off-site gains
- The sheet handles three distinct metric types: habitats (area-based), hedgerows (length-based), and watercourses (length-based)
- Percentage calculations should handle division by zero (baseline = 0)

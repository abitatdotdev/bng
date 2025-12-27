# BNG Calculator - TypeScript Port Documentation

## Overview

This project is a TypeScript port of the **Biodiversity Net Gain (BNG) Calculator**, implementing the **UK Biodiversity Metric 4.1** standard. The calculator is used to assess biodiversity impacts and calculate net gain requirements for development projects in the UK.

The original implementation is an Excel spreadsheet (XLSM format) with 43 interconnected sheets containing input forms, reference data, calculations, and results reporting.

## Spreadsheet Structure

### Total Sheets: 43

The workbook is organized into the following categories:

### Input Sheets (18 sheets)

User-facing data entry sheets organized by habitat type and location:

**Area Habitats:**
- A-1 On-Site Habitat Baseline
- A-2 On-Site Habitat Creation
- A-3 On-Site Habitat Enhancement
- D-1 Off-Site Habitat Baseline
- D-2 Off-Site Habitat Creation
- D-3 Off-Site Habitat Enhancment

**Hedgerows:**
- B-1 On-Site Hedge Baseline
- B-2 On-Site Hedge Creation
- B-3 On-Site Hedge Enhancement
- E-1 Off-Site Hedge Baseline
- E-2 Off-Site Hedge Creation
- E-3 Off-Site Hedge Enhancement

**Watercourses:**
- C-1 On-Site WaterC' Baseline
- C-2 On-Site WaterC' Creation
- C-3 On-Site WaterC' Enhancement
- F-1 Off-Site WaterC' Baseline
- F-2 Off-Site WaterC' Creation
- F-3 Off-Site WaterC Enhancement

### Reference Data Sheets (8 sheets)

Lookup tables and configuration data used throughout calculations:

- **G-1 All Habitats**: Comprehensive habitat classification (UKHab/EUNIS codes, habitat groups, terrestrial/aquatic classification)
- **G-2 Habitat groups**: Habitat grouping and categorization
- **G-3 Multipliers**: Biodiversity unit multipliers for different habitat types
- **G-4 Temporal multipliers**: Time-based multipliers for habitat establishment (baseline, creation, enhancement)
- **G-5 Enhancement Temporal**: Temporal factors specific to enhancement scenarios
- **G-6 Hedgerow Data**: Hedgerow-specific reference data
- **G-7 WaterC' Data**: Watercourse-specific reference data
- **G-8 Condition Look up**: Habitat condition classification and scoring

### Calculation Sheets (2 sheets)

Core calculation logic and intermediate results:

- **Unit shortfall summary**: Summary of biodiversity unit shortfalls across habitat types
- **Unit shortfall calculations**: Detailed calculations for unit shortfalls

### Results Sheets (7 sheets)

Output and reporting sheets:

- **Results**: Main results summary
- **Headline Results**: High-level summary of net gain/loss
- **Detailed Results**: Comprehensive breakdown of calculations
- **Trading Summary Area Habitats**: Trading rules application for area habitats
- **Trading Summary Hedgerows**: Trading rules application for hedgerows
- **Trading Summary WaterC's**: Trading rules application for watercourses
- **Off-site gain site summary**: Summary of off-site compensation areas

### Supporting Sheets (8 sheets)

Navigation, configuration, and documentation:

- **Introduction**: Project overview and instructions
- **Start**: Project configuration and parameters
- **Main Menu**: Navigation hub
- **Irreplaceable Habitats**: Special handling for irreplaceable habitat types
- **Version History**: Change log
- **Phase 1 Translation Tool**: Data conversion utilities
- **Technical Data**: Technical specifications and constants
- **Lists**: Dropdown lists and validation data

## Key Sheet Categories

### Input Sheet Pattern

Each input sheet follows a consistent structure:
- Header with project information (name, map reference)
- Column headers defining data to be entered
- Data rows for individual habitat parcels/features
- Columns include:
  - Habitat type/broad habitat classification
  - Condition group/baseline condition
  - Area (in hectares)
  - Spatial Risk Multiplier (SRM) factors
  - Baseline/creation/enhancement parameters

### Reference Data Pattern

Reference sheets contain lookup tables with:
- Unique identifiers (habitat codes, condition codes)
- Descriptive labels
- Classification hierarchies
- Numeric multipliers and factors
- Cross-reference keys for VLOOKUP/INDEX-MATCH formulas

### Calculation Flow

1. **Input Data**: Users enter habitat information in A-F sheets
2. **Lookups**: Formulas reference G-sheets to retrieve multipliers and factors
3. **Unit Calculation**: Biodiversity units calculated as: Area × Habitat Multiplier × Condition Multiplier × Temporal Multiplier × SRM
4. **Aggregation**: Results aggregated by habitat type and location
5. **Trading Rules**: Applied to enforce trading restrictions between habitat tiers
6. **Net Gain Assessment**: Final net gain/loss calculated against target percentage

## Tier-Based Habitat Classification

Habitats are classified into tiers that affect trading rules:

- **Tier A (A1-A5)**: Area habitats (grasslands, woodlands, wetlands, etc.)
- **Tier H**: Hedgerows
- **Tier W**: Watercourses

**Trading Rules**: Lower tier habitats cannot fully compensate for losses in higher tier habitats. Specific trading ratios apply.

## Key Concepts

### Biodiversity Units (BUs)

The fundamental metric for biodiversity value:
```
BUs = Area (ha) × Habitat Multiplier × Condition Multiplier × Temporal Multiplier × SRM
```

### Habitat Multiplier

Assigned per habitat type, reflecting its biodiversity value. Retrieved from G-3 Multipliers sheet.

### Condition Multiplier

Based on current habitat condition (poor, moderate, good, excellent). Retrieved from G-8 Condition Look up.

### Temporal Multiplier

Reflects time required for habitat establishment:
- **Baseline**: 1.0 (existing habitats)
- **Creation**: 0.0-1.0 (depending on years since creation, typically 0 for year 0, increasing over time)
- **Enhancement**: 0.0-1.0 (depending on years since enhancement)

Retrieved from G-4 and G-5 sheets.

### Spatial Risk Multiplier (SRM)

Adjusts biodiversity value based on location and connectivity:
- Ranges from 0.0 to 1.0
- Lower values for isolated or poor-quality locations
- Higher values for well-connected or strategic locations

### Net Gain Target

Default 10% net gain requirement. Calculated as:
```
Required Gain = Baseline BUs × 0.10
```

## Port Plan: 6 Phases

### Phase 1: Extract Reference Data (with tests)
**Objective**: Extract all reference data from G-sheets into TypeScript data structures with comprehensive validation

**Tasks**:
- Parse G-1 All Habitats into habitat catalog
- Parse G-2 Habitat groups into classification system
- Parse G-3 Multipliers into lookup tables
- Parse G-4 Temporal multipliers into time-based factors
- Parse G-5 Enhancement Temporal into enhancement factors
- Parse G-6 Hedgerow Data into hedgerow specifications
- Parse G-7 WaterC' Data into watercourse specifications
- Parse G-8 Condition Look up into condition scoring system
- Create reference data module with accessor functions

**Tests**:
- Validate reference data integrity (all required fields present)
- Ensure all lookups are complete (no missing codes or mappings)
- Test data access functions (lookup by code, name, tier)
- Verify data consistency across related tables
- Test edge cases (empty values, special characters, numeric precision)
- Compare parsed data against Excel source values

**Deliverable**: TypeScript interfaces, data files, accessor module, and comprehensive test suite for reference data

### Phase 2: Define Core Data Models (with tests)
**Objective**: Create type-safe data structures for all calculation inputs and outputs

**Tasks**:
- Define Habitat interface with properties (code, name, multiplier, tier, type)
- Define HabitatParcel interface for input data (area, condition, habitat type, SRM)
- Define ConditionGroup interface for condition classification
- Define TemporalFactor interface for time-based multipliers
- Define BiodiversityUnits interface for calculation results
- Define TradeableHabitat interface for trading rule enforcement
- Define Project interface for overall project data
- Implement validation methods for each model

**Tests**:
- Model validation tests (required fields, type checking, value ranges)
- Type safety tests (TypeScript compiler verification)
- Serialization/deserialization tests (JSON round-trip)
- Default value tests (ensure sensible defaults)
- Constraint validation tests (SRM ranges 0-1, areas > 0, etc.)
- Invalid data rejection tests (catch malformed input)

**Deliverable**: Complete TypeScript type definitions with validation, comprehensive test suite for model integrity

### Phase 3: Implement Core Calculation Logic (with tests)
**Objective**: Build the fundamental biodiversity unit calculations with rigorous validation

**Tasks**:
- Implement habitat lookup by code/name
- Implement condition multiplier retrieval
- Implement temporal multiplier calculation
- Implement biodiversity unit calculation function: BUs = Area × Habitat Multiplier × Condition Multiplier × Temporal Multiplier × SRM
- Implement area aggregation by habitat type
- Implement baseline vs. creation vs. enhancement distinction
- Implement SRM application and validation

**Tests**:
- Unit tests for each calculation function (isolated function testing)
- Edge case tests (zero areas, minimum/maximum multipliers, SRM boundaries)
- Precision tests (numeric accuracy to Excel decimal places)
- Compare outputs with Excel formulas (validate against simple.xlsm calculations)
- Temporal multiplier tests (verify time-based factor application)
- Aggregation tests (verify correct summation across parcels)
- Baseline vs. creation vs. enhancement tests (verify scenario distinction)

**Deliverable**: `calculator.ts` with core calculation functions and comprehensive unit test suite

### Phase 4: Implement Trading Rules (with tests)
**Objective**: Enforce trading restrictions between habitat tiers with complete validation

**Tasks**:
- Implement tier classification (A1-A5, H, W)
- Implement trading ratio lookup
- Implement trading validation (prevent invalid trades)
- Implement tier-based aggregation
- Implement unit shortfall calculations
- Implement habitat group trading rules
- Implement trading summary generation

**Tests**:
- Trading rule validation tests (verify rules are enforced)
- Tier boundary tests (test transitions between tiers)
- Trading ratio tests (verify correct ratio application)
- Shortfall calculation tests (validate unit deficit calculations)
- Invalid trade rejection tests (prevent non-compliant trades)
- Habitat group trading tests (verify group-specific rules)
- Excel comparison tests (validate against Trading Summary sheets)

**Deliverable**: `trading.ts` with trading rule logic and comprehensive test suite

### Phase 5: Create Main Calculator Class (with tests)
**Objective**: Integrate all components into a cohesive calculator interface with end-to-end validation

**Tasks**:
- Create BNGCalculator class with methods:
  - `loadProject(data)`: Load and validate input data
  - `calculateBaselineUnits()`: Calculate existing habitat value
  - `calculateCreationUnits()`: Calculate new habitat value
  - `calculateEnhancementUnits()`: Calculate enhanced habitat value
  - `calculateNetGain()`: Calculate net gain/loss
  - `validateTrading()`: Verify trading compliance
  - `generateReport()`: Create results summary
- Implement comprehensive error handling and validation
- Add detailed logging for debugging
- Create example usage documentation

**Tests**:
- Integration tests (verify components work together)
- End-to-end tests with sample data from simple.xlsm
- Regression tests (ensure changes don't break existing functionality)
- Error handling tests (verify graceful failure on invalid input)
- State management tests (verify calculator state is correctly maintained)
- API contract tests (verify method signatures and return types)
- Performance tests (ensure calculations complete in acceptable time)

**Deliverable**: `BNGCalculator.ts` class with full API and comprehensive integration test suite

### Phase 6: Documentation & Test Coverage
**Objective**: Ensure >90% code coverage, complete documentation, and validated calculator

**Tasks**:
- Generate code coverage report
- Identify and test uncovered code paths
- Create API documentation (JSDoc comments, markdown guides)
- Create usage examples (runnable code samples)
- Create developer guide (architecture, extending calculator)
- Performance optimization if needed
- Create test coverage documentation

**Tests**:
- Coverage analysis (ensure >90% code coverage)
- Performance tests (benchmark calculation speed)
- Documentation examples as tests (verify code samples work)
- Stress tests (large projects, many parcels)
- Compatibility tests (various input formats and edge cases)
- Final Excel validation (comprehensive comparison with source spreadsheet)

**Deliverable**: Test suite with >90% coverage, complete documentation, performance benchmarks, and validated calculator ready for production

## Key Observations

### Complex Formula Dependencies

The Excel spreadsheet contains extensive cross-sheet references:
- Input sheets reference G-sheets for lookups
- Calculation sheets aggregate data from input sheets
- Results sheets pull from both input and calculation sheets
- Circular reference prevention is critical

### Habitat Classification Complexity

Habitats are classified at multiple levels:
- Broad habitat type (Grassland, Woodland, Wetland, etc.)
- Specific habitat (Lowland meadows, Traditional orchards, etc.)
- UKHab/EUNIS code system for standardization
- Tier system for trading rules (A, H, W)

### Spatial Risk Multiplier Application

SRM is a critical factor that can significantly impact calculations:
- Applied as a multiplier to all biodiversity unit calculations
- Varies by location and habitat connectivity
- Must be captured in input data
- Affects both baseline and creation/enhancement units

### Trading Rule Complexity

Trading rules prevent inappropriate compensation:
- Lower tier habitats cannot fully compensate for higher tier losses
- Specific trading ratios apply between tiers
- Some habitats may be non-tradeable
- Irreplaceable habitats have special handling
- Trading validation must occur before final net gain assessment

### Target Net Gain Percentage

Default 10% net gain requirement:
- Applied to baseline biodiversity units
- May be configurable per project
- Affects feasibility assessment
- Critical for regulatory compliance

### Temporal Factors

Temporal multipliers are crucial for realistic assessment:
- Baseline habitats: multiplier = 1.0
- Creation habitats: multiplier increases over time (0 at year 0, approaching 1.0 at maturity)
- Enhancement habitats: multiplier increases over time
- Time horizons typically 30 years for calculations
- Different habitats have different establishment timelines

## Testing Strategy

### Test-Driven Development (TDD) Approach

This port follows a Test-Driven Development methodology where tests are written before or alongside implementation. This ensures:

1. **Early Validation**: Tests are created based on Excel behavior before TypeScript code is written
2. **Specification by Example**: Test cases serve as executable specifications
3. **Continuous Verification**: Each phase is validated before moving to the next
4. **Regression Prevention**: Test suite catches unintended changes during refactoring

### Testing Principles

**Source of Truth**: The Excel spreadsheet (simple.xlsm) serves as the authoritative reference for correct behavior. All TypeScript implementations are validated against Excel outputs.

**Test Case Extraction**: Test cases are derived from:
- Example data in simple.xlsm
- Edge cases identified in the specification
- Boundary conditions in trading rules and multipliers
- Real-world scenarios from the BNG Metric 4.1 standard

**Test Coverage Goals**:
- Phase 1-5: Minimum 80% code coverage during development
- Phase 6: Achieve >90% code coverage before release
- All calculation functions: 100% coverage
- All trading rules: 100% coverage

**Test Execution**:
- Unit tests run on every code change
- Integration tests validate cross-module interactions
- Regression tests ensure Excel compatibility is maintained
- Performance tests monitor calculation efficiency

### Test Organization

Tests are organized by phase and function:
```
tests/
├── phase1/
│   ├── reference-data.test.ts
│   └── data-integrity.test.ts
├── phase2/
│   ├── models.test.ts
│   └── serialization.test.ts
├── phase3/
│   ├── calculations.test.ts
│   ├── edge-cases.test.ts
│   └── excel-comparison.test.ts
├── phase4/
│   ├── trading-rules.test.ts
│   └── tier-boundaries.test.ts
├── phase5/
│   ├── integration.test.ts
│   ├── end-to-end.test.ts
│   └── regression.test.ts
└── fixtures/
    └── simple-xlsm-test-data.json
```

## Development Notes

### Excel to TypeScript Considerations

1. **Data Extraction**: XLSX library can parse reference data, but formulas are lost
2. **Validation**: Need to implement all Excel validation rules in TypeScript
3. **Precision**: Ensure numeric precision matches Excel calculations
4. **Error Handling**: Excel's IFERROR functions need equivalent TypeScript handling
5. **Performance**: TypeScript should be faster than Excel for large datasets

### Future Enhancements

- Web UI for data entry
- API for integration with other systems
- Batch processing for multiple projects
- Advanced reporting and visualization
- Scenario analysis and sensitivity testing
- Export to standard formats (CSV, PDF, GeoJSON)

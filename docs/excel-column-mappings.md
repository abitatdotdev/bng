# Excel Column Mappings

This document provides a reference for Excel sheet column mappings used in the BNG (Biodiversity Net Gain) metric calculations.

Excel file: `examples/less-simple.xlsm`

## On-Site Habitat Sheets

### A-1 On-Site Habitat Baseline
**Header row:** Row 10 (0-indexed as row 9)
**Data row start:** Row 11 (0-indexed as row 10)

**Input Columns:**
- `D` (3): Habitat Reference Number
- `E` (4): Broad Habitat
- `F` (5): Habitat Type
- `G` (6): Irreplaceable Habitat (Yes/No)
- `H` (7): Area (hectares)
- `K` (10): Condition
- `M` (12): Strategic Significance
- `S` (18): Area Retained (hectares)
- `T` (19): Area Enhanced (hectares)
- `Y` (24): Bespoke Compensation Agreed (Yes/No/Pending)

**Calculated/Output Columns:**
- `J` (9): Distinctiveness Score
- `L` (11): Condition Score
- `O` (14): Strategic Significance Multiplier
- `Q` (16): Total Habitat Units
- `U` (20): Baseline Units (Retained)
- `V` (21): Baseline Units (Enhanced)
- `W` (22): Area Habitat Lost
- `X` (23): Units Lost

### A-2 On-Site Habitat Creation
**Header row:** Row 10 (0-indexed as row 9)
**Data row start:** Row 11 (0-indexed as row 10)

**Input Columns:**
- `B` (1): Habitat Reference Number
- `D` (3): Broad Habitat
- `E` (4): Habitat Type
- `G` (6): Area (hectares)
- `J` (9): Condition
- `L` (11): Strategic Significance
- `P` (15): Habitat Creation in Advance (years)
- `Q` (16): Habitat Creation Delay (years)

**Calculated/Output Columns:**
- `I` (8): Distinctiveness Score
- `K` (10): Condition Score
- `N` (13): Strategic Significance Multiplier
- `O` (14): Standard Time to Target Condition (years)
- `S` (18): Final Time to Target Condition (years)
- `T` (19): Final Time to Target Multiplier
- `X` (23): Difficulty Multiplier Applied
- `Y` (24): Habitat Units Delivered

### A-3 On-Site Habitat Enhancement
**Header rows:** Multiple rows (10-11, 0-indexed as 9-10)
**Data starts:** Row 12 (0-indexed as row 11)

**Linked Baseline Columns:**
Populated automatically.
- `E`-`O` (5-15): Baseline habitat reference

**Input Columns:**
- `Q` (17): Proposed Broad Habitat
- `R` (18): Proposed habitat
- `Y` (24): Condition
- `AA` (26): Strategic signficance
- `AE` (30): Habitat enhanced in advance (years)
- `AF` (31): Delay in starting habitat enhancement (years)
- `AO` (40): User comments
- `AP` (41): Planning authority comments
- `AQ` (42): Habitat reference number

**Calculated/Output Columns:**
- `S` (19): Distinctiveness change
- `T` (20): Condition change
- `U` (21): Area (hectares)
- `V` (22): Distinctiveness
- `X` (23): Score (for distinctiveness)
- `Z` (25): Score (for condition)
- `AB` (27): Strategic signficance (category)
- `AC` (28): Strategic signficance multiplier
- `AD` (29): Standard time to target condition (years)
- `AG` (32): Standard or adjusted time to target condition
- `AH` (33): Final time to target condition (years)
- `AI` (34): Final time to target multiplier
- `AJ` (35): Standard difficulty of enhancement
- `AK` (36): Applied difficulty multiplier
- `AL` (37): Final difficulty of enhancement
- `AM` (38): Difficulty multiplier applied
- `AN` (39): Habitat units delivered

---

## Off-Site Habitat Sheets

### D-1 Off-Site Habitat Baseline
**Header row:** Row 10 (0-indexed as row 9)
**Data row start:** Row 11 (0-indexed as row 10)

**Input Columns:**
- `D` (3): Habitat Reference Number (Ref)
- `E` (4): Broad Habitat
- `F` (5): Habitat Type
- `G` (6): Irreplaceable Habitat (Yes/No)
- `H` (7): Area (hectares)
- `K` (10): Condition
- `M` (12): Strategic Significance
- `R` (17): Spatial Risk Category
- `V` (21): Area Retained (hectares)
- `W` (22): Area Enhanced (hectares)
- `AB` (27): Bespoke Compensation Agreed (Yes/No/Pending)
- `AF` (31): Off-site Reference Number

**Calculated/Output Columns:**
- `J` (9): Distinctiveness Score
- `L` (11): Condition Score
- `O` (14): Strategic Significance Multiplier
- `Q` (16): Total Habitat Units (SRM) - with Spatial Risk Multiplier
- `S` (18): Spatial Risk Multiplier
- `T` (19): Total Habitat Units - without Spatial Risk Multiplier
- `X` (23): Baseline Units (Retained)
- `Y` (24): Baseline Units (Enhanced)
- `Z` (25): Area Habitat Lost
- `AA` (26): Units Lost

**Comments:**
- `AC` (28): User Comments
- `AD` (29): Planning Authority Comments

### D-2 Off-Site Habitat Creation
**Header row:** Row 10 (0-indexed as row 9)
**Data row start:** Row 11 (0-indexed as row 10)

**Input Columns:**
- `B` (1): Habitat Reference Number (Ref)
- `D` (3): Broad Habitat
- `E` (4): Habitat Type
- `G` (6): Area (hectares)
- `J` (9): Condition
- `L` (11): Strategic Significance
- `P` (15): Habitat Created in Advance (years)
- `Q` (16): Delay in Starting Habitat Creation (years)
- `Y` (24): Spatial Risk Category
- `AE` (30): Habitat Reference
- `AF` (31): Off-site Reference
- `AG` (32): Baseline Reference

**Calculated/Output Columns:**
- `I` (8): Distinctiveness Score
- `K` (10): Condition Score
- `N` (13): Strategic Significance Multiplier
- `O` (14): Standard Time to Target Condition (years)
- `S` (18): Final Time to Target Condition (years)
- `T` (19): Final Time to Target Multiplier
- `U` (20): Standard Difficulty of Creation
- `V` (21): Applied Difficulty Multiplier
- `W` (22): Final Difficulty of Creation
- `X` (23): Difficulty Multiplier Applied
- `Z` (25): Spatial Risk Multiplier
- `AA` (26): Habitat Units Delivered (inc. SRM) - with Spatial Risk Multiplier
- `AB` (27): Habitat Units Delivered - without Spatial Risk Multiplier

**Comments:**
- `AC` (28): User Comments
- `AD` (29): Planning Authority Comments

### D-3 Off-Site Habitat Enhancment
**Note:** Actual sheet name in Excel file has a typo

**Header rows:** Multiple rows (10-11, 0-indexed as 9-10)
**Data starts:** Row 12 (0-indexed as row 11)

**Baseline Input Columns (from D-1):**
- `A` (0): Broad Habitat (baseline)
- `B` (1): Habitat (baseline)
- `E` (4): Baseline Reference
- `F` (5): Baseline Habitat
- `G` (6): Total Habitat Area (hectares)
- `I` (8): Baseline Distinctiveness Score
- `K` (10): Baseline Condition Score
- `M` (12): Baseline Strategic Significance Score
- `N` (13): Baseline Habitat Units

**Proposed Habitat Input Columns:**
- `Q` (16): Proposed Broad Habitat
- `R` (17): Proposed Habitat
- `V` (21): Area (hectares) - pre-populated from baseline
- `Y` (24): Condition (proposed)
- `AA` (26): Strategic Significance
- `AE` (30): Habitat Enhanced in Advance (years)
- `AF` (31): Delay in Starting Habitat Enhancement (years)
- `AN` (39): Spatial Risk Category (from baseline)
- `AT` (45): Habitat Reference
- `AU` (46): Off-site Reference

**Calculated/Output Columns:**
- `T` (19): Distinctiveness Change
- `U` (20): Condition Change
- `X` (23): Distinctiveness Score (proposed)
- `Z` (25): Condition Score (proposed)
- `AC` (28): Strategic Significance Multiplier
- `AD` (29): Standard Time to Target Condition (years)
- `AH` (33): Final Time to Target Condition (years)
- `AI` (34): Final Time to Target Multiplier
- `AJ` (35): Difficulty of Enhancement Category
- `AL` (37): Difficulty (final)
- `AM` (38): Difficulty Multiplier Applied
- `AO` (40): Spatial Risk Multiplier
- `AP` (41): Habitat Units Delivered (inc SRM) - with Spatial Risk Multiplier
- `AQ` (42): Habitat Units Delivered - without Spatial Risk Multiplier

**Comments:**
- `AR` (43): User Comments
- `AS` (44): Planning Authority Comments

**Status:** Tests require baseline data linkage (not yet implemented)

---

## Hedgerow Sheets

### B-1 On-Site Hedge Baseline
**Header row:** Row 9 (0-indexed as row 8)
**Data row start:** Row 10 (0-indexed as row 9)

**Input Columns:**
- `B` (1): Ref - Reference/sequence number
- `C` (2): Hedge Number - User-entered hedge identifier
- `D` (3): Habitat Type - Hedge habitat type (links to G-6 Hedgerow Data)
- `E` (4): Length (km) - Hedgerow length in kilometers
- `H` (7): Condition - Uses INDIRECT validation to AL column
- `J` (9): Strategic Significance
- `P` (15): Length Retained (km)
- `Q` (16): Length Enhanced (km)
- `V` (21): User Comments
- `W` (22): Planning Authority Comments
- `X` (23): Habitat Reference Number

**Calculated/Output Columns:**
- `F` (5): Distinctiveness - VLOOKUP from G-6 Hedgerow Data
- `G` (6): Distinctiveness Score - VLOOKUP from G-6 Hedgerow Data
- `I` (8): Condition Score - Lookup from G-1 All Habitats
- `K` (10): Strategic Significance Category - Lookup from G-3 Multipliers
- `L` (11): Strategic Significance Multiplier - Multiplier from G-3 Multipliers
- `N` (13): Total Hedgerow Units - Length × G × I × L
- `R` (17): Units Retained - Length Retained × G × I × L
- `S` (18): Units Enhanced - Length Enhanced × G × I × L
- `T` (19): Length Lost - E - P - Q (with error checking)
- `U` (20): Units Lost - N - R - S (with error checking)
- `AE` (30): Retained Flag - TRUE if P > 0
- `AF` (31): Enhanced Flag - TRUE if Q > 0
- `AH` (33): Line Number - Auto-populated row identifier
- `AJ` (35): Retained - Array formula
- `AK` (36): Enhanced - Array formula
- `AL` (37): Condition Group - INDEX/MATCH from G-6 Hedgerow Data

**Special Features:**
- Uses Length (km) instead of Area (hectares)
- Condition column (H) uses INDIRECT validation based on AL (Condition Group)
- Error checking in columns I, T, and U ("Check data", "Error in lengths")
- Array formulas in columns AJ and AK
- More compact than habitat sheets (38 columns vs 50 for A-1)

---

## Key Differences: On-Site vs Off-Site

### Off-Site Specific Fields

Off-site sheets include additional fields not present in on-site:

1. **Spatial Risk Category** (input)
   - Used to calculate Spatial Risk Multiplier
   - Values: Low, Medium, High

2. **Spatial Risk Multiplier** (calculated)
   - Applied to final habitat unit calculations
   - Creates two outputs: with and without SRM

3. **Additional Reference Fields**
   - Off-site Reference Number
   - Baseline Reference Number (for creation/enhancement)

4. **Dual Habitat Unit Calculations**
   - One value includes Spatial Risk Multiplier (SRM)
   - One value excludes Spatial Risk Multiplier
   - Both are calculated and compared in tests

---

## Notes

- Column indices are 0-based when used in code (Column A = 0, B = 1, etc.)
- Row indices are 0-based when used in code (Row 1 = 0, Row 2 = 1, etc.)
- Header rows typically at row 10 (0-indexed as 9)
- Data rows typically start at row 11 (0-indexed as 10)
- Broad Habitat column is used to identify data rows in `findAllDataRows()` helper
- Empty or header text in Broad Habitat column indicates no data row

# Excel Column Mappings

> **Authoritative source:** `src/parsers/columnMappings.ts`. The TypeScript spec is the source of truth for the columns this library reads and how it validates workbook layout. This document is a human-readable reference only — when it disagrees with the spec, the spec wins. Calculated/output columns documented here are not validated against the spec and may drift; verify against an actual workbook before relying on them.

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
- `T` (19): Distinctiveness change
- `U` (20): Condition change
- `V` (21): Area (hectares)
- `W` (22): Distinctiveness (proposed category)
- `X` (23): Score (for distinctiveness)
- `Y` (24): Condition (proposed category)
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

## Watercourse Sheets

### C-1 On-Site Watercourse Baseline
**Header row:** Row 10 (0-indexed as row 9)
**Data row start:** Row 11 (0-indexed as row 10)

**Input Columns:**
- `C` (2): Ref - Reference/sequence number
- `D` (3): Watercourse type - Type of watercourse (links to G-7 Watercourse Data)
- `E` (4): Length (km) - Watercourse length in kilometers
- `H` (7): Condition - Condition of watercourse (uses INDIRECT validation to AR column)
- `J` (9): Strategic Significance - Strategic significance category
- `M` (12): Watercourse encroachment - Extent of encroachment on watercourse
- `O` (14): Riparian encroachment - Extent of encroachment for both banks
- `U` (20): Length Retained (km)
- `V` (21): Length Enhanced (km)
- `AA` (26): Bespoke Compensation Agreed
- `AB` (27): User Comments
- `AC` (28): Planning Authority Comments
- `AD` (29): Habitat Reference Number

**Calculated/Output Columns:**
- `F` (5): Distinctiveness - VLOOKUP from G-7 Watercourse Data
- `G` (6): Distinctiveness Score - VLOOKUP from G-7 Watercourse Data
- `I` (8): Condition Score - INDEX/MATCH lookup from G-7 Watercourse Data
- `K` (10): Strategic Significance Category - Category label from G-7 Watercourse Data
- `L` (11): Strategic Significance Multiplier - Multiplier from G-7 Watercourse Data
- `N` (13): Watercourse Encroachment Multiplier - VLOOKUP from G-7 Watercourse Data
- `P` (15): Riparian Encroachment Multiplier - VLOOKUP from G-7 Watercourse Data
- `Q` (16): Required Action - Trading rules lookup
- `R` (17): Total Watercourse Units - Length × Distinctiveness Score × Condition Score × Strategic Multiplier × Encroachment multipliers
- `W` (22): Units Retained - Length Retained × G × I × L × encroachment multipliers
- `X` (23): Units Enhanced - Length Enhanced × G × I × L × encroachment multipliers
- `Y` (24): Length Lost - E - U - V (with error checking)
- `Z` (25): Units Lost - R - W - X (with error checking)
- `AR` (43): Condition Group - INDEX/MATCH from G-7 Watercourse Data

**Special Features:**
- Uses Length (km) instead of Area (hectares)
- Condition column (H) uses INDIRECT validation based on AR (Condition Group)
- Error checking in columns for lost length and units
- Main calculation (R) multiplies: Length × Distinctiveness Score × Condition Score × Strategic Significance Multiplier × Watercourse Encroachment Multiplier × Riparian Encroachment Multiplier

### C-2 On-Site Watercourse Creation
**Header rows:** Multiple rows (10-11, 0-indexed as 9-10)
**Data row start:** Row 12 (0-indexed as row 11)

**Input Columns:**
- `B` (1): Ref - Reference/sequence number
- `C` (2): Watercourse type - Type of watercourse (links to G-7 Watercourse Data)
- `D` (3): Length (km) - Watercourse length in kilometers
- `G` (6): Condition - Condition of watercourse (uses INDIRECT validation to AH column)
- `I` (8): Strategic Significance - Strategic significance category
- `M` (12): Habitat created in advance (years)
- `N` (13): Delay in starting habitat creation (years)
- `V` (21): Watercourse encroachment - Extent of encroachment on watercourse
- `X` (23): Riparian encroachment - Extent of encroachment on riparian area
- `AA` (26): User Comments
- `AB` (27): Planning Authority Comments
- `AC` (28): Habitat Reference Number

**Calculated/Output Columns:**
- `E` (4): Distinctiveness - VLOOKUP from G-7 Watercourse Data
- `F` (5): Distinctiveness Score - VLOOKUP from G-7 Watercourse Data
- `H` (7): Condition Score - INDEX/MATCH lookup from G-7 Watercourse Data
- `J` (9): Strategic Significance Value - VLOOKUP from G-7 Watercourse Data
- `K` (10): Strategic Significance Multiplier - Multiplier from G-7 Watercourse Data
- `L` (11): Standard Time to Target Condition (years) - INDEX/MATCH from G-7 Watercourse Data
- `O` (14): Standard or adjusted time to target condition - Status message
- `P` (15): Final time to target condition (years) - Adjusted for advance/delay
- `Q` (16): Final time to target multiplier - Temporal multiplier from G-4
- `R` (17): Standard difficulty of creation - VLOOKUP from G-7 Watercourse Data
- `S` (18): Applied difficulty multiplier - Status message for difficulty adjustment
- `T` (19): Final difficulty of creation - Conditional difficulty selection
- `U` (20): Difficulty multiplier applied - Numeric multiplier from G-3
- `W` (22): Watercourse encroachment multiplier - VLOOKUP from G-7 Watercourse Data
- `Y` (24): Riparian encroachment multiplier - VLOOKUP from G-7 Watercourse Data
- `Z` (25): Watercourse units delivered - Final net unit change
- `AH` (33): Condition Group - INDEX/MATCH from G-7 Watercourse Data

**Special Features:**
- Uses Length (km) instead of Area (hectares) like hedgerow sheets
- Encroachment logic: different multipliers for different levels of watercourse and riparian encroachment
- Culvert watercourses must use "N/A - Culvert" for both encroachment types
- Temporal adjustment logic for habitat created in advance or delayed (0-30+ years)
- Difficulty multiplier logic: special case for ditch in "Fairly Poor" or "Fairly Good" condition created in advance (uses "Low" difficulty)
- Standard difficulty categories: Low (1.0), Medium (1.1), High (1.5), Very High (2.0)
- Encroachment multipliers vary: watercourse range from 0.25-1, riparian range from 0.67-1
- Condition column (G) uses INDIRECT validation based on AH (Condition Group)
- Error checking with status messages: "Not possible ▲", "Spatial Data Missing ⚠", "Check Data ⚠", "Check details" messages
- Main calculation (Z) multiplies all factors: Length × Distinctiveness Score × Condition Score × Strategic Significance Multiplier × Temporal Multiplier × Difficulty Multiplier × Watercourse Encroachment Multiplier × Riparian Encroachment Multiplier

### C-3 On-Site Watercourse Enhancement
**Header rows:** Multiple rows (10-11, 0-indexed as 9-10)
**Data row start:** Row 12 (0-indexed as row 11)

**Baseline Reference Columns:**
Populated automatically from C-1 via VLOOKUP.
- `B` (1): Baseline ref - Reference to baseline record (links to C-1 AP column)
- `C` (2): Baseline habitat - Watercourse type from baseline (VLOOKUP from C-1)
- `D` (3): Length (km) - Watercourse length from baseline
- `E` (4): Baseline distinctiveness band
- `F` (5): Baseline distinctiveness score
- `G` (6): Baseline condition category
- `H` (7): Baseline condition score
- `I` (8): Baseline strategic significance category
- `J` (9): Strategic significance (category label)
- `K` (10): Baseline strategic significance score
- `L` (11): Required Action to Meet Trading Rules
- `M` (12): Baseline habitat units

**Input Columns:**
- `N` (13): Proposed habitat - User input for enhanced watercourse type
- `T` (19): Condition - User input for proposed condition (uses INDIRECT validation to AV column)
- `V` (21): Strategic significance - User input for strategic significance
- `Z` (25): Watercourse enhanced in advance (years)
- `AA` (26): Delay in starting watercourse enhancement (years)
- `AI` (34): Watercourse encroachment (single-bank) - Extent of encroachment
- `AK` (36): Riparian encroachment (both banks) - Extent of encroachment for both banks
- `AN` (39): User Comments
- `AO` (40): Planning Authority Comments
- `AP` (41): Habitat Reference Number

**Calculated/Output Columns:**
- `O` (14): Distinctiveness movement - Shows baseline → proposed distinctiveness change with validation
- `P` (15): Condition movement - Shows baseline → proposed condition change with validation
- `Q` (16): Length (km) - Proposed habitat length (visible)
- `R` (17): Proposed distinctiveness category - VLOOKUP from G-7 Watercourse Data
- `S` (18): Proposed distinctiveness score - VLOOKUP from G-7 Watercourse Data
- `U` (20): Proposed condition score - INDEX/MATCH lookup for proposed condition
- `W` (22): Strategic significance category - From G-7 Watercourse Data
- `X` (23): Strategic significance multiplier - VLOOKUP from G-7 Watercourse Data
- `Y` (24): Standard time to target condition (years) - INDEX/MATCH from enhancement matrix (baseline condition → proposed condition)
- `AB` (27): Standard or adjusted time to target condition - Status message validating temporal inputs
- `AC` (28): Final time to target condition (years) - Adjusted for advance/delay, capped at 30+
- `AD` (29): Final time to target multiplier - Temporal multiplier from G-4
- `AE` (30): Standard difficulty of enhancement - VLOOKUP from G-7 Watercourse Data
- `AF` (31): Applied difficulty multiplier - Status message for difficulty adjustment
- `AG` (32): Final difficulty of enhancement - Conditional difficulty selection
- `AH` (33): Difficulty multiplier applied - Numeric multiplier from G-3
- `AJ` (35): Watercourse (single-bank) encroachment multiplier - VLOOKUP from G-7 Watercourse Data
- `AL` (37): Riparian (both-banks) encroachment multiplier - VLOOKUP from G-7 Watercourse Data
- `AM` (38): Final watercourse units delivered - Complex calculation (see formula below)

**Validation Rules:**
- `T` (19): Proposed Condition - INDIRECT validation based on AV (Condition Group) for proposed habitat type
- `AI` (34): Watercourse (single-bank) Encroachment - IF(N="Culvert", "N/A - Culvert", list of encroachment levels)
- `AK` (36): Riparian (both-banks) Encroachment - IF(N="Culvert", "N/A - Culvert", list of encroachment levels)

**Key Formulas:**

The final units calculation (AM) uses this logic:
```
IF baseline_length > proposed_length:
  ((((proposed_ref*proposed_score*proposed_cond) - (baseline_len*baseline_score*baseline_cond)) * (difficulty_multiplier * temporal_multiplier))
   + (baseline_len*baseline_score*baseline_cond)) * (both_banks_multiplier * strategic_multiplier * riparian_multiplier)
ELSE:
  ((((proposed_ref*proposed_score*proposed_cond) - (proposed_len*baseline_score*baseline_cond)) * (difficulty_multiplier * temporal_multiplier))
   + (proposed_len*baseline_score*baseline_cond)) * (both_banks_multiplier * strategic_multiplier * riparian_multiplier)
```

This delta method calculation allows for:
- Enhancement from baseline to proposed condition with temporal adjustment
- Length changes when baseline length differs from proposed length
- Difficulty and temporal multipliers applied to the delta (improvement)
- Baseline units carried forward if proposed condition is lower
- Strategic significance and encroachment multipliers applied at the end

**Validation & Error Checks:**
- Column O: Prevents distinctiveness trading down (S < F generates "Error Trading Down ▲")
- Column P: Prevents habitat replacement (C ≠ N and irreplaceable generates error), prevents non-like-for-like enhancement (different first 55 chars with High-High), prevents condition reduction
- Column AB: Validates temporal inputs (cannot have both advance and delay, warns if habitat already in target condition)
- Encroachment columns: "Not possible ▲" if incompatible with habitat type, "Spatial Data Missing ⚠" if lookups fail

**Condition-to-Condition Mapping:**
The standard time to target condition (Y) uses an enhancement matrix lookup:
- Looks up baseline condition (G) and proposed condition (T)
- Returns expected years to achieve the enhancement pathway
- Special case: If baseline distinctiveness (F) < proposed distinctiveness (S), returns baseline distinctiveness time (for creating rarer habitat)

**Special Features:**
- References baseline data from C-1 using baseline ref (column B)
- Enhancement pathway logic: baseline condition → proposed condition for watercourses
- Trading rules validation in column L
- Condition movement validation prevents condition reduction
- Cannot enhance without improvement (condition or distinctiveness must increase)
- Temporal adjustment logic for watercourse enhanced in advance or delayed (0-30+ years)
- Difficulty multiplier depends on whether watercourse is enhanced before losses
- Condition column (T) uses INDIRECT validation based on proposed watercourse type (column N)
- Two types of encroachment handling:
  - Single bank riparian encroachment (AI, AJ)
  - Both-banks encroachment (AK, AL)
- Encroachment multipliers vary by watercourse type and extent
- Special handling for Culverts: must use "N/A - Culvert" for all encroachment fields
- Error checking with status messages and symbols: "Error Trading Down ▲", "Error - Not like for like ▲", "Error - Can not reduce condition ▲"
- Net unit calculation uses sophisticated delta method considering:
  - Baseline vs proposed length/distinctiveness/condition
  - Temporal adjustments (early/delayed enhancement)
  - Difficulty multipliers (standard/adjusted)
  - Strategic significance adjustments
  - Riparian and both-banks encroachment multipliers

### F-1 Off-Site Watercourse Baseline
**Header row:** Row 10 (0-indexed as row 9)
**Data row start:** Row 11 (0-indexed as row 10)
**TypeScript module:** `src/offSite/watercourseBaseline.ts`

**Input Columns:**
- `C` (2): Ref - Reference/sequence number
- `D` (3): Watercourse type - Type of watercourse (links to G-7 Watercourse Data)
- `E` (4): Length (km) - Watercourse length in kilometers
- `H` (7): Condition - Condition of watercourse (uses INDIRECT validation to AK column)
- `J` (9): Strategic Significance - Strategic significance category
- `M` (12): Watercourse encroachment - Extent of encroachment on watercourse
- `O` (14): Riparian encroachment - Extent of encroachment for both banks
- `S` (18): Spatial Risk Category - **Off-site only feature**
- `X` (23): Length Retained (km)
- `Y` (24): Length Enhanced (km)
- `AD` (29): Bespoke Compensation Agreed
- `AE` (30): User Comments
- `AF` (31): Planning Authority Comments
- `AG` (32): Habitat Reference Number
- `AH` (33): Off-site Reference Number - **Required when spatial risk is set**

**Calculated/Output Columns:**
- `F` (5): Distinctiveness - VLOOKUP from G-7 Watercourse Data
- `G` (6): Distinctiveness Score - VLOOKUP from G-7 Watercourse Data
- `I` (8): Condition Score - INDEX/MATCH lookup from G-7 Watercourse Data
- `K` (10): Strategic Significance Category - Category label from G-7 Watercourse Data
- `L` (11): Strategic Significance Multiplier - Multiplier from G-7 Watercourse Data
- `N` (13): Watercourse Encroachment Multiplier - VLOOKUP from G-7 Watercourse Data
- `P` (15): Riparian Encroachment Multiplier - VLOOKUP from G-7 Watercourse Data
- `Q` (16): Required Action - Trading rules lookup
- `R` (17): Total Watercourse Units (SRM) - includes spatial risk multiplier
- `T` (19): Spatial Risk Multiplier - VLOOKUP from spatial risk table, default 1.0
- `U` (20): Total Watercourse Units - baseline units without spatial risk multiplier
- `Z` (25): Units Retained - Length Retained × Distinctiveness × Condition × Strategic × encroachment multipliers
- `AA` (26): Units Enhanced - Length Enhanced × Distinctiveness × Condition × Strategic × encroachment multipliers
- `AB` (27): Length Lost - E - X - Y (with error checking)
- `AC` (28): Units Lost - U - Z - AA (based on baseline units, not SRM)
- `AK` (36): Condition Group - INDEX/MATCH from G-7 Watercourse Data

**Special Features:**
- **Spatial risk multiplier** (Column S input, Column T calculated) - unique to off-site
- Two unit calculations: with SRM (Column R) and baseline (Column U)
- Units lost based on baseline units (U), not SRM units (R)
- Off-site reference required when spatial risk category is set
- Error checking: "Off-site reference required ▲", "Check data ⚠", "Error in Lengths △"
- Uses Length (km) instead of Area (hectares)
- Condition column (H) uses INDIRECT validation based on AK (Condition Group)

**Differences from On-Site (C-1):**
- Includes spatial risk category and multiplier applied to unit calculations
- Dual unit calculations: with and without spatial risk multiplier
- Units lost calculation based on baseline units (without SRM), not SRM units
- Off-site reference field is required when spatial risk is set
- All other calculations follow the same pattern as C-1

### F-2 Off-Site Watercourse Creation
**Header rows:** Multiple rows (10-11, 0-indexed as 9-10)
**Data row start:** Row 12 (0-indexed as row 11)
**TypeScript module:** `src/offSite/watercourseCreation.ts`

**Input Columns:**
- `B` (1): Ref - Reference/sequence number
- `C` (2): Watercourse type - Type of watercourse (links to G-7 Watercourse Data)
- `D` (3): Length (km) - Watercourse length in kilometers
- `G` (6): Condition - Condition of watercourse (uses INDIRECT validation to AL column)
- `I` (8): Strategic Significance - Strategic significance category
- `M` (12): Habitat created in advance (years)
- `N` (13): Delay in starting habitat creation (years)
- `V` (21): Watercourse encroachment - Extent of encroachment on watercourse
- `X` (23): Riparian encroachment - Extent of encroachment for both banks
- `Z` (25): Spatial Risk Category - **Off-site only feature**
- `AD` (29): User Comments
- `AE` (30): Planning Authority Comments
- `AF` (31): Habitat Reference Number
- `AG` (32): Off-site Reference
- `AH` (33): Baseline Reference

**Calculated/Output Columns:**
- `E` (4): Distinctiveness - VLOOKUP from G-7 Watercourse Data
- `F` (5): Distinctiveness Score - VLOOKUP from G-7 Watercourse Data
- `H` (7): Condition Score - INDEX/MATCH lookup from G-7 Watercourse Data
- `J` (9): Strategic Significance Category - From G-7 Watercourse Data
- `K` (10): Strategic Significance Multiplier - Multiplier from G-7 Watercourse Data
- `L` (11): Standard Time to Target Condition (years) - INDEX/MATCH from G-7 Watercourse Data
- `O` (14): Standard or adjusted time to target condition - Status message
- `P` (15): Final time to target condition (years) - Adjusted for advance/delay
- `Q` (16): Final time to target multiplier - Temporal multiplier from G-4
- `R` (17): Standard difficulty of creation - VLOOKUP from G-7 Watercourse Data
- `S` (18): Applied difficulty multiplier - Status message for difficulty adjustment
- `T` (19): Final difficulty of creation - Conditional difficulty selection
- `U` (20): Difficulty multiplier applied - Numeric multiplier from G-3
- `W` (22): Watercourse encroachment multiplier - VLOOKUP from G-7 Watercourse Data
- `Y` (24): Riparian encroachment multiplier - VLOOKUP from G-7 Watercourse Data
- `AA` (26): Spatial Risk Multiplier - VLOOKUP from spatial risk table (informational; not applied to net unit change)
- `AB` (27): River units delivered (inc SRM) - Units including spatial risk multiplier
- `AC` (28): Watercourse units delivered - Net Unit Change WITHOUT spatial risk multiplier
- `AL` (37): Condition Group - INDEX/MATCH from G-7 Watercourse Data

**Special Features:**
- Spatial risk category included for reference but NOT applied to the net unit change used by the library (the `unitsDelivered` schema output corresponds to the value without spatial risk)
- Temporal adjustment logic for habitat created in advance or delayed (0-30+ years)
- Difficulty multiplier logic: special case for ditch in "Fairly Poor" or "Fairly Good" condition created in advance (uses "Low" difficulty)
- Encroachment multipliers vary: watercourse range from 0.25-1, riparian range from 0.67-1
- Condition column (G) uses INDIRECT validation based on AL (Condition Group)
- Error checking with status messages: "Not possible ▲", "Spatial Data Missing ⚠", "Check Data ⚠"
- Main calculation multiplies all factors: Length × Distinctiveness Score × Condition Score × Strategic Significance Multiplier × Temporal Multiplier × Difficulty Multiplier × Watercourse Encroachment Multiplier × Riparian Encroachment Multiplier

**Differences from On-Site (C-2):**
- Includes spatial risk category field for reference only
- Does NOT apply spatial risk multiplier in net unit change calculation (unlike habitat sheets)
- Single unit calculation instead of dual with/without SRM
- Off-site and baseline reference fields
- All other calculations follow the same pattern as C-2

### F-3 Off-Site Watercourse Enhancement
**Header rows:** Multiple rows (10-11, 0-indexed as 9-10)
**Data row start:** Row 12 (0-indexed as row 11)
**TypeScript module:** `src/offSite/watercourseEnhancement.ts`

**Baseline Reference Columns:**
Populated automatically from F-1 via reference lookup.
- `B` (1): Baseline ref - Reference to baseline record (links to F-1 record)
- `C` (2): Baseline habitat - Watercourse type from baseline (lookup from F-1)
- `D` (3): Length (km) - Watercourse length from baseline
- `E` (4): Baseline distinctiveness band
- `F` (5): Baseline distinctiveness score
- `G` (6): Baseline condition category
- `H` (7): Baseline condition score
- `I` (8): Baseline strategic significance category
- `J` (9): Strategic significance (category label)
- `K` (10): Baseline strategic significance score
- `L` (11): Required Action to Meet Trading Rules
- `M` (12): Baseline habitat units

**Input Columns:**
- `N` (13): Proposed habitat - User input for enhanced watercourse type
- `T` (19): Condition - User input for proposed condition (uses INDIRECT validation to AY column)
- `V` (21): Strategic significance - User input for strategic significance
- `Z` (25): Watercourse enhanced in advance (years)
- `AA` (26): Delay in starting watercourse enhancement (years)
- `AI` (34): Watercourse encroachment (single-bank) - Extent of encroachment
- `AK` (36): Riparian encroachment (both banks) - Extent of encroachment for both banks
- `AQ` (42): User Comments
- `AR` (43): Planning Authority Comments
- `AS` (44): Habitat Reference Number
- `AT` (45): Off-site Reference Number

**Calculated/Output Columns:**
- `O` (14): Distinctiveness movement - Shows baseline → proposed distinctiveness change with validation
- `P` (15): Condition movement - Shows baseline → proposed condition change with validation
- `Q` (16): Length (km) - Proposed habitat length (visible)
- `R` (17): Proposed distinctiveness category - VLOOKUP from G-7 Watercourse Data
- `S` (18): Proposed distinctiveness score - VLOOKUP from G-7 Watercourse Data
- `U` (20): Proposed condition score - INDEX/MATCH lookup for proposed condition
- `W` (22): Strategic significance category - From G-7 Watercourse Data
- `X` (23): Strategic significance multiplier - VLOOKUP from G-7 Watercourse Data (for proposed habitat)
- `Y` (24): Standard time to target condition (years) - INDEX/MATCH from enhancement matrix (baseline condition → proposed condition)
- `AB` (27): Standard or adjusted time to target condition - Status message validating temporal inputs
- `AC` (28): Final time to target condition (years) - Adjusted for advance/delay, capped at 30+
- `AD` (29): Final time to target multiplier - Temporal multiplier from G-4
- `AE` (30): Standard difficulty of enhancement - VLOOKUP from G-7 Watercourse Data
- `AF` (31): Applied difficulty multiplier - Status message for difficulty adjustment
- `AG` (32): Final difficulty of enhancement - Conditional difficulty selection
- `AH` (33): Difficulty multiplier applied - Numeric multiplier from G-3
- `AJ` (35): Watercourse (single-bank) encroachment multiplier - VLOOKUP from G-7 Watercourse Data
- `AL` (37): Riparian (both-banks) encroachment multiplier - VLOOKUP from G-7 Watercourse Data
- `AM` (38): Spatial risk category - From baseline F-1 record
- `AN` (39): Spatial risk multiplier - VLOOKUP from spatial risk table
- `AO` (40): Watercourse units delivered (inc SRM) - Final units with spatial risk multiplier
- `AP` (41): Watercourse units delivered - Final units without spatial risk multiplier

**Validation Rules:**
- `T` (19): Proposed Condition - INDIRECT validation based on Condition Group for proposed habitat type
- `AI` (34): Watercourse (single-bank) Encroachment - IF(N="Culvert", "N/A - Culvert", list of encroachment levels)
- `AK` (36): Riparian (both-banks) Encroachment - IF(N="Culvert", "N/A - Culvert", list of encroachment levels)

**Key Formulas:**

The final units calculation uses delta method:
```
(((proposed_ref*proposed_score*proposed_cond) - (baseline_len*baseline_score*baseline_cond))
  * (difficulty_multiplier * temporal_multiplier)
  + (baseline_len*baseline_score*baseline_cond))
  * (both_banks_multiplier * strategic_multiplier * riparian_multiplier)
```

Then applies spatial risk:
- Column AO (40): units delivered × spatial risk multiplier (with SRM)
- Column AP (41): units delivered (without spatial risk multiplier)

**Special Features:**
- References baseline data from F-1 using baseline ref (column B)
- Enhancement pathway logic: baseline condition → proposed condition for watercourses
- Trading rules validation in column L
- Condition movement validation prevents condition reduction
- Cannot enhance without improvement (condition or distinctiveness must increase)
- Temporal adjustment logic for watercourse enhanced in advance or delayed (0-30+ years)
- Difficulty multiplier depends on whether watercourse is enhanced before losses
- Condition column (T) uses INDIRECT validation based on proposed watercourse type (column N)
- Two types of encroachment handling:
  - Single bank riparian encroachment (AI, AJ)
  - Both-banks encroachment (AK, AL)
- Encroachment multipliers vary by watercourse type and extent
- Special handling for Culverts: must use "N/A - Culvert" for all encroachment fields
- **Spatial risk multiplier** (Column AM from F-1, Column AN calculated) - unique to off-site
- Two unit calculations: with SRM (Column AO) and without (Column AP)
- Off-site reference field may be set
- Error checking: "Not possible ▲", "Error - Not like for like ▲", "Error - Can not reduce condition ▲"
- Net unit calculation uses delta method similar to C-3

**Differences from On-Site (C-3):**
- Includes spatial risk category and multiplier from baseline (F-1)
- Dual unit calculations: with spatial risk multiplier (AU) and without (AV)
- Main calculation column labeled differently for clarity of dual outputs
- Off-site and habitat reference fields
- All other calculations follow the same pattern as C-3

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

### B-2 On-Site Hedge Creation
**Header row:** Row 11 (0-indexed as row 10)
**Data row start:** Row 12 (0-indexed as row 11)

**Input Columns:**
- `B` (1): Ref - Reference/sequence number
- `C` (2): New hedge number - User-entered hedge identifier
- `D` (3): Habitat type - Hedge habitat type (links to G-6 Hedgerow Data)
- `E` (4): Length (km) - Hedgerow length in kilometers
- `H` (7): Condition - Uses INDIRECT validation to AG column
- `J` (9): Strategic Significance
- `N` (13): Habitat created in advance (years)
- `O` (14): Delay in starting habitat creation (years)
- `X` (23): User Comments
- `Y` (24): Planning Authority Comments
- `Z` (25): Habitat Reference Number

**Calculated/Output Columns:**
- `F` (5): Distinctiveness - VLOOKUP from G-6 Hedgerow Data
- `G` (6): Distinctiveness Score - VLOOKUP from G-6 Hedgerow Data
- `I` (8): Condition Score - Lookup from G-1 All Habitats (with validation for Non-native)
- `K` (10): Strategic Significance Value - Lookup from G-3 Multipliers
- `L` (11): Strategic Significance Multiplier - Multiplier from G-3 Multipliers
- `M` (12): Standard Time to Target Condition (years) - Matrix lookup: habitat type × condition
- `P` (15): Standard or adjusted time to target condition - Status message
- `Q` (16): Final time to target condition (years) - Adjusted for advance/delay
- `R` (17): Final time to target multiplier - Temporal multiplier from G-4
- `S` (18): Standard difficulty of creation - VLOOKUP from G-6 Hedgerow Data
- `T` (19): Applied difficulty multiplier - Status message for difficulty adjustment
- `U` (20): Final difficulty of creation - Conditional difficulty selection
- `V` (21): Difficulty multiplier applied - Numeric multiplier from G-3
- `W` (22): Net Unit Change - Length × G × I × L × R × V
- `AG` (32): Condition Group - INDEX/MATCH from G-6 Hedgerow Data

**Special Features:**
- Temporal adjustment logic for habitat created in advance or delayed
- Difficulty multiplier depends on whether habitat is created before losses
- Condition column (H) uses INDIRECT validation based on AG (Condition Group)
- Error checking with warning symbols: "Not possible ▲", "Spatial Data Missing ⚠", "Check Data ⚠"
- Main calculation (W) multiplies length by all applicable multipliers

### B-3 On-Site Hedge Enhancement
**Header row:** Row 11 (0-indexed as row 10)
**Data row start:** Row 12 (0-indexed as row 11)

**Baseline Reference Columns:**
Populated automatically from B-1 via VLOOKUP.
- `B` (1): Baseline ref - Reference to baseline record (links to B-1 AK column)
- `C` (2): Baseline habitat - Habitat type from baseline (VLOOKUP from B-1)
- `D` (3): Length (km) - Hedgerow length from baseline
- `E` (4): Baseline distinctiveness band
- `F` (5): Baseline distinctiveness score
- `G` (6): Baseline condition category
- `H` (7): Baseline condition score
- `I` (8): Baseline strategic significance category
- `J` (9): Baseline strategic significance score
- `K` (10): Baseline habitat units
- `L` (11): Required Action to Meet Trading Rules

**Input Columns:**
- `M` (12): Proposed habitat - User input for enhanced habitat type
- `S` (18): Condition - User input for proposed condition (uses INDIRECT validation)
- `U` (20): Strategic significance - User input for strategic significance
- `W` (22): Hedgerow enhanced in advance (years)
- `X` (23): Delay in starting hedgerow enhancement (years)
- `AB` (27): User Comments
- `AC` (28): Planning Authority Comments
- `AD` (29): Habitat Reference Number

**Calculated/Output Columns:**
- `N` (13): Distinctiveness movement - INDEX/MATCH matrix lookup showing baseline→proposed
- `O` (14): Condition movement - Validation output showing baseline→proposed pathway
- `P` (15): Length (km) - Hedgerow length (visible column, duplicates D)
- `Q` (16): Distinctiveness - Proposed habitat distinctiveness category
- `R` (17): Score - Proposed habitat distinctiveness score
- `T` (19): Score - Proposed condition score
- `V` (21): Strategic significance - Strategic significance score lookup
- `Y` (24): Time to target condition (years) - Standard time from enhancement matrix
- `Z` (25): Final time to target condition (years) - Adjusted for advance/delay
- `AA` (26): Temporal multiplier - Temporal multiplier from G-4
- `AE` (30): Difficulty multiplier applied - Numeric multiplier from G-3
- `AF` (31): Net Unit Change - Enhancement units delivered

**Special Features:**
- References baseline data from B-1 using baseline ref (column B)
- Enhancement pathway logic: baseline condition → proposed condition
- Trading rules validation in column L
- Distinctiveness movement matrix in column N (baseline habitat × proposed habitat)
- Condition movement validation in column O (prevents condition reduction)
- Cannot enhance without improvement (condition or distinctiveness must increase)
- Temporal adjustment logic for hedgerow enhanced in advance or delayed
- Difficulty multiplier depends on whether hedgerow is enhanced before losses
- Condition column (S) uses INDIRECT validation based on hidden reference column
- Error checking: "Not possible ▲", "Error - Not like for like ▲", "Error - Can not reduce condition ▲", "Error - No enhancement ▲"
- Net unit calculation uses delta method: (Proposed - Baseline) × Multipliers + Baseline

### E-1 Off-Site Hedge Baseline
**Header row:** Row 9 (0-indexed as row 8)
**Data row start:** Row 10 (0-indexed as row 9)

**Input Columns:**
- `B` (1): Ref - Reference/sequence number
- `C` (2): Hedge Number - User-entered hedge identifier
- `D` (3): Habitat Type - Hedge habitat type (links to G-6 Hedgerow Data)
- `E` (4): Length (km) - Hedgerow length in kilometers
- `H` (7): Condition - Uses INDIRECT validation to AE column
- `J` (9): Strategic Significance
- `O` (14): Spatial Risk Category - **Off-site only feature**
- `S` (18): Length Retained (km)
- `T` (19): Length Enhanced (km)
- `Y` (24): User Comments
- `Z` (25): Planning Authority Comments
- `AA` (26): Habitat Reference Number
- `AB` (27): Off-site Reference Number - **Required when spatial risk is set**

**Calculated/Output Columns:**
- `F` (5): Distinctiveness - VLOOKUP from G-6 Hedgerow Data
- `G` (6): Distinctiveness Score - VLOOKUP from G-6 Hedgerow Data
- `I` (8): Condition Score - Lookup from G-1 All Habitats
- `K` (10): Strategic Significance Category - Lookup from G-3 Multipliers
- `L` (11): Strategic Significance Multiplier - Multiplier from G-3 Multipliers
- `M` (12): Required Action - Trading rules lookup
- `N` (13): Total Hedgerow Units SRM - E × G × I × L × P (with spatial risk)
- `P` (15): Spatial Risk Multiplier - VLOOKUP from spatial risk table, default 1.0
- `Q` (16): Total Hedgerow Units - E × G × I × L (baseline, without spatial risk)
- `U` (20): Units Retained - S × G × I × L
- `V` (21): Units Enhanced - T × G × I × L
- `W` (22): Length Lost - E - S - T (with error checking)
- `X` (23): Units Lost - Q - U - V (based on baseline units, not SRM)
- `AE` (30): Condition Group - INDEX/MATCH from G-6 Hedgerow Data
- `AH` (33): Retained Flag - TRUE if S > 0

**Special Features:**
- **Spatial risk multiplier** (Column O input, Column P calculated) - unique to off-site
- Two unit calculations: with SRM (Column N) and baseline (Column Q)
- Units lost based on baseline units (Q), not SRM units (N)
- Off-site reference required when spatial risk category is set
- Error checking: "Off-site reference required ▲", "Check data ⚠", "Error in Lengths △"

### E-2 Off-Site Hedge Creation
**Header row:** Row 11 (0-indexed as row 10)
**Data row start:** Row 12 (0-indexed as row 11)

**Input Columns:**
- `B` (1): Ref - Reference/sequence number
- `C` (2): New hedge number - User-entered hedge identifier
- `D` (3): Habitat type - Hedge habitat type (links to G-6 Hedgerow Data)
- `E` (4): Length (km) - Hedgerow length in kilometers
- `H` (7): Condition - Uses INDIRECT validation to AH column
- `J` (9): Strategic Significance
- `N` (13): Habitat created in advance (years)
- `O` (14): Delay in starting habitat creation (years)
- `AA` (26): Spatial Risk Category - **Off-site only feature**
- `AF` (31): Habitat Reference
- `AG` (32): Off-site Reference
- `AH` (33): Baseline Reference

**Calculated/Output Columns:**
- `F` (5): Distinctiveness - VLOOKUP from G-6 Hedgerow Data
- `G` (6): Distinctiveness Score - VLOOKUP from G-6 Hedgerow Data
- `I` (8): Condition Score - Lookup from G-1 All Habitats (with validation for Non-native)
- `K` (10): Strategic Significance Value - Lookup from G-3 Multipliers
- `L` (11): Strategic Significance Multiplier - Multiplier from G-3 Multipliers
- `M` (12): Standard Time to Target Condition (years) - Matrix lookup: habitat type × condition
- `P` (15): Standard or adjusted time to target condition - Status message
- `Q` (16): Final time to target condition (years) - Adjusted for advance/delay
- `R` (17): Final time to target multiplier - Temporal multiplier from G-4
- `S` (18): Standard difficulty of creation - VLOOKUP from G-6 Hedgerow Data
- `T` (19): Applied difficulty multiplier - Status message for difficulty adjustment
- `U` (20): Final difficulty of creation - Conditional difficulty selection
- `V` (21): Difficulty multiplier applied - Numeric multiplier from G-3
- `W` (22): Habitat created before losses? - Boolean check for advance creation
- `X` (23): Net Unit Change (interim) - Length × G × I × L × R
- `Y` (24): Adjustment for spatial risk - Status message
- `AB` (27): Spatial Risk Multiplier - VLOOKUP from spatial risk table
- `AC` (28): Habitat Units Delivered (inc SRM) - W × V × AB (with spatial risk)
- `AD` (29): Habitat Units Delivered - W × V (without spatial risk)
- `AH` (33): Condition Group - INDEX/MATCH from G-6 Hedgerow Data

**Special Features:**
- Similar structure to B-2 but adds spatial risk columns (AA, AB, AC)
- Two unit calculations: with SRM (Column AC) and without (Column AD)
- Temporal adjustment logic for habitat created in advance or delayed
- Difficulty multiplier depends on whether habitat is created before losses
- Spatial risk applied to final unit delivery
- Error checking with warning symbols: "Not possible ▲", "Spatial Data Missing ⚠", "Check Data ⚠"

### E-3 Off-Site Hedge Enhancement
**Header rows:** Multiple rows (10-11, 0-indexed as 9-10)
**Data row start:** Row 12 (0-indexed as row 11)

**Baseline Reference Columns:**
Populated automatically from E-1 via VLOOKUP.
- `B` (1): Baseline ref - Reference to baseline record (links to E-1 AN column)
- `C` (2): Baseline habitat - Habitat type from baseline (VLOOKUP from E-1)
- `D` (3): Length (km) - Hedgerow length from baseline
- `E` (4): Baseline distinctiveness band
- `F` (5): Baseline distinctiveness score
- `G` (6): Baseline condition category
- `H` (7): Baseline condition score
- `I` (8): Baseline strategic significance category
- `J` (9): Baseline strategic significance score
- `K` (10): Baseline habitat units
- `L` (11): Required Action to Meet Trading Rules

**Input Columns:**
- `M` (12): Proposed habitat - User input for enhanced habitat type
- `S` (18): Condition - User input for proposed condition (uses INDIRECT validation)
- `U` (20): Strategic significance - User input for strategic significance
- `Y` (24): Hedgerow enhanced in advance (years)
- `Z` (25): Delay in starting hedgerow enhancement (years)
- `AL` (37): User Comments
- `AM` (38): Planning Authority Comments
- `AN` (39): Habitat Reference Number
- `AO` (40): Off-site Reference Number

**Calculated/Output Columns:**
- `N` (13): Distinctiveness movement - INDEX/MATCH matrix lookup showing baseline→proposed
- `O` (14): Condition movement - Validation output showing baseline→proposed pathway
- `P` (15): Length (km) - Hedgerow length (visible column, duplicates D)
- `Q` (16): Distinctiveness - Proposed habitat distinctiveness category
- `R` (17): Score - Proposed habitat distinctiveness score
- `T` (19): Score - Proposed condition score
- `V` (21): Strategic significance value - Strategic significance score lookup
- `W` (22): Strategic significance multiplier - Multiplier value
- `X` (23): Standard time to target condition (years) - Standard time from enhancement matrix
- `AB` (27): Final time to target condition (years) - Adjusted for advance/delay
- `AC` (28): Final time to target multiplier - Temporal multiplier from G-4
- `AD` (29): Standard difficulty of enhancement - Standard difficulty from G-6 Hedgerow Data
- `AE` (30): Applied difficulty multiplier - Status message for difficulty adjustment
- `AF` (31): Final difficulty of enhancement - Conditional difficulty selection
- `AG` (32): Difficulty multiplier applied - Numeric multiplier from G-3
- `AH` (33): Spatial risk category - From baseline E-1 record
- `AI` (34): Spatial risk multiplier - VLOOKUP from spatial risk table
- `AJ` (35): Hedgerow units delivered (inc SRM) - Net units with spatial risk multiplier
- `AK` (36): Hedgerow units delivered - Net units without spatial risk multiplier
- `AQ` (42): Condition Group - INDEX/MATCH from G-6 Hedgerow Data

**Special Features:**
- References baseline data from E-1 using baseline ref (column B)
- Enhancement pathway logic: baseline condition → proposed condition
- Trading rules validation in column L
- Distinctiveness movement matrix in column N (baseline habitat × proposed habitat)
- Condition movement validation in column O (prevents condition reduction)
- Cannot enhance without improvement (condition or distinctiveness must increase)
- Temporal adjustment logic for hedgerow enhanced in advance or delayed
- Difficulty multiplier depends on whether hedgerow is enhanced before losses
- **Spatial risk multiplier** (Column AH input from E-1, Column AI calculated) - unique to off-site
- Two unit calculations: with SRM (Column AJ) and without (Column AK)
- Off-site reference required when spatial risk category is set
- Condition column (S) uses INDIRECT validation based on AQ (Condition Group)
- Error checking: "Not possible ▲", "Error - Not like for like ▲", "Error - Can not reduce condition ▲", "Error - No enhancement ▲", "Off-site reference required ▲"
- Net unit calculation uses delta method: (Proposed - Baseline) × Difficulty × Temporal + Baseline, then applies strategic significance and spatial risk
- Similar to B-3 but with added spatial risk columns and dual unit calculations

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

### Off-Site Watercourse Special Case

Unlike habitat and hedgerow sheets, off-site watercourse creation (F-2) includes the spatial risk category field but does NOT apply it to the unit change calculation. This differs from:
- Habitat sheets (D-2) which apply spatial risk multiplier to units delivered
- Hedgerow sheets (E-2) which apply spatial risk multiplier to units delivered
- Watercourse baseline (F-1) which applies spatial risk multiplier to baseline units

The spatial risk multiplier is only applied in off-site watercourse enhancement (F-3).

---

## Notes

- Column indices are 0-based when used in code (Column A = 0, B = 1, etc.)
- Row indices are 0-based when used in code (Row 1 = 0, Row 2 = 1, etc.)
- Header rows typically at row 10 (0-indexed as 9)
- Data rows typically start at row 11 (0-indexed as 10)
- Broad Habitat column is used to identify data rows in `findAllDataRows()` helper
- Empty or header text in Broad Habitat column indicates no data row

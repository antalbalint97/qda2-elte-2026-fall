# Categorical Data Lab · Kategoriális adatok labor

`categorical-lab` · Family C — Categorical & relational · **Existing partial implementation (repo code to refactor)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Build conditional percentages in the direction of X
- Derive expected counts from independence and χ² from discrepancies
- Separate significance (χ², p) from strength (V) and from effect (OR)
- Know when expected counts are too small

**Target learner level.** L1–L2

**Concepts rendered** (9): Frequencies and proportions (`desc.frequencies`); Contingency tables (`cat.contingency`); Conditional percentages (`cat.conditional_percent`); Expected frequencies (`cat.expected_frequencies`); Chi-square test of independence (`cat.chi_square`); Cramér's V (`cat.cramers_v`); Odds ratios (`cat.odds_ratio`); Fisher's exact test (`cat.fisher`); Independence (`prob.independence`)

**Prerequisite concepts** (from the graph, outside this lab): Measurement levels (`data.measurement_levels`); Variable roles (X, Y, Z) (`data.variable_roles`); Conditional probability (`prob.conditional`); Null distributions (`infer.null_distribution`); Effect sizes (`infer.effect_size`); Events and sample spaces (`prob.events`)

**Common misconceptions** (from the concept graph)
- Percent and percentage points are the same
- Valid percent and percent are interchangeable
- Raw counts can be compared across unequal groups
- Always use row percentages
- The percentage difference equals the association strength
- Expected counts must be integers
- Expected = observed when there is an association
- χ² measures strength

**Key conceptual insight.** Mosaic tiles are conditional percentages; independence is tiles lining up; χ² measures how far they are from lining up.

**Why interactivity is justified.** The mosaic makes 'row vs column percent' a geometric choice and lets students scale N while percentages stay fixed.

## B. Mathematical model

- **Input data:** r×c table of counts (r,c ≤ 5); keep ∈ {N, margins}; seed for presets
- **Parameters (configuration schema):** `rows` (int), `cols` (int), `keep` (enum: N/margins), `N` (int)
- **Estimators**
- row/col %
- E_ij = r_i c_j / N
- χ² = Σ(O−E)²/E, df=(r−1)(c−1), p via chiSquareP
- V = √(χ²/(N·min(r−1,c−1)))
- 2×2: OR=(ad)/(bc) with log-OR CI; RR; risk difference; Fisher exact p (hypergeometric)
- **Equations**
- independence ⇔ O_ij = E_ij
- **Assumptions:** independent observations; χ² approximation needs E≥5 (rule flagged, not enforced)
- **Computational contracts**
- any E=0 → χ² null (reason 'zeroExpected')
- OR with a zero cell → null + Haldane note (not silently corrected)
- Fisher only for 2×2
- **Undefined cases → null + reason:** empty row/column; - N=0
- **Numerical limits:** chiSquareP to 1e−7; hypergeometric via log-gamma exact
- **Reference validation:** SciPy chi2_contingency (correction=False), fisher_exact; statsmodels Table2x2 for OR CI
- **Engine:** chiSquareTest, chiSquareP (stats.ts) + odds ratio with CI, Fisher exact (hypergeometric)

## C. Visualization design

- **Main visual metaphor:** ContingencyMosaic: column widths = marginal of X, tile heights = conditional % of Y; expected tiles drawn as dashed outlines.
- **Primary canvas:** mosaic with draggable tile boundaries (changes counts; keeps N or keeps margins); swap X/Y button rotates the mosaic
- **Secondary synchronized representations**
- count table with O / E / (O−E)²/E toggle
- χ² contribution heat on tiles
- OR/RR/RD triad for 2×2 with CI bands
- χ²(df) tail with observed value
- **Formula interactions:** keys: O, E, rowtot, coltot, N, contrib, chi2, df, p, V, OR
- **Semantic encodings:** X categories = hue; expected = dashed outline; contribution = opacity
- **Animation:** N scaling: tiles unchanged, χ² readout grows (550 ms count-up); swap rotates 90°
- **Responsive:** table below mosaic <900px
- **Reusable primitives:** MosaicPlot, CountTable, ContributionHeat

## D. Interaction specification

- **Direct manipulation:** drag tile boundaries · drag N slider · swap X/Y · toggle expected overlay
- **Numeric / keyboard alternatives:** editable count table (primary a11y path) · N input
- **Lockable parameters (instructor):** `rows`, `cols`, `keep`, `N`
- **State transitions:** table → percentages → expected → χ² → V/OR
- **Reset & reproducibility:** preset table; all randomness via `mulberry32(seed)`
- **Presets:** education × voted (course data) · settlement × voted (c-chiv numbers) · 2×2 smoking × disease · independent table
- **Undo/redo:** one-level

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Double every count: what happens to χ², p and V?' (p-chi-scale) |
| Experiment | Drag tiles until expected outlines coincide with observed; read χ² |
| Explain | Why are expected counts not integers and why does that not matter? |
| Formalize | Compute E for one cell by hand and check the table |
| Transfer | A weighted survey table: can weighted counts go straight into χ²? (bridge to Rao–Scott in complex-survey-lab) |

**Expected observations:** χ² scales with N, V does not; independence = aligned tiles

**Plausible incorrect interpretations:** 'χ² measures strength'; 'OR = how many times more likely'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"categorical-lab", params:{rows, cols, keep, N}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** four above
- **Defaults:** 2×3 education × voted
- **Available / locked controls:** lock size; hide expected until predicted
- **Formula layers:** terms / derivation
- **Assessment integration:** c-chiv, c-expected, c-rowcol items
- **Teach Mode:** mosaic full-width
- **Localization:** dictionary
- **Library blocks using this lab** (1): `l.categorical-mosaic`
- **Instructor options (registry):** Preset tables (course data); Hide expected until predicted; Lock table size

## G. Quality assurance

- **Numerical validation:** SciPy chi2_contingency (correction=False), fisher_exact; statsmodels Table2x2 for OR CI
- **Property-based tests**
- Σ(O−E)=0 per row and column
- V∈[0,1]
- χ²(2×2) = N·φ²
- **Statistical identities**
- swap X/Y leaves χ², V unchanged
- **Edge cases:** zero cell; 1×c table (df=0); E<5 flag
- **Accessibility testing:** count table primary; mosaic described by table; contributions as numbers; registry alternatives: Editable count table is the primary control; Mosaic described by table
- **Performance:** trivial
- **Scientific review checklist**
- statistician: Yates correction off, stated
- pedagogy: association ≠ causation note on every preset
- **Registry test requirements:** χ², p, V vs SciPy chi2_contingency; Fisher vs SciPy fisher_exact; OR CI vs statsmodels Table2x2

## H. Completion requirements

- **MVP:** mosaic + table + χ²/V, presets 1–2
- **Production-ready:** OR/RR/RD, Fisher, keep-margins drag, lock schema
- **Pilot-ready:** Predict/Transfer authored
- **Optional future extensions:** stratified mosaic feeding lazarsfeld-simpson-lab

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 weeks 3–4 |
| Classroom duration | 25 min |
| Baseline conceptual question | c-rowcol item |
| Primary interaction task | produce V=.07 with p<.001 by scaling N |
| Expected learning insight | significance vs strength |
| Transfer item | weighted survey table |
| Common misconception | χ² = strength |
| Instructor demonstration preset | preset 2 |
| Technical & accessibility acceptance | table-only completion; fixtures pass |

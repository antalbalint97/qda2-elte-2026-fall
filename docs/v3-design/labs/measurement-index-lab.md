# Measurement & Index Lab · Mérés és index labor

`measurement-index-lab` · Family E — Measurement & multivariate modelling · **Existing partial implementation (repo code to refactor)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Build an index from items after reverse scoring
- Read α and α-if-deleted and delete one item at a time
- Separate reliability from validity
- See attenuation of correlations by measurement error
- Cut an index into categories three ways

**Target learner level.** L2

**Concepts rendered** (10): Composite indexes (`measure.composite_index`); Reverse scoring (`measure.reverse_scoring`); Internal consistency (`measure.reliability`); Cronbach's alpha (`measure.cronbach`); Measurement validity (`measure.validity`); Operationalization (`data.operationalization`); Measurement error (`survey.measurement_error`); Quantiles and percentiles (`desc.quantiles`); Standardization (z-scores) (`desc.standardization`); Questionnaire design (`survey.questionnaire`)

**Prerequisite concepts** (from the graph, outside this lab): The mean as a model (`desc.mean`); Data coding and recoding (`data.coding`); Covariance (`desc.covariance`); Variance (`desc.variance`); Variables and observations (`data.variables`); Mean, median and mode (`desc.central_tendency`); Standard deviation (`desc.sd`); Functions and transformations (`math.functions`)

**Common misconceptions** (from the concept graph)
- Any set of items can be averaged
- The index is on the same scale as the items (only if items share a scale)
- Negative item-total correlations mean the item is bad (it may be unreversed)
- Reliable means valid
- α ≥ .7 proves unidimensionality
- Higher α is always better
- Validity is established once by alpha or by a factor analysis
- One question measures a concept

**Key conceptual insight.** α rises with inter-item covariance and with k; it says nothing about what the items measure.

**Why interactivity is justified.** Item toggles with a live variance picture (Σ item variances vs total) make the α formula geometric.

## B. Mathematical model

- **Input data:** respondent × item matrix (120 × k from ds.index-120), reverse flags, cut method, error SD
- **Parameters (configuration schema):** `items` (array), `cut` (enum: absolute/relative/percentile), `errorSD` (float), `seed` (int)
- **Estimators**
- cronbachAlpha, itemTotalStatistics, alphaBand (repo reliability.ts)
- index mean; percentile/absolute/relative cuts
- attenuation: r_obs = r_true·√(ρ_xx ρ_yy) by simulation with added N(0,σ_e) error
- **Equations**
- α=k/(k−1)(1−Σs_j²/s²_total)
- **Assumptions:** listwise complete; items on a common scale
- **Computational contracts**
- k<2 → α null
- k=2 → α-if-deleted NaN → null with reason
- constant item → variance 0, flagged
- **Undefined cases → null + reason:** single respondent
- **Numerical limits:** exact
- **Reference validation:** scripts/validation/reference.py covariance-form α; SPSS Reliability output
- **Engine:** cronbachAlpha, itemTotalStatistics (reliability.ts); attenuation simulation; percentile/absolute/relative cuts

## C. Visualization design

- **Main visual metaphor:** Items as cards; α as the gap between two stacked squares (Σ item variances vs variance of the sum).
- **Primary canvas:** item cards (toggle, reverse) around a variance picture: k small squares vs one big square; α computed from their areas
- **Secondary synchronized representations**
- item-total table (SPSS layout)
- index histogram with draggable cut lines (CutHistogram)
- attenuation scatter: true vs noisy r
- **Formula interactions:** keys: k, sj2, stot2, ratio, alpha
- **Semantic encodings:** item squares #548FD0, total square #6A5BC9, reversed item outlined coral
- **Animation:** square areas animate on toggle
- **Responsive:** stacks
- **Reusable primitives:** ItemCards, AlphaTable, CutHistogram, AttenuationScatter

## D. Interaction specification

- **Direct manipulation:** toggle items · reverse item · drag cut lines · drag error SD
- **Numeric / keyboard alternatives:** checkboxes; number inputs
- **Lockable parameters (instructor):** `items`, `cut`, `errorSD`
- **State transitions:** items → α → cuts → attenuation
- **Reset & reproducibility:** preset item set; all randomness via `mulberry32(seed)`
- **Presets:** course 120-respondent item set · one unreversed item · two scales mixed (high α, no validity)
- **Undo/redo:** one-level

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Forget to reverse one item: will α rise or fall?' |
| Experiment | Delete items one at a time following α-if-deleted; stop at three; record the path |
| Explain | Why does adding a redundant item raise α without improving measurement? |
| Formalize | Compute α from the two square areas by hand |
| Transfer | Survey measurement error: add noise to a predictor and explain why r shrinks |

**Expected observations:** unreversed item collapses α; α-if-deleted path

**Plausible incorrect interpretations:** 'α≥.7 proves unidimensionality'; 'reliable = valid'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"measurement-index-lab", params:{items, cut, errorSD, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** three above
- **Defaults:** course set
- **Available / locked controls:** lock items; hide α until predicted
- **Formula layers:** terms
- **Assessment integration:** index items (repo)
- **Teach Mode:** variance picture large
- **Localization:** dictionary
- **Library blocks using this lab** (2): `l.index-builder`, `x.attenuation`
- **Instructor options (registry):** Preset item sets (course 120 respondents); Hide alpha until predicted

## G. Quality assurance

- **Numerical validation:** scripts/validation/reference.py covariance-form α; SPSS Reliability output
- **Property-based tests**
- α vs covariance form to 1e−12
- α-if-deleted vs recompute
- attenuation factor within simulation SE
- **Statistical identities**
- k=2: α=2r/(1+r)
- **Edge cases:** k=2; constant item
- **Accessibility testing:** checkbox toggles; tables; registry alternatives: Item toggles are checkboxes; Tables everywhere
- **Performance:** trivial
- **Scientific review checklist**
- statistician ✓ (repo)
- pedagogy: validity framing
- **Registry test requirements:** Alpha vs scripts/validation/reference.py covariance form; Attenuation factor √ρ_xx ρ_yy

## H. Completion requirements

- **MVP:** items + α + variance picture (repo IndexBuilder refactor)
- **Production-ready:** cuts, attenuation, lock schema
- **Pilot-ready:** Predict/Transfer authored
- **Optional future extensions:** ordinal α; link to factor analysis

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 12; Survey week 9 |
| Classroom duration | 25 min |
| Baseline conceptual question | 'Does α≥.7 mean the scale is valid?' |
| Primary interaction task | reach α≥.8 with three items |
| Expected learning insight | α geometry |
| Transfer item | attenuation |
| Common misconception | reliable = valid |
| Instructor demonstration preset | preset 2 |
| Technical & accessibility acceptance | table-only; reference parity |

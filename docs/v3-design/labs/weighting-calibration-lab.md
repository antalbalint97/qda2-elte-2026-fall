# Weighting & Calibration Lab · Súlyozás és kalibráció labor

`weighting-calibration-lab` · Family D — Advanced survey statistics · **Fully designed (no code yet)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- See post-stratification and raking as special cases of calibration
- Choose auxiliaries and predict which outcomes gain precision
- Bound weights and see the bias/variance trade
- Distinguish model-assisted from model-based reliance on the model

**Target learner level.** L3–L4

**Concepts rendered** (5): Calibration (`survey.calibration`); Raking (iterative proportional fitting) (`survey.raking`); Post-stratification (`survey.post_stratification`); Model-assisted and model-based inference (`survey.model_based`); Ratio and Hájek estimation (`survey.hajek`)

**Prerequisite concepts** (from the graph, outside this lab): Optimization (`math.optimization`); Sampling (design) weights (`survey.weights`); Stratified sampling (`survey.stratified`); Design-based inference (`survey.design_based`); Multiple regression (`model.multiple_regression`); Horvitz–Thompson estimation (`survey.horvitz_thompson`)

**Common misconceptions** (from the concept graph)
- Calibration guarantees unbiasedness for every variable
- Raking matches the joint distribution
- Post-stratification is the same as stratification at design time
- A good model makes the design irrelevant
- Dividing by N and by Σd gives the same estimate

**Key conceptual insight.** Calibration moves weights as little as possible to hit known totals; it helps exactly the outcomes correlated with the auxiliaries.

**Why interactivity is justified.** The abstract 'minimise distance subject to constraints' becomes a visible tug between margins and weights.

## B. Mathematical model

- **Input data:** respondents with d_k, auxiliaries x_k (group, x, optional continuous), known totals X; method; bounds
- **Parameters (configuration schema):** `auxiliaries` (array), `method` (enum: poststrat/raking/linear/bounded), `bounds` (range)
- **Estimators**
- post-strat, raking (QDA2Survey.rake)
- linear calibration (GREG): w=d(1+λᵀx), λ=(Σd x xᵀ)⁻¹(X−Σd x)
- bounded (logit) calibration via iterative bounds, non-convergence flagged
- variance per outcome via linearised residuals e_k=y_k−x_kᵀB
- **Equations**
- min Σ G(w,d) s.t. Σw x = X
- Ŷ_GREG=Ŷ_HT+(X−X̂_HT)ᵀB̂
- **Assumptions:** auxiliary totals known without error
- **Computational contracts**
- singular Σdxxᵀ → null with reason 'collinearAux'
- bounds infeasible → flagged, no silent fallback
- raking convergence flag mandatory
- **Undefined cases → null + reason:** margin with zero respondents
- **Numerical limits:** as rake; GREG exact
- **Reference validation:** R survey::calibrate (linear, raking, logit bounds); svymean SE after calibration
- **Engine:** GREG/linear calibration, raking with convergence trace, bounded weights; model-assisted vs model-based comparison

## C. Visualization design

- **Main visual metaphor:** CalibrationMargin bars converging to targets while a WeightDistribution reshapes; outcome variance tiles light up where auxiliaries correlate.
- **Primary canvas:** margin bars (current vs target) with step-through iterations; weight histogram before/after with bounds as lines
- **Secondary synchronized representations**
- outcome variance table: SE for y₁ (correlated with aux) and y₂ (uncorrelated)
- model-assisted vs model-based under misspecification (bias over repeats)
- **Formula interactions:** keys: d, w, g=w/d, X, Xhat, lambda, e
- **Semantic encodings:** before #548FD0, after #6A5BC9, bounds #D9A441
- **Animation:** iterations step at 400 ms; reduced motion shows final
- **Responsive:** stacks
- **Reusable primitives:** MarginBars, WeightHistogram, OutcomeVarianceTable

## D. Interaction specification

- **Direct manipulation:** pick auxiliaries · step iterations · drag bounds · misspecify model toggle
- **Numeric / keyboard alternatives:** checkboxes; number bounds
- **Lockable parameters (instructor):** `auxiliaries`, `method`, `bounds`
- **State transitions:** choose aux → calibrate → inspect variance → misspecify
- **Reset & reproducibility:** preset; all randomness via `mulberry32(seed)`
- **Presets:** group only · group × x · continuous aux · tight bounds infeasible
- **Undo/redo:** none

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Calibrating on age × sex: will the SE of income or of political interest fall more?' |
| Experiment | Tighten bounds until infeasible; record the largest g=w/d |
| Explain | Why does raking match margins but not the joint? |
| Formalize | Verify Σw x = X for each auxiliary from the readouts |
| Transfer | A nonprobability panel calibrated to census margins: what does the estimate still assume? |

**Expected observations:** variance falls only for correlated outcomes; bounds trade variance for bias

**Plausible incorrect interpretations:** 'calibration guarantees unbiasedness for everything'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"weighting-calibration-lab", params:{auxiliaries, method, bounds}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** four above
- **Defaults:** group × x raking
- **Available / locked controls:** lock method
- **Formula layers:** terms / derivation
- **Assessment integration:** items to author
- **Teach Mode:** margins full-width
- **Localization:** dictionary
- **Library blocks using this lab** (1): `l.calibration`
- **Instructor options (registry):** Preset auxiliaries; Hide variance until predicted

## G. Quality assurance

- **Numerical validation:** R survey::calibrate (linear, raking, logit bounds); svymean SE after calibration
- **Property-based tests**
- totals reproduced to 1e−9
- GREG vs survey::calibrate(linear)
- rake vs survey::rake
- **Statistical identities**
- post-strat = raking with one margin
- **Edge cases:** collinear aux; empty margin cell
- **Accessibility testing:** iteration log as text; tables; registry alternatives: Iteration log as text
- **Performance:** trivial
- **Scientific review checklist**
- survey statistician: bounded method named (logit)
- pedagogy: model-based caveat
- **Registry test requirements:** Calibration totals reproduced to 1e-9; Raking vs R survey::rake; GREG vs survey::calibrate(calfun='linear')

## H. Completion requirements

- **MVP:** post-strat + raking + variance table (engine exists)
- **Production-ready:** GREG, bounds, misspecification demo
- **Pilot-ready:** items
- **Optional future extensions:** calibration to continuous totals with trimming

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | Survey week 8 |
| Classroom duration | 25 min |
| Baseline conceptual question | 'Does raking match the joint distribution?' |
| Primary interaction task | find an outcome whose SE does not fall |
| Expected learning insight | gain follows correlation with aux |
| Transfer item | nonprobability panel |
| Common misconception | calibration = unbiased |
| Instructor demonstration preset | preset 2 |
| Technical & accessibility acceptance | table-only; R parity |

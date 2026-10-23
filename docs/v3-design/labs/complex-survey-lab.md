# Complex Survey Inference Lab · Komplex survey-következtetés labor

`complex-survey-lab` · Family D — Advanced survey statistics · **Fully designed (no code yet)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Estimate design-based variance for stratified-cluster samples by linearisation and replication
- Compute deff per estimate and n_eff
- Estimate for a domain without subsetting away design information
- Run design-based χ² and regression and export reproducible R code

**Target learner level.** L3–L4

**Concepts rendered** (9): Complex-survey variance estimation (`survey.variance_estimation`); Taylor linearization (`survey.taylor`); Replicate weights (`survey.replicate_weights`); Design effect (`survey.design_effect`); Domain estimation (`survey.domain`); Design-based testing (`survey.design_based_testing`); Survey regression (`survey.regression`); Reproducible survey analysis (`survey.reproducible`); Coverage probability (`est.coverage`)

**Prerequisite concepts** (from the graph, outside this lab): Sampling (design) weights (`survey.weights`); Cluster sampling (`survey.cluster`); Derivatives and integrals (`math.calculus`); Bootstrap introduction (`est.bootstrap`); Simple random sampling (`survey.srs`); Ratio and Hájek estimation (`survey.hajek`); Chi-square test of independence (`cat.chi_square`); Independent-samples t-test (`group.t_independent`); Multiple regression (`model.multiple_regression`); Reproducibility (`practice.reproducibility`); Confidence intervals (`est.confidence_interval`)

**Common misconceptions** (from the concept graph)
- Weights alone fix the variance
- SPSS base WEIGHT BY computes design-based SEs
- Linearisation is exact
- Replicate weights are alternative analysis weights
- deff is a property of the survey, not of each estimate
- Filter the data then analyse as a new survey
- Weighted counts can go straight into a standard chi-square
- Weighted regression in SPSS GLM gives design-based SEs

**Key conceptual insight.** Four standard errors for one mean can differ by a factor of two; only the ones that honour the design keep their promise.

**Why interactivity is justified.** Students cannot see why 'subset then analyse' is wrong until the design tree shows which PSUs disappear.

## B. Mathematical model

- **Input data:** one complex sample from the Studio engine (strata × PSUs, weights), outcome(s), domain indicator, model formula
- **Parameters (configuration schema):** `strata` (int), `psuPerStratum` (int), `method` (enum: taylor/jk1/jkn/brr), `domain` (string)
- **Estimators**
- naive s²/n
- Taylor linearised (QDA2Survey.linearizedVarMean) for means, ratios, regression coefficients
- JK1/JKn replicate weights: V̂=Σ_h (a_h−1)/a_h Σ_i(θ̂_(hi)−θ̂)²
- BRR (balanced half-samples) when a_h=2
- Rao–Scott first-order corrected χ²
- weighted OLS with design SEs (linearised score residuals)
- domain estimate with zero-weight-outside-domain trick
- **Equations**
- V̂_JKn as above
- χ²_RS = χ²_Pearson/δ̂
- **Assumptions:** with-replacement PSU approximation; a_h≥2
- **Computational contracts**
- a_h=1 → 'lonely PSU' flag, options: centre at grand mean (R options(survey.lonely.psu)), stated
- domain with no PSU in a stratum → SE flagged
- export produces runnable svydesign/svymean/svyby/svychisq/svyglm code
- **Undefined cases → null + reason:** single-PSU design
- **Numerical limits:** as engine
- **Reference validation:** R survey: svymean, svyby, svychisq (RS), svyglm, as.svrepdesign(type='JKn'); tolerance 1e−6 estimates, 1e−4 SEs for linearisation parity, 1 % for replication
- **Engine:** Design-based variance: stratified-cluster with-replacement ultimate-cluster formula; Taylor linearisation for ratios; JK1/JKn replicates; Rao–Scott χ²; weighted OLS with design SEs

## C. Visualization design

- **Main visual metaphor:** SamplingDesignTree (strata → PSUs → units) feeding SE bars; ReplicateEstimate dots show the replication idea literally.
- **Primary canvas:** design tree with weights as node sizes; click a PSU to drop it and see the replicate estimate
- **Secondary synchronized representations**
- SE comparison bars: naive, Taylor, JKn, simulation truth
- deff and n_eff per estimate table
- domain estimate card with CI and the stratum/PSU coverage warning
- weighted crosstab with naive χ² vs Rao–Scott
- weighted regression table with design SEs
- R code export panel
- **Formula interactions:** keys: U_hi, Vlin, theta_hi, Vjk, deff, neff, chi2, delta
- **Semantic encodings:** naive coral, Taylor teal, JK violet, truth black
- **Animation:** PSU drop animates replicate dot appearing
- **Responsive:** stacks
- **Reusable primitives:** DesignTree, SEBars, CIReadout, CodeExport

## D. Interaction specification

- **Direct manipulation:** click PSUs to see replicates · choose method · choose domain · choose outcome/model
- **Numeric / keyboard alternatives:** tree as nested list; selects
- **Lockable parameters (instructor):** `strata`, `psuPerStratum`, `method`, `domain`
- **State transitions:** design → SEs → replicates → domain → tests → regression → export
- **Reset & reproducibility:** new sample; all randomness via `mulberry32(seed)`
- **Presets:** 4 strata × 6 PSUs · lonely PSU case · small domain · weighted regression
- **Undo/redo:** none

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'The naive SE is 1.2; will the design-based SE be larger or smaller for a cluster sample?' |
| Experiment | Generate JKn replicates; compare their SD with the Taylor SE and the simulation truth |
| Explain | Why does subsetting to a domain lose design information? |
| Formalize | Write V̂_JKn for one stratum and verify against the readout |
| Transfer | Export the R code, change the weights to all-ones and explain what changes |

**Expected observations:** Taylor ≈ JKn; naive too small under clustering

**Plausible incorrect interpretations:** 'weights alone fix the SE'; 'filter then analyse'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"complex-survey-lab", params:{strata, psuPerStratum, method, domain}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** four above
- **Defaults:** 4 × 6 Taylor
- **Available / locked controls:** lock method; show one method only
- **Formula layers:** derivation
- **Assessment integration:** a.survey-variance items
- **Teach Mode:** SE bars full-width
- **Localization:** dictionary
- **Library blocks using this lab** (3): `l.csi-variance`, `l.csi-domain`, `l.csi-regression`
- **Instructor options (registry):** Lock design; Show only one variance method; Preset export

## G. Quality assurance

- **Numerical validation:** R survey: svymean, svyby, svychisq (RS), svyglm, as.svrepdesign(type='JKn'); tolerance 1e−6 estimates, 1e−4 SEs for linearisation parity, 1 % for replication
- **Property-based tests**
- Taylor vs R svymean to 1e−4
- JKn vs as.svrepdesign
- Rao–Scott vs svychisq
- svyglm coefficients and SEs
- **Statistical identities**
- SRS: Taylor = s²/n·(n/(n−1)) scaling noted
- **Edge cases:** lonely PSU; domain empty in a stratum; a_h=2 BRR
- **Accessibility testing:** tree as list; all tables; registry alternatives: Design tree as nested list; All comparisons in tables
- **Performance:** replicates ≤ 60 → instant
- **Scientific review checklist**
- survey statistician: lonely PSU option named
- pedagogy: export workflow
- **Registry test requirements:** All SEs validated against R survey on exported samples (svymean, svyby, svychisq, svyglm); Coverage simulation 94–96 %

## H. Completion requirements

- **MVP:** SE bars (naive/Taylor/JKn) + deff + domain
- **Production-ready:** RS χ², svyglm, BRR, export, lock schema
- **Pilot-ready:** items; R validation gate
- **Optional future extensions:** Fay's BRR, bootstrap weights

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | Survey weeks 10–13 |
| Classroom duration | 4 × 25 min |
| Baseline conceptual question | 'Why is s/√n wrong for a cluster sample?' |
| Primary interaction task | get Taylor and JKn to agree within 5 % |
| Expected learning insight | replication = re-estimate without each PSU |
| Transfer item | R export with all-one weights |
| Common misconception | weights fix variance |
| Instructor demonstration preset | preset 1 |
| Technical & accessibility acceptance | R parity gates before pilot |

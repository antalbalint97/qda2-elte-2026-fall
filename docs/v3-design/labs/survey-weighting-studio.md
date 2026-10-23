# Survey Design & Weighting Studio (flagship) · Survey tervezés és súlyozás stúdió

`survey-weighting-studio` · Family D — Advanced survey statistics · **Working prototype**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Trace one inference from population to estimate across ten stages
- Compute πₖ from a design and dₖ=1/πₖ
- Compare unweighted, HT and Hájek means against Ȳ and Ȳ_frame
- Separate coverage, sampling, nonresponse and adjustment error
- Read deff and n_eff correctly

**Target learner level.** L2–L4

**Concepts rendered** (20): Survey inference (`survey.inference`); Total survey error (`survey.tse`); Probability vs nonprobability sampling (`survey.prob_vs_nonprob`); Simple random sampling (`survey.srs`); Stratified sampling (`survey.stratified`); Cluster sampling (`survey.cluster`); Intraclass correlation (`survey.icc`); Inclusion probabilities (`survey.inclusion_prob`); Sampling (design) weights (`survey.weights`); Horvitz–Thompson estimation (`survey.horvitz_thompson`); Ratio and Hájek estimation (`survey.hajek`); Nonresponse and selection bias (`survey.nonresponse`); Nonresponse adjustments (`survey.nonresponse_adj`); Post-stratification (`survey.post_stratification`); Raking (iterative proportional fitting) (`survey.raking`); Effective sample size (`survey.effective_n`); Design effect (`survey.design_effect`); Design-based inference (`survey.design_based`); Missing-data handling in surveys (`survey.missing_data`); Missing values (`data.missing`)

**Prerequisite concepts** (from the graph, outside this lab): Populations and samples (`est.population_sample`); Sampling variation (`est.sampling_variation`); Estimator bias and consistency (`est.bias`); Standard error (`est.standard_error`); Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`); Events and sample spaces (`prob.events`); Weighted averages (`desc.weighted_mean`); Optimization (`math.optimization`); Complex-survey variance estimation (`survey.variance_estimation`); Data coding and recoding (`data.coding`)

**Common misconceptions** (from the concept graph)
- Survey inference is just classical inference with weights
- Margin of error covers all error
- Sampling error is the main error source
- Quota sampling is probability sampling
- A big opt-in sample beats a small random one
- SRS guarantees a representative sample
- Haphazard selection is random
- Stratification always reduces variance equally for every variable

**Key conceptual insight.** Each stage adds one error source; weights fix what the design did, not what the respondents did.

**Why interactivity is justified.** Survey error is invisible in a data file; a visible finite population with known truth makes bias a measured quantity.

## B. Mathematical model

- **Input data:** PopulationSpec {N=600, groups(share, μ, σ), clusters=20, icc, frame coverage, seed}; design; mech; adjust
- **Parameters (configuration schema):** `groups` (array), `design` (enum: srs/stratified/cluster), `n` (int), `rho` (float), `nonresponse` (enum: none/mcar/group/outcome), `adjustment` (enum: none/poststrat/raking), `seed` (int)
- **Estimators**
- QDA2Survey.select → π per unit (SRS, stratified, cluster, two-stage)
- estimates: unweighted, HT total/N, Hájek
- postStratify, rake (IPF)
- linearizedVarMean (with-replacement ultimate cluster, no fpc); closedFormVar (SRS, strat, cluster); naiveVar
- kishNeff; deff = V_design/V_SRS(n)
- repeat: Monte-Carlo sampling distribution
- **Equations**
- dₖ=1/πₖ
- ȳ_H=Σdy/Σd
- V̂_lin=Σ_h a_h/(a_h−1)Σ_i(U_hi−Ū_h)²
- deff=V_design/V_SRS; n_eff=n/deff; n_eff,w=(Σw)²/Σw²
- **Assumptions:** design known; nonresponse ignorable given adjustment classes (when claimed)
- **Computational contracts**
- a_h<2 → variance degenerate flag
- HT divides by N_frame before adjustment and by N after calibration to population counts (stated in UI)
- every SE labelled with its method
- engine.validation lists unchecked items; UI badge 'not yet validated vs R survey'
- **Undefined cases → null + reason:** empty respondent set; - stratum with 0 respondents
- **Numerical limits:** with-replacement approximation overstates variance when n/N is large (fpc shown in closed forms)
- **Reference validation:** R survey: svydesign/svymean (SE, deff), postStratify, rake, svytotal; 200 exported samples; tolerance 1e−6 estimates, 1 % SEs (scripts/validation/survey_reference.R — to be written)
- **Engine:** Finite synthetic population with subgroups; SRS / stratified / cluster selection; πₖ; HT and Hájek; nonresponse mechanisms; post-stratification; raking; Kish n_eff; design-based variance by simulation and by formula; deff

## C. Visualization design

- **Main visual metaphor:** PopulationField: every unit a dot in PSU blocks; the frame, the sample, nonresponse and weights are successive overlays on the same dots.
- **Primary canvas:** 600 dots × 20 PSU blocks; hollow = off frame; ring = sampled; faded = nonrespondent; radius = weight
- **Secondary synchronized representations**
- estimate strip (0–100) with Ȳ, Ȳ_frame, unweighted, HT, Hájek
- composition bars (population / frame / sample / respondents / weighted)
- weight histogram with Σw and n_eff,w
- SE bars by method
- deff cards
- sampling distribution of Hájek means over repeats
- **Formula interactions:** one formula per stage (see lab)
- **Semantic encodings:** groups blue/teal/violet; truth dashed black; frame amber; unweighted coral; HT violet; Hájek teal
- **Animation:** dot radius and opacity transitions 400 ms; strip markers slide
- **Responsive:** side panel hidden in Teach; <900px stacks
- **Reusable primitives:** PopulationField, SampleHighlight, PiBars, WeightHistogram, EstimateStrip, AccumulatingHistogram, DeffGauge

## D. Interaction specification

- **Direct manipulation:** hover/focus any unit for π, d, w · stage tabs · design/mech/adjust segmented controls · sliders for shares, μ_C, icc, coverage, n, a, m, rates
- **Numeric / keyboard alternatives:** all controls are buttons/sliders; readouts table; live region
- **Lockable parameters (instructor):** `population`, `frame`, `design`, `n`, `mech`, `adjust`
- **State transitions:** 10 stages; later stages include earlier settings
- **Reset & reproducibility:** new sample button; seed fixed; all randomness via `mulberry32(seed)`
- **Presets:** blocks l.sws-intro … l.sws-variance (data/blocks.js)
- **Undo/redo:** none

## E. Learning design

| Step | Activity |
|---|---|
| Predict | p.representative, p.weighting-fixes (blocks) |
| Experiment | Stage 9 outcome-dependent nonresponse → stage 10 repeats: measure remaining bias after raking |
| Explain | Why does HT/N_frame differ from Hájek on the same respondents? |
| Formalize | Write ȳ_H and compute Σw for the current sample |
| Transfer | Given an opt-in web panel with no π, which stages are undefined and why? |

**Expected observations:** coverage bias constant in n; stratification lowers SE; clustering raises it; raking fixes composition, not outcome bias

**Plausible incorrect interpretations:** 'weights remove nonresponse bias'; 'n=600 means n=600 of information'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"survey-weighting-studio", params:{groups, design, n, rho, nonresponse, adjustment, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** block configs; flat keys mapped (design, n, allocation, rho, nonresponse, adjustment)
- **Defaults:** stage 1, SRS n=120
- **Available / locked controls:** lock keys above; instructions text
- **Formula layers:** result / terms
- **Assessment integration:** a.survey-midterm, a.survey-variance (items to author)
- **Teach Mode:** zoom 1.15, panel hidden
- **Localization:** EN/HU complete
- **Library blocks using this lab** (6): `l.sws-intro`, `l.sws-designs`, `l.sws-weights`, `l.sws-nonresponse`, `l.sws-adjust`, `l.sws-variance`
- **Instructor options (registry):** Lock design; Preset populations; Hide truth until predicted; Restrict steps; Variance method shown (sim/formula/both)

## G. Quality assurance

- **Numerical validation:** R survey: svydesign/svymean (SE, deff), postStratify, rake, svytotal; 200 exported samples; tolerance 1e−6 estimates, 1 % SEs (scripts/validation/survey_reference.R — to be written)
- **Property-based tests**
- HT total unbiased over 20 000 reps (|bias|<3 SE)
- stratified closed form vs simulation SD within 5 %
- post-strat sums equal N_g to 1e−9
- rake converges on presets within 50 iterations
- **Statistical identities**
- SRS: Hájek = HT/N_frame = unweighted
- equal allocation: Σw = N_frame
- **Edge cases:** a=2 PSUs; group with zero respondents; coverage 100 %
- **Accessibility testing:** hover has focus equivalent; every number in readouts; live region; registry alternatives: Every step has a numeric alternative; Estimate strip as table; Reduced motion disables repeat animation
- **Performance:** 600 dots; repeat 1 000 < 400 ms
- **Scientific review checklist**
- survey statistician: variance method labelling; validation script before pilot
- pedagogy: stage leads reviewed
- **Registry test requirements:** HT total unbiased over 20 000 reps (|bias| < 3 SE); Stratified variance vs closed form; Post-strat weights reproduce N_c exactly; Validate SE, deff against R survey::svymean on exported sample (scripts/validation/survey_reference.R)

## H. Completion requirements

- **MVP:** ✓ built (stages 1–10, engine)
- **Production-ready:** R validation; fpc option in linearised variance; two-stage closed form
- **Pilot-ready:** assessment items; validated badge
- **Optional future extensions:** PPS, calibration (GREG) via weighting-calibration-lab engine

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | Survey weeks 1–10 |
| Classroom duration | 10 × 20 min |
| Baseline conceptual question | 'Does a 70 % response rate guarantee less bias than 30 %?' |
| Primary interaction task | stage 9–10: quantify remaining bias after raking |
| Expected learning insight | error sources are separable |
| Transfer item | opt-in panel |
| Common misconception | weights fix everything |
| Instructor demonstration preset | stage 5 then 9 |
| Technical & accessibility acceptance | keyboard; engine property tests; R validation before any grading use |

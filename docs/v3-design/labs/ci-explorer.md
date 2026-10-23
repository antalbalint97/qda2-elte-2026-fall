# Confidence Interval Explorer · Konfidencia-intervallum böngésző

`ci-explorer` · Family B — Inference & group comparisons · **Working prototype**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- State the repeated-sampling meaning of a confidence level
- Relate width to n and to the level
- Recognise that an individual interval has no frequentist probability of being right
- See that design-based intervals keep coverage under clustering while naive ones under-cover

**Target learner level.** L2

**Concepts rendered** (4): Confidence intervals (`est.confidence_interval`); Coverage probability (`est.coverage`); Precision and sample size (`est.sample_size`); Confidence interval for a difference (`group.ci_difference`)

**Prerequisite concepts** (from the graph, outside this lab): Standard error (`est.standard_error`); Central limit theorem (`est.clt`); Standard error of a difference (`group.se_difference`)

**Common misconceptions** (from the concept graph)
- There is a 95 % probability μ is in this interval
- 95 % of the data lie in the CI
- Nominal and actual coverage always agree
- Sample size should be a share of the population
- n = 1 000 is always enough
- Overlapping group CIs mean no significant difference

**Key conceptual insight.** μ is fixed; the interval is random; coverage is a property of the procedure.

**Why interactivity is justified.** Coverage cannot be seen from one interval; stacking 100 of them against one fixed line makes the long-run meaning concrete.

## B. Mathematical model

- **Input data:** population (Sampling Universe generator + cluster effects), n, level, method, design, reps
- **Parameters (configuration schema):** `level` (float), `n` (int), `method` (enum: t/wald/wilson), `design` (enum: srs/cluster), `seed` (int)
- **Estimators**
- x̄ ± t_{n−1}·s/√n; z variant
- Wald and Wilson for proportions
- cluster: x̄ ± t_{a−1}·s_c/√a with s_c from a cluster means (ultimate-cluster)
- coverage = share of intervals containing μ
- **Equations**
- half-width ≈ crit·σ/√n
- **Assumptions:** as per method; cluster method assumes equal-size clusters SRS of PSUs
- **Computational contracts**
- s=0 → interval null
- a<2 clusters → null
- coverage reported with its own SE √(c(1−c)/R) in docs; UI shows count
- **Undefined cases → null + reason:** n<2
- **Numerical limits:** finite-simulation coverage; tolerance tests only
- **Reference validation:** endpoints vs SciPy t.interval; Wilson vs statsmodels proportion_confint; coverage 2 000 reps within ±1.5 pp of nominal (t, normal pop); naive-under-cluster coverage must be < nominal−5 pp with ρ as set
- **Engine:** t-based CI for a mean; Wald/Wilson for a proportion; coverage simulation; reuses sampling-universe population

## C. Visualization design

- **Main visual metaphor:** IntervalBands stacked over one fixed reference line; misses in coral; a CoverageCounter.
- **Primary canvas:** up to 100 horizontal intervals with estimate dots; naive dashed companion under cluster design
- **Secondary synchronized representations**
- expected half-width vs n curve with the current n marked
- interpretation card + method label
- **Formula interactions:** per method
- **Semantic encodings:** covers #20BFA9, misses #C8694F, μ dashed #101B2B, naive dashed #8A94A3/#D9A441
- **Animation:** new intervals fade in; reduced motion instant
- **Responsive:** stacks <900px
- **Reusable primitives:** CIBars, CoverageCounter, ParameterControl

## D. Interaction specification

- **Direct manipulation:** draw 1/20/100 · long run ×2 000 · n and level sliders
- **Numeric / keyboard alternatives:** all controls are buttons/sliders
- **Lockable parameters (instructor):** `population`, `n`, `level`, `design`
- **State transitions:** population → n/level → method → design → draws
- **Reset & reproducibility:** clears intervals; all randomness via `mulberry32(seed)`
- **Presets:** normal n=30 95 % · binary Wald vs Wilson n=30 · cluster trap
- **Undo/redo:** none

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Of 100 intervals at 95 %, how many will miss μ? Exactly 5?' |
| Experiment | Draw 100 at 95 % and at 80 %; compare width and misses |
| Explain | Why does the counter not sit exactly on 95? |
| Formalize | Half-width = t·s/√n: quadruple n, halve the width |
| Transfer | Cluster design: which interval keeps its promise, and what does the naive one assume? |

**Expected observations:** misses ≈ 5 ± 2 per 100; naive under-covers under clustering

**Plausible incorrect interpretations:** '95 % chance μ is in this interval'; '95 % of the data are in the CI'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"ci-explorer", params:{level, n, method, design, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** three above
- **Defaults:** normal, n=30, 95 %, t, SRS
- **Available / locked controls:** lock population/n/level/design
- **Formula layers:** result
- **Assessment integration:** prediction block; CI items to be authored
- **Teach Mode:** zoom 1.15
- **Localization:** EN/HU complete
- **Library blocks using this lab** (2): `l.ci-explorer`, `x.ci-cluster-trap`
- **Instructor options (registry):** Fix level; Show/hide the width formula; Preset the cluster trap

## G. Quality assurance

- **Numerical validation:** endpoints vs SciPy t.interval; Wilson vs statsmodels proportion_confint; coverage 2 000 reps within ±1.5 pp of nominal (t, normal pop); naive-under-cluster coverage must be < nominal−5 pp with ρ as set
- **Property-based tests**
- t endpoints vs SciPy to 1e−9
- long-run coverage within tolerance (seeded)
- Wilson ≥ Wald coverage at p=.05
- **Statistical identities**
- width ∝ 1/√n
- **Edge cases:** n=5; level .5; binary p̂=0
- **Accessibility testing:** buttons/sliders only; counter in live region; registry alternatives: Each interval listed with hit/miss; Counter announced
- **Performance:** 2 000 reps <300 ms
- **Scientific review checklist**
- statistician ✓ cluster method stated
- pedagogy ✓ interpretation card
- **Registry test requirements:** t-CI coverage within 94–96 % over 20 000 reps; Wilson vs Wald coverage at p = .05, n = 30

## H. Completion requirements

- **MVP:** ✓ built
- **Production-ready:** lock schema wired; repo tests
- **Pilot-ready:** Predict block exists (p.se-n); add CI items
- **Optional future extensions:** survey designs beyond equal clusters via QDA2Survey

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 7; Survey week 10 |
| Classroom duration | 20 min |
| Baseline conceptual question | 'What does 95 % mean?' free text |
| Primary interaction task | count misses in 100 at two levels |
| Expected learning insight | procedure-level coverage |
| Transfer item | cluster trap |
| Common misconception | probability about this interval |
| Instructor demonstration preset | cluster trap |
| Technical & accessibility acceptance | keyboard; tolerance tests |

# Hypothesis Testing Lab · Hipotézisvizsgálat labor

`hypothesis-lab` · Family B — Inference & group comparisons · **Existing partial implementation (repo code to refactor)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Build a test statistic from difference, spread and n
- Read a p-value as a tail area of the null distribution
- Trade α against β and see power grow with n and effect size
- Recognise the family-wise error inflation of many tests

**Target learner level.** L2–L3

**Concepts rendered** (10): Null and alternative hypotheses (`infer.hypotheses`); Test statistics (`infer.test_statistic`); Null distributions (`infer.null_distribution`); One- and two-sided tests (`infer.sidedness`); p-values (`infer.p_value`); Type I and Type II errors (`infer.errors`); Statistical power (`infer.power`); Multiple comparisons (`infer.multiple_comparisons`); Statistical vs substantive significance (`infer.significance_vs_substantive`); Effect sizes (`infer.effect_size`)

**Prerequisite concepts** (from the graph, outside this lab): Parameters and statistics (`est.parameters`); Standard error (`est.standard_error`); Sampling distributions (`est.sampling_distribution`); Conditional probability (`prob.conditional`); Precision and sample size (`est.sample_size`); Standard deviation (`desc.sd`)

**Common misconceptions** (from the concept graph)
- H₀ is what the researcher believes
- Rejecting H₀ proves H₁
- A large statistic is itself the p-value
- t and r are unrelated
- The null distribution describes the data
- It is the distribution under H₁
- Switching to one-sided after seeing the direction is harmless
- p is the probability H₀ is true

**Key conceptual insight.** The null distribution is the sampling distribution under H₀; the p-value is a tail area of it, nothing more.

**Why interactivity is justified.** Shading moves with the observed statistic; sliding the true effect shows that 'non-significant' is not 'no effect'.

## B. Mathematical model

- **Input data:** effect δ (in SD units), n, α, sidedness, m tests; seed
- **Parameters (configuration schema):** `effect` (float), `n` (int), `alpha` (float), `sided` (enum: 1/2), `m` (int), `seed` (int)
- **Estimators**
- t = x̄/(s/√n) for simulated null studies
- power(δ,n,α) via noncentral t (exact) — implemented as Owen's algorithm or, if not, labelled 'normal approximation'
- family-wise error 1−(1−α)^m
- **Equations**
- p = P(|T|≥t_obs | H₀) via tTwoTailedP
- α = P(reject|H₀), β = P(not reject|H₁)
- **Assumptions:** normal population for exact power; simulation otherwise
- **Computational contracts**
- simulateNullT(n,sd,threshold,seed,total) reused from repo; returns empirical share
- power returns {value, method:'nct'|'normal-approx'} — the method label is mandatory in the UI
- **Undefined cases → null + reason:** n<2; - α∉(0,1)
- **Numerical limits:** nct accuracy ≥1e−6 if implemented; else approximation error documented
- **Reference validation:** SciPy t.sf; scipy.stats.nct for power at 12 (δ,n) points; FWER closed form
- **Engine:** simulateNullT, tCdf, tCritical, power via noncentral approximation (validate vs SciPy nct)

## C. Visualization design

- **Main visual metaphor:** Two SamplingDistributionPlots (H₀ and H₁) sharing one axis; α, β, power are ProbabilityRegions on them.
- **Primary canvas:** H₀ curve with shaded tails at the draggable critical value; H₁ curve shifted by δ√n with β shaded; observed t as a line
- **Secondary synchronized representations**
- simulated null histogram (500 studies) with observed t and empirical tail share
- power curve vs n for three δ
- m-test grid: 20 null tests, false positives flagged across seeds
- **Formula interactions:** keys: diff, s, n, se, t, crit, alpha, beta, power, p
- **Semantic encodings:** H₀ #101B2B, tails #ED896F; H₁ #9688E8, β region #D9A441 outline; observed t #C8694F
- **Animation:** critical value drag re-shades both regions live; n slider moves H₁ apart (550 ms)
- **Responsive:** two curves stack under 900px
- **Reusable primitives:** TwoCurveShade, NullHistogram, PowerCurve, ParameterControl

## D. Interaction specification

- **Direct manipulation:** drag critical value · drag δ · drag observed t · n slider
- **Numeric / keyboard alternatives:** numbers for all; buttons for sidedness
- **Lockable parameters (instructor):** `alpha`, `sided`, `effect`, `n`
- **State transitions:** H₀ only → H₁ shown → power → multiple tests
- **Reset & reproducibility:** preset; all randomness via `mulberry32(seed)`
- **Presets:** δ=0 (true null), n=20 · δ=.5, n=20 vs n=80 · one- vs two-sided at the same t · m=20 null tests
- **Undo/redo:** none

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Same t, one-sided instead of two-sided: p halves, doubles or stays?' |
| Experiment | Fix δ=.5; raise n until power ≥ .8; record n |
| Explain | Why does moving the critical value left raise power but also α? |
| Formalize | Write p as a tail area and compute it for t=2.1, df=19 |
| Transfer | A survey with n=50 000 finds r=.03, p<.001: use the lab to show what 'significant' means here |

**Expected observations:** p shrinks with n at fixed effect; 20 null tests give about one false positive

**Plausible incorrect interpretations:** 'p is P(H₀)'; 'p>.05 proves no effect'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"hypothesis-lab", params:{effect, n, alpha, sided, m, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** four above
- **Defaults:** δ=0, n=20, α=.05, two-sided
- **Available / locked controls:** lock α; hide power until 'reveal'
- **Formula layers:** terms / derivation
- **Assessment integration:** prediction; quiz items p-meaning, p-nonsig, p-n
- **Teach Mode:** curves full-width
- **Localization:** dictionary
- **Library blocks using this lab** (1): `l.hypothesis-null`
- **Instructor options (registry):** Lock α; Hide power until Phase 2 of lesson; Scenario text

## G. Quality assurance

- **Numerical validation:** SciPy t.sf; scipy.stats.nct for power at 12 (δ,n) points; FWER closed form
- **Property-based tests**
- simulated tail share within 2 SE of p (50 seeds)
- power monotone in n and δ
- FWER formula vs simulation
- **Statistical identities**
- two-sided p = 2·one-sided p for symmetric t
- **Edge cases:** n=2; δ=0; α=.001
- **Accessibility testing:** regions reported as numbers; critical value slider; registry alternatives: All handles keyboard-adjustable; Shaded areas reported as numbers
- **Performance:** 500-study simulation <20 ms
- **Scientific review checklist**
- statistician: power method labelled honestly
- pedagogy: avoid 'accept H₀' language
- **Registry test requirements:** p vs SciPy t.sf; Power vs SciPy nct at 12 points; Simulated null tail share within 2 SE of p

## H. Completion requirements

- **MVP:** H₀/H₁ curves, p shading, simulation (repo code), presets 1–3
- **Production-ready:** power (nct or labelled approx), m-tests, lock schema, i18n
- **Pilot-ready:** Predict/Transfer authored
- **Optional future extensions:** Bayesian overlay (posterior) as contrast

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 8 |
| Classroom duration | 25 min |
| Baseline conceptual question | 'What does p=.03 mean?' (p-meaning item) |
| Primary interaction task | find n for power .8 at δ=.5 |
| Expected learning insight | p is a tail area; power depends on n |
| Transfer item | large-N survey correlation |
| Common misconception | p = P(H₀) |
| Instructor demonstration preset | preset 2 |
| Technical & accessibility acceptance | keyboard; fixtures pass; power method label visible |

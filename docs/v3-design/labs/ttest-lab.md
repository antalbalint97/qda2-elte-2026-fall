# Mean Comparison & t-Test Lab · Átlag-összehasonlítás és t-próba labor

`ttest-lab` · Family B — Inference & group comparisons · **Working prototype**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Decompose t into an estimated difference and its standard error and manipulate each
- Choose one-sample, paired or independent designs from the data structure
- Use Welch as default and treat Levene as a diagnostic
- Report difference, CI, t, df, p and g together

**Target learner level.** L2

**Concepts rendered** (9): Mean differences (`group.mean_difference`); Standard error of a difference (`group.se_difference`); One-sample t-test (`group.t_one_sample`); Paired t-test (`group.t_paired`); Independent-samples t-test (`group.t_independent`); Welch t-test (`group.welch_t`); Confidence interval for a difference (`group.ci_difference`); Cohen's d and Hedges' g (`group.cohens_d`); Assumptions and robustness (`infer.assumptions`)

**Prerequisite concepts** (from the graph, outside this lab): The mean as a model (`desc.mean`); Distribution comparisons (`desc.distribution_comparison`); Standard error (`est.standard_error`); Test statistics (`infer.test_statistic`); Null distributions (`infer.null_distribution`); Confidence intervals (`est.confidence_interval`); Effect sizes (`infer.effect_size`)

**Common misconceptions** (from the concept graph)
- A difference in sample means is a difference in population means
- SEs add (variances add)
- Pooling is always better
- μ₀ comes from the sample
- Paired and independent tests give the same answer on the same numbers
- Significant t means a large difference
- Needs equal n
- Welch is only for when Levene is significant

**Key conceptual insight.** The mean difference alone decides nothing; t is the difference measured in standard-error units.

**Why interactivity is justified.** Dragging a mean handle (numerator) and a spread handle (denominator) separately makes the two sources of 'significance' independent and visible.

## B. Mathematical model

- **Input data:** group 1 (n₁≤40), group 2 (n₂≤40) or μ₀; design
- **Parameters (configuration schema):** `design` (enum: one/paired/independent), `n1` (int), `n2` (int), `mu0` (float), `showWelch` (boolean), `seed` (int)
- **Estimators**
- oneSampleT, independentT (Student+Welch+Hedges g+Levene), pairedT — qda2-stats.js, SPSS-row conventions
- 95 % CI with t critical by bisection
- **Equations**
- t=(x̄₁−x̄₂)/√(s₁²/n₁+s₂²/n₂) (Welch), df Welch–Satterthwaite
- t=(x̄₁−x̄₂)/√(s_p²(1/n₁+1/n₂)), df=n₁+n₂−2
- paired: t=d̄/(s_d/√n)
- g = d·(1−3/(4N−9))
- **Assumptions:** independence; approximate normality of means; equal variances for Student only
- **Computational contracts**
- n<2 in any group → t null, SE null
- s=0 → t null (zero SE), displayed as '—' with note
- power is NOT computed (no nct claim)
- **Undefined cases → null + reason:** identical constant groups
- **Numerical limits:** incomplete beta 3e−12
- **Reference validation:** SciPy ttest_ind(equal_var=True/False), ttest_rel, ttest_1samp; SPSS 27 rows for g; Levene vs scipy.stats.levene(center='mean')
- **Engine:** oneSampleT, independentT (Student+Welch), pairedT, hedgesG, leveneTest (stats.ts)

## C. Visualization design

- **Main visual metaphor:** Two dot columns with mean handles; the difference as a coral arrow; t as a visual fraction (bar over bar); SE_diff as Pythagoras of two SE squares.
- **Primary canvas:** GroupComparison: observations, SD brackets, CI bands, x̄ and s handles, μ₀ line (one-sample), PairedDifference links (paired)
- **Secondary synchronized representations**
- t-fraction panel: numerator bar / denominator bar = t
- SE² squares: s₁²/n₁ + s₂²/n₂ = SE²_diff
- null t(df) with shaded two tails and observed t
- Student vs Welch side-by-side table with Levene as footnote
- **Formula interactions:** per design (see lab)
- **Semantic encodings:** group 1 #548FD0, group 2 #20BFA9, difference #C8694F, SE #6A5BC9, tails #ED896F
- **Animation:** 550 ms on handles; instant while dragging; reduced motion none
- **Responsive:** side panel hidden in Teach; <900px stacks
- **Reusable primitives:** DraggableObservation, GroupBracket, SEPythagoras, OverlapCurves

## D. Interaction specification

- **Direct manipulation:** drag points (y) · drag x̄ handle (shifts group) · drag s handle (scales about x̄) · drag μ₀ · ±n buttons
- **Numeric / keyboard alternatives:** arrow keys on every handle (Shift ×5) · group number readouts; μ₀ slider
- **Lockable parameters (instructor):** `design`, `n`
- **State transitions:** design → data → procedure (Student/Welch)
- **Reset & reproducibility:** seeded regenerate; scenarios no-difference / unequal spread; all randomness via `mulberry32(seed)`
- **Presets:** base (means 48/58, s 11) · nodiff · unequal (s 6 vs 18)
- **Undo/redo:** none

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Halve the spread of both groups without moving the means: does t double?' |
| Experiment | Drag group 2's x̄ until p crosses .05; then quadruple n and see where p lands |
| Explain | Why does Welch's df fall when the variances differ? |
| Formalize | Write t = diff/SE and verify numerator and denominator from the readouts |
| Transfer | ANOVA with k=2: show that F = t² on the same data in the VRA lab |

**Expected observations:** t ∝ 1/spread; CI of the difference excludes 0 ⇔ p<.05

**Plausible incorrect interpretations:** 'Levene decides the row'; 'big difference = significant'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"ttest-lab", params:{design, n1, n2, mu0, showWelch, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** three above
- **Defaults:** independent, n=12/12, Welch
- **Available / locked controls:** lock design, n; hide Levene
- **Formula layers:** result / terms
- **Assessment integration:** t-paired, t-one, t-ind, t-effect items (t-levene/t-output flagged for revision)
- **Teach Mode:** zoom 1.15, panel hidden
- **Localization:** EN/HU complete
- **Library blocks using this lab** (1): `l.ttest-lab`
- **Instructor options (registry):** Fix design; Hide Levene (teach Welch-by-default); Preset data

## G. Quality assurance

- **Numerical validation:** SciPy ttest_ind(equal_var=True/False), ttest_rel, ttest_1samp; SPSS 27 rows for g; Levene vs scipy.stats.levene(center='mean')
- **Property-based tests**
- Student vs SciPy on 20 random pairs to 1e−9 (t,df,p)
- Welch df vs SciPy
- paired = one-sample on differences
- **Statistical identities**
- k=2 ANOVA F = t²
- **Edge cases:** n=2; s=0; identical groups
- **Accessibility testing:** role=slider handles with aria-valuenow; live region; readouts table; registry alternatives: Group-level number inputs; Readouts in a table
- **Performance:** <2 ms
- **Scientific review checklist**
- statistician ✓ (SPSS rows)
- pedagogy: Welch-by-default text reviewed
- **Registry test requirements:** Student/Welch t, df, p vs SciPy ttest_ind(equal_var); hedgesG vs reference; Paired = one-sample on differences (identity)

## H. Completion requirements

- **MVP:** ✓ built
- **Production-ready:** lock schema wired (design, n); add unit tests to repo on port
- **Pilot-ready:** Predict/Transfer blocks exist (p.sep-spread analog needed: add 'p.halve-spread')
- **Optional future extensions:** power panel once nct is implemented and validated

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 9 |
| Classroom duration | 30 min |
| Baseline conceptual question | t-ind item |
| Primary interaction task | reach p<.05 by spread alone |
| Expected learning insight | t = difference/SE |
| Transfer item | F = t² |
| Common misconception | Levene gate |
| Instructor demonstration preset | unequal preset, Welch |
| Technical & accessibility acceptance | keyboard; SciPy parity |

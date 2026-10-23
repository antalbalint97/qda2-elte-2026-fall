# ANOVA Studio · ANOVA stúdió

`anova-studio` · Family B — Inference & group comparisons · **Fully designed (no code yet)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Extend one-way ANOVA to k groups and post-hoc comparisons with multiplicity control
- Read an interaction as non-parallel lines in a 2×2 design
- Choose Welch ANOVA when spreads differ
- See repeated measures as removing subject variance

**Target learner level.** L2–L3

**Concepts rendered** (9): One-way ANOVA (`group.anova_oneway`); F distribution (`group.f_distribution`); Post-hoc comparisons (`group.post_hoc`); Two-way ANOVA and interactions (`group.anova_twoway`); Welch ANOVA (`group.welch_anova`); Repeated measures introduction (`group.repeated_measures`); Eta squared (`group.eta_squared`); Multiple comparisons (`infer.multiple_comparisons`); Categorical predictors (dummy variables) (`model.categorical_predictors`)

**Prerequisite concepts** (from the graph, outside this lab): Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`); Null distributions (`infer.null_distribution`); Variance (`desc.variance`); Welch t-test (`group.welch_t`); Paired t-test (`group.t_paired`); Effect sizes (`infer.effect_size`); Type I and Type II errors (`infer.errors`); Multiple regression (`model.multiple_regression`)

**Common misconceptions** (from the concept graph)
- ANOVA tells which groups differ
- F < 1 is impossible
- F is symmetric like t
- Only large df give valid p
- Run all pairwise t-tests at .05 instead
- Interaction means the factors are correlated
- Main effects are interpretable regardless of interaction
- Classic ANOVA is robust to any variance heterogeneity

**Key conceptual insight.** F compares two variance estimates; everything after F is about which means differ and how much error you can remove.

**Why interactivity is justified.** Interaction and post-hoc logic are invisible in tables; draggable cell means and a live forest plot make them manipulable.

## B. Mathematical model

- **Input data:** groups y_ij (k≤5), factor B for two-way, subject id for RM; seed
- **Parameters (configuration schema):** `k` (int), `design` (enum: oneway/twoway/rm), `correction` (enum: none/tukey/bonferroni/gameshowell), `seed` (int)
- **Estimators**
- anova() from qda2-stats (reused, not duplicated)
- Tukey HSD: q = (ȳᵢ−ȳⱼ)/√(MSW/n_h), p from studentised range (Copenhaver–Holland); Bonferroni; Games–Howell with Welch df
- Welch F with df₂ from Welch (1951)
- two-way SS (balanced): SSA, SSB, SSAB, SSW; unbalanced flagged 'Type II not implemented'
- RM: SSW = SSsubjects + SSerror; F = MSbetween/MSerror
- **Equations**
- F = MSB/MSW
- η² = SSB/SST; ω² = (SSB−dfB·MSW)/(SST+MSW)
- **Assumptions:** independence; normality within groups; equal variances (classic) or not (Welch)
- **Computational contracts**
- k<2 or any n<2 → F null (tooSmall)
- unbalanced two-way → interaction SS not shown, note displayed
- studentised range p null if df<2
- **Undefined cases → null + reason:** MSW=0; - single subject in RM
- **Numerical limits:** studentised range to 1e−5
- **Reference validation:** SciPy f_oneway; statsmodels pairwise_tukeyhsd; R oneway.test (Welch); statsmodels anova_lm two-way balanced; R aov Error(subject) for RM
- **Engine:** anova() from qda2-stats.js + Tukey HSD (studentised range, validate vs statsmodels), Welch ANOVA, two-way SS, RM decomposition

## C. Visualization design

- **Main visual metaphor:** The VRA stage-3 picture (BetweenGroupBar, SquaredDeviation) extended; pairwise differences as IntervalBands in a forest plot.
- **Primary canvas:** k group columns with draggable observations and mean handles; between-group bars and within squares as in VRA
- **Secondary synchronized representations**
- ForestPlot of pairwise mean differences with CI (none/Tukey/Bonferroni/Games–Howell) and zero line
- InteractionPlot for 2×2: four draggable cell means, two lines
- F(d₁,d₂) tail with observed F
- RM view: subject lines; error squares shrink when 'remove subject variance' toggles
- **Formula interactions:** keys: ssb, ssw, msb, msw, F, q, crit, eta, omega
- **Semantic encodings:** between #9688E8, within #ED896F (as VRA); CI bands #6A5BC9; interaction lines per level of B
- **Animation:** CI widths animate on correction switch; interaction lines rotate as cell means move
- **Responsive:** forest plot below canvas <900px
- **Reusable primitives:** VRA primitives, ForestPlot, InteractionPlot

## D. Interaction specification

- **Direct manipulation:** drag observations and mean handles · drag cell means in the interaction plot · toggle correction · toggle subject lines
- **Numeric / keyboard alternatives:** cell means as a number grid · correction buttons
- **Lockable parameters (instructor):** `k`, `design`, `correction`
- **State transitions:** one-way → post-hoc → two-way → RM
- **Reset & reproducibility:** preset; all randomness via `mulberry32(seed)`
- **Presets:** 3 education groups (VRA data) · 5 groups equal means · 2×2 crossing interaction · RM pre/mid/post
- **Undo/redo:** none

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'After a significant F with 5 groups, how many pairwise tests at .05 would you expect to be false positives if all means were equal?' |
| Experiment | Switch correction none → Tukey; count the pairs whose CI now crosses 0 |
| Explain | Why do the subject lines make the error squares smaller? |
| Formalize | Write SST = SSA + SSB + SSAB + SSW for the 2×2 preset and verify the sums |
| Transfer | Stratified survey sampling: which ANOVA component does stratification remove from the SE? |

**Expected observations:** Tukey widens CIs; crossing lines = interaction

**Plausible incorrect interpretations:** 'significant F tells which groups differ'; 'interaction means factors are correlated'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"anova-studio", params:{k, design, correction, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** four above
- **Defaults:** 3 groups one-way
- **Available / locked controls:** lock design; hide post-hoc until F significant
- **Formula layers:** terms / derivation
- **Assessment integration:** prediction; a-eta, a-two-way items
- **Teach Mode:** canvas + forest
- **Localization:** dictionary
- **Library blocks using this lab** (0): —
- **Instructor options (registry):** Fix k; Hide post-hoc until F significant; Preset interaction patterns

## G. Quality assurance

- **Numerical validation:** SciPy f_oneway; statsmodels pairwise_tukeyhsd; R oneway.test (Welch); statsmodels anova_lm two-way balanced; R aov Error(subject) for RM
- **Property-based tests**
- SST = SSB + SSW to 1e−9
- Tukey p vs statsmodels at 20 configurations
- Welch F vs R at 10
- **Statistical identities**
- one-way with k=2: F = t² (Student)
- **Edge cases:** k=2; n=2 per group; identical groups; unbalanced two-way (flag)
- **Accessibility testing:** cell grid primary; forest as table; registry alternatives: Cell means as number grid; Forest plot as table
- **Performance:** <5 ms per update
- **Scientific review checklist**
- statistician: unbalanced two-way handling stated
- pedagogy: post-hoc hidden until F
- **Registry test requirements:** One-way vs SciPy f_oneway; Tukey vs statsmodels pairwise_tukeyhsd; Two-way SS sum to SST (balanced)

## H. Completion requirements

- **MVP:** k groups, Tukey/Bonferroni forest, F tail
- **Production-ready:** two-way balanced, Welch, RM, Games–Howell, lock schema
- **Pilot-ready:** Predict/Transfer authored
- **Optional future extensions:** Type II/III SS; mixed designs

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 10 (second half) |
| Classroom duration | 25 min |
| Baseline conceptual question | a-eta item |
| Primary interaction task | make the interaction disappear by dragging one cell mean |
| Expected learning insight | F then post-hoc; interaction = non-parallel |
| Transfer item | stratification ↔ SSB |
| Common misconception | F locates the difference |
| Instructor demonstration preset | preset 3 |
| Technical & accessibility acceptance | keyboard; identities pass |

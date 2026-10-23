# QDA2 Laboratory Registry (Layer 2)

Generated from `data/labs.js`. 20 laboratories. Status: **built** = working in this project; **repo** = engine and partial interactives exist in the Next.js repository and are to be refactored onto shared primitives; **spec** = specified, not yet implemented.

All labs share the VRA primitives (DraggableObservation, ReferenceLine, DeviationSegment, SquaredDeviation, DecompositionBar, FormulaInspector, StatisticReadout, ParameterControl) plus a small set of new shared components listed per lab. Visual continuity rule: a squared deviation looks the same in Distribution Studio, the t-Test Lab and the Weighting Studio.

| Lab | Status | Engine | Concepts |
|---|---|---|---|
| Variance · Regression · ANOVA Lab (`vra-lab`) | built | qda2-stats.js: describe(), fit(), sseLine(), anova(), fP() | 13 |
| Distribution Studio (`distribution-studio`) | repo | normalPdf/normalCdf, tPdf/tCdf, binomial pmf, Poisson pmf, fP, chiSqua | 10 |
| Probability Playground (`probability-playground`) | spec | Exact enumeration for finite sample spaces | 6 |
| Expected Value Lab (`expected-value-lab`) | spec | Discrete distribution E, Var | 4 |
| Sampling Universe (`sampling-universe`) | built | Finite synthetic population (seeded) | 15 |
| Confidence Interval Explorer (`ci-explorer`) | spec | t-based CI for a mean | 4 |
| Hypothesis Testing Lab (`hypothesis-lab`) | repo | simulateNullT, tCdf, tCritical, power via noncentral approximation (va | 10 |
| Mean Comparison & t-Test Lab (`ttest-lab`) | repo | oneSampleT, independentT (Student+Welch), pairedT, hedgesG, leveneTest | 9 |
| ANOVA Studio (`anova-studio`) | spec | anova() from qda2-stats.js + Tukey HSD (studentised range, validate vs | 9 |
| Categorical Data Lab (`categorical-lab`) | repo | chiSquareTest, chiSquareP (stats.ts) + odds ratio with CI, Fisher exac | 9 |
| Lazarsfeld & Simpson Lab (`lazarsfeld-simpson-lab`) | repo | Partial-table arithmetic | 6 |
| Correlation & Regression Lab (`corr-reg-lab`) | repo | pearson, spearman, correlationP, linearFit (stats.ts) | 11 |
| Survey Sampling Design Studio (`survey-design-studio`) | spec | Frame/population overlay | 6 |
| Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`) | spec | Finite synthetic population with subgroups | 20 |
| Weighting & Calibration Lab (`weighting-calibration-lab`) | spec | GREG/linear calibration, raking with convergence trace, bounded weight | 5 |
| Complex Survey Inference Lab (`complex-survey-lab`) | spec | Design-based variance: stratified-cluster with-replacement ultimate-cl | 9 |
| Measurement & Index Lab (`measurement-index-lab`) | repo | cronbachAlpha, itemTotalStatistics (reliability.ts) | 10 |
| Linear Algebra & PCA Studio (`linalg-pca-studio`) | spec | 2×2/3×3 matrix ops | 8 |
| Mathematical Foundations Studio (`math-studio`) | spec | Symbolic-free numeric function plotter | 10 |
| Model Diagnostics Studio (`model-diagnostics-studio`) | spec | linearFit + leverage, Cook's D, HC3 robust SE, VIF | 7 |

## Variance · Regression · ANOVA Lab · Variancia · Regresszió · ANOVA labor

`vra-lab` · status **built** · `QDA2 Lab.dc.html`

- **Core engine:** qda2-stats.js: describe(), fit(), sseLine(), anova(), fP()
- **Educational concepts:** The mean as a model (`desc.mean`); Variance (`desc.variance`); Standard deviation (`desc.sd`); Least squares (as a mathematical principle) (`math.least_squares`); Linear regression (`model.linear_regression`); Least squares estimation (`model.least_squares`); Residuals (`model.residuals`); Model fit: SST = SSR + SSE (`model.sst`); R-squared (`model.r_squared`); Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`); One-way ANOVA (`group.anova_oneway`); Eta squared (`group.eta_squared`); F distribution (`group.f_distribution`)
- **Interaction model:** Drag observations (y all stages, x stage 2, group stage 3); layer stepper; custom-line handles; sep/spread sliders; formula term inspector.
- **Visual representations:** Dot plot with deviation segments and true squares; Scatter with prediction line and residual squares; Three-group plot with between-group bars; Decomposition bar; Formula inspector; Statistic readouts
- **Statistical outputs:** x̄, SS, s², s; a, b, r, R², SST, SSE, SSR; SSB, SSW, MSB, MSW, F, p, η²
- **Configurable parameters:** `stage` (enum: 1/2/3), `scenario` (enum: base/flat/noisy/steep), `popVar` (boolean), `showSq` (boolean), `pred` (enum: mean/custom/ols), `av` (enum: total/within/between/both), `compare` (boolean)
- **Instructor options:** Lock stage; Hide formula panel; Preset data (15 obs, 3 groups); Choose visible readouts; Learn-mode prompt text; Language; Present zoom
- **Accessibility alternatives:** Observations are role=slider with arrow keys; Number inputs mirror drags; Live region announces statistics; No information by colour alone
- **Reusable components:** DraggableObservation, ReferenceLine, DeviationSegment, SquaredDeviation, BetweenGroupBar, DecompositionBar, FormulaInspector, StatisticReadout
- **Test requirements:** SciPy fixtures for SST/SSB/SSW/F/p; Identities Σdev=0, SST=SSR+SSE, SST=SSB+SSW; Edge: constant x, constant y, empty group

## Distribution Studio · Eloszlás-stúdió

`distribution-studio` · status **repo**

- **Core engine:** normalPdf/normalCdf, tPdf/tCdf, binomial pmf, Poisson pmf, fP, chiSquareP (stats.ts) + empirical histogram/quantiles
- **Educational concepts:** Probability distributions (`prob.distributions`); Bernoulli, binomial, normal and Poisson distributions (`prob.named_distributions`); The normal distribution (`prob.normal`); Probability density and cumulative distribution (`prob.density`); Quantiles and percentiles (`desc.quantiles`); Skewness and outliers (`desc.skewness`); Interquartile range (`desc.iqr`); Standardization (z-scores) (`desc.standardization`); F distribution (`group.f_distribution`); Variable transformations (`data.transformations`)
- **Interaction model:** Choose a family; drag parameter handles directly on the curve (mean handle, SD bracket); drag a shading interval; overlay a sample histogram; apply a transformation to data.
- **Visual representations:** PDF/PMF with shaded interval; Linked CDF; Sample histogram overlay with boxplot; z-ruler
- **Statistical outputs:** P(a<X≤b); Quantiles; Mean, SD, skewness of overlaid sample
- **Configurable parameters:** `family` (enum: normal/t/binomial/poisson/F/chi2/uniform), `theta` (object), `interval` (range), `sampleN` (int), `transform` (enum: none/log/z/rank)
- **Instructor options:** Restrict families; Fixed vs free parameters; Show/hide CDF; Preset intervals
- **Accessibility alternatives:** Parameter number inputs; Interval endpoints keyboard-adjustable; Table alternative for the curve
- **Reusable components:** DistributionChart (repo), ShadedInterval, ParameterControl, QuantileRuler
- **Test requirements:** pdf/cdf vs SciPy at 20 points per family; Quantile inverse round-trip; Binomial→normal approximation error bound

## Probability Playground · Valószínűség-játszótér

`probability-playground` · status **spec**

- **Core engine:** Exact enumeration for finite sample spaces; seeded simulation (mulberry32)
- **Educational concepts:** Events and sample spaces (`prob.events`); Independence (`prob.independence`); Conditional probability (`prob.conditional`); Bayes' theorem (`prob.bayes`); Discrete and continuous random variables (`prob.random_variable`); Likelihood functions (`prob.likelihood`)
- **Interaction model:** Eikosogram/area model: drag partition lines to set P(B) and P(A|B); natural-frequency tree with draggable base rate; run simulations.
- **Visual representations:** Unit-square area model; Frequency tree (1 000 people); Venn/sample-space grid; Simulation tally
- **Statistical outputs:** P(A), P(B), P(A∩B), P(A|B), P(B|A); Posterior; Empirical vs exact
- **Configurable parameters:** `mode` (enum: area/tree/grid), `pB` (float), `pAgivenB` (float), `pAgivenNotB` (float), `seed` (int)
- **Instructor options:** Scenario text (disease test, voter turnout); Lock to one view; Hide exact values until reveal
- **Accessibility alternatives:** All partitions settable by number; Tree read as nested list
- **Reusable components:** AreaModel, FrequencyTree, SimTally
- **Test requirements:** Bayes identity exact to 1e-12; Simulation converges within 3 SE for 10 000 draws

## Expected Value Lab · Várható érték labor

`expected-value-lab` · status **spec**

- **Core engine:** Discrete distribution E, Var; seeded simulation; running mean
- **Educational concepts:** Expected value and variance of a random variable (`prob.expected_value`); Law of large numbers (`prob.lln`); Weighted averages (`desc.weighted_mean`); Discrete and continuous random variables (`prob.random_variable`)
- **Interaction model:** Build a payoff table (outcomes, probabilities, values); drag bars; run 1 … 10 000 draws; watch the running mean settle.
- **Visual representations:** Payoff bars with balance-point marker; Running-mean trace; Histogram of simulated outcomes
- **Statistical outputs:** E[X], Var(X), SD; Running mean, deviation from E
- **Configurable parameters:** `outcomes` (array), `draws` (int), `seed` (int)
- **Instructor options:** Preset games (lottery, insurance, dice); Hide E until predicted
- **Accessibility alternatives:** Table editing; Running mean announced at milestones
- **Reusable components:** PayoffBars, RunningMeanTrace, SimTally
- **Test requirements:** E and Var exact for presets; Running mean within 3·SD/√n at n = 10 000

## Sampling Universe · Mintavételi univerzum

`sampling-universe` · status **built** · `QDA2 Sampling Universe.dc.html`

- **Core engine:** Finite synthetic population (seeded); SRS without replacement; sample statistics; sampling distribution accumulation; bootstrap resample
- **Educational concepts:** Populations and samples (`est.population_sample`); Parameters and statistics (`est.parameters`); Sampling variation (`est.sampling_variation`); Sampling distributions (`est.sampling_distribution`); Central limit theorem (`est.clt`); Standard error (`est.standard_error`); Point estimation (`est.point_estimation`); Estimator bias and consistency (`est.bias`); Consistency and precision (`est.consistency`); Bootstrap introduction (`est.bootstrap`); Law of large numbers (`prob.lln`); Simple random sampling (`survey.srs`); Finite population correction (`survey.fpc`); Regression uncertainty (`model.regression_uncertainty`); Experimental vs observational data (`practice.experimental_vs_observational`)
- **Interaction model:** Population shape selector (normal, skewed, bimodal, binary); n slider; Draw 1 / 100 / 1 000; choose statistic (mean, median, SD n vs n−1, proportion); toggle theoretical SE curve; bootstrap from the current sample.
- **Visual representations:** Population strip (all N units); Current sample with its statistic; Accumulating sampling distribution of the statistic; Theory overlay N(μ, σ²/n)
- **Statistical outputs:** μ, σ (population); x̄, s (sample); Mean and SD of the sampling distribution vs SE formula; Bias of s²(n) vs s²(n−1)
- **Configurable parameters:** `population` (enum: normal/skewed/bimodal/binary), `N` (int), `n` (int), `statistic` (enum: mean/median/var_n/var_n1/proportion), `seed` (int), `showTheory` (boolean)
- **Instructor options:** Fix population; Fix n or allow a range; Hide theory overlay until reveal; Preset experiment sequence
- **Accessibility alternatives:** Draw buttons and number inputs; no drag required; Live region: statistic and running SD after each batch; Reduced motion: dots appear without animation
- **Reusable components:** PopulationStrip, SampleDots, AccumulatingHistogram, TheoryOverlay, ParameterControl
- **Test requirements:** Mean of 10 000 x̄ within 3·σ/√(n·10 000) of μ; SD of sampling distribution within 5 % of σ/√n·√(1−n/N); Bias of s²(n) ≈ −σ²/n

## Confidence Interval Explorer · Konfidencia-intervallum böngésző

`ci-explorer` · status **spec**

- **Core engine:** t-based CI for a mean; Wald/Wilson for a proportion; coverage simulation; reuses sampling-universe population
- **Educational concepts:** Confidence intervals (`est.confidence_interval`); Coverage probability (`est.coverage`); Precision and sample size (`est.sample_size`); Confidence interval for a difference (`group.ci_difference`)
- **Interaction model:** Draw 100 samples; each CI drawn as a bar, red when missing μ; drag confidence level and n; switch to a cluster design to break coverage.
- **Visual representations:** Stacked CI bars with μ line; Coverage counter; Width vs n curve
- **Statistical outputs:** Coverage %; Mean width; Required n for target margin
- **Configurable parameters:** `level` (float), `n` (int), `method` (enum: t/wald/wilson), `design` (enum: srs/cluster), `seed` (int)
- **Instructor options:** Fix level; Show/hide the width formula; Preset the cluster trap
- **Accessibility alternatives:** Each interval listed with hit/miss; Counter announced
- **Reusable components:** CIBars, CoverageCounter, ParameterControl
- **Test requirements:** t-CI coverage within 94–96 % over 20 000 reps; Wilson vs Wald coverage at p = .05, n = 30

## Hypothesis Testing Lab · Hipotézisvizsgálat labor

`hypothesis-lab` · status **repo**

- **Core engine:** simulateNullT, tCdf, tCritical, power via noncentral approximation (validate vs SciPy nct)
- **Educational concepts:** Null and alternative hypotheses (`infer.hypotheses`); Test statistics (`infer.test_statistic`); Null distributions (`infer.null_distribution`); One- and two-sided tests (`infer.sidedness`); p-values (`infer.p_value`); Type I and Type II errors (`infer.errors`); Statistical power (`infer.power`); Multiple comparisons (`infer.multiple_comparisons`); Statistical vs substantive significance (`infer.significance_vs_substantive`); Effect sizes (`infer.effect_size`)
- **Interaction model:** Two overlapping sampling distributions (H₀, H₁); drag the critical value, the true effect and n; simulate null studies; toggle sidedness; run m tests at once.
- **Visual representations:** H₀/H₁ curves with α, β, power shaded; Simulated null histogram with observed t; Power curve vs n; m-test grid of false positives
- **Statistical outputs:** t, df, p (1- and 2-sided); α, β, power; Family-wise error for m tests
- **Configurable parameters:** `effect` (float), `n` (int), `alpha` (float), `sided` (enum: 1/2), `m` (int), `seed` (int)
- **Instructor options:** Lock α; Hide power until Phase 2 of lesson; Scenario text
- **Accessibility alternatives:** All handles keyboard-adjustable; Shaded areas reported as numbers
- **Reusable components:** TwoCurveShade, NullHistogram, PowerCurve, ParameterControl
- **Test requirements:** p vs SciPy t.sf; Power vs SciPy nct at 12 points; Simulated null tail share within 2 SE of p

## Mean Comparison & t-Test Lab · Átlag-összehasonlítás és t-próba labor

`ttest-lab` · status **repo**

- **Core engine:** oneSampleT, independentT (Student+Welch), pairedT, hedgesG, leveneTest (stats.ts)
- **Educational concepts:** Mean differences (`group.mean_difference`); Standard error of a difference (`group.se_difference`); One-sample t-test (`group.t_one_sample`); Paired t-test (`group.t_paired`); Independent-samples t-test (`group.t_independent`); Welch t-test (`group.welch_t`); Confidence interval for a difference (`group.ci_difference`); Cohen's d and Hedges' g (`group.cohens_d`); Assumptions and robustness (`infer.assumptions`)
- **Interaction model:** Drag group dot plots (shift a whole group, stretch its spread, add/remove points); toggle pairing lines; Student/Welch side by side; Levene demo across seeds.
- **Visual representations:** Two dot plots with means and SE brackets; SE_diff Pythagoras square; CI of difference; Overlap curves for d
- **Statistical outputs:** x̄₁ − x̄₂, SE_diff, t, df, p (Student and Welch); 95 % CI; d, g; Levene F, p
- **Configurable parameters:** `design` (enum: one/paired/independent), `n1` (int), `n2` (int), `mu0` (float), `showWelch` (boolean), `seed` (int)
- **Instructor options:** Fix design; Hide Levene (teach Welch-by-default); Preset data
- **Accessibility alternatives:** Group-level number inputs; Readouts in a table
- **Reusable components:** DraggableObservation, GroupBracket, SEPythagoras, OverlapCurves
- **Test requirements:** Student/Welch t, df, p vs SciPy ttest_ind(equal_var); hedgesG vs reference; Paired = one-sample on differences (identity)

## ANOVA Studio · ANOVA stúdió

`anova-studio` · status **spec**

- **Core engine:** anova() from qda2-stats.js + Tukey HSD (studentised range, validate vs statsmodels), Welch ANOVA, two-way SS, RM decomposition
- **Educational concepts:** One-way ANOVA (`group.anova_oneway`); F distribution (`group.f_distribution`); Post-hoc comparisons (`group.post_hoc`); Two-way ANOVA and interactions (`group.anova_twoway`); Welch ANOVA (`group.welch_anova`); Repeated measures introduction (`group.repeated_measures`); Eta squared (`group.eta_squared`); Multiple comparisons (`infer.multiple_comparisons`); Categorical predictors (dummy variables) (`model.categorical_predictors`)
- **Interaction model:** Extends VRA stage 3: k up to 5 groups; pairwise forest plot with/without correction; 2×2 interaction plot with draggable cell means; subject lines for RM.
- **Visual representations:** Group plot (VRA primitives); Pairwise CI forest; Interaction plot; F-distribution tail
- **Statistical outputs:** ANOVA table; Tukey/Bonferroni/Games–Howell pairs; η², ω²; Welch F
- **Configurable parameters:** `k` (int), `design` (enum: oneway/twoway/rm), `correction` (enum: none/tukey/bonferroni/gameshowell), `seed` (int)
- **Instructor options:** Fix k; Hide post-hoc until F significant; Preset interaction patterns
- **Accessibility alternatives:** Cell means as number grid; Forest plot as table
- **Reusable components:** VRA primitives, ForestPlot, InteractionPlot
- **Test requirements:** One-way vs SciPy f_oneway; Tukey vs statsmodels pairwise_tukeyhsd; Two-way SS sum to SST (balanced)

## Categorical Data Lab · Kategoriális adatok labor

`categorical-lab` · status **repo**

- **Core engine:** chiSquareTest, chiSquareP (stats.ts) + odds ratio with CI, Fisher exact (hypergeometric)
- **Educational concepts:** Frequencies and proportions (`desc.frequencies`); Contingency tables (`cat.contingency`); Conditional percentages (`cat.conditional_percent`); Expected frequencies (`cat.expected_frequencies`); Chi-square test of independence (`cat.chi_square`); Cramér's V (`cat.cramers_v`); Odds ratios (`cat.odds_ratio`); Fisher's exact test (`cat.fisher`); Independence (`prob.independence`)
- **Interaction model:** Mosaic plot whose tile widths/heights are draggable (changes counts, keeps N or keeps margins); swap X/Y; scale N.
- **Visual representations:** Mosaic plot; Table with observed/expected/residual toggle; χ² contribution heat; OR/RR/RD triad for 2×2
- **Statistical outputs:** Row/column %; E, (O−E)²/E, χ², df, p; V, φ; OR with 95 % CI, Fisher p
- **Configurable parameters:** `rows` (int), `cols` (int), `keep` (enum: N/margins), `N` (int)
- **Instructor options:** Preset tables (course data); Hide expected until predicted; Lock table size
- **Accessibility alternatives:** Editable count table is the primary control; Mosaic described by table
- **Reusable components:** MosaicPlot, CountTable, ContributionHeat
- **Test requirements:** χ², p, V vs SciPy chi2_contingency; Fisher vs SciPy fisher_exact; OR CI vs statsmodels Table2x2

## Lazarsfeld & Simpson Lab · Lazarsfeld- és Simpson-labor

`lazarsfeld-simpson-lab` · status **repo**

- **Core engine:** Partial-table arithmetic; weighted aggregation; scenario generator (lazarsfeld/data.ts)
- **Educational concepts:** Stratified tables (`cat.stratified`); Lazarsfeld paradigm (`cat.lazarsfeld`); Simpson's paradox (`cat.simpson`); Confounding and mediation cautions (`model.confounding`); Causal diagrams (`practice.causal_diagrams`); Weighted averages (`desc.weighted_mean`)
- **Interaction model:** Zero-order table and two partial tables as linked bar panels; drag the Z composition of X groups; drag partial percentages; draw the DAG; classify the pattern.
- **Visual representations:** PartialBars (repo); Composition strip; CausalDiagram (repo); DecisionTree (repo)
- **Statistical outputs:** Zero-order % difference; Partial % differences; Pattern classification; Adjustment advice from DAG
- **Configurable parameters:** `scenario` (enum: replication/specification/explanation/interpretation/simpson), `composition` (array)
- **Instructor options:** Hide classification until answered; Scenario text; Preset data from course
- **Accessibility alternatives:** All tables editable; DAG as adjacency list
- **Reusable components:** PartialBars, CompositionStrip, CausalDiagram, DecisionTree
- **Test requirements:** Aggregate equals weighted partials to 1e-12; Simpson reversal scenario reproduces published example

## Correlation & Regression Lab · Korreláció és regresszió labor

`corr-reg-lab` · status **repo**

- **Core engine:** pearson, spearman, correlationP, linearFit (stats.ts); multiple regression via normal equations; logistic via IRLS (validate vs statsmodels)
- **Educational concepts:** Correlation (Pearson's r) (`corr.pearson`); Spearman's rank correlation (`corr.spearman`); Covariance (`desc.covariance`); Linear regression (`model.linear_regression`); Slope and intercept (`model.slope`); R-squared (`model.r_squared`); Regression uncertainty (`model.regression_uncertainty`); Multiple regression (`model.multiple_regression`); Categorical predictors (dummy variables) (`model.categorical_predictors`); Interaction terms (`model.interactions`); Logistic regression introduction (`model.logistic`)
- **Interaction model:** Scatter with draggable points (VRA primitives); covariance rectangles; add a second predictor as colour/size; interaction slider; logistic curve handle.
- **Visual representations:** Scatter + line + residual squares; Deviation rectangles; Grouped lines for Z; Logistic curve with odds readout
- **Statistical outputs:** r, ρ, p; a, b, SE(b), t, CI; R², adj R²; OR per unit
- **Configurable parameters:** `predictors` (int), `showRectangles` (boolean), `outcome` (enum: continuous/binary), `seed` (int)
- **Instructor options:** Preset data; Lock predictors; Hide inference
- **Accessibility alternatives:** Point table with number inputs; Readouts table
- **Reusable components:** VRA primitives, DeviationRectangle, GroupLines, LogisticCurve
- **Test requirements:** linearFit vs SciPy linregress; Multiple vs statsmodels OLS; Logistic vs statsmodels Logit (coef to 1e-6)

## Survey Sampling Design Studio · Survey mintavételi tervező stúdió

`survey-design-studio` · status **spec**

- **Core engine:** Frame/population overlay; stratum allocation (proportional, Neyman); multistage π products; PPS systematic selection
- **Educational concepts:** Target population (`survey.target_population`); Sampling frames and coverage error (`survey.frame`); Stratum allocation (`survey.allocation`); Multistage sampling (`survey.multistage`); Probability proportional to size (`survey.pps`); Inclusion probabilities (`survey.inclusion_prob`)
- **Interaction model:** Map-like grid of PSUs; define frame coverage; choose stages; allocate sample across strata with draggable bars; trace one unit's π.
- **Visual representations:** Population/frame overlay; Allocation bars with SE readouts; PSU → SSU → unit trace
- **Statistical outputs:** Coverage rate; nₕ, SE total, domain SEs; πₖ per stage and overall
- **Configurable parameters:** `strata` (int), `allocation` (enum: proportional/neyman/equal/custom), `stages` (int), `pps` (boolean)
- **Instructor options:** Preset national-survey layout; Lock stages
- **Accessibility alternatives:** Allocation as number table; Trace as text
- **Reusable components:** PSUGrid, AllocationBars, PiTrace
- **Test requirements:** Neyman allocation vs closed form; Σπₖ = n; PPS π vs R sampling::inclusionprobabilities

## Survey Design & Weighting Studio (flagship) · Survey tervezés és súlyozás stúdió

`survey-weighting-studio` · status **spec**

- **Core engine:** Finite synthetic population with subgroups; SRS / stratified / cluster selection; πₖ; HT and Hájek; nonresponse mechanisms; post-stratification; raking; Kish n_eff; design-based variance by simulation and by formula; deff
- **Educational concepts:** Survey inference (`survey.inference`); Total survey error (`survey.tse`); Probability vs nonprobability sampling (`survey.prob_vs_nonprob`); Simple random sampling (`survey.srs`); Stratified sampling (`survey.stratified`); Cluster sampling (`survey.cluster`); Intraclass correlation (`survey.icc`); Inclusion probabilities (`survey.inclusion_prob`); Sampling (design) weights (`survey.weights`); Horvitz–Thompson estimation (`survey.horvitz_thompson`); Ratio and Hájek estimation (`survey.hajek`); Nonresponse and selection bias (`survey.nonresponse`); Nonresponse adjustments (`survey.nonresponse_adj`); Post-stratification (`survey.post_stratification`); Raking (iterative proportional fitting) (`survey.raking`); Effective sample size (`survey.effective_n`); Design effect (`survey.design_effect`); Design-based inference (`survey.design_based`); Missing-data handling in surveys (`survey.missing_data`); Missing values (`data.missing`)
- **Interaction model:** Twelve-step flow (see §9 of the brief): define subgroups → sizes/outcomes → SRS → stratified → cluster → inspect π → weights → compare estimates → nonresponse → post-strat/raking → uncertainty → repeat.
- **Visual representations:** Population field (every unit a dot, coloured by subgroup); Selected sample; π bars per unit; Respondent distribution vs population; Weight histogram with Kish n_eff; Estimate strip: unweighted, weighted, truth; Sampling distribution across repeats; deff gauge
- **Statistical outputs:** Ȳ (truth), ȳ unweighted, ȳ_HT/N, ȳ_Hájek; Σw, n, n_eff; Bias, SE (simulation and formula where valid), deff; Remaining bias after adjustment
- **Configurable parameters:** `groups` (array), `design` (enum: srs/stratified/cluster), `n` (int), `rho` (float), `nonresponse` (enum: none/mcar/group/outcome), `adjustment` (enum: none/poststrat/raking), `seed` (int)
- **Instructor options:** Lock design; Preset populations; Hide truth until predicted; Restrict steps; Variance method shown (sim/formula/both)
- **Accessibility alternatives:** Every step has a numeric alternative; Estimate strip as table; Reduced motion disables repeat animation
- **Reusable components:** PopulationField, SampleHighlight, PiBars, WeightHistogram, EstimateStrip, AccumulatingHistogram, DeffGauge
- **Test requirements:** HT total unbiased over 20 000 reps (|bias| < 3 SE); Stratified variance vs closed form; Post-strat weights reproduce N_c exactly; Validate SE, deff against R survey::svymean on exported sample (scripts/validation/survey_reference.R)

## Weighting & Calibration Lab · Súlyozás és kalibráció labor

`weighting-calibration-lab` · status **spec**

- **Core engine:** GREG/linear calibration, raking with convergence trace, bounded weights; model-assisted vs model-based comparison
- **Educational concepts:** Calibration (`survey.calibration`); Raking (iterative proportional fitting) (`survey.raking`); Post-stratification (`survey.post_stratification`); Model-assisted and model-based inference (`survey.model_based`); Ratio and Hájek estimation (`survey.hajek`)
- **Interaction model:** Choose auxiliary variables; step raking iterations; bound weights; misspecify the working model.
- **Visual representations:** Margin convergence bars; Weight distribution before/after; Variance by outcome variable
- **Statistical outputs:** Calibrated weights; Variance reduction per outcome; Bias under misspecification
- **Configurable parameters:** `auxiliaries` (array), `method` (enum: poststrat/raking/linear/bounded), `bounds` (range)
- **Instructor options:** Preset auxiliaries; Hide variance until predicted
- **Accessibility alternatives:** Iteration log as text
- **Reusable components:** MarginBars, WeightHistogram, OutcomeVarianceTable
- **Test requirements:** Calibration totals reproduced to 1e-9; Raking vs R survey::rake; GREG vs survey::calibrate(calfun='linear')

## Complex Survey Inference Lab · Komplex survey-következtetés labor

`complex-survey-lab` · status **spec**

- **Core engine:** Design-based variance: stratified-cluster with-replacement ultimate-cluster formula; Taylor linearisation for ratios; JK1/JKn replicates; Rao–Scott χ²; weighted OLS with design SEs
- **Educational concepts:** Complex-survey variance estimation (`survey.variance_estimation`); Taylor linearization (`survey.taylor`); Replicate weights (`survey.replicate_weights`); Design effect (`survey.design_effect`); Domain estimation (`survey.domain`); Design-based testing (`survey.design_based_testing`); Survey regression (`survey.regression`); Reproducible survey analysis (`survey.reproducible`); Coverage probability (`est.coverage`)
- **Interaction model:** Take one complex sample; compute naive vs design-based SE; generate replicate weights; pick a domain; run weighted crosstab and regression; export R code.
- **Visual representations:** Design tree (strata → PSUs); SE comparison bars (naive, Taylor, replicate, simulation truth); Domain estimate with CI; Export panel
- **Statistical outputs:** SE by method; deff per estimate; Rao–Scott χ² and p; Weighted regression table with design SEs; R survey code
- **Configurable parameters:** `strata` (int), `psuPerStratum` (int), `method` (enum: taylor/jk1/jkn/brr), `domain` (string)
- **Instructor options:** Lock design; Show only one variance method; Preset export
- **Accessibility alternatives:** Design tree as nested list; All comparisons in tables
- **Reusable components:** DesignTree, SEBars, CIReadout, CodeExport
- **Test requirements:** All SEs validated against R survey on exported samples (svymean, svyby, svychisq, svyglm); Coverage simulation 94–96 %

## Measurement & Index Lab · Mérés és index labor

`measurement-index-lab` · status **repo**

- **Core engine:** cronbachAlpha, itemTotalStatistics (reliability.ts); attenuation simulation; percentile/absolute/relative cuts
- **Educational concepts:** Composite indexes (`measure.composite_index`); Reverse scoring (`measure.reverse_scoring`); Internal consistency (`measure.reliability`); Cronbach's alpha (`measure.cronbach`); Measurement validity (`measure.validity`); Operationalization (`data.operationalization`); Measurement error (`survey.measurement_error`); Quantiles and percentiles (`desc.quantiles`); Standardization (z-scores) (`desc.standardization`); Questionnaire design (`survey.questionnaire`)
- **Interaction model:** Item cards toggled in/out, reverse-scored; alpha-if-deleted live; add random error to items; cut index into categories with draggable thresholds.
- **Visual representations:** Item-total table; Variance picture (Σ item variances vs total); Index histogram with cut lines; Attenuation scatter
- **Statistical outputs:** α, α-if-deleted, item-total r; Index descriptives; Category sizes; r observed vs r true
- **Configurable parameters:** `items` (array), `cut` (enum: absolute/relative/percentile), `errorSD` (float), `seed` (int)
- **Instructor options:** Preset item sets (course 120 respondents); Hide alpha until predicted
- **Accessibility alternatives:** Item toggles are checkboxes; Tables everywhere
- **Reusable components:** ItemCards, AlphaTable, CutHistogram, AttenuationScatter
- **Test requirements:** Alpha vs scripts/validation/reference.py covariance form; Attenuation factor √ρ_xx ρ_yy

## Linear Algebra & PCA Studio · Lineáris algebra és PCA stúdió

`linalg-pca-studio` · status **spec**

- **Core engine:** 2×2/3×3 matrix ops; Jacobi eigen-decomposition; PCA on standardised data; k-means; FA via principal axis (validate vs sklearn/factor_analyzer)
- **Educational concepts:** Vectors and matrices (`math.vectors`); Matrix transformations (`math.matrix_transform`); Projections (`math.projection`); Eigenvectors and eigenvalues (`math.eigen`); Principal component analysis (`model.pca`); Factor analysis introduction (`model.factor_analysis`); Clustering introduction (`model.clustering`); Multicollinearity (`model.multicollinearity`)
- **Interaction model:** Point cloud with a rotatable probe axis (variance along it plotted live); apply matrices; drop perpendiculars; step k-means.
- **Visual representations:** Cloud with probe axis and projections; Variance-vs-angle curve; Loading plot; Scree
- **Statistical outputs:** Eigenvalues/vectors; Loadings, explained variance; Cluster SSW
- **Configurable parameters:** `dims` (int), `standardize` (boolean), `k` (int), `seed` (int)
- **Instructor options:** Preset data (course item set); Lock dimension
- **Accessibility alternatives:** Angle as number input; Matrices as editable grids
- **Reusable components:** ProbeAxisCloud, VarianceAngleCurve, LoadingPlot
- **Test requirements:** Eigen vs numpy.linalg.eigh; PCA vs sklearn PCA; k-means SSW monotone decrease

## Mathematical Foundations Studio · Matematikai alapok stúdió

`math-studio` · status **spec**

- **Core engine:** Symbolic-free numeric function plotter; finite-difference derivative; Riemann integral; SSE bowl surface
- **Educational concepts:** Algebra and equations (`math.algebra`); Functions and transformations (`math.functions`); Coordinate systems (`math.coordinates`); Exponents and logarithms (`math.exp_log`); Summation notation (`math.summation`); Geometry of distances (`math.distance`); Derivatives and integrals (`math.calculus`); Partial derivatives (`math.partials`); Optimization (`math.optimization`); Likelihood functions (`prob.likelihood`)
- **Interaction model:** Drag a, b, c, d of a transformed function; drag x to read slope and area; rotate the SSE(a, b) bowl; expand a Σ term by term.
- **Visual representations:** Function plot with tangent and shaded area; Σ expander; SSE bowl (3-D as contour + slice); Likelihood curve
- **Statistical outputs:** f(x), f′(x), ∫; Partial slopes at (a, b); argmax L
- **Configurable parameters:** `topic` (enum: functions/log/sum/derivative/integral/bowl/likelihood)
- **Instructor options:** Open as deep-dive from any Math Block; Preset function
- **Accessibility alternatives:** Numeric read-outs for slope/area; Σ expansion as text
- **Reusable components:** FunctionPlot, SigmaExpander, BowlContour, LikelihoodCurve
- **Test requirements:** Finite-difference derivative within 1e-6 of analytic for presets; Bowl minimum equals OLS (a, b)

## Model Diagnostics Studio · Modelldiagnosztika stúdió

`model-diagnostics-studio` · status **spec**

- **Core engine:** linearFit + leverage, Cook's D, HC3 robust SE, VIF; four Anscombe-like seeded scenarios
- **Educational concepts:** Model diagnostics (`model.diagnostics`); Heteroscedasticity (`model.heteroscedasticity`); Outliers and influence (`desc.outliers`); Multicollinearity (`model.multicollinearity`); Overall model fit and F (`model.model_fit`); Assumptions and robustness (`infer.assumptions`); Residuals (`model.residuals`)
- **Interaction model:** Choose scenario; drag points; residual-vs-fitted and scale-location plots update; toggle robust SE; add correlated predictor.
- **Visual representations:** Scatter + fit; Residual vs fitted; Leverage/Cook's bubble plot; Coefficient table with SE toggle
- **Statistical outputs:** R² (same across scenarios); Cook's D, leverage; Classical vs HC3 SE; VIF
- **Configurable parameters:** `scenario` (enum: linear/curved/outlier/fan), `robust` (boolean), `seed` (int)
- **Instructor options:** Lock scenario; Hide robust SE
- **Accessibility alternatives:** Diagnostics in tables; Point number inputs
- **Reusable components:** VRA primitives, ResidualPlot, InfluenceBubble
- **Test requirements:** Cook's D vs statsmodels OLSInfluence; HC3 vs statsmodels cov_type='HC3'; VIF vs statsmodels

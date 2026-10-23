# Course template: Quantitative Data Analysis 2 · Kvantitatív adatelemzés 2

`course.qda2` v1.0.0 · generated from `data/courses.js`. This is an **example template**, not a hardcoded course; instructors clone and edit it in the Course Builder.

**Description.** A 14-week applied course on describing, comparing and modelling survey data with SPSS, built on the analysis chain research question → variables → roles → levels → method → logic → software → output → conclusion.

**Intended audience.** 2nd-year social science BA students who completed QDA1 (descriptives, index construction).

**Prerequisites.** QDA1 or equivalent; Basic SPSS data view

**Learning outcomes.**
- Choose the appropriate bivariate method from measurement levels and roles
- Read and interpret crosstab, correlation, t-test, ANOVA and regression output
- Distinguish statistical significance from effect size
- Control for a third variable and classify the Lazarsfeld pattern
- Report results in a defensible, reproducible way

**Estimated workload.** 2 × 90 min per week + ~2 h self-study; 28 ECTS-hours contact

**Suggested software.** SPSS (primary); R optional bridge in week 13

**Assessment.** Formative: Weekly quiz blocks (first attempt counts, local only). Final: Independent research project on the course data set (weeks 13–14)

**Instructor notes.** Mirrors the existing 9-module site plus the VRA lab. Weeks 1–2 may be compressed to one if QDA1 is fresh. Teach Welch by default; Levene demo is diagnostic, not a gate.

## Weekly structure

| Week | Lesson | Blocks | Minutes | Labs used |
|---|---|---|---|---|
| Research questions and measurement levels | From question to variables | 6 | 52 | — |
| Data preparation and descriptive statistics | Centre, spread and the mean as a model | 9 | 74 | vra-lab |
| Crosstabs and conditional percentages | Which percentage? | 3 | 35 | categorical-lab |
| Chi-square and association measures | Significance vs strength | 4 | 35 | categorical-lab |
| Lazarsfeld and control variables | What happens to X → Y under Z | 5 | 60 | lazarsfeld-simpson-lab |
| Covariance and correlation | Direction, strength, and what r misses | 6 | 52 | corr-reg-lab |
| Sampling, estimation and standard error | Why samples disagree | 8 | 83 | sampling-universe, ci-explorer |
| Hypothesis testing and significance | The p-value | 5 | 53 | hypothesis-lab |
| t-tests and mean comparisons | Two means | 6 | 68 | ttest-lab |
| ANOVA and variance decomposition | Three means and the F ratio | 7 | 63 | vra-lab |
| Linear regression | From the mean to the line | 6 | 58 | vra-lab |
| Standardization, indexes and PCA | Many items, one score | 9 | 90 | measurement-index-lab, linalg-pca-studio |
| Applied statistical workflow | The chain end to end | 5 | 50 | — |
| Independent research project | Project | 2 | 36 | — |

Total guided minutes: 809 (13 h) across 14 weeks.

## Lessons and learning blocks

### Week 1 · Research questions and measurement levels
*1. hét · Kutatási kérdés és mérési szintek*

**Lesson: From question to variables**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | From topic to research question `c.research-question` | data.research_question | 8 | — |  |
| 2 | Concept | Measurement levels `c.measurement-levels` | data.measurement_levels | 10 | — |  |
| 3 | Experiment | Classify 12 variables `x.classify-levels` | data.measurement_levels | 10 | — |  |
| 4 | Concept | X, Y and Z: roles come from the question `c.variable-roles` | data.variable_roles | 8 | — |  |
| 5 | Experiment | Same variables, two questions `x.role-swap` | data.variable_roles | 8 | — |  |
| 6 | Assessment | Quiz: levels and roles `a.levels-roles` | data.measurement_levels, data.variable_roles | 8 | — |  |

### Week 2 · Data preparation and descriptive statistics
*2. hét · Adatelőkészítés és leíró statisztika*

**Lesson: Centre, spread and the mean as a model**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Dataset | News hours → political knowledge (3 education groups) `ds.news-knowledge` | data.variables, data.variable_roles | 3 | — |  |
| 2 | Concept | Checking data before analysis `c.data-quality` | data.quality, data.missing | 8 | — |  |
| 3 | Concept | Mean, median, mode and skew `c.centre` | desc.central_tendency, desc.skewness | 10 | — |  |
| 4 | Concept | Same mean, different distributions `c.same-mean` | desc.distribution_comparison, desc.sd | 8 | — |  |
| 5 | Prediction | Predict: n or n − 1? `p.n-minus-1` | desc.variance, est.bias | 4 | — |  |
| 6 | Interactive Lab | VRA Lab · Stage 1: variance as squares `l.vra-stage1` | desc.mean, desc.variance, desc.sd | 15 | vra-lab: {"stage":1,"scenario":"base","popVar":false,"layer":1,"mode":"learn"} |  |
| 7 | Math | Σ(xᵢ − x̄)² term by term `m.variance` | math.summation, desc.variance | 8 | — |  |
| 8 | Software Application | SPSS: Frequencies and Descriptives `sw.spss-frequencies` | desc.frequencies, desc.central_tendency | 10 | — |  |
| 9 | Assessment | Quiz: centre and spread `a.descriptives` | desc.central_tendency, desc.variance, desc.sd | 8 | — |  |

### Week 3 · Crosstabs and conditional percentages
*3. hét · Kereszttáblák és feltételes százalékok*

**Lesson: Which percentage?**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Which percentage? Row vs column `c.crosstab-percent` | cat.contingency, cat.conditional_percent | 10 | — |  |
| 2 | Interactive Lab | Categorical Data Lab: mosaic and χ² `l.categorical-mosaic` *(variant)* | cat.expected_frequencies, cat.chi_square, cat.cramers_v | 15 | categorical-lab: {"rows":2,"cols":2,"keep":"margins"} | Start with the 2×2 from the lecture slides. |
| 3 | Software Application | SPSS: Crosstabs, cells, statistics `sw.spss-crosstabs` | cat.conditional_percent, cat.chi_square | 10 | — |  |

### Week 4 · Chi-square and association measures
*4. hét · Khi-négyzet és asszociációs mérőszámok*

**Lesson: Significance vs strength**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Prediction | Predict: double N, same percentages `p.chi-scale` | cat.chi_square, cat.cramers_v | 4 | — |  |
| 2 | Interactive Lab | Categorical Data Lab: mosaic and χ² `l.categorical-mosaic` | cat.expected_frequencies, cat.chi_square, cat.cramers_v | 15 | categorical-lab: {"rows":2,"cols":3,"keep":"N"} |  |
| 3 | Math | χ² = Σ(O − E)²/E `m.chi-square` | cat.expected_frequencies, cat.chi_square | 8 | — |  |
| 4 | Assessment | Quiz: crosstabs and χ² `a.crosstabs` | cat.conditional_percent, cat.chi_square, cat.cramers_v | 8 | — |  |

### Week 5 · Lazarsfeld and control variables
*5. hét · Lazarsfeld és kontrollváltozók*

**Lesson: What happens to X → Y under Z**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | The Lazarsfeld paradigm `c.lazarsfeld` | cat.stratified, cat.lazarsfeld | 12 | — |  |
| 2 | Interactive Lab | Lazarsfeld & Simpson Lab: eight scenarios `l.lazarsfeld-scenarios` | cat.lazarsfeld, cat.simpson, model.confounding | 20 | lazarsfeld-simpson-lab: {"scenario":"explanation"} |  |
| 3 | Experiment | Make the association flip `x.simpson-flip` | cat.simpson, desc.weighted_mean | 10 | lazarsfeld-simpson-lab: {"scenario":"simpson"} |  |
| 4 | Reflection | Antecedent or intervening? Argue the order `r.causal-order` | cat.lazarsfeld, practice.causal_diagrams | 8 | — |  |
| 5 | Assessment | Quiz: Lazarsfeld patterns `a.lazarsfeld` | cat.lazarsfeld | 10 | — |  |

### Week 6 · Covariance and correlation
*6. hét · Kovariancia és korreláció*

**Lesson: Direction, strength, and what r misses**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Covariance as signed rectangles `c.covariance` | desc.covariance | 10 | — |  |
| 2 | Interactive Lab | Guess r `l.guess-r` | corr.pearson | 10 | corr-reg-lab: {"predictors":1,"showRectangles":false} |  |
| 3 | Experiment | r is blind to curves `x.ushape` | corr.pearson | 8 | — |  |
| 4 | Concept | Pearson vs Spearman `c.pearson-spearman` | corr.pearson, corr.spearman | 8 | — |  |
| 5 | Software Application | SPSS: Bivariate correlations `sw.spss-correlate` | corr.pearson, corr.spearman | 8 | — |  |
| 6 | Assessment | Quiz: interpreting r `a.correlation` | corr.pearson, corr.spearman | 8 | — |  |

### Week 7 · Sampling, estimation and standard error
*7. hét · Mintavétel, becslés, standard hiba*

**Lesson: Why samples disagree**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Populations, samples, parameters, statistics `c.population-sample` | est.population_sample, est.parameters | 8 | — |  |
| 2 | Prediction | Predict: n from 25 to 100 `p.se-n` | est.standard_error | 4 | — |  |
| 3 | Interactive Lab | Sampling Universe: repeat the sample `l.sampling-universe` | est.sampling_variation, est.sampling_distribution, est.standard_error, est.clt | 20 | sampling-universe: {"population":"skewed","N":2000,"n":30,"statistic":"mean","showTheory":false} |  |
| 4 | Experiment | Skewed population, normal means `x.clt-shape` | est.clt | 10 | sampling-universe: {"population":"skewed","n":5,"showTheory":true} |  |
| 5 | Math | SE = s/√n `m.standard-error` | est.standard_error, desc.sd | 6 | — |  |
| 6 | Experiment | Why n − 1: the biased estimator `x.variance-bias` | est.bias, desc.variance | 10 | sampling-universe: {"population":"normal","n":5,"statistic":"var_n"} |  |
| 7 | Concept | What 95 % means `c.ci-logic` | est.confidence_interval, est.coverage | 10 | — |  |
| 8 | Interactive Lab | CI Explorer: 100 intervals `l.ci-explorer` | est.confidence_interval, est.coverage, est.sample_size | 15 | ci-explorer: {"level":0.95,"n":30,"method":"t","design":"srs"} |  |

### Week 8 · Hypothesis testing and significance
*8. hét · Hipotézisvizsgálat és szignifikancia*

**Lesson: The p-value**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | The p-value and its misreadings `c.p-value` | infer.hypotheses, infer.null_distribution, infer.p_value | 12 | — |  |
| 2 | Interactive Lab | Hypothesis Lab: simulate the null `l.hypothesis-null` | infer.null_distribution, infer.p_value, infer.sidedness | 15 | hypothesis-lab: {"effect":0,"n":20,"alpha":0.05,"sided":2} |  |
| 3 | Experiment | Same effect, bigger n `x.sample-size-p` | infer.p_value, infer.effect_size, infer.significance_vs_substantive | 8 | — |  |
| 4 | Concept | Type I, Type II, power `c.errors-power` | infer.errors, infer.power | 10 | — |  |
| 5 | Assessment | Quiz: p-values `a.p-values` | infer.p_value, infer.effect_size | 8 | — |  |

### Week 9 · t-tests and mean comparisons
*9. hét · t-próbák és átlag-összehasonlítás*

**Lesson: Two means**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Choosing a t-test `c.t-choice` | group.t_one_sample, group.t_paired, group.t_independent | 10 | — |  |
| 2 | Interactive Lab | t-Test Lab: drag the groups `l.ttest-lab` | group.mean_difference, group.se_difference, group.t_independent, group.welch_t, group.cohens_d | 20 | ttest-lab: {"design":"independent","n1":12,"n2":12,"showWelch":true} |  |
| 3 | Concept | Student, Welch and Levene `c.welch-default` | group.welch_t, infer.assumptions | 8 | — |  |
| 4 | Concept | Cohen's d and Hedges' g `c.effect-size-d` | group.cohens_d, infer.effect_size | 8 | — |  |
| 5 | Software Application | SPSS: t-tests and reading both rows `sw.spss-ttest` | group.t_independent, group.welch_t | 12 | — |  |
| 6 | Assessment | Quiz: t-test selection and output `a.t-tests` | group.t_independent, group.t_paired | 10 | — |  |

### Week 10 · ANOVA and variance decomposition
*10. hét · ANOVA és varianciafelbontás*

**Lesson: Three means and the F ratio**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Dataset | News hours → political knowledge (3 education groups) `ds.news-knowledge` | data.variables, data.variable_roles | 3 | — |  |
| 2 | Prediction | Predict: separate the groups or tighten them? `p.sep-spread` | group.anova_oneway | 4 | — |  |
| 3 | Interactive Lab | VRA Lab · Stage 3: ANOVA decomposition `l.vra-stage3` | group.anova_decomposition, group.anova_oneway, group.f_distribution, group.eta_squared | 20 | vra-lab: {"stage":3,"av":"both","showSq":true,"mode":"learn"} |  |
| 4 | Math | F = MSB/MSW and the F distribution `m.f-ratio` | group.f_distribution, group.anova_oneway | 8 | — |  |
| 5 | Concept | After F: which groups differ? `c.post-hoc` | group.post_hoc, infer.multiple_comparisons | 8 | — |  |
| 6 | Software Application | SPSS: One-way ANOVA `sw.spss-anova` | group.anova_oneway, group.post_hoc | 10 | — |  |
| 7 | Assessment | Quiz: ANOVA by hand `a.anova` | group.anova_decomposition, group.eta_squared | 10 | — |  |

### Week 11 · Linear regression
*11. hét · Lineáris regresszió*

**Lesson: From the mean to the line**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Prediction | Predict: can you beat least squares? `p.custom-line` | model.least_squares | 4 | — |  |
| 2 | Interactive Lab | VRA Lab · Stage 2: from the mean to the line `l.vra-stage2` | model.linear_regression, model.least_squares, model.residuals, model.sst, model.r_squared | 20 | vra-lab: {"stage":2,"pred":"mean","showSq":true,"mode":"learn"} |  |
| 3 | Math | SST = SSR + SSE `m.sst-ssr-sse` | model.sst, model.r_squared | 8 | — |  |
| 4 | Concept | Reading the regression table `c.regression-output` | model.slope, model.regression_uncertainty | 10 | — |  |
| 5 | Connection | ANOVA is regression on dummies `con.anova-is-regression` | model.categorical_predictors, group.anova_oneway | 6 | vra-lab: {"stage":3,"compare":true} |  |
| 6 | Software Application | SPSS: Linear regression `sw.spss-regression` | model.linear_regression, model.slope | 10 | — |  |

### Week 12 · Standardization, indexes and PCA
*12. hét · Standardizálás, indexek és PCA*

**Lesson: Many items, one score**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Dataset | Index items, 120 respondents `ds.index-120` | measure.composite_index | 3 | — |  |
| 2 | Concept | Standardisation `c.z-scores` | desc.standardization | 8 | — |  |
| 3 | Concept | Why several items beat one `c.index-why` | measure.composite_index, data.operationalization | 8 | — |  |
| 4 | Interactive Lab | Measurement & Index Lab: build the index `l.index-builder` | measure.reverse_scoring, measure.cronbach, measure.composite_index | 20 | measurement-index-lab: {"cut":"percentile"} |  |
| 5 | Concept | Reliable is not valid `c.reliability-validity` | measure.reliability, measure.validity | 8 | — |  |
| 6 | Software Application | SPSS: Reliability Analysis `sw.spss-reliability` | measure.cronbach | 10 | — |  |
| 7 | Concept | PCA: rotating to the axis of most variance `c.pca-intro` | model.pca, math.eigen | 12 | — |  |
| 8 | Interactive Lab | PCA Studio: the probe axis `l.pca-probe` | model.pca, math.projection | 15 | linalg-pca-studio: {"dims":2,"standardize":true} |  |
| 9 | Connection | PCA is not factor analysis `con.pca-vs-fa` | model.pca, model.factor_analysis | 6 | — |  |

### Week 13 · Applied statistical workflow
*13. hét · Alkalmazott statisztikai munkafolyamat*

**Lesson: The chain end to end**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | The analysis chain end to end `c.workflow` | practice.reporting, practice.reproducibility | 10 | — |  |
| 2 | Dataset | Sopranos revision dataset `ds.sopranos` | data.variables | 3 | — |  |
| 3 | Assessment | Quick review (mixed) `a.quick-review` | practice.reporting | 15 | — |  |
| 4 | Reflection | Write the defensible conclusion `r.defensible-conclusion` | practice.reporting, infer.significance_vs_substantive | 10 | — |  |
| 5 | Software Application | The same analysis in R and Python `sw.r-python-bridge` | practice.software_workflows | 12 | — |  |

### Week 14 · Independent research project
*14. hét · Önálló kutatási projekt*

**Lesson: Project**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Data provenance and consent `c.ethics-provenance` | practice.ethics | 6 | — |  |
| 2 | Experiment | Independent project brief `x.project-brief` | practice.research_design, practice.reproducibility, practice.ethics | 30 | — |  |

## Reuse

Blocks shared with the other template (8): `c.crosstab-percent`, `c.population-sample`, `l.sampling-universe`, `l.vra-stage2`, `ds.index-120`, `c.reliability-validity`, `c.workflow`, `c.ethics-provenance`.

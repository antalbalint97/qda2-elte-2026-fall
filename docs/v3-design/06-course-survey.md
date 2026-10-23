# Course template: Survey Statistics · Survey-statisztika

`course.survey` v1.0.0 · generated from `data/courses.js`. This is an **example template**, not a hardcoded course; instructors clone and edit it in the Course Builder.

**Description.** A 14-week course on design-based inference from complex samples: from total survey error through sampling designs, weights and calibration to design-based variance estimation and reproducible analysis in R.

**Intended audience.** MA students in sociology, survey methodology or applied statistics; QDA2 or an equivalent inference course assumed.

**Prerequisites.** Descriptive statistics, sampling distributions, CIs and t/χ² tests; Basic R or willingness to learn it in weeks 1–4

**Learning outcomes.**
- Decompose survey error and identify which components a design addresses
- Compute inclusion probabilities and base weights for SRS, stratified, cluster, multistage and PPS designs
- Apply and critique nonresponse adjustment, post-stratification, raking and calibration
- Estimate design-based variances, design effects and effective sample sizes, and explain why iid formulas fail
- Carry out and document a reproducible complex-survey analysis in R

**Estimated workload.** 1 × 90 min lecture + 1 × 90 min lab per week + ~3 h self-study

**Suggested software.** R survey package (primary); SPSS Complex Samples (comparison)

**Assessment.** Formative: Two check blocks (weeks 6 and 10) and prediction blocks each lab. Final: Reproducible survey research project on an ESS extract (weeks 13–14)

**Instructor notes.** Steps 1–12 of the Weighting Studio are spread over weeks 1–10; each week re-opens the same instrument with a different configuration. Never present SRS formulas for cluster samples without the deff qualification. Validate all lab numbers students report against R survey before grading.

## Weekly structure

| Week | Lesson | Blocks | Minutes | Labs used |
|---|---|---|---|---|
| Survey inference and total survey error | Where error comes from | 6 | 55 | survey-weighting-studio |
| Target populations and sampling frames | Who can be sampled | 3 | 31 | survey-design-studio |
| Simple random, stratified and cluster sampling | Three designs, one population | 5 | 68 | sampling-universe, survey-weighting-studio, vra-lab |
| Multistage and PPS designs | Stages and size measures | 3 | 42 | survey-design-studio |
| Inclusion probabilities and base weights | π and 1/π | 3 | 40 | survey-weighting-studio |
| Weighted estimation | HT, Hájek and what the weight means | 3 | 45 | survey-weighting-studio |
| Nonresponse and selection bias | Rate is not bias | 4 | 42 | survey-weighting-studio |
| Post-stratification, raking and calibration | Matching the population | 4 | 59 | survey-weighting-studio, weighting-calibration-lab |
| Questionnaire design and measurement error | The other half of total survey error | 4 | 33 | measurement-index-lab |
| Complex-survey variance and design effects | Why the iid formula fails | 4 | 57 | survey-weighting-studio, ci-explorer |
| Taylor linearization and replication | Four standard errors for one mean | 3 | 47 | complex-survey-lab |
| Domain estimation and design-based testing | Small domains, honest tests | 3 | 37 | complex-survey-lab |
| Survey regression and missing data | Models on weighted data | 4 | 52 | vra-lab, complex-survey-lab |
| Reproducible survey research project | Project | 2 | 40 | — |

Total guided minutes: 648 (11 h) across 14 weeks.

## Lessons and learning blocks

### Week 1 · Survey inference and total survey error
*1. hét · Survey-következtetés és teljes survey-hiba*

**Lesson: Where error comes from**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Total survey error `c.tse` | survey.inference, survey.tse | 12 | — |  |
| 2 | Dataset | Synthetic finite population (N = 2 000, 3 subgroups) `ds.finite-pop` | est.population_sample, survey.target_population | 3 | — |  |
| 3 | Concept | Populations, samples, parameters, statistics `c.population-sample` | est.population_sample, est.parameters | 8 | — |  |
| 4 | Prediction | Predict: is one random sample representative? `p.representative` | survey.srs, est.sampling_variation | 4 | — |  |
| 5 | Interactive Lab | Weighting Studio · Step 1–3: population, subgroups, SRS `l.sws-intro` | survey.inference, survey.srs, est.sampling_variation | 20 | survey-weighting-studio: {"design":"srs","n":200,"nonresponse":"none","adjustment":"none"} |  |
| 6 | Reflection | What weighting cannot fix `r.weighting-limits` | survey.nonresponse, survey.tse | 8 | — |  |

### Week 2 · Target populations and sampling frames
*2. hét · Célpopuláció és mintavételi keret*

**Lesson: Who can be sampled**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Target population, frame, coverage `c.frames-coverage` | survey.target_population, survey.frame, survey.modes | 10 | — |  |
| 2 | Interactive Lab | Design Studio: frame overlay `l.sds-frame` | survey.frame, survey.prob_vs_nonprob | 15 | survey-design-studio: {"strata":1,"stages":1} |  |
| 3 | Concept | Data provenance and consent `c.ethics-provenance` | practice.ethics | 6 | — |  |

### Week 3 · Simple random, stratified and cluster sampling
*3. hét · Egyszerű véletlen, rétegzett és csoportos mintavétel*

**Lesson: Three designs, one population**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | SRS, stratified, cluster: what changes `c.srs-strat-cluster` | survey.srs, survey.stratified, survey.cluster, survey.icc | 12 | — |  |
| 2 | Interactive Lab | Sampling Universe: repeat the sample `l.sampling-universe` *(variant)* | est.sampling_variation, est.sampling_distribution, est.standard_error, est.clt | 20 | sampling-universe: {"population":"bimodal","N":2000,"n":50,"statistic":"mean","showTheory":false} | Use as a 10-minute warm-up before the Studio. |
| 3 | Interactive Lab | Weighting Studio · Step 4–5: stratify, then cluster `l.sws-designs` | survey.stratified, survey.cluster, survey.design_effect | 20 | survey-weighting-studio: {"design":"stratified","n":200} |  |
| 4 | Math | Var(ȳ_st) = ΣWₕ²(1 − fₕ)Sₕ²/nₕ `m.strat-variance` | survey.stratified, group.anova_decomposition | 10 | — |  |
| 5 | Connection | Stratification removes SSB from the error `con.strat-anova` | survey.stratified, group.anova_decomposition | 6 | vra-lab: {"stage":3,"av":"both"} |  |

### Week 4 · Multistage and PPS designs
*4. hét · Többlépcsős és PPS tervek*

**Lesson: Stages and size measures**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Multistage and PPS designs `c.multistage-pps` | survey.multistage, survey.pps, survey.allocation | 12 | — |  |
| 2 | Interactive Lab | Design Studio: trace π through stages `l.sds-stages` | survey.multistage, survey.pps, survey.inclusion_prob | 15 | survey-design-studio: {"strata":3,"stages":2,"pps":true} |  |
| 3 | Software Application | R: declaring a design with svydesign `sw.r-survey` *(variant)* | survey.reproducible, survey.variance_estimation | 15 | — | Only svydesign this week. |

### Week 5 · Inclusion probabilities and base weights
*5. hét · Bekerülési valószínűségek és alapsúlyok*

**Lesson: π and 1/π**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | πₖ and dₖ = 1/πₖ `c.inclusion-weights` | survey.inclusion_prob, survey.weights | 10 | — |  |
| 2 | Interactive Lab | Weighting Studio · Step 6–8: inspect π, weight, compare `l.sws-weights` | survey.inclusion_prob, survey.weights, survey.horvitz_thompson, survey.hajek | 20 | survey-weighting-studio: {"design":"stratified","n":200,"allocation":"disproportionate"} |  |
| 3 | Math | Ŷ_HT = Σy/π and ȳ_H = Σwy/Σw `m.ht-hajek` | survey.horvitz_thompson, survey.hajek | 10 | — |  |

### Week 6 · Weighted estimation
*6. hét · Súlyozott becslés*

**Lesson: HT, Hájek and what the weight means**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Interactive Lab | Weighting Studio · Step 6–8: inspect π, weight, compare `l.sws-weights` *(variant)* | survey.inclusion_prob, survey.weights, survey.horvitz_thompson, survey.hajek | 20 | survey-weighting-studio: {"design":"cluster","n":200,"allocation":"disproportionate"} | Second pass: cluster design, compare HT/N with Hájek across repeats. |
| 2 | Software Application | SPSS Complex Samples vs WEIGHT BY `sw.spss-complex` | survey.weights, survey.variance_estimation | 10 | — |  |
| 3 | Assessment | Check: designs, π, weights `a.survey-midterm` | survey.stratified, survey.cluster, survey.inclusion_prob, survey.weights | 15 | — |  |

### Week 7 · Nonresponse and selection bias
*7. hét · Nemválaszolás és szelekciós torzítás*

**Lesson: Rate is not bias**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Nonresponse: rate is not bias `c.nonresponse` | survey.nonresponse, data.missing | 10 | — |  |
| 2 | Interactive Lab | Weighting Studio · Step 9: break the sample `l.sws-nonresponse` | survey.nonresponse, survey.nonresponse_adj, survey.prob_vs_nonprob | 20 | survey-weighting-studio: {"design":"srs","n":300,"nonresponse":"outcome"} |  |
| 3 | Prediction | Predict: will post-stratification remove the bias? `p.weighting-fixes` | survey.post_stratification, survey.nonresponse | 4 | — |  |
| 4 | Reflection | What weighting cannot fix `r.weighting-limits` | survey.nonresponse, survey.tse | 8 | — |  |

### Week 8 · Post-stratification, raking and calibration
*8. hét · Utólagos rétegzés, raking és kalibráció*

**Lesson: Matching the population**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Post-stratification, raking, calibration `c.poststrat-raking` | survey.post_stratification, survey.raking, survey.calibration | 12 | — |  |
| 2 | Interactive Lab | Weighting Studio · Step 10: adjust `l.sws-adjust` | survey.post_stratification, survey.raking, survey.effective_n | 20 | survey-weighting-studio: {"design":"srs","n":300,"nonresponse":"group","adjustment":"raking"} |  |
| 3 | Interactive Lab | Calibration Lab: choose auxiliaries `l.calibration` | survey.calibration, survey.model_based | 15 | weighting-calibration-lab: {"method":"raking"} |  |
| 4 | Concept | Design effect and effective sample size `c.deff-neff` *(variant)* | survey.design_effect, survey.effective_n, survey.variance_estimation | 12 | — | Only the Kish n_eff part this week; deff returns in week 10. |

### Week 9 · Questionnaire design and measurement error
*9. hét · Kérdőívszerkesztés és mérési hiba*

**Lesson: The other half of total survey error**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Questionnaire design and measurement error `c.questionnaire` | survey.questionnaire, survey.measurement_error, measure.validity | 12 | — |  |
| 2 | Dataset | Index items, 120 respondents `ds.index-120` | measure.composite_index | 3 | — |  |
| 3 | Experiment | Add noise, lose correlation `x.attenuation` | survey.measurement_error, measure.reliability | 10 | measurement-index-lab: {"errorSD":1} |  |
| 4 | Concept | Reliable is not valid `c.reliability-validity` | measure.reliability, measure.validity | 8 | — |  |

### Week 10 · Complex-survey variance and design effects
*10. hét · Komplex minták varianciája és design-hatás*

**Lesson: Why the iid formula fails**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Design effect and effective sample size `c.deff-neff` | survey.design_effect, survey.effective_n, survey.variance_estimation | 12 | — |  |
| 2 | Interactive Lab | Weighting Studio · Step 11–12: uncertainty, repeat `l.sws-variance` | survey.variance_estimation, survey.design_effect, est.coverage | 20 | survey-weighting-studio: {"design":"cluster","n":200,"rho":0.1} |  |
| 3 | Experiment | iid CI on a cluster sample `x.ci-cluster-trap` | est.coverage, survey.variance_estimation | 10 | ci-explorer: {"design":"cluster","level":0.95,"n":200} |  |
| 4 | Assessment | Check: deff, n_eff, variance methods `a.survey-variance` | survey.design_effect, survey.effective_n, survey.variance_estimation | 15 | — |  |

### Week 11 · Taylor linearization and replication
*11. hét · Taylor-linearizáció és replikáció*

**Lesson: Four standard errors for one mean**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Taylor linearisation and replicate weights `c.taylor-replication` | survey.taylor, survey.replicate_weights | 12 | — |  |
| 2 | Interactive Lab | Complex Survey Lab: four SEs for one mean `l.csi-variance` | survey.variance_estimation, survey.taylor, survey.replicate_weights | 20 | complex-survey-lab: {"strata":4,"psuPerStratum":6,"method":"taylor"} |  |
| 3 | Software Application | R: survey package (svydesign, svymean, svyglm) `sw.r-survey` | survey.reproducible, survey.variance_estimation | 15 | — |  |

### Week 12 · Domain estimation and design-based testing
*12. hét · Résznépesség-becslés és design-alapú próbák*

**Lesson: Small domains, honest tests**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Domain estimation and design-based tests `c.domains-testing` | survey.domain, survey.design_based_testing | 12 | — |  |
| 2 | Interactive Lab | Complex Survey Lab: a small domain `l.csi-domain` | survey.domain, survey.design_based_testing | 15 | complex-survey-lab: {"domain":"group=C","method":"jkn"} |  |
| 3 | Concept | Which percentage? Row vs column `c.crosstab-percent` *(variant)* | cat.contingency, cat.conditional_percent | 10 | — | Recap from QDA2; then weighted version. |

### Week 13 · Survey regression and missing data
*13. hét · Survey-regresszió és hiányzó adatok*

**Lesson: Models on weighted data**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | Survey regression and missing data `c.survey-regression` | survey.regression, survey.missing_data, survey.model_based | 12 | — |  |
| 2 | Interactive Lab | VRA Lab · Stage 2: from the mean to the line `l.vra-stage2` *(variant)* | model.linear_regression, model.least_squares, model.residuals, model.sst, model.r_squared | 20 | vra-lab: {"stage":2,"pred":"mean","showSq":true,"mode":"learn"} | Recap OLS geometry (10 min) before weighted regression. |
| 3 | Interactive Lab | Complex Survey Lab: weighted regression `l.csi-regression` | survey.regression | 15 | complex-survey-lab: {"method":"taylor","model":"y ~ x + group"} |  |
| 4 | Dataset | ESS round extract (real, documented) `ds.ess-extract` | practice.ethics, survey.reproducible | 5 | — |  |

### Week 14 · Reproducible survey research project
*14. hét · Reprodukálható survey-kutatási projekt*

**Lesson: Project**

| # | Type | Block | Concepts | min | Lab config | Note |
|---|---|---|---|---|---|---|
| 1 | Concept | The analysis chain end to end `c.workflow` | practice.reporting, practice.reproducibility | 10 | — |  |
| 2 | Experiment | Reproducible survey project brief `x.survey-project` | survey.reproducible, practice.reproducibility, practice.ethics | 30 | — |  |

## Reuse

Blocks shared with the other template (8): `c.population-sample`, `c.ethics-provenance`, `l.sampling-universe`, `ds.index-120`, `c.reliability-validity`, `c.crosstab-percent`, `l.vra-stage2`, `c.workflow`.

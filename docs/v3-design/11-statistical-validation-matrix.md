# 11 · Statistical validation matrix

A lab may show a number only if the engine function that produced it is in state **validated** or the UI labels it **provisional**. A lab is **pilot-ready** only when every function it displays is validated.

## Engine → reference → status

| Engine (file · function) | Reference implementation | Fixture / test | Status |
|---|---|---|---|
| qda2-stats · incompleteBeta, fP | scipy.stats.f.sf | fP(3,2,12)=0.0877915, fP(10,2,12)=0.0027809 (selfTest); add (1,10),(4,40),(10,200) | validated (2 pts) → extend |
| qda2-stats · normalCdf/Quantile, tCdf, tTwoTailedP, tCritical | scipy.stats.norm/t | selfTest2 (4 pts); repo tests/unit | validated |
| qda2-stats · describe, fit, sseLine, anova | SciPy/statsmodels; identities Σdev=0, SST=SSR+SSE, SST=SSB+SSW | selfTest, repo reference.py | validated |
| qda2-stats · oneSampleT, independentT (Student/Welch/g/Levene), pairedT | scipy.stats.ttest_*; SPSS 27 rows; scipy.stats.levene(center='mean') | repo tests/unit (ttest); add 20 random pairs | validated (engine); UI parity to add |
| qda2-stats · weightedMean, srsVarMean, stratVarMean, clusterVarMean, kishDeff, postStratify | R survey::svymean with fpc; Kish closed form | none yet | **unvalidated** |
| sampling-stats · makePopulation, srs, statistic, theorySE, bootstrap | property tests (mean of 10 000 x̄ within 3·SE of μ; SD within 5 % of σ/√n·√fpc; bias of s²ₙ ≈ −σ²/n) | run ad hoc in V1 build log | provisional → add to tests/unit |
| survey-stats · select (π for SRS/strat/cluster/two-stage) | sampling::inclusionprobabilities; Σπ=n | property check (V2 log: Σπ=n) | provisional |
| survey-stats · estimates (HT, Hájek) | survey::svytotal/svymean | 200 exported samples | **unvalidated** |
| survey-stats · linearizedVarMean | survey::svymean SE (no fpc) | tolerance 1e−4 | **unvalidated** |
| survey-stats · closedFormVar | survey::svymean with fpc=~N | tolerance 1e−6 | **unvalidated** |
| survey-stats · postStratify, rake | survey::postStratify, survey::rake | weights equal to 1e−9 | **unvalidated** (totals reproduced: checked) |
| survey-stats · kishNeff, deff | survey::svymean(deff=TRUE); Kish closed form | 1 % | **unvalidated** |
| survey-stats · repeat | Monte-Carlo; bias < 3·SE | V2 log: SRS/strat/cluster/two-stage unbiased vs Ȳ_frame | provisional |
| CI Explorer · t/z/Wald/Wilson intervals, cluster CI | scipy t.interval; statsmodels proportion_confint; coverage tolerance (2 000 reps ±1.5 pp) | to add | provisional |
| reliability (repo) · cronbachAlpha, itemTotalStatistics | reference.py covariance form | repo tests/unit/indices | validated |
| designed: Tukey/studentised range, Welch ANOVA, two-way, RM | statsmodels pairwise_tukeyhsd; R oneway.test; anova_lm; aov Error() | per docs/labs/anova-studio | not implemented |
| designed: χ² contingency, Fisher, OR CI | scipy chi2_contingency(correction=False), fisher_exact; statsmodels Table2x2 | per docs/labs/categorical-lab | repo chiSquareTest validated; rest not implemented |
| designed: multiple regression, IRLS logistic, HC3, Cook's D, VIF | statsmodels OLS/Logit/OLSInfluence/VIF | per docs/labs | not implemented |
| designed: eigen, PCA, PAF, k-means | numpy.linalg.eigh, sklearn PCA/KMeans, factor_analyzer | per docs/labs/linalg-pca-studio | not implemented |
| designed: GREG/bounded calibration, JKn/BRR, Rao–Scott, svyglm | survey::calibrate, as.svrepdesign, svychisq, svyglm | per docs/labs | not implemented |
| designed: nct power | scipy.stats.nct | 12 points | not implemented (UI must say 'normal approximation' if used) |

## Scripts to add to the repo

- `scripts/validation/survey_reference.R` — reads `fixtures/survey_samples.json` (exported from the Studio: units, strata, PSU, weights, y, group, x), runs svydesign/svymean/svytotal/postStratify/rake, writes `fixtures/survey_reference.json`.
- `tests/unit/survey-stats.test.ts` — compares `QDA2Survey` output to the JSON (tolerances above).
- `tests/unit/sampling-stats.test.ts`, `tests/unit/ci.test.ts` — property/tolerance tests with fixed seeds.
- Export hook in the Studio ("Export sample for validation") — JSON of the current sample; 2 lines of code, not yet added.

## Methodological cautions as lint rules (block text)

Forbidden phrases flagged on save: "Levene decides", "proves (there is) no difference", "accept H₀", "causes" in observational blocks without the `causal-ok` tag, "PCA (factor analysis)" as synonyms, "representative sample" without "probability", "margin of error" for nonprobability samples.

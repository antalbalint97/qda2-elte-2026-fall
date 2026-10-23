# 17 · Statistical validation results (V3)

Date: 2026-10-23. Runner: `QDA2 Tests.dc.html` (browser) + R `survey` 4.x executed **in the browser via webR 0.4.2** from `QDA2 R Block.dc.html` (so the R side was actually run, not only scripted). Reference script for CI: `scripts/validation/survey_reference.R`; fixtures: `scripts/validation/survey_fixtures.js`.

## 1. Survey engine vs R `survey` (executed)

| Fixture | Quantity | Closed form | QDA2Engine / survey-stats | R survey (webR) | Status |
|---|---|---|---|---|---|
| F1a | SRS Hájek mean | 5 | 5 | 5 | ✓ |
| F1b | SRS Var(ȳ), fpc | 1.0 | 1.0 | 1 | ✓ |
| F1c | SRS Var(ȳ), no fpc (svydesign default) | 5/3 | 1.6667 | 1.666667 | ✓ |
| F1d | survey-stats.linearizedVarMean | 5/3 | 1.6667 | — | ✓ (same as F1c) |
| F2a–c | stratified mean / Var fpc / Var no fpc | 6 / 0.56 / 1.00 | 6 / 0.56 / 1.00 | 6 / 0.56 / 1 | ✓ |
| F2e | JKn replicate variance | 1.00 | 1.00 | 1 | ✓ |
| F3a–c | cluster mean / UC-WR / with PSU fpc | 4 / 4 / 2 | 4 / 4 / 2 | 4 / 4 / 2 | ✓ |
| F4 | Kish deff, n_eff | 1.25 / 3.2 | 1.25 / 3.2 | closed form | ✓ |
| F5 | post-stratification totals | 10 | 10 | 10 (postStratify) | ✓ |
| F6 | Rao–Scott first-order X²/δ̄ | 0.78571 | 0.78571 | svychisq "Chisq" reports Pearson X² = 0.79365 and adjusts p (second-order) — **different convention, documented** | ✓ (as designed) |
| F7 | GREG calibrated Σw·x | 100 | 100 | 100 (calibrate linear) | ✓ |
| F8 | domain variance (stratum A), fpc | 2/3 | 0.66667 | 0.6666667 (svyby) | ✓ |
| F9 | Neyman n₁ | 30 | 30 | closed form | ✓ |
| F10 | PPS π with cap | 0.8 | 0.8 | sampling::inclusionprobabilities (scripted, not executed in webR — `sampling` not installed) | pending |
| — | trust-survey svymean SE (Complex Survey Lab) | — | 0.1822 | 0.1822 | ✓ |

Tolerances: 1e-12 absolute for closed forms; R output read to 7 significant digits.

**What this does and does not establish.** Point estimates and Taylor/closed-form/JKn variances of means for SRS, stratified, one-stage cluster and domain estimation match R exactly. Not yet compared: two-stage variances (R needs `fpc` at both stages), raking *weights* (margins verified, weight vectors not diffed against `rake()`), bounded raking (`trimWeights`/`calibrate(bounds=)`), deff convention (`svymean(deff=TRUE)` uses a different SRS variance denominator), Rao–Scott second-order F.

## 2. Core & unified engine (SciPy / R references)

| Check | Reference | Result |
|---|---|---|
| fP(3,2,12), fP(10,2,12) | scipy.stats.f.sf | ✓ 1e-6 |
| χ² sf at .05 critical values (df 1, 2) | scipy.stats.chi2 | ✓ |
| Pearson χ² [[10,20],[30,40]], Yates | scipy chi2_contingency | ✓ 0.7936508 / 0.4464286 |
| Fisher exact [[3,1],[1,3]] | R fisher.test | ✓ .4857143 |
| Pearson r (1..5 vs 2,4,5,4,5) | scipy pearsonr .7745967 | ✓ |
| OLS slope | closed form .6 | ✓ |
| binom pmf, Poisson pmf | closed form | ✓ |
| t-test power one-sample d=.5 n=20 | pwr.t.test .5645044 | ✓ 2e-4 |
| t-test power two-sample n=20 | pwr strict=TRUE .3379 (strict=FALSE .3377) | ✓ (both tails counted) |
| ptukey(3.7729, 3, 12) | R qtukey → .95 | ✓ 3e-3 (numerical integration; **tighten before grading** with statsmodels) |
| Cronbach α identical items | 1 | ✓ |
| eigen [[2,1],[1,2]] | 3, 1 | ✓ |
| Welch F three groups | hand-derived 11.354 | ✓ (needs scipy/`oneway.test` cross-check) |
| two-way SS additivity | identity | ✓ |
| die Var 35/12, Bayes posterior, quantile type 7 | closed form | ✓ |
| sampling SD of 2000 means vs σ/√n·√(1−f) | property | ✓ < 8 % |

## 3. webR acceptance (brief §4, executed in the preview)

basic calculation ✓ · t-test ✓ · linear model ✓ · histogram (1 ImageBitmap) ✓ · deliberate syntax error reported ✓ · recovery after error ✓ · unavailable package → clear error ✓ · session reset (close + re-init) ✓ · `survey` installed from the webR repository ✓ · dataset injection as data.frame ✓. Channel in this preview: PostMessage (no cross-origin isolation) → interrupt unavailable, Stop = worker restart. Timeout 60 s → automatic restart.

## 4. Not executed (needs the repository toolchain)

- `scripts/validation/reference.py` extension for: ptukey vs `statsmodels.stats.libqsturng`, Cook's D / HC3 / VIF vs `OLSInfluence` & `cov_type='HC3'`, logit vs `Logit`, PCA vs `sklearn.decomposition.PCA`, nct power at 12 (δ, n) points vs `scipy.stats.nct`.
- `Rscript scripts/validation/survey_reference.R` in CI (webR run above is the manual equivalent; `sampling` package not installed in webR).
- Coverage simulations (CI Explorer 94–96 %, Complex Survey 94–96 %).
- axe-core accessibility run on the 15 new labs.

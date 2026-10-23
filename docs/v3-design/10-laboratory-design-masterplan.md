# 10 · Laboratory design masterplan

One design contract per unfinished laboratory lives in `docs/labs/<lab-id>.md` (generated from `data/lab-specs-*.js` + `data/labs.js` + the concept graph — edit the data, not the markdown). Statuses are the reconciled V2 states from `docs/08-v2-audit.md`.

| Family | Lab | Status | Concepts | Blocks | Reference implementation |
|---|---|---|---|---|---|
| A Probability & distributions | [Distribution Studio](labs/distribution-studio.md) `distribution-studio` | Existing partial implementation (repo code to refactor) | 10 | 0 | SciPy stats.{norm,t,binom,poisson,f,chi2}.{pdf,cdf,ppf} at 2 |
| A Probability & distributions | [Probability Playground](labs/probability-playground.md) `probability-playground` | Fully designed (no code yet) | 6 | 0 | hand-computable |
| A Probability & distributions | [Expected Value Lab](labs/expected-value-lab.md) `expected-value-lab` | Fully designed (no code yet) | 4 | 0 | closed form |
| B Inference & group comparisons | [Hypothesis Testing Lab](labs/hypothesis-lab.md) `hypothesis-lab` | Existing partial implementation (repo code to refactor) | 10 | 1 | SciPy t.sf |
| B Inference & group comparisons | [ANOVA Studio](labs/anova-studio.md) `anova-studio` | Fully designed (no code yet) | 9 | 0 | SciPy f_oneway |
| C Categorical & relational | [Categorical Data Lab](labs/categorical-lab.md) `categorical-lab` | Existing partial implementation (repo code to refactor) | 9 | 1 | SciPy chi2_contingency (correction=False), fisher_exact |
| C Categorical & relational | [Lazarsfeld & Simpson Lab](labs/lazarsfeld-simpson-lab.md) `lazarsfeld-simpson-lab` | Existing partial implementation (repo code to refactor) | 6 | 2 | hand-computable |
| C Categorical & relational | [Correlation & Regression Lab](labs/corr-reg-lab.md) `corr-reg-lab` | Existing partial implementation (repo code to refactor) | 11 | 1 | SciPy linregress |
| B Inference & group comparisons | [Mean Comparison & t-Test Lab](labs/ttest-lab.md) `ttest-lab` | Working prototype | 9 | 1 | SciPy ttest_ind(equal_var=True/False), ttest_rel, ttest_1sam |
| B Inference & group comparisons | [Confidence Interval Explorer](labs/ci-explorer.md) `ci-explorer` | Working prototype | 4 | 2 | endpoints vs SciPy t.interval |
| D Advanced survey statistics | [Survey Design & Weighting Studio (flagship)](labs/survey-weighting-studio.md) `survey-weighting-studio` | Working prototype | 20 | 6 | R survey: svydesign/svymean (SE, deff), postStratify, rake,  |
| D Advanced survey statistics | [Survey Sampling Design Studio](labs/survey-design-studio.md) `survey-design-studio` | Fully designed (no code yet) | 6 | 2 | R sampling::inclusionprobabilities for PPS |
| D Advanced survey statistics | [Weighting & Calibration Lab](labs/weighting-calibration-lab.md) `weighting-calibration-lab` | Fully designed (no code yet) | 5 | 1 | R survey::calibrate (linear, raking, logit bounds) |
| D Advanced survey statistics | [Complex Survey Inference Lab](labs/complex-survey-lab.md) `complex-survey-lab` | Fully designed (no code yet) | 9 | 3 | R survey: svymean, svyby, svychisq (RS), svyglm, as.svrepdes |
| E Measurement & multivariate modelling | [Measurement & Index Lab](labs/measurement-index-lab.md) `measurement-index-lab` | Existing partial implementation (repo code to refactor) | 10 | 2 | scripts/validation/reference.py covariance-form α |
| E Measurement & multivariate modelling | [Linear Algebra & PCA Studio](labs/linalg-pca-studio.md) `linalg-pca-studio` | Fully designed (no code yet) | 8 | 1 | numpy.linalg.eigh |
| E Measurement & multivariate modelling | [Mathematical Foundations Studio](labs/math-studio.md) `math-studio` | Fully designed (no code yet) | 10 | 0 | analytic derivatives/integrals of presets |
| E Measurement & multivariate modelling | [Model Diagnostics Studio](labs/model-diagnostics-studio.md) `model-diagnostics-studio` | Fully designed (no code yet) | 7 | 0 | statsmodels OLSInfluence (cooks_distance, hat), cov_type='HC |

Not listed (already working, documented in `03-lab-registry.md`, HANDOFF Part I and §12): `vra-lab`, `sampling-universe`.

## Interaction storyboards per family

- **A** Probability: region → mass → expectation. The ProbabilityRegion shaded in Distribution Studio is the same object as the eikosogram tile and the balance-beam bar. Storyboard: shade an area (Distribution) → condition on a column (Playground) → move mass and watch the fulcrum (Expected Value) → sample from it and watch x̄ settle (Sampling Universe).
- **B** Inference: SamplingDistributionPlot from Sampling Universe reappears as the null curve (Hypothesis), as the band that gives CI width (CI Explorer), as t(df) under the fraction (t-Test) and as F(d₁,d₂) (ANOVA). Storyboard: repeat sampling → shade tails → stack intervals → drag a mean → add groups.
- **C** Categorical/relational: ContingencyMosaic → three mosaics + composition strip (Lazarsfeld) → DeviationRectangles and GroupLines (Correlation & Regression). Storyboard: conditional % → control for Z → adjust in regression.
- **D** Survey: one PopulationField and one design object. Storyboard: Studio stages 1–10 → allocation and π trace (Design Studio) → margins and bounds (Calibration) → design tree and SE bars (Complex Survey) → export R.
- **E** Measurement/multivariate: variance squares (index) → projection perpendiculars (PCA) → loss surface (Math) → residual plot (Diagnostics). Storyboard: α as areas → PC1 as rotation → minimum as point on the bowl → fan residuals.

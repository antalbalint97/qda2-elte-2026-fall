# Correlation & Regression Lab · Korreláció és regresszió labor

`corr-reg-lab` · Family C — Categorical & relational · **Existing partial implementation (repo code to refactor)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- See covariance as signed rectangle areas and r as its standardised form
- Distinguish r from slope and both from causation
- Read SE, t and CI of a slope
- Add a second predictor and read the partial slope; see dummies and interactions

**Target learner level.** L2–L3

**Concepts rendered** (11): Correlation (Pearson's r) (`corr.pearson`); Spearman's rank correlation (`corr.spearman`); Covariance (`desc.covariance`); Linear regression (`model.linear_regression`); Slope and intercept (`model.slope`); R-squared (`model.r_squared`); Regression uncertainty (`model.regression_uncertainty`); Multiple regression (`model.multiple_regression`); Categorical predictors (dummy variables) (`model.categorical_predictors`); Interaction terms (`model.interactions`); Logistic regression introduction (`model.logistic`)

**Prerequisite concepts** (from the graph, outside this lab): Standardization (z-scores) (`desc.standardization`); Variable transformations (`data.transformations`); Variance (`desc.variance`); Coordinate systems (`math.coordinates`); The mean as a model (`desc.mean`); Model fit: SST = SSR + SSE (`model.sst`); Standard error (`est.standard_error`); Test statistics (`infer.test_statistic`); Partial derivatives (`math.partials`); One-way ANOVA (`group.anova_oneway`); Odds ratios (`cat.odds_ratio`); Exponents and logarithms (`math.exp_log`)

**Common misconceptions** (from the concept graph)
- r measures any association
- r is the slope
- r = 0.8 is 'twice' r = 0.4
- Spearman tests linearity
- Spearman is always safer
- Covariance of 0 means independence
- Larger covariance means stronger relationship
- The line passes through the most points

**Key conceptual insight.** The same cloud gives one r but a different slope for every unit choice; the partial slope is the slope after removing what Z explains.

**Why interactivity is justified.** Deviation rectangles and group-coloured lines make covariance and adjustment visible rather than algebraic.

## B. Mathematical model

- **Input data:** x,y (n≤40), optional z (scale or categorical), optional binary y
- **Parameters (configuration schema):** `predictors` (int), `showRectangles` (boolean), `outcome` (enum: continuous/binary), `seed` (int)
- **Estimators**
- pearson, spearman, correlationP (repo)
- fit() from qda2-stats; linearFit (repo) for SE(b), t, p
- multiple regression via normal equations (XᵀX)⁻¹Xᵀy with Cholesky; singular → null
- logistic via IRLS, max 50 iterations, convergence 1e−8; non-convergence flagged
- **Equations**
- r = s_xy/(s_x s_y); b = r·s_y/s_x
- SE(b)=s_e/√Σ(x−x̄)²
- logit(π)=b₀+b₁x; OR=e^{b₁}
- **Assumptions:** linearity, independence, constant variance; logistic: binary y, no separation
- **Computational contracts**
- sxx=0 → slope null (reason)
- n≤p+1 → multiple regression null
- perfect separation → logistic null with reason 'separation'
- **Undefined cases → null + reason:** constant y; - collinear predictors
- **Numerical limits:** double precision; IRLS tolerance 1e−8
- **Reference validation:** SciPy linregress; statsmodels OLS (coef, bse to 1e−6); statsmodels Logit
- **Engine:** pearson, spearman, correlationP, linearFit (stats.ts); multiple regression via normal equations; logistic via IRLS (validate vs statsmodels)

## C. Visualization design

- **Main visual metaphor:** VRA stage-2 scatter with DeviationRectangles for covariance; GroupLines for Z; one LogisticCurve.
- **Primary canvas:** draggable scatter (VRA primitives) with signed rectangles toggle; prediction line with residual squares
- **Secondary synchronized representations**
- r meter and slope readout that react differently to unit rescaling
- grouped lines (dummy) or interaction slider
- logistic curve with probability/odds/log-odds triple readout
- coefficient table with SE/t/p/CI
- **Formula interactions:** keys: dev_x, dev_y, rect, sxy, r, b, se_b, t, r2, partial
- **Semantic encodings:** positive rectangles #20BFA9, negative #ED896F; line #20BFA9; residual squares #ED896F (VRA)
- **Animation:** unit rescale animates the axis and slope (550 ms) while r stays
- **Responsive:** as VRA
- **Reusable primitives:** VRA primitives, DeviationRectangle, GroupLines, LogisticCurve

## D. Interaction specification

- **Direct manipulation:** drag points · toggle rectangles · rescale x (hours→minutes) · add Z as colour · interaction slider · drag logistic curve
- **Numeric / keyboard alternatives:** point table · unit buttons · coefficient inputs
- **Lockable parameters (instructor):** `predictors`, `outcome`, `showRectangles`
- **State transitions:** covariance → r → line → inference → Z → logistic
- **Reset & reproducibility:** preset data; all randomness via `mulberry32(seed)`
- **Presets:** news × knowledge (VRA) · U-shape (r≈0) · education groups as dummies · voted (binary) × interest
- **Undo/redo:** one-level

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Rescale hours to minutes: does r change? does b?' |
| Experiment | Toggle rectangles; make the sum of signed areas zero by dragging points |
| Explain | Why is the partial slope of x smaller after adding z here? |
| Formalize | Write b = r·s_y/s_x and verify on the readouts |
| Transfer | Survey regression with weights: which quantity (r, b, SE) does weighting change and why? |

**Expected observations:** r unit-free, b not; U-shape gives r≈0

**Plausible incorrect interpretations:** 'r is the slope'; 'adding predictors cannot flip a sign'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"corr-reg-lab", params:{predictors, showRectangles, outcome, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** four above
- **Defaults:** news × knowledge
- **Available / locked controls:** lock predictors; hide inference
- **Formula layers:** terms / derivation
- **Assessment integration:** k-output, k-ushape, k-spearman, k-cause items
- **Teach Mode:** as VRA
- **Localization:** dictionary
- **Library blocks using this lab** (1): `l.guess-r`
- **Instructor options (registry):** Preset data; Lock predictors; Hide inference

## G. Quality assurance

- **Numerical validation:** SciPy linregress; statsmodels OLS (coef, bse to 1e−6); statsmodels Logit
- **Property-based tests**
- SST=SSR+SSE for OLS
- r invariant to affine rescaling
- multiple regression vs statsmodels at 10 random designs
- IRLS vs Logit at 5
- **Statistical identities**
- simple regression t = correlation t
- **Edge cases:** constant x; n=3; separation
- **Accessibility testing:** point table; readouts table; registry alternatives: Point table with number inputs; Readouts table
- **Performance:** <5 ms
- **Scientific review checklist**
- statistician: logistic non-convergence messaging
- pedagogy: causal language
- **Registry test requirements:** linearFit vs SciPy linregress; Multiple vs statsmodels OLS; Logistic vs statsmodels Logit (coef to 1e-6)

## H. Completion requirements

- **MVP:** scatter + rectangles + r/b + SE/t
- **Production-ready:** multiple, dummies, interaction, logistic, lock schema
- **Pilot-ready:** Predict/Transfer authored
- **Optional future extensions:** robust SE link to model-diagnostics-studio

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 weeks 6 and 11 |
| Classroom duration | 25 min |
| Baseline conceptual question | k-ushape item |
| Primary interaction task | produce r≈0 with a strong relationship |
| Expected learning insight | covariance as area; r vs b |
| Transfer item | weighted regression |
| Common misconception | r = slope |
| Instructor demonstration preset | preset 2 |
| Technical & accessibility acceptance | table-only completion; fixtures pass |

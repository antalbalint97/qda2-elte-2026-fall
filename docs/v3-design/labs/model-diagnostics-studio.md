# Model Diagnostics Studio · Modelldiagnosztika stúdió

`model-diagnostics-studio` · Family E — Measurement & multivariate modelling · **Fully designed (no code yet)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Judge a regression from residual plots rather than R² alone
- Identify leverage and influence (Cook's D)
- Recognise heteroscedasticity and use robust SEs
- Read VIF and see coefficient instability under collinearity

**Target learner level.** L3

**Concepts rendered** (7): Model diagnostics (`model.diagnostics`); Heteroscedasticity (`model.heteroscedasticity`); Outliers and influence (`desc.outliers`); Multicollinearity (`model.multicollinearity`); Overall model fit and F (`model.model_fit`); Assumptions and robustness (`infer.assumptions`); Residuals (`model.residuals`)

**Prerequisite concepts** (from the graph, outside this lab): Skewness and outliers (`desc.skewness`); Interquartile range (`desc.iqr`); Multiple regression (`model.multiple_regression`); Regression uncertainty (`model.regression_uncertainty`); R-squared (`model.r_squared`); F distribution (`group.f_distribution`); Test statistics (`infer.test_statistic`); Linear regression (`model.linear_regression`); The mean as a model (`desc.mean`)

**Common misconceptions** (from the concept graph)
- A high R² means assumptions hold
- Heteroscedasticity biases the slope
- Outliers should always be deleted
- An outlier in y is necessarily influential
- Multicollinearity biases coefficients
- Drop any predictor with r > 0.7
- A significant F validates each predictor
- Levene's p decides Student vs Welch with certainty

**Key conceptual insight.** Four data sets with the same R² can be four different stories; the residual plot tells them apart.

**Why interactivity is justified.** Dragging points shows that influence is about leverage × residual, not just 'far away'.

## B. Mathematical model

- **Input data:** x,y (n≤40), optional x₂; scenario
- **Parameters (configuration schema):** `scenario` (enum: linear/curved/outlier/fan), `robust` (boolean), `seed` (int)
- **Estimators**
- fit() + hat values h_ii, studentised residuals, Cook's D
- HC3 robust SE
- VIF_j=1/(1−R_j²)
- Breusch–Pagan (optional, labelled)
- **Equations**
- D_i = e_i²/(p·MSE)·h_ii/(1−h_ii)²
- HC3: Σ x x ᵀ e²/(1−h)²
- **Assumptions:** OLS
- **Computational contracts**
- h_ii=1 → D null (flag)
- collinear → VIF ∞ shown as '>1000'
- **Undefined cases → null + reason:** n≤p+1
- **Numerical limits:** exact
- **Reference validation:** statsmodels OLSInfluence (cooks_distance, hat), cov_type='HC3', variance_inflation_factor
- **Engine:** linearFit + leverage, Cook's D, HC3 robust SE, VIF; four Anscombe-like seeded scenarios

## C. Visualization design

- **Main visual metaphor:** ResidualDiagnosticPlot: residual vs fitted beside the scatter; InfluenceBubble sizes points by Cook's D.
- **Primary canvas:** scatter + fit (VRA primitives) with points sized by D
- **Secondary synchronized representations**
- residual vs fitted with LOESS-free smoother (binned means)
- leverage vs studentised residual bubble plot
- coefficient table with classical vs HC3 SE toggle
- VIF readout when x₂ present
- **Formula interactions:** keys: e, yhat, h, D, se_classic, se_hc3, vif
- **Semantic encodings:** residuals coral (as VRA), leverage violet, influence bubble size
- **Animation:** bubble sizes animate on drag
- **Responsive:** stacks
- **Reusable primitives:** VRA primitives, ResidualPlot, InfluenceBubble

## D. Interaction specification

- **Direct manipulation:** drag points · switch scenario · toggle robust SE · drag correlation of x₂
- **Numeric / keyboard alternatives:** point table; toggles
- **Lockable parameters (instructor):** `scenario`, `robust`
- **State transitions:** scenario → diagnostics → robust → collinearity
- **Reset & reproducibility:** scenario; all randomness via `mulberry32(seed)`
- **Presets:** linear · curved · outlier · fan (heteroscedastic) · collinear pair
- **Undo/redo:** one-level

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Four scenarios, same R²: which one has a problem?' |
| Experiment | Drag one point to maximise Cook's D; where is it? |
| Explain | Why does heteroscedasticity leave the slope unbiased but the SE wrong? |
| Formalize | Compute h_ii for the extreme-x point and compare |
| Transfer | VRA SpreadPatterns: which scenario there is the 'fan' here, and what SE would you report? |

**Expected observations:** influence needs leverage; HC3 widens SE under fan

**Plausible incorrect interpretations:** 'high R² = valid model'; 'heteroscedasticity biases b'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"model-diagnostics-studio", params:{scenario, robust, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** five above
- **Defaults:** linear
- **Available / locked controls:** lock scenario; hide robust
- **Formula layers:** terms
- **Assessment integration:** items to author
- **Teach Mode:** two panels
- **Localization:** dictionary
- **Library blocks using this lab** (0): —
- **Instructor options (registry):** Lock scenario; Hide robust SE

## G. Quality assurance

- **Numerical validation:** statsmodels OLSInfluence (cooks_distance, hat), cov_type='HC3', variance_inflation_factor
- **Property-based tests**
- Cook's D vs statsmodels 1e−9
- HC3 vs statsmodels
- VIF vs statsmodels
- **Statistical identities**
- Σh_ii = p
- **Edge cases:** h=1; n=4
- **Accessibility testing:** tables; point inputs; registry alternatives: Diagnostics in tables; Point number inputs
- **Performance:** trivial
- **Scientific review checklist**
- statistician: BP optional and labelled
- pedagogy: scenario order
- **Registry test requirements:** Cook's D vs statsmodels OLSInfluence; HC3 vs statsmodels cov_type='HC3'; VIF vs statsmodels

## H. Completion requirements

- **MVP:** scenarios + residual plot + Cook's D
- **Production-ready:** HC3, VIF, lock schema
- **Pilot-ready:** items
- **Optional future extensions:** partial residual plots

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 11 extension |
| Classroom duration | 20 min |
| Baseline conceptual question | 'Is R² enough to judge a model?' |
| Primary interaction task | maximise Cook's D with one point |
| Expected learning insight | influence = leverage × residual |
| Transfer item | fan ↔ SpreadPatterns |
| Common misconception | R² sufficiency |
| Instructor demonstration preset | preset 3 |
| Technical & accessibility acceptance | table-only; parity |

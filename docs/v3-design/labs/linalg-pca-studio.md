# Linear Algebra & PCA Studio · Lineáris algebra és PCA stúdió

`linalg-pca-studio` · Family E — Measurement & multivariate modelling · **Fully designed (no code yet)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- See variables as vectors and correlation as the cosine of their angle
- Project a cloud onto an axis and read the variance along it
- Find the first principal component as the variance-maximising direction; eigenvalues as variances
- Distinguish PCA from factor analysis; step k-means

**Target learner level.** L3–L4

**Concepts rendered** (8): Vectors and matrices (`math.vectors`); Matrix transformations (`math.matrix_transform`); Projections (`math.projection`); Eigenvectors and eigenvalues (`math.eigen`); Principal component analysis (`model.pca`); Factor analysis introduction (`model.factor_analysis`); Clustering introduction (`model.clustering`); Multicollinearity (`model.multicollinearity`)

**Prerequisite concepts** (from the graph, outside this lab): Coordinate systems (`math.coordinates`); Summation notation (`math.summation`); Geometry of distances (`math.distance`); Standardization (z-scores) (`desc.standardization`); Covariance (`desc.covariance`); Internal consistency (`measure.reliability`); Multiple regression (`model.multiple_regression`); Regression uncertainty (`model.regression_uncertainty`)

**Common misconceptions** (from the concept graph)
- A matrix is just a table with no algebra
- Row and column vectors are interchangeable
- Matrix multiplication is commutative
- Residuals are uncorrelated with y (they are uncorrelated with ŷ and with X)
- Eigenvalues are correlations
- The first component is always 'the construct'
- PCA and factor analysis are the same
- Components are latent causes

**Key conceptual insight.** PCA is a rotation; the first axis is where the cloud is longest; nothing latent is assumed.

**Why interactivity is justified.** Rotating a probe axis with a live variance curve replaces the eigen-decomposition black box.

## B. Mathematical model

- **Input data:** n × p data (p ≤ 4), standardise flag, k
- **Parameters (configuration schema):** `dims` (int), `standardize` (boolean), `k` (int), `seed` (int)
- **Estimators**
- covariance/correlation matrix
- Jacobi eigen-decomposition (symmetric), eigenvalues sorted
- projection variance along unit vector u: uᵀΣu
- loadings, explained variance
- principal-axis FA (iterated communalities, max 100 it) — labelled 'PAF'
- k-means (Lloyd), seeded, SSW trace
- **Equations**
- Σv=λv; Σλ=trace(Σ)
- Var(uᵀx)=uᵀΣu
- **Assumptions:** linear structure; FA: common-factor model
- **Computational contracts**
- singular Σ → eigenvalues with zeros, projection fine
- FA non-convergence flagged
- k-means empty cluster → re-seed flagged
- **Undefined cases → null + reason:** p<2
- **Numerical limits:** Jacobi to 1e−12
- **Reference validation:** numpy.linalg.eigh; sklearn PCA (standardised); factor_analyzer PAF; sklearn KMeans SSW monotonicity
- **Engine:** 2×2/3×3 matrix ops; Jacobi eigen-decomposition; PCA on standardised data; k-means; FA via principal axis (validate vs sklearn/factor_analyzer)

## C. Visualization design

- **Main visual metaphor:** VectorProjection: the cloud, a rotatable probe axis, projections as perpendiculars, and a variance-vs-angle curve that peaks at PC1.
- **Primary canvas:** 2-D cloud (or 3-D as two linked 2-D views) with draggable probe axis; perpendiculars to the axis; projected points as ticks
- **Secondary synchronized representations**
- variance-vs-angle curve with λ₁, λ₂ marked
- loading plot and scree
- MatrixTransformation panel: apply a 2×2 to the cloud
- k-means stepper with SSW
- **Formula interactions:** keys: u, proj, var_u, lambda1, lambda2, loading
- **Semantic encodings:** data #548FD0, axis #6A5BC9, perpendiculars #ED896F (same hue as residuals)
- **Animation:** axis rotation live; eigen snap on release
- **Responsive:** stacks
- **Reusable primitives:** ProbeAxisCloud, VarianceAngleCurve, LoadingPlot

## D. Interaction specification

- **Direct manipulation:** rotate axis · apply matrix · step k-means · drag points
- **Numeric / keyboard alternatives:** angle number input; matrix grid; step button
- **Lockable parameters (instructor):** `dims`, `standardize`, `k`
- **State transitions:** vectors → projection → PCA → FA contrast → clustering
- **Reset & reproducibility:** preset; all randomness via `mulberry32(seed)`
- **Presets:** two items r=.8 · course index items (4) · shear matrix demo · three blobs for k-means
- **Undo/redo:** one-level

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Where will the variance along the axis be largest: along x, along y, or in between?' |
| Experiment | Rotate until the curve peaks; compare the angle with the eigenvector |
| Explain | Why does standardising change the components? |
| Formalize | Verify λ₁+λ₂ = total variance from the readouts |
| Transfer | OLS as a projection of y onto the column space: which perpendicular is the residual? |

**Expected observations:** peak = PC1; Σλ = trace

**Plausible incorrect interpretations:** 'components are latent causes'; 'PCA = FA'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"linalg-pca-studio", params:{dims, standardize, k, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** four above
- **Defaults:** two items
- **Available / locked controls:** lock dims
- **Formula layers:** terms / derivation
- **Assessment integration:** items to author
- **Teach Mode:** cloud full-width
- **Localization:** dictionary
- **Library blocks using this lab** (1): `l.pca-probe`
- **Instructor options (registry):** Preset data (course item set); Lock dimension

## G. Quality assurance

- **Numerical validation:** numpy.linalg.eigh; sklearn PCA (standardised); factor_analyzer PAF; sklearn KMeans SSW monotonicity
- **Property-based tests**
- eigen vs numpy to 1e−9
- projection variance at eigenvector = λ
- k-means SSW non-increasing
- **Statistical identities**
- Σλ = trace(Σ)
- **Edge cases:** collinear variables; p=2 with r=1
- **Accessibility testing:** angle input; tables; registry alternatives: Angle as number input; Matrices as editable grids
- **Performance:** Jacobi p≤4 instant
- **Scientific review checklist**
- statistician: PAF named; rotation not implemented stated
- pedagogy: 'no latent claim' in PCA text
- **Registry test requirements:** Eigen vs numpy.linalg.eigh; PCA vs sklearn PCA; k-means SSW monotone decrease

## H. Completion requirements

- **MVP:** probe axis + variance curve + eigen, preset 1
- **Production-ready:** loadings/scree, matrix panel, FA, k-means
- **Pilot-ready:** items
- **Optional future extensions:** varimax; 3-D with real depth cues only if needed

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 12 |
| Classroom duration | 25 min |
| Baseline conceptual question | 'What is a principal component?' |
| Primary interaction task | find PC1 by rotation within 2° |
| Expected learning insight | PCA as rotation |
| Transfer item | OLS projection |
| Common misconception | components are constructs |
| Instructor demonstration preset | preset 2 |
| Technical & accessibility acceptance | angle-input completion; parity tests |

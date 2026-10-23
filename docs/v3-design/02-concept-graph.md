# QDA2 Concept Knowledge Graph (Layer 1)

Generated from `data/concepts-*.js` (single source of truth; the Course Builder and Concept Atlas read the same files). 169 concepts in 11 domains, 272 prerequisite edges, 375 related edges. The prerequisite graph is acyclic (checked by `scripts/validate` logic in this project's run log).

## Edge semantics

- **prereq** — must be understood before. Used for Course Builder advisory suggestions. Deliberately sparse: variance is a prerequisite of ANOVA; regression is *not*.
- **related** — conceptual link in either direction, no ordering (atlas edges, "see also").
- **gen** — this concept generalises the target (two-way ANOVA → one-way).
- **alt** — alternative method for the same question (Welch ↔ Student, Spearman ↔ Pearson, replicate weights ↔ Taylor).
- **labs** — laboratories in `data/labs.js` that render the concept.
- **existing** — anchor in the current Next.js site whose content maps to this concept.

Levels: 1 introductory · 2 core undergraduate · 3 advanced undergraduate / MA · 4 specialist.

## Domain overview

| Domain | Concepts | Levels | Lab-linked |
|---|---|---|---|
| A — Mathematical Foundations | 15 | 1–4 | 15 |
| B — Data and Measurement | 10 | 1–2 | 4 |
| C — Descriptive Statistics | 13 | 1–2 | 13 |
| D — Probability | 11 | 1–2 | 11 |
| E — Sampling and Estimation | 13 | 1–3 | 13 |
| F — Statistical Inference | 11 | 1–3 | 11 |
| G — Group Comparisons | 16 | 1–3 | 16 |
| H — Categorical Associations | 11 | 1–3 | 11 |
| I — Survey Statistics | 37 | 1–4 | 36 |
| J — Statistical Modelling | 20 | 2–4 | 20 |
| K — Measurement and Research Practice | 12 | 1–3 | 6 |

## Prerequisite spine (longest chains)

- Algebra and equations → Summation notation → Geometry of distances → Least squares (as a mathematical principle) → The mean as a model → Weighted averages → Expected value and variance of a random variable → Parameters and statistics → Sampling variation → Survey inference → Probability vs nonprobability sampling → Simple random sampling → Inclusion probabilities → Sampling (design) weights → Post-stratification → Raking (iterative proportional fitting) → Calibration → Model-assisted and model-based inference
- Algebra and equations → Summation notation → Geometry of distances → Least squares (as a mathematical principle) → The mean as a model → Weighted averages → Expected value and variance of a random variable → Parameters and statistics → Sampling variation → Sampling distributions → Standard error → Test statistics → Null distributions → p-values → Type I and Type II errors → Multiple comparisons → Post-hoc comparisons
- Algebra and equations → Summation notation → Geometry of distances → Least squares (as a mathematical principle) → The mean as a model → Weighted averages → Expected value and variance of a random variable → Parameters and statistics → Sampling variation → Survey inference → Probability vs nonprobability sampling → Simple random sampling → Inclusion probabilities → Sampling (design) weights → Post-stratification → Raking (iterative proportional fitting) → Calibration
- Algebra and equations → Summation notation → Geometry of distances → Least squares (as a mathematical principle) → The mean as a model → Weighted averages → Expected value and variance of a random variable → Parameters and statistics → Sampling variation → Survey inference → Probability vs nonprobability sampling → Simple random sampling → Inclusion probabilities → Sampling (design) weights → Complex-survey variance estimation → Design effect → Effective sample size
- Algebra and equations → Summation notation → Geometry of distances → Least squares (as a mathematical principle) → The mean as a model → Weighted averages → Expected value and variance of a random variable → Parameters and statistics → Sampling variation → Survey inference → Probability vs nonprobability sampling → Simple random sampling → Inclusion probabilities → Sampling (design) weights → Horvitz–Thompson estimation → Ratio and Hájek estimation → Domain estimation
- Algebra and equations → Summation notation → Geometry of distances → Least squares (as a mathematical principle) → The mean as a model → Weighted averages → Expected value and variance of a random variable → Parameters and statistics → Sampling variation → Sampling distributions → Standard error → Test statistics → Null distributions → p-values → Type I and Type II errors → Statistical power

## Domain A — Mathematical Foundations

### Algebra and equations · Algebra és egyenletek

`math.algebra` · Level 1

Manipulating symbolic expressions and solving equations; isolating a quantity by applying the same operation to both sides.

- **Notation:** a·x + b = c ⇒ x = (c − b)/a
- **Prerequisites:** —
- **Related:** Functions and transformations (`math.functions`)
- **Applications:** Rearranging a formula to solve for n, SE or a cut-off; Reading a regression equation
- **Common misconceptions:** Treating = as 'the answer is' rather than a balance · Dividing only one side when isolating a variable
- **Suggested activities:** Rearrange the SE formula to find the n needed for a target margin · Solve for the raw score given a z-score
- **Labs:** Mathematical Foundations Studio (`math-studio`)

### Functions and transformations · Függvények és transzformációk

`math.functions` · Level 1

A rule assigning one output to each input; shifts, stretches and reflections change the graph predictably.

- **Notation:** f(x), g(x) = a·f(bx + c) + d
- **Prerequisites:** Algebra and equations (`math.algebra`)
- **Related:** Coordinate systems (`math.coordinates`); Standardization (z-scores) (`desc.standardization`)
- **Applications:** Standardisation as a shift-and-scale; Logistic curve as a transformed linear predictor
- **Common misconceptions:** Confusing f(x+c) (horizontal shift) with f(x)+c (vertical shift)
- **Suggested activities:** Drag a, b, c, d and watch the curve move · Map z = (x − μ)/σ onto a shift and a rescale
- **Labs:** Mathematical Foundations Studio (`math-studio`)

### Coordinate systems · Koordináta-rendszerek

`math.coordinates` · Level 1

Locating points by ordered numbers on perpendicular axes; the basis of every scatterplot and geometric picture of data.

- **Notation:** (x, y), (x₁, …, xₚ)
- **Prerequisites:** —
- **Related:** Vectors and matrices (`math.vectors`); Covariance (`desc.covariance`)
- **Applications:** Scatterplots; Observations as points in variable space
- **Common misconceptions:** Reading the dependent variable off the horizontal axis · Assuming axes must start at zero
- **Suggested activities:** Place 10 observations as points, then as columns in a data table and back
- **Labs:** Mathematical Foundations Studio (`math-studio`); Correlation & Regression Lab (`corr-reg-lab`)

### Exponents and logarithms · Hatványok és logaritmusok

`math.exp_log` · Level 2

Repeated multiplication and its inverse; logs turn products into sums and multiplicative change into additive change.

- **Notation:** log(ab) = log a + log b; e^{ln x} = x
- **Prerequisites:** Algebra and equations (`math.algebra`)
- **Related:** Logistic regression introduction (`model.logistic`); Likelihood functions (`prob.likelihood`)
- **Applications:** Log-odds in logistic regression; Log-likelihood; Log transformations of skewed variables
- **Common misconceptions:** log(a + b) = log a + log b · A log transform changes the order of values
- **Suggested activities:** Transform income with log and compare the histogram shape · Convert an odds ratio to a log-odds difference
- **Labs:** Mathematical Foundations Studio (`math-studio`)

### Summation notation · Szumma jelölés

`math.summation` · Level 1

Σ compresses a sum over an index; indices, limits and what is constant inside the sum must be read carefully.

- **Notation:** Σᵢ₌₁ⁿ xᵢ, Σᵢ(xᵢ − x̄) = 0
- **Prerequisites:** Algebra and equations (`math.algebra`)
- **Related:** The mean as a model (`desc.mean`); Variance (`desc.variance`)
- **Applications:** Every formula for a mean, variance, covariance, sum of squares
- **Common misconceptions:** Σxᵢ² equals (Σxᵢ)² · The index i has a value outside the sum
- **Suggested activities:** Expand Σ(xᵢ − x̄)² for n = 4 by hand and check with the lab's term inspector · Prove Σ(xᵢ − x̄) = 0
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Mathematical Foundations Studio (`math-studio`)

### Geometry of distances · Távolságok geometriája

`math.distance` · Level 2

Euclidean distance as the square root of a sum of squared differences; squared distance is additive across dimensions.

- **Notation:** d(a,b) = √Σ(aᵢ − bᵢ)²
- **Prerequisites:** Coordinate systems (`math.coordinates`); Summation notation (`math.summation`)
- **Related:** Variance (`desc.variance`); Least squares estimation (`model.least_squares`); Clustering introduction (`model.clustering`)
- **Applications:** Variance as mean squared distance from the mean; Least squares as minimum squared distance; k-means clustering
- **Common misconceptions:** Distance in a scatterplot equals vertical residual (it does not: OLS minimises vertical distances)
- **Suggested activities:** Compare vertical, horizontal and perpendicular distances to a line for one point
- **Labs:** Mathematical Foundations Studio (`math-studio`); Variance · Regression · ANOVA Lab (`vra-lab`)

### Derivatives and integrals · Deriváltak és integrálok

`math.calculus` · Level 3

Rate of change of a function and the area under its curve; the two operations are inverses.

- **Notation:** f′(x) = df/dx, ∫ₐᵇ f(x)dx
- **Prerequisites:** Functions and transformations (`math.functions`)
- **Related:** Probability density and cumulative distribution (`prob.density`); Optimization (`math.optimization`)
- **Applications:** Probability as area under a density; Finding minima of a loss function; CDF as integral of PDF
- **Common misconceptions:** Density values are probabilities · Slope of the CDF is unrelated to the PDF
- **Suggested activities:** Shade the area under a normal curve and watch the CDF grow · Find where the slope of SSE(b) is zero
- **Labs:** Mathematical Foundations Studio (`math-studio`); Distribution Studio (`distribution-studio`)

### Partial derivatives · Parciális deriváltak

`math.partials` · Level 3

Rate of change of a multivariate function in one coordinate while the others are held fixed.

- **Notation:** ∂f/∂a, ∂f/∂b
- **Prerequisites:** Derivatives and integrals (`math.calculus`)
- **Related:** Least squares estimation (`model.least_squares`); Multiple regression (`model.multiple_regression`)
- **Applications:** Normal equations of least squares; Interpreting a multiple-regression coefficient as 'holding others constant'
- **Common misconceptions:** A partial slope equals the simple-regression slope of the same variable
- **Suggested activities:** Rotate the SSE(a,b) bowl and read the two partials at the minimum
- **Labs:** Mathematical Foundations Studio (`math-studio`)

### Optimization · Optimalizálás

`math.optimization` · Level 3

Finding parameter values that minimise or maximise an objective; first-order conditions and the shape of the objective matter.

- **Notation:** argminₐ,ᵦ Σ(yᵢ − a − bxᵢ)²
- **Prerequisites:** Derivatives and integrals (`math.calculus`)
- **Related:** Least squares estimation (`model.least_squares`); Likelihood functions (`prob.likelihood`)
- **Applications:** Least squares; Maximum likelihood; Raking as iterative constraint satisfaction
- **Common misconceptions:** Any zero-slope point is a minimum · Optimisation and estimation are different things
- **Suggested activities:** Tilt a custom line until SSE stops falling; compare to the OLS solution
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Mathematical Foundations Studio (`math-studio`)

### Vectors and matrices · Vektorok és mátrixok

`math.vectors` · Level 3

Ordered arrays of numbers with addition, scaling and inner products; a data set is an n × p matrix.

- **Notation:** x ∈ ℝⁿ, X ∈ ℝⁿˣᵖ, xᵀy = Σxᵢyᵢ
- **Prerequisites:** Coordinate systems (`math.coordinates`); Summation notation (`math.summation`)
- **Related:** Projections (`math.projection`); Principal component analysis (`model.pca`)
- **Applications:** Centred variables as vectors; covariance as an inner product; Design matrix in regression
- **Common misconceptions:** A matrix is just a table with no algebra · Row and column vectors are interchangeable
- **Suggested activities:** Show two centred variables as arrows; read correlation as the cosine of the angle
- **Labs:** Linear Algebra & PCA Studio (`linalg-pca-studio`)

### Matrix transformations · Mátrixtranszformációk

`math.matrix_transform` · Level 3

Multiplying by a matrix rotates, stretches or shears space; linear transformations preserve lines and the origin.

- **Notation:** y = Ax
- **Prerequisites:** Vectors and matrices (`math.vectors`)
- **Related:** Eigenvectors and eigenvalues (`math.eigen`); Principal component analysis (`model.pca`)
- **Applications:** Rotation to principal axes; Whitening and standardising a multivariate cloud
- **Common misconceptions:** Matrix multiplication is commutative
- **Suggested activities:** Apply a 2×2 matrix to a point cloud and watch the ellipse change
- **Labs:** Linear Algebra & PCA Studio (`linalg-pca-studio`)

### Projections · Vetítések

`math.projection` · Level 3

The closest point in a subspace to a vector; the residual is orthogonal to the subspace.

- **Notation:** ŷ = X(XᵀX)⁻¹Xᵀy, (y − ŷ) ⊥ X
- **Prerequisites:** Vectors and matrices (`math.vectors`); Geometry of distances (`math.distance`)
- **Related:** Least squares estimation (`model.least_squares`); Residuals (`model.residuals`)
- **Applications:** OLS fitted values as a projection of y onto the column space of X; Why SST = SSR + SSE (Pythagoras)
- **Common misconceptions:** Residuals are uncorrelated with y (they are uncorrelated with ŷ and with X)
- **Suggested activities:** Drop a perpendicular from y onto the line spanned by x and read off the slope
- **Labs:** Linear Algebra & PCA Studio (`linalg-pca-studio`)

### Eigenvectors and eigenvalues · Sajátvektorok és sajátértékek

`math.eigen` · Level 4

Directions a matrix only stretches, and the stretch factors; for a covariance matrix they are the axes and variances of the data ellipse.

- **Notation:** Σv = λv
- **Prerequisites:** Matrix transformations (`math.matrix_transform`)
- **Related:** Principal component analysis (`model.pca`)
- **Applications:** Principal components; Total variance = Σλ
- **Common misconceptions:** Eigenvalues are correlations · The first component is always 'the construct'
- **Suggested activities:** Rotate a probe direction through a 2-D cloud; the variance along it peaks at the first eigenvector
- **Labs:** Linear Algebra & PCA Studio (`linalg-pca-studio`)

### Least squares (as a mathematical principle) · Legkisebb négyzetek elve

`math.least_squares` · Level 2

Choosing parameters that minimise the sum of squared deviations; the mean is the least-squares constant, the OLS line the least-squares line.

- **Notation:** minₐ Σ(yᵢ − a)² ⇒ a = ȳ
- **Prerequisites:** Summation notation (`math.summation`); Geometry of distances (`math.distance`)
- **Related:** The mean as a model (`desc.mean`); Least squares estimation (`model.least_squares`); Optimization (`math.optimization`)
- **Applications:** Mean as least-squares centre; Regression line; ANOVA group means
- **Common misconceptions:** Least squares minimises the sum of deviations (it minimises squares; the sum of deviations is zero at the mean regardless)
- **Suggested activities:** Slide a reference line across the dot plot; the sum of squares bowl bottoms out at the mean
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`)

### Likelihood functions · Likelihood-függvények

`prob.likelihood` · Level 4

The probability (density) of the observed data viewed as a function of unknown parameters; maximising it gives the ML estimate.

- **Notation:** L(θ | data) = Πᵢ f(xᵢ | θ), ℓ = log L
- **Prerequisites:** Probability distributions (`prob.distributions`); Exponents and logarithms (`math.exp_log`); Optimization (`math.optimization`)
- **Related:** Logistic regression introduction (`model.logistic`); Point estimation (`est.point_estimation`)
- **Applications:** Logistic regression fitting; Model comparison with deviance
- **Common misconceptions:** Likelihood is the probability that the parameter is true
- **Suggested activities:** Slide p for a binomial sample and watch L(p) rise and fall
- **Labs:** Mathematical Foundations Studio (`math-studio`); Probability Playground (`probability-playground`)

## Domain B — Data and Measurement

### Research questions · Kutatási kérdések

`data.research_question` · Level 1 · Existing: `/measurement#roles`

A precise, answerable question that fixes the population, the variables and the kind of relationship or quantity sought.

- **Notation:** —
- **Prerequisites:** —
- **Related:** Variable roles (X, Y, Z) (`data.variable_roles`); Research design (`practice.research_design`)
- **Applications:** Every analysis chain in the course starts here
- **Common misconceptions:** A topic is a research question · The method is chosen before the question is fixed
- **Suggested activities:** Rewrite three topics as questions naming X, Y and the population
- **Labs:** — (text/assessment only)

### Variables and observations · Változók és megfigyelések

`data.variables` · Level 1

A variable is a characteristic that varies across observations (units); a data matrix has one row per observation and one column per variable.

- **Notation:** xᵢⱼ: observation i, variable j
- **Prerequisites:** —
- **Related:** Measurement levels (`data.measurement_levels`); Coordinate systems (`math.coordinates`)
- **Applications:** Reading an SPSS data view; Deciding what a row is in survey data
- **Common misconceptions:** A column of values is the variable's 'answer' · Confusing a variable with its value label
- **Suggested activities:** Identify units and variables in a tidy and an untidy table
- **Labs:** — (text/assessment only)

### Measurement levels · Mérési szintek

`data.measurement_levels` · Level 1 · Existing: `/measurement#understand`

Nominal: categories without order. Ordinal: ordered categories without equal distances. Scale (interval/ratio): numbers with meaningful distances.

- **Notation:** nominal < ordinal < interval < ratio
- **Prerequisites:** Variables and observations (`data.variables`)
- **Related:** Variable roles (X, Y, Z) (`data.variable_roles`); Mean, median and mode (`desc.central_tendency`)
- **Applications:** Method choice (crosstab vs correlation vs t-test); Which centre and spread measures are meaningful
- **Common misconceptions:** Numeric codes make a variable scale · Likert items are automatically interval · Level equals role
- **Suggested activities:** Classify 12 survey variables; justify borderline cases (age groups, Likert sums)
- **Labs:** — (text/assessment only)

### Variable roles (X, Y, Z) · Változószerepek (X, Y, Z)

`data.variable_roles` · Level 1 · Existing: `/measurement#roles`

The research question assigns roles: independent X (compared across), dependent Y (outcome), control Z (held constant).

- **Notation:** X → Y | Z
- **Prerequisites:** Research questions (`data.research_question`); Variables and observations (`data.variables`)
- **Related:** Measurement levels (`data.measurement_levels`); Lazarsfeld paradigm (`cat.lazarsfeld`)
- **Applications:** Which percentage to compute in a crosstab; Which variable goes in 'Grouping variable' in SPSS
- **Common misconceptions:** The dependent variable is the one 'we care about' regardless of question · Role is a property of the variable, not of the question
- **Suggested activities:** Same two variables, two research questions, roles swap
- **Labs:** — (text/assessment only)

### Operationalization · Operacionalizálás

`data.operationalization` · Level 2

Translating a concept into observable indicators and a measurement procedure.

- **Notation:** concept → dimensions → indicators → items
- **Prerequisites:** Variables and observations (`data.variables`)
- **Related:** Measurement validity (`measure.validity`); Composite indexes (`measure.composite_index`); Questionnaire design (`survey.questionnaire`)
- **Applications:** Measuring 'political knowledge' with quiz items; Designing an index
- **Common misconceptions:** One question measures a concept · Operationalisation is objective and unique
- **Suggested activities:** Operationalise 'trust in institutions' two different ways and compare what each misses
- **Labs:** Measurement & Index Lab (`measurement-index-lab`)

### Data coding and recoding · Adatkódolás és átkódolás

`data.coding` · Level 1 · Existing: `/indices#try`

Assigning numeric codes to categories and transforming codes (collapse, reverse, dichotomise) without losing the meaning of the measurement.

- **Notation:** RECODE x (1=5)(2=4)…
- **Prerequisites:** Measurement levels (`data.measurement_levels`)
- **Related:** Reverse scoring (`measure.reverse_scoring`); Variable transformations (`data.transformations`)
- **Applications:** Collapsing age into groups; Reverse-scoring negatively worded items
- **Common misconceptions:** Recoding into fewer categories never loses information · Codes carry arithmetic meaning for nominal variables
- **Suggested activities:** Recode a 7-point item into 3 groups two ways; compare crosstab conclusions
- **Labs:** — (text/assessment only)

### Missing values · Hiányzó értékek

`data.missing` · Level 2

Values not observed; the mechanism (MCAR, MAR, MNAR) determines whether simple deletion biases results.

- **Notation:** MCAR / MAR / MNAR
- **Prerequisites:** Data coding and recoding (`data.coding`)
- **Related:** Missing-data handling in surveys (`survey.missing_data`); Nonresponse and selection bias (`survey.nonresponse`)
- **Applications:** 'Don't know' and refusals in survey items; Listwise vs pairwise deletion in SPSS
- **Common misconceptions:** Missing values are always random · Replacing with the mean is harmless
- **Suggested activities:** Delete values under three mechanisms and watch the mean and the X–Y slope move
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Data quality · Adatminőség

`data.quality` · Level 1

Checking ranges, impossible combinations, duplicates and outliers before analysis; documenting every correction.

- **Notation:** —
- **Prerequisites:** Variables and observations (`data.variables`)
- **Related:** Outliers and influence (`desc.outliers`); Reproducibility (`practice.reproducibility`)
- **Applications:** First step of the applied workflow week
- **Common misconceptions:** Outliers should be deleted · Software catches invalid values automatically
- **Suggested activities:** Find five planted errors in a 40-row data set using frequencies and descriptives
- **Labs:** — (text/assessment only)

### Variable transformations · Változótranszformációk

`data.transformations` · Level 2

Applying a function to a variable (centring, scaling, log, rank) to change its scale or shape while keeping its information.

- **Notation:** x* = (x − c)/s, log x, rank(x)
- **Prerequisites:** Functions and transformations (`math.functions`); Data coding and recoding (`data.coding`)
- **Related:** Standardization (z-scores) (`desc.standardization`); Exponents and logarithms (`math.exp_log`); Spearman's rank correlation (`corr.spearman`)
- **Applications:** Centring before interactions; Log income; Ranks before Spearman
- **Common misconceptions:** Standardising changes the correlation · A log transform makes any variable normal
- **Suggested activities:** Apply four transformations to a skewed variable and track mean, SD and skewness
- **Labs:** Distribution Studio (`distribution-studio`)

### Data visualization fundamentals · Adatvizualizáció alapjai

`data.visualization` · Level 1

Choosing a visual encoding that matches measurement level and question: bars for categories, histograms for distributions, scatter for two scale variables.

- **Notation:** —
- **Prerequisites:** Measurement levels (`data.measurement_levels`)
- **Related:** Distribution comparisons (`desc.distribution_comparison`); Statistical reporting (`practice.reporting`)
- **Applications:** Every lab's canvas; Reporting results
- **Common misconceptions:** Pie charts compare categories well · A truncated axis is neutral
- **Suggested activities:** Same data, four charts: which question does each answer?
- **Labs:** Distribution Studio (`distribution-studio`)

## Domain C — Descriptive Statistics

### Frequencies and proportions · Gyakoriságok és arányok

`desc.frequencies` · Level 1 · Existing: `/bonus/sopranos#frequencies`

Counts of each category and their share of the total; the proportion is the mean of a 0/1 indicator.

- **Notation:** p̂ = f/n
- **Prerequisites:** Measurement levels (`data.measurement_levels`)
- **Related:** Contingency tables (`cat.contingency`); The mean as a model (`desc.mean`)
- **Applications:** Frequency tables; Percentages in crosstabs; Estimating a population proportion
- **Common misconceptions:** Percent and percentage points are the same · Valid percent and percent are interchangeable
- **Suggested activities:** Build a frequency table by hand; recompute with and without missing values
- **Labs:** Categorical Data Lab (`categorical-lab`)

### Mean, median and mode · Átlag, medián és módusz

`desc.central_tendency` · Level 1 · Existing: `/variance#understand`

Three centres: the arithmetic mean (balance point), the median (middle value) and the mode (most frequent). Which is meaningful depends on level and shape.

- **Notation:** x̄ = Σxᵢ/n
- **Prerequisites:** Summation notation (`math.summation`); Measurement levels (`data.measurement_levels`)
- **Related:** Skewness and outliers (`desc.skewness`); Least squares (as a mathematical principle) (`math.least_squares`)
- **Applications:** Describing income (median) vs test scores (mean)
- **Common misconceptions:** The mean is always the 'typical' value · Half the values are above the mean
- **Suggested activities:** Drag one observation far out: mean moves, median does not (MeanPull)
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Distribution Studio (`distribution-studio`)

### The mean as a model · Az átlag mint modell

`desc.mean` · Level 1 · Existing: `/variance#squares`

The mean is the constant that minimises the sum of squared deviations; deviations from it sum to zero. It is the simplest statistical model.

- **Notation:** x̄ = argminₐ Σ(xᵢ − a)², Σ(xᵢ − x̄) = 0
- **Prerequisites:** Mean, median and mode (`desc.central_tendency`); Least squares (as a mathematical principle) (`math.least_squares`)
- **Related:** Variance (`desc.variance`); Residuals (`model.residuals`)
- **Applications:** Baseline model in regression (SST); Group means in ANOVA
- **Common misconceptions:** The mean is just a formula, not a prediction
- **Suggested activities:** Stage 1 of the VRA lab: layers observations → mean → deviations → squares → sum
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`)

### Weighted averages · Súlyozott átlagok

`desc.weighted_mean` · Level 2

A mean in which each observation counts proportionally to a weight; the ordinary mean is the special case of equal weights.

- **Notation:** x̄_w = Σwᵢxᵢ / Σwᵢ
- **Prerequisites:** The mean as a model (`desc.mean`)
- **Related:** Sampling (design) weights (`survey.weights`); Ratio and Hájek estimation (`survey.hajek`); Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`)
- **Applications:** Grand mean from unequal group sizes; Survey estimates with design weights; GPA
- **Common misconceptions:** Averaging group means gives the overall mean regardless of group sizes
- **Suggested activities:** Change group sizes in the ANOVA stage and watch the grand mean slide toward the larger group
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Quantiles and percentiles · Kvantilisek és percentilisek

`desc.quantiles` · Level 1 · Existing: `/indices#cut`

Values below which a given share of the data falls; quartiles split the data into four equal parts.

- **Notation:** Q₁, Q₂ = median, Q₃, P₉₀
- **Prerequisites:** Mean, median and mode (`desc.central_tendency`)
- **Related:** Interquartile range (`desc.iqr`); Probability density and cumulative distribution (`prob.density`)
- **Applications:** Percentile cut-offs for an index; Boxplots; Reading a CDF
- **Common misconceptions:** The 90th percentile is 90 % of the maximum · Quartiles are always equally wide intervals
- **Suggested activities:** Cut an index at percentiles vs absolute values; compare group sizes
- **Labs:** Distribution Studio (`distribution-studio`); Measurement & Index Lab (`measurement-index-lab`)

### Variance · Variancia

`desc.variance` · Level 1 · Existing: `/variance#squares`

The average squared deviation from the mean (sum of squares divided by n − 1 in a sample). Geometrically: the area of the average square.

- **Notation:** s² = Σ(xᵢ − x̄)²/(n − 1)
- **Prerequisites:** The mean as a model (`desc.mean`); Summation notation (`math.summation`)
- **Related:** Standard deviation (`desc.sd`); Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`); Model fit: SST = SSR + SSE (`model.sst`); Standard error (`est.standard_error`)
- **Applications:** Every later method decomposes or estimates a variance
- **Common misconceptions:** Variance is in the original unit · n − 1 is arbitrary · Variance measures distance from the median
- **Suggested activities:** Build the squares layer by layer; toggle n vs n − 1 and read the ratio
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`)

### Standard deviation · Szórás

`desc.sd` · Level 1 · Existing: `/variance#squares`

The square root of the variance; the side of the average square, in the original unit.

- **Notation:** s = √s²
- **Prerequisites:** Variance (`desc.variance`)
- **Related:** Standardization (z-scores) (`desc.standardization`); Standard error (`est.standard_error`); The normal distribution (`prob.normal`)
- **Applications:** Reporting spread; z-scores; 68–95–99.7 rule
- **Common misconceptions:** SD is the average absolute deviation · SD and SE are the same thing
- **Suggested activities:** Compare four groups with the same mean and different SDs (SameMean)
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Distribution Studio (`distribution-studio`)

### Interquartile range · Interkvartilis terjedelem

`desc.iqr` · Level 1

Q₃ − Q₁; the width of the middle half of the data, robust to outliers.

- **Notation:** IQR = Q₃ − Q₁
- **Prerequisites:** Quantiles and percentiles (`desc.quantiles`)
- **Related:** Standard deviation (`desc.sd`); Outliers and influence (`desc.outliers`)
- **Applications:** Boxplot box; Outlier fences at 1.5·IQR
- **Common misconceptions:** IQR contains exactly 50 % of observations in every sample (ties and definitions vary)
- **Suggested activities:** Add an extreme value: SD jumps, IQR barely moves
- **Labs:** Distribution Studio (`distribution-studio`)

### Skewness and outliers · Ferdeség és kiugró értékek

`desc.skewness` · Level 2 · Existing: `/bonus/sopranos#frequencies`

Asymmetry of a distribution (long tail pulls the mean toward it) and observations far from the bulk of the data.

- **Notation:** G₁ (SPSS small-sample skewness)
- **Prerequisites:** Mean, median and mode (`desc.central_tendency`); Standard deviation (`desc.sd`)
- **Related:** Interquartile range (`desc.iqr`); Variable transformations (`data.transformations`); Model diagnostics (`model.diagnostics`)
- **Applications:** Choosing median over mean; Deciding on a log transform
- **Common misconceptions:** Right-skewed means the peak is on the right · Outliers are errors
- **Suggested activities:** Drag the tail of a distribution and watch mean, median and G₁
- **Labs:** Distribution Studio (`distribution-studio`)

### Outliers and influence · Kiugró és befolyásos pontok

`desc.outliers` · Level 2

Observations distant from the rest; influential points change estimates substantially when removed.

- **Notation:** 1.5·IQR fence; Cook's D
- **Prerequisites:** Skewness and outliers (`desc.skewness`); Interquartile range (`desc.iqr`)
- **Related:** Model diagnostics (`model.diagnostics`); Correlation (Pearson's r) (`corr.pearson`)
- **Applications:** Checking a correlation driven by one case; Data cleaning
- **Common misconceptions:** Outliers should always be deleted · An outlier in y is necessarily influential
- **Suggested activities:** Drag one point in the regression stage: when does the slope move most?
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Model Diagnostics Studio (`model-diagnostics-studio`)

### Standardization (z-scores) · Standardizálás (z-értékek)

`desc.standardization` · Level 2 · Existing: `/indices#try`

Expressing a value as its distance from the mean in SD units; makes variables with different units comparable.

- **Notation:** z = (x − x̄)/s
- **Prerequisites:** Standard deviation (`desc.sd`); Functions and transformations (`math.functions`)
- **Related:** The normal distribution (`prob.normal`); Correlation (Pearson's r) (`corr.pearson`); Principal component analysis (`model.pca`)
- **Applications:** Comparing items before summing an index; Standardised regression coefficients; Normal-table look-ups
- **Common misconceptions:** z-scores make a distribution normal · z = 2 means the value is twice the mean
- **Suggested activities:** Standardise two variables with different units; the scatterplot shape does not change
- **Labs:** Distribution Studio (`distribution-studio`); Measurement & Index Lab (`measurement-index-lab`)

### Covariance · Kovariancia

`desc.covariance` · Level 2

Average product of paired deviations; positive when x and y deviate in the same direction. Its scale depends on units.

- **Notation:** s_xy = Σ(xᵢ − x̄)(yᵢ − ȳ)/(n − 1)
- **Prerequisites:** Variance (`desc.variance`); Coordinate systems (`math.coordinates`)
- **Related:** Correlation (Pearson's r) (`corr.pearson`); Slope and intercept (`model.slope`); Vectors and matrices (`math.vectors`)
- **Applications:** Numerator of r and of the regression slope; Covariance matrix in PCA
- **Common misconceptions:** Covariance of 0 means independence · Larger covariance means stronger relationship
- **Suggested activities:** Shade the deviation rectangles for each point; sum the signed areas
- **Labs:** Correlation & Regression Lab (`corr-reg-lab`)

### Distribution comparisons · Eloszlások összehasonlítása

`desc.distribution_comparison` · Level 1 · Existing: `/variance#understand`

Comparing groups by whole distributions (shape, centre, spread) rather than one number.

- **Notation:** —
- **Prerequisites:** Standard deviation (`desc.sd`); Data visualization fundamentals (`data.visualization`)
- **Related:** Mean differences (`group.mean_difference`); Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`)
- **Applications:** Before any t-test or ANOVA; Checking the equal-variance assumption visually
- **Common misconceptions:** Equal means imply similar groups
- **Suggested activities:** Four groups with the same mean and median but different shapes (SameMean, SpreadPatterns)
- **Labs:** Distribution Studio (`distribution-studio`); Variance · Regression · ANOVA Lab (`vra-lab`)

## Domain D — Probability

### Events and sample spaces · Események és eseménytér

`prob.events` · Level 1

The set of all possible outcomes and subsets of it; probability assigns numbers in [0,1] that add over disjoint events.

- **Notation:** Ω, A ⊆ Ω, P(A ∪ B) = P(A) + P(B) − P(A ∩ B)
- **Prerequisites:** —
- **Related:** Frequencies and proportions (`desc.frequencies`); Conditional probability (`prob.conditional`)
- **Applications:** Interpreting percentages as probabilities under random sampling
- **Common misconceptions:** Probabilities of non-exclusive events add · Equally likely outcomes are the default
- **Suggested activities:** Build Ω for two dice; shade events and read probabilities as areas
- **Labs:** Probability Playground (`probability-playground`)

### Independence · Függetlenség

`prob.independence` · Level 1

Two events are independent when knowing one does not change the probability of the other; the joint probability factorises.

- **Notation:** P(A ∩ B) = P(A)·P(B)
- **Prerequisites:** Events and sample spaces (`prob.events`)
- **Related:** Conditional probability (`prob.conditional`); Expected frequencies (`cat.expected_frequencies`); Chi-square test of independence (`cat.chi_square`)
- **Applications:** Expected counts in a chi-square test; iid sampling assumption
- **Common misconceptions:** Independent means mutually exclusive · Independence in the sample implies independence in the population
- **Suggested activities:** Fill a 2×2 table so that rows are independent; derive the expected-count formula
- **Labs:** Probability Playground (`probability-playground`); Categorical Data Lab (`categorical-lab`)

### Conditional probability · Feltételes valószínűség

`prob.conditional` · Level 2

Probability of A given that B occurred: restrict the sample space to B. Conditional percentages in a crosstab are its sample analogue.

- **Notation:** P(A | B) = P(A ∩ B)/P(B)
- **Prerequisites:** Events and sample spaces (`prob.events`)
- **Related:** Conditional percentages (`cat.conditional_percent`); Bayes' theorem (`prob.bayes`); p-values (`infer.p_value`)
- **Applications:** Row percentages; p-values as P(data | H₀); Sensitivity and specificity
- **Common misconceptions:** P(A | B) = P(B | A) · Conditioning changes the outcome rather than the information
- **Suggested activities:** Shade B, then A within B; compare with shading A first (the transposition fallacy)
- **Labs:** Probability Playground (`probability-playground`)

### Bayes' theorem · Bayes-tétel

`prob.bayes` · Level 2

Reverses a conditional probability using the base rate; the posterior depends heavily on the prior when the test is imperfect.

- **Notation:** P(H | D) = P(D | H)P(H)/P(D)
- **Prerequisites:** Conditional probability (`prob.conditional`)
- **Related:** p-values (`infer.p_value`); Type I and Type II errors (`infer.errors`)
- **Applications:** Why a p-value is not P(H₀ | data); Diagnostic testing
- **Common misconceptions:** A 95 % accurate test gives a 95 % posterior
- **Suggested activities:** Natural-frequency tree with 1 000 people; drag the base rate
- **Labs:** Probability Playground (`probability-playground`)

### Discrete and continuous random variables · Diszkrét és folytonos valószínűségi változók

`prob.random_variable` · Level 2

A numeric outcome of a random process; discrete variables have probability masses, continuous ones densities.

- **Notation:** X: Ω → ℝ, P(X = x), f(x)
- **Prerequisites:** Events and sample spaces (`prob.events`); Measurement levels (`data.measurement_levels`)
- **Related:** Probability distributions (`prob.distributions`); Expected value and variance of a random variable (`prob.expected_value`)
- **Applications:** Sample statistics as random variables (the key idea of inference)
- **Common misconceptions:** A random variable is a variable with random missing values · P(X = x) > 0 for continuous X
- **Suggested activities:** Roll, measure, count: classify ten outcomes as discrete or continuous
- **Labs:** Probability Playground (`probability-playground`)

### Expected value and variance of a random variable · Várható érték és variancia

`prob.expected_value` · Level 2

The probability-weighted mean of a random variable, and the expected squared deviation from it; the population analogues of x̄ and s².

- **Notation:** E[X] = Σx·P(X = x), Var(X) = E[(X − μ)²]
- **Prerequisites:** Discrete and continuous random variables (`prob.random_variable`); Weighted averages (`desc.weighted_mean`)
- **Related:** Parameters and statistics (`est.parameters`); Estimator bias and consistency (`est.bias`); Law of large numbers (`prob.lln`)
- **Applications:** Defining unbiasedness; Expected count in a chi-square cell
- **Common misconceptions:** The expected value is the most likely value · E[X] must be a possible outcome
- **Suggested activities:** Expected Value Lab: build a lottery, compute E and Var, then simulate and compare
- **Labs:** Expected Value Lab (`expected-value-lab`)

### Probability distributions · Valószínűségi eloszlások

`prob.distributions` · Level 2

A complete description of how probability is spread over the values of a random variable; parametrised families share a shape.

- **Notation:** X ~ F(θ)
- **Prerequisites:** Discrete and continuous random variables (`prob.random_variable`)
- **Related:** Bernoulli, binomial, normal and Poisson distributions (`prob.named_distributions`); Probability density and cumulative distribution (`prob.density`); Sampling distributions (`est.sampling_distribution`)
- **Applications:** Null distributions; Population models for simulation
- **Common misconceptions:** 'Distribution' means histogram of the sample only
- **Suggested activities:** Distribution Studio: switch families, drag parameters, overlay a sample histogram
- **Labs:** Distribution Studio (`distribution-studio`)

### Bernoulli, binomial, normal and Poisson distributions · Bernoulli-, binomiális, normális és Poisson-eloszlás

`prob.named_distributions` · Level 2

Four workhorse families: one yes/no trial, the count of successes in n trials, the bell curve of sums and averages, and the count of rare events.

- **Notation:** Bern(p), Bin(n,p), N(μ,σ²), Pois(λ)
- **Prerequisites:** Probability distributions (`prob.distributions`)
- **Related:** The normal distribution (`prob.normal`); Central limit theorem (`est.clt`); Logistic regression introduction (`model.logistic`)
- **Applications:** Proportions (binomial); Means (normal); Event counts (Poisson)
- **Common misconceptions:** Everything is normal · Binomial with large n is 'exactly' normal
- **Suggested activities:** Morph Bin(n, p) into the normal by dragging n
- **Labs:** Distribution Studio (`distribution-studio`)

### The normal distribution · Normális eloszlás

`prob.normal` · Level 2

Symmetric bell-shaped family determined by mean and SD; 68/95/99.7 % within 1/2/3 SD; sums and means tend toward it.

- **Notation:** N(μ,σ²), z = (x − μ)/σ
- **Prerequisites:** Bernoulli, binomial, normal and Poisson distributions (`prob.named_distributions`); Standardization (z-scores) (`desc.standardization`)
- **Related:** Central limit theorem (`est.clt`); Null distributions (`infer.null_distribution`); Test statistics (`infer.test_statistic`)
- **Applications:** z-tests; Confidence intervals; Normal approximations
- **Common misconceptions:** Data must be normal for every test · The normal curve's height is a probability
- **Suggested activities:** Shade tail areas; drag σ and watch the 95 % band
- **Labs:** Distribution Studio (`distribution-studio`)

### Probability density and cumulative distribution · Sűrűség- és eloszlásfüggvény

`prob.density` · Level 2

The PDF describes relative likelihood; probability is the area under it between two values. The CDF gives P(X ≤ x) directly.

- **Notation:** P(a < X ≤ b) = ∫ₐᵇ f(x)dx = F(b) − F(a)
- **Prerequisites:** Probability distributions (`prob.distributions`); Derivatives and integrals (`math.calculus`)
- **Related:** Quantiles and percentiles (`desc.quantiles`); p-values (`infer.p_value`)
- **Applications:** Reading a p-value as a tail area; Percentiles from the CDF
- **Common misconceptions:** f(x) is the probability of x · The CDF can decrease
- **Suggested activities:** Link PDF and CDF panels: drag x on one, the other updates
- **Labs:** Distribution Studio (`distribution-studio`)

### Law of large numbers · Nagy számok törvénye

`prob.lln` · Level 2

As n grows, the sample mean converges to the expected value; averages stabilise, individual outcomes do not.

- **Notation:** x̄ₙ → μ as n → ∞
- **Prerequisites:** Expected value and variance of a random variable (`prob.expected_value`)
- **Related:** Central limit theorem (`est.clt`); Consistency and precision (`est.consistency`); Sampling variation (`est.sampling_variation`)
- **Applications:** Why bigger samples give more precise estimates; Simulation accuracy
- **Common misconceptions:** The law 'corrects' a run of bad luck (gambler's fallacy) · Large n makes the sample representative
- **Suggested activities:** Running mean of 1 000 coin flips; restart with different seeds
- **Labs:** Expected Value Lab (`expected-value-lab`); Sampling Universe (`sampling-universe`)

## Domain E — Sampling and Estimation

### Populations and samples · Populáció és minta

`est.population_sample` · Level 1

The population is the full set of units a question is about; a sample is the subset actually observed. Inference bridges the two.

- **Notation:** N (population), n (sample)
- **Prerequisites:** Variables and observations (`data.variables`)
- **Related:** Target population (`survey.target_population`); Parameters and statistics (`est.parameters`)
- **Applications:** Framing every inferential claim
- **Common misconceptions:** A large sample is a population · The population is 'everyone'
- **Suggested activities:** Sampling Universe: see the whole population, draw a sample, compare
- **Labs:** Sampling Universe (`sampling-universe`)

### Parameters and statistics · Paraméterek és statisztikák

`est.parameters` · Level 1

A parameter is a fixed, unknown population quantity; a statistic is computed from a sample and varies from sample to sample.

- **Notation:** μ, σ, π (parameters); x̄, s, p̂ (statistics)
- **Prerequisites:** Populations and samples (`est.population_sample`); Expected value and variance of a random variable (`prob.expected_value`)
- **Related:** Sampling variation (`est.sampling_variation`); Point estimation (`est.point_estimation`)
- **Applications:** Reading Greek vs Latin letters in formulas
- **Common misconceptions:** x̄ is the population mean · Parameters vary
- **Suggested activities:** Draw 20 samples: the parameter stays, the statistic moves
- **Labs:** Sampling Universe (`sampling-universe`)

### Sampling variation · Mintavételi ingadozás

`est.sampling_variation` · Level 1

Different random samples from the same population give different statistics; this variation is predictable in the aggregate.

- **Notation:** x̄₁ ≠ x̄₂ ≠ …
- **Prerequisites:** Parameters and statistics (`est.parameters`)
- **Related:** Sampling distributions (`est.sampling_distribution`); Standard error (`est.standard_error`); Law of large numbers (`prob.lln`)
- **Applications:** The reason inference exists
- **Common misconceptions:** A difference between two samples proves a population difference
- **Suggested activities:** Repeat sampling 100 times; watch the dot plot of x̄ build up
- **Labs:** Sampling Universe (`sampling-universe`)

### Sampling distributions · Mintavételi eloszlás

`est.sampling_distribution` · Level 2

The distribution of a statistic over all possible samples of size n; its spread is the standard error, its shape often normal.

- **Notation:** x̄ ~ N(μ, σ²/n) (approx.)
- **Prerequisites:** Sampling variation (`est.sampling_variation`); Probability distributions (`prob.distributions`)
- **Related:** Central limit theorem (`est.clt`); Null distributions (`infer.null_distribution`); Standard error (`est.standard_error`)
- **Applications:** Null distributions of t, F, χ²; Confidence intervals
- **Common misconceptions:** The sampling distribution is the distribution of the sample · It is observed, not theoretical
- **Suggested activities:** Three panels: population, one sample, distribution of x̄ — all synchronised
- **Labs:** Sampling Universe (`sampling-universe`)

### Central limit theorem · Centrális határeloszlás-tétel

`est.clt` · Level 2

For large n the sampling distribution of a mean (or sum) is approximately normal whatever the population shape.

- **Notation:** √n(x̄ − μ)/σ → N(0,1)
- **Prerequisites:** Sampling distributions (`est.sampling_distribution`); The normal distribution (`prob.normal`)
- **Related:** Test statistics (`infer.test_statistic`); Confidence intervals (`est.confidence_interval`)
- **Applications:** Justifying t-tests with non-normal data at moderate n
- **Common misconceptions:** The CLT makes the data normal · n = 30 is a universal threshold
- **Suggested activities:** Pick a skewed population; increase n from 2 to 100 and watch the x̄ distribution
- **Labs:** Sampling Universe (`sampling-universe`)

### Standard error · Standard hiba

`est.standard_error` · Level 2 · Existing: `/variance#error`

The SD of a statistic's sampling distribution; for a mean, σ/√n, estimated by s/√n. It shrinks with √n, not n.

- **Notation:** SE(x̄) = s/√n
- **Prerequisites:** Sampling distributions (`est.sampling_distribution`); Standard deviation (`desc.sd`)
- **Related:** Confidence intervals (`est.confidence_interval`); Test statistics (`infer.test_statistic`); Standard error of a difference (`group.se_difference`); Design effect (`survey.design_effect`)
- **Applications:** Denominator of t; Margin of error
- **Common misconceptions:** SE and SD are interchangeable · Doubling n halves the SE
- **Suggested activities:** ErrorDance: residual spread drives SE; quadruple n to halve it
- **Labs:** Sampling Universe (`sampling-universe`); Variance · Regression · ANOVA Lab (`vra-lab`)

### Point estimation · Pontbecslés

`est.point_estimation` · Level 2

Using a statistic as a single best guess for a parameter; different estimators of the same parameter can have different properties.

- **Notation:** θ̂
- **Prerequisites:** Parameters and statistics (`est.parameters`)
- **Related:** Estimator bias and consistency (`est.bias`); Likelihood functions (`prob.likelihood`); Horvitz–Thompson estimation (`survey.horvitz_thompson`)
- **Applications:** x̄ for μ; p̂ for π; HT estimator for a total
- **Common misconceptions:** There is one 'correct' estimator
- **Suggested activities:** Compare mean, median and trimmed mean as estimators of μ over repeated samples
- **Labs:** Sampling Universe (`sampling-universe`)

### Estimator bias and consistency · Torzítás és konzisztencia

`est.bias` · Level 3

Bias: the expected estimate differs from the parameter. Consistency: the estimator converges to the parameter as n grows. An estimator can be biased but consistent.

- **Notation:** Bias(θ̂) = E[θ̂] − θ
- **Prerequisites:** Point estimation (`est.point_estimation`); Expected value and variance of a random variable (`prob.expected_value`)
- **Related:** Consistency and precision (`est.consistency`); Nonresponse and selection bias (`survey.nonresponse`); Variance (`desc.variance`)
- **Applications:** Why s² uses n − 1; Why a convenience sample does not fix itself with more n
- **Common misconceptions:** Bias is random error · More data removes bias
- **Suggested activities:** Overlay the sampling distributions of s²(n) and s²(n−1) on σ²
- **Labs:** Sampling Universe (`sampling-universe`)

### Consistency and precision · Konzisztencia és pontosság

`est.consistency` · Level 3

Precision is the inverse of sampling variance; a consistent estimator's precision grows without bound with n.

- **Notation:** Var(θ̂) → 0
- **Prerequisites:** Estimator bias and consistency (`est.bias`); Law of large numbers (`prob.lln`)
- **Related:** Precision and sample size (`est.sample_size`); Effective sample size (`survey.effective_n`)
- **Applications:** Planning sample size
- **Common misconceptions:** Precision implies accuracy
- **Suggested activities:** Target diagram: biased-precise vs unbiased-imprecise
- **Labs:** Sampling Universe (`sampling-universe`)

### Confidence intervals · Konfidencia-intervallumok

`est.confidence_interval` · Level 2

A range computed from the sample that would contain the parameter in a stated share (e.g. 95 %) of repeated samples.

- **Notation:** x̄ ± t·SE
- **Prerequisites:** Standard error (`est.standard_error`); Central limit theorem (`est.clt`)
- **Related:** Coverage probability (`est.coverage`); p-values (`infer.p_value`); Confidence interval for a difference (`group.ci_difference`)
- **Applications:** Reporting an effect with its uncertainty
- **Common misconceptions:** There is a 95 % probability μ is in this interval · 95 % of the data lie in the CI
- **Suggested activities:** Confidence Interval Explorer: 100 intervals, count those missing μ
- **Labs:** Confidence Interval Explorer (`ci-explorer`)

### Coverage probability · Lefedési valószínűség

`est.coverage` · Level 3

The actual long-run share of intervals that contain the parameter; nominal 95 % can be violated under wrong assumptions or complex designs.

- **Notation:** P(θ ∈ CI) vs 1 − α
- **Prerequisites:** Confidence intervals (`est.confidence_interval`)
- **Related:** Complex-survey variance estimation (`survey.variance_estimation`); Assumptions and robustness (`infer.assumptions`)
- **Applications:** Validating an interval method by simulation; Why naive CIs under-cover in cluster samples
- **Common misconceptions:** Nominal and actual coverage always agree
- **Suggested activities:** Switch to cluster sampling with an iid CI; watch coverage drop below 95 %
- **Labs:** Confidence Interval Explorer (`ci-explorer`); Complex Survey Inference Lab (`complex-survey-lab`)

### Precision and sample size · Pontosság és mintanagyság

`est.sample_size` · Level 2

Required n follows from the target margin of error, the variability and the confidence level; halving the margin needs four times n.

- **Notation:** n = (z·σ/E)²
- **Prerequisites:** Confidence intervals (`est.confidence_interval`)
- **Related:** Statistical power (`infer.power`); Design effect (`survey.design_effect`)
- **Applications:** Planning a survey; Reading a poll's margin of error
- **Common misconceptions:** Sample size should be a share of the population · n = 1 000 is always enough
- **Suggested activities:** Drag the margin of error; read the required n (with and without design effect)
- **Labs:** Confidence Interval Explorer (`ci-explorer`); Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Bootstrap introduction · Bootstrap bevezetés

`est.bootstrap` · Level 3

Resampling the observed sample with replacement to approximate the sampling distribution of a statistic without formulas.

- **Notation:** θ̂*₁, …, θ̂*_B
- **Prerequisites:** Sampling distributions (`est.sampling_distribution`)
- **Related:** Replicate weights (`survey.replicate_weights`); Confidence intervals (`est.confidence_interval`)
- **Applications:** SE of a median or a ratio; Replicate-weight methods in surveys
- **Common misconceptions:** Bootstrap creates new information · It fixes a biased sample
- **Suggested activities:** Resample 200 times; compare the bootstrap SE of x̄ with s/√n
- **Labs:** Sampling Universe (`sampling-universe`)

## Domain F — Statistical Inference

### Null and alternative hypotheses · Null- és alternatív hipotézis

`infer.hypotheses` · Level 1 · Existing: `/p-values#understand`

H₀ states no effect/difference in the population; H₁ the claim under test. The test asks how surprising the data would be if H₀ were true.

- **Notation:** H₀: μ₁ = μ₂, H₁: μ₁ ≠ μ₂
- **Prerequisites:** Parameters and statistics (`est.parameters`)
- **Related:** Test statistics (`infer.test_statistic`); p-values (`infer.p_value`)
- **Applications:** Every test in Domains G, H, J
- **Common misconceptions:** H₀ is what the researcher believes · Rejecting H₀ proves H₁
- **Suggested activities:** Write H₀/H₁ for five research questions; identify the parameter in each
- **Labs:** Hypothesis Testing Lab (`hypothesis-lab`)

### Test statistics · Próbastatisztikák

`infer.test_statistic` · Level 2

A number summarising how far the data are from H₀ in SE units (t, z) or as a variance ratio (F) or discrepancy (χ²).

- **Notation:** t = (estimate − H₀ value)/SE
- **Prerequisites:** Standard error (`est.standard_error`); Null and alternative hypotheses (`infer.hypotheses`)
- **Related:** Null distributions (`infer.null_distribution`); Independent-samples t-test (`group.t_independent`); F distribution (`group.f_distribution`); Chi-square test of independence (`cat.chi_square`)
- **Applications:** Reading SPSS output columns
- **Common misconceptions:** A large statistic is itself the p-value · t and r are unrelated
- **Suggested activities:** Build t from its parts with sliders: difference, spread, n
- **Labs:** Hypothesis Testing Lab (`hypothesis-lab`); Mean Comparison & t-Test Lab (`ttest-lab`)

### Null distributions · Nulleloszlások

`infer.null_distribution` · Level 2 · Existing: `/p-values#understand`

The sampling distribution of the test statistic when H₀ is true; p-values are tail areas under it.

- **Notation:** t ~ t(df) under H₀
- **Prerequisites:** Sampling distributions (`est.sampling_distribution`); Test statistics (`infer.test_statistic`)
- **Related:** p-values (`infer.p_value`); The normal distribution (`prob.normal`); F distribution (`group.f_distribution`)
- **Applications:** Simulated null in the p-value module (simulateNullT)
- **Common misconceptions:** The null distribution describes the data · It is the distribution under H₁
- **Suggested activities:** Simulate 500 studies under H₀; mark the observed t; shade the tail
- **Labs:** Hypothesis Testing Lab (`hypothesis-lab`)

### One- and two-sided tests · Egy- és kétoldali próbák

`infer.sidedness` · Level 2

Whether H₁ allows a difference in either direction (two tails) or one specified direction (one tail); must be fixed before seeing the data.

- **Notation:** P(|T| ≥ t) vs P(T ≥ t)
- **Prerequisites:** Null distributions (`infer.null_distribution`)
- **Related:** p-values (`infer.p_value`)
- **Applications:** SPSS 'Sig. (2-tailed)'
- **Common misconceptions:** Switching to one-sided after seeing the direction is harmless
- **Suggested activities:** Toggle sidedness and watch p halve; discuss when that is legitimate
- **Labs:** Hypothesis Testing Lab (`hypothesis-lab`)

### p-values · p-értékek

`infer.p_value` · Level 2 · Existing: `/p-values#understand`

The probability, if H₀ were true, of a test statistic at least as extreme as the observed one. Not P(H₀ | data), not an effect size.

- **Notation:** p = P(T ≥ t_obs | H₀)
- **Prerequisites:** Null distributions (`infer.null_distribution`); Conditional probability (`prob.conditional`)
- **Related:** Type I and Type II errors (`infer.errors`); Effect sizes (`infer.effect_size`); Bayes' theorem (`prob.bayes`)
- **Applications:** Decision at α; Reporting
- **Common misconceptions:** p is the probability H₀ is true · p < .05 means a large effect · p > .05 proves no effect
- **Suggested activities:** PValueExplorer and SampleSizeDemo: same effect, growing n, shrinking p
- **Labs:** Hypothesis Testing Lab (`hypothesis-lab`)

### Type I and Type II errors · Első- és másodfajú hiba

`infer.errors` · Level 2

Rejecting a true H₀ (Type I, rate α) and failing to reject a false H₀ (Type II, rate β).

- **Notation:** α = P(reject | H₀), β = P(not reject | H₁)
- **Prerequisites:** p-values (`infer.p_value`)
- **Related:** Statistical power (`infer.power`); Multiple comparisons (`infer.multiple_comparisons`)
- **Applications:** Choosing α; Interpreting a non-significant result
- **Common misconceptions:** α is the probability of being wrong after rejecting · Both error rates can be minimised at once for fixed n
- **Suggested activities:** Two overlapping sampling distributions; drag the critical value and watch α and β trade off
- **Labs:** Hypothesis Testing Lab (`hypothesis-lab`)

### Statistical power · Statisztikai erő

`infer.power` · Level 3

1 − β: the probability of detecting an effect of a given size; rises with n, effect size and α.

- **Notation:** Power = P(reject H₀ | H₁)
- **Prerequisites:** Type I and Type II errors (`infer.errors`); Precision and sample size (`est.sample_size`)
- **Related:** Effect sizes (`infer.effect_size`); Statistical vs substantive significance (`infer.significance_vs_substantive`)
- **Applications:** Planning a study; Explaining why small studies miss real effects
- **Common misconceptions:** A non-significant result in a small study is evidence of no effect
- **Suggested activities:** Power curve against n for d = 0.2, 0.5, 0.8
- **Labs:** Hypothesis Testing Lab (`hypothesis-lab`)

### Effect sizes · Hatásnagyság

`infer.effect_size` · Level 2 · Existing: `/p-values#n`

Standardised or raw magnitude of a difference or association (d, g, r, V, η²), independent of n.

- **Notation:** d = (x̄₁ − x̄₂)/s_p, η² = SSB/SST
- **Prerequisites:** Standard deviation (`desc.sd`)
- **Related:** Cohen's d and Hedges' g (`group.cohens_d`); Cramér's V (`cat.cramers_v`); R-squared (`model.r_squared`); p-values (`infer.p_value`)
- **Applications:** Reporting alongside p; Meta-analysis; Power analysis
- **Common misconceptions:** Smaller p means larger effect · Effect size benchmarks are universal
- **Suggested activities:** Fix d, grow n: p falls, d does not move
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`); Hypothesis Testing Lab (`hypothesis-lab`)

### Multiple comparisons · Többszörös összehasonlítások

`infer.multiple_comparisons` · Level 3

Running many tests inflates the family-wise Type I error; corrections (Bonferroni, Tukey, Holm) control it at a cost in power.

- **Notation:** 1 − (1 − α)ᵐ
- **Prerequisites:** Type I and Type II errors (`infer.errors`)
- **Related:** Post-hoc comparisons (`group.post_hoc`)
- **Applications:** Post-hoc tests after ANOVA; Many items in a questionnaire
- **Common misconceptions:** Each test at .05 keeps the overall error at .05
- **Suggested activities:** Simulate 20 null tests; count false positives across seeds
- **Labs:** Hypothesis Testing Lab (`hypothesis-lab`); ANOVA Studio (`anova-studio`)

### Statistical vs substantive significance · Statisztikai és tartalmi szignifikancia

`infer.significance_vs_substantive` · Level 2 · Existing: `/p-values#n`

A result can be statistically detectable yet practically trivial, or important yet undetected; interpret effect size, CI and context together.

- **Notation:** —
- **Prerequisites:** p-values (`infer.p_value`); Effect sizes (`infer.effect_size`)
- **Related:** Statistical reporting (`practice.reporting`); Statistical power (`infer.power`)
- **Applications:** Writing a defensible conclusion
- **Common misconceptions:** Significant = important · Not significant = no difference
- **Suggested activities:** StudyComparison: two studies, same d, different n, opposite verdicts
- **Labs:** Hypothesis Testing Lab (`hypothesis-lab`)

### Assumptions and robustness · Feltevések és robusztusság

`infer.assumptions` · Level 3 · Existing: `/t-tests#spss`

Each test rests on conditions (independence, distribution, equal variances); violations matter differently, and pre-tests like Levene are not infallible gatekeepers.

- **Notation:** —
- **Prerequisites:** Test statistics (`infer.test_statistic`)
- **Related:** Welch t-test (`group.welch_t`); Model diagnostics (`model.diagnostics`); Design-based inference (`survey.design_based`)
- **Applications:** Choosing Welch by default; Checking residual plots
- **Common misconceptions:** Levene's p decides Student vs Welch with certainty · Normality of the raw outcome is required for a t-test
- **Suggested activities:** Levene demo: at small n it misses unequal variances; at large n it flags trivial ones
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`); Model Diagnostics Studio (`model-diagnostics-studio`)

## Domain G — Group Comparisons

### Mean differences · Átlagkülönbségek

`group.mean_difference` · Level 1 · Existing: `/t-tests#understand`

The raw difference between two group means, in the outcome's unit; the quantity every two-group test is about.

- **Notation:** x̄₁ − x̄₂
- **Prerequisites:** The mean as a model (`desc.mean`); Distribution comparisons (`desc.distribution_comparison`)
- **Related:** Standard error of a difference (`group.se_difference`); Cohen's d and Hedges' g (`group.cohens_d`)
- **Applications:** First number to read in SPSS t-test output
- **Common misconceptions:** A difference in sample means is a difference in population means
- **Suggested activities:** Drag one group's points up; read the difference and the overlap
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`)

### Standard error of a difference · Különbség standard hibája

`group.se_difference` · Level 2

Uncertainty of x̄₁ − x̄₂; variances add, so SE = √(s₁²/n₁ + s₂²/n₂) (or pooled under equal variances).

- **Notation:** SE_diff = √(s₁²/n₁ + s₂²/n₂)
- **Prerequisites:** Standard error (`est.standard_error`)
- **Related:** Independent-samples t-test (`group.t_independent`); Welch t-test (`group.welch_t`); Confidence interval for a difference (`group.ci_difference`)
- **Applications:** Denominator of t; Width of the CI for the difference
- **Common misconceptions:** SEs add (variances add) · Pooling is always better
- **Suggested activities:** Build SE_diff from two SE squares side by side (Pythagoras picture)
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`)

### One-sample t-test · Egymintás t-próba

`group.t_one_sample` · Level 2 · Existing: `/t-tests#understand`

Tests whether a population mean equals a fixed value using t = (x̄ − μ₀)/(s/√n) with n − 1 df.

- **Notation:** t = (x̄ − μ₀)/(s/√n), df = n − 1
- **Prerequisites:** Test statistics (`infer.test_statistic`); Standard error (`est.standard_error`)
- **Related:** Paired t-test (`group.t_paired`); Independent-samples t-test (`group.t_independent`)
- **Applications:** Mean vs a norm or a scale midpoint
- **Common misconceptions:** μ₀ comes from the sample
- **Suggested activities:** Slide μ₀ across the sample; watch t and p change
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`)

### Paired t-test · Páros t-próba

`group.t_paired` · Level 2 · Existing: `/t-tests#understand`

A one-sample t-test on within-pair differences; removes between-subject variability from the error.

- **Notation:** t = d̄/(s_d/√n)
- **Prerequisites:** One-sample t-test (`group.t_one_sample`)
- **Related:** Independent-samples t-test (`group.t_independent`); Repeated measures introduction (`group.repeated_measures`)
- **Applications:** Pre/post designs; Matched pairs
- **Common misconceptions:** Paired and independent tests give the same answer on the same numbers
- **Suggested activities:** Toggle pairing lines on/off and compare the two SEs
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`)

### Independent-samples t-test · Kétmintás (független) t-próba

`group.t_independent` · Level 2 · Existing: `/t-tests#understand`

Compares two independent group means; Student's version pools variances, df = n₁ + n₂ − 2.

- **Notation:** t = (x̄₁ − x̄₂)/SE_pooled
- **Prerequisites:** Standard error of a difference (`group.se_difference`); Null distributions (`infer.null_distribution`)
- **Related:** Welch t-test (`group.welch_t`); One-way ANOVA (`group.anova_oneway`); Cohen's d and Hedges' g (`group.cohens_d`)
- **Applications:** Two-group comparisons in survey data
- **Common misconceptions:** Significant t means a large difference · Needs equal n
- **Suggested activities:** t-Test Lab: drag groups apart, change spread and n; watch t, df, p
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`)

### Welch t-test · Welch-féle t-próba

`group.welch_t` · Level 2 · Existing: `/t-tests#spss`

Independent-samples t without the equal-variance assumption; Satterthwaite df. A sound default rather than a fallback chosen by Levene's p.

- **Notation:** SE = √(s₁²/n₁ + s₂²/n₂), df_W (Welch–Satterthwaite)
- **Prerequisites:** Independent-samples t-test (`group.t_independent`); Assumptions and robustness (`infer.assumptions`)
- **Related:** Welch ANOVA (`group.welch_anova`)
- **Alternative to:** Independent-samples t-test (`group.t_independent`)
- **Applications:** SPSS 'equal variances not assumed' row
- **Common misconceptions:** Welch is only for when Levene is significant · Welch loses much power under equal variances
- **Suggested activities:** Unequal n and unequal SD: compare Student and Welch p across seeds
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`)

### Confidence interval for a difference · Különbség konfidencia-intervalluma

`group.ci_difference` · Level 2 · Existing: `/t-tests#spss`

(x̄₁ − x̄₂) ± t·SE_diff; conveys both the estimate and its precision, and whether 0 is plausible.

- **Notation:** (x̄₁ − x̄₂) ± t_{df}·SE_diff
- **Prerequisites:** Confidence intervals (`est.confidence_interval`); Standard error of a difference (`group.se_difference`)
- **Related:** p-values (`infer.p_value`)
- **Applications:** SPSS '95 % CI of the Difference'
- **Common misconceptions:** Overlapping group CIs mean no significant difference
- **Suggested activities:** Show group CIs and the CI of the difference together; find cases where they disagree
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`); Confidence Interval Explorer (`ci-explorer`)

### Cohen's d and Hedges' g · Cohen-féle d és Hedges-féle g

`group.cohens_d` · Level 2 · Existing: `/t-tests#effect`

Mean difference in pooled-SD units; g applies a small-sample correction (SPSS 27+).

- **Notation:** d = (x̄₁ − x̄₂)/s_p, g = d·(1 − 3/(4N − 9))
- **Prerequisites:** Mean differences (`group.mean_difference`); Effect sizes (`infer.effect_size`)
- **Related:** Eta squared (`group.eta_squared`); Statistical power (`infer.power`)
- **Applications:** Reporting t-test results; Power analysis input
- **Common misconceptions:** d is bounded like r · d = 0.2 is 'nothing'
- **Suggested activities:** EffectSize: overlapping curves; drag d and read the overlap
- **Labs:** Mean Comparison & t-Test Lab (`ttest-lab`)

### One-way ANOVA · Egyszempontos varianciaanalízis

`group.anova_oneway` · Level 2 · Existing: `/anova#try`

Tests equality of k group means by comparing between-group to within-group variance with an F ratio.

- **Notation:** F = MSB/MSW, df = (k − 1, N − k)
- **Prerequisites:** Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`); F distribution (`group.f_distribution`)
- **Related:** Independent-samples t-test (`group.t_independent`); Post-hoc comparisons (`group.post_hoc`); Categorical predictors (dummy variables) (`model.categorical_predictors`)
- **Applications:** Three education groups and political knowledge (VRA lab stage 3)
- **Common misconceptions:** ANOVA tells which groups differ · F < 1 is impossible
- **Suggested activities:** VRA lab stage 3: sep and spread sliders; F-to-p conversion
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); ANOVA Studio (`anova-studio`)

### F distribution · F-eloszlás

`group.f_distribution` · Level 2

Null distribution of a ratio of two independent variance estimates; right-skewed, shaped by two df.

- **Notation:** F(d₁, d₂), p = P(F ≥ F_obs)
- **Prerequisites:** Null distributions (`infer.null_distribution`); Variance (`desc.variance`)
- **Related:** One-way ANOVA (`group.anova_oneway`); Overall model fit and F (`model.model_fit`)
- **Applications:** ANOVA p-values; Regression overall F
- **Common misconceptions:** F is symmetric like t · Only large df give valid p
- **Suggested activities:** Drag df₁, df₂; shade the tail at the observed F
- **Labs:** Distribution Studio (`distribution-studio`); ANOVA Studio (`anova-studio`)

### Variance decomposition (SST = SSB + SSW) · Varianciafelbontás

`group.anova_decomposition` · Level 2 · Existing: `/anova#try`

Total squared deviation from the grand mean splits exactly into between-group (group means around the grand mean, weighted by n) and within-group parts.

- **Notation:** Σ(yᵢ − ȳ)² = Σnⱼ(ȳⱼ − ȳ)² + ΣΣ(yᵢⱼ − ȳⱼ)²
- **Prerequisites:** Variance (`desc.variance`); Weighted averages (`desc.weighted_mean`)
- **Related:** Model fit: SST = SSR + SSE (`model.sst`); Eta squared (`group.eta_squared`); Projections (`math.projection`)
- **Applications:** Core of ANOVA and of R²
- **Common misconceptions:** SSB is about differences between individual observations · The decomposition holds for any reference line (only for means/OLS)
- **Suggested activities:** Decomposition bar linked to squares on the canvas; compare with the regression decomposition
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`)

### Eta squared · Éta-négyzet

`group.eta_squared` · Level 2 · Existing: `/anova#try`

SSB/SST: share of total variation associated with group membership; descriptive, not causal.

- **Notation:** η² = SSB/SST
- **Prerequisites:** Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`); Effect sizes (`infer.effect_size`)
- **Related:** R-squared (`model.r_squared`); Cohen's d and Hedges' g (`group.cohens_d`)
- **Applications:** Effect size for ANOVA
- **Common misconceptions:** η² is a probability · Large F means large η²
- **Suggested activities:** Hold η² fixed and change N; F and p move, η² does not
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); ANOVA Studio (`anova-studio`)

### Post-hoc comparisons · Post-hoc összehasonlítások

`group.post_hoc` · Level 3

Pairwise tests after a significant F, with multiplicity control (Tukey HSD, Bonferroni, Games–Howell for unequal variances).

- **Notation:** q = (ȳᵢ − ȳⱼ)/√(MSW/n)
- **Prerequisites:** One-way ANOVA (`group.anova_oneway`); Multiple comparisons (`infer.multiple_comparisons`)
- **Related:** Welch ANOVA (`group.welch_anova`)
- **Applications:** Which education groups differ
- **Common misconceptions:** Run all pairwise t-tests at .05 instead
- **Suggested activities:** ANOVA Studio: pairwise CI forest plot with and without correction
- **Labs:** ANOVA Studio (`anova-studio`)

### Two-way ANOVA and interactions · Kétszempontos ANOVA és interakciók

`group.anova_twoway` · Level 3

Two factors at once; main effects plus an interaction (the effect of one factor depends on the level of the other).

- **Notation:** SST = SSA + SSB + SSAB + SSW
- **Prerequisites:** One-way ANOVA (`group.anova_oneway`)
- **Related:** Interaction terms (`model.interactions`); Lazarsfeld paradigm (`cat.lazarsfeld`)
- **Generalises:** One-way ANOVA (`group.anova_oneway`)
- **Applications:** Education × gender on knowledge
- **Common misconceptions:** Interaction means the factors are correlated · Main effects are interpretable regardless of interaction
- **Suggested activities:** Interaction plot: drag cell means until lines cross
- **Labs:** ANOVA Studio (`anova-studio`)

### Welch ANOVA · Welch-féle ANOVA

`group.welch_anova` · Level 3

One-way ANOVA robust to unequal variances; weights groups by nⱼ/sⱼ² and adjusts df.

- **Notation:** F_W, df adjusted
- **Prerequisites:** One-way ANOVA (`group.anova_oneway`); Welch t-test (`group.welch_t`)
- **Related:** Post-hoc comparisons (`group.post_hoc`)
- **Alternative to:** One-way ANOVA (`group.anova_oneway`)
- **Applications:** Default when group spreads differ
- **Common misconceptions:** Classic ANOVA is robust to any variance heterogeneity
- **Suggested activities:** Unequal spreads and n: compare classic and Welch F across seeds
- **Labs:** ANOVA Studio (`anova-studio`)

### Repeated measures introduction · Ismételt méréses elrendezés bevezetés

`group.repeated_measures` · Level 3

Same units measured under several conditions; subject variability is removed from the error term, as in the paired t-test.

- **Notation:** SSW = SSsubjects + SSerror
- **Prerequisites:** Paired t-test (`group.t_paired`); One-way ANOVA (`group.anova_oneway`)
- **Related:** Two-way ANOVA and interactions (`group.anova_twoway`)
- **Generalises:** Paired t-test (`group.t_paired`)
- **Applications:** Pre/mid/post designs
- **Common misconceptions:** Treating repeated measures as independent groups is conservative (it is usually anti-conservative or inefficient)
- **Suggested activities:** Toggle subject lines; the error squares shrink
- **Labs:** ANOVA Studio (`anova-studio`)

## Domain H — Categorical Associations

### Contingency tables · Kereszttáblák

`cat.contingency` · Level 1 · Existing: `/crosstabs#understand`

A table of joint frequencies of two categorical variables with row, column and grand totals.

- **Notation:** fᵢⱼ, row totals fᵢ., column totals f.ⱼ, N
- **Prerequisites:** Frequencies and proportions (`desc.frequencies`)
- **Related:** Conditional percentages (`cat.conditional_percent`); Expected frequencies (`cat.expected_frequencies`)
- **Applications:** Crosstabs in SPSS
- **Common misconceptions:** Raw counts can be compared across unequal groups
- **Suggested activities:** Build a table from raw rows; check totals
- **Labs:** Categorical Data Lab (`categorical-lab`)

### Conditional percentages · Feltételes százalékok

`cat.conditional_percent` · Level 1 · Existing: `/crosstabs#understand`

Percentages within the categories of the independent variable so Y's distribution can be compared across X; row vs column depends only on where X sits.

- **Notation:** % within X
- **Prerequisites:** Contingency tables (`cat.contingency`); Variable roles (X, Y, Z) (`data.variable_roles`); Conditional probability (`prob.conditional`)
- **Related:** Lazarsfeld paradigm (`cat.lazarsfeld`); Simpson's paradox (`cat.simpson`)
- **Applications:** Reading and reporting crosstabs
- **Common misconceptions:** Always use row percentages · The percentage difference equals the association strength
- **Suggested activities:** Swap X and Y in the table; which percentage changes meaning?
- **Labs:** Categorical Data Lab (`categorical-lab`)

### Expected frequencies · Várt gyakoriságok

`cat.expected_frequencies` · Level 2 · Existing: `/crosstabs#chi`

Cell counts expected if X and Y were independent: row total × column total / N.

- **Notation:** Eᵢⱼ = fᵢ.·f.ⱼ/N
- **Prerequisites:** Contingency tables (`cat.contingency`); Independence (`prob.independence`)
- **Related:** Chi-square test of independence (`cat.chi_square`)
- **Applications:** Chi-square numerator; Checking the small-expected-count rule
- **Common misconceptions:** Expected counts must be integers · Expected = observed when there is an association
- **Suggested activities:** Drag observed counts; expected counts stay fixed while margins stay fixed
- **Labs:** Categorical Data Lab (`categorical-lab`)

### Chi-square test of independence · Khi-négyzet függetlenségvizsgálat

`cat.chi_square` · Level 2 · Existing: `/crosstabs#chi`

Sums squared standardised discrepancies between observed and expected counts; large values are unlikely under independence.

- **Notation:** χ² = Σ(O − E)²/E, df = (r − 1)(c − 1)
- **Prerequisites:** Expected frequencies (`cat.expected_frequencies`); Null distributions (`infer.null_distribution`)
- **Related:** Cramér's V (`cat.cramers_v`); Fisher's exact test (`cat.fisher`)
- **Applications:** Testing association in crosstabs
- **Common misconceptions:** χ² measures strength · Significant χ² identifies which cells differ
- **Suggested activities:** ChiDemo: scale N up and down with the same percentages; χ² scales, V does not
- **Labs:** Categorical Data Lab (`categorical-lab`)

### Cramér's V · Cramér-féle V

`cat.cramers_v` · Level 2 · Existing: `/crosstabs#chi`

χ² rescaled to [0,1] by N and table size; strength of association independent of sample size.

- **Notation:** V = √(χ²/(N·min(r − 1, c − 1)))
- **Prerequisites:** Chi-square test of independence (`cat.chi_square`); Effect sizes (`infer.effect_size`)
- **Related:** Odds ratios (`cat.odds_ratio`); Correlation (Pearson's r) (`corr.pearson`)
- **Applications:** Reporting crosstab effect size
- **Common misconceptions:** V has a sign · V = r for 2×2 tables with ordinal meaning (|φ| = V there)
- **Suggested activities:** Hold percentages, vary N: V constant while p changes
- **Labs:** Categorical Data Lab (`categorical-lab`)

### Odds ratios · Esélyhányadosok

`cat.odds_ratio` · Level 2

Ratio of odds of Y between two X groups; symmetric and the natural effect measure for 2×2 tables and logistic regression.

- **Notation:** OR = (a·d)/(b·c)
- **Prerequisites:** Contingency tables (`cat.contingency`); Frequencies and proportions (`desc.frequencies`)
- **Related:** Logistic regression introduction (`model.logistic`); Cramér's V (`cat.cramers_v`); Exponents and logarithms (`math.exp_log`)
- **Applications:** Logistic regression coefficients; Epidemiological tables
- **Common misconceptions:** OR equals the risk ratio · OR = 2 means twice as likely
- **Suggested activities:** 2×2 table with sliders; show OR, RR and risk difference together
- **Labs:** Categorical Data Lab (`categorical-lab`)

### Fisher's exact test · Fisher-féle egzakt próba

`cat.fisher` · Level 3

Exact p for a 2×2 table from the hypergeometric distribution; used when expected counts are small.

- **Notation:** p = ΣP(table | margins)
- **Prerequisites:** Chi-square test of independence (`cat.chi_square`)
- **Related:** Expected frequencies (`cat.expected_frequencies`)
- **Alternative to:** Chi-square test of independence (`cat.chi_square`)
- **Applications:** Small samples
- **Common misconceptions:** Fisher is always preferable
- **Suggested activities:** Enumerate all tables with fixed margins for a tiny example
- **Labs:** Categorical Data Lab (`categorical-lab`)

### Stratified tables · Rétegzett (parciális) táblák

`cat.stratified` · Level 2 · Existing: `/lazarsfeld#understand`

The X–Y table computed separately within each category of a control variable Z; partial tables vs the zero-order table.

- **Notation:** X × Y | Z = z
- **Prerequisites:** Conditional percentages (`cat.conditional_percent`); Variable roles (X, Y, Z) (`data.variable_roles`)
- **Related:** Lazarsfeld paradigm (`cat.lazarsfeld`); Simpson's paradox (`cat.simpson`); Confounding and mediation cautions (`model.confounding`)
- **Applications:** Control variable analysis in SPSS crosstabs (layer)
- **Common misconceptions:** Partial tables always show the same pattern as the total
- **Suggested activities:** PartialBars: split the table by Z and compare percentage differences
- **Labs:** Lazarsfeld & Simpson Lab (`lazarsfeld-simpson-lab`)

### Lazarsfeld paradigm · Lazarsfeld-paradigma

`cat.lazarsfeld` · Level 3 · Existing: `/lazarsfeld#understand`

Classifying what happens to X–Y under control for Z: replication, specification, explanation (Z antecedent), interpretation (Z intervening).

- **Notation:** Z → X → Y vs X → Z → Y
- **Prerequisites:** Stratified tables (`cat.stratified`)
- **Related:** Confounding and mediation cautions (`model.confounding`); Causal diagrams (`practice.causal_diagrams`)
- **Applications:** Core QDA2 analytic sequence: model → hypotheses → zero-order → partials → pattern
- **Common misconceptions:** Explanation and interpretation differ statistically (they differ only in the causal order of Z)
- **Suggested activities:** Scenarios + DecisionTree: classify eight cases; draw the causal diagram
- **Labs:** Lazarsfeld & Simpson Lab (`lazarsfeld-simpson-lab`)

### Simpson's paradox · Simpson-paradoxon

`cat.simpson` · Level 3

An association reverses direction when a third variable is controlled, because Z is unevenly distributed across X.

- **Notation:** sign(X–Y) ≠ sign(X–Y | Z)
- **Prerequisites:** Stratified tables (`cat.stratified`); Weighted averages (`desc.weighted_mean`)
- **Related:** Lazarsfeld paradigm (`cat.lazarsfeld`); Confounding and mediation cautions (`model.confounding`)
- **Applications:** Admission data, treatment comparisons
- **Common misconceptions:** Simpson's paradox is a rare curiosity · The aggregated table is always wrong
- **Suggested activities:** Drag the Z composition of the X groups until the aggregate flips
- **Labs:** Lazarsfeld & Simpson Lab (`lazarsfeld-simpson-lab`)

### Confounding and mediation cautions · Zavaró és közvetítő változók

`model.confounding` · Level 3

A confounder causes both X and Y and biases the X–Y association; a mediator transmits X's effect. Controlling for a mediator removes the effect of interest.

- **Notation:** Z → X, Z → Y (confounder); X → Z → Y (mediator)
- **Prerequisites:** Lazarsfeld paradigm (`cat.lazarsfeld`)
- **Related:** Causal diagrams (`practice.causal_diagrams`); Multiple regression (`model.multiple_regression`)
- **Applications:** Deciding what to control for in regression
- **Common misconceptions:** Control for everything available · Statistical control proves causation
- **Suggested activities:** CausalDiagram: choose which arrows exist; the lab shows whether adjusting helps or hurts
- **Labs:** Lazarsfeld & Simpson Lab (`lazarsfeld-simpson-lab`)

## Domain I — Survey Statistics

### Survey inference · Survey-következtetés

`survey.inference` · Level 2

Inferring finite-population quantities (totals, means, proportions, domains) from a probability sample, where randomness comes from the sampling design rather than a model.

- **Notation:** Y = Σ_U yₖ, Ȳ = Y/N
- **Prerequisites:** Populations and samples (`est.population_sample`); Sampling variation (`est.sampling_variation`)
- **Related:** Design-based inference (`survey.design_based`); Total survey error (`survey.tse`)
- **Applications:** Official statistics; Election and social surveys
- **Common misconceptions:** Survey inference is just classical inference with weights
- **Suggested activities:** Survey Weighting Studio: the finite population is visible; sample, estimate, repeat
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Total survey error · Teljes survey-hiba

`survey.tse` · Level 2

Framework decomposing error into representation errors (coverage, sampling, nonresponse, adjustment) and measurement errors (validity, measurement, processing).

- **Notation:** MSE = Var + Bias²
- **Prerequisites:** Survey inference (`survey.inference`); Estimator bias and consistency (`est.bias`)
- **Related:** Sampling frames and coverage error (`survey.frame`); Nonresponse and selection bias (`survey.nonresponse`); Measurement error (`survey.measurement_error`)
- **Applications:** Diagnosing why a poll was wrong; Prioritising fieldwork budget
- **Common misconceptions:** Margin of error covers all error · Sampling error is the main error source
- **Suggested activities:** Error budget diagram: toggle each source on in the studio and watch MSE
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Target population · Célpopuláció

`survey.target_population` · Level 1

The precisely defined set of units the survey intends to describe (who, where, when); must be fixed before design.

- **Notation:** U = {1, …, N}
- **Prerequisites:** Populations and samples (`est.population_sample`)
- **Related:** Sampling frames and coverage error (`survey.frame`); Domain estimation (`survey.domain`)
- **Applications:** Defining 'adult residents of Hungary'
- **Common misconceptions:** The target population is whoever answers
- **Suggested activities:** Write inclusion/exclusion rules for three survey briefs
- **Labs:** Survey Sampling Design Studio (`survey-design-studio`)

### Sampling frames and coverage error · Mintavételi keret és lefedettségi hiba

`survey.frame` · Level 2

The list or mechanism from which units are selected; mismatch with the target population (under-, over-coverage, duplicates) causes coverage error.

- **Notation:** U_frame ≠ U_target
- **Prerequisites:** Target population (`survey.target_population`)
- **Related:** Total survey error (`survey.tse`); Survey modes (`survey.modes`)
- **Applications:** Address registers vs phone lists vs online panels
- **Common misconceptions:** Larger frames are always better
- **Suggested activities:** Overlay frame on population; shade the uncovered units; see the bias of a perfect sample from a bad frame
- **Labs:** Survey Sampling Design Studio (`survey-design-studio`)

### Probability vs nonprobability sampling · Valószínűségi és nem valószínűségi mintavétel

`survey.prob_vs_nonprob` · Level 2

Probability samples give every unit a known, nonzero inclusion probability, enabling design-based inference; nonprobability samples rely on models to justify generalisation.

- **Notation:** πₖ > 0 known ∀k
- **Prerequisites:** Survey inference (`survey.inference`)
- **Related:** Inclusion probabilities (`survey.inclusion_prob`); Model-assisted and model-based inference (`survey.model_based`); Nonresponse and selection bias (`survey.nonresponse`)
- **Applications:** Opt-in web panels vs register-based samples
- **Common misconceptions:** Quota sampling is probability sampling · A big opt-in sample beats a small random one
- **Suggested activities:** Draw a self-selected sample in the studio: more n, same bias
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Simple random sampling · Egyszerű véletlen mintavétel

`survey.srs` · Level 1

Every subset of n units equally likely (without replacement); πₖ = n/N. The benchmark design for all others.

- **Notation:** πₖ = n/N, Var(ȳ) = (1 − n/N)S²/n
- **Prerequisites:** Probability vs nonprobability sampling (`survey.prob_vs_nonprob`); Standard error (`est.standard_error`)
- **Related:** Finite population correction (`survey.fpc`); Stratified sampling (`survey.stratified`); Cluster sampling (`survey.cluster`)
- **Applications:** Baseline for design effects
- **Common misconceptions:** SRS guarantees a representative sample · Haphazard selection is random
- **Suggested activities:** Draw SRS repeatedly; compare the sampling distribution to the SRS formula
- **Labs:** Sampling Universe (`sampling-universe`); Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Stratified sampling · Rétegzett mintavétel

`survey.stratified` · Level 2

Partition the population into strata and sample independently within each; removes between-stratum variance from the estimator's variance.

- **Notation:** ȳ_st = ΣWₕȳₕ, Var = ΣWₕ²(1 − fₕ)Sₕ²/nₕ
- **Prerequisites:** Simple random sampling (`survey.srs`); Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`)
- **Related:** Stratum allocation (`survey.allocation`); Post-stratification (`survey.post_stratification`); Design effect (`survey.design_effect`)
- **Applications:** Ensuring regional representation; Oversampling minorities
- **Common misconceptions:** Stratification always reduces variance equally for every variable · Strata must be equal size
- **Suggested activities:** Switch SRS → stratified; the between-group part of the variance disappears from the SE
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Stratum allocation · Rétegallokáció

`survey.allocation` · Level 3

Choosing nₕ: proportional (nₕ ∝ Nₕ), Neyman (∝ NₕSₕ), or optimal with costs; disproportionate allocation requires weights.

- **Notation:** nₕ = n·NₕSₕ/ΣNₕSₕ
- **Prerequisites:** Stratified sampling (`survey.stratified`)
- **Related:** Sampling (design) weights (`survey.weights`); Effective sample size (`survey.effective_n`)
- **Applications:** Oversampling small strata for domain estimates
- **Common misconceptions:** Equal allocation is 'fair' and efficient
- **Suggested activities:** Drag allocation between strata; watch total SE and domain SEs trade off
- **Labs:** Survey Sampling Design Studio (`survey-design-studio`)

### Cluster sampling · Csoportos (klaszteres) mintavétel

`survey.cluster` · Level 2

Select groups of units (schools, blocks) and observe units within them; cheaper, but units in a cluster are similar, inflating variance.

- **Notation:** deff ≈ 1 + (m̄ − 1)ρ
- **Prerequisites:** Simple random sampling (`survey.srs`)
- **Related:** Multistage sampling (`survey.multistage`); Design effect (`survey.design_effect`); Intraclass correlation (`survey.icc`)
- **Applications:** Face-to-face national surveys
- **Common misconceptions:** Clustering is a form of stratification · n units in clusters carry n units of information
- **Suggested activities:** Sample 10 clusters of 20 vs 200 SRS; compare the spread of estimates
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Intraclass correlation · Osztályon belüli korreláció

`survey.icc` · Level 3

Share of variance between clusters; drives the design effect of cluster sampling.

- **Notation:** ρ = σ²_between/(σ²_between + σ²_within)
- **Prerequisites:** Cluster sampling (`survey.cluster`); Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`)
- **Related:** Design effect (`survey.design_effect`)
- **Applications:** Planning cluster sizes
- **Common misconceptions:** ρ = 0.05 is negligible (with m̄ = 20 it doubles the variance)
- **Suggested activities:** Drag ρ in the population; watch deff
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Multistage sampling · Többlépcsős mintavétel

`survey.multistage` · Level 3

Sampling in stages (PSUs → SSUs → units); inclusion probability is the product of stage probabilities.

- **Notation:** πₖ = π_PSU · π_{k|PSU}
- **Prerequisites:** Cluster sampling (`survey.cluster`); Stratified sampling (`survey.stratified`)
- **Related:** Probability proportional to size (`survey.pps`); Inclusion probabilities (`survey.inclusion_prob`)
- **Applications:** Settlements → addresses → persons
- **Common misconceptions:** Only the last stage matters for weights
- **Suggested activities:** Trace one unit's πₖ through two stages in the studio
- **Labs:** Survey Sampling Design Studio (`survey-design-studio`)

### Probability proportional to size · Mérettel arányos valószínűségű mintavétel

`survey.pps` · Level 3

Select PSUs with probability proportional to a size measure so that, with a fixed take per PSU, units get equal overall probability.

- **Notation:** π_i = m·Mᵢ/ΣMᵢ
- **Prerequisites:** Multistage sampling (`survey.multistage`)
- **Related:** Inclusion probabilities (`survey.inclusion_prob`); Sampling (design) weights (`survey.weights`)
- **Applications:** Settlement samples by population size
- **Common misconceptions:** PPS gives bigger PSUs more weight in the estimate (it equalises unit weights)
- **Suggested activities:** Toggle equal-probability vs PPS PSU selection; compare unit weights
- **Labs:** Survey Sampling Design Studio (`survey-design-studio`)

### Inclusion probabilities · Bekerülési valószínűségek

`survey.inclusion_prob` · Level 2

First-order πₖ = P(k ∈ s); second-order πₖₗ for pairs, needed for exact variance. Determined entirely by the design.

- **Notation:** πₖ, πₖₗ
- **Prerequisites:** Simple random sampling (`survey.srs`); Events and sample spaces (`prob.events`)
- **Related:** Sampling (design) weights (`survey.weights`); Horvitz–Thompson estimation (`survey.horvitz_thompson`); Complex-survey variance estimation (`survey.variance_estimation`)
- **Applications:** Deriving base weights
- **Common misconceptions:** πₖ is estimated from the sample · Equal πₖ implies SRS
- **Suggested activities:** Hover any unit in the population; its πₖ is shown under the current design
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Sampling (design) weights · Mintavételi (design-) súlyok

`survey.weights` · Level 2

dₖ = 1/πₖ: how many population units a sampled unit represents; base weights before any adjustment.

- **Notation:** dₖ = 1/πₖ, Σ_s dₖ ≈ N
- **Prerequisites:** Inclusion probabilities (`survey.inclusion_prob`); Weighted averages (`desc.weighted_mean`)
- **Related:** Horvitz–Thompson estimation (`survey.horvitz_thompson`); Nonresponse adjustments (`survey.nonresponse_adj`); Calibration (`survey.calibration`)
- **Applications:** WEIGHT BY in SPSS (with caveats); svydesign in R
- **Common misconceptions:** Weights fix nonresponse bias by themselves · SPSS WEIGHT BY gives correct SEs
- **Suggested activities:** Oversample one group; show weights restoring the population composition
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Horvitz–Thompson estimation · Horvitz–Thompson-becslés

`survey.horvitz_thompson` · Level 3

Design-unbiased estimator of a total: sum of yₖ/πₖ over the sample. Its variance uses second-order probabilities.

- **Notation:** Ŷ_HT = Σ_s yₖ/πₖ
- **Prerequisites:** Sampling (design) weights (`survey.weights`); Estimator bias and consistency (`est.bias`)
- **Related:** Ratio and Hájek estimation (`survey.hajek`); Complex-survey variance estimation (`survey.variance_estimation`)
- **Applications:** Totals (population counts, expenditure)
- **Common misconceptions:** HT is also the natural estimator of a mean (the Hájek ratio usually is)
- **Suggested activities:** Repeat sampling: the HT total is unbiased but may be very variable under unequal πₖ
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Ratio and Hájek estimation · Hányados- és Hájek-becslés

`survey.hajek` · Level 3

Mean estimated as weighted sum of y divided by sum of weights; slightly biased, usually much less variable than HT/N.

- **Notation:** ȳ_H = Σdₖyₖ/Σdₖ
- **Prerequisites:** Horvitz–Thompson estimation (`survey.horvitz_thompson`)
- **Related:** Calibration (`survey.calibration`); Taylor linearization (`survey.taylor`)
- **Applications:** Virtually all survey means and proportions
- **Common misconceptions:** Dividing by N and by Σd gives the same estimate
- **Suggested activities:** Side-by-side sampling distributions of HT/N and Hájek
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Nonresponse and selection bias · Nemválaszolás és szelekciós torzítás

`survey.nonresponse` · Level 2

Units that do not respond differ systematically from respondents; bias depends on the correlation between response propensity and the outcome, not on the response rate alone.

- **Notation:** Bias ≈ Cov(ρₖ, yₖ)/ρ̄
- **Prerequisites:** Total survey error (`survey.tse`); Missing values (`data.missing`)
- **Related:** Nonresponse adjustments (`survey.nonresponse_adj`); Probability vs nonprobability sampling (`survey.prob_vs_nonprob`)
- **Applications:** Why a 20 % response-rate survey can still be accurate, and a 70 % one biased
- **Common misconceptions:** Response rate measures bias · Weighting removes all nonresponse bias
- **Suggested activities:** Introduce a response mechanism correlated with y; watch the estimate drift even after weighting
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Nonresponse adjustments · Nemválaszolási korrekciók

`survey.nonresponse_adj` · Level 3

Multiply base weights by the inverse of an estimated response propensity within adjustment classes; valid when response is ignorable given the classes.

- **Notation:** wₖ = dₖ/ρ̂ₖ
- **Prerequisites:** Nonresponse and selection bias (`survey.nonresponse`); Sampling (design) weights (`survey.weights`)
- **Related:** Post-stratification (`survey.post_stratification`); Calibration (`survey.calibration`); Missing values (`data.missing`)
- **Applications:** Weighting class adjustment
- **Common misconceptions:** Adjustment classes can be chosen arbitrarily
- **Suggested activities:** Choose adjustment variables; the studio shows remaining bias when the true mechanism depends on an unused variable
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Post-stratification · Utólagos rétegzés

`survey.post_stratification` · Level 3

Rescale weights so weighted cell counts match known population counts in a cross-classification.

- **Notation:** wₖ = dₖ·N_c/N̂_c
- **Prerequisites:** Sampling (design) weights (`survey.weights`); Stratified sampling (`survey.stratified`)
- **Related:** Raking (iterative proportional fitting) (`survey.raking`); Calibration (`survey.calibration`)
- **Applications:** Matching census age × sex × region
- **Common misconceptions:** Post-stratification is the same as stratification at design time
- **Suggested activities:** Apply post-stratification after nonresponse; composition fixed, outcome bias partly remains
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Raking (iterative proportional fitting) · Raking (iteratív arányos illesztés)

`survey.raking` · Level 3

Adjust weights to match several marginal distributions in turn until all margins agree; used when the full cross-classification is unknown.

- **Notation:** iterate wₖ ← wₖ·N_m/N̂_m over margins m
- **Prerequisites:** Post-stratification (`survey.post_stratification`); Optimization (`math.optimization`)
- **Related:** Calibration (`survey.calibration`)
- **Applications:** Matching age, sex, education margins separately
- **Common misconceptions:** Raking matches the joint distribution
- **Suggested activities:** Step through raking iterations; watch margins converge and weights spread
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Calibration · Kalibráció

`survey.calibration` · Level 4

General framework: find weights closest to the design weights (by a chosen distance) subject to auxiliary totals being reproduced exactly; GREG and raking are special cases.

- **Notation:** min Σ G(wₖ, dₖ) s.t. Σwₖxₖ = X
- **Prerequisites:** Raking (iterative proportional fitting) (`survey.raking`); Ratio and Hájek estimation (`survey.hajek`)
- **Related:** Model-assisted and model-based inference (`survey.model_based`); Survey regression (`survey.regression`)
- **Generalises:** Post-stratification (`survey.post_stratification`); Raking (iterative proportional fitting) (`survey.raking`)
- **Applications:** Official statistics weighting
- **Common misconceptions:** Calibration guarantees unbiasedness for every variable
- **Suggested activities:** Choose auxiliaries; variance falls for outcomes correlated with them, not for others
- **Labs:** Weighting & Calibration Lab (`weighting-calibration-lab`)

### Complex-survey variance estimation · Komplex minták varianciabecslése

`survey.variance_estimation` · Level 3

Estimating sampling variance that honours stratification, clustering and weighting; iid formulas are generally wrong under complex designs.

- **Notation:** V̂(Ŷ) from design
- **Prerequisites:** Sampling (design) weights (`survey.weights`); Cluster sampling (`survey.cluster`); Coverage probability (`est.coverage`)
- **Related:** Taylor linearization (`survey.taylor`); Replicate weights (`survey.replicate_weights`); Design effect (`survey.design_effect`)
- **Applications:** Correct SEs and CIs for survey estimates
- **Common misconceptions:** Weights alone fix the variance · SPSS base WEIGHT BY computes design-based SEs
- **Suggested activities:** Compare naive, with-replacement and design-based SEs on the same cluster sample
- **Labs:** Complex Survey Inference Lab (`complex-survey-lab`)

### Finite population correction · Véges populációs korrekció

`survey.fpc` · Level 2

(1 − n/N) factor reducing variance when the sample is a non-negligible share of a finite population.

- **Notation:** Var(ȳ) = (1 − n/N)S²/n
- **Prerequisites:** Simple random sampling (`survey.srs`)
- **Related:** Complex-survey variance estimation (`survey.variance_estimation`)
- **Applications:** Small-population surveys (schools, firms)
- **Common misconceptions:** The sampling fraction matters for most national surveys (it rarely does)
- **Suggested activities:** Increase n toward N: variance shrinks to zero
- **Labs:** Sampling Universe (`sampling-universe`)

### Design effect · Design-hatás

`survey.design_effect` · Level 3

Ratio of the variance under the actual design to the variance under SRS of the same n; summarises the cost or gain of the design.

- **Notation:** deff = Var_design/Var_SRS
- **Prerequisites:** Complex-survey variance estimation (`survey.variance_estimation`); Simple random sampling (`survey.srs`)
- **Related:** Effective sample size (`survey.effective_n`); Cluster sampling (`survey.cluster`); Stratified sampling (`survey.stratified`); Sampling (design) weights (`survey.weights`)
- **Applications:** Sample size planning with complex designs
- **Common misconceptions:** deff is a property of the survey, not of each estimate
- **Suggested activities:** Same population, four designs: read deff for a mean and for a domain mean
- **Labs:** Complex Survey Inference Lab (`complex-survey-lab`); Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Effective sample size · Effektív mintanagyság

`survey.effective_n` · Level 3

n/deff: the SRS size giving the same precision; weighting alone reduces it by Kish's factor (Σw)²/Σw².

- **Notation:** n_eff = n/deff, n_eff,w = (Σwₖ)²/Σwₖ²
- **Prerequisites:** Design effect (`survey.design_effect`)
- **Related:** Consistency and precision (`est.consistency`); Sampling (design) weights (`survey.weights`)
- **Applications:** Reporting what a weighted n = 2 000 is 'worth'
- **Common misconceptions:** Nominal n describes precision
- **Suggested activities:** Spread the weights; watch n_eff fall while n is unchanged
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Taylor linearization · Taylor-linearizáció

`survey.taylor` · Level 4

Approximate the variance of a nonlinear estimator (ratio, regression coefficient) by linearising it; the standard method in survey software.

- **Notation:** zₖ = (yₖ − R̂xₖ)/X̂
- **Prerequisites:** Complex-survey variance estimation (`survey.variance_estimation`); Derivatives and integrals (`math.calculus`)
- **Related:** Replicate weights (`survey.replicate_weights`); Ratio and Hájek estimation (`survey.hajek`)
- **Applications:** SEs of means (Hájek), proportions, regression
- **Common misconceptions:** Linearisation is exact
- **Suggested activities:** Show the linearised variable zₖ for a ratio; compare its variance with the simulation truth
- **Labs:** Complex Survey Inference Lab (`complex-survey-lab`)

### Replicate weights · Replikációs súlyok

`survey.replicate_weights` · Level 4

Jackknife, BRR or bootstrap replicate weight sets that reproduce design variability without disclosing design variables.

- **Notation:** V̂ = cΣ_r(θ̂_r − θ̂)²
- **Prerequisites:** Complex-survey variance estimation (`survey.variance_estimation`); Bootstrap introduction (`est.bootstrap`)
- **Related:** Taylor linearization (`survey.taylor`)
- **Alternative to:** Taylor linearization (`survey.taylor`)
- **Applications:** Public-use files (ESS, PISA)
- **Common misconceptions:** Replicate weights are alternative analysis weights
- **Suggested activities:** Generate JK1 replicates for a cluster sample; compare with Taylor and simulation
- **Labs:** Complex Survey Inference Lab (`complex-survey-lab`)

### Domain estimation · Résznépesség-becslés

`survey.domain` · Level 3

Estimates for subpopulations whose sample size is random; domain SEs are larger and must not use subsetting that drops design information.

- **Notation:** ȳ_d = Σ_{s_d}wₖyₖ/Σ_{s_d}wₖ
- **Prerequisites:** Ratio and Hájek estimation (`survey.hajek`); Complex-survey variance estimation (`survey.variance_estimation`)
- **Related:** Stratum allocation (`survey.allocation`); Design-based testing (`survey.design_based_testing`)
- **Applications:** Regional or minority estimates
- **Common misconceptions:** Filter the data then analyse as a new survey
- **Suggested activities:** Pick a small domain; see how variable its estimate is across repeats
- **Labs:** Complex Survey Inference Lab (`complex-survey-lab`)

### Design-based testing · Design-alapú hipotézisvizsgálat

`survey.design_based_testing` · Level 4

Rao–Scott corrected chi-square and design-adjusted t/Wald tests that use design-based variances.

- **Notation:** χ²_RS = χ²/δ̂
- **Prerequisites:** Complex-survey variance estimation (`survey.variance_estimation`); Chi-square test of independence (`cat.chi_square`); Independent-samples t-test (`group.t_independent`)
- **Related:** Survey regression (`survey.regression`)
- **Applications:** Crosstabs from a complex survey
- **Common misconceptions:** Weighted counts can go straight into a standard chi-square
- **Suggested activities:** Weighted crosstab: naive χ² vs Rao–Scott across repeated cluster samples
- **Labs:** Complex Survey Inference Lab (`complex-survey-lab`)

### Questionnaire design · Kérdőívszerkesztés

`survey.questionnaire` · Level 2

Question wording, order, response formats and cognitive processes that determine what is actually measured.

- **Notation:** —
- **Prerequisites:** Operationalization (`data.operationalization`)
- **Related:** Measurement error (`survey.measurement_error`); Survey modes (`survey.modes`); Measurement validity (`measure.validity`)
- **Applications:** Avoiding double-barrelled, leading or acquiescence-prone items
- **Common misconceptions:** Minor wording changes do not matter
- **Suggested activities:** Split-ballot wording experiment data: compare distributions
- **Labs:** Measurement & Index Lab (`measurement-index-lab`)

### Measurement error · Mérési hiba

`survey.measurement_error` · Level 3

Difference between the recorded and the true value; random error attenuates correlations, systematic error biases levels.

- **Notation:** y = τ + ε, Var(y) = Var(τ) + Var(ε)
- **Prerequisites:** Questionnaire design (`survey.questionnaire`); Variance (`desc.variance`)
- **Related:** Internal consistency (`measure.reliability`); Correlation (Pearson's r) (`corr.pearson`)
- **Applications:** Attenuation of r; Social desirability bias
- **Common misconceptions:** Measurement error averages out in correlations
- **Suggested activities:** Add random error to x; watch r shrink toward 0
- **Labs:** Measurement & Index Lab (`measurement-index-lab`)

### Survey modes · Adatfelvételi módok

`survey.modes` · Level 2

Face-to-face, telephone, web, mail and mixed modes differ in coverage, response, cost and measurement (interviewer presence, social desirability).

- **Notation:** —
- **Prerequisites:** Sampling frames and coverage error (`survey.frame`); Questionnaire design (`survey.questionnaire`)
- **Related:** Total survey error (`survey.tse`); Nonresponse and selection bias (`survey.nonresponse`)
- **Applications:** Choosing a mode for a student survey
- **Common misconceptions:** Mode differences are only about cost
- **Suggested activities:** Mode comparison table from a published mixed-mode experiment (real data, cited)
- **Labs:** — (text/assessment only)

### Missing-data handling in surveys · Hiányzó adatok kezelése surveyekben

`survey.missing_data` · Level 3

Item nonresponse treated by imputation (hot-deck, regression, multiple) or weighting; the mechanism determines validity.

- **Notation:** MAR, multiple imputation
- **Prerequisites:** Missing values (`data.missing`); Nonresponse adjustments (`survey.nonresponse_adj`)
- **Related:** Survey regression (`survey.regression`)
- **Applications:** Income item nonresponse
- **Common misconceptions:** Single imputation preserves variance
- **Suggested activities:** Impute by three methods; compare point estimate and SE with the complete data
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Design-based inference · Design-alapú következtetés

`survey.design_based` · Level 3

Inference where the only randomness is the sample selection; y-values are fixed; unbiasedness and variance are over repeated samples.

- **Notation:** E_p[·], Var_p[·]
- **Prerequisites:** Inclusion probabilities (`survey.inclusion_prob`); Horvitz–Thompson estimation (`survey.horvitz_thompson`)
- **Related:** Model-assisted and model-based inference (`survey.model_based`); Assumptions and robustness (`infer.assumptions`)
- **Applications:** Official statistics
- **Common misconceptions:** Design-based methods assume normality of y
- **Suggested activities:** The studio's repeat button is literally the design-based expectation
- **Labs:** Survey Design & Weighting Studio (flagship) (`survey-weighting-studio`)

### Model-assisted and model-based inference · Modellel támogatott és modellalapú következtetés

`survey.model_based` · Level 4

Model-assisted (GREG) uses a model to improve efficiency while staying design-consistent; model-based inference conditions on the sample and relies on the model, needed for nonprobability samples.

- **Notation:** Ŷ_GREG = Ŷ_HT + (X − X̂_HT)ᵀβ̂
- **Prerequisites:** Design-based inference (`survey.design_based`); Calibration (`survey.calibration`); Multiple regression (`model.multiple_regression`)
- **Related:** Probability vs nonprobability sampling (`survey.prob_vs_nonprob`); Survey regression (`survey.regression`)
- **Applications:** Small-area estimation; Opt-in panel adjustment
- **Common misconceptions:** A good model makes the design irrelevant
- **Suggested activities:** Misspecify the model: model-assisted stays nearly unbiased, model-based does not
- **Labs:** Weighting & Calibration Lab (`weighting-calibration-lab`)

### Survey regression · Survey-regresszió

`survey.regression` · Level 4

Regression with survey weights and design-based SEs; coefficients estimate census-fit parameters; weighting matters when the model is misspecified.

- **Notation:** β̂_w = (XᵀWX)⁻¹XᵀWy
- **Prerequisites:** Multiple regression (`model.multiple_regression`); Complex-survey variance estimation (`survey.variance_estimation`)
- **Related:** Design-based testing (`survey.design_based_testing`); Model-assisted and model-based inference (`survey.model_based`)
- **Applications:** Any regression on ESS/PISA data
- **Common misconceptions:** Weighted regression in SPSS GLM gives design-based SEs
- **Suggested activities:** Fit with/without weights under a misspecified model; compare slopes to the census fit
- **Labs:** Complex Survey Inference Lab (`complex-survey-lab`)

### Reproducible survey analysis · Reprodukálható survey-elemzés

`survey.reproducible` · Level 3

Scripted pipeline from raw file to tables: design declaration, weights, variance method and all recodes documented and re-runnable.

- **Notation:** svydesign(ids, strata, weights, fpc)
- **Prerequisites:** Complex-survey variance estimation (`survey.variance_estimation`); Reproducibility (`practice.reproducibility`)
- **Related:** SPSS, R and Python workflows (`practice.software_workflows`)
- **Applications:** Final project of the Survey Statistics course
- **Common misconceptions:** Point-and-click output is reproducible
- **Suggested activities:** Export the studio's current design as R survey code and re-run it
- **Labs:** Complex Survey Inference Lab (`complex-survey-lab`)

## Domain J — Statistical Modelling

### Correlation (Pearson's r) · Korreláció (Pearson-féle r)

`corr.pearson` · Level 2 · Existing: `/correlation#understand`

Standardised covariance in [−1, 1]: direction and strength of linear association. Not a slope, not causation; r ≈ 0 does not exclude nonlinear relationships.

- **Notation:** r = s_xy/(s_x s_y)
- **Prerequisites:** Covariance (`desc.covariance`); Standardization (z-scores) (`desc.standardization`)
- **Related:** Slope and intercept (`model.slope`); R-squared (`model.r_squared`); Spearman's rank correlation (`corr.spearman`); Vectors and matrices (`math.vectors`)
- **Applications:** Guess-r exercise; Scatterplot reading
- **Common misconceptions:** r measures any association · r is the slope · r = 0.8 is 'twice' r = 0.4
- **Suggested activities:** GuessR, Playground, UShape: r is blind to curvature
- **Labs:** Correlation & Regression Lab (`corr-reg-lab`)

### Spearman's rank correlation · Spearman-féle rangkorreláció

`corr.spearman` · Level 2 · Existing: `/correlation#choose`

Pearson's r computed on ranks: monotonic association, for ordinal variables or when outliers distort r.

- **Notation:** ρ = r(rank x, rank y)
- **Prerequisites:** Correlation (Pearson's r) (`corr.pearson`); Variable transformations (`data.transformations`)
- **Related:** Measurement levels (`data.measurement_levels`)
- **Alternative to:** Correlation (Pearson's r) (`corr.pearson`)
- **Applications:** Ordinal survey items
- **Common misconceptions:** Spearman tests linearity · Spearman is always safer
- **Suggested activities:** PearsonSpearman: add an outlier and compare the two coefficients
- **Labs:** Correlation & Regression Lab (`corr-reg-lab`)

### Linear regression · Lineáris regresszió

`model.linear_regression` · Level 2 · Existing: `/variance#line`

Modelling the conditional mean of y as a straight-line function of x; the intercept and slope are chosen by least squares.

- **Notation:** ŷ = a + bx
- **Prerequisites:** Correlation (Pearson's r) (`corr.pearson`); The mean as a model (`desc.mean`)
- **Related:** Least squares estimation (`model.least_squares`); Slope and intercept (`model.slope`); Multiple regression (`model.multiple_regression`)
- **Applications:** Predicting knowledge from news hours (VRA lab stage 2)
- **Common misconceptions:** The line passes through the most points · Regression of y on x equals regression of x on y
- **Suggested activities:** Stage 2 of the VRA lab: mean → custom line → least squares
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Correlation & Regression Lab (`corr-reg-lab`)

### Slope and intercept · Meredekség és tengelymetszet

`model.slope` · Level 2

b: expected change in y per unit x; a: expected y at x = 0 (meaningful only if 0 is in range). b = r·s_y/s_x.

- **Notation:** b = s_xy/s_x², a = ȳ − bx̄
- **Prerequisites:** Linear regression (`model.linear_regression`); Covariance (`desc.covariance`)
- **Related:** Correlation (Pearson's r) (`corr.pearson`); Regression uncertainty (`model.regression_uncertainty`)
- **Applications:** Reading the SPSS Coefficients table
- **Common misconceptions:** b and r are the same thing · A steep slope means a strong relationship
- **Suggested activities:** Rescale x (hours → minutes): b changes, r does not
- **Labs:** Correlation & Regression Lab (`corr-reg-lab`)

### Least squares estimation · Legkisebb négyzetes becslés

`model.least_squares` · Level 2

Choosing a and b to minimise Σ(yᵢ − a − bxᵢ)²; the resulting line passes through (x̄, ȳ) and its residuals sum to zero and are uncorrelated with x.

- **Notation:** minₐ,ᵦ Σ(yᵢ − a − bxᵢ)²
- **Prerequisites:** Least squares (as a mathematical principle) (`math.least_squares`); Linear regression (`model.linear_regression`)
- **Related:** Projections (`math.projection`); Partial derivatives (`math.partials`); Residuals (`model.residuals`)
- **Applications:** Every OLS fit
- **Common misconceptions:** Least squares minimises perpendicular distances · Any line through (x̄, ȳ) is 'the' regression line
- **Suggested activities:** Custom-line handles: SSE feedback until the student finds the minimum
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`)

### Residuals · Reziduumok

`model.residuals` · Level 2 · Existing: `/variance#residuals`

Observed minus fitted values; what the model does not explain. Their spread is the error, the basis of SE and diagnostics.

- **Notation:** eᵢ = yᵢ − ŷᵢ, Σeᵢ = 0
- **Prerequisites:** Linear regression (`model.linear_regression`); The mean as a model (`desc.mean`)
- **Related:** Model fit: SST = SSR + SSE (`model.sst`); Model diagnostics (`model.diagnostics`); Standard error (`est.standard_error`)
- **Applications:** Residual plots; Residual SD
- **Common misconceptions:** Residual and error are the same thing · Residuals must be normal for the fit to be valid
- **Suggested activities:** ResidualSquares: residuals as vertical segments and squares around mean vs line
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Model Diagnostics Studio (`model-diagnostics-studio`)

### Model fit: SST = SSR + SSE · Modellilleszkedés: SST = SSR + SSE

`model.sst` · Level 2

Total variation of y splits into the part explained by the regression and the residual part, exactly for the OLS line.

- **Notation:** Σ(yᵢ − ȳ)² = Σ(ŷᵢ − ȳ)² + Σ(yᵢ − ŷᵢ)²
- **Prerequisites:** Residuals (`model.residuals`); Variance (`desc.variance`)
- **Related:** Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`); R-squared (`model.r_squared`); Projections (`math.projection`)
- **Applications:** ANOVA table of a regression
- **Common misconceptions:** The identity holds for any line (only for OLS)
- **Suggested activities:** Compare the regression and the ANOVA decomposition bars side by side (compare toggle)
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`)

### R-squared · R-négyzet (determinációs együttható)

`model.r_squared` · Level 2 · Existing: `/variance#line`

SSR/SST: share of y's variation accounted for by the model; r² for simple regression. Not a measure of slope, validity or causality.

- **Notation:** R² = 1 − SSE/SST
- **Prerequisites:** Model fit: SST = SSR + SSE (`model.sst`)
- **Related:** Eta squared (`group.eta_squared`); Effect sizes (`infer.effect_size`); Overall model fit and F (`model.model_fit`)
- **Applications:** Reporting fit
- **Common misconceptions:** High R² means a correct model · R² = 0.3 is 'bad'
- **Suggested activities:** Drag points to produce the same R² with different slopes
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Correlation & Regression Lab (`corr-reg-lab`)

### Regression uncertainty · Regressziós bizonytalanság

`model.regression_uncertainty` · Level 3

SE of the slope, its t-test and CI; confidence band for the mean response vs prediction interval for a new observation.

- **Notation:** SE(b) = s_e/√Σ(xᵢ − x̄)², t = b/SE(b)
- **Prerequisites:** Slope and intercept (`model.slope`); Standard error (`est.standard_error`); Test statistics (`infer.test_statistic`)
- **Related:** Correlation (Pearson's r) (`corr.pearson`); Confidence intervals (`est.confidence_interval`)
- **Applications:** SPSS Coefficients: Std. Error, t, Sig.
- **Common misconceptions:** The confidence band covers individual observations
- **Suggested activities:** Repeat sampling of (x, y) pairs; the fitted lines fan out; overlay the band
- **Labs:** Correlation & Regression Lab (`corr-reg-lab`); Sampling Universe (`sampling-universe`)

### Multiple regression · Többváltozós lineáris regresszió

`model.multiple_regression` · Level 3

Several predictors; each coefficient is the association of one predictor with y holding the others fixed (a partial slope).

- **Notation:** ŷ = b₀ + b₁x₁ + … + bₚxₚ
- **Prerequisites:** Linear regression (`model.linear_regression`); Partial derivatives (`math.partials`)
- **Related:** Confounding and mediation cautions (`model.confounding`); Categorical predictors (dummy variables) (`model.categorical_predictors`); Multicollinearity (`model.multicollinearity`)
- **Generalises:** Linear regression (`model.linear_regression`)
- **Applications:** Adjusting for confounders
- **Common misconceptions:** Adding predictors cannot change the sign of a coefficient · R² never decreases so more predictors are always better
- **Suggested activities:** Add Z to the X → Y model; watch b₁ change (Lazarsfeld in regression form)
- **Labs:** Correlation & Regression Lab (`corr-reg-lab`); Model Diagnostics Studio (`model-diagnostics-studio`)

### Categorical predictors (dummy variables) · Kategoriális prediktorok (dummy változók)

`model.categorical_predictors` · Level 3

k categories enter as k − 1 indicator variables against a reference category; the one-way ANOVA is a regression on dummies.

- **Notation:** ŷ = b₀ + b₁D₁ + b₂D₂
- **Prerequisites:** Multiple regression (`model.multiple_regression`); One-way ANOVA (`group.anova_oneway`)
- **Related:** Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`)
- **Applications:** Education groups as predictors
- **Common misconceptions:** Code categories 1, 2, 3 and use as one scale predictor
- **Suggested activities:** Toggle between the ANOVA view and the dummy-regression view of the same data
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Correlation & Regression Lab (`corr-reg-lab`)

### Interaction terms · Interakciós tagok

`model.interactions` · Level 3

A product term lets the slope of one predictor depend on another; main effects are then conditional on the other variable being zero (centre it).

- **Notation:** ŷ = b₀ + b₁x + b₂z + b₃xz
- **Prerequisites:** Multiple regression (`model.multiple_regression`)
- **Related:** Two-way ANOVA and interactions (`group.anova_twoway`); Lazarsfeld paradigm (`cat.lazarsfeld`)
- **Applications:** Specification in Lazarsfeld terms
- **Common misconceptions:** Interaction = correlation between predictors
- **Suggested activities:** Drag b₃; the lines for z groups rotate apart
- **Labs:** Correlation & Regression Lab (`corr-reg-lab`)

### Multicollinearity · Multikollinearitás

`model.multicollinearity` · Level 3

Highly correlated predictors make individual coefficients unstable (large SEs) while the overall fit may be fine.

- **Notation:** VIFⱼ = 1/(1 − Rⱼ²)
- **Prerequisites:** Multiple regression (`model.multiple_regression`); Regression uncertainty (`model.regression_uncertainty`)
- **Related:** Principal component analysis (`model.pca`); Projections (`math.projection`)
- **Applications:** Two income measures in one model
- **Common misconceptions:** Multicollinearity biases coefficients · Drop any predictor with r > 0.7
- **Suggested activities:** Increase the correlation between x₁ and x₂; coefficient SEs balloon
- **Labs:** Model Diagnostics Studio (`model-diagnostics-studio`)

### Overall model fit and F · Modell-F és illeszkedés

`model.model_fit` · Level 3

The regression F tests whether all slopes are zero; adjusted R² penalises predictors; compare nested models by change in SSE.

- **Notation:** F = (SSR/p)/(SSE/(n − p − 1))
- **Prerequisites:** R-squared (`model.r_squared`); F distribution (`group.f_distribution`)
- **Related:** Model diagnostics (`model.diagnostics`)
- **Applications:** SPSS ANOVA table in regression output
- **Common misconceptions:** A significant F validates each predictor
- **Suggested activities:** Add noise predictors; R² rises, adjusted R² falls
- **Labs:** Model Diagnostics Studio (`model-diagnostics-studio`)

### Model diagnostics · Modelldiagnosztika

`model.diagnostics` · Level 3

Checking linearity, independence, constant variance and influential points via residual plots rather than formal tests alone.

- **Notation:** eᵢ vs ŷᵢ, leverage, Cook's D
- **Prerequisites:** Residuals (`model.residuals`); Assumptions and robustness (`infer.assumptions`)
- **Related:** Heteroscedasticity (`model.heteroscedasticity`); Outliers and influence (`desc.outliers`)
- **Applications:** Before interpreting any regression
- **Common misconceptions:** A high R² means assumptions hold
- **Suggested activities:** Model Diagnostics Studio: four scenarios, same R², different residual plots
- **Labs:** Model Diagnostics Studio (`model-diagnostics-studio`)

### Heteroscedasticity · Heteroszkedaszticitás

`model.heteroscedasticity` · Level 3 · Existing: `/variance#hetero`

Residual spread changing with x or ŷ; OLS slopes stay unbiased but SEs are wrong; use robust SEs or transformations.

- **Notation:** Var(eᵢ) ≠ σ²
- **Prerequisites:** Model diagnostics (`model.diagnostics`)
- **Related:** Welch t-test (`group.welch_t`); Variable transformations (`data.transformations`)
- **Applications:** Income models
- **Common misconceptions:** Heteroscedasticity biases the slope
- **Suggested activities:** SpreadPatterns: fan-shaped residuals; toggle robust SE
- **Labs:** Variance · Regression · ANOVA Lab (`vra-lab`); Model Diagnostics Studio (`model-diagnostics-studio`)

### Logistic regression introduction · Logisztikus regresszió bevezetés

`model.logistic` · Level 3

Modelling the log-odds of a binary outcome as linear in predictors; coefficients exponentiate to odds ratios; fitted by maximum likelihood.

- **Notation:** logit(π) = b₀ + b₁x, OR = e^{b₁}
- **Prerequisites:** Odds ratios (`cat.odds_ratio`); Linear regression (`model.linear_regression`); Exponents and logarithms (`math.exp_log`)
- **Related:** Likelihood functions (`prob.likelihood`); Bernoulli, binomial, normal and Poisson distributions (`prob.named_distributions`)
- **Applications:** Voted / did not vote
- **Common misconceptions:** Coefficients are probabilities · Linear probability models are always wrong
- **Suggested activities:** Drag the logistic curve; read probability, odds and log-odds for one x
- **Labs:** Correlation & Regression Lab (`corr-reg-lab`)

### Principal component analysis · Főkomponens-elemzés

`model.pca` · Level 3

Rotation of standardised variables to uncorrelated components ordered by variance; a data-reduction technique, not a measurement model.

- **Notation:** Σ = VΛVᵀ, PC₁ = v₁ᵀz
- **Prerequisites:** Eigenvectors and eigenvalues (`math.eigen`); Standardization (z-scores) (`desc.standardization`); Covariance (`desc.covariance`)
- **Related:** Factor analysis introduction (`model.factor_analysis`); Composite indexes (`measure.composite_index`)
- **Applications:** Reducing 10 items to 2 scores
- **Common misconceptions:** PCA and factor analysis are the same · Components are latent causes
- **Suggested activities:** Linear Algebra & PCA Studio: rotate the axis to maximise variance
- **Labs:** Linear Algebra & PCA Studio (`linalg-pca-studio`)

### Factor analysis introduction · Faktoranalízis bevezetés

`model.factor_analysis` · Level 4

Models observed items as linear functions of latent factors plus unique error; estimates common variance only, unlike PCA.

- **Notation:** x = Λf + ε
- **Prerequisites:** Principal component analysis (`model.pca`); Internal consistency (`measure.reliability`)
- **Related:** Measurement validity (`measure.validity`)
- **Alternative to:** Principal component analysis (`model.pca`)
- **Applications:** Scale development
- **Common misconceptions:** Eigenvalue > 1 is a sufficient rule · Rotation changes the fit
- **Suggested activities:** Same items: PCA loadings vs FA loadings with uniqueness shown
- **Labs:** Linear Algebra & PCA Studio (`linalg-pca-studio`)

### Clustering introduction · Klaszterezés bevezetés

`model.clustering` · Level 3

Grouping observations by distance so within-cluster variation is small; k-means minimises within-cluster sum of squares.

- **Notation:** min Σₖ Σ_{i∈Cₖ} ‖xᵢ − μₖ‖²
- **Prerequisites:** Geometry of distances (`math.distance`); Standardization (z-scores) (`desc.standardization`)
- **Related:** Variance decomposition (SST = SSB + SSW) (`group.anova_decomposition`); Principal component analysis (`model.pca`)
- **Applications:** Typologies of respondents
- **Common misconceptions:** Clusters found by an algorithm exist in reality · k is given by the data
- **Suggested activities:** Step k-means by hand on the lab canvas; watch SSW drop
- **Labs:** Linear Algebra & PCA Studio (`linalg-pca-studio`)

## Domain K — Measurement and Research Practice

### Composite indexes · Összetett indexek

`measure.composite_index` · Level 2 · Existing: `/indices#try`

Combining several items measuring the same construct into one score (mean or sum); more reliable than one item, but averaging hides profiles.

- **Notation:** I = (1/k)Σxⱼ
- **Prerequisites:** Operationalization (`data.operationalization`); The mean as a model (`desc.mean`)
- **Related:** Reverse scoring (`measure.reverse_scoring`); Cronbach's alpha (`measure.cronbach`); Principal component analysis (`model.pca`)
- **Applications:** Attitude scales
- **Common misconceptions:** Any set of items can be averaged · The index is on the same scale as the items (only if items share a scale)
- **Suggested activities:** SameScore: different response profiles, identical index
- **Labs:** Measurement & Index Lab (`measurement-index-lab`)

### Reverse scoring · Fordított kódolás

`measure.reverse_scoring` · Level 1 · Existing: `/indices#try`

Recoding negatively worded items so all items point the same way before combining them.

- **Notation:** x′ = (max + min) − x
- **Prerequisites:** Data coding and recoding (`data.coding`)
- **Related:** Composite indexes (`measure.composite_index`); Cronbach's alpha (`measure.cronbach`)
- **Applications:** Before alpha and index construction
- **Common misconceptions:** Negative item-total correlations mean the item is bad (it may be unreversed)
- **Suggested activities:** IndexBuilder: forget to reverse one item; alpha collapses
- **Labs:** Measurement & Index Lab (`measurement-index-lab`)

### Internal consistency · Belső konzisztencia

`measure.reliability` · Level 2

The degree to which items co-vary as measures of one construct; reliability bounds validity but does not imply it.

- **Notation:** ρ_xx = Var(τ)/Var(x)
- **Prerequisites:** Covariance (`desc.covariance`); Measurement error (`survey.measurement_error`)
- **Related:** Cronbach's alpha (`measure.cronbach`); Measurement validity (`measure.validity`)
- **Applications:** Scale evaluation
- **Common misconceptions:** Reliable means valid
- **Suggested activities:** Items measuring the wrong construct consistently: high alpha, no validity
- **Labs:** Measurement & Index Lab (`measurement-index-lab`)

### Cronbach's alpha · Cronbach-alfa

`measure.cronbach` · Level 2 · Existing: `/indices#try`

k/(k − 1)·(1 − Σ item variances / variance of the sum); rises with inter-item covariance and with k. Delete items one at a time, at least three remain.

- **Notation:** α = k/(k − 1)·(1 − Σsⱼ²/s²_total)
- **Prerequisites:** Internal consistency (`measure.reliability`); Variance (`desc.variance`)
- **Related:** Composite indexes (`measure.composite_index`); Factor analysis introduction (`model.factor_analysis`)
- **Applications:** SPSS Reliability Analysis, item-total statistics
- **Common misconceptions:** α ≥ .7 proves unidimensionality · Higher α is always better
- **Suggested activities:** Alpha-if-deleted table; delete step by step; watch the variance picture
- **Labs:** Measurement & Index Lab (`measurement-index-lab`)

### Measurement validity · Mérési validitás

`measure.validity` · Level 2

Whether a measure captures the intended construct: content, criterion and construct validity; evidence, not a number.

- **Notation:** —
- **Prerequisites:** Operationalization (`data.operationalization`); Internal consistency (`measure.reliability`)
- **Related:** Questionnaire design (`survey.questionnaire`); Research design (`practice.research_design`)
- **Applications:** Justifying an index in a paper
- **Common misconceptions:** Validity is established once by alpha or by a factor analysis
- **Suggested activities:** Match five validity claims to the evidence that would support them
- **Labs:** — (text/assessment only)

### Research design · Kutatási elrendezés

`practice.research_design` · Level 2

The plan linking question, units, measurement, comparison and timing; determines which inferences the data can support.

- **Notation:** —
- **Prerequisites:** Research questions (`data.research_question`)
- **Related:** Experimental vs observational data (`practice.experimental_vs_observational`); Causal diagrams (`practice.causal_diagrams`)
- **Applications:** Final project proposals
- **Common misconceptions:** Analysis can fix a weak design
- **Suggested activities:** Design two studies for the same question: cross-sectional survey vs panel
- **Labs:** — (text/assessment only)

### Experimental vs observational data · Kísérleti és megfigyeléses adatok

`practice.experimental_vs_observational` · Level 2

Random assignment balances confounders in expectation; observational associations need explicit assumptions to be read causally.

- **Notation:** E[Y(1) − Y(0)]
- **Prerequisites:** Research design (`practice.research_design`); Independence (`prob.independence`)
- **Related:** Confounding and mediation cautions (`model.confounding`); Causal diagrams (`practice.causal_diagrams`)
- **Applications:** Interpreting a regression on survey data
- **Common misconceptions:** Controlling for covariates turns a survey into an experiment
- **Suggested activities:** Randomise assignment in the lab population; confounder balance appears across repeats
- **Labs:** Sampling Universe (`sampling-universe`)

### Causal diagrams · Oksági diagramok

`practice.causal_diagrams` · Level 3

Directed graphs of assumed causal relations; show which variables to adjust for (confounders) and which not (mediators, colliders).

- **Notation:** X → Y, Z → X, Z → Y
- **Prerequisites:** Confounding and mediation cautions (`model.confounding`); Lazarsfeld paradigm (`cat.lazarsfeld`)
- **Related:** Experimental vs observational data (`practice.experimental_vs_observational`); Multiple regression (`model.multiple_regression`)
- **Applications:** Choosing control variables
- **Common misconceptions:** Arrows are discovered from data alone
- **Suggested activities:** CausalDiagram: draw the DAG, the lab reports the adjustment set
- **Labs:** Lazarsfeld & Simpson Lab (`lazarsfeld-simpson-lab`)

### Reproducibility · Reprodukálhatóság

`practice.reproducibility` · Level 2

Another analyst can regenerate every number from the raw data and a documented procedure; scripts, seeds and provenance.

- **Notation:** —
- **Prerequisites:** Data quality (`data.quality`)
- **Related:** SPSS, R and Python workflows (`practice.software_workflows`); Reproducible survey analysis (`survey.reproducible`); Research ethics and data provenance (`practice.ethics`)
- **Applications:** Project submission requirements
- **Common misconceptions:** Saving the output is enough
- **Suggested activities:** Re-run a provided SPSS syntax/R script on the course data; diff the tables
- **Labs:** — (text/assessment only)

### Statistical reporting · Statisztikai eredmények közlése

`practice.reporting` · Level 2 · Existing: `/review`

Stating estimate, uncertainty, effect size, test and n in a defensible conclusion; APA-style p formatting; no causal language for observational data.

- **Notation:** t(28) = 2.31, p = .028, d = 0.84, 95 % CI [0.3, 5.1]
- **Prerequisites:** Statistical vs substantive significance (`infer.significance_vs_substantive`); Effect sizes (`infer.effect_size`)
- **Related:** Reproducibility (`practice.reproducibility`)
- **Applications:** Every 'Defensible conclusion' step in the chain
- **Common misconceptions:** Report p only · 'Proved' and 'caused' are fine for significant results
- **Suggested activities:** Rewrite five flawed result sentences
- **Labs:** — (text/assessment only)

### SPSS, R and Python workflows · SPSS-, R- és Python-munkafolyamatok

`practice.software_workflows` · Level 2 · Existing: `/t-tests#spss`

Mapping each method to its menu path, syntax and output in SPSS, and to equivalent R (survey, stats) or Python (statsmodels) calls.

- **Notation:** ANALYZE → COMPARE MEANS → ONE-WAY ANOVA
- **Prerequisites:** —
- **Related:** Reproducibility (`practice.reproducibility`); Reproducible survey analysis (`survey.reproducible`)
- **Applications:** Software Application blocks in every lesson
- **Common misconceptions:** Different software gives different 'truths' (differences are defaults and df conventions)
- **Suggested activities:** Spss component: BeforeSpss → MenuPath → Dialog → Output, now with an R tab
- **Labs:** — (text/assessment only)

### Research ethics and data provenance · Kutatásetika és adatprovenancia

`practice.ethics` · Level 1 · Existing: `/privacy`

Consent, anonymisation, licensing and honest documentation of where data came from and how synthetic data were generated.

- **Notation:** —
- **Prerequisites:** —
- **Related:** Reproducibility (`practice.reproducibility`); Survey modes (`survey.modes`)
- **Applications:** Dataset Block provenance fields; Distinguishing product use from research participation
- **Common misconceptions:** Public data needs no ethical consideration · Synthetic data need no documentation
- **Suggested activities:** Fill in a provenance card for the course's synthetic data sets
- **Labs:** — (text/assessment only)

# Distribution Studio · Eloszlás-stúdió

`distribution-studio` · Family A — Probability & distributions · **Existing partial implementation (repo code to refactor)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Read a density/mass function as relative likelihood and probability as area/mass
- Move between a parametric family and an empirical sample of it
- Standardise and transform a variable and predict the effect on shape, centre and spread

**Target learner level.** L1–L2 (QDA2 week 2, Survey week 3 warm-up)

**Concepts rendered** (10): Probability distributions (`prob.distributions`); Bernoulli, binomial, normal and Poisson distributions (`prob.named_distributions`); The normal distribution (`prob.normal`); Probability density and cumulative distribution (`prob.density`); Quantiles and percentiles (`desc.quantiles`); Skewness and outliers (`desc.skewness`); Interquartile range (`desc.iqr`); Standardization (z-scores) (`desc.standardization`); F distribution (`group.f_distribution`); Variable transformations (`data.transformations`)

**Prerequisite concepts** (from the graph, outside this lab): Discrete and continuous random variables (`prob.random_variable`); Derivatives and integrals (`math.calculus`); Mean, median and mode (`desc.central_tendency`); Standard deviation (`desc.sd`); Functions and transformations (`math.functions`); Null distributions (`infer.null_distribution`); Variance (`desc.variance`); Data coding and recoding (`data.coding`)

**Common misconceptions** (from the concept graph)
- 'Distribution' means histogram of the sample only
- Everything is normal
- Binomial with large n is 'exactly' normal
- Data must be normal for every test
- The normal curve's height is a probability
- f(x) is the probability of x
- The CDF can decrease
- The 90th percentile is 90 % of the maximum

**Key conceptual insight.** Area, not height, is probability; the same shaded region keeps its meaning across normal, t and F.

**Why interactivity is justified.** Static curves hide the dependence of shape on parameters; dragging μ, σ, n, p or df makes the family concept concrete.

## B. Mathematical model

- **Input data:** family ∈ {normal,t,binomial,poisson,F,chi2,uniform}; θ; optional sample x₁…xₙ
- **Parameters (configuration schema):** `family` (enum: normal/t/binomial/poisson/F/chi2/uniform), `theta` (object), `interval` (range), `sampleN` (int), `transform` (enum: none/log/z/rank)
- **Estimators**
- P(a<X≤b)=F(b)−F(a) (continuous) or Σ pmf (discrete)
- quantile Q(p) by bisection on F
- sample mean, SD (n−1), G₁ skewness, quartiles (type 7)
- **Equations**
- normal: f(x)=exp(−z²/2)/(σ√2π)
- t: tPdf/tCdf via regularised incomplete beta
- Bin(n,p): pmf = C(n,k)pᵏ(1−p)ⁿ⁻ᵏ via log-gamma
- Pois(λ): pmf = e^{−λ}λᵏ/k!
- F(d₁,d₂): sf = I_{d₂/(d₂+d₁f)}(d₂/2,d₁/2)
- **Assumptions:** none beyond parameter domains
- **Computational contracts**
- pdf(x,θ) → number ≥0; cdf monotone in [0,1]; quantile(cdf(x))≈x within 1e−6
- interval mass with a>b → 0; a=b → 0 (continuous)
- transform(log) on x≤0 → null with reason 'nonPositive'
- **Undefined cases → null + reason:** σ≤0, n<1, p∉[0,1], λ≤0, df≤0 → null + reason; - sample n<2 → SD null
- **Numerical limits:** tail accuracy ≈1e−7 (erfc Chebyshev); log-gamma Lanczos
- **Reference validation:** SciPy stats.{norm,t,binom,poisson,f,chi2}.{pdf,cdf,ppf} at 20 points per family; skew vs scipy.stats.skew(bias=False)
- **Engine:** normalPdf/normalCdf, tPdf/tCdf, binomial pmf, Poisson pmf, fP, chiSquareP (stats.ts) + empirical histogram/quantiles

## C. Visualization design

- **Main visual metaphor:** One curve, one shaded ProbabilityRegion; the sample sits under the curve as a histogram of the same unit area.
- **Primary canvas:** DistributionCurve with draggable μ handle and σ bracket (or n/p/λ/df handles), ProbabilityRegion with two draggable endpoints
- **Secondary synchronized representations**
- Linked CDF: dragging x on either panel moves both
- Histogram + boxplot of the overlaid sample (empirical ≠ theoretical, visually distinct: bars vs line)
- z-ruler under the axis
- **Formula interactions:** FormulaInspector keys: pdf, cdf, z, mu, sigma, area; hovering 'area' pulses the region
- **Semantic encodings:** theoretical = line (#101B2B); empirical = bars (#548FD0); probability region = #9688E8 fill .35; transformed sample = #20BFA9
- **Animation:** family switch morphs the curve over 550 ms by interpolating sampled ordinates; region endpoints keep their probability (not their x) when σ changes — toggleable
- **Responsive:** <900px: controls below canvas, CDF collapses into a tab
- **Reusable primitives:** DistributionChart (repo), ShadedInterval, ParameterControl, QuantileRuler

## D. Interaction specification

- **Direct manipulation:** drag μ (shift) · drag σ bracket (scale) · drag region endpoints · drag n for binomial→normal morph
- **Numeric / keyboard alternatives:** number inputs for every θ · endpoints as numbers · Tab order: family → θ → endpoints
- **Lockable parameters (instructor):** `family`, `theta`, `interval`, `transform`
- **State transitions:** family → θ → interval → sample(optional) → transform(optional)
- **Reset & reproducibility:** reset to preset θ; sample regenerates from seed; all randomness via `mulberry32(seed)`
- **Presets:** N(50,12²) with 68–95–99.7 regions · t(4) vs N(0,1) overlay · Bin(20,.3) → n=200 · F(2,12) with observed 3.0 shaded · income (log-normal) → log
- **Undo/redo:** single-level undo on θ

## E. Learning design

| Step | Activity |
|---|---|
| Predict | Before shading: 'what share of a N(50,12²) lies above 74?' |
| Experiment | Increase n of Bin(n,.3) until the pmf is visually normal; record the n where you stopped |
| Explain | Why does halving σ double the height at μ but leave the total area at 1? |
| Formalize | Write P(a<X≤b) as F(b)−F(a) and read both values off the CDF panel |
| Transfer | A skewed income variable: which transformation makes the 68 % band symmetric, and what does the band mean afterwards? |

**Expected observations:** area constant under σ change; sample histogram converges to the curve as n grows

**Plausible incorrect interpretations:** 'the curve height at x is the probability of x'; 'log transform changes the ranking of incomes'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"distribution-studio", params:{family, theta, interval, sampleN, transform}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** see presets; dataset optional (any scale variable from a Dataset block)
- **Defaults:** family normal, μ=50, σ=12, interval [38,62]
- **Available / locked controls:** restrict families; lock θ; hide CDF; hide sample
- **Formula layers:** none / result / terms / derivation
- **Assessment integration:** prediction block before shading; quiz items on area vs height
- **Teach Mode:** zoom 1.15, hide side panel, large region label
- **Localization:** all labels via dictionary; no text in geometry
- **Library blocks using this lab** (0): —
- **Instructor options (registry):** Restrict families; Fixed vs free parameters; Show/hide CDF; Preset intervals

## G. Quality assurance

- **Numerical validation:** SciPy stats.{norm,t,binom,poisson,f,chi2}.{pdf,cdf,ppf} at 20 points per family; skew vs scipy.stats.skew(bias=False)
- **Property-based tests**
- cdf(x) non-decreasing on a 1000-point grid
- ∫pdf over [μ−8σ, μ+8σ] = 1 ± 1e−4
- quantile∘cdf = id ± 1e−6
- **Statistical identities**
- Bin mean np, var np(1−p) from pmf sums
- t(df→∞) → normal within 1e−3 at df=1000
- **Edge cases:** σ=0; n=1; p=0 or 1; df=1 heavy tails clipped not capped
- **Accessibility testing:** endpoints and θ as sliders with aria-valuetext; region described as 'P(38<X≤62)=0.683'; registry alternatives: Parameter number inputs; Interval endpoints keyboard-adjustable; Table alternative for the curve
- **Performance:** 120-point curve, recompute <1 ms; no animation when reduced motion
- **Scientific review checklist**
- statistician signs off on each family's parametrisation (SPSS vs R conventions noted)
- pedagogy: presets ordered easy→hard
- **Registry test requirements:** pdf/cdf vs SciPy at 20 points per family; Quantile inverse round-trip; Binomial→normal approximation error bound

## H. Completion requirements

- **MVP:** normal + binomial, region, CDF link, presets 1–3, SciPy fixtures
- **Production-ready:** all families, sample overlay, transforms, lock schema, i18n, axe pass
- **Pilot-ready:** Predict/Experiment/Transfer blocks authored and reviewed; demo preset for week 2
- **Optional future extensions:** custom empirical distributions; QQ-plot panel

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 2; Survey week 3 warm-up |
| Classroom duration | 20 min |
| Baseline conceptual question | 'Is the height of the normal curve at the mean a probability?' |
| Primary interaction task | Shade the middle 95 % of N(50,12²) and report the interval |
| Expected learning insight | probability is area; σ controls width not total |
| Transfer item | same task on a skewed population from Sampling Universe |
| Common misconception | height = probability |
| Instructor demonstration preset | preset 1 in Teach mode |
| Technical & accessibility acceptance | keyboard-only completion of the task; axe clean; fixtures pass |

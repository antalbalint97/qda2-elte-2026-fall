# Mathematical Foundations Studio · Matematikai alapok stúdió

`math-studio` · Family E — Measurement & multivariate modelling · **Fully designed (no code yet)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Read function transformations as shifts and scales
- Expand Σ notation term by term
- See the derivative as slope and the integral as area; probability as area
- Walk a loss surface to the OLS minimum; read partial slopes
- See likelihood as a function of the parameter

**Target learner level.** L1–L3 (deep dives from Math blocks)

**Concepts rendered** (10): Algebra and equations (`math.algebra`); Functions and transformations (`math.functions`); Coordinate systems (`math.coordinates`); Exponents and logarithms (`math.exp_log`); Summation notation (`math.summation`); Geometry of distances (`math.distance`); Derivatives and integrals (`math.calculus`); Partial derivatives (`math.partials`); Optimization (`math.optimization`); Likelihood functions (`prob.likelihood`)

**Prerequisite concepts** (from the graph, outside this lab): Probability distributions (`prob.distributions`)

**Common misconceptions** (from the concept graph)
- Treating = as 'the answer is' rather than a balance
- Dividing only one side when isolating a variable
- Confusing f(x+c) (horizontal shift) with f(x)+c (vertical shift)
- Reading the dependent variable off the horizontal axis
- Assuming axes must start at zero
- log(a + b) = log a + log b
- A log transform changes the order of values
- Σxᵢ² equals (Σxᵢ)²

**Key conceptual insight.** Optimisation, integration and summation are the three operations every statistics formula is built from.

**Why interactivity is justified.** Math blocks need a place to 'open' a formula; this studio is that place, with the same visual grammar as the labs.

## B. Mathematical model

- **Input data:** topic; function preset; parameters; data for the bowl (VRA points)
- **Parameters (configuration schema):** `topic` (enum: functions/log/sum/derivative/integral/bowl/likelihood)
- **Estimators**
- numeric derivative (central difference h=1e−5)
- Riemann/Simpson integral
- SSE(a,b) surface on a grid; gradient by finite differences
- binomial likelihood L(p) and log-likelihood
- **Equations**
- f′(x)≈(f(x+h)−f(x−h))/2h
- ∫f = Σ f(x_i)Δx (Simpson)
- argmin SSE = (â,b̂) OLS
- **Assumptions:** smooth presets
- **Computational contracts**
- log of non-positive → null
- bowl grid 61×61 recomputed on data change only
- **Undefined cases → null + reason:** derivative at a kink preset (flagged)
- **Numerical limits:** numeric 1e−6
- **Reference validation:** analytic derivatives/integrals of presets; OLS from fit()
- **Engine:** Symbolic-free numeric function plotter; finite-difference derivative; Riemann integral; SSE bowl surface

## C. Visualization design

- **Main visual metaphor:** One function plot with a tangent and a shaded area; a LossSurface drawn as contours with a draggable (a,b) marker and the fitted line beside it.
- **Primary canvas:** FunctionPlot (topic 1–5) or LossSurface contour + linked scatter (topic 6)
- **Secondary synchronized representations**
- SigmaExpander: Σ unfolds to a list of terms that sum
- slice through the bowl at fixed b (partial derivative as slope)
- LikelihoodCurve with the sample's p̂
- **Formula interactions:** keys per topic
- **Semantic encodings:** function #101B2B, tangent #6A5BC9, area #9688E8, surface contours greys, minimum #20BFA9
- **Animation:** marker drag updates the fitted line live; 550 ms snaps to minimum
- **Responsive:** stacks
- **Reusable primitives:** FunctionPlot, SigmaExpander, BowlContour, LikelihoodCurve

## D. Interaction specification

- **Direct manipulation:** drag a,b,c,d of a·f(bx+c)+d · drag x for slope/area · drag (a,b) on the bowl · drag p on the likelihood
- **Numeric / keyboard alternatives:** number inputs for all
- **Lockable parameters (instructor):** `topic`
- **State transitions:** topic selector
- **Reset & reproducibility:** preset; all randomness via `mulberry32(seed)`
- **Presets:** shift/scale of a parabola · log transform · Σ(xᵢ−x̄)² for n=4 · normal area · SSE bowl (VRA data) · binomial likelihood 7/10
- **Undo/redo:** none

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Move the (a,b) marker off the minimum in any direction: does SSE ever go down?' |
| Experiment | Expand Σ(xᵢ−x̄) and show it sums to 0 for any data |
| Explain | Why is the slope of the CDF the PDF? |
| Formalize | Read ∂SSE/∂b from the slice and set it to zero |
| Transfer | Likelihood: which p maximises L for 7 successes in 10, and how is that like the bowl? |

**Expected observations:** bowl is convex; area = probability

**Plausible incorrect interpretations:** 'f(x+c) shifts right'; 'the derivative at the minimum is undefined'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"math-studio", params:{topic}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** six above
- **Defaults:** opened from a Math block with its topic
- **Available / locked controls:** lock topic
- **Formula layers:** derivation
- **Assessment integration:** none (deep dive)
- **Teach Mode:** canvas only
- **Localization:** dictionary
- **Library blocks using this lab** (0): —
- **Instructor options (registry):** Open as deep-dive from any Math Block; Preset function

## G. Quality assurance

- **Numerical validation:** analytic derivatives/integrals of presets; OLS from fit()
- **Property-based tests**
- numeric derivative vs analytic 1e−6
- bowl minimum = OLS to 1e−6
- Σ(xᵢ−x̄)=0
- **Statistical identities**
- ∫pdf=1
- **Edge cases:** log at 0; flat function
- **Accessibility testing:** inputs for everything; slope/area announced; registry alternatives: Numeric read-outs for slope/area; Σ expansion as text
- **Performance:** grid 61×61 <5 ms
- **Scientific review checklist**
- mathematician: wording of 'derivative' intuitive but correct
- pedagogy: link-back to source block
- **Registry test requirements:** Finite-difference derivative within 1e-6 of analytic for presets; Bowl minimum equals OLS (a, b)

## H. Completion requirements

- **MVP:** topics 1,3,5,6
- **Production-ready:** all topics, lock schema
- **Pilot-ready:** n/a (support instrument)
- **Optional future extensions:** symbolic display via KaTeX of the expanded terms

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | on demand from Math blocks |
| Classroom duration | 5–10 min |
| Baseline conceptual question | — |
| Primary interaction task | find the bowl minimum |
| Expected learning insight | optimisation |
| Transfer item | likelihood as bowl |
| Common misconception | shift direction |
| Instructor demonstration preset | preset 5 |
| Technical & accessibility acceptance | input-only completion; property tests |

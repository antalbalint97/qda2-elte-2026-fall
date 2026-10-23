# Expected Value Lab · Várható érték labor

`expected-value-lab` · Family A — Probability & distributions · **Fully designed (no code yet)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Compute E[X] as a probability-weighted mean and see it as the balance point
- Distinguish E[X] from the most likely and from any possible outcome
- Watch the law of large numbers in a running mean
- Connect weighted averages to survey weights

**Target learner level.** L1–L2

**Concepts rendered** (4): Expected value and variance of a random variable (`prob.expected_value`); Law of large numbers (`prob.lln`); Weighted averages (`desc.weighted_mean`); Discrete and continuous random variables (`prob.random_variable`)

**Prerequisite concepts** (from the graph, outside this lab): The mean as a model (`desc.mean`); Events and sample spaces (`prob.events`); Measurement levels (`data.measurement_levels`)

**Common misconceptions** (from the concept graph)
- The expected value is the most likely value
- E[X] must be a possible outcome
- The law 'corrects' a run of bad luck (gambler's fallacy)
- Large n makes the sample representative
- Averaging group means gives the overall mean regardless of group sizes
- A random variable is a variable with random missing values
- P(X = x) > 0 for continuous X

**Key conceptual insight.** The expected value is where the distribution balances; mass moved outward tilts it, probability moved between outcomes slides it.

**Why interactivity is justified.** Students compute E correctly yet believe it must be a possible outcome; a physical balance beam dissolves that.

## B. Mathematical model

- **Input data:** outcomes x₁…x_k with probabilities p₁…p_k (Σp=1); draws B; seed
- **Parameters (configuration schema):** `outcomes` (array), `draws` (int), `seed` (int)
- **Estimators**
- E[X]=Σxp
- Var(X)=Σp(x−E)²
- running mean x̄ₙ
- empirical SD of draws
- **Equations**
- E[aX+b]=aE[X]+b
- Var(X)=E[X²]−E[X]²
- |x̄ₙ−E| ≈ SD/√n
- **Assumptions:** finite discrete X
- **Computational contracts**
- Σp≠1 → normalise and flag 'renormalised'; any p<0 → null
- k<1 → null
- **Undefined cases → null + reason:** all p=0
- **Numerical limits:** exact arithmetic; simulation via mulberry32
- **Reference validation:** closed form; simulation convergence test (running mean within 3·SD/√n at n=10 000 on 50 seeds)
- **Engine:** Discrete distribution E, Var; seeded simulation; running mean

## C. Visualization design

- **Main visual metaphor:** ExpectedValueBalance: a beam with weights at the outcomes; the fulcrum is E[X].
- **Primary canvas:** bars = probability mass at each outcome; the beam tilts visibly until the fulcrum (E) rebalances; drag bars (p) or slide an outcome along the axis (x)
- **Secondary synchronized representations**
- RunningMeanTrace: x̄ₙ converging, with ±2·SD/√n envelope
- histogram of draws vs the mass function (empirical vs theoretical)
- **Formula interactions:** keys: x_i, p_i, product, sum, E, var; term inspector highlights one bar or the fulcrum
- **Semantic encodings:** mass bars #548FD0; fulcrum #101B2B; running mean #ED896F; envelope #9688E8
- **Animation:** fulcrum slides (550 ms) when p or x changes; draws drop as dots (reduced motion: instant)
- **Responsive:** trace below canvas under 900px
- **Reusable primitives:** PayoffBars, RunningMeanTrace, SimTally

## D. Interaction specification

- **Direct manipulation:** drag bar height (p; others renormalise unless locked) · drag outcome along axis · draw 1/100/10 000
- **Numeric / keyboard alternatives:** payoff table editing · draw buttons
- **Lockable parameters (instructor):** `outcomes`, `draws`
- **State transitions:** table → beam → simulation
- **Reset & reproducibility:** preset table; clear draws; all randomness via `mulberry32(seed)`
- **Presets:** lottery (−1 with .999, +999 with .001) · insurance · two dice sum · exam score distribution
- **Undo/redo:** one-level on table

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'A lottery ticket costs 1, pays 999 with probability .001. Is the expected gain positive?' |
| Experiment | Move 0.1 of probability from the middle outcome to the far right; record E and Var |
| Explain | Why does E move less than the mass you moved? |
| Formalize | Write Σxp for the dice preset and check against the fulcrum |
| Transfer | Survey weights: the Hájek mean Σwy/Σw is a weighted average — which outcomes get 'more probability'? |

**Expected observations:** fulcrum sits between outcomes, often on none; running mean settles but single draws never do

**Plausible incorrect interpretations:** 'E must be a possible value'; 'after a run of losses a win is due'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"expected-value-lab", params:{outcomes, draws, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** four above
- **Defaults:** two dice sum
- **Available / locked controls:** lock table; hide E until predicted
- **Formula layers:** result / terms
- **Assessment integration:** prediction block; quiz on E vs mode
- **Teach Mode:** beam only, large
- **Localization:** dictionary
- **Library blocks using this lab** (0): —
- **Instructor options (registry):** Preset games (lottery, insurance, dice); Hide E until predicted

## G. Quality assurance

- **Numerical validation:** closed form; simulation convergence test (running mean within 3·SD/√n at n=10 000 on 50 seeds)
- **Property-based tests**
- E of renormalised table equals weighted mean
- Var≥0
- running mean converges (50 seeds)
- **Statistical identities**
- Var=E[X²]−E²
- **Edge cases:** single outcome; p=1 on one outcome; negative outcomes
- **Accessibility testing:** table primary; fulcrum position announced; registry alternatives: Table editing; Running mean announced at milestones
- **Performance:** 10 000 draws batched, trace decimated to 500 points
- **Scientific review checklist**
- pedagogy: lottery framing not promotional
- statistics: sampling with replacement stated
- **Registry test requirements:** E and Var exact for presets; Running mean within 3·SD/√n at n = 10 000

## H. Completion requirements

- **MVP:** beam + table + E/Var, dice preset
- **Production-ready:** simulation, trace, presets, lock schema, i18n
- **Pilot-ready:** Predict/Transfer authored
- **Optional future extensions:** continuous X via integration preset from math-studio

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 7 intro; Survey week 5 (weighted means) |
| Classroom duration | 15 min |
| Baseline conceptual question | 'Is the expected value always a possible outcome?' |
| Primary interaction task | make E equal to an impossible value |
| Expected learning insight | balance point |
| Transfer item | Hájek mean as weighted average |
| Common misconception | E = most likely outcome |
| Instructor demonstration preset | lottery preset |
| Technical & accessibility acceptance | keyboard task; convergence test passes |

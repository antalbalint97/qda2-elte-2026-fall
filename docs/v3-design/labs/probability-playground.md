# Probability Playground · Valószínűség-játszótér

`probability-playground` · Family A — Probability & distributions · **Fully designed (no code yet)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Represent events as regions and probabilities as areas
- Compute and interpret conditional probability by restricting the sample space
- Apply Bayes' theorem with natural frequencies and explain base-rate dependence
- Distinguish independence from mutual exclusivity

**Target learner level.** L1–L2

**Concepts rendered** (6): Events and sample spaces (`prob.events`); Independence (`prob.independence`); Conditional probability (`prob.conditional`); Bayes' theorem (`prob.bayes`); Discrete and continuous random variables (`prob.random_variable`); Likelihood functions (`prob.likelihood`)

**Prerequisite concepts** (from the graph, outside this lab): Measurement levels (`data.measurement_levels`); Probability distributions (`prob.distributions`); Exponents and logarithms (`math.exp_log`); Optimization (`math.optimization`)

**Common misconceptions** (from the concept graph)
- Probabilities of non-exclusive events add
- Equally likely outcomes are the default
- Independent means mutually exclusive
- Independence in the sample implies independence in the population
- P(A | B) = P(B | A)
- Conditioning changes the outcome rather than the information
- A 95 % accurate test gives a 95 % posterior
- A random variable is a variable with random missing values

**Key conceptual insight.** Conditioning is zooming into a region; P(A|B) and P(B|A) are different zooms of the same picture.

**Why interactivity is justified.** The transposition fallacy is almost universal in text form and nearly impossible once the two conditional regions are seen side by side.

## B. Mathematical model

- **Input data:** P(B), P(A|B), P(A|¬B) or a joint table; for the tree: base rate, sensitivity, specificity; N=1000 people
- **Parameters (configuration schema):** `mode` (enum: area/tree/grid), `pB` (float), `pAgivenB` (float), `pAgivenNotB` (float), `seed` (int)
- **Estimators**
- joint = P(B)·P(A|B)
- P(A)=P(A∩B)+P(A∩¬B)
- P(B|A)=P(A∩B)/P(A)
- empirical frequencies from seeded simulation
- **Equations**
- P(A|B)=P(A∩B)/P(B)
- Bayes: P(H|D)=P(D|H)P(H)/P(D)
- independence ⇔ P(A∩B)=P(A)P(B)
- **Assumptions:** finite sample space; exact arithmetic
- **Computational contracts**
- all probabilities clamped to [0,1]; P(B)=0 → P(A|B) null with reason 'zeroCondition'
- natural-frequency tree rounds to integers only for display; computations exact
- **Undefined cases → null + reason:** conditioning on a zero-probability event; - joint table with negative cells
- **Numerical limits:** exact to double precision
- **Reference validation:** hand-computable; property tests only; simulation convergence vs exact within 3 SE at 10 000 draws
- **Engine:** Exact enumeration for finite sample spaces; seeded simulation (mulberry32)

## C. Visualization design

- **Main visual metaphor:** Eikosogram: a unit square split vertically by P(B), each column split horizontally by P(A|·).
- **Primary canvas:** ProbabilityMass area model with two draggable partition lines per column and one vertical divider
- **Secondary synchronized representations**
- FrequencyTree with 1 000 figures flowing into branches
- Simulation tally: dots fall into the four cells; empirical vs exact readout
- Venn/grid view for independence (toggle)
- **Formula interactions:** keys: pB, pAgB, pAgnB, joint, pA, pBgA; hovering highlights the corresponding rectangle(s)
- **Semantic encodings:** B = #548FD0 column, A = #20BFA9 fill, A∩B = #0F8C7B, ¬ = hatched; conditioning dims everything outside the condition
- **Animation:** 'condition on B' animates the B column expanding to full width (550 ms) so P(A|B) is literally the share of the zoomed region
- **Responsive:** tree becomes a stacked list under 900px
- **Reusable primitives:** AreaModel, FrequencyTree, SimTally

## D. Interaction specification

- **Direct manipulation:** drag vertical divider (P(B)) · drag horizontal lines (P(A|B), P(A|¬B)) · drag base rate on the tree · click 'condition on A' / 'on B'
- **Numeric / keyboard alternatives:** three number inputs · tree values as inputs · simulate 100/1 000 buttons
- **Lockable parameters (instructor):** `pB`, `pAgivenB`, `pAgivenNotB`, `mode`
- **State transitions:** mode (area|tree|grid) → values → conditioning → simulation
- **Reset & reproducibility:** preset values; simulation cleared; all randomness via `mulberry32(seed)`
- **Presets:** disease test: 1 % base rate, 95 %/95 % · two dice independence · political interest × voting (course crosstab)
- **Undo/redo:** none

## E. Learning design

| Step | Activity |
|---|---|
| Predict | '1 % have the disease, the test is 95 % accurate, you test positive: how likely are you ill?' |
| Experiment | Drag the base rate from 1 % to 30 %; record P(ill|positive) at 1, 5, 10, 30 % |
| Explain | Why does the small blue column (ill) still lose to the false positives from the big column? |
| Formalize | Write Bayes with the tree's integers: 9.5/(9.5+49.5) |
| Transfer | Row percentages in a crosstab: which conditional probability are they, and which one are column percentages? |

**Expected observations:** posterior rises steeply with base rate; P(A|B)≠P(B|A) visibly

**Plausible incorrect interpretations:** 'accuracy 95 % → posterior 95 %'; 'independent events cannot occur together'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"probability-playground", params:{mode, pB, pAgivenB, pAgivenNotB, seed}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** three above; instructor can type a scenario text
- **Defaults:** disease test preset in area mode
- **Available / locked controls:** lock mode; hide exact values until reveal
- **Formula layers:** result / terms
- **Assessment integration:** prediction before reveal; quiz items re-keyed to prob.conditional, prob.bayes
- **Teach Mode:** tree with 1 000 figures full-screen
- **Localization:** scenario texts bilingual
- **Library blocks using this lab** (0): —
- **Instructor options (registry):** Scenario text (disease test, voter turnout); Lock to one view; Hide exact values until reveal

## G. Quality assurance

- **Numerical validation:** hand-computable; property tests only; simulation convergence vs exact within 3 SE at 10 000 draws
- **Property-based tests**
- Σ joint cells = 1 ± 1e−12
- Bayes identity holds for 1 000 random triples
- simulation mean within 3·SE of exact
- **Statistical identities**
- P(A)=P(A|B)P(B)+P(A|¬B)P(¬B)
- **Edge cases:** P(B)=0; P(B)=1; P(A|B)=P(A|¬B) (independence)
- **Accessibility testing:** partition values announced; tree readable as nested list; no colour-only cell identity (labels); registry alternatives: All partitions settable by number; Tree read as nested list
- **Performance:** trivial
- **Scientific review checklist**
- statistician: wording of 'accuracy' split into sensitivity/specificity
- pedagogy: scenario order
- **Registry test requirements:** Bayes identity exact to 1e-12; Simulation converges within 3 SE for 10 000 draws

## H. Completion requirements

- **MVP:** area model + tree, disease preset, conditioning animation
- **Production-ready:** grid view, simulation, presets, lock schema, i18n
- **Pilot-ready:** Predict/Transfer authored; baseline item
- **Optional future extensions:** three-event extension; Monty Hall preset

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 3 (before crosstabs) or week 8 |
| Classroom duration | 20 min |
| Baseline conceptual question | disease-test question (free answer) |
| Primary interaction task | find the base rate at which the posterior passes 50 % |
| Expected learning insight | base-rate dependence |
| Transfer item | row vs column percentages as conditionals |
| Common misconception | transposition fallacy |
| Instructor demonstration preset | disease preset, tree mode |
| Technical & accessibility acceptance | task completable by keyboard; property tests pass |

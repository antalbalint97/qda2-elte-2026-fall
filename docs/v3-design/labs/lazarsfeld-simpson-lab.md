# Lazarsfeld & Simpson Lab · Lazarsfeld- és Simpson-labor

`lazarsfeld-simpson-lab` · Family C — Categorical & relational · **Existing partial implementation (repo code to refactor)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Split an X–Y association by Z and compare partials with the zero-order table
- Classify replication, specification, explanation, interpretation
- Produce and explain a Simpson reversal
- Draw a causal diagram and decide what to adjust for

**Target learner level.** L2–L3

**Concepts rendered** (6): Stratified tables (`cat.stratified`); Lazarsfeld paradigm (`cat.lazarsfeld`); Simpson's paradox (`cat.simpson`); Confounding and mediation cautions (`model.confounding`); Causal diagrams (`practice.causal_diagrams`); Weighted averages (`desc.weighted_mean`)

**Prerequisite concepts** (from the graph, outside this lab): Conditional percentages (`cat.conditional_percent`); Variable roles (X, Y, Z) (`data.variable_roles`); The mean as a model (`desc.mean`)

**Common misconceptions** (from the concept graph)
- Partial tables always show the same pattern as the total
- Explanation and interpretation differ statistically (they differ only in the causal order of Z)
- Simpson's paradox is a rare curiosity
- The aggregated table is always wrong
- Control for everything available
- Statistical control proves causation
- Arrows are discovered from data alone
- Averaging group means gives the overall mean regardless of group sizes

**Key conceptual insight.** The aggregate is a weighted average of the partials; when Z's composition differs across X, the weights can flip the sign.

**Why interactivity is justified.** Elaboration is taught with static tables; dragging the Z composition makes the arithmetic of confounding visible.

## B. Mathematical model

- **Input data:** 2×2×2 (or 2×2×k) counts; X, Y, Z labels; causal order of Z (antecedent/intervening) as an assumption
- **Parameters (configuration schema):** `scenario` (enum: replication/specification/explanation/interpretation/simpson), `composition` (array)
- **Estimators**
- % differences in zero-order and partial tables
- aggregate = Σ_z w_z·partial_z, w_z = share of Z within X
- pattern classifier: thresholds on |partial − zero-order| (documented, adjustable)
- Mantel–Haenszel pooled OR (optional, labelled)
- **Equations**
- P(Y|X)=Σ_z P(Y|X,Z)P(Z|X)
- **Assumptions:** causal order of Z is an input, not estimated
- **Computational contracts**
- classifier returns {pattern, confidence:'clear'|'borderline'} with the thresholds shown
- zero cell in a partial → % null, pattern 'undetermined'
- **Undefined cases → null + reason:** Z with one level
- **Numerical limits:** exact arithmetic
- **Reference validation:** hand-computable; repo lazarsfeld/data.ts scenarios reproduced; MH OR vs statsmodels StratifiedTable
- **Engine:** Partial-table arithmetic; weighted aggregation; scenario generator (lazarsfeld/data.ts)

## C. Visualization design

- **Main visual metaphor:** Three linked ContingencyMosaics (zero-order, Z=0, Z=1) plus a CompositionStrip showing P(Z|X); the DAG above decides the reading.
- **Primary canvas:** zero-order mosaic in the centre, partial mosaics left/right; drag the composition strip to redistribute Z across X; drag partial %
- **Secondary synchronized representations**
- PartialBars (repo) comparing % differences
- CausalDiagram (repo) with selectable arrows; adjustment advice text
- DecisionTree (repo) for the pattern
- **Formula interactions:** keys: pZgX, partial, zero, weight; hovering 'weight' highlights the composition strip
- **Semantic encodings:** X hue, Z as texture/lightness; reversal highlighted with #C8694F arrow
- **Animation:** composition drag re-flows the aggregate tiles live
- **Responsive:** partials stack <900px
- **Reusable primitives:** PartialBars, CompositionStrip, CausalDiagram, DecisionTree

## D. Interaction specification

- **Direct manipulation:** drag composition strip · drag partial tile boundaries · toggle DAG arrows
- **Numeric / keyboard alternatives:** three editable tables · arrow checkboxes
- **Lockable parameters (instructor):** `scenario`, `composition`
- **State transitions:** zero-order → partials → classify → DAG
- **Reset & reproducibility:** scenario; all randomness via `mulberry32(seed)`
- **Presets:** replication · specification · explanation · interpretation · Simpson admissions
- **Undo/redo:** one-level

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Men are admitted more often overall. Could women be admitted more often in every department?' |
| Experiment | Drag the composition until the aggregate sign flips; record the composition |
| Explain | Why does the same partial pattern give 'explanation' with an antecedent Z and 'interpretation' with an intervening Z? |
| Formalize | Write the aggregate % as the weighted average of the two partial % |
| Transfer | Multiple regression: adding Z as a covariate — which Lazarsfeld pattern corresponds to a coefficient shrinking to zero? |

**Expected observations:** weights flip signs; pattern depends on the DAG, not the numbers

**Plausible incorrect interpretations:** 'the aggregate table is wrong'; 'controlling for anything available is safe'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"lazarsfeld-simpson-lab", params:{scenario, composition}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** five above
- **Defaults:** explanation scenario
- **Available / locked controls:** hide classification until answered
- **Formula layers:** terms
- **Assessment integration:** l-rep, l-spec, l-antecedent, l-sequence items
- **Teach Mode:** three mosaics full-width
- **Localization:** dictionary
- **Library blocks using this lab** (2): `l.lazarsfeld-scenarios`, `x.simpson-flip`
- **Instructor options (registry):** Hide classification until answered; Scenario text; Preset data from course

## G. Quality assurance

- **Numerical validation:** hand-computable; repo lazarsfeld/data.ts scenarios reproduced; MH OR vs statsmodels StratifiedTable
- **Property-based tests**
- aggregate = weighted partials to 1e−12
- Simpson preset reproduces Bickel et al. direction
- **Statistical identities**
- equal composition ⇒ aggregate between partials
- **Edge cases:** zero cell; Z with 3 levels
- **Accessibility testing:** tables primary; DAG as adjacency list; registry alternatives: All tables editable; DAG as adjacency list
- **Performance:** trivial
- **Scientific review checklist**
- methodologist: classifier thresholds documented
- pedagogy: causal language guarded
- **Registry test requirements:** Aggregate equals weighted partials to 1e-12; Simpson reversal scenario reproduces published example

## H. Completion requirements

- **MVP:** three mosaics + composition drag + classifier, 4 scenarios
- **Production-ready:** Simpson, DAG advice, MH OR, lock schema
- **Pilot-ready:** Predict/Transfer authored
- **Optional future extensions:** k-level Z; link to regression adjustment in corr-reg-lab

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | QDA2 week 5 |
| Classroom duration | 30 min |
| Baseline conceptual question | l-antecedent item |
| Primary interaction task | flip the aggregate |
| Expected learning insight | weights of partials |
| Transfer item | regression adjustment |
| Common misconception | aggregate is 'the truth' |
| Instructor demonstration preset | Simpson preset |
| Technical & accessibility acceptance | table-only completion; identity tests pass |

# Survey Sampling Design Studio · Survey mintavételi tervező stúdió

`survey-design-studio` · Family D — Advanced survey statistics · **Fully designed (no code yet)**

> Generated from `data/lab-specs-*.js` (authored) + `data/labs.js` + concept graph (derived). Edit the data files.

## A. Pedagogical identity

**Primary learning objectives**
- Define target population vs frame and quantify coverage
- Allocate a stratified sample (proportional, Neyman, equal) and read the SE consequences
- Trace πₖ through two stages and PPS
- Connect allocation to domain precision

**Target learner level.** L2–L3

**Concepts rendered** (6): Target population (`survey.target_population`); Sampling frames and coverage error (`survey.frame`); Stratum allocation (`survey.allocation`); Multistage sampling (`survey.multistage`); Probability proportional to size (`survey.pps`); Inclusion probabilities (`survey.inclusion_prob`)

**Prerequisite concepts** (from the graph, outside this lab): Populations and samples (`est.population_sample`); Stratified sampling (`survey.stratified`); Cluster sampling (`survey.cluster`); Simple random sampling (`survey.srs`); Events and sample spaces (`prob.events`)

**Common misconceptions** (from the concept graph)
- The target population is whoever answers
- Larger frames are always better
- Equal allocation is 'fair' and efficient
- Only the last stage matters for weights
- PPS gives bigger PSUs more weight in the estimate (it equalises unit weights)
- πₖ is estimated from the sample
- Equal πₖ implies SRS

**Key conceptual insight.** πₖ is a design decision made before any data; every weight is its mirror image.

**Why interactivity is justified.** Allocation trade-offs (total vs domain precision) are invisible in formulas; draggable allocation bars with live SEs expose them.

## B. Mathematical model

- **Input data:** PopulationSpec (shared with the Studio) + PSU size measures M_i; strata; stages; allocation
- **Parameters (configuration schema):** `strata` (int), `allocation` (enum: proportional/neyman/equal/custom), `stages` (int), `pps` (boolean)
- **Estimators**
- coverage rate per group
- n_h: proportional N_h/N·n; Neyman N_hS_h/ΣN_hS_h; equal; custom
- SE_total under stratified SRS (closed form) and per-domain SE
- π: SRS, strat, two-stage product, PPS systematic π_i = m·M_i/ΣM_i (capped at 1 with certainty units)
- **Equations**
- Var(ȳ_st)=Σ(N_h/N)²(1−f_h)S_h²/n_h
- π_k=(a/A)(m/M_i) or m·M_i/ΣM_i·(m_i/M_i)
- **Assumptions:** S_h known for Neyman (from population: labelled 'oracle')
- **Computational contracts**
- n_h>N_h → clamp and flag
- PPS π>1 → certainty stratum, flagged
- Σπ_k = n (checked)
- **Undefined cases → null + reason:** stratum with S_h=0 in Neyman
- **Numerical limits:** exact
- **Reference validation:** R sampling::inclusionprobabilities for PPS; closed forms by hand; survey::svydesign for SE
- **Engine:** Frame/population overlay; stratum allocation (proportional, Neyman); multistage π products; PPS systematic selection

## C. Visualization design

- **Main visual metaphor:** SamplingDesignTree: PSU grid → strata bands → allocation bars; one unit's path lit up with InclusionProbabilityMarkers at each stage.
- **Primary canvas:** PSU grid (20 blocks, sized by M_i in PPS mode) with frame overlay; strata as colour bands
- **Secondary synchronized representations**
- allocation bars per stratum with SE_total and domain SE readouts
- π trace card: stage probabilities multiply to π_k
- coverage composition bar
- **Formula interactions:** keys: Nh, nh, Sh, fh, var_st, pi1, pi2, pi
- **Semantic encodings:** as Studio; certainty PSUs outlined amber
- **Animation:** allocation drag re-flows bars and SEs live
- **Responsive:** stacks <900px
- **Reusable primitives:** PSUGrid, AllocationBars, PiTrace

## D. Interaction specification

- **Direct manipulation:** drag allocation bars · toggle stages · toggle PPS · hover a unit to trace π
- **Numeric / keyboard alternatives:** allocation as number table · unit select by id
- **Lockable parameters (instructor):** `strata`, `allocation`, `stages`, `pps`
- **State transitions:** frame → strata → allocation → stages → PPS
- **Reset & reproducibility:** preset; all randomness via `mulberry32(seed)`
- **Presets:** national face-to-face layout · oversample small group · equal-probability two-stage · PPS with one certainty PSU
- **Undo/redo:** one-level

## E. Learning design

| Step | Activity |
|---|---|
| Predict | 'Equal allocation across three unequal strata: better or worse total SE than proportional?' |
| Experiment | Move allocation toward the small stratum until its domain SE halves; record total SE |
| Explain | Why does PPS at stage 1 with fixed m give equal π_k? |
| Formalize | Compute π_k for one unit by multiplying the two stage probabilities |
| Transfer | Explain why an opt-in panel has no π_k and what that implies for the Studio's later stages |

**Expected observations:** Neyman beats proportional when S_h differ; domain precision costs total precision

**Plausible incorrect interpretations:** 'bigger PSUs get more weight under PPS'; 'equal allocation is fair and efficient'

## F. Instructor configuration

- **Schema:** `LabConfiguration{ lab:"survey-design-studio", params:{strata, allocation, stages, pps}, controls:{locked:[…]}, outputs:{visible:[…]}, formulas:{level}, instructions, prompts, lang, present }`
- **Preset datasets:** four above
- **Defaults:** 3 strata proportional
- **Available / locked controls:** lock strata/stages
- **Formula layers:** terms
- **Assessment integration:** a.survey-midterm items
- **Teach Mode:** grid full-width
- **Localization:** dictionary
- **Library blocks using this lab** (2): `l.sds-frame`, `l.sds-stages`
- **Instructor options (registry):** Preset national-survey layout; Lock stages

## G. Quality assurance

- **Numerical validation:** R sampling::inclusionprobabilities for PPS; closed forms by hand; survey::svydesign for SE
- **Property-based tests**
- Σπ=n
- Neyman vs closed form
- PPS π vs R sampling
- **Statistical identities**
- proportional allocation ⇒ equal weights
- **Edge cases:** certainty PSU; stratum n_h=1 (SE undefined, flagged)
- **Accessibility testing:** table primary; trace as text; registry alternatives: Allocation as number table; Trace as text
- **Performance:** trivial
- **Scientific review checklist**
- survey statistician: Neyman uses oracle S_h — stated
- pedagogy: presets
- **Registry test requirements:** Neyman allocation vs closed form; Σπₖ = n; PPS π vs R sampling::inclusionprobabilities

## H. Completion requirements

- **MVP:** strata + allocation + SE, π trace
- **Production-ready:** two-stage, PPS, lock schema
- **Pilot-ready:** Predict/Transfer authored
- **Optional future extensions:** cost-optimal allocation

## Pilot readiness card

| Field | Value |
|---|---|
| Teaching context | Survey weeks 2 and 4 |
| Classroom duration | 25 min |
| Baseline conceptual question | 'What is π_k under SRS?' |
| Primary interaction task | halve a domain SE |
| Expected learning insight | allocation trade-off |
| Transfer item | opt-in panel |
| Common misconception | PPS weights big PSUs more |
| Instructor demonstration preset | preset 2 |
| Technical & accessibility acceptance | table-only; property tests |

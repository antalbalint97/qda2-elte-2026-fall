# 08 · V2 audit and status reconciliation

Date: 2026-10-23. Baseline: developedv1 artifacts in this project + repo `antalbalint97/qda2-elte-2026-fall@6e0d38f`.

## 1. The inconsistency, resolved

| Source | Claim | Finding |
|---|---|---|
| `docs/03-lab-registry.md` (v1) | 2 built · 7 repo · 11 spec | Correct for v1 artifacts. |
| `HANDOFF.md` §15 (v1) | "16 of 20 labs are specified only" | Wrong: it counted the 7 "repo" labs as specification-only. Repo code for those exists but is **not** a lab (no shared primitives, no configuration schema, no student-facing lab shell). |

**Authoritative V2 inventory** (statuses as defined by the brief; a specification is not functionality, an engine function is not a lab, a working visualization is not validation):

| Lab | V2 status | Evidence |
|---|---|---|
| vra-lab | **Working prototype** · numerically **validated** (SciPy fixtures, identities) · *not* pilot-ready (no pilot run) | `QDA2 Lab.dc.html`, `qda2-stats.js` selfTest/selfTest2 |
| sampling-universe | Working prototype · validated by property tests only (no external fixtures yet) | `QDA2 Sampling Universe.dc.html`, `sampling-stats.js` |
| ttest-lab | Working prototype (V2) · engine validated (SPSS/SciPy conventions in `qda2-stats.js`); UI parity tests to add | `QDA2 tTest Lab.dc.html` |
| ci-explorer | Working prototype (V2) · coverage tolerance tests to add | `QDA2 CI Explorer.dc.html` |
| survey-weighting-studio | Working prototype (V2) · engine **unvalidated vs R survey** — badge shown in UI | `QDA2 Survey Weighting Studio.dc.html`, `survey-stats.js` |
| distribution-studio, hypothesis-lab, categorical-lab, lazarsfeld-simpson-lab, corr-reg-lab, measurement-index-lab | **Existing partial implementation** (repo module interactives + validated engine functions) · fully designed in `docs/labs/` | repo `src/components/modules/**`, `src/lib/stats.ts`, `reliability.ts` |
| probability-playground, expected-value-lab, anova-studio, survey-design-studio, weighting-calibration-lab, complex-survey-lab, linalg-pca-studio, math-studio, model-diagnostics-studio | **Fully designed** (A–H contract + pilot card) · no code | `docs/labs/<id>.md` |

Counts: 5 working prototypes · 6 partial implementations · 9 fully designed · 0 implementation-in-progress · 1 validated engine (VRA/stats core) · 0 pilot-ready.

## 2. Existing vs missing functionality (V2 delta)

New in V2: `survey-stats.js` (design object, selection, response, HT/Hájek, post-strat, raking, linearised/closed-form/naive variance, Kish, deff, Monte-Carlo repeat), three flagship labs, `QDA2 Lesson.dc.html` (student renderer with published-snapshot preference, local progress, privacy panel, reset-to-preset), `QDA2 Labs.dc.html` (portfolio with maturity), Course Builder V2 (review dimensions, locked controls + instructions per lab instance, Teach-mode link, question bank index, save-state feedback, drawer layout), `data/questions.js` (38 repo questions re-keyed, provenance kept), 18 lab contracts, docs 08–15.

Still missing: R validation script and results; 9 designed labs; GREG/bounded calibration; replicate weights; Rao–Scott; nct power; option/feedback text for questions (lives in repo); HU for concept definitions and block bodies.

## 3. Shared primitive audit

| Primitive | Exists in | Reused by (V2) | Gap |
|---|---|---|---|
| DraggableObservation, ReferenceLine, DeviationSegment, SquaredDeviation, DecompositionBar, FormulaInspector, StatisticReadout, ParameterControl, ConceptPrompt | VRA lab | t-Test (observations, mean/spread handles, SE² squares), Sampling Universe (readouts) | not yet extracted into a shared file; each DC re-implements inline (acceptable for prototypes; must be one module in the repo) |
| DistributionCurve / ProbabilityRegion | t-Test (null tails), Sampling Universe (theory overlay) | Distribution Studio, Hypothesis | spec in `09-visualization-system.md` |
| PopulationField, SampleSelection, WeightedObservation, InclusionProbabilityMarker, WeightDistribution | Survey Studio | Design Studio, Calibration, Complex Survey | shared generator = `QDA2Survey.makePopulation` |
| SamplingDistributionPlot, IntervalBand, CoverageCounter | Sampling Universe, CI Explorer | Hypothesis, ANOVA | — |
| GroupComparison, PairedDifference | t-Test | ANOVA Studio | — |
| ContingencyMosaic, FrequencyTree, ExpectedValueBalance, SamplingDesignTree, CalibrationMargin, ReplicateEstimate, VectorProjection, MatrixTransformation, LossSurface, ResidualDiagnosticPlot | — | designed labs | specified only |

Runtime note discovered in V2: dynamic text inside SVG `<text>` must be rendered from `renderVals()` (`TXT()` helper) — template holes wrap text in a `<span>`, which is invisible in SVG. All three new labs use the helper; VRA used `axisEls` the same way.

## 4. Statistics engine dependency map

```
qda2-stats.js  (QdaStats)  ── describe, fit, sseLine, anova, fP, incompleteBeta, normal*, t*, oneSampleT, independentT, pairedT, mulberry32, gaussian,
                              weightedMean, srsVarMean, stratVarMean, clusterVarMean, kishDeff, postStratify
   ├── QDA2 Lab (VRA)                 describe fit sseLine anova fP
   ├── QDA2 tTest Lab                 describe oneSampleT independentT pairedT tPdf tCritical tTwoTailedP fmtP
   ├── QDA2 CI Explorer               describe tCritical normalQuantile mulberry32
   ├── sampling-stats.js (QDA2Sampling) own mulberry32/gaussian (duplicate → unify on port); srs, statistic, theorySE, histogram, bootstrap
   │     ├── QDA2 Sampling Universe
   │     └── QDA2 CI Explorer         makePopulation srs mean
   └── survey-stats.js (QDA2Survey)   depends on QdaStats.describe/mulberry32/gaussian/srsVarMean/stratVarMean/clusterVarMean
         └── QDA2 Survey Weighting Studio
repo src/lib/stats.ts = same algorithms (incomplete beta, erfc, t, χ², Levene, linearFit); reliability.ts for α.
```

## 5. Content and Course Builder issues found in v1 and fixed in V2

- `reviewed:true` on 60 blocks conflated "content exists in repo" with "peer-reviewed" → replaced by `review{content, scientific, numerical, pedagogical, accessibility, translation, pilot}`; `reviewed` is now derived and labelled "scientifically reviewed + validated".
- Lab config did not reach new labs → `LABFILE` map + JSON hash contract; flat block keys mapped in the Studio.
- No locked controls / student instructions → added per instance (`variant.locked`, `variant.instructions`), read by all V2 labs (`controls.locked`, `instructions`).
- Students saw drafts → Lesson renderer prefers the last published snapshot and badges drafts.
- Save state invisible → "saved HH:MM · local draft" / storage failure warning.
- Assessment blocks were empty → matched questions from `data/questions.js` by concept id (prompt + id + provenance; options stay in repo).
- Publish audit: pins + snapshot + version bump + draft-on-edit verified by reading the code; **not** auto-tested yet (see 15-roadmap).

## 6. Prioritised development matrix

| Priority | Item | Why |
|---|---|---|
| P0 | `scripts/validation/survey_reference.R` + fixtures; validated badge flips only on pass | no survey number should be graded before this |
| P0 | Extract shared primitives into `src/components/lab/primitives/` and port the 5 prototypes | reuse is the architecture |
| P1 | Partial → working: categorical-lab, hypothesis-lab, distribution-studio (repo code + specs ready) | QDA2 weeks 2–4, 8 |
| P1 | Lesson renderer in Next.js (`/course/[c]/[u]/[l]`) + progress store key registration | learner side |
| P2 | anova-studio, lazarsfeld-simpson-lab, corr-reg-lab, measurement-index-lab | QDA2 weeks 5–6, 10–12 |
| P2 | survey-design-studio, complex-survey-lab | Survey weeks 2, 4, 10–13 |
| P3 | weighting-calibration-lab, linalg-pca-studio, math-studio, model-diagnostics-studio, probability-playground, expected-value-lab | depth and deep dives |

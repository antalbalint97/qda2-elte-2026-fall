# 15 · Development roadmap (post-V2) — **V3 status appended at the bottom**

Statuses: **done** = working in this project · **spec** = designed only · **repo** = to be done in the Next.js repository.

## Phase 1 — Audit & architecture · done
08-v2-audit, primitive audit, engine map, prioritised matrix.

## Phase 2 — Design all remaining labs · done (18/18 contracts, 5 family storyboards)

## Phase 3 — Three flagship prototypes · done, with gates
- Survey Design & Weighting Studio — working; **gate:** R validation (P0).
- t-Test Lab — working; gate: parity tests ported to `tests/unit`.
- CI Explorer — working; gate: coverage tolerance tests.

## Phase 4 — Course Builder vertical slice · done in prototype
Create lesson → add concept/prediction/lab/math/assessment → configure (design, locked controls, instructions) → preview → publish locally → open in Lesson renderer with the identical hash. Gap: snapshot does not embed block bodies (12 §D).

## Phase 5 — Validation & handoff · partially done
Done: this documentation, HANDOFF Part III, honest status inventory. Not done: automated course-publishing tests, axe run on the new screens, instructor walkthrough recording.

## Next steps, in order
1. **P0** `survey_reference.R` + fixtures; `tests/unit/survey-stats.test.ts`; flip the badge.
2. **P0** `src/components/lab/primitives/` extraction (DraggableObservation, SquaredDeviation, IntervalBand, PopulationField, DistributionCurve/ProbabilityRegion, SamplingDistributionPlot, GroupComparison) and port the 5 prototypes (`/lab/<id>` routes reading the hash contract).
3. **P1** Snapshot embedding + version picker in the Builder; publish tests.
4. **P1** Lesson route + QuizRunner mount with `data/questions.js` ids; register storage keys.
5. **P1** categorical-lab, hypothesis-lab, distribution-studio from repo code + specs.
6. **P2** anova-studio (extends VRA stage 3), lazarsfeld-simpson-lab, corr-reg-lab, measurement-index-lab.
7. **P2** survey-design-studio, complex-survey-lab (needs JKn/Rao–Scott in the engine + R parity).
8. **P3** remaining designed labs; HU translation of definitions and block bodies; terminology glossary (`docs/16-glossary.md` — started below).
9. Pilot per `07-evaluation-plan.md` only after P0–P1.

## Terminology glossary (seed)
sampling distribution — mintavételi eloszlás · standard error — standard hiba · confidence interval — konfidenciaintervallum · expected value — várható érték · inclusion probability — beválasztási valószínűség · design effect — mintatervhatás (design effect) · calibration weighting — kalibrációs súlyozás · finite population correction — véges populációs korrekció · post-stratification — utólagos rétegzés · raking — raking (iteratív arányos illesztés) · effective sample size — effektív mintanagyság · nonresponse — nemválaszolás · coverage error — lefedettségi hiba · sampling frame — mintavételi keret · stratum — réteg · cluster — klaszter / csoport · primary sampling unit — elsődleges mintavételi egység · Horvitz–Thompson estimator — Horvitz–Thompson-becslő · Hájek estimator — Hájek-becslő · squared deviation — négyzetes eltérés · residual — reziduum · degrees of freedom — szabadságfok · null distribution — nulleloszlás · effect size — hatásnagyság · statistical power — statisztikai erő.


## V3 status (2026-10-23)
1. P0 R validation — **done** (fixtures F1–F8 reproduced by R survey 4.x in webR; see docs/17). Remaining: raking/GREG weight vectors, deff convention, PPS vs sampling (CI).
2. P0 primitive extraction — **done as shared JS** (lab-shell.js, qda2-engine.js); TS extraction is step 1–2 of HANDOFF_V3_PRODUCTION §5.
3. P1 snapshot embedding + version picker — **done** (course-model.js, Builder V3, Lesson ?v=).
4. P1 QuizRunner with question bank — **done** (data/question-bank.js; choice + order, deterministic feedback).
5–8. All 15 remaining labs — **built** (maturity per lab in HANDOFF_V3_PRODUCTION §2; none pilot-ready until instructor walkthrough + axe + CI parity).
9. Pilot — gated on §12 of the production handoff.

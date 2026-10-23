# 07 · Pilot evaluation plan and QA

## Two questions the pilot must answer
1. **Pedagogical feasibility** — do interactive representations improve conceptual understanding (variance, sampling variation, weighting) compared with the current text + SPSS modules?
2. **Authoring flexibility** — can two instructors build materially different courses from the same library without touching code?

## Design (lightweight, consented)
- Two seminar groups, one semester. Group A: QDA2 template; Group B: existing site. Same final project rubric.
- Pre/post concept check: 12 items from the question bank re-keyed to graph ids (variance, SE, p-value, Lazarsfeld, weighting), delivered as an Assessment block; answers stored locally and **exported only by the student on explicit consent** (download → upload to the course LMS). No hidden telemetry; `STORAGE_KEYS` lists everything.
- Instructor authoring session: two instructors (one QDA2, one survey methods) each build a 3-week mini-course from the library in 90 minutes; think-aloud, screen recording with consent. Measure: blocks found via search vs browsing, variants created, prerequisite suggestions accepted/ignored, export success.
- Task completion in labs: 6 scripted tasks per lab (e.g. "make F < 1", "make coverage drop below 90 %"), timed, with a keyboard-only run for 2 participants.
- Accessibility: axe pass on every screen (already in `test:e2e`), manual screen-reader walkthrough of one lesson, reduced-motion check.
- Technical reliability: error log is local console only; students report via a form.

## Measures
| Area | Measure |
|---|---|
| Student usability | SUS after week 7; task success and time |
| Instructor authoring | time to first publishable lesson; count of variants vs references; qualitative friction list |
| Conceptual understanding | pre/post gain on the 12 items, by concept |
| Misconceptions | per-option `why` hit rates (which wrong answer was chosen) |
| Transfer | week 13 defensible-conclusion rubric score on a novel data set |
| Reusability | share of Course B blocks also used in Course A (currently 8 of 118) and instructor-created reuse |
| Technical | console errors per session (self-reported), load time of the lab on seminar-room machines |

## Statistical QA gates (must pass before students see a number)
- `tests/unit`: SciPy fixtures for every function in `lab-stats`; identities; edge cases (n = 1, constant x, empty group).
- New `scripts/validation/survey_reference.R`: for 200 exported samples from the Weighting Studio, compare HT/Hájek means, SEs (Taylor, JK1), deff, Rao–Scott χ² and `svyglm` coefficients with R `survey`; tolerance 1e-6 on estimates, 1 % on simulated SEs.
- Known DGP for every synthetic population; seed recorded in the Dataset provenance card.
- Methodological cautions from the brief encoded as lint rules on block text: no "Levene decides", no "proves no difference", no causal verbs in observational contexts without a flag.

## What this plan does not claim
No institutional endorsement, no effect-size expectation, no comparison with other universities. Results belong to the instructor running the pilot; the platform stores nothing centrally.

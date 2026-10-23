# QDA2 V3 — known limitations and items for manual review

Each item says what is missing, why, and what would close it.

## Blocked or not verified in this environment

| Item | Status | Detail |
| --- | --- | --- |
| `survey` package in browser R | PASS in CI, BLOCKED in the sandbox | The sandbox proxy denies `repo.r-wasm.org`. In CI (GitHub Actions run 40013398546 on f813008) the `r.spec.ts` survey test and the acceptance student test (`trust 5.43083 0.18221 2.3872`) passed against numbers from native R 4.3.3 + survey 4.2.1 on the same rows. |
| Vercel preview | NOT RUN | No Vercel access from here. Steps in `deployment-readiness.md`. |
| Firefox / WebKit | BLOCKED | Only Chromium is installed here. |
| Framing e2e test | PASS in CI, FAIL in the sandbox | `network-privacy.spec.ts` "framing by another origin" fails identically on the untouched `main` baseline in this sandbox (Chromium build difference) and passes in CI (GitHub Actions run 40013398546 on f813008). |
| University network | NOT RUN | Whether `repo.r-wasm.org` (survey package) and the 11 MB WebAssembly binary load on the ELTE network is unknown. |

## Product limitations

- **Course Builder has no sign-in.** It is served only in development or where the server sets
  `QDA2_AUTHORING=local`. It edits drafts in the instructor's browser; publishing is a pull request adding a
  JSON file. Shared or institutional authoring needs institutional authentication first.
- **The Survey Statistics course is not reviewed.** Version 1.0.0 is published with review state `not-reviewed`;
  every page shows a notice, and the course is not linked from the site navigation (reachable by URL only). It
  must be reviewed (content, scientific, pedagogical, translation) before it is marked `approved-for-pilot` and
  linked.
- **No lab is pilot-ready.** `lab-status.ts` marks a lab only with evidence that exists: 15 labs are numerically
  validated against an external reference and all 20 passed the axe/keyboard checks, but none has a teaching
  review. Not externally validated: `sampling-universe`, `probability-playground`, `expected-value-lab`,
  `lazarsfeld-simpson-lab` (checked against closed forms and a published table in unit tests) and
  `survey-weighting-studio` (the SE after post-stratification/raking is not checked against R).
- **Lesson content is English.** The interface is EN/HU; course text, concept cards and question items in the
  template are English only, and HU mode says so.
- **Free-text answers are not graded.** Predictions and reflections are saved in the browser only. Multiple-choice
  and ordering items are graded deterministically.
- **Answers and drafts live in one browser.** No sync, no accounts (by design). Clearing site data deletes them;
  `/privacy` and each lesson offer export and delete.
- **Prerequisite advisory not built.** Lessons do not warn about missing prerequisites; the Atlas shows the
  prerequisite edges.
- **Lesson `s14l0` changed from the prototype.** Its lab block is the Survey Weighting Studio (stratified,
  disproportionate, n = 120, design and allocation locked) instead of the Survey Design Studio stages view,
  because the acceptance scenario is about weights.

## Browser R

- **R can reach the worker's JavaScript.** webR exposes JavaScript evaluation to R code (`webr::eval_js`) inside
  its worker. The worker, not a code filter, is the boundary: it has no DOM or cookies, and its network access is
  limited by the same-origin CSP plus `repo.r-wasm.org`. Code typed into `/r` or a lesson runs only in that
  visitor's browser.
- **Worker CSP has `'unsafe-eval'`.** Needed by Emscripten's dynamic linker; scoped to `/webr/*`. Pages do not
  have it.
- **Stopping R loses its state.** The PostMessage channel cannot interrupt R; Stop and the 60 s timeout restart
  the worker.
- **First start downloads the runtime** (11.3 MB WebAssembly plus support files; cached afterwards). Measured
  locally at 1.9 s on localhost; on a classroom network it will be slower and was not measured.

## Items needing a human decision or review

1. Review and approve (or not) the Survey Statistics course content before any pilot use.
2. Teaching review of the labs that would be used in a pilot; only then set `teachingReviewed` / `pilotReady`.
3. Decide whether a hosted Builder is wanted before institutional sign-in exists (recommended: no).
4. Hungarian translation of course content, if the pilot is in Hungarian.
5. Check the preview and the university network as listed in `deployment-readiness.md`.

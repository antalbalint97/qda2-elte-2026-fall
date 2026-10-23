# QDA2 V3 integration — final report

Labels: **PASS** (ran, succeeded) · **FAIL** (ran, failed) · **NOT RUN** · **BLOCKED** (cannot run in this
environment). All results below are from the sandbox (local production build, Chromium) unless stated.

## 1. Commits

- Base: `main` at `6e0d38f`.
- Implementation: branch `claude/project-thread-z05aik`, milestone commits M1 `7b84642` → M7/M8 `59c0d53`, then
  the M9 commit with this report. The PR shows the final head commit.

## 2. Branch and pull request

Branch `claude/project-thread-z05aik`. Pull request: see the PR opened from this branch against `main`
(not merged; merging needs Bálint's approval).

## 3. Components implemented

- Typed statistical engines (`src/lib/engine`) and curriculum model (`src/content/curriculum`).
- Lab framework (LabShell, primitives, hash-encoded configs, Teach mode, locked controls) and all 20 labs.
- `/labs`, `/lab/<id>`, `/atlas`, `/builder` (gated), `/course/[courseId]`, `/course/[courseId]/[unitId]/[lessonId]`,
  `/r`; home page and footer link the labs, the Atlas and R.
- Browser R: webR 0.4.2 self-hosted, CodeMirror 6 editor, console, R code blocks in lessons.
- Course model with `qda2-course/2` export/import validation, immutable `qda2-snapshot/2` versions, published
  registry with SHA-256 lock, deterministic grading, lesson renderer.

Details per milestone: `v3-progress.md`. Structure: `architecture.md`.

## 4. Laboratory completion matrix

All 20 are implemented with real calculations. "Validated" = every statistic shown is checked against an
external reference in `tests/unit`. "A11y" = axe WCAG 2.2 AA (light, dark, Teach) and a keyboard test in
`tests/e2e/labs.spec.ts`. No lab has a teaching review, so none is pilot-ready.

| Lab | Implemented | Validated | A11y | Pilot-ready |
| --- | --- | --- | --- | --- |
| vra-lab | PASS | PASS (SciPy) | PASS | no |
| sampling-universe | PASS | NOT RUN (closed forms only) | PASS | no |
| ttest-lab | PASS | PASS (SciPy) | PASS | no |
| ci-explorer | PASS | PASS (statsmodels, coverage simulation) | PASS | no |
| survey-weighting-studio | PASS | partial: mean, SE, deff vs R survey; post-stratification/raking SE NOT RUN | PASS | no |
| hypothesis-lab | PASS | PASS (SciPy) | PASS | no |
| distribution-studio | PASS | PASS (SciPy) | PASS | no |
| probability-playground | PASS | NOT RUN (closed forms only) | PASS | no |
| expected-value-lab | PASS | NOT RUN (closed forms only) | PASS | no |
| categorical-lab | PASS | PASS (SciPy) | PASS | no |
| corr-reg-lab | PASS | PASS (SciPy, statsmodels) | PASS | no |
| lazarsfeld-simpson-lab | PASS | NOT RUN (published table only) | PASS | no |
| anova-studio | PASS | PASS (statsmodels, SciPy, R) | PASS | no |
| survey-design-studio | PASS | PASS (R survey, sampling) | PASS | no |
| weighting-calibration-lab | PASS | PASS (R survey `calibrate`) | PASS | no |
| complex-survey-lab | PASS | PASS (R survey) | PASS | no |
| measurement-index-lab | PASS | PASS (base R) | PASS | no |
| linalg-pca-studio | PASS | PASS (numpy PAF, factor_analyzer) | PASS | no |
| math-studio | PASS | PASS | PASS | no |
| model-diagnostics-studio | PASS | PASS (statsmodels) | PASS | no |

## 5. Statistical validation

| Check | Result |
| --- | --- |
| Engine fixtures vs SciPy 1.18.1, statsmodels 0.15.0, scikit-learn 1.9.1 (`reference-v3.json`) | PASS |
| Survey fixtures vs R 4.3.3, survey 4.2.1, sampling 2.10 (`survey-reference.json`) | PASS |
| `npm run validate:reference` | PASS (M1) |
| Unit tests in total (`npm run test:unit`) | PASS 338/338 |

Deviations where the prototype was numerically wrong are listed in `v3-progress.md` ("Deviations").

## 6. R runtime

| Check | Result |
| --- | --- |
| Base R from the self-hosted runtime with no external requests | PASS |
| Course datasets bound as data frames | PASS |
| Errors/warnings as text, never HTML | PASS |
| Plots as images with alt text | PASS |
| Stop restarts R; state is gone | PASS |
| CSP on `/r`, `/webr/*`, `/` (worker-only `unsafe-eval`) | PASS |
| axe before/after a run, light and dark | PASS |
| `survey` install and numbers in webR | BLOCKED (sandbox denies `repo.r-wasm.org`; test runs in CI) |
| Blocked install is reported as "could not be installed" | PASS |
| R cold start + first run, localhost | 1.87–1.88 s (measured, 3 runs) |

## 7. Course Builder

| Check | Result |
| --- | --- |
| Draft from template, units/lessons/blocks add, move (keyboard and buttons), duplicate, remove | PASS (e2e acceptance, `course-ops.test.ts`) |
| Inspector: lab parameters from the lab definition, locked controls, instructions, R code, expected output, question picks | PASS (e2e) |
| Export JSON, snapshot versions, frozen snapshots, import validation with reasons | PASS (e2e, `course-model.test.ts`) |
| Status labels Draft / Exported / Published (Published only for an approved version) | PASS (e2e) |
| Student and presentation preview | PASS (e2e) |
| `/builder` is 404 without `QDA2_AUTHORING=local` in production | PASS (`course-ops.test.ts`, route code) |
| axe light and dark (lesson + inspector, library) | PASS |

## 8. Student experience

| Check | Result |
| --- | --- |
| Acceptance: instructor workflow (`acceptance-survey.spec.ts`) | PASS |
| Acceptance: student workflow (prediction kept, locked lab, R run, graded answers with feedback, export and delete answers, next lesson) | PASS (R step with base R) |
| Acceptance: student R step with `survey` | BLOCKED here, runs in CI |
| Lesson without an R block loads nothing from `/webr/` | PASS |
| Unknown course/lesson/version → 404; `?v=` selects a version | PASS |
| Review notice on not-reviewed content | PASS |

## 9. Legacy compatibility

All baseline e2e tests (126 on `main`) are still in the suite and pass, apart from the framing test that fails the
same way on the baseline. Existing modules, the quiz, the Sopranos bonus, `/privacy`, `/about` and the VRA
legacy hash are covered. Unit tests from `main` (115) pass.

## 10. Accessibility

axe WCAG 2.2 AA tags in light and dark: all 20 labs (plus Teach mode), `/r` before and after a run, Atlas (two
states), course overview, lesson, Builder (two states): PASS. Keyboard: labs, Atlas, Builder reordering: PASS.
Screen-reader testing with real assistive technology: NOT RUN.

## 11. Commands executed (final state)

| Command | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test:unit` | PASS 338/338 |
| `npm run build` | PASS |
| `node scripts/check-build.mjs` | PASS |
| `E2E_NO_WEBR_REPO=1 npx playwright test` (Chromium, 244 tests) | FAIL 242 passed, 1 skipped (survey, BLOCKED), 1 failed (framing, sandbox-only, also fails on the baseline) |
| Firefox / WebKit e2e | BLOCKED |

## 12. Deployment preview

NOT RUN: no Vercel access from this environment. Vercel normally builds a preview for the PR; the checks to do
on it are in `deployment-readiness.md`.

## 13. Known blockers

- `survey` in webR not verified here (network). CI runs it.
- Vercel preview not verified.
- Firefox/WebKit not tested.

## 14. Manual review needed

See `known-limitations.md` → "Items needing a human decision or review": course content review, teaching review of
labs, hosted Builder decision, Hungarian content, preview and university-network checks.

## 15. Production release steps

See `deployment-readiness.md` → "Production release steps". In short: review the PR and preview, keep
`QDA2_AUTHORING` unset in Production, merge to `main` with Bálint's approval, re-check on the production domain,
roll back with Vercel "Promote" if needed. Nothing has been merged or deployed.

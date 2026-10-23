# QDA2 V3 — architecture

How the V3 platform (labs, Concept Atlas, Course Builder, published lessons, browser R) sits inside the existing
Next.js application. The existing modules (`/anova`, `/t-tests`, `/variance`, …) are unchanged and share the
layout, theme and header.

## Stack

Next.js 15.5 (App Router), React 19.1, TypeScript, Tailwind 4, KaTeX, CodeMirror 6, webR 0.4.2. Tests: the Node
test runner (`tests/unit`, run with `--experimental-strip-types`) and Playwright with `@axe-core/playwright`
(`tests/e2e`). No server-side state, no database, no accounts, no analytics.

## Layers

```
src/lib/engine/         statistical engines (pure TypeScript, deterministic, seeded RNG)
src/content/curriculum/ typed curriculum: concepts, blocks, labs (LabDefinition), datasets, questions, templates
src/components/lab/     LabShell + primitives, one folder per lab, registry (next/dynamic, ssr:false)
src/lib/course/         course model, snapshots, validation, grading, Builder edit operations, local storage
src/content/published/  immutable published course snapshots (JSON) + LOCK.json (SHA-256)
src/components/lesson/  lesson renderer (published snapshots and Builder preview)
src/components/atlas/   Concept Atlas
src/components/builder/ Course Builder
src/components/r/       CodeMirror editor, R code block, console
src/lib/r/              webR adapter (one runtime per page)
```

### Engines

`src/lib/engine/*` contains every statistic the labs show: distributions (incl. noncentral t and Tukey),
descriptives, t-tests, ANOVA (one-way, Welch, two-way Type I, repeated measures with Greenhouse–Geisser), OLS
with HC3 and diagnostics, logit, PCA/PAF, Cronbach's α, survey estimators (Hájek mean, linearised SE, replicate
weights, Rao–Scott, svyglm), calibration (a port of `survey:::grake`) and PPS. They have no React dependency
and are validated in `tests/unit` against fixtures produced by SciPy, statsmodels and R `survey` (see
`v3-progress.md` M1). Labs never compute statistics in components.

### Labs

Each lab is a client component with a `LabDefinition` (parameters with types, ranges and defaults). `useLab`
holds the state; the state is mirrored to the URL hash (`lab-config.ts`: `sanitizeConfig`, `encodeJsonHash`), so
any configuration is a shareable link. When a lab is embedded in a lesson, the block's config replaces the hash,
and `lockedControls` disables the named controls. `LabHost` loads labs with `next/dynamic` (`ssr: false`), so a
page only downloads the labs it shows. `lab-status.ts` holds evidence-backed maturity flags per lab; no lab is
marked pilot-ready.

### Course model

- A **course** is units → lessons → block instances. An instance references a library block (`ref`) and may carry
  a **variant** (config, locked controls, instructions, notes, body/prompt overrides, R code, question picks).
- `effective(instance)` = library block ⊕ variant. Lab configs are sanitised through the lab's definition;
  rejected keys are kept in `rejectedConfig` so the Builder can show them.
- `buildSnapshot(course)` produces a `qda2-snapshot/2`: units, every used block embedded with its library
  version, concept cards, question items and datasets (≤ 5000 rows), engine versions and lab statuses. The result
  is deep-frozen. `addSnapshotVersion` numbers versions 1.0.0, 1.1.0, …
- `exportCourse` writes `qda2-course/2` (draft + versions). `validate.ts` checks imports (size, schema, slugs,
  duplicates, unknown blocks, markup, allow-listed R packages, prototype keys) and returns reasons.
- `grading.ts` grades multiple-choice and ordering items deterministically. Free text is never graded.

### Publishing

Published courses are files: `src/content/published/<courseId>/<version>.json`, registered in
`src/content/published/index.ts` with a review state (`not-reviewed` | `approved-for-pilot`). `LOCK.json` stores
each file's SHA-256 and `tests/unit/published.test.ts` fails if a published file is edited. A new version is
added by a pull request (export from the Builder or `scripts/course/publish-template.ts`), so publication goes
through code review and CI. The application never writes course content at runtime.

### Routes

| Route | Rendering | Notes |
| --- | --- | --- |
| `/labs`, `/lab/<id>` | static | 20 labs; `/lab/<id>#…` restores a configuration |
| `/atlas` | dynamic (reads the authoring switch) | concept map; "Add to Course Builder" only when authoring is on |
| `/builder` | dynamic | `notFound()` unless `authoringEnabled()` (`NODE_ENV=development` or `QDA2_AUTHORING=local`) |
| `/course/[courseId]` | dynamic | published versions; `?v=` selects one |
| `/course/[courseId]/[unitId]/[lessonId]` | dynamic | lesson renderer over the snapshot; 404 for unknown ids |
| `/r` | static | R console with the course datasets |

### Browser storage

All learner and instructor state is `localStorage` in the visitor's browser, listed and deletable on `/privacy`:
`qda2-student-progress-v1` (lesson answers), `qda2-course-drafts-v1` (Builder drafts), `qda2-atlas-pending`
(Atlas → Builder hand-off), plus the existing theme/progress keys.

### Browser R

- `webr-adapter.ts` starts one webR runtime per page on first Run (never on page load). The runtime files are
  copied from `node_modules/webr/dist` to `public/webr/0.4.2/` by `scripts/copy-webr.mjs` (postinstall,
  predev, prebuild) and served from the site itself.
- Channel: PostMessage, so no COOP/COEP headers are needed. A running computation cannot be interrupted on this
  channel: Stop and the 60 s timeout terminate the worker and the next run starts a fresh R.
- Limits: 20 000 characters of code, 2 000 output lines, 8 plots, datasets ≤ 5 000 rows bound as data frames with
  identifier-checked names. Packages: only `survey`, downloaded from `repo.r-wasm.org` when the code uses it, and
  verified with `requireNamespace`.
- Output is rendered as text nodes and PNG images; nothing from R is inserted as HTML.
- Lessons call `reset()` (clears the global environment) when the learner moves to another lesson.

### Security headers

`src/lib/security-headers.ts` builds the CSP per route (`next.config.ts`):

- Default pages: no `unsafe-eval`, no `wasm-unsafe-eval`.
- `/r` and `/course/*`: `'wasm-unsafe-eval'`, `worker-src 'self' blob:`, `connect-src 'self' https://repo.r-wasm.org`.
- `/webr/*` (the worker scripts): additionally `'unsafe-eval'`, because a same-origin dedicated worker runs under
  its script's response CSP and Emscripten's dynamic linker evaluates generated code. The page itself never has
  `unsafe-eval`. Long-lived immutable caching (the path is versioned).
- Framing follows the existing `EMBED_ALLOWED_ORIGINS` setting (`frame-ancestors 'none'` unless origins are listed).

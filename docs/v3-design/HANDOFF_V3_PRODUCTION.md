# HANDOFF_V3_PRODUCTION.md — QDA2 Development V3 → Next.js integration

Authoritative handoff for the Claude Code agent integrating this project into `antalbalint97/qda2-elte-2026-fall` (Next 15 / React 19 / Tailwind 4 / TypeScript). Supersedes `HANDOFF.md` Parts I–III where they differ; the lab-level contracts in `HANDOFF.md` §1–11 and `docs/labs/*.md` remain valid. **Do not deploy from this document; integrate, test, then release per §12.**

Product name: **QDA2 — Interactive Statistics & Mathematics Lab**. No institutional endorsement is implied anywhere in the UI.

---

## 1. Final artifact inventory (V3 created or modified)

**Engines (plain JS, UI-free, → `src/lib/engine/*.ts`)**
- `qda2-engine.js` *(new)* — `QDA2Engine`: distributions (χ², F pdf/cdf/quantile, t quantile, binomial, Poisson, uniform, `family()` facade), noncentral-t power, studentised range (`ptukey/qtukey`, numerical), descriptives (type-7 quantiles, skewness g₁/G₁, kurtosis, five-number, histogram FD, z, ranks), categorical (`chiSquare` incl. Yates/stdRes/sparse, `oddsRatio`, `fisherExact`, `partials`), correlation/regression (`pearson`, `spearman`, `ols` with HC3/leverage/Cook/VIF, `logit` IRLS), ANOVA (`welchAnova`, `omegaSquared`, `pairwise` LSD/Bonferroni/Tukey/Games–Howell, `twoWay`), `cronbach`, linear algebra (`eigenSym`, `pca`, `kmeans`, projections), probability (`bayes`, `discreteRV`, `sampleDiscrete`, `diceSum`), calculus helpers, complex-survey inference (`svyTotalVar`, `svyMean`, `svyDomainMean`, `replicateWeights`, `replicateVar`, `raoScott`, `svyGlm`, `calibrateLinear`, `rakeBounded`, `neyman`, `proportional`, `stratMeanVar`, `ppsInclusion`), `selfTest()` (26 reference checks).
- `qda2-stats.js` (unchanged core, validated), `sampling-stats.js` (unchanged), `survey-stats.js` (validation note + `validation.checked` updated).
- `lab-shell.js` *(new)* — shared lab chrome: hash config read/write, `chrome()` (Teach/Share/lang/locks/instructions), `txt()` SVG text helper, `curvePath/areaPath`, colour tokens, EN/HU common strings.
- `webr-adapter.js` *(new)* — `QDA2WebR`: lazy webR 0.4.2 loader, `run()` with captured streams/conditions/graphics, timeouts, `stop()` (interrupt or worker restart), `reset()`, `installPackages()` (webR repo only), `bindDataset()`, `acceptance()` (7 executed tests).
- `course-model.js` *(new)* — `QDA2Course`: `LABFILE` (20 labs), `TYPES` (11 block types incl. `r`), `labHref`, `rHref`, `effective`, `buildSnapshot` (embedded bodies + datasets), `validateCourse` (schema /1 and /2), `versionOf`, `sanitize`.

**Data (→ `src/content/…`)**
- `data/datasets.js` *(new)* — 4 datasets with provenance, `QDA2_DATASET_CSV`, `QDA2_DATASET_R`.
- `data/question-bank.js` *(new)* — options/correct/why/explanation for 38 questions (ids preserved from `src/content/questions.tsx@main`; 1 order item).
- `data/blocks.js` — +4 R Code Blocks (`rc.*`), review derivation for type `r`.
- `data/courses.js` — Survey course: lesson `s14l0` "Sampling, Weights and Statistical Inference" (acceptance scenario, 7 blocks).
- `data/labs.js` — all 20 labs `status:"built"` + `file`.
- `scripts/validation/survey_fixtures.js`, `scripts/validation/survey_reference.R` *(new)*.

**Design Components (prototypes → React components, see §3)**
- 15 new labs: `QDA2 Hypothesis Lab`, `Distribution Studio`, `Categorical Lab`, `CorrReg Lab`, `Lazarsfeld Lab`, `ANOVA Studio`, `Probability Playground`, `Expected Value Lab`, `Survey Design Studio`, `Weighting Calibration Lab`, `Complex Survey Lab`, `Measurement Index Lab`, `PCA Studio`, `Math Studio`, `Model Diagnostics Studio` (all `.dc.html`).
- `QDA2 R Block.dc.html` *(new)*, `QDA2 Tests.dc.html` *(new)*.
- Modified: `QDA2 Course Builder.dc.html` (V3), `QDA2 Lesson.dc.html` (V3), `QDA2 Labs.dc.html`, `QDA2 Survey Weighting Studio.dc.html` (validation badge).

**Docs**: `docs/16-glossary.md`, `docs/17-validation-results.md` *(new)*; this file.

---

## 2. Feature matrix (maturity dimensions kept separate)

Legend: ✓ done · ◐ partial · ✗ not done. "Tested" = automated check exists in `QDA2 Tests.dc.html` or engine self-test. "Validated" = numerical parity with an external reference (SciPy/R) established. "Pilot-ready" requires all previous columns plus an instructor walkthrough — **no lab is pilot-ready yet**.

| Lab | Implemented | Tested | Validated | Accessible* | Builder | Lesson | Pilot |
|---|---|---|---|---|---|---|---|
| vra-lab | ✓ | ✓ | ✓ SciPy | ✓ | ✓ | ✓ | ✗ |
| sampling-universe | ✓ | ✓ property | ◐ | ✓ | ✓ | ✓ | ✗ |
| ttest-lab | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| ci-explorer | ✓ | ◐ | ◐ coverage sim pending | ✓ | ✓ | ✓ | ✗ |
| survey-weighting-studio | ✓ | ✓ F1–F8 | ✓ R survey (webR) | ✓ | ✓ | ✓ | ✗ |
| hypothesis-lab | ✓ | ✓ | ✓ pwr (nct) | ✓ | ✓ | ✓ | ✗ |
| distribution-studio | ✓ | ✓ | ✓ closed forms; per-family 20-pt SciPy sweep pending | ✓ | ✓ | ✓ | ✗ |
| categorical-lab | ✓ | ✓ | ✓ SciPy/R | ✓ | ✓ | ✓ | ✗ |
| lazarsfeld-simpson-lab | ✓ | ✓ identity | ✓ (arithmetic) | ✓ | ✓ | ✓ | ✗ |
| corr-reg-lab | ✓ | ✓ | ✓ r, OLS; logit vs statsmodels pending | ✓ | ✓ | ✓ | ✗ |
| anova-studio | ✓ | ✓ | ◐ F ✓; Tukey/G–H numerical (≈1e-3) pending statsmodels | ✓ | ✓ | ✓ | ✗ |
| probability-playground | ✓ | ✓ | ✓ exact | ✓ | ✓ | ✓ | ✗ |
| expected-value-lab | ✓ | ✓ | ✓ exact | ✓ | ✓ | ✓ | ✗ |
| survey-design-studio | ✓ | ✓ F9, F10 | ◐ PPS vs `sampling` pending | ✓ | ✓ | ✓ | ✗ |
| weighting-calibration-lab | ✓ | ✓ F7 | ◐ raking/GREG weight vectors vs R pending | ✓ | ✓ | ✓ | ✗ |
| complex-survey-lab | ✓ | ✓ F1–F8 | ✓ Taylor/JKn/domain vs R; Rao–Scott first-order only | ✓ | ✓ | ✓ | ✗ |
| measurement-index-lab | ✓ | ✓ | ✓ α formula; vs `psych::alpha` pending | ✓ | ✓ | ✓ | ✗ |
| linalg-pca-studio | ✓ | ✓ | ◐ eigen ✓; PCA vs sklearn pending | ✓ | ✓ | ✓ | ✗ |
| math-studio | ✓ | ✓ | ✓ (bowl min = OLS, identities) | ✓ | ✓ | ✓ | ✗ |
| model-diagnostics-studio | ✓ | ✓ | ◐ vs statsmodels pending | ✓ | ✓ | ✓ | ✗ |

\*Accessible = keyboard alternatives for every drag, `role=slider` handles, live region, readouts as tables, reduced-motion; **axe run not performed**.

Scoped-out advanced capabilities (documented, not faked): repeated-measures ANOVA; survey regression with replicate weights; Rao–Scott second-order F; PPS-WOR design variance (joint π); factor analysis (PCA only); LOWESS (running mean used); logistic in Model Diagnostics.

**R Code Block**: implemented ✓ · acceptance tests 7/7 executed ✓ · dataset injection ✓ · package install (`survey`, `ggplot2` presets) ✓ · interrupt ◐ (only with COOP/COEP) · CodeMirror ✗ (textarea with gutter in prototype; CodeMirror 6 in repo, §4).

**Course Builder V3**: embedded immutable snapshots ✓ · version picker ✓ · export/import `qda2-course/2` with validation ✓ · full param types (JSON editor for array/object/range) ✓ · R block authoring ✓ · assessment options preview ✓ · local-only publication, labelled ✓.

**Lesson V3**: renderers for concept, math, dataset (+CSV), prediction, lab, experiment, R, assessment (choice + order, deterministic grading, feedback), reflection, connection, software ✓ · snapshot-first resolution (`?v=`) ✓ · reset-to-preset for labs and R ✓ · local progress + export/delete ✓.

---

## 3. Repository mapping

```
src/lib/engine/
  distributions.ts         ← qda2-engine.js: chi2*, fPdf/fCdf/fQuantile, tQuantile, binom*, pois*, unif*, family, nctSf, tPower, fwer, ptukey, qtukey
  descriptives.ts          ← quantile, median, skewness, kurtosis, fiveNumber, histogram, zscores, ranks (+ QdaStats.describe)
  inference.ts             ← QdaStats t-tests, chiSquare, fisherExact, oddsRatio, pearson, spearman, partials
  regression.ts            ← QdaStats.fit, ols, logit, welchAnova, omegaSquared, pairwise, twoWay, QdaStats.anova
  measurement.ts           ← cronbach, attenuation
  linalg.ts                ← inverse, matmul, transpose, eigenSym, covMatrix, pca, kmeans, dot/norm/project/applyMatrix
  probability.ts           ← bayes, discreteRV, sampleDiscrete, diceSum
  calculus.ts              ← derivative, integral, riemann, gradient, gradientDescent, log-likelihoods
  sampling.ts              ← sampling-stats.js
  survey-design.ts         ← survey-stats.js makePopulation/select/respond + neyman/proportional/stratMeanVar/ppsInclusion
  survey-estimators.ts     ← survey-stats.js estimates/postStratify/rake + svyTotalVar/svyMean/svyDomainMean/replicate*/raoScott/svyGlm/calibrateLinear/rakeBounded
  rng.ts                   ← ONE mulberry32 + gaussian (remove duplicates in sampling-stats/datasets)
  format.ts                ← fmt, fmtP (presentation only; never inside estimators)
src/components/lab/shell/  ← lab-shell.js: LabChrome.tsx, useLabConfig.ts (hash contract), SvgText.tsx, paths.ts, tokens.ts
src/components/lab/<id>/   ← one folder per lab DC (see §5 order); primitives shared via src/components/lab/primitives/
src/components/blocks/RCodeBlock.tsx + src/lib/r/webr-adapter.ts + public/webr/ (self-hosted assets, §8)
src/lib/course/model.ts, publish.ts, validate.ts    ← course-model.js
src/content/datasets.ts    ← data/datasets.js (keep generators seeded; export CSV at build)
src/content/question-bank.ts ← data/question-bank.js (or re-export from questions.tsx with graph ids)
src/app/builder/page.tsx, src/app/course/[courseId]/page.tsx, src/app/course/[courseId]/[unitId]/[lessonId]/page.tsx
src/app/lab/[labId]/page.tsx  (dynamic import of the lab component by LABFILE id)
src/app/r/page.tsx            (standalone R block, used by iframes and Teach mode)
src/app/tests/page.tsx        ← QDA2 Tests.dc.html (dev-only route)
tests/unit/*.test.ts          ← engine selfTests + scripts/validation fixtures (Vitest)
scripts/validation/survey_reference.R, reference.py
```

Routes to add: `/`, `/topics`, `/atlas`, `/labs`, `/lab/[labId]`, `/r`, `/builder`, `/course/[courseId]`, `/course/[courseId]/[unitId]/[lessonId]`, `/tests` (dev). Keep `/variance`, `/anova`, `/t-tests`, `/correlation`, `/crosstabs`, `/lazarsfeld`, `/p-values`, `/indices` unchanged; add `next.config` redirects `/lab/sampling → /lab/sampling-universe`, `/lab/ttest → /lab/ttest-lab`, `/lab/ci → /lab/ci-explorer`, `/lab/survey-weighting → /lab/survey-weighting-studio`.

---

## 4. Dependencies

| Package | Status | Notes |
|---|---|---|
| next 15, react 19, tailwind 4, katex | installed | unchanged |
| `webr` ^0.4.2 | **new, required** | pin exactly; `import { WebR } from 'webr'`; ship assets from `public/webr/` or keep CDN `https://webr.r-wasm.org/v0.4.2/` (CSP `script-src`, `connect-src`, `worker-src blob:`) |
| `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-r` (or `codemirror-lang-r`), `@codemirror/commands` | **new, required** | replaces the prototype textarea; load lazily with the block |
| `zod` | new, recommended | course JSON schema (`validateCourse` → zod schema) |
| `vitest` | dev, new | engine tests |
| `axe-core` / `@axe-core/playwright` | dev, new | accessibility checks |
| framer-motion, d3 | not needed | all motion is CSS transitions on SVG geometry |
| R packages in webR repo: `survey` ✓ (verified), `ggplot2` (preset; verify size/first-load) | runtime | `sampling` not available in webR repo → PPS fixture F10 runs only in CI R |

Not compatible / do not add: server-side R (Railway) for the pilot; `jstat`/`simple-statistics` (duplicate algorithms); any CRAN mirror other than the webR repository.

---

## 5. Migration order (dependency-aware)

1. `src/lib/engine/*` from the four JS engines + `rng.ts` unification; port `selfTest` + fixtures to Vitest. Gate: all 38 checks in `QDA2 Tests` green in Vitest.
2. `lab/shell` (hash contract, chrome, SvgText) and `primitives/` extraction (DraggableObservation, DistributionCurve/ProbabilityRegion, IntervalBand, PopulationField, Mosaic, ForestPlot, ResidualPlot, VectorProjection…).
3. Port the 5 V2 labs (already on the contract), then wave 2–4 labs in this order: hypothesis, distribution, categorical, corr-reg, lazarsfeld, anova, probability, expected-value, survey-design, weighting-calibration, complex-survey, measurement-index, pca, math, model-diagnostics. Each lab: one route + one component folder + `LabDefinition.params` unchanged.
4. `webr-adapter.ts` + `RCodeBlock.tsx` (+ `/r` route). Gate: §4 acceptance tests pass in Chromium and Firefox; COOP/COEP decision (§8).
5. `course/model.ts` + Builder + Lesson (snapshot-first). Gate: publish → export → import round trip; immutability test (mutating draft after publish leaves `versions[].snapshot` byte-identical).
6. Static course publication (§9), `/tests` route, redirects, docs.

---

## 6. Data contracts (TypeScript)

```ts
// Lab configuration (URL hash = encodeURIComponent(JSON.stringify(LabConfiguration)); VRA keeps its legacy query hash)
type LabConfiguration = { l?: "en"|"hu"; present?: boolean; controls?: { locked: string[] }; instructions?: string } & Record<string, unknown /* lab params per LabDefinition.params */>;
type LabParam = { key: string; type: "enum"|"boolean"|"int"|"float"|"string"|"array"|"object"|"range"; options?: (string|number)[] };

// Blocks
type BlockType = "concept"|"lab"|"math"|"dataset"|"prediction"|"experiment"|"r"|"assessment"|"software"|"reflection"|"connection";
type RBlockConfig = { code: string; dataset?: string /* dataset id */; packages?: string[]; editable?: boolean; expected?: string };
type BlockInstance = { ref: string; iid: string; variant?: { title?: {en:string;hu:string}; prompt?: string; notes?: string; config?: Record<string,unknown>; locked?: string[]; instructions?: string }; pin?: string };

// Course + publication
type Course = { id: string; version: string; state: "draft"|"published"; title: {en:string;hu:string}; units: Unit[]; localBlocks?: Block[]; versions: PublishedVersion[] };
type PublishedVersion = { version: string; publishedAt: string; immutable: true; blockCount: number; missing: string[]; snapshot: Snapshot };
type Snapshot = { schema: "qda2-snapshot/2"; title; description; outcomes; units: Unit[]; blocks: Record<iid, EmbeddedBlock>; datasets: Record<id, DatasetRef>; labFiles: Record<labId,string>; engine: Record<string,string>; labStatus: Record<labId,string>; missing: string[] };
type EmbeddedBlock = Block & { libraryId: string; libraryVersion: string; config: Record<string,unknown>; lockedControls: string[]; instructions: string; iid: string; ref: string };
type DatasetRef = { id; title; provenance: { kind: "synthetic"|"authentic"|"public"; n: number; generator: string; seed?: number; license: string; limits: string }; columns: {name;type:"number"|"string"|"factor";label;levels?}[]; rows?: unknown[][]; rowCount?: number; embedded: boolean; design?: { strata; psu; weight; fpc } };
type CourseExport = { schema: "qda2-course/2"; exportedAt: string; publishMode: "local-browser-snapshot"|"static-build"; course: Course; libraryPins: Record<string,string>; latestSnapshot: string|null };

// Questions (ids from questions.tsx)
type Question = { id; concepts: string[]; format; prompt; context?: string; kind: "choice"|"order"; options?: {id;label;why?;correct:boolean}[]; items?; initial?; explanation; grading: "deterministic-choice"|"deterministic-order"|"pending"; provenance: string };
```

Rules: variants never mutate library blocks; config never reaches estimator formulas (locks/instructions are UI); `fromSnapshot` blocks are read-only; R starter code is a string, never evaluated by JS.

---

## 7. Statistical validation

See `docs/17-validation-results.md`. Executed: 38 browser checks (core 4, unified 26 folded into 1, sampling 1, survey fixtures 22 — all pass) and R `survey` 4.x via webR reproducing F1–F8 exactly. Pending (CI): `reference.py` extensions (ptukey, Cook/HC3/VIF, logit, PCA, nct grid), `survey_reference.R` in Rscript, coverage simulations, raking/GREG weight-vector parity, deff convention alignment with `svymean(deff=TRUE)`. Every pending item is labelled in the UI ("parity pending", method strings on readouts).

---

## 8. webR integration guide

- **Load**: dynamic `import('webr')` only when a lesson contains an R block and the student presses Run (or on hover prefetch). One runtime per page (`QDA2WebR` singleton); lessons with several R blocks share it; **state leak between blocks is prevented by `reset()` on lesson navigation** (add in the Lesson route: `useEffect(() => () => QDA2WebR.reset(), [lessonId])`).
- **Channel**: with `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` on the `/course/*` and `/r` routes only (Next `headers()` with route matchers), webR uses SharedArrayBuffer → `interrupt()` works. Without them (default), PostMessage channel → Stop = `close()` + re-init (implemented). **Test** that COEP does not break: Google Fonts (self-hosted via `next/font` — fine), KaTeX (local), lab iframes (same origin — fine), any third-party embeds (none expected). If anything breaks, keep PostMessage and document "no interrupt".
- **Assets**: self-host `node_modules/webr/dist/*` under `public/webr/` and pass `baseUrl`; CSP: `script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self' https://repo.r-wasm.org` (package repo). Pin webR 0.4.2; verify `survey` and `ggplot2` binaries load before changing version.
- **Plots**: `captureGraphics` → `ImageBitmap[]` → `<canvas>`/PNG data URL (implemented). Width 640×440; Teach mode may request 1280×880.
- **Limits** (`QDA2WebR.LIMITS`): code 20 000 chars, 2 000 output lines, 8 plots, 60 s timeout → automatic restart, datasets ≤ 5 000 rows. No `install.packages` from arbitrary URLs; `installPackages()` only takes identifier-safe names and uses the webR repository.
- **Security**: never pass tokens/app state into R; console output rendered as text nodes; plot images are bitmaps; no R→JS code paths (structured data only, future `webR.objs` reads must be validated with zod before charting).
- **Browser notes**: Chromium ✓ (verified here), Firefox — verify SAB fallback; Safari ≥ 16.4 — verify `ImageBitmap` from OffscreenCanvas; university networks — the ~20 MB runtime download must be cached (service worker or long `Cache-Control` on `public/webr/*`).

---

## 9. Course publishing contract

**Pilot (static)**: instructor exports `qda2-course/2` JSON from the Builder → PR adds it to `src/content/published/<courseId>/<version>.json` → `validateCourse` runs in CI (`tests/unit/publish.test.ts`) → build registers it in `src/content/published/index.ts` → `/course/[courseId]` resolves `latest` (or `?v=`) from the registry → Lesson renders **only** `versions[].snapshot` (embedded blocks, datasets, lab configs, R starter code). Previous versions remain reachable by `?v=`. A new reviewed deployment = a new version file; old files are never edited. localStorage drafts are browser-local and are labelled so ("Published locally (no server)").

**Future (authenticated)**: instructor backend with persistent storage behind institutional SSO; same `Snapshot` schema; publishing = inserting an immutable version row; the student renderer stays read-only. Not required for the pilot.

---

## 10. Security checklist

- CSP as in §8; no inline scripts in production (prototype uses them); no `dangerouslySetInnerHTML` anywhere (all text is text nodes; `sanitize()` strips tags defensively in exports).
- Course import: `validateCourse` (schema, id slugs, iid uniqueness, variant shapes, R `code` must be string, rejects `<script`/`javascript:` in block content). Turn into a zod schema; cap file size (2 MB).
- R runtime isolation: webR worker; no credentials; dataset allow-list = `QDA2_DATASETS` + instructor inline tables ≤ 5 000 rows; no uploads of student microdata.
- Privacy: no analytics; localStorage keys `qda2-course-drafts-v1`, `qda2-student-progress-v1` (prediction/reflection answers, quiz picks), `qda2-atlas-pending` — register all in `STORAGE_KEYS`; export/delete UI exists in Lesson "Privacy & data".
- Student edits (R code, lab state, quiz) never write into course content; Reset restores snapshot presets.
- No external packages beyond the webR repository; no server-side code execution.

---

## 11. Compatibility & regression checklist

- Existing module routes and their quizzes (`questions.tsx`) unchanged; `question-bank.ts` must keep ids identical (test: every id in `QDA2_QUESTIONS` exists in `questions.tsx`).
- `/variance`, `/anova` still link to `/lab#s=1`, `/lab#s=3` (VRA legacy hash).
- 169 concept ids, 20 lab ids, 122 block ids, 2 course templates unchanged (test in `/tests`).
- `themeInitScript` / `?present=1` compatibility for Teach mode.
- Tailwind tokens: add `--model/--data/--residual/--explained/--attention` without touching `--x/--y/--z`.

---

## 12. Deployment checklist

1. Preview build: `next build` green; `/tests` all green; Lighthouse a11y ≥ 95 on three labs + lesson.
2. Staging: COOP/COEP decision verified on university Chromium + Firefox; webR first load ≤ 30 s on campus network; `survey` install works offline-cached.
3. Pilot acceptance: instructor completes §17 instructor scenario (create lesson, add lab, dataset, R block, preview, export snapshot, open Teach mode) and student scenario (open URL, predict, lab, R run, quiz, next lesson) without accounts.
4. Release gates: numerical parity items in §7 either validated or visibly labelled; no lab marked pilot-ready without instructor walkthrough; `docs/17` updated with CI results.

---

## 13. Known limitations (severity · mitigation)

- Tukey/Games–Howell p-values by numerical integration (≈1e-3) — **medium** · cross-check with statsmodels, or load a `qtukey` table; UI labels it.
- Rao–Scott first-order only — **medium** · label present; implement second-order F before using for grading.
- Raking/GREG weight vectors not diffed against R — **medium** · margins/totals verified; add `survey_reference.R` cases with `weights(rake(...))`.
- Interrupt unavailable without COOP/COEP — **low** · worker restart implemented; document in UI (done).
- Prototype editor is a textarea — **low** · CodeMirror 6 in repo.
- HU: concept definitions, block bodies and question bank English-only — **medium** · translation sprint; status flags exist.
- Question bank: 38 items transcribed; new `i-*` index items beyond the two shown in `questions.tsx` not yet indexed — **low** · extend `question-bank.ts` from the repo file.
- Prediction/reflection are not graded (by design); no free-text auto-grading claimed.
- `Σ_frame π` in Survey Design Studio is exact for SRS/strat/cluster/two-stage and approximate under PPS with certainty units — **low**.
- Accessibility verified by construction, not by axe — **medium** · run axe in CI.
- Select elements in DC prototypes sometimes display the first option rather than the bound value (runtime quirk) — **prototype-only**; React `value` binding in the repo is unaffected.

---

## 14. Claude Code execution instructions

1. Read this file, `docs/17-validation-results.md`, `docs/labs/<id>.md` for each lab, and the lab DC you are porting (template = JSX structure, logic class = component state; `renderVals()` keys map 1:1 to props of the JSX).
2. Create `src/lib/engine/*` per §3 by moving functions verbatim (they are UI-free); add types from §6; port `selfTest` + `scripts/validation/survey_fixtures.js` into Vitest; run `Rscript scripts/validation/survey_reference.R` and commit the JSON next to the fixtures.
3. Implement `lab/shell` + `primitives`; port labs in §5 order, one PR each, preserving the hash contract and `LabDefinition.params`. Teach mode = `present` flag (zoom 1.15, aside hidden).
4. Implement `webr-adapter.ts` + `RCodeBlock.tsx` with CodeMirror; decide COOP/COEP per §8 and document the outcome in `docs/17`.
5. Port `course-model.js`; Builder and Lesson read `Snapshot` first; add static publication registry (§9) and the `/tests` route.
6. Add redirects (§3), register storage keys, CSP headers (§8), and run the §11/§12 checklists. Do not rename the product, do not add accounts, do not add server-side R.

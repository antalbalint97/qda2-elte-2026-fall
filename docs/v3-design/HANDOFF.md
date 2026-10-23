# QDA2 — implementation handoff

> **Development V3 (2026-10-23): final product completion.** The authoritative handoff is now **`HANDOFF_V3_PRODUCTION.md`** (artifact inventory, feature matrix, repo mapping, dependencies, migration order, data contracts, validation, webR guide, publishing contract, security, deployment, limitations, execution steps). V3 adds: `qda2-engine.js`, `lab-shell.js`, `webr-adapter.js`, `course-model.js`, 15 lab DCs (all 20 labs built), `QDA2 R Block.dc.html` (real in-browser R via webR, acceptance tests executed), Course Builder V3, Lesson V3, `data/datasets.js`, `data/question-bank.js`, survey validation vs R `survey` (docs/17), glossary (docs/16). Parts I–III below remain valid where not superseded.

> **Development V2 (2026-10-23, later the same day): laboratory ecosystem.** New: `survey-stats.js` (design-based engine, unvalidated vs R — badge shown), `QDA2 Survey Weighting Studio.dc.html` (10 stages), `QDA2 tTest Lab.dc.html`, `QDA2 CI Explorer.dc.html`, `QDA2 Lesson.dc.html` (student renderer), `QDA2 Labs.dc.html` (portfolio), Course Builder V2 (review dimensions, locked controls, instructions, Teach link, question bank, save state, drawer), `data/questions.js`, `data/lab-specs-*.js` → `docs/labs/*.md` (18 contracts), docs 08–15. See Part III. Correction: the v1 sentence "16 of 20 labs are specified only" was wrong — see `docs/08-v2-audit.md` §1 for the reconciled inventory (5 working prototypes · 6 partial · 9 designed).

> **Iteration 2 (2026-10-23): platform architecture.** New in this project: `docs/01–07` (audit, concept graph, lab registry, content model, two course templates, evaluation plan), `data/*.js` (single-source curriculum data: 169 concepts, 20 labs, 118 blocks, 2 courses), `QDA2 Course Builder.dc.html` (functional authoring prototype: outline, lesson editor with drag-and-drop, block library with search/filters, variant inspector with lab configuration, prerequisite advisory, student/present preview, local drafts, publish-with-pins, JSON export/import), `QDA2 Concept Atlas.dc.html` (conceptual/pedagogical toggle, edges, add-to-builder), `QDA2 Sampling Universe.dc.html` + `sampling-stats.js` (Phase 4 lab). §12 below maps them to the repo. The original lab handoff (§1–11) is unchanged.

# Part I · QDA2 Lab — Variance → Regression → ANOVA

Working product name: **QDA2 Lab** (the repository's existing product name; the brief's "METIS" name was dropped — the tool is an ELTE course companion, final name TBD). Change it in `src/content/site.ts` → `SITE.product` and the header only.

Prototype files (this project): `QDA2 Lab.dc.html` (flagship lab, incl. Teach mode), `QDA2 Landing.dc.html`, `QDA2 Topics.dc.html`, `QDA2 Design System.dc.html`, `qda2-stats.js` (pure stats core). All interactions in the prototype are real and compute from data; nothing is simulated.

## 1. Where it lands in the repo (antalbalint97/qda2-elte-2026-fall)

```
src/app/lab/page.tsx                      new route: the flagship lab (replaces nothing; /variance and /anova stay)
src/app/topics/page.tsx                   curriculum map (links existing modules + lab stages)
src/app/page.tsx                          landing: dark hero with LiveLeastSquares; keep existing module list below
src/components/lab/
  LabShell.tsx                            top bar, stage tabs, mode switch, grid layout, present strip
  LabCanvas.tsx                           the SVG; composes primitives below
  primitives/DraggableObservation.tsx
  primitives/ReferenceLine.tsx
  primitives/DeviationSegment.tsx
  primitives/SquaredDeviation.tsx
  primitives/BetweenGroupBar.tsx
  primitives/FormulaInspector.tsx         term spans ↔ highlight key
  primitives/StatisticReadout.tsx
  primitives/ParameterControl.tsx         slider + number input + reset
  primitives/ConceptPrompt.tsx            Predict → Experiment → Explain → Transfer card
  primitives/DecompositionBar.tsx
  LabMeasurements.tsx, LabMath.tsx, LabGuide.tsx, PresentStrip.tsx
  presets.ts                              ExperimentPreset[] (scenarios + Teach demos)
  i18n.ts                                 en/hu dictionaries (structure in the prototype's T(), GUIDES(), DEMOS())
src/lib/lab-stats.ts                      describe(), fit(), anova(), sseLine() — add to existing src/lib/stats.ts or import from it
src/lib/lab-state.ts                      reducer + URL hash (de)serialisation
tests/unit/lab-stats.test.ts              SciPy reference values (see §4)
```

Stack: existing Next 15 / React 19 / Tailwind 4 / KaTeX. No new runtime dependency is required. Optional: `framer-motion` is NOT needed — all motion is CSS transitions on SVG geometry (see §6).

## 2. State model (single source of truth)

```ts
type Observation = { id: string; x: number; y: number; g: 0|1|2 };   // id "A".."O", stable across stages
type Stage = 1|2|3;
type LabState = {
  lang: "en"|"hu";
  stage: Stage;
  layer: 1|2|3|4|5;                 // stage 1: observations, mean, deviations, squares, sum
  pred: "mean"|"custom"|"ols";      // stage 2
  custom: { a: number; b: number }; // user line y = a + b x
  av: "total"|"within"|"between"|"both"; // stage 3
  showSq: boolean;                  // squares on/off (stage 2, 3)
  popVar: boolean;                  // population (n) vs sample (n−1) variance in stage 1
  scenario: "base"|"flat"|"noisy"|"steep";
  pts: Observation[];
  sel: string|null;                 // selected observation id
  hl: HighlightKey|null;            // inspected formula term
  mode: "explore"|"learn";  present: boolean;  demo: number;  gStep: 0|1|2|3;
  sep: number; spread: number; anchor: Observation[]|null;  // ANOVA scenario sliders, see §3.4
  compare: boolean;                 // show regression decomposition next to ANOVA
};
```

Rules
- Any edit of `pts` (drag, keyboard, number input, group change) is the truth for all three stages. Y edits propagate everywhere; X edits only affect stage 2; group edits only stage 3.
- Clamp: y ∈ [0,100] integer; x ∈ [0,14] step 0.5; g ∈ {0,1,2}.
- Share: serialise `s, l, p, ly, y[], x[], g[]` to the URL hash (`#s=2&l=en&p=ols&ly=2&y=…&x=…&g=…`); parse on mount. Keep `?present=1` compatibility with the existing site's `themeInitScript`.
- Local-first: persist `LabState` minus `hl`/`sel` in `localStorage` under `qda2-lab-state-v1` and list the key in `STORAGE_KEYS` (privacy page shows/deletes it). No analytics.

Dataset (synthetic, label it): weekly news hours X, political knowledge Y (0–100), education group g (Primary/Secondary/Tertiary), n = 15, 5 per group.
```
x: 1,2,3,4,6, 3,5,6,8,9, 5,7,9,11,13
g: 0,0,0,0,0, 1,1,1,1,1, 2,2,2,2,2
base  y: 28,35,31,44,49, 46,52,58,55,66, 60,71,68,82,88
flat  y: 50,44,58,47,55, 52,49,60,45,57, 48,56,51,59,46
noisy y: 20,33,26,49,58, 39,49,60,55,74, 49,69,63,89,99
steep y: 25,31,34,41,49, 36,46,50,61,64, 44,56,66,74,86
```

## 3. Mathematical calculation contracts (`qda2-stats.js` → `lab-stats.ts`)

Undefined → `null`, never NaN/Infinity. UI prints "—" plus a note.

3.1 `describe(ys, population)` → `{ n, mean, devs[], sq[], ss, variance, sd, df }`. `df = population ? n : n−1`; `variance = df>0 ? ss/df : null`.

3.2 `fit(xs, ys)` → `{ slope, intercept, r, r2, sst, sse, ssr, fitted[], residuals[], reason }`. `sxx === 0` → slope/intercept/r/r2/sse/ssr null, `reason:"noXVariation"`; `syy === 0` → r null, r2 null. Identity `sst = ssr + sse` holds (test it to 1e-9) **only** for this OLS fit.

3.3 `sseLine(xs, ys, a, b)` → Σ(yᵢ − a − b·xᵢ)². Used for "mean" (a=ȳ, b=0) and "custom". For a custom line the UI shows SSE vs SST only — never SSR, never a decomposition bar.

3.4 `anova(groups: number[][])` → `{ N, k, grand, means[], ns[], ssw, ssb, sst, dfB, dfW, msb, msw, F, p, eta2, tooSmall, zeroWithin }`. `k` counts non-empty groups; `msw === 0` → F,p null (`zeroWithin`); any group with < 2 obs → `tooSmall` (show note; F still computed if dfW>0). `p = fP(F, dfB, dfW)` via regularised incomplete beta (same implementation as `src/lib/stats.ts` → `fP`).
ANOVA scenario sliders rewrite data from an `anchor` snapshot: `y' = ȳⱼ(anchor) + (y − ȳⱼ(anchor))·spread + shift[g]`, shift = [−sep, 0, +sep], clamped to [0,100]; any direct point edit commits (`anchor = null, sep = 0, spread = 1`).

3.5 Formatting: `fmt(x, 2)` with thousands separator; p APA-style: `< .001`, otherwise `.xxx` without leading zero; r, R², η² to 3 decimals.

## 4. Tests (extend `tests/unit`)
- `fP(3,2,12) ≈ 0.0877915`, `fP(10,2,12) ≈ 0.0027809` (scipy.stats.f.sf; closed form (1+d1·f/d2)^(−d2/2) for d1=2).
- base dataset: SST = 4345.733…, OLS slope ≈ 4.87, r ≈ 0.939; ANOVA SSB ≈ 3312.53, SSW ≈ 1033.20, F ≈ 19.24 (regenerate exact reference with `scripts/validation/reference.py`).
- Identities: Σdev = 0; SST = SSR + SSE (OLS); SST = SSB + SSW; sample vs population variance ratio = (n−1)/n.
- Edge cases: constant X, constant Y, a group emptied via drag, n=1 group.

## 5. Geometry (SVG viewBox 760×480, Y unit = 4 px so squares are true squares)
- `PY(v) = 440 − 4v`. Stage 1 `PX(i) = 60 + 46i`. Stage 2 `PX(x) = 60 + 46x`. Stage 3 group centres 170/380/590, within-group offset `(k − (n−1)/2)·24`.
- DeviationSegment: rect x = px−1, w = 2, from point to reference. SquaredDeviation: side = |dev|·4, opens left when px > 400. Clip to plot area; never cap sides (honesty over tidiness).
- Prediction line: `<g transform="translate(PX(0), PY(a)) rotate(atan2(−4b, 46))">` with an over-long horizontal line, clipped — so the mean→OLS change is a rotation/translation, not a redraw.
- BetweenGroupBar at `cx − 92`, companion square side = |ȳⱼ − ȳ|·4 with "×nⱼ" label (SSB = Σ nⱼ copies).
- Pointer: `getScreenCTM().inverse()`, `setPointerCapture`; drag changes y (all stages), x (stage 2), nearest group centre reassigns g (stage 3).

## 6. Motion
CSS transitions on `transform`, `x`, `y`, `width`, `height` (SVG geometry as CSS properties, Chromium/Firefox/Safari 17+): 550 ms `cubic-bezier(.2,.7,.2,1)`; while dragging swap to 60 ms linear; `prefers-reduced-motion` → none. Opacity only for layers that are conceptually absent.

## 7. Interaction behaviour
- Observations: `role="slider"`, `aria-valuenow=y`, ↑/↓ ±1 (Shift ±5), ←/→ x ±0.5 (stage 2) or group (stage 3); focus selects. Side panel number input + range as non-drag alternative. 44 px invisible hit halo on touch.
- FormulaInspector: hover/focus on a term sets `hl`; canvas emphasises the matching primitive and dims others; explanation panel shows the term's text. Keys: `xi, mean, dev, sq, sum, n1, sqrt, yhat, resid, sse, sst, ssr, r2, grand, gmean, within, between, msb, msw, F, eta, p`.
- Custom line: two handles at x = 2 and x = 12 (drag/keys), plus a/b sliders; feedback text compares SSE with the OLS minimum without revealing a/b until "Least squares" is pressed.
- Learn mode: one ConceptPrompt per stage, 4 steps; "Reveal explanation" is step 3. Explore hides it. Teach = present: zoom 1.18, dark demo strip (8 presets), hide/show panels, Fullscreen API.
- Live region announces x̄/SS/s² (stage 1), SSE/SST (stage 2), F/p/η² (stage 3) on every change.

## 8. Accessibility (WCAG 2.2 AA targets)
Contrast: ink on bg 15:1; coral-ink #C8694F, teal-ink #0F8C7B, violet-ink #6A5BC9 used for text; amber #D9A441 only as outline. Visible 2 px focus rings. Everything keyboard-operable; chart `aria-label` summarises state; no information by colour alone (segments, areas, ×n labels, readouts). Hungarian strings already in `i18n.ts` structure; nothing is drawn as text inside canvases.

## 9. Responsive
≥ 1100: canvas 1fr + 300 px aside, math panel full width. 900–1100: aside 260 px. < 900: single column, aside becomes a bottom sheet, number/slider inputs primary. Teach mode designed for 1920×1080 projectors.

## 10. Integration guidance
- Keep `/variance` and `/anova` modules; link both to `/lab` stages (`/lab#s=1`, `/lab#s=3`) and from the Topics map back to the modules' Understand → Try → SPSS → Test steps.
- Reuse `Segmented`, `Slider`, `Button`, `Announce`, `Tex` from `src/components/ui|learning`; restyle tokens in `globals.css` (`--bg #F7F6F1`, `--ink #101B2B`, `--model #20BFA9`, `--data #548FD0`, `--residual #ED896F`, `--explained #9688E8`, `--attention #D9A441`) — the old `--x/--y/--z` roles stay for existing modules.
- Fonts via `next/font/google`: Instrument Sans, Fira Code, Source Serif 4 (replacing Inter / JetBrains Mono is optional; the lab needs only its own three).
- CSP: no external scripts; Google Fonts are self-hosted by next/font.

## 11. Known limitations / unfinished
- Prototype p-value uses the same incomplete-beta routine as the repo but was checked against two SciPy values only; run the full reference script.
- No persistence of state in the prototype beyond the share URL.
- Mobile layout is a single-column fallback, not the designed bottom-sheet; tablet drag targets are at desktop size.
- Transfer step of Learn mode asks the question but does not evaluate the answer (by design for this iteration).
- Existing module pages are linked externally (statisztikametis.site) rather than restyled.
- Pilot instrumentation hooks (session id, pre/post concept check, consent) are intentionally absent; `lab-state.ts` is the single place to add consented event emission later.

# Part II · Platform (Course Builder, Atlas, block library)

## 12. Repo landing

```
src/content/curriculum/concepts.ts        ← data/concepts-*.js (export const CONCEPTS: Concept[])
src/content/curriculum/labs.ts            ← data/labs.js
src/content/curriculum/blocks.ts          ← data/blocks.js
src/content/curriculum/courses/qda2.ts    ← data/courses.js [0]
src/content/curriculum/courses/survey.ts  ← data/courses.js [1]
src/content/curriculum/types.ts           ← docs/04-content-model.md (interfaces verbatim)
src/app/builder/page.tsx                  ← QDA2 Course Builder.dc.html (client component; localStorage key qda2-course-drafts-v1 → add to STORAGE_KEYS)
src/components/builder/                   Outline.tsx, LessonEditor.tsx, BlockRow.tsx, Library.tsx, Inspector.tsx, LabConfigForm.tsx, Advisory.tsx, PreviewOverlay.tsx
src/app/atlas/page.tsx                    ← QDA2 Concept Atlas.dc.html; components/atlas/{DomainColumns,EdgeLayer,ConceptPanel}.tsx
src/app/course/[courseId]/[unitId]/[lessonId]/page.tsx   student lesson renderer = PreviewOverlay in read-only mode
src/app/lab/sampling/page.tsx             ← QDA2 Sampling Universe.dc.html; src/lib/sampling-stats.ts ← sampling-stats.js
src/lib/lab-config.ts                     encode/decode of LabConfiguration ↔ URL hash (both labs already parse it)
```

## 13. Builder behaviours to preserve
- Drag lesson onto a unit header → move between units; drag block rows → reorder (also Alt+↑/↓ and buttons).
- Library search is AND over words across title (en+hu), id, objective, concept names; filters: type, domain, level, lab, software, reviewed.
- Inspector edits write only `BlockInstance.variant`; "Reset to library" deletes `variant.config`; "Detach" copies into `course.localBlocks` with `detachedFrom`.
- Lab config form is generated from `LabDefinition.params` (enum/boolean/int/float/string only); invariant: config never reaches the stats engine's formulas.
- Advisory = direct prerequisites of this lesson's concepts that no earlier-or-same lesson covers; suggestions ranked reviewed-first, shortest-first; never blocking.
- Publish: pins every instance to the library version, pushes a snapshot into `course.versions`, state → published; any later edit → draft (version bump on republish).
- Export schema `qda2-course/1`; import re-links refs and reports unresolved ones instead of dropping them.
- Atlas → "Add" writes `qda2-atlas-pending` and navigates; Builder consumes it on mount into the selected lesson.

## 14. Lab URL contracts
- VRA Lab: `#s=1|2|3&l=en|hu&p=mean|custom|ols&ly=1–5&sc=base|flat|noisy|steep&m=explore|learn&av=total|within|between|both&sq=&pv=&cmp=&present=`.
- Sampling Universe: `#<urlencoded JSON LabConfiguration>` with keys population, N, n, statistic, seed, showTheory, l, controls.locked[], instructions.

## 15. Not done (honest list)
- 16 of 20 labs are specified only (registry marks `spec`); the Weighting Studio engine (`survey-stats`) does not exist yet and needs the R `survey` validation script before any number is shown.
- Student renderer = preview overlay; no per-student progress beyond the existing local store; prediction/reflection answers are not persisted.
- No user accounts, sharing between browsers, or institutional libraries; publishing is local.
- Assessment blocks list concepts; they do not yet pull the re-keyed question bank.
- Hungarian strings exist for UI chrome, concept names and block titles; concept definitions and block bodies are English only.
- Actual 2026-fall weekly order is not encoded (see docs/01-audit.md §4).

# Part III · Development V2

## 16. New artifacts and dependencies
| Artifact | Depends on | Repo landing |
|---|---|---|
| survey-stats.js (QDA2Survey) | qda2-stats.js (QdaStats) | src/lib/survey-stats.ts (+ tests/unit/survey-stats.test.ts, scripts/validation/survey_reference.R) |
| QDA2 Survey Weighting Studio.dc.html | QdaStats, QDA2Survey | src/app/lab/survey-weighting/page.tsx; components/lab/survey/{PopulationField,EstimateStrip,WeightHistogram,SEBars,DeffCards,StageRail}.tsx |
| QDA2 tTest Lab.dc.html | QdaStats | src/app/lab/ttest/page.tsx; components/lab/ttest/{GroupComparison,TFraction,NullCurve}.tsx |
| QDA2 CI Explorer.dc.html | QdaStats, QDA2Sampling | src/app/lab/ci/page.tsx; components/lab/ci/{IntervalBands,CoverageCounter,WidthCurve}.tsx |
| QDA2 Lesson.dc.html | data/*.js, localStorage keys | src/app/course/[c]/[u]/[l]/page.tsx; components/lesson/* |
| QDA2 Labs.dc.html | data/labs.js, blocks.js | src/app/labs/page.tsx |
| data/questions.js | src/content/questions.tsx (ids, lines) | src/content/question-index.ts (or add graphConcepts to each question) |
| data/lab-specs-*.js, docs/labs/*.md | labs.js, concepts | docs/ in repo |

## 17. Implemented functionality (honest)
Working: everything listed in §16 renders, computes from data, persists locally, and round-trips configuration instructor → student via URL hash. Validation: QdaStats core validated (SciPy); sampling engine property-checked; survey engine **not validated against R** (UI badge). No backend, no accounts, no cross-device publishing.

## 18. Runtime rule learned
Dynamic text inside SVG must be produced in `renderVals()` via a `TXT()` helper (React.createElement text nodes); template holes inside `<text>` are wrapped in a span and do not render. Applies to every lab.

## 19. Known limitations (V2)
See docs/08 §2, docs/12 "Open issues", docs/13 "Known limitations", docs/14 "Not done". Headline: 9 labs designed only; survey SEs provisional; snapshot does not embed block bodies; quiz options not rendered; HU partial.

## 20. Next development steps
docs/15-development-roadmap.md, items 1–9 in order; P0 = R validation and primitive extraction.

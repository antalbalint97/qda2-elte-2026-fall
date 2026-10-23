# 01 · Repository and asset audit

Scope: `antalbalint97/qda2-elte-2026-fall@main` (124 source files under `src/`, read 2026-10-23) and this design project's prototype files. Statements about files not read are marked *not inspected*.

## 1. Inventory of what exists

### Prototype files (this project)
| File | What it is | Verdict |
|---|---|---|
| `QDA2 Lab.dc.html` | Variance → Regression → ANOVA lab, 3 stages, Explore/Learn/Teach, en/hu, URL-hash share | **Reuse as is**; becomes lab `vra-lab` in the registry. Needs a `config` prop so block instances can open it at a stage/preset with controls hidden. |
| `qda2-stats.js` | `describe`, `fit`, `sseLine`, `anova`, `fP`, `fmt` — verified against SciPy values | **Reuse**; promote to `src/lib/lab-stats.ts`. Extend, do not fork. |
| `QDA2 Landing.dc.html`, `QDA2 Topics.dc.html`, `QDA2 Design System.dc.html` | Dark-hero landing, curriculum map, token sheet | **Reuse visual system**; Topics page is superseded by the Concept Atlas + Course view. |
| `HANDOFF.md` | Component map to `src/` paths | **Extend** (§ Phase 5). |

### Next.js repository
| Area | Files | Reusable? | Notes |
|---|---|---|---|
| `src/lib/stats.ts` | normal/t/χ²/F distributions (incomplete beta, gamma), `chiSquareTest`, `pearson/spearman`, `oneSampleT/independentT/pairedT`, `hedgesG`, `leveneTest`, `linearFit`, `mulberry32`, `simulateNullT`, `skewness` | **Yes — core of Layer 2** | ≈1e-7 accuracy; has SciPy fixtures in `tests/unit`. Missing for the new labs: Tukey/studentised range, non-central t (power), hypergeometric (Fisher), survey estimators, eigen-decomposition, IRLS logistic, HC3, Cook's D. |
| `src/lib/reliability.ts` | Cronbach α, item-total statistics, α bands | Yes | Powers `measurement-index-lab`. |
| `src/lib/progress.ts`, `theme.ts` | local-first progress store, `STORAGE_KEYS`, presentation mode | Yes | Course Builder drafts should register their key here (`qda2-course-drafts-v1`). |
| `src/content/concepts.ts` | 17 `ConceptId`s with definitions and anchors | **Mapped**, not reused as-is | Every one maps to a node in the new graph (see §3). Keep the type for quiz compatibility; add `graphId`. |
| `src/content/modules.ts` | 9 modules + `CHAIN` (9-link analysis chain) + `REVIEW_TOPICS` | Yes | Modules become **Course A's existing sequence**; `CHAIN` becomes the `connection`/`reflection` scaffold. |
| `src/content/questions.tsx` (56 kB) + `quiz-types.ts` | ~30 choice/order questions with per-option `why` | Yes | Each question is an `AssessmentItem`; `concept` field re-keyed to graph ids. |
| `src/components/quiz/*` | QuizRunner, ReviewMode, AiExplain (mock) | Yes | Backs the Assessment block. |
| `src/components/learning/*` | ModuleShell (Understand → Try → SPSS → Test), Spss (BeforeSpss, MenuPath, Dialog, Output), Formula/Tex, ChainBar, Feedback | Yes | `Spss` backs the Software Application block; ModuleShell steps map to block types. |
| `src/components/modules/variance/*` | VarianceSquares, ResidualSquares, MeanPull, SameMean, SpreadPatterns, ErrorDance | Partially | Superseded by VRA primitives; SameMean/SpreadPatterns/ErrorDance content becomes Distribution Studio and Sampling Universe presets. |
| `src/components/modules/anova/*` | Derivations (23 kB), VarianceExplorer, 11-obs data | Partially | Derivations → Math blocks; VarianceExplorer superseded by VRA stage 3. |
| `modules/correlation/*`, `crosstab/*`, `lazarsfeld/*`, `measurement/*`, `pvalue/*`, `ttest/*`, `indices/*` | Module interactives | Yes, as **lab presets and experiment blocks** | Each is listed as `src` on a block in `data/blocks.js`. Refactor onto shared primitives when touched; do not rewrite pre-emptively. |
| `src/components/viz/DistributionChart.tsx`, `Scatter.tsx` | pure-SVG charts | Yes | Seeds for Distribution Studio and Correlation Lab. |
| `src/components/ui/*` | Button, Segmented, Slider, Term, Callout, Disclosure, Announce, Role | Yes | Course Builder reuses all. |
| `src/components/advanced/AdvancedLab.tsx` (29 kB) | "Go further" extensions | *not inspected in detail* | Likely Connection blocks. |
| `src/components/bonus/sopranos/*`, `src/content/sopranos/*` | Unlisted revision lab with synthetic data | Yes | Dataset block `ds.sopranos` + Course A week 13. |
| `src/lib/ai.ts` | deterministic mock | Keep mocked | No backend assumed. |
| `src/lib/security-headers.ts` | CSP, no external scripts | Constraint | Course Builder must not load external scripts; export is file download only. |
| `scripts/validation/reference.py`, `tests/unit/*` | SciPy references, identities | **Extend** | Add `survey_reference.R` for Domain I. |
| `docs/institutional/*` | audit, privacy, accessibility, pilot proposal | *not inspected* | Phase 5 evaluation plan should cite rather than duplicate. |

## 2. What can be reused unchanged, what needs refactoring, what is missing

**Reuse unchanged:** `stats.ts`, `reliability.ts`, `progress.ts`, UI kit, quiz engine, Spss components, question bank, synthetic data sets and their generator scripts, VRA lab.

**Refactor:** module interactives onto the VRA primitive set (one `DraggableObservation`, one `SquaredDeviation`, …) so that a squared deviation looks identical in every lab; `ModuleShell` steps generalised into block rendering; `ConceptId` → graph id mapping; `MODULES` kept as the "existing QDA2 sequence" course.

**Missing (new):** the concept graph (now `data/concepts-*.js`), lab registry (`data/labs.js`), block library (`data/blocks.js`), course model and builder (this project: `QDA2 Course Builder.dc.html`), Concept Atlas, survey-statistics engine (`survey-stats.js`, Phase 4+), 14 new labs (3 built or partially backed by repo code, 16 specified), R `survey` validation script, student lesson renderer.

## 3. Existing concept ids → graph nodes

| `ConceptId` (repo) | Graph node(s) |
|---|---|
| measurement | data.measurement_levels |
| descriptives | desc.central_tendency, desc.skewness |
| roles | data.variable_roles |
| crosstab-percent | cat.conditional_percent |
| chi-square | cat.chi_square, cat.cramers_v |
| p-value | infer.p_value, infer.null_distribution |
| lazarsfeld-pattern / -control / -sequence | cat.lazarsfeld, cat.stratified, practice.causal_diagrams |
| correlation | corr.pearson |
| pearson-spearman | corr.spearman |
| t-test-choice | group.t_one_sample, group.t_paired, group.t_independent |
| t-test-output | group.welch_t, infer.assumptions |
| effect-size | infer.effect_size, group.cohens_d |
| anova | group.anova_oneway, group.anova_decomposition, group.eta_squared |
| variance | desc.variance, desc.sd, model.residuals, model.heteroscedasticity |
| index | measure.composite_index, measure.cronbach, measure.reverse_scoring |

## 4. Existing module → Course A mapping

01 Measurement → week 1 · 02 Crosstabs → weeks 3–4 · 03 Lazarsfeld → week 5 · 04 p-values → week 8 · 05 Correlation → week 6 · 06 t-tests → week 9 · 07 ANOVA → week 10 · 08 Variance → weeks 2 and 11 · 09 Index → week 12 · /review → week 13 · Sopranos → week 13. The **actual** 2026-fall order is reproducible by a second course object that lists the nine module lessons in `MODULES` order (one unit per module); it is not yet included because the real weekly dates were not supplied.

## 5. Gaps and methodological issues found

1. `t-test-output` definition in `concepts.ts` says "Levene's test decides which row to read" — contradicts the brief's caution. The new `group.welch_t` node and block `c.welch-default` teach Welch as default and Levene as diagnostic. Update the repo definition when syncing.
2. `simulateNullT` is correct but the p-value module shows only a one-sample case; the Hypothesis Lab generalises it.
3. No survey-statistics code exists anywhere; everything in Domain I is new and must be validated against R `survey` before any number is shown to students.
4. `stats.ts` `sd()` returns NaN for n = 1 and `linearFit` divides by `sxx = 0`; `qda2-stats.js` already guards these (`null` + reason). Port the guards back.
5. The prototype's p-value uses the same incomplete-beta routine; only two SciPy fixtures exist for `fP`. Add F fixtures for df pairs (1,10), (2,12), (4,40), (10,200).
6. Quiz `concept` ids are the 17 old ids; questions cannot yet be filtered by graph node, lab or block until re-keyed.
7. Accessibility: existing module interactives (e.g. `GuessR`, `MosaicPlot` to be built) have no keyboard alternative; the lab registry lists the required alternative per lab.
8. `AiExplain` is a mock and must stay clearly labelled as such in any Assessment block.

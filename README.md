# QDA2 Interactive Lab

An interactive study companion for **Quantitative Data Analysis 2**: measurement levels, crosstabs, the Lazarsfeld paradigm, p-values, correlation, t-tests, a worked ANOVA mathematics lab and a visual lab on spread, variance and error terms.

> Understand the logic. Practice the decisions. Read the output.

## Run it

Requires Node.js 18.18+ (tested with Node 22).

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Checks and tests

```bash
npm run lint
npm run typecheck
npm run test:unit                 # statistics vs SciPy reference values, identities, header config (node:test)
npm run build && node scripts/check-build.mjs   # build-output scan: no secrets, source maps or external scripts
npx playwright install chromium   # once
npm run test:e2e                  # routes, keyboard, axe accessibility rules, viewports, network, links, headers
```

`npm run validate:reference` regenerates `tests/unit/fixtures/reference.json` with SciPy (needs numpy + scipy).
CI runs the same steps on every pull request (`.github/workflows/ci.yml`).

## Privacy, presentation mode and embedding

No backend, no login, no cookies, no analytics and no third-party requests. Quiz progress, the theme, presentation mode
and bonus-lab notes are stored only in the browser's `localStorage` (keys listed in `src/lib/theme.ts` → `STORAGE_KEYS`);
`/privacy` shows them and lets the visitor reset or delete them.

- **Presentation mode** for projectors: the header button, or `?present=1` on any URL (`?present=0` switches it off).
- **Security headers** (CSP, HSTS, framing policy and others) are defined in `src/lib/security-headers.ts`.
- **Embedding** in an LMS iframe is off by default. To allow specific origins, set
  `EMBED_ALLOWED_ORIGINS="https://lms.example.edu"` (exact `https://` origins, space- or comma-separated) at build time
  and redeploy. See `docs/institutional/lms-integration.md`.

## Institutional review package

`docs/institutional/` contains the technical audit, privacy and data-flow description, statistical validation,
accessibility report, security review, LMS and network-access guidance (with a Hungarian summary for IT), a teaching
pilot proposal and the list of open issues.

StatisztikaMetis is an independently developed educational resource. References to university courses or institutions
do not imply official institutional endorsement.

## Structure

```
src/
  app/                      one route per module + /review (quick review), /about, /privacy, error and 404 pages
  components/
    learning/               ModuleShell + Step (Understand → Try → SPSS → Test), ChainBar,
                            Feedback, Formula, MiniTable, Spss (BeforeSpss, MenuPath, SpssDialog, SpssOutput)
    quiz/                   quiz engine: ChoiceQuestionView, OrderQuestionView, QuizRunner,
                            ReviewMode, AiExplain (mocked)
    viz/                    DistributionChart, Scatter (pure SVG)
    modules/<module>/       module-specific interactives and data
    ui/                     Button, Segmented, Slider, Term (glossary tooltip), Callout, Disclosure, Role chips
  content/                  concepts, glossary, modules, question bank (30 questions), sopranos/ (bonus lab data + questions)
  lib/                      stats (t, χ², normal, Pearson, Spearman, seeded RNG), progress store, AI payload
```

All statistics shown in the visualisations are computed live (`src/lib/stats.ts`); random samples use a seeded generator so every student sees the same plots.

X, Y and Z have fixed colours across the whole site (blue, orange, purple).

## ANOVA mathematics lab

The `/anova` module reproduces the 11-observation variance decomposition from the teaching video, derives SST, SSW, SSB, MS, F and eta squared, and provides an interactive slider-driven dot plot. It also revisits row percentages, chi-square / Cramér's V and Pearson / Spearman before the ANOVA, and clarifies the distinction between one-way, two-way and stratified analysis. Its simulation is illustrative and does not make new empirical claims. SPSS syntax and output remain the reference for inference.

## Spread, variance & error lab

The `/variance` module (08) builds intuition for why averages are not enough: four synthetic groups with the same mean and median but different distributions, a mean-versus-median slider, variance drawn as squares (variance = area of the average square, SD = its side), residual squares around the mean, a user-tilted line and the least-squares line (r² as the share accounted for), a simulation of the error term and the standard error, and a visual first look at heteroscedasticity. Its data and helpers live in `src/components/modules/variance/data.ts` and `src/lib/stats.ts` and are checked against SciPy in `tests/unit`.

## Adding questions

Add a `ChoiceQuestion` or `OrderQuestion` to `src/content/questions.tsx`. Every wrong option should carry a `why` that names the exact conceptual mistake; `explanation` says why the right answer is right. Add it to `QUICK_REVIEW` to include it in the mixed quiz.

## Optional AI explanation

`src/lib/ai.ts` builds the payload (topic, question, correct answer, student answer, course definition, instructions) and currently returns a deterministic mock. To connect a model, add a server route (e.g. `src/app/api/explain/route.ts`) that forwards the payload to the model API with a server-side key, and replace the body of `explainMistake` with a `fetch` to that route.

## Bonus: The Sopranos QDA2 Lab

`/bonus/sopranos` is an optional, unlisted practice lab (not in the navigation, `noindex`) that revises the whole course on a
Sopranos-themed dataset. Send the direct link to the student; progress is stored in the same browser store (question ids start with `sop-`).

The dataset is **synthetic**: no real episode metadata or coded content is used, and the page says so. It is generated by a seeded script
and every statistic on the page is computed from it:

```bash
python3 scripts/sopranos/generate.py   # regenerates src/content/sopranos/dataset.ts (deterministic, needs numpy + scipy)
python3 scripts/sopranos/verify.py     # recomputes every statistic with scipy and checks the app's own numbers agree
```

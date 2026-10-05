# QDA2 Interactive Lab

An interactive study companion for **Quantitative Data Analysis 2**: measurement levels, crosstabs, the Lazarsfeld paradigm, p-values, correlation and t-tests.

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

Checks: `npm run lint`, `npx tsc --noEmit`.

No backend and no login. Quiz progress, self-ratings and the theme are stored in the browser's `localStorage` (`qda2-lab-progress-v1`).

## Structure

```
src/
  app/                      one route per module + /review (quick review)
  components/
    learning/               ModuleShell + Step (Understand → Try → SPSS → Test), ChainBar,
                            Feedback, Formula, MiniTable, Spss (BeforeSpss, MenuPath, SpssDialog, SpssOutput)
    quiz/                   quiz engine: ChoiceQuestionView, OrderQuestionView, QuizRunner,
                            ReviewMode, AiExplain (mocked)
    viz/                    DistributionChart, Scatter (pure SVG)
    modules/<module>/       module-specific interactives and data
    ui/                     Button, Segmented, Slider, Term (glossary tooltip), Callout, Disclosure, Role chips
  content/                  concepts, glossary, modules, question bank (30 questions)
  lib/                      stats (t, χ², normal, Pearson, Spearman, seeded RNG), progress store, AI payload
```

All statistics shown in the visualisations are computed live (`src/lib/stats.ts`); random samples use a seeded generator so every student sees the same plots.

X, Y and Z have fixed colours across the whole site (blue, orange, purple).

## Adding questions

Add a `ChoiceQuestion` or `OrderQuestion` to `src/content/questions.tsx`. Every wrong option should carry a `why` that names the exact conceptual mistake; `explanation` says why the right answer is right. Add it to `QUICK_REVIEW` to include it in the mixed quiz.

## Optional AI explanation

`src/lib/ai.ts` builds the payload (topic, question, correct answer, student answer, course definition, instructions) and currently returns a deterministic mock. To connect a model, add a server route (e.g. `src/app/api/explain/route.ts`) that forwards the payload to the model API with a server-side key, and replace the body of `explainMistake` with a `fetch` to that route.

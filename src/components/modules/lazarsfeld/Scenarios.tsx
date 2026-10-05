"use client";

import { MiniTable } from "@/components/learning/MiniTable";
import { ChoiceQuestionView } from "@/components/quiz/ChoiceQuestionView";
import type { ChoiceQuestion } from "@/content/quiz-types";
import { cn } from "@/lib/cn";
import { useProgress } from "@/lib/progress";
import { useMemo, useState } from "react";
import { CHANGE_LABEL, CHANGE_WHY, PATTERN_NAME, SCENARIOS, patternWhy, type Change, type Pattern, type Scenario } from "./data";

function rotate<T>(arr: T[], k: number): T[] {
  const n = k % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

function buildQuestions(s: Scenario, idx: number): ChoiceQuestion[] {
  const vars = rotate(
    [
      { id: "x", label: s.x },
      { id: "y", label: s.y },
      { id: "z", label: s.z },
    ],
    idx,
  );
  const roleQ = (role: "x" | "y" | "z", n: number, name: string, explain: string): ChoiceQuestion => ({
    kind: "choice",
    id: `lzs-${s.id}-${role}`,
    concept: "roles",
    format: `Question ${n} of 6`,
    prompt: `What is ${name}?`,
    options: vars.map((v) => ({
      id: v.id,
      label: v.label,
      why:
        v.id === "x"
          ? `${v.label} defines the groups we compare in the zero-order table: it is X.`
          : v.id === "y"
            ? `${v.label} is the outcome whose percentages we compare: it is Y.`
            : `${v.label} is the variable whose categories split the data into partial tables: it is Z.`,
    })),
    correct: role,
    explanation: explain,
  });
  const diffs = [s.zero[1] - s.zero[0], s.partials[0][1] - s.partials[0][0], s.partials[1][1] - s.partials[1][0]];
  const fmt = (d: number) => `${d > 0 ? "+" : ""}${d}`;
  return [
    roleQ("x", 1, "X (the independent variable)", `${s.x} defines the groups compared in the zero-order table.`),
    roleQ("y", 2, "Y (the dependent variable)", `${s.y} is the outcome: we compare “${s.yLabel}” across the categories of X.`),
    roleQ("z", 3, "Z (the control variable)", `${s.z} is held constant: the data are split into its categories (${s.zCats.join(" / ")}).`),
    {
      kind: "choice",
      id: `lzs-${s.id}-ztype`,
      concept: "lazarsfeld-control",
      format: "Question 4 of 6",
      prompt: `Is ${s.z.toLowerCase()} an antecedent or an intervening variable here?`,
      options: [
        {
          id: "ante",
          label: "Antecedent (Z → X → Y)",
          why: `${s.z} does not come before ${s.x.toLowerCase()} in this design; it lies between X and Y.`,
        },
        {
          id: "inter",
          label: "Intervening (X → Z → Y)",
          why: `${s.z} cannot be a step between X and Y, because it comes before ${s.x.toLowerCase()} in time.`,
        },
      ],
      correct: s.zType,
      explanation: s.zTypeWhy,
    },
    {
      kind: "choice",
      id: `lzs-${s.id}-change`,
      concept: "lazarsfeld-pattern",
      format: "Question 5 of 6",
      prompt: `Zero-order difference: ${fmt(diffs[0])} pp. Partial differences: ${fmt(diffs[1])} pp (${s.zCats[0]}) and ${fmt(diffs[2])} pp (${s.zCats[1]}). What happened to the partial relationships?`,
      options: (["same", "differs", "weakens"] as Change[]).map((c) => ({
        id: c,
        label: CHANGE_LABEL[c],
        why: CHANGE_WHY[s.change][c] || undefined,
      })),
      correct: s.change,
      explanation:
        s.change === "same"
          ? "Both partial differences are close to the zero-order difference."
          : s.change === "differs"
            ? "One partial difference is large and the other small: the relationship depends on Z."
            : "Both partial differences are much smaller than the zero-order difference.",
    },
    {
      kind: "choice",
      id: `lzs-${s.id}-pattern`,
      concept: "lazarsfeld-pattern",
      format: "Question 6 of 6",
      prompt: "Which Lazarsfeld pattern is this?",
      options: (["rep", "spec", "expl", "interp"] as Pattern[]).map((p) => ({
        id: p,
        label: PATTERN_NAME[p],
        why: p === s.pattern ? undefined : patternWhy(p, s.pattern),
      })),
      correct: s.pattern,
      explanation: s.conclusion,
    },
  ];
}

export function Scenarios() {
  const [active, setActive] = useState(0);
  const [step, setStep] = useState<Record<string, number>>({});
  const progress = useProgress();
  const s = SCENARIOS[active];
  const questions = useMemo(() => buildQuestions(s, active), [s, active]);
  const shown = step[s.id] ?? 1;
  const solved = (sc: Scenario) => `lzs-${sc.id}-pattern` in progress.answers;

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <nav aria-label="Scenarios">
        <ol className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {SCENARIOS.map((sc, i) => (
            <li key={sc.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-current={i === active}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  i === active ? "bg-surface text-ink shadow-sm ring-1 ring-line" : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-[10px]",
                    solved(sc) ? "bg-pos text-white" : "bg-surface-3 text-muted",
                  )}
                >
                  {solved(sc) ? "✓" : i + 1}
                </span>
                <span className="hidden truncate lg:inline">{sc.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div key={s.id} className="animate-fade-up rounded-2xl border border-line bg-surface">
        <div className="space-y-4 border-b border-line p-4 sm:p-6">
          <p className="font-mono text-xs text-faint">Scenario {active + 1} of {SCENARIOS.length}</p>
          <h3 className="font-serif text-xl font-semibold text-ink">{s.title}</h3>
          <p className="leading-relaxed text-muted">{s.story}</p>
          <MiniTable
            caption={`${s.yLabel} by ${s.x.toLowerCase()}, zero-order and within categories of ${s.z.toLowerCase()}`}
            head={["", "Zero-order", `${s.zCats[0]}`, `${s.zCats[1]}`]}
            rows={[
              [s.xCats[0], `${s.zero[0]}%`, `${s.partials[0][0]}%`, `${s.partials[1][0]}%`],
              [s.xCats[1], `${s.zero[1]}%`, `${s.partials[0][1]}%`, `${s.partials[1][1]}%`],
            ]}
          />
        </div>
        <div className="divide-y divide-line">
          {questions.slice(0, shown).map((q, i) => (
            <div key={q.id} className="p-4 sm:p-6">
              <ChoiceQuestionView
                q={q}
                compact
                onAnswered={() => setStep((st) => ({ ...st, [s.id]: Math.max(st[s.id] ?? 1, i + 2) }))}
              />
            </div>
          ))}
        </div>
        {shown > questions.length && active < SCENARIOS.length - 1 && (
          <div className="border-t border-line p-4 text-right sm:px-6">
            <button type="button" onClick={() => setActive(active + 1)} className="text-sm font-medium text-accent hover:underline">
              Next scenario →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

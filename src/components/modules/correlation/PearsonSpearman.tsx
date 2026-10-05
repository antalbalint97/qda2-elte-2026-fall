"use client";

import { Term } from "@/components/ui/Term";
import { cn } from "@/lib/cn";
import { useState } from "react";

const QS = [
  {
    q: "Are both variables continuous / scale?",
    noResult: "Spearman",
    noWhy: "At least one variable is ordinal, so the distances between its codes are not meaningful. Use a rank-based measure.",
  },
  {
    q: "Does a roughly linear relationship make sense (check the scatterplot)?",
    noResult: "Spearman",
    noWhy:
      "If the pattern is monotonic but curved, Spearman captures it better. If it is not even monotonic (e.g. U-shaped), neither coefficient summarises it well: describe the pattern instead.",
  },
  {
    q: "Are Pearson's assumptions reasonable (no extreme outliers, no severely skewed distributions)?",
    noResult: "Spearman",
    noWhy: "Ranks are robust to outliers and skew, so Spearman is the safer choice.",
  },
];

export function PearsonSpearman() {
  const [answers, setAnswers] = useState<Array<"yes" | "no">>([]);
  const noAt = answers.indexOf("no");
  const done = noAt >= 0 || answers.length === QS.length;
  const result = noAt >= 0 ? "Spearman" : answers.length === QS.length ? "Pearson" : null;
  const visible = noAt >= 0 ? noAt + 1 : Math.min(answers.length + 1, QS.length);

  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <ol className="space-y-3">
        {QS.slice(0, visible).map((it, i) => (
          <li key={i} className="animate-fade-up rounded-xl border border-line p-3.5">
            <p className="text-sm font-medium text-ink">
              <span className="mr-2 font-mono text-xs text-faint">{i + 1}</span>
              {it.q}
            </p>
            <div className="mt-2.5 flex gap-2">
              {(["yes", "no"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={answers[i] === a}
                  onClick={() => setAnswers([...answers.slice(0, i), a])}
                  className={cn(
                    "rounded-lg border px-3 py-1 text-sm capitalize transition-colors",
                    answers[i] === a ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-ink",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <div className="self-start rounded-xl bg-surface-2 p-4" aria-live="polite">
        {!done ? (
          <p className="text-sm text-muted">Answer the questions to get a recommendation.</p>
        ) : (
          <div className="animate-fade-up">
            <p className="text-xs text-muted">Use</p>
            <p className="font-serif text-3xl font-semibold text-accent">{result}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {result === "Pearson"
                ? "Two scale variables with a roughly linear relationship: Pearson's r measures the direction and strength of the linear association."
                : QS[noAt].noWhy}
            </p>
            {result === "Spearman" && (
              <p className="mt-2 text-xs leading-relaxed text-faint">
                Spearman&apos;s ρ is a rank-based measure of <Term k="monotonic">monotonic</Term> association.
              </p>
            )}
            <button type="button" onClick={() => setAnswers([])} className="mt-3 text-xs font-medium text-muted hover:text-ink">
              Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

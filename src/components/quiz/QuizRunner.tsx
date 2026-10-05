"use client";

import type { Question } from "@/content/quiz-types";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { QuestionView } from "./QuestionView";

/** Steps through a set of questions one at a time, with immediate feedback on each. */
export function QuizRunner({ questions, title }: { questions: Question[]; title?: string }) {
  const [i, setI] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const q = questions[i];
  const done = Object.keys(results).length;
  const right = Object.values(results).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <p className="text-sm font-medium text-ink">{title ?? "Mastery check"}</p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1" aria-label={`Question ${i + 1} of ${questions.length}`}>
            {questions.map((qq, k) => (
              <button
                key={qq.id}
                type="button"
                aria-label={`Go to question ${k + 1}`}
                aria-current={k === i}
                onClick={() => setI(k)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  k === i ? "w-5 bg-accent" : "w-2",
                  k !== i && (results[qq.id] === true ? "bg-pos" : results[qq.id] === false ? "bg-neg" : "bg-surface-3"),
                )}
              />
            ))}
          </div>
          <span className="font-mono text-xs tabular-nums text-faint">
            {right}/{done}
          </span>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <QuestionView
          key={q.id}
          q={q}
          onAnswered={(ok) => setResults((r) => (q.id in r ? r : { ...r, [q.id]: ok }))}
        />
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3 sm:px-6">
        <button
          type="button"
          disabled={i === 0}
          onClick={() => setI(i - 1)}
          className="text-sm font-medium text-muted hover:text-ink disabled:opacity-30"
        >
          ← Previous
        </button>
        <span className="text-xs text-faint">
          {i + 1} / {questions.length}
        </span>
        <button
          type="button"
          disabled={i === questions.length - 1}
          onClick={() => setI(i + 1)}
          className="text-sm font-medium text-accent hover:underline disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

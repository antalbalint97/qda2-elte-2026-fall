"use client";

import { Feedback } from "@/components/learning/Feedback";
import type { ChoiceQuestion } from "@/content/quiz-types";
import { cn } from "@/lib/cn";
import { recordAnswer } from "@/lib/progress";
import { useState } from "react";
import { AiExplain } from "./AiExplain";

export function ChoiceQuestionView({
  q,
  onAnswered,
  compact = false,
  showFormat = true,
}: {
  q: ChoiceQuestion;
  onAnswered?: (correct: boolean) => void;
  compact?: boolean;
  showFormat?: boolean;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;
  const isCorrect = picked === q.correct;
  const isPartial = picked !== null && !isCorrect && q.partial?.[picked] !== undefined;
  const pickedOpt = q.options.find((o) => o.id === picked);
  const correctOpt = q.options.find((o) => o.id === q.correct)!;
  const binary = q.options.length === 2;

  function pick(id: string) {
    if (answered) return;
    setPicked(id);
    const ok = id === q.correct || q.partial?.[id] !== undefined;
    recordAnswer(q.id, q.concept, ok);
    onAnswered?.(ok);
  }

  return (
    <div className="space-y-4">
      <div>
        {showFormat && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{q.format}</p>
        )}
        <p className={cn("leading-relaxed text-ink", compact ? "text-[15px]" : "text-base sm:text-lg")}>{q.prompt}</p>
      </div>
      {q.context && <div>{q.context}</div>}
      <div
        role="group"
        aria-label="Answer options"
        className={cn("grid gap-2", binary ? "sm:grid-cols-2" : q.options.length > 3 ? "sm:grid-cols-2" : "")}
      >
        {q.options.map((o) => {
          const state = !answered
            ? "idle"
            : o.id === q.correct
              ? "correct"
              : o.id === picked
                ? isPartial
                  ? "partial"
                  : "wrong"
                : "rest";
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(o.id)}
              disabled={answered && state === "rest"}
              aria-pressed={o.id === picked}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-all",
                state === "idle" && "border-line bg-surface hover:border-accent/50 hover:bg-accent-soft/40",
                state === "correct" && "border-pos/50 bg-pos-soft text-ink",
                state === "wrong" && "border-neg/50 bg-neg-soft text-ink",
                state === "partial" && "border-warn/50 bg-warn-soft text-ink",
                state === "rest" && "border-line bg-surface opacity-50",
                answered && "cursor-default",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                  state === "idle" && "border-line-strong",
                  state === "correct" && "border-pos bg-pos",
                  state === "wrong" && "border-neg bg-neg",
                  state === "partial" && "border-warn bg-warn",
                  state === "rest" && "border-line",
                )}
              />
              <span className="leading-snug">{o.label}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="space-y-3">
          {isCorrect ? (
            <Feedback tone="correct">
              <p>{q.explanation}</p>
            </Feedback>
          ) : isPartial ? (
            <Feedback tone="partial">
              <p>{q.partial![picked!]}</p>
              <p>
                <strong>Course answer: {correctOpt.label}.</strong> {q.explanation}
              </p>
            </Feedback>
          ) : (
            <Feedback tone="incorrect" title={`Not quite. The answer is: ${correctOpt.label}`}>
              {pickedOpt?.why && <p>{pickedOpt.why}</p>}
              <p>{q.explanation}</p>
            </Feedback>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="text-xs font-medium text-muted hover:text-ink"
            >
              Try again
            </button>
            {!isCorrect && !isPartial && (
              <AiExplain
                concept={q.concept}
                question={q.prompt}
                correctAnswer={correctOpt.label}
                studentAnswer={pickedOpt?.label ?? ""}
                hint={pickedOpt?.why}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

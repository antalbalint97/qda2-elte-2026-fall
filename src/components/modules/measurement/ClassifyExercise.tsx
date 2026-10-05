"use client";

import { cn } from "@/lib/cn";
import { recordAnswer } from "@/lib/progress";
import { useState } from "react";
import { LEVEL_LABEL, VARIABLES, type Level, type VariableItem } from "./data";

type Result = "correct" | "partial" | "wrong";

function grade(v: VariableItem, pick: Level): Result {
  if (pick === v.level) return "correct";
  if (v.partial?.[pick]) return "partial";
  return "wrong";
}

function Row({ v, pick, onPick }: { v: VariableItem; pick?: Level; onPick: (l: Level) => void }) {
  const res = pick ? grade(v, pick) : undefined;
  return (
    <li className="py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium text-ink">{v.name}</p>
          <p className="truncate font-mono text-xs text-faint">{v.values}</p>
        </div>
        <div role="group" aria-label={`Measurement level of ${v.name}`} className="flex shrink-0 gap-1.5">
          {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => {
            const isPick = pick === l;
            const isAnswer = pick && l === v.level;
            return (
              <button
                key={l}
                type="button"
                disabled={!!pick}
                onClick={() => onPick(l)}
                aria-pressed={isPick}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-[13px]",
                  !pick && "border-line bg-surface text-ink hover:border-accent/60 hover:bg-accent-soft/50",
                  pick && !isPick && !isAnswer && "border-line text-faint opacity-50",
                  isAnswer && "border-pos/50 bg-pos-soft text-pos",
                  isPick && res === "wrong" && "border-neg/50 bg-neg-soft text-neg",
                  isPick && res === "partial" && "border-warn/50 bg-warn-soft text-warn",
                )}
              >
                {l === "scale" ? "Scale" : LEVEL_LABEL[l]}
              </button>
            );
          })}
        </div>
      </div>
      {pick && res && (
        <div
          className={cn(
            "animate-fade-up mt-3 rounded-xl border p-3.5 text-sm",
            res === "correct" && "border-pos/30 bg-pos-soft/60",
            res === "partial" && "border-warn/30 bg-warn-soft/60",
            res === "wrong" && "border-neg/30 bg-neg-soft/60",
          )}
          role="status"
        >
          <p className="font-semibold text-ink">
            {res === "correct" ? "Correct: " : res === "partial" ? "Defensible. Course answer: " : "Not quite. Answer: "}
            {LEVEL_LABEL[v.level]}
          </p>
          {res === "wrong" && v.wrong?.[pick] && <p className="mt-1 text-ink/85">{v.wrong[pick]}</p>}
          {res === "partial" && <p className="mt-1 text-ink/85">{v.partial![pick]}</p>}
          <p className="mt-1 text-muted">{v.why}</p>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs">
            <span className="text-muted">
              Ordering exists: <strong className="text-ink">{v.ordered ? "yes" : "no"}</strong>
            </span>
            <span className="text-muted">
              Numerical distance meaningful: <strong className="text-ink">{v.distance ? "yes" : "no"}</strong>
            </span>
          </div>
        </div>
      )}
    </li>
  );
}

export function ClassifyExercise() {
  const [picks, setPicks] = useState<Record<string, Level>>({});
  const done = Object.keys(picks).length;
  const right = VARIABLES.filter((v) => picks[v.id] && grade(v, picks[v.id]) !== "wrong").length;
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <p className="text-sm font-medium text-ink">Classify each variable</p>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-3" aria-hidden>
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${(done / VARIABLES.length) * 100}%` }}
            />
          </div>
          <span className="font-mono text-xs tabular-nums text-muted">
            {right}/{done} of {VARIABLES.length}
          </span>
          {done > 0 && (
            <button type="button" onClick={() => setPicks({})} className="text-xs font-medium text-muted hover:text-ink">
              Reset
            </button>
          )}
        </div>
      </div>
      <ul className="divide-y divide-line px-4 sm:px-6">
        {VARIABLES.map((v) => (
          <Row
            key={v.id}
            v={v}
            pick={picks[v.id]}
            onPick={(l) => {
              setPicks((p) => ({ ...p, [v.id]: l }));
              recordAnswer(`m-classify-${v.id}`, "measurement", grade(v, l) !== "wrong");
            }}
          />
        ))}
      </ul>
    </div>
  );
}

"use client";

import { Feedback } from "@/components/learning/Feedback";
import { Role } from "@/components/ui/Role";
import { cn } from "@/lib/cn";
import { recordAnswer } from "@/lib/progress";
import { useState } from "react";
import { ROLE_EXERCISE } from "./data";

const ROLE_NAME = { X: "independent variable", Y: "dependent variable", Z: "control variable" };

export function RoleExercise() {
  const [picks, setPicks] = useState<Record<string, "X" | "Y" | "Z">>({});
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3 sm:px-6">
        <p className="text-sm font-medium text-ink">{ROLE_EXERCISE.variable}</p>
        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
          Measurement level: <strong className="text-ink">{ROLE_EXERCISE.level}</strong> in every question
        </span>
      </div>
      <ol className="divide-y divide-line px-4 sm:px-6">
        {ROLE_EXERCISE.items.map((it, n) => {
          const pick = picks[it.id];
          return (
            <li key={it.id} className="py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-sm text-ink">
                  <span className="mr-2 font-mono text-xs text-faint">{n + 1}</span>
                  {it.rq}
                </p>
                <div role="group" aria-label="Role of education" className="flex shrink-0 gap-1.5">
                  {(["X", "Y", "Z"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={!!pick}
                      aria-pressed={pick === r}
                      aria-label={`${r}: ${ROLE_NAME[r]}`}
                      onClick={() => {
                        setPicks((p) => ({ ...p, [it.id]: r }));
                        recordAnswer(`m-role-${it.id}`, "roles", r === it.answer);
                      }}
                      className={cn(
                        "rounded-lg border p-1 transition-all",
                        !pick && "border-transparent hover:border-line-strong",
                        pick && pick !== r && it.answer !== r && "opacity-35",
                        pick && it.answer === r && "border-pos/60",
                        pick === r && r !== it.answer && "border-neg/60",
                      )}
                    >
                      <Role r={r} />
                    </button>
                  ))}
                </div>
              </div>
              {pick && (
                <Feedback tone={pick === it.answer ? "correct" : "incorrect"} className="mt-3">
                  {pick !== it.answer && (
                    <p>
                      You chose {ROLE_NAME[pick]}, but here education is the {ROLE_NAME[it.answer]} ({it.answer}).
                    </p>
                  )}
                  <p>{it.why}</p>
                </Feedback>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

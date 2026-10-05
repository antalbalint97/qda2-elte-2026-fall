"use client";

import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/cn";
import { useState } from "react";

const RQS = {
  a: {
    rq: "Is age associated with trust in parliament?",
    x: "Age",
    y: "Trust in parliament",
    z: null as string | null,
    role: "X" as const,
  },
  b: {
    rq: "Is the association between education and internet use still present after controlling for age?",
    x: "Education",
    y: "Internet use",
    z: "Age",
    role: "Z" as const,
  },
  c: {
    rq: "Does the average age of residents differ between villages and cities?",
    x: "Settlement type",
    y: "Age",
    z: null,
    role: "Y" as const,
  },
};

function Node({ label, role, highlight }: { label: string; role: "X" | "Y" | "Z"; highlight: boolean }) {
  const color = { X: "border-rx bg-rx-soft", Y: "border-ry bg-ry-soft", Z: "border-rz bg-rz-soft" }[role];
  const text = { X: "text-rx", Y: "text-ry", Z: "text-rz" }[role];
  return (
    <div
      className={cn(
        "animate-fade-up flex min-w-[8.5rem] flex-col items-center rounded-xl border-2 px-3 py-2 text-center transition-all",
        color,
        highlight && "shadow-[0_0_0_4px_var(--accent-soft)]",
      )}
    >
      <span className={cn("font-mono text-xs font-bold", text)}>{role}</span>
      <span className="text-sm font-medium text-ink">{label}</span>
      {highlight && <span className="mt-0.5 rounded bg-surface px-1.5 text-[10px] font-medium text-muted">level: scale</span>}
    </div>
  );
}

export function RoleDemo() {
  const [k, setK] = useState<keyof typeof RQS>("a");
  const r = RQS[k];
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-ink">Same variable, three research questions</p>
        <Segmented
          label="Research question"
          value={k}
          onChange={setK}
          options={[
            { value: "a", label: "RQ 1" },
            { value: "b", label: "RQ 2" },
            { value: "c", label: "RQ 3" },
          ]}
        />
      </div>
      <p key={k} className="animate-fade-up mt-4 font-serif text-lg italic text-ink">“{r.rq}”</p>
      <div key={`d-${k}`} className="mt-6 flex flex-col items-center gap-3">
        {r.z && <Node label={r.z} role="Z" highlight={r.z === "Age"} />}
        {r.z && (
          <svg viewBox="0 0 20 20" className="h-5 w-5 text-rz" aria-hidden>
            <path d="M10 2v14m-4-4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
          </svg>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Node label={r.x} role="X" highlight={r.x === "Age"} />
          <svg viewBox="0 0 40 12" className="h-3 w-10 text-faint" aria-hidden>
            <path d="M0 6h36m-5-4l5 4-5 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <Node label={r.y} role="Y" highlight={r.y === "Age"} />
        </div>
      </div>
      <div className="mt-6 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
        <p className="text-muted">
          <span className="font-semibold text-ink">Role of age: </span>
          {r.role === "X" ? "independent variable (X)" : r.role === "Y" ? "dependent variable (Y)" : "control variable (Z)"}.
          It changed because the research question changed.
        </p>
        <p className="text-muted">
          <span className="font-semibold text-ink">Measurement level of age in years: </span>scale, in every question.
          It is a property of how age was measured.
        </p>
      </div>
    </div>
  );
}

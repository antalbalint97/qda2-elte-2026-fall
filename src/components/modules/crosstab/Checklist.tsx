"use client";

import { cn } from "@/lib/cn";
import { useState } from "react";

const ITEMS = [
  ["Valid categories", "Only substantive answer categories belong in the table."],
  ["Missing / nonresponse codes removed", "Don't know, refused, not applicable: define them as missing in SPSS."],
  ["Correct X and Y", "Decide from the research question which variable is independent and which is dependent."],
  ["Relevant percentage direction", "Percentages within categories of X: row % if X is in the rows, column % if X is in the columns."],
  ["Expected counts", "Check the footnote: at most 20% of cells with expected count < 5, none below 1."],
  ["Chi-square significance", "Is there evidence of an association in the population? Read Pearson Chi-Square, Asymptotic Sig."],
  ["Cramer's V", "How strong is the association?"],
  ["Substantive interpretation", "Describe the pattern in words with the key percentages."],
  ["Association ≠ causation", "Say ‘is associated with’, ‘differs between’, not ‘causes’ or ‘affects’."],
];

export function Checklist() {
  const [done, setDone] = useState<boolean[]>(ITEMS.map(() => false));
  const count = done.filter(Boolean).length;
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
        <p className="text-sm font-medium text-ink">Before interpreting a crosstab</p>
        <span className="font-mono text-xs text-faint">
          {count}/{ITEMS.length}
        </span>
      </div>
      <ol className="grid divide-y divide-line sm:grid-cols-1">
        {ITEMS.map(([t, d], i) => (
          <li key={t}>
            <label className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-surface-2/60 sm:px-6">
              <input
                type="checkbox"
                checked={done[i]}
                onChange={() => setDone((x) => x.map((v, k) => (k === i ? !v : v)))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="font-mono text-xs leading-5 text-faint">{i + 1}</span>
              <span className={cn("text-sm transition-opacity", done[i] && "opacity-50")}>
                <span className="font-medium text-ink">{t}</span>
                <span className="text-muted"> · {d}</span>
              </span>
            </label>
          </li>
        ))}
      </ol>
    </div>
  );
}

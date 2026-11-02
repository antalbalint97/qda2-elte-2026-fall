"use client";

import { useState } from "react";
import { INITIAL, FINAL, EIGENVALUES, VARIANCE } from "./data";

const stages = [
  { title: "Original five items", removed: [] as string[], note: "V43 is below the course's .25 communality rule. Remove it and rerun PCA." },
  { title: "After removing V43", removed: ["V43"], note: "The handout reports that V40 drops below .25 in the new run, but does not print this intermediate table. Do not reuse the five-item values as recalculated values." },
  { title: "Final three-item solution", removed: ["V43", "V40"], note: "V41, V42 and V44 pass the course's .25 criterion. The published three-item output is shown below." },
] as const;
export function PCAExplorer() {
  const [stage, setStage] = useState(0);
  const current = stages[stage];
  const items = stage === 2 ? FINAL : INITIAL;
  return <div className="space-y-5">
    <div className="flex flex-wrap gap-2" role="group" aria-label="PCA item-selection stage">
      {stages.map((s, i) => <button type="button" key={s.title} onClick={() => setStage(i)}
        aria-pressed={stage === i}
        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${stage === i ? "border-accent bg-surface-2 text-ink" : "border-line text-muted hover:text-ink"}`}>
        {i + 1}. {s.title}
      </button>)}
    </div>
    <div className="rounded-xl border border-line bg-surface p-5">
      <h3 className="text-lg font-semibold text-ink">Communalities (extraction)</h3>
      <p className="mt-2 text-sm text-muted">{current.note}</p>
      {stage === 1 ? <p className="mt-4 rounded-lg bg-surface-2 p-3 text-sm text-ink">The 4-item numerical table is not in the course PDF. V40 is reported to fail on rerunning. Select the final stage to see the documented result.</p> :
        <div className="mt-5 space-y-4">{items.map(item => {
          const removed = (current.removed as readonly string[]).includes(item.id);
          const pct = item.communality * 100;
          return <div key={item.id} className={removed ? "opacity-40" : ""}>
            <div className="flex justify-between gap-3 text-sm"><span className="text-ink"><strong>{item.id}</strong> · {item.name}</span><span className="font-mono tabular-nums text-ink">{item.communality.toFixed(3)}</span></div>
            <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              <span className="absolute inset-y-0 left-1/4 border-l border-dashed border-ink" />
            </div>
            <p className="mt-1 text-xs text-muted">{pct.toFixed(1)}% of this item&apos;s variance captured {pct < 25 ? "· below course threshold" : ""}</p>
          </div>;
        })}</div>}
      <p className="mt-4 text-xs text-muted">Dashed line: .25 course rule of thumb, not a universal cutoff. Source: course PDF pp. 10–11.</p>
      <div className="mt-5 flex gap-3">
        <button type="button" disabled={stage === 0} onClick={() => setStage(s => s - 1)} className="rounded-lg border border-line px-4 py-2 text-sm text-ink disabled:opacity-40">Previous</button>
        <button type="button" disabled={stage === 2} onClick={() => setStage(s => s + 1)} className="rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40">Next iteration →</button>
      </div>
    </div>
    {stage === 2 && <div className="space-y-5">
      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="text-lg font-semibold text-ink">Total Variance Explained</h3>
        <p className="mt-2 text-sm text-muted">Three standardized variables supply 3 units of total variance. PC1 retains 1.431 / 3 = 47.694%.</p>
        <div className="mt-5 space-y-4">{EIGENVALUES.map((e,i) => <div key={i} className="grid grid-cols-[5rem_1fr_5rem] items-center gap-3 text-sm">
          <span className="text-ink">PC{i+1}</span>
          <div className="h-7 overflow-hidden rounded bg-surface-2"><div className="flex h-full items-center bg-accent/75 px-2 font-mono text-xs text-ink" style={{width:`${VARIANCE[i]}%`}}>{VARIANCE[i].toFixed(1)}%</div></div>
          <span className="font-mono text-ink">{e.toFixed(3)}</span>
        </div>)}</div>
        <p className="mt-4 text-sm text-muted">Course guideline: below 33% reject; 33–50% consider carefully; 50% or more is preferable. At 47.7%, the handout retains PC1 after consideration.</p>
      </div>
      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="text-lg font-semibold text-ink">Component Matrix · PC1</h3>
        <div className="mt-4 space-y-3">{FINAL.map(x=><div key={x.id} className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm"><span className="text-ink">{x.id} · {x.name}</span><span className="font-mono font-semibold text-ink">{x.loading.toFixed(3)}</span></div>)}</div>
        <p className="mt-4 text-sm text-muted">Loadings are correlations between each standardized item and PC1. Their squares approximate the corresponding one-component communalities (rounding applies). They are not the coefficients used directly to compute saved regression scores.</p>
      </div>
    </div>}
  </div>;
}

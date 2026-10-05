"use client";

import { Formula, Frac } from "@/components/learning/Formula";
import { Slider } from "@/components/ui/Slider";
import { linspace, normalCdf, normalPdf } from "@/lib/stats";
import { useState } from "react";

function label(d: number) {
  if (d < 0.2) return "negligible";
  if (d < 0.5) return "small";
  if (d < 0.8) return "moderate";
  return "large";
}

export function EffectSize() {
  const [d, setD] = useState(0.5);
  const W = 520;
  const H = 150;
  const xs = linspace(-3.5, 4.7, 160);
  const sx = (x: number) => 10 + ((x + 3.5) / 8.2) * (W - 20);
  const sy = (y: number) => H - 22 - (y / 0.42) * (H - 34);
  const path = (mu: number) => xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)},${sy(normalPdf(x, mu)).toFixed(1)}`).join("");
  const overlap = 2 * normalCdf(-d / 2);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Two group distributions separated by Cohen's d = ${d.toFixed(2)}`}>
            <path d={path(0) + `L${sx(4.7)},${sy(0)}L${sx(-3.5)},${sy(0)}Z`} className="fill-rx/15 stroke-rx" strokeWidth={1.8} />
            <path d={path(d) + `L${sx(4.7)},${sy(0)}L${sx(-3.5)},${sy(0)}Z`} className="fill-ry/15 stroke-ry" strokeWidth={1.8} />
            <line x1={sx(0)} x2={sx(0)} y1={sy(0.4)} y2={sy(0)} className="stroke-rx" strokeDasharray="3 3" />
            <line x1={sx(d)} x2={sx(d)} y1={sy(0.4)} y2={sy(0)} className="stroke-ry" strokeDasharray="3 3" />
            <line x1={10} x2={W - 10} y1={sy(0)} y2={sy(0)} className="stroke-line-strong" />
            <text x={sx(-0.25)} y={sy(0.4)} textAnchor="end" className="fill-rx text-[12px] font-semibold">Group 1</text>
            <text x={sx(d + 0.25)} y={sy(0.4)} className="fill-ry text-[12px] font-semibold">Group 2</text>
          </svg>
          <Slider label="Cohen's d" value={d} min={0} max={1.5} step={0.05} onChange={setD} display={d.toFixed(2)} hint="Distance between the group means in standard-deviation units." />
        </div>
        <div className="space-y-3 self-start">
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="text-xs text-muted">d = {d.toFixed(2)}</p>
            <p className="font-serif text-2xl font-semibold capitalize text-ink">{label(d)}</p>
            <p className="mt-1 text-xs text-muted">The distributions overlap by about {Math.round(overlap * 100)}%.</p>
          </div>
          <div className="flex gap-1.5">
            {[0.2, 0.5, 0.8].map((v) => (
              <button key={v} type="button" onClick={() => setD(v)} className="flex-1 rounded-md border border-line py-1 font-mono text-xs text-ink hover:border-accent">
                {v.toFixed(1)}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-faint">Rules of thumb: ~0.2 small, ~0.5 moderate, ~0.8 large. Benchmarks, not laws: judge size in context.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Formula label="Cohen's d" legend={[["M₁, M₂", "the two group means"], ["sₚ", "pooled standard deviation"]]}>
          d = <Frac num="M₁ − M₂" den="sₚ" />
        </Formula>
        <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed text-muted">
          <p className="font-medium text-ink">Hedges&apos; g</p>
          <p className="mt-1">
            The same idea with a small-sample correction. d slightly overestimates the population effect in small samples;
            g shrinks it a little. With a few hundred respondents the two are practically identical.
          </p>
        </div>
      </div>
    </div>
  );
}

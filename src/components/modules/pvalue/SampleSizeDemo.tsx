"use client";

import { DistributionChart } from "@/components/viz/DistributionChart";
import { Slider } from "@/components/ui/Slider";
import { Term } from "@/components/ui/Term";
import { cn } from "@/lib/cn";
import { formatP, tPdf, tTwoTailedP } from "@/lib/stats";
import { useState } from "react";

const NS = [20, 50, 100, 250, 500, 1000];
const MU0 = 60;
const XBAR = 64;
const S = 20;

export function SampleSizeDemo() {
  const [i, setI] = useState(0);
  const n = NS[i];
  const se = S / Math.sqrt(n);
  const t = (XBAR - MU0) / se;
  const p = tTwoTailedP(t, n - 1);
  const d = XBAR - MU0;

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3 text-sm text-muted sm:px-6">
        <span className="font-medium text-ink">The same substantive effect every time:</span> sample mean 64 vs H₀ μ =
        60, standard deviation 20. Only the sample size changes.
      </div>
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <DistributionChart
            pdf={(x) => tPdf((x - MU0) / se, n - 1) / se}
            xMin={45}
            xMax={75}
            ticks={[45, 50, 55, 60, 65, 70, 75]}
            regions={[
              [-1e9, MU0 - d],
              [XBAR, 1e9],
            ]}
            markers={[
              { x: MU0, label: "H₀: μ = 60", tone: "muted", dashed: true, row: 1 },
              { x: XBAR, label: "observed mean 64", tone: "accent" },
            ]}
            xLabel="Sample means we would expect if H₀ were true (sampling distribution)"
            ariaLabel={`Sampling distribution under H0 for N = ${n}; p ${formatP(p)}`}
          />
          <div className="mt-4">
            <Slider
              label="Sample size N"
              value={i}
              min={0}
              max={NS.length - 1}
              step={1}
              onChange={setI}
              display={`N = ${n}`}
              valueText={`N = ${n}`}
              hint="Larger N → narrower sampling distribution → the same 4-point difference sits further out in the tail."
            />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 self-start text-sm lg:grid-cols-1">
          {[
            ["Difference", `${d.toFixed(1)} points`, "unchanged"],
            [<Term key="se" k="se">Standard error</Term>, se.toFixed(2), "s / √N"],
            ["t", t.toFixed(2), "difference / SE"],
            ["p (two-tailed)", formatP(p), p < 0.05 ? "significant at .05" : "not significant"],
          ].map(([k, v, note], j) => (
            <div key={j} className={cn("rounded-xl bg-surface-2 px-3.5 py-2.5", j === 3 && (p < 0.05 ? "ring-1 ring-pos/40" : "ring-1 ring-line-strong"))}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-mono text-lg font-semibold tabular-nums text-ink">{v}</dd>
              <dd className="text-[11px] text-faint">{note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

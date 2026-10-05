"use client";

import { DistributionChart } from "@/components/viz/DistributionChart";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { Term } from "@/components/ui/Term";
import { cn } from "@/lib/cn";
import { formatP, tCdf, tCritical, tPdf } from "@/lib/stats";
import { useState } from "react";

const DF = 24; // n = 25

export function PValueExplorer() {
  const [t, setT] = useState(2.2);
  const [tails, setTails] = useState<"two" | "one">("two");
  const p = tails === "two" ? 2 * (1 - tCdf(t, DF)) : 1 - tCdf(t, DF);
  const crit = tails === "two" ? tCritical(DF) : tCritical(DF, 0.1);
  const sig = p < 0.05;

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">H₀: μ = 60.</span> Sample of n = 25, sample mean 64. Where does the
          result fall if H₀ were true?
        </p>
        <Segmented
          size="sm"
          label="Test direction"
          value={tails}
          onChange={setTails}
          options={[
            { value: "two", label: "Two-tailed" },
            { value: "one", label: "One-tailed" },
          ]}
        />
      </div>
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <DistributionChart
            pdf={(x) => tPdf(x, DF)}
            xMin={-4.5}
            xMax={4.5}
            ticks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]}
            regions={tails === "two" ? [[-10, -t], [t, 10]] : [[t, 10]]}
            markers={[
              { x: crit, label: "α = .05 cut-off", tone: "muted", dashed: true, row: 1 },
              ...(tails === "two" ? [{ x: -crit, label: "α = .05 cut-off", tone: "muted" as const, dashed: true, row: 1 as const }] : []),
              { x: t, label: `observed t = ${t.toFixed(2)}`, tone: "accent" },
              ...(tails === "two" && t > 0.3 ? [{ x: -t, label: `−${t.toFixed(2)}`, tone: "accent" as const, dashed: true }] : []),
            ]}
            xLabel="t statistic under H₀ (t distribution, df = 24)"
            ariaLabel={`Null distribution with observed t of ${t.toFixed(2)}; shaded tail area p ${formatP(p)}`}
          />
          <div className="mt-4">
            <Slider
              label="Test statistic (observed t)"
              value={t}
              min={0}
              max={4}
              step={0.05}
              onChange={setT}
              display={t.toFixed(2)}
              hint="Move the observed result further from what H₀ predicts (0) and watch the shaded tail area shrink."
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl bg-surface-2 p-4">
            <p className="text-xs text-muted">Shaded area = p-value</p>
            <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-ink">p {formatP(p)}</p>
            <p className={cn("mt-2 text-sm font-medium", sig ? "text-pos" : "text-muted")}>
              {sig ? "p < .05: reject H₀ at α = .05" : "p ≥ .05: do not reject H₀"}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            {sig
              ? "If μ really were 60, results at least this far from 60 would be rare. The data are hard to reconcile with H₀."
              : "If μ really were 60, results this far from 60 would not be unusual. The data are statistically compatible with H₀."}
          </p>
          <p className="text-xs leading-relaxed text-faint">
            Two-tailed: extreme in <em>either</em> direction counts, so both tails are shaded. The dashed line marks the{" "}
            <Term k="alpha">α = .05</Term> boundary.
          </p>
        </div>
      </div>
    </div>
  );
}

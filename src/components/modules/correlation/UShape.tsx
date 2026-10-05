"use client";

import { Button } from "@/components/ui/Button";
import { Scatter } from "@/components/viz/Scatter";
import { noLeadingZero, pearson, spearman } from "@/lib/stats";
import { useMemo, useState } from "react";
import { monotonicSample, uShapeSample } from "./gen";

export function UShape() {
  const [show, setShow] = useState(false);
  const { xs, ys } = useMemo(() => uShapeSample(42, 150), []);
  const r = pearson(xs, ys);
  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <Scatter
        xs={xs}
        ys={ys}
        xLabel="Age"
        yLabel="Weekly working hours"
        curve={show ? (a) => 40 - 0.045 * (a - 49) ** 2 : undefined}
        ariaLabel={`Inverted U-shaped relationship between age and working hours, Pearson r = ${r.toFixed(2)}`}
      />
      <div className="space-y-4">
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="text-xs text-muted">Pearson&apos;s r</p>
          <p className="font-mono text-3xl font-semibold text-ink">r = {noLeadingZero(r)}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Working hours rise from young adulthood, peak in middle age and fall towards retirement. The relationship is
          obvious, yet r is close to zero because the rising and falling halves cancel out.
        </p>
        <Button size="sm" onClick={() => setShow((s) => !s)}>
          {show ? "Hide the pattern" : "Show the pattern"}
        </Button>
        <p className="border-l-2 border-accent pl-3 font-serif text-lg leading-snug text-ink">
          r = 0 means no linear association. It does not necessarily mean no association.
        </p>
      </div>
    </div>
  );
}

export function MonotonicExample() {
  const { xs, ys } = useMemo(() => monotonicSample(5, 120), []);
  const r = pearson(xs, ys);
  const rho = spearman(xs, ys);
  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <Scatter xs={xs} ys={ys} xLabel="X" yLabel="Y" tone="z" ariaLabel={`Monotonic curved relationship; Pearson ${r.toFixed(2)}, Spearman ${rho.toFixed(2)}`} />
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="text-xs text-muted">Pearson r</p>
            <p className="font-mono text-2xl font-semibold text-ink">{noLeadingZero(r)}</p>
          </div>
          <div className="rounded-xl bg-accent-soft p-3">
            <p className="text-xs text-muted">Spearman ρ</p>
            <p className="font-mono text-2xl font-semibold text-accent">{noLeadingZero(rho)}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Y always increases with X, but not along a straight line. Spearman works on ranks, so it only asks whether
          higher X goes with higher Y: it captures this monotonic pattern better than Pearson.
        </p>
      </div>
    </div>
  );
}

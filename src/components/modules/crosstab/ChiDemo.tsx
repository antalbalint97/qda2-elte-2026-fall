"use client";

import { Slider } from "@/components/ui/Slider";
import { chiSquareTest, formatP, noLeadingZero } from "@/lib/stats";
import { useState } from "react";
import { COUNTS } from "./data";

const CARDS = [
  { k: "Chi-square (χ²)", q: "Is there evidence of an association?", note: "Compares observed with expected counts. Grows with N." },
  { k: "Cramer's V", q: "How strong is the association?", note: "0 = none, 1 = perfect. Does not grow with N." },
  { k: "p-value", q: "Is the observed pattern statistically compatible with the null hypothesis of no association?", note: "Not an effect size." },
];

export function ChiDemo() {
  const [f, setF] = useState(0.5);
  const table = COUNTS.map((r) => r.map((c) => (c * f) / 10));
  const t = chiSquareTest(table);
  return (
    <div className="space-y-6">
      <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.k} className="bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{c.k}</p>
            <p className="mt-2 font-serif text-lg leading-snug text-ink">“{c.q}”</p>
            <p className="mt-2 text-sm text-muted">{c.note}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Same percentages, different sample size</p>
          <p className="text-sm leading-relaxed text-muted">
            The slider multiplies every cell of the age × language table by the same factor. The row percentages, and
            therefore the strength of the association, never change.
          </p>
          <Slider
            label="Sample size N"
            value={f}
            min={0.3}
            max={40}
            step={0.2}
            onChange={setF}
            display={`N = ${t.n.toLocaleString("en")}`}
          />
        </div>
        <dl className="grid grid-cols-3 gap-2 self-center">
          <div className="rounded-xl bg-surface-2 p-3">
            <dt className="text-[11px] text-muted">χ²({t.df})</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums text-ink">{t.chi2.toFixed(1)}</dd>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <dt className="text-[11px] text-muted">p</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums text-ink">{formatP(t.p).replace("= ", "")}</dd>
          </div>
          <div className="rounded-xl bg-accent-soft p-3">
            <dt className="text-[11px] text-muted">Cramer&apos;s V</dt>
            <dd className="font-mono text-xl font-semibold tabular-nums text-accent">{noLeadingZero(t.cramersV)}</dd>
          </div>
          <p className="col-span-3 text-xs text-faint">
            χ² and p react to N; V stays at about {noLeadingZero(t.cramersV)} because the pattern is the same.
          </p>
        </dl>
      </div>
    </div>
  );
}

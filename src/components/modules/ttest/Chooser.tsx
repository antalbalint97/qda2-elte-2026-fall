"use client";

import { cn } from "@/lib/cn";
import { useState } from "react";
import { IndependentDiagram, OneSampleDiagram, PairedDiagram } from "./Diagrams";

const OPTS = [
  {
    id: "one",
    letter: "A",
    q: "One sample mean to a known or theoretical value",
    test: "One-sample t-test",
    h0: "H₀: μ = μ₀ (e.g. the mean interview length is 60 minutes)",
    note: "One variable, one group, one fixed reference number.",
    Diagram: OneSampleDiagram,
  },
  {
    id: "ind",
    letter: "B",
    q: "Two independent groups",
    test: "Independent-samples t-test",
    h0: "H₀: μ₁ = μ₂ (the two population means are equal)",
    note: "Each respondent belongs to exactly one group. Needs a grouping variable.",
    Diagram: IndependentDiagram,
  },
  {
    id: "paired",
    letter: "C",
    q: "Two measurements from the same people / matched observations",
    test: "Paired-samples t-test",
    h0: "H₀: μ_d = 0 (the mean of the within-person differences is zero)",
    note: "The test works with each person's difference, so stable individual differences cancel out.",
    Diagram: PairedDiagram,
  },
] as const;

export function Chooser() {
  const [pick, setPick] = useState<(typeof OPTS)[number]["id"] | null>(null);
  const o = OPTS.find((x) => x.id === pick);
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3 sm:px-6">
        <p className="font-medium text-ink">What are you comparing?</p>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-3 sm:p-6">
        {OPTS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setPick(x.id)}
            aria-pressed={pick === x.id}
            className={cn(
              "rounded-xl border p-4 text-left transition-all",
              pick === x.id ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50",
              pick && pick !== x.id && "opacity-50",
            )}
          >
            <span className="font-mono text-xs text-faint">Option {x.letter}</span>
            <span className="mt-1 block text-sm font-medium text-ink">{x.q}</span>
          </button>
        ))}
      </div>
      {o && (
        <div key={o.id} className="animate-fade-up grid gap-6 border-t border-line p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
          <div>
            <p className="text-xs text-muted">Use the</p>
            <p className="font-serif text-2xl font-semibold text-accent">{o.test}</p>
            <p className="mt-2 font-mono text-sm text-ink">{o.h0}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{o.note}</p>
          </div>
          <o.Diagram />
        </div>
      )}
    </div>
  );
}

export function AllDiagrams() {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-3">
      {OPTS.map((x) => (
        <figure key={x.id} className="bg-surface p-4">
          <figcaption className="mb-2">
            <span className="block text-sm font-semibold text-ink">{x.test}</span>
            <span className="text-xs text-muted">{x.note}</span>
          </figcaption>
          <x.Diagram />
        </figure>
      ))}
    </div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import { useState, type ReactNode } from "react";
import { CausalDiagram } from "./CausalDiagram";
import { PATTERN_NAME, PATTERN_SUMMARY, type Pattern } from "./data";

type Q1 = "same" | "differs" | "weakens";
type Q2 = "ante" | "inter";

function Choice({
  active,
  dimmed,
  onClick,
  children,
  hint,
}: {
  active: boolean;
  dimmed: boolean;
  onClick: () => void;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-full w-full flex-col rounded-xl border p-3.5 text-left text-sm transition-all duration-300",
        active ? "border-accent bg-accent-soft shadow-sm" : "border-line bg-surface hover:border-accent/50",
        dimmed && "opacity-40",
      )}
    >
      <span className="font-medium text-ink">{children}</span>
      {hint && <span className="mt-1 text-xs text-muted">{hint}</span>}
    </button>
  );
}

function Connector({ on }: { on: boolean }) {
  return (
    <div className="flex justify-center py-1" aria-hidden>
      <div className={cn("h-6 w-px transition-colors duration-500", on ? "bg-accent" : "bg-line-strong")} />
    </div>
  );
}

function Result({ p }: { p: Pattern }) {
  return (
    <div className="animate-fade-up grid items-center gap-4 rounded-2xl border border-accent/30 bg-surface p-4 sm:grid-cols-[1fr_minmax(0,16rem)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Pattern</p>
        <p className="mt-1 font-serif text-2xl font-semibold text-ink">{PATTERN_NAME[p]}</p>
        <p className="mt-1 text-sm text-muted">{PATTERN_SUMMARY[p]}</p>
      </div>
      <CausalDiagram pattern={p} x="X" y="Y" z="Z" className="w-full" />
    </div>
  );
}

export function DecisionTree() {
  const [q1, setQ1] = useState<Q1 | null>(null);
  const [q2, setQ2] = useState<Q2 | null>(null);
  const result: Pattern | null =
    q1 === "same" ? "rep" : q1 === "differs" ? "spec" : q1 === "weakens" && q2 ? (q2 === "ante" ? "expl" : "interp") : null;

  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4 sm:p-6">
      <div className="rounded-xl border border-line bg-surface p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">Question 1</p>
        <p className="mt-1 font-medium text-ink">
          What happens to the X–Y relationship after controlling for Z?
        </p>
      </div>
      <Connector on={!!q1} />
      <div className="grid gap-2 sm:grid-cols-3">
        <Choice active={q1 === "same"} dimmed={!!q1 && q1 !== "same"} onClick={() => { setQ1("same"); setQ2(null); }} hint="partial tables ≈ zero-order table">
          A · Stays approximately the same
        </Choice>
        <Choice active={q1 === "differs"} dimmed={!!q1 && q1 !== "differs"} onClick={() => { setQ1("differs"); setQ2(null); }} hint="strong in one category of Z, weak in another">
          B · Differs substantially across groups
        </Choice>
        <Choice active={q1 === "weakens"} dimmed={!!q1 && q1 !== "weakens"} onClick={() => setQ1("weakens")} hint="small in every partial table">
          C · Weakens strongly or disappears
        </Choice>
      </div>
      {q1 === "weakens" && (
        <div className="animate-fade-up">
          <Connector on />
          <div className="rounded-xl border border-line bg-surface p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">Question 2</p>
            <p className="mt-1 font-medium text-ink">Where is Z in the causal / temporal sequence?</p>
          </div>
          <Connector on={!!q2} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Choice active={q2 === "ante"} dimmed={!!q2 && q2 !== "ante"} onClick={() => setQ2("ante")} hint="Z comes before X: antecedent">
              <span className="font-mono">Z → X → Y</span>
            </Choice>
            <Choice active={q2 === "inter"} dimmed={!!q2 && q2 !== "inter"} onClick={() => setQ2("inter")} hint="Z lies between X and Y: intervening">
              <span className="font-mono">X → Z → Y</span>
            </Choice>
          </div>
        </div>
      )}
      {result && (
        <>
          <Connector on />
          <Result p={result} />
        </>
      )}
      {q1 && (
        <div className="mt-4 text-center">
          <button type="button" className="text-xs font-medium text-muted hover:text-ink" onClick={() => { setQ1(null); setQ2(null); }}>
            Start over
          </button>
        </div>
      )}
    </div>
  );
}

export function PatternSummary() {
  const items: Array<{ p: Pattern; tables: string }> = [
    { p: "rep", tables: "partials ≈ zero-order" },
    { p: "spec", tables: "partials differ from each other" },
    { p: "expl", tables: "partials ≈ 0, Z antecedent" },
    { p: "interp", tables: "partials ≈ 0, Z intervening" },
  ];
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ p, tables }) => (
        <div key={p} className="bg-surface p-4">
          <p className="font-serif text-lg font-semibold text-ink">{PATTERN_NAME[p]}</p>
          <p className="mt-0.5 min-h-10 text-sm text-muted">{PATTERN_SUMMARY[p]}</p>
          <CausalDiagram pattern={p} x="X" y="Y" z="Z" className="mt-2 w-full" />
          <p className="mt-2 font-mono text-[11px] text-faint">{tables}</p>
        </div>
      ))}
    </div>
  );
}

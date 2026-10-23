"use client";

import { fmt } from "@/lib/engine/format";
import { cn } from "@/lib/cn";
import { createContext, useContext, useState, type ReactNode } from "react";
import { useLabContext } from "../shell/LabShell";

export type Tone = "ink" | "model" | "data" | "residual" | "explained" | "attention" | "pos" | "neg" | "muted";
const toneClass: Record<Tone, string> = {
  ink: "text-ink",
  model: "text-model-ink",
  data: "text-data-ink",
  residual: "text-residual-ink",
  explained: "text-explained-ink",
  attention: "text-attention-ink",
  pos: "text-pos",
  neg: "text-neg",
  muted: "text-muted",
};

export interface Readout {
  label: ReactNode;
  /** A number is formatted with `digits`; a string is shown as is; null/NaN shows "—". */
  value: number | string | null | undefined;
  digits?: number;
  tone?: Tone;
  /** Short note under the value (e.g. "undefined: no variation in X"). */
  note?: ReactNode;
  /** Formula key highlighted when this readout is hovered/focused. */
  hl?: string;
}

export function formatValue(v: Readout["value"], digits = 2): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  return fmt(v, digits);
}

/** Labelled numbers as a description list (screen readers read label/value pairs). */
export function StatisticReadout({ items, columns = 2, size = "md" }: { items: Readout[]; columns?: 1 | 2 | 3; size?: "sm" | "md" }) {
  const hl = useContext(HighlightCtx);
  return (
    <dl className={cn("grid gap-x-4 gap-y-2", columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {items.map((r, i) => (
        <div
          key={i}
          className={cn("min-w-0 rounded-md", r.hl && hl.key === r.hl && "bg-attention/15")}
          onMouseEnter={r.hl ? () => hl.set(r.hl!) : undefined}
          onMouseLeave={r.hl ? () => hl.set(null) : undefined}
        >
          <dt className="text-xs text-muted">{r.label}</dt>
          <dd className={cn("font-mono font-medium tabular-nums", size === "sm" ? "text-sm" : "text-lg", toneClass[r.tone ?? "ink"])}>{formatValue(r.value, r.digits)}</dd>
          {r.note && <dd className="text-[11px] leading-snug text-faint">{r.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Amber note for undefined statistics, assumptions and edge cases. */
export function LabNote({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "info" }) {
  return (
    <p className={cn("rounded-lg px-3 py-2 text-xs leading-relaxed", tone === "warn" ? "bg-warn-soft text-warn" : "bg-surface-2 text-muted")}>{children}</p>
  );
}

// ── Formula inspector ───────────────────────────────────────────────────────────

interface HighlightState {
  key: string | null;
  set: (k: string | null) => void;
}
const HighlightCtx = createContext<HighlightState>({ key: null, set: () => {} });

/** Shared highlight key between formula terms, readouts and the chart (hover/focus a term). */
export function useHighlight(): HighlightState {
  const [key, set] = useState<string | null>(null);
  return { key, set };
}
export function HighlightProvider({ value, children }: { value: HighlightState; children: ReactNode }) {
  return <HighlightCtx.Provider value={value}>{children}</HighlightCtx.Provider>;
}
export const useHighlightContext = () => useContext(HighlightCtx);

export type Term = string | { text: string; key: string; italic?: boolean };
export interface FormulaRow {
  terms: Term[];
  value?: string;
}

/**
 * Formulas whose terms can be inspected: hovering or focusing a keyed term highlights the matching
 * primitive in the chart and shows its explanation below.
 */
export function FormulaInspector({
  rows,
  explain,
  fallback,
  title,
}: {
  rows: FormulaRow[];
  explain: Record<string, string>;
  fallback: string;
  title?: string;
}) {
  const { t } = useLabContext();
  const hl = useContext(HighlightCtx);
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{title ?? t.formula}</h2>
      <div className="mt-2 flex flex-col gap-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-baseline gap-1 font-serif text-lg leading-snug tabular-nums text-ink sm:text-xl">
            {row.terms.map((tm, j) =>
              typeof tm === "string" ? (
                <span key={j} className="px-0.5">
                  {tm}
                </span>
              ) : (
                <span
                  key={j}
                  tabIndex={0}
                  role="button"
                  aria-pressed={hl.key === tm.key}
                  aria-describedby={hl.key === tm.key ? "formula-explanation" : undefined}
                  onMouseEnter={() => hl.set(tm.key)}
                  onMouseLeave={() => hl.set(null)}
                  onFocus={() => hl.set(tm.key)}
                  onBlur={() => hl.set(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      hl.set(hl.key === tm.key ? null : tm.key);
                    }
                  }}
                  className={cn(
                    "cursor-help rounded px-1 transition-colors",
                    tm.italic && "italic",
                    hl.key === tm.key ? "bg-attention/25 text-ink" : hl.key ? "text-faint" : "text-ink hover:bg-surface-2",
                  )}
                >
                  {tm.text}
                </span>
              ),
            )}
            {row.value !== undefined && <span className="ml-auto font-mono text-sm text-muted">{row.value}</span>}
          </div>
        ))}
      </div>
      <p id="formula-explanation" aria-live="polite" className={cn("mt-3 min-h-10 rounded-lg px-3 py-2 text-sm leading-relaxed text-ink", hl.key ? "bg-attention/10" : "bg-surface-2")}>
        {(hl.key && explain[hl.key]) || fallback}
      </p>
    </div>
  );
}

// ── Decomposition bar ──────────────────────────────────────────────────────────

export interface BarSegment {
  value: number;
  label: string;
  tone: "residual" | "explained" | "model" | "data" | "muted";
  emphasis?: boolean;
}
const segColor: Record<BarSegment["tone"], string> = {
  residual: "bg-residual",
  explained: "bg-explained",
  model: "bg-model",
  data: "bg-data",
  muted: "bg-line-strong",
};

/** A stacked bar whose width is `total / scale` of the container; segments are labelled for screen readers. */
export function DecompositionBar({ label, total, segments, scale, digits = 2 }: { label: string; total: number | null; segments: BarSegment[]; scale?: number; digits?: number }) {
  const denom = scale ?? total ?? 0;
  const width = denom > 0 && total !== null ? Math.min(100, (total / denom) * 100) : 0;
  const sum = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  return (
    <div>
      <div className="flex justify-between gap-2 text-xs text-muted">
        <span>{label}</span>
        <span className="font-mono">{formatValue(total, digits)}</span>
      </div>
      <div
        role="img"
        aria-label={`${label}: ${segments.map((s) => `${s.label} ${formatValue(s.value, digits)}`).join(", ")}`}
        className="mt-1 flex h-5 overflow-hidden rounded-md bg-surface-2 transition-[width] duration-500"
        style={{ width: `${width}%` }}
      >
        {segments.map((s, i) => (
          <div
            key={i}
            title={`${s.label} ${formatValue(s.value, digits)}`}
            className={cn("h-full border-r border-surface transition-[width] duration-500", segColor[s.tone], s.emphasis === false && "opacity-60")}
            style={{ width: sum > 0 ? `${(Math.max(0, s.value) / sum) * 100}%` : "0%" }}
          />
        ))}
      </div>
    </div>
  );
}

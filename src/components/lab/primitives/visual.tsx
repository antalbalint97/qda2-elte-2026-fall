"use client";

// Visual building blocks: the accessible figure wrapper (chart + text summary + data table), draggable
// SVG handles with keyboard equivalents, axes, and the Predict → Experiment → Explain → Transfer prompt.
import { cn } from "@/lib/cn";
import { useCallback, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { useLabContext } from "../shell/LabShell";
import { niceTicks, type Scale } from "./paths";

export interface DataTable {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}

/**
 * Wraps an SVG chart: the SVG is role="img" with a live text summary as its label, and the underlying
 * numbers are available as a real table behind a disclosure (no information in the chart only).
 */
export function AccessibleVisualization({
  summary,
  table,
  children,
  viewBox,
  svgRef,
  className,
  onPointerMove,
  onPointerUp,
  interactive = false,
  maxHeight,
}: {
  summary: string;
  table?: DataTable;
  children: ReactNode;
  viewBox: string;
  svgRef?: RefObject<SVGSVGElement | null>;
  className?: string;
  onPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
  /** Interactive charts contain focusable handles, so they use role="group" instead of "img". */
  interactive?: boolean;
  maxHeight?: string;
}) {
  const { t } = useLabContext();
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <figure className={cn("m-0", className)}>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        role={interactive ? "group" : "img"}
        aria-label={summary}
        className="block h-auto w-full touch-none select-none font-sans tabular-nums"
        style={maxHeight ? { maxHeight } : undefined}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </svg>
      <figcaption className="sr-only" aria-live="polite">
        {summary}
      </figcaption>
      {table && (
        <div className="mt-1">
          <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline">
            {t.dataTable}
          </button>
          {open && (
            <div id={id} role="region" aria-label={table.caption} tabIndex={0} className="mt-2 max-h-72 overflow-auto rounded-lg border border-line">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">{table.caption}</caption>
                <thead className="sticky top-0 bg-surface-2">
                  <tr>
                    {table.columns.map((c) => (
                      <th key={c} scope="col" className="px-2 py-1 font-medium text-muted">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      {r.map((c, j) => (
                        <td key={j} className="px-2 py-0.5 font-mono tabular-nums text-ink">
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

/** Converts a pointer event to SVG user coordinates. */
export function svgPoint(svg: SVGSVGElement | null, e: { clientX: number; clientY: number }): { x: number; y: number } | null {
  if (!svg) return null;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/**
 * Pointer-drag bookkeeping for an SVG: `start(id, e)` captures the pointer; `move` and `end` are wired to
 * the SVG element. The callback receives the drag id and the pointer in SVG coordinates.
 */
export function useSvgDrag<Id>(svgRef: RefObject<SVGSVGElement | null>, onDrag: (id: Id, p: { x: number; y: number }) => void) {
  const drag = useRef<Id | null>(null);
  const [dragging, setDragging] = useState(false);
  const cb = useRef(onDrag);
  cb.current = onDrag;
  const start = useCallback(
    (id: Id, e: React.PointerEvent) => {
      drag.current = id;
      setDragging(true);
      try {
        svgRef.current?.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best effort */
      }
    },
    [svgRef],
  );
  const move = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (drag.current === null) return;
      const p = svgPoint(svgRef.current, e);
      if (p) cb.current(drag.current, p);
    },
    [svgRef],
  );
  const end = useCallback(() => {
    drag.current = null;
    setDragging(false);
  }, []);
  return { start, move, end, dragging };
}

/** Arrow-key delta: ↑/→ = +step, ↓/← = −step, Shift ×5; null for other keys. */
export function arrowDelta(e: React.KeyboardEvent, step: number, axis: "vertical" | "horizontal" | "both" = "both"): number | null {
  const big = e.shiftKey ? 5 : 1;
  const up = axis !== "horizontal" && e.key === "ArrowUp";
  const down = axis !== "horizontal" && e.key === "ArrowDown";
  const right = axis !== "vertical" && e.key === "ArrowRight";
  const left = axis !== "vertical" && e.key === "ArrowLeft";
  if (up || right) return big * step;
  if (down || left) return -big * step;
  return null;
}

/**
 * A focusable, draggable SVG handle (role="slider"). Keyboard: arrows change the value by `step`
 * (Shift ×5), Home/End jump to the limits.
 */
export function DragHandle({
  x,
  y,
  label,
  value,
  min,
  max,
  step = 1,
  valueText,
  onStart,
  onValue,
  onFocus,
  r = 9,
  fill = "var(--data)",
  stroke = "var(--surface)",
  selected,
  children,
  className,
  cursor,
  disabled,
  orientation = "vertical",
}: {
  x: number;
  y: number;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueText?: string;
  onStart?: (e: React.PointerEvent) => void;
  onValue: (v: number) => void;
  onFocus?: () => void;
  r?: number;
  fill?: string;
  stroke?: string;
  selected?: boolean;
  children?: ReactNode;
  className?: string;
  cursor?: string;
  disabled?: boolean;
  /** Which arrow keys move the handle (both pairs always work for "both"). */
  orientation?: "vertical" | "horizontal" | "both";
}) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Home") {
      e.preventDefault();
      onValue(min);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      onValue(max);
      return;
    }
    const d = arrowDelta(e, step, orientation);
    if (d === null) return;
    e.preventDefault();
    onValue(Math.min(max, Math.max(min, value + d)));
  };
  return (
    <g
      className={cn("lab-handle", className)}
      style={{ transform: `translate(${x}px, ${y}px)`, cursor: disabled ? "default" : (cursor ?? (orientation === "horizontal" ? "ew-resize" : orientation === "both" ? "move" : "ns-resize")) }}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={valueText}
      aria-disabled={disabled || undefined}
      aria-orientation={orientation === "both" ? undefined : orientation}
      onPointerDown={disabled ? undefined : onStart}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <circle r={r} fill={fill} stroke={selected ? "var(--ink)" : stroke} strokeWidth={2} />
      {/* invisible halo enlarges the touch target to ≥ 44 px on screen */}
      <circle r={Math.max(r, 16)} fill="transparent" />
      {children}
    </g>
  );
}

/** Left y axis with gridlines; `x0..x1` is the plotting width. */
export function YAxis({ scale, lo, hi, x0, x1, format = (v) => String(v), count = 5, label }: { scale: Scale; lo: number; hi: number; x0: number; x1: number; format?: (v: number) => string; count?: number; label?: string }) {
  const ts = niceTicks(lo, hi, count);
  return (
    <g aria-hidden>
      {ts.map((v) => (
        <g key={v}>
          <line x1={x0} x2={x1} y1={scale(v)} y2={scale(v)} stroke="var(--grid)" />
          <text x={x0 - 6} y={scale(v) + 4} textAnchor="end" fontSize={11} fill="var(--faint)">
            {format(v)}
          </text>
        </g>
      ))}
      {label && (
        <text x={x0} y={scale(hi) - 12} fontSize={11} fill="var(--muted)" className="font-sans">
          {label}
        </text>
      )}
    </g>
  );
}

/** Bottom x axis with tick labels; `y` is the baseline pixel. */
export function XAxis({ scale, lo, hi, y, format = (v) => String(v), count = 6, label, labelX }: { scale: Scale; lo: number; hi: number; y: number; format?: (v: number) => string; count?: number; label?: string; labelX?: number }) {
  const ts = niceTicks(lo, hi, count);
  return (
    <g aria-hidden>
      <line x1={scale(lo)} x2={scale(hi)} y1={y} y2={y} stroke="var(--border-strong)" />
      {ts.map((v) => (
        <g key={v}>
          <line x1={scale(v)} x2={scale(v)} y1={y} y2={y + 4} stroke="var(--border-strong)" />
          <text x={scale(v)} y={y + 16} textAnchor="middle" fontSize={11} fill="var(--faint)">
            {format(v)}
          </text>
        </g>
      ))}
      {label && (
        <text x={labelX ?? scale(hi)} y={y + 32} textAnchor="end" fontSize={11} fill="var(--muted)" className="font-sans">
          {label}
        </text>
      )}
    </g>
  );
}

/** Predict → Experiment → Explain → Transfer card (Learn mode). The explanation is step 3 ("reveal"). */
export function ConceptPrompt({ steps, title }: { steps: [string, string, string, string]; title?: string }) {
  const { t } = useLabContext();
  const [i, setI] = useState(0);
  const labels = [t.predict, t.experiment, t.explain, t.transfer];
  return (
    <section aria-label={title ?? t.prompt} className="rounded-2xl bg-ink px-4 py-3 text-bg">
      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider opacity-80">
        <span className="font-mono">
          {title ?? t.prompt} · {labels[i]}
        </span>
        <span>{i + 1} / 4</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed" aria-live="polite">
        {steps[i]}
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0} className="rounded-md border border-white/30 px-3 py-1 text-xs disabled:opacity-40">
          {t.back}
        </button>
        <button type="button" onClick={() => setI((v) => (v === 3 ? 0 : v + 1))} className="rounded-md bg-model px-3 py-1 text-xs font-semibold text-[#0f1115]">
          {i === 3 ? t.again : i === 1 ? t.reveal : t.next}
        </button>
      </div>
    </section>
  );
}

/** One preset button per scenario; the active one is marked. */
export function PresetBar<T extends string>({ presets, active, onPick, label }: { presets: { id: T; label: string; note?: string }[]; active?: T; onPick: (id: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={active === p.id}
          title={p.note}
          onClick={() => onPick(p.id)}
          className={cn("rounded-full border px-2.5 py-1 text-xs", active === p.id ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink hover:bg-surface-2")}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

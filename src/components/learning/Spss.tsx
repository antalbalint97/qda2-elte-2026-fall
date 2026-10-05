"use client";

import { cn } from "@/lib/cn";
import { useState, type ReactNode } from "react";

/* ---------- "Before you open SPSS" prelude ---------- */

export function BeforeSpss({ items }: { items: Array<{ q: string; a: ReactNode }> }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">Before you open SPSS</p>
      <ol className="mt-3 space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="grid gap-1 text-sm sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-4">
            <span className="flex gap-2 text-muted">
              <span className="font-mono text-xs text-faint">{i + 1}</span>
              {it.q}
            </span>
            <span className="pl-5 text-ink sm:pl-0">{it.a}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Menu path ---------- */

export function MenuPath({ path }: { path: string[] }) {
  const [step, setStep] = useState(path.length - 1);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface px-1.5 py-1 font-mono text-[13px]"
        aria-label={`Menu path: ${path.join(", then ")}`}
      >
        {path.map((p, i) => (
          <span key={p} className="flex items-center gap-1">
            <span
              className={cn(
                "rounded px-2 py-1 transition-colors duration-300",
                i <= step ? "bg-accent text-accent-ink" : "text-faint",
              )}
            >
              {p}
            </span>
            {i < path.length - 1 && <span className="text-faint">›</span>}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="text-xs font-medium text-accent hover:underline"
        onClick={() => {
          setStep(-1);
          path.forEach((_, i) => setTimeout(() => setStep(i), 350 * (i + 1)));
        }}
      >
        Replay path
      </button>
    </div>
  );
}

/* ---------- Dialog mock (a stylised diagram, not a screenshot) ---------- */

export interface DialogField {
  label: string;
  values: string[];
  note: ReactNode;
  extra?: ReactNode;
}

export function SpssDialog({
  title,
  variables,
  fields,
  options = [],
  footerNote,
}: {
  title: string;
  variables: string[];
  fields: DialogField[];
  options?: Array<{ label: string; checked: boolean; note?: ReactNode }>;
  footerNote?: ReactNode;
}) {
  let n = 0;
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div
        className="overflow-hidden rounded-xl border border-line-strong bg-surface shadow-sm"
        aria-label={`Diagram of the ${title} dialog`}
        role="img"
      >
        <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          </span>
          <span className="text-xs font-medium text-muted">{title}</span>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1.3fr)] gap-3 p-3 text-xs">
          <div className="rounded-md border border-line bg-bg p-2">
            {variables.map((v) => (
              <div key={v} className="truncate px-1 py-0.5 font-mono text-muted">
                {v}
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-center gap-6 text-faint" aria-hidden>
            {fields.map((f) => (
              <span key={f.label} className="rounded border border-line px-1.5 py-0.5">
                ➜
              </span>
            ))}
          </div>
          <div className="space-y-2.5">
            {fields.map((f) => {
              n++;
              return (
                <div key={f.label}>
                  <div className="mb-1 flex items-center gap-1.5 text-muted">
                    <Badge n={n} />
                    {f.label}
                  </div>
                  <div className="min-h-7 rounded-md border border-accent/40 bg-accent-soft/50 p-1.5">
                    {f.values.map((v) => (
                      <div key={v} className="font-mono text-ink">
                        {v}
                      </div>
                    ))}
                  </div>
                  {f.extra}
                </div>
              );
            })}
          </div>
        </div>
        {options.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-3 py-2 text-xs text-muted">
            {options.map((o) => (
              <span key={o.label} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "grid h-3.5 w-3.5 place-items-center rounded-sm border",
                    o.checked ? "border-accent bg-accent text-accent-ink" : "border-line-strong",
                  )}
                >
                  {o.checked && (
                    <svg viewBox="0 0 10 10" className="h-2.5 w-2.5">
                      <path d="M2 5.2l2 2L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </svg>
                  )}
                </span>
                {o.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-line bg-surface-2 px-3 py-2 text-xs">
          {["Paste", "Reset", "Cancel"].map((b) => (
            <span key={b} className="rounded border border-line bg-surface px-2.5 py-1 text-muted">
              {b}
            </span>
          ))}
          <span className="rounded bg-accent px-3 py-1 font-medium text-accent-ink">OK</span>
        </div>
      </div>
      <ol className="space-y-3 text-sm">
        {fields.map((f, i) => (
          <li key={f.label} className="flex gap-3">
            <Badge n={i + 1} />
            <div>
              <p className="font-medium text-ink">{f.label}</p>
              <p className="mt-0.5 leading-relaxed text-muted">{f.note}</p>
            </div>
          </li>
        ))}
        {options
          .filter((o) => o.note)
          .map((o) => (
            <li key={o.label} className="flex gap-3">
              <span className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border border-line-strong" aria-hidden />
              <div>
                <p className="font-medium text-ink">{o.label}</p>
                <p className="mt-0.5 leading-relaxed text-muted">{o.note}</p>
              </div>
            </li>
          ))}
        {footerNote && <li className="pl-8 text-muted">{footerNote}</li>}
      </ol>
    </div>
  );
}

export function Badge({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent font-mono text-[10px] font-semibold text-accent-ink",
        className,
      )}
    >
      {n}
    </span>
  );
}

/* ---------- Output table mock ---------- */

export type OutputCell = string | { v: string; hl?: number; dim?: boolean; align?: "left" };

export function SpssOutput({
  title,
  groupHeaders,
  headers,
  rows,
  annotations,
  activeRow,
  footnote,
}: {
  title: string;
  groupHeaders?: Array<{ label: string; span: number }>;
  headers: string[];
  rows: OutputCell[][];
  annotations?: Record<number, ReactNode>;
  activeRow?: number;
  footnote?: ReactNode;
}) {
  return (
    <figure className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[34rem] border-collapse text-[13px]">
          <caption className="border-b border-line px-3 py-2 text-left font-semibold text-ink">{title}</caption>
          <thead>
            {groupHeaders && (
              <tr className="text-muted">
                {groupHeaders.map((g, i) => (
                  <th
                    key={i}
                    colSpan={g.span}
                    className="border-b border-line px-2 py-1.5 text-center text-xs font-medium"
                  >
                    {g.label}
                  </th>
                ))}
              </tr>
            )}
            <tr className="text-muted">
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className={cn("border-b border-line px-2.5 py-1.5 text-xs font-medium", i === 0 ? "text-left" : "text-right")}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr
                key={ri}
                className={cn(
                  "transition-colors",
                  activeRow === ri && "bg-accent-soft/60",
                )}
              >
                {r.map((c, ci) => {
                  const cell = typeof c === "string" ? { v: c } : c;
                  return (
                    <td
                      key={ci}
                      className={cn(
                        "border-b border-line px-2.5 py-1.5 font-mono tabular-nums",
                        ci === 0 || cell.align === "left" ? "text-left font-sans text-ink" : "text-right",
                        cell.dim ? "text-faint" : "text-ink",
                        activeRow !== undefined && activeRow !== ri && !cell.hl && "opacity-40",
                      )}
                    >
                      <span
                        className={cn(
                          "relative inline-flex items-center",
                          !!cell.hl && "rounded bg-warn-soft px-1 ring-1 ring-warn/40",
                        )}
                        aria-describedby={cell.hl ? `spss-annotation-${cell.hl}` : undefined}
                      >
                        {!!cell.hl && (
                          <span
                            aria-hidden
                            className="mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-warn"
                          />
                        )}
                        {cell.v}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {annotations && (
        <ol className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(annotations).map(([k, v]) => (
            <li key={k} id={`spss-annotation-${k}`} className="flex gap-2.5">
              <Badge n={Number(k)} className="mt-0.5 bg-warn text-white" />
              <span className="leading-relaxed text-muted">{v}</span>
            </li>
          ))}
        </ol>
      )}
      {footnote && <figcaption className="text-xs text-faint">{footnote}</figcaption>}
    </figure>
  );
}

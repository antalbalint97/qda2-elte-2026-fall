"use client";

import { Segmented } from "@/components/ui/Segmented";
import { Role } from "@/components/ui/Role";
import { Term } from "@/components/ui/Term";
import { cn } from "@/lib/cn";
import { chiSquareTest } from "@/lib/stats";
import { useState } from "react";
import { COUNTS, X_CATS, Y_CATS } from "./data";

type Mode = "count" | "row" | "col" | "expected";

const BANDS = ["bg-rx/10", "bg-rx/20", "bg-rx/30"];
const BAND_COLS = ["bg-accent/10", "bg-accent/20"];

export function CrosstabViz() {
  const [mode, setMode] = useState<Mode>("row");
  const [xInRows, setXInRows] = useState(true);

  // Build the displayed table: rows/cols depend on orientation.
  const table = xInRows ? COUNTS : COUNTS[0].map((_, j) => COUNTS.map((r) => r[j]));
  const rowLabels = xInRows ? X_CATS : Y_CATS;
  const colLabels = xInRows ? Y_CATS : X_CATS;
  const rowVar = xInRows ? { r: "X" as const, name: "Age group" } : { r: "Y" as const, name: "Speaks a foreign language" };
  const colVar = xInRows ? { r: "Y" as const, name: "Speaks a foreign language" } : { r: "X" as const, name: "Age group" };
  const rowTot = table.map((r) => r.reduce((a, b) => a + b, 0));
  const colTot = table[0].map((_, j) => table.reduce((a, r) => a + r[j], 0));
  const n = rowTot.reduce((a, b) => a + b, 0);
  const { expected } = chiSquareTest(table);

  const val = (i: number, j: number) => {
    const c = table[i][j];
    if (mode === "count") return String(c);
    if (mode === "expected") return expected[i][j].toFixed(1);
    if (mode === "row") return ((c / rowTot[i]) * 100).toFixed(1) + "%";
    return ((c / colTot[j]) * 100).toFixed(1) + "%";
  };
  const frac = (i: number, j: number) =>
    mode === "row" ? table[i][j] / rowTot[i] : mode === "col" ? table[i][j] / colTot[j] : table[i][j] / n;

  const withinX = (mode === "row" && xInRows) || (mode === "col" && !xInRows);
  const withinY = (mode === "row" && !xInRows) || (mode === "col" && xInRows);

  const cellBg = (i: number, j: number) =>
    mode === "row" ? BANDS[i % 3] : mode === "col" ? BAND_COLS[j % 2] : "";

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Segmented
          label="Cell contents"
          value={mode}
          onChange={setMode}
          options={[
            { value: "count", label: "Count" },
            { value: "row", label: "Row %" },
            { value: "col", label: "Column %" },
            { value: "expected", label: "Expected" },
          ]}
        />
        <button
          type="button"
          onClick={() => setXInRows((v) => !v)}
          className="inline-flex items-center gap-2 self-start text-sm font-medium text-muted hover:text-ink sm:self-auto"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
            <path d="M3 5h9l-2-2M13 11H4l2 2" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          Transpose: put X in the {xInRows ? "columns" : "rows"}
        </button>
      </div>

      <div className="overflow-x-auto p-4 sm:p-6">
        <table className="w-full min-w-[30rem] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th />
              <th colSpan={colLabels.length} className="pb-1 text-center text-xs font-medium">
                <Role r={colVar.r}>{colVar.name}</Role>
              </th>
              <th />
            </tr>
            <tr>
              <th className="text-left text-xs font-medium">
                <Role r={rowVar.r}>{rowVar.name}</Role>
              </th>
              {colLabels.map((c) => (
                <th key={c} scope="col" className="px-2 py-1 text-right font-mono text-xs font-medium text-muted">
                  {c}
                </th>
              ))}
              <th scope="col" className="px-2 py-1 text-right text-xs font-medium text-muted">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {table.map((r, i) => (
              <tr key={i}>
                <th scope="row" className="pr-3 text-left font-mono text-xs font-medium text-ink">
                  {rowLabels[i]}
                </th>
                {r.map((_, j) => (
                  <td key={j} className={cn("relative rounded-md px-3 py-2.5 text-right transition-colors duration-500", cellBg(i, j))}>
                    {(mode === "row" || mode === "col") && (
                      <span
                        className="absolute bottom-1 left-2 h-1 rounded-full bg-ink/25 transition-all duration-500"
                        style={{ width: `calc(${frac(i, j) * 100}% - 16px)` }}
                        aria-hidden
                      />
                    )}
                    <span className="font-mono tabular-nums text-ink">{val(i, j)}</span>
                  </td>
                ))}
                <td
                  className={cn(
                    "rounded-md px-3 py-2.5 text-right font-mono tabular-nums transition-colors duration-500",
                    mode === "row" ? cn(BANDS[i % 3], "font-semibold text-ink ring-1 ring-inset ring-rx/40") : "text-muted",
                  )}
                >
                  {mode === "row" ? "100%" : mode === "col" ? ((rowTot[i] / n) * 100).toFixed(1) + "%" : rowTot[i]}
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="pr-3 text-left text-xs font-medium text-muted">
                Total
              </th>
              {colTot.map((t, j) => (
                <td
                  key={j}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-right font-mono tabular-nums transition-colors duration-500",
                    mode === "col" ? cn(BAND_COLS[j % 2], "font-semibold text-ink ring-1 ring-inset ring-accent/40") : "text-muted",
                  )}
                >
                  {mode === "col" ? "100%" : mode === "row" ? ((t / n) * 100).toFixed(1) + "%" : t}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right font-mono text-muted">{mode === "row" || mode === "col" ? "100%" : n}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 border-t border-line px-4 py-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center sm:px-6" aria-live="polite">
        <p className="leading-relaxed text-muted">
          {mode === "count" && "Raw counts. Groups have different sizes, so counts cannot be compared directly."}
          {mode === "expected" && (
            <>
              <Term k="expected">Expected counts</Term>: what each cell would contain if age and language skills were
              independent. χ² measures how far the observed counts are from these.
            </>
          )}
          {(mode === "row" || mode === "col") && (
            <>
              <strong className="text-ink">
                <Term k="denominator">Denominator</Term>: each {mode === "row" ? "row" : "column"} total
              </strong>{" "}
              ({mode === "row" ? "every row" : "every column"} sums to 100%), i.e. each category of{" "}
              {withinX ? "age group (X)" : "language skill (Y)"}.
            </>
          )}
        </p>
        {(mode === "row" || mode === "col") && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              withinX ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg",
            )}
          >
            {withinX ? "Compares Y within X ✓" : "Compares X within Y ✗"}
          </span>
        )}
      </div>
      {withinX && (
        <p className="border-t border-line px-4 py-3 text-sm text-ink sm:px-6">
          Reading: {((COUNTS[0][0] / 500) * 100).toFixed(1)}% of 18–34-year-olds speak a foreign language, compared with{" "}
          {((COUNTS[2][0] / 500) * 100).toFixed(1)}% of those aged 55+. Younger age groups are more likely to speak a
          foreign language (an association, not a causal claim).
        </p>
      )}
      {withinY && (
        <p className="border-t border-line px-4 py-3 text-sm text-muted sm:px-6">
          These percentages show the age composition of speakers and non-speakers. True, but it answers a different
          question (“how old are the people who speak a language?”), not whether language skills differ by age.
        </p>
      )}
    </div>
  );
}

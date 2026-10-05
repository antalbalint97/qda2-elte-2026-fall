"use client";

import { Role } from "@/components/ui/Role";
import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/cn";
import { useState } from "react";

type Mode = "count" | "row" | "col";

/** Interactive 2 × 2 crosstab with X in the rows. Shows which total is the denominator in each mode. */
export function Crosstab2x2({
  table,
  xName,
  yName,
  xCats,
  yCats,
}: {
  table: number[][];
  xName: string;
  yName: string;
  xCats: [string, string];
  yCats: [string, string];
}) {
  const [mode, setMode] = useState<Mode>("count");
  const rowTot = table.map((r) => r[0] + r[1]);
  const colTot = [0, 1].map((j) => table[0][j] + table[1][j]);
  const n = rowTot[0] + rowTot[1];
  const denom = (i: number, j: number) => (mode === "row" ? rowTot[i] : colTot[j]);

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Segmented
          label="Cell contents"
          value={mode}
          onChange={setMode}
          options={[
            { value: "count", label: "Counts" },
            { value: "row", label: "Row %" },
            { value: "col", label: "Column %" },
          ]}
        />
        <p className="text-xs text-faint">X in the rows, Y in the columns</p>
      </div>
      <div className="overflow-x-auto p-4 sm:p-6">
        <table className="w-full min-w-[28rem] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th />
              <th colSpan={2} className="pb-1 text-center text-xs font-medium">
                <Role r="Y">{yName}</Role>
              </th>
              <th />
            </tr>
            <tr>
              <th className="text-left text-xs font-medium">
                <Role r="X">{xName}</Role>
              </th>
              {yCats.map((c) => (
                <th key={c} scope="col" className="px-2 py-1 text-right text-xs font-medium text-muted">
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
                <th scope="row" className="pr-3 text-left text-xs font-medium text-ink">
                  {xCats[i]}
                </th>
                {r.map((c, j) => (
                  <td
                    key={j}
                    className={cn(
                      "rounded-md px-3 py-2 text-right transition-colors duration-500",
                      mode === "row" && "bg-rx/10",
                      mode === "col" && "bg-ry/10",
                      mode !== "count" && j === 1 && "ring-1 ring-inset ring-accent/40",
                    )}
                  >
                    <span className="block font-mono tabular-nums text-ink">
                      {mode === "count" ? c : ((c / denom(i, j)) * 100).toFixed(1) + "%"}
                    </span>
                    {mode !== "count" && (
                      <span className="block font-mono text-[10px] text-faint">
                        {c} ÷ {denom(i, j)}
                      </span>
                    )}
                  </td>
                ))}
                <td
                  className={cn(
                    "rounded-md px-3 py-2 text-right font-mono tabular-nums transition-colors duration-500",
                    mode === "row" ? "bg-rx/20 font-semibold text-ink ring-2 ring-inset ring-rx/60" : "text-muted",
                  )}
                >
                  {mode === "row" ? (
                    <>
                      <span className="block">{rowTot[i]}</span>
                      <span className="block text-[10px] font-normal text-rx">denominator</span>
                    </>
                  ) : mode === "col" ? (
                    ((rowTot[i] / n) * 100).toFixed(1) + "%"
                  ) : (
                    rowTot[i]
                  )}
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
                    "rounded-md px-3 py-2 text-right font-mono tabular-nums transition-colors duration-500",
                    mode === "col" ? "bg-ry/20 font-semibold text-ink ring-2 ring-inset ring-ry/60" : "text-muted",
                  )}
                >
                  {mode === "col" ? (
                    <>
                      <span className="block">{t}</span>
                      <span className="block text-[10px] font-normal text-ry">denominator</span>
                    </>
                  ) : mode === "row" ? (
                    ((t / n) * 100).toFixed(1) + "%"
                  ) : (
                    t
                  )}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-mono text-muted">{n}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="border-t border-line px-4 py-3 text-sm leading-relaxed sm:px-6" aria-live="polite">
        {mode === "count" && (
          <p className="text-muted">
            Raw counts. The two periods contain different numbers of episodes ({rowTot[0]} vs {rowTot[1]}), so counts alone cannot be compared.
          </p>
        )}
        {mode === "row" && (
          <p className="text-ink">
            <span className="mr-2 rounded-full bg-pos-soft px-2 py-0.5 text-xs font-semibold text-pos">within X ✓</span>
            Denominator = the episodes in each period. {((table[0][1] / rowTot[0]) * 100).toFixed(1)}% of {xCats[0].toLowerCase()} episodes vs{" "}
            {((table[1][1] / rowTot[1]) * 100).toFixed(1)}% of {xCats[1].toLowerCase()} episodes contain major violence. This answers the research question.
          </p>
        )}
        {mode === "col" && (
          <p className="text-muted">
            <span className="mr-2 rounded-full bg-neg-soft px-2 py-0.5 text-xs font-semibold text-neg">within Y ✗</span>
            Denominator = the episodes with (or without) major violence. {((table[1][1] / colTot[1]) * 100).toFixed(1)}% of violent episodes are from
            later seasons: true, but it answers “where do violent episodes come from?”, not “are later seasons more likely to be violent?”.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { mean } from "@/lib/stats";
import { useState } from "react";
import {
  ABSOLUTE,
  categorise,
  categoryCounts,
  cumulative,
  fmt,
  INDEX,
  percentileCuts,
  relativeCuts,
  type CutMethod,
  type Cuts,
} from "./data";

const FILLS = ["var(--surface-3)", "color-mix(in srgb, var(--accent) 35%, var(--surface))", "var(--accent)"];
const ROWS = cumulative(INDEX);
const MEAN = mean(INDEX);
const X = (v: number) => 34 + (v - 1) * 70;
const BAR_W = 12;
const H = 150;
const MAX = Math.max(...ROWS.map((r) => r.count));

function cutsFor(method: CutMethod, h: number): Cuts {
  if (method === "absolute") return ABSOLUTE;
  if (method === "relative") return relativeCuts(INDEX, h);
  return percentileCuts(INDEX);
}

const range = (cuts: Cuts, c: number) =>
  c === 0 ? `1.00 – ${fmt(cuts.upper[0])}` : c === 1 ? `${fmt(cuts.upper[0] + 0.01)} – ${fmt(cuts.upper[1])}` : `${fmt(cuts.upper[1] + 0.01)} – 5.00`;

/** Histogram of the final index with three categories drawn by three different rules. */
export function IndexCutter() {
  const [method, setMethod] = useState<CutMethod>("absolute");
  const [h, setH] = useState(0.5);
  const cuts = cutsFor(method, h);
  const counts = categoryCounts(INDEX, cuts);
  const other = method === "absolute" ? relativeCuts(INDEX, 0.5) : ABSOLUTE;
  const moved = INDEX.filter((v) => categorise(v, cuts) !== categorise(v, other)).length;
  const pc = percentileCuts(INDEX);
  // the index moves in steps of 0.2: draw each limit halfway between the last value below it and the next one
  const boundary = (u: number) => X(Math.floor(u * 5 + 1e-9) / 5 + 0.1);

  return (
    <Panel>
      <h3 className="font-serif text-xl font-semibold text-ink">Three ways to cut the same index</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        The final index (mean of T1–T5, T3 and T5 reversed) for the 120 respondents. It runs from 1 to 5 in steps of
        0.2. Sample mean: {fmt(MEAN)}. Choose how to turn it into three categories.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-6">
        <Segmented<CutMethod>
          label="Categorisation rule"
          value={method}
          onChange={setMethod}
          options={[
            { value: "absolute", label: "Absolute" },
            { value: "relative", label: "Relative (mean ± h)" },
            { value: "percentile", label: "Percentiles" },
          ]}
        />
        {method === "relative" && (
          <div className="w-56">
            <Slider
              label="Half-width h"
              value={h}
              min={0.2}
              max={1}
              step={0.1}
              onChange={setH}
              display={`± ${fmt(h, 1)}`}
              valueText={`plus or minus ${fmt(h, 1)}`}
            />
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 340 ${method === "percentile" ? 215 : 172}`}
        className="mt-5 w-full max-w-2xl"
        role="img"
        aria-label={`Histogram of the index with ${method} categories: ${cuts.labels.map((l, i) => `${l} ${counts[i]}`).join("; ")}.`}
      >
        {/* neutral point and sample mean */}
        <line x1={X(3)} x2={X(3)} y1={14} y2={H + 4} stroke="var(--muted)" strokeDasharray="2 3" />
        <text x={X(3)} y={10} textAnchor="middle" fontSize="9" fill="var(--muted)">
          neutral 3
        </text>
        <line x1={X(MEAN)} x2={X(MEAN)} y1={22} y2={H + 4} stroke="var(--ink)" />
        <text x={X(MEAN) + 3} y={30} fontSize="9" fill="var(--ink)">
          mean {fmt(MEAN)}
        </text>
        {ROWS.map((r) => (
          <rect
            key={r.value}
            x={X(r.value) - BAR_W / 2}
            y={H - (r.count / MAX) * (H - 40)}
            width={BAR_W}
            height={(r.count / MAX) * (H - 40)}
            rx={1.5}
            fill={FILLS[categorise(r.value, cuts)]}
            stroke="var(--border-strong)"
            strokeWidth={0.5}
            style={{ transition: "fill 300ms" }}
          />
        ))}
        {cuts.upper.map((u, i) => (
          <line key={i} x1={boundary(u)} x2={boundary(u)} y1={36} y2={H + 4} stroke="var(--warn)" strokeWidth={2} />
        ))}
        <line x1={X(1)} x2={X(5)} y1={H} y2={H} stroke="var(--border-strong)" />
        {[1, 2, 3, 4, 5].map((v) => (
          <text key={v} x={X(v)} y={H + 16} textAnchor="middle" fontSize="10" fill="var(--muted)">
            {v}
          </text>
        ))}
        {method === "percentile" &&
          ROWS.map((r, i) => {
            const prev = i ? ROWS[i - 1] : null;
            return (
              <g key={r.value}>
                {prev && <line x1={X(prev.value)} x2={X(r.value)} y1={H + 54 - prev.cum * 0.3} y2={H + 54 - prev.cum * 0.3} stroke="var(--accent)" />}
                <circle cx={X(r.value)} cy={H + 54 - r.cum * 0.3} r={1.8} fill="var(--accent)" />
              </g>
            );
          })}
        {method === "percentile" &&
          [100 / 3, 200 / 3].map((t) => (
            <g key={t}>
              <line x1={X(1)} x2={X(5)} y1={H + 54 - t * 0.3} y2={H + 54 - t * 0.3} stroke="var(--faint)" strokeDasharray="2 2" />
              <text x={X(5) + 4} y={H + 57 - t * 0.3} fontSize="8" fill="var(--muted)">
                {t < 50 ? "33.3%" : "66.7%"}
              </text>
            </g>
          ))}
      </svg>
      {method === "percentile" && (
        <p className="text-xs text-muted">
          Below the axis: the Cumulative Percent column of the SPSS Frequencies table as a staircase, with dashed lines at
          33.3% and 66.7%. The nearest steps are {fmt(pc.reached[0], 1)}% (at {fmt(pc.upper[0], 1)}) and{" "}
          {fmt(pc.reached[1], 1)}% (at {fmt(pc.upper[1], 1)}): many respondents share each value, so the thirds cannot be
          exactly equal.
        </p>
      )}

      <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Categories and their sizes">
        <table className="w-full min-w-[28rem] text-left text-sm tabular-nums">
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">Category</th>
              <th scope="col" className="pr-3 font-medium">Recode range</th>
              <th scope="col" className="pr-3 font-medium">n</th>
              <th scope="col" className="font-medium">%</th>
            </tr>
          </thead>
          <tbody className="text-ink">
            {cuts.labels.map((l, c) => (
              <tr key={c} className="border-b border-line">
                <th scope="row" className="py-2 pr-3 text-left font-normal">
                  <span className="mr-2 inline-block h-3 w-3 rounded-sm border border-line-strong align-middle" style={{ background: FILLS[c] }} aria-hidden />
                  {c + 1} {l}
                </th>
                <td className="pr-3 font-mono text-xs">{range(cuts, c)}</td>
                <td className="pr-3">{counts[c]}</td>
                <td>{fmt((counts[c] / INDEX.length) * 100, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p role="status" className="mt-4 text-sm text-muted">
        {method === "absolute" &&
          `Absolute limits come from the meaning of the scale: the middle category is "around the neutral answer 3", whatever the sample thinks. Compared with relative limits (mean ± 0.5), ${moved} of 120 respondents would land in a different category.`}
        {method === "relative" &&
          `Relative limits come from this sample: the middle category is "close to the average respondent". Here the average already leans trusting, so "around the average" means mildly agreeing, not neutral. ${moved} of 120 respondents are categorised differently than with the absolute limits.`}
        {method === "percentile" &&
          `Percentile limits make the groups roughly equal in size. They say only where someone stands relative to others ("highest third"), never whether they trust science in absolute terms.`}
      </p>
    </Panel>
  );
}

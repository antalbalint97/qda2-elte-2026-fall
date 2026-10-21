"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Button } from "@/components/ui/Button";
import { mean, median, sd } from "@/lib/stats";
import { useState } from "react";
import { fmt, TRUST_GROUPS, type TrustGroup } from "./data";

const X = (v: number) => 24 + v * 27.2;
const BASE = 120;

function DotStack({ g, reveal, band }: { g: TrustGroup; reveal: boolean; band: boolean }) {
  const m = mean(g.values);
  const s = sd(g.values);
  const counts = new Map<number, number>();
  return (
    <svg
      viewBox="0 0 320 180"
      className="w-full"
      role="img"
      aria-label={
        reveal
          ? `${g.label}: 20 answers on a 0 to 10 scale; ${g.shape}. Mean ${fmt(m)}, median ${fmt(median(g.values))}, standard deviation ${fmt(s)}.`
          : `${g.label}: data hidden. Mean ${fmt(m)}, median ${fmt(median(g.values))}.`
      }
    >
      {band && reveal && (
        <g>
          <rect x={X(m - s)} y={18} width={X(m + s) - X(m - s)} height={BASE - 10} className="fill-ry/15" />
          <text x={X(m - s)} y={12} fontSize="11" fill="var(--muted)">
            ±1 SD: {fmt(m - s)} to {fmt(m + s)}
          </text>
        </g>
      )}
      <line x1={X(0)} x2={X(10)} y1={BASE + 8} y2={BASE + 8} stroke="var(--border-strong)" />
      {Array.from({ length: 11 }, (_, v) => (
        <text key={v} x={X(v)} y={BASE + 34} textAnchor="middle" fontSize="11" fill="var(--muted)">
          {v}
        </text>
      ))}
      {reveal &&
        g.values.map((v, i) => {
          const k = counts.get(v) ?? 0;
          counts.set(v, k + 1);
          return <circle key={i} cx={X(v)} cy={BASE - k * 10.5} r={4.6} fill="var(--y)" opacity={0.85} />;
        })}
      {/* the mean is the balance point: a fulcrum under the axis */}
      <path d={`M${X(m)} ${BASE + 9} l-7 11 h14 z`} fill="var(--ink)" />
      <line x1={X(median(g.values))} x2={X(median(g.values))} y1={18} y2={BASE + 8} stroke="var(--ink)" strokeDasharray="4 3" />
      <text x={X(median(g.values)) + 9} y={30} fontSize="11" fill="var(--ink)">
        median
      </text>
      <text x={X(m) + 10} y={BASE + 54} fontSize="11" fill="var(--ink)">
        ▲ mean (balance point)
      </text>
    </svg>
  );
}

export function SameMean() {
  const [reveal, setReveal] = useState(false);
  const [band, setBand] = useState(false);
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-ink">Four groups, one average</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Synthetic data: four groups of 20 respondents rate their trust in parliament from 0 to 10. A report says
            &ldquo;average trust: 5.0, median 5&rdquo; for every group. Are the groups alike?
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={reveal ? "secondary" : "primary"} size="sm" onClick={() => setReveal((r) => !r)}>
            {reveal ? "Hide the answers" : "Reveal the answers"}
          </Button>
          <Button size="sm" disabled={!reveal} onClick={() => setBand((b) => !b)}>
            {band ? "Hide ±1 SD" : "Show ±1 SD"}
          </Button>
        </div>
      </div>
      <div className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {TRUST_GROUPS.map((g) => (
          <figure key={g.id}>
            <figcaption className="text-sm font-medium text-ink">{g.label}</figcaption>
            <DotStack g={g} reveal={reveal} band={band} />
          </figure>
        ))}
      </div>
      <p className="text-xs text-muted">
        Each dot is one respondent. ▲ marks the mean, the point where the dots would balance; the dashed line marks the
        median. {band && "The shaded band runs from one standard deviation below the mean to one above it."}
      </p>
      <div className="mt-5 overflow-x-auto" tabIndex={0} role="region" aria-label="Summary statistics of the four groups">
        <table className="w-full min-w-[30rem] border-collapse text-left text-sm tabular-nums">
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">Group</th>
              <th scope="col" className="pr-3 font-medium">Mean</th>
              <th scope="col" className="pr-3 font-medium">Median</th>
              <th scope="col" className="pr-3 font-medium">SD</th>
              <th scope="col" className="pr-3 font-medium">Min</th>
              <th scope="col" className="font-medium">Max</th>
            </tr>
          </thead>
          <tbody className="text-ink">
            {TRUST_GROUPS.map((g) => (
              <tr key={g.id} className="border-b border-line">
                <th scope="row" className="py-2 pr-3 text-left font-normal">{g.label}</th>
                <td className="pr-3">{fmt(mean(g.values))}</td>
                <td className="pr-3">{fmt(median(g.values))}</td>
                <td className="pr-3">{reveal ? fmt(sd(g.values), 2) : "?"}</td>
                <td className="pr-3">{reveal ? Math.min(...g.values) : "?"}</td>
                <td>{reveal ? Math.max(...g.values) : "?"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reveal && (
        <p className="mt-4 text-sm text-muted">
          Same centre, four different stories: agreement, a wide range of views, two opposed camps, and a few
          respondents far above everyone else. The mean and median answer &ldquo;where is the middle?&rdquo;. They
          cannot answer &ldquo;how much do people differ?&rdquo; or &ldquo;what shape does the distribution have?&rdquo;.
          The standard deviation (SD) is the first number that tells the groups apart.
        </p>
      )}
    </Panel>
  );
}

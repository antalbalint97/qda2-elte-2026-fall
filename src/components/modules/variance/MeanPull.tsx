"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Announce } from "@/components/ui/Announce";
import { Slider } from "@/components/ui/Slider";
import { mean, median } from "@/lib/stats";
import { useState } from "react";
import { INCOMES, NINTH_INCOME } from "./data";

const X = (v: number) => 30 + (v / 5000) * 580;
const thousands = (v: number) => `${Math.round(v).toLocaleString("en-US")}k`;

export function MeanPull() {
  const [ninth, setNinth] = useState(NINTH_INCOME.start);
  const values = [...INCOMES, ninth];
  const m = mean(values);
  const md = median(values);
  const below = values.filter((v) => v < m).length;

  return (
    <Panel>
      <h3 className="tracking-tight text-xl font-semibold text-ink">One person can move the mean, but not the median</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Synthetic monthly net incomes (thousand HUF) of nine people. Raise the ninth person&rsquo;s income and watch
        where the balance point goes.
      </p>
      <div className="mt-5 max-w-md">
        <Slider
          label="Ninth person's income"
          value={ninth}
          min={NINTH_INCOME.min}
          max={NINTH_INCOME.max}
          step={NINTH_INCOME.step}
          onChange={setNinth}
          display={`${thousands(ninth)} HUF`}
          valueText={`${thousands(ninth)} HUF`}
        />
      </div>
      <svg
        viewBox="0 0 640 130"
        className="mt-4 w-full"
        role="img"
        aria-label={`Nine incomes on a line from 0 to 5,000 thousand HUF. Eight lie between 280 and 480; the ninth is at ${thousands(ninth)}. Mean ${thousands(m)}, median ${thousands(md)}.`}
      >
        <line x1={X(0)} x2={X(5000)} y1={70} y2={70} stroke="var(--border-strong)" strokeWidth={2} />
        {[0, 1000, 2000, 3000, 4000, 5000].map((v) => (
          <text key={v} x={X(v)} y={124} textAnchor="middle" fontSize="11" fill="var(--muted)">
            {thousands(v)}
          </text>
        ))}
        {values.map((v, i) => (
          <circle key={i} cx={X(v)} cy={70 - 8 - (i < INCOMES.length ? (i % 3) * 9 : 0)} r={5} fill="var(--y)" stroke={i === INCOMES.length ? "var(--ink)" : "none"} strokeWidth={2} />
        ))}
        <text x={X(ninth)} y={36} textAnchor="middle" fontSize="11" fill="var(--ink)">
          ninth person
        </text>
        <path d={`M${X(m)} 72 l-8 13 h16 z`} fill="var(--ink)" />
        <text x={Math.min(X(m) + 12, 520)} y={86} fontSize="12" fill="var(--ink)">
          mean {thousands(m)}
        </text>
        <line x1={X(md)} x2={X(md)} y1={20} y2={70} stroke="var(--ink)" strokeDasharray="4 3" />
        <text x={X(md) + 5} y={16} fontSize="12" fill="var(--ink)">
          median {thousands(md)}
        </text>
      </svg>
      <Announce>{`Mean ${thousands(m)}, median ${thousands(md)}. ${below} of 9 people earn less than the mean.`}</Announce>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          ["Mean", thousands(m)],
          ["Median", thousands(md)],
          ["Below the mean", `${below} of 9`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        The median only asks who is in the middle, so it stays at {thousands(md)}. The mean is a balance point: every
        unit of distance counts, so one far-away value drags it along. {below >= 8 && `Now ${below} of the 9 people earn less than the "average" income: the mean no longer describes a typical person.`}
      </p>
    </Panel>
  );
}

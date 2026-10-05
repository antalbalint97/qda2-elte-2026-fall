"use client";

import { Feedback } from "@/components/learning/Feedback";
import { MenuPath, SpssOutput } from "@/components/learning/Spss";
import { describe, frequencies } from "@/content/sopranos/analysis";
import { cn } from "@/lib/cn";
import { recordAnswer } from "@/lib/progress";
import { useState } from "react";
import { SyntheticTag } from "./Case";

const FREQ = frequencies("violence_event_count");
const D = describe("violence_event_count");
const FIELDS = [
  { id: "n", label: "N", answer: D.n, hint: "The cumulative percentage reaches 100% after all episodes: add up the Frequency column." },
  { id: "min", label: "Minimum", answer: D.min, hint: "The smallest value that has a frequency above zero (the first row)." },
  { id: "max", label: "Maximum", answer: D.max, hint: "The largest value in the table (the last row)." },
  {
    id: "median",
    label: "Median",
    answer: D.median,
    hint: "Find the first value where the cumulative percentage reaches 50% or more.",
  },
] as const;

const VARS = ["death_count", "violence_event_count", "fuck_count", "runtime_minutes"] as const;

function Histogram() {
  const W = 360;
  const H = 150;
  // every value from min to max, so empty values show as gaps rather than disappearing
  const bars = Array.from({ length: D.max - D.min + 1 }, (_, i) => ({
    value: D.min + i,
    freq: FREQ.find((f) => f.value === D.min + i)?.freq ?? 0,
  }));
  const max = Math.max(...bars.map((f) => f.freq));
  const bw = (W - 30) / bars.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Histogram of violent events per episode: most episodes have 1 to 3, with a long tail to the right.">
      {bars.map((f, i) => {
        const h = (f.freq / max) * (H - 40);
        return (
          <g key={f.value}>
            <rect x={20 + i * bw + 2} y={H - 22 - h} width={bw - 4} height={h} rx={2} className="fill-ry" opacity={0.75} />
            <text x={20 + i * bw + bw / 2} y={H - 8} textAnchor="middle" className="fill-muted font-mono text-[10px]">
              {f.value}
            </text>
            <text x={20 + i * bw + bw / 2} y={H - 26 - h} textAnchor="middle" className="fill-faint font-mono text-[9px]">
              {f.freq}
            </text>
          </g>
        );
      })}
      <line x1={18} x2={W - 8} y1={H - 22} y2={H - 22} className="stroke-line-strong" />
    </svg>
  );
}

export function FrequencyExercise() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const results = FIELDS.map((f) => Number(vals[f.id]) === f.answer && vals[f.id]?.trim() !== "");
  const allRight = results.every(Boolean);

  function check() {
    setChecked(true);
    if (!recorded) {
      recordAnswer("sop-desc-read", "descriptives", allRight);
      setRecorded(true);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[22rem] border-collapse text-[13px]">
            <caption className="border-b border-line px-3 py-2 text-left">
              <span className="font-semibold text-ink">violence_event_count</span> <SyntheticTag className="ml-1" />
            </caption>
            <thead>
              <tr className="text-xs text-muted">
                {["Value", "Frequency", "Percent", "Cumulative Percent"].map((h, i) => (
                  <th key={h} className={cn("border-b border-line px-2.5 py-1.5 font-medium", i ? "text-right" : "text-left")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FREQ.map((f) => (
                <tr key={f.value}>
                  <td className="border-b border-line px-2.5 py-1 text-left text-ink">{f.value}</td>
                  <td className="border-b border-line px-2.5 py-1 text-right font-mono tabular-nums text-ink">{f.freq}</td>
                  <td className="border-b border-line px-2.5 py-1 text-right font-mono tabular-nums text-ink">{f.pct.toFixed(1)}</td>
                  <td className="border-b border-line px-2.5 py-1 text-right font-mono tabular-nums text-ink">{f.cumPct.toFixed(1)}</td>
                </tr>
              ))}
              <tr>
                <td className="px-2.5 py-1 text-left font-medium text-muted">Total</td>
                <td className="px-2.5 py-1 text-right font-mono text-muted">?</td>
                <td className="px-2.5 py-1 text-right font-mono text-muted">100.0</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <Histogram />
          <p className="text-sm text-muted">Read the frequency table (no calculator needed) and fill in four statistics.</p>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f, i) => (
              <label key={f.id} className="block">
                <span className="text-xs font-medium text-muted">{f.label}</span>
                <input
                  inputMode="decimal"
                  value={vals[f.id] ?? ""}
                  onChange={(e) => {
                    setVals((v) => ({ ...v, [f.id]: e.target.value }));
                    setChecked(false);
                  }}
                  className={cn(
                    "mt-1 h-10 w-full rounded-lg border bg-surface px-3 font-mono text-ink outline-none focus:border-accent",
                    !checked && "border-line",
                    checked && results[i] && "border-pos bg-pos-soft",
                    checked && !results[i] && "border-neg bg-neg-soft",
                  )}
                />
              </label>
            ))}
          </div>
          <button type="button" onClick={check} className="h-10 rounded-lg bg-accent px-4 text-sm font-medium text-accent-ink hover:opacity-90">
            Check
          </button>
        </div>
      </div>

      {checked && (
        <Feedback tone={allRight ? "correct" : "incorrect"} title={allRight ? "All four correct" : `${results.filter(Boolean).length} of 4 correct`}>
          {allRight ? (
            <p>
              N = {D.n}, min = {D.min}, max = {D.max}, median = {D.median}: the cumulative percentage first passes 50% at {D.median} violent events.
            </p>
          ) : (
            <ul className="list-disc space-y-1 pl-4">
              {FIELDS.filter((_, i) => !results[i]).map((f) => (
                <li key={f.id}>
                  <strong>{f.label}:</strong> {f.hint}
                </li>
              ))}
            </ul>
          )}
        </Feedback>
      )}

      {recorded && (
        <div className="animate-fade-up space-y-5">
          <p className="text-sm text-muted">
            Now the same thing for all four variables, the way SPSS reports it. Mean and standard deviation need the raw data, which is why
            software earns its keep here.
          </p>
          <MenuPath path={["Analyze", "Descriptive Statistics", "Frequencies"]} />
          <SpssOutput
            title="Statistics"
            headers={["", ...VARS]}
            rows={[
              ["N Valid", ...VARS.map((v) => String(describe(v).n))],
              ["Mean", ...VARS.map((v) => describe(v).mean.toFixed(2))],
              ["Median", ...VARS.map((v) => describe(v).median.toFixed(2))],
              ["Std. Deviation", ...VARS.map((v) => describe(v).sd.toFixed(2))],
              ["Skewness", ...VARS.map((v) => describe(v).skew.toFixed(2))],
              ["Minimum", ...VARS.map((v) => String(describe(v).min))],
              ["Maximum", ...VARS.map((v) => String(describe(v).max))],
            ]}
            footnote="Synthetic teaching data. Frequencies › Statistics…: tick Mean, Median, Std. deviation, Minimum, Maximum, Skewness."
          />
        </div>
      )}
    </div>
  );
}

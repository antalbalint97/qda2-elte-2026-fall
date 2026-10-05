"use client";

import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { Scatter } from "@/components/viz/Scatter";
import { noLeadingZero, pearson } from "@/lib/stats";
import { useMemo, useState } from "react";
import { linearSample } from "./gen";

const PRESETS = [-0.9, -0.5, 0, 0.5, 0.9];

function strengthWord(r: number) {
  const a = Math.abs(r);
  if (a < 0.1) return "no linear association";
  if (a < 0.3) return "weak";
  if (a < 0.5) return "moderate";
  if (a < 0.7) return "fairly strong";
  return "strong";
}

export function Playground() {
  const [dir, setDir] = useState<"pos" | "neg">("pos");
  const [slope, setSlope] = useState(1);
  const [noise, setNoise] = useState(1);
  const [seed, setSeed] = useState(7);
  const signed = dir === "pos" ? slope : -slope;
  const { xs, ys } = useMemo(() => linearSample(seed, 120, signed, noise), [seed, signed, noise]);
  const r = pearson(xs, ys);

  function preset(target: number) {
    setDir(target < 0 ? "neg" : "pos");
    setNoise(1);
    setSlope(Math.abs(target) / Math.sqrt(1 - target * target));
  }

  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div>
        <Scatter xs={xs} ys={ys} xLabel="X" yLabel="Y" ariaLabel={`Scatterplot with Pearson r = ${r.toFixed(2)}`} />
      </div>
      <div className="space-y-5">
        <div className="rounded-xl bg-surface-2 p-4">
          <p className="text-xs text-muted">Pearson&apos;s r in this sample</p>
          <p className="font-mono text-4xl font-semibold tabular-nums text-ink">r = {noLeadingZero(r)}</p>
          <p className="mt-1 text-sm text-muted">
            {r > 0.1 ? "positive" : r < -0.1 ? "negative" : ""} {strengthWord(r)}
          </p>
          <div className="relative mt-3 h-1.5 rounded-full bg-gradient-to-r from-neg/50 via-surface-3 to-pos/50">
            <span
              className="absolute top-1/2 h-3.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink transition-all duration-300"
              style={{ left: `${((r + 1) / 2) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-faint">
            <span>−1</span>
            <span>0</span>
            <span>+1</span>
          </div>
        </div>
        <Segmented
          label="Direction"
          value={dir}
          onChange={setDir}
          options={[
            { value: "pos", label: "Positive" },
            { value: "neg", label: "Negative" },
          ]}
        />
        <Slider label="Strength of the trend" value={slope} min={0} max={2.5} step={0.05} onChange={setSlope} display={slope.toFixed(2)} />
        <Slider label="Noise (scatter around the trend)" value={noise} min={0.15} max={2.5} step={0.05} onChange={setNoise} display={noise.toFixed(2)} />
        <div>
          <p className="mb-1.5 text-xs text-muted">Jump to a population correlation of</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => preset(p)}
                className="rounded-md border border-line px-2 py-1 font-mono text-xs text-ink hover:border-accent hover:text-accent"
              >
                {p > 0 ? "+" : ""}
                {noLeadingZero(p, 1)}
              </button>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={() => setSeed((s) => s + 1)}>
          Draw a new sample
        </Button>
      </div>
    </div>
  );
}

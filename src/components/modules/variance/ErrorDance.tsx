"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Announce } from "@/components/ui/Announce";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { formatP, pBoundaryNote, sd } from "@/lib/stats";
import { useId, useMemo, useState } from "react";
import { errorDanceSamples, fmt, POP, REPEATS } from "./data";

const PX = (x: number) => 50 + x * 40;
const PY = (y: number) => 280 - (y + 20) * 1.8;

export function ErrorDance() {
  const [sigma, setSigma] = useState(10);
  const [n, setN] = useState(30);
  const [seed, setSeed] = useState(1);
  const clip = useId().replace(/:/g, "");

  const samples = useMemo(() => errorDanceSamples(n, sigma, seed), [n, sigma, seed]);
  const first = samples[0];
  const f = first.fit;
  const slopeSd = sd(samples.map((s) => s.fit.slope));
  const note = pBoundaryNote(f.p);

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-ink">Where the error term comes from, and why it matters</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            A simulation: in an invented population, knowledge = {POP.intercept} + {POP.slope} × news hours + error.
            The error is everything else that differs between people. Each sample gives a slightly different line.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setSeed((s) => s + 1)}>
          Draw new samples
        </Button>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Slider
          label="Size of the error (SD in the population)"
          value={sigma}
          min={2}
          max={30}
          onChange={setSigma}
          display={`${sigma} points`}
          valueText={`error SD ${sigma} points`}
          hint="How far people typically fall from the population line."
        />
        <Slider
          label="Sample size"
          value={n}
          min={10}
          max={200}
          step={10}
          onChange={setN}
          display={`n = ${n}`}
          valueText={`n = ${n}`}
        />
      </div>
      <svg
        viewBox="0 0 640 300"
        className="mt-5 w-full"
        role="img"
        aria-label={`One sample of ${n} simulated respondents with its fitted line and a band of plus or minus one residual SD (${fmt(f.residualSd)}). Behind it, the fitted lines of ${REPEATS} samples; their slopes vary with SD ${fmt(slopeSd, 2)}. Standard error of the slope in this sample ${fmt(f.seSlope, 2)}.`}
      >
        <defs>
          <clipPath id={clip}>
            <rect x={PX(0)} y={PY(130)} width={PX(14) - PX(0)} height={PY(-20) - PY(130)} />
          </clipPath>
        </defs>
        {[-20, 0, 20, 40, 60, 80, 100, 120].map((t) => (
          <g key={t}>
            <line x1={PX(0)} x2={PX(14)} y1={PY(t)} y2={PY(t)} stroke="var(--grid)" />
            <text x={PX(0) - 8} y={PY(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((t) => (
          <text key={t} x={PX(t)} y={296} textAnchor="middle" fontSize="11" fill="var(--muted)">
            {t}
          </text>
        ))}
        <g clipPath={`url(#${clip})`}>
          <polygon
            points={`${PX(0)},${PY(f.intercept + f.residualSd)} ${PX(14)},${PY(f.intercept + 14 * f.slope + f.residualSd)} ${PX(14)},${PY(f.intercept + 14 * f.slope - f.residualSd)} ${PX(0)},${PY(f.intercept - f.residualSd)}`}
            fill="var(--y)"
            fillOpacity={0.14}
          />
          {samples.slice(1).map((s, k) => (
            <line
              key={k}
              x1={PX(0)}
              x2={PX(14)}
              y1={PY(s.fit.intercept)}
              y2={PY(s.fit.intercept + 14 * s.fit.slope)}
              stroke="var(--muted)"
              strokeOpacity={0.45}
            />
          ))}
          {first.x.map((x, i) => (
            <circle key={i} cx={PX(x)} cy={PY(first.y[i])} r={3.4} fill="var(--y)" fillOpacity={0.8} />
          ))}
          <line x1={PX(0)} x2={PX(14)} y1={PY(f.intercept)} y2={PY(f.intercept + 14 * f.slope)} stroke="var(--ink)" strokeWidth={2.5} />
          <line
            x1={PX(0)}
            x2={PX(14)}
            y1={PY(POP.intercept)}
            y2={PY(POP.intercept + 14 * POP.slope)}
            stroke="var(--accent)"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        </g>
      </svg>
      <p className="text-xs text-muted">
        Dots = the first sample; thick black line = its fitted line; shaded ribbon = ± one residual SD around it; thin
        grey lines = fitted lines of {REPEATS - 1} other samples; dashed line = the population line (known here only
        because we invented the population).
      </p>
      <Announce>{`Error SD ${sigma}, n ${n}. Residual SD ${fmt(f.residualSd)}, slope ${fmt(f.slope, 2)}, standard error ${fmt(f.seSlope, 2)}, t ${fmt(f.t, 2)}, p ${formatP(f.p)}. Slopes across ${REPEATS} samples vary with SD ${fmt(slopeSd, 2)}.`}</Announce>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ["Residual SD (typical error)", fmt(f.residualSd)],
          ["Slope in this sample", fmt(f.slope, 2)],
          ["Standard error of the slope", fmt(f.seSlope, 2)],
          [`SD of the ${REPEATS} slopes (observed wobble)`, fmt(slopeSd, 2)],
          [`t (df ${f.df}) = slope ÷ SE`, fmt(f.t, 2)],
          ["p (two-tailed)", formatP(f.p)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
      <p className="mt-4 text-sm text-muted">
        The residuals of one sample are our only window on the error term. Their SD ({fmt(f.residualSd)}) estimates
        how far people fall from the line, and from it we get the standard error: a prediction of how much the slope
        would wobble from sample to sample. Compare it with the wobble we can actually see ({fmt(slopeSd, 2)}). Bigger
        errors widen the ribbon and the wobble; larger samples calm the wobble but not the ribbon. The t value is the
        slope measured in standard errors, the same t that tests a Pearson correlation.
      </p>
    </Panel>
  );
}

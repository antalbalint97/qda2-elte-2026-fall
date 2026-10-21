"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Announce } from "@/components/ui/Announce";
import { Segmented } from "@/components/ui/Segmented";
import { linearFit } from "@/lib/stats";
import { useId, useMemo, useState } from "react";
import { fmt, POP, simulateSample, SPREAD_N, SPREAD_SEED, spreadByThird, type SpreadPattern } from "./data";

const PX = (x: number) => 50 + x * 40;
const TOP = (y: number) => 200 - (y + 10) * 1.3;
const RES = (e: number) => 300 - e * 1.3;
const THIRDS = [0, POP.xMax / 3, (2 * POP.xMax) / 3, POP.xMax];

const LABEL: Record<SpreadPattern, string> = {
  constant: "Constant spread",
  grows: "Spread grows with X",
  shrinks: "Spread shrinks with X",
};

export function SpreadPatterns() {
  const [pattern, setPattern] = useState<SpreadPattern>("constant");
  const clip = useId().replace(/:/g, "");
  const { x, y, fit, thirds } = useMemo(() => {
    const s = simulateSample(SPREAD_N, 10, SPREAD_SEED, pattern);
    const fit = linearFit(s.x, s.y);
    return { ...s, fit, thirds: spreadByThird(s.x, fit.residuals) };
  }, [pattern]);
  const ratio = thirds[2] / thirds[0];
  const ratioText = ratio >= 1 ? `${fmt(ratio)} times as large as` : `${fmt(1 / ratio)} times smaller than`;

  return (
    <Panel>
      <h3 className="font-serif text-xl font-semibold text-ink">Is the error the same size everywhere?</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Simulated data, {SPREAD_N} respondents. All three versions have the same line and the same average error; only
        <em> where</em> the error is large changes. The lower chart plots each residual (observed minus predicted)
        against X.
      </p>
      <div className="mt-5">
        <Segmented<SpreadPattern>
          label="Spread pattern"
          value={pattern}
          onChange={setPattern}
          options={(Object.keys(LABEL) as SpreadPattern[]).map((k) => ({ value: k, label: LABEL[k] }))}
        />
      </div>
      <svg
        viewBox="0 0 640 380"
        className="mt-4 w-full"
        role="img"
        aria-label={`${LABEL[pattern]}. Upper chart: scatterplot with fitted line and a stepped band of plus or minus the typical residual in each third of X. Lower chart: residuals against X. Typical residual in the low, middle and high third of X: ${thirds.map((t) => fmt(t)).join(", ")}.`}
      >
        <defs>
          <clipPath id={clip}>
            <rect x={PX(0)} y={0} width={PX(14) - PX(0)} height={380} />
          </clipPath>
        </defs>
        <text x={PX(0)} y={12} fontSize="11" fill="var(--muted)">
          Knowledge score (Y) against news hours (X)
        </text>
        <text x={PX(0)} y={240} fontSize="11" fill="var(--muted)">
          Residuals against X (0 = exactly on the line)
        </text>
        {[0, 40, 80, 120].map((t) => (
          <g key={t}>
            <line x1={PX(0)} x2={PX(14)} y1={TOP(t)} y2={TOP(t)} stroke="var(--grid)" />
            <text x={PX(0) - 8} y={TOP(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {[-40, 0, 40].map((t) => (
          <g key={t}>
            <line x1={PX(0)} x2={PX(14)} y1={RES(t)} y2={RES(t)} stroke={t === 0 ? "var(--ink)" : "var(--grid)"} strokeDasharray={t === 0 ? "5 4" : undefined} />
            <text x={PX(0) - 8} y={RES(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((t) => (
          <text key={t} x={PX(t)} y={374} textAnchor="middle" fontSize="11" fill="var(--muted)">
            {t}
          </text>
        ))}
        <g clipPath={`url(#${clip})`}>
          {thirds.map((t, k) => {
            const [a, b] = [THIRDS[k], THIRDS[k + 1]];
            const lineA = fit.intercept + fit.slope * a;
            const lineB = fit.intercept + fit.slope * b;
            return (
              <g key={k}>
                <polygon
                  points={`${PX(a)},${TOP(lineA + t)} ${PX(b)},${TOP(lineB + t)} ${PX(b)},${TOP(lineB - t)} ${PX(a)},${TOP(lineA - t)}`}
                  fill="var(--y)"
                  fillOpacity={0.14}
                />
                <rect x={PX(a)} y={RES(t)} width={PX(b) - PX(a)} height={RES(-t) - RES(t)} fill="var(--y)" fillOpacity={0.14} />
                <text x={(PX(a) + PX(b)) / 2} y={RES(-t) + 14 > 362 ? 362 : RES(-t) + 14} textAnchor="middle" fontSize="11" fill="var(--ink)">
                  ±{fmt(t)}
                </text>
              </g>
            );
          })}
          {x.map((xi, i) => (
            <circle key={`p${i}`} cx={PX(xi)} cy={TOP(y[i])} r={2.6} fill="var(--y)" fillOpacity={0.8} />
          ))}
          {x.map((xi, i) => (
            <circle key={`r${i}`} cx={PX(xi)} cy={RES(fit.residuals[i])} r={2.6} fill="var(--y)" fillOpacity={0.8} />
          ))}
          <line x1={PX(0)} x2={PX(14)} y1={TOP(fit.intercept)} y2={TOP(fit.intercept + 14 * fit.slope)} stroke="var(--ink)" strokeWidth={2} />
        </g>
      </svg>
      <p className="text-xs text-muted">
        Shaded bands: ± the typical residual (root mean square) within each third of the X range, with the number
        printed in the lower chart.
      </p>
      <Announce>{`${LABEL[pattern]}. Typical residual: low X ${fmt(thirds[0])}, middle ${fmt(thirds[1])}, high X ${fmt(thirds[2])}.`}</Announce>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Typical residual, low X", fmt(thirds[0])],
          ["Typical residual, middle X", fmt(thirds[1])],
          ["Typical residual, high X", fmt(thirds[2])],
          ["One overall residual SD", fmt(fit.residualSd)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        {pattern === "constant"
          ? `The residuals form an even horizontal band: the typical error at high X (${fmt(thirds[2])}) is about the same as at low X (${fmt(thirds[0])}); the small difference is sampling noise. This is homoscedasticity (equal spread), the situation the usual standard error assumes.`
          : `The residuals form a funnel: the typical error at high X is ${ratioText} the one at low X. This is heteroscedasticity (unequal spread). One overall residual SD (${fmt(fit.residualSd)}) describes neither end well, so a standard error built on it can over- or understate how sure we can be.`}
      </p>
    </Panel>
  );
}

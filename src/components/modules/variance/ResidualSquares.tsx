"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Announce } from "@/components/ui/Announce";
import { Segmented } from "@/components/ui/Segmented";
import { Slider } from "@/components/ui/Slider";
import { linearFit, mean, ssAroundLine } from "@/lib/stats";
import { useState } from "react";
import { fmt, NEWS } from "./data";

type Ref = "mean" | "own" | "best";
const PX = (x: number) => 60 + x * 38;
const U = 2.6; // px per knowledge point
const PY = (y: number) => 290 - y * U;
const MAX_SIDE = 110;

const FIT = linearFit(NEWS.x, NEWS.y);
const MX = mean(NEWS.x);
const MY = mean(NEWS.y);

export function ResidualSquares() {
  const [ref, setRef] = useState<Ref>("mean");
  const [ownSlope, setOwnSlope] = useState(1.5);

  const slope = ref === "mean" ? 0 : ref === "own" ? ownSlope : FIT.slope;
  const intercept = MY - slope * MX; // every line here passes through the point of means
  const ss = ssAroundLine(NEWS.x, NEWS.y, slope, intercept);
  const share = ss / FIT.ssTotal;
  const refName = ref === "mean" ? "the mean of Y" : ref === "own" ? "your line" : "the best line";

  return (
    <Panel>
      <h3 className="font-serif text-xl font-semibold text-ink">From total spread to what is left over</h3>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Synthetic data: weekly hours of news use (X) and a political knowledge score (Y) for eight respondents.
        Choose what we use to predict each person&rsquo;s score, and compare the squares that are left.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Segmented<Ref>
          label="Prediction for each respondent"
          value={ref}
          onChange={setRef}
          options={[
            { value: "mean", label: "Mean of Y for everyone" },
            { value: "own", label: "Your line" },
            { value: "best", label: "Best line" },
          ]}
        />
      </div>
      {ref === "own" && (
        <div className="mt-4 max-w-md">
          <Slider
            label="Tilt of your line (points per hour)"
            value={ownSlope}
            min={-2}
            max={8}
            step={0.1}
            onChange={setOwnSlope}
            display={fmt(ownSlope)}
            valueText={`slope ${fmt(ownSlope)} points per hour`}
            hint="The line always passes through the point (mean of X, mean of Y); the slider tilts it."
          />
        </div>
      )}
      <svg
        viewBox="0 0 640 320"
        className="mt-4 w-full"
        role="img"
        aria-label={`Scatterplot of eight respondents, news hours against knowledge score, with ${refName}. Each residual is drawn as a square. Total area ${fmt(ss)}, which is ${Math.round(share * 100)} percent of the total spread ${fmt(FIT.ssTotal)}.`}
      >
        {[0, 20, 40, 60, 80, 100].map((t) => (
          <g key={t}>
            <line x1={PX(0)} x2={PX(14)} y1={PY(t)} y2={PY(t)} stroke="var(--grid)" />
            <text x={PX(0) - 8} y={PY(t) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">
              {t}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((t) => (
          <text key={t} x={PX(t)} y={308} textAnchor="middle" fontSize="12" fill="var(--muted)">
            {t}
          </text>
        ))}
        <text x={PX(14)} y={296} textAnchor="end" fontSize="11" fill="var(--x-ink)">
          X: news hours per week
        </text>
        <text x={PX(0) + 4} y={PY(100) - 4} fontSize="11" fill="var(--y-ink)">
          Y: knowledge score
        </text>
        {NEWS.x.map((x, i) => {
          const pred = intercept + slope * x;
          const e = NEWS.y[i] - pred;
          const side = Math.min(MAX_SIDE, Math.abs(e) * U);
          return (
            <g key={i}>
              <rect
                x={PX(x)}
                y={Math.min(PY(NEWS.y[i]), PY(pred))}
                width={side}
                height={side}
                fill="var(--y)"
                fillOpacity={0.18}
                stroke="var(--y)"
                strokeDasharray={ref === "mean" ? "4 3" : undefined}
              />
              <line x1={PX(x)} x2={PX(x)} y1={PY(NEWS.y[i])} y2={PY(pred)} stroke="var(--ink)" strokeWidth={1.3} />
            </g>
          );
        })}
        <line
          x1={PX(0)}
          x2={PX(14)}
          y1={PY(intercept)}
          y2={PY(intercept + slope * 14)}
          stroke="var(--ink)"
          strokeWidth={2.5}
          strokeDasharray={ref === "mean" ? "7 5" : undefined}
        />
        {NEWS.x.map((x, i) => (
          <circle key={i} cx={PX(x)} cy={PY(NEWS.y[i])} r={6} fill="var(--y)" stroke="var(--surface)" strokeWidth={1.5} />
        ))}
      </svg>
      <p className="text-xs text-muted">
        Dots = respondents; the thick line = the prediction (dashed when it is simply the mean of Y). Each vertical line
        is a respondent&rsquo;s error, observed minus predicted, and each square has that error as its side.
      </p>
      <Announce>{`Prediction: ${refName}. Sum of squared errors ${fmt(ss)}, ${Math.round(share * 100)} percent of the total ${fmt(FIT.ssTotal)}.`}</Announce>
      <div className="mt-5">
        <div className="flex justify-between text-xs text-muted">
          <span>Area left over: {fmt(ss)}</span>
          <span>Total spread around the mean of Y: {fmt(FIT.ssTotal)}</span>
        </div>
        <div className="mt-1 h-4 overflow-hidden rounded bg-surface-2 ring-1 ring-line" aria-hidden>
          <div className="h-full bg-ry/60" style={{ width: `${Math.min(100, share * 100)}%` }} />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Slope used", fmt(slope, 2)],
          ["Sum of squared errors", fmt(ss)],
          ["Share of total spread left", `${fmt(share * 100)}%`],
          ["Share accounted for", share > 1 ? "none (worse than the mean)" : `${fmt((1 - share) * 100)}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        {ref === "mean" &&
          `Predicting everyone with the mean (${fmt(MY)}) leaves the full total sum of squares, ${fmt(FIT.ssTotal)}. This is the starting point of ANOVA and of correlation: all the spread there is to account for.`}
        {ref === "own" &&
          (ss > FIT.ssResidual + 0.05
            ? `Your line leaves ${fmt(ss)}. Keep tilting: the best straight line leaves only ${fmt(FIT.ssResidual)}.`
            : `You have found the least-squares line (slope ${fmt(FIT.slope, 2)}): no other straight line leaves a smaller total area.`)}
        {ref === "best" &&
          `The least-squares line leaves ${fmt(FIT.ssResidual)} of ${fmt(FIT.ssTotal)}. The share accounted for, ${fmt(FIT.r2, 3)}, equals r² (r = ${fmt(Math.sqrt(FIT.r2), 3)}): about ${Math.round(FIT.r2 * 100)}% of the spread in knowledge scores is associated with news use in this sample. The remaining squares are the residuals.`}
      </p>
    </Panel>
  );
}

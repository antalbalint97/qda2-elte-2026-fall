"use client";

import { Panel } from "@/components/learning/ModuleShell";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { useMemo, useState } from "react";
import { anova, fmt, LABELS, mean, ORIGINAL } from "./data";

const COLORS = ["var(--x)", "var(--y)", "var(--z)"];
const Y = (v: number) => 202 - v * 1.75;

export function VarianceExplorer() {
  const [gap, setGap] = useState(0);
  const [spread, setSpread] = useState(1);
  const groups = useMemo(
    () =>
      ORIGINAL.map((xs, j) => {
        const center = mean(xs);
        const shift = j === 0 ? gap : j === 1 ? -gap : 0;
        return xs.map((x) => center + (x - center) * spread + shift);
      }),
    [gap, spread],
  );
  const r = anova(groups);

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-ink">Move the groups. Watch the sums of squares.</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            The starting values reproduce the 11 observations of the ANOVA calculation video. Moving the sliders
            creates a teaching simulation, not new survey data.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setGap(0);
            setSpread(1);
          }}
        >
          Reset
        </Button>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Slider
          label="Group separation"
          value={gap}
          min={-12}
          max={12}
          onChange={setGap}
          display={`${gap > 0 ? "+" : ""}${gap}`}
          hint="Moves Group 1 up and Group 2 down (negative values move them towards each other)."
        />
        <Slider
          label="Within-group spread"
          value={spread}
          min={0.2}
          max={1.8}
          step={0.1}
          onChange={setSpread}
          display={`${fmt(spread, 1)}×`}
          hint="Moves individuals towards or away from their own group mean."
        />
      </div>
      <svg
        className="mt-5 w-full"
        viewBox="0 0 600 240"
        role="img"
        aria-label={`Dot plot of three groups with their means. Between SS ${fmt(r.between)}, within SS ${fmt(r.within)}, F ${fmt(r.f)}.`}
      >
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line x1="44" x2="584" y1={Y(v)} y2={Y(v)} stroke="var(--grid)" />
            <text x="36" y={Y(v) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">
              {v}
            </text>
          </g>
        ))}
        <line x1="44" x2="584" y1={Y(r.overall)} y2={Y(r.overall)} stroke="var(--muted)" strokeDasharray="5 4" />
        {groups.map((xs, j) => {
          const cx = 140 + j * 170;
          return (
            <g key={j}>
              {xs.map((v, i) => (
                <circle key={i} cx={cx + (i % 2 === 0 ? -13 : 13)} cy={Y(v)} r={6} fill={COLORS[j]} opacity={0.85} />
              ))}
              <line
                x1={cx - 35}
                x2={cx + 35}
                y1={Y(r.means[j])}
                y2={Y(r.means[j])}
                stroke={COLORS[j]}
                strokeWidth={3.5}
                strokeLinecap="round"
              />
              <text x={cx} y="230" textAnchor="middle" fontSize="13" fill="var(--ink)">
                {LABELS[j]}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-muted">
        Dots = observations; thick lines = group means; dashed line = grand mean ({fmt(r.overall)}).
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Within SS", fmt(r.within)],
          ["Between SS", fmt(r.between)],
          [`F (df ${r.dfBetween}, ${r.dfWithin})`, fmt(r.f)],
          ["Eta squared", fmt(r.eta, 3)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm tabular-nums">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3 font-medium">Source</th>
              <th className="pr-3 font-medium">SS</th>
              <th className="pr-3 font-medium">df</th>
              <th className="font-medium">MS</th>
            </tr>
          </thead>
          <tbody className="text-ink">
            <tr className="border-b border-line">
              <td className="py-2 pr-3">Between groups</td>
              <td className="pr-3">{fmt(r.between)}</td>
              <td className="pr-3">{r.dfBetween}</td>
              <td>{fmt(r.msBetween)}</td>
            </tr>
            <tr className="border-b border-line">
              <td className="py-2 pr-3">Within groups</td>
              <td className="pr-3">{fmt(r.within)}</td>
              <td className="pr-3">{r.dfWithin}</td>
              <td>{fmt(r.msWithin)}</td>
            </tr>
            <tr>
              <td className="py-2 pr-3">Total</td>
              <td className="pr-3">{fmt(r.total)}</td>
              <td className="pr-3">{r.dfBetween + r.dfWithin}</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">
        Check the identity: {fmt(r.between)} + {fmt(r.within)} = {fmt(r.total)}. Separating the group means increases
        the between-group SS; spreading individuals around their own group mean increases the within-group SS, and F
        falls. This simulation does not compute p-values; the classical F test also relies on its assumptions.
      </p>
    </Panel>
  );
}

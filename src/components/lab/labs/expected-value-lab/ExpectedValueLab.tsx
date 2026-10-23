"use client";

// Expected Value Lab. Port of "QDA2 Expected Value Lab.dc.html". A payoff table with draggable bars, the
// balance point E[X] with ±SD, a seeded running mean against E ± 2·SD/√n, and the simulated frequencies
// against the exact probabilities. E and Var are exact sums (engine probability.ts).
import { discreteRV, sampleDiscrete } from "@/lib/engine/probability";
import { fmt } from "@/lib/engine/format";
import { cn } from "@/lib/cn";
import { useMemo, useRef, useState } from "react";
import { ChoiceControl, LabButton, SeedControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, PresetBar, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { EV_T } from "./strings";

import { EV_PRESETS as PRE, type EvParams, type Preset, type Row } from "./presets";

const DRAWS = [10, 100, 1000, 10000] as const;
const MAX_ROWS = 12;
const DEFAULTS: EvParams = { preset: "die", outcomes: PRE.die, draws: 1000, hideE: false, seed: 2026 };

/** Custom tables keep 2…12 rows of {label, x, p} with finite x and p in [0, 1]; anything else falls back to the preset. */
export function normalizeEv(p: EvParams): EvParams {
  const preset = p.preset in PRE || p.preset === "custom" ? p.preset : DEFAULTS.preset;
  const rows = Array.isArray(p.outcomes)
    ? p.outcomes
        .filter((o): o is Row => !!o && typeof o === "object" && Number.isFinite((o as Row).x) && Number.isFinite((o as Row).p))
        .slice(0, MAX_ROWS)
        .map((o) => ({ label: typeof o.label === "string" ? o.label.slice(0, 24) : "", x: o.x, p: Math.min(1, Math.max(0, o.p)) }))
    : [];
  // A named preset fixes the table; editing the table switches the preset to "custom".
  const outcomes = preset !== "custom" ? PRE[preset] : rows.length >= 2 ? rows : PRE.die;
  return {
    ...p,
    preset,
    outcomes,
    draws: (DRAWS as readonly number[]).includes(p.draws) ? p.draws : DEFAULTS.draws,
    hideE: p.hideE === true,
    seed: Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed,
  };
}

/** Probability axis top: the smallest of .2, .5, 1 that holds the largest bar. */
const axisTop = (m: number) => (m <= 0.2 ? 0.2 : m <= 0.5 ? 0.5 : 1);

export default function ExpectedValueLab(props: LabProps) {
  const lab = useLab<EvParams>("expected-value-lab", DEFAULTS, { ...props, normalize: normalizeEv });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = EV_T[lang];
  const out = P.outcomes;
  const rv = discreteRV(out);
  const ok = rv.E !== null;
  const E = rv.E ?? 0;
  const SD = rv.SD ?? 0;
  const sumP = out.reduce((a, o) => a + o.p, 0);
  const outLocked = locked("outcomes");
  const sim = useMemo(() => (ok ? sampleDiscrete(out, P.draws, P.seed) : null), [ok, out, P.draws, P.seed]);
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const showE = !P.hideE || revealed;

  const xs = out.map((o) => o.x);
  const lo = Math.min(...xs, E);
  const hi = Math.max(...xs, E);
  const pad = (hi - lo || 1) * 0.1;
  const X = (x: number) => 50 + ((x - lo + pad) / (hi - lo + 2 * pad)) * 660;
  const top = axisTop(Math.max(...rv.outcomes.map((o) => o.p), 0.01));
  const frozen = useRef(top);
  const svgRef = useRef<SVGSVGElement>(null);
  const setRows = (rows: Row[]) => setMany({ outcomes: rows, preset: "custom" });
  // Changing p_i rescales the others so that Σp stays 1.
  const setProb = (i: number, v: number) => {
    const np = Math.min(0.999, Math.max(0.001, Math.round(v * 1000) / 1000));
    const others = out.reduce((a, o, j) => (j === i ? a : a + o.p), 0);
    setRows(out.map((o, j) => ({ ...o, p: j === i ? np : others > 0 ? (o.p * (1 - np)) / others : (1 - np) / (out.length - 1) })));
  };
  const drag = useSvgDrag<number>(svgRef, (i, pt) => setProb(i, ((230 - pt.y) / 180) * frozen.current));
  const yTop = drag.dragging ? frozen.current : top;
  if (!drag.dragging) frozen.current = top;
  const Y = (p: number) => 230 - (p / yTop) * 180;
  // Bars never overlap their neighbours; value labels that would collide are left to the data table.
  const sortedX = [...new Set(xs)].sort((a, b) => a - b);
  const minGap = sortedX.slice(1).reduce((m, x, i) => Math.min(m, X(x) - X(sortedX[i])), Infinity);
  const bw = Math.max(4, Math.min(56, 560 / (out.length * 2), minGap * 0.8));
  const showLabel = new Set<number>();
  let lastX = -Infinity;
  sortedX.forEach((x) => {
    if (X(x) - lastX >= 52) {
      showLabel.add(x);
      lastX = X(x);
    }
  });
  const XC = (x: number) => Math.min(710, Math.max(50, X(x)));
  const big = Math.max(Math.abs(hi), Math.abs(lo)) >= 1000;
  const ff = (v: number) => (big ? Math.round(v).toLocaleString("en-US") : Number.isInteger(v) ? String(v) : fmt(v, 2));

  // running mean, log-n axis
  const N = P.draws;
  const RX = (i: number) => 50 + (Math.log10(i + 1) / Math.log10(N + 1)) * 340;
  const rlo = E - 3 * SD;
  const rhi = E + 3 * SD;
  const clampY = (v: number) => Math.min(200, Math.max(8, v));
  const RY = (v: number) => clampY(200 - ((v - rlo) / (rhi - rlo || 1)) * 180);
  const runPath = sim ? sim.running.map((m, i) => `${i ? "L" : "M"}${RX(i).toFixed(1)},${RY(m).toFixed(1)}`).join(" ") : "";
  let band = "";
  if (sim && SD > 0) {
    const up: string[] = [];
    const dn: string[] = [];
    for (let k = 1; k <= N; k = Math.max(k + 1, Math.round(k * 1.25))) {
      const w = (2 * SD) / Math.sqrt(k);
      up.push(`${RX(k - 1).toFixed(1)},${RY(E + w).toFixed(1)}`);
      dn.unshift(`${RX(k - 1).toFixed(1)},${RY(E - w).toFixed(1)}`);
    }
    band = `M${up.join(" L")} L${dn.join(" L")} Z`;
  }
  // frequencies by row (two rows may share a value)
  const counts = out.map((_, i) => (sim ? sim.index.filter((k) => k === i).length : 0));
  const HX = (x: number) => 50 + ((x - lo + pad) / (hi - lo + 2 * pad)) * 360;
  const HY = (p: number) => 200 - (p / top) * 170;

  const pNeg = rv.outcomes.filter((o) => o.x < 0).reduce((a, o) => a + o.p, 0);
  const hidden = t.hidden;
  const readouts: Readout[] = [
    { label: "E[X]", value: !ok ? "—" : showE ? ff(E) : "?", tone: "residual", note: showE ? undefined : hidden },
    { label: "Var(X)", value: !ok ? "—" : showE ? ff(rv.Var as number) : "?", tone: "explained" },
    { label: "SD(X)", value: !ok ? "—" : ff(SD), tone: "explained" },
    { label: "SD(X̄ₙ) = SD/√n", value: !ok ? "—" : ff(SD / Math.sqrt(N)) },
    { label: t.runningMean, value: sim?.mean != null ? ff(sim.mean) : "—", tone: "model" },
    { label: "x̄ₙ − E", value: sim?.mean != null && showE ? ff(sim.mean - E) : "—" },
    { label: t.pNeg, value: ok ? fmt(pNeg, 3) : "—" },
  ];
  // Running mean announced at milestones (10, 100, 1 000, 10 000 draws): the current N is a milestone.
  const live = sim?.mean != null ? (showE ? t.live.replace("{e}", ff(E)) : t.liveHidden).replace("{n}", N.toLocaleString("en-US")).replace("{m}", ff(sim.mean)) : "";
  const g = Number(guess.replace(",", "."));
  const hasGuess = guess.trim() !== "" && Number.isFinite(g);

  const demos: TeachDemo[] = (Object.keys(PRE) as Exclude<Preset, "custom">[]).map((k) => ({
    title: t.presets[k],
    note: k === "lottery" ? t.insight : t.lead,
    apply: () => setMany({ preset: k, outcomes: PRE[k], draws: 1000 }),
  }));

  const aside = (
    <>
      <Panel title={t.table}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1 font-medium">{t.outcome}</th>
              <th className="py-1 text-right font-medium">x</th>
              <th className="py-1 text-right font-medium">p</th>
              <th className="sr-only">{t.remove}</th>
            </tr>
          </thead>
          <tbody>
            {out.map((o, i) => (
              <tr key={i}>
                <td className="py-0.5 pr-1">
                  <input
                    className="w-full min-w-0 rounded border border-line bg-surface px-1.5 py-1 text-sm"
                    value={o.label}
                    disabled={outLocked}
                    aria-label={`${t.label} ${i + 1}`}
                    maxLength={24}
                    onChange={(e) => setRows(out.map((q, j) => (j === i ? { ...q, label: e.target.value } : q)))}
                  />
                </td>
                <td className="py-0.5 pr-1">
                  <input
                    type="number"
                    className="w-20 rounded border border-line bg-surface px-1.5 py-1 text-right font-mono text-sm"
                    value={o.x}
                    disabled={outLocked}
                    aria-label={`${t.value} (${o.label || i + 1})`}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      if (Number.isFinite(v)) setRows(out.map((q, j) => (j === i ? { ...q, x: v } : q)));
                    }}
                  />
                </td>
                <td className="py-0.5 pr-1">
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-20 rounded border border-line bg-surface px-1.5 py-1 text-right font-mono text-sm"
                    value={Math.round(o.p * 10000) / 10000}
                    disabled={outLocked}
                    aria-label={`${t.prob} (${o.label || i + 1})`}
                    onChange={(e) => {
                      const v = e.target.valueAsNumber;
                      if (Number.isFinite(v)) setRows(out.map((q, j) => (j === i ? { ...q, p: Math.min(1, Math.max(0, v)) } : q)));
                    }}
                  />
                </td>
                <td className="py-0.5">
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded border border-line bg-surface text-ink hover:bg-surface-2 disabled:opacity-50"
                    disabled={outLocked || out.length <= 2}
                    aria-label={`${t.remove} (${o.label || i + 1})`}
                    onClick={() => setRows(out.filter((_, j) => j !== i))}
                  >
                    −
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className={cn("font-mono text-xs", Math.abs(sumP - 1) < 1e-9 ? "text-explained-ink" : "text-residual-ink")}>Σp = {fmt(sumP, 3)}</span>
          <div className="flex gap-2">
            <LabButton disabled={outLocked || out.length >= MAX_ROWS} onClick={() => setRows([...out, { label: "new", x: 0, p: 0.1 }])}>
              + {t.outcome}
            </LabButton>
            <LabButton disabled={outLocked} onClick={() => setRows(out.map((o) => ({ ...o, p: sumP > 0 ? o.p / sumP : 1 / out.length })))}>
              {t.normalize}
            </LabButton>
          </div>
        </div>
        {!ok && <LabNote tone="warn">{t.invalid}</LabNote>}
        {ok && Math.abs(sumP - 1) > 1e-9 && <p className="mt-2 text-xs text-muted">{t.sumWarn}</p>}
        {!outLocked && (
          <div className="mt-3">
            <PresetBar<Exclude<Preset, "custom">>
              label={t.presetsLabel}
              presets={(Object.keys(PRE) as Exclude<Preset, "custom">[]).map((k) => ({ id: k, label: t.presets[k] }))}
              active={P.preset === "custom" ? undefined : P.preset}
              onPick={(k) => setMany({ preset: k, outcomes: PRE[k] })}
            />
          </div>
        )}
      </Panel>
      <Panel title={t.draws}>
        <div className="space-y-3">
          <ChoiceControl<number> label={t.draws} hideLabel param="draws" value={P.draws} onChange={(v) => set("draws", v)} options={DRAWS.map((n) => ({ value: n, label: n.toLocaleString("en-US") }))} />
          <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
        </div>
      </Panel>
      {P.hideE && (
        <Panel title={t.predict}>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col text-xs text-muted">
              {t.predict}
              <input
                inputMode="decimal"
                className="mt-1 w-28 rounded border border-line bg-surface px-2 py-1 font-mono text-sm text-ink"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
              />
            </label>
            <LabButton variant="primary" disabled={!hasGuess || revealed} onClick={() => setRevealed(true)}>
              {t.reveal}
            </LabButton>
          </div>
          {revealed && ok && (
            <p className="mt-2 font-mono text-sm text-ink" role="status">
              {t.yourGuess} {ff(g)} · E[X] = {ff(E)} · Δ = {ff(g - E)}
            </p>
          )}
        </Panel>
      )}
      <Panel title={lang === "hu" ? "Kiolvasások" : "Readouts"}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
    </>
  );

  return (
    <LabShell
      lab={lab}
      title={t.title}
      aside={aside}
      demos={demos}
      method={lang === "hu" ? "Pontos összegek a kifizetés-táblán; seedelt diszkrét mintavétel (inverz eloszlásfüggvény)" : "Exact sums over the payoff table; seeded discrete sampling (inverse CDF)"}
      validation={lang === "hu" ? "E, Var a beépített játékokra zárt alakkal ellenőrizve (tests/unit)" : "E and Var checked against closed forms for the preset games (tests/unit)"}
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead}</p>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.balance}</h2>
          <p className="text-xs text-muted">{t.balanceNote}</p>
          <AccessibleVisualization
            interactive
            svgRef={svgRef}
            onPointerMove={drag.move}
            onPointerUp={drag.end}
            viewBox="0 0 760 312"
            summary={`${t.balance}. ${out.map((o, i) => `${o.label || o.x}: x = ${ff(o.x)}, p = ${fmt(rv.outcomes[i]?.p ?? 0, 3)}`).join("; ")}.${ok && showE ? ` E[X] = ${ff(E)}, SD = ${ff(SD)}.` : ""}`}
            table={{
              caption: t.table,
              columns: [t.outcome, "x", "p", "x·p"],
              rows: out.map((o, i) => [o.label, ff(o.x), fmt(rv.outcomes[i]?.p ?? 0, 4), showE ? ff(o.x * (rv.outcomes[i]?.p ?? 0)) : "?"]),
            }}
          >
            {[0, yTop / 2, yTop].map((p) => (
              <g key={p}>
                <line x1={50} x2={720} y1={Y(p)} y2={Y(p)} stroke="var(--grid)" />
                <text x={44} y={Y(p) + 3} textAnchor="end" fontSize={10} fill="var(--muted)" className="font-mono">
                  {fmt(p, 2)}
                </text>
              </g>
            ))}
            <line x1={50} x2={720} y1={230} y2={230} stroke="var(--ink)" strokeWidth={2} />
            {out.map((o, i) => {
              const p = rv.outcomes[i]?.p ?? 0;
              return (
                <g key={i}>
                  <rect x={X(o.x) - bw / 2} y={Y(p)} width={bw} height={230 - Y(p)} rx={3} fill="var(--data)" />
                  {showLabel.has(o.x) && (
                    <>
                      <text x={X(o.x)} y={246} textAnchor="middle" fontSize={10} fill="var(--muted)" className="font-mono">
                        {ff(o.x)}
                      </text>
                      <text x={X(o.x)} y={Y(p) - 14} textAnchor="middle" fontSize={10} fill="var(--data-ink)" className="font-mono">
                        p = {fmt(p, 3)}
                      </text>
                    </>
                  )}
                  <DragHandle
                    x={X(o.x)}
                    y={Y(p)}
                    r={7}
                    fill="var(--ink)"
                    label={`${o.label || o.x}: ${lang === "hu" ? "valószínűség" : "probability"}`}
                    value={Math.round(p * 1000) / 1000}
                    min={0.001}
                    max={0.999}
                    step={0.01}
                    valueText={fmt(p, 3)}
                    disabled={outLocked || !ok}
                    onStart={(e) => drag.start(i, e)}
                    onValue={(v) => setProb(i, v)}
                  />
                </g>
              );
            })}
            {ok && showE && (
              <g aria-hidden>
                <polygon points={`${X(E)},252 ${X(E) - 12},276 ${X(E) + 12},276`} fill="var(--residual)" />
                <line x1={XC(E - SD)} x2={XC(E + SD)} y1={286} y2={286} stroke="var(--explained)" strokeWidth={3} />
                <line x1={XC(E - SD)} x2={XC(E - SD)} y1={280} y2={292} stroke="var(--explained)" strokeWidth={2} />
                <line x1={XC(E + SD)} x2={XC(E + SD)} y1={280} y2={292} stroke="var(--explained)" strokeWidth={2} />
                <text x={X(E)} y={308} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--residual-ink)" className="font-mono">
                  E[X] = {ff(E)}
                </text>
                <text x={Math.min(XC(E + SD) + 6, 690)} y={290} fontSize={10} fill="var(--explained-ink)" className="font-mono">
                  ± SD {ff(SD)}
                </text>
              </g>
            )}
            {hasGuess && !revealed && P.hideE && <line x1={X(g)} x2={X(g)} y1={40} y2={230} stroke="var(--attention)" strokeDasharray="4 3" strokeWidth={2} />}
          </AccessibleVisualization>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.running}</h2>
            <p className="text-xs text-muted">
              {N.toLocaleString("en-US")} {t.drawsWord} · log n
            </p>
            <AccessibleVisualization
              viewBox="0 0 420 222"
              summary={`${t.running}: ${live}`}
              table={
                sim
                  ? {
                      caption: t.running,
                      columns: ["n", "x̄ₙ", "E ± 2·SD/√n"],
                      rows: [1, 10, 100, 1000, 10000].filter((n) => n <= N).map((n) => [n, ff(sim.running[n - 1]), showE ? `${ff(E - (2 * SD) / Math.sqrt(n))} … ${ff(E + (2 * SD) / Math.sqrt(n))}` : "?"]),
                    }
                  : undefined
              }
            >
              {showE && band && <path d={band} fill="var(--explained)" fillOpacity={0.14} />}
              {showE && <line x1={50} x2={410} y1={RY(E)} y2={RY(E)} stroke="var(--residual)" strokeDasharray="5 3" strokeWidth={1.5} />}
              <path d={runPath} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
              <line x1={50} x2={410} y1={200} y2={200} stroke="var(--border)" />
              {[1, 10, 100, 1000, 10000]
                .filter((n) => n <= N)
                .map((n) => (
                  <text key={n} x={RX(n - 1)} y={214} textAnchor="middle" fontSize={9} fill="var(--muted)" className="font-mono">
                    {n.toLocaleString("en-US")}
                  </text>
                ))}
              {showE && ok && (
                <text x={408} y={RY(E) - 5} textAnchor="end" fontSize={10} fill="var(--residual-ink)" className="font-mono">
                  E[X] = {ff(E)}
                </text>
              )}
              {sim?.mean != null && (
                <text x={408} y={Math.min(196, RY(sim.mean) + 14)} textAnchor="end" fontSize={10} fill="var(--ink)" className="font-mono">
                  x̄ₙ = {ff(sim.mean)}
                </text>
              )}
            </AccessibleVisualization>
          </section>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.hist}</h2>
            <p className="text-xs text-muted">{t.dashed}</p>
            <AccessibleVisualization
              viewBox="0 0 420 222"
              summary={`${t.hist}. ${out.map((o, i) => `${o.label || o.x}: ${fmt(counts[i] / N, 3)} vs ${fmt(rv.outcomes[i]?.p ?? 0, 3)}`).join("; ")}`}
              table={{
                caption: t.hist,
                columns: [t.outcome, "x", lang === "hu" ? "darab" : "count", "p̂", "p"],
                rows: out.map((o, i) => [o.label, ff(o.x), counts[i], fmt(counts[i] / N, 3), fmt(rv.outcomes[i]?.p ?? 0, 3)]),
              }}
            >
              <line x1={50} x2={410} y1={200} y2={200} stroke="var(--border)" />
              {out.map((o, i) => {
                const pe = rv.outcomes[i]?.p ?? 0;
                const ph = counts[i] / N;
                const w = bw / 2;
                return (
                  <g key={i}>
                    <rect x={HX(o.x) - w / 2} y={HY(ph)} width={w} height={200 - HY(ph)} rx={2} fill="var(--model)" fillOpacity={0.75} />
                    <rect x={HX(o.x) - w / 2} y={HY(pe)} width={w} height={200 - HY(pe)} fill="none" stroke="var(--data)" strokeDasharray="3 2" />
                    {showLabel.has(o.x) && (
                      <text x={HX(o.x)} y={214} textAnchor="middle" fontSize={9} fill="var(--muted)" className="font-mono">
                        {ff(o.x)}
                      </text>
                    )}
                    {sim && showLabel.has(o.x) && (
                      <text x={HX(o.x)} y={Math.min(HY(ph), HY(pe)) - 5} textAnchor="middle" fontSize={9} fill="var(--model-ink)" className="font-mono">
                        {fmt(ph, 3)}
                      </text>
                    )}
                  </g>
                );
              })}
            </AccessibleVisualization>
          </section>
        </div>
        <p className="text-xs leading-relaxed text-muted">{t.note}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </LabShell>
  );
}

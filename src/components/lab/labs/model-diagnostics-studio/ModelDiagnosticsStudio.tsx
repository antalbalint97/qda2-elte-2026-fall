"use client";

// Model Diagnostics Studio. Port of "QDA2 Model Diagnostics Studio.dc.html": scatter with the OLS fit and
// Cook's-D bubbles, residuals vs fitted with a running mean, the leverage–residual bubble plot, a coefficient
// table with classical vs HC3 SEs and VIF, and the Breusch–Pagan test. Points are edited one at a time (select,
// then drag or use the arrow keys / number inputs); edits are part of the share link.
import { fmt } from "@/lib/engine/format";
import { useMemo, useRef } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl, SelectControl, ToggleControl } from "../../primitives/controls";
import { StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { applyMoves, diagnose, genPoints, makeX2, N, SCENARIOS, type Diagnosis, type Move, type Scenario } from "./model";
import { MD_T } from "./strings";

export interface MdParams extends Record<string, unknown> {
  scenario: Scenario;
  robust: boolean;
  hideRobust: boolean;
  addX2: boolean;
  rho: number;
  moves: Move[];
  sel: number;
  seed: number;
}
const DEFAULTS: MdParams = { scenario: "linear", robust: false, hideRobust: false, addX2: false, rho: 0.9, moves: [], sel: 0, seed: 2026 };
const r2 = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

export function normalizeMd(p: MdParams): MdParams {
  const scenario = SCENARIOS.includes(p.scenario) ? p.scenario : DEFAULTS.scenario;
  const moves = Array.isArray(p.moves)
    ? (p.moves.filter((m) => Array.isArray(m) && m.length === 3 && m.every((v) => typeof v === "number" && Number.isFinite(v)) && Number.isInteger(m[0]) && m[0] >= 0 && m[0] < N) as Move[]).slice(-N)
    : [];
  return {
    ...p,
    scenario,
    robust: p.robust === true,
    hideRobust: p.hideRobust === true,
    // the collinear scenario is the second predictor
    addX2: scenario === "collinear" ? true : p.addX2 === true,
    rho: r2(clamp(num(p.rho, scenario === "collinear" ? 0.95 : 0.9), 0, 0.99)),
    moves,
    sel: clamp(Math.round(num(p.sel, 0)), 0, N - 1),
    seed: Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed,
  };
}

export default function ModelDiagnosticsStudio(props: LabProps) {
  const lab = useLab<MdParams>("model-diagnostics-studio", DEFAULTS, { ...props, normalize: normalizeMd });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = MD_T[lang];
  const base = useMemo(() => genPoints(P.seed, P.scenario), [P.seed, P.scenario]);
  const pts = useMemo(() => applyMoves(base, P.moves), [base, P.moves]);
  const x2 = useMemo(() => makeX2(base.map((p) => p.x), P.rho, P.seed), [base, P.rho, P.seed]);
  const dg = useMemo(() => diagnose(pts, P.addX2, x2), [pts, P.addX2, x2]);
  const d: Diagnosis | null = "fit" in dg ? dg : null;
  const showHc3 = P.robust && !P.hideRobust;

  const movePoint = (i: number, x: number, y: number) => {
    const rest = P.moves.filter((m) => m[0] !== i);
    set("moves", [...rest, [i, clamp(Math.round(x * 2) / 2, 0, 14), clamp(Math.round(y), 0, 100)] as Move]);
  };
  const svgRef = useRef<SVGSVGElement>(null);
  const PX = (x: number) => r2(40 + x * (316 / 14));
  const PY = (y: number) => r2(270 - y * 2.5);
  const drag = useSvgDrag<number>(svgRef, (i, pt) => movePoint(i, (pt.x - 40) / (316 / 14), (270 - pt.y) / 2.5));

  const fit = d?.fit;
  const cooks = fit ? fit.cooks.map((v) => v ?? 0) : [];
  const maxD = cooks.length ? Math.max(...cooks) : 0;
  const maxDi = cooks.indexOf(maxD);
  const maxH = fit ? Math.max(...fit.leverage) : 0;
  const bubble = (D: number) => r2(3.5 + Math.min(10, Math.sqrt(D) * 9));
  const hot = (i: number) => d !== null && cooks[i] > d.dCut;

  // residual plot frame
  const fMin = fit ? Math.min(...fit.fitted) : 0;
  const fMax = fit ? Math.max(...fit.fitted) : 1;
  const eMax = fit ? Math.max(...fit.resid.map(Math.abs), 1) * 1.1 : 1;
  const RX = (f: number) => r2(40 + ((f - fMin) / (fMax - fMin || 1)) * 290);
  const RY = (e: number) => r2(68 - (e / eMax) * 56);
  // influence plot frame
  const sMax = fit ? Math.max(3, ...fit.stdRes.map((r) => Math.abs(r ?? 0))) * 1.1 : 3;
  const hMax = fit ? Math.max(maxH, d?.hCut ?? 0) * 1.1 : 1;
  const IX = (h: number) => r2(40 + (h / hMax) * 290);
  const IY = (r: number) => r2(68 - (r / sMax) * 56);

  const names = P.addX2 ? ["(Intercept)", "x", "x₂"] : ["(Intercept)", "x"];
  const readouts: Readout[] = fit
    ? [
        { label: t.r2, value: fit.r2 === null ? "—" : fmt(fit.r2, 3) },
        { label: t.maxD, value: `${fmt(maxD, 3)} (${maxDi + 1})`, tone: maxD > (d?.dCut ?? 1) ? "attention" : undefined },
        { label: t.maxH, value: `${fmt(maxH, 3)} (2k/n = ${fmt(d?.hCut ?? 0, 3)})` },
        { label: t.bpP, value: d?.bp ? fmt(d.bp.p, 4) : "—", tone: d?.bp && d.bp.p < 0.05 ? "attention" : undefined },
        { label: t.nk, value: `${fit.n} · ${fit.k}` },
      ]
    : [];
  const live = t.live.replace("{r2}", fit?.r2 === null || !fit ? "—" : fmt(fit.r2, 3)).replace("{d}", fmt(maxD, 3));

  const demos: TeachDemo[] = SCENARIOS.map((s) => ({ title: t.scenarios[s], note: t.insight[s], apply: () => setMany({ scenario: s, moves: [], robust: s === "fan", addX2: s === "collinear", rho: s === "collinear" ? 0.95 : 0.9 }) }));

  const sel = pts[P.sel];
  const aside = (
    <>
      <Panel title={t.data}>
        <div className="space-y-3">
          <ToggleControl label={t.robust} param="robust" checked={P.robust} disabled={P.hideRobust} hint={P.hideRobust ? t.hidden : undefined} onChange={(v) => set("robust", v)} />
          <ToggleControl label={t.addX2} param="addX2" checked={P.addX2} disabled={P.scenario === "collinear"} onChange={(v) => set("addX2", v)} />
          {P.addX2 && <ParameterControl label={t.rho} param="rho" value={P.rho} min={0} max={0.99} step={0.01} onChange={(v) => set("rho", r2(v))} />}
          <SelectControl<string> label={t.point} param="sel" value={String(P.sel)} onChange={(v) => set("sel", Number(v))} options={pts.map((_, i) => ({ value: String(i), label: t.pointN.replace("{i}", String(i + 1)) }))} />
          <ParameterControl label={t.px} param="moves" value={sel.x} min={0} max={14} step={0.5} onChange={(v) => movePoint(P.sel, v, sel.y)} />
          <ParameterControl label={t.py} param="moves" value={sel.y} min={0} max={100} step={1} onChange={(v) => movePoint(P.sel, sel.x, v)} />
          <LabButton onClick={() => set("moves", [])} disabled={!P.moves.length || locked("moves")}>
            {t.resetPts}
          </LabButton>
          <SeedControl value={P.seed} onChange={(v) => setMany({ seed: v, moves: [] })} />
        </div>
      </Panel>
      <Panel title={t.readouts}>
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
      synthetic
      method={t.methodNote}
      validation={t.validation}
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight[P.scenario]}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <ChoiceControl<Scenario> label={t.scenario} hideLabel param="scenario" value={P.scenario} onChange={(v) => setMany({ scenario: v, moves: [], addX2: v === "collinear", rho: v === "collinear" ? 0.95 : P.rho })} options={SCENARIOS.map((s) => ({ value: s, label: t.scenarios[s] }))} />
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[P.scenario]}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
        {!fit && "reason" in dg && <p className="text-sm text-attention-ink">{dg.reason}</p>}
        {fit && d && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.scatter}</h2>
                <AccessibleVisualization
                  viewBox="0 0 380 290"
                  svgRef={svgRef}
                  interactive
                  onPointerMove={drag.move}
                  onPointerUp={drag.end}
                  summary={`${t.scatter}: ŷ = ${fmt(fit.coef[0], 2)} + ${fmt(fit.coef[1], 2)}x${P.addX2 ? ` + ${fmt(fit.coef[2], 2)}x₂` : ""}, R² ${fit.r2 === null ? "—" : fmt(fit.r2, 3)}; largest Cook's D ${fmt(maxD, 3)} at point ${maxDi + 1}.`}
                  table={{ caption: t.scatter, columns: ["#", "x", "y", t.leverage, t.stud, t.cook], rows: pts.map((p, i) => [String(i + 1), fmt(p.x, 1), String(p.y), fmt(fit.leverage[i], 3), fit.stdRes[i] === null ? "—" : fmt(fit.stdRes[i] as number, 2), fit.cooks[i] === null ? "—" : fmt(fit.cooks[i] as number, 3)]) }}
                >
                  {[0, 25, 50, 75, 100].map((y) => (
                    <g key={y}>
                      <line x1={40} x2={356} y1={PY(y)} y2={PY(y)} stroke="var(--grid)" />
                      <text x={34} y={PY(y) + 3} textAnchor="end" fontSize={9} fill="var(--faint)">
                        {y}
                      </text>
                    </g>
                  ))}
                  {[0, 7, 14].map((x) => (
                    <text key={x} x={PX(x)} y={284} textAnchor="middle" fontSize={9} fill="var(--faint)">
                      {x}
                    </text>
                  ))}
                  {!P.addX2 && <line x1={PX(0)} y1={PY(fit.coef[0])} x2={PX(14)} y2={PY(fit.coef[0] + 14 * fit.coef[1])} stroke="var(--model)" strokeWidth={2.5} />}
                  {pts.map((p, i) => (
                    <circle
                      key={i}
                      cx={PX(p.x)}
                      cy={PY(p.y)}
                      r={bubble(cooks[i])}
                      fill={hot(i) ? "var(--residual)" : "var(--data)"}
                      fillOpacity={0.75}
                      stroke={i === P.sel ? "var(--ink)" : "none"}
                      strokeWidth={2}
                      onPointerDown={(e) => {
                        if (locked("moves")) return;
                        set("sel", i);
                        drag.start(i, e);
                      }}
                      style={{ cursor: locked("moves") ? "default" : "move" }}
                    />
                  ))}
                  <DragHandle
                    x={PX(sel.x)}
                    y={PY(sel.y)}
                    r={6}
                    fill="var(--ink)"
                    label={t.handle.replace("{i}", String(P.sel + 1))}
                    value={sel.y}
                    min={0}
                    max={100}
                    step={1}
                    valueText={`x ${sel.x}, y ${sel.y}`}
                    disabled={locked("moves")}
                    onStart={(e) => drag.start(P.sel, e)}
                    onValue={(v) => movePoint(P.sel, sel.x, v)}
                  />
                </AccessibleVisualization>
              </section>
              <section className="space-y-3">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.resid}</h2>
                  <AccessibleVisualization viewBox="0 0 340 140" summary={`${t.resid}: running mean from ${fmt(d.smooth[0].e, 1)} through ${fmt(d.smooth[Math.floor(d.smooth.length / 2)].e, 1)} to ${fmt(d.smooth[d.smooth.length - 1].e, 1)}.`}>
                    <line x1={40} x2={330} y1={RY(0)} y2={RY(0)} stroke="var(--border-strong)" />
                    {fit.resid.map((e, i) => (
                      <circle key={i} cx={RX(fit.fitted[i])} cy={RY(e)} r={3} fill={hot(i) ? "var(--residual)" : "var(--data)"} />
                    ))}
                    <path d={d.smooth.map((s, i) => `${i ? "L" : "M"}${RX(s.f)},${RY(s.e)}`).join(" ")} fill="none" stroke="var(--residual)" strokeWidth={2} />
                    <text x={330} y={136} textAnchor="end" fontSize={9} fill="var(--muted)">
                      {t.fitted}
                    </text>
                  </AccessibleVisualization>
                </div>
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.influence}</h2>
                  <AccessibleVisualization viewBox="0 0 340 140" summary={`${t.influence}: max h ${fmt(maxH, 3)}, cut-off 2k/n ${fmt(d.hCut, 3)}.`}>
                    <line x1={40} x2={330} y1={IY(0)} y2={IY(0)} stroke="var(--border-strong)" />
                    <line x1={IX(d.hCut)} x2={IX(d.hCut)} y1={8} y2={128} stroke="var(--explained)" strokeDasharray="4 3" />
                    {[2, -2].map((r) => (
                      <line key={r} x1={40} x2={330} y1={IY(r)} y2={IY(r)} stroke="var(--muted)" strokeDasharray="4 3" />
                    ))}
                    {fit.leverage.map((h, i) => (
                      <circle key={i} cx={IX(h)} cy={IY(fit.stdRes[i] ?? 0)} r={bubble(cooks[i])} fill={hot(i) ? "var(--residual)" : "var(--explained)"} fillOpacity={0.55} stroke={i === P.sel ? "var(--ink)" : "none"} />
                    ))}
                    <text x={330} y={136} textAnchor="end" fontSize={9} fill="var(--muted)">
                      {t.leverage}
                    </text>
                  </AccessibleVisualization>
                  <p className="text-xs text-muted">{t.cuts}</p>
                </div>
              </section>
            </div>
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.coef}</h2>
              <div className="mt-2 overflow-x-auto" role="region" aria-label={t.coef} tabIndex={0}>
                <table className="w-full text-sm" data-testid="coef-table">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th className="py-1 pr-2 font-medium">{t.term}</th>
                      <th className="py-1 pr-2 text-right font-medium">{t.b}</th>
                      <th className="py-1 pr-2 text-right font-medium">{t.seClassic}</th>
                      {showHc3 && <th className="py-1 pr-2 text-right font-medium">{t.seHc3}</th>}
                      <th className="py-1 pr-2 text-right font-medium">{t.t}</th>
                      {P.addX2 && <th className="py-1 text-right font-medium">{t.vif}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {names.map((nm, j) => (
                      <tr key={nm} className="border-b border-line">
                        <td className="py-1 pr-2 font-mono">{nm}</td>
                        <td className="py-1 pr-2 text-right font-mono">{fmt(fit.coef[j], 3)}</td>
                        <td className="py-1 pr-2 text-right font-mono">{fmt(fit.se[j], 3)}</td>
                        {showHc3 && <td className="py-1 pr-2 text-right font-mono">{fit.seHC3 ? fmt(fit.seHC3[j], 3) : "—"}</td>}
                        <td className="py-1 pr-2 text-right font-mono">{fmt(fit.coef[j] / (showHc3 && fit.seHC3 ? fit.seHC3[j] : fit.se[j]), 2)}</td>
                        {P.addX2 && (
                          <td className="py-1 text-right font-mono">
                            {j === 0 ? "" : fit.vif?.[j - 1] == null ? "> 1000" : (fit.vif[j - 1] as number) > 1000 ? "> 1000" : fmt(fit.vif[j - 1] as number, 2)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {d.bp && (
                <p className="mt-2 font-mono text-sm text-ink" data-testid="bp-test">
                  {t.bp.replace("{lm}", fmt(d.bp.lm, 2)).replace("{df}", String(d.bp.df)).replace("{p}", fmt(d.bp.p, 4))}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </LabShell>
  );
}

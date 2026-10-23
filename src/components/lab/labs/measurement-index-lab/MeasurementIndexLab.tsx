"use client";

// Measurement & Index Lab. Port of "QDA2 Measurement Index Lab.dc.html": item cards (include / reverse),
// the variance picture behind α, item statistics, the index with draggable absolute thresholds or quantile
// cuts, and the attenuation of a correlation by random measurement error.
import { quantile, skewness } from "@/lib/engine/descriptives";
import { fmt } from "@/lib/engine/format";
import { mean, sum } from "@/lib/engine/numeric";
import { useMemo, useRef, useState } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl } from "../../primitives/controls";
import { StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { alphaOf, attenuationOf, categorize, indexScores, itemSet, thresholds, type CutRule, type ItemSet, type Scoring } from "./model";
import { MI_T } from "./strings";

type View = "alpha" | "index" | "atten";
export interface MiParams extends Record<string, unknown> {
  set: ItemSet;
  items: string[];
  reverse: string[];
  view: View;
  cut: CutRule;
  cuts: [number, number];
  scoring: Scoring;
  errorSD: number;
  hideAlpha: boolean;
  seed: number;
}
const SETS: ItemSet[] = ["trust", "efficacy"];
const VIEWS: View[] = ["alpha", "index", "atten"];
const CUTS: CutRule[] = ["absolute", "relative", "percentile"];
const DEFAULTS: MiParams = { set: "trust", items: [], reverse: [], view: "alpha", cut: "absolute", cuts: [2.5, 3.5], scoring: "mean", errorSD: 0, hideAlpha: false, seed: 2026 };
const CAT_FILL = ["var(--residual)", "var(--attention)", "var(--explained)"];
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Empty `items` means all items of the set; empty `reverse` with no explicit choice means the negatively worded ones. */
export function normalizeMi(p: MiParams): MiParams {
  const set = SETS.includes(p.set) ? p.set : DEFAULTS.set;
  const it = itemSet(set);
  const items = Array.isArray(p.items) ? it.names.filter((n) => p.items.includes(n)) : [];
  const reverse = Array.isArray(p.reverse) ? it.names.filter((n) => p.reverse.includes(n)) : [];
  const c = Array.isArray(p.cuts) && p.cuts.length === 2 && p.cuts.every((v) => Number.isFinite(v)) ? (p.cuts.map((v) => Math.min(5, Math.max(1, v))) as [number, number]) : DEFAULTS.cuts;
  return {
    ...p,
    set,
    items: items.length ? items : it.names,
    reverse: Array.isArray(p.reverse) && p.reverse.length === 1 && p.reverse[0] === "none" ? [] : reverse.length ? reverse : it.negative,
    view: VIEWS.includes(p.view) ? p.view : DEFAULTS.view,
    cut: CUTS.includes(p.cut) ? p.cut : DEFAULTS.cut,
    cuts: c,
    scoring: p.scoring === "sum" ? "sum" : "mean",
    errorSD: Number.isFinite(p.errorSD) ? Math.min(3, Math.max(0, p.errorSD)) : 0,
    hideAlpha: p.hideAlpha === true,
    seed: Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed,
  };
}

export default function MeasurementIndexLab(props: LabProps) {
  const lab = useLab<MiParams>("measurement-index-lab", DEFAULTS, { ...props, normalize: normalizeMi });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = MI_T[lang];
  const it = useMemo(() => itemSet(P.set), [P.set]);
  const { idx, cols, cr } = useMemo(() => alphaOf(it, P.items, P.reverse), [it, P.items, P.reverse]);
  const index = useMemo(() => (cols.length ? indexScores(cols, P.scoring) : []), [cols, P.scoring]);
  const att = useMemo(() => (cols.length >= 2 ? attenuationOf(cols, P.errorSD, P.seed, P.scoring) : null), [cols, P.errorSD, P.seed, P.scoring]);
  const curve = useMemo(() => (cols.length >= 2 ? Array.from({ length: 16 }, (_, i) => ({ e: (i * 3) / 15, r: attenuationOf(cols, (i * 3) / 15, P.seed, P.scoring).rObs ?? 0 })) : []), [cols, P.seed, P.scoring]);
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const showAlpha = !P.hideAlpha || revealed;
  const k = cols.length;
  const n = index.length;
  const itemsLocked = locked("items");

  // index histogram and cuts
  const lo = P.scoring === "mean" ? 1 : k;
  const hi = P.scoring === "mean" ? 5 : 5 * k;
  const c = k ? thresholds(index, P.cut, P.cuts, k, P.scoring) : ([lo, hi] as [number, number]);
  const sizes = k ? categorize(index, c) : [0, 0, 0];
  const BINS = 20;
  const counts = new Array<number>(BINS).fill(0);
  index.forEach((v) => counts[Math.min(BINS - 1, Math.floor(((v - lo) / (hi - lo || 1)) * BINS))]++);
  const cMax = Math.max(1, ...counts);
  const IX = (v: number) => r2(40 + ((v - lo) / (hi - lo || 1)) * 660);
  const IY = (cnt: number) => r2(210 - (cnt / cMax) * 160);
  const svgRef = useRef<SVGSVGElement>(null);
  const cutsLocked = locked("cuts") || locked("cut");
  const setCut = (j: number, raw: number) => {
    const v = Math.min(5, Math.max(1, Math.round((P.scoring === "mean" ? raw : raw / k) * 20) / 20));
    set("cuts", P.cuts.map((x, i) => (i === j ? v : x)) as [number, number]);
  };
  const drag = useSvgDrag<number>(svgRef, (j, pt) => setCut(j, lo + ((pt.x - 40) / 660) * (hi - lo)));

  // variance picture
  const vI = cr.itemVariances.map((v) => v ?? 0);
  const sumVi = sum(vI);
  const vT = cr.totalVariance ?? sumVi;
  const vMax = Math.max(sumVi, vT, 1e-9);
  const VX = (v: number) => r2(110 + (v / vMax) * 380);

  // attenuation plots
  const ax = att?.index ?? [];
  const ay = att?.y ?? [];
  const axl = Math.min(...ax);
  const axh = Math.max(...ax);
  const ayl = Math.min(...ay);
  const ayh = Math.max(...ay);
  const SX = (v: number) => r2(40 + ((v - axl) / (axh - axl || 1)) * 300);
  const SY = (v: number) => r2(230 - ((v - ayl) / (ayh - ayl || 1)) * 210);
  const CX = (e: number) => r2(40 + (e / 3) * 300);
  const CY = (r: number) => r2(220 - r * 200);

  const g = Number(guess.replace(",", "."));
  const hasGuess = guess.trim() !== "" && Number.isFinite(g);
  const alphaTxt = cr.alpha === null ? "—" : showAlpha ? fmt(cr.alpha, 3) : "?";
  const sk = skewness(index);
  const readouts: Readout[] =
    P.view === "atten" && att
      ? [
          { label: t.rTrue, value: att.rTrue === null ? "—" : fmt(att.rTrue, 3), tone: "model" },
          { label: t.rObs, value: att.rObs === null ? "—" : fmt(att.rObs, 3), tone: "residual" },
          { label: t.rho, value: fmt(att.rho, 3) },
          { label: t.pred, value: att.predicted === null ? "—" : fmt(att.predicted, 3), tone: "explained" },
          { label: t.alphas, value: `${att.alphaClean === null ? "—" : fmt(att.alphaClean, 3)} → ${att.alphaNoisy === null ? "—" : fmt(att.alphaNoisy, 3)}` },
        ]
      : [
          { label: t.k, value: String(k) },
          { label: t.alpha, value: alphaTxt, tone: cr.alpha !== null && showAlpha ? (cr.alpha < 0.7 ? "attention" : "explained") : "muted", note: showAlpha ? undefined : t.hidden },
          { label: t.std, value: cr.standardized === null || !showAlpha ? (showAlpha ? "—" : "?") : fmt(cr.standardized, 3) },
          { label: t.rbar, value: cr.avgInterItemR === null ? "—" : fmt(cr.avgInterItemR, 3) },
          { label: t.idxMean, value: n ? `${fmt(mean(index) as number, 2)} · ${fmt(Math.sqrt(sum(index.map((v) => (v - (mean(index) as number)) ** 2)) / (n - 1)), 2)}` : "—" },
          { label: t.catSizes, value: sizes.join(" / ") },
          { label: t.skew, value: sk ? fmt(sk.g1, 2) : "—" },
        ];
  const live = t.live.replace("{a}", alphaTxt);

  const toggle = (key: "items" | "reverse", name: string, on: boolean) => {
    const cur = P[key];
    const next = on ? [...cur, name] : cur.filter((x) => x !== name);
    if (key === "items" && !next.length) return;
    set(key, key === "reverse" && !next.length ? ["none"] : next);
  };

  const demos: TeachDemo[] = [
    { title: t.views.alpha, note: t.insight.alpha, apply: () => setMany({ view: "alpha", set: "trust", items: [], reverse: ["none"] }) },
    { title: lang === "hu" ? "Gyenge item" : "Weak item", note: t.lead.alpha, apply: () => setMany({ view: "alpha", set: "trust", items: ["T1", "T2", "T3", "T4", "T5"], reverse: ["T3", "T5"] }) },
    { title: t.views.index, note: t.insight.index, apply: () => setMany({ view: "index", cut: "percentile" }) },
    { title: t.views.atten, note: t.insight.atten, apply: () => setMany({ view: "atten", errorSD: 1 }) },
  ];

  const aside = (
    <>
      <Panel title={t.set}>
        <div className="space-y-3">
          <ChoiceControl<ItemSet> label={t.set} hideLabel param="set" size="sm" value={P.set} onChange={(v) => setMany({ set: v, items: [], reverse: [] })} options={SETS.map((s) => ({ value: s, label: t.sets[s] }))} />
          <fieldset>
            <legend className="text-sm font-medium text-ink">{t.items}</legend>
            <p className="text-xs text-muted">{t.itemsNote}</p>
            <ul className="mt-2 space-y-2">
              {it.names.map((nm, i) => {
                const on = P.items.includes(nm);
                const j = idx.indexOf(i);
                const row = j >= 0 ? cr.itemTotal[j] : null;
                return (
                  <li key={nm} className={on ? "rounded-lg border border-line bg-surface p-2" : "rounded-lg border border-line bg-surface-2 p-2 opacity-80"}>
                    <p className="text-xs text-ink">
                      <span className="font-mono font-semibold">{nm}</span> {it.labels[i]}
                      {it.negative.includes(nm) && <span className="ml-1 text-attention-ink">({t.negative})</span>}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <label className="flex items-center gap-1">
                        <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={on} disabled={itemsLocked} onChange={(e) => toggle("items", nm, e.target.checked)} aria-label={`${t.include} ${nm}`} />
                        {t.include}
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={P.reverse.includes(nm)} disabled={itemsLocked || locked("reverse")} onChange={(e) => toggle("reverse", nm, e.target.checked)} aria-label={`${t.reverse} ${nm}`} />
                        {t.reverse}
                      </label>
                      {row && (
                        <span className={row.corrected !== null && row.corrected < 0.3 ? "font-mono text-attention-ink" : "font-mono text-muted"}>
                          r_it {row.corrected === null ? "—" : fmt(row.corrected, 2)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </div>
      </Panel>
      <Panel title={t.view}>
        <div className="space-y-3">
          <ChoiceControl<Scoring> label={t.scoring} param="scoring" size="sm" value={P.scoring} onChange={(v) => set("scoring", v)} options={(["mean", "sum"] as Scoring[]).map((s) => ({ value: s, label: t.scorings[s] }))} />
          <ChoiceControl<CutRule> label={t.cut} param="cut" size="sm" value={P.cut} onChange={(v) => set("cut", v)} options={CUTS.map((s) => ({ value: s, label: t.cuts[s] }))} />
          <ParameterControl label={t.errorSD} param="errorSD" value={P.errorSD} min={0} max={3} step={0.1} onChange={(v) => set("errorSD", Math.round(v * 10) / 10)} />
          <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
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
      synthetic={P.set === "efficacy" || P.view === "atten"}
      method={t.methodNote}
      validation={t.validation}
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula[P.view].map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight[P.view]}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <ChoiceControl<View> label={t.view} hideLabel param="view" value={P.view} onChange={(v) => set("view", v)} options={VIEWS.map((v) => ({ value: v, label: t.views[v] }))} />
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[P.view]}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
        {P.view === "alpha" && (
          <>
            {P.hideAlpha && (
              <div className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-surface p-3">
                <label className="flex flex-col text-xs text-muted">
                  {t.predict}
                  <input inputMode="decimal" className="mt-1 w-28 rounded border border-line bg-surface px-2 py-1 font-mono text-sm text-ink" value={guess} onChange={(e) => setGuess(e.target.value)} />
                </label>
                <LabButton variant="primary" disabled={!hasGuess || revealed} onClick={() => setRevealed(true)}>
                  {t.reveal}
                </LabButton>
                {revealed && cr.alpha !== null && (
                  <p className="font-mono text-sm text-ink" role="status">
                    {t.yourGuess} {fmt(g, 2)} · α = {fmt(cr.alpha, 3)}
                  </p>
                )}
              </div>
            )}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.varPic}</h2>
              <AccessibleVisualization
                viewBox="0 0 560 130"
                summary={`${t.varPic}: Σ s²ᵢ = ${fmt(sumVi, 2)}, s²_total = ${fmt(vT, 2)}, α = ${alphaTxt}.`}
                table={{ caption: t.varPic, columns: ["", "variance"], rows: [...idx.map((i, j) => [it.names[i], fmt(vI[j], 3)]), [t.varSum, fmt(sumVi, 3)], [t.varTot, fmt(vT, 3)]] }}
              >
                <text x={102} y={34} textAnchor="end" fontSize={11} fill="var(--ink)">
                  {t.varSum}
                </text>
                {vI.map((v, j) => {
                  const x0 = VX(sum(vI.slice(0, j)));
                  return <rect key={j} x={x0} y={20} width={Math.max(0, VX(sum(vI.slice(0, j + 1))) - x0 - 1)} height={22} fill="var(--data)" fillOpacity={0.45 + 0.5 * ((j % 2) as number)} />;
                })}
                <text x={VX(sumVi) + 6} y={36} fontSize={10} fill="var(--data-ink)" className="font-mono">
                  {fmt(sumVi, 2)}
                </text>
                <text x={102} y={82} textAnchor="end" fontSize={11} fill="var(--ink)">
                  {t.varTot}
                </text>
                <rect x={110} y={68} width={Math.max(0, VX(vT) - 110)} height={22} fill="var(--model)" />
                <text x={Math.min(VX(vT) + 6, 500)} y={84} fontSize={10} fill="var(--model-ink)" className="font-mono">
                  {fmt(vT, 2)}
                </text>
                <text x={110} y={118} fontSize={11} fill="var(--ink)" className="font-mono">
                  {t.varCov} = {fmt(vT - sumVi, 2)} · α = {alphaTxt}
                </text>
              </AccessibleVisualization>
            </section>
            <section>
              <table className="w-full text-sm" data-testid="item-table">
                <caption className="text-left text-xs font-semibold uppercase tracking-wider text-muted">{t.itemTable}</caption>
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="py-1 font-medium">item</th>
                    <th className="py-1 text-right font-medium">{t.mean}</th>
                    <th className="py-1 text-right font-medium">{t.sd}</th>
                    <th className="py-1 text-right font-medium">{t.rit}</th>
                    <th className="py-1 text-right font-medium">{t.aid}</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {idx.map((i, j) => {
                    const row = cr.itemTotal[j];
                    return (
                      <tr key={i} className="border-t border-line">
                        <td className="py-1">
                          {it.names[i]}
                          {P.reverse.includes(it.names[i]) ? " (R)" : ""}
                        </td>
                        <td className="py-1 text-right">{row?.mean == null ? "—" : fmt(row.mean, 2)}</td>
                        <td className="py-1 text-right">{row?.sd == null ? "—" : fmt(row.sd, 2)}</td>
                        <td className={row?.corrected != null && row.corrected < 0.3 ? "py-1 text-right text-attention-ink" : "py-1 text-right"}>{row?.corrected == null ? "—" : fmt(row.corrected, 3)}</td>
                        <td className="py-1 text-right">{row?.alphaIfDeleted == null || !showAlpha ? (showAlpha ? "—" : "?") : fmt(row.alphaIfDeleted, 3)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        )}
        {P.view === "index" && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.hist}</h2>
            {P.cut === "absolute" && <p className="text-xs text-muted">{t.histNote}</p>}
            <AccessibleVisualization
              interactive={P.cut === "absolute"}
              svgRef={svgRef}
              onPointerMove={drag.move}
              onPointerUp={drag.end}
              viewBox="0 0 740 260"
              summary={`${t.hist}: c₁ = ${fmt(c[0], 2)}, c₂ = ${fmt(c[1], 2)}; ${t.cats.low} ${sizes[0]}, ${t.cats.mid} ${sizes[1]}, ${t.cats.high} ${sizes[2]} of ${n}.`}
              table={{ caption: t.catTable, columns: ["", "n", "%"], rows: (["low", "mid", "high"] as const).map((key, j) => [t.cats[key], sizes[j], n ? fmt((100 * sizes[j]) / n, 1) : "—"]) }}
            >
              {counts.map((cnt, i) => {
                const x0 = lo + ((hi - lo) * i) / BINS;
                const x1 = lo + ((hi - lo) * (i + 1)) / BINS;
                const mid = (x0 + x1) / 2;
                const cat = mid < c[0] ? 0 : mid < c[1] ? 1 : 2;
                return <rect key={i} x={IX(x0) + 0.5} y={IY(cnt)} width={Math.max(1, IX(x1) - IX(x0) - 1)} height={210 - IY(cnt)} fill={CAT_FILL[cat]} fillOpacity={0.8} />;
              })}
              <line x1={40} x2={700} y1={210} y2={210} stroke="var(--border-strong)" />
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <text key={f} x={IX(lo + f * (hi - lo))} y={226} textAnchor="middle" fontSize={10} fill="var(--muted)" className="font-mono">
                  {fmt(lo + f * (hi - lo), P.scoring === "mean" ? 1 : 0)}
                </text>
              ))}
              {(["low", "mid", "high"] as const).map((key, j) => {
                const xa = j === 0 ? 40 : IX(c[j - 1]);
                const xb = j === 2 ? 700 : IX(c[j]);
                return (
                  <text key={key} x={(xa + xb) / 2} y={30} textAnchor="middle" fontSize={11} fill="var(--ink)">
                    {t.cats[key]} {sizes[j]} ({n ? fmt((100 * sizes[j]) / n, 0) : 0} %)
                  </text>
                );
              })}
              {c.map((v, j) => (
                <g key={j}>
                  <line x1={IX(v)} x2={IX(v)} y1={40} y2={210} stroke="var(--ink)" strokeWidth={2} strokeDasharray={P.cut === "absolute" ? undefined : "4 3"} />
                  <text x={IX(v)} y={246} textAnchor="middle" fontSize={10} fill="var(--ink)" className="font-mono">
                    {fmt(v, 2)}
                  </text>
                  {P.cut === "absolute" && (
                    <DragHandle
                      x={IX(v)}
                      y={120}
                      r={8}
                      fill="var(--ink)"
                      orientation="horizontal"
                      label={t.threshold.replace("{k}", String(j + 1))}
                      value={P.cuts[j]}
                      min={1}
                      max={5}
                      step={0.05}
                      valueText={fmt(v, 2)}
                      disabled={cutsLocked}
                      onStart={(e) => drag.start(j, e)}
                      onValue={(nv) => set("cuts", P.cuts.map((x, i) => (i === j ? Math.min(5, Math.max(1, Math.round(nv * 20) / 20)) : x)) as [number, number])}
                    />
                  )}
                </g>
              ))}
            </AccessibleVisualization>
            {P.cut !== "absolute" && (
              <p className="mt-1 font-mono text-xs text-muted">
                {P.cut === "relative" ? "q(1/3), q(2/3)" : "q(0.25), q(0.75)"} = {fmt(quantile(index, P.cut === "relative" ? 1 / 3 : 0.25) ?? NaN, 2)}, {fmt(quantile(index, P.cut === "relative" ? 2 / 3 : 0.75) ?? NaN, 2)}
              </p>
            )}
          </section>
        )}
        {P.view === "atten" && att && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.attenScatter}</h2>
              <AccessibleVisualization viewBox="0 0 360 260" summary={`${t.attenScatter}: r = ${att.rObs === null ? "—" : fmt(att.rObs, 3)} (σ_e = ${fmt(P.errorSD, 1)}).`}>
                {ax.map((v, i) => (
                  <circle key={i} cx={SX(v)} cy={SY(ay[i])} r={3} fill="var(--data)" fillOpacity={0.6} />
                ))}
                <text x={190} y={254} textAnchor="middle" fontSize={10} fill="var(--muted)">
                  {t.noisy} (σ_e = {fmt(P.errorSD, 1)})
                </text>
                <text x={44} y={14} fontSize={10} fill="var(--muted)">
                  {t.crit} · r = {att.rObs === null ? "—" : fmt(att.rObs, 3)}
                </text>
              </AccessibleVisualization>
            </section>
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.attenCurve}</h2>
              <AccessibleVisualization
                viewBox="0 0 360 260"
                summary={`${t.attenCurve}: ${curve.map((p) => `σ_e ${fmt(p.e, 1)}: r ${fmt(p.r, 3)}`).join("; ")}.`}
                table={{ caption: t.attenCurve, columns: ["σ_e", "r"], rows: curve.map((p) => [fmt(p.e, 1), fmt(p.r, 3)]) }}
              >
                <line x1={40} x2={340} y1={CY(0)} y2={CY(0)} stroke="var(--border-strong)" />
                <line x1={40} x2={340} y1={CY(att.rTrue ?? 0)} y2={CY(att.rTrue ?? 0)} stroke="var(--model)" strokeDasharray="4 3" />
                <path d={curve.map((p, i) => `${i ? "L" : "M"}${CX(p.e)},${CY(p.r)}`).join(" ")} fill="none" stroke="var(--residual)" strokeWidth={2} />
                <circle cx={CX(P.errorSD)} cy={CY(att.rObs ?? 0)} r={6} fill="var(--residual)" stroke="var(--ink)" />
                <text x={44} y={CY(att.rTrue ?? 0) - 6} fontSize={10} fill="var(--model-ink)" className="font-mono">
                  r_true = {att.rTrue === null ? "—" : fmt(att.rTrue, 3)}
                </text>
                {[0, 1, 2, 3].map((e) => (
                  <text key={e} x={CX(e)} y={CY(0) + 16} textAnchor="middle" fontSize={10} fill="var(--muted)" className="font-mono">
                    {e}
                  </text>
                ))}
                <text x={190} y={254} textAnchor="middle" fontSize={10} fill="var(--muted)">
                  σ_e
                </text>
              </AccessibleVisualization>
            </section>
          </div>
        )}
      </div>
    </LabShell>
  );
}

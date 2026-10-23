"use client";

// Distribution Studio. Port of "QDA2 Distribution Studio.dc.html". Theory mode: a named family with
// draggable interval handles; P(a < X ≤ b) shown as an area on the density and as a jump in the CDF.
// Data mode: histogram, boxplot and moments of a registered (synthetic) dataset column, with transforms.
import { DATASETS } from "@/content/curriculum/datasets";
import { describe, fiveNumber, histogram, kurtosis, ranks, skewness, zscores } from "@/lib/engine/descriptives";
import { family, intervalProbability, normalPdf, type Family, type FamilyName, type FamilyParams } from "@/lib/engine/distributions";
import { fmt } from "@/lib/engine/format";
import { useRef } from "react";
import { ChoiceControl, ParameterControl, SelectControl } from "../../primitives/controls";
import { areaPath, curvePath, ticks } from "../../primitives/paths";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, PresetBar, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { DS_T } from "./strings";

type Mode = "theory" | "data";
type Transform = "none" | "log" | "z" | "rank";
export interface DistParams extends Record<string, unknown> {
  mode: Mode;
  family: FamilyName;
  theta: FamilyParams;
  interval: [number, number];
  transform: Transform;
  bins: number;
  dataset: string;
  column: string;
}
const THETA0: Required<Pick<FamilyParams, "mu" | "sigma" | "df" | "d1" | "d2" | "n" | "p" | "lambda" | "a" | "b">> = { mu: 0, sigma: 1, df: 5, d1: 3, d2: 12, n: 20, p: 0.3, lambda: 4, a: 0, b: 1 };
const DEFAULTS: DistParams = { mode: "theory", family: "normal", theta: THETA0, interval: [-1, 1], transform: "none", bins: 20, dataset: "ds.household-income", column: "income" };

const PARAM_DEFS: Record<FamilyName, [keyof typeof THETA0, string, number, number, number][]> = {
  normal: [
    ["mu", "μ", -10, 10, 0.1],
    ["sigma", "σ", 0.2, 5, 0.1],
  ],
  t: [["df", "df", 1, 60, 1]],
  chi2: [["df", "df", 1, 30, 1]],
  F: [
    ["d1", "d₁", 1, 30, 1],
    ["d2", "d₂", 2, 60, 1],
  ],
  binomial: [
    ["n", "n", 1, 60, 1],
    ["p", "p", 0.01, 0.99, 0.01],
  ],
  poisson: [["lambda", "λ", 0.2, 30, 0.2]],
  uniform: [
    ["a", "a", -10, 10, 0.5],
    ["b", "b", -9, 20, 0.5],
  ],
};
const FAM_LABEL: Record<FamilyName, string> = { normal: "Normal", t: "Student t", chi2: "χ²", F: "F", binomial: "Binomial", poisson: "Poisson", uniform: "Uniform" };

/** Numeric columns of the registered datasets (the data-mode choices). */
const NUMERIC = DATASETS.flatMap((ds) => ds.columns.map((c, j) => ({ ds, c, j })).filter((o) => o.c.type === "number" && o.c.name !== "id"));

/** Clamps θ to the slider ranges of the family and keeps uniform a < b; falls back to defaults. */
export function normalizeDist(p: DistParams): DistParams {
  const th: Record<string, number> = { ...THETA0 };
  for (const [k, v] of Object.entries(p.theta ?? {})) if (k in THETA0 && typeof v === "number" && Number.isFinite(v)) th[k] = v;
  for (const defs of Object.values(PARAM_DEFS)) for (const [k, , lo, hi, step] of defs) th[k] = Math.min(hi, Math.max(lo, step >= 1 ? Math.round(th[k]) : th[k]));
  if (th.b <= th.a) th.b = th.a + 0.5;
  const ok = NUMERIC.some((o) => o.ds.id === p.dataset && o.c.name === p.column);
  return {
    ...p,
    theta: th,
    interval: Array.isArray(p.interval) && p.interval.length === 2 ? [Math.min(p.interval[0], p.interval[1]), Math.max(p.interval[0], p.interval[1])] : DEFAULTS.interval,
    bins: Math.min(50, Math.max(4, Math.round(p.bins))),
    dataset: ok ? p.dataset : DEFAULTS.dataset,
    column: ok ? p.column : DEFAULTS.column,
  };
}

export default function DistributionStudio(props: LabProps) {
  const lab = useLab<DistParams>("distribution-studio", DEFAULTS, { ...props, normalize: normalizeDist });
  const { params: P, set, setMany, lang } = lab;
  const t = DS_T[lang];
  const svgRef = useRef<SVGSVGElement>(null);
  const F = family(P.family, P.theta) as Family;
  const [lo, hi] = F.support;
  const X = (x: number) => 30 + ((x - lo) / (hi - lo)) * 700;
  const XI = (px: number) => lo + ((px - 30) / 700) * (hi - lo);
  const a = Math.max(lo, Math.min(hi, P.interval[0]));
  const b = Math.max(lo, Math.min(hi, P.interval[1]));
  const drag = useSvgDrag<0 | 1>(svgRef, (i, pt) => {
    let v = Math.max(lo, Math.min(hi, XI(pt.x)));
    v = F.discrete ? Math.round(v) : Math.round(v * 100) / 100;
    const next: [number, number] = [a, b];
    next[i] = v;
    set("interval", [Math.min(...next), Math.max(...next)] as [number, number]);
  });
  const setEnd = (i: 0 | 1, v: number) => {
    const next: [number, number] = [a, b];
    next[i] = Math.max(lo, Math.min(hi, v));
    set("interval", [Math.min(...next), Math.max(...next)] as [number, number]);
  };
  const digits = F.discrete ? 0 : 2;

  // ── theory geometry ──
  let maxY = 0;
  if (F.discrete) for (let k = lo; k <= hi; k++) maxY = Math.max(maxY, F.density(k));
  else {
    for (let i = 0; i <= 200; i++) maxY = Math.max(maxY, F.density(lo + ((hi - lo) * i) / 200));
    const atMean = F.mean !== null ? F.density(F.mean) * 1.5 : 0;
    if (atMean > 0) maxY = Math.min(maxY, atMean);
  }
  const Y = (v: number) => 250 - Math.min(v / maxY, 1.05) * 200;
  const prob = intervalProbability(F, a, b);
  const cdfY = (v: number) => 150 - v * 120;
  const pmfBars = F.discrete
    ? Array.from({ length: hi - lo + 1 }, (_, k) => {
        const x = lo + k;
        const p = F.density(x);
        const w = Math.max(2, 700 / (hi - lo + 1) - 2);
        return { x, px: X(x) - w / 2, w, y: Y(p), h: 250 - Y(p), p, inA: x > a && x <= b };
      })
    : [];
  const cdfPath = F.discrete
    ? Array.from({ length: hi - lo + 1 }, (_, k) => {
        const x = lo + k;
        return (k ? "L" : "M") + X(x - 0.5).toFixed(1) + "," + cdfY(F.cdf(x - 1)).toFixed(1) + " L" + X(x + 0.5).toFixed(1) + "," + cdfY(F.cdf(x - 1)).toFixed(1);
      }).join(" ")
    : curvePath(F.cdf, lo, hi, X, cdfY, 220);
  const tickVals = ticks(lo, hi, F.discrete && hi - lo <= 20 ? hi - lo : 7);
  const paramTxt = PARAM_DEFS[P.family].map(([k, l, , , st]) => `${l} = ${fmt((P.theta as Record<string, number>)[k], st < 1 ? 2 : 0)}`).join(", ");
  const famTitle = `${FAM_LABEL[P.family]}(${paramTxt})`;
  const setTheta = (k: string, v: number) => {
    const th = { ...(P.theta as Record<string, number>), [k]: v };
    if (P.family === "uniform" && th.b <= th.a) th.b = th.a + 0.5;
    set("theta", th);
  };
  const pickFamily = (k: FamilyName) => {
    const G = family(k, P.theta) as Family;
    const m = G.mean ?? (G.support[0] + G.support[1]) / 2;
    const sd = G.sd ?? (G.support[1] - G.support[0]) / 6;
    const r = (v: number) => (G.discrete ? Math.round(v) : Math.round(v * 100) / 100);
    setMany({ family: k, interval: [r(m - sd), r(m + sd)] });
  };
  const intervalPreset = (i: number) => {
    const m = F.mean ?? 0;
    const sd = F.sd ?? 1;
    const r = (v: number) => (F.discrete ? Math.round(v) : Math.round(v * 100) / 100);
    if (i < 2) {
      const z = [1, 1.96][i];
      set("interval", [r(m - z * sd), r(m + z * sd)]);
    } else set("interval", [r(F.quantile(0.95)), r(hi)]);
  };

  // ── data mode ──
  const src = NUMERIC.find((o) => o.ds.id === P.dataset && o.c.name === P.column) ?? NUMERIC[0];
  let xs = src.ds.rows.map((r) => r[src.j]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  let varLabel = src.c.label;
  let transformNote = "";
  if (P.transform === "log") {
    const nonPos = xs.filter((v) => v <= 0).length;
    xs = xs.filter((v) => v > 0).map(Math.log);
    varLabel = `log(${varLabel})`;
    if (nonPos) transformNote = lang === "hu" ? `${nonPos} nem pozitív érték kimaradt (log nem értelmezett).` : `${nonPos} non-positive values dropped (log undefined).`;
  } else if (P.transform === "z") {
    xs = zscores(xs) ?? xs;
    varLabel = `z(${varLabel})`;
  } else if (P.transform === "rank") {
    xs = ranks(xs);
    varLabel = `rank(${varLabel})`;
  }
  const d = describe(xs);
  const fn = fiveNumber(xs);
  const sk = skewness(xs);
  const H = histogram(xs, P.bins);
  const dlo = Math.min(...xs);
  const dhi = Math.max(...xs);
  const DX = (x: number) => 30 + ((x - dlo) / (dhi - dlo || 1)) * 700;
  const maxD = Math.max(...H.bins.map((bn) => bn.density), 1e-12);
  const DY = (v: number) => 250 - (v / maxD) * 200;
  const big = Math.abs(dhi) > 1000;
  const ff = (v: number | null | undefined) => (v === null || v === undefined ? "—" : big ? Math.round(v).toLocaleString(lang === "hu" ? "hu-HU" : "en-US") : fmt(v, 2));

  const readouts: Readout[] =
    P.mode === "theory"
      ? [
          { label: "P(a < X ≤ b)", value: prob, digits: 4, tone: "explained" },
          { label: "F(a)", value: F.cdf(a), digits: 4 },
          { label: "F(b)", value: F.cdf(b), digits: 4 },
          { label: "E[X]", value: F.mean === null ? (lang === "hu" ? "— (nem létezik)" : "— (undefined)") : F.mean, digits: 3, tone: "model" },
          { label: "SD", value: F.sd === null ? (lang === "hu" ? "— (nem létezik)" : "— (undefined)") : F.sd, digits: 3, tone: "model" },
          { label: "q₀.₀₂₅ / q₀.₉₇₅", value: `${fmt(F.quantile(0.025), 2)} / ${fmt(F.quantile(0.975), 2)}` },
        ]
      : [
          { label: "n", value: String(xs.length) },
          { label: "x̄", value: ff(d.mean), tone: "residual" },
          { label: lang === "hu" ? "medián" : "median", value: ff(fn?.median), tone: "explained" },
          { label: "s", value: ff(d.sd) },
          { label: "g₁ (G₁)", value: sk ? `${fmt(sk.g1, 3)} (${fmt(sk.G1, 3)})` : "—" },
          { label: lang === "hu" ? "csúcsosság (többlet)" : "kurtosis (excess)", value: kurtosis(xs), digits: 3 },
          { label: "Q1 · Q3", value: fn ? `${ff(fn.q1)} · ${ff(fn.q3)}` : "—" },
          { label: lang === "hu" ? "kiugrók (> 1,5·IQR)" : "outliers (> 1.5·IQR)", value: String(fn?.outliers.length ?? 0) },
        ];

  const demos: TeachDemo[] = [
    { title: "N(0, 1): μ ± 1.96σ", note: t.insight.theory, apply: () => setMany({ mode: "theory", family: "normal", theta: { ...THETA0, mu: 0, sigma: 1 }, interval: [-1.96, 1.96] }) },
    { title: "t(2) vs N(0, 1)", note: lang === "hu" ? "Kis szabadságfoknál a t-eloszlás farkai vastagabbak." : "With few degrees of freedom the t distribution has heavier tails.", apply: () => setMany({ mode: "theory", family: "t", theta: { ...THETA0, df: 2 }, interval: [-1.96, 1.96] }) },
    { title: "Binomial(20, .3)", note: t.insight.theory, apply: () => setMany({ mode: "theory", family: "binomial", theta: { ...THETA0, n: 20, p: 0.3 }, interval: [3, 8] }) },
    { title: lang === "hu" ? "Jövedelem: log" : "Income: log", note: t.insight.data, apply: () => setMany({ mode: "data", dataset: "ds.household-income", column: "income", transform: "log" }) },
  ];

  const aside = (
    <>
      {P.mode === "theory" ? (
        <Panel title={t.family}>
          <div className="space-y-3">
            <ChoiceControl<FamilyName> label={t.family} hideLabel param="family" value={P.family} onChange={pickFamily} options={(Object.keys(FAM_LABEL) as FamilyName[]).map((k) => ({ value: k, label: FAM_LABEL[k] }))} />
            {PARAM_DEFS[P.family].map(([k, l, mn, mx, st]) => (
              <ParameterControl key={k} label={l} value={(P.theta as Record<string, number>)[k]} min={mn} max={mx} step={st} onChange={(v) => setTheta(k, v)} param="theta" />
            ))}
            <ParameterControl label="a" value={a} min={lo} max={hi} step={F.discrete ? 1 : 0.01} onChange={(v) => setEnd(0, v)} param="interval" />
            <ParameterControl label="b" value={b} min={lo} max={hi} step={F.discrete ? 1 : 0.01} onChange={(v) => setEnd(1, v)} param="interval" />
          </div>
        </Panel>
      ) : (
        <Panel title={t.variable}>
          <div className="space-y-3">
            <SelectControl<string>
              label={t.variable}
              value={`${src.ds.id}|${src.c.name}`}
              onChange={(v) => {
                const [ds, col] = v.split("|");
                setMany({ dataset: ds, column: col });
              }}
              options={NUMERIC.map((o) => ({ value: `${o.ds.id}|${o.c.name}`, label: `${o.ds.title[lang]} · ${o.c.label}` }))}
              param="column"
            />
            <ChoiceControl<Transform> label={t.transform} param="transform" value={P.transform} onChange={(v) => set("transform", v)} options={(["none", "log", "z", "rank"] as const).map((k) => ({ value: k, label: t[k] }))} />
            <ParameterControl label={t.bins} value={P.bins} min={4} max={50} step={1} onChange={(v) => set("bins", v)} param="bins" />
          </div>
        </Panel>
      )}
      <Panel title={lang === "hu" ? "Kiolvasások" : "Readouts"}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
    </>
  );

  const live = P.mode === "theory" ? t.live.replace("{p}", fmt(prob, 4)) : `${varLabel}: mean ${ff(d.mean)}, median ${ff(fn?.median)}`;

  return (
    <LabShell
      lab={lab}
      title={t.title}
      aside={aside}
      demos={demos}
      method={P.mode === "theory" ? `${famTitle}: ${lang === "hu" ? "sűrűség, eloszlásfüggvény, kvantilis" : "density, CDF, quantile"}` : lang === "hu" ? "Kvantilisek R 7-es típus; ferdeség g₁ és G₁; kiugrók 1,5·IQR" : "Quantiles R type 7; skewness g₁ and G₁; outliers beyond 1.5·IQR"}
      toolbar={<ChoiceControl<Mode> label={t.mode} hideLabel size="md" param="mode" value={P.mode} onChange={(v) => set("mode", v)} options={(["theory", "data"] as const).map((v) => ({ value: v, label: t[v] }))} />}
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <p className="mt-2 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">{t.formula[P.mode]}</p>
          <p className="mt-2 text-sm text-ink">{t.insight[P.mode]}</p>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[P.mode]}</p>
        {P.mode === "theory" ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm text-ink">{famTitle}</span>
              <PresetBar presets={t.intervals.map((l, i) => ({ id: String(i), label: l }))} onPick={(id) => intervalPreset(+id)} label={lang === "hu" ? "Intervallumok" : "Intervals"} />
            </div>
            <AccessibleVisualization
              interactive
              svgRef={svgRef}
              onPointerMove={drag.move}
              onPointerUp={drag.end}
              viewBox="0 0 760 280"
              summary={`${famTitle}: P(${fmt(a, digits)} < X ≤ ${fmt(b, digits)}) = ${fmt(prob, 4)}`}
              table={
                F.discrete
                  ? { caption: famTitle, columns: ["x", "P(X = x)", "F(x)"], rows: pmfBars.map((bn) => [bn.x, fmt(bn.p, 4), fmt(F.cdf(bn.x), 4)]) }
                  : { caption: famTitle, columns: ["x", "f(x)", "F(x)"], rows: ticks(lo, hi, 16).map((x) => [fmt(x, 2), fmt(F.density(x), 4), fmt(F.cdf(x), 4)]) }
              }
            >
              {F.discrete ? (
                pmfBars.map((bn) => <rect key={bn.x} x={bn.px} width={bn.w} y={bn.y} height={bn.h} fill={bn.inA ? "var(--explained)" : "var(--data)"} />)
              ) : (
                <>
                  <path d={areaPath(F.density, a, b, X, Y, 250)} fill="var(--explained)" fillOpacity={0.4} />
                  <path d={curvePath(F.density, lo, hi, X, Y, 220)} fill="none" stroke="var(--ink)" strokeWidth={2} />
                </>
              )}
              {F.mean !== null && <line x1={X(F.mean)} x2={X(F.mean)} y1={46} y2={250} stroke="var(--model-ink)" strokeDasharray="3 3" />}
              <line x1={30} x2={730} y1={250} y2={250} stroke="var(--border)" />
              <g aria-hidden>
                {tickVals.map((v) => (
                  <text key={v} x={X(v)} y={268} fontSize={10} fill="var(--faint)" textAnchor="middle">
                    {F.discrete ? Math.round(v) : fmt(v, Math.abs(hi - lo) > 20 ? 0 : 2)}
                  </text>
                ))}
                <text x={(X(a) + X(b)) / 2} y={30} fontSize={12} fontWeight={600} fill="var(--explained-ink)" textAnchor="middle">
                  P({fmt(a, digits)} &lt; X ≤ {fmt(b, digits)}) = {fmt(prob, 4)}
                </text>
                {F.mean !== null && (
                  <text x={X(F.mean) + 4} y={52} fontSize={10} fill="var(--model-ink)">
                    E[X] = {fmt(F.mean, 2)}
                  </text>
                )}
              </g>
              {([0, 1] as const).map((i) => (
                <DragHandle
                  key={i}
                  x={X(i ? b : a)}
                  y={250}
                  orientation="horizontal"
                  label={i ? "b" : "a"}
                  value={i ? b : a}
                  min={lo}
                  max={hi}
                  step={F.discrete ? 1 : Math.max(0.01, +((hi - lo) / 100).toFixed(2))}
                  valueText={`${i ? "b" : "a"} = ${fmt(i ? b : a, digits)}`}
                  onStart={(e) => drag.start(i, e)}
                  onValue={(v) => setEnd(i, v)}
                  fill="var(--explained-ink)"
                  className={drag.dragging ? "lab-fast" : "lab-tr"}
                >
                  <line x1={0} x2={0} y1={-210} y2={0} stroke="var(--explained-ink)" strokeWidth={1.5} />
                  <text y={4} fontSize={10} fill="var(--surface)" textAnchor="middle" aria-hidden>
                    {i ? "b" : "a"}
                  </text>
                </DragHandle>
              ))}
            </AccessibleVisualization>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.cdf}</h2>
            <AccessibleVisualization viewBox="0 0 760 170" summary={`F(a) = ${fmt(F.cdf(a), 3)}, F(b) = ${fmt(F.cdf(b), 3)}, F(b) − F(a) = ${fmt(prob, 4)}`}>
              <rect x={X(a)} y={cdfY(F.cdf(b))} width={Math.max(0, X(b) - X(a))} height={Math.max(0, cdfY(F.cdf(a)) - cdfY(F.cdf(b)))} fill="var(--explained)" fillOpacity={0.15} />
              <line x1={30} x2={730} y1={cdfY(0)} y2={cdfY(0)} stroke="var(--border)" />
              <line x1={30} x2={730} y1={cdfY(1)} y2={cdfY(1)} stroke="var(--grid)" />
              <path d={cdfPath} fill="none" stroke="var(--ink)" strokeWidth={2} />
              <line x1={X(b)} x2={X(b)} y1={cdfY(F.cdf(a))} y2={cdfY(F.cdf(b))} stroke="var(--explained-ink)" strokeWidth={3} />
              <line x1={30} x2={X(b)} y1={cdfY(F.cdf(b))} y2={cdfY(F.cdf(b))} stroke="var(--explained-ink)" strokeDasharray="2 3" />
              <line x1={30} x2={X(a)} y1={cdfY(F.cdf(a))} y2={cdfY(F.cdf(a))} stroke="var(--explained-ink)" strokeDasharray="2 3" />
              <g aria-hidden fontSize={10}>
                <text x={32} y={cdfY(F.cdf(a)) - 4} fill="var(--explained-ink)">
                  {fmt(F.cdf(a), 3)}
                </text>
                <text x={32} y={cdfY(F.cdf(b)) - 4} fill="var(--explained-ink)">
                  {fmt(F.cdf(b), 3)}
                </text>
                <text x={X(b) + 6} y={(cdfY(F.cdf(a)) + cdfY(F.cdf(b))) / 2 + 4} fill="var(--explained-ink)" fontSize={11}>
                  F(b) − F(a) = {fmt(prob, 4)}
                </text>
              </g>
            </AccessibleVisualization>
          </>
        ) : (
          <>
            <p className="font-mono text-xs text-muted">
              {varLabel} · {src.ds.provenance.kind} · n = {xs.length} · {src.ds.provenance.generator}
            </p>
            {transformNote && <LabNote>{transformNote}</LabNote>}
            <AccessibleVisualization
              viewBox="0 0 760 330"
              summary={`${varLabel}: ${live}`}
              table={{ caption: varLabel, columns: [lang === "hu" ? "sáv" : "bin", lang === "hu" ? "darab" : "count"], rows: H.bins.map((bn) => [`${ff(bn.lo)}–${ff(bn.hi)}`, bn.count]) }}
            >
              {H.bins.map((bn, i) => (
                <rect key={i} x={DX(bn.lo)} width={Math.max(1, DX(bn.hi) - DX(bn.lo) - 1)} y={DY(bn.density)} height={250 - DY(bn.density)} fill="var(--data)" fillOpacity={0.75} />
              ))}
              {d.sd ? <path d={curvePath((x) => normalPdf(x, d.mean as number, d.sd as number), dlo, dhi, DX, DY, 200)} fill="none" stroke="var(--model-ink)" strokeWidth={1.5} strokeDasharray="5 4" /> : null}
              {d.mean !== null && <line x1={DX(d.mean)} x2={DX(d.mean)} y1={36} y2={250} stroke="var(--residual-ink)" strokeWidth={2} />}
              {fn && <line x1={DX(fn.median)} x2={DX(fn.median)} y1={50} y2={250} stroke="var(--explained-ink)" strokeWidth={2} />}
              <line x1={30} x2={730} y1={250} y2={250} stroke="var(--border)" />
              {fn && (
                <g>
                  <line x1={DX(fn.whiskerLo)} x2={DX(fn.whiskerHi)} y1={295} y2={295} stroke="var(--ink)" />
                  <rect x={DX(fn.q1)} y={283} width={Math.max(1, DX(fn.q3) - DX(fn.q1))} height={24} fill="var(--surface-2)" stroke="var(--ink)" />
                  <line x1={DX(fn.median)} x2={DX(fn.median)} y1={283} y2={307} stroke="var(--explained-ink)" strokeWidth={2.5} />
                  {fn.outliers.map((v, i) => (
                    <circle key={i} cx={DX(v)} cy={295} r={2.5} fill="none" stroke="var(--residual-ink)" />
                  ))}
                </g>
              )}
              <g aria-hidden fontSize={10}>
                {ticks(dlo, dhi, 6).map((v) => (
                  <text key={v} x={DX(v)} y={266} fill="var(--faint)" textAnchor="middle">
                    {ff(v)}
                  </text>
                ))}
                {d.mean !== null && (
                  <text x={DX(d.mean) + 5} y={42} fill="var(--residual-ink)">
                    x̄ = {ff(d.mean)}
                  </text>
                )}
                {fn && (
                  <>
                    <text x={DX(fn.median) - 5} y={56} fill="var(--explained-ink)" textAnchor="end">
                      med = {ff(fn.median)}
                    </text>
                    <text x={DX(fn.q1)} y={322} fill="var(--muted)" textAnchor="middle">
                      Q1
                    </text>
                    <text x={DX(fn.q3)} y={322} fill="var(--muted)" textAnchor="middle">
                      Q3
                    </text>
                  </>
                )}
                <text x={700} y={42} fill="var(--model-ink)" textAnchor="end">
                  — — N(x̄, s)
                </text>
              </g>
            </AccessibleVisualization>
          </>
        )}
        <p className="text-xs text-faint">{P.mode === "theory" ? t.note.theory : `${src.ds.title[lang]}: ${src.ds.provenance.limits ?? ""}. ${lang === "hu" ? "Kvantilisek: R 7-es típus; ferdeség g₁ = m₃/m₂^1,5 és korrigált G₁ (SPSS); kiugró = 1,5·IQR-en túl." : "Quantiles use R type 7; skewness g₁ = m₃/m₂^1.5 and the adjusted G₁ (SPSS); outliers lie beyond 1.5·IQR."}`}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </LabShell>
  );
}

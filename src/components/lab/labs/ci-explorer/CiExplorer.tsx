"use client";

// Confidence Interval Explorer. Port of "QDA2 CI Explorer.dc.html". The population mean μ is fixed; every
// draw takes a real sample from a seeded finite population (SRS or two-stage cluster) and computes its
// interval with the engine in src/lib/engine/sampling.ts. Coverage counts are counts of those intervals.
import { fmt } from "@/lib/engine/format";
import { rng } from "@/lib/engine/rng";
import { ciInterval, coverageSimulation, criticalCache, expectedHalfWidth, makeClusteredPopulation, type CiDesign, type CiMethod, type CiOptions, type CiResult, type CoverageRun, type PopulationShape } from "@/lib/engine/sampling";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl, ToggleControl } from "../../primitives/controls";
import { FormulaInspector, HighlightProvider, LabNote, StatisticReadout, useHighlight, type FormulaRow, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { CI_T } from "./strings";

export interface CiParams extends Record<string, unknown> {
  population: PopulationShape;
  n: number;
  level: number;
  method: CiMethod;
  design: CiDesign;
  showNaive: boolean;
  seed: number;
}

const N = 2000;
const DEFAULTS: CiParams = { population: "normal", n: 30, level: 0.95, method: "t", design: "srs", showNaive: true, seed: 20261023 };

/** Clamps n and the level; Wald/Wilson only for the binary population, z/t otherwise allowed. */
export function normalizeCi(p: CiParams): CiParams {
  const n = Math.max(5, Math.min(200, Math.round(p.n / 5) * 5 || 30));
  const level = Math.max(0.5, Math.min(0.99, Math.round(p.level * 100) / 100));
  const binary = p.population === "binary";
  let method = p.method;
  if (!binary && (method === "wald" || method === "wilson")) method = "t";
  const seed = Number.isInteger(p.seed) && p.seed >= 1 && p.seed < 2147483647 ? p.seed : DEFAULTS.seed;
  return { ...p, n, level, method, seed };
}

const KEEP = 100;

export default function CiExplorer(props: LabProps) {
  const lab = useLab<CiParams>("ci-explorer", DEFAULTS, { ...props, normalize: normalizeCi });
  const { params: P, set, setMany, lang } = lab;
  const t = CI_T[lang];
  const hl = useHighlight();
  const binary = P.population === "binary";
  const pop = useMemo(() => makeClusteredPopulation(P.population, N, P.seed), [P.population, P.seed]);
  const opts: CiOptions = useMemo(() => ({ n: P.n, level: P.level, method: P.method, design: P.design, binary }), [P.n, P.level, P.method, P.design, binary]);
  const crit = useMemo(() => criticalCache(), []);
  const [intervals, setIntervals] = useState<CiResult[]>([]);
  const [longRun, setLongRun] = useState<CoverageRun | null>(null);
  const draws = useRef(0);

  // Any change to the population, design, n, level or method starts a new experiment.
  useEffect(() => {
    setIntervals([]);
    setLongRun(null);
    draws.current = 0;
  }, [pop, opts, lab.resetCount]);

  const draw = (k: number) => {
    draws.current += 1;
    const rand = rng(P.seed * 31 + draws.current);
    const add: CiResult[] = [];
    for (let i = 0; i < k; i++) {
      const iv = ciInterval(pop, opts, rand, crit);
      if (iv) add.push(iv);
    }
    setIntervals((cur) => cur.concat(add).slice(-KEEP));
  };
  const runLong = () => {
    draws.current += 1;
    setLongRun(coverageSimulation(pop, opts, 2000, rng(P.seed * 77 + draws.current)));
  };

  const iv = intervals;
  const cover = iv.filter((x) => x.covers).length;
  const naiveCover = iv.filter((x) => x.naiveCovers).length;
  const pct = (k: number, of: number, d = 0) => (of ? fmt((100 * k) / of, d) + " %" : "—");
  const covTxt = pct(cover, iv.length);
  const levelTxt = fmt(P.level * 100, 0) + " %";
  const last = iv[iv.length - 1];
  const cluster = P.design === "cluster";
  const proportionMethod = binary && P.method !== "t";
  const hwOpts = proportionMethod ? { ...opts, design: "srs" as const } : opts;
  const expHalf = expectedHalfWidth(pop, hwOpts);
  const digits = binary ? 3 : 2;

  // ── interval chart geometry (centred on μ) ──
  let half = Math.max(expHalf * 2.4, binary ? 0.08 : 3);
  for (const r of iv) {
    half = Math.max(half, Math.abs(r.lo - pop.mu) * 1.05, Math.abs(r.hi - pop.mu) * 1.05);
    if (r.naive && P.showNaive) half = Math.max(half, Math.abs(r.naive.lo - pop.mu) * 1.05, Math.abs(r.naive.hi - pop.mu) * 1.05);
  }
  const lo = pop.mu - half;
  const hi = pop.mu + half;
  const X = (v: number) => 40 + ((v - lo) / (hi - lo)) * 680;
  const cx = (v: number) => Math.min(720, Math.max(40, X(v)));
  const rowH = iv.length > 50 ? 5.2 : iv.length > 20 ? 8 : 14;
  const svgH = Math.max(120, 16 + iv.length * rowH + 30);
  const axisY = svgH - 22;
  const thick = rowH > 8;

  // ── width-vs-n curve ──
  const ns: number[] = [];
  for (let n = 5; n <= 200; n += 5) ns.push(n);
  const hws = ns.map((n) => expectedHalfWidth(pop, { ...hwOpts, n }));
  // With a = 2 clusters (n < 25) the t(1) critical value dominates; scale the axis from n = 25 and clip.
  const hmax = cluster && !proportionMethod ? hws[ns.indexOf(25)] : Math.max(...hws);
  const WX = (n: number) => 40 + ((n - 5) / 195) * 300;
  const WY = (h: number) => Math.max(12, 120 - (h / hmax) * 100);
  const widthPath = ns.map((n, i) => (i ? "L" : "M") + WX(n).toFixed(1) + "," + WY(hws[i]).toFixed(1)).join(" ");

  const methodLabel = (r: CiResult) =>
    r.method === "cluster-t"
      ? lang === "hu"
        ? `t, df = a − 1 = ${(r.clusters ?? 0) - 1}, SE a klaszterátlagokból`
        : `t, df = a − 1 = ${(r.clusters ?? 0) - 1}, SE from cluster means (ultimate cluster)`
      : r.method === "t"
        ? "t, df = n − 1"
        : t.methods[r.method];

  const readouts: Readout[] = [
    { label: "μ", value: pop.mu, digits: binary ? 3 : 2 },
    { label: "σ", value: pop.sigma, digits: binary ? 3 : 2 },
    { label: `${t.coverage} (${iv.length})`, value: covTxt, tone: "explained" },
  ];
  if (cluster && iv.length && !proportionMethod) readouts.push({ label: lang === "hu" ? `naiv ${t.coverage}` : `naive ${t.coverage}`, value: pct(naiveCover, iv.length), tone: "attention" });
  if (last) {
    readouts.push(
      { label: binary ? "p̂" : "x̄", value: last.mean, digits: 3, tone: "data", hl: "mean" },
      { label: "SE", value: last.se, digits: 3, tone: "model", hl: "se" },
      { label: "CI", value: `[${fmt(last.lo, digits)}, ${fmt(last.hi, digits)}]`, tone: "model" },
      { label: lang === "hu" ? "félszélesség" : "half-width", value: (last.hi - last.lo) / 2, digits: 3, tone: "model", hl: "crit" },
    );
  }
  readouts.push({ label: lang === "hu" ? "várható félszélesség" : "expected half-width", value: expHalf, digits: 3, tone: "muted" });

  const term = (text: string, key: string, italic = false) => ({ text, key, italic });
  const formulaRows: FormulaRow[] = proportionMethod
    ? P.method === "wilson"
      ? [{ terms: ["(", term("p̂", "mean", true), "+ z²/2n ±", term("z", "crit", true), "√(", term("p̂(1−p̂)/n", "se"), "+ z²/4n²)) / (1 + z²/n)"] }]
      : [{ terms: [term("p̂", "mean", true), "±", term("z", "crit", true), "·", term("√(p̂(1−p̂)/n)", "se")] }]
    : cluster
      ? [{ terms: [term("x̄", "mean", true), "±", term("t₍ₐ₋₁₎", "crit", true), "·", term("s_c/√a", "se")] }]
      : [{ terms: [term("x̄", "mean", true), "±", term(P.method === "z" ? "z_{α/2}" : "t₍ₙ₋₁, α/2₎", "crit", true), "·", term("s/√n", "se")] }];
  const explain: Record<string, string> =
    lang === "hu"
      ? {
          mean: "A minta becslése: minden mintában más, ezért mozog az intervallum közepe.",
          crit: `A kritikus érték a megbízhatósági szinttől függ (${levelTxt}); magasabb szint → szélesebb intervallum.`,
          se: cluster && !proportionMethod ? "Csoportos mintánál a standard hiba az a klaszterátlag szórásából jön: a klaszteren belüli hasonlóság miatt nagyobb, mint s/√n." : "A standard hiba: a becslés mintáról mintára való ingadozása; 1/√n-nel csökken.",
        }
      : {
          mean: "The sample estimate: it differs from sample to sample, so the centre of the interval moves.",
          crit: `The critical value depends on the confidence level (${levelTxt}); a higher level gives a wider interval.`,
          se: cluster && !proportionMethod ? "In the cluster design the SE comes from the spread of the a cluster means: similar units within a cluster make it larger than s/√n." : "The standard error: how much the estimate varies from sample to sample; it shrinks with 1/√n.",
        };

  const longRunTxt = longRun
    ? t.longRunTxt
        .replace("{c}", pct(longRun.cover, longRun.count, 1))
        .replace("{naive}", longRun.naive !== null ? (lang === "hu" ? ", naiv " : ", naive ") + pct(longRun.naive, longRun.count, 1) : "")
        .replace("{lvl}", levelTxt)
    : "";
  const live = t.live.replace("{k}", String(iv.length)).replace("{c}", covTxt);

  const demos: TeachDemo[] = [
    { title: lang === "hu" ? "95 %, EVM" : "95 %, SRS", note: t.interp.srs.replace("{lvl}", "95 %"), apply: () => setMany({ population: "normal", design: "srs", level: 0.95, n: 30, method: "t" }) },
    { title: lang === "hu" ? "Kis n, 80 %" : "Small n, 80 %", note: t.interp.srs.replace("{lvl}", "80 %"), apply: () => setMany({ design: "srs", level: 0.8, n: 10 }) },
    { title: lang === "hu" ? "Klasztercsapda" : "Cluster trap", note: t.interp.cluster, apply: () => setMany({ population: "normal", design: "cluster", level: 0.95, n: 100, method: "t", showNaive: true }) },
    { title: "Wald vs Wilson", note: lang === "hu" ? "Bináris populáció, kis n: a Wald-intervallum alul fed, a Wilson közelebb marad a névlegeshez." : "Binary population, small n: Wald under-covers, Wilson stays closer to nominal.", apply: () => setMany({ population: "binary", design: "srs", n: 20, method: "wald" }) },
  ];

  const methodOptions = (binary ? (["wald", "wilson", "t"] as const) : (["t", "z"] as const)).map((v) => ({ value: v as CiMethod, label: t.methods[v] }));

  const aside = (
    <>
      <Panel title={t.population}>
        <div className="space-y-3">
          <ChoiceControl<PopulationShape>
            label={t.population}
            hideLabel
            param="population"
            value={P.population}
            onChange={(v) => setMany({ population: v, method: v === "binary" ? "wilson" : "t" })}
            options={(["normal", "skewed", "bimodal", "binary"] as const).map((k) => ({ value: k, label: t.pops[k] }))}
          />
          <ParameterControl label={t.n} value={P.n} min={5} max={200} step={5} onChange={(v) => set("n", v)} param="n" />
          <ParameterControl label={t.level} value={P.level} min={0.5} max={0.99} step={0.01} onChange={(v) => set("level", v)} param="level" format={(v) => fmt(v * 100, 0) + " %"} />
          <ChoiceControl<CiMethod> label={t.method} value={P.method} onChange={(v) => set("method", v)} options={methodOptions} param="method" />
          <ChoiceControl<CiDesign> label={t.design} value={P.design} onChange={(v) => set("design", v)} options={(["srs", "cluster"] as const).map((v) => ({ value: v, label: t.designs[v] }))} param="design" />
          {cluster && (
            <>
              <ToggleControl label={t.showNaive} checked={P.showNaive} onChange={(v) => set("showNaive", v)} param="showNaive" />
              <p className="text-xs leading-relaxed text-muted">{t.clusterNote}</p>
            </>
          )}
        </div>
      </Panel>
      <Panel title={t.draw}>
        <div className="flex flex-wrap gap-2">
          {[1, 20, 100].map((k) => (
            <LabButton key={k} variant="primary" onClick={() => draw(k)}>
              {k}
              <span className="sr-only"> {lang === "hu" ? "minta húzása" : k === 1 ? "sample" : "samples"}</span>
            </LabButton>
          ))}
          <LabButton onClick={runLong}>{t.longRun}</LabButton>
          <LabButton
            onClick={() => {
              setIntervals([]);
              setLongRun(null);
            }}
          >
            {t.reset}
          </LabButton>
        </div>
        {longRun && <p className="mt-2 text-xs leading-relaxed text-ink" role="status">{longRunTxt}</p>}
        <div className="mt-3">
          <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
        </div>
      </Panel>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
    </>
  );

  return (
    <HighlightProvider value={hl}>
      <LabShell
        lab={lab}
        title={t.title}
        subtitle={lang === "hu" ? "ismételt minták → ismételt intervallumok → lefedés" : "repeated samples → repeated intervals → coverage"}
        aside={aside}
        demos={demos}
        method={last ? methodLabel(last) : lang === "hu" ? "t-, z-, Wald- és Wilson-intervallum; csoportos mintánál ultimate-cluster SE" : "t, z, Wald and Wilson intervals; ultimate-cluster SE for the cluster design"}
        below={<FormulaInspector rows={formulaRows} explain={explain} fallback={t.caution} />}
      >
        <div className="space-y-4">
          <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead}</p>
          <section aria-label={t.intervals}>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-muted">
              <span className="font-semibold uppercase tracking-wider">
                {t.intervals} · {iv.length} {t.samples}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-[3px] w-3.5 bg-explained" aria-hidden />
                {t.covers}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-[3px] w-3.5 bg-residual" aria-hidden />
                {t.misses}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 border-l-2 border-dashed border-ink" aria-hidden />μ {t.fixed}
              </span>
              <span className="ml-auto font-mono text-sm text-ink" data-testid="ci-coverage">
                {t.coverage} <span className="font-semibold">{covTxt}</span> · {t.nominal} {levelTxt}
              </span>
            </div>
            <AccessibleVisualization
              summary={`${t.intervals}: ${live}`}
              viewBox={`0 0 760 ${svgH}`}
              table={{
                caption: t.intervals,
                columns: ["#", binary ? "p̂" : "x̄", "CI", t.covers + "?", ...(cluster && !proportionMethod ? [lang === "hu" ? "naiv CI" : "naive CI"] : [])],
                rows: iv.map((r, i) => [
                  i + 1,
                  fmt(r.mean, 3),
                  `[${fmt(r.lo, digits)}, ${fmt(r.hi, digits)}]`,
                  r.covers ? (lang === "hu" ? "igen" : "yes") : lang === "hu" ? "nem" : "no",
                  ...(r.naive ? [`[${fmt(r.naive.lo, digits)}, ${fmt(r.naive.hi, digits)}]`] : []),
                ]),
              }}
            >
              <line x1={X(pop.mu)} x2={X(pop.mu)} y1={6} y2={axisY} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="4 3" />
              {iv.map((r, i) => {
                const y = 12 + i * rowH;
                const color = r.covers ? "var(--explained)" : "var(--residual)";
                const emph = hl.key === "se" || hl.key === "crit";
                return (
                  <g key={i}>
                    <line x1={cx(r.lo)} x2={cx(r.hi)} y1={y} y2={y} stroke={color} strokeWidth={(thick ? 2.5 : 1.6) * (emph ? 1.6 : 1)} />
                    <circle cx={X(r.mean)} cy={y} r={(thick ? 3 : 1.8) * (hl.key === "mean" ? 1.6 : 1)} fill={hl.key === "mean" ? "var(--data)" : color} />
                    {r.naive && P.showNaive && (
                      <line x1={cx(r.naive.lo)} x2={cx(r.naive.hi)} y1={y + (thick ? 4 : 2)} y2={y + (thick ? 4 : 2)} stroke={r.naiveCovers ? "var(--faint)" : "var(--attention)"} strokeWidth={1.5} strokeDasharray="2 2" />
                    )}
                  </g>
                );
              })}
              <line x1={40} x2={720} y1={axisY} y2={axisY} stroke="var(--border)" />
              {[0, 0.25, 0.5, 0.75, 1].map((q) => (
                <text key={q} x={40 + q * 680} y={axisY + 14} fontSize={10} fill="var(--faint)" textAnchor="middle" aria-hidden>
                  {fmt(lo + (hi - lo) * q, binary ? 2 : 1)}
                </text>
              ))}
            </AccessibleVisualization>
            {!iv.length && <p className="mt-2 text-center text-sm text-muted">{t.pressDraw}</p>}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section aria-label={t.widthCurve}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.widthCurve}</h2>
              <AccessibleVisualization
                summary={`${t.widthCurve}: n = ${P.n} → ${fmt(expHalf, 3)}`}
                viewBox="0 0 360 150"
                table={{ caption: t.widthCurve, columns: ["n", lang === "hu" ? "félszélesség" : "half-width"], rows: ns.filter((n) => n % 25 === 0 || n === 5).map((n) => [n, fmt(hws[ns.indexOf(n)], 3)]) }}
              >
                <path d={widthPath} fill="none" stroke="var(--model)" strokeWidth={2} />
                <line x1={40} x2={340} y1={120} y2={120} stroke="var(--border)" />
                <g className="lab-tr" style={{ transform: `translate(${WX(P.n)}px, ${WY(expHalf)}px)` }}>
                  <circle r={5} fill="var(--ink)" />
                </g>
                <g aria-hidden>
                  {[5, 50, 100, 150, 200].map((n) => (
                    <text key={n} x={WX(n)} y={136} fontSize={10} fill="var(--faint)" textAnchor="middle">
                      n={n}
                    </text>
                  ))}
                  <text x={36} y={WY(hmax) + 3} fontSize={10} fill="var(--faint)" textAnchor="end">
                    {fmt(hmax, binary ? 2 : 1)}
                  </text>
                  <text x={36} y={123} fontSize={10} fill="var(--faint)" textAnchor="end">
                    0
                  </text>
                </g>
              </AccessibleVisualization>
            </section>
            <section aria-label={t.interpretation} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.interpretation}</h2>
              <p className="text-sm leading-relaxed text-ink">{t.interp[P.design].replace("{lvl}", levelTxt)}</p>
              <p className="border-l-2 border-attention pl-2 text-xs leading-relaxed text-muted">{t.caution}</p>
              {binary && P.method === "wald" && <LabNote>{lang === "hu" ? "A Wald-intervallum kis n-nél és szélső p-nél alul fed, és kiléphet a [0, 1] tartományból." : "The Wald interval under-covers at small n and extreme p, and can extend outside [0, 1]."}</LabNote>}
            </section>
          </div>
          <p className="text-xs text-faint">{t.synthetic}</p>
          <p className="sr-only" aria-live="polite">
            {live}
          </p>
        </div>
      </LabShell>
    </HighlightProvider>
  );
}

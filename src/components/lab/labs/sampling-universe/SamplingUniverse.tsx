"use client";

// Sampling Universe: population → sample → sampling distribution. Port of "QDA2 Sampling Universe.dc.html".
// A finite synthetic population (seeded) is sampled without replacement; every statistic shown is computed
// from the drawn units. Bootstrap mode resamples the current sample instead.
import { median } from "@/lib/engine/descriptives";
import { normalPdf } from "@/lib/engine/distributions";
import { fmt } from "@/lib/engine/format";
import { rng, type Rand } from "@/lib/engine/rng";
import { bootstrap, describe, histogram, makePopulation, popParams, srs, statistic, theorySE, type PopulationShape, type SampleStatistic } from "@/lib/engine/sampling";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl, SelectControl, ToggleControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization } from "../../primitives/visual";
import { LabShell, Panel } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { SU_T } from "./strings";

export interface SamplingParams extends Record<string, unknown> {
  population: PopulationShape;
  N: number;
  n: number;
  statistic: SampleStatistic;
  seed: number;
  showTheory: boolean;
}

const DEFAULTS: SamplingParams = { population: "skewed", N: 2000, n: 30, statistic: "mean", seed: 20261023, showTheory: false };

/** Clamps sizes and keeps the statistic compatible with the population (binary ↔ proportion). */
export function normalizeSampling(p: SamplingParams): SamplingParams {
  const N = Math.max(200, Math.min(5000, Math.round(p.N)));
  const n = Math.max(2, Math.min(Math.min(500, Math.floor(N / 2)), Math.round(p.n)));
  const binary = p.population === "binary";
  let st = p.statistic;
  if (binary && (st === "mean" || st === "median")) st = "proportion";
  if (!binary && st === "proportion") st = "mean";
  const seed = Number.isInteger(p.seed) && p.seed >= 1 && p.seed < 2147483647 ? p.seed : DEFAULTS.seed;
  return { ...p, N, n, statistic: st, seed };
}

const SYM: Record<SampleStatistic, string> = { mean: "x̄", median: "med", var_n: "s²ₙ", var_n1: "s²", proportion: "p̂" };

export default function SamplingUniverse(props: LabProps) {
  const lab = useLab<SamplingParams>("sampling-universe", DEFAULTS, { ...props, normalize: normalizeSampling });
  const { params: P, set, lang } = lab;
  const t = SU_T[lang];
  const pop = useMemo(() => makePopulation(P.population, P.N, P.seed), [P.population, P.N, P.seed]);
  const randRef = useRef<Rand>(rng(P.seed + 1));
  const [sampleIdx, setSampleIdx] = useState<number[]>([]);
  const [stats, setStats] = useState<number[]>([]);
  const [boot, setBoot] = useState(false);

  // A new population (shape, N or seed) or a reset restarts the random stream and clears the draws.
  useEffect(() => {
    randRef.current = rng(P.seed + 1);
    setSampleIdx([]);
    setStats([]);
    setBoot(false);
  }, [pop, P.seed, lab.resetCount]);
  // A new n or statistic clears the accumulated sampling distribution.
  useEffect(() => {
    setSampleIdx([]);
    setStats([]);
    setBoot(false);
  }, [P.n, P.statistic]);

  const stat = P.statistic;
  const binary = P.population === "binary";
  const sym = SYM[stat];
  const PP = popParams(pop);
  const isVar = stat === "var_n" || stat === "var_n1";
  const truth = stat === "mean" || stat === "proportion" ? PP.mu : stat === "median" ? (median(pop) ?? PP.mu) : PP.sigma2;

  const draw = (k: number) => {
    const next = boot ? [] : stats.slice();
    let idx = sampleIdx;
    for (let i = 0; i < k; i++) {
      idx = srs(P.N, P.n, randRef.current);
      const v = statistic(stat, idx.map((j) => pop[j]));
      if (v !== null) next.push(v);
    }
    setSampleIdx(idx);
    setStats(next);
    setBoot(false);
  };
  const sample = sampleIdx.map((i) => pop[i]);
  const d = describe(sample);
  const cur = statistic(stat, sample);
  const runBootstrap = () => {
    if (!sample.length) return;
    setStats(bootstrap(sample, 500, randRef.current, stat).filter((v): v is number => v !== null));
    setBoot(true);
  };

  // ── geometry ──
  const lo = 0;
  const hi = binary ? 1 : 100;
  const X = (v: number) => 40 + ((v - lo) / (hi - lo)) * 680;
  const bins = binary ? 2 : 40;
  const ph = histogram(pop, lo, hi, bins);
  const sh = histogram(sample, lo, hi, bins);
  const pmax = Math.max(...ph.counts, 1);
  const popBars = ph.counts.map((c, i) => {
    const w = 680 / bins;
    const h = (c / pmax) * 92;
    const shh = (sh.counts[i] / pmax) * 92;
    return { x: 40 + i * w + 1, w: Math.max(1, w - 2), y: 104 - h, h, sy: 104 - shh, sh: shh, c, s: sh.counts[i] };
  });
  const seT = theorySE(PP, P.n);
  let dlo = lo;
  let dhi = hi;
  if (isVar) dhi = Math.max(PP.sigma2 * 2.5, 1);
  else if (!binary) {
    dlo = Math.max(0, PP.mu - Math.max(6 * seT, 8));
    dhi = Math.min(100, PP.mu + Math.max(6 * seT, 8));
    if (stat === "median") {
      dlo = Math.max(0, dlo - 5);
      dhi = Math.min(100, dhi + 5);
    }
  }
  const dbins = 48;
  const dh = histogram(stats, dlo, dhi, dbins);
  const dmax = Math.max(...dh.counts, 1);
  const DX = (v: number) => 40 + ((v - dlo) / (dhi - dlo)) * 680;
  const distBars = dh.counts.map((c, i) => {
    const w = 680 / dbins;
    const h = (c / dmax) * 120;
    return { x: 40 + i * w + 0.5, w: Math.max(1, w - 1), y: 132 - h, h };
  });
  const sd = describe(stats);
  // The theory curve describes repeated samples from the population, so it is hidden over bootstrap replicates.
  const showTheory = P.showTheory && !boot && (stat === "mean" || stat === "proportion");
  let theoryPath = "";
  if (showTheory && stats.length > 1) {
    const binW = (dhi - dlo) / dbins;
    const scale = stats.length * binW;
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = dlo + ((dhi - dlo) * i) / 120;
      const y = ((normalPdf(x, PP.mu, seT) * scale) / dmax) * 120;
      pts.push((i ? "L" : "M") + DX(x).toFixed(1) + "," + (132 - Math.min(y, 124)).toFixed(1));
    }
    theoryPath = pts.join(" ");
  }
  const sampleDots = (() => {
    const sorted = sample.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const stack: Record<number, number> = {};
    return sorted.map((o) => {
      const k = Math.round(X(o.v) / 6);
      stack[k] = (stack[k] ?? 0) + 1;
      return { x: X(o.v), y: 62 - Math.min(stack[k] - 1, 10) * 5.6, key: o.i };
    });
  })();
  const axis = (S: (v: number) => number, a: number, b: number, yb: number, n: number) => (
    <g aria-hidden>
      {Array.from({ length: n + 1 }, (_, i) => {
        const v = a + ((b - a) * i) / n;
        return (
          <g key={i}>
            <line x1={S(v)} x2={S(v)} y1={yb - 4} y2={yb} stroke="var(--faint)" />
            <text x={S(v)} y={yb + 11} fontSize={9} fill="var(--faint)" textAnchor="middle">
              {isVar ? fmt(v, 0) : binary ? fmt(v, 1) : fmt(v, 0)}
            </text>
          </g>
        );
      })}
    </g>
  );

  const readouts: Readout[] = [
    { label: "μ", value: PP.mu },
    { label: "σ", value: PP.sigma },
    { label: "σ²", value: PP.sigma2 },
    { label: "x̄", value: d.mean, tone: "data" },
    { label: "s", value: d.sd, tone: "data" },
    { label: "s/√n", value: d.sd === null ? null : d.sd / Math.sqrt(P.n), digits: 3, tone: "data" },
    { label: `mean(${sym})`, value: sd.mean, digits: isVar ? 2 : 3, tone: "residual" },
    { label: `SD(${sym})`, value: sd.sd, digits: isVar ? 2 : 3, tone: "residual" },
    { label: "σ/√n·√fpc", value: seT, digits: 3, tone: "explained" },
    { label: "fpc (N−n)/(N−1)", value: (P.N - P.n) / (P.N - 1), digits: 4, tone: "muted" },
  ];
  if (isVar && stats.length > 1 && sd.mean !== null) readouts.push({ label: `mean(${sym})/σ²`, value: sd.mean / PP.sigma2, digits: 3, tone: "residual" });
  const live = t.liveTpl.replace("{k}", String(stats.length)).replace("{v}", fmt(cur, 2)).replace("{m}", fmt(sd.mean, 2)).replace("{sd}", fmt(sd.sd, 3));
  const statOpts = (binary ? (["proportion", "var_n", "var_n1"] as const) : (["mean", "median", "var_n", "var_n1"] as const)).map((v) => ({ value: v, label: t.stats[v] }));

  const aside = (
    <>
      <Panel title={t.population}>
        <div className="space-y-3">
          <ChoiceControl<PopulationShape>
            label={t.population}
            hideLabel
            param="population"
            value={P.population}
            onChange={(v) => set("population", v)}
            options={(["normal", "skewed", "bimodal", "binary"] as const).map((k) => ({ value: k, label: t.pops[k] }))}
          />
          <ParameterControl label={t.sampleSize} value={P.n} min={2} max={Math.min(500, Math.floor(P.N / 2))} step={1} onChange={(v) => set("n", v)} param="n" />
          <SelectControl<SampleStatistic> label={t.statistic} value={stat} onChange={(v) => set("statistic", v)} options={statOpts} param="statistic" />
          <p className="text-xs leading-relaxed text-muted">{t.help[stat]}</p>
        </div>
      </Panel>
      <Panel title={t.draw}>
        <div className="flex flex-wrap gap-2">
          {[1, 100, 1000].map((k) => (
            <LabButton key={k} variant="primary" onClick={() => draw(k)}>
              {k === 1000 ? "1 000" : k}
              <span className="sr-only"> {lang === "hu" ? "minta húzása" : k === 1 ? "sample" : "samples"}</span>
            </LabButton>
          ))}
          <LabButton onClick={runBootstrap} disabled={!sample.length} title={t.bootstrapHelp}>
            {t.bootstrap}
          </LabButton>
        </div>
        {boot && (
          <div className="mt-2">
            <LabNote tone="info">{t.bootNote}</LabNote>
          </div>
        )}
        <div className="mt-3 space-y-2">
          <ToggleControl label={t.showTheory} checked={P.showTheory} onChange={(v) => set("showTheory", v)} param="showTheory" />
          <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
        </div>
      </Panel>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
    </>
  );

  const dot = (label: string, v: string) => (
    <span>
      <span className="text-faint">{label}</span> {v}
    </span>
  );

  return (
    <LabShell
      lab={lab}
      title={t.title}
      subtitle={t.subtitle}
      aside={aside}
      method={lang === "hu" ? "Egyszerű véletlen mintavétel visszatevés nélkül véges populációból; bootstrap visszatevéssel" : "Simple random sampling without replacement from a finite population; bootstrap with replacement"}
    >
      <div className="space-y-5">
        <section aria-label={t.population}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold text-ink">
              {t.population} · N = {P.N}
            </span>
            <span className="text-xs tabular-nums text-muted">
              {dot("μ =", fmt(PP.mu, 2))} {dot("· σ =", fmt(PP.sigma, 2))}
              {stat !== "mean" && stat !== "proportion" && <> {dot(`· ${sym}(pop) =`, fmt(truth, 2))}</>}
            </span>
            <span className="text-xs text-faint">{t.popHint}</span>
          </div>
          <AccessibleVisualization
            summary={`${t.population} N=${P.N}, μ=${fmt(PP.mu, 2)}, σ=${fmt(PP.sigma, 2)}; ${t.sample} n=${sample.length}`}
            viewBox="0 0 760 120"
            table={{
              caption: t.population,
              columns: [lang === "hu" ? "Sáv" : "Bin", lang === "hu" ? "Populáció" : "Population", lang === "hu" ? "Mintában" : "In sample"],
              rows: popBars.map((b, i) => [`${fmt(lo + i * ph.w, binary ? 1 : 1)}–${fmt(lo + (i + 1) * ph.w, 1)}`, b.c, b.s]),
            }}
          >
            {popBars.map((b, i) => (
              <g key={i}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--surface-3)" rx={1} />
                <rect x={b.x} y={b.sy} width={b.w} height={b.sh} fill="var(--data)" rx={1} />
              </g>
            ))}
            <line x1={X(PP.mu)} x2={X(PP.mu)} y1={8} y2={104} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 3" />
            <text x={X(PP.mu)} y={116} fontSize={10} fill="var(--ink)" textAnchor="middle">
              μ
            </text>
            {axis(X, lo, hi, 104, binary ? 1 : 10)}
          </AccessibleVisualization>
        </section>

        <section aria-label={t.sample}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold text-ink">
              {t.sample} · n = {P.n}
            </span>
            <span className="text-xs tabular-nums text-muted">
              {dot("x̄ =", fmt(d.mean, 2))} {dot("· s =", fmt(d.sd, 2))} {dot(`· ${sym} =`, fmt(cur, isVar ? 2 : 3))}
            </span>
            <span className="text-xs text-faint">{!sample.length ? t.hintEmpty : t.hintOne}</span>
          </div>
          <AccessibleVisualization summary={`${t.sample} n=${sample.length}, x̄=${fmt(d.mean, 2)}, ${sym}=${fmt(cur, isVar ? 2 : 3)}`} viewBox="0 0 760 90">
            <line x1={40} x2={720} y1={70} y2={70} stroke="var(--border)" />
            {sampleDots.map((p) => (
              <circle key={p.key} cx={p.x} cy={p.y} r={4.2} fill="var(--data)" stroke="var(--surface)" strokeWidth={1} />
            ))}
            {sample.length > 0 && (
              <>
                {!isVar && cur !== null && (
                  <g className="lab-tr" style={{ transform: `translate(${X(cur)}px, 0px)` }}>
                    <line x1={0} x2={0} y1={6} y2={74} stroke="var(--model)" strokeWidth={2.5} />
                    <text x={0} y={86} fontSize={10} fill="var(--model-ink)" textAnchor="middle">
                      {sym}
                    </text>
                  </g>
                )}
                <line x1={X(PP.mu)} x2={X(PP.mu)} y1={6} y2={74} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 3" />
              </>
            )}
          </AccessibleVisualization>
        </section>

        <section aria-label={t.sampDist}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold text-ink">
              {t.sampDist} · {stats.length} {t.samples}
            </span>
            <span className="text-xs tabular-nums text-muted">
              {dot(`mean(${sym}) =`, fmt(sd.mean, isVar ? 2 : 3))} {dot(`· SD(${sym}) =`, fmt(sd.sd, isVar ? 2 : 3))}
              {showTheory && <> {dot("· σ/√n·√fpc =", fmt(seT, 3))}</>}
            </span>
            <span className="text-xs text-faint">{boot ? t.bootstrap : stats.length > 1 ? t.hintMany : t.hintEmpty}</span>
          </div>
          <AccessibleVisualization
            summary={live}
            viewBox="0 0 760 150"
            table={{
              caption: t.sampDist,
              columns: [lang === "hu" ? "Sáv" : "Bin", lang === "hu" ? "Darab" : "Count"],
              rows: dh.counts.map((c, i) => [`${fmt(dlo + i * dh.w, 2)}–${fmt(dlo + (i + 1) * dh.w, 2)}`, c]),
            }}
          >
            {distBars.map((b, i) => (
              <rect key={i} className="lab-tr" x={b.x} y={b.y} width={b.w} height={b.h} fill="var(--residual)" fillOpacity={0.75} rx={1} />
            ))}
            {theoryPath && <path d={theoryPath} fill="none" stroke="var(--explained-ink)" strokeWidth={2} />}
            {sample.length > 0 && cur !== null && (
              <g className="lab-tr" style={{ transform: `translate(${DX(cur)}px, 0px)` }}>
                <line x1={0} x2={0} y1={8} y2={132} stroke="var(--model)" strokeWidth={2} />
              </g>
            )}
            <line x1={DX(truth)} x2={DX(truth)} y1={8} y2={132} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 3" />
            <text x={DX(truth)} y={146} fontSize={10} fill="var(--ink)" textAnchor="middle">
              {stat === "mean" || stat === "proportion" ? "μ" : stat === "median" ? "med" : "σ²"}
            </text>
            {axis(DX, dlo, dhi, 132, 8)}
          </AccessibleVisualization>
        </section>
        <p className="text-xs text-faint">{t.synthetic}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </LabShell>
  );
}

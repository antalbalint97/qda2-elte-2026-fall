"use client";

// Hypothesis Testing Lab. Port of "QDA2 Hypothesis Lab.dc.html". H₀/H₁ curves with draggable critical value
// and observed t; α, β and power from the noncentral t (engine distributions.ts, checked against SciPy);
// a seeded null simulation; power curves; m simultaneous null tests.
import { nctSf, tCdf, tCritical, tPdf, tPower, tQuantile, tTwoTailedP, fwer } from "@/lib/engine/distributions";
import { fmt, fmtP } from "@/lib/engine/format";
import { gaussian, mulberry32 } from "@/lib/engine/rng";
import { cn } from "@/lib/cn";
import { useMemo, useRef, useState } from "react";
import { ChoiceControl, ParameterControl, SeedControl } from "../../primitives/controls";
import { areaPath, curvePath } from "../../primitives/paths";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, PresetBar, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { HY_T } from "./strings";

type View = "curves" | "sim" | "power" | "multi";
export interface HypothesisParams extends Record<string, unknown> {
  view: View;
  effect: number;
  n: number;
  alpha: number;
  sided: 1 | 2;
  m: number;
  tObs: number | null;
  seed: number;
}
const DEFAULTS: HypothesisParams = { view: "curves", effect: 0, n: 20, alpha: 0.05, sided: 2, m: 20, tObs: null, seed: 20261023 };
const ALPHAS = [0.1, 0.05, 0.01, 0.001];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function normalizeHypothesis(p: HypothesisParams): HypothesisParams {
  return {
    ...p,
    effect: clamp(Math.round(p.effect * 20) / 20, -2, 2),
    n: clamp(Math.round(p.n), 2, 200),
    alpha: clamp(p.alpha, 0.0005, 0.5),
    sided: p.sided === 1 ? 1 : 2,
    m: clamp(Math.round(p.m), 1, 100),
    tObs: p.tObs === null || !Number.isFinite(p.tObs) ? null : clamp(p.tObs, -5.4, 5.4),
    seed: Number.isInteger(p.seed) && p.seed >= 1 && p.seed < 2147483647 ? p.seed : DEFAULTS.seed,
  };
}

/** t statistics of `reps` one-sample studies of size n drawn from N(0, 1) (H₀ exactly true). */
export function simulateNullT(n: number, reps: number, seed: number): number[] {
  const z = gaussian(mulberry32(seed));
  const out: number[] = [];
  for (let r = 0; r < reps; r++) {
    let s = 0;
    let ss = 0;
    const xs = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      xs[i] = z();
      s += xs[i];
    }
    const m = s / n;
    for (let i = 0; i < n; i++) ss += (xs[i] - m) ** 2;
    const sd = Math.sqrt(ss / (n - 1));
    out.push(sd > 0 ? m / (sd / Math.sqrt(n)) : 0);
  }
  return out;
}

const TX = (t: number) => 380 + t * 62;
const XT = (x: number) => (x - 380) / 62;

export default function HypothesisLab(props: LabProps) {
  const lab = useLab<HypothesisParams>("hypothesis-lab", DEFAULTS, { ...props, normalize: normalizeHypothesis });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = HY_T[lang];
  const [crit, setCrit] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const df = P.n - 1;
  const ncp = P.effect * Math.sqrt(P.n);
  const critDefault = P.sided === 2 ? tCritical(df, P.alpha) : tQuantile(1 - P.alpha, df);
  const c = crit ?? critDefault;
  const alphaAt = P.sided === 2 ? tTwoTailedP(c, df) : 1 - tCdf(c, df);
  const up = nctSf(c, df, ncp) ?? 0;
  const lowTail = 1 - (nctSf(-c, df, ncp) ?? 1);
  const power = P.sided === 2 ? Math.min(1, up + lowTail) : up;
  const beta = 1 - power;
  const tObs = P.tObs ?? ncp;
  const p = P.sided === 2 ? tTwoTailedP(Math.abs(tObs), df) : 1 - tCdf(tObs, df);
  const sidedTxt = lang === "hu" ? "oldalú" : "sided";

  const drag = useSvgDrag<"crit" | "t">(svgRef, (id, pt) => {
    const v = XT(pt.x);
    if (id === "crit") setCrit(clamp(Math.abs(v), 0.05, 5.4));
    else set("tObs", clamp(Math.round(v * 100) / 100, -5.4, 5.4));
  });

  // ── curves ──
  const Y = (v: number) => 250 - v * 560;
  const h0 = (x: number) => tPdf(x, df);
  const h1 = (x: number) => tPdf(x - ncp, df);
  const alphaPath = areaPath(h0, c, 5.5, TX, Y, 250);
  const alphaPath2 = P.sided === 2 ? areaPath(h0, -5.5, -c, TX, Y, 250) : "";
  const betaPath = P.sided === 2 ? areaPath(h1, -c, c, TX, Y, 250) : areaPath(h1, -5.5, c, TX, Y, 250);

  // ── null simulation (500 studies) ──
  const ts = useMemo(() => simulateNullT(P.n, 500, P.seed), [P.n, P.seed]);
  const isBeyond = (v: number) => (P.sided === 2 ? Math.abs(v) >= Math.abs(tObs) : v >= tObs);
  const beyond = ts.filter(isBeyond).length;
  const bins = 40;
  const counts = new Array<number>(bins).fill(0);
  ts.forEach((v) => {
    const b = Math.floor(((v + 5) / 10) * bins);
    if (b >= 0 && b < bins) counts[b] += 1;
  });
  const bw = 10 / bins;
  const dens = counts.map((k) => k / (500 * bw));
  const maxD = Math.max(0.42, ...dens);
  const Y2 = (d: number) => 230 - d * (190 / maxD);

  // ── power curves ──
  const ns: number[] = [];
  for (let n = 4; n <= 200; n += 4) ns.push(n);
  const PX = (n: number) => 50 + (n - 4) * (680 / 196);
  const PY = (v: number) => 260 - v * 240;
  const powAt = (d: number, n: number) => tPower(d, n, P.alpha, P.sided, "one").power ?? 0;
  const powerCurves = [0.2, 0.5, 0.8].map((d, i) => ({ d, path: ns.map((n, j) => (j ? "L" : "M") + PX(n).toFixed(1) + "," + PY(powAt(d, n)).toFixed(1)).join(" "), color: ["var(--faint)", "var(--data)", "var(--model-ink)"][i] }));
  const pw = tPower(Math.abs(P.effect), P.n, P.alpha, P.sided, "one");
  const curPow = pw.power ?? 0;

  // ── m null tests ──
  const cells = useMemo(() => {
    const z = gaussian(mulberry32(P.seed + 7));
    return Array.from({ length: P.m }, (_, i) => {
      let s = 0;
      const xs = Array.from({ length: P.n }, () => z());
      xs.forEach((x) => (s += x));
      const mm = s / P.n;
      const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mm) ** 2, 0) / (P.n - 1));
      const tv = sd > 0 ? mm / (sd / Math.sqrt(P.n)) : 0;
      const pv = P.sided === 2 ? tTwoTailedP(Math.abs(tv), P.n - 1) : 1 - tCdf(tv, P.n - 1);
      return { i: i + 1, t: tv, p: pv, fp: pv < P.alpha };
    });
  }, [P.m, P.n, P.seed, P.sided, P.alpha]);
  const fps = cells.filter((x) => x.fp).length;

  const readouts: Readout[] = [
    { label: t.tobs, value: tObs },
    { label: "df", value: String(df) },
    { label: `p (${P.sided}-${sidedTxt})`, value: fmtP(p), tone: p < P.alpha ? "neg" : "ink" },
    { label: t.crit, value: c, digits: 3, tone: "residual" },
    { label: crit !== null ? (lang === "hu" ? "α (a húzott értéknél)" : "α (at crit)") : "α", value: fmtP(alphaAt), tone: "residual" },
    { label: "β", value: beta, digits: 3, tone: "attention" },
    { label: lang === "hu" ? "erő" : "power", value: power, digits: 3, tone: "model" },
    { label: "p̂ (sim)", value: beyond / 500, digits: 3, tone: "data" },
    { label: `FWER (m=${P.m})`, value: fwer(P.alpha, P.m), digits: 3 },
  ];
  const live = t.live.replace("{p}", fmtP(p)).replace("{pw}", fmt(power, 3)).replace("{crit}", fmt(c, 2));
  const views: View[] = ["curves", "sim", "power", "multi"];

  const presets = t.presets.map((label, i) => ({ id: String(i), label }));
  const applyPreset = (i: number) => {
    setCrit(null);
    if (i === 0) setMany({ effect: 0, n: 20, tObs: null, view: "curves" });
    else if (i === 1) setMany({ effect: 0.5, n: P.n === 20 ? 80 : 20, tObs: null, view: "power" });
    else if (i === 2) set("sided", P.sided === 2 ? 1 : 2);
    else setMany({ m: 20, view: "multi" });
  };
  const demos: TeachDemo[] = t.presets.map((label, i) => ({ title: label, note: t.insight[(["curves", "power", "curves", "multi"] as View[])[i]], apply: () => applyPreset(i) }));

  const aside = (
    <>
      <Panel title={lang === "hu" ? "Beállítások" : "Settings"}>
        <div className="space-y-3">
          <ParameterControl label={t.effect} value={P.effect} min={-2} max={2} step={0.05} onChange={(v) => set("effect", v)} param="effect" />
          <ParameterControl
            label={t.n}
            value={P.n}
            min={2}
            max={200}
            step={1}
            onChange={(v) => {
              setCrit(null);
              set("n", v);
            }}
            param="n"
          />
          <ChoiceControl<number>
            label="α"
            value={P.alpha}
            onChange={(v) => {
              setCrit(null);
              set("alpha", v);
            }}
            param="alpha"
            options={ALPHAS.map((a) => ({ value: a, label: fmtP(a) }))}
          />
          <ChoiceControl<1 | 2>
            label={t.sided}
            value={P.sided}
            onChange={(v) => {
              setCrit(null);
              set("sided", v);
            }}
            param="sided"
            options={[
              { value: 1, label: `1-${sidedTxt}` },
              { value: 2, label: `2-${sidedTxt}` },
            ]}
          />
          <ParameterControl label={t.m} value={P.m} min={1} max={100} step={1} onChange={(v) => set("m", v)} param="m" />
          <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
        </div>
      </Panel>
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
      method={`${pw.method} · p: Student t(${df})`}
      toolbar={
        <ChoiceControl<View> label={t.view} hideLabel size="md" param="view" value={P.view} onChange={(v) => set("view", v)} options={views.map((v) => ({ value: v, label: t[v] }))} />
      }
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <p className="mt-2 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">{t.formula[P.view]}</p>
          <p className="mt-2 text-sm text-ink">{t.insight[P.view]}</p>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[P.view]}</p>
        <PresetBar presets={presets} onPick={(id) => applyPreset(+id)} label={lang === "hu" ? "Előbeállítások" : "Presets"} />
        {P.view === "curves" && (
          <AccessibleVisualization
            interactive
            svgRef={svgRef}
            onPointerMove={drag.move}
            onPointerUp={drag.end}
            viewBox="0 0 760 280"
            summary={`${t.curves}: α = ${fmtP(alphaAt)}, β = ${fmt(beta, 3)}, ${lang === "hu" ? "erő" : "power"} = ${fmt(power, 3)}, p = ${fmtP(p)}`}
          >
            <path d={alphaPath} fill="var(--residual)" fillOpacity={0.55} />
            {alphaPath2 && <path d={alphaPath2} fill="var(--residual)" fillOpacity={0.55} />}
            <path d={betaPath} fill="var(--attention)" fillOpacity={0.18} stroke="var(--attention)" strokeWidth={1.5} strokeDasharray="4 3" />
            <path d={curvePath(h0, -5.5, 5.5, TX, Y)} fill="none" stroke="var(--ink)" strokeWidth={1.8} />
            <path d={curvePath(h1, -5.5, 5.5, TX, Y)} fill="none" stroke="var(--explained-ink)" strokeWidth={1.8} opacity={P.effect === 0 ? 0.35 : 1} />
            <line x1={TX(-5.5)} x2={TX(5.5)} y1={250} y2={250} stroke="var(--border)" />
            <g aria-hidden>
              {[-4, -2, 0, 2, 4].map((v) => (
                <text key={v} x={TX(v)} y={266} fontSize={10} fill="var(--faint)" textAnchor="middle">
                  {v}
                </text>
              ))}
              <text x={TX(ncp)} y={Y(h1(ncp)) - 6} fontSize={10} fill="var(--explained-ink)" textAnchor="middle">
                δ√n = {fmt(ncp, 2)}
              </text>
              <text x={TX(c) + 8} y={60} fontSize={11} fill="var(--residual-ink)">
                α = {fmtP(alphaAt)}
              </text>
              <text x={TX(c) - 8} y={60} fontSize={11} fill="var(--attention-ink)" textAnchor="end">
                β = {fmt(beta, 3)}
              </text>
              <text x={TX(c) + 8} y={76} fontSize={11} fill="var(--model-ink)">
                {lang === "hu" ? "erő" : "power"} = {fmt(power, 3)}
              </text>
              <text x={TX(tObs) + 6} y={100} fontSize={11} fill="var(--ink)">
                p = {fmtP(p)}
              </text>
            </g>
            <DragHandle
              x={TX(c)}
              y={30}
              orientation="horizontal"
              label={t.crit}
              value={+c.toFixed(2)}
              min={0.05}
              max={5.4}
              step={0.05}
              valueText={`t_crit ${fmt(c, 2)}, α ${fmtP(alphaAt)}`}
              onStart={(e) => drag.start("crit", e)}
              onValue={(v) => setCrit(v)}
              fill="var(--residual)"
              className={drag.dragging ? "lab-fast" : "lab-tr"}
            >
              <line x1={0} x2={0} y1={0} y2={220} stroke="var(--residual-ink)" strokeWidth={2} />
            </DragHandle>
            <DragHandle
              x={TX(tObs)}
              y={250}
              orientation="horizontal"
              label={t.tobs}
              value={+tObs.toFixed(2)}
              min={-5.4}
              max={5.4}
              step={0.05}
              valueText={`t = ${fmt(tObs, 2)}, p = ${fmtP(p)}`}
              onStart={(e) => drag.start("t", e)}
              onValue={(v) => set("tObs", v)}
              fill="var(--ink)"
              disabled={locked("tObs")}
              className={drag.dragging ? "lab-fast" : "lab-tr"}
            >
              <line x1={0} x2={0} y1={-200} y2={0} stroke="var(--ink)" strokeWidth={2} strokeDasharray="3 3" />
            </DragHandle>
          </AccessibleVisualization>
        )}
        {P.view === "sim" && (
          <>
            <p className="font-mono text-xs text-muted">
              500 × n = {P.n}, δ = 0 · {beyond} / 500 {lang === "hu" ? "legalább ilyen szélsőséges" : "at least as extreme"} → p̂ = {fmt(beyond / 500, 3)}
            </p>
            <AccessibleVisualization
              viewBox="0 0 760 260"
              summary={`${t.sim}: ${beyond}/500, p̂ = ${fmt(beyond / 500, 3)}, p = ${fmtP(p)}`}
              table={{ caption: t.sim, columns: ["t", lang === "hu" ? "darab" : "count"], rows: counts.map((k, i) => [`${fmt(-5 + i * bw, 2)}–${fmt(-5 + (i + 1) * bw, 2)}`, k]) }}
            >
              {dens.map((d, i) => {
                const mid = -5 + (i + 0.5) * bw;
                return <rect key={i} x={TX(-5 + i * bw)} width={TX(bw) - TX(0) - 1} y={Y2(d)} height={230 - Y2(d)} fill={isBeyond(mid) ? "var(--residual)" : "var(--data)"} />;
              })}
              <path d={curvePath((x) => tPdf(x, df), -5, 5, TX, Y2)} fill="none" stroke="var(--ink)" strokeWidth={1.5} opacity={0.7} />
              <line x1={TX(clamp(tObs, -5, 5))} x2={TX(clamp(tObs, -5, 5))} y1={24} y2={230} stroke="var(--residual-ink)" strokeWidth={2} />
              <text x={TX(clamp(tObs, -5, 5)) + 6} y={34} fontSize={11} fill="var(--residual-ink)">
                t_obs = {fmt(tObs, 2)}
              </text>
              <line x1={TX(-5)} x2={TX(5)} y1={230} y2={230} stroke="var(--border)" />
              {[-4, -2, 0, 2, 4].map((v) => (
                <text key={v} x={TX(v)} y={246} fontSize={10} fill="var(--faint)" textAnchor="middle" aria-hidden>
                  {v}
                </text>
              ))}
            </AccessibleVisualization>
            <ParameterControl label={t.tobs} value={+tObs.toFixed(2)} min={-5.4} max={5.4} step={0.05} onChange={(v) => set("tObs", v)} param="tObs" />
          </>
        )}
        {P.view === "power" && (
          <>
            <p className="font-mono text-xs text-muted">
              α = {P.alpha}, {P.sided}-{sidedTxt} · {pw.method}
            </p>
            <AccessibleVisualization
              viewBox="0 0 760 290"
              summary={`${t.power}: n = ${P.n}, δ = ${fmt(Math.abs(P.effect), 2)} → ${fmt(curPow, 3)}`}
              table={{ caption: t.power, columns: ["n", "δ = .2", "δ = .5", "δ = .8"], rows: [10, 20, 40, 80, 120, 200].map((n) => [n, fmt(powAt(0.2, n), 3), fmt(powAt(0.5, n), 3), fmt(powAt(0.8, n), 3)]) }}
            >
              <line x1={50} x2={730} y1={PY(0.8)} y2={PY(0.8)} stroke="var(--attention)" strokeDasharray="4 3" />
              <line x1={50} x2={730} y1={PY(0)} y2={PY(0)} stroke="var(--border)" />
              {powerCurves.map((pc) => (
                <path key={pc.d} d={pc.path} fill="none" stroke={pc.color} strokeWidth={Math.abs(P.effect) === pc.d ? 3 : 1.6} />
              ))}
              <circle cx={PX(clamp(P.n, 4, 200))} cy={PY(curPow)} r={6} fill="var(--residual)" />
              <g aria-hidden fontSize={10}>
                {[0, 0.5, 0.8, 1].map((v) => (
                  <text key={v} x={44} y={PY(v) + 4} fill={v === 0.8 ? "var(--attention-ink)" : "var(--faint)"} textAnchor="end">
                    {v === 0 ? "0" : v === 1 ? "1" : String(v).replace("0.", ".")}
                  </text>
                ))}
                {[50, 100, 150, 200].map((n) => (
                  <text key={n} x={PX(n)} y={278} fill="var(--faint)" textAnchor="middle">
                    n = {n}
                  </text>
                ))}
                {powerCurves.map((pc) => (
                  <text key={pc.d} x={PX(200) - 4} y={PY(powAt(pc.d, 200)) + (pc.d === 0.2 ? -6 : 14)} fill={pc.color} textAnchor="end">
                    δ = {String(pc.d).replace("0.", ".")}
                  </text>
                ))}
                <text x={PX(clamp(P.n, 4, 200)) + 10} y={PY(curPow) - 8} fill="var(--residual-ink)" fontSize={11}>
                  n = {P.n}: {fmt(curPow, 2)}
                </text>
              </g>
            </AccessibleVisualization>
          </>
        )}
        {P.view === "multi" && (
          <>
            <p className="font-mono text-xs text-muted">
              {fps} / {P.m} {lang === "hu" ? "hamis pozitív" : "false positives"} · {lang === "hu" ? "várható" : "expected"} {fmt(P.m * P.alpha, 1)}
            </p>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-1.5" aria-label={t.multi}>
              {cells.map((x) => (
                <li key={x.i} title={`t = ${fmt(x.t, 2)}`} className={cn("rounded-md border px-2 py-1 font-mono text-xs", x.fp ? "border-residual bg-residual/15 text-residual-ink" : "border-line bg-surface text-muted")}>
                  #{x.i} p {fmtP(x.p)}
                  {x.fp && <span className="sr-only"> {lang === "hu" ? "hamis pozitív" : "false positive"}</span>}
                </li>
              ))}
            </ul>
            <LabNote tone="info">
              P({lang === "hu" ? "legalább egy" : "at least one"}) = 1 − (1 − {P.alpha})^{P.m} = {fmt(fwer(P.alpha, P.m), 3)}. Bonferroni: α/m = {fmtP(P.alpha / P.m)}
            </LabNote>
          </>
        )}
        <p className="text-xs text-faint">{t.note}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </LabShell>
  );
}

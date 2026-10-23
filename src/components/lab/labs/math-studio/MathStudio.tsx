"use client";

// Mathematical Foundations Studio. Port of "QDA2 Math Studio.dc.html": transformed functions, exp/log, the Σ
// expander, derivative (tangent and shrinking secant), Riemann vs exact integral, the SSE bowl of the VRA data
// with a linked fit and slice, and the binomial likelihood.
import { fmt } from "@/lib/engine/format";
import type { RiemannKind } from "@/lib/engine/calculus";
import { useId, useMemo, useRef } from "react";
import { ChoiceControl, LabButton, ParameterControl } from "../../primitives/controls";
import { StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { areaOf, bowlAt, contour, descentStep, expandSum, FNS, g, likelihoodAt, secantSlope, slopeAt, ssAround, vraData, type Fn } from "./model";
import { MS_T } from "./strings";

type Topic = "functions" | "log" | "sum" | "derivative" | "integral" | "bowl" | "likelihood";
const TOPICS: Topic[] = ["functions", "log", "sum", "derivative", "integral", "bowl", "likelihood"];
const RULES: RiemannKind[] = ["left", "mid", "right"];
export interface MsParams extends Record<string, unknown> {
  topic: Topic;
  fn: Fn;
  a: number;
  b: number;
  c: number;
  d: number;
  x0: number;
  hExp: number;
  lo: number;
  hi: number;
  nRect: number;
  rule: RiemannKind;
  terms: number;
  center: number;
  ba: number;
  bb: number;
  k: number;
  n: number;
  p: number;
}
const DEFAULTS: MsParams = { topic: "functions", fn: "quad", a: 1, b: 1, c: 0, d: 0, x0: 1, hExp: -0.5, lo: -1, hi: 2, nRect: 8, rule: "left", terms: 5, center: 4, ba: 10, bb: 2, k: 7, n: 10, p: 0.5 };
const r2 = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const DATA = vraData();
const OLS = bowlAt(DATA.x, DATA.y, 0, 0).ols;
const A_RANGE: [number, number] = [Math.floor(OLS.a - 30), Math.ceil(OLS.a + 30)];
const B_RANGE: [number, number] = [Math.floor(OLS.b - 5), Math.ceil(OLS.b + 5)];

export function normalizeMs(p: MsParams): MsParams {
  const lo = clamp(num(p.lo, -1), -4, 4);
  const hi = clamp(num(p.hi, 2), -4, 4);
  const n = clamp(Math.round(num(p.n, 10)), 1, 100);
  return {
    ...p,
    topic: TOPICS.includes(p.topic) ? p.topic : DEFAULTS.topic,
    fn: FNS.includes(p.fn) ? p.fn : DEFAULTS.fn,
    a: r2(clamp(num(p.a, 1), -3, 3)),
    b: r2(clamp(num(p.b, 1), -3, 3)),
    c: r2(clamp(num(p.c, 0), -3, 3)),
    d: r2(clamp(num(p.d, 0), -3, 3)),
    x0: r2(clamp(num(p.x0, 1), -4, 4)),
    hExp: r2(clamp(num(p.hExp, -0.5), -3, 0)),
    lo: Math.min(lo, hi),
    hi: Math.max(lo, hi),
    nRect: clamp(Math.round(num(p.nRect, 8)), 1, 200),
    rule: RULES.includes(p.rule) ? p.rule : "left",
    terms: clamp(Math.round(num(p.terms, 5)), 2, DATA.x.length),
    center: r2(clamp(num(p.center, 4), 0, 14)),
    ba: r2(clamp(num(p.ba, 10), A_RANGE[0], A_RANGE[1])),
    bb: r2(clamp(num(p.bb, 2), B_RANGE[0], B_RANGE[1])),
    k: clamp(Math.round(num(p.k, 7)), 0, n),
    n,
    p: r2(clamp(num(p.p, 0.5), 0.01, 0.99)),
  };
}

export default function MathStudio(props: LabProps) {
  const lab = useLab<MsParams>("math-studio", DEFAULTS, { ...props, normalize: normalizeMs });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = MS_T[lang];
  const T = P.topic;
  const tr = { a: P.a, b: P.b, c: P.c, d: P.d };
  const G = g(P.fn, tr);

  // function plot frame: x ∈ [−4.4, 4.4], y ∈ [−4.5, 4.5]
  const fnRef = useRef<SVGSVGElement>(null);
  const X = (x: number) => r2(380 + x * 80);
  const Y = (y: number) => r2(220 - y * 40);
  const XI = (px: number) => (px - 380) / 80;
  const path = (f: (x: number) => number, from = -4.4, to = 4.4) => {
    let d = "";
    let pen = false;
    for (let i = 0; i <= 400; i++) {
      const x = from + ((to - from) * i) / 400;
      const y = f(x);
      if (!Number.isFinite(y) || Math.abs(y) > 5.2) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${X(x)},${Y(y)} `;
      pen = true;
    }
    return d;
  };
  const fnDrag = useSvgDrag<"x0" | "lo" | "hi">(fnRef, (id, pt) => {
    const v = r2(clamp(XI(pt.x), -4, 4));
    if (id === "x0") set("x0", T === "log" ? Math.max(0.05, v) : v);
    else if (id === "lo") set("lo", Math.min(v, P.hi));
    else set("hi", Math.max(v, P.lo));
  });

  const slope = slopeAt(P.fn, tr, P.x0);
  const h = 10 ** P.hExp;
  const sec = secantSlope(P.fn, tr, P.x0, h);
  const gx0 = G(P.x0);
  const area = areaOf(P.fn, tr, P.lo, P.hi, P.nRect, P.rule);

  // Σ expander
  const sumX = DATA.x.slice(0, P.terms);
  const ex = expandSum(sumX);

  // bowl
  const bw = bowlAt(DATA.x, DATA.y, P.ba, P.bb);
  const bowlRef = useRef<SVGSVGElement>(null);
  const clipId = `bowl-${useId().replace(/:/g, "")}`;
  const BX = (a: number) => r2(40 + ((a - A_RANGE[0]) / (A_RANGE[1] - A_RANGE[0])) * 320);
  const BY = (b: number) => r2(330 - ((b - B_RANGE[0]) / (B_RANGE[1] - B_RANGE[0])) * 300);
  const bowlDrag = useSvgDrag<"ab">(bowlRef, (_, pt) =>
    setMany({ ba: r2(clamp(A_RANGE[0] + ((pt.x - 40) / 320) * (A_RANGE[1] - A_RANGE[0]), A_RANGE[0], A_RANGE[1])), bb: r2(clamp(B_RANGE[0] + ((330 - pt.y) / 300) * (B_RANGE[1] - B_RANGE[0]), B_RANGE[0], B_RANGE[1])) }),
  );
  const levels = useMemo(() => [1.25, 1.6, 2.2, 3.2, 5, 8, 13].map((m) => OLS.sse * m), []);
  const contours = useMemo(() => levels.map((l) => contour(bw, l)), [levels, bw]);
  const sliceRef = useRef<SVGSVGElement>(null);
  const slice = Array.from({ length: 81 }, (_, i) => {
    const b = B_RANGE[0] + ((B_RANGE[1] - B_RANGE[0]) * i) / 80;
    return { b, sse: bowlAt(DATA.x, DATA.y, P.ba, b).sse };
  });
  const sMax = Math.max(...slice.map((s) => s.sse));
  const sMin = Math.min(...slice.map((s) => s.sse));
  const SX = (b: number) => r2(40 + ((b - B_RANGE[0]) / (B_RANGE[1] - B_RANGE[0])) * 300);
  const SY = (v: number) => r2(170 - ((v - sMin) / (sMax - sMin || 1)) * 150);
  const sliceDrag = useSvgDrag<"b">(sliceRef, (_, pt) => set("bb", r2(clamp(B_RANGE[0] + ((pt.x - 40) / 300) * (B_RANGE[1] - B_RANGE[0]), B_RANGE[0], B_RANGE[1]))));
  const FX = (x: number) => r2(40 + (x / 14) * 300);
  const FY = (y: number) => r2(200 - (y / 100) * 180);

  // likelihood
  const lk = likelihoodAt(P.k, P.n, P.p);
  const likRef = useRef<SVGSVGElement>(null);
  const grid = Array.from({ length: 99 }, (_, i) => (i + 1) / 100);
  const lks = grid.map((q) => likelihoodAt(P.k, P.n, q));
  const Lmax = Math.max(...lks.map((l) => l.L));
  const llMin = Math.max(Math.min(...lks.map((l) => l.logL)), Math.max(...lks.map((l) => l.logL)) - 30);
  const llMax = Math.max(...lks.map((l) => l.logL));
  const PX = (q: number) => r2(40 + q * 300);
  const LY = (v: number) => r2(170 - (v / (Lmax || 1)) * 150);
  const LLY = (v: number) => r2(170 - ((Math.max(v, llMin) - llMin) / (llMax - llMin || 1)) * 150);
  const likDrag = useSvgDrag<"p">(likRef, (_, pt) => set("p", r2(clamp((pt.x - 40) / 300, 0.01, 0.99))));

  const R = t.r;
  const readouts: Readout[] =
    T === "functions"
      ? [
          { label: "g(x₀)", value: Number.isFinite(gx0) ? fmt(gx0, 3) : "—" },
          { label: "a, b, c, d", value: `${P.a}, ${P.b}, ${P.c}, ${P.d}` },
        ]
      : T === "log"
        ? [
            { label: R.lnx, value: fmt(Math.log(P.x0), 4), tone: "model" },
            { label: R.back, value: fmt(Math.exp(Math.log(P.x0)), 4) },
            { label: R.prod, value: `${fmt(Math.log(2 * P.x0) - Math.log(P.x0), 4)} = ln 2` },
          ]
        : T === "derivative"
          ? [
              { label: R.gx, value: Number.isFinite(gx0) ? fmt(gx0, 4) : "—" },
              { label: R.num, value: slope.numeric === null ? "—" : fmt(slope.numeric, 6), tone: "explained", note: slope.reason ? (slope.reason === "kink" ? t.kink : t.domain) : undefined },
              { label: R.an, value: slope.analytic === null ? "—" : fmt(slope.analytic, 6) },
              { label: R.diff, value: slope.numeric !== null && slope.analytic !== null ? Math.abs(slope.numeric - slope.analytic).toExponential(1) : "—" },
              { label: `${R.sec} = ${fmt(h, 3)}`, value: Number.isFinite(sec) ? fmt(sec, 4) : "—", tone: "residual" },
            ]
          : T === "integral"
            ? [
                { label: `${R.riemann} (${P.nRect}, ${t.rules[P.rule]})`, value: area.riemann === null ? "—" : fmt(area.riemann, 5), tone: "explained" },
                { label: R.simpson, value: area.simpson === null ? "—" : fmt(area.simpson, 6) },
                { label: R.exact, value: area.exact === null ? "—" : fmt(area.exact, 6), tone: "model" },
                { label: R.err, value: area.riemann !== null && area.exact !== null ? fmt(area.riemann - area.exact, 5) : "—", note: area.reason ? t.domain : undefined },
              ]
            : T === "sum"
              ? [
                  { label: R.mean, value: fmt(ex.mean, 3) },
                  { label: R.sumDev, value: fmt(Math.abs(ex.sumDev) < 1e-12 ? 0 : ex.sumDev, 3), tone: "model" },
                  { label: R.ss, value: fmt(ex.ss, 3), tone: "explained" },
                  { label: `${R.ssc}, c = ${fmt(P.center, 2)}`, value: fmt(ssAround(sumX, P.center), 3), tone: "residual" },
                  { label: R.var, value: fmt(ex.ss / (sumX.length - 1), 3) },
                ]
              : T === "bowl"
                ? [
                    { label: R.sse, value: fmt(bw.sse, 2), tone: "residual" },
                    { label: R.sseMin, value: fmt(OLS.sse, 2), tone: "model" },
                    { label: R.ga, value: fmt(bw.grad[0], 2) },
                    { label: R.gb, value: fmt(bw.grad[1], 2) },
                    { label: R.ols, value: `(${fmt(OLS.a, 3)}, ${fmt(OLS.b, 3)})` },
                  ]
                : [
                    { label: R.L, value: lk.L.toExponential(3) },
                    { label: R.logL, value: Number.isFinite(lk.logL) ? fmt(lk.logL, 3) : "−∞" },
                    { label: R.pHat, value: fmt(lk.pHat, 3), tone: "model" },
                    { label: R.score, value: fmt(lk.score, 3) },
                    { label: R.se, value: lk.se === null ? "—" : fmt(lk.se, 3) },
                  ];
  const live = readouts.map((r) => `${r.label}: ${r.value}`).join("; ");

  const demos: TeachDemo[] = [
    { title: lang === "hu" ? "Parabola eltolása" : "Shift a parabola", note: t.lead.functions, apply: () => setMany({ topic: "functions", fn: "quad", a: 1, b: 1, c: 1, d: -1 }) },
    { title: t.topics.log, note: t.insight.log, apply: () => setMany({ topic: "log", x0: 2 }) },
    { title: "Σ(xᵢ − x̄)², n = 4", note: t.insight.sum, apply: () => setMany({ topic: "sum", terms: 4 }) },
    { title: lang === "hu" ? "Normális terület" : "Normal area", note: t.insight.integral, apply: () => setMany({ topic: "integral", fn: "normal", a: 1, b: 1, c: 0, d: 0, lo: -1.96, hi: 1.96, nRect: 8 }) },
    { title: t.topics.bowl, note: t.insight.bowl, apply: () => setMany({ topic: "bowl", ba: 10, bb: 2 }) },
    { title: "7/10", note: t.insight.likelihood, apply: () => setMany({ topic: "likelihood", k: 7, n: 10, p: 0.5 }) },
  ];

  const fnTopic = T === "functions" || T === "derivative" || T === "integral";
  const aside = (
    <>
      <Panel title={t.params}>
        <div className="space-y-3">
          {fnTopic && (
            <>
              <ChoiceControl<Fn> label={t.fn} param="fn" size="sm" value={P.fn} onChange={(v) => set("fn", v)} options={FNS.map((f) => ({ value: f, label: t.fns[f] }))} />
              <p className="font-mono text-xs text-muted">{t.transform}</p>
              {(["a", "b", "c", "d"] as const).map((k) => (
                <ParameterControl key={k} label={k} param={k} value={P[k]} min={-3} max={3} step={0.1} onChange={(v) => set(k, r2(v))} />
              ))}
            </>
          )}
          {(T === "derivative" || T === "log") && <ParameterControl label={t.x0} param="x0" value={P.x0} min={T === "log" ? 0.05 : -4} max={4} step={0.05} onChange={(v) => set("x0", r2(v))} />}
          {T === "derivative" && <ParameterControl label={t.h} param="hExp" value={P.hExp} min={-3} max={0} step={0.1} onChange={(v) => set("hExp", r2(v))} />}
          {T === "integral" && (
            <>
              <ParameterControl label={t.lo} param="lo" value={P.lo} min={-4} max={4} step={0.05} onChange={(v) => set("lo", r2(Math.min(v, P.hi)))} />
              <ParameterControl label={t.hi} param="hi" value={P.hi} min={-4} max={4} step={0.05} onChange={(v) => set("hi", r2(Math.max(v, P.lo)))} />
              <ParameterControl label={t.nRect} param="nRect" value={P.nRect} min={1} max={200} step={1} onChange={(v) => set("nRect", Math.round(v))} />
              <ChoiceControl<RiemannKind> label={t.rule} param="rule" size="sm" value={P.rule} onChange={(v) => set("rule", v)} options={RULES.map((r) => ({ value: r, label: t.rules[r] }))} />
            </>
          )}
          {T === "sum" && (
            <>
              <ParameterControl label={t.terms} param="terms" value={P.terms} min={2} max={DATA.x.length} step={1} onChange={(v) => set("terms", Math.round(v))} />
              <ParameterControl label={t.center} param="center" value={P.center} min={0} max={14} step={0.1} onChange={(v) => set("center", r2(v))} />
            </>
          )}
          {T === "bowl" && (
            <>
              <ParameterControl label={t.aLabel} param="ba" value={P.ba} min={A_RANGE[0]} max={A_RANGE[1]} step={0.5} onChange={(v) => set("ba", r2(v))} />
              <ParameterControl label={t.bLabel} param="bb" value={P.bb} min={B_RANGE[0]} max={B_RANGE[1]} step={0.05} onChange={(v) => set("bb", r2(v))} />
              <div className="flex flex-wrap gap-2">
                <LabButton onClick={() => {
                  const [a, b] = descentStep(bw);
                  setMany({ ba: r2(a), bb: Math.round(b * 1000) / 1000 });
                }}>
                  {t.stepBtn}
                </LabButton>
                <LabButton onClick={() => setMany({ ba: r2(OLS.a), bb: Math.round(OLS.b * 1000) / 1000 })}>{t.snapBtn}</LabButton>
              </div>
            </>
          )}
          {T === "likelihood" && (
            <>
              <ParameterControl label={t.n} param="n" value={P.n} min={1} max={100} step={1} onChange={(v) => setMany({ n: Math.round(v), k: Math.min(P.k, Math.round(v)) })} />
              <ParameterControl label={t.k} param="k" value={P.k} min={0} max={P.n} step={1} onChange={(v) => set("k", Math.round(v))} />
              <ParameterControl label={t.p} param="p" value={P.p} min={0.01} max={0.99} step={0.01} onChange={(v) => set("p", r2(v))} />
            </>
          )}
        </div>
      </Panel>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
    </>
  );

  const axes = (
    <g aria-hidden>
      {[-4, -3, -2, -1, 1, 2, 3, 4].map((v) => (
        <g key={v}>
          <line x1={X(v)} x2={X(v)} y1={20} y2={400} stroke="var(--grid)" />
          <line x1={20} x2={740} y1={Y(v)} y2={Y(v)} stroke="var(--grid)" />
        </g>
      ))}
      <line x1={20} x2={740} y1={Y(0)} y2={Y(0)} stroke="var(--border-strong)" />
      <line x1={X(0)} x2={X(0)} y1={20} y2={400} stroke="var(--border-strong)" />
      {[-4, -2, 2, 4].map((v) => (
        <g key={`l${v}`}>
          <text x={X(v)} y={Y(0) + 14} textAnchor="middle" fontSize={10} fill="var(--faint)">
            {v}
          </text>
          <text x={X(0) - 6} y={Y(v) + 3} textAnchor="end" fontSize={10} fill="var(--faint)">
            {v}
          </text>
        </g>
      ))}
    </g>
  );
  const dx = (P.hi - P.lo) / P.nRect;
  const rects = T === "integral" && !area.reason ? Array.from({ length: P.nRect }, (_, i) => {
    const xl = P.lo + i * dx;
    const xs = P.rule === "left" ? xl : P.rule === "right" ? xl + dx : xl + dx / 2;
    return { xl, y: G(xs) };
  }) : [];

  return (
    <LabShell
      lab={lab}
      title={t.title}
      aside={aside}
      demos={demos}
      synthetic={T === "bowl" || T === "sum"}
      method={t.methodNote}
      validation={t.validation}
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula[T].map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight[T]}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <ChoiceControl<Topic> label={t.topic} hideLabel param="topic" value={T} onChange={(v) => set("topic", v)} options={TOPICS.map((v) => ({ value: v, label: t.topics[v] }))} />
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[T]}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>

        {(fnTopic || T === "log") && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.plot}</h2>
            <AccessibleVisualization
              viewBox="0 0 760 420"
              svgRef={fnRef}
              interactive={T !== "functions"}
              onPointerMove={fnDrag.move}
              onPointerUp={fnDrag.end}
              summary={
                T === "log"
                  ? `y = eˣ, y = ln x and y = x; x₀ = ${P.x0}, ln x₀ = ${fmt(Math.log(P.x0), 3)}.`
                  : `${t.transform} with f = ${t.fns[P.fn]}, a = ${P.a}, b = ${P.b}, c = ${P.c}, d = ${P.d}. ${readouts.map((r) => `${r.label}: ${r.value}`).join("; ")}`
              }
              table={fnTopic ? { caption: t.plot, columns: ["x", "g(x)"], rows: Array.from({ length: 17 }, (_, i) => -4 + i * 0.5).map((x) => [fmt(x, 1), Number.isFinite(G(x)) ? fmt(G(x), 4) : "—"]) } : undefined}
            >
              {axes}
              {rects.map((r, i) => (
                <rect key={i} x={X(Math.min(r.xl, r.xl + dx))} y={Math.min(Y(r.y), Y(0))} width={r2(Math.abs(dx) * 80)} height={r2(Math.abs(Y(r.y) - Y(0)))} fill="var(--explained)" fillOpacity={0.25} stroke="var(--explained)" />
              ))}
              {T === "integral" && !area.reason && (
                <path d={`M${X(P.lo)},${Y(0)} ${path(G, P.lo, P.hi).replace(/M/g, "L")} L${X(P.hi)},${Y(0)} Z`} fill="var(--explained)" fillOpacity={0.18} />
              )}
              {T === "log" ? (
                <>
                  <line x1={X(-4.4)} y1={Y(-4.4)} x2={X(4.4)} y2={Y(4.4)} stroke="var(--muted)" strokeDasharray="4 3" />
                  <path d={path(Math.exp)} fill="none" stroke="var(--data)" strokeWidth={2} />
                  <path d={path((x) => (x > 0 ? Math.log(x) : NaN), 0.005)} fill="none" stroke="var(--ink)" strokeWidth={2} />
                  <line x1={X(P.x0)} y1={Y(Math.log(P.x0))} x2={X(Math.log(P.x0))} y2={Y(P.x0)} stroke="var(--residual)" strokeDasharray="3 3" />
                  <circle cx={X(Math.log(P.x0))} cy={Y(P.x0)} r={6} fill="var(--data)" stroke="var(--ink)" />
                  <text x={X(2.2)} y={Y(4.2)} fontSize={12} fill="var(--data-ink)">
                    y = eˣ
                  </text>
                  <text x={X(3.3)} y={Y(1.5)} fontSize={12} fill="var(--ink)">
                    y = ln x
                  </text>
                  <DragHandle x={X(P.x0)} y={Y(Math.log(P.x0))} fill="var(--ink)" orientation="horizontal" label={t.x0} value={P.x0} min={0.05} max={4} step={0.05} valueText={`x₀ = ${P.x0}`} onStart={(e) => fnDrag.start("x0", e)} onValue={(v) => set("x0", r2(v))} />
                </>
              ) : (
                <>
                  {T === "functions" && <path d={path(g(P.fn, { a: 1, b: 1, c: 0, d: 0 }))} fill="none" stroke="var(--muted)" strokeDasharray="5 4" />}
                  <path d={path(G)} fill="none" stroke="var(--ink)" strokeWidth={2.5} />
                </>
              )}
              {T === "derivative" && Number.isFinite(gx0) && (
                <>
                  {slope.value !== null && <line x1={X(P.x0 - 2)} y1={Y(gx0 - 2 * slope.value)} x2={X(P.x0 + 2)} y2={Y(gx0 + 2 * slope.value)} stroke="var(--explained)" strokeWidth={2.5} />}
                  {Number.isFinite(sec) && <line x1={X(P.x0 - h - 1)} y1={Y(G(P.x0 - h) - sec)} x2={X(P.x0 + h + 1)} y2={Y(G(P.x0 + h) + sec)} stroke="var(--residual)" strokeWidth={1.5} strokeDasharray="5 4" />}
                  {Number.isFinite(G(P.x0 - h)) && <circle cx={X(P.x0 - h)} cy={Y(G(P.x0 - h))} r={3.5} fill="var(--residual)" />}
                  {Number.isFinite(G(P.x0 + h)) && <circle cx={X(P.x0 + h)} cy={Y(G(P.x0 + h))} r={3.5} fill="var(--residual)" />}
                </>
              )}
              {T === "derivative" && (
                <DragHandle x={X(P.x0)} y={Number.isFinite(gx0) ? Y(clamp(gx0, -5, 5)) : Y(0)} fill="var(--explained)" orientation="horizontal" label={t.x0} value={P.x0} min={-4} max={4} step={0.05} valueText={`x₀ = ${P.x0}`} disabled={locked("x0")} onStart={(e) => fnDrag.start("x0", e)} onValue={(v) => set("x0", r2(v))} />
              )}
              {T === "integral" &&
                (["lo", "hi"] as const).map((k) => (
                  <DragHandle key={k} x={X(P[k])} y={Y(0)} r={8} fill="var(--explained)" orientation="horizontal" label={k === "lo" ? t.lo : t.hi} value={P[k]} min={-4} max={4} step={0.05} valueText={String(P[k])} onStart={(e) => fnDrag.start(k, e)} onValue={(v) => set(k, r2(k === "lo" ? Math.min(v, P.hi) : Math.max(v, P.lo)))} />
                ))}
            </AccessibleVisualization>
            {T === "derivative" && slope.reason && (
              <p className="mt-1 text-sm text-attention-ink" role="status">
                {slope.reason === "kink" ? t.kink : t.domain}
              </p>
            )}
            {T === "integral" && area.reason && (
              <p className="mt-1 text-sm text-attention-ink" role="status">
                {t.domain}
              </p>
            )}
          </section>
        )}

        {T === "sum" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.sumTitle}</h2>
              <ol className="mt-2 space-y-1 text-sm tabular-nums text-ink" data-testid="sigma-terms">
                {ex.terms.map((term, i) => (
                  <li key={i}>
                    (x<sub>{i + 1}</sub> − x̄)² = ({fmt(term.x, 0)} − {fmt(ex.mean, 2)})² = ({fmt(term.dev, 2)})² = {fmt(term.sq, 3)}
                  </li>
                ))}
                <li className="border-t border-line pt-1 font-semibold">
                  {t.total}: Σ(xᵢ − x̄) = {fmt(Math.abs(ex.sumDev) < 1e-12 ? 0 : ex.sumDev, 3)} · Σ(xᵢ − x̄)² = {fmt(ex.ss, 3)}
                </li>
              </ol>
            </section>
            <section className="space-y-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.squares}</h2>
                <AccessibleVisualization viewBox="0 0 360 200" summary={`${t.squares}: ${ex.terms.map((x) => fmt(x.dev, 2)).join(", ")}.`}>
                  <line x1={20} x2={340} y1={170} y2={170} stroke="var(--border-strong)" />
                  {(() => {
                    const S = (v: number) => r2(20 + (v / 14) * 320);
                    return (
                      <>
                        <line x1={S(ex.mean)} x2={S(ex.mean)} y1={10} y2={180} stroke="var(--model)" strokeWidth={2} />
                        <text x={S(ex.mean) + 4} y={20} fontSize={10} fill="var(--model-ink)">
                          x̄ = {fmt(ex.mean, 2)}
                        </text>
                        {ex.terms.map((term, i) => {
                          const side = Math.abs(term.dev) * (320 / 14);
                          return <rect key={i} x={Math.min(S(term.x), S(ex.mean))} y={r2(170 - side)} width={r2(side)} height={r2(side)} fill={term.dev < 0 ? "var(--residual)" : "var(--data)"} fillOpacity={0.18} stroke={term.dev < 0 ? "var(--residual)" : "var(--data)"} />;
                        })}
                        {ex.terms.map((term, i) => (
                          <circle key={`p${i}`} cx={S(term.x)} cy={170} r={4} fill="var(--ink)" />
                        ))}
                      </>
                    );
                  })()}
                </AccessibleVisualization>
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.ssCurve}</h2>
                {(() => {
                  const cs = Array.from({ length: 57 }, (_, i) => i * 0.25);
                  const vs = cs.map((c) => ssAround(sumX, c));
                  const vMax = Math.max(...vs);
                  const CX = (c: number) => r2(30 + (c / 14) * 310);
                  const CY = (v: number) => r2(150 - (v / vMax) * 130);
                  return (
                    <AccessibleVisualization viewBox="0 0 360 170" summary={`${t.ssCurve}: minimum ${fmt(ex.ss, 2)} at c = x̄ = ${fmt(ex.mean, 2)}; c = ${P.center}: ${fmt(ssAround(sumX, P.center), 2)}.`}>
                      <line x1={30} x2={340} y1={150} y2={150} stroke="var(--border-strong)" />
                      <path d={cs.map((c, i) => `${i ? "L" : "M"}${CX(c)},${CY(vs[i])}`).join(" ")} fill="none" stroke="var(--residual)" strokeWidth={2} />
                      <circle cx={CX(ex.mean)} cy={CY(ex.ss)} r={4} fill="var(--model)" />
                      <circle cx={CX(P.center)} cy={CY(ssAround(sumX, P.center))} r={6} fill="var(--residual)" stroke="var(--ink)" />
                    </AccessibleVisualization>
                  );
                })()}
              </div>
            </section>
          </div>
        )}

        {T === "bowl" && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.bowlMap}</h2>
                <AccessibleVisualization
                  viewBox="0 0 380 360"
                  svgRef={bowlRef}
                  interactive
                  onPointerMove={bowlDrag.move}
                  onPointerUp={bowlDrag.end}
                  summary={`${t.bowlMap}: a = ${P.ba}, b = ${P.bb}, SSE = ${fmt(bw.sse, 1)}; minimum ${fmt(OLS.sse, 1)} at (${fmt(OLS.a, 2)}, ${fmt(OLS.b, 2)}).`}
                >
                  <defs>
                    <clipPath id={clipId}>
                      <rect x={40} y={30} width={320} height={300} />
                    </clipPath>
                  </defs>
                  <rect x={40} y={30} width={320} height={300} fill="var(--surface-2)" />
                  <g clipPath={`url(#${clipId})`}>
                    {contours.map((pts, i) => (
                      <path key={i} d={pts.map((p, j) => `${j ? "L" : "M"}${BX(p[0])},${BY(p[1])}`).join(" ") + "Z"} fill="none" stroke="var(--muted)" strokeOpacity={0.35 + 0.08 * (contours.length - i)} />
                    ))}
                  </g>
                  <circle cx={BX(OLS.a)} cy={BY(OLS.b)} r={5} fill="var(--model)" />
                  <text x={200} y={352} textAnchor="middle" fontSize={10} fill="var(--muted)">
                    {t.aLabel} ({A_RANGE[0]} … {A_RANGE[1]})
                  </text>
                  <text x={14} y={180} textAnchor="middle" fontSize={10} fill="var(--muted)" transform="rotate(-90 14 180)">
                    {t.bLabel} ({B_RANGE[0]} … {B_RANGE[1]})
                  </text>
                  <DragHandle x={BX(P.ba)} y={BY(P.bb)} fill="var(--residual)" orientation="horizontal" cursor="move" label={t.aLabel} value={P.ba} min={A_RANGE[0]} max={A_RANGE[1]} step={0.5} valueText={`a = ${P.ba}, b = ${P.bb}`} onStart={(e) => bowlDrag.start("ab", e)} onValue={(v) => set("ba", r2(v))} />
                </AccessibleVisualization>
              </section>
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.bowlFit}</h2>
                <AccessibleVisualization viewBox="0 0 360 220" summary={`${t.bowlFit}: ŷ = ${P.ba} + ${P.bb}x.`} table={{ caption: t.bowlFit, columns: ["x", "y", "ŷ", "e"], rows: DATA.x.map((x, i) => [String(x), String(DATA.y[i]), fmt(P.ba + P.bb * x, 2), fmt(DATA.y[i] - P.ba - P.bb * x, 2)]) }}>
                  <line x1={40} x2={340} y1={200} y2={200} stroke="var(--border-strong)" />
                  {DATA.x.map((x, i) => (
                    <line key={`e${i}`} x1={FX(x)} x2={FX(x)} y1={FY(DATA.y[i])} y2={FY(clamp(P.ba + P.bb * x, -5, 105))} stroke="var(--residual)" />
                  ))}
                  <line x1={FX(0)} y1={FY(clamp(P.ba, -5, 105))} x2={FX(14)} y2={FY(clamp(P.ba + 14 * P.bb, -5, 105))} stroke="var(--explained)" strokeWidth={2.5} />
                  <line x1={FX(0)} y1={FY(OLS.a)} x2={FX(14)} y2={FY(OLS.a + 14 * OLS.b)} stroke="var(--model)" strokeDasharray="4 3" />
                  {DATA.x.map((x, i) => (
                    <circle key={i} cx={FX(x)} cy={FY(DATA.y[i])} r={4} fill="var(--data)" />
                  ))}
                </AccessibleVisualization>
              </section>
            </div>
            <section className="lg:w-1/2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.slice}</h2>
              <AccessibleVisualization viewBox="0 0 360 190" svgRef={sliceRef} interactive onPointerMove={sliceDrag.move} onPointerUp={sliceDrag.end} summary={`${t.slice}: a = ${P.ba}; at b = ${P.bb} SSE = ${fmt(bw.sse, 1)} and ∂SSE/∂b = ${fmt(bw.grad[1], 1)}.`}>
                <line x1={40} x2={340} y1={170} y2={170} stroke="var(--border-strong)" />
                <path d={slice.map((s, i) => `${i ? "L" : "M"}${SX(s.b)},${SY(s.sse)}`).join(" ")} fill="none" stroke="var(--residual)" strokeWidth={2} />
                {(() => {
                  const k = bw.grad[1];
                  const db = 1;
                  return <line x1={SX(P.bb - db)} y1={SY(bw.sse - k * db)} x2={SX(P.bb + db)} y2={SY(bw.sse + k * db)} stroke="var(--explained)" strokeWidth={2} />;
                })()}
                <DragHandle x={SX(P.bb)} y={SY(bw.sse)} fill="var(--residual)" orientation="horizontal" label={t.bLabel} value={P.bb} min={B_RANGE[0]} max={B_RANGE[1]} step={0.05} valueText={`b = ${P.bb}`} onStart={(e) => sliceDrag.start("b", e)} onValue={(v) => set("bb", r2(v))} />
              </AccessibleVisualization>
            </section>
          </div>
        )}

        {T === "likelihood" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.likCurve}</h2>
              <AccessibleVisualization viewBox="0 0 360 200" svgRef={likRef} interactive onPointerMove={likDrag.move} onPointerUp={likDrag.end} summary={`${t.likCurve}: k = ${P.k}, n = ${P.n}; maximum at p̂ = ${fmt(lk.pHat, 3)}; L(${P.p}) = ${lk.L.toExponential(3)}.`} table={{ caption: t.likCurve, columns: ["p", "L(p)", "ℓ(p)"], rows: grid.filter((_, i) => i % 5 === 4).map((q) => [fmt(q, 2), likelihoodAt(P.k, P.n, q).L.toExponential(3), fmt(likelihoodAt(P.k, P.n, q).logL, 3)]) }}>
                <line x1={40} x2={340} y1={170} y2={170} stroke="var(--border-strong)" />
                <path d={grid.map((q, i) => `${i ? "L" : "M"}${PX(q)},${LY(lks[i].L)}`).join(" ")} fill="none" stroke="var(--ink)" strokeWidth={2} />
                <line x1={PX(lk.pHat)} x2={PX(lk.pHat)} y1={20} y2={170} stroke="var(--model)" strokeDasharray="4 3" />
                {[0, 0.5, 1].map((q) => (
                  <text key={q} x={PX(q)} y={186} textAnchor="middle" fontSize={10} fill="var(--muted)">
                    {q}
                  </text>
                ))}
                <DragHandle x={PX(P.p)} y={LY(lk.L)} fill="var(--explained)" orientation="horizontal" label={t.p} value={P.p} min={0.01} max={0.99} step={0.01} valueText={`p = ${P.p}`} onStart={(e) => likDrag.start("p", e)} onValue={(v) => set("p", r2(v))} />
              </AccessibleVisualization>
            </section>
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.logLikCurve}</h2>
              <AccessibleVisualization viewBox="0 0 360 200" summary={`${t.logLikCurve}: ℓ(${P.p}) = ${fmt(lk.logL, 3)}, slope ${fmt(lk.score, 3)}.`}>
                <line x1={40} x2={340} y1={170} y2={170} stroke="var(--border-strong)" />
                <path d={grid.map((q, i) => `${i ? "L" : "M"}${PX(q)},${LLY(lks[i].logL)}`).join(" ")} fill="none" stroke="var(--ink)" strokeWidth={2} />
                <line x1={PX(lk.pHat)} x2={PX(lk.pHat)} y1={20} y2={170} stroke="var(--model)" strokeDasharray="4 3" />
                <circle cx={PX(P.p)} cy={LLY(lk.logL)} r={6} fill="var(--explained)" stroke="var(--ink)" />
              </AccessibleVisualization>
            </section>
          </div>
        )}
      </div>
    </LabShell>
  );
}

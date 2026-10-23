"use client";

// Linear Algebra & PCA Studio. Port of "QDA2 PCA Studio.dc.html" plus the spec's FA and k-means parts: a
// rotatable probe axis with the variance-vs-angle curve, PCA vs principal-axis FA on the course items, a 2×2
// matrix acting on vectors (and on the cloud), and a k-means stepper with the SSW trace.
import { fmt } from "@/lib/engine/format";
import { sum } from "@/lib/engine/numeric";
import { pearson } from "@/lib/engine/inference";
import { useMemo, useRef } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl, ToggleControl } from "../../primitives/controls";
import { StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import type { ItemSet } from "../measurement-index-lab/model";
import { apply2, axisGap, itemAnalysis, makeBlobs, makeCloud, mat2Info, probe, runKmeans, varianceCurve, type Mat2 } from "./model";
import { PC_T } from "./strings";

type View = "probe" | "items" | "matrix" | "kmeans";
type Method = "pca" | "paf";
export interface PcParams extends Record<string, unknown> {
  view: View;
  dims: number;
  standardize: boolean;
  theta: number;
  rho: number;
  drops: boolean;
  set: ItemSet;
  keyed: boolean;
  method: Method;
  factors: number;
  matrix: number[];
  vec: number[];
  mapCloud: boolean;
  k: number;
  step: number;
  seed: number;
}
const VIEWS: View[] = ["probe", "items", "matrix", "kmeans"];
const SETS: ItemSet[] = ["efficacy", "trust"];
const DEFAULTS: PcParams = { view: "probe", dims: 2, standardize: true, theta: 30, rho: 0.7, drops: true, set: "efficacy", keyed: true, method: "pca", factors: 1, matrix: [1.4, 0.5, 0.3, 0.8], vec: [1.2, 0.6], mapCloud: false, k: 3, step: 99, seed: 2026 };
const PRESETS: Record<"sym" | "shear" | "rotate" | "stretch", number[]> = { sym: [2, 1, 1, 2], shear: [1, 1, 0, 1], rotate: [0, -1, 1, 0], stretch: [1.4, 0.5, 0.3, 0.8] };
const CLUSTER = ["var(--x)", "var(--y)", "var(--z)", "var(--model)", "var(--residual)", "var(--attention)"];
const r2 = (v: number) => Math.round(v * 100) / 100;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

export function normalizePc(p: PcParams): PcParams {
  let view = VIEWS.includes(p.view) ? p.view : DEFAULTS.view;
  // spec configs pass dims: 2 for the probe axis, ≥ 3 for item PCA
  if (view === "probe" && num(p.dims, 2) >= 3) view = "items";
  const m = Array.isArray(p.matrix) && p.matrix.length === 4 ? p.matrix.map((v, i) => r2(clamp(num(v, DEFAULTS.matrix[i]), -3, 3))) : DEFAULTS.matrix;
  const v = Array.isArray(p.vec) && p.vec.length === 2 ? p.vec.map((x, i) => r2(clamp(num(x, DEFAULTS.vec[i]), -3, 3))) : DEFAULTS.vec;
  return {
    ...p,
    view,
    dims: view === "items" ? Math.max(3, num(p.dims, 5)) : 2,
    standardize: p.standardize !== false,
    theta: clamp(Math.round(num(p.theta, 30)), 0, 180),
    rho: r2(clamp(num(p.rho, 0.7), -0.95, 0.95)),
    drops: p.drops !== false,
    set: SETS.includes(p.set) ? p.set : DEFAULTS.set,
    keyed: p.keyed !== false,
    method: p.method === "paf" ? "paf" : "pca",
    factors: num(p.factors, 1) >= 2 ? 2 : 1,
    matrix: m,
    vec: v,
    mapCloud: p.mapCloud === true,
    k: clamp(Math.round(num(p.k, 3)), 1, 6),
    step: clamp(Math.round(num(p.step, 99)), 0, 99),
    seed: Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed,
  };
}

export default function LinalgPcaStudio(props: LabProps) {
  const lab = useLab<PcParams>("linalg-pca-studio", DEFAULTS, { ...props, normalize: normalizePc });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = PC_T[lang];
  const cloud = useMemo(() => makeCloud(P.seed, P.rho), [P.seed, P.rho]);
  const pr = useMemo(() => probe(cloud, P.standardize, P.theta), [cloud, P.standardize, P.theta]);
  const curve = useMemo(() => (pr ? varianceCurve(pr.xs, pr.ys) : []), [pr]);
  const items = useMemo(() => (P.view === "items" ? itemAnalysis(P.set, P.keyed, true, P.factors) : null), [P.view, P.set, P.keyed, P.factors]);
  const A: Mat2 = [
    [P.matrix[0], P.matrix[1]],
    [P.matrix[2], P.matrix[3]],
  ];
  const mi = mat2Info(A);
  const blobs = useMemo(() => makeBlobs(P.seed), [P.seed]);
  const km = useMemo(() => (P.view === "kmeans" ? runKmeans(blobs, P.k, P.seed) : null), [P.view, blobs, P.k, P.seed]);
  const sswByK = useMemo(() => (P.view === "kmeans" ? [1, 2, 3, 4, 5, 6].map((k) => ({ k, ssw: runKmeans(blobs, k, P.seed)?.ssw ?? 0 })) : []), [P.view, blobs, P.seed]);

  // probe geometry
  const cloudRef = useRef<SVGSVGElement>(null);
  // projections are no longer than the point's distance from the origin, so scale by the largest radius
  const maxR = pr ? Math.max(...pr.xs.map((x, i) => Math.hypot(x, pr.ys[i])), 1) : 1;
  const SC = 195 / (maxR * 1.02);
  const X = (v: number) => r2(230 + v * SC);
  const Y = (v: number) => r2(230 - v * SC);
  const u = [Math.cos((P.theta * Math.PI) / 180), Math.sin((P.theta * Math.PI) / 180)];
  const angleFrom = (p: { x: number; y: number }) => {
    const d = (Math.atan2(-(p.y - 230), p.x - 230) * 180) / Math.PI;
    return Math.round(((d % 180) + 180) % 180);
  };
  const probeDrag = useSvgDrag<"axis">(cloudRef, (_, p) => set("theta", angleFrom(p)));
  const lam1 = pr?.values[0] ?? 1;
  const VX = (deg: number) => r2(40 + (deg / 180) * 300);
  const VY = (v: number) => r2(250 - (v / (lam1 * 1.1 || 1)) * 220);
  const found = pr ? axisGap(P.theta, pr.pc1Deg) <= 2 : false;

  // matrix geometry
  const matRef = useRef<SVGSVGElement>(null);
  const MS = 62;
  const MX = (v: number) => r2(230 + v * MS);
  const MY = (v: number) => r2(230 - v * MS);
  const vecDrag = useSvgDrag<"v">(matRef, (_, p) => set("vec", [r2(clamp((p.x - 230) / MS, -3, 3)), r2(clamp(-(p.y - 230) / MS, -3, 3))]));
  const Av = apply2(A, P.vec);
  const circle = Array.from({ length: 73 }, (_, i) => [Math.cos((i * 5 * Math.PI) / 180), Math.sin((i * 5 * Math.PI) / 180)]);
  const ellipse = circle.map((c) => apply2(A, c));
  const mappedCloud = P.mapCloud && pr ? pr.xs.map((x, i) => apply2(A, [x, pr.ys[i]])) : [];
  const ASAt = pr
    ? (() => {
        const AS = A.map((row) => [0, 1].map((j) => row[0] * pr.S[0][j] + row[1] * pr.S[1][j]));
        return AS.map((row) => [0, 1].map((j) => row[0] * A[j][0] + row[1] * A[j][1]));
      })()
    : null;
  const setCell = (i: number, v: number) => set("matrix", P.matrix.map((x, j) => (j === i ? r2(clamp(v, -3, 3)) : x)));

  // k-means geometry
  const KX = (v: number) => r2(230 + v * 75);
  const KY = (v: number) => r2(200 - v * 75);
  const steps = km?.steps ?? [];
  const si = Math.min(P.step, Math.max(0, steps.length - 1));
  const cur = steps[si];
  const cx = sum(blobs.map((p) => p[0])) / blobs.length;
  const cy = sum(blobs.map((p) => p[1])) / blobs.length;
  const sst = sum(blobs.map((p) => (p[0] - cx) ** 2 + (p[1] - cy) ** 2));
  const sswMax = Math.max(...steps.map((s) => s.ssw), 1);
  const TX = (i: number) => r2(40 + (i / Math.max(1, steps.length - 1)) * 280);
  const TY = (v: number) => r2(150 - (v / sswMax) * 130);

  const r = pearson(cloud.xs, cloud.ys).r;
  const readouts: Readout[] =
    P.view === "probe" && pr
      ? [
          { label: t.varAlong, value: fmt(pr.varAlong, 3), tone: found ? "explained" : undefined },
          { label: t.lambda1, value: fmt(pr.values[0], 3), tone: "model" },
          { label: t.lambda2, value: fmt(pr.values[1], 3) },
          { label: t.trace, value: `${fmt(pr.values[0] + pr.values[1], 3)} = ${fmt(pr.S[0][0] + pr.S[1][1], 3)}` },
          { label: t.pc1, value: `${fmt(pr.pc1Deg, 1)}°` },
          { label: t.r, value: r === null ? "—" : fmt(r, 3) },
          { label: t.covScores, value: fmt(Math.abs(pr.covScores) < 1e-12 ? 0 : pr.covScores, 3) },
        ]
      : P.view === "items" && items?.pc
        ? [
            { label: t.lambda1, value: fmt(items.pc.eigenvalues[0], 3), tone: "model" },
            { label: t.explained1, value: `${fmt(100 * items.pc.explained[0], 1)} %` },
            { label: t.kaiser, value: String(items.pc.eigenvalues.filter((v) => v > 1).length) },
            { label: "Σλ", value: `${fmt(sum(items.pc.eigenvalues), 3)} = p` },
          ]
        : P.view === "matrix"
          ? [
              { label: t.det, value: fmt(mi.det, 3) },
              { label: t.tr, value: fmt(mi.trace, 3) },
              { label: t.eigvals, value: mi.eig.length ? mi.eig.map((e) => fmt(e.value, 3)).join(", ") : "—", note: mi.eig.length ? undefined : t.complex },
              { label: t.Av, value: `(${fmt(Av[0], 2)}, ${fmt(Av[1], 2)})`, tone: "residual" },
              ...(P.mapCloud && ASAt ? [{ label: t.sigmaAfter, value: `[${fmt(ASAt[0][0], 2)} ${fmt(ASAt[0][1], 2)}; ${fmt(ASAt[1][0], 2)} ${fmt(ASAt[1][1], 2)}]` }] : []),
            ]
          : km && cur
            ? [
                { label: t.ssw, value: fmt(cur.ssw, 2), tone: "residual" },
                { label: t.sst, value: fmt(sst, 2) },
                { label: t.rsq, value: fmt(1 - cur.ssw / sst, 3), tone: "explained" },
                { label: t.iters, value: `${steps.length}${km.converged ? "" : " (max)"}` },
              ]
            : [];
  const live = P.view === "probe" && pr ? t.live.replace("{th}", String(P.theta)).replace("{v}", fmt(pr.varAlong, 3)) : readouts.map((x) => `${x.label}: ${x.value}`).join("; ");

  const demos: TeachDemo[] = [
    { title: lang === "hu" ? "Két item, r = 0,8" : "Two items, r = .8", note: t.insight.probe, apply: () => setMany({ view: "probe", rho: 0.8, standardize: true, theta: 0 }) },
    { title: lang === "hu" ? "Kurzus-itemek" : "Course items", note: t.insight.items, apply: () => setMany({ view: "items", set: "efficacy", keyed: true, method: "pca" }) },
    { title: t.presetNames.shear, note: t.insight.matrix, apply: () => setMany({ view: "matrix", matrix: PRESETS.shear }) },
    { title: lang === "hu" ? "Három csoport" : "Three blobs", note: t.insight.kmeans, apply: () => setMany({ view: "kmeans", k: 3, step: 0 }) },
  ];

  const aside = (
    <>
      <Panel title={t.data}>
        <div className="space-y-3">
          {(P.view === "probe" || P.view === "matrix") && (
            <>
              <ParameterControl label={t.angle} param="theta" value={P.theta} min={0} max={180} step={1} onChange={(v) => set("theta", Math.round(v))} />
              <LabButton onClick={() => pr && set("theta", Math.round(pr.pc1Deg))} disabled={!pr || locked("theta")}>
                {t.snap}
              </LabButton>
              <ToggleControl label={t.standardize} param="standardize" checked={P.standardize} onChange={(v) => set("standardize", v)} />
              <ToggleControl label={t.drops} param="drops" checked={P.drops} onChange={(v) => set("drops", v)} />
              <ParameterControl label={t.rho} param="rho" value={P.rho} min={-0.95} max={0.95} step={0.05} onChange={(v) => set("rho", r2(v))} />
            </>
          )}
          {P.view === "items" && (
            <>
              <ChoiceControl<ItemSet> label={t.set} param="set" size="sm" value={P.set} onChange={(v) => set("set", v)} options={SETS.map((s) => ({ value: s, label: t.sets[s] }))} />
              <ToggleControl label={t.keyed} param="keyed" checked={P.keyed} onChange={(v) => set("keyed", v)} />
              <ChoiceControl<Method> label={t.method} param="method" size="sm" value={P.method} onChange={(v) => set("method", v)} options={(["pca", "paf"] as Method[]).map((m) => ({ value: m, label: t.methods[m] }))} />
              <ChoiceControl<string> label={t.factors} param="factors" size="sm" value={String(P.factors)} onChange={(v) => set("factors", Number(v))} options={["1", "2"].map((v) => ({ value: v, label: v }))} />
            </>
          )}
          {P.view === "matrix" && <ToggleControl label={t.cloudThrough} param="mapCloud" checked={P.mapCloud} onChange={(v) => set("mapCloud", v)} />}
          {P.view === "kmeans" && <ParameterControl label={t.k} param="k" value={P.k} min={1} max={6} step={1} onChange={(v) => setMany({ k: Math.round(v), step: 99 })} />}
          <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
        </div>
      </Panel>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
    </>
  );

  const loadings = items?.pc ? items.pc.loadings : [];
  const faL = items?.fa?.loadings ?? [];
  const sign = (k: number) => (loadings[k] && sum(loadings[k]) < 0 ? -1 : 1);
  const fsign = (k: number) => (faL[k] && sum(faL[k]) < 0 ? -1 : 1);

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
            {t.formula[P.view].map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight[P.view]}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <ChoiceControl<View> label={t.view} hideLabel param="view" value={P.view} onChange={(v) => setMany({ view: v, dims: v === "items" ? 5 : 2 })} options={VIEWS.map((v) => ({ value: v, label: t.views[v], disabled: locked("dims") && (v === "items") !== (P.view === "items") }))} />
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[P.view]}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>

        {P.view === "probe" && pr && (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.cloud}</h2>
              <AccessibleVisualization
                viewBox="0 0 460 460"
                svgRef={cloudRef}
                interactive
                onPointerMove={probeDrag.move}
                onPointerUp={probeDrag.end}
                summary={`${t.cloud}: θ = ${P.theta}°, Var = ${fmt(pr.varAlong, 3)}; PC1 at ${fmt(pr.pc1Deg, 1)}° with λ₁ = ${fmt(pr.values[0], 3)}, λ₂ = ${fmt(pr.values[1], 3)}.`}
                table={{ caption: t.cloud, columns: ["x", "y", "proj"], rows: pr.xs.map((x, i) => [fmt(x, 3), fmt(pr.ys[i], 3), fmt(pr.proj[i], 3)]) }}
              >
                <line x1={20} x2={440} y1={230} y2={230} stroke="var(--grid)" />
                <line x1={230} x2={230} y1={20} y2={440} stroke="var(--grid)" />
                {P.drops && pr.xs.map((x, i) => <line key={`d${i}`} x1={X(x)} y1={Y(pr.ys[i])} x2={X(pr.proj[i] * u[0])} y2={Y(pr.proj[i] * u[1])} stroke="var(--residual)" strokeOpacity={0.7} />)}
                {pr.vectors.map((v, k) => {
                  const L = Math.sqrt(Math.max(0, pr.values[k])) * 1.6;
                  return (
                    <g key={k}>
                      <line x1={X(-v[0] * L)} y1={Y(-v[1] * L)} x2={X(v[0] * L)} y2={Y(v[1] * L)} stroke={k ? "var(--model)" : "var(--y)"} strokeWidth={k ? 1.5 : 2.5} strokeDasharray={k ? "4 3" : undefined} />
                      <text x={X(v[0] * L) + 6} y={Y(v[1] * L) - 4} fontSize={11} fill={k ? "var(--model-ink)" : "var(--y-ink)"}>
                        PC{k + 1} λ = {fmt(pr.values[k], 2)}
                      </text>
                    </g>
                  );
                })}
                <line x1={r2(230 - 200 * u[0])} y1={r2(230 + 200 * u[1])} x2={r2(230 + 200 * u[0])} y2={r2(230 - 200 * u[1])} stroke="var(--explained)" strokeWidth={3} />
                {pr.xs.map((x, i) => (
                  <circle key={i} cx={X(x)} cy={Y(pr.ys[i])} r={4} fill="var(--data)" />
                ))}
                {P.drops && pr.proj.map((p, i) => <circle key={`p${i}`} cx={X(p * u[0])} cy={Y(p * u[1])} r={2} fill="var(--explained)" />)}
                <DragHandle
                  x={r2(230 + 190 * u[0])}
                  y={r2(230 - 190 * u[1])}
                  r={9}
                  fill="var(--explained)"
                  orientation="both"
                  cursor="grab"
                  label={t.probeAxis}
                  value={P.theta}
                  min={0}
                  max={180}
                  step={1}
                  valueText={`${P.theta}°`}
                  disabled={locked("theta")}
                  onStart={(e) => probeDrag.start("axis", e)}
                  onValue={(v) => set("theta", Math.round(v))}
                />
              </AccessibleVisualization>
              {found && (
                <p className="mt-1 text-sm text-explained-ink" role="status">
                  {t.found}
                </p>
              )}
            </section>
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.curve}</h2>
              <AccessibleVisualization
                viewBox="0 0 360 280"
                summary={`${t.curve}: maximum λ₁ = ${fmt(pr.values[0], 3)} at ${fmt(pr.pc1Deg, 1)}°, minimum λ₂ = ${fmt(pr.values[1], 3)}; now ${fmt(pr.varAlong, 3)} at ${P.theta}°.`}
                table={{ caption: t.curve, columns: ["θ", "Var"], rows: curve.filter((_, i) => i % 5 === 0).map((c) => [`${c.deg}°`, fmt(c.v, 3)]) }}
              >
                <line x1={40} x2={340} y1={250} y2={250} stroke="var(--border-strong)" />
                <line x1={40} x2={40} y1={20} y2={250} stroke="var(--border-strong)" />
                <path d={curve.map((c, i) => `${i ? "L" : "M"}${VX(c.deg)},${VY(c.v)}`).join(" ")} fill="none" stroke="var(--explained)" strokeWidth={2} />
                {[pr.pc1Deg, (pr.pc1Deg + 90) % 180].map((d, k) => (
                  <g key={k}>
                    <line x1={VX(d)} x2={VX(d)} y1={20} y2={250} stroke={k ? "var(--model)" : "var(--y)"} strokeDasharray="3 3" />
                    <text x={VX(d) + 4} y={32} fontSize={10} fill={k ? "var(--model-ink)" : "var(--y-ink)"}>
                      λ{k + 1} = {fmt(pr.values[k], 2)}
                    </text>
                  </g>
                ))}
                <circle cx={VX(P.theta)} cy={VY(pr.varAlong)} r={6} fill="var(--explained)" stroke="var(--ink)" />
                {[0, 90, 180].map((d) => (
                  <text key={d} x={VX(d)} y={266} textAnchor="middle" fontSize={10} fill="var(--muted)" className="font-mono">
                    {d}°
                  </text>
                ))}
              </AccessibleVisualization>
            </section>
          </div>
        )}

        {P.view === "items" && items?.pc && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.scree}</h2>
                <AccessibleVisualization
                  viewBox="0 0 360 240"
                  summary={`${t.scree}: ${items.pc.eigenvalues.map((v, k) => `λ${k + 1} = ${fmt(v, 2)} (${fmt(100 * items.pc!.cumulative[k], 0)} %)`).join(", ")}.`}
                  table={{ caption: t.scree, columns: ["k", "λ", "%", "cum %"], rows: items.pc.eigenvalues.map((v, k) => [String(k + 1), fmt(v, 3), fmt(100 * items.pc!.explained[k], 1), fmt(100 * items.pc!.cumulative[k], 1)]) }}
                >
                  {(() => {
                    const p = items.pc.eigenvalues.length;
                    const top = Math.max(3, Math.ceil(items.pc.eigenvalues[0]));
                    const BY = (v: number) => r2(210 - (v / top) * 190);
                    const bw = 280 / p;
                    return (
                      <>
                        <line x1={40} x2={340} y1={210} y2={210} stroke="var(--border-strong)" />
                        <line x1={40} x2={340} y1={BY(1)} y2={BY(1)} stroke="var(--muted)" strokeDasharray="4 3" />
                        <text x={36} y={BY(1) + 4} textAnchor="end" fontSize={10} fill="var(--muted)">
                          1
                        </text>
                        {items.pc.eigenvalues.map((v, k) => (
                          <g key={k}>
                            <rect x={r2(50 + k * bw)} y={BY(v)} width={r2(bw - 12)} height={r2(210 - BY(v))} fill={k ? "var(--data)" : "var(--y)"} fillOpacity={0.85} />
                            <text x={r2(50 + k * bw + (bw - 12) / 2)} y={226} textAnchor="middle" fontSize={10} fill="var(--muted)">
                              {k + 1}
                            </text>
                          </g>
                        ))}
                        <path d={items.pc.cumulative.map((c, k) => `${k ? "L" : "M"}${r2(50 + k * bw + (bw - 12) / 2)},${r2(210 - c * 190)}`).join(" ")} fill="none" stroke="var(--model)" strokeWidth={2} />
                      </>
                    );
                  })()}
                </AccessibleVisualization>
              </section>
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.loadingPlot}</h2>
                <AccessibleVisualization
                  viewBox="0 0 300 300"
                  summary={`${t.loadingPlot}: ${items.names.map((n, j) => `${n} (${fmt(sign(0) * loadings[0][j], 2)}, ${fmt(sign(1) * loadings[1][j], 2)})`).join("; ")}.`}
                >
                  <circle cx={150} cy={150} r={120} fill="none" stroke="var(--grid)" />
                  <line x1={20} x2={280} y1={150} y2={150} stroke="var(--grid)" />
                  <line x1={150} x2={150} y1={20} y2={280} stroke="var(--grid)" />
                  {(() => {
                    const pts = items.names.map((n, j) => ({ n, lx: r2(150 + sign(0) * loadings[0][j] * 120), ly: r2(150 - sign(1) * loadings[1][j] * 120) }));
                    // labels on each side are pushed apart vertically so they never overlap
                    const labelY = new Map<string, number>();
                    for (const right of [true, false]) {
                      let last = -Infinity;
                      for (const q of pts.filter((q) => q.lx >= 150 === right).sort((a, b) => a.ly - b.ly)) {
                        const y = Math.max(q.ly - 4, last + 12);
                        labelY.set(q.n, y);
                        last = y;
                      }
                    }
                    return pts.map(({ n, lx, ly }) => (
                      <g key={n}>
                        <line x1={150} y1={150} x2={lx} y2={ly} stroke={items.negative.includes(n) && !P.keyed ? "var(--residual)" : "var(--data)"} strokeWidth={2} />
                        <text x={lx + (lx >= 150 ? 6 : -6)} y={labelY.get(n)} textAnchor={lx >= 150 ? "start" : "end"} fontSize={10} fill="var(--ink)" className="font-mono">
                          {n}
                        </text>
                      </g>
                    ));
                  })()}
                  <text x={284} y={146} textAnchor="end" fontSize={10} fill="var(--muted)">
                    PC1
                  </text>
                  <text x={154} y={28} fontSize={10} fill="var(--muted)">
                    PC2
                  </text>
                </AccessibleVisualization>
              </section>
            </div>
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.loadingTable}</h2>
              <div className="mt-2 overflow-x-auto" role="region" aria-label={t.loadingTable} tabIndex={0}>
                <table className="w-full text-sm" data-testid="loading-table">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th className="py-1 pr-2 font-medium">{t.item}</th>
                      {Array.from({ length: P.factors }, (_, k) => (
                        <th key={`p${k}`} className="py-1 pr-2 text-right font-medium">
                          PCA {k + 1}
                        </th>
                      ))}
                      {P.method === "paf" &&
                        Array.from({ length: P.factors }, (_, k) => (
                          <th key={`f${k}`} className="py-1 pr-2 text-right font-medium">
                            PAF {k + 1}
                          </th>
                        ))}
                      <th className="py-1 pr-2 text-right font-medium">{t.comm}</th>
                      <th className="py-1 text-right font-medium">{t.uniq}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.names.map((n, j) => {
                      const h = P.method === "paf" && items.fa ? items.fa.communalities[j] : sum(loadings.slice(0, P.factors).map((l) => l[j] ** 2));
                      return (
                        <tr key={n} className="border-b border-line">
                          <td className="py-1 pr-2 font-mono">{n}</td>
                          {Array.from({ length: P.factors }, (_, k) => (
                            <td key={`p${k}`} className="py-1 pr-2 text-right font-mono">
                              {fmt(sign(k) * loadings[k][j], 3)}
                            </td>
                          ))}
                          {P.method === "paf" &&
                            Array.from({ length: P.factors }, (_, k) => (
                              <td key={`f${k}`} className="py-1 pr-2 text-right font-mono">
                                {faL[k] ? fmt(fsign(k) * faL[k][j], 3) : "—"}
                              </td>
                            ))}
                          <td className={h >= 1 ? "py-1 pr-2 text-right font-mono text-attention-ink" : "py-1 pr-2 text-right font-mono"}>{fmt(h, 3)}</td>
                          <td className="py-1 text-right font-mono">{fmt(1 - h, 3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {P.method === "paf" && items.fa && (
                <p className={items.fa.heywood || !items.fa.converged ? "mt-2 text-sm text-attention-ink" : "mt-2 text-sm text-muted"} role="status" data-testid="paf-status">
                  {items.fa.heywood || !items.fa.converged ? t.heywood.replace("{it}", String(items.fa.iterations)) : t.pafIt.replace("{it}", String(items.fa.iterations))}
                </p>
              )}
              <p className="mt-2 text-sm text-muted">{t.pcaVsFa}</p>
            </section>
          </div>
        )}

        {P.view === "matrix" && (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.plane}</h2>
              <AccessibleVisualization
                viewBox="0 0 460 460"
                svgRef={matRef}
                interactive
                onPointerMove={vecDrag.move}
                onPointerUp={vecDrag.end}
                summary={`${t.plane}: v = (${fmt(P.vec[0], 2)}, ${fmt(P.vec[1], 2)}), Av = (${fmt(Av[0], 2)}, ${fmt(Av[1], 2)}); det ${fmt(mi.det, 3)}; ${mi.eig.length ? mi.eig.map((e) => `λ ${fmt(e.value, 3)} along (${fmt(e.vector[0], 2)}, ${fmt(e.vector[1], 2)})`).join(", ") : t.complex}`}
              >
                {[-3, -2, -1, 1, 2, 3].map((g) => (
                  <g key={g}>
                    <line x1={MX(g)} x2={MX(g)} y1={20} y2={440} stroke="var(--grid)" />
                    <line x1={20} x2={440} y1={MY(g)} y2={MY(g)} stroke="var(--grid)" />
                  </g>
                ))}
                <line x1={20} x2={440} y1={230} y2={230} stroke="var(--border-strong)" />
                <line x1={230} x2={230} y1={20} y2={440} stroke="var(--border-strong)" />
                {mappedCloud
                  .filter((p) => Math.abs(p[0]) <= 3.4 && Math.abs(p[1]) <= 3.4)
                  .map((p, i) => (
                    <circle key={i} cx={MX(p[0])} cy={MY(p[1])} r={2.5} fill="var(--data)" fillOpacity={0.5} />
                  ))}
                <path d={circle.map((c, i) => `${i ? "L" : "M"}${MX(c[0])},${MY(c[1])}`).join(" ")} fill="none" stroke="var(--muted)" strokeDasharray="4 3" />
                <path d={ellipse.map((c, i) => `${i ? "L" : "M"}${MX(clamp(c[0], -3.4, 3.4))},${MY(clamp(c[1], -3.4, 3.4))}`).join(" ")} fill="var(--explained)" fillOpacity={0.12} stroke="var(--explained)" strokeWidth={2} />
                {mi.eig.map((e, k) => (
                  <line key={k} x1={MX(-3.3 * e.vector[0])} y1={MY(-3.3 * e.vector[1])} x2={MX(3.3 * e.vector[0])} y2={MY(3.3 * e.vector[1])} stroke={k ? "var(--model)" : "var(--y)"} strokeDasharray="6 4" />
                ))}
                <line x1={230} y1={230} x2={MX(clamp(Av[0], -3.4, 3.4))} y2={MY(clamp(Av[1], -3.4, 3.4))} stroke="var(--residual)" strokeWidth={3} />
                <text x={MX(clamp(Av[0], -3.4, 3.4)) + 6} y={MY(clamp(Av[1], -3.4, 3.4)) - 6} fontSize={11} fill="var(--residual-ink)">
                  Av
                </text>
                <line x1={230} y1={230} x2={MX(P.vec[0])} y2={MY(P.vec[1])} stroke="var(--data)" strokeWidth={3} />
                <DragHandle
                  x={MX(P.vec[0])}
                  y={MY(P.vec[1])}
                  r={8}
                  fill="var(--data)"
                  orientation="horizontal"
                  cursor="move"
                  label={`${t.vector} (${t.vx})`}
                  value={P.vec[0]}
                  min={-3}
                  max={3}
                  step={0.1}
                  valueText={`v = (${fmt(P.vec[0], 2)}, ${fmt(P.vec[1], 2)})`}
                  disabled={locked("vec")}
                  onStart={(e) => vecDrag.start("v", e)}
                  onValue={(v) => set("vec", [r2(v), P.vec[1]])}
                />
              </AccessibleVisualization>
            </section>
            <section className="space-y-3">
              <fieldset>
                <legend className="text-sm font-medium text-ink">{t.matrixGrid}</legend>
                <div className="mt-2 grid w-48 grid-cols-2 gap-2" data-testid="matrix-grid">
                  {P.matrix.map((v, i) => (
                    <input
                      key={i}
                      type="number"
                      step={0.1}
                      min={-3}
                      max={3}
                      className="w-full rounded border border-line bg-surface px-2 py-1 text-right font-mono text-sm text-ink"
                      value={v}
                      disabled={locked("matrix")}
                      aria-label={`A[${Math.floor(i / 2) + 1},${(i % 2) + 1}]`}
                      onChange={(e) => {
                        const x = Number(e.target.value);
                        if (Number.isFinite(x)) setCell(i, x);
                      }}
                    />
                  ))}
                </div>
              </fieldset>
              <div>
                <p className="text-sm font-medium text-ink">{t.presets}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((k) => (
                    <LabButton key={k} onClick={() => set("matrix", PRESETS[k])} disabled={locked("matrix")} pressed={PRESETS[k].every((v, i) => v === P.matrix[i])}>
                      {t.presetNames[k]}
                    </LabButton>
                  ))}
                </div>
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-ink">{t.vector}</legend>
                <div className="mt-1 flex gap-2">
                  {[0, 1].map((i) => (
                    <label key={i} className="flex items-center gap-1 text-xs text-muted">
                      {i ? t.vy : t.vx}
                      <input
                        type="number"
                        step={0.1}
                        min={-3}
                        max={3}
                        className="w-20 rounded border border-line bg-surface px-2 py-1 text-right font-mono text-sm text-ink"
                        value={P.vec[i]}
                        onChange={(e) => {
                          const x = Number(e.target.value);
                          if (Number.isFinite(x)) set("vec", P.vec.map((y, j) => (j === i ? r2(clamp(x, -3, 3)) : y)));
                        }}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="font-mono text-sm text-ink" data-testid="eigen-readout">
                {mi.eig.length ? mi.eig.map((e) => `λ = ${fmt(e.value, 3)}, v = (${fmt(e.vector[0], 3)}, ${fmt(e.vector[1], 3)})`).join(" · ") : t.complex}
              </p>
            </section>
          </div>
        )}

        {P.view === "kmeans" && km && cur && (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.blobs}</h2>
              <AccessibleVisualization
                viewBox="0 0 460 400"
                summary={`${t.blobs}: k = ${P.k}, ${t.stepLabel} ${si + 1}/${steps.length}, SSW = ${fmt(cur.ssw, 2)}; ${cur.centroids.map((c, j) => `${j + 1}: (${fmt(c[0], 2)}, ${fmt(c[1], 2)}), n = ${cur.assign.filter((a) => a === j).length}`).join("; ")}.`}
                table={{ caption: t.blobs, columns: ["x", "y", "cluster"], rows: blobs.map((p, i) => [fmt(p[0], 3), fmt(p[1], 3), String(cur.assign[i] + 1)]) }}
              >
                {blobs.map((p, i) => (
                  <circle key={i} cx={KX(p[0])} cy={KY(p[1])} r={4} fill={CLUSTER[cur.assign[i]]} fillOpacity={0.85} />
                ))}
                {cur.centroids.map((c, j) => (
                  <g key={j} transform={`translate(${KX(c[0])} ${KY(c[1])})`}>
                    <path d="M-8,-8L8,8M-8,8L8,-8" stroke="var(--ink)" strokeWidth={5} />
                    <path d="M-8,-8L8,8M-8,8L8,-8" stroke={CLUSTER[j]} strokeWidth={2.5} />
                  </g>
                ))}
              </AccessibleVisualization>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <LabButton onClick={() => set("step", Math.max(0, si - 1))} disabled={si === 0}>
                  {t.prev}
                </LabButton>
                <LabButton variant="primary" onClick={() => set("step", Math.min(steps.length - 1, si + 1))} disabled={si >= steps.length - 1}>
                  {t.next}
                </LabButton>
                <LabButton onClick={() => set("step", 99)} disabled={si >= steps.length - 1}>
                  {t.final}
                </LabButton>
                <span className="font-mono text-sm text-ink" role="status" data-testid="kmeans-step">
                  {t.stepLabel} {si + 1}/{steps.length} · SSW {fmt(cur.ssw, 2)}
                </span>
              </div>
              {km.emptyCluster && <p className="mt-1 text-sm text-attention-ink">{t.empty}</p>}
            </section>
            <section className="space-y-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.sswTrace}</h2>
                <AccessibleVisualization
                  viewBox="0 0 340 170"
                  summary={`${t.sswTrace}: ${steps.map((s) => fmt(s.ssw, 1)).join(", ")}.`}
                  table={{ caption: t.sswTrace, columns: [t.stepLabel, "SSW"], rows: steps.map((s, i) => [String(i + 1), fmt(s.ssw, 3)]) }}
                >
                  <line x1={40} x2={320} y1={150} y2={150} stroke="var(--border-strong)" />
                  <path d={steps.map((s, i) => `${i ? "L" : "M"}${TX(i)},${TY(s.ssw)}`).join(" ")} fill="none" stroke="var(--residual)" strokeWidth={2} />
                  {steps.map((s, i) => (
                    <circle key={i} cx={TX(i)} cy={TY(s.ssw)} r={i === si ? 6 : 3} fill="var(--residual)" stroke={i === si ? "var(--ink)" : "none"} />
                  ))}
                </AccessibleVisualization>
              </div>
              <div className="overflow-x-auto" role="region" aria-label={`${t.ssw} (k = 1…6)`} tabIndex={0}>
                <table className="w-full text-sm" data-testid="ssw-by-k">
                  <caption className="text-left text-xs text-muted">SSW (k = 1…6) · SST = {fmt(sst, 1)}</caption>
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th className="py-1 font-medium">k</th>
                      <th className="py-1 text-right font-medium">SSW</th>
                      <th className="py-1 text-right font-medium">SSB/SST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sswByK.map((row) => (
                      <tr key={row.k} className={row.k === P.k ? "border-b border-line bg-surface-2" : "border-b border-line"}>
                        <td className="py-1 font-mono">{row.k}</td>
                        <td className="py-1 text-right font-mono">{fmt(row.ssw, 2)}</td>
                        <td className="py-1 text-right font-mono">{fmt(1 - row.ssw / sst, 3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </LabShell>
  );
}

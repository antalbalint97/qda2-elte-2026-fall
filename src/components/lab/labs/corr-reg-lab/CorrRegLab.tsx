"use client";

// Correlation & Regression Lab. Port of "QDA2 CorrReg Lab.dc.html". A scatter with draggable points,
// covariance rectangles and residual squares; a second binary predictor (parallel lines); a binary outcome
// with the fitted logistic curve. Pearson, Spearman, OLS and IRLS logit come from the engine and are
// validated against SciPy / statsmodels in tests/unit/engine.test.ts.
import { pearson, spearman } from "@/lib/engine/inference";
import { fit as simpleFit, logit, ols } from "@/lib/engine/regression";
import { covariance, median } from "@/lib/engine/descriptives";
import { fmt, fmtP } from "@/lib/engine/format";
import { useRef } from "react";
import { ChoiceControl, LabButton, SeedControl, ToggleControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, PresetBar, useSvgDrag } from "../../primitives/visual";
import { curvePath } from "../../primitives/paths";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { clampPt, generatePoints, type CrPreset, type Pt } from "./data";
import { CR_T } from "./strings";

type View = "simple" | "multi" | "logit";
export interface CrParams extends Record<string, unknown> {
  predictors: number;
  outcome: "continuous" | "binary";
  preset: CrPreset | "custom";
  points: Pt[];
  showRectangles: boolean;
  showSquares: boolean;
  seed: number;
}
const PRESETS: CrPreset[] = ["linear", "weak", "outlier", "curve", "groups"];
const DEFAULTS: CrParams = { predictors: 1, outcome: "continuous", preset: "linear", points: [], showRectangles: false, showSquares: true, seed: 2026 };

/** A named preset regenerates the points from the seed; "custom" keeps 3…40 validated points. */
export function normalizeCr(p: CrParams): CrParams {
  const seed = Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed;
  const preset = p.preset === "custom" || PRESETS.includes(p.preset) ? p.preset : DEFAULTS.preset;
  const custom =
    preset === "custom" && Array.isArray(p.points)
      ? p.points
          .filter((q) => Array.isArray(q) && q.length >= 2 && Number.isFinite(q[0]) && Number.isFinite(q[1]))
          .slice(0, 40)
          .map((q) => clampPt(q[0], q[1], q[2] ?? 0))
      : [];
  return {
    ...p,
    seed,
    predictors: p.predictors === 2 ? 2 : 1,
    outcome: p.outcome === "binary" ? "binary" : "continuous",
    preset: preset === "custom" && custom.length < 3 ? "linear" : preset,
    points: custom.length >= 3 ? custom : generatePoints(seed, preset === "custom" ? "linear" : preset),
    showRectangles: p.showRectangles === true,
    showSquares: p.showSquares !== false,
  };
}

const PX = (x: number) => 60 + x * (680 / 14);
const PY = (y: number) => 420 - y * 4;

export default function CorrRegLab(props: LabProps) {
  const lab = useLab<CrParams>("corr-reg-lab", DEFAULTS, { ...props, normalize: normalizeCr });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = CR_T[lang];
  const view: View = P.outcome === "binary" ? "logit" : P.predictors === 2 ? "multi" : "simple";
  const pts = P.points;
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const gs = pts.map((q) => q[2]);
  const f = simpleFit(xs, ys);
  const pr = pearson(xs, ys);
  const sp = spearman(xs, ys);
  const cov = covariance(xs, ys);
  const simple = ols(
    xs.map((x) => [x]),
    ys,
  );
  const med = median(ys) ?? 0;
  const bin = ys.map((y) => (y > med ? 1 : 0));
  const lg = view === "logit" ? logit(xs.map((x) => [x]), bin) : null;
  const multi =
    view === "multi"
      ? ols(
          xs.map((x, i) => [x, gs[i]]),
          ys,
          undefined,
          { vif: true },
        )
      : null;
  const mx = f.mx ?? 0;
  const my = f.my ?? 0;
  const pointsLocked = locked("points");
  const setPoints = (next: Pt[]) => setMany({ points: next, preset: "custom" });
  const movePt = (i: number, x: number, y: number) => setPoints(pts.map((q, j) => (j === i ? clampPt(x, y, q[2]) : q)));

  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag<number>(svgRef, (i, p) => movePt(i, (p.x - 60) / (680 / 14), (420 - p.y) / 4));
  const resid = view === "multi" && multi?.coef ? multi.resid : (f.residuals ?? []);
  const fitted = view === "multi" && multi?.coef ? multi.fitted : (f.fitted ?? []);

  let readouts: Readout[];
  let method: string;
  if (view === "logit") {
    readouts =
      lg?.coef && lg.se && lg.z && lg.p && lg.or
        ? [
            { label: "b₀", value: lg.coef[0], digits: 3 },
            { label: lang === "hu" ? "b₁ (x egységére)" : "b₁ (per unit x)", value: lg.coef[1], digits: 3, tone: "explained" },
            { label: "SE(b₁)", value: lg.se[1], digits: 3 },
            { label: "z · p", value: `${fmt(lg.z[1], 2)} · ${fmtP(lg.p[1])}` },
            { label: "OR = e^b₁", value: lg.or[1], digits: 3, tone: "explained" },
            { label: "log-likelihood", value: lg.loglik ?? "—", digits: 2 },
            { label: "McFadden R²", value: lg.mcFaddenR2 ?? "—", digits: 3 },
            { label: "n₁ / n₀", value: `${bin.filter(Boolean).length} / ${bin.filter((b) => !b).length}` },
          ]
        : [];
    method = lg?.method ?? "";
  } else if (view === "multi") {
    readouts = multi?.coef
      ? [
          { label: "R² · adj R²", value: `${fmt(multi.r2, 3)} · ${fmt(multi.adjR2, 3)}`, tone: "explained" },
          { label: lang === "hu" ? "kétváltozós R² · adj R²" : "bivariate R² · adj R²", value: simple.coef ? `${fmt(simple.r2, 3)} · ${fmt(simple.adjR2, 3)}` : "—" },
          { label: "F · p", value: `${fmt(multi.F, 2)} · ${fmtP(multi.Fp)}` },
          { label: "σ̂", value: multi.sigma, digits: 2 },
          { label: "VIF(x)", value: multi.vif?.[0] ?? "—", digits: 2 },
        ]
      : [];
    method = multi?.coef ? multi.method : "";
  } else {
    readouts = [
      { label: "r (Pearson)", value: pr.r ?? "—", digits: 3, tone: "data" },
      { label: "t · p", value: pr.t === null ? "—" : `${fmt(pr.t, 2)} · ${fmtP(pr.p)}` },
      { label: "95 % CI (Fisher z)", value: pr.ci ? `[${fmt(pr.ci[0], 2)}, ${fmt(pr.ci[1], 2)}]` : "—" },
      { label: "ρ (Spearman)", value: sp.r ?? "—", digits: 3, tone: "explained" },
      { label: "cov(x, y)", value: cov ?? "—", digits: 2 },
      { label: "b · SE(b)", value: simple.coef ? `${fmt(simple.coef[1], 3)} · ${fmt(simple.se[1], 3)}` : "—", tone: "model" },
      { label: "a", value: f.intercept ?? "—", digits: 2, tone: "model" },
      { label: "R²", value: f.r2 ?? "—", digits: 3, tone: "model" },
      { label: "SSE · SST", value: f.sse === null || f.sst === null ? "—" : `${fmt(f.sse, 0)} · ${fmt(f.sst, 0)}`, tone: "residual" },
    ];
    method = `${pr.method}; ${sp.method}`;
  }
  const live = t.live.replace("{r}", fmt(pr.r, 3)).replace("{b}", fmt(f.slope, 2)).replace("{r2}", fmt(f.r2, 3));
  const ptFill = (i: number) => (view === "multi" ? (gs[i] ? "var(--explained)" : "var(--data)") : view === "logit" ? (bin[i] ? "var(--model)" : "var(--faint)") : "var(--data)");
  const lgCoef = lg?.coef;
  const logitPath = lgCoef ? curvePath((x) => 1 / (1 + Math.exp(-(lgCoef[0] + lgCoef[1] * x))), 0, 14, PX, (v) => PY(v * 100), 120) : "";

  const pickPreset = (k: CrPreset) => setMany({ preset: k, points: generatePoints(P.seed, k), ...(k === "groups" && !locked("predictors") ? { predictors: 2, outcome: "continuous" as const } : {}) });
  const demos: TeachDemo[] = [
    { title: t.presets.outlier, note: t.insight.simple, apply: () => setMany({ preset: "outlier", predictors: 1, outcome: "continuous", showRectangles: true }) },
    { title: t.presets.curve, note: lang === "hu" ? "Erős, de nem lineáris kapcsolat: r közel 0." : "A strong but non-linear relation: r is near 0.", apply: () => setMany({ preset: "curve", predictors: 1, outcome: "continuous" }) },
    { title: t.presets.groups, note: t.insight.multi, apply: () => setMany({ preset: "groups", predictors: 2, outcome: "continuous" }) },
    { title: t.logit, note: t.insight.logit, apply: () => setMany({ outcome: "binary", preset: "weak" }) },
  ];

  const aside = (
    <>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
        {view === "logit" && !lg?.coef && <LabNote tone="warn">{t.notConverged.replace("{why}", lg?.reason ?? (lg?.separation ? "separation" : "—"))}</LabNote>}
        {view === "multi" && multi && !multi.coef && <LabNote tone="warn">{t.singular.replace("{why}", multi.reason)}</LabNote>}
      </Panel>
      <Panel title={t.scatter}>
        <div className="space-y-3">
          {view === "simple" && (
            <>
              <ToggleControl label={t.rects} checked={P.showRectangles} onChange={(v) => set("showRectangles", v)} param="showRectangles" />
              <ToggleControl label={t.squares} checked={P.showSquares} onChange={(v) => set("showSquares", v)} param="showSquares" />
            </>
          )}
          {!pointsLocked && (
            <>
              <PresetBar<CrPreset> label={t.presetsLabel} presets={PRESETS.map((k) => ({ id: k, label: t.presets[k] }))} active={P.preset === "custom" ? undefined : P.preset} onPick={pickPreset} />
              <div className="flex flex-wrap gap-2">
                <LabButton disabled={pts.length >= 40} onClick={() => setPoints([...pts, [7, 50, pts.length % 2]])}>
                  {t.addPoint}
                </LabButton>
                <LabButton disabled={pts.length <= 3} onClick={() => setPoints(pts.slice(0, -1))}>
                  {t.removePoint}
                </LabButton>
              </div>
              <SeedControl value={P.seed} onChange={(v) => setMany({ seed: v, preset: P.preset === "custom" ? "linear" : P.preset })} />
            </>
          )}
        </div>
      </Panel>
    </>
  );

  return (
    <LabShell
      lab={lab}
      title={t.title}
      aside={aside}
      demos={demos}
      method={method}
      validation={lang === "hu" ? "Pearson, Spearman, OLS és logit a SciPy/statsmodels referenciával egyezik (tests/unit/engine.test.ts)" : "Pearson, Spearman, OLS and logit match the SciPy/statsmodels reference (tests/unit/engine.test.ts)"}
      toolbar={
        <ChoiceControl<View>
          label={t.view}
          hideLabel
          size="md"
          value={view}
          onChange={(v) => setMany({ predictors: v === "multi" ? 2 : 1, outcome: v === "logit" ? "binary" : "continuous" })}
          options={(["simple", "multi", "logit"] as const).map((v) => ({ value: v, label: t[v], disabled: (locked("predictors") && v === "multi") || (locked("outcome") && v === "logit") }))}
        />
      }
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula[view].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight[view]}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[view]}</p>
        <AccessibleVisualization
          interactive
          svgRef={svgRef}
          onPointerMove={drag.move}
          onPointerUp={drag.end}
          viewBox="0 0 780 450"
          summary={`${t.scatter}: n = ${pts.length}; ${live}`}
          table={{
            caption: t.pointTable,
            columns: ["#", "x", "y", ...(view === "multi" ? [t.group] : []), ...(view === "logit" ? ["y > median"] : ["e"])],
            rows: pts.map((q, i) => [i + 1, q[0], q[1], ...(view === "multi" ? [q[2]] : []), ...(view === "logit" ? [bin[i]] : [resid[i] === undefined ? "—" : fmt(resid[i], 1)])]),
          }}
        >
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={60} x2={740} y1={PY(v)} y2={PY(v)} stroke="var(--grid)" />
              <text x={54} y={PY(v) + 3} textAnchor="end" fontSize={10} fill="var(--muted)" className="font-mono">
                {v}
              </text>
              {view === "logit" && (
                <text x={746} y={PY(v) + 3} fontSize={10} fill="var(--model-ink)" className="font-mono">
                  {fmt(v / 100, 2)}
                </text>
              )}
            </g>
          ))}
          {[0, 2, 4, 6, 8, 10, 12, 14].map((v) => (
            <text key={v} x={PX(v)} y={438} textAnchor="middle" fontSize={10} fill="var(--muted)" className="font-mono">
              {v}
            </text>
          ))}
          {view === "simple" &&
            P.showRectangles &&
            pts.map((q, i) => {
              const pos = (q[0] - mx) * (q[1] - my) >= 0;
              return (
                <rect
                  key={`r${i}`}
                  x={Math.min(PX(q[0]), PX(mx))}
                  y={Math.min(PY(q[1]), PY(my))}
                  width={Math.abs(PX(q[0]) - PX(mx))}
                  height={Math.abs(PY(q[1]) - PY(my))}
                  fill={pos ? "var(--data)" : "var(--residual)"}
                  fillOpacity={0.12}
                  stroke={pos ? "var(--data)" : "var(--residual)"}
                  strokeOpacity={0.4}
                />
              );
            })}
          {view === "simple" &&
            P.showSquares &&
            f.residuals &&
            pts.map((q, i) => {
              const e = (f.residuals as number[])[i];
              const s = Math.abs(e) * 4;
              return <rect key={`s${i}`} x={PX(q[0]) > 400 ? PX(q[0]) - s : PX(q[0])} y={Math.min(PY(q[1]), PY((f.fitted as number[])[i]))} width={s} height={s} fill="var(--attention)" fillOpacity={0.18} stroke="var(--attention)" strokeOpacity={0.5} />;
            })}
          <line x1={PX(mx)} x2={PX(mx)} y1={20} y2={420} stroke="var(--border-strong)" strokeDasharray="4 4" />
          <line x1={60} x2={740} y1={PY(my)} y2={PY(my)} stroke="var(--border-strong)" strokeDasharray="4 4" />
          <text x={PX(mx) + 4} y={30} fontSize={10} fill="var(--muted)" className="font-mono">
            x̄ = {fmt(mx, 2)}
          </text>
          <text x={736} y={PY(my) - 4} textAnchor="end" fontSize={10} fill="var(--muted)" className="font-mono">
            ȳ = {fmt(my, 2)}
          </text>
          {view !== "logit" &&
            fitted.length === pts.length &&
            pts.map((q, i) => <line key={`e${i}`} x1={PX(q[0])} x2={PX(q[0])} y1={PY(q[1])} y2={PY(fitted[i])} stroke="var(--residual)" strokeOpacity={0.6} />)}
          {view === "simple" && f.slope !== null && f.intercept !== null && (
            <>
              <line x1={PX(0)} y1={PY(f.intercept)} x2={PX(14)} y2={PY(f.intercept + 14 * f.slope)} stroke="var(--model)" strokeWidth={2.5} />
              <text x={PX(14) - 4} y={Math.min(410, Math.max(16, PY(f.intercept + 14 * f.slope) - 10))} textAnchor="end" fontSize={11} fill="var(--model-ink)" className="font-mono">
                ŷ = {fmt(f.intercept, 2)} + {fmt(f.slope, 2)}x
              </text>
            </>
          )}
          {view === "multi" &&
            multi?.coef &&
            [0, 1].map((g) => {
              const [b0, b1, b2] = multi.coef;
              return <line key={g} x1={PX(0)} y1={PY(b0 + g * b2)} x2={PX(14)} y2={PY(b0 + g * b2 + 14 * b1)} stroke={g ? "var(--explained)" : "var(--data)"} strokeWidth={2.5} />;
            })}
          {view === "logit" && (
            <>
              <line x1={60} x2={740} y1={PY(med)} y2={PY(med)} stroke="var(--model)" strokeOpacity={0.4} />
              {logitPath && <path d={logitPath} fill="none" stroke="var(--model)" strokeWidth={2.5} />}
              <text x={736} y={14} textAnchor="end" fontSize={10} fill="var(--model-ink)" className="font-mono">
                {t.probAxis}
              </text>
            </>
          )}
          {pts.map((q, i) => (
            <g
              key={`p${i}`}
              className="lab-handle"
              style={{ transform: `translate(${PX(q[0])}px, ${PY(q[1])}px)`, cursor: pointsLocked ? "default" : "move" }}
              role="button"
              tabIndex={pointsLocked ? -1 : 0}
              aria-roledescription={lang === "hu" ? "mozgatható pont" : "movable point"}
              aria-label={`${t.point} ${i + 1}: x ${q[0]}, y ${q[1]}. ${t.moveHint}`}
              aria-disabled={pointsLocked || undefined}
              onPointerDown={pointsLocked ? undefined : (e) => drag.start(i, e)}
              onKeyDown={(e) => {
                if (pointsLocked) return;
                const k = e.shiftKey ? 5 : 1;
                const d: Record<string, [number, number]> = { ArrowUp: [0, k], ArrowDown: [0, -k], ArrowLeft: [-0.5 * k, 0], ArrowRight: [0.5 * k, 0] };
                if (!d[e.key]) return;
                e.preventDefault();
                movePt(i, q[0] + d[e.key][0], q[1] + d[e.key][1]);
              }}
            >
              <circle r={7} fill={ptFill(i)} stroke="var(--surface)" strokeWidth={1.5} />
              <circle r={14} fill="transparent" />
            </g>
          ))}
        </AccessibleVisualization>
        {view === "multi" && multi?.coef && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.coefTable}</h2>
            <div className="mt-1 overflow-x-auto" role="region" aria-label={t.coefTable} tabIndex={0}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    {["", "b", "SE", "t", "p", "95 % CI"].map((h) => (
                      <th key={h} className="px-2 py-1 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {["(const)", "x", t.group].map((nm, j) => (
                    <tr key={nm} className="border-t border-line">
                      <td className="px-2 py-1 font-sans">{nm}</td>
                      <td className="px-2 py-1">{fmt(multi.coef[j], 3)}</td>
                      <td className="px-2 py-1">{fmt(multi.se[j], 3)}</td>
                      <td className="px-2 py-1">{fmt(multi.t[j], 2)}</td>
                      <td className="px-2 py-1">{fmtP(multi.p[j])}</td>
                      <td className="px-2 py-1">
                        [{fmt(multi.ci[j][0], 2)}, {fmt(multi.ci[j][1], 2)}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-sm text-ink">{t.groupNote.replace("{b}", fmt(multi.coef[2], 2))}</p>
          </section>
        )}
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-medium">{t.pointTable}</summary>
          <div className="mt-2 grid max-h-72 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2" role="region" aria-label={t.pointTable} tabIndex={0}>
            {pts.map((q, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-6 text-right font-mono text-muted">{i + 1}</span>
                <label className="flex items-center gap-1">
                  x
                  <input type="number" min={0} max={14} step={0.5} value={q[0]} disabled={pointsLocked} aria-label={`${t.point} ${i + 1} x`} className="w-16 rounded border border-line bg-surface px-1 py-0.5 text-right font-mono" onChange={(e) => Number.isFinite(e.target.valueAsNumber) && movePt(i, e.target.valueAsNumber, q[1])} />
                </label>
                <label className="flex items-center gap-1">
                  y
                  <input type="number" min={0} max={100} step={1} value={q[1]} disabled={pointsLocked} aria-label={`${t.point} ${i + 1} y`} className="w-16 rounded border border-line bg-surface px-1 py-0.5 text-right font-mono" onChange={(e) => Number.isFinite(e.target.valueAsNumber) && movePt(i, q[0], e.target.valueAsNumber)} />
                </label>
                <span className="font-mono text-xs text-muted">{view === "logit" ? `y* = ${bin[i]}` : resid[i] === undefined ? "" : `e = ${fmt(resid[i], 1)}`}</span>
              </div>
            ))}
          </div>
        </details>
        <p className="text-xs leading-relaxed text-muted">{t.note}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </LabShell>
  );
}

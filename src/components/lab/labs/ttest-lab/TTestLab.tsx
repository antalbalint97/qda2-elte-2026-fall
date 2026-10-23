"use client";

// Mean Comparison & t-Test Lab. Port of "QDA2 tTest Lab.dc.html". Every number comes from
// src/lib/engine/inference.ts (one-sample, paired, independent Student and Welch rows; Hedges' g; Levene),
// which is validated against SciPy in tests/unit/engine.test.ts.
import { describe } from "@/lib/engine/descriptives";
import { tCritical, tPdf } from "@/lib/engine/distributions";
import { fmt, fmtP } from "@/lib/engine/format";
import { independentT, oneSampleT, pairedT } from "@/lib/engine/inference";
import { gaussian, mulberry32 } from "@/lib/engine/rng";
import { useEffect, useRef, useState } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, svgPoint, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { TT_T } from "./strings";

type Design = "one" | "paired" | "independent";
type Scenario = "base" | "nodiff" | "unequal";

export interface TTestParams extends Record<string, unknown> {
  design: Design;
  n1: number;
  n2: number;
  mu0: number;
  showWelch: boolean;
  seed: number;
}

const DEFAULTS: TTestParams = { design: "independent", n1: 12, n2: 12, mu0: 50, showWelch: true, seed: 20261023 };
const normalize = (p: TTestParams): TTestParams => ({
  ...p,
  n1: Math.max(2, Math.min(40, Math.round(p.n1))),
  n2: Math.max(2, Math.min(40, Math.round(p.n2))),
  mu0: Math.max(0, Math.min(100, p.mu0)),
  seed: Number.isInteger(p.seed) && p.seed >= 1 && p.seed < 2147483647 ? p.seed : DEFAULTS.seed,
});

/** Seeded synthetic scores (0–100): base (means 48 vs 58), no difference, or unequal spread. */
export function generateGroups(seed: number, n1: number, n2: number, sc: Scenario): { a: number[]; b: number[] } {
  const z = gaussian(mulberry32(seed));
  const mk = (n: number, mu: number, sd: number) => Array.from({ length: n }, () => Math.round(Math.max(2, Math.min(98, mu + sd * z()))));
  if (sc === "nodiff") return { a: mk(n1, 55, 12), b: mk(n2, 55, 12) };
  if (sc === "unequal") return { a: mk(n1, 52, 6), b: mk(n2, 60, 18) };
  return { a: mk(n1, 48, 11), b: mk(n2, 58, 11) };
}

const Y = (v: number) => 400 - 3.8 * v;
const V = (y: number) => Math.max(0, Math.min(100, (400 - y) / 3.8));
const clamp100 = (v: number) => Math.max(0, Math.min(100, v));

type Drag = { kind: "pt"; k: "a" | "b"; i: number } | { kind: "mean"; k: "a" | "b"; y0: number; arr0: number[] } | { kind: "spread"; k: "a" | "b"; m0: number; sd0: number; arr0: number[] } | { kind: "mu0" };

export default function TTestLab(props: LabProps) {
  const lab = useLab<TTestParams>("ttest-lab", DEFAULTS, { ...props, normalize });
  const { params: P, set, setMany, lang } = lab;
  const t = TT_T[lang];
  const [data, setData] = useState(() => generateGroups(DEFAULTS.seed, DEFAULTS.n1, DEFAULTS.n2, "base"));
  const genKey = useRef(`${DEFAULTS.seed}:${DEFAULTS.n1}:${DEFAULTS.n2}:0`);
  const svgRef = useRef<SVGSVGElement>(null);

  // Regenerate when seed or sizes come from a link/preset (not when +/− edits one observation).
  useEffect(() => {
    const key = `${P.seed}:${P.n1}:${P.n2}:${lab.resetCount}`;
    if (key === genKey.current) return;
    genKey.current = key;
    setData(generateGroups(P.seed, P.n1, P.n2, "base"));
  }, [P.seed, P.n1, P.n2, lab.resetCount]);

  const setGroup = (k: "a" | "b", arr: number[]) => setData((d) => ({ ...d, [k]: arr }));
  const D = P.design;
  const two = D !== "one";
  const proc = P.showWelch ? "welch" : "student";
  const dA = describe(data.a);
  const dB = describe(data.b);

  let tv: number | null = null;
  let df: number | null = null;
  let p: number | null = null;
  let diff: number | null = null;
  let se: number | null = null;
  let ci: [number, number] | null = null;
  let g: number | null = null;
  let reason: string | undefined;
  let ind: ReturnType<typeof independentT> | null = null;
  if (D === "independent") {
    ind = independentT(data.a, data.b);
    const r = proc === "welch" ? ind.welch : ind.equal;
    diff = ind.diff;
    if (r) ({ t: tv, df, p, se, ci } = r);
    g = ind.g;
    reason = ind.reason;
  } else if (D === "paired") {
    const n = Math.min(data.a.length, data.b.length);
    const res = pairedT(data.a.slice(0, n), data.b.slice(0, n));
    ({ diff, t: tv, df, p, se, ci, reason } = res);
    const dd = describe(data.a.slice(0, n).map((x, i) => x - data.b[i]));
    g = dd.sd && dd.mean !== null ? dd.mean / dd.sd : null;
  } else {
    const res = oneSampleT(data.a, P.mu0);
    ({ diff, t: tv, df, p, se, ci, reason } = res);
    g = dA.sd && diff !== null ? diff / dA.sd : null;
  }

  const drag = useSvgDrag<Drag>(svgRef, (d, pt) => {
    const v = V(pt.y);
    if (d.kind === "pt") {
      const arr = data[d.k].slice();
      arr[d.i] = Math.round(v);
      setGroup(d.k, arr);
    } else if (d.kind === "mean") {
      const shift = v - V(d.y0);
      setGroup(
        d.k,
        d.arr0.map((x) => Math.round(clamp100(x + shift))),
      );
    } else if (d.kind === "spread") {
      const target = Math.max(0.5, v - d.m0);
      const fct = d.sd0 > 0 ? target / d.sd0 : 1;
      setGroup(
        d.k,
        d.arr0.map((x) => Math.round(clamp100(d.m0 + (x - d.m0) * fct))),
      );
    } else if (!lab.locked("mu0")) set("mu0", Math.round(v));
  });

  // ── geometry ──
  const cols = two
    ? [
        { x0: 80, x1: 330, cx: 205 },
        { x0: 430, x1: 680, cx: 555 },
      ]
    : [{ x0: 120, x1: 640, cx: 380 }];
  const nPair = Math.min(data.a.length, data.b.length);
  const gdefs = (two ? (["a", "b"] as const) : (["a"] as const)).map((k, j) => ({ k, d: k === "a" ? dA : dB, color: k === "a" ? "var(--data)" : "var(--model)", label: k === "a" ? t.groupA : t.groupB, col: cols[j] }));
  const groups = gdefs.map(({ k, d, color, label, col }) => {
    const arr = data[k];
    const n = arr.length;
    const m = d.mean ?? 50;
    const sd = d.sd ?? 0;
    const seM = sd && n > 1 ? sd / Math.sqrt(n) : 0;
    const tc = n > 1 ? tCritical(n - 1) : 0;
    const spread = Math.min(110, (n - 1) * 9);
    const pts = arr.map((v, i) => ({
      v,
      i,
      x: D === "paired" ? col.cx - 50 + i * (100 / Math.max(1, nPair - 1)) : col.cx - spread / 2 + (n > 1 ? (i * spread) / (n - 1) : 0),
      y: Y(v),
    }));
    return { k, label, color, col, n, m, sd, seM, tc, pts };
  });
  const links = D === "paired" ? data.a.slice(0, nPair).map((v, i) => ({ x1: cols[0].cx - 50 + i * (100 / Math.max(1, nPair - 1)), y1: Y(v), x2: cols[1].cx - 50 + i * (100 / Math.max(1, nPair - 1)), y2: Y(data.b[i]) })) : [];
  const mA = dA.mean ?? 50;
  const mB = D === "one" ? P.mu0 : (dB.mean ?? 50);
  const dx = two ? 380 : 70;
  const dyA = Y(mA);
  const dyB = Y(mB);
  const diffName = D === "one" ? "x̄ − μ₀" : "x̄₁ − x̄₂";
  const tTxt = fmt(tv, 2);
  const pTxt = fmtP(p);
  const dfTxt = df === null ? "—" : Number.isInteger(df) ? String(df) : fmt(df, 1);

  // fraction and null curve
  const scale = 6;
  const numW = Math.min(280, Math.abs(diff ?? 0) * scale);
  const denW = Math.min(280, (se ?? 0) * scale);
  const dfc = df && df > 0 ? df : 1;
  const TX = (x: number) => 210 + x * 38;
  const curve = Array.from({ length: 121 }, (_, i) => {
    const x = -5 + (10 * i) / 120;
    return (i ? "L" : "M") + TX(x).toFixed(1) + "," + (120 - tPdf(x, dfc) * 260).toFixed(1);
  }).join(" ");
  let tailPath = "";
  if (tv !== null && Number.isFinite(tv)) {
    const a = Math.min(5, Math.abs(tv));
    const seg = (from: number, to: number) => {
      let d = "M" + TX(from).toFixed(1) + ",120 ";
      for (let i = 0; i <= 40; i++) {
        const x = from + ((to - from) * i) / 40;
        d += "L" + TX(x).toFixed(1) + "," + (120 - tPdf(x, dfc) * 260).toFixed(1) + " ";
      }
      return d + "L" + TX(to).toFixed(1) + ",120 Z ";
    };
    tailPath = seg(a, 5) + seg(-5, -a);
  }
  const sqScale = 28;
  const vA = dA.sd && data.a.length ? dA.sd ** 2 / data.a.length : 0;
  const vB = dB.sd && data.b.length ? dB.sd ** 2 / data.b.length : 0;
  const sqA = Math.min(50, Math.sqrt(vA) * sqScale);
  const sqB = Math.min(50, Math.sqrt(vB) * sqScale);
  const sqD = Math.min(60, Math.sqrt(vA + vB) * sqScale);

  const readouts: Readout[] = [
    { label: diffName, value: diff, tone: "residual" },
    { label: "SE", value: se, digits: 3, tone: "explained" },
    { label: "t", value: tv },
    { label: "df", value: dfTxt },
    { label: lang === "hu" ? "p (kétoldali)" : "p (2-tailed)", value: pTxt },
    { label: "95 % CI", value: ci ? `[${fmt(ci[0], 2)}, ${fmt(ci[1], 2)}]` : null, tone: "explained" },
    { label: D === "independent" ? "Hedges' g" : D === "paired" ? "d_z" : "d", value: g, tone: "model" },
  ];
  if (two) readouts.push({ label: "s₁ / s₂", value: `${fmt(dA.sd, 2)} / ${fmt(dB.sd, 2)}`, tone: "muted" });
  const formula = {
    independent:
      proc === "welch"
        ? "t = (x̄₁ − x̄₂) / √(s₁²/n₁ + s₂²/n₂) ;  df_W = (s₁²/n₁ + s₂²/n₂)² / [ (s₁²/n₁)²/(n₁−1) + (s₂²/n₂)²/(n₂−1) ]"
        : "t = (x̄₁ − x̄₂) / √(s_p²(1/n₁ + 1/n₂)) ;  s_p² = [(n₁−1)s₁² + (n₂−1)s₂²]/(n₁+n₂−2) ;  df = n₁+n₂−2",
    paired: "d_i = x_i − y_i ;  t = d̄ / (s_d/√n) ;  df = n − 1",
    one: "t = (x̄ − μ₀) / (s/√n) ;  df = n − 1",
  }[D];
  const live = t.live.replace("{t}", tTxt).replace("{df}", dfTxt).replace("{p}", pTxt).replace("{d}", fmt(diff, 2));

  const addObs = (k: "a" | "b", delta: 1 | -1) => {
    const arr = data[k];
    const key = k === "a" ? "n1" : "n2";
    if (lab.locked(key)) return;
    let next = arr;
    if (delta < 0 && arr.length > 2) next = arr.slice(0, -1);
    if (delta > 0 && arr.length < 40) {
      const d = k === "a" ? dA : dB;
      const z = gaussian(mulberry32(P.seed + arr.length * 31 + (k === "a" ? 1 : 2)));
      next = arr.concat([Math.round(clamp100((d.mean ?? 50) + (d.sd ?? 10) * z()))]);
    }
    if (next === arr) return;
    const n1 = k === "a" ? next.length : P.n1;
    const n2 = k === "b" ? next.length : P.n2;
    genKey.current = `${P.seed}:${n1}:${n2}:${lab.resetCount}`;
    setGroup(k, next);
    setMany({ n1, n2 });
  };
  const scenario = (sc: Scenario, dSeed: number) => setData(generateGroups(P.seed + dSeed, data.a.length, data.b.length, sc));

  const vbtn = (k: "a" | "b") => (e: React.PointerEvent) => {
    const pt = svgPoint(svgRef.current, e);
    if (pt) drag.start({ kind: "mean", k, y0: pt.y, arr0: data[k].slice() }, e);
  };
  const cls = drag.dragging ? "lab-fast" : "lab-tr";
  const keyDelta = (e: React.KeyboardEvent) => (e.key === "ArrowUp" ? (e.shiftKey ? 5 : 1) : e.key === "ArrowDown" ? (e.shiftKey ? -5 : -1) : 0);

  const aside = (
    <>
      <Panel title={t.groups}>
        <div className="space-y-2">
          {gdefs.map(({ k, d, color, label }) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden />
              <span className="flex-1 text-ink">
                {label} · n {data[k].length} · x̄ {fmt(d.mean, 1)} · s {fmt(d.sd, 1)}
              </span>
              <LabButton onClick={() => addObs(k, -1)} disabled={lab.locked(k === "a" ? "n1" : "n2") || data[k].length <= 2} title={t.removeObs}>
                −<span className="sr-only">{`${t.removeObs} (${label})`}</span>
              </LabButton>
              <LabButton onClick={() => addObs(k, 1)} disabled={lab.locked(k === "a" ? "n1" : "n2") || data[k].length >= 40} title={t.addObs}>
                +<span className="sr-only">{`${t.addObs} (${label})`}</span>
              </LabButton>
            </div>
          ))}
          {D === "one" && <ParameterControl label={t.mu0} value={P.mu0} min={0} max={100} step={1} onChange={(v) => set("mu0", v)} param="mu0" />}
          <div className="flex flex-wrap gap-2 pt-1">
            <LabButton onClick={() => scenario("nodiff", 1)}>{t.scNoDiff}</LabButton>
            <LabButton onClick={() => scenario("unequal", 2)}>{t.scUnequal}</LabButton>
          </div>
          <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
        </div>
      </Panel>
      {D === "independent" && ind && (
        <Panel title={t.procedure}>
          <ChoiceControl<"student" | "welch">
            label={t.procedure}
            hideLabel
            param="showWelch"
            value={proc}
            onChange={(v) => set("showWelch", v === "welch")}
            options={[
              { value: "student", label: "Student" },
              { value: "welch", label: "Welch" },
            ]}
          />
          {ind.equal && ind.welch && (
            <table className="mt-2 w-full text-xs tabular-nums">
              <caption className="sr-only">Student vs Welch</caption>
              <thead>
                <tr className="text-muted">
                  <th scope="col" />
                  <th scope="col" className="text-right font-medium">
                    Student
                  </th>
                  <th scope="col" className="text-right font-medium">
                    Welch
                  </th>
                </tr>
              </thead>
              <tbody className="font-mono text-ink">
                {[
                  ["SE", fmt(ind.equal.se, 3), fmt(ind.welch.se, 3)],
                  ["t", fmt(ind.equal.t, 3), fmt(ind.welch.t, 3)],
                  ["df", String(ind.equal.df), fmt(ind.welch.df, 1)],
                  ["p", fmtP(ind.equal.p), fmtP(ind.welch.p)],
                  ["95% CI", ind.equal.ci ? `[${fmt(ind.equal.ci[0], 1)}, ${fmt(ind.equal.ci[1], 1)}]` : "—", ind.welch.ci ? `[${fmt(ind.welch.ci[0], 1)}, ${fmt(ind.welch.ci[1], 1)}]` : "—"],
                ].map(([k, a, b]) => (
                  <tr key={k} className="border-t border-line">
                    <th scope="row" className="py-0.5 text-left font-sans font-normal text-muted">
                      {k}
                    </th>
                    <td className="text-right">{a}</td>
                    <td className="text-right">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {ind.levene.F !== null && <p className="mt-2 text-xs leading-relaxed text-muted">{t.levene.replace("{F}", fmt(ind.levene.F, 2)).replace("{p}", fmtP(ind.levene.p))}</p>}
        </Panel>
      )}
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
        {reason && (
          <div className="mt-2">
            <LabNote>{reason}</LabNote>
          </div>
        )}
      </Panel>
      <Panel title={t.formula}>
        <p className="font-mono text-xs leading-relaxed text-ink">{formula}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">{t.insight[D]}</p>
      </Panel>
    </>
  );

  return (
    <LabShell
      lab={lab}
      title={t.title}
      subtitle={t.lead[D]}
      toolbar={
        <ChoiceControl<Design>
          label={t.design}
          hideLabel
          param="design"
          size="md"
          value={D}
          onChange={(v) => set("design", v)}
          options={[
            { value: "one", label: t.one },
            { value: "paired", label: t.paired },
            { value: "independent", label: t.independent },
          ]}
        />
      }
      aside={aside}
      method={
        lang === "hu"
          ? "Egymintás, páros és független t-próba (Student és Welch sor, mint az SPSS-ben); Hedges-féle g; Levene-próba átlagtól mért eltérésekkel"
          : "One-sample, paired and independent t-tests (Student and Welch rows as in SPSS); Hedges' g; mean-centred Levene test"
      }
      validation={lang === "hu" ? "t, df, p, CI és g a SciPy-referenciával egyezik (tests/unit)" : "t, df, p, CI and g match the SciPy reference (tests/unit)"}
    >
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="font-semibold text-ink">{t.canvas}</span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-data" aria-hidden />
          {t.groupA}
        </span>
        {two && (
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-model" aria-hidden />
            {t.groupB}
          </span>
        )}
        <span>— {t.meanLbl}</span>
        <span className="text-explained-ink">┆ {t.ciLbl}</span>
        <span className="text-faint">{t.dragHint}</span>
      </div>
      <AccessibleVisualization
        interactive
        summary={live}
        viewBox="0 0 760 420"
        svgRef={svgRef}
        onPointerMove={drag.move}
        onPointerUp={drag.end}
        table={{
          caption: t.canvas,
          columns: ["#", t.groupA, ...(two ? [t.groupB] : [])],
          rows: Array.from({ length: Math.max(data.a.length, two ? data.b.length : 0) }, (_, i) => [i + 1, data.a[i] ?? "", ...(two ? [data.b[i] ?? ""] : [])]),
        }}
      >
        <g aria-hidden>
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={40} x2={720} y1={Y(v)} y2={Y(v)} stroke="var(--grid)" />
              <text x={34} y={Y(v) + 3} fontSize={9} fill="var(--faint)" textAnchor="end">
                {v}
              </text>
            </g>
          ))}
        </g>
        {links.map((l, i) => (
          <line key={i} className={cls} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--border-strong)" strokeWidth={1} aria-hidden />
        ))}
        {groups.map((G) => (
          <g key={G.k}>
            <text x={G.col.cx} y={414} fontSize={11} fill="var(--muted)" textAnchor="middle" aria-hidden>
              {G.label} · n = {G.n}
            </text>
            <rect className={cls} style={{ x: G.col.x0 + 6, y: Y(G.m + G.sd), width: 12, height: Math.max(0, Y(G.m - G.sd) - Y(G.m + G.sd)) } as React.CSSProperties} fill={G.color} fillOpacity={0.18} rx={3} aria-hidden />
            <rect
              className={cls}
              style={{ x: G.col.x0 + 24, y: Y(G.m + G.tc * G.seM), width: G.col.x1 - G.col.x0 - 60, height: Math.max(0, Y(G.m - G.tc * G.seM) - Y(G.m + G.tc * G.seM)) } as React.CSSProperties}
              fill="none"
              stroke="var(--explained)"
              strokeDasharray="4 3"
              rx={3}
              aria-hidden
            />
            <g className={cls} style={{ transform: `translate(0px, ${Y(G.m)}px)` }}>
              <line x1={G.col.x0} x2={G.col.x1} y1={0} y2={0} stroke="var(--ink)" strokeWidth={2.5} aria-hidden />
              <g
                className="lab-handle"
                tabIndex={0}
                role="slider"
                aria-label={`${G.label} ${t.meanLbl}`}
                aria-valuenow={Math.round(G.m * 10) / 10}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{ cursor: "ns-resize" }}
                onPointerDown={vbtn(G.k)}
                onKeyDown={(e) => {
                  const dd = keyDelta(e);
                  if (!dd) return;
                  e.preventDefault();
                  setGroup(
                    G.k,
                    data[G.k].map((v) => clamp100(v + dd)),
                  );
                }}
              >
                <rect x={G.col.x1 - 30} y={-9} width={26} height={18} rx={4} fill="var(--ink)" />
                <text x={G.col.x1 - 17} y={4} fontSize={10} fill="var(--bg)" textAnchor="middle" aria-hidden>
                  x̄
                </text>
              </g>
            </g>
            <g
              className={`lab-handle ${cls}`}
              style={{ transform: `translate(${G.col.x0 + 12}px, ${Y(G.m + G.sd)}px)`, cursor: "ns-resize" }}
              tabIndex={0}
              role="slider"
              aria-label={`${G.label} s`}
              aria-valuenow={Math.round(G.sd * 10) / 10}
              aria-valuemin={0}
              aria-valuemax={50}
              onPointerDown={(e) => drag.start({ kind: "spread", k: G.k, m0: G.m, sd0: G.sd, arr0: data[G.k].slice() }, e)}
              onKeyDown={(e) => {
                const fct = e.key === "ArrowUp" ? 1.1 : e.key === "ArrowDown" ? 1 / 1.1 : 0;
                if (!fct) return;
                e.preventDefault();
                setGroup(
                  G.k,
                  data[G.k].map((v) => Math.round(clamp100(G.m + (v - G.m) * fct))),
                );
              }}
            >
              <rect x={-13} y={-9} width={26} height={18} rx={4} fill={G.color} />
              <text x={0} y={4} fontSize={10} fill="#0f1115" textAnchor="middle" aria-hidden>
                s
              </text>
            </g>
            {G.pts.map((pt) => (
              <g
                key={pt.i}
                className={`lab-handle ${cls}`}
                style={{ transform: `translate(${pt.x}px, ${pt.y}px)`, cursor: "ns-resize" }}
                tabIndex={0}
                role="slider"
                aria-label={`${G.label} ${pt.i + 1}`}
                aria-valuenow={pt.v}
                aria-valuemin={0}
                aria-valuemax={100}
                onPointerDown={(e) => drag.start({ kind: "pt", k: G.k, i: pt.i }, e)}
                onKeyDown={(e) => {
                  const dd = keyDelta(e);
                  if (!dd) return;
                  e.preventDefault();
                  const arr = data[G.k].slice();
                  arr[pt.i] = clamp100(arr[pt.i] + dd);
                  setGroup(G.k, arr);
                }}
              >
                <circle r={6} fill={G.color} stroke="var(--surface)" strokeWidth={1.5} />
                <circle r={14} fill="transparent" />
              </g>
            ))}
          </g>
        ))}
        {D === "one" && (
          <g className={cls} style={{ transform: `translate(0px, ${Y(P.mu0)}px)` }}>
            <line x1={40} x2={720} y1={0} y2={0} stroke="var(--residual-ink)" strokeWidth={2} strokeDasharray="6 4" aria-hidden />
            <g
              className="lab-handle"
              tabIndex={0}
              role="slider"
              aria-label={t.mu0}
              aria-valuenow={P.mu0}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ cursor: "ns-resize" }}
              onPointerDown={(e) => drag.start({ kind: "mu0" }, e)}
              onKeyDown={(e) => {
                const dd = keyDelta(e);
                if (!dd) return;
                e.preventDefault();
                set("mu0", clamp100(P.mu0 + dd));
              }}
            >
              <rect x={660} y={-9} width={40} height={18} rx={4} fill="var(--residual-ink)" />
              <text x={680} y={4} fontSize={10} fill="#fff" textAnchor="middle" aria-hidden>
                μ₀
              </text>
            </g>
          </g>
        )}
        <g className={cls} aria-hidden>
          <line x1={dx} x2={dx} y1={dyA} y2={dyB} stroke="var(--residual-ink)" strokeWidth={3} />
          <line x1={two ? cols[0].x1 : cols[0].x0} x2={dx} y1={dyA} y2={dyA} stroke="var(--residual-ink)" strokeDasharray="2 2" />
          <line x1={dx} x2={two ? cols[1].x0 : cols[0].x0} y1={dyB} y2={dyB} stroke="var(--residual-ink)" strokeDasharray="2 2" />
          <rect x={dx - 48} y={(dyA + dyB) / 2 - 9} width={96} height={18} rx={4} fill="var(--surface)" stroke="var(--residual-ink)" />
          <text x={dx} y={(dyA + dyB) / 2 + 4} fontSize={10.5} fill="var(--residual-ink)" textAnchor="middle">
            {diffName} = {fmt(diff, 1)}
          </text>
        </g>
      </AccessibleVisualization>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <section aria-label={t.tFraction} className="rounded-xl border border-line bg-surface-2/50 p-3">
          <h3 className="text-xs font-semibold text-muted">{t.tFraction}</h3>
          <AccessibleVisualization summary={`${diffName} = ${fmt(diff, 2)}, SE = ${fmt(se, 3)}, t = ${tTxt}`} viewBox="0 0 360 150">
            <text x={10} y={30} fontSize={22} fill="var(--ink)">
              t =
            </text>
            <rect className="lab-tr" style={{ x: 60, y: 14, width: numW, height: 20 } as React.CSSProperties} fill="var(--residual-ink)" rx={3} />
            <line x1={60} x2={70 + Math.max(numW, denW)} y1={44} y2={44} stroke="var(--ink)" strokeWidth={2} />
            <rect className="lab-tr" style={{ x: 60, y: 54, width: denW, height: 20 } as React.CSSProperties} fill="var(--explained)" rx={3} />
            <text x={66 + numW} y={28} fontSize={11} fill="var(--ink)">
              {diffName} = {fmt(diff, 2)}
            </text>
            <text x={66 + denW} y={68} fontSize={11} fill="var(--ink)">
              SE = {fmt(se, 3)}
            </text>
            <text x={Math.min(300, 80 + Math.max(numW, denW))} y={50} fontSize={20} fill="var(--ink)">
              = {tTxt}
            </text>
            {D === "independent" ? (
              <g>
                <rect className="lab-tr" style={{ x: 60, y: 138 - sqA, width: sqA, height: sqA } as React.CSSProperties} fill="var(--data)" fillOpacity={0.35} stroke="var(--data)" />
                <text x={60 + sqA / 2} y={148} fontSize={9} fill="var(--data-ink)" textAnchor="middle">
                  s₁²/n₁
                </text>
                <text x={70 + sqA} y={128} fontSize={14} fill="var(--muted)">
                  +
                </text>
                <rect className="lab-tr" style={{ x: 85 + sqA, y: 138 - sqB, width: sqB, height: sqB } as React.CSSProperties} fill="var(--model)" fillOpacity={0.35} stroke="var(--model)" />
                <text x={85 + sqA + sqB / 2} y={148} fontSize={9} fill="var(--model-ink)" textAnchor="middle">
                  s₂²/n₂
                </text>
                <text x={95 + sqA + sqB} y={128} fontSize={14} fill="var(--muted)">
                  =
                </text>
                <rect className="lab-tr" style={{ x: 110 + sqA + sqB, y: 138 - sqD, width: sqD, height: sqD } as React.CSSProperties} fill="var(--explained)" fillOpacity={0.35} stroke="var(--explained)" />
                <text x={110 + sqA + sqB + sqD / 2} y={148} fontSize={9} fill="var(--explained-ink)" textAnchor="middle">
                  SE²(Welch)
                </text>
              </g>
            ) : (
              <text x={60} y={110} fontSize={11} fill="var(--muted)">
                {D === "paired" ? t.seNotePaired : t.seNoteOne}
              </text>
            )}
          </AccessibleVisualization>
        </section>
        <section aria-label={t.nullDist} className="rounded-xl border border-line bg-surface-2/50 p-3">
          <h3 className="text-xs font-semibold text-muted">
            {t.nullDist} · t({dfTxt})
          </h3>
          <AccessibleVisualization summary={`${t.nullDist} t(${dfTxt}); t = ${tTxt}; p ${pTxt}`} viewBox="0 0 420 150">
            <path d={tailPath} fill="var(--residual)" fillOpacity={0.45} />
            <path d={curve} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
            <line x1={20} x2={400} y1={120} y2={120} stroke="var(--border)" />
            {[-4, -2, 0, 2, 4].map((x) => (
              <text key={x} x={TX(x)} y={134} fontSize={9} fill="var(--faint)" textAnchor="middle">
                {x}
              </text>
            ))}
            <g className={cls} style={{ transform: `translate(${TX(Math.max(-5, Math.min(5, tv ?? 0)))}px, 0px)` }}>
              <line x1={0} x2={0} y1={14} y2={120} stroke="var(--residual-ink)" strokeWidth={2} />
              <text x={0} y={10} fontSize={10} fill="var(--residual-ink)" textAnchor="middle">
                t = {tTxt}
              </text>
            </g>
            <text x={400} y={14} fontSize={11} fill="var(--ink)" textAnchor="end">
              p {pTxt}
            </text>
            <text x={400} y={28} fontSize={9.5} fill="var(--muted)" textAnchor="end">
              {t.twoTailed}
            </text>
          </AccessibleVisualization>
        </section>
      </div>
      <p className="mt-2 text-xs text-faint">{t.synthetic}</p>
    </LabShell>
  );
}

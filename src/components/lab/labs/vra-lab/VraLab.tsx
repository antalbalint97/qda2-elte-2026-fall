"use client";

// Variance → Regression → ANOVA (flagship lab). Port of the V3 prototype "QDA2 Lab.dc.html"; geometry and
// formulas follow HANDOFF.md §2–7. The same fifteen observations drive all three stages: editing a point in
// one stage changes it everywhere (Y everywhere, X in stage 2, group in stage 3).
import { describe } from "@/lib/engine/descriptives";
import { fmt, fmtP } from "@/lib/engine/format";
import { mean } from "@/lib/engine/numeric";
import { anova, fit, sseLine } from "@/lib/engine/regression";
import { encodeVraHash, parseVraHash } from "@/lib/lab-config";
import { cn } from "@/lib/cn";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChoiceControl, LabButton, ParameterControl, SelectControl, ToggleControl } from "../../primitives/controls";
import {
  DecompositionBar,
  FormulaInspector,
  HighlightProvider,
  LabNote,
  StatisticReadout,
  useHighlight,
  type BarSegment,
  type FormulaRow,
  type Readout,
  type Term,
} from "../../primitives/readouts";
import { AccessibleVisualization, ConceptPrompt, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel } from "../../shell/LabShell";
import { useLab, type HashCodec, type LabProps } from "../../shell/useLab";
import { VRA_DEMOS, VRA_EXPLAIN, VRA_GUIDES, VRA_T } from "./strings";

type Stage = 1 | 2 | 3;
type Scenario = "base" | "flat" | "noisy" | "steep";
type Pred = "mean" | "custom" | "ols";
type Av = "total" | "within" | "between" | "both";
type Layer = 1 | 2 | 3 | 4 | 5;
type Mode = "explore" | "learn";

export interface VraParams extends Record<string, unknown> {
  stage: Stage;
  scenario: Scenario;
  popVar: boolean;
  showSq: boolean;
  pred: Pred;
  av: Av;
  compare: boolean;
  /** Not LabDefinition params (legacy hash only): stage-1 layer and Learn/Explore mode. */
  layer: Layer;
  mode: Mode;
}

export interface Obs {
  id: string;
  x: number;
  y: number;
  g: 0 | 1 | 2;
}

// HANDOFF §2 dataset (synthetic): weekly news hours X, political knowledge Y (0–100), education group.
export const VRA_X = [1, 2, 3, 4, 6, 3, 5, 6, 8, 9, 5, 7, 9, 11, 13];
export const VRA_G: (0 | 1 | 2)[] = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
export const VRA_SCENARIOS: Record<Scenario, number[]> = {
  base: [28, 35, 31, 44, 49, 46, 52, 58, 55, 66, 60, 71, 68, 82, 88],
  flat: [50, 44, 58, 47, 55, 52, 49, 60, 45, 57, 48, 56, 51, 59, 46],
  noisy: [20, 33, 26, 49, 58, 39, 49, 60, 55, 74, 49, 69, 63, 89, 99],
  steep: [25, 31, 34, 41, 49, 36, 46, 50, 61, 64, 44, 56, 66, 74, 86],
};
const IDS = "ABCDEFGHIJKLMNO".split("");
export const makePts = (sc: Scenario): Obs[] => IDS.map((id, i) => ({ id, x: VRA_X[i], y: VRA_SCENARIOS[sc][i], g: VRA_G[i] }));

const DEFAULTS: VraParams = { stage: 1, scenario: "base", popVar: false, showSq: true, pred: "mean", av: "total", compare: false, layer: 2, mode: "learn" };

// Geometry (viewBox 760×480; 1 unit of Y = 4 px so squares are true squares).
const PY = (v: number) => 440 - v * 4;
const PX2 = (x: number) => 60 + x * 46;
const GCX = [170, 380, 590];
const clampY = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
const clampX = (v: number) => Math.max(0, Math.min(14, Math.round(v * 2) / 2));

/** Rewrites the data from an anchor snapshot: y' = ȳⱼ + (y − ȳⱼ)·spread + shift[g] (HANDOFF §3.4). */
export function applyScenarioSliders(anchor: Obs[], sep: number, spread: number): Obs[] {
  const gm = [0, 1, 2].map((g) => mean(anchor.filter((p) => p.g === g).map((p) => p.y)) ?? 0);
  const shift = [-sep, 0, sep];
  return anchor.map((p) => ({ ...p, y: Math.max(0, Math.min(100, Math.round((gm[p.g] + (p.y - gm[p.g]) * spread + shift[p.g]) * 10) / 10)) }));
}

export default function VraLab(props: LabProps) {
  const ptsRef = useRef<Obs[]>(makePts("base"));
  const codec = useMemo<HashCodec<VraParams>>(
    () => ({
      read(hash) {
        const h = parseVraHash(hash);
        if (!h) return null;
        const params: Partial<VraParams> = {};
        if (h.stage) params.stage = h.stage;
        if (h.scenario) params.scenario = h.scenario;
        if (h.pred) params.pred = h.pred;
        if (h.av) params.av = h.av;
        if (h.layer) params.layer = h.layer;
        if (h.mode) params.mode = h.mode;
        if (h.showSq !== undefined) params.showSq = h.showSq;
        if (h.popVar !== undefined) params.popVar = h.popVar;
        if (h.compare !== undefined) params.compare = h.compare;
        return { params, l: h.lang, present: h.present };
      },
      write(p, lang, present) {
        const pts = ptsRef.current;
        return encodeVraHash({ ...p, lang, present, y: pts.map((q) => q.y), x: pts.map((q) => q.x), g: pts.map((q) => q.g) });
      },
    }),
    [],
  );
  const lab = useLab<VraParams>("vra-lab", DEFAULTS, { ...props, codec: props.config || props.embedded ? undefined : codec });
  const { params: P, set, setMany, lang } = lab;
  const t = VRA_T[lang];
  const [pts, setPtsState] = useState<Obs[]>(() => makePts(DEFAULTS.scenario));
  const [sel, setSel] = useState<string | null>("O");
  const [custom, setCustom] = useState({ a: 35, b: 1.5 });
  const [sep, setSep] = useState(0);
  const [spread, setSpread] = useState(1);
  const [anchor, setAnchor] = useState<Obs[] | null>(null);
  const hl = useHighlight();
  const svgRef = useRef<SVGSVGElement>(null);
  const setPts = (next: Obs[]) => {
    ptsRef.current = next;
    setPtsState(next);
  };

  // Points from the legacy hash (y/x/g), or the scenario's data.
  useEffect(() => {
    if (props.config || props.embedded) return;
    const load = () => {
      const h = parseVraHash(window.location.hash);
      const base = makePts(h?.scenario ?? "base");
      setPts(base.map((p, i) => ({ ...p, y: h?.y?.[i] ?? p.y, x: h?.x?.[i] ?? p.x, g: (h?.g?.[i] ?? p.g) as 0 | 1 | 2 })));
    };
    load();
    window.addEventListener("hashchange", load);
    return () => window.removeEventListener("hashchange", load);
  }, [props.config, props.embedded]);
  // Snapshot config (lesson / builder preview): data come from the configured scenario.
  useEffect(() => {
    if (props.config) setPts(makePts((props.config.scenario as Scenario) ?? "base"));
  }, [props.config]);
  // Reset: back to the scenario's data and the default custom line.
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    setPts(makePts(P.scenario));
    setSep(0);
    setSpread(1);
    setAnchor(null);
    setCustom({ a: 35, b: 1.5 });
  }, [lab.resetCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitPts = (next: Obs[]) => {
    setPts(next);
    setSep(0);
    setSpread(1);
    setAnchor(null);
  };
  const updatePt = (id: string, patch: Partial<Obs>) => commitPts(pts.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const setScenario = (sc: Scenario) => {
    set("scenario", sc);
    if (!lab.locked("scenario")) commitPts(makePts(sc));
  };
  const scenarioSliders = (s: number, sp: number) => {
    const base = anchor ?? pts;
    setAnchor(base);
    setSep(s);
    setSpread(sp);
    setPts(applyScenarioSliders(base, s, sp));
  };

  const stage = P.stage;
  const drag = useSvgDrag<{ kind: "pt"; id: string } | { kind: "handle"; h: 0 | 1 }>(svgRef, (d, pt) => {
    if (d.kind === "handle") {
      const v = Math.max(-40, Math.min(140, (440 - pt.y) / 4));
      const { a, b } = custom;
      const v1 = d.h === 0 ? v : a + 2 * b;
      const v2 = d.h === 1 ? v : a + 12 * b;
      const nb = Math.round(((v2 - v1) / 10) * 100) / 100;
      setCustom({ a: Math.round((v1 - 2 * nb) * 10) / 10, b: nb });
      return;
    }
    const p = pts.find((q) => q.id === d.id);
    if (!p) return;
    const patch: Partial<Obs> = { y: clampY((440 - pt.y) / 4) };
    if (stage === 2) patch.x = clampX((pt.x - 60) / 46);
    if (stage === 3) {
      let best = 0;
      for (let j = 1; j < 3; j++) if (Math.abs(pt.x - GCX[j]) < Math.abs(pt.x - GCX[best])) best = j;
      if (best !== p.g) patch.g = best as 0 | 1 | 2;
    }
    if (patch.y !== p.y || (patch.x !== undefined && patch.x !== p.x) || patch.g !== undefined) updatePt(d.id, patch);
  });

  const keyPt = (id: string, e: React.KeyboardEvent) => {
    const p = pts.find((q) => q.id === id);
    if (!p) return;
    const big = e.shiftKey ? 5 : 1;
    let patch: Partial<Obs> | null = null;
    if (e.key === "ArrowUp") patch = { y: clampY(p.y + big) };
    else if (e.key === "ArrowDown") patch = { y: clampY(p.y - big) };
    else if (e.key === "Home") patch = { y: 0 };
    else if (e.key === "End") patch = { y: 100 };
    else if (stage === 2 && e.key === "ArrowRight") patch = { x: clampX(p.x + 0.5) };
    else if (stage === 2 && e.key === "ArrowLeft") patch = { x: clampX(p.x - 0.5) };
    else if (stage === 3 && e.key === "ArrowRight") patch = { g: Math.min(2, p.g + 1) as 0 | 1 | 2 };
    else if (stage === 3 && e.key === "ArrowLeft") patch = { g: Math.max(0, p.g - 1) as 0 | 1 | 2 };
    if (patch) {
      e.preventDefault();
      updatePt(id, patch);
    }
  };

  // ── statistics ──
  const ys = pts.map((p) => p.y);
  const xs = pts.map((p) => p.x);
  const desc = describe(ys, P.popVar);
  const f = fit(xs, ys);
  const an = anova([0, 1, 2].map((g) => pts.filter((p) => p.g === g).map((p) => p.y)));
  const my = desc.mean ?? 0;
  const grand = an.grand ?? 0;
  const gNames = [t.g0, t.g1, t.g2];
  const key = hl.key;
  const on = (k: string) => key === k;
  const dim = (k: string) => !!key && key !== k;
  const trClass = drag.dragging ? "lab-fast" : "lab-tr";
  const f2 = (v: number | null | undefined) => fmt(v, 2);
  const f1 = (v: number | null | undefined) => fmt(v, 1);

  let a = my;
  let b = 0;
  let hasLine = true;
  if (stage === 2 && P.pred === "custom") ({ a, b } = custom);
  if (stage === 2 && P.pred === "ols") {
    if (f.slope === null || f.intercept === null) hasLine = false;
    else {
      a = f.intercept;
      b = f.slope;
    }
  }
  const predAt = (x: number) => a + b * x;
  const sseCustom = sseLine(xs, ys, custom.a, custom.b);

  const gIdx = [0, 0, 0];
  const gCounts = [0, 1, 2].map((g) => pts.filter((p) => p.g === g).length);
  const ptsV = pts.map((p, i) => {
    let px: number;
    let ref: number;
    if (stage === 1) {
      px = 60 + i * 46;
      ref = my;
    } else if (stage === 2) {
      px = PX2(p.x);
      ref = hasLine ? predAt(p.x) : my;
    } else {
      const k = gIdx[p.g]++;
      px = GCX[p.g] + (k - (gCounts[p.g] - 1) / 2) * 24;
      ref = P.av === "total" ? grand : (an.means[p.g] ?? grand);
    }
    const py = PY(p.y);
    const refPy = PY(ref);
    const h = Math.abs(py - refPy);
    let dvOp = 0;
    let sqOp = 0;
    if (stage === 1) {
      dvOp = P.layer >= 3 ? 1 : 0;
      sqOp = P.layer >= 4 ? 1 : 0;
    }
    if (stage === 2) {
      dvOp = 1;
      sqOp = P.showSq ? 1 : 0;
    }
    if (stage === 3) {
      dvOp = P.av === "between" ? 0 : 1;
      sqOp = P.showSq && P.av !== "between" ? 1 : 0;
    }
    if (dim("dev") && dvOp) dvOp = 0.25;
    if (dim("sq") && sqOp) sqOp = 0.2;
    if (on("sum") && sqOp) sqOp = 1;
    const isSel = sel === p.id;
    const openLeft = px > 400;
    return { ...p, px, py, refPy, h, dvOp, sqOp, isSel, openLeft, dev: p.y - ref, sq: (p.y - ref) ** 2 };
  });

  const groups =
    stage === 3
      ? [0, 1, 2].map((g) => {
          const m = an.means[g];
          const n = gCounts[g];
          const cx = GCX[g];
          const mPy = m === null ? PY(grand) : PY(m);
          const gPy = PY(grand);
          const showB = P.av === "between" || P.av === "both";
          const side = Math.abs(mPy - gPy);
          const bOp = showB && n ? (dim("between") ? 0.3 : 1) : 0;
          const right = g < 2;
          const bx = right ? cx + 74 : cx - 79;
          const sqX = right ? bx + 5 : bx - side;
          const near = m !== null && Math.abs(m - grand) < 2.5;
          return { g, m, n, cx, mPy, gPy, side, bOp, right, bx, sqX, near, showB };
        })
      : [];

  let meanPy = PY(my);
  let meanOp = 1;
  let meanLabel = "x̄ = " + f1(my);
  let meanW = on("mean") ? 3 : 1.5;
  if (stage === 1) meanOp = P.layer >= 2 ? 1 : 0;
  if (stage === 2) {
    meanLabel = "ȳ = " + f1(my);
    meanOp = P.pred === "mean" ? 0 : 0.8;
  }
  if (stage === 3) {
    meanPy = PY(grand);
    meanLabel = "ȳ = " + f1(grand);
    meanW = on("grand") ? 3 : 1.5;
  }
  if (key && stage !== 3 && !on("mean")) meanOp *= 0.5;
  const predOp = stage === 2 && hasLine ? 1 : 0;
  const predRot = (Math.atan2(-b * 4, 46) * 180) / Math.PI;

  // ── readouts ──
  let readouts: Readout[] = [];
  let note: string | null = null;
  if (stage === 1)
    readouts = [
      { label: "n", value: String(desc.n) },
      { label: "x̄", value: desc.mean },
      { label: "SS = Σ(xᵢ − x̄)²", value: desc.ss, tone: "residual", hl: "sum" },
      { label: P.popVar ? "σ² = SS / n" : "s² = SS / (n − 1)", value: desc.variance, hl: "n1" },
      { label: P.popVar ? "σ" : "s", value: desc.sd, hl: "sqrt" },
      { label: "df", value: desc.df === null ? null : String(desc.df) },
    ];
  if (stage === 2) {
    if (P.pred === "ols" && f.slope === null) note = f.reason === "noXVariation" ? t.noteNoX : null;
    const showA = P.pred === "ols" ? f.intercept : P.pred === "custom" ? custom.a : my;
    const showB = P.pred === "ols" ? f.slope : P.pred === "custom" ? custom.b : 0;
    const sse = P.pred === "ols" ? f.sse : P.pred === "custom" ? sseCustom : f.sst;
    readouts = [
      { label: t.intercept, value: showA },
      { label: t.slope, value: showB },
      { label: "SSE", value: sse, tone: "residual", hl: "sse" },
      { label: "SST", value: f.sst, hl: "sst" },
      ...(P.pred === "ols" ? [{ label: "SSR", value: f.ssr, tone: "explained" as const, hl: "ssr" }] : []),
      { label: "r", value: P.pred === "ols" ? f.r : null, digits: 3 },
      { label: "R² = SSR / SST", value: P.pred === "ols" ? f.r2 : null, digits: 3, tone: "explained", hl: "r2" },
    ];
  }
  if (stage === 3) {
    if (an.tooSmall) note = t.noteSmall;
    else if (an.zeroWithin) note = t.noteZeroWithin;
    readouts = [
      { label: "SS between", value: an.ssb, tone: "explained", hl: "between" },
      { label: "SS within", value: an.ssw, tone: "residual", hl: "within" },
      { label: "SS total", value: an.sst },
      { label: "df", value: `${an.dfB}, ${an.dfW}` },
      { label: "MS between", value: an.msb, tone: "explained", hl: "msb" },
      { label: "MS within", value: an.msw, tone: "residual", hl: "msw" },
      { label: "F", value: an.F, hl: "F" },
      { label: "p", value: fmtP(an.p), hl: "p" },
      { label: "η² = SSB / SST", value: an.eta2, digits: 3, hl: "eta" },
    ];
  }

  const selP = ptsV.find((p) => p.id === sel);
  const selReadouts: Readout[] = selP
    ? stage === 2
      ? [
          { label: "ŷ", value: hasLine ? predAt(selP.x) : my, digits: 1, tone: "model" },
          { label: "e = y − ŷ", value: selP.dev, digits: 1, tone: "residual" },
          { label: "e²", value: selP.sq, digits: 1, tone: "residual" },
        ]
      : stage === 3
        ? [
            { label: "ȳⱼ", value: an.means[selP.g], digits: 1, tone: "model" },
            { label: P.av === "total" ? "y − ȳ" : "y − ȳⱼ", value: selP.dev, digits: 1, tone: "residual" },
            { label: "(…)²", value: selP.sq, digits: 1, tone: "residual" },
          ]
        : [
            { label: "xᵢ − x̄", value: selP.dev, digits: 1, tone: "residual" },
            { label: "(xᵢ − x̄)²", value: selP.sq, digits: 1, tone: "residual" },
          ]
    : [];

  // ── formulas and decomposition ──
  const term = (text: string, k: string, italic = false): Term => ({ text, key: k, italic });
  let rows: FormulaRow[] = [];
  let bars: { label: string; total: number | null; segs: BarSegment[] }[] = [];
  let decompTitle = "";
  let decompNote = "";
  if (stage === 1) {
    rows = [
      { terms: [term("x̄", "mean", true), "=", term("Σ", "sum"), term("xᵢ", "xi", true), "/", "n"], value: f2(desc.mean) },
      { terms: ["SS", "=", term("Σ", "sum"), term("(", "sq"), term("xᵢ", "xi", true), term("−", "dev"), term("x̄", "mean", true), term(")²", "sq")], value: f2(desc.ss) },
      { terms: [P.popVar ? "σ²" : "s²", "=", "SS", "/", term(P.popVar ? "n" : "(n − 1)", "n1")], value: f2(desc.variance) },
      { terms: [P.popVar ? "σ" : "s", "=", term("√", "sqrt"), P.popVar ? "σ²" : "s²"], value: f2(desc.sd) },
    ];
    decompTitle = t.decompS1;
    bars = [{ label: "SS", total: desc.ss, segs: ptsV.map((p) => ({ value: p.sq, label: p.id, tone: "residual", emphasis: p.id === sel || on("sum") })) }];
    if (P.layer >= 5) bars.push({ label: P.popVar ? "σ² = SS / n" : "s² = SS / (n − 1)", total: desc.variance, segs: [{ value: desc.variance ?? 0, label: "variance", tone: "residual" }] });
    decompNote = t.s1Note;
  }
  if (stage === 2) {
    rows = [
      { terms: [term("ŷᵢ", "yhat", true), "=", "a", "+", "b", "·", "xᵢ"], value: `a = ${f2(a)}, b = ${f2(b)}` },
      { terms: [term("eᵢ", "resid", true), "=", "yᵢ", "−", term("ŷᵢ", "yhat", true)] },
      { terms: [term("SSE", "sse"), "=", "Σ", term("eᵢ²", "resid", true)], value: f2(P.pred === "ols" ? f.sse : P.pred === "custom" ? sseCustom : f.sst) },
      { terms: [term("SST", "sst"), "=", "Σ(yᵢ −", term("ȳ", "mean", true), ")²"], value: f2(f.sst) },
    ];
    if (P.pred === "ols" && f.slope !== null)
      rows.push({ terms: [term("SST", "sst"), "=", term("SSR", "ssr"), "+", term("SSE", "sse"), ";", term("R²", "r2"), "= SSR / SST"], value: `${f1(f.sst)} = ${f1(f.ssr)} + ${f1(f.sse)}; R² = ${fmt(f.r2, 3)}` });
    decompTitle = t.decompS2;
    if (P.pred === "mean") {
      bars = [{ label: `SST (= SSE ${t.predMean.toLowerCase()})`, total: f.sst, segs: [{ value: f.sst ?? 0, label: "SST", tone: "residual" }] }];
      decompNote = t.meanNoteS2;
    }
    if (P.pred === "custom") {
      bars = [
        { label: "SST", total: f.sst, segs: [{ value: f.sst ?? 0, label: "SST", tone: "muted" }] },
        { label: `SSE (${t.predCustom.toLowerCase()})`, total: sseCustom, segs: [{ value: sseCustom, label: "SSE", tone: "residual" }] },
      ];
      decompNote = t.customNote;
    }
    if (P.pred === "ols") {
      bars =
        f.slope === null
          ? []
          : [
              {
                label: "SST = SSR + SSE",
                total: f.sst,
                segs: [
                  { value: f.ssr ?? 0, label: "SSR", tone: "explained", emphasis: !key || on("ssr") || on("r2") },
                  { value: f.sse ?? 0, label: "SSE", tone: "residual", emphasis: !key || on("sse") },
                ],
              },
            ];
      decompNote = t.olsNote;
    }
  }
  if (stage === 3) {
    rows = [
      { terms: ["SS total", "=", term("SS between", "between"), "+", term("SS within", "within")], value: `${f1(an.sst)} = ${f1(an.ssb)} + ${f1(an.ssw)}` },
      { terms: [term("SS between", "between"), "=", "Σ nⱼ(", term("ȳⱼ", "gmean", true), "−", term("ȳ", "grand", true), ")²"], value: f2(an.ssb) },
      { terms: [term("SS within", "within"), "=", "ΣΣ(yᵢⱼ −", term("ȳⱼ", "gmean", true), ")²"], value: f2(an.ssw) },
      { terms: [term("F", "F"), "=", term("MS between", "msb"), "/", term("MS within", "msw"), "=", `(SSB / ${an.dfB}) / (SSW / ${an.dfW})`], value: f2(an.F) },
      { terms: [term("η²", "eta"), "= SSB / SST", ";", term("p", "p"), `= P(F${an.dfB},${an.dfW} ≥ F)`], value: `${fmt(an.eta2, 3)}; p ${fmtP(an.p).startsWith("<") ? "" : "= "}${fmtP(an.p)}` },
    ];
    decompTitle = t.decompS3;
    bars = [
      {
        label: "SST = SSB + SSW (ANOVA)",
        total: an.sst,
        segs: [
          { value: an.ssb, label: "SSB", tone: "explained", emphasis: !key || on("between") || on("eta") },
          { value: an.ssw, label: "SSW", tone: "residual", emphasis: !key || on("within") },
        ],
      },
    ];
    decompNote = t.anovaNote;
    if (P.compare && f.slope !== null) {
      bars.push({
        label: `SST = SSR + SSE (${t.s2})`,
        total: f.sst,
        segs: [
          { value: f.ssr ?? 0, label: "SSR", tone: "explained", emphasis: false },
          { value: f.sse ?? 0, label: "SSE", tone: "residual", emphasis: false },
        ],
      });
      decompNote = t.compareNote;
    }
  }
  const explanation = stage === 1 ? t.s1Note : stage === 2 ? (P.pred === "ols" ? t.olsNote : P.pred === "custom" ? t.customNote : t.meanNoteS2) : t.pNote;
  const customFeedback =
    P.pred === "custom"
      ? f.sst !== null && sseCustom > f.sst
        ? t.worse
        : f.sse !== null && f.sst !== null && sseCustom - f.sse < 0.01 * f.sst
          ? t.found
          : t.keepGoing.replace("{sse}", f1(sseCustom)).replace("{best}", f1(f.sse))
      : "";
  const summary =
    stage === 1
      ? `x̄ ${f2(desc.mean)}, SS ${f2(desc.ss)}, ${P.popVar ? "σ²" : "s²"} ${f2(desc.variance)}`
      : stage === 2
        ? `SSE ${f2(P.pred === "ols" ? f.sse : P.pred === "custom" ? sseCustom : f.sst)}, SST ${f2(f.sst)}`
        : `F ${f2(an.F)}, p ${fmtP(an.p)}, η² ${fmt(an.eta2, 3)}`;

  const demos = VRA_DEMOS[lang].map(([title, noteText, d]) => ({
    title,
    note: noteText,
    apply: () => {
      const sc = d.scenario ?? "base";
      let next = makePts(sc);
      if (d.pts) next = next.map((p) => (d.pts![p.id] !== undefined ? { ...p, y: d.pts![p.id] } : p));
      setMany({ stage: d.stage, layer: d.layer ?? 2, pred: d.pred ?? "mean", av: d.av ?? "total", scenario: sc, showSq: true, compare: false });
      commitPts(next);
      if (d.spread) {
        setAnchor(next);
        setSpread(d.spread);
        setPts(applyScenarioSliders(next, 0, d.spread));
      }
    },
  }));

  const stageTitle = stage === 1 ? t.s1Title : stage === 2 ? t.s2Title : t.s3Title;
  const stageSub = stage === 1 ? t.s1Sub : stage === 2 ? t.s2Sub : t.s3Sub;
  const yAxisName = t.yName;
  const xAxisName = stage === 2 ? t.xName : stage === 1 ? t.respondent : t.group;

  const viewChoice =
    stage === 1 ? (
      <ChoiceControl<number>
        label={lang === "hu" ? "Réteg" : "Layer"}
        hideLabel
        value={P.layer}
        onChange={(v) => set("layer", v as Layer)}
        options={[t.l1, t.l2, t.l3, t.l4, t.l5].map((l, i) => ({ value: i + 1, label: l }))}
      />
    ) : stage === 2 ? (
      <ChoiceControl<Pred>
        label={lang === "hu" ? "Előrejelzés" : "Prediction"}
        hideLabel
        param="pred"
        value={P.pred}
        onChange={(v) => set("pred", v)}
        options={[
          { value: "mean", label: t.predMean },
          { value: "custom", label: t.predCustom },
          { value: "ols", label: t.predOls },
        ]}
      />
    ) : (
      <ChoiceControl<Av>
        label={lang === "hu" ? "Nézet" : "View"}
        hideLabel
        param="av"
        value={P.av}
        onChange={(v) => set("av", v)}
        options={[
          { value: "total", label: t.avTotal },
          { value: "within", label: t.avWithin },
          { value: "between", label: t.avBetween },
          { value: "both", label: t.avBoth },
        ]}
      />
    );

  const svg = (
    <AccessibleVisualization
      summary={summary}
      interactive
      viewBox="0 0 760 480"
      svgRef={svgRef}
      onPointerMove={drag.move}
      onPointerUp={drag.end}
      table={{
        caption: lang === "hu" ? "Megfigyelések" : "Observations",
        columns: [t.respondent, "X", "Y", t.group, stage === 2 ? "e" : "dev"],
        rows: ptsV.map((p) => [p.id, p.x, p.y, gNames[p.g], fmt(p.dev, 1)]),
      }}
    >
      <defs>
        <clipPath id="vra-clip">
          <rect x="40" y="36" width="692" height="408" />
        </clipPath>
      </defs>
      <g aria-hidden>
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line x1={44} x2={730} y1={PY(v)} y2={PY(v)} stroke="var(--grid)" />
            <text x={36} y={PY(v) + 4} textAnchor="end" fontSize={11} fill="var(--faint)">
              {v}
            </text>
          </g>
        ))}
        {(stage === 1 ? pts.map((p, i) => ({ px: 60 + i * 46, label: p.id })) : stage === 2 ? [0, 2, 4, 6, 8, 10, 12, 14].map((x) => ({ px: PX2(x), label: String(x) })) : []).map((o) => (
          <text key={o.px + o.label} x={o.px} y={458} textAnchor="middle" fontSize={11} fill="var(--muted)">
            {o.label}
          </text>
        ))}
        <text x={730} y={474} textAnchor="end" fontSize={11} fill="var(--muted)" className="font-sans">
          {xAxisName}
        </text>
        <text x={44} y={26} fontSize={11} fill="var(--muted)" className="font-sans">
          {yAxisName}
        </text>
      </g>
      <g clipPath="url(#vra-clip)" aria-hidden>
        {ptsV.map((p) => (
          <rect
            key={"sq" + p.id}
            className={trClass}
            style={{ x: p.openLeft ? p.px - p.h : p.px, y: Math.min(p.py, p.refPy), width: p.h, height: p.h, opacity: p.sqOp } as React.CSSProperties}
            fill="var(--residual)"
            fillOpacity={p.isSel || on("sq") ? 0.32 : 0.16}
            stroke="var(--residual)"
          />
        ))}
        {groups.map((gr) => (
          <g key={"b" + gr.g}>
            <rect className={trClass} style={{ x: gr.bx, y: Math.min(gr.mPy, gr.gPy), width: on("between") ? 8 : 5, height: gr.side, opacity: gr.bOp } as React.CSSProperties} fill="var(--explained)" />
            <rect
              className={trClass}
              style={{ x: gr.sqX, y: Math.min(gr.mPy, gr.gPy), width: gr.side, height: gr.side, opacity: P.showSq && gr.showB && gr.n ? gr.bOp : 0 } as React.CSSProperties}
              fill="var(--explained)"
              fillOpacity={0.14}
              stroke="var(--explained)"
            />
            <text x={gr.right ? gr.sqX : gr.sqX + gr.side} y={Math.min(gr.mPy, gr.gPy) - 5} fontSize={10.5} fill="var(--explained-ink)" textAnchor={gr.right ? "start" : "end"} style={{ opacity: P.showSq && gr.showB && gr.n ? gr.bOp : 0 }}>
              ×{gr.n}
            </text>
          </g>
        ))}
        {ptsV.map((p) => (
          <rect
            key={"dv" + p.id}
            className={trClass}
            style={{ x: p.px - (on("dev") ? 2 : 1), y: Math.min(p.py, p.refPy), width: on("dev") ? 4 : 2, height: p.h, opacity: p.dvOp } as React.CSSProperties}
            fill="var(--residual)"
          />
        ))}
      </g>
      <g className="lab-tr" style={{ transform: `translate(0px, ${meanPy}px)`, opacity: meanOp }} aria-hidden>
        <line x1={44} x2={730} y1={0} y2={0} stroke="var(--ink)" strokeWidth={meanW} strokeDasharray="6 4" />
        <text x={730} y={-6} textAnchor="end" fontSize={11} fill="var(--ink)">
          {meanLabel}
        </text>
      </g>
      <g clipPath="url(#vra-clip)" style={{ opacity: predOp }} aria-hidden>
        <g className={trClass} style={{ transform: `translate(${PX2(0)}px, ${PY(a)}px) rotate(${predRot}deg)`, transformOrigin: "0 0" }}>
          <line x1={-100} x2={1100} y1={0} y2={0} stroke="var(--model)" strokeWidth={on("yhat") ? 4 : 2.5} />
        </g>
      </g>
      {groups.map((gr) => (
        <g key={"m" + gr.g}>
          <g className={trClass} style={{ transform: `translate(${gr.cx}px, ${gr.mPy}px)` }} aria-hidden>
            <line x1={-70} x2={70} y1={0} y2={0} stroke="var(--model)" strokeWidth={on("gmean") ? 5 : 3} strokeLinecap="round" />
            <text x={gr.right ? -74 : 74} y={gr.near ? 16 : 4} fontSize={11} fill="var(--model-ink)" textAnchor={gr.right ? "end" : "start"}>
              {gr.m === null ? "—" : `ȳ${gr.g + 1} = ${f1(gr.m)}`}
            </text>
          </g>
          <text x={gr.cx} y={458} textAnchor="middle" fontSize={12} fill="var(--ink)" className="font-sans" aria-hidden>
            {gNames[gr.g]}{" "}
            <tspan fill="var(--faint)" fontSize={11} className="font-mono">
              n={gr.n}
            </tspan>
          </text>
        </g>
      ))}
      {stage === 2 &&
        P.pred === "custom" &&
        ([2, 12] as const).map((x, h) => {
          const v = predAt(x);
          return (
            <g
              key={"h" + x}
              className="lab-fast lab-handle"
              style={{ transform: `translate(${PX2(x)}px, ${PY(v)}px)`, cursor: "ns-resize" }}
              tabIndex={0}
              role="slider"
              aria-label={lang === "hu" ? `Egyenes fogantyú, X = ${x}` : `Line handle at X = ${x}`}
              aria-valuenow={Math.round(v)}
              aria-valuemin={-40}
              aria-valuemax={140}
              onPointerDown={(e) => drag.start({ kind: "handle", h: h as 0 | 1 }, e)}
              onKeyDown={(e) => {
                const d = e.key === "ArrowUp" ? (e.shiftKey ? 5 : 1) : e.key === "ArrowDown" ? -(e.shiftKey ? 5 : 1) : 0;
                if (!d) return;
                e.preventDefault();
                const v1 = h === 0 ? predAt(2) + d : predAt(2);
                const v2 = h === 1 ? predAt(12) + d : predAt(12);
                const nb = (v2 - v1) / 10;
                setCustom({ a: Math.round((v1 - 2 * nb) * 10) / 10, b: Math.round(nb * 100) / 100 });
              }}
            >
              <circle r={10} fill="var(--surface)" stroke="var(--model)" strokeWidth={2.5} />
              <circle r={3} fill="var(--model)" />
              <circle r={18} fill="transparent" />
            </g>
          );
        })}
      {ptsV.map((p) => (
        <g
          key={"p" + p.id}
          className={cn("lab-handle", trClass)}
          style={{ transform: `translate(${p.px}px, ${p.py}px)`, cursor: stage === 2 ? "move" : "ns-resize" }}
          tabIndex={0}
          role="slider"
          aria-label={`${t.respondent} ${p.id}, ${gNames[p.g]}, X ${p.x}`}
          aria-valuenow={p.y}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`Y ${p.y}`}
          onPointerDown={(e) => {
            setSel(p.id);
            drag.start({ kind: "pt", id: p.id }, e);
          }}
          onKeyDown={(e) => keyPt(p.id, e)}
          onFocus={() => setSel(p.id)}
        >
          <circle r={p.isSel ? 11 : 9} fill="var(--data)" stroke={p.isSel ? "var(--ink)" : "var(--surface)"} strokeWidth={2} />
          <circle r={18} fill="transparent" />
          <text y={4} textAnchor="middle" fontSize={9} fontWeight={600} fill="#fff" aria-hidden>
            {p.id}
          </text>
        </g>
      ))}
    </AccessibleVisualization>
  );

  const aside = (
    <>
      {P.mode === "learn" && !lab.present && <ConceptPrompt key={stage} steps={VRA_GUIDES[lang][stage]} title={t.prompt} />}
      <Panel title={t.measurements}>
        {stage === 1 && (
          <div className="mb-2">
            <ChoiceControl<"sample" | "population">
              label={lang === "hu" ? "Osztó" : "Divisor"}
              param="popVar"
              value={P.popVar ? "population" : "sample"}
              onChange={(v) => set("popVar", v === "population")}
              options={[
                { value: "sample", label: t.sample },
                { value: "population", label: t.population },
              ]}
            />
          </div>
        )}
        <StatisticReadout items={readouts} />
        {note && (
          <div className="mt-3">
            <LabNote>{note}</LabNote>
          </div>
        )}
      </Panel>
      {stage === 2 && P.pred === "custom" && (
        <Panel title={t.yourLine}>
          <div className="space-y-3">
            <ParameterControl label={t.intercept} value={custom.a} min={-20} max={100} step={0.5} onChange={(v) => setCustom({ ...custom, a: v })} />
            <ParameterControl label={t.slope} value={custom.b} min={-6} max={10} step={0.1} onChange={(v) => setCustom({ ...custom, b: v })} />
            <p className="text-xs leading-relaxed text-muted" aria-live="polite">
              {customFeedback}
            </p>
          </div>
        </Panel>
      )}
      {stage === 3 && (
        <Panel title={t.scenarioControls}>
          <div className="space-y-3">
            <ParameterControl label={t.separation} value={sep} min={-15} max={25} step={1} onChange={(v) => scenarioSliders(v, spread)} format={(v) => (v > 0 ? "+" : "") + v} />
            <ParameterControl label={t.spread} value={spread} min={0.1} max={2.5} step={0.1} onChange={(v) => scenarioSliders(sep, v)} format={(v) => v.toFixed(1) + "×"} />
            <p className="text-xs leading-relaxed text-faint">{t.scenarioHint}</p>
          </div>
        </Panel>
      )}
      <Panel title={t.selected}>
        {selP ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-data font-mono text-xs font-semibold text-white" aria-hidden>
                {selP.id}
              </span>
              <span className="text-sm text-muted">
                {t.respondent} {selP.id} · {gNames[selP.g]} · X = {selP.x}
              </span>
            </div>
            <ParameterControl label={yAxisName} value={selP.y} min={0} max={100} step={1} onChange={(v) => updatePt(selP.id, { y: clampY(v) })} />
            {stage === 2 && <ParameterControl label={t.xName} value={selP.x} min={0} max={14} step={0.5} onChange={(v) => updatePt(selP.id, { x: clampX(v) })} />}
            {stage === 3 && (
              <SelectControl<string>
                label={t.group}
                value={String(selP.g)}
                onChange={(v) => updatePt(selP.id, { g: Number(v) as 0 | 1 | 2 })}
                options={gNames.map((n, i) => ({ value: String(i), label: n }))}
              />
            )}
            <StatisticReadout items={selReadouts} size="sm" />
          </div>
        ) : (
          <p className="text-sm text-faint">{t.selectHint}</p>
        )}
      </Panel>
    </>
  );

  const below = (
    <section aria-label={t.formulas} className="grid gap-6 rounded-2xl border border-line bg-surface p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <FormulaInspector rows={rows} explain={VRA_EXPLAIN[lang]} fallback={explanation} title={t.formulas} />
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{decompTitle}</h2>
        <div className="mt-2 flex flex-col gap-3">
          {bars.map((bar, i) => (
            <DecompositionBar key={i} label={bar.label} total={bar.total} segments={bar.segs} scale={bars[0].total ?? undefined} />
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">{decompNote}</p>
        {stage === 3 && (
          <div className="mt-3">
            <ToggleControl label={t.compareReg} checked={P.compare} onChange={(v) => set("compare", v)} param="compare" />
          </div>
        )}
      </div>
    </section>
  );

  return (
    <HighlightProvider value={hl}>
      <LabShell
        lab={lab}
        title={t.labTitle}
        toolbar={
          <>
            <ChoiceControl<Stage>
              label={lang === "hu" ? "Szakasz" : "Stage"}
              hideLabel
              param="stage"
              size="md"
              value={stage}
              onChange={(v) => {
                set("stage", v);
                hl.set(null);
              }}
              options={[
                { value: 1, label: `1 · ${t.s1}` },
                { value: 2, label: `2 · ${t.s2}` },
                { value: 3, label: `3 · ${t.s3}` },
              ]}
            />
            <SelectControlInline label={t.scenario} value={P.scenario} locked={lab.locked("scenario")} onChange={(v) => setScenario(v as Scenario)} options={[
              { value: "base", label: t.scBase },
              { value: "flat", label: t.scFlat },
              { value: "noisy", label: t.scNoisy },
              { value: "steep", label: t.scSteep },
            ]} />
            <ChoiceControl<Mode>
              label={lang === "hu" ? "Mód" : "Mode"}
              hideLabel
              value={P.mode}
              onChange={(v) => set("mode", v)}
              options={[
                { value: "explore", label: t.explore },
                { value: "learn", label: t.learn },
              ]}
            />
          </>
        }
        demos={demos}
        aside={aside}
        below={below}
        method={lang === "hu" ? "Leíró statisztika, legkisebb négyzetek, egyutas ANOVA (F-eloszlás)" : "Descriptives, least squares, one-way ANOVA (F distribution)"}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{stageTitle}</h2>
            <p className="mt-0.5 max-w-2xl text-sm text-muted">{stageSub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {viewChoice}
            {stage !== 1 && (
              <LabButton pressed={P.showSq} onClick={() => set("showSq", !P.showSq)}>
                {t.squares}
              </LabButton>
            )}
          </div>
        </div>
        <div className="mt-2">{svg}</div>
        <div className="flex flex-wrap justify-between gap-3 px-1 pt-1 text-xs text-faint">
          <span>{t.synthetic}</span>
          <span>{t.dragHint}</span>
        </div>
      </LabShell>
    </HighlightProvider>
  );
}

function SelectControlInline({ label, value, onChange, options, locked }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; locked: boolean }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted">
      {label}
      <select value={value} disabled={locked} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-line bg-surface px-2 py-1 text-sm text-ink disabled:opacity-60">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}


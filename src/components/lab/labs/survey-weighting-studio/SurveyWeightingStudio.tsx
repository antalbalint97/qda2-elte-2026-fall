"use client";

// Survey Design & Weighting Studio (flagship). Port of "QDA2 Survey Weighting Studio.dc.html".
// Ten stages walk one synthetic finite population (N = 600, 20 PSUs, known truth) through frame →
// probability sample → π and base weights → HT/Hájek → nonresponse → post-stratification/raking →
// standard errors → design effect → repeated sampling. Every number is computed by the survey engine
// (src/lib/engine/survey-*.ts); what is and is not checked against R `survey` is stated in the footer.
import { fmt } from "@/lib/engine/format";
import { mulberry32 } from "@/lib/engine/rng";
import { respond, select, studioPopulation, type Design, type DesignType, type ResponseMechanism, type ResponseType, type Unit } from "@/lib/engine/survey-design";
import {
  closedFormVar,
  designEffect,
  estimates,
  kishNeff,
  linearizedVarMean,
  naiveVar,
  postStratify,
  rake,
  repeat,
  type RepeatSummary,
  type WeightedResp,
} from "@/lib/engine/survey-estimators";
import { cn } from "@/lib/cn";
import { useEffect, useMemo, useState } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl, ToggleControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { SWS_T } from "./strings";

type Alloc = "prop" | "equal" | "disproportionate";
type DesignKey = "srs" | "stratified" | "cluster" | "twostage";
type Adj = "none" | "poststrat" | "raking";

export interface StudioParams extends Record<string, unknown> {
  /** 1–10; 0 = choose from the other settings (block configs that name only a design or mechanism). */
  stage: number;
  shareC: number;
  muC: number;
  rho: number;
  covC: number;
  design: DesignKey;
  n: number;
  allocation: Alloc;
  a: number;
  m: number;
  nonresponse: ResponseType;
  rate: number;
  slope: number;
  adjustment: Adj;
  showTruth: boolean;
  seed: number;
}

const DEFAULTS: StudioParams = {
  stage: 0,
  shareC: 0.2,
  muC: 72,
  rho: 0.15,
  covC: 0.6,
  design: "srs",
  n: 120,
  allocation: "prop",
  a: 6,
  m: 12,
  nonresponse: "none",
  rate: 0.6,
  slope: 1.2,
  adjustment: "none",
  showTruth: true,
  seed: 20261023,
};
const GROUP_RATES = { A: 0.85, B: 0.6, C: 0.35 };
const GROUPS = ["A", "B", "C"] as const;
const GC: Record<string, string> = { A: "var(--data)", B: "var(--model)", C: "var(--explained)" };

const clampTo = (v: number, lo: number, hi: number, step: number) => Math.min(hi, Math.max(lo, Math.round(v / step) * step));

/** Clamps every setting to its slider range and picks the stage when a config leaves it at 0. */
export function normalizeStudio(p: StudioParams): StudioParams {
  let stage = Math.round(p.stage);
  if (!(stage >= 1 && stage <= 10)) stage = p.adjustment !== "none" ? 7 : p.nonresponse !== "none" ? 6 : p.design !== "srs" ? 3 : 1;
  const seed = Number.isInteger(p.seed) && p.seed >= 1 && p.seed < 2147483647 ? p.seed : DEFAULTS.seed;
  return {
    ...p,
    stage,
    shareC: +clampTo(p.shareC, 0.05, 0.5, 0.05).toFixed(2),
    muC: clampTo(p.muC, 40, 90, 1),
    rho: +clampTo(p.rho, 0, 0.5, 0.05).toFixed(2),
    covC: +clampTo(p.covC, 0.2, 1, 0.05).toFixed(2),
    n: clampTo(p.n, 30, 300, 10),
    allocation: p.allocation === "disproportionate" ? "equal" : p.allocation,
    a: clampTo(p.a, 2, 12, 1),
    m: clampTo(p.m, 4, 25, 1),
    rate: +clampTo(p.rate, 0.2, 0.95, 0.05).toFixed(2),
    slope: +clampTo(p.slope, 0, 3, 0.1).toFixed(1),
    seed,
  };
}

export function studioDesign(p: StudioParams): Design {
  const type: DesignType = p.design === "stratified" ? "strat" : p.design;
  return { type, n: p.n, allocation: p.allocation === "equal" ? "equal" : "prop", a: p.a, m: p.m };
}
export function studioMechanism(p: StudioParams): ResponseMechanism {
  return { type: p.nonresponse, rate: p.rate, slope: p.slope, groupRates: GROUP_RATES };
}

/** One pass of the studio pipeline for a sample number (the same arithmetic the stages display). */
export function runPipeline(p: StudioParams, sampleNo: number) {
  const pop = studioPopulation({ shareC: p.shareC, muC: p.muC, icc: p.rho, covC: p.covC, seed: p.seed });
  const st = p.stage;
  const design = studioDesign(p);
  const rand = mulberry32(p.seed * 7 + sampleNo);
  const sel = st >= 3 ? select(pop, design, rand) : { sample: [], info: { frameN: pop.frameN, method: "" }, design };
  const mech: ResponseMechanism = st >= 6 ? studioMechanism(p) : { type: "none", rate: 1 };
  const adj: Adj = st >= 7 ? p.adjustment : "none";
  const resp0: WeightedResp[] = respond(sel.sample, mech, rand).map((x) => ({ ...x, w: x.d }));
  let resp = resp0.filter((x) => x.r);
  let rakeInfo: { iterations: number; converged: boolean } | null = null;
  if (adj === "poststrat") resp = postStratify(resp, pop.groupN, "g");
  else if (adj === "raking") {
    const rk = rake(resp, [
      { key: "g", counts: pop.groupN },
      { key: "x", counts: { 0: pop.xN[0], 1: pop.xN[1] } },
    ]);
    resp = rk.resp;
    rakeInfo = { iterations: rk.iterations, converged: rk.converged };
  }
  const estN = adj !== "none" ? pop.N : pop.frameN;
  const est = estimates(resp, estN);
  const lin = linearizedVarMean(resp);
  const cf = adj === "none" && mech.type === "none" ? closedFormVar(resp, sel, pop.frameN) : { v: null, se: null, method: "closed forms assume full response and base weights" };
  const nv = naiveVar(resp);
  const kish = kishNeff(resp);
  const deff = designEffect(resp, lin.v);
  return { pop, sel, resp0, resp, est, estN, lin, cf, nv, kish, deff, rakeInfo, adj, mech };
}

export default function SurveyWeightingStudio(props: LabProps) {
  const lab = useLab<StudioParams>("survey-weighting-studio", DEFAULTS, { ...props, normalize: normalizeStudio });
  const { params: P, set, setMany, lang } = lab;
  const t = SWS_T[lang];
  const st = P.stage;
  const [sampleNo, setSampleNo] = useState(1);
  const [rep, setRep] = useState<RepeatSummary | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const pipe = useMemo(() => runPipeline(P, sampleNo), [P, sampleNo]);
  const { pop, sel, resp, est, lin, cf, nv, kish, deff, rakeInfo } = pipe;
  // A repeat summary belongs to one population, design, mechanism and adjustment.
  const repKey = JSON.stringify([P.shareC, P.muC, P.rho, P.covC, P.seed, P.design, P.n, P.allocation, P.a, P.m, st >= 6 && P.nonresponse, P.rate, P.slope, st >= 7 && P.adjustment]);
  useEffect(() => setRep(null), [repKey, lab.resetCount]);
  useEffect(() => setSampleNo(1), [lab.resetCount]);

  const runRep = (k: number) => {
    setBusy(true);
    // Let the busy state paint before the (synchronous) simulation runs.
    window.setTimeout(() => {
      setRep(repeat(pop, studioDesign(P), st >= 6 ? studioMechanism(P) : { type: "none", rate: 1 }, { type: st >= 7 ? P.adjustment : "none" }, k, P.seed * 13 + k));
      setBusy(false);
    }, 20);
  };

  const sampled = new Set(sel.sample.map((x) => x.id));
  const respMap = new Map<number, (typeof pipe.resp0)[number]>();
  pipe.resp0.forEach((x) => respMap.set(x.id, x));
  resp.forEach((x) => respMap.set(x.id, { ...(respMap.get(x.id) as WeightedResp), w: x.w }));
  const wMax = Math.max(1, ...resp.map((x) => x.w));
  const clusterDesign = st >= 3 && (P.design === "cluster" || P.design === "twostage");
  const pickedPSU = new Set(sel.info.psus ?? []);

  // ── population field: 20 PSUs in a 5 × 4 grid ──
  const colW = 152;
  const PER_ROW = 8;
  const byC: Unit[][] = Array.from({ length: pop.K }, () => []);
  pop.units.forEach((u) => byC[u.c].push(u));
  byC.forEach((us) => us.sort((a, b) => a.gi - b.gi || a.y - b.y));
  // Block height fits the largest PSU (sizes vary because units are assigned to PSUs at random).
  const rowH = 34 + Math.ceil(Math.max(...byC.map((us) => us.length)) / PER_ROW) * 15;
  const pos = new Map<number, { cx: number; cy: number }>();
  byC.forEach((us, c) => {
    const bx = (c % 5) * colW + 2;
    const by = Math.floor(c / 5) * rowH + 2;
    us.forEach((u, k) => pos.set(u.id, { cx: bx + 13 + (k % PER_ROW) * 17, cy: by + 22 + Math.floor(k / PER_ROW) * 15 }));
  });
  const fieldH = 4 * rowH;
  const hv = hover !== null ? pop.units[hover] : null;
  const hvR = hv ? respMap.get(hv.id) : undefined;
  const unitInfo = hv
    ? t.hover
        .replace("{id}", String(hv.id + 1))
        .replace("{g}", hv.g)
        .replace("{c}", String(hv.c + 1))
        .replace("{y}", fmt(hv.y, 1))
        .replace(
          "{pi}",
          st >= 4 && hvR && hvR.r
            ? ` · π = ${fmt(hvR.pi, 3)} · d = ${fmt(hvR.d, 2)}${st >= 7 && Math.abs(hvR.w - hvR.d) > 1e-9 ? ` · w = ${fmt(hvR.w, 2)}` : ""}`
            : !hv.inFrame && st >= 2
              ? ` · ${t.legend.off}`
              : st >= 6 && hvR && !hvR.r
                ? ` · ${t.legend.nr}`
                : "",
        )
    : t.noHover;

  const legend: { fill: string; stroke: string; label: string }[] = GROUPS.map((g) => ({ fill: GC[g], stroke: GC[g], label: t.legend[g] }));
  if (st >= 2) legend.push({ fill: "var(--surface)", stroke: "var(--explained)", label: t.legend.off });
  if (st >= 3) legend.push({ fill: "var(--bg)", stroke: "var(--ink)", label: t.legend.samp });
  if (st >= 6) legend.push({ fill: "var(--bg)", stroke: "var(--residual)", label: t.legend.nr });

  // ── composition rows ──
  const compRow = (label: string, items: { g: string; w: number }[], weighted = false) => {
    const tot: Record<string, number> = {};
    let T = 0;
    items.forEach((x) => {
      tot[x.g] = (tot[x.g] ?? 0) + x.w;
      T += x.w;
    });
    return { label, n: weighted ? `Σw = ${fmt(T, 0)}` : `n = ${items.length}`, segs: GROUPS.map((g) => ({ g, pct: T ? (100 * (tot[g] ?? 0)) / T : 0 })) };
  };
  const ones = (us: { g: string }[]) => us.map((u) => ({ g: u.g, w: 1 }));
  const comp = [compRow(lang === "hu" ? "Populáció" : "Population", ones(pop.units))];
  if (st >= 2) comp.push(compRow(lang === "hu" ? "Keret" : "Frame", ones(pop.frame)));
  if (st === 3) comp.push(compRow(lang === "hu" ? "Minta" : "Sample", ones(sel.sample)));
  if (st === 6) {
    comp.push(compRow(lang === "hu" ? "Válaszolók" : "Respondents", ones(resp)));
    comp.push(compRow(lang === "hu" ? "Válaszolók (súlyozva)" : "Respondents (weighted)", resp.map((x) => ({ g: x.g, w: x.w })), true));
  }

  const v = { strip: st >= 5 && st <= 7, comp: st <= 3 || st === 6, hist: st === 4 || st === 7, se: st === 8, deff: st === 9, dist: st === 10 };
  const estLabel = pipe.adj !== "none" ? "HT/N" : t.est.ht;
  const X = (val: number) => 40 + (val / 100) * 680;

  // estimate strip
  const stripItems: { key: string; label: string; val: number | null; color: string; dash?: string; w: number }[] = [];
  if (P.showTruth) stripItems.push({ key: "truth", label: t.est.truth, val: pop.truth, color: "var(--ink)", dash: "3 3", w: 1.5 });
  stripItems.push({ key: "frame", label: t.est.frame, val: pop.frameMean, color: "var(--attention-ink)", w: 1.5 });
  if (est.n) {
    stripItems.push({ key: "unw", label: t.est.unw, val: est.unweighted, color: "var(--residual-ink)", w: 2.5 });
    stripItems.push({ key: "ht", label: estLabel, val: est.ht, color: "var(--explained-ink)", w: 2.5 });
    stripItems.push({ key: "hajek", label: t.est.hajek, val: est.hajek, color: "var(--model-ink)", w: 2.5 });
  }
  const strip = stripItems
    .filter((e): e is typeof e & { val: number } => e.val !== null)
    .sort((a, b) => a.val - b.val)
    .map((e, i) => ({ ...e, lvl: i % 5 }));

  // weights histogram
  const ws = resp.map((x) => x.w);
  const hBins = 20;
  const hHi = ws.length ? Math.max(...ws) * 1.05 : 1;
  const hCounts = new Array<number>(hBins).fill(0);
  ws.forEach((w) => (hCounts[Math.min(hBins - 1, Math.floor((w / hHi) * hBins))] += 1));
  const hMax = Math.max(1, ...hCounts);

  // SE rows
  const seRows = [
    { label: t.se.naive, method: nv.method, val: nv.se, fill: "var(--residual)" },
    { label: t.se.closed, method: cf.method, val: cf.se, fill: "var(--data)" },
    { label: t.se.lin, method: lin.method + (P.design === "twostage" ? (lang === "hu" ? " — kétlépcsős: ultimate-cluster közelítés" : " — two-stage: ultimate-cluster approximation") : ""), val: lin.se, fill: "var(--model)" },
  ];
  if (rep && rep.hajek.sd !== null) seRows.push({ label: t.se.sim, method: rep.method, val: rep.hajek.sd, fill: "var(--explained)" });
  const seMax = Math.max(1e-9, ...seRows.map((r) => r.val ?? 0));

  // sampling distribution
  const fm = pop.frameMean ?? pop.truth;
  const dlo = Math.max(0, fm - 12);
  const dhi = Math.min(100, fm + 12);
  const DX = (x: number) => 40 + ((x - dlo) / (dhi - dlo)) * 680;
  const dBins = 48;
  const dCounts = new Array<number>(dBins).fill(0);
  rep?.values.forEach((x) => (dCounts[Math.max(0, Math.min(dBins - 1, Math.floor(((x - dlo) / (dhi - dlo)) * dBins)))] += 1));
  const dMax = Math.max(1, ...dCounts);

  const piText =
    sel.info.pi !== undefined
      ? fmt(sel.info.pi, 3)
      : sel.info.nh && sel.info.Nh
        ? Object.entries(sel.info.nh)
            .map(([k, n]) => `${k}: ${fmt(n / (sel.info.Nh as Record<string, number>)[k], 2)}`)
            .join(" · ")
        : sel.info.a !== undefined
          ? `${sel.info.a}/${sel.info.A}${P.design === "twostage" ? " × m/M_i" : ""}`
          : "—";

  const readouts: Readout[] = [
    { label: "Ȳ", value: pop.truth },
    { label: "Ȳ_frame", value: pop.frameMean, tone: "attention" },
    { label: "N / N_frame", value: `${pop.N} / ${pop.frameN}`, tone: "muted" },
  ];
  if (st >= 3) readouts.push({ label: lang === "hu" ? "mintában" : "n sampled", value: String(sel.sample.length) }, { label: "π", value: piText, tone: "muted" });
  if (st >= 5)
    readouts.push(
      { label: t.est.unw, value: est.unweighted, tone: "residual" },
      { label: estLabel, value: est.ht, tone: "explained" },
      { label: t.est.hajek, value: est.hajek, tone: "model" },
      { label: "Σw", value: est.sumW, digits: 1, tone: "muted" },
    );
  if (st >= 6) readouts.push({ label: lang === "hu" ? "válaszolók" : "respondents", value: `${est.n} / ${sel.sample.length}` });
  if (st >= 8) readouts.push({ label: "SE naive", value: nv.se, digits: 3, tone: "residual" }, { label: "SE closed", value: cf.se, digits: 3, tone: "data" }, { label: "SE lin", value: lin.se, digits: 3, tone: "model" });
  if (st >= 9) readouts.push({ label: "deff", value: deff }, { label: "n_eff,w", value: kish, digits: 1, tone: "data" });
  if (st === 10 && rep)
    readouts.push(
      { label: "reps", value: String(rep.reps) },
      { label: "mean(ȳ_H)", value: rep.hajek.mean, tone: "explained" },
      { label: "SD(ȳ_H)", value: rep.hajek.sd, digits: 3, tone: "explained" },
      { label: "mean SE lin", value: rep.meanSeLin, digits: 3, tone: "model" },
      { label: lang === "hu" ? "torzítás vs Ȳ_keret" : "bias vs Ȳ_frame", value: rep.hajek.mean !== null && pop.frameMean !== null ? rep.hajek.mean - pop.frameMean : null, tone: "attention" },
      { label: lang === "hu" ? "torzítás vs Ȳ" : "bias vs Ȳ", value: rep.biasHajek },
    );

  const live = t.live
    .replace("{s}", String(st))
    .replace("{n}", String(est.n))
    .replace("{h}", fmt(est.hajek, 2))
    .replace("{se}", fmt(lin.se, 3));

  const newSample = () => {
    setSampleNo((k) => k + 1);
    setHover(null);
  };
  const ctl = t.ctl;

  const aside = (
    <>
      <Panel title={t.stages}>
        <ol className="grid grid-cols-2 gap-1" aria-label={t.stages}>
          {t.st.map((label, i) => (
            <li key={i}>
              <button
                type="button"
                aria-current={st === i + 1 ? "step" : undefined}
                onClick={() => {
                  set("stage", i + 1);
                  setHover(null);
                }}
                className={cn("flex w-full items-baseline gap-1.5 rounded-md px-2 py-1 text-left text-xs", st === i + 1 ? "bg-ink font-semibold text-bg" : "text-muted hover:bg-surface-2 hover:text-ink")}
              >
                <span className="font-mono tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
      </Panel>
      <Panel title={lang === "hu" ? "Beállítások" : "Settings"}>
        <div className="space-y-3">
          {st === 1 && (
            <>
              <ParameterControl label={`${t.legend.C} · ${ctl.shares}`} value={P.shareC} min={0.05} max={0.5} step={0.05} onChange={(x) => set("shareC", x)} param="shareC" format={(x) => fmt(x * 100, 0) + " %"} />
              <ParameterControl label={ctl.muC} value={P.muC} min={40} max={90} step={1} onChange={(x) => set("muC", x)} param="muC" />
              <ParameterControl label={ctl.icc} value={P.rho} min={0} max={0.5} step={0.05} onChange={(x) => set("rho", x)} param="rho" />
            </>
          )}
          {st === 2 && (
            <>
              <ParameterControl label={ctl.covC} value={P.covC} min={0.2} max={1} step={0.05} onChange={(x) => set("covC", x)} param="covC" format={(x) => fmt(x * 100, 0) + " %"} />
              <LabNote>{t.notes.frame}</LabNote>
            </>
          )}
          {st >= 3 && (
            <>
              <ChoiceControl<DesignKey>
                label={ctl.design}
                value={P.design}
                onChange={(x) => set("design", x)}
                param="design"
                options={[
                  { value: "srs", label: ctl.designOpts.srs },
                  { value: "stratified", label: ctl.designOpts.strat },
                  { value: "cluster", label: ctl.designOpts.cluster },
                  { value: "twostage", label: ctl.designOpts.twostage },
                ]}
              />
              {(P.design === "srs" || P.design === "stratified") && <ParameterControl label={ctl.n} value={P.n} min={30} max={300} step={10} onChange={(x) => set("n", x)} param="n" />}
              {P.design === "stratified" && (
                <ChoiceControl<Alloc>
                  label={ctl.alloc}
                  value={P.allocation === "disproportionate" ? "equal" : P.allocation}
                  onChange={(x) => set("allocation", x)}
                  param="allocation"
                  options={[
                    { value: "prop", label: ctl.allocOpts.prop },
                    { value: "equal", label: ctl.allocOpts.equal },
                  ]}
                />
              )}
              {(P.design === "cluster" || P.design === "twostage") && <ParameterControl label={ctl.a} value={P.a} min={2} max={12} step={1} onChange={(x) => set("a", x)} param="a" />}
              {P.design === "twostage" && <ParameterControl label={ctl.m} value={P.m} min={4} max={25} step={1} onChange={(x) => set("m", x)} param="m" />}
              <LabButton variant="primary" onClick={newSample}>
                {ctl.again}
              </LabButton>
            </>
          )}
          {st >= 6 && (
            <>
              <ChoiceControl<ResponseType>
                label={ctl.mech}
                value={P.nonresponse}
                onChange={(x) => set("nonresponse", x)}
                param="nonresponse"
                options={(["none", "mcar", "group", "outcome"] as const).map((k) => ({ value: k, label: ctl.mechOpts[k] }))}
              />
              {(P.nonresponse === "mcar" || P.nonresponse === "outcome") && <ParameterControl label={ctl.rate} value={P.rate} min={0.2} max={0.95} step={0.05} onChange={(x) => set("rate", x)} param="rate" format={(x) => fmt(x * 100, 0) + " %"} />}
              {P.nonresponse === "group" && <p className="text-xs text-muted">{lang === "hu" ? "Válaszadási arány: A 85 %, B 60 %, C 35 %" : "Response rates: A 85 %, B 60 %, C 35 %"}</p>}
              {P.nonresponse === "outcome" && <ParameterControl label={ctl.slope} value={P.slope} min={0} max={3} step={0.1} onChange={(x) => set("slope", x)} param="slope" />}
              {st === 6 && <LabNote>{t.notes.nr}</LabNote>}
            </>
          )}
          {st >= 7 && (
            <>
              <ChoiceControl<Adj>
                label={ctl.adjust}
                value={P.adjustment}
                onChange={(x) => set("adjustment", x)}
                param="adjustment"
                options={(["none", "poststrat", "raking"] as const).map((k) => ({ value: k, label: ctl.adjOpts[k] }))}
              />
              {st === 7 && <LabNote tone="info">{t.notes.adj}</LabNote>}
            </>
          )}
          {st === 9 && <LabNote>{t.notes.deff}</LabNote>}
          {st === 10 && (
            <>
              <div className="flex flex-wrap gap-2">
                <LabButton variant="primary" onClick={() => runRep(200)} disabled={busy}>
                  {ctl.run200}
                </LabButton>
                <LabButton variant="primary" onClick={() => runRep(1000)} disabled={busy}>
                  {ctl.run1000}
                </LabButton>
                <LabButton onClick={() => setRep(null)}>{ctl.clear}</LabButton>
              </div>
              <p className="text-xs text-muted" role="status">
                {busy ? (lang === "hu" ? "Szimuláció fut…" : "Simulating…") : rep ? `${rep.reps} ${lang === "hu" ? "ismétlés kész" : "repetitions done"}` : ""}
              </p>
              <LabNote>{t.notes.rep}</LabNote>
            </>
          )}
          {st >= 5 && <ToggleControl label={ctl.showTruth} checked={P.showTruth} onChange={(x) => set("showTruth", x)} param="showTruth" />}
          <SeedControl value={P.seed} onChange={(x) => set("seed", x)} />
        </div>
      </Panel>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
    </>
  );

  const demos: TeachDemo[] = [
    { title: t.st[1], note: t.lead[1], apply: () => setMany({ stage: 2, covC: 0.4 }) },
    { title: t.st[2], note: t.lead[2], apply: () => setMany({ stage: 3, design: "cluster", a: 6 }) },
    { title: t.st[5], note: t.lead[5], apply: () => setMany({ stage: 6, design: "srs", n: 300, nonresponse: "outcome", rate: 0.6, slope: 1.2 }) },
    { title: t.st[6], note: t.lead[6], apply: () => setMany({ stage: 7, design: "srs", n: 300, nonresponse: "group", adjustment: "raking" }) },
    { title: t.st[8], note: t.lead[8], apply: () => setMany({ stage: 9, design: "cluster", a: 6, rho: 0.3 }) },
  ];

  const validation = (
    <>
      {t.unvalidated}
      {pipe.adj !== "none" && st >= 7 && <strong className="ml-1 text-warn">{lang === "hu" ? "A jelenlegi SE korrekció utáni (nem validált)." : "The current SE is after adjustment (not validated)."}</strong>}
    </>
  );

  return (
    <LabShell
      lab={lab}
      title={t.title}
      subtitle={`${String(st).padStart(2, "0")} · ${t.title_[st - 1]}`}
      aside={aside}
      demos={demos}
      validation={validation}
      method={sel.info.method || (lang === "hu" ? "Véges populáció, ismert adatgeneráló folyamat" : "Finite population, known data-generating process")}
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.formula ? (lang === "hu" ? "Képlet" : "Formula") : ""}</h2>
          <p className="mt-2 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">{t.formula[st - 1]}</p>
          {st === 8 && <p className="mt-2 text-xs text-muted">{lin.method}</p>}
          {st === 5 && <p className="mt-2 text-xs text-muted">{lang === "hu" ? "A HT-átlag az ismert N_keret-tel oszt, ezért a keretet becsli, nem Ȳ-t." : "HT/N_frame estimates the frame mean, never Ȳ: that gap is coverage error."}</p>}
        </div>
      }
    >
      <div className="space-y-4">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[st - 1]}</p>
        <section aria-label={t.populationField}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {legend.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1">
                <svg width="12" height="12" aria-hidden>
                  <circle cx="6" cy="6" r="4.5" fill={l.fill} stroke={l.stroke} strokeWidth={1.5} />
                </svg>
                {l.label}
              </span>
            ))}
            <span className="ml-auto font-mono text-ink" aria-live="polite" data-testid="sws-unit">
              {unitInfo}
            </span>
          </div>
          <AccessibleVisualization
            summary={`${t.populationField} N = ${pop.N}; ${st >= 3 ? `n = ${sel.sample.length}` : ""} ${live}`}
            viewBox={`0 0 760 ${fieldH}`}
            onPointerUp={() => {}}
            table={
              st >= 3
                ? {
                    caption: lang === "hu" ? "Mintába került egységek" : "Sampled units",
                    columns: ["id", lang === "hu" ? "csoport" : "group", "PSU", "y", "π", "d", ...(st >= 6 ? [lang === "hu" ? "válaszolt" : "responded"] : []), ...(st >= 7 ? ["w"] : [])],
                    rows: pipe.resp0.map((x) => {
                      const r = respMap.get(x.id) as WeightedResp;
                      return [x.id + 1, x.g, x.psu + 1, fmt(x.y, 1), fmt(x.pi, 3), fmt(x.d, 2), ...(st >= 6 ? [x.r ? "✓" : "—"] : []), ...(st >= 7 ? [x.r ? fmt(r.w, 2) : "—"] : [])];
                    }),
                  }
                : {
                    caption: lang === "hu" ? "Csoportok" : "Groups",
                    columns: [lang === "hu" ? "csoport" : "group", "N_g", lang === "hu" ? "átlag" : "mean", lang === "hu" ? "keretben" : "on frame"],
                    rows: GROUPS.map((g) => [g, pop.groupN[g] ?? 0, fmt(pop.groupMean[g], 2), pop.frame.filter((u) => u.g === g).length]),
                  }
            }
          >
            {byC.map((_, c) => {
              const bx = (c % 5) * colW + 2;
              const by = Math.floor(c / 5) * rowH + 2;
              const isPSU = clusterDesign && pickedPSU.has(c);
              return (
                <g key={c} aria-hidden>
                  <rect x={bx} y={by} width={colW - 6} height={rowH - 6} rx={6} fill={isPSU ? "color-mix(in srgb, var(--model) 14%, var(--surface))" : "var(--surface-2)"} stroke={isPSU ? "var(--model-ink)" : "var(--grid)"} strokeDasharray={clusterDesign ? undefined : "3 3"} />
                  <text x={bx + 6} y={by + 11} fontSize={9} fill="var(--faint)">
                    PSU {c + 1}
                  </text>
                </g>
              );
            })}
            {pop.units.map((u) => {
              const p = pos.get(u.id) as { cx: number; cy: number };
              const r = respMap.get(u.id);
              const inS = sampled.has(u.id);
              const responded = !!r && r.r;
              let fill = GC[u.g];
              let stroke = GC[u.g];
              let sw = 1;
              let op = 1;
              let rad = 4.5;
              if (!u.inFrame && st >= 2) {
                fill = "var(--surface)";
                op = 0.7;
              }
              if (st >= 3 && inS) {
                stroke = "var(--ink)";
                sw = 2;
              } else if (st >= 3) op = Math.min(op, 0.35);
              if (st >= 6 && inS && !responded) {
                op = 0.25;
                stroke = "var(--residual)";
                sw = 1.5;
              }
              if (st >= 4 && inS && responded && r) rad = 3 + 4.5 * Math.sqrt(r.w / wMax);
              return <circle key={u.id} cx={p.cx} cy={p.cy} r={rad} fill={fill} stroke={stroke} strokeWidth={sw} opacity={op} onPointerEnter={() => setHover(u.id)} aria-hidden />;
            })}
            {hv && <circle cx={(pos.get(hv.id) as { cx: number }).cx} cy={(pos.get(hv.id) as { cy: number }).cy} r={9} fill="none" stroke="var(--attention)" strokeWidth={2} aria-hidden />}
          </AccessibleVisualization>
          <label className="mt-2 flex items-center gap-2 text-xs text-muted">
            {lang === "hu" ? "Egység vizsgálata (id)" : "Inspect unit (id)"}
            <input
              type="number"
              min={1}
              max={pop.N}
              value={hover === null ? "" : hover + 1}
              onChange={(e) => {
                const k = Math.round(+e.target.value) - 1;
                setHover(k >= 0 && k < pop.N ? k : null);
              }}
              className="w-20 rounded-md border border-line bg-surface px-2 py-1 font-mono text-ink"
            />
          </label>
        </section>

        <section aria-label={t.sec[st - 1]} className="rounded-xl border border-line bg-surface p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.sec[st - 1]}</h2>
          {v.comp && (
            <div className="mt-2 space-y-1.5">
              {comp.map((row) => (
                <div key={row.label} className="grid grid-cols-[9rem_1fr_5.5rem] items-center gap-2 text-xs">
                  <span className="text-ink">{row.label}</span>
                  <div className="flex h-4 overflow-hidden rounded" role="img" aria-label={`${row.label}: ${row.segs.map((s) => `${s.g} ${fmt(s.pct, 1)} %`).join(", ")}`}>
                    {row.segs.map((s) => (
                      <div key={s.g} style={{ width: `${s.pct}%`, background: GC[s.g] }} title={`${s.g}: ${fmt(s.pct, 1)} %`} className="h-full border-r border-surface" />
                    ))}
                  </div>
                  <span className="text-right font-mono tabular-nums text-muted">{row.n}</span>
                </div>
              ))}
            </div>
          )}
          {v.strip && (
            <AccessibleVisualization
              summary={strip.map((e) => `${e.label} = ${fmt(e.val, 2)}`).join("; ")}
              viewBox="0 0 760 110"
              table={{ caption: t.sec[4], columns: [lang === "hu" ? "becslés" : "estimate", lang === "hu" ? "érték" : "value"], rows: strip.map((e) => [e.label, fmt(e.val, 2)]) }}
            >
              {strip.map((e) => (
                <g key={e.key}>
                  <line x1={X(e.val)} x2={X(e.val)} y1={10 + e.lvl * 16} y2={92} stroke={e.color} strokeWidth={e.w} strokeDasharray={e.dash} />
                  <text x={X(e.val) + (e.val > 75 ? -4 : 4)} y={12 + e.lvl * 16 + 10} fontSize={10} fill={e.color} textAnchor={e.val > 75 ? "end" : "start"} paintOrder="stroke" stroke="var(--surface)" strokeWidth={3}>
                    {e.label} = {fmt(e.val, 2)}
                  </text>
                </g>
              ))}
              <line x1={40} x2={720} y1={92} y2={92} stroke="var(--border)" />
              {Array.from({ length: 11 }, (_, i) => (
                <text key={i} x={X(i * 10)} y={105} fontSize={9} fill="var(--faint)" textAnchor="middle" aria-hidden>
                  {i * 10}
                </text>
              ))}
            </AccessibleVisualization>
          )}
          {v.hist && (
            <AccessibleVisualization
              summary={`Σw = ${fmt(est.sumW, 1)}, n = ${est.n}, n_eff,w = ${fmt(kish, 1)}`}
              viewBox="0 0 760 112"
              table={{ caption: t.sec[st - 1], columns: [lang === "hu" ? "súly" : "weight", lang === "hu" ? "darab" : "count"], rows: hCounts.map((c, i) => [`${fmt((i * hHi) / hBins, 2)}–${fmt(((i + 1) * hHi) / hBins, 2)}`, c]) }}
            >
              <text x={40} y={12} fontSize={10} fill="var(--muted)">
                Σw = {fmt(est.sumW, 1)} · n = {est.n} · n_eff,w = {fmt(kish, 1)}
                {rakeInfo ? ` · raking ${rakeInfo.iterations} it.${rakeInfo.converged ? "" : " (not converged)"}` : ""}
              </text>
              {hCounts.map((c, i) => (
                <rect key={i} x={40 + i * (680 / hBins) + 1} y={92 - (c / hMax) * 72} width={680 / hBins - 2} height={(c / hMax) * 72} fill={st === 7 && P.adjustment !== "none" ? "var(--explained)" : "var(--data)"} rx={1} />
              ))}
              <line x1={40} x2={720} y1={92} y2={92} stroke="var(--border)" />
              {hCounts.map((_, i) =>
                i % 4 === 0 ? (
                  <text key={i} x={40 + (i + 0.5) * (680 / hBins)} y={105} fontSize={9} fill="var(--faint)" textAnchor="middle" aria-hidden>
                    {fmt(((i + 0.5) * hHi) / hBins, 1)}
                  </text>
                ) : null,
              )}
            </AccessibleVisualization>
          )}
          {v.se && (
            <table className="mt-2 w-full text-left text-xs">
              <caption className="sr-only">{t.sec[7]}</caption>
              <tbody>
                {seRows.map((r) => (
                  <tr key={r.label} className="border-t border-line align-top">
                    <th scope="row" className="w-32 py-1.5 pr-2 font-medium text-ink">
                      {r.label}
                    </th>
                    <td className="py-1.5">
                      <div className="h-3 rounded" style={{ width: `${r.val === null ? 0 : (100 * r.val) / seMax}%`, background: r.val === null ? "var(--line)" : r.fill }} aria-hidden />
                      <div className="mt-0.5 text-[11px] text-faint">{r.method}</div>
                    </td>
                    <td className="w-16 py-1.5 text-right font-mono tabular-nums text-ink">{fmt(r.val, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {v.deff && (
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                { k: "deff", v: fmt(deff, 2), note: deff === null ? "—" : deff > 1 ? (lang === "hu" ? "a terv kevésbé pontos, mint egy azonos n-ű EVM" : "this design is less precise than SRS of the same n") : lang === "hu" ? "a terv pontosabb, mint egy azonos n-ű EVM" : "this design is more precise than SRS of the same n" },
                { k: "n", v: String(est.n), note: lang === "hu" ? "névleges válaszolói létszám" : "nominal respondent count" },
                { k: "n_eff = n/deff", v: fmt(deff ? est.n / deff : null, 1), note: lang === "hu" ? "ennyi EVM-egység adna azonos pontosságot" : "SRS size with the same precision" },
                { k: "n_eff,w (Kish)", v: fmt(kish, 1), note: lang === "hu" ? "csak a súlyok egyenlőtlensége; nem a klaszterezés" : "unequal weights only; ignores clustering and stratification" },
              ].map((c) => (
                <div key={c.k} className="rounded-lg bg-surface-2 px-3 py-2">
                  <dt className="text-xs text-muted">{c.k}</dt>
                  <dd className="font-mono text-xl tabular-nums text-ink">{c.v}</dd>
                  <dd className="text-[11px] text-faint">{c.note}</dd>
                </div>
              ))}
            </dl>
          )}
          {v.dist && (
            <AccessibleVisualization
              summary={rep ? `${rep.reps} reps; mean ${fmt(rep.hajek.mean, 2)}, SD ${fmt(rep.hajek.sd, 3)}; Ȳ ${fmt(pop.truth, 2)}, Ȳ_frame ${fmt(pop.frameMean, 2)}` : t.sec[9]}
              viewBox="0 0 760 140"
              table={rep ? { caption: t.sec[9], columns: [lang === "hu" ? "sáv" : "bin", lang === "hu" ? "darab" : "count"], rows: dCounts.map((c, i) => [`${fmt(dlo + ((dhi - dlo) * i) / dBins, 2)}–${fmt(dlo + ((dhi - dlo) * (i + 1)) / dBins, 2)}`, c]) } : undefined}
            >
              {dCounts.map((c, i) => (
                <rect key={i} x={40 + i * (680 / dBins) + 0.5} y={122 - (c / dMax) * 108} width={680 / dBins - 1} height={(c / dMax) * 108} fill="var(--explained)" fillOpacity={0.8} />
              ))}
              {P.showTruth && <line x1={DX(pop.truth)} x2={DX(pop.truth)} y1={8} y2={122} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="3 3" />}
              <line x1={DX(fm)} x2={DX(fm)} y1={8} y2={122} stroke="var(--attention-ink)" strokeWidth={1.5} />
              <line x1={40} x2={720} y1={122} y2={122} stroke="var(--border)" />
              {Array.from({ length: 9 }, (_, i) => (
                <text key={i} x={DX(dlo + ((dhi - dlo) * i) / 8)} y={135} fontSize={9} fill="var(--faint)" textAnchor="middle" aria-hidden>
                  {fmt(dlo + ((dhi - dlo) * i) / 8, 0)}
                </text>
              ))}
              {!rep && (
                <text x={380} y={70} fontSize={12} fill="var(--muted)" textAnchor="middle">
                  {lang === "hu" ? "Futtass ismétléseket a mintavételi eloszláshoz." : "Run repetitions to build the sampling distribution."}
                </text>
              )}
            </AccessibleVisualization>
          )}
        </section>
        <p className="text-xs text-faint">{t.synthetic}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </LabShell>
  );
}

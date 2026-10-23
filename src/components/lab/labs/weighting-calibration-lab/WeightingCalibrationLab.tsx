"use client";

// Weighting & Calibration Lab. Port of "QDA2 Weighting Calibration Lab.dc.html", rebuilt on an R-equivalent
// calibration engine (engine calibration.ts): margin bars with a Newton-step stepper and log, the
// distribution of g = w/d, estimates and calibration variances per outcome, and the bias over repeated
// samples (which calibration removes only when nonresponse runs through the auxiliaries).
import { fmt } from "@/lib/engine/format";
import { mean, sum } from "@/lib/engine/numeric";
import { mulberry32 } from "@/lib/engine/rng";
import { cn } from "@/lib/cn";
import { useMemo, useState } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl, ToggleControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { adjust, AGEG, AUX, biasSim, drawRespondents, EDU, makeCalPopulation, N_POP, N_SAMPLE, OUTCOMES, outcomeRows, REG, type Aux, type Method, type Outcome } from "./model";
import { WC_T } from "./strings";

export interface WcParams extends Record<string, unknown> {
  auxiliaries: Aux[];
  method: Method;
  bounds: [number, number];
  rr: number[];
  east: number;
  mnar: boolean;
  step: number;
  hideVar: boolean;
  outcome: Outcome;
  draw: number;
  seed: number;
}
const METHODS: Method[] = ["poststrat", "raking", "linear", "bounded"];
const DEFAULTS: WcParams = { auxiliaries: ["edu", "region", "age"], method: "raking", bounds: [0.6, 2], rr: [0.4, 0.6, 0.9], east: 0.8, mnar: false, step: 0, hideVar: false, outcome: "trust", draw: 0, seed: 2026 };
const REPS = 200;
// SVG coordinates are rounded: server (Node) and browser Math.exp may differ in the last bit, which would break hydration.
const r2 = (v: number) => Math.round(v * 100) / 100;
const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function normalizeWc(p: WcParams): WcParams {
  const aux = Array.isArray(p.auxiliaries) ? AUX.filter((a) => p.auxiliaries.includes(a)) : DEFAULTS.auxiliaries;
  const b = Array.isArray(p.bounds) && p.bounds.length === 2 && p.bounds.every(fin) ? p.bounds : DEFAULTS.bounds;
  const L = Math.min(1, Math.max(0.05, b[0]));
  const U = Math.max(1, Math.min(10, b[1]));
  const rr = Array.isArray(p.rr) && p.rr.length === 3 && p.rr.every(fin) ? p.rr.map((v) => Math.min(1, Math.max(0.1, v))) : DEFAULTS.rr;
  return {
    ...p,
    auxiliaries: aux,
    method: METHODS.includes(p.method) ? p.method : DEFAULTS.method,
    bounds: [L, U],
    rr,
    east: fin(p.east) ? Math.min(1.2, Math.max(0.3, p.east)) : DEFAULTS.east,
    mnar: p.mnar === true,
    step: Number.isInteger(p.step) && p.step >= 0 && p.step <= 100 ? p.step : 0,
    hideVar: p.hideVar === true,
    outcome: (OUTCOMES as readonly string[]).includes(p.outcome) ? p.outcome : DEFAULTS.outcome,
    draw: Number.isInteger(p.draw) && p.draw >= 0 ? p.draw : 0,
    seed: Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed,
  };
}

export default function WeightingCalibrationLab(props: LabProps) {
  const lab = useLab<WcParams>("weighting-calibration-lab", DEFAULTS, { ...props, normalize: normalizeWc });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = WC_T[lang];
  const pop = useMemo(() => makeCalPopulation(P.seed), [P.seed]);
  const nr = useMemo(() => ({ rr: P.rr, east: P.east, mnar: P.mnar }), [P.rr, P.east, P.mnar]);
  const { resp, d } = useMemo(() => drawRespondents(pop, nr, mulberry32(P.seed * 7 + P.draw + 1)), [pop, nr, P.seed, P.draw]);
  const iterative = P.method === "raking" || P.method === "bounded";
  const step = iterative && P.step > 0 ? P.step : null;
  const adj = useMemo(() => adjust(pop, resp, d, P.auxiliaries, P.method, P.bounds, step), [pop, resp, d, P.auxiliaries, P.method, P.bounds, step]);
  const rows = useMemo(() => outcomeRows(pop, resp, d, P.auxiliaries, P.method, adj), [pop, resp, d, P.auxiliaries, P.method, adj]);
  const sim = useMemo(() => biasSim(pop, nr, P.auxiliaries, P.method, P.bounds, REPS, P.seed + 11), [pop, nr, P.auxiliaries, P.method, P.bounds, P.seed]);
  const [pick, setPick] = useState<Outcome | null>(null);
  const [revealed, setRevealed] = useState(false);
  const showVar = !P.hideVar || revealed;

  const g = adj.w.map((w) => w / d);
  const kish = adj.ok ? sum(adj.w) ** 2 / sum(adj.w.map((w) => w * w)) : null;
  const status = !P.auxiliaries.length
    ? t.noAux
    : !adj.ok
      ? adj.reason === "empty"
        ? t.empty
        : t.singular
      : !iterative
        ? t.oneStep
        : adj.converged
          ? t.converged.replace("{k}", String(adj.iterations))
          : step !== null
            ? t.notYet.replace("{k}", String(adj.iterations))
            : t.failed;
  const bad = !adj.ok || (iterative && !adj.converged && step === null) || adj.negative > 0;

  // margin rows: weighted count now, before adjustment, and the population count
  type MRow = { label: string; now: number; before: number; target: number };
  const dims: { name: string; rows: MRow[] }[] = [];
  const tally = (key: (p: (typeof resp)[number]) => number, k: number, ws: number[]) => sum(resp.map((p, i) => (key(p) === k ? ws[i] : 0)));
  const dv = resp.map(() => d);
  if (P.auxiliaries.includes("edu")) dims.push({ name: t.auxNames.edu, rows: EDU.map((e, k) => ({ label: t.edu[e], now: tally((p) => p.edu, k, adj.w), before: tally((p) => p.edu, k, dv), target: pop.eduN[k] })) });
  if (P.auxiliaries.includes("region")) dims.push({ name: t.auxNames.region, rows: REG.map((r, k) => ({ label: t.reg[r], now: tally((p) => p.reg, k, adj.w), before: tally((p) => p.reg, k, dv), target: pop.regN[k] })) });
  if (P.auxiliaries.includes("age") && P.method === "poststrat") dims.push({ name: t.auxNames.age, rows: AGEG.map((a, k) => ({ label: t.ageG[a], now: tally((p) => p.ageG, k, adj.w), before: tally((p) => p.ageG, k, dv), target: pop.ageGN[k] })) });
  const meanAge = P.auxiliaries.includes("age") && P.method !== "poststrat" ? { now: sum(resp.map((p, i) => p.age * adj.w[i])) / sum(adj.w), before: mean(resp.map((p) => p.age)) as number, target: pop.ageTotal / N_POP } : null;
  const mRows = dims.flatMap((dm) => dm.rows.map((r, j) => ({ ...r, dim: j === 0 ? dm.name : "" })));
  const mMax = Math.max(1, ...mRows.map((r) => Math.max(r.target, r.now, r.before))) * 1.08;
  const MX = (v: number) => r2(150 + (v / mMax) * 330);
  const mH = mRows.length * 26 + 28;

  // g histogram
  const gLo = Math.min(...g, 1, P.method === "bounded" ? P.bounds[0] : 1);
  const gHi = Math.max(...g, 1, P.method === "bounded" ? P.bounds[1] : 1);
  const span = gHi - gLo || 1;
  const lo = gLo - span * 0.05;
  const hi = gHi + span * 0.05;
  const BINS = 30;
  const counts = new Array<number>(BINS).fill(0);
  g.forEach((v) => counts[Math.min(BINS - 1, Math.max(0, Math.floor(((v - lo) / (hi - lo)) * BINS)))]++);
  const cMax = Math.max(1, ...counts);
  const GX = (v: number) => r2(30 + ((v - lo) / (hi - lo)) * 460);
  const GY = (c: number) => r2(150 - (c / cMax) * 130);

  // strip for the focus outcome
  const fr = rows.find((r) => r.outcome === P.outcome)!;
  const ysF = resp.map((p) => p.y[P.outcome]);
  const seU = ysF.length > 1 ? Math.sqrt(sum(ysF.map((y) => (y - fr.unweighted) ** 2)) / (ysF.length - 1) / ysF.length) : null;
  const strip = [
    { label: t.unweighted, v: fr.unweighted, se: seU, color: "var(--residual)", ink: "var(--residual-ink)" },
    { label: t.calibrated, v: fr.calibrated, se: showVar ? fr.seCal : null, color: "var(--model)", ink: "var(--model-ink)" },
    { label: t.model, v: fr.model, se: null, color: "var(--explained)", ink: "var(--explained-ink)" },
  ];
  const sv = [fr.truth, ...strip.flatMap((s) => (s.v === null ? [] : [s.v - 1.96 * (s.se ?? 0), s.v + 1.96 * (s.se ?? 0)]))];
  const sLo = Math.min(...sv);
  const sHi = Math.max(...sv);
  const sPad = (sHi - sLo || 1) * 0.15;
  const SX = (v: number) => r2(150 + ((v - sLo + sPad) / (sHi - sLo + 2 * sPad)) * 340);

  const vr = rows.map((r) => (r.seCal !== null && r.seNaive ? 1 - (r.seCal / r.seNaive) ** 2 : null));
  const best = rows[vr.reduce<number>((bi, v, i) => ((v ?? -Infinity) > (vr[bi] ?? -Infinity) ? i : bi), 0)].outcome;

  const readouts: Readout[] = [
    { label: t.respondents, value: `${resp.length} / ${N_SAMPLE}` },
    { label: t.sumW, value: `${fmt(sum(adj.w), 0)} / ${N_POP}` },
    { label: t.kish, value: kish === null ? "—" : fmt(kish, 1), tone: "explained" },
    { label: t.gRange, value: `${fmt(Math.min(...g), 2)} … ${fmt(Math.max(...g), 2)}` },
    { label: t.negative, value: String(adj.negative), tone: adj.negative ? "attention" : "muted" },
  ];
  const live = t.live.replace("{o}", t.outcomeShort[P.outcome]).replace("{e}", fr.calibrated === null ? "—" : fmt(fr.calibrated, 2)).replace("{t}", fmt(fr.truth, 2));
  const auxLocked = locked("auxiliaries");
  const toggleAux = (a: Aux, on: boolean) => setMany({ auxiliaries: AUX.filter((x) => (x === a ? on : P.auxiliaries.includes(x))), step: 0 });

  const demos: TeachDemo[] = [
    { title: t.methods.poststrat, note: t.insight.poststrat, apply: () => setMany({ method: "poststrat", auxiliaries: ["edu"], mnar: false, step: 0 }) },
    { title: t.methods.raking, note: t.insight.raking, apply: () => setMany({ method: "raking", auxiliaries: ["edu", "region", "age"], step: 1 }) },
    { title: "GREG", note: t.insight.linear, apply: () => setMany({ method: "linear", auxiliaries: ["edu", "region", "age"], mnar: false, step: 0 }) },
    { title: "MNAR", note: lang === "hu" ? "Ha a válaszadás magától a kimenettől függ, a megfigyelt segédváltozókra való kalibrálás nem tünteti el a torzítást." : "When response depends on the outcome itself, calibrating on observed auxiliaries cannot remove the bias.", apply: () => setMany({ method: "linear", auxiliaries: ["edu", "region", "age"], mnar: true, step: 0 }) },
  ];

  const aside = (
    <>
      <Panel title={t.method}>
        <div className="space-y-3">
          <ChoiceControl<Method> label={t.method} hideLabel param="method" size="sm" value={P.method} onChange={(v) => setMany({ method: v, step: 0 })} options={METHODS.map((m) => ({ value: m, label: t.methods[m] }))} />
          <fieldset>
            <legend className="text-sm font-medium text-ink">{t.aux}</legend>
            <div className="mt-1 space-y-1">
              {AUX.map((a) => (
                <ToggleControl key={a} label={t.auxNames[a]} checked={P.auxiliaries.includes(a)} disabled={auxLocked} onChange={(on) => toggleAux(a, on)} />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">{t.auxNote}</p>
          </fieldset>
          {P.method === "bounded" && (
            <>
              <ParameterControl label={t.lower} param="bounds" value={P.bounds[0]} min={0.1} max={1} step={0.05} onChange={(v) => setMany({ bounds: [Math.round(v * 100) / 100, P.bounds[1]], step: 0 })} />
              <ParameterControl label={t.upper} param="bounds" value={P.bounds[1]} min={1} max={4} step={0.05} onChange={(v) => setMany({ bounds: [P.bounds[0], Math.round(v * 100) / 100], step: 0 })} />
            </>
          )}
        </div>
      </Panel>
      <Panel title={t.nonresponse}>
        <div className="space-y-3">
          {EDU.map((e, k) => (
            <ParameterControl key={e} label={t.rr.replace("{g}", t.edu[e])} param="rr" value={P.rr[k]} min={0.1} max={1} step={0.05} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => setMany({ rr: P.rr.map((x, j) => (j === k ? Math.round(v * 100) / 100 : x)), step: 0 })} />
          ))}
          <ParameterControl label={t.east} param="east" value={P.east} min={0.3} max={1.2} step={0.05} onChange={(v) => setMany({ east: Math.round(v * 100) / 100, step: 0 })} />
          <ToggleControl label={t.mnar} param="mnar" checked={P.mnar} onChange={(v) => setMany({ mnar: v, step: 0 })} />
          <p className="text-xs text-muted">{t.ageNote}</p>
          <div className="flex flex-wrap items-center gap-2">
            <LabButton variant="primary" onClick={() => setMany({ draw: P.draw + 1, step: 0 })}>
              {t.redraw}
            </LabButton>
            <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
          </div>
        </div>
      </Panel>
      <Panel title={t.readouts}>
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
      method={t.methodNote}
      validation={t.validation}
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula[P.method].map((f) => (
              <span key={f}>{f}</span>
            ))}
            <span>{t.varFormula}</span>
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight[P.method]}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[P.method]}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
        <div className="grid gap-4 xl:grid-cols-2">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.margins}</h2>
            <p className="text-xs text-muted">{t.marginsNote}</p>
            {mRows.length > 0 ? (
              <AccessibleVisualization
                viewBox={`0 0 520 ${mH}`}
                summary={`${t.margins}: ${mRows.map((r) => `${r.label} Σw = ${fmt(r.now, 0)} / N = ${r.target}`).join("; ")}.`}
                table={{ caption: t.margins, columns: ["", "Σd", "Σw", "N_c"], rows: mRows.map((r) => [r.label, fmt(r.before, 0), fmt(r.now, 0), r.target]) }}
              >
                {mRows.map((r, i) => {
                  const y = 8 + i * 26;
                  const ok = Math.abs(r.now - r.target) < 0.5;
                  return (
                    <g key={i}>
                      {r.dim && (
                        <text x={4} y={y + 13} fontSize={10} fontWeight={600} fill="var(--muted)">
                          {r.dim}
                        </text>
                      )}
                      <text x={144} y={y + 13} textAnchor="end" fontSize={11} fill="var(--ink)">
                        {r.label}
                      </text>
                      <rect x={150} y={y + 2} width={MX(r.before) - 150} height={14} rx={2} fill="var(--border)" />
                      <rect x={150} y={y + 6} width={MX(r.now) - 150} height={10} rx={2} fill={ok ? "var(--explained)" : "var(--attention)"} />
                      <line x1={MX(r.target)} x2={MX(r.target)} y1={y} y2={y + 20} stroke="var(--ink)" strokeWidth={2} />
                      <text x={Math.min(MX(Math.max(r.now, r.target)) + 6, 516)} y={y + 14} fontSize={9} fill={ok ? "var(--explained-ink)" : "var(--attention-ink)"} className="font-mono" textAnchor={MX(Math.max(r.now, r.target)) + 6 > 440 ? "end" : "start"}>
                        {fmt(r.now, 0)} / {fmt(r.target, 0)}
                      </text>
                    </g>
                  );
                })}
              </AccessibleVisualization>
            ) : (
              <LabNote tone="info">{t.noAux}</LabNote>
            )}
            {meanAge && (
              <p className="mt-1 font-mono text-xs text-ink">
                {t.meanAge}: {fmt(meanAge.before, 1)} → {fmt(meanAge.now, 1)} · N: {fmt(meanAge.target, 1)}
              </p>
            )}
            <div className="mt-2 rounded-lg border border-line bg-surface p-3 text-sm" data-testid="calib-status">
              <p className={cn("font-medium", bad ? "text-attention-ink" : "text-ink")}>{status}</p>
              {iterative && P.auxiliaries.length > 0 && (
                <>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <LabButton disabled={(step ?? adj.iterations) <= 1} onClick={() => set("step", Math.max(1, (step ?? adj.iterations) - 1))}>
                      ← {t.stepBack}
                    </LabButton>
                    <span className="font-mono text-xs text-muted">
                      {t.step} {adj.iterations}
                    </span>
                    <LabButton disabled={step === null || adj.converged} onClick={() => set("step", (step ?? 0) + 1)}>
                      {t.stepFwd} →
                    </LabButton>
                    <LabButton disabled={step === null} onClick={() => set("step", 0)}>
                      {t.stepEnd}
                    </LabButton>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted">{t.logTitle}</summary>
                    <ol className="mt-1 max-h-40 overflow-auto font-mono text-xs text-ink">
                      {adj.log.map((e, k) => (
                        <li key={k}>{t.logLine.replace("{k}", String(k + 1)).replace("{e}", e.toExponential(2))}</li>
                      ))}
                    </ol>
                  </details>
                </>
              )}
            </div>
          </section>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.weights}</h2>
            <p className="text-xs text-muted">{t.weightsNote}</p>
            <AccessibleVisualization
              viewBox="0 0 520 180"
              summary={`${t.weights}: g from ${fmt(Math.min(...g), 2)} to ${fmt(Math.max(...g), 2)}; Kish n_eff ${kish === null ? "—" : fmt(kish, 1)} of ${resp.length}.`}
              table={{ caption: t.weights, columns: ["g", "n"], rows: counts.map((c, i) => [`${fmt(lo + ((hi - lo) * i) / BINS, 2)}–${fmt(lo + ((hi - lo) * (i + 1)) / BINS, 2)}`, c]).filter((r) => r[1] !== 0) }}
            >
              {counts.map((c, i) => (
                <rect key={i} x={GX(lo + ((hi - lo) * i) / BINS) + 0.5} y={GY(c)} width={r2(Math.max(1, 460 / BINS - 1))} height={150 - GY(c)} fill="var(--model)" fillOpacity={0.75} />
              ))}
              <line x1={30} x2={490} y1={150} y2={150} stroke="var(--border-strong)" />
              <line x1={GX(1)} x2={GX(1)} y1={14} y2={150} stroke="var(--ink)" strokeDasharray="4 3" />
              {P.method === "bounded" &&
                P.bounds.map((b, i) => <line key={i} x1={GX(b)} x2={GX(b)} y1={14} y2={150} stroke="var(--attention)" strokeWidth={2} />)}
              {[gLo, 1, gHi].map((v, i) => (
                <text key={i} x={GX(v)} y={166} textAnchor="middle" fontSize={9} fill="var(--muted)" className="font-mono">
                  {fmt(v, 2)}
                </text>
              ))}
              <text x={486} y={14} textAnchor="end" fontSize={10} fill="var(--model-ink)" className="font-mono">
                n_eff = {kish === null ? "—" : fmt(kish, 1)} / {resp.length}
              </text>
            </AccessibleVisualization>
          </section>
        </div>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.outcomes}</h2>
          {P.hideVar && !revealed && (
            <div className="mt-2 rounded-lg border border-line bg-surface p-3">
              <ChoiceControl<Outcome> label={t.predictQ} size="sm" value={pick ?? ("" as Outcome)} onChange={(v) => setPick(v)} options={OUTCOMES.map((o) => ({ value: o, label: t.outcomeShort[o] }))} />
              <LabButton className="mt-2" variant="primary" disabled={!pick} onClick={() => setRevealed(true)}>
                {t.reveal}
              </LabButton>
            </div>
          )}
          {P.hideVar && revealed && pick && (
            <p className="mt-2 text-sm text-ink" role="status">
              {t.yourPick.replace("{o}", t.outcomeShort[pick]).replace("{b}", t.outcomeShort[best])}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[640px] text-sm" data-testid="outcome-table">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-1 font-medium">{lang === "hu" ? "kimenet" : "outcome"}</th>
                  <th className="py-1 text-right font-medium">{t.truth}</th>
                  <th className="py-1 text-right font-medium">{t.unweighted}</th>
                  <th className="py-1 text-right font-medium">{t.calibrated}</th>
                  <th className="py-1 text-right font-medium">{t.model}</th>
                  <th className="py-1 text-right font-medium">{t.seNaive}</th>
                  <th className="py-1 text-right font-medium">{t.seCal}</th>
                  <th className="py-1 text-right font-medium">{t.varRed}</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {rows.map((r, i) => (
                  <tr key={r.outcome} className="border-t border-line">
                    <td className="py-1 font-sans">{t.outcomeNames[r.outcome]}</td>
                    <td className="py-1 text-right">{fmt(r.truth, 2)}</td>
                    <td className="py-1 text-right">{fmt(r.unweighted, 2)}</td>
                    <td className="py-1 text-right">{r.calibrated === null ? "—" : fmt(r.calibrated, 2)}</td>
                    <td className="py-1 text-right">{r.model === null ? "—" : fmt(r.model, 2)}</td>
                    <td className="py-1 text-right">{!showVar ? "?" : r.seNaive === null ? "—" : fmt(r.seNaive, 3)}</td>
                    <td className="py-1 text-right">{!showVar ? "?" : r.seCal === null ? "—" : fmt(r.seCal, 3)}</td>
                    <td className="py-1 text-right">{!showVar ? "?" : vr[i] === null ? "—" : `${vr[i]! >= 0 ? "−" : "+"}${fmt(Math.abs(vr[i]!) * 100, 0)} %`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.strip.replace("{o}", t.outcomeShort[P.outcome])}</h2>
              <ChoiceControl<Outcome> label={t.focus} hideLabel size="sm" param="outcome" value={P.outcome} onChange={(v) => set("outcome", v)} options={OUTCOMES.map((o) => ({ value: o, label: t.outcomeShort[o] }))} />
            </div>
            <AccessibleVisualization
              viewBox="0 0 520 150"
              summary={`${t.strip.replace("{o}", t.outcomeShort[P.outcome])}: ${t.truth} ${fmt(fr.truth, 2)}; ${strip.map((s) => `${s.label} ${s.v === null ? "—" : fmt(s.v, 2)}`).join("; ")}.`}
            >
              <line x1={SX(fr.truth)} x2={SX(fr.truth)} y1={10} y2={124} stroke="var(--ink)" strokeDasharray="4 3" />
              <text x={SX(fr.truth)} y={140} textAnchor="middle" fontSize={10} fill="var(--ink)" className="font-mono">
                Ȳ = {fmt(fr.truth, 2)}
              </text>
              {strip.map((s, i) => {
                const y = 26 + i * 36;
                return (
                  <g key={i}>
                    <text x={144} y={y + 4} textAnchor="end" fontSize={11} fill={s.ink}>
                      {s.label}
                    </text>
                    {s.v !== null && s.se !== null && <line x1={SX(s.v - 1.96 * s.se)} x2={SX(s.v + 1.96 * s.se)} y1={y} y2={y} stroke={s.color} strokeWidth={3} />}
                    {s.v !== null && <circle cx={SX(s.v)} cy={y} r={6} fill={s.color} />}
                  </g>
                );
              })}
            </AccessibleVisualization>
          </section>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.bias}</h2>
            <p className="text-xs text-muted">{t.biasNote.replace("{r}", String(sim.reps))}</p>
            <table className="mt-2 w-full text-sm" data-testid="bias-table">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-1 font-medium">{lang === "hu" ? "kimenet" : "outcome"}</th>
                  <th className="py-1 text-right font-medium">{t.biasU}</th>
                  <th className="py-1 text-right font-medium">{t.biasC}</th>
                  <th className="py-1 text-right font-medium">{t.sdC}</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {sim.rows.map((r) => (
                  <tr key={r.outcome} className="border-t border-line">
                    <td className="py-1 font-sans">{t.outcomeShort[r.outcome]}</td>
                    <td className="py-1 text-right">{fmt(r.biasU, 2)}</td>
                    <td className={cn("py-1 text-right", r.biasC !== null && Math.abs(r.biasC) > Math.max(0.5, 2 * ((r.sdC ?? 0) / Math.sqrt(sim.reps))) && "text-attention-ink")}>{r.biasC === null ? "—" : fmt(r.biasC, 2)}</td>
                    <td className="py-1 text-right">{r.sdC === null ? "—" : fmt(r.sdC, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sim.failed > 0 && <LabNote tone="warn">{t.failedReps.replace("{f}", String(sim.failed)).replace("{r}", String(sim.reps))}</LabNote>}
          </section>
        </div>
      </div>
    </LabShell>
  );
}

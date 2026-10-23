"use client";

// Survey Sampling Design Studio. Port of "QDA2 Survey Design Studio.dc.html", reorganised around the lab
// spec's design matrix (strata × stages × PPS). A map of 40 settlements with the frame overlaid, draggable
// stratum allocation, a stage-by-stage π trace, and estimates validated against R survey / sampling.
import { fmt } from "@/lib/engine/format";
import { useMemo, useRef } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl, ToggleControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { analyse, draw, exactSe, makeDsPopulation, plan, simulate, srsSe, STRATA, type Allocation, type DesignSpec } from "./model";
import { mulberry32 } from "@/lib/engine/rng";
import { DS_T } from "./strings";

export interface DsParams extends Record<string, unknown> {
  strata: number;
  stages: number;
  pps: boolean;
  allocation: Allocation;
  n: number;
  m: number;
  coverage: number[];
  nh: number[];
  psu: number;
  draw: number;
  seed: number;
}
const DEFAULTS: DsParams = { strata: 1, stages: 1, pps: false, allocation: "proportional", n: 160, m: 10, coverage: [1, 1, 1], nh: [], psu: 0, draw: 0, seed: 2026 };
const ALLOCS: Allocation[] = ["proportional", "neyman", "equal", "custom"];
const REPS = 300;
const COLORS = ["var(--data)", "var(--explained)", "var(--attention)"];
const INKS = ["var(--data-ink)", "var(--explained-ink)", "var(--attention-ink)"];
const int = (v: unknown, lo: number, hi: number, d: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v as number))) : d);

/** strata ≥ 2 means the three settlement types, stages ≥ 2 two-stage; other values are clamped or fall back. */
export function normalizeDs(p: DsParams): DsParams {
  const cov = Array.isArray(p.coverage) && p.coverage.length === 3 && p.coverage.every((c) => Number.isFinite(c)) ? p.coverage.map((c) => Math.min(1, Math.max(0.2, Math.round(c * 100) / 100))) : DEFAULTS.coverage;
  const nh = Array.isArray(p.nh) && p.nh.length === 3 && p.nh.every((v) => Number.isFinite(v)) ? p.nh.map((v) => int(v, 2, 400, 2)) : [];
  return {
    ...p,
    strata: int(p.strata, 1, 3, 1) >= 2 ? 3 : 1,
    stages: int(p.stages, 1, 2, 1),
    pps: p.pps === true,
    allocation: ALLOCS.includes(p.allocation) ? (p.allocation === "custom" && !nh.length ? "proportional" : p.allocation) : DEFAULTS.allocation,
    n: int(p.n, 20, 400, DEFAULTS.n),
    m: int(p.m, 2, 40, DEFAULTS.m),
    coverage: cov,
    nh,
    psu: int(p.psu, 0, 39, 0),
    draw: int(p.draw, 0, 1e6, 0),
    seed: Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed,
  };
}

// map layout: one block per settlement type, cells of 64 × 62 px to the right of a 110 px label column
const ROWS: { h: number; from: number; count: number }[] = [
  { h: 0, from: 0, count: 6 },
  { h: 1, from: 6, count: 7 },
  { h: 1, from: 13, count: 7 },
  { h: 2, from: 20, count: 10 },
  { h: 2, from: 30, count: 10 },
];
const CW = 64;
const CH = 62;
const cellOf = (id: number) => {
  const r = ROWS.findIndex((row) => id >= row.from && id < row.from + row.count);
  return { x: 112 + (id - ROWS[r].from) * CW, y: 8 + r * CH + (r >= 1 ? 8 : 0) + (r >= 3 ? 8 : 0) };
};
const AX0 = 150;
const AW = 330;
const AMAX = 400;

export default function SurveyDesignStudio(props: LabProps) {
  const lab = useLab<DsParams>("survey-design-studio", DEFAULTS, { ...props, normalize: normalizeDs });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = DS_T[lang];
  const key = `${P.strata}-${P.stages}` as keyof typeof t.lead;
  const d: DesignSpec = useMemo(
    () => ({ strata: P.strata as 1 | 3, stages: P.stages as 1 | 2, pps: P.stages === 2 && P.pps, allocation: P.allocation, n: P.n, m: P.m, coverage: P.coverage, nh: P.nh }),
    [P.strata, P.stages, P.pps, P.allocation, P.n, P.m, P.coverage, P.nh],
  );
  const pop = useMemo(() => makeDsPopulation(P.seed), [P.seed]);
  const pl = useMemo(() => plan(pop, d), [pop, d]);
  const dr = useMemo(() => draw(pl, d, mulberry32(P.seed * 31 + P.draw + 1)), [pl, d, P.seed, P.draw]);
  const an = useMemo(() => analyse(pl, d, dr), [pl, d, dr]);
  const sim = useMemo(() => simulate(pl, d, REPS, P.seed + 7), [pl, d, P.seed]);
  const ex = exactSe(pl, d);
  const nExp = pl.sumPi;
  const seRef = ex ?? sim.se;
  const seSrs = srsSe(pl, Math.round(nExp));
  const deff = seRef && seSrs ? (seRef / seSrs) ** 2 : null;
  const sampled = new Map<number, number>();
  dr.sample.forEach((s) => sampled.set(s.unit.psu, (sampled.get(s.unit.psu) ?? 0) + 1));
  const typeName = (h: number) => t.types[STRATA[h]];

  // allocation (n_h by settlement type): design n_h when stratified, realised counts otherwise
  const nhShown = P.strata === 3 ? pl.nh : [0, 1, 2].map((h) => dr.sample.filter((s) => s.unit.h === h).length);
  const allocLocked = locked("nh") || locked("allocation");
  const setCustom = (h: number, v: number) => {
    const cur = pl.nh.slice();
    cur[h] = Math.max(2, Math.min(Math.round(v), pl.groups[h].N, AMAX));
    setMany({ allocation: "custom", nh: cur, n: Math.min(400, Math.max(20, cur.reduce((a, b) => a + b, 0))) });
  };
  const allocRef = useRef<SVGSVGElement>(null);
  const dragA = useSvgDrag<number>(allocRef, (h, pt) => setCustom(h, ((pt.x - AX0) / AW) * AMAX));

  // map focus management (one tab stop, arrow keys move the traced PSU)
  const cellRefs = useRef(new Map<number, SVGGElement>());
  const moveTo = (id: number) => {
    const next = (id + 40) % 40;
    set("psu", next);
    requestAnimationFrame(() => cellRefs.current.get(next)?.focus());
  };
  const onMapKey = (e: React.KeyboardEvent, id: number) => {
    const k = e.key;
    const delta = k === "ArrowRight" || k === "ArrowDown" ? 1 : k === "ArrowLeft" || k === "ArrowUp" ? -1 : 0;
    if (delta) {
      e.preventDefault();
      moveTo(id + delta);
    } else if (k === "Home" || k === "End") {
      e.preventDefault();
      moveTo(k === "Home" ? 0 : 39);
    }
  };
  const Mmax = Math.max(...pop.psus.map((q) => q.units.length));

  // π trace for the selected PSU
  const tp = pop.psus[P.psu];
  const tFrame = pl.groups.flatMap((g) => g.psus).find((q) => q.psu.id === tp.id);
  const Mf = tFrame?.units.length ?? 0;
  const gi = P.strata === 3 ? tp.h : 0;
  const g = pl.groups[gi];
  type Step = { label: string; math: string };
  const steps: Step[] = [];
  let piK: number | null = null;
  if (tFrame) {
    piK = pl.pik.get(tFrame.units[0].id) ?? null;
    if (P.stages === 1) {
      steps.push({ label: P.strata === 3 ? t.unitStage.replace("{g}", typeName(tp.h)) : t.frameAll, math: `π_k = n${P.strata === 3 ? "_h" : ""}/N${P.strata === 3 ? "_h" : ""} = ${pl.nh[gi]}/${g.N}` });
    } else {
      const p1 = pl.pi1.get(tp.id) as number;
      const A = g.psus.length;
      const SM = g.psus.reduce((s, q) => s + q.units.length, 0);
      steps.push({
        label: t.stage1,
        math: (d.pps ? (p1 >= 1 - 1e-12 ? `π_PSU = 1 (${t.cert})` : `π_PSU = a·M_i/ΣM = ${pl.ah[gi]}·${Mf}/${SM}`) : `π_PSU = a/A = ${pl.ah[gi]}/${A}`) + ` = ${fmt(p1, 4)}`,
      });
      steps.push({ label: t.stage2, math: `π_k|PSU = m/M_i = ${Math.min(P.m, Mf)}/${Mf} = ${fmt(Math.min(P.m, Mf) / Mf, 4)}` });
    }
  }

  const readouts: Readout[] = [
    { label: t.coverageRate, value: fmt(pl.frameN / pop.N, 3), tone: pl.frameN < pop.N ? "attention" : "muted" },
    { label: t.frameBias, value: fmt(pl.frameMean - pop.truth, 2), tone: Math.abs(pl.frameMean - pop.truth) > 0.05 ? "attention" : "muted" },
    { label: t.realisedN, value: String(dr.sample.length) },
    { label: t.sumPi, value: fmt(pl.sumPi, 2), note: P.stages === 2 ? "E[n]" : "= n" },
    { label: t.estimate, value: an.est === null ? "—" : fmt(an.est, 2), tone: "model" },
    { label: t.truth, value: fmt(pop.truth, 2), tone: "data" },
    { label: t.seSample, value: an.se === null ? "—" : fmt(an.se, 3), tone: "residual" },
    ex !== null ? { label: t.seExact, value: fmt(ex, 3), tone: "explained" } : { label: t.seSim.replace("{r}", String(sim.reps)), value: fmt(sim.se, 3), tone: "explained" },
    { label: t.seSrs, value: seSrs === null ? "—" : fmt(seSrs, 3) },
    { label: t.deff, value: deff === null ? "—" : fmt(deff, 2) },
    { label: t.simBias, value: sim.mean === null ? "—" : fmt(sim.mean - pop.truth, 2), note: `${sim.reps}×` },
  ];
  const live = t.live.replace("{n}", String(dr.sample.length)).replace("{e}", an.est === null ? "—" : fmt(an.est, 2)).replace("{se}", an.se === null ? "—" : fmt(an.se, 3));

  const demos: TeachDemo[] = [
    { title: lang === "hu" ? "Lefedettségi hiba" : "Coverage error", note: t.insight["1-1"], apply: () => setMany({ strata: 1, stages: 1, pps: false, n: 160, coverage: [1, 1, 0.3] }) },
    { title: "Neyman", note: t.insight["3-1"], apply: () => setMany({ strata: 3, stages: 1, allocation: "neyman", coverage: [1, 1, 1] }) },
    { title: lang === "hu" ? "Csoportos hatás" : "Clustering cost", note: t.insight["1-2"], apply: () => setMany({ strata: 1, stages: 2, pps: false, m: 20, coverage: [1, 1, 1] }) },
    { title: "PPS", note: t.ppsLead, apply: () => setMany({ strata: 3, stages: 2, pps: true, m: 8, n: 200, allocation: "proportional", coverage: [1, 1, 1] }) },
  ];

  const piRange = (h: number) => {
    const vals = pl.groups.flatMap((gg) => gg.units).filter((u) => u.h === h).map((u) => pl.pik.get(u.id) as number);
    if (!vals.length) return "—";
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    return hi - lo < 1e-9 ? fmt(lo, 4) : `${fmt(lo, 4)}–${fmt(hi, 4)}`;
  };

  const aside = (
    <>
      <Panel title={t.design}>
        <div className="space-y-3">
          <ChoiceControl<number> label={t.strata} param="strata" value={P.strata} onChange={(v) => set("strata", v)} options={[1, 3].map((v) => ({ value: v, label: t.strataOpts[v as 1 | 3] }))} />
          <ChoiceControl<number> label={t.stages} param="stages" value={P.stages} onChange={(v) => set("stages", v)} options={[1, 2].map((v) => ({ value: v, label: t.stageOpts[v as 1 | 2] }))} />
          <ToggleControl label={t.pps} param="pps" checked={P.pps} disabled={P.stages !== 2} onChange={(v) => set("pps", v)} />
          {P.strata === 3 && (
            <ChoiceControl<Allocation> label={t.allocation} param="allocation" size="sm" value={P.allocation} onChange={(v) => (v === "custom" ? setMany({ allocation: "custom", nh: pl.nh }) : set("allocation", v))} options={ALLOCS.map((v) => ({ value: v, label: t.allocs[v] }))} />
          )}
          <ParameterControl label={t.n} param="n" value={P.n} min={20} max={400} step={10} format={(v) => String(Math.round(v))} disabled={P.strata === 3 && P.allocation === "custom"} onChange={(v) => set("n", Math.round(v))} />
          {P.stages === 2 && <ParameterControl label={t.m} param="m" value={P.m} min={2} max={40} step={1} format={(v) => String(Math.round(v))} onChange={(v) => set("m", Math.round(v))} />}
          <div className="flex flex-wrap items-center gap-2">
            <LabButton variant="primary" onClick={() => set("draw", P.draw + 1)}>
              {t.redraw}
            </LabButton>
            <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
          </div>
        </div>
      </Panel>
      <Panel title={t.coverage}>
        <div className="space-y-3">
          {[0, 1, 2].map((h) => (
            <ParameterControl
              key={h}
              label={t.coverageOf.replace("{t}", t.typesShort[STRATA[h]])}
              param="coverage"
              value={P.coverage[h]}
              min={0.2}
              max={1}
              step={0.05}
              format={(v) => `${Math.round(v * 100)} %`}
              onChange={(v) => set("coverage", P.coverage.map((c, j) => (j === h ? Math.round(v * 100) / 100 : c)))}
            />
          ))}
        </div>
      </Panel>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
        {an.se === null && <LabNote tone="warn">{t.noVar}</LabNote>}
      </Panel>
    </>
  );

  return (
    <LabShell
      lab={lab}
      title={t.title}
      aside={aside}
      demos={demos}
      method={t.method}
      validation={t.validation}
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula[key].map((f) => (
              <span key={f}>{f}</span>
            ))}
            {d.pps && <span>{t.ppsFormula}</span>}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight[key]}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="max-w-prose text-sm leading-relaxed text-muted">
          {t.lead[key]}
          {d.pps && <> {t.ppsLead}</>}
        </p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.map}</h2>
          <p className="text-xs text-muted">{t.mapNote}</p>
          <AccessibleVisualization
            interactive
            viewBox="0 0 760 340"
            summary={`${t.map}. ${[0, 1, 2].map((h) => `${typeName(h)}: N = ${pl.frame[h].Npop}, ${t.Nh} = ${pl.frame[h].N}`).join("; ")}. ${t.realisedN}: ${dr.sample.length}.`}
            table={{
              caption: t.map,
              columns: [t.psu, t.stratum, "M", "M (frame)", P.stages === 2 ? "π_PSU" : t.pi, t.realisedN],
              rows: pop.psus.map((q) => {
                const f = pl.groups.flatMap((gg) => gg.psus).find((x) => x.psu.id === q.id);
                return [q.id + 1, typeName(q.h), q.units.length, f?.units.length ?? 0, P.stages === 2 ? fmt(pl.pi1.get(q.id) ?? 0, 3) : f ? fmt(pl.pik.get(f.units[0].id) ?? 0, 4) : "0", sampled.get(q.id) ?? 0];
              }),
            }}
          >
            {ROWS.map((row, r) =>
              row.from === 0 || ROWS[r - 1].h !== row.h ? (
                <text key={r} x={8} y={cellOf(row.from).y + 30} fontSize={12} fontWeight={600} fill={INKS[row.h]}>
                  {t.typesShort[STRATA[row.h]]}
                </text>
              ) : null,
            )}
            <g role="radiogroup" aria-label={t.mapLabel}>
              {pop.psus.map((q) => {
                const { x, y } = cellOf(q.id);
                const M = q.units.length;
                const f = pl.groups.flatMap((gg) => gg.psus).find((xx) => xx.psu.id === q.id);
                const inF = f?.units.length ?? 0;
                const s = 48 * Math.sqrt(M / Mmax);
                const cx = x + CW / 2 - 2;
                const cy = y + 25;
                const off = 1 - inF / M;
                const isSel = P.stages === 2 ? dr.psus.has(q.id) : (sampled.get(q.id) ?? 0) > 0;
                const traced = P.psu === q.id;
                const p1 = pl.pi1.get(q.id);
                return (
                  <g
                    key={q.id}
                    ref={(el) => {
                      if (el) cellRefs.current.set(q.id, el);
                      else cellRefs.current.delete(q.id);
                    }}
                    role="radio"
                    aria-checked={traced}
                    tabIndex={traced ? 0 : -1}
                    aria-label={`${t.psu} ${q.id + 1}, ${typeName(q.h)}, M = ${M}, ${t.frameAll} ${inF}${P.stages === 2 ? `, π_PSU = ${fmt(p1 ?? 0, 3)}` : ""}, ${isSel ? t.selectedPsu : t.notSelected}`}
                    onClick={() => set("psu", q.id)}
                    onKeyDown={(e) => onMapKey(e, q.id)}
                    className="cursor-pointer outline-none [&:focus-visible>rect.ring]:stroke-[var(--ink)]"
                  >
                    <rect className="ring" x={x + 1} y={y + 1} width={CW - 6} height={CH - 4} rx={6} fill={traced ? "var(--surface-2)" : "transparent"} stroke={traced ? "var(--attention)" : "transparent"} strokeWidth={2} strokeDasharray={traced ? "4 3" : undefined} />
                    <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={3} fill={COLORS[q.h]} fillOpacity={0.35 + (isSel ? 0.35 : 0)} stroke={isSel ? "var(--ink)" : COLORS[q.h]} strokeWidth={isSel ? 2.5 : 1} />
                    {off > 0 && <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s * off} fill="var(--surface)" fillOpacity={0.8} stroke="var(--muted)" strokeDasharray="2 2" strokeWidth={0.8} />}
                    {s >= 30 && (
                      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="var(--ink)" className="font-mono" aria-hidden>
                        {P.stages === 2 ? fmt(p1 ?? 0, 2) : (sampled.get(q.id) ?? "")}
                      </text>
                    )}
                    <text x={cx} y={y + CH - 6} textAnchor="middle" fontSize={9} fill="var(--muted)" className="font-mono" aria-hidden>
                      M={M}
                      {s < 30 && (P.stages === 2 ? ` · ${fmt(p1 ?? 0, 2).replace(/^0/, "")}` : sampled.get(q.id) ? ` · ${sampled.get(q.id)}` : "")}
                    </text>
                  </g>
                );
              })}
            </g>
          </AccessibleVisualization>
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.allocTitle}</h2>
            {P.strata === 3 && <p className="text-xs text-muted">{t.allocNote}</p>}
            <AccessibleVisualization
              interactive={P.strata === 3}
              svgRef={allocRef}
              onPointerMove={dragA.move}
              onPointerUp={dragA.end}
              viewBox="0 0 520 130"
              summary={`${t.allocTitle}: ${[0, 1, 2].map((h) => `${typeName(h)} n_h = ${nhShown[h]}`).join(", ")}.`}
            >
              {[0, 1, 2].map((h) => {
                const y = 14 + h * 36;
                const v = nhShown[h];
                const X = AX0 + (Math.min(v, AMAX) / AMAX) * AW;
                const tot = nhShown.reduce((a, b) => a + b, 0);
                return (
                  <g key={h}>
                    <text x={AX0 - 8} y={y + 14} textAnchor="end" fontSize={11} fill="var(--ink)">
                      {t.typesShort[STRATA[h]]}
                    </text>
                    <rect x={AX0} y={y} width={AW} height={20} rx={3} fill="var(--surface-2)" />
                    <rect x={AX0} y={y} width={X - AX0} height={20} rx={3} fill={COLORS[h]} fillOpacity={0.75} />
                    <text x={Math.min(X + 12, 505)} y={y + 14} fontSize={10} fill="var(--ink)" className="font-mono" textAnchor={X + 12 > 440 ? "end" : "start"}>
                      {v} ({tot ? Math.round((100 * v) / tot) : 0} %)
                    </text>
                    {P.strata === 3 && (
                      <DragHandle
                        x={X}
                        y={y + 10}
                        r={7}
                        fill="var(--ink)"
                        orientation="horizontal"
                        label={`n_h: ${typeName(h)}`}
                        value={v}
                        min={2}
                        max={Math.min(pl.groups[h].N, AMAX)}
                        step={1}
                        valueText={String(v)}
                        disabled={allocLocked}
                        onStart={(e) => dragA.start(h, e)}
                        onValue={(nv) => setCustom(h, nv)}
                      />
                    )}
                  </g>
                );
              })}
              <text x={AX0} y={124} fontSize={9} fill="var(--muted)" className="font-mono">
                0
              </text>
              <text x={AX0 + AW} y={124} fontSize={9} fill="var(--muted)" textAnchor="end" className="font-mono">
                {AMAX}
              </text>
            </AccessibleVisualization>
          </section>
          <section aria-labelledby="ds-trace">
            <h2 id="ds-trace" className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t.trace}
            </h2>
            <div className="mt-2 rounded-lg border border-line bg-surface p-3 text-sm" data-testid="pi-trace">
              <p className="font-medium text-ink">{t.traceUnit.replace("{p}", String(tp.id + 1)).replace("{t}", typeName(tp.h)).replace("{M}", String(Mf))}</p>
              {tFrame ? (
                <>
                  <ol className="mt-2 space-y-1">
                    {steps.map((st, i) => (
                      <li key={i} className="flex flex-wrap gap-x-2">
                        <span className="text-muted">
                          {i + 1}. {st.label}:
                        </span>
                        <span className="font-mono text-ink">{st.math}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 font-mono text-ink">
                    π_k = {piK === null ? "—" : fmt(piK, 4)} · w_k = 1/π_k = {piK ? fmt(1 / piK, 2) : "—"}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-muted">{lang === "hu" ? "Ennek a településnek egyetlen egysége sincs a keretben: π = 0." : "No unit of this settlement is in the frame: π = 0."}</p>
              )}
            </div>
          </section>
        </div>
        <section>
          <table className="w-full text-sm" data-testid="alloc-table">
            <caption className="text-left text-xs font-semibold uppercase tracking-wider text-muted">{t.tableTitle}</caption>
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1 font-medium">{t.stratum}</th>
                <th className="py-1 text-right font-medium">{t.Npop}</th>
                <th className="py-1 text-right font-medium">{t.Nh}</th>
                <th className="py-1 text-right font-medium">{t.Sh}</th>
                <th className="py-1 text-right font-medium">{t.nh}</th>
                {P.stages === 2 && P.strata === 3 && <th className="py-1 text-right font-medium">{t.ah}</th>}
                <th className="py-1 text-right font-medium">{t.pi}</th>
                <th className="py-1 text-right font-medium">{t.domainSe}</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {[0, 1, 2].map((h) => (
                <tr key={h} className="border-t border-line">
                  <td className="py-1 font-sans" style={{ color: INKS[h] }}>
                    {typeName(h)}
                  </td>
                  <td className="py-1 text-right">{pl.frame[h].Npop}</td>
                  <td className="py-1 text-right">{pl.frame[h].N}</td>
                  <td className="py-1 text-right">{fmt(pl.frame[h].S, 1)}</td>
                  <td className="py-1 text-right">{nhShown[h]}</td>
                  {P.stages === 2 && P.strata === 3 && (
                    <td className="py-1 text-right">
                      {pl.ah[h]} / {pl.groups[h].psus.length}
                    </td>
                  )}
                  <td className="py-1 text-right">{piRange(h)}</td>
                  <td className="py-1 text-right">{an.domains[h].est === null ? "—" : `${fmt(an.domains[h].est as number, 1)} ± ${an.domains[h].se === null ? "—" : fmt(an.domains[h].se as number, 2)}`}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-line font-semibold">
                <td className="py-1 font-sans">{t.overall}</td>
                <td className="py-1 text-right">{pop.N}</td>
                <td className="py-1 text-right">{pl.frameN}</td>
                <td className="py-1 text-right">{fmt(pl.frameS, 1)}</td>
                <td className="py-1 text-right">{nhShown.reduce((a, b) => a + b, 0)}</td>
                {P.stages === 2 && P.strata === 3 && (
                  <td className="py-1 text-right">
                    {pl.ah.reduce((a, b) => a + b, 0)} / {pl.groups.reduce((a, gg) => a + gg.psus.length, 0)}
                  </td>
                )}
                <td className="py-1 text-right">Σ = {fmt(pl.sumPi, 1)}</td>
                <td className="py-1 text-right">{an.est === null ? "—" : `${fmt(an.est, 1)} ± ${an.se === null ? "—" : fmt(an.se, 2)}`}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </LabShell>
  );
}

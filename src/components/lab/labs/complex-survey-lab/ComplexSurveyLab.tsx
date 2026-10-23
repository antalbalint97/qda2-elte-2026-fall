"use client";

// Complex Survey Inference Lab. Port of "QDA2 Complex Survey Lab.dc.html", rebuilt around the lab spec
// (strata, PSUs per stratum, Taylor / JK1 / JKn / BRR, domain, model) with its own seeded population so the
// "true" SE and the coverage of intervals can be simulated. Every design-based number is checked against R
// survey on samples exported from this lab.
import { chi2Sf, tQuantile } from "@/lib/engine/distributions";
import { fmt, fmtP } from "@/lib/engine/format";
import { mean, sum } from "@/lib/engine/numeric";
import { mulberry32 } from "@/lib/engine/rng";
import { raoScott, svyGlm } from "@/lib/engine/survey-estimators";
import { tTwoTailedP } from "@/lib/stats";
import { useMemo, useState } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl, SelectControl, ToggleControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { coverageSim, domainEstimates, drawSample, GROUPS, makeCsPopulation, MODELS, modelColumns, parseDomain, rCode, sampleCsv, seSet, type Model, type VarMethod } from "./model";
import { CS_T } from "./strings";

type View = "se" | "domain" | "test" | "reg" | "export";
export interface CsParams extends Record<string, unknown> {
  strata: number;
  psuPerStratum: number;
  method: VarMethod;
  domain: string;
  model: Model;
  fpc: boolean;
  view: View;
  draw: number;
  seed: number;
}
const VIEWS: View[] = ["se", "domain", "test", "reg", "export"];
const METHODS: VarMethod[] = ["taylor", "jk1", "jkn", "brr"];
const DEFAULTS: CsParams = { strata: 4, psuPerStratum: 6, method: "jkn", domain: "group=C", model: "y ~ x + group", fpc: false, view: "se", draw: 0, seed: 2026 };
const REPS = 300;
const r2 = (v: number) => Math.round(v * 100) / 100;
const int = (v: unknown, lo: number, hi: number, d: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d);

export function normalizeCs(p: CsParams): CsParams {
  return {
    ...p,
    strata: int(p.strata, 2, 8, DEFAULTS.strata),
    psuPerStratum: int(p.psuPerStratum, 2, 10, DEFAULTS.psuPerStratum),
    method: METHODS.includes(p.method) ? p.method : DEFAULTS.method,
    domain: typeof p.domain === "string" ? p.domain.slice(0, 24) : DEFAULTS.domain,
    model: (MODELS as readonly string[]).includes(p.model) ? p.model : DEFAULTS.model,
    fpc: p.fpc === true,
    view: VIEWS.includes(p.view) ? p.view : DEFAULTS.view,
    draw: Number.isInteger(p.draw) && p.draw >= 0 ? p.draw : 0,
    seed: Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed,
  };
}

export default function ComplexSurveyLab(props: LabProps) {
  const lab = useLab<CsParams>("complex-survey-lab", DEFAULTS, { ...props, normalize: normalizeCs });
  const { params: P, set, setMany, lang } = lab;
  const t = CS_T[lang];
  const H = P.strata;
  const a = P.psuPerStratum;
  const pop = useMemo(() => makeCsPopulation(H, P.seed), [H, P.seed]);
  const obs = useMemo(() => drawSample(pop, a, mulberry32(P.seed * 13 + P.draw + 1)), [pop, a, P.seed, P.draw]);
  const method: VarMethod = P.method === "brr" && a !== 2 ? "jkn" : P.method;
  const ses = useMemo(() => seSet(method === "jk1" ? obs.map((o) => ({ ...o, stratum: "all" })) : obs, method, P.fpc), [obs, method, P.fpc]);
  const taylor = useMemo(() => seSet(obs, "taylor", P.fpc), [obs, P.fpc]);
  const sim = useMemo(() => coverageSim(pop, a, P.fpc, REPS, P.seed + 5, (df) => tQuantile(0.975, df)), [pop, a, P.fpc, P.seed]);
  const dom = parseDomain(P.domain, H);
  const de = useMemo(() => domainEstimates(obs, dom, method === "taylor" ? "jkn" : method === "jk1" ? "jkn" : method, P.fpc), [obs, dom.key, dom.value, method, P.fpc]); // eslint-disable-line react-hooks/exhaustive-deps
  const rs = useMemo(() => raoScott(obs, (o) => o.group, (o) => String(o.agree), { fpc: P.fpc }), [obs, P.fpc]);
  const cols = modelColumns(P.model);
  const reg = useMemo(() => svyGlm(obs, (o) => cols.map((c) => c.f(o))), [obs, P.model]); // eslint-disable-line react-hooks/exhaustive-deps
  const [copied, setCopied] = useState(false);
  const df = taylor.df;
  const tc = tQuantile(0.975, Math.max(1, df));
  const code = rCode({ method, fpc: P.fpc, domain: dom, model: P.model });
  const domTruth = dom.key === "group" ? pop.truthGroup[dom.value] : (mean(pop.psus.filter((p) => `S${p.h + 1}` === dom.value).flatMap((p) => p.units.map((u) => u.y))) as number);

  // design tree
  const tree = Array.from({ length: H }, (_, h) => {
    const us = obs.filter((o) => o.h === h);
    const psus = [...new Set(us.map((o) => o.psu))].map((p) => {
      const uu = us.filter((o) => o.psu === p);
      return { p, n: uu.length, m: sum(uu.map((o) => o.w * o.y)) / sum(uu.map((o) => o.w)) };
    });
    return { h, psus, w: us.length ? fmt(mean(us.map((o) => o.w)) as number, 1) : "—" };
  });

  // SE bars
  const repLabel = method === "taylor" ? "JKn" : t.methods[method];
  const bars = [
    { k: t.naive, v: ses.naive, fill: "var(--border-strong)" },
    { k: t.taylor, v: taylor.taylor, fill: "var(--model)" },
    { k: `${t.replicate}: ${repLabel}`, v: ses.replicate, fill: "var(--explained)" },
    { k: t.truthSe, v: sim.trueSe, fill: "var(--data)" },
  ];
  const bMax = Math.max(...bars.map((b) => b.v ?? 0), 1e-9) * 1.15;
  const BX = (v: number) => r2(200 + (v / bMax) * 280);

  // domain strip
  const drows = [
    { k: t.domainDesign, est: de.est, se: de.seTaylor, fill: "var(--model)" },
    { k: t.domainRep, est: de.est, se: de.seRep, fill: "var(--explained)" },
    { k: t.domainNaive, est: de.naiveEst, se: de.naiveSe, fill: "var(--border-strong)" },
  ];
  const dv = drows.flatMap((r) => (r.est === null || r.se === null ? [] : [r.est - tc * r.se, r.est + tc * r.se])).concat([domTruth]);
  const dLo = Math.min(...dv);
  const dHi = Math.max(...dv);
  const dPad = (dHi - dLo || 1) * 0.1;
  const DX = (v: number) => r2(200 + ((v - dLo + dPad) / (dHi - dLo + 2 * dPad)) * 290);

  const W = sum(obs.map((o) => o.w));
  const wtab = GROUPS.map((g) => {
    const wg = sum(obs.filter((o) => o.group === g).map((o) => o.w));
    const wa = sum(obs.filter((o) => o.group === g && o.agree === 1).map((o) => o.w));
    return { g, n: obs.filter((o) => o.group === g).length, share: wg / W, agree: wg ? wa / wg : 0 };
  });

  const readouts: Readout[] = [
    { label: t.n, value: `${obs.length} · ${H * a} · ${H}` },
    { label: t.est, value: fmt(taylor.est, 2), tone: "model" },
    { label: t.deff, value: taylor.deff === null ? "—" : fmt(taylor.deff, 2), tone: (taylor.deff ?? 1) > 1 ? "attention" : "muted" },
    { label: t.neff, value: taylor.deff ? fmt(obs.length / taylor.deff, 0) : "—" },
    { label: t.df, value: String(df) },
    { label: t.ci, value: taylor.taylor === null ? "—" : `[${fmt(taylor.est - tc * taylor.taylor, 2)}, ${fmt(taylor.est + tc * taylor.taylor, 2)}]`, tone: "model" },
  ];
  const live = t.live.replace("{d}", fmt(taylor.taylor ?? NaN, 3)).replace("{n}", fmt(ses.naive ?? NaN, 3));

  const download = () => {
    const blob = new Blob([sampleCsv(obs)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = "complex_survey_sample.csv";
    el.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const copy = () => {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  };

  const demos: TeachDemo[] = [
    { title: t.views.se, note: t.lead.se, apply: () => setMany({ view: "se", strata: 4, psuPerStratum: 6, method: "jkn" }) },
    { title: "BRR", note: t.brrNote, apply: () => setMany({ view: "se", strata: 4, psuPerStratum: 2, method: "brr" }) },
    { title: t.views.domain, note: t.lead.domain, apply: () => setMany({ view: "domain", domain: "group=C", method: "jkn" }) },
    { title: t.views.test, note: t.lead.test, apply: () => setMany({ view: "test" }) },
    { title: t.views.reg, note: t.lead.reg, apply: () => setMany({ view: "reg", model: "y ~ x + group" }) },
  ];

  const aside = (
    <>
      <Panel title={t.design}>
        <div className="space-y-3">
          <ParameterControl label={t.strata} param="strata" value={H} min={2} max={8} step={1} format={(v) => String(Math.round(v))} onChange={(v) => set("strata", Math.round(v))} />
          <ParameterControl label={t.psuPer} param="psuPerStratum" value={a} min={2} max={10} step={1} format={(v) => String(Math.round(v))} onChange={(v) => set("psuPerStratum", Math.round(v))} />
          <ChoiceControl<VarMethod> label={t.method} param="method" size="sm" value={method} onChange={(v) => set("method", v)} options={METHODS.map((m) => ({ value: m, label: t.methods[m], disabled: m === "brr" && a !== 2 }))} />
          {a !== 2 && <p className="text-xs text-muted">{t.brrNote}</p>}
          {method === "jk1" && <p className="text-xs text-muted">{t.jk1Note}</p>}
          <ToggleControl label={t.fpc} param="fpc" checked={P.fpc} onChange={(v) => set("fpc", v)} />
          <SelectControl
            label={t.domain}
            param="domain"
            value={`${dom.key}=${dom.value}`}
            onChange={(v) => set("domain", v)}
            options={[...GROUPS.map((g) => ({ value: `group=${g}`, label: `group = ${g}` })), ...Array.from({ length: H }, (_, h) => ({ value: `stratum=S${h + 1}`, label: `stratum = S${h + 1}` }))]}
          />
          <SelectControl<Model> label={t.model} param="model" value={P.model} onChange={(v) => set("model", v)} options={MODELS.map((m) => ({ value: m, label: m }))} />
          <div className="flex flex-wrap items-center gap-2">
            <LabButton variant="primary" onClick={() => set("draw", P.draw + 1)}>
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
          <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">{t.formula[P.view]}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <ChoiceControl<View> label={t.view} hideLabel param="view" value={P.view} onChange={(v) => set("view", v)} options={VIEWS.map((v) => ({ value: v, label: t.views[v] }))} />
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[P.view]}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <section aria-labelledby="cs-tree">
            <h2 id="cs-tree" className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t.tree}
            </h2>
            <p className="text-xs text-muted">{t.treeNote.replace("{a}", String(a))}</p>
            <ul tabIndex={0} aria-labelledby="cs-tree" className="mt-2 max-h-80 space-y-2 overflow-auto rounded-lg border border-line bg-surface p-2 text-sm" data-testid="design-tree">
              {tree.map((s) => (
                <li key={s.h}>
                  <span className="font-medium text-ink">S{s.h + 1}</span> <span className="text-xs text-muted">(w̄ = {s.w})</span>
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {s.psus.map((p) => (
                      <li key={p.p} className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink" title={t.psuLine.replace("{p}", String(p.p)).replace("{n}", String(p.n)).replace("{m}", fmt(p.m, 1))}>
                        <span className="sr-only">{t.psuLine.replace("{p}", String(p.p)).replace("{n}", String(p.n)).replace("{m}", fmt(p.m, 1))}</span>
                        <span aria-hidden>{fmt(p.m, 1)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
          <section>
            {P.view === "se" && (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.seCmp}</h2>
                <p className="text-xs text-muted">{t.seNote.replace("{r}", String(sim.reps))}</p>
                <AccessibleVisualization
                  viewBox="0 0 560 200"
                  summary={`${t.seCmp}: ${bars.map((b) => `${b.k} ${b.v === null ? "—" : fmt(b.v, 3)}`).join("; ")}.`}
                  table={{ caption: t.seCmp, columns: ["", "SE", "× naive"], rows: bars.map((b) => [b.k, b.v === null ? "—" : fmt(b.v, 4), b.v !== null && ses.naive ? fmt(b.v / ses.naive, 2) : "—"]) }}
                >
                  {bars.map((b, i) => {
                    const y = 14 + i * 46;
                    return (
                      <g key={i}>
                        <text x={192} y={y + 17} textAnchor="end" fontSize={11} fill="var(--ink)">
                          {b.k}
                        </text>
                        {b.v !== null && <rect x={200} y={y} width={BX(b.v) - 200} height={26} rx={3} fill={b.fill} />}
                        <text x={(b.v === null ? 200 : BX(b.v)) + 6} y={y + 17} fontSize={11} fill="var(--ink)" className="font-mono">
                          {b.v === null ? "—" : fmt(b.v, 3)}
                          {b.v !== null && ses.naive && i > 0 ? ` (×${fmt(b.v / ses.naive, 2)})` : ""}
                        </text>
                      </g>
                    );
                  })}
                </AccessibleVisualization>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm" data-testid="coverage">
                  <p className="col-span-2 text-xs font-semibold uppercase tracking-wider text-muted">{t.coverage.replace("{r}", String(sim.reps))}</p>
                  <p>
                    {t.covNaive}: <span className="font-mono text-residual-ink">{fmt(100 * sim.coverageNaive, 1)} %</span>
                  </p>
                  <p>
                    {t.covDesign}: <span className="font-mono text-model-ink">{fmt(100 * sim.coverageDesign, 1)} %</span>
                  </p>
                </div>
                {ses.replicateMethod && <p className="mt-1 text-xs text-muted">{ses.replicateMethod}</p>}
              </>
            )}
            {P.view === "domain" && (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.domainTitle.replace("{d}", `${dom.key} = ${dom.value}`)}</h2>
                <p className="text-xs text-muted">{t.domainNote}</p>
                <AccessibleVisualization
                  viewBox="0 0 560 170"
                  summary={`${t.domainTitle.replace("{d}", `${dom.key} = ${dom.value}`)} (n = ${de.n}): ${drows.map((r) => `${r.k} ${r.est === null ? "—" : fmt(r.est, 2)} ± ${r.se === null ? "—" : fmt(tc * r.se, 2)}`).join("; ")}; population ${fmt(domTruth, 2)}.`}
                  table={{ caption: t.domainTitle.replace("{d}", `${dom.key} = ${dom.value}`), columns: ["", "est", "SE", "95 % CI"], rows: drows.map((r) => [r.k, r.est === null ? "—" : fmt(r.est, 2), r.se === null ? "—" : fmt(r.se, 3), r.est === null || r.se === null ? "—" : `${fmt(r.est - tc * r.se, 2)} … ${fmt(r.est + tc * r.se, 2)}`]) }}
                >
                  <line x1={DX(domTruth)} x2={DX(domTruth)} y1={8} y2={140} stroke="var(--ink)" strokeDasharray="4 3" />
                  <text x={DX(domTruth)} y={158} textAnchor="middle" fontSize={10} fill="var(--ink)" className="font-mono">
                    {fmt(domTruth, 2)}
                  </text>
                  {drows.map((r, i) => {
                    const y = 30 + i * 40;
                    return (
                      <g key={i}>
                        <text x={192} y={y + 4} textAnchor="end" fontSize={11} fill="var(--ink)">
                          {r.k}
                        </text>
                        {r.est !== null && r.se !== null && <line x1={DX(r.est - tc * r.se)} x2={DX(r.est + tc * r.se)} y1={y} y2={y} stroke={r.fill} strokeWidth={4} />}
                        {r.est !== null && <circle cx={DX(r.est)} cy={y} r={6} fill={r.fill} stroke="var(--ink)" />}
                      </g>
                    );
                  })}
                </AccessibleVisualization>
                <p className="mt-1 font-mono text-xs text-ink">n_D = {de.n}</p>
              </>
            )}
            {P.view === "test" && (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.testTitle}</h2>
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      <th className="py-1 font-medium">group</th>
                      <th className="py-1 text-right font-medium">n</th>
                      <th className="py-1 text-right font-medium">Σw / ΣW</th>
                      <th className="py-1 text-right font-medium">{t.weighted}</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {wtab.map((r) => (
                      <tr key={r.g} className="border-t border-line">
                        <td className="py-1">{r.g}</td>
                        <td className="py-1 text-right">{r.n}</td>
                        <td className="py-1 text-right">{fmt(r.share, 3)}</td>
                        <td className="py-1 text-right">{fmt(100 * r.agree, 1)} %</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm" data-testid="rao-scott">
                  <dt className="text-muted">{t.pearson}</dt>
                  <dd className="font-mono">
                    {rs.pearson === null ? "—" : fmt(rs.pearson, 3)} · df {rs.df}
                  </dd>
                  <dt className="text-muted">{t.naiveP}</dt>
                  <dd className="font-mono text-residual-ink">{rs.pearson === null ? "—" : fmtP(chi2Sf(rs.pearson, rs.df))}</dd>
                  <dt className="text-muted">{t.meanDeff}</dt>
                  <dd className="font-mono">{rs.meanDelta === null ? "—" : fmt(rs.meanDelta, 3)}</dd>
                  <dt className="text-muted">{t.first}</dt>
                  <dd className="font-mono text-model-ink">{rs.pearson === null || rs.meanDelta === null ? "—" : `${fmt(rs.pearson / rs.meanDelta, 3)}, p ${fmtP(rs.chisqP)}`}</dd>
                  <dt className="text-muted">{t.second}</dt>
                  <dd className="font-mono text-model-ink">{rs.F === null ? "—" : `F = ${fmt(rs.F, 3)} on (${fmt(rs.ndf ?? NaN, 2)}, ${fmt(rs.ddf ?? NaN, 2)}), p ${fmtP(rs.Fp)}`}</dd>
                </dl>
              </>
            )}
            {P.view === "reg" && (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {t.regTitle}: {P.model}
                </h2>
                {reg.coef && "seDesign" in reg ? (
                  <div className="overflow-x-auto">
                    <table className="mt-2 w-full min-w-[520px] text-sm" data-testid="svyglm-table">
                      <thead>
                        <tr className="text-left text-xs text-muted">
                          <th className="py-1 font-medium">{t.coef}</th>
                          <th className="py-1 text-right font-medium">β</th>
                          <th className="py-1 text-right font-medium">{t.seClassical}</th>
                          <th className="py-1 text-right font-medium">{t.seDesign}</th>
                          <th className="py-1 text-right font-medium">{t.tDesign}</th>
                          <th className="py-1 text-right font-medium">{t.pDesign.replace("{df}", String(df - cols.length))}</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {["(Intercept)", ...cols.map((c) => c.name)].map((nm, j) => (
                          <tr key={nm} className="border-t border-line">
                            <td className="py-1">{nm}</td>
                            <td className="py-1 text-right">{fmt(reg.coef[j], 3)}</td>
                            <td className="py-1 text-right">{fmt(reg.se[j], 3)}</td>
                            <td className="py-1 text-right">{fmt(reg.seDesign[j], 3)}</td>
                            <td className="py-1 text-right">{fmt(reg.tDesign[j], 2)}</td>
                            <td className="py-1 text-right">{fmtP(tTwoTailedP(reg.tDesign[j], Math.max(1, df - cols.length)))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <LabNote tone="warn">{"reason" in reg ? reg.reason : ""}</LabNote>
                )}
              </>
            )}
            {P.view === "export" && (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.exportTitle}</h2>
                <p className="text-xs text-muted">{t.exportNote}</p>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-xs text-ink" data-testid="r-code">
                  {code}
                </pre>
                <div className="mt-2 flex flex-wrap gap-2">
                  <LabButton variant="primary" onClick={download}>
                    {t.download}
                  </LabButton>
                  <LabButton onClick={copy}>{copied ? t.copied : t.copy}</LabButton>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </LabShell>
  );
}

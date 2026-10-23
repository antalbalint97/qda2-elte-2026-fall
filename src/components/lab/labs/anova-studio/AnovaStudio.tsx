"use client";

// ANOVA Studio. Port of "QDA2 ANOVA Studio.dc.html" with the repeated-measures design added. Up to five
// groups of draggable scores, the ANOVA table, Welch F, pairwise CIs with or without correction, a 2×2
// design with a draggable interaction plot, and a subjects × conditions design with subject lines.
// Engines: anova/welchAnova/pairwise/twoWay (SciPy/statsmodels-validated) and rmAnova (base R-validated).
import { anova, omegaSquared, pairwise, rmAnova, twoWay, welchAnova, type Correction } from "@/lib/engine/regression";
import { fQuantile } from "@/lib/engine/distributions";
import { describe as describeStats } from "@/lib/engine/descriptives";
import { fmt, fmtP } from "@/lib/engine/format";
import { useRef } from "react";
import { ChoiceControl, ParameterControl, SeedControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, PresetBar, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { generateGroups, N_PER_GROUP, transformGroups, type AnovaDesign, type AnovaPreset } from "./data";
import { AN_T } from "./strings";

export interface AnovaParams extends Record<string, unknown> {
  design: AnovaDesign;
  k: number;
  correction: Correction;
  preset: AnovaPreset | "custom";
  groups: number[][];
  sep: number;
  spread: number;
  hidePostHoc: boolean;
  seed: number;
}
const PRESETS: AnovaPreset[] = ["base", "null", "unequal", "interaction"];
const DEFAULTS: AnovaParams = { design: "oneway", k: 3, correction: "tukey", preset: "base", groups: [], sep: 0, spread: 1, hidePostHoc: false, seed: 2026 };
const clamp100 = (v: number) => Math.round(Math.min(100, Math.max(0, v)));

/** Named presets regenerate the scores from the seed; "custom" keeps validated groups of equal size. */
export function normalizeAnova(p: AnovaParams): AnovaParams {
  const design: AnovaDesign = p.design === "twoway" || p.design === "rm" ? p.design : "oneway";
  const k = design === "twoway" ? 4 : Number.isInteger(p.k) ? Math.min(5, Math.max(2, p.k)) : DEFAULTS.k;
  const seed = Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed;
  const okCustom =
    p.preset === "custom" && Array.isArray(p.groups) && p.groups.length === k && p.groups.every((g) => Array.isArray(g) && g.length === N_PER_GROUP && g.every((v) => Number.isFinite(v)));
  let preset: AnovaPreset | "custom" = p.preset === "custom" || PRESETS.includes(p.preset as AnovaPreset) ? p.preset : DEFAULTS.preset;
  if (preset === "custom" && !okCustom) preset = "base";
  if (preset === "interaction" && design !== "twoway") preset = "base";
  const groups = okCustom ? p.groups.map((g) => g.map(clamp100)) : generateGroups(seed, k, preset as AnovaPreset, design);
  return {
    ...p,
    design,
    k,
    seed,
    preset,
    groups,
    correction: (["none", "bonferroni", "tukey", "gameshowell"] as const).includes(p.correction) ? p.correction : "tukey",
    sep: Number.isFinite(p.sep) ? Math.min(30, Math.max(-30, p.sep)) : 0,
    spread: Number.isFinite(p.spread) ? Math.min(2, Math.max(0.2, p.spread)) : 1,
    hidePostHoc: p.hidePostHoc === true,
  };
}

const Y = (v: number) => 380 - 3.6 * v;
const VI = (py: number) => clamp100((380 - py) / 3.6);
const COLORS = ["var(--data)", "var(--explained)", "var(--model)", "var(--attention)", "var(--residual)"];
const CELL = ["A1·B1", "A1·B2", "A2·B1", "A2·B2"];

export default function AnovaStudio(props: LabProps) {
  const lab = useLab<AnovaParams>("anova-studio", DEFAULTS, { ...props, normalize: normalizeAnova });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = AN_T[lang];
  const groups = P.sep === 0 && P.spread === 1 ? P.groups : transformGroups(P.groups, P.sep, P.spread);
  const k = groups.length;
  const two = P.design === "twoway";
  const rm = P.design === "rm";
  const a = anova(groups);
  const welch = welchAnova(groups);
  const om = omegaSquared(a);
  const tw = two ? twoWay([[groups[0], groups[1]], [groups[2], groups[3]]]) : null;
  const rmA = rm ? rmAnova(Array.from({ length: N_PER_GROUP }, (_, i) => groups.map((g) => g[i]))) : null;
  const pw = P.design === "oneway" ? pairwise(groups, P.correction) : null;
  const omnibusSig = a.p !== null && a.p < 0.05;
  const showPairs = !!pw && (!P.hidePostHoc || omnibusSig);
  const dataLocked = locked("groups");
  // Any edit of single scores makes the displayed scores the new custom data.
  const setGroups = (g: number[][]) => setMany({ groups: g, preset: "custom", sep: 0, spread: 1 });
  const label = (j: number) => (two ? CELL[j] : rm ? `C${j + 1}` : `G${j + 1}`);
  const color = (j: number) => (two ? (j % 2 ? "var(--explained)" : "var(--data)") : COLORS[j]);

  // ── group canvas ──
  const colW = 690 / k;
  const svgRef = useRef<SVGSVGElement>(null);
  type Drag = { kind: "pt"; j: number; i: number } | { kind: "mean"; j: number; y0: number; arr0: number[] };
  const drag = useSvgDrag<Drag>(svgRef, (d, pt) => {
    if (d.kind === "pt") {
      const g = groups.map((x) => [...x]);
      g[d.j][d.i] = VI(pt.y);
      setGroups(g);
    } else {
      const shift = (d.y0 - pt.y) / 3.6;
      const g = groups.map((x) => [...x]);
      g[d.j] = d.arr0.map((v) => clamp100(v + shift));
      setGroups(g);
    }
  });
  const cols = groups.map((g, j) => {
    const x0 = 40 + j * colW + 16;
    const x1 = 40 + (j + 1) * colW - 16;
    const cx = (x0 + x1) / 2;
    const d = describeStats(g);
    const spreadW = Math.min(colW - 70, (g.length - 1) * 14);
    const px = (i: number) => cx - spreadW / 2 + (g.length > 1 ? (i * spreadW) / (g.length - 1) : 0);
    return { x0, x1, cx, m: d.mean ?? 50, sd: d.sd ?? 0, px };
  });

  // ── tables ──
  type Row = (string | number)[];
  let head: string[] = ["", "SS", "df", "MS", "F", "p"];
  let rows: Row[];
  let tableNote = "";
  if (two && tw) {
    const r = (nm: string, x: { ss: number; df: number; ms: number | null; F: number | null; p: number | null }): Row => [nm, fmt(x.ss, 1), x.df, fmt(x.ms, 2), fmt(x.F, 3), fmtP(x.p)];
    rows = [r("A", tw.A), r("B", tw.B), r("A × B", tw.AB), ["Within", fmt(tw.within.ss, 1), tw.within.df, fmt(tw.within.ms, 2), "", ""], ["Total", fmt(tw.sst, 1), tw.A.df + tw.B.df + tw.AB.df + tw.within.df, "", "", ""]];
    tableNote = tw.method;
  } else if (rm && rmA) {
    head = ["", "SS", "df", "MS", "F", "p", "p (G–G)"];
    rows = [
      [lang === "hu" ? "Feltétel" : "Conditions", fmt(rmA.ssCond, 1), rmA.dfCond, fmt(rmA.ssCond / rmA.dfCond, 2), fmt(rmA.F, 3), fmtP(rmA.p), rmA.pGG === null ? "—" : fmtP(rmA.pGG)],
      [lang === "hu" ? "Személyek" : "Subjects", fmt(rmA.ssSubj, 1), rmA.n - 1, fmt(rmA.ssSubj / (rmA.n - 1), 2), "", "", ""],
      [lang === "hu" ? "Hiba" : "Error", fmt(rmA.ssErr, 1), rmA.dfErr, fmt(rmA.ssErr / rmA.dfErr, 2), "", "", ""],
      ["Total", fmt(rmA.sst, 1), rmA.n * rmA.k - 1, "", "", "", ""],
    ];
    tableNote = (rmA.reason ? rmA.reason + " · " : "") + (rmA.epsGG === null ? "" : `Greenhouse–Geisser ε = ${fmt(rmA.epsGG, 3)}`);
  } else {
    rows = [
      ["Between", fmt(a.ssb, 1), a.dfB, fmt(a.msb, 2), fmt(a.F, 3), fmtP(a.p)],
      ["Within", fmt(a.ssw, 1), a.dfW, fmt(a.msw, 2), "", ""],
      ["Total", fmt(a.sst, 1), a.dfB + a.dfW, "", "", ""],
      ["Welch", "", welch.df2 === null ? "—" : fmt(welch.df2, 1), "", fmt(welch.F, 3), fmtP(welch.p)],
    ];
    tableNote = a.zeroWithin ? t.noWithin : a.tooSmall ? t.tooSmall : welch.method;
  }

  // ── readouts ──
  let readouts: Readout[];
  if (two && tw) {
    readouts = [
      { label: "F_A · p", value: `${fmt(tw.A.F, 2)} · ${fmtP(tw.A.p)}` },
      { label: "F_B · p", value: `${fmt(tw.B.F, 2)} · ${fmtP(tw.B.p)}` },
      { label: "F_A×B · p", value: `${fmt(tw.AB.F, 2)} · ${fmtP(tw.AB.p)}`, tone: "residual" },
      { label: "partial η² (A, B, A×B)", value: `${fmt(tw.A.eta2p, 2)}, ${fmt(tw.B.eta2p, 2)}, ${fmt(tw.AB.eta2p, 2)}`, tone: "model" },
      { label: t.grandMean, value: tw.grand ?? "—", digits: 2 },
    ];
  } else if (rm && rmA) {
    readouts = [
      { label: `F (${rmA.dfCond}, ${rmA.dfErr})`, value: rmA.F ?? "—", digits: 3 },
      { label: "p", value: fmtP(rmA.p), tone: rmA.p !== null && rmA.p < 0.05 ? "residual" : undefined },
      { label: "partial η²", value: rmA.eta2p ?? "—", digits: 3, tone: "model" },
      { label: "ε (G–G) · p", value: rmA.epsGG === null ? "—" : `${fmt(rmA.epsGG, 3)} · ${fmtP(rmA.pGG)}` },
      { label: lang === "hu" ? "egyszempontos F · p" : "one-way F · p", value: `${fmt(a.F, 2)} · ${fmtP(a.p)}`, tone: "muted" },
      { label: t.grandMean, value: rmA.grand, digits: 2 },
    ];
  } else {
    readouts = [
      { label: `F (${a.dfB}, ${a.dfW})`, value: a.F ?? "—", digits: 3 },
      { label: "p", value: fmtP(a.p), tone: omnibusSig ? "residual" : undefined },
      { label: "η²", value: a.eta2 ?? "—", digits: 3, tone: "model" },
      { label: "ω²", value: om ?? "—", digits: 3, tone: "model" },
      { label: "Welch F · df₂ · p", value: welch.F === null ? "—" : `${fmt(welch.F, 2)} · ${fmt(welch.df2, 1)} · ${fmtP(welch.p)}` },
      { label: "F crit (α = .05)", value: a.dfW > 0 ? fQuantile(0.95, a.dfB, a.dfW) : "—", digits: 3 },
      { label: t.grandMean, value: a.grand ?? "—", digits: 2 },
      ...(pw ? [{ label: t.sigPairs, value: `${pw.rows.filter((r) => r.p !== null && r.p < 0.05).length} / ${pw.rows.length}`, tone: "residual" as const }] : []),
    ];
  }
  const Fmain = two ? tw?.AB.F : rm ? rmA?.F : a.F;
  const pMain = two ? tw?.AB.p : rm ? rmA?.p : a.p;
  const live = t.live.replace("{F}", fmt(Fmain ?? null, 2)).replace("{p}", fmtP(pMain ?? null)).replace("{e}", fmt(rm ? (rmA?.eta2p ?? null) : a.eta2, 3));

  // ── interaction plot (two-way) ──
  const iRef = useRef<SVGSVGElement>(null);
  const IY = (v: number) => 190 - (v - 20) * (170 / 70);
  const IVI = (py: number) => 20 + ((190 - py) * 70) / 170;
  const cellIdx = (aI: number, bI: number) => aI * 2 + bI;
  const shiftCell = (j: number, target: number) => {
    const g = groups.map((x) => [...x]);
    const m = cols[j].m;
    g[j] = g[j].map((v) => clamp100(v + target - m));
    setGroups(g);
  };
  const iDrag = useSvgDrag<number>(iRef, (j, pt) => shiftCell(j, IVI(pt.y)));

  // ── forest ──
  const prs = pw?.rows ?? [];
  const lim = Math.max(5, ...prs.map((r) => (r.ci ? Math.max(Math.abs(r.ci[0]), Math.abs(r.ci[1])) : Math.abs(r.diff))));
  const FX = (v: number) => 220 + v * (170 / lim);
  const fy = (i: number) => 20 + i * 22;

  const pick = (k2: AnovaPreset) => setMany({ preset: k2, groups: [], sep: 0, spread: 1 });
  const demos: TeachDemo[] = [
    { title: t.presets.null, note: t.insight.oneway, apply: () => setMany({ design: "oneway", preset: "null", groups: [], sep: 0, spread: 1 }) },
    { title: t.presets.unequal, note: lang === "hu" ? "Eltérő szórások: hasonlítsd a Welch F-et a klasszikushoz, és válts Games–Howellre." : "Unequal spreads: compare Welch F with the classical F, then switch to Games–Howell.", apply: () => setMany({ design: "oneway", k: 5, preset: "unequal", groups: [], correction: "gameshowell", sep: 0, spread: 1 }) },
    { title: t.presets.interaction, note: t.insight.twoway, apply: () => setMany({ design: "twoway", preset: "interaction", groups: [], sep: 0, spread: 1 }) },
    { title: t.rm, note: t.insight.rm, apply: () => setMany({ design: "rm", k: 3, preset: "base", groups: [], sep: 0, spread: 1 }) },
  ];

  const aside = (
    <>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
      <Panel title={two ? t.twoway : rm ? t.conditions : t.groups}>
        <div className="space-y-3">
          {!two && <ParameterControl label={rm ? t.conditions : t.groups} value={k} min={2} max={5} step={1} param="k" onChange={(v) => setMany({ k: v, preset: P.preset === "custom" ? "base" : P.preset, groups: [] })} />}
          {P.design === "oneway" && (
            <ChoiceControl<Correction>
              label={t.correction}
              param="correction"
              value={P.correction}
              onChange={(v) => set("correction", v)}
              options={(["none", "bonferroni", "tukey", "gameshowell"] as const).map((v) => ({ value: v, label: t.corr[v] }))}
            />
          )}
          <ParameterControl label={t.sep} value={P.sep} min={-30} max={30} step={1} param="sep" disabled={dataLocked} onChange={(v) => set("sep", v)} />
          <ParameterControl label={t.spread} value={P.spread} min={0.2} max={2} step={0.1} param="spread" disabled={dataLocked} onChange={(v) => set("spread", v)} format={(v) => `×${fmt(v, 1)}`} />
          {!dataLocked && (
            <PresetBar<AnovaPreset>
              label={t.presetsLabel}
              presets={PRESETS.filter((x) => x !== "interaction" || two).map((x) => ({ id: x, label: t.presets[x] }))}
              active={P.preset === "custom" ? undefined : (P.preset as AnovaPreset)}
              onPick={pick}
            />
          )}
          <SeedControl value={P.seed} onChange={(v) => setMany({ seed: v, preset: P.preset === "custom" ? "base" : P.preset, groups: [] })} />
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
      method={two && tw ? tw.method : rm && rmA ? rmA.method : `F, p: one-way ANOVA · ${welch.method}${pw?.rows[0] ? " · " + pw.rows[0].method : ""}`}
      validation={
        lang === "hu"
          ? "F, Welch, Tukey, Games–Howell, kétszempontos SS: SciPy/statsmodels; ismételt mérés és G–G: alap R (tests/unit)"
          : "F, Welch, Tukey, Games–Howell, two-way SS: SciPy/statsmodels; repeated measures and G–G: base R (tests/unit)"
      }
      toolbar={
        <ChoiceControl<AnovaDesign>
          label={t.design}
          hideLabel
          size="md"
          param="design"
          value={P.design}
          onChange={(v) => setMany({ design: v, preset: "base", groups: [], sep: 0, spread: 1 })}
          options={(["oneway", "twoway", "rm"] as const).map((v) => ({ value: v, label: t[v] }))}
        />
      }
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula[P.design].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight[P.design]}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[P.design]}</p>
        {rm && <p className="text-xs text-muted">{t.subjectLines}</p>}
        <AccessibleVisualization
          interactive
          svgRef={svgRef}
          onPointerMove={drag.move}
          onPointerUp={drag.end}
          viewBox="0 0 760 410"
          summary={`${t.title}: ${groups.map((g, j) => `${label(j)} ${t.mean} ${fmt(cols[j].m, 1)}, SD ${fmt(cols[j].sd, 1)}`).join("; ")}. ${live}`}
          table={{ caption: t.title, columns: [rm ? t.subject : "#", ...groups.map((_, j) => label(j))], rows: Array.from({ length: N_PER_GROUP }, (_, i) => [i + 1, ...groups.map((g) => g[i])]) }}
        >
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={40} x2={730} y1={Y(v)} y2={Y(v)} stroke="var(--grid)" />
              <text x={34} y={Y(v) + 3} textAnchor="end" fontSize={10} fill="var(--muted)" className="font-mono">
                {v}
              </text>
            </g>
          ))}
          {a.grand !== null && <line x1={40} x2={730} y1={Y(a.grand)} y2={Y(a.grand)} stroke="var(--ink)" strokeDasharray="5 4" strokeOpacity={0.5} />}
          {rm &&
            Array.from({ length: N_PER_GROUP }, (_, i) => (
              <polyline key={`s${i}`} points={groups.map((g, j) => `${cols[j].px(i)},${Y(g[i])}`).join(" ")} fill="none" stroke="var(--border-strong)" strokeWidth={1.2} />
            ))}
          {groups.map((g, j) => {
            const c = cols[j];
            return (
              <g key={j}>
                <rect x={c.x0 + 6} y={Y(c.m + c.sd)} width={c.x1 - c.x0 - 12} height={Math.max(0, Y(c.m - c.sd) - Y(c.m + c.sd))} rx={6} fill={color(j)} fillOpacity={0.1} />
                <line x1={c.x0} x2={c.x1} y1={Y(c.m)} y2={Y(c.m)} stroke={color(j)} strokeWidth={3} />
                {g.map((v, i) => (
                  <circle
                    key={i}
                    cx={c.px(i)}
                    cy={Y(v)}
                    r={6}
                    fill={color(j)}
                    stroke="var(--surface)"
                    strokeWidth={1.5}
                    style={{ cursor: dataLocked ? "default" : "ns-resize" }}
                    aria-hidden
                    onPointerDown={dataLocked ? undefined : (e) => drag.start({ kind: "pt", j, i }, e)}
                  />
                ))}
                {!dataLocked && (
                  <DragHandle
                    x={c.x1 - 14}
                    y={Y(c.m)}
                    r={8}
                    fill="var(--ink)"
                    label={`${label(j)}: ${t.mean}`}
                    value={Math.round(c.m * 10) / 10}
                    min={0}
                    max={100}
                    step={1}
                    valueText={fmt(c.m, 1)}
                    onStart={(e) => drag.start({ kind: "mean", j, y0: Y(c.m), arr0: [...g] }, e)}
                    onValue={(v) => shiftCell(j, v)}
                  />
                )}
                <text x={c.cx} y={400} textAnchor="middle" fontSize={11} fill="var(--muted)" className="font-mono">
                  {label(j)} · x̄ {fmt(c.m, 1)} · s {fmt(c.sd, 1)}
                </text>
              </g>
            );
          })}
        </AccessibleVisualization>
        <div className={rm ? "max-w-2xl" : "grid gap-4 lg:grid-cols-2"}>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.table}</h2>
            <div className="mt-1 overflow-x-auto" role="region" aria-label={t.table} tabIndex={0}>
              <table className="w-full text-sm" data-testid="anova-table">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    {head.map((h) => (
                      <th key={h} className="px-2 py-1 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      {r.map((c, j) => (
                        <td key={j} className={j ? "px-2 py-1" : "px-2 py-1 font-sans"}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {tableNote && <p className="mt-1 text-xs text-muted">{tableNote}</p>}
            {rm && <p className="mt-1 text-xs text-muted">{t.oneWayCompare.replace("{F}", fmt(a.F, 2)).replace("{p}", fmtP(a.p))}</p>}
            {!two && !rm && a.sst !== null && a.sst > 0 && (
              <div className="mt-3" aria-hidden>
                <div className="flex h-3 overflow-hidden rounded">
                  <div className="bg-model" style={{ width: `${(100 * a.ssb) / a.sst}%` }} />
                  <div className="bg-surface-3" style={{ width: `${(100 * a.ssw) / a.sst}%` }} />
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  SSB {fmt((100 * a.ssb) / a.sst, 0)} % · SSW {fmt((100 * a.ssw) / a.sst, 0)} %
                </p>
              </div>
            )}
          </section>
          {P.design === "oneway" && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.pairs}</h2>
              {!showPairs ? (
                <LabNote tone="info">{t.postHocHidden}</LabNote>
              ) : (
                <AccessibleVisualization
                  viewBox={`0 0 420 ${fy(prs.length) + 16}`}
                  summary={`${t.pairs}: ${prs.map((r) => `${label(r.i)}−${label(r.j)} ${fmt(r.diff, 1)}, p ${fmtP(r.p)}`).join("; ")}`}
                  table={{
                    caption: t.pairs,
                    columns: ["", "diff", "95 % CI", "p"],
                    rows: prs.map((r) => [`${label(r.i)}−${label(r.j)}`, fmt(r.diff, 2), r.ci ? `[${fmt(r.ci[0], 2)}, ${fmt(r.ci[1], 2)}]` : "—", fmtP(r.p)]),
                  }}
                >
                  <line x1={FX(0)} x2={FX(0)} y1={8} y2={fy(prs.length) - 8} stroke="var(--border-strong)" />
                  {prs.map((r, i) => {
                    const sig = r.p !== null && r.p < 0.05;
                    return (
                      <g key={i}>
                        <text x={6} y={fy(i) + 4} fontSize={10} fill="var(--muted)" className="font-mono">
                          {label(r.i)}−{label(r.j)}
                        </text>
                        {r.ci && <line x1={FX(r.ci[0])} x2={FX(r.ci[1])} y1={fy(i)} y2={fy(i)} stroke={sig ? "var(--residual)" : "var(--data)"} strokeWidth={3} />}
                        <circle cx={FX(r.diff)} cy={fy(i)} r={4} fill={sig ? "var(--residual)" : "var(--data)"} />
                        <text x={416} y={fy(i) + 4} textAnchor="end" fontSize={10} fill={sig ? "var(--residual-ink)" : "var(--muted)"} className="font-mono">
                          {fmt(r.diff, 1)} p {fmtP(r.p)}
                        </text>
                      </g>
                    );
                  })}
                  <text x={FX(0)} y={fy(prs.length) + 8} textAnchor="middle" fontSize={9} fill="var(--muted)" className="font-mono">
                    0
                  </text>
                </AccessibleVisualization>
              )}
            </section>
          )}
          {two && tw && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.interaction}</h2>
              <AccessibleVisualization
                interactive
                svgRef={iRef}
                onPointerMove={iDrag.move}
                onPointerUp={iDrag.end}
                viewBox="0 0 440 220"
                summary={`${t.interaction}: ${CELL.map((c, j) => `${c} ${fmt(cols[j].m, 1)}`).join(", ")}`}
                table={{ caption: t.interaction, columns: ["", "B1", "B2"], rows: [0, 1].map((aI) => [`A${aI + 1}`, fmt(cols[cellIdx(aI, 0)].m, 1), fmt(cols[cellIdx(aI, 1)].m, 1)]) }}
              >
                {[0, 1].map((bI) => (
                  <line key={bI} x1={100} x2={340} y1={IY(cols[cellIdx(0, bI)].m)} y2={IY(cols[cellIdx(1, bI)].m)} stroke={bI ? "var(--explained)" : "var(--data)"} strokeWidth={2.5} />
                ))}
                {[0, 1].map((aI) => (
                  <text key={aI} x={aI ? 340 : 100} y={212} textAnchor="middle" fontSize={11} fill="var(--muted)" className="font-mono">
                    A{aI + 1}
                  </text>
                ))}
                {[0, 1].map((bI) => (
                  <text key={`l${bI}`} x={356} y={IY(cols[cellIdx(1, bI)].m) + 4} fontSize={11} fill={bI ? "var(--explained-ink)" : "var(--data-ink)"} className="font-mono">
                    B{bI + 1} {fmt(cols[cellIdx(1, bI)].m, 1)}
                  </text>
                ))}
                {[0, 1].flatMap((aI) =>
                  [0, 1].map((bI) => {
                    const j = cellIdx(aI, bI);
                    return (
                      <DragHandle
                        key={j}
                        x={aI ? 340 : 100}
                        y={IY(cols[j].m)}
                        r={7}
                        fill={bI ? "var(--explained)" : "var(--data)"}
                        disabled={dataLocked}
                        label={`${t.interaction}: ${CELL[j]}`}
                        value={Math.round(cols[j].m * 10) / 10}
                        min={20}
                        max={90}
                        step={1}
                        valueText={fmt(cols[j].m, 1)}
                        onStart={(e) => iDrag.start(j, e)}
                        onValue={(v) => shiftCell(j, v)}
                      />
                    );
                  }),
                )}
              </AccessibleVisualization>
              {(() => {
                const m = cols.map((c) => c.m);
                const inter = m[3] - m[1] - (m[2] - m[0]);
                return (
                  <p className="text-sm text-ink">
                    {t.interactionContrast.replace("{v}", fmt(inter, 1))} — {Math.abs(inter) < 3 ? t.parallel : t.notParallel}
                  </p>
                );
              })()}
            </section>
          )}
        </div>
        <details className="rounded-lg border border-line p-3">
          <summary className="cursor-pointer text-sm font-medium">{lang === "hu" ? "Pontszámok (szerkeszthető)" : "Scores (editable)"}</summary>
          <div className="mt-2 overflow-x-auto" role="region" aria-label={lang === "hu" ? "Pontszámok" : "Scores"} tabIndex={0}>
            <table className="text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="px-1 text-left font-medium">{rm ? t.subject : "#"}</th>
                  {groups.map((_, j) => (
                    <th key={j} className="px-1 font-medium">
                      {label(j)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: N_PER_GROUP }, (_, i) => (
                  <tr key={i}>
                    <td className="px-1 font-mono text-xs text-muted">{i + 1}</td>
                    {groups.map((g, j) => (
                      <td key={j} className="p-0.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={g[i]}
                          disabled={dataLocked}
                          aria-label={`${label(j)}, ${t.obs} ${i + 1}`}
                          className="w-16 rounded border border-line bg-surface px-1 py-0.5 text-right font-mono"
                          onChange={(e) => {
                            const v = e.target.valueAsNumber;
                            if (!Number.isFinite(v)) return;
                            const gg = groups.map((x) => [...x]);
                            gg[j][i] = clamp100(v);
                            setGroups(gg);
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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

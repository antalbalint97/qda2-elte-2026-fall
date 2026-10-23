"use client";

// Categorical Data Lab. Port of "QDA2 Categorical Lab.dc.html". An editable count table with a mosaic
// whose tile boundaries can be dragged (keeping N and row totals, or keeping both margins), expected
// counts, adjusted standardised residuals and χ² contributions. χ², Fisher and the odds ratio come from
// engine inference.ts, validated against SciPy and statsmodels in tests/unit/engine.test.ts.
import { chiSquare, fisherExact, oddsRatio } from "@/lib/engine/inference";
import { fmt, fmtP } from "@/lib/engine/format";
import { cn } from "@/lib/cn";
import { useRef } from "react";
import { ChoiceControl, LabButton, ParameterControl } from "../../primitives/controls";
import { LabNote, StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, PresetBar, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { CAT_T } from "./strings";
import { moveRowBoundary, moveWithinRow, PRESET_TABLES, resize, scaled, transpose, type PresetTable, type Table } from "./table-ops";

type Show = "obs" | "rowpct" | "exp" | "resid";
type Keep = "N" | "margins";
export interface CatParams extends Record<string, unknown> {
  preset: PresetTable | "custom";
  table: Table;
  rows: number;
  cols: number;
  keep: Keep;
  show: Show;
  scale: number;
  rowLabels: string[];
  colLabels: string[];
}
const DEFAULTS: CatParams = {
  preset: "lecture",
  table: PRESET_TABLES.lecture.base.map((r) => [...r]),
  // 0 = the preset's own size; a configuration may set rows/cols to resize the preset table
  rows: 0,
  cols: 0,
  keep: "N",
  show: "obs",
  scale: 1,
  rowLabels: [...PRESET_TABLES.lecture.rows],
  colLabels: [...PRESET_TABLES.lecture.cols],
};
const MAX_CELL = 100000;
const clampInt = (v: unknown, lo: number, hi: number, d: number) => (Number.isInteger(v) ? Math.min(hi, Math.max(lo, v as number)) : d);
const labels = (v: unknown, n: number, fallback: readonly string[], word: string) =>
  Array.from({ length: n }, (_, i) => (Array.isArray(v) && typeof v[i] === "string" ? (v[i] as string).slice(0, 32) : (fallback[i] ?? `${word} ${i + 1}`)));

/** A named preset fixes the counts and labels (resized to rows × cols); "custom" keeps a validated table. */
export function normalizeCat(p: CatParams): CatParams {
  const preset = p.preset === "custom" || p.preset in PRESET_TABLES ? p.preset : DEFAULTS.preset;
  const custom = preset === "custom" && Array.isArray(p.table) && p.table.length >= 2 && p.table.every((r) => Array.isArray(r) && r.length === p.table[0].length && r.every((v) => Number.isFinite(v)));
  const src: readonly (readonly number[])[] = custom ? p.table : PRESET_TABLES[preset === "custom" ? "lecture" : preset].base;
  const rows = p.rows ? clampInt(p.rows, 2, 5, Math.min(5, src.length)) : Math.min(5, src.length);
  const cols = p.cols ? clampInt(p.cols, 2, 5, Math.min(5, src[0].length)) : Math.min(5, src[0].length);
  const table = resize(src, rows, cols).map((r) => r.map((v) => Math.min(MAX_CELL, Math.max(0, Math.round(v)))));
  const pre = preset === "custom" ? null : PRESET_TABLES[preset];
  return {
    ...p,
    preset,
    table,
    rows,
    cols,
    keep: p.keep === "margins" ? "margins" : "N",
    show: (["obs", "rowpct", "exp", "resid"] as const).includes(p.show) ? p.show : "obs",
    scale: Number.isFinite(p.scale) ? Math.min(10, Math.max(0.25, Math.round(p.scale * 100) / 100)) : 1,
    rowLabels: labels(pre ? pre.rows : p.rowLabels, rows, [], "Row"),
    colLabels: labels(pre ? pre.cols : p.colLabels, cols, [], "Col"),
  };
}

const MX = 12;
const MY = 12;
const MW = 400;
const MH = 280;
const GAP = 4;

export default function CategoricalLab(props: LabProps) {
  const lab = useLab<CatParams>("categorical-lab", DEFAULTS, { ...props, normalize: normalizeCat });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = CAT_T[lang];
  const base = P.table;
  const table = scaled(base, P.scale);
  const R = table.length;
  const C = table[0].length;
  const cs = chiSquare(table);
  const N = cs.N;
  const is22 = R === 2 && C === 2;
  const or = is22 ? oddsRatio(table) : null;
  const fe = is22 ? fisherExact(table) : null;
  const tableLocked = locked("table");
  const sizeLocked = locked("rows") || locked("cols");
  const setTable = (tb: Table) => setMany({ table: tb, preset: "custom", rowLabels: P.rowLabels, colLabels: P.colLabels });
  const rowName = (i: number) => P.rowLabels[i] || `r${i + 1}`;
  const colName = (j: number) => P.colLabels[j] || `c${j + 1}`;

  // ── mosaic geometry (on the base counts: drags edit the base table) ──
  const bRows = base.map((r) => r.reduce((a, b) => a + b, 0));
  const bN = bRows.reduce((a, b) => a + b, 0);
  const usable = MW - GAP * (R - 1);
  const colX: number[] = [];
  const colW: number[] = [];
  let x = MX;
  bRows.forEach((rt) => {
    const w = bN ? (rt / bN) * usable : usable / R;
    colX.push(x);
    colW.push(w);
    x += w + GAP;
  });
  const cellY = (i: number, j: number) => MY + (bRows[i] ? (base[i].slice(0, j).reduce((a, b) => a + b, 0) / bRows[i]) * MH : (j / C) * MH);
  const cellH = (i: number, j: number) => (bRows[i] ? (base[i][j] / bRows[i]) * MH : MH / C);
  const resFill = (z: number | null | undefined) => {
    if (z === null || z === undefined) return "var(--surface-3)";
    const a = Math.round(20 + 60 * Math.min(1, Math.abs(z) / 3));
    return `color-mix(in srgb, ${z > 0 ? "var(--data)" : "var(--residual)"} ${a}%, var(--surface))`;
  };
  const svgRef = useRef<SVGSVGElement>(null);
  type DragId = { kind: "cell"; i: number; j: number } | { kind: "row"; i: number };
  const drag = useSvgDrag<DragId>(svgRef, (id, pt) => {
    if (id.kind === "cell") {
      const c = ((pt.y - MY) / MH) * bRows[id.i];
      setTable(moveWithinRow(base, id.i, id.j, c, P.keep === "margins"));
    } else {
      const c = ((pt.x - MX - GAP * id.i) / usable) * bN;
      setTable(moveRowBoundary(base, id.i, c));
    }
  });

  const cellText = (i: number, j: number): string => {
    if (P.show === "rowpct") return cs.rowPct[i]?.[j] == null ? "—" : `${fmt(cs.rowPct[i][j] as number, 1)} %`;
    if (P.show === "exp") return cs.E[i] ? fmt(cs.E[i][j], 1) : "—";
    if (P.show === "resid") return cs.stdRes[i]?.[j] == null ? "—" : fmt(cs.stdRes[i][j] as number, 2);
    return String(table[i][j]);
  };
  const minE = cs.E.length ? Math.min(...cs.E.flat()) : null;
  const readouts: Readout[] = [
    { label: "χ² (Pearson)", value: cs.chi2 ?? "—", digits: 3 },
    { label: "df", value: String(cs.df) },
    { label: "p", value: fmtP(cs.p), tone: cs.p !== null && cs.p < 0.05 ? "residual" : undefined },
    { label: "Cramér V", value: cs.V ?? "—", digits: 3, tone: "explained" },
  ];
  if (is22) {
    readouts.push({ label: "φ", value: cs.phi ?? "—", digits: 3, tone: "explained" });
    readouts.push({ label: "χ² Yates / p", value: cs.yates ? `${fmt(cs.yates.chi2, 3)} / ${fmtP(cs.yates.p)}` : "—" });
    readouts.push({ label: lang === "hu" ? "Fisher egzakt p" : "Fisher exact p", value: fe ? fmtP(fe.p) : "—" });
    if (or) readouts.push({ label: "OR [95 % CI]", value: `${fmt(or.or, 2)} [${fmt(or.ci[0], 2)}, ${fmt(or.ci[1], 2)}]`, tone: "model", note: or.method });
    if (or?.rr != null && or.rd != null) readouts.push({ label: "RR · RD", value: `${fmt(or.rr, 2)} · ${fmt(100 * or.rd, 1)} pp`, tone: "model" });
  }
  readouts.push({ label: "min E", value: minE ?? "—", digits: 2, tone: cs.sparse ? "attention" : undefined });
  readouts.push({ label: "N", value: String(N) });
  const live = t.live.replace("{x}", fmt(cs.chi2, 2)).replace("{p}", fmtP(cs.p)).replace("{v}", fmt(cs.V, 3));
  const contribMax = cs.contrib.length ? Math.max(...cs.contrib.flat(), 1e-12) : 1;

  const loadPreset = (k: PresetTable) => {
    const pr = PRESET_TABLES[k];
    setMany({ preset: k, table: pr.base.map((r) => [...r]), rows: pr.base.length, cols: pr.base[0].length, rowLabels: [...pr.rows], colLabels: [...pr.cols], scale: 1 });
  };
  const resizeTo = (rows: number, cols: number) =>
    setMany({
      preset: "custom",
      table: resize(base, rows, cols),
      rows,
      cols,
      rowLabels: Array.from({ length: rows }, (_, i) => P.rowLabels[i] ?? `Row ${i + 1}`),
      colLabels: Array.from({ length: cols }, (_, j) => P.colLabels[j] ?? `Col ${j + 1}`),
    });
  const demos: TeachDemo[] = [
    { title: t.presets.indep, note: t.lead, apply: () => loadPreset("indep") },
    { title: t.presets.strong, note: t.insight, apply: () => loadPreset("strong") },
    { title: t.presets.sparse, note: t.note, apply: () => loadPreset("sparse") },
    { title: t.keepMargins, note: t.keepNote.margins, apply: () => setMany({ keep: "margins" }) },
  ];

  const aside = (
    <>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
      <Panel title={t.table}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <ParameterControl label={t.rows} value={R} min={2} max={5} step={1} param="rows" disabled={sizeLocked} onChange={(v) => resizeTo(v, C)} />
            <ParameterControl label={t.cols} value={C} min={2} max={5} step={1} param="cols" disabled={sizeLocked} onChange={(v) => resizeTo(R, v)} />
          </div>
          <ParameterControl label={t.scale} value={P.scale} min={0.25} max={10} step={0.25} param="scale" onChange={(v) => set("scale", v)} format={(v) => `×${fmt(v, 2)}`} />
          <ChoiceControl<Keep>
            label={t.keep}
            param="keep"
            value={P.keep}
            onChange={(v) => set("keep", v)}
            options={[
              { value: "N", label: t.keepN },
              { value: "margins", label: t.keepMargins },
            ]}
          />
          <p className="text-xs leading-relaxed text-muted">{t.keepNote[P.keep]}</p>
          <LabButton
            disabled={tableLocked || sizeLocked}
            onClick={() => setMany({ preset: "custom", table: transpose(base), rows: C, cols: R, rowLabels: P.colLabels, colLabels: P.rowLabels })}
          >
            {t.swap}
          </LabButton>
          {!tableLocked && (
            <PresetBar<PresetTable>
              label={t.presetsLabel}
              presets={(Object.keys(PRESET_TABLES) as PresetTable[]).map((k) => ({ id: k, label: t.presets[k] }))}
              active={P.preset === "custom" ? undefined : P.preset}
              onPick={loadPreset}
            />
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
      method={cs.method}
      validation={lang === "hu" ? "χ², p, V, Fisher és OR a SciPy/statsmodels referenciával egyezik (tests/unit/engine.test.ts)" : "χ², p, V, Fisher and OR match the SciPy/statsmodels reference (tests/unit/engine.test.ts)"}
      toolbar={
        <ChoiceControl<Show>
          label={t.show}
          hideLabel
          size="md"
          param="show"
          value={P.show}
          onChange={(v) => set("show", v)}
          options={(["obs", "rowpct", "exp", "resid"] as const).map((v) => ({ value: v, label: t[v] }))}
        />
      }
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead}</p>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.mosaic}</h2>
            <p className="text-xs text-muted">{t.tileNote}</p>
            <AccessibleVisualization
              interactive
              svgRef={svgRef}
              onPointerMove={drag.move}
              onPointerUp={drag.end}
              viewBox="0 0 520 338"
              summary={`${t.mosaic}: ${table.map((r, i) => `${rowName(i)} (${bRows[i]}): ${r.map((v, j) => `${colName(j)} ${v}`).join(", ")}`).join("; ")}. ${live}`}
              table={{
                caption: `${t.mosaic}: ${t.rowpct}`,
                columns: ["", ...P.colLabels.map((_, j) => colName(j)), t.total],
                rows: table.map((r, i) => [rowName(i), ...r.map((_, j) => (cs.rowPct[i]?.[j] == null ? "—" : `${fmt(cs.rowPct[i][j] as number, 1)} %`)), String(cs.rows[i])]),
              }}
            >
              {base.map((r, i) =>
                r.map((v, j) => (
                  <g key={`${i}-${j}`}>
                    <rect x={colX[i]} y={cellY(i, j)} width={Math.max(0, colW[i])} height={Math.max(0, cellH(i, j))} fill={resFill(cs.stdRes[i]?.[j])} stroke="var(--surface)" strokeWidth={1.5} />
                    {colW[i] > 34 && cellH(i, j) > 18 && (
                      <text x={colX[i] + colW[i] / 2} y={cellY(i, j) + cellH(i, j) / 2 + 4} textAnchor="middle" fontSize={14} fill="var(--ink)" className="font-mono">
                        {table[i][j]}
                      </text>
                    )}
                  </g>
                )),
              )}
              {base.map((_, i) => (
                <text key={i} x={colX[i] + colW[i] / 2} y={MY + MH + 36} textAnchor="middle" fontSize={13} fill="var(--muted)">
                  {colW[i] > 24 ? rowName(i) : ""}
                </text>
              ))}
              {P.colLabels.map((_, j) => (
                <text key={j} x={MX + MW + 8} y={cellY(R - 1, j) + cellH(R - 1, j) / 2 + 4} fontSize={12} fill="var(--muted)">
                  {cellH(R - 1, j) > 14 ? colName(j).slice(0, 14) : ""}
                </text>
              ))}
              {!tableLocked &&
                base.map((r, i) =>
                  r.slice(0, -1).map((_, j) => {
                    const cum = r.slice(0, j + 1).reduce((a, b) => a + b, 0);
                    const lo = cum - r[j];
                    const hi = cum + r[j + 1];
                    return (
                      <DragHandle
                        key={`h${i}-${j}`}
                        x={colX[i] + colW[i] / 2}
                        y={cellY(i, j + 1)}
                        r={6}
                        fill="var(--ink)"
                        label={`${rowName(i)}: ${colName(j)} | ${colName(j + 1)}`}
                        value={r[j]}
                        min={0}
                        max={r[j] + r[j + 1]}
                        step={1}
                        valueText={`${colName(j)} ${r[j]}, ${colName(j + 1)} ${r[j + 1]}`}
                        onStart={(e) => drag.start({ kind: "cell", i, j }, e)}
                        onValue={(v) => setTable(moveWithinRow(base, i, j, Math.min(hi, Math.max(lo, lo + v)), P.keep === "margins"))}
                      />
                    );
                  }),
                )}
              {!tableLocked &&
                P.keep === "N" &&
                bRows.slice(0, -1).map((rt, i) => (
                  <DragHandle
                    key={`r${i}`}
                    x={colX[i] + colW[i] + GAP / 2}
                    y={MY + MH + 12}
                    r={6}
                    fill="var(--model)"
                    orientation="horizontal"
                    label={`${rowName(i)} | ${rowName(i + 1)}: ${lang === "hu" ? "sorösszeg" : "row total"}`}
                    value={rt}
                    min={0}
                    max={rt + bRows[i + 1]}
                    step={1}
                    valueText={`${rowName(i)} ${rt}, ${rowName(i + 1)} ${bRows[i + 1]}`}
                    onStart={(e) => drag.start({ kind: "row", i }, e)}
                    onValue={(v) => setTable(moveRowBoundary(base, i, bRows.slice(0, i).reduce((a, b) => a + b, 0) + v))}
                  />
                ))}
            </AccessibleVisualization>
            <p className="mt-1 flex flex-wrap gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: resFill(2.5) }} aria-hidden /> {t.more}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: resFill(-2.5) }} aria-hidden /> {t.fewer}
              </span>
            </p>
          </section>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {t.table}: {t[P.show]}
            </h2>
            <div className="mt-2 overflow-x-auto" role="region" aria-label={`${t.table}: ${t[P.show]}`} tabIndex={0}>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-1" />
                    {P.colLabels.map((l, j) => (
                      <th key={j} className="p-1 text-left font-medium">
                        <input
                          className="w-full min-w-16 rounded border border-line bg-surface px-1.5 py-1 text-xs"
                          value={l}
                          maxLength={32}
                          aria-label={`${t.colLabel} ${j + 1}`}
                          onChange={(e) => setMany({ preset: "custom", table: base, colLabels: P.colLabels.map((x, k) => (k === j ? e.target.value : x)) })}
                        />
                      </th>
                    ))}
                    <th className="p-1 text-right text-xs font-medium text-muted">{t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((r, i) => (
                    <tr key={i}>
                      <th className="p-1 text-left font-medium">
                        <input
                          className="w-full min-w-16 rounded border border-line bg-surface px-1.5 py-1 text-xs"
                          value={P.rowLabels[i]}
                          maxLength={32}
                          aria-label={`${t.rowLabel} ${i + 1}`}
                          onChange={(e) => setMany({ preset: "custom", table: base, rowLabels: P.rowLabels.map((x, k) => (k === i ? e.target.value : x)) })}
                        />
                      </th>
                      {r.map((v, j) => (
                        <td key={j} className="p-1">
                          {P.show === "obs" ? (
                            <input
                              type="number"
                              min={0}
                              step={1}
                              className="w-full min-w-14 rounded border border-line bg-surface px-1.5 py-1 text-right font-mono"
                              value={v}
                              disabled={tableLocked}
                              aria-label={`${t.count}: ${rowName(i)} × ${colName(j)}`}
                              onChange={(e) => {
                                const n = e.target.valueAsNumber;
                                if (!Number.isFinite(n)) return;
                                const tb = base.map((row) => [...row]);
                                tb[i][j] = Math.min(MAX_CELL, Math.max(0, Math.round(n / P.scale)));
                                setTable(tb);
                              }}
                            />
                          ) : (
                            <span
                              className={cn("block rounded px-1.5 py-1 text-right font-mono", (P.show === "resid" || P.show === "exp") && "text-ink")}
                              style={P.show === "resid" || P.show === "exp" ? { background: resFill(cs.stdRes[i]?.[j]) } : undefined}
                            >
                              {cellText(i, j)}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="p-1 text-right font-mono text-muted">{cs.rows[i]}</td>
                    </tr>
                  ))}
                  <tr>
                    <th className="p-1 text-left text-xs font-medium text-muted">{t.total}</th>
                    {cs.cols.map((v, j) => (
                      <td key={j} className="p-1 text-right font-mono text-muted">
                        {v}
                      </td>
                    ))}
                    <td className="p-1 text-right font-mono font-semibold">{N}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {cs.chi2 === null && <LabNote tone="warn">{t.empty}</LabNote>}
            {cs.sparse && (
              <LabNote tone="warn">
                {t.sparse
                  .replace("{k}", String(cs.expLt5))
                  .replace("{pct}", fmt((100 * cs.expLt5) / (R * C), 0))
                  .replace("{min}", fmt(minE, 2))}
              </LabNote>
            )}
            <h2 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{t.contrib}</h2>
            <AccessibleVisualization
              viewBox={`0 0 ${Math.max(300, R * C * 46 + 20)} 150`}
              summary={`${t.contrib}: χ² = ${fmt(cs.chi2, 3)}`}
              table={{
                caption: t.contrib,
                columns: ["", ...P.colLabels.map((_, j) => colName(j))],
                rows: cs.contrib.map((r, i) => [rowName(i), ...r.map((v) => fmt(v, 3))]),
              }}
            >
              {cs.contrib.flatMap((r, i) =>
                r.map((v, j) => {
                  const k = i * C + j;
                  const h = Math.max(1, (v / contribMax) * 96);
                  return (
                    <g key={k}>
                      <rect x={14 + k * 46} y={112 - h} width={36} height={h} rx={2} fill={(cs.stdRes[i][j] ?? 0) > 0 ? "var(--data)" : "var(--residual)"} />
                      <text x={32 + k * 46} y={108 - h} textAnchor="middle" fontSize={10} fill="var(--ink)" className="font-mono">
                        {fmt(v, 2)}
                      </text>
                      <text x={32 + k * 46} y={126} textAnchor="middle" fontSize={9} fill="var(--muted)">
                        {rowName(i).slice(0, 6)}
                      </text>
                      <text x={32 + k * 46} y={138} textAnchor="middle" fontSize={9} fill="var(--muted)">
                        {colName(j).slice(0, 6)}
                      </text>
                    </g>
                  );
                }),
              )}
            </AccessibleVisualization>
          </section>
        </div>
        <p className="text-xs leading-relaxed text-muted">{t.note}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </LabShell>
  );
}

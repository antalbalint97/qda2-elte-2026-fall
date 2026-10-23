"use client";

// Lazarsfeld & Simpson Lab. Port of "QDA2 Lazarsfeld Lab.dc.html". The zero-order table and the two
// partial tables as linked bar panels; draggable partial percentages and Z composition; pattern
// classification and the causal-order (antecedent / intervening) advice. The zero-order table is never
// typed: it is the cell-wise sum of the partials, and the weighted-mean identity is checked on render.
import { fmt } from "@/lib/engine/format";
import { cn } from "@/lib/cn";
import { useRef, useState } from "react";
import { ChoiceControl, LabButton, SelectControl } from "../../primitives/controls";
import { StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { classify, clone, LZ_SCENARIOS, partials, setComposition, setPartialPct, type Pattern, type ScenarioId, type Tables } from "./model";
import { LZ_T } from "./strings";

type Order = "antecedent" | "intervening";
export interface LzParams extends Record<string, unknown> {
  scenario: ScenarioId;
  /** Edited counts; empty = the scenario's own counts. */
  tables: Tables;
  order: Order;
  hideAnswer: boolean;
}
const IDS = Object.keys(LZ_SCENARIOS) as ScenarioId[];
const DEFAULTS: LzParams = { scenario: "replication", tables: [], order: "antecedent", hideAnswer: false };
const MAX = 100000;
const valid = (t: unknown): t is Tables =>
  Array.isArray(t) && t.length === 2 && t.every((z) => Array.isArray(z) && z.length === 2 && z.every((r) => Array.isArray(r) && r.length === 2 && r.every((v) => Number.isInteger(v) && v >= 0 && v <= MAX)));

export function normalizeLz(p: LzParams): LzParams {
  const scenario = IDS.includes(p.scenario) ? p.scenario : DEFAULTS.scenario;
  return { ...p, scenario, tables: valid(p.tables) ? p.tables : [], order: p.order === "intervening" ? "intervening" : "antecedent", hideAnswer: p.hideAnswer === true };
}

const PANEL_W = 250;
const BASE_Y = 250;
const Y = (v: number | null) => BASE_Y - (v ?? 0) * 1.9;

export default function LazarsfeldSimpsonLab(props: LabProps) {
  const lab = useLab<LzParams>("lazarsfeld-simpson-lab", DEFAULTS, { ...props, normalize: normalizeLz });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = LZ_T[lang];
  const sc = LZ_SCENARIOS[P.scenario];
  const nm = sc.names[lang];
  const tables = P.tables.length ? P.tables : sc.tables;
  const edited = P.tables.length > 0;
  const R = partials(tables);
  const pattern = classify(R);
  const [guess, setGuess] = useState<Pattern | null>(null);
  const [guessFor, setGuessFor] = useState(P.scenario);
  if (guessFor !== P.scenario) {
    setGuessFor(P.scenario);
    setGuess(null);
  }
  const countsLocked = locked("tables");
  const setTables = (tb: Tables) => set("tables", tb);
  const zLabel = (z: number) => `${nm.z}: ${z ? nm.z1 : nm.z0}`;
  const xLabel = (xi: number) => `X = ${xi === 0 ? 1 : 0}`;

  // Weighted-mean identity: zero-order % = Σ_z (n_zx / n_x) · %_zx for each X group.
  const identityOk = [0, 1].every((xi) => {
    const n = R.composition[0][xi] + R.composition[1][xi];
    if (!n || R.zeroPct[xi] === null) return true;
    const w = [0, 1].reduce((a, z) => a + (R.composition[z][xi] / n) * (R.partialPct[z][xi] ?? 0), 0);
    return Math.abs(w - (R.zeroPct[xi] as number)) < 1e-9;
  });
  const match = guess !== null && (guess === pattern || (pattern === "explanation" && guess === "interpretation"));
  const showPattern = !P.hideAnswer || guess !== null;
  const dTxt = (d: number | null) => (d === null ? "—" : `${d > 0 ? "+" : ""}${fmt(d, 1)} pp`);

  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useSvgDrag<{ z: number; xi: number }>(svgRef, (id, pt) => setTables(setPartialPct(tables, id.z, id.xi, (BASE_Y - pt.y) / 1.9)));
  const compRef = useRef<SVGSVGElement>(null);
  const compDrag = useSvgDrag<number>(compRef, (xi, pt) => setTables(setComposition(tables, xi, 1 - (pt.x - 120) / 600)));

  const panels = [
    { title: t.zeroOrder, pct: R.zeroPct, diff: R.zeroDiff, n: R.zero.flat().reduce((a, b) => a + b, 0), z: -1 },
    ...[0, 1].map((z) => ({ title: zLabel(z), pct: R.partialPct[z], diff: R.partialDiff[z], n: tables[z].flat().reduce((a, b) => a + b, 0), z })),
  ];
  const readouts: Readout[] = [
    { label: "d₀", value: dTxt(R.zeroDiff), tone: "residual" },
    { label: `d (${nm.z0})`, value: dTxt(R.partialDiff[0]) },
    { label: `d (${nm.z1})`, value: dTxt(R.partialDiff[1]) },
    { label: t.meanPartial, value: R.partialDiff.some((d) => d === null) ? "—" : dTxt(((R.partialDiff[0] as number) + (R.partialDiff[1] as number)) / 2), tone: "muted" },
    { label: t.pattern, value: !pattern ? "—" : showPattern ? t.patterns[pattern] : "?", tone: "model", note: showPattern ? undefined : t.hiddenPattern },
    { label: t.identity, value: identityOk ? "✓" : "✗", tone: identityOk ? "explained" : "residual" },
  ];
  const live = t.live.replace("{d0}", dTxt(R.zeroDiff)).replace("{d1}", dTxt(R.partialDiff[0])).replace("{d2}", dTxt(R.partialDiff[1]));
  const demos: TeachDemo[] = IDS.map((k) => ({ title: t.patterns[k], note: k === "simpson" ? LZ_SCENARIOS.simpson.source[lang] : t.insight, apply: () => setMany({ scenario: k, tables: [], order: k === "interpretation" ? "intervening" : "antecedent" }) }));

  const aside = (
    <>
      <Panel title={t.readouts}>
        <StatisticReadout items={readouts} size="sm" />
      </Panel>
      <Panel title={t.classify}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t.classify}>
          {(Object.keys(t.patterns) as Pattern[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={guess === k}
              onClick={() => setGuess(k)}
              className={cn("min-h-9 rounded-lg border px-2.5 py-1.5 text-sm", guess === k ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink hover:bg-surface-2")}
            >
              {t.patterns[k]}
            </button>
          ))}
        </div>
        {guess && (
          <p role="status" className={cn("mt-2 text-sm", match ? "text-explained-ink" : "text-residual-ink")}>
            {match ? t.correct + (pattern === "explanation" ? t.correctBoth : "") : t.wrong}
          </p>
        )}
      </Panel>
      <Panel title={t.dag}>
        <ChoiceControl<Order>
          label={t.dag}
          hideLabel
          param="order"
          value={P.order}
          onChange={(v) => set("order", v)}
          options={(["antecedent", "intervening"] as const).map((v) => ({ value: v, label: t.orders[v] }))}
        />
        <svg viewBox="0 0 300 120" className="mt-3 w-full" role="img" aria-label={P.order === "antecedent" ? `${nm.x} ← ${nm.z} → ${nm.y}` : `${nm.x} → ${nm.z} → ${nm.y}`}>
          <defs>
            <marker id="lz-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
            </marker>
          </defs>
          {(() => {
            const Xn = { x: 50, y: 95 };
            const Yn = { x: 250, y: 95 };
            const Zn = P.order === "antecedent" ? { x: 50, y: 25 } : { x: 150, y: 25 };
            const arrows = P.order === "antecedent" ? [[Zn, Xn], [Zn, Yn]] : [[Xn, Zn], [Zn, Yn]];
            const node = (p: { x: number; y: number }, role: string, label: string, color: string) => (
              <g key={role}>
                <rect x={p.x - 46} y={p.y - 16} width={92} height={32} rx={8} fill="var(--surface)" stroke={color} strokeWidth={1.6} />
                <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize={10} fontWeight={700} fill={color} className="font-mono">
                  {role}
                </text>
                <text x={p.x} y={p.y + 10} textAnchor="middle" fontSize={8.5} fill="var(--ink)">
                  {label.length > 18 ? label.slice(0, 17) + "…" : label}
                </text>
              </g>
            );
            return (
              <>
                {arrows.map(([a, b], i) => {
                  const dx = b.x - a.x;
                  const dy = b.y - a.y;
                  const L = Math.hypot(dx, dy);
                  const k = (v: number) => v / L;
                  const pad = Math.abs(dy) > Math.abs(dx) ? 17 : 47;
                  return <line key={i} x1={a.x + k(dx) * pad} y1={a.y + k(dy) * (Math.abs(dy) > 0 ? 17 : 0)} x2={b.x - k(dx) * pad} y2={b.y - k(dy) * 17} stroke="var(--ink)" strokeWidth={1.4} markerEnd="url(#lz-arrow)" />;
                })}
                <line x1={97} y1={95} x2={203} y2={95} stroke="var(--border-strong)" strokeDasharray="4 3" />
                {node(Xn, "X", nm.x, "var(--data-ink)")}
                {node(Yn, "Y", nm.y, "var(--model-ink)")}
                {node(Zn, "Z", nm.z, "var(--residual-ink)")}
              </>
            );
          })()}
        </svg>
        <p className="mt-2 text-sm leading-relaxed text-ink">{t.advice[P.order]}</p>
      </Panel>
    </>
  );

  return (
    <LabShell
      lab={lab}
      title={t.title}
      aside={aside}
      demos={demos}
      synthetic={P.scenario !== "simpson" || edited}
      method={lang === "hu" ? "Parciális táblák; nulladrendű = cellánkénti összeg; %-különbségek" : "Partial tables; zero-order = cell-wise sum; % differences"}
      validation={lang === "hu" ? "Aggregátum = súlyozott parciálisok (1e-12) és a publikált vesekő-példa megfordulása (tests/unit)" : "Aggregate = weighted partials (1e-12) and the published kidney-stone reversal (tests/unit)"}
      toolbar={
        <SelectControl<ScenarioId>
          label={t.scenario}
          param="scenario"
          value={P.scenario}
          onChange={(v) => setMany({ scenario: v, tables: [] })}
          options={IDS.map((k) => ({ value: k, label: t.patterns[k] }))}
        />
      }
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead}</p>
        <p className="text-sm text-ink">
          <span className="font-semibold">X</span> = {nm.x} · <span className="font-semibold">Y</span> = {nm.y} · <span className="font-semibold">Z</span> = {nm.z}
        </p>
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.panels}</h2>
          <p className="text-xs text-muted">{t.panelNote}</p>
          <AccessibleVisualization
            interactive
            svgRef={svgRef}
            onPointerMove={drag.move}
            onPointerUp={drag.end}
            viewBox="0 0 760 330"
            summary={`${t.panels}. ${live}`}
            table={{
              caption: t.panels,
              columns: ["", "% Y=1 | X=1", "% Y=1 | X=0", "d", "n"],
              rows: panels.map((p) => [p.title, p.pct[0] === null ? "—" : fmt(p.pct[0], 1), p.pct[1] === null ? "—" : fmt(p.pct[1], 1), dTxt(p.diff), p.n]),
            }}
          >
            {panels.map((p, i) => {
              const x = 10 + i * PANEL_W;
              return (
                <g key={i}>
                  <rect x={x} y={20} width={PANEL_W - 14} height={305} rx={10} fill={i === 0 ? "var(--surface-2)" : "var(--surface)"} stroke="var(--border)" />
                  <text x={x + (PANEL_W - 14) / 2} y={40} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="var(--ink)">
                    {p.title.length > 34 ? p.title.slice(0, 33) + "…" : p.title}
                  </text>
                  <line x1={x + 20} x2={x + 216} y1={BASE_Y} y2={BASE_Y} stroke="var(--border-strong)" />
                  {[0, 1].map((xi) => (
                    <g key={xi}>
                      <rect x={x + 40 + xi * 90} y={Y(p.pct[xi])} width={66} height={BASE_Y - Y(p.pct[xi])} rx={3} fill={xi === 0 ? "var(--data)" : "var(--surface-3)"} stroke={xi === 0 ? "none" : "var(--border-strong)"} />
                      <text x={x + 73 + xi * 90} y={Y(p.pct[xi]) - 8} textAnchor="middle" fontSize={10.5} fill={xi === 0 ? "var(--data-ink)" : "var(--muted)"} className="font-mono">
                        {p.pct[xi] === null ? "—" : `${fmt(p.pct[xi], 1)} %`}
                      </text>
                      <text x={x + 73 + xi * 90} y={BASE_Y + 16} textAnchor="middle" fontSize={10} fill="var(--muted)" className="font-mono">
                        {xLabel(xi)}
                      </text>
                    </g>
                  ))}
                  {p.pct[0] !== null && p.pct[1] !== null && <line x1={x + 73} x2={x + 163} y1={Y(p.pct[0])} y2={Y(p.pct[1])} stroke="var(--residual)" strokeDasharray="4 3" strokeWidth={1.5} />}
                  <text x={x + 118} y={BASE_Y + 42} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--residual-ink)" className="font-mono">
                    d = {dTxt(p.diff)}
                  </text>
                  <text x={x + 118} y={BASE_Y + 60} textAnchor="middle" fontSize={10} fill="var(--muted)" className="font-mono">
                    n = {p.n}
                  </text>
                  {p.z >= 0 &&
                    !countsLocked &&
                    [0, 1].map((xi) => (
                      <DragHandle
                        key={`h${xi}`}
                        x={x + 73 + xi * 90}
                        y={Y(p.pct[xi])}
                        r={7}
                        fill="var(--ink)"
                        label={`${p.title}, ${xLabel(xi)}: % ${nm.y}`}
                        value={Math.round((p.pct[xi] ?? 0) * 10) / 10}
                        min={0}
                        max={100}
                        step={1}
                        valueText={`${fmt(p.pct[xi], 1)} %`}
                        onStart={(e) => drag.start({ z: p.z, xi }, e)}
                        onValue={(v) => setTables(setPartialPct(tables, p.z, xi, v))}
                      />
                    ))}
                </g>
              );
            })}
          </AccessibleVisualization>
        </section>
        <div className="space-y-4">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.composition}</h2>
            <AccessibleVisualization
              interactive
              svgRef={compRef}
              onPointerMove={compDrag.move}
              onPointerUp={compDrag.end}
              viewBox="0 0 740 130"
              summary={`${t.composition}: ${[0, 1].map((xi) => `${xLabel(xi)}: ${R.composition[1][xi]} / ${R.composition[0][xi] + R.composition[1][xi]} in ${nm.z1}`).join("; ")}`}
            >
              {[0, 1].map((xi) => {
                const n0 = R.composition[0][xi];
                const n1 = R.composition[1][xi];
                const n = n0 + n1;
                const s1 = n ? n1 / n : 0.5;
                const y = 20 + xi * 56;
                return (
                  <g key={xi}>
                    <text x={110} y={y + 20} textAnchor="end" fontSize={12} fill="var(--ink)" className="font-mono">
                      {xLabel(xi)}
                    </text>
                    <rect x={120} y={y} width={600 * (1 - s1)} height={30} fill="color-mix(in srgb, var(--residual) 22%, var(--surface))" stroke="var(--surface)" />
                    <rect x={120 + 600 * (1 - s1)} y={y} width={600 * s1} height={30} fill="color-mix(in srgb, var(--residual) 55%, var(--surface))" stroke="var(--surface)" />
                    <text x={126} y={y + 20} fontSize={11} fill="var(--ink)">
                      {nm.z0} {n0}
                    </text>
                    <text x={714} y={y + 20} textAnchor="end" fontSize={11} fill="var(--ink)">
                      {nm.z1} {n1}
                    </text>
                    {!countsLocked && (
                      <DragHandle
                        x={120 + 600 * (1 - s1)}
                        y={y + 15}
                        r={7}
                        fill="var(--ink)"
                        orientation="horizontal"
                        label={`${xLabel(xi)}: ${t.share.replace("{z}", nm.z0).replace(" = {v}", "")}`}
                        value={Math.round((1 - s1) * 100)}
                        min={0}
                        max={100}
                        step={1}
                        valueText={`${fmt(100 * (1 - s1), 0)} %`}
                        onStart={(e) => compDrag.start(xi, e)}
                        onValue={(v) => setTables(setComposition(tables, xi, 1 - v / 100))}
                      />
                    )}
                  </g>
                );
              })}
            </AccessibleVisualization>
            <p className="mt-1 text-xs leading-relaxed text-muted">{t.compNote}</p>
          </section>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{t.tables}</h2>
            <div className="mt-2 grid max-w-3xl gap-4 sm:grid-cols-2">
              {[0, 1].map((z) => (
                <table key={z} className="w-full text-sm">
                  <caption className="pb-1 text-left text-xs font-medium text-muted">{zLabel(z)}</caption>
                  <thead>
                    <tr className="text-xs text-muted">
                      <th className="text-left font-medium" />
                      <th className="font-medium">Y = 1</th>
                      <th className="font-medium">Y = 0</th>
                      <th className="text-right font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1].map((xi) => (
                      <tr key={xi}>
                        <th className="whitespace-nowrap pr-1 text-left font-mono text-xs font-normal">{xLabel(xi)}</th>
                        {[0, 1].map((k) => (
                          <td key={k} className="p-0.5">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={tables[z][xi][k]}
                              disabled={countsLocked}
                              aria-label={`${zLabel(z)}, ${xLabel(xi)}, Y = ${k === 0 ? 1 : 0}`}
                              className="w-full min-w-14 rounded border border-line bg-surface px-1 py-1 text-right font-mono"
                              onChange={(e) => {
                                const v = e.target.valueAsNumber;
                                if (!Number.isFinite(v)) return;
                                const tb = clone(tables);
                                tb[z][xi][k] = Math.min(MAX, Math.max(0, Math.round(v)));
                                setTables(tb);
                              }}
                            />
                          </td>
                        ))}
                        <td className="text-right font-mono text-xs text-muted">{R.partialPct[z][xi] === null ? "—" : fmt(R.partialPct[z][xi], 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
            {edited && !countsLocked && (
              <LabButton className="mt-2" onClick={() => set("tables", [])}>
                {t.restore}
              </LabButton>
            )}
          </section>
        </div>
        <p className="text-xs leading-relaxed text-muted">
          {sc.source[lang]} {t.note}
        </p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </LabShell>
  );
}

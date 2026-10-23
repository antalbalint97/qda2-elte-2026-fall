"use client";

// Probability Playground. Port of "QDA2 Probability Playground.dc.html". Area model (eikosogram) with
// draggable partitions, a natural-frequency tree and the two-dice sample space. Probabilities are exact
// (engine probability.ts); the seeded simulation only illustrates convergence.
import { bayes, diceSum, naturalFrequencies, type Bayes } from "@/lib/engine/probability";
import { fmt } from "@/lib/engine/format";
import { mulberry32, type Rand } from "@/lib/engine/rng";
import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";
import { ChoiceControl, LabButton, ParameterControl, SeedControl } from "../../primitives/controls";
import { StatisticReadout, type Readout } from "../../primitives/readouts";
import { AccessibleVisualization, DragHandle, PresetBar, useSvgDrag } from "../../primitives/visual";
import { LabShell, Panel, type TeachDemo } from "../../shell/LabShell";
import { useLab, type LabProps } from "../../shell/useLab";
import { PP_T } from "./strings";

type Mode = "area" | "tree" | "grid";
type Scenario = "disease" | "turnout" | "indep";
export interface ProbParams extends Record<string, unknown> {
  mode: Mode;
  scenario: Scenario;
  pB: number;
  pAgivenB: number;
  pAgivenNotB: number;
  event: string[];
  seed: number;
}
const SC: Record<Scenario, { pB: number; pAgB: number; pAgnB: number; A: { en: string; hu: string }; B: { en: string; hu: string } }> = {
  disease: { pB: 0.01, pAgB: 0.9, pAgnB: 0.05, A: { en: "test positive", hu: "pozitív teszt" }, B: { en: "has the condition", hu: "beteg" } },
  turnout: { pB: 0.6, pAgB: 0.85, pAgnB: 0.4, A: { en: "says 'will vote'", hu: "azt mondja, szavaz" }, B: { en: "actually votes", hu: "ténylegesen szavaz" } },
  indep: { pB: 0.4, pAgB: 0.3, pAgnB: 0.3, A: { en: "event A", hu: "A esemény" }, B: { en: "event B", hu: "B esemény" } },
};
const SUM7 = ["6,1", "5,2", "4,3", "3,4", "2,5", "1,6"];
const DEFAULTS: ProbParams = { mode: "area", scenario: "disease", pB: 0.01, pAgivenB: 0.9, pAgivenNotB: 0.05, event: SUM7, seed: 2026 };
const p01 = (v: number) => Math.min(1, Math.max(0, Math.round(v * 1000) / 1000));
const CELL = /^[1-6],[1-6]$/;

export function normalizeProb(p: ProbParams): ProbParams {
  const ev = Array.isArray(p.event) ? [...new Set(p.event.filter((k): k is string => typeof k === "string" && CELL.test(k)))] : SUM7;
  return { ...p, pB: p01(p.pB), pAgivenB: p01(p.pAgivenB), pAgivenNotB: p01(p.pAgivenNotB), event: ev, seed: Number.isInteger(p.seed) && p.seed >= 1 ? p.seed : DEFAULTS.seed };
}

const EVENT_PRESETS: ((a: number, b: number) => boolean)[] = [(a, b) => a + b === 7, (a, b) => a === b, (a) => a === 6, (a, b) => a + b >= 10];

export default function ProbabilityPlayground(props: LabProps) {
  const lab = useLab<ProbParams>("probability-playground", DEFAULTS, { ...props, normalize: normalizeProb });
  const { params: P, set, setMany, lang, locked } = lab;
  const t = PP_T[lang];
  const sc = SC[P.scenario];
  const An = sc.A[lang];
  const Bn = sc.B[lang];
  const by = bayes(P.pB, P.pAgivenB, P.pAgivenNotB) as Bayes;
  const svgRef = useRef<SVGSVGElement>(null);
  const randRef = useRef<Rand | null>(null);
  const [sim, setSim] = useState({ n: 0, hits: 0 });
  const eventSet = new Set(P.event);
  // Any change of the model or the event restarts the simulation tally.
  const simKey = JSON.stringify([P.mode, P.pB, P.pAgivenB, P.pAgivenNotB, P.event, P.seed, lab.resetCount]);
  useEffect(() => {
    randRef.current = null;
    setSim({ n: 0, hits: 0 });
  }, [simKey]);

  const drag = useSvgDrag<"pB" | "pAgivenB" | "pAgivenNotB">(svgRef, (id, pt) => {
    if (id === "pB") set("pB", p01((pt.x - 80) / 600));
    else set(id, p01((pt.y - 40) / 300));
  });

  const simulate = (n: number) => {
    if (!randRef.current) randRef.current = mulberry32(P.seed);
    const r = randRef.current;
    let hits = 0;
    for (let i = 0; i < n; i++) {
      if (P.mode === "grid") {
        const a = 1 + Math.floor(r() * 6);
        const b = 1 + Math.floor(r() * 6);
        if (eventSet.has(a + "," + b)) hits++;
      } else {
        const B = r() < P.pB;
        const A = r() < (B ? P.pAgivenB : P.pAgivenNotB);
        if (P.mode === "area" ? A : A && B) hits++;
      }
    }
    setSim((s) => ({ n: s.n + n, hits: s.hits + hits }));
  };

  // ── area model ──
  const wB = 600 * P.pB;
  const xnB = 80 + wB;
  const wnB = 600 - wB;
  const hAB = 300 * P.pAgivenB;
  const hAnB = 300 * P.pAgivenNotB;

  // ── tree ──
  const nf = naturalFrequencies(by, 1000);
  const not = lang === "hu" ? "nem " : "not ";
  const nB = nf.B;
  const nnB = 1000 - nB;
  const nAB = nf.AandB;
  const nAnB = nf.AandNotB;
  const nodes = [
    { x: 310, y: 10, w: 140, txt: `1000 ${lang === "hu" ? "ember" : "people"}`, tone: "plain" },
    { x: 130, y: 110, w: 180, txt: `${nB} ${Bn}`, tone: "b" },
    { x: 470, y: 110, w: 180, txt: `${nnB} ${not}${Bn}`, tone: "plain" },
    { x: 40, y: 220, w: 150, txt: `${nAB} ${An}`, tone: "ab" },
    { x: 210, y: 220, w: 150, txt: `${nB - nAB} ${not}${An}`, tone: "white" },
    { x: 400, y: 220, w: 150, txt: `${nAnB} ${An}`, tone: "anb" },
    { x: 570, y: 220, w: 150, txt: `${nnB - nAnB} ${not}${An}`, tone: "white" },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
  ];
  const nodeFill: Record<string, string> = { plain: "var(--surface-2)", b: "color-mix(in srgb, var(--model) 18%, var(--surface))", ab: "var(--data-ink)", anb: "var(--residual-ink)", white: "var(--surface)" };
  const treeSentence =
    lang === "hu"
      ? `1 000 emberből ${nAB + nAnB} mutat A-t (${An}); közülük csak ${nAB} rendelkezik B-vel (${Bn}).`
      : `Of 1 000 people, ${nAB + nAnB} show A (${An}); of those only ${nAB} actually have B (${Bn}).`;

  // ── dice grid ──
  const pE = eventSet.size / 36;
  const dist = diceSum(2, 6);
  const withFirst1 = P.event.filter((k) => k.startsWith("1,")).length / 36;
  const toggle = (k: string) => {
    const ev = new Set(P.event);
    if (ev.has(k)) ev.delete(k);
    else ev.add(k);
    set("event", [...ev]);
  };
  const pickEvent = (i: number) => {
    const ev: string[] = [];
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (EVENT_PRESETS[i](a, b)) ev.push(`${a},${b}`);
    set("event", ev);
  };

  const exact = P.mode === "grid" ? pE : P.mode === "area" ? by.pA : by.pAB;
  const hat = sim.n ? sim.hits / sim.n : null;
  const yes = lang === "hu" ? "igen" : "yes";
  const no = lang === "hu" ? "nem" : "no";
  const readouts: Readout[] =
    P.mode === "grid"
      ? [
          { label: "|E|", value: `${eventSet.size} / 36` },
          { label: "P(E)", value: pE, digits: 4, tone: "explained" },
          { label: lang === "hu" ? "P(E ∧ első kocka = 1)" : "P(E ∧ first die = 1)", value: withFirst1, digits: 4 },
          { label: lang === "hu" ? "P(E)·P(első = 1)" : "P(E)·P(first = 1)", value: pE / 6, digits: 4 },
          { label: lang === "hu" ? "független az 1. kockától?" : "independent of die 1?", value: Math.abs(withFirst1 - pE / 6) < 1e-12 ? yes : no, tone: "model" },
        ]
      : [
          { label: "P(B)", value: P.pB, digits: 3 },
          { label: "P(A | B)", value: P.pAgivenB, digits: 3, tone: "data" },
          { label: "P(A | ¬B)", value: P.pAgivenNotB, digits: 3, tone: "residual" },
          { label: "P(A ∧ B)", value: by.pAB, digits: 4, tone: "data" },
          { label: "P(A)", value: by.pA, digits: 4 },
          { label: "P(B | A)", value: by.pBgA, digits: 4, tone: "explained" },
          { label: "P(B | ¬A)", value: by.pBgnA, digits: 4, tone: "muted" },
          { label: lang === "hu" ? "függetlenek?" : "independent?", value: by.independent ? yes : no, tone: "model" },
        ];
  const live = t.live.replace("{pa}", fmt(by.pA, 3)).replace("{pba}", fmt(by.pBgA, 3));
  const demos: TeachDemo[] = (Object.keys(SC) as Scenario[]).map((k) => ({
    title: t.scenarios[k],
    note: t.insight.area,
    apply: () => setMany({ mode: "area", scenario: k, pB: SC[k].pB, pAgivenB: SC[k].pAgB, pAgivenNotB: SC[k].pAgnB }),
  }));
  demos.push({ title: t.grid, note: t.insight.grid, apply: () => setMany({ mode: "grid", event: SUM7 }) });

  const aside = (
    <>
      {P.mode !== "grid" && (
        <Panel title={t.scenario}>
          <div className="space-y-3">
            <ChoiceControl<Scenario>
              label={t.scenario}
              hideLabel
              param="scenario"
              value={P.scenario}
              onChange={(k) => setMany({ scenario: k, pB: SC[k].pB, pAgivenB: SC[k].pAgB, pAgivenNotB: SC[k].pAgnB })}
              options={(Object.keys(SC) as Scenario[]).map((k) => ({ value: k, label: t.scenarios[k] }))}
            />
            {(["pB", "pAgivenB", "pAgivenNotB"] as const).map((k, i) => (
              <ParameterControl key={k} label={t.sliders[i]} value={P[k]} min={0} max={1} step={0.001} onChange={(v) => set(k, v)} param={k} />
            ))}
          </div>
        </Panel>
      )}
      <Panel title={t.sim}>
        <div className="flex flex-wrap gap-2">
          {[10, 100, 1000].map((n) => (
            <LabButton key={n} variant="primary" onClick={() => simulate(n)}>
              +{n}
            </LabButton>
          ))}
          <LabButton
            onClick={() => {
              randRef.current = null;
              setSim({ n: 0, hits: 0 });
            }}
          >
            {lang === "hu" ? "Törlés" : "Clear"}
          </LabButton>
        </div>
        <p className="mt-2 font-mono text-xs text-muted">
          {P.mode === "grid" ? "E" : P.mode === "area" ? "A" : "A ∧ B"} · n = {sim.n}
        </p>
        <div className="mt-1 h-2 overflow-hidden rounded bg-surface-2" aria-hidden>
          <div className="h-full bg-explained" style={{ width: `${100 * (hat ?? 0)}%` }} />
        </div>
        <p className="mt-1 font-mono text-sm text-ink" role="status">
          {hat === null ? "—" : `p̂ = ${fmt(hat, 4)} (${sim.hits}/${sim.n})`}
        </p>
        <p className="font-mono text-xs text-muted">
          {lang === "hu" ? "pontos" : "exact"} {fmt(exact, 4)}
          {hat !== null ? ` · SE ≈ ${fmt(Math.sqrt((exact * (1 - exact)) / sim.n), 4)}` : ""}
        </p>
        <div className="mt-3">
          <SeedControl value={P.seed} onChange={(v) => set("seed", v)} />
        </div>
      </Panel>
      <Panel title={lang === "hu" ? "Kiolvasások" : "Readouts"}>
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
      method={lang === "hu" ? "Pontos valószínűségek (zárt alak, felsorolás); seedelt szimuláció illusztrációként" : "Exact probabilities (closed form, enumeration); seeded simulation as illustration"}
      toolbar={<ChoiceControl<Mode> label={t.mode} hideLabel size="md" param="mode" value={P.mode} onChange={(v) => set("mode", v)} options={(["area", "tree", "grid"] as const).map((v) => ({ value: v, label: t[v] }))} />}
      below={
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{lang === "hu" ? "Képlet" : "Formula"}</h2>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 font-serif text-lg text-ink">
            {t.formula[P.mode].split(/\s{3,}/).map((f, i) => (
              <span key={i}>{f}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink">{t.insight[P.mode]}</p>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="max-w-prose text-sm leading-relaxed text-muted">{t.lead[P.mode]}</p>
        {P.mode === "area" && (
          <>
            <p className="font-mono text-xs text-muted">{t.areaNote}</p>
            <AccessibleVisualization
              interactive
              svgRef={svgRef}
              onPointerMove={drag.move}
              onPointerUp={drag.end}
              viewBox="0 0 760 385"
              summary={`${t.area}: P(B) = ${fmt(P.pB, 3)}, P(A|B) = ${fmt(P.pAgivenB, 3)}, P(A|¬B) = ${fmt(P.pAgivenNotB, 3)}; P(A) = ${fmt(by.pA, 4)}; P(B|A) = ${fmt(by.pBgA, 4)}`}
              table={{
                caption: t.area,
                columns: ["", "B", "¬B", lang === "hu" ? "összesen" : "total"],
                rows: [
                  ["A", fmt(by.pAB, 4), fmt(by.pAnB, 4), fmt(by.pA, 4)],
                  ["¬A", fmt(P.pB - by.pAB, 4), fmt(1 - P.pB - by.pAnB, 4), fmt(1 - by.pA, 4)],
                  [lang === "hu" ? "összesen" : "total", fmt(P.pB, 4), fmt(1 - P.pB, 4), "1"],
                ],
              }}
            >
              <rect x={80} y={40} width={600} height={300} fill="var(--surface-2)" stroke="var(--border)" />
              <rect x={80} y={40} width={wB} height={hAB} fill="var(--data)" />
              <rect x={80} y={40 + hAB} width={wB} height={300 - hAB} fill="color-mix(in srgb, var(--data) 18%, var(--surface))" />
              <rect x={xnB} y={40} width={wnB} height={hAnB} fill="var(--residual)" fillOpacity={0.55} />
              <rect x={xnB} y={40 + hAnB} width={wnB} height={300 - hAnB} fill="var(--surface)" />
              <g aria-hidden fontSize={10.5}>
                <text x={80 + wB / 2} y={30} fill="var(--ink)" textAnchor="middle">
                  B: {Bn} P(B) = {fmt(P.pB, 3)}
                </text>
                <text x={xnB + wnB / 2} y={30} fill="var(--muted)" textAnchor="middle">
                  ¬B {fmt(1 - P.pB, 3)}
                </text>
                <text x={40} y={40 + hAB / 2 + 4} fill="var(--data-ink)" textAnchor="middle">
                  A|B {fmt(P.pAgivenB, 2)}
                </text>
                <text x={720} y={40 + hAnB / 2 + 4} fill="var(--residual-ink)" textAnchor="middle">
                  A|¬B {fmt(P.pAgivenNotB, 2)}
                </text>
                <text x={380} y={374} fill="var(--ink)" fontSize={12} fontWeight={600} textAnchor="middle">
                  P(B | A) = {fmt(by.pAB, 3)} / {fmt(by.pA, 3)} = {fmt(by.pBgA, 3)}
                </text>
              </g>
              <DragHandle x={xnB} y={355} orientation="horizontal" label="P(B)" value={P.pB} min={0} max={1} step={0.01} valueText={fmt(P.pB, 3)} onStart={(e) => drag.start("pB", e)} onValue={(v) => set("pB", p01(v))} fill="var(--ink)" disabled={locked("pB")} className={drag.dragging ? "lab-fast" : "lab-tr"}>
                <line x1={0} x2={0} y1={-315} y2={0} stroke="var(--ink)" strokeWidth={2} />
              </DragHandle>
              <DragHandle x={80 + Math.max(wB, 2) / 2} y={40 + hAB} label="P(A | B)" value={P.pAgivenB} min={0} max={1} step={0.01} valueText={fmt(P.pAgivenB, 3)} onStart={(e) => drag.start("pAgivenB", e)} onValue={(v) => set("pAgivenB", p01(v))} fill="var(--data-ink)" disabled={locked("pAgivenB")} className={drag.dragging ? "lab-fast" : "lab-tr"} />
              <DragHandle x={xnB + wnB / 2} y={40 + hAnB} label="P(A | ¬B)" value={P.pAgivenNotB} min={0} max={1} step={0.01} valueText={fmt(P.pAgivenNotB, 3)} onStart={(e) => drag.start("pAgivenNotB", e)} onValue={(v) => set("pAgivenNotB", p01(v))} fill="var(--residual-ink)" disabled={locked("pAgivenNotB")} className={drag.dragging ? "lab-fast" : "lab-tr"} />
            </AccessibleVisualization>
          </>
        )}
        {P.mode === "tree" && (
          <>
            <p className="font-mono text-xs text-muted">{t.treeNote}</p>
            <AccessibleVisualization viewBox="0 0 760 320" summary={treeSentence}>
              {edges.map(([a, b]) => (
                <line key={`${a}-${b}`} x1={nodes[a].x + nodes[a].w / 2} y1={nodes[a].y + 44} x2={nodes[b].x + nodes[b].w / 2} y2={nodes[b].y} stroke="var(--border-strong)" />
              ))}
              {nodes.map((n, i) => (
                <g key={i}>
                  <rect x={n.x} y={n.y} width={n.w} height={44} rx={8} fill={nodeFill[n.tone]} stroke="var(--border)" />
                  <text x={n.x + n.w / 2} y={n.y + 27} fontSize={11} textAnchor="middle" fill={n.tone === "ab" || n.tone === "anb" ? "var(--surface)" : "var(--ink)"} fontWeight={n.tone === "ab" || n.tone === "anb" ? 600 : 400}>
                    {n.txt}
                  </text>
                </g>
              ))}
              <text x={380} y={300} fontSize={12} fontWeight={600} textAnchor="middle" fill="var(--ink)">
                P(B | A) ≈ {nAB} / ({nAB} + {nAnB}) = {fmt(nAB + nAnB ? nAB / (nAB + nAnB) : 0, 3)}
              </text>
            </AccessibleVisualization>
            <p className="text-sm text-ink">{treeSentence}</p>
          </>
        )}
        {P.mode === "grid" && (
          <div className="grid gap-4 md:grid-cols-[auto_1fr]">
            <div>
              <p className="font-mono text-xs text-muted">{t.gridNote}</p>
              <div role="group" aria-label={lang === "hu" ? "Két kocka kimenetelei" : "Outcomes of two dice"} className="mt-2 grid w-max grid-cols-6 gap-1">
                {Array.from({ length: 36 }, (_, i) => {
                  const a = Math.floor(i / 6) + 1;
                  const b = (i % 6) + 1;
                  const k = `${a},${b}`;
                  const on = eventSet.has(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={on}
                      aria-label={lang === "hu" ? `1. kocka ${a}, 2. kocka ${b}` : `die 1 = ${a}, die 2 = ${b}`}
                      disabled={locked("event")}
                      onClick={() => toggle(k)}
                      className={cn("h-10 w-11 rounded-md border font-mono text-xs", on ? "border-ink bg-ink text-bg" : "border-line bg-surface text-ink hover:bg-surface-2")}
                    >
                      {a}·{b}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2">
                <PresetBar presets={t.events.map((l, i) => ({ id: String(i), label: l }))} onPick={(id) => pickEvent(+id)} label={lang === "hu" ? "Események" : "Events"} />
              </div>
              <p className="mt-2 font-mono text-sm text-ink">
                {lang === "hu" ? "Esemény E: " : "Event E: "}
                {eventSet.size} {lang === "hu" ? "kimenetel" : "outcomes"} · P(E) = {fmt(pE, 4)}
              </p>
            </div>
            <AccessibleVisualization
              viewBox="0 0 420 200"
              summary={lang === "hu" ? "Két kocka összegének eloszlása" : "Distribution of the sum of two dice"}
              table={{ caption: lang === "hu" ? "Összeg" : "Sum", columns: [lang === "hu" ? "összeg" : "sum", "P", lang === "hu" ? "E-ben" : "in E"], rows: dist.map((d) => [d.x, `${Math.round(d.p * 36)}/36`, P.event.filter((k) => k.split(",").map(Number).reduce((s, v) => s + v, 0) === d.x).length]) }}
            >
              {dist.map((d, i) => {
                const inE = P.event.some((k) => k.split(",").map(Number).reduce((s, v) => s + v, 0) === d.x);
                return (
                  <g key={d.x}>
                    <rect x={28 + i * 34} y={170 - d.p * 900} width={26} height={d.p * 900} fill={inE ? "var(--explained)" : "var(--surface-3)"} />
                    <text x={41 + i * 34} y={186} fontSize={10} textAnchor="middle" fill="var(--muted)" aria-hidden>
                      {d.x}
                    </text>
                    <text x={41 + i * 34} y={166 - d.p * 900} fontSize={9} textAnchor="middle" fill="var(--muted)" aria-hidden>
                      {Math.round(d.p * 36)}/36
                    </text>
                  </g>
                );
              })}
            </AccessibleVisualization>
          </div>
        )}
        <p className="text-xs text-faint">{t.note}</p>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
      </div>
    </LabShell>
  );
}

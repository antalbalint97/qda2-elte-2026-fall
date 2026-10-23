"use client";

// Concept Atlas (port of "QDA2 Concept Atlas.dc.html"): the concept graph as eleven domain columns. Selecting a
// concept highlights its prerequisites, dependents, related and alternative concepts (drawn as curves) and opens
// a detail panel; the pedagogical view lists the labs, blocks and course lessons that teach it. The detail
// panel is the text alternative of the curves, which are decorative. The selection is kept in the URL hash.
import { BLOCKS } from "@/content/curriculum/blocks";
import { CONCEPTS } from "@/content/curriculum/concepts";
import { COURSE_TEMPLATES } from "@/content/curriculum/courses";
import { isImplemented } from "@/content/curriculum/implemented-labs";
import { labMaturity, maturityLabel } from "@/content/curriculum/lab-status";
import { LABS } from "@/content/curriculum/labs";
import type { Bilingual, Concept, DomainId, Lang } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import { setAtlasPending } from "@/lib/course/storage";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const DOM: Record<DomainId, [string, string]> = {
  A: ["Math foundations", "Matematikai alapok"],
  B: ["Data & measurement", "Adat és mérés"],
  C: ["Descriptives", "Leíró statisztika"],
  D: ["Probability", "Valószínűség"],
  E: ["Sampling & estimation", "Mintavétel és becslés"],
  F: ["Inference", "Következtetés"],
  G: ["Group comparisons", "Csoport-összehasonlítás"],
  H: ["Categorical", "Kategoriális"],
  I: ["Survey statistics", "Survey-statisztika"],
  J: ["Modelling", "Modellezés"],
  K: ["Research practice", "Kutatási gyakorlat"],
};

const T = {
  en: {
    title: "Concept Atlas",
    search: "Search concepts",
    searchPh: "name, id or definition…",
    view: "View",
    conceptual: "Conceptual",
    pedagogical: "Pedagogical",
    edges: "Show connections",
    level: "Level",
    allLevels: "All levels",
    upTo: "Up to level {n}",
    how: "How to read",
    intro: "Eleven domains as columns, roughly from foundations to practice. Select a concept to see its neighbourhood; switch to Pedagogical to see the labs, learning blocks and course lessons that teach it. Prerequisite links are sparse on purpose: variance precedes ANOVA, regression does not.",
    legPrereq: "prerequisite (needed first)",
    legDep: "builds on this concept",
    legRel: "related (no order)",
    legAlt: "alternative method",
    dotLab: "an interactive lab teaches it",
    dotNone: "text and assessment only",
    prereq: "Prerequisites",
    dependents: "Builds toward",
    related: "Related",
    generalizes: "Generalises",
    alternative: "Alternative to",
    misconceptions: "Common misconceptions",
    applications: "Applications",
    activities: "Suggested activities",
    labs: "Interactive labs",
    blocks: "Learning blocks",
    courses: "Course templates using it",
    none: "none",
    noLabs: "No lab teaches this concept yet.",
    noCourses: "Not used in a course template yet.",
    open: "Open lab",
    add: "Add to Course Builder",
    added: "Saved for the Course Builder. Opening it…",
    notSaved: "This browser blocks local storage, so the block cannot be handed to the Builder.",
    existing: "Taught on this site",
    stats: "{c} concepts · {p} prerequisite links · {r} related links · {l} labs · {b} blocks",
    shown: "{n} concepts shown",
    level_: "Level {n}",
    close: "Back to the legend",
  },
  hu: {
    title: "Fogalomatlasz",
    search: "Fogalom keresése",
    searchPh: "név, azonosító vagy definíció…",
    view: "Nézet",
    conceptual: "Fogalmi",
    pedagogical: "Pedagógiai",
    edges: "Kapcsolatok mutatása",
    level: "Szint",
    allLevels: "Minden szint",
    upTo: "Legfeljebb {n}. szint",
    how: "Olvasat",
    intro: "Tizenegy terület oszlopokban, nagyjából az alapoktól a gyakorlatig. Válassz egy fogalmat a környezetéhez; a Pedagógiai nézet a laborokat, tanulási blokkokat és kurzusleckéket mutatja. Az előfeltétel-kapcsolatok szándékosan ritkák: a variancia megelőzi az ANOVA-t, a regresszió nem.",
    legPrereq: "előfeltétel",
    legDep: "erre épül",
    legRel: "kapcsolódó (sorrend nélkül)",
    legAlt: "alternatív módszer",
    dotLab: "interaktív labor tanítja",
    dotNone: "csak szöveg és ellenőrzés",
    prereq: "Előfeltételek",
    dependents: "Erre épül",
    related: "Kapcsolódó",
    generalizes: "Általánosítja",
    alternative: "Alternatívája",
    misconceptions: "Gyakori tévképzetek",
    applications: "Alkalmazások",
    activities: "Javasolt tevékenységek",
    labs: "Interaktív laborok",
    blocks: "Tanulási blokkok",
    courses: "Kurzussablonok, amelyek használják",
    none: "nincs",
    noLabs: "Még nincs labor ehhez a fogalomhoz.",
    noCourses: "Egyik kurzussablonban sem szerepel még.",
    open: "Labor megnyitása",
    add: "Hozzáadás a kurzusépítőhöz",
    added: "Elmentve a kurzusépítőnek. Megnyitás…",
    notSaved: "A böngésző tiltja a helyi tárolást, így a blokk nem adható át a kurzusépítőnek.",
    existing: "Az oldalon tanítva",
    stats: "{c} fogalom · {p} előfeltétel-kapcsolat · {r} kapcsolódás · {l} labor · {b} blokk",
    shown: "{n} fogalom látható",
    level_: "{n}. szint",
    close: "Vissza a jelmagyarázathoz",
  },
};
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k]));

const BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]));
const DEPENDENTS = new Map<string, string[]>();
for (const c of CONCEPTS) for (const p of c.prereq) DEPENDENTS.set(p, [...(DEPENDENTS.get(p) ?? []), c.id]);
const BLOCKS_FOR = new Map<string, typeof BLOCKS>();
for (const b of BLOCKS) for (const k of b.concepts) BLOCKS_FOR.set(k, [...(BLOCKS_FOR.get(k) ?? []), b]);
const COURSE_USE = new Map<string, { course: Bilingual; unit: Bilingual; lesson: Bilingual }[]>();
for (const k of COURSE_TEMPLATES)
  for (const u of k.units)
    for (const l of u.lessons)
      for (const bi of l.blocks) {
        const b = BLOCKS.find((x) => x.id === bi.ref);
        for (const c of b?.concepts ?? []) {
          const list = COURSE_USE.get(c) ?? [];
          if (!list.some((x) => x.lesson === l.title)) list.push({ course: k.title, unit: u.title, lesson: l.title });
          COURSE_USE.set(c, list);
        }
      }
const hasLab = (c: Concept) => c.labs.some(isImplemented);

type Rel = "sel" | "pre" | "dep" | "rel" | "alt" | null;
const REL_STYLE: Record<Exclude<Rel, null>, string> = {
  sel: "border-ink bg-ink text-bg",
  pre: "border-[var(--model)] bg-[color-mix(in_srgb,var(--model)_14%,var(--surface))]",
  dep: "border-[var(--y)] bg-[color-mix(in_srgb,var(--y)_14%,var(--surface))]",
  rel: "border-[var(--z)] bg-[color-mix(in_srgb,var(--z)_12%,var(--surface))] border-dashed",
  alt: "border-[var(--warn)] bg-warn-soft border-dotted",
};
const LINE: Record<Exclude<Rel, "sel" | null>, { stroke: string; w: number; dash: string }> = {
  pre: { stroke: "var(--model)", w: 2.5, dash: "" },
  dep: { stroke: "var(--y)", w: 2.5, dash: "" },
  rel: { stroke: "var(--z)", w: 1.8, dash: "5 4" },
  alt: { stroke: "var(--warn)", w: 2, dash: "2 4" },
};

function Chips({ ids, lang, onPick, label, none }: { ids: string[]; lang: Lang; onPick: (id: string) => void; label: string; none: string }) {
  return (
    <div>
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</h3>
      {ids.length ? (
        <ul className="flex flex-wrap gap-1">
          {ids.map((id) => (
            <li key={id}>
              <button type="button" onClick={() => onPick(id)} className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs text-ink hover:border-accent">
                {BY_ID.get(id)?.name[lang] ?? id}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">{none}</p>
      )}
    </div>
  );
}

export function ConceptAtlas({ authoring }: { authoring: boolean }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  const [view, setView] = useState<"conceptual" | "pedagogical">("conceptual");
  const [q, setQ] = useState("");
  const [lvl, setLvl] = useState(4);
  const [edges, setEdges] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLHeadingElement>(null);
  const [lines, setLines] = useState<{ d: string; stroke: string; w: number; dash: string }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // the hash names the selected concept
  useEffect(() => {
    const read = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      setSel(BY_ID.has(h) ? h : null);
      // bring a linked concept into view inside the scrolling map
      if (BY_ID.has(h))
        requestAnimationFrame(() => mapRef.current?.querySelector<HTMLElement>(`[data-cid="${CSS.escape(h)}"]`)?.scrollIntoView({ block: "nearest", inline: "center" }));
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const pick = useCallback((id: string | null, focusPanel = false) => {
    setSel(id);
    try {
      window.history.replaceState(null, "", id ? `#${encodeURIComponent(id)}` : window.location.pathname);
    } catch {
      /* ignore */
    }
    if (focusPanel) requestAnimationFrame(() => panelRef.current?.focus());
  }, []);

  const c = sel ? BY_ID.get(sel) ?? null : null;
  const relOf = useMemo(() => {
    const m = new Map<string, Rel>();
    if (!c) return m;
    for (const id of c.related) m.set(id, "rel");
    for (const id of c.alt ?? []) m.set(id, "alt");
    for (const id of DEPENDENTS.get(c.id) ?? []) m.set(id, "dep");
    for (const id of c.prereq) m.set(id, "pre");
    m.set(c.id, "sel");
    return m;
  }, [c]);
  const needle = q.trim().toLowerCase();
  const matches = (k: Concept) => !needle || `${k.name.en} ${k.name.hu} ${k.id} ${k.def}`.toLowerCase().includes(needle);
  const visible = CONCEPTS.filter((k) => k.level <= lvl);
  const shown = visible.filter(matches).length;

  const measure = useCallback(() => {
    const root = mapRef.current;
    if (!root || !c || !edges) return setLines([]);
    const rb = root.getBoundingClientRect();
    const pos = (id: string) => {
      const el = root.querySelector<HTMLElement>(`[data-cid="${CSS.escape(id)}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - rb.left + root.scrollLeft + r.width / 2, y: r.top - rb.top + root.scrollTop + r.height / 2 };
    };
    const from = pos(c.id);
    if (!from) return setLines([]);
    const out: typeof lines = [];
    for (const [id, rel] of relOf) {
      if (rel === "sel" || !rel) continue;
      const to = pos(id);
      if (!to) continue;
      const dx = (to.x - from.x) / 2;
      out.push({ d: `M${from.x},${from.y} C${from.x + dx},${from.y} ${to.x - dx},${to.y} ${to.x},${to.y}`, ...LINE[rel] });
    }
    setLines(out);
    setSize({ w: root.scrollWidth, h: root.scrollHeight });
  }, [c, edges, relOf]);
  useLayoutEffect(() => {
    measure();
  }, [measure, lang, lvl, q, view]);
  useEffect(() => {
    const ro = new ResizeObserver(() => measure());
    if (mapRef.current) ro.observe(mapRef.current);
    return () => ro.disconnect();
  }, [measure]);

  const addToBuilder = (blockId: string) => {
    if (setAtlasPending(blockId) !== "ok") return setToast(t.notSaved);
    setToast(t.added);
    window.setTimeout(() => window.location.assign("/builder"), 600);
  };

  const nP = CONCEPTS.reduce((a, k) => a + k.prereq.length, 0);
  const nR = CONCEPTS.reduce((a, k) => a + k.related.length, 0);

  return (
    <div lang={lang} className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="mr-2 font-serif text-3xl font-semibold tracking-tight text-ink">{t.title}</h1>
        <label className="flex flex-col text-xs text-muted">
          {t.search}
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.searchPh} className="mt-0.5 w-60 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink" />
        </label>
        <div role="group" aria-label={t.view} className="flex overflow-hidden rounded-lg border border-line">
          {(["conceptual", "pedagogical"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={cn("px-3 py-1.5 text-sm", view === v ? "bg-ink text-bg" : "bg-surface text-muted hover:text-ink")}>
              {t[v]}
            </button>
          ))}
        </div>
        <label className="flex flex-col text-xs text-muted">
          {t.level}
          <select value={lvl} onChange={(e) => setLvl(Number(e.target.value))} className="mt-0.5 rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink">
            <option value={4}>{t.allLevels}</option>
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {fill(t.upTo, { n })}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 pb-1.5 text-sm text-ink">
          <input type="checkbox" checked={edges} onChange={(e) => setEdges(e.target.checked)} />
          {t.edges}
        </label>
        <div role="group" aria-label="Language / Nyelv" className="ml-auto flex gap-1 pb-1">
          {(["en", "hu"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cn("rounded-md border px-2.5 py-1 font-mono text-xs uppercase", lang === l ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-ink")}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted" aria-live="polite">
        {fill(t.shown, { n: shown })}
      </p>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div ref={mapRef} className="relative max-h-[78vh] overflow-auto rounded-2xl border border-line bg-surface-2 p-3" tabIndex={0} role="region" aria-label={t.title}>
          <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0" width={size.w} height={size.h} style={{ overflow: "visible" }}>
            {lines.map((l, i) => (
              <path key={i} d={l.d} fill="none" stroke={l.stroke} strokeWidth={l.w} strokeDasharray={l.dash || undefined} opacity={0.85} />
            ))}
          </svg>
          <div className="flex items-start gap-3">
            {(Object.keys(DOM) as DomainId[]).map((d) => {
              const items = visible.filter((k) => k.domain === d);
              return (
                <section key={d} aria-label={DOM[d][lang === "hu" ? 1 : 0]} className="w-52 flex-none">
                  <h2 className="mb-1.5 flex items-baseline gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                    <span className="font-mono text-accent">{d}</span>
                    {DOM[d][lang === "hu" ? 1 : 0]}
                    <span className="ml-auto font-mono text-faint">{items.length}</span>
                  </h2>
                  <ul className="space-y-1">
                    {items.map((k) => {
                      const r = relOf.get(k.id) ?? null;
                      const nb = BLOCKS_FOR.get(k.id)?.length ?? 0;
                      return (
                        <li key={k.id}>
                          <button
                            type="button"
                            data-cid={k.id}
                            aria-pressed={r === "sel"}
                            onClick={() => pick(r === "sel" ? null : k.id, r !== "sel")}
                            className={cn("relative z-[1] flex w-full items-center gap-2 rounded-lg border px-2 py-1 text-left text-[12.5px] leading-snug", r ? REL_STYLE[r] : "border-line bg-surface text-ink hover:border-ink", !matches(k) && "opacity-30")}
                          >
                            <span aria-hidden className={cn("h-2 w-2 flex-none rounded-full", hasLab(k) ? "bg-[var(--model)]" : "bg-line")} />
                            <span className="min-w-0 flex-1">{k.name[lang]}</span>
                            <span className={cn("font-mono text-[10px]", r === "sel" ? "text-bg" : r ? "text-ink" : "text-faint")}>{view === "pedagogical" ? `${nb}b` : `L${k.level}`}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="rounded-2xl border border-line bg-surface p-4 lg:max-h-[78vh] lg:overflow-auto" aria-labelledby="atlas-panel-h">
          {!c ? (
            <>
              <h2 id="atlas-panel-h" ref={panelRef} tabIndex={-1} className="font-mono text-xs tracking-widest text-accent">
                {t.how.toUpperCase()}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink">{t.intro}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink">
                {(["pre", "dep", "rel", "alt"] as const).map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    <svg width="28" height="6" aria-hidden>
                      <line x1="0" y1="3" x2="28" y2="3" stroke={LINE[k].stroke} strokeWidth={LINE[k].w} strokeDasharray={LINE[k].dash || undefined} />
                    </svg>
                    {t[{ pre: "legPrereq", dep: "legDep", rel: "legRel", alt: "legAlt" }[k] as "legPrereq"]}
                  </li>
                ))}
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--model)]" aria-hidden />
                  {t.dotLab}
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-line" aria-hidden />
                  {t.dotNone}
                </li>
              </ul>
              <p className="mt-4 text-xs text-muted">{fill(t.stats, { c: CONCEPTS.length, p: nP, r: nR, l: LABS.length, b: BLOCKS.length })}</p>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-[11px] tracking-widest text-accent">
                  {c.domain} · {DOM[c.domain][lang === "hu" ? 1 : 0]} · {fill(t.level_, { n: c.level })}
                </p>
                <h2 id="atlas-panel-h" ref={panelRef} tabIndex={-1} className="mt-1 font-serif text-2xl font-semibold text-ink">
                  {c.name[lang]}
                </h2>
                <p className="text-sm text-muted">{lang === "hu" ? c.name.en : c.name.hu}</p>
                <p className="mt-1 font-mono text-[11px] text-faint">{c.id}</p>
              </div>
              <p className="text-sm leading-relaxed text-ink">{c.def}</p>
              {c.notation && <p className="overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 font-mono text-sm text-ink">{c.notation}</p>}
              {view === "conceptual" ? (
                <>
                  <Chips ids={c.prereq} lang={lang} onPick={(id) => pick(id)} label={t.prereq} none={t.none} />
                  <Chips ids={DEPENDENTS.get(c.id) ?? []} lang={lang} onPick={(id) => pick(id)} label={t.dependents} none={t.none} />
                  <Chips ids={c.related} lang={lang} onPick={(id) => pick(id)} label={t.related} none={t.none} />
                  {!!c.gen?.length && <Chips ids={c.gen} lang={lang} onPick={(id) => pick(id)} label={t.generalizes} none={t.none} />}
                  {!!c.alt?.length && <Chips ids={c.alt} lang={lang} onPick={(id) => pick(id)} label={t.alternative} none={t.none} />}
                  {[
                    [t.misconceptions, c.misconceptions],
                    [t.applications, c.apps],
                  ].map(([label, list]) => (
                    <div key={label as string}>
                      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label as string}</h3>
                      <ul className="list-disc space-y-0.5 pl-5 text-sm text-ink">
                        {(list as string[]).map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div>
                    <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{t.labs}</h3>
                    {c.labs.length ? (
                      <ul className="space-y-1.5">
                        {c.labs.map((id) => {
                          const l = LABS.find((x) => x.id === id);
                          return (
                            <li key={id} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-sm">
                              <span className="flex-1 font-medium text-ink">{l?.name[lang] ?? id}</span>
                              <span className="font-mono text-[10px] text-faint">{maturityLabel(labMaturity(id))}</span>
                              {isImplemented(id) && (
                                <a href={`/lab/${id}`} className="text-xs text-accent underline underline-offset-2">
                                  {t.open}
                                </a>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted">{t.noLabs}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{t.blocks}</h3>
                    <ul className="space-y-1.5">
                      {(BLOCKS_FOR.get(c.id) ?? []).map((b) => (
                        <li key={b.id} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-sm">
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-ink">{b.title[lang]}</span>
                            <span className="font-mono text-[10px] text-faint">
                              {b.type} · L{b.lvl} · {b.min}′ · v{b.version}
                            </span>
                          </span>
                          {authoring && (
                            <button type="button" onClick={() => addToBuilder(b.id)} className="whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-bg" aria-label={`${t.add}: ${b.title[lang]}`}>
                              + {t.add}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{t.courses}</h3>
                    {(COURSE_USE.get(c.id) ?? []).length ? (
                      <ul className="space-y-0.5 text-sm text-ink">
                        {(COURSE_USE.get(c.id) ?? []).map((x, i) => (
                          <li key={i}>
                            <span className="font-medium">{x.course[lang]}</span> · <span className="text-muted">{x.lesson[lang]}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted">{t.noCourses}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{t.activities}</h3>
                    <ul className="list-disc space-y-0.5 pl-5 text-sm text-ink">
                      {c.activities.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                  {c.existing && (
                    <p className="text-sm">
                      <span className="text-muted">{t.existing}: </span>
                      <a href={c.existing} className="text-accent underline underline-offset-2">
                        {c.existing}
                      </a>
                    </p>
                  )}
                </>
              )}
              <button type="button" onClick={() => pick(null, true)} className="text-sm text-accent underline underline-offset-2">
                {t.close}
              </button>
            </div>
          )}
        </aside>
      </div>
      <p role="status" aria-live="polite" className="fixed bottom-5 left-1/2 -translate-x-1/2 empty:hidden rounded-lg bg-ink px-4 py-2 text-sm text-bg">
        {toast}
      </p>
    </div>
  );
}

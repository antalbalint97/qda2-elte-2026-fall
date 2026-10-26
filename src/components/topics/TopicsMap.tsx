"use client";

// The curriculum map: every topic in its conceptual domain, with the module that teaches it and the labs that explore it.
import { MODULES } from "@/content/modules";
import { DOMAINS, topicsIn, type Topic } from "@/content/topics";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useState } from "react";

type Lang = "en" | "hu";
type Filter = "all" | "labs" | "modules";

const T = {
  en: {
    h1a: "The curriculum as",
    h1b: "a map, not a line.",
    sub: "Every topic of the course sits in a conceptual domain: data, relationships, inference, survey statistics, mathematical foundations. Each one links to the module that teaches it and the labs that let you explore it. Start anywhere.",
    filters: { all: "All", labs: "Labs", modules: "Modules" } as Record<Filter, string>,
    filterLabel: "Show topics",
    legendLab: "Interactive lab",
    legendModule: "Course module",
    lab: "lab",
    module: "module",
    none: "No topic in this domain matches the filter.",
    foot: "Modules follow the Understand → Try → SPSS → Test rhythm. Labs compute every value live from the data in front of you.",
  },
  hu: {
    h1a: "A tananyag mint",
    h1b: "térkép, nem vonal.",
    sub: "A kurzus minden témája egy fogalmi területen belül helyezkedik el: adatok, kapcsolatok, következtetés, survey-statisztika, matematikai alapok. Mindegyik a tanító modulra és a felfedező laborokra mutat. Kezdd bárhol.",
    filters: { all: "Mind", labs: "Laborok", modules: "Modulok" } as Record<Filter, string>,
    filterLabel: "Témák szűrése",
    legendLab: "Interaktív labor",
    legendModule: "Kurzusmodul",
    lab: "labor",
    module: "modul",
    none: "Ezen a területen egy téma sem felel meg a szűrőnek.",
    foot: "A modulok a Megértés → Kipróbálás → SPSS → Teszt ritmust követik. A laborok minden értéket élőben számolnak az előtted lévő adatokból.",
  },
};

const hasLab = (t: Topic) => t.links.some((l) => l.kind === "lab");
const hasModule = (t: Topic) => t.links.some((l) => l.kind === "module");
const moduleNumber = (t: Topic) => {
  const l = t.links.find((x) => x.kind === "module");
  return l ? MODULES.find((m) => m.href === l.href)?.number : undefined;
};

export function TopicsMap() {
  const [lang, setLang] = useState<Lang>("en");
  const [filter, setFilter] = useState<Filter>("all");
  const t = T[lang];
  const keep = (x: Topic) => filter === "all" || (filter === "labs" ? hasLab(x) : hasModule(x));

  return (
    <div lang={lang} className="mx-auto max-w-[1240px] px-4 pb-16 pt-10 sm:px-7 lg:px-[60px]">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div role="group" aria-label={t.filterLabel} className="flex rounded-[10px] bg-surface-2 p-[3px] text-[13px]">
          {(["all", "labs", "modules"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("rounded-[7px] px-3 py-1", filter === f ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>
              {t.filters[f]}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Language / Nyelv" className="flex gap-1 font-mono text-xs">
          {(["en", "hu"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cn("rounded px-1.5 py-0.5", lang === l ? "font-semibold text-ink" : "text-faint hover:text-ink")}>
              {l === "en" ? "EN" : "hu"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[600px]">
          <h1 className="text-balance text-[clamp(2rem,4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">
            {t.h1a}
            <br />
            {t.h1b}
          </h1>
          <p className="mt-4 text-pretty text-[16.5px] leading-normal text-muted">{t.sub}</p>
        </div>
        <ul className="flex gap-4 text-[13px] text-muted" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 rounded-full bg-model" />
            {t.legendLab}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 rounded-full bg-data" />
            {t.legendModule}
          </li>
        </ul>
      </div>

      {DOMAINS.map((d) => {
        const items = topicsIn(d.id).filter(keep);
        return (
          <section key={d.id} className="mt-10" aria-labelledby={`dom-${d.id}`}>
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 border-b border-line pb-2.5">
              <h2 id={`dom-${d.id}`} className="font-mono text-[13px] font-semibold uppercase tracking-[0.12em] text-ink">
                {d.name[lang]}
              </h2>
              <p className="text-[13px] text-faint">{d.blurb[lang]}</p>
            </div>
            {items.length === 0 ? (
              <p className="mt-3.5 text-sm text-faint">{t.none}</p>
            ) : (
              <ul className="mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((x) => {
                  const lab = hasLab(x);
                  return (
                    <li key={x.id} className={cn("flex flex-col rounded-[10px] border bg-surface px-4 pb-3.5 pt-3.5", "border-line")}>
                      <div className="flex items-center justify-between font-mono text-[11px] text-faint">
                        <span>{moduleNumber(x) ?? "–"}</span>
                        <span aria-hidden className={cn("h-2 w-2 rounded-full", lab ? "bg-model" : "bg-data")} />
                      </div>
                      <h3 className="mt-2 text-base font-semibold leading-snug text-ink">{x.title[lang]}</h3>
                      <p className="mt-1.5 flex-1 text-[13.5px] leading-normal text-muted">{x.blurb[lang]}</p>
                      <ul className="mt-3 space-y-1">
                        {x.links.map((l) => (
                          <li key={l.href}>
                            <Link href={l.href} className={cn("font-mono text-[12px] underline-offset-2 hover:underline", l.kind === "lab" ? "text-accent" : "text-muted")}>
                              <span className="sr-only">{l.kind === "lab" ? t.lab : t.module}: </span>
                              {l.label[lang]} →
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      <p className="mt-14 max-w-[720px] text-[13.5px] leading-relaxed text-faint">{t.foot}</p>
    </div>
  );
}

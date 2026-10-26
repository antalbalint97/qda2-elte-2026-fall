"use client";

import { BLOCKS } from "@/content/curriculum/blocks";
import { CONCEPTS } from "@/content/curriculum/concepts";
import { isImplemented } from "@/content/curriculum/implemented-labs";
import { LAB_FAMILIES } from "@/content/curriculum/lab-families";
import { labMaturity, maturityLabel } from "@/content/curriculum/lab-status";
import { LABS } from "@/content/curriculum/labs";
import type { Lang } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useState } from "react";
import { LabGlyph } from "./LabGlyph";

type Status = ReturnType<typeof maturityLabel>;
type Filter = "all" | "validated" | "integrated";

const T = {
  en: {
    title: "Laboratory portfolio",
    lead: "Twenty instruments, one visual grammar: a squared deviation, an interval, a sampling distribution or a weight look the same wherever they appear. The status labels are development states, not quality claims; no lab has been piloted in class yet.",
    open: "Open",
    notYet: "Not yet available in this version",
    status: { prototype: "not yet integrated", integrated: "integrated", validated: "integrated · numerically validated", reviewed: "reviewed", "pilot-ready": "pilot-ready" } as Record<Status, string>,
    filters: { all: "All", validated: "Numerically validated", integrated: "Integrated only" } as Record<Filter, string>,
    filterLabel: "Show laboratories",
    blocks: (n: number) => (n === 1 ? "1 learning block" : `${n} learning blocks`),
    more: (n: number) => `+${n} more concepts`,
    none: "No laboratory in this family matches the filter.",
  },
  hu: {
    title: "Laboratórium-portfólió",
    lead: "Húsz eszköz, egy vizuális nyelvtan: egy négyzetes eltérés, egy intervallum, egy mintavételi eloszlás vagy egy súly ugyanúgy néz ki, bárhol jelenik meg. Az állapotcímkék fejlesztési állapotok, nem minőségi állítások; egyik labort sem próbáltuk még ki órán.",
    open: "Megnyitás",
    notYet: "Ebben a verzióban még nem érhető el",
    status: { prototype: "még nincs integrálva", integrated: "integrálva", validated: "integrálva · numerikusan validált", reviewed: "átnézve", "pilot-ready": "pilotra kész" } as Record<Status, string>,
    filters: { all: "Mind", validated: "Numerikusan validált", integrated: "Csak integrált" } as Record<Filter, string>,
    filterLabel: "Laborok szűrése",
    blocks: (n: number) => `${n} tanulási blokk`,
    more: (n: number) => `+${n} további fogalom`,
    none: "Ebben a családban egy labor sem felel meg a szűrőnek.",
  },
};

const DOT: Record<Status, string> = { prototype: "bg-line-strong", integrated: "bg-data", validated: "bg-model", reviewed: "bg-model", "pilot-ready": "bg-model" };
const INK: Record<Status, string> = { prototype: "text-faint", integrated: "text-data-ink", validated: "text-model-ink", reviewed: "text-model-ink", "pilot-ready": "text-model-ink" };
const statusOf = (id: string) => maturityLabel(labMaturity(id));
const blockCount = (id: string) => BLOCKS.filter((b) => b.lab === id).length;

export function LabsPortfolio() {
  const [lang, setLang] = useState<Lang>("en");
  const [filter, setFilter] = useState<Filter>("all");
  const t = T[lang];
  const concept = (id: string) => CONCEPTS.find((c) => c.id === id);
  const keep = (id: string) => filter === "all" || (filter === "validated" ? statusOf(id) === "validated" : statusOf(id) === "integrated");

  return (
    <div lang={lang} className="mx-auto max-w-[1240px] px-4 pb-20 pt-10 sm:px-7 lg:px-[60px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[720px]">
          <h1 className="text-[clamp(2rem,4vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink">{t.title}</h1>
          <p className="mt-3 text-pretty text-[15.5px] leading-relaxed text-muted">{t.lead}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label={t.filterLabel} className="flex rounded-[10px] bg-surface-2 p-[3px] text-[13px]">
            {(["all", "validated", "integrated"] as const).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("rounded-[7px] px-3 py-1", filter === f ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink")}>
                {t.filters[f]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "hu" : "en")}
            aria-label={lang === "en" ? "Language: English" : "Nyelv: magyar"}
            className="rounded-md border border-line px-2 py-1 font-mono text-xs text-muted hover:text-ink"
          >
            {lang === "en" ? "EN · hu" : "en · HU"}
          </button>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-4 font-mono text-[11px] uppercase tracking-[0.06em] text-muted" aria-label="Legend">
        {(["validated", "integrated"] as const).map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("h-2 w-2 rounded-sm", DOT[s])} />
            {t.status[s]}
          </li>
        ))}
      </ul>

      {LAB_FAMILIES.map((fam) => {
        const ids = fam.labs.filter(keep);
        return (
          <section key={fam.id} aria-labelledby={`fam-${fam.id}`} className="mt-12">
            <h2 id={`fam-${fam.id}`} className="text-[1.45rem] font-semibold tracking-[-0.015em] text-ink">
              {fam.title[lang]}
            </h2>
            <p className="mt-1 text-[13.5px] text-muted">{fam.shared[lang]}</p>
            {ids.length === 0 && <p className="mt-4 text-sm text-faint">{t.none}</p>}
            <ul className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {ids.map((id) => {
                const def = LABS.find((l) => l.id === id);
                if (!def) return null;
                const live = isImplemented(id);
                const status = statusOf(id);
                const shown = def.concepts.slice(0, 3).map(concept).filter((c) => c !== undefined);
                const nb = blockCount(id);
                return (
                  <li key={id} className={cn("flex flex-col gap-2.5 rounded-[14px] border bg-surface p-4", live ? "border-line" : "border-dashed border-line-strong")}>
                    <div className="flex items-center gap-2 text-[10.5px]">
                      <span className={cn("h-2 w-2 rounded-sm", DOT[status])} aria-hidden />
                      <span className={cn("font-mono uppercase tracking-[0.06em]", INK[status])}>{t.status[status]}</span>
                      <span className="ml-auto shrink-0 whitespace-nowrap font-mono text-faint">{id}</span>
                    </div>
                    <h3 className="text-base font-semibold leading-snug text-ink">{def.name[lang]}</h3>
                    <LabGlyph id={id} />
                    <p className="text-[13px] leading-normal text-muted">{def.interaction.split(/[.;]/)[0]}.</p>
                    {shown.length > 0 && (
                      <ul className="flex flex-wrap gap-1">
                        {shown.map((c) => (
                          <li key={c.id}>
                            <Link href={`/atlas#${encodeURIComponent(c.id)}`} className="block rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink hover:bg-surface-3">
                              {c.name[lang]}
                            </Link>
                          </li>
                        ))}
                        {def.concepts.length > 3 && <li className="px-1 py-0.5 text-[11px] text-faint">{t.more(def.concepts.length - 3)}</li>}
                      </ul>
                    )}
                    <div className="mt-auto flex items-center gap-2 pt-1">
                      {live ? (
                        <Link href={`/lab/${id}`} className="inline-flex h-8 items-center rounded-[7px] bg-ink px-3 text-[13px] font-semibold text-bg hover:opacity-90">
                          {t.open}
                          <span className="sr-only">: {def.name[lang]}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-faint">{t.notYet}</span>
                      )}
                      {nb > 0 && <span className="ml-auto font-mono text-[10.5px] text-faint">{t.blocks(nb)}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

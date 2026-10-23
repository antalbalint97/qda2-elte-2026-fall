"use client";

import { CONCEPTS } from "@/content/curriculum/concepts";
import { isImplemented } from "@/content/curriculum/implemented-labs";
import { LAB_FAMILIES } from "@/content/curriculum/lab-families";
import { labMaturity, maturityLabel } from "@/content/curriculum/lab-status";
import { LABS } from "@/content/curriculum/labs";
import type { Lang } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useState } from "react";

const T = {
  en: {
    title: "Laboratory portfolio",
    lead: "Twenty instruments, one visual grammar: a squared deviation, an interval, a sampling distribution or a weight look the same wherever they appear. The status labels are development states, not quality claims; no lab has been piloted in class yet.",
    open: "Open lab",
    notYet: "Not yet available in this version",
    status: { prototype: "not yet integrated", integrated: "integrated", validated: "integrated · numerically validated", reviewed: "reviewed", "pilot-ready": "pilot-ready" },
    concepts: "Concepts",
    more: "more",
  },
  hu: {
    title: "Laboratórium-portfólió",
    lead: "Húsz eszköz, egy vizuális nyelvtan: egy négyzetes eltérés, egy intervallum, egy mintavételi eloszlás vagy egy súly ugyanúgy néz ki, bárhol jelenik meg. Az állapotcímkék fejlesztési állapotok, nem minőségi állítások; egyik labort sem próbáltuk még ki órán.",
    open: "Labor megnyitása",
    notYet: "Ebben a verzióban még nem érhető el",
    status: { prototype: "még nincs integrálva", integrated: "integrálva", validated: "integrálva · numerikusan validált", reviewed: "átnézve", "pilot-ready": "pilotra kész" },
    concepts: "Fogalmak",
    more: "további",
  },
};

export function LabsPortfolio() {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  const cname = (id: string) => CONCEPTS.find((c) => c.id === id)?.name[lang];
  return (
    <div lang={lang} className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">{t.title}</h1>
          <p className="mt-3 leading-relaxed text-muted">{t.lead}</p>
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
      {LAB_FAMILIES.map((fam) => (
        <section key={fam.id} aria-labelledby={`fam-${fam.id}`} className="mt-10">
          <h2 id={`fam-${fam.id}`} className="font-serif text-2xl font-semibold text-ink">
            {fam.title[lang]}
          </h2>
          <p className="mt-1 text-sm text-muted">{fam.shared[lang]}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fam.labs.map((id) => {
              const def = LABS.find((l) => l.id === id);
              if (!def) return null;
              const live = isImplemented(id);
              const status = maturityLabel(labMaturity(id));
              const shown = def.concepts.slice(0, 3).map(cname).filter(Boolean);
              return (
                <li key={id} className={cn("flex flex-col rounded-2xl border border-line bg-surface p-4", !live && "opacity-80")}>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={cn("h-2.5 w-2.5 rounded-sm", live ? "bg-model" : "bg-line-strong")} aria-hidden />
                    <span className={cn("font-mono uppercase tracking-wide", live ? "text-model-ink" : "text-faint")}>{t.status[status]}</span>
                    <span className="ml-auto font-mono text-faint">{id}</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold leading-snug text-ink">{def.name[lang]}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{def.interaction.split(/[.;]/)[0]}.</p>
                  {shown.length > 0 && (
                    <p className="mt-2 text-xs text-faint">
                      {t.concepts}: {shown.join(" · ")}
                      {def.concepts.length > 3 && ` · +${def.concepts.length - 3} ${t.more}`}
                    </p>
                  )}
                  <div className="mt-auto pt-3">
                    {live ? (
                      <Link href={`/lab/${id}`} className="inline-flex h-8 items-center rounded-lg bg-accent px-3 text-sm font-medium text-accent-ink hover:opacity-90">
                        {t.open}
                        <span className="sr-only">: {def.name[lang]}</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-faint">{t.notYet}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

"use client";

import { MODULES } from "@/content/modules";
import { TOPICS } from "@/content/topics";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useState } from "react";
import { HeroLeastSquares, type HeroStrings } from "./HeroLeastSquares";

type Lang = "en" | "hu";

const T = {
  en: {
    kicker: "QUANTITATIVE DATA ANALYSIS 2",
    h1: "See the mathematics behind the numbers.",
    sub: "An interactive laboratory where statistical concepts become things you can explore, manipulate and understand.",
    cta1: "Enter the Lab",
    cta2: "Explore Topics",
    heroHint: "Don't just calculate it. See why it works. Drag the points on the right: the line, the residuals and r follow immediately.",
    philKicker: "LEARNING PHILOSOPHY",
    philH: "The visualization is not an illustration beside the lesson. The visualization is the learning environment.",
    philP1: "Most statistics teaching rests on text, static formulas and software output. Here the learner manipulates representations and watches the mathematical consequences in real time: an observation moves, the mean follows, deviations become squares, squares become variance.",
    philP2: "Every value is computed from the actual data, from a single shared source. No fake numbers, no metric nudged for the sake of an animation. Sample and population variance, effect size and significance get separate names and separate explanations.",
    featKicker: "FEATURED LABORATORY",
    featH: "Variance → Regression → ANOVA",
    featP: "One dataset, three views. Variance measures the distance between observations and their mean; regression predicts with a line and measures what is left; ANOVA predicts with group means. All three ask the same question: how much variation remains after the model has made its prediction?",
    featCta: "Open the lab",
    stages: [
      ["Variance", "Deviations → squares → sum of squares → variance, one layer at a time."],
      ["Regression", "Mean-only model, your own line, least squares. SST = SSR + SSE only for OLS."],
      ["ANOVA", "SS total = SS between + SS within; F, η² and p from a tested F distribution."],
    ],
    topicsH: "Topics",
    topicsAll: "All topics →",
    module: (n: string) => `Module ${n}`,
    labs: (n: number) => (n === 1 ? "1 lab" : `${n} labs`),
    allLabs: "All 20 laboratories →",
    modes: [
      ["EXPLORE", "Open-ended experimentation, no account. Move points and parameters, switch representations, reset."],
      ["LEARN", "Guided discovery: Predict → Experiment → Explain → Transfer. One conceptual question at a time, not a multiple-choice quiz."],
      ["TEACH", "Projector view: large charts, collapsible panels, prepared demonstrations, reset to a known state. Classroom-ready."],
    ],
    moreH: "Practise and go further",
    more: [
      ["/review", "Quick review", "Thirty mixed questions across the modules; every wrong answer says which idea got mixed up."],
      ["/go-further", "Go Further", "Optional depth: residuals, pairwise follow-ups, survey weights, p-value mathematics, reproducible SPSS."],
      ["/bonus/sopranos", "The Sopranos bonus lab", "A whole analysis on a synthetic case dataset, from question to defensible conclusion."],
    ],
    acadH: "Academic and educational use",
    acadP1: "This is an independently developed companion for the Quantitative Data Analysis 2 course. References to courses do not imply official institutional endorsement. SPSS remains the reference tool; the lab explains what its output means.",
    acadP2: "No accounts, no backend, no analytics. State stays in the browser. A future teaching pilot could study usability and conceptual understanding; learning effectiveness is a question, not a claim.",
    hero: {
      title: "Least squares · live",
      caption: "Synthetic data: weekly news hours (X) and political knowledge (Y). Every coral square is a squared residual; the line minimises their total.",
      xLabel: "X · news hours per week",
      yLabel: "Y · political knowledge",
      point: (i: number, x: number, y: number) => `Point ${i}: X ${x}, Y ${y}`,
      chart: (r: string) => `Scatterplot of 15 points with their least-squares line; r = ${r}. Use the arrow keys on a point to move it.`,
      reset: "Reset",
    } satisfies HeroStrings,
  },
  hu: {
    kicker: "KVANTITATÍV ADATELEMZÉS 2",
    h1: "Lásd a matematikát a számok mögött.",
    sub: "Egy interaktív labor, ahol a statisztikai fogalmak megfogható, mozgatható és megérthető dolgokká válnak.",
    cta1: "Belépés a laborba",
    cta2: "Témák böngészése",
    heroHint: "Ne csak számold ki. Lásd, miért működik. Húzd a pontokat a jobb oldali ábrán: az egyenes, a reziduumok és r azonnal követik.",
    philKicker: "TANULÁSI ELV",
    philH: "A vizualizáció nem illusztráció a lecke mellett. A vizualizáció maga a tanulási környezet.",
    philP1: "A legtöbb statisztikaoktatás szövegre, statikus képletekre és szoftverkimenetre épül. Itt a tanuló reprezentációkat mozgat, és valós időben figyeli a matematikai következményeket: egy megfigyelés elmozdul, az átlag követi, az eltérésekből négyzetek lesznek, a négyzetekből variancia.",
    philP2: "Minden érték a tényleges adatból számolódik, egyetlen közös forrásból. Nincs hamis szám, nincs animáció kedvéért igazított mérőszám. A mintavariancia, a sokasági variancia, a hatásméret és a szignifikancia külön nevet és külön magyarázatot kap.",
    featKicker: "KIEMELT LABOR",
    featH: "Variancia → Regresszió → ANOVA",
    featP: "Egy adathalmaz, három nézet. A variancia a megfigyelések és az átlag távolságát méri; a regresszió egy egyenessel jósol és a maradékot méri; az ANOVA csoportátlagokkal jósol. Mindhárom ugyanazt kérdezi: mennyi variancia marad, miután a modell előrejelzett?",
    featCta: "Labor megnyitása",
    stages: [
      ["Variancia", "Eltérések → négyzetek → négyzetösszeg → variancia, rétegenként."],
      ["Regresszió", "Átlag-modell, saját egyenes, legkisebb négyzetek. SST = SSR + SSE csak az OLS-re."],
      ["ANOVA", "SS teljes = SS közötti + SS belső; F, η² és p a tesztelt F-eloszlásból."],
    ],
    topicsH: "Témák",
    topicsAll: "Összes téma →",
    module: (n: string) => `${n}. modul`,
    labs: (n: number) => `${n} labor`,
    allLabs: "Mind a 20 labor →",
    modes: [
      ["FELFEDEZ", "Nyílt kísérletezés fiók nélkül. Mozgasd a pontokat és a paramétereket, válts reprezentációt, állítsd vissza."],
      ["TANUL", "Vezetett felfedezés: Jósolj → Kísérletezz → Magyarázd → Alkalmazd. Egy fogalmi kérdés egyszerre, nem feleletválasztós teszt."],
      ["TANÍT", "Projektoros nézet: nagy ábrák, elrejthető panelek, előkészített demonstrációk, visszaállítás ismert állapotba."],
    ],
    moreH: "Gyakorlás és elmélyülés",
    more: [
      ["/review", "Gyors ismétlés", "Harminc vegyes kérdés a modulokból; minden rossz válasz megmondja, melyik gondolat keveredett össze."],
      ["/go-further", "Go Further", "Választható mélység: reziduumok, páros összehasonlítások, survey-súlyok, a p-érték matematikája, reprodukálható SPSS."],
      ["/bonus/sopranos", "The Sopranos bónuszlabor", "Egy teljes elemzés szintetikus esetadatokon, a kérdéstől a megvédhető következtetésig."],
    ],
    acadH: "Oktatási és kutatási használat",
    acadP1: "Ez az eszköz a Kvantitatív adatelemzés 2 kurzushoz készülő, önállóan fejlesztett oktatási segédanyag. A kurzusokra való hivatkozás nem jelent hivatalos intézményi jóváhagyást. Az SPSS marad a referenciaeszköz; a labor azt magyarázza, mit jelent a kimenet.",
    acadP2: "Nincs fiók, nincs háttérrendszer, nincs analitika. Az állapot a böngészőben marad. Egy jövőbeli tanítási pilot a használhatóságot és a fogalmi megértést vizsgálhatja; a tanulási hatékonyság nem állítás, hanem kérdés.",
    hero: {
      title: "Legkisebb négyzetek · élő",
      caption: "Szintetikus adat: heti híróra (X) és politikai tudás (Y). Minden korall négyzet egy reziduum négyzete; az egyenes azok összegét minimalizálja.",
      xLabel: "X · heti híróra",
      yLabel: "Y · politikai tudás",
      point: (i: number, x: number, y: number) => `${i}. pont: X ${x}, Y ${y}`,
      chart: (r: string) => `15 pont szórásdiagramja a legkisebb négyzetes egyenessel; r = ${r}. Egy ponton a nyílbillentyűkkel mozgathatod.`,
      reset: "Visszaállítás",
    } satisfies HeroStrings,
  },
};

const DOMAIN_LABEL: Record<string, { en: string; hu: string }> = {
  data: { en: "DATA & MEASUREMENT", hu: "ADATOK ÉS MÉRÉS" },
  relationships: { en: "RELATIONSHIPS", hu: "KAPCSOLATOK" },
  inference: { en: "INFERENCE", hu: "KÖVETKEZTETÉS" },
  survey: { en: "SURVEY STATISTICS", hu: "SURVEY-STATISZTIKA" },
  math: { en: "MATHEMATICAL FOUNDATIONS", hu: "MATEMATIKAI ALAPOK" },
};

/** Topics with a course module, in module order: the landing page's topic grid. */
const MODULE_TOPICS = MODULES.map((m) => {
  const topic = TOPICS.find((t) => t.links.some((l) => l.kind === "module" && l.href === m.href));
  return { m, topic };
});

export function Landing() {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  return (
    <div lang={lang}>
      {/* midnight hero; the site header above it is midnight too */}
      <section className="dark bg-night pb-16 text-night-ink">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-7">
          <div className="flex justify-end pt-4">
            <div role="group" aria-label="Language / Nyelv" className="flex overflow-hidden rounded-md border border-night-line font-mono text-xs">
              {(["en", "hu"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={cn("px-2 py-1 uppercase", lang === l ? "bg-night-ink text-night" : "text-night-muted hover:text-night-ink")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid items-center gap-10 pt-6 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs tracking-[0.12em] text-model">{t.kicker}</p>
              <h1 className="mt-3.5 text-balance text-[clamp(2.1rem,4.6vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.02em]">{t.h1}</h1>
              <p className="mt-4 max-w-[520px] text-pretty text-lg leading-normal text-night-muted">{t.sub}</p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link href="/lab/vra-lab" className="rounded-[9px] bg-model px-5 py-3 text-[15px] font-semibold text-night hover:opacity-90">
                  {t.cta1}
                </Link>
                <Link href="/topics" className="rounded-[9px] border border-night-line px-5 py-3 text-[15px] text-night-ink hover:border-night-muted">
                  {t.cta2}
                </Link>
              </div>
              <p className="mt-5 max-w-[480px] text-[13px] leading-normal text-night-faint">{t.heroHint}</p>
            </div>
            <HeroLeastSquares t={t.hero} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-7">
        {/* philosophy */}
        <section className="grid gap-8 py-16 md:grid-cols-3" aria-labelledby="phil-h">
          <div>
            <p className="font-mono text-xs tracking-[0.12em] text-accent">{t.philKicker}</p>
            <h2 id="phil-h" className="mt-2.5 text-balance text-[1.8rem] font-semibold leading-[1.15] tracking-[-0.015em] text-ink">
              {t.philH}
            </h2>
          </div>
          <p className="text-pretty text-[16.5px] leading-relaxed text-muted">{t.philP1}</p>
          <p className="text-pretty text-[16.5px] leading-relaxed text-muted">{t.philP2}</p>
        </section>

        {/* featured lab */}
        <section className="grid items-center gap-7 rounded-[18px] border border-line bg-surface p-7 md:grid-cols-2" aria-labelledby="feat-h">
          <div>
            <p className="font-mono text-xs tracking-[0.12em] text-accent">{t.featKicker}</p>
            <h2 id="feat-h" className="mt-2.5 text-[1.6rem] font-semibold leading-tight tracking-[-0.015em] text-ink">
              {t.featH}
            </h2>
            <p className="mt-3 text-pretty text-[15.5px] leading-relaxed text-muted">{t.featP}</p>
            <Link href="/lab/vra-lab" className="mt-4 inline-block rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-bg hover:opacity-90">
              {t.featCta}
            </Link>
          </div>
          <ol className="grid gap-2.5">
            {t.stages.map(([h, p], i) => (
              <li key={h}>
                <Link href={`/lab/vra-lab#s=${i + 1}`} className="grid grid-cols-[34px_1fr] items-start gap-3 rounded-xl bg-bg p-3.5 hover:bg-surface-2">
                  <span className="pt-0.5 font-mono text-xs text-faint">0{i + 1}</span>
                  <span>
                    <strong className="block text-[15px] text-ink">{h}</strong>
                    <span className="text-[13.5px] leading-normal text-faint">{p}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* topics */}
        <section className="py-16" aria-labelledby="topics-h">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="topics-h" className="text-[1.6rem] font-semibold tracking-[-0.015em] text-ink">
              {t.topicsH}
            </h2>
            <Link href="/topics" className="text-sm text-accent underline underline-offset-2 hover:no-underline">
              {t.topicsAll}
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {MODULE_TOPICS.map(({ m, topic }) => {
              const labCount = topic?.links.filter((l) => l.kind === "lab").length ?? 0;
              return (
                <li key={m.slug}>
                  <Link href={m.href} className="block h-full rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-ink">
                    <span className="font-mono text-[11px] tracking-[0.08em] text-faint">{topic ? DOMAIN_LABEL[topic.domain][lang] : ""}</span>
                    <span className="mt-1.5 block text-[15px] font-semibold text-ink">{topic ? topic.title[lang] : m.title}</span>
                    <span className="mt-1 block text-[12.5px] text-faint">
                      {t.module(m.number)}
                      {labCount > 0 && ` · ${t.labs(labCount)}`}
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/labs" className="block h-full rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-ink">
                <span className="font-mono text-[11px] tracking-[0.08em] text-accent">LABS</span>
                <span className="mt-1.5 block text-[15px] font-semibold text-ink">{t.allLabs}</span>
              </Link>
            </li>
          </ul>
        </section>

        {/* modes */}
        <section className="grid gap-3 md:grid-cols-3" aria-label="Modes">
          {t.modes.map(([h, p]) => (
            <div key={h} className="rounded-xl border border-line bg-surface p-5">
              <h2 className="font-mono text-[11px] tracking-[0.08em] text-accent">{h}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{p}</p>
            </div>
          ))}
        </section>

        {/* practise and go further */}
        <section className="pt-16" aria-labelledby="more-h">
          <h2 id="more-h" className="text-[1.6rem] font-semibold tracking-[-0.015em] text-ink">
            {t.moreH}
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {t.more.map(([href, h, p]) => (
              <li key={href}>
                <Link href={href} className="group block h-full rounded-xl border border-line bg-surface p-5 transition-colors hover:border-ink">
                  <span className="flex items-center justify-between text-[15px] font-semibold text-ink">
                    {h}
                    <span aria-hidden className="text-faint transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                  <span className="mt-1.5 block text-[13.5px] leading-relaxed text-faint">{p}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* academic use */}
        <section className="mt-16 grid gap-7 border-t border-line pb-16 pt-9 md:grid-cols-3" aria-labelledby="acad-h">
          <h2 id="acad-h" className="text-xl font-semibold text-ink">
            {t.acadH}
          </h2>
          <p className="text-pretty text-[14.5px] leading-relaxed text-muted">{t.acadP1}</p>
          <p className="text-pretty text-[14.5px] leading-relaxed text-muted">{t.acadP2}</p>
        </section>
      </div>
    </div>
  );
}

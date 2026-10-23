"use client";

// The /r page: a free R scratchpad with the course datasets one click away. Nothing typed here is stored or sent;
// R runs in this tab's worker. The survey package is fetched from the webR package repository only when the
// learner ticks the box (and the page says so).
import { SelectControl, ToggleControl } from "@/components/lab/primitives/controls";
import { DATASETS, datasetById, rName } from "@/content/curriculum/datasets";
import type { Lang } from "@/content/curriculum/types";
import { cn } from "@/lib/cn";
import { WEBR_VERSION } from "@/lib/r/webr-adapter";
import { useMemo, useState } from "react";
import { RCodeBlock } from "./RCodeBlock";

const T = {
  en: {
    eyebrow: "BROWSER R",
    title: "R in the browser",
    lead: "Real R (webR {v}, R compiled to WebAssembly) running inside this browser tab. Nothing you type is saved or sent anywhere; closing the tab discards it. The first run downloads the R runtime from this site (about 10 MB, cached afterwards).",
    dataset: "Dataset",
    none: "No dataset",
    datasetNote: "Available in R as {name}: {n} rows, {kind}. {limits}.",
    survey: "Load the survey package",
    surveyHint: "Downloads survey and its dependencies from the webR package repository (repo.r-wasm.org) the first time; that server sees an ordinary download request from your browser.",
    examples: "Examples",
    limits: "Limits: code up to 20 000 characters, 2 000 output lines, 8 plots, 60 seconds per run. A stopped or timed-out run restarts R. Only the survey package can be installed.",
    ex: { hello: "First steps", plot: "A plot", data: "Explore the dataset", svy: "Survey design (needs survey)" },
  },
  hu: {
    eyebrow: "R A BÖNGÉSZŐBEN",
    title: "R a böngészőben",
    lead: "Valódi R (webR {v}, WebAssemblyre fordított R), amely ebben a böngészőlapon fut. Amit beírsz, sehová nem mentjük és nem küldjük el; a lap bezárásával elvész. Az első futtatás letölti az R-futtatókörnyezetet erről az oldalról (kb. 10 MB, utána gyorsítótárból jön).",
    dataset: "Adatsor",
    none: "Nincs adatsor",
    datasetNote: "Az R-ben {name} néven érhető el: {n} sor, {kind}. {limits}.",
    survey: "A survey csomag betöltése",
    surveyHint: "Első alkalommal letölti a survey csomagot és függőségeit a webR csomagtárolóból (repo.r-wasm.org); az a szerver egy szokásos letöltési kérést lát a böngésződtől.",
    examples: "Példák",
    limits: "Korlátok: legfeljebb 20 000 karakter kód, 2 000 kimeneti sor, 8 ábra, futtatásonként 60 másodperc. A leállított vagy időtúllépéses futás újraindítja az R-t. Csak a survey csomag telepíthető.",
    ex: { hello: "Első lépések", plot: "Egy ábra", data: "Az adatsor felfedezése", svy: "Mintavételi terv (survey kell hozzá)" },
  },
};

type ExampleKey = keyof (typeof T)["en"]["ex"];
function example(key: ExampleKey, ds: string | null): string {
  const d = ds ?? "news_knowledge";
  switch (key) {
    case "hello":
      return "x <- c(2, 4, 4, 5, 7, 9)\nmean(x)\nsd(x)\nsummary(x)";
    case "plot":
      return "set.seed(1)\nx <- rnorm(200)\nhist(x, breaks = 20, main = \"200 draws from N(0, 1)\", col = \"grey85\")";
    case "data":
      return `str(${d})\nsummary(${d})`;
    case "svy":
      return "library(survey)\n# stratified two-stage design: PSUs nested in settlement strata, weights N_h / n_h\ndes <- svydesign(ids = ~psu, strata = ~stratum, weights = ~weight,\n                 data = trust_survey, nest = TRUE)\nsvymean(~trust, des)\nsvyby(~trust, ~stratum, des, svymean)";
  }
}

export function RConsole() {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  const [dsId, setDsId] = useState<string>("ds.news-knowledge");
  const [survey, setSurvey] = useState(false);
  const [code, setCode] = useState(() => example("data", "news_knowledge"));
  const ds = datasetById(dsId);
  const datasets = useMemo(() => (ds ? [ds] : []), [ds]);

  const pick = (key: ExampleKey) => {
    if (key === "svy") {
      setSurvey(true);
      setDsId("ds.trust-survey");
    }
    setCode(example(key, key === "svy" ? "trust_survey" : ds ? rName(ds.id) : null));
  };

  return (
    <div lang={lang} className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-faint">{t.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-ink">{t.title}</h1>
        </div>
        <div role="group" aria-label="Language / Nyelv" className="flex gap-1">
          {(["en", "hu"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={cn("rounded-md border px-2.5 py-1 font-mono text-xs uppercase", lang === l ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-ink")}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 leading-relaxed text-muted">{t.lead.replace("{v}", WEBR_VERSION)}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <SelectControl
            label={t.dataset}
            value={dsId}
            onChange={setDsId}
            options={[{ value: "", label: t.none }, ...DATASETS.map((d) => ({ value: d.id, label: `${rName(d.id)}: ${d.title[lang]}` }))]}
          />
          {ds && (
            <p className="mt-1 text-xs text-muted">
              {t.datasetNote
                .replace("{name}", rName(ds.id))
                .replace("{n}", String(ds.rows.length))
                .replace("{kind}", ds.provenance.kind)
                .replace("{limits}", ds.provenance.limits)}
            </p>
          )}
        </div>
        <ToggleControl label={t.survey} checked={survey} onChange={setSurvey} hint={t.surveyHint} />
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-ink">{t.examples}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {(Object.keys(t.ex) as ExampleKey[]).map((k) => (
            <button key={k} type="button" onClick={() => pick(k)} className="rounded-md border border-line px-2.5 py-1 text-sm text-muted hover:border-accent hover:text-ink">
              {t.ex[k]}
            </button>
          ))}
        </div>
      </div>

      <RCodeBlock className="mt-4" initialCode={code} lang={lang} datasets={datasets} packages={survey ? ["survey"] : []} />
      <p className="mt-6 text-xs leading-relaxed text-faint">{t.limits}</p>
    </div>
  );
}

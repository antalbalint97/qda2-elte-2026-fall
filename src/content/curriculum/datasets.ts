// Dataset registry. Every dataset is small, carries explicit provenance and is SYNTHETIC unless `kind` says otherwise.
// Generators are seeded (src/lib/engine/rng.ts), so rows are identical on every build and in every browser.
//
// ID note: the V3 package used "ds.index-120" for two different data sets (the module-09 responses in
// data/blocks.js and a generated political-efficacy set in data/datasets.js). The block registry, course
// templates and lab specs all mean the module-09 responses, so that keeps the id; the generated set is
// registered as "ds.efficacy-120".
import { RESPONSES } from "../../components/modules/indices/responses";
import { gaussian, mulberry32 } from "../../lib/engine/rng";
import type { Dataset } from "./types";

function newsKnowledge(): Dataset {
  const x = [1, 2, 3, 4, 6, 3, 5, 6, 8, 9, 5, 7, 9, 11, 13];
  const y = [28, 35, 31, 44, 49, 46, 52, 58, 55, 66, 60, 71, 68, 82, 88];
  const g = ["Primary", "Secondary", "Tertiary"];
  return {
    id: "ds.news-knowledge",
    title: { en: "News hours → political knowledge", hu: "Hírfogyasztás → politikai tudás" },
    provenance: { kind: "synthetic", n: 15, generator: "hand-authored (VRA lab base scenario)", license: "CC-BY", limits: "illustrative, n = 15" },
    columns: [
      { name: "id", type: "string", label: "Respondent" },
      { name: "news_hours", type: "number", label: "Weekly news hours" },
      { name: "knowledge", type: "number", label: "Political knowledge (0–100)" },
      { name: "education", type: "factor", label: "Education group", levels: g },
    ],
    rows: x.map((v, i) => ["ABCDEFGHIJKLMNO"[i], v, y[i], g[Math.floor(i / 5)]]),
  };
}

function trustSurvey(): Dataset {
  const seed = 2026;
  const r = mulberry32(seed);
  const z = gaussian(r);
  const rows: (number | string)[][] = [];
  const strata = [
    { h: "Budapest", Nh: 1800, mu: 5.8 },
    { h: "Towns", Nh: 3200, mu: 5.1 },
    { h: "Villages", Nh: 3000, mu: 4.6 },
  ];
  let id = 1;
  strata.forEach((s, hi) => {
    for (let p = 0; p < 4; p++) {
      const psuEff = 0.4 * z();
      for (let k = 0; k < 15; k++) {
        const age = Math.round(18 + 62 * r());
        const female = r() < 0.53 ? 1 : 0;
        const edu = r() < 0.25 ? "Primary" : r() < 0.7 ? "Secondary" : "Tertiary";
        const trust = Math.max(0, Math.min(10, Math.round(s.mu + psuEff + (edu === "Tertiary" ? 0.6 : 0) - 0.01 * (age - 45) + 1.6 * z())));
        rows.push([id++, s.h, hi * 10 + p + 1, s.Nh / 60, age, female, edu, trust, r() < 0.62 ? 1 : 0]);
      }
    }
  });
  return {
    id: "ds.trust-survey",
    title: { en: "Trust in institutions survey (stratified, clustered)", hu: "Intézményi bizalom felmérés (rétegzett, csoportos)" },
    provenance: { kind: "synthetic", n: rows.length, generator: `src/content/curriculum/datasets.ts (mulberry32 seed ${seed}); 3 strata × 4 PSUs × 15`, seed, license: "CC-BY", limits: "synthetic; PSU effect SD 0.4; weights = N_h/n_h" },
    design: { strata: "stratum", psu: "psu", weight: "weight", fpc: { Budapest: 1800, Towns: 3200, Villages: 3000 } },
    columns: [
      { name: "id", type: "number", label: "Respondent" },
      { name: "stratum", type: "factor", label: "Settlement stratum", levels: ["Budapest", "Towns", "Villages"] },
      { name: "psu", type: "number", label: "Primary sampling unit" },
      { name: "weight", type: "number", label: "Design weight N_h/n_h" },
      { name: "age", type: "number", label: "Age" },
      { name: "female", type: "number", label: "Female (1/0)" },
      { name: "education", type: "factor", label: "Education", levels: ["Primary", "Secondary", "Tertiary"] },
      { name: "trust", type: "number", label: "Trust in parliament (0–10)" },
      { name: "voted", type: "number", label: "Voted last election (1/0)" },
    ],
    rows,
  };
}

function householdIncome(): Dataset {
  const seed = 1123;
  const r = mulberry32(seed);
  const z = gaussian(r);
  const rows: number[][] = [];
  for (let i = 0; i < 300; i++) {
    const hh = 1 + Math.floor(r() * 5);
    const inc = Math.round(Math.exp(12.9 + 0.12 * hh + 0.45 * z()) / 1000) * 1000;
    rows.push([i + 1, hh, inc, Math.round(inc / Math.sqrt(hh))]);
  }
  return {
    id: "ds.household-income",
    title: { en: "Household income (synthetic, HUF/month)", hu: "Háztartási jövedelem (szintetikus, Ft/hó)" },
    provenance: { kind: "synthetic", n: 300, generator: `log-normal, src/content/curriculum/datasets.ts seed ${seed}`, seed, license: "CC-BY", limits: "not real HCSO data; shape only" },
    columns: [
      { name: "id", type: "number", label: "Household" },
      { name: "size", type: "number", label: "Household size" },
      { name: "income", type: "number", label: "Net income HUF/month" },
      { name: "equiv_income", type: "number", label: "Equivalised income (÷√size)" },
    ],
    rows,
  };
}

function index120(): Dataset {
  return {
    id: "ds.index-120",
    title: { en: "Trust in science items (120 respondents)", hu: "Tudományba vetett bizalom itemek (120 válaszadó)" },
    provenance: { kind: "synthetic", n: RESPONSES.length, generator: "scripts/indices/generate.py (seeded); module 02 Building an Index", license: "CC-BY", limits: "T3 and T5 are negatively worded; T6 measures interest, not trust" },
    columns: [
      { name: "id", type: "number", label: "Respondent" },
      { name: "T1", type: "number", label: "Scientists mostly act in the public interest (1–5)" },
      { name: "T2", type: "number", label: "Published findings can usually be relied on (1–5)" },
      { name: "T3", type: "number", label: "Science creates more problems than it solves (1–5, negative)" },
      { name: "T4", type: "number", label: "In a health crisis I would follow scientists (1–5)" },
      { name: "T5", type: "number", label: "Scientists hide inconvenient results (1–5, negative)" },
      { name: "T6", type: "number", label: "I enjoy science documentaries (1–5)" },
    ],
    rows: RESPONSES.map((r, i) => [i + 1, ...r]),
  };
}

function efficacy120(): Dataset {
  const seed = 120;
  const r = mulberry32(seed);
  const z = gaussian(r);
  const rows: number[][] = [];
  for (let i = 0; i < 120; i++) {
    const theta = z();
    const it = (load: number, rev = false) => {
      let v = Math.round(3 + load * theta + Math.sqrt(1 - load * load) * z());
      v = Math.max(1, Math.min(5, v));
      return rev ? 6 - v : v;
    };
    rows.push([i + 1, it(0.8), it(0.75), it(0.7), it(0.65, true), it(0.3)]);
  }
  return {
    id: "ds.efficacy-120",
    title: { en: "Political efficacy items (120 respondents)", hu: "Politikai hatékonyság itemek (120 válaszadó)" },
    provenance: { kind: "synthetic", n: 120, generator: `one-factor model, loadings .8/.75/.7/.65(rev)/.3, src/content/curriculum/datasets.ts seed ${seed}`, seed, license: "CC-BY", limits: "item 4 is reverse-keyed; item 5 is a weak item by construction" },
    columns: [
      { name: "id", type: "number", label: "Respondent" },
      { name: "eff1", type: "number", label: "I understand politics (1–5)" },
      { name: "eff2", type: "number", label: "I can influence decisions (1–5)" },
      { name: "eff3", type: "number", label: "Politicians care (1–5)" },
      { name: "eff4_rev", type: "number", label: "Politics is too complicated (1–5, reverse)" },
      { name: "eff5", type: "number", label: "I follow the news (1–5)" },
    ],
    rows,
  };
}

export const DATASETS: Dataset[] = [newsKnowledge(), trustSurvey(), householdIncome(), index120(), efficacy120()];

export const datasetById = (id: string | undefined | null): Dataset | null => (id ? DATASETS.find((d) => d.id === id) ?? null : null);

/** Numeric column as an array (non-numeric cells become NaN and should be filtered by the caller). */
export function column(ds: Dataset, name: string): (number | string)[] {
  const j = ds.columns.findIndex((c) => c.name === name);
  return j < 0 ? [] : ds.rows.map((r) => r[j]);
}

/** RFC 4180 CSV (strings quoted, quotes doubled). */
export function datasetCsv(ds: Pick<Dataset, "columns" | "rows">): string {
  const cell = (v: number | string) => (typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : String(v));
  return [ds.columns.map((c) => c.name).join(","), ...ds.rows.map((r) => r.map(cell).join(","))].join("\n");
}

/** Safe R identifier derived from a dataset id ("ds.trust-survey" → "trust_survey"). */
export const rName = (id: string): string => id.replace(/^ds\./, "").replace(/[^A-Za-z0-9_.]/g, "_").replace(/^([^A-Za-z.])/, "d_$1");

/**
 * R code that builds the dataset as a data.frame. Values are serialised as R literals (numbers, or strings
 * escaped through JSON, which is valid R string syntax); factors keep their declared level order.
 */
export function datasetR(ds: Pick<Dataset, "id" | "title" | "provenance" | "columns" | "rows">, name = rName(ds.id)): string {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? String(v) : "NA");
  const str = (v: unknown) => JSON.stringify(String(v));
  const cols = ds.columns.map((c, j) => {
    const vals = ds.rows.map((r) => r[j]);
    if (c.type === "number") return `  ${c.name} = c(${vals.map(num).join(", ")})`;
    if (c.type === "factor" && c.levels) return `  ${c.name} = factor(c(${vals.map(str).join(", ")}), levels = c(${c.levels.map(str).join(", ")}))`;
    return `  ${c.name} = c(${vals.map(str).join(", ")})`;
  });
  const title = ds.title.en.replace(/[\r\n]/g, " ");
  return `# ${title} — ${ds.provenance.kind}, n = ${ds.provenance.n}\n${name} <- data.frame(\n${cols.join(",\n")},\n  stringsAsFactors = FALSE\n)`;
}

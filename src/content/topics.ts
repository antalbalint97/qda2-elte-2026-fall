// The curriculum map (Topics page and the landing page's topic grid): every topic sits in a conceptual domain and
// links to the existing module that teaches it and/or the interactive labs that explore it. Nothing here is a
// promise: every link points at a page that exists.
import type { Bilingual } from "./curriculum/types";
import { encodeJsonHash } from "@/lib/lab-config";
import { MODULES } from "./modules";

export type DomainId = "data" | "relationships" | "inference" | "survey" | "math";

export interface Domain {
  id: DomainId;
  name: Bilingual;
  blurb: Bilingual;
}

export const DOMAINS: Domain[] = [
  { id: "data", name: { en: "Data & measurement", hu: "Adatok és mérés" }, blurb: { en: "What a variable is and how it can be summarised.", hu: "Mi egy változó, és hogyan foglalható össze." } },
  { id: "relationships", name: { en: "Relationships", hu: "Kapcsolatok" }, blurb: { en: "How two or three variables move together.", hu: "Hogyan mozog együtt két vagy három változó." } },
  { id: "inference", name: { en: "Inference", hu: "Következtetés" }, blurb: { en: "From a sample to a claim, with its uncertainty.", hu: "A mintától az állításig, a bizonytalanságával együtt." } },
  { id: "survey", name: { en: "Survey statistics", hu: "Survey-statisztika" }, blurb: { en: "Designs, weights and design-based standard errors.", hu: "Mintavételi tervek, súlyok és tervalapú standard hibák." } },
  { id: "math", name: { en: "Mathematical foundations", hu: "Matematikai alapok" }, blurb: { en: "The tools behind the methods.", hu: "A módszerek mögötti eszközök." } },
];

export interface TopicLink {
  href: string;
  /** "module" = an existing Understand → Try → SPSS → Test module; "lab" = an interactive laboratory. */
  kind: "module" | "lab";
  label: Bilingual;
}

export interface Topic {
  id: string;
  domain: DomainId;
  title: Bilingual;
  blurb: Bilingual;
  links: TopicLink[];
}

const mod = (slug: string): TopicLink => {
  const m = MODULES.find((x) => x.slug === slug);
  if (!m) throw new Error(`unknown module ${slug}`);
  return { href: m.href, kind: "module", label: { en: `Module ${m.number}`, hu: `${m.number}. modul` } };
};
const lab = (id: string, en: string, hu: string, config?: Record<string, unknown>): TopicLink => ({
  href: `/lab/${id}${config ? encodeJsonHash(config) : ""}`,
  kind: "lab",
  label: { en, hu },
});
/** The VRA lab keeps its short legacy hash (#s=1|2|3). */
const vra = (stage: 1 | 2 | 3): TopicLink => ({ href: `/lab/vra-lab#s=${stage}`, kind: "lab", label: { en: `VRA lab · stage ${stage}`, hu: `VRA labor · ${stage}. szakasz` } });

export const TOPICS: Topic[] = [
  // Data & measurement
  { id: "levels", domain: "data", title: { en: "Measurement levels", hu: "Mérési szintek" }, blurb: { en: "Nominal, ordinal, scale, and why level is not the same as role.", hu: "Nominális, ordinális, skála, és miért nem azonos a szint a szereppel." }, links: [mod("measurement")] },
  { id: "index", domain: "data", title: { en: "Index construction", hu: "Indexképzés" }, blurb: { en: "Reverse scoring, Cronbach's alpha, cutting the index.", hu: "Fordított kódolás, Cronbach-alfa, az index kategorizálása." }, links: [mod("indices"), lab("measurement-index-lab", "Measurement & Index Lab", "Mérés és index labor")] },
  { id: "distributions", domain: "data", title: { en: "Distributions", hu: "Eloszlások" }, blurb: { en: "Shape, centre and spread; theoretical families and empirical histograms.", hu: "Alak, közép és szóródás; elméleti eloszlások és empirikus hisztogramok." }, links: [lab("distribution-studio", "Distribution Studio", "Eloszlás-stúdió")] },
  { id: "variance", domain: "data", title: { en: "Descriptive statistics · Variance", hu: "Leíró statisztika · Variancia" }, blurb: { en: "Deviations become squares, squares become variance.", hu: "Az eltérésekből négyzetek, a négyzetekből variancia lesz." }, links: [mod("variance"), vra(1)] },
  // Relationships
  { id: "crosstabs", domain: "relationships", title: { en: "Crosstabs", hu: "Kereszttáblák" }, blurb: { en: "Row vs column percentages, expected counts, χ², Cramér's V.", hu: "Sor- és oszlopszázalék, várt gyakoriság, χ², Cramér-féle V." }, links: [mod("crosstabs"), lab("categorical-lab", "Categorical Data Lab", "Kategoriális adatok labor")] },
  { id: "correlation", domain: "relationships", title: { en: "Correlation", hu: "Korreláció" }, blurb: { en: "Pearson vs Spearman and what r cannot tell you.", hu: "Pearson és Spearman, és amit az r nem árul el." }, links: [mod("correlation"), lab("corr-reg-lab", "Correlation & Regression Lab", "Korreláció és regresszió labor")] },
  { id: "lazarsfeld", domain: "relationships", title: { en: "Lazarsfeld paradigm", hu: "Lazarsfeld-paradigma" }, blurb: { en: "X → Y when you control for Z; Simpson's paradox.", hu: "X → Y, ha Z-t kontrolláljuk; Simpson-paradoxon." }, links: [mod("lazarsfeld"), lab("lazarsfeld-simpson-lab", "Lazarsfeld & Simpson Lab", "Lazarsfeld és Simpson labor")] },
  { id: "regression", domain: "relationships", title: { en: "Regression", hu: "Regresszió" }, blurb: { en: "Predict with a line; minimise the squared residuals; check the model.", hu: "Jóslás egyenessel; a reziduumnégyzetek minimalizálása; a modell ellenőrzése." }, links: [vra(2), lab("model-diagnostics-studio", "Model Diagnostics Studio", "Modelldiagnosztika stúdió")] },
  // Inference
  { id: "sampling", domain: "inference", title: { en: "Sampling & standard error", hu: "Mintavétel és standard hiba" }, blurb: { en: "Draw repeated samples; watch the sampling distribution form.", hu: "Ismételt mintavétel; figyeld, ahogy kialakul a mintavételi eloszlás." }, links: [lab("sampling-universe", "Sampling Universe", "Mintavételi univerzum")] },
  { id: "ci", domain: "inference", title: { en: "Confidence intervals", hu: "Konfidenciaintervallumok" }, blurb: { en: "Coverage as a thing you can count.", hu: "A lefedettség mint megszámolható dolog." }, links: [lab("ci-explorer", "Confidence Interval Explorer", "Konfidenciaintervallum-felfedező")] },
  { id: "p-values", domain: "inference", title: { en: "p-values", hu: "p-értékek" }, blurb: { en: "Null distribution, tail areas, sample size, power.", hu: "Nulleloszlás, szélső területek, mintanagyság, erő." }, links: [mod("p-values"), lab("hypothesis-lab", "Hypothesis Testing Lab", "Hipotézisvizsgálat labor")] },
  { id: "t-tests", domain: "inference", title: { en: "t-tests", hu: "t-próbák" }, blurb: { en: "One-sample, independent, paired: choose and read.", hu: "Egymintás, független, páros: válassz és olvass." }, links: [mod("t-tests"), lab("ttest-lab", "Mean Comparison & t-Test Lab", "Átlag-összehasonlítás és t-próba labor")] },
  { id: "anova", domain: "inference", title: { en: "ANOVA", hu: "ANOVA" }, blurb: { en: "SS total = SS between + SS within; F, η², p.", hu: "SS teljes = SS közötti + SS belső; F, η², p." }, links: [mod("anova"), vra(3), lab("anova-studio", "ANOVA Studio", "ANOVA stúdió")] },
  // Survey statistics
  { id: "designs", domain: "survey", title: { en: "Sampling designs", hu: "Mintavételi tervek" }, blurb: { en: "Strata, clusters and PPS; who could have been selected.", hu: "Rétegek, klaszterek és PPS; kit lehetett kiválasztani." }, links: [lab("survey-design-studio", "Survey Sampling Design Studio", "Mintavételi terv stúdió")] },
  { id: "weights", domain: "survey", title: { en: "Inclusion probabilities & weights", hu: "Kiválasztási valószínűségek és súlyok" }, blurb: { en: "From π to design weights, nonresponse and post-stratification.", hu: "A π-től a tervezési súlyokig, a nemválaszolásig és az utórétegzésig." }, links: [lab("survey-weighting-studio", "Survey Design & Weighting Studio", "Survey-terv és súlyozás stúdió")] },
  { id: "calibration", domain: "survey", title: { en: "Calibration & raking", hu: "Kalibráció és raking" }, blurb: { en: "Match known population margins; watch the weights move.", hu: "Ismert sokasági peremek illesztése; figyeld a súlyok mozgását." }, links: [lab("weighting-calibration-lab", "Weighting & Calibration Lab", "Súlyozás és kalibráció labor")] },
  { id: "complex", domain: "survey", title: { en: "Complex survey inference", hu: "Komplex survey-következtetés" }, blurb: { en: "Taylor linearisation, replicate weights, design effects.", hu: "Taylor-linearizáció, replikációs súlyok, dizájnhatás." }, links: [lab("complex-survey-lab", "Complex Survey Inference Lab", "Komplex survey-következtetés labor")] },
  // Mathematical foundations
  { id: "probability", domain: "math", title: { en: "Probability", hu: "Valószínűség" }, blurb: { en: "Events as areas; conditional probability and Bayes.", hu: "Események mint területek; feltételes valószínűség és Bayes." }, links: [lab("probability-playground", "Probability Playground", "Valószínűségi játszótér")] },
  { id: "expected-value", domain: "math", title: { en: "Expected value", hu: "Várható érték" }, blurb: { en: "The balance point of a distribution and the law of large numbers.", hu: "Az eloszlás egyensúlypontja és a nagy számok törvénye." }, links: [lab("expected-value-lab", "Expected Value Lab", "Várható érték labor")] },
  { id: "functions", domain: "math", title: { en: "Functions & rates of change", hu: "Függvények és változási ütem" }, blurb: { en: "Slope as a thing you drag; area under a curve.", hu: "A meredekség mint húzható dolog; görbe alatti terület." }, links: [lab("math-studio", "Math Studio · functions", "Matematika stúdió · függvények", { topic: "functions" }), lab("math-studio", "Math Studio · derivative", "Matematika stúdió · derivált", { topic: "derivative" })] },
  { id: "optimization", domain: "math", title: { en: "Optimization", hu: "Optimalizálás" }, blurb: { en: "Why the minimum of SSE is where the derivative is zero.", hu: "Miért ott van az SSE minimuma, ahol a derivált nulla." }, links: [lab("math-studio", "Math Studio · SSE bowl", "Matematika stúdió · SSE-tál", { topic: "bowl" })] },
  { id: "pca", domain: "math", title: { en: "Vectors, matrices · PCA", hu: "Vektorok, mátrixok · PCA" }, blurb: { en: "Least squares as a projection; rotate the data to find the most variance.", hu: "A legkisebb négyzetek mint vetítés; forgasd az adatot a legnagyobb varianciáért." }, links: [lab("linalg-pca-studio", "Linear Algebra & PCA Studio", "Lineáris algebra és PCA stúdió")] },
];

export const topicsIn = (d: DomainId) => TOPICS.filter((t) => t.domain === d);

// EN/HU strings transcribed from the V3 prototype (QDA2 CI Explorer.dc.html).
import type { Lang } from "@/content/curriculum/types";

const ci_t_en = {
  "title": "Confidence Interval Explorer",
  "sampling": "Sampling Universe",
  "ttest": "t-Test Lab",
  "atlas": "Atlas",
  "teach": "Teach",
  "share": "Share",
  "copied": "Link copied",
  "intervals": "Repeated intervals",
  "samples": "samples shown",
  "covers": "covers μ",
  "misses": "misses μ",
  "fixed": "(fixed)",
  "coverage": "coverage",
  "nominal": "nominal",
  "pressDraw": "Press Draw to take a sample and compute its interval.",
  "widthCurve": "Expected half-width vs n (this level, this population)",
  "interpretation": "How to read this",
  "caution": "A single interval either contains μ or it does not. '95 %' describes the procedure over repeated samples, under the stated model and design — not the probability that this interval is right.",
  "population": "Population",
  "n": "Sample size",
  "level": "Confidence level",
  "method": "Method",
  "design": "Sampling design",
  "showNaive": "Also show the naive SRS interval (dashed)",
  "clusterNote": "Clusters of 10 from 50 clusters with cluster effects. The design-based interval uses the a cluster means; the naive one pretends the n units were independent.",
  "draw": "Draw samples",
  "longRun": "Long run ×2 000",
  "reset": "Reset",
  "readouts": "Readouts",
  "formula": "Formula",
  "task": "Task",
  "lead": "The population mean μ is fixed. Each sample produces one interval; the interval is the random thing. Draw many and count how often the procedure captured μ.",
  "synthetic": "Synthetic finite population N = 2 000 (seeded; same generator as the Sampling Universe). Coverage shown is a finite-simulation estimate: with 100 intervals the count itself has a standard error of about 2 percentage points at 95 %.",
  "interp": {
    "srs": "Larger n → narrower intervals (half-width shrinks with 1/√n). Higher level → wider intervals. Over many samples about {lvl} of the intervals cover μ when the method's assumptions hold.",
    "cluster": "Design-based intervals stay near nominal coverage because their standard error comes from the variation between cluster means. The naive interval under-covers: it treats correlated units as independent and is too narrow."
  },
  "longRunTxt": "2 000 intervals: design-based coverage {c}{naive}. Nominal {lvl}. Tolerance for 2 000 reps is about ±1 pp.",
  "methods": {
    "t": "t",
    "z": "z",
    "wald": "Wald",
    "wilson": "Wilson"
  },
  "pops": {
    "normal": "Normal",
    "skewed": "Right-skewed",
    "bimodal": "Bimodal",
    "binary": "Binary"
  },
  "designs": {
    "srs": "SRS",
    "cluster": "Cluster"
  },
  "live": "{k} intervals, coverage {c}."
};

export type CiTStrings = typeof ci_t_en;

const ci_t_hu: CiTStrings = {
  "title": "Konfidenciaintervallum-böngésző",
  "sampling": "Mintavételi univerzum",
  "ttest": "t-próba labor",
  "atlas": "Atlasz",
  "teach": "Vetítés",
  "share": "Megosztás",
  "copied": "Link másolva",
  "intervals": "Ismételt intervallumok",
  "samples": "minta látható",
  "covers": "lefedi μ-t",
  "misses": "nem fedi le μ-t",
  "fixed": "(rögzített)",
  "coverage": "lefedés",
  "nominal": "névleges",
  "pressDraw": "Nyomd meg a Húzás gombot egy mintához és intervallumához.",
  "widthCurve": "Várható félszélesség n függvényében",
  "interpretation": "Hogyan olvasd",
  "caution": "Egy adott intervallum vagy tartalmazza μ-t, vagy nem. A „95 %” az eljárást jellemzi ismételt mintákon, a megadott modell és terv mellett — nem annak valószínűsége, hogy ez az intervallum jó.",
  "population": "Populáció",
  "n": "Mintanagyság",
  "level": "Megbízhatósági szint",
  "method": "Módszer",
  "design": "Mintaterv",
  "showNaive": "A naiv EVM-intervallum is (szaggatott)",
  "clusterNote": "10-es klaszterek 50 klaszterből, klaszterhatással. A design-alapú intervallum az a klaszterátlagból számol; a naiv úgy tesz, mintha az n egység független lenne.",
  "draw": "Minták húzása",
  "longRun": "Hosszú táv ×2 000",
  "reset": "Visszaállítás",
  "readouts": "Kiolvasások",
  "formula": "Képlet",
  "task": "Feladat",
  "lead": "A populációátlag μ rögzített. Minden minta egy intervallumot ad; az intervallum a véletlen. Húzz sokat, és számold, milyen gyakran fogta meg az eljárás μ-t.",
  "synthetic": "Szintetikus véges populáció, N = 2 000 (seedelt; ugyanaz a generátor, mint a Mintavételi univerzumban). A mutatott lefedés véges szimulációs becslés: 100 intervallumnál maga a számlálás kb. 2 százalékpont standard hibájú 95 %-nál.",
  "interp": {
    "srs": "Nagyobb n → keskenyebb intervallum (a félszélesség 1/√n-nel csökken). Magasabb szint → szélesebb. Sok mintán kb. a(z) {lvl} fedi le μ-t, ha a módszer feltevései teljesülnek.",
    "cluster": "A design-alapú intervallum a névleges lefedés közelében marad, mert standard hibája a klaszterátlagok ingadozásából jön. A naiv intervallum alul fed: korrelált egységeket kezel függetlenként, és túl keskeny."
  },
  "longRunTxt": "2 000 intervallum: design-alapú lefedés {c}{naive}. Névleges {lvl}. 2 000 ismétlésnél a tűrés kb. ±1 szp.",
  "methods": {
    "t": "t",
    "z": "z",
    "wald": "Wald",
    "wilson": "Wilson"
  },
  "pops": {
    "normal": "Normális",
    "skewed": "Jobbra ferde",
    "bimodal": "Kétmóduszú",
    "binary": "Bináris"
  },
  "designs": {
    "srs": "EVM",
    "cluster": "Csoportos"
  },
  "live": "{k} intervallum, lefedés {c}."
};

export const CI_T: Record<Lang, CiTStrings> = { en: ci_t_en, hu: ci_t_hu };

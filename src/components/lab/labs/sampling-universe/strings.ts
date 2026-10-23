// EN/HU strings transcribed from the V3 prototype (QDA2 Sampling Universe.dc.html).
import type { Lang } from "@/content/curriculum/types";

const su_t_en = {
  "title": "Sampling Universe",
  "subtitle": "population → sample → sampling distribution",
  "vra": "VRA Lab",
  "atlas": "Atlas",
  "share": "Share",
  "copied": "Link copied",
  "population": "Population",
  "sample": "Current sample",
  "sampDist": "Sampling distribution",
  "samples": "samples",
  "popHint": "blue = units in the current sample",
  "sampleSize": "Sample size",
  "statistic": "Statistic",
  "draw": "Draw samples",
  "bootstrap": "Bootstrap ×500",
  "bootstrapHelp": "Resample the current sample with replacement 500 times",
  "reset": "Reset",
  "showTheory": "Show theory: σ/√n and the normal curve",
  "readouts": "Readouts",
  "task": "Task",
  "synthetic": "Synthetic finite population with a known data-generating process (seeded). Values 0–100; the binary population has π = 0.32. Nothing here is an empirical finding.",
  "pops": {
    "normal": "Normal",
    "skewed": "Right-skewed",
    "bimodal": "Bimodal",
    "binary": "Binary (0/1)"
  },
  "stats": {
    "mean": "Mean x̄",
    "median": "Median",
    "var_n": "Variance ÷ n (biased)",
    "var_n1": "Variance ÷ (n − 1)",
    "proportion": "Proportion p̂"
  },
  "help": {
    "mean": "The mean of the sampling distribution sits on μ; its SD is the standard error σ/√n (times the finite-population correction).",
    "median": "The median is also centred near the population median but is more variable than the mean for a normal population.",
    "var_n": "Dividing by n underestimates σ² on average by a factor (n − 1)/n: compare mean(s²) with σ².",
    "var_n1": "Dividing by n − 1 makes the sample variance unbiased for σ²: mean(s²) ≈ σ² over many samples.",
    "proportion": "A proportion is the mean of a 0/1 variable; its SE is √(π(1 − π)/n)."
  },
  "hintEmpty": "press Draw",
  "hintOne": "one sample; draw more to see how statistics vary",
  "hintMany": "the histogram of a statistic over repeated samples",
  "bootNote": "Bootstrap mode: the histogram now shows 500 resamples of the current sample, not new samples from the population. Compare its SD with s/√n.",
  "liveTpl": "{k} samples drawn. Current statistic {v}. Sampling distribution mean {m}, SD {sd}."
};

export type SuTStrings = typeof su_t_en;

const su_t_hu: SuTStrings = {
  "title": "Mintavételi univerzum",
  "subtitle": "populáció → minta → mintavételi eloszlás",
  "vra": "VRA labor",
  "atlas": "Atlasz",
  "share": "Megosztás",
  "copied": "Link másolva",
  "population": "Populáció",
  "sample": "Aktuális minta",
  "sampDist": "Mintavételi eloszlás",
  "samples": "minta",
  "popHint": "kék = az aktuális minta egységei",
  "sampleSize": "Mintanagyság",
  "statistic": "Statisztika",
  "draw": "Minták húzása",
  "bootstrap": "Bootstrap ×500",
  "bootstrapHelp": "Az aktuális minta visszatevéses újramintázása 500-szor",
  "reset": "Visszaállítás",
  "showTheory": "Elmélet: σ/√n és a normális görbe",
  "readouts": "Kiolvasások",
  "task": "Feladat",
  "synthetic": "Szintetikus véges populáció ismert adatgeneráló folyamattal (seedelt). Értékek 0–100; a bináris populációban π = 0,32. Semmi sem empirikus eredmény.",
  "pops": {
    "normal": "Normális",
    "skewed": "Jobbra ferde",
    "bimodal": "Kétmóduszú",
    "binary": "Bináris (0/1)"
  },
  "stats": {
    "mean": "Átlag x̄",
    "median": "Medián",
    "var_n": "Variancia ÷ n (torzított)",
    "var_n1": "Variancia ÷ (n − 1)",
    "proportion": "Arány p̂"
  },
  "help": {
    "mean": "A mintavételi eloszlás közepe μ-n ül; szórása a standard hiba σ/√n (szorozva a véges populációs korrekcióval).",
    "median": "A medián is a populációs medián körül ingadozik, de normális populációnál változékonyabb az átlagnál.",
    "var_n": "n-nel osztva átlagosan (n − 1)/n-szeresen alulbecsüljük σ²-et: hasonlítsd össze mean(s²)-et σ²-tel.",
    "var_n1": "n − 1-gyel osztva a mintavariancia torzítatlan σ²-re: sok minta átlagában mean(s²) ≈ σ².",
    "proportion": "Az arány egy 0/1 változó átlaga; standard hibája √(π(1 − π)/n)."
  },
  "hintEmpty": "nyomd meg a Húzás gombot",
  "hintOne": "egy minta; húzz többet, hogy lásd az ingadozást",
  "hintMany": "a statisztika hisztogramja ismételt mintákból",
  "bootNote": "Bootstrap mód: a hisztogram most az aktuális minta 500 újramintázását mutatja, nem új populációs mintákat. Vesd össze a szórását s/√n-nel.",
  "liveTpl": "{k} minta. Aktuális statisztika {v}. Mintavételi eloszlás átlaga {m}, szórása {sd}."
};

export const SU_T: Record<Lang, SuTStrings> = { en: su_t_en, hu: su_t_hu };

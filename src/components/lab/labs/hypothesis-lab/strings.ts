// EN/HU strings transcribed from the V3 prototype (QDA2 Hypothesis Lab.dc.html).
import type { Lang } from "@/content/curriculum/types";

const hy_t_en = {
  "title": "Hypothesis Testing Lab",
  "view": "View",
  "curves": "H₀ and H₁",
  "sim": "Simulated null studies",
  "power": "Power vs n",
  "multi": "Many tests",
  "crit": "critical value",
  "tobs": "observed t",
  "sided": "sided",
  "reseed": "New seed",
  "effect": "True effect δ (SD units)",
  "n": "Sample size n",
  "m": "Number of null tests m",
  "lead": {
    "curves": "The black curve is the sampling distribution of t if H₀ is true. Drag the critical value: the red tail is α. The violet curve is where t would live if the true effect were δ; the dashed region is β, and power = 1 − β. Drag the observed t to read p as a tail area.",
    "sim": "Each bar counts simulated studies in which H₀ is exactly true (δ = 0). The share of simulated t beyond the observed one estimates p directly — no formula needed.",
    "power": "Power for three effect sizes as n grows. The dashed line is the conventional .80 target. Your current (δ, n) is the red dot.",
    "multi": "m independent studies where H₀ is true. Each one with p < α is a false positive. Expected count = mα; the chance of at least one is 1 − (1 − α)^m."
  },
  "note": "H₁ is drawn as a t curve shifted by δ√n (a visual approximation); α, β and power in the readouts are computed from the noncentral t distribution (Lenth AS 243, checked against SciPy nct). The null simulation uses seeded normal samples with n − 1 df.",
  "insight": {
    "curves": "Moving the critical value left raises power and α together — you cannot buy one without paying the other at fixed n.",
    "sim": "A p-value is nothing but this: the share of null worlds that produce a statistic at least as extreme as yours.",
    "power": "Power rises with n at a decreasing rate; doubling n does not double power. Small effects need very large samples.",
    "multi": "With m = 20 and α = .05 about one false positive is expected even when nothing is going on."
  },
  "live": "p = {p}, power = {pw}, critical t = {crit}",
  "formula": {
    "curves": "α = P(|T| > t_crit | H₀)   β = P(|T′| ≤ t_crit | δ)   power = 1 − β,  T′ ~ t(n−1, ncp = δ√n)",
    "sim": "p̂ = #{ |t_sim| ≥ |t_obs| } / 500",
    "power": "power(δ, n) = P(T′ > t_crit) + P(T′ < −t_crit),  T′ ~ t(n−1, δ√n)",
    "multi": "FWER = 1 − (1 − α)^m   E[false positives] = mα"
  },
  "presets": [
    "δ = 0, n = 20 (true null)",
    "δ = .5: n = 20 → 80",
    "One-sided at same t",
    "m = 20 null tests"
  ]
};

export type HyTStrings = typeof hy_t_en;

const hy_t_hu: HyTStrings = {
  "title": "Hipotézisvizsgálat labor",
  "view": "Nézet",
  "curves": "H₀ és H₁",
  "sim": "Szimulált null-vizsgálatok",
  "power": "Erő és n",
  "multi": "Sok próba",
  "crit": "kritikus érték",
  "tobs": "megfigyelt t",
  "sided": "oldalú",
  "reseed": "Új seed",
  "effect": "Valódi hatás δ (szórásegység)",
  "n": "Mintanagyság n",
  "m": "Null-próbák száma m",
  "lead": {
    "curves": "A fekete görbe t mintavételi eloszlása, ha H₀ igaz. Húzd a kritikus értéket: a piros farok α. A lila görbe mutatja, hol lenne t, ha a valódi hatás δ; a szaggatott terület β, az erő = 1 − β. Húzd a megfigyelt t-t, és olvasd le p-t farokterületként.",
    "sim": "Minden oszlop olyan szimulált vizsgálatokat számol, ahol H₀ pontosan igaz (δ = 0). A megfigyeltnél szélsőségesebb szimulált t-k aránya közvetlenül becsli p-t.",
    "power": "Az erő három hatásnagyságra n függvényében. A szaggatott vonal a szokásos .80 cél. A piros pont a mostani (δ, n).",
    "multi": "m független vizsgálat, ahol H₀ igaz. Minden p < α hamis pozitív. Várható szám = mα; legalább egy esélye 1 − (1 − α)^m."
  },
  "note": "H₁-et δ√n-nel eltolt t-görbeként rajzoljuk (vizuális közelítés); α, β és az erő a kiolvasásokban a nem-centrális t-eloszlásból számolódik (Lenth AS 243, SciPy nct-vel ellenőrizve). A null-szimuláció seedelt normális mintákat használ n − 1 szabadságfokkal.",
  "insight": {
    "curves": "A kritikus érték balra tolása együtt növeli az erőt és α-t — rögzített n mellett nem kapod meg az egyiket a másik ára nélkül.",
    "sim": "A p-érték nem más, mint ez: a null-világok aránya, amelyek legalább ilyen szélsőséges statisztikát adnak.",
    "power": "Az erő csökkenő ütemben nő n-nel; n duplázása nem duplázza az erőt. Kis hatáshoz nagyon nagy minta kell.",
    "multi": "m = 20 és α = .05 mellett kb. egy hamis pozitív várható akkor is, ha semmi sem történik."
  },
  "live": "p = {p}, erő = {pw}, kritikus t = {crit}",
  "formula": {
    "curves": "α = P(|T| > t_crit | H₀)   β = P(|T′| ≤ t_crit | δ)   power = 1 − β,  T′ ~ t(n−1, ncp = δ√n)",
    "sim": "p̂ = #{ |t_sim| ≥ |t_obs| } / 500",
    "power": "power(δ, n) = P(T′ > t_crit) + P(T′ < −t_crit),  T′ ~ t(n−1, δ√n)",
    "multi": "FWER = 1 − (1 − α)^m   E[false positives] = mα"
  },
  "presets": [
    "δ = 0, n = 20 (igaz null)",
    "δ = .5: n = 20 → 80",
    "Egyoldalú ugyanannál a t-nél",
    "m = 20 null-próba"
  ]
};

export const HY_T: Record<Lang, HyTStrings> = { en: hy_t_en, hu: hy_t_hu };

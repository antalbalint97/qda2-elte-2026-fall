// EN/HU strings transcribed from the V3 prototype (QDA2 Distribution Studio.dc.html).
import type { Lang } from "@/content/curriculum/types";

const ds_t_en = {
  "title": "Distribution Studio",
  "mode": "Mode",
  "theory": "Theoretical",
  "data": "Data",
  "pdf": "Density",
  "cdf": "Cumulative distribution F(x) = P(X ≤ x)",
  "hist": "Histogram",
  "family": "Family",
  "params": "Parameters",
  "transform": "Transformation",
  "bins": "Bins",
  "variable": "Variable",
  "lead": {
    "theory": "Pick a family, move its parameters and drag the two handles: the shaded area is P(a < X ≤ b), read off the density on top and as a vertical jump in the cumulative curve below.",
    "data": "A real-shaped synthetic variable. Compare mean (red) and median (violet), read the five-number summary in the boxplot, then transform the variable and watch skewness change."
  },
  "note": {
    "theory": "Densities and cumulative probabilities come from the shared engine (normal: erfc; t, F: regularised incomplete beta; χ²: incomplete gamma; binomial/Poisson: exact pmf). Discrete families shade P(a < X ≤ b) over integer outcomes.",
    "data": "Synthetic household income (log-normal shape, seeded, not HCSO data). Quantiles use R type 7; skewness g₁ = m₃/m₂^1.5 with the adjusted G₁ (SPSS) in the card; outliers = beyond 1.5·IQR."
  },
  "formula": {
    "theory": "P(a < X ≤ b) = F(b) − F(a) = ∫ₐᵇ f(x) dx",
    "data": "x̄ = Σxᵢ/n   s = √(Σ(xᵢ − x̄)²/(n−1))   g₁ = m₃ / m₂^{3/2}   z = (x − x̄)/s"
  },
  "insight": {
    "theory": "The density height is not a probability; only areas are. For discrete families the bar heights are probabilities and sum to 1.",
    "data": "A log transform pulls in the right tail: mean and median approach each other and g₁ drops toward 0. Ranks destroy distance but keep order."
  },
  "intervals": [
    "μ ± 1σ",
    "μ ± 1.96σ",
    "upper 5 %"
  ],
  "none": "none",
  "log": "log",
  "z": "z-score",
  "rank": "rank",
  "live": "P(a<X≤b) = {p}"
};

export type DsTStrings = typeof ds_t_en;

const ds_t_hu: DsTStrings = {
  "title": "Eloszlás-stúdió",
  "mode": "Mód",
  "theory": "Elméleti",
  "data": "Adat",
  "pdf": "Sűrűség",
  "cdf": "Eloszlásfüggvény F(x) = P(X ≤ x)",
  "hist": "Hisztogram",
  "family": "Eloszláscsalád",
  "params": "Paraméterek",
  "transform": "Transzformáció",
  "bins": "Osztályok",
  "variable": "Változó",
  "lead": {
    "theory": "Válassz családot, mozgasd a paramétereit és húzd a két fogantyút: az árnyékolt terület P(a < X ≤ b), fent a sűrűségen, lent az eloszlásfüggvény függőleges ugrásaként olvasható.",
    "data": "Valósághű alakú szintetikus változó. Hasonlítsd össze az átlagot (piros) és a mediánt (lila), olvasd le az öt-számos összefoglalót a dobozábrán, majd transzformáld a változót és figyeld a ferdeséget."
  },
  "note": {
    "theory": "A sűrűségek és kumulált valószínűségek a közös motorból jönnek (normális: erfc; t, F: regularizált inkomplett béta; χ²: inkomplett gamma; binomiális/Poisson: pontos pmf). Diszkrét családoknál P(a < X ≤ b) egész kimenetelekre árnyékolt.",
    "data": "Szintetikus háztartási jövedelem (lognormális alak, seedelt, nem KSH-adat). Kvantilisek: R 7-es típus; ferdeség g₁ = m₃/m₂^1.5, a kártyán a korrigált G₁ (SPSS); kiugró = 1,5·IQR-en túl."
  },
  "formula": {
    "theory": "P(a < X ≤ b) = F(b) − F(a) = ∫ₐᵇ f(x) dx",
    "data": "x̄ = Σxᵢ/n   s = √(Σ(xᵢ − x̄)²/(n−1))   g₁ = m₃ / m₂^{3/2}   z = (x − x̄)/s"
  },
  "insight": {
    "theory": "A sűrűség magassága nem valószínűség; csak a terület az. Diszkrét családoknál az oszlopmagasságok valószínűségek, összegük 1.",
    "data": "A log-transzformáció behúzza a jobb farkat: átlag és medián közelednek, g₁ 0 felé esik. A rangok megszüntetik a távolságot, de megtartják a sorrendet."
  },
  "intervals": [
    "μ ± 1σ",
    "μ ± 1,96σ",
    "felső 5 %"
  ],
  "none": "nincs",
  "log": "log",
  "z": "z-pont",
  "rank": "rang",
  "live": "P(a<X≤b) = {p}"
};

export const DS_T: Record<Lang, DsTStrings> = { en: ds_t_en, hu: ds_t_hu };

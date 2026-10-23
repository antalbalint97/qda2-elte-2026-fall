// EN/HU strings transcribed from the V3 prototype (QDA2 tTest Lab.dc.html).
import type { Lang } from "@/content/curriculum/types";

const tt_t_en = {
  "title": "Mean Comparison & t-Test Lab",
  "design": "Design",
  "one": "One-sample",
  "paired": "Paired",
  "independent": "Independent",
  "vra": "VRA Lab",
  "ci": "CI Explorer",
  "atlas": "Atlas",
  "teach": "Teach",
  "share": "Share",
  "copied": "Link copied",
  "canvas": "Observations",
  "groupA": "Group 1",
  "groupB": "Group 2",
  "meanLbl": "mean",
  "ciLbl": "95 % CI of the mean",
  "dragHint": "drag a point, the x̄ handle or the s handle · arrow keys when focused",
  "tFraction": "t = estimated difference ÷ its standard error",
  "nullDist": "Null distribution",
  "twoTailed": "two-tailed, shaded = p",
  "groups": "Groups",
  "removeObs": "Remove observation",
  "addObs": "Add observation",
  "mu0": "Hypothesised μ₀",
  "scNoDiff": "No difference",
  "scUnequal": "Unequal spread",
  "reset": "Reset",
  "procedure": "Procedure",
  "readouts": "Readouts",
  "formula": "Formula",
  "task": "Task",
  "lead": {
    "independent": "Two groups, one question: is the difference between the means large relative to how much such differences vary from sample to sample? Drag a mean handle (numerator) or a spread handle (denominator) and watch t move.",
    "paired": "Each line links two measurements of the same person. The test is a one-sample t-test on the differences, so between-person variability drops out of the error.",
    "one": "Compare one sample mean with a fixed value μ₀. Drag μ₀: the difference changes, the standard error does not."
  },
  "synthetic": "Synthetic scores (0–100, seeded). All statistics match the SPSS t-test rows (Student = equal variances assumed, Welch = not assumed) and SciPy; nothing here is an empirical finding.",
  "insight": {
    "independent": "The same mean difference can be significant or not: halve the spread or quadruple n and the denominator shrinks while the numerator stays put.",
    "paired": "Pairing removes the shared between-person component from the error. With strongly correlated pairs SE is much smaller than in the independent design on the same numbers.",
    "one": "t grows with |x̄ − μ₀| and with √n, and shrinks with s. The p-value is a tail area of t(n − 1), not the probability that H₀ is true."
  },
  "levene": "Levene F = {F}, p {p}. Diagnostic only: it does not decide the row. Welch is a sound default; at small n Levene misses real differences, at large n it flags trivial ones.",
  "seNotePaired": "SE = s_d/√n, from the differences",
  "seNoteOne": "SE = s/√n",
  "live": "t = {t}, df = {df}, p {p}, difference {d}"
};

export type TtTStrings = typeof tt_t_en;

const tt_t_hu: TtTStrings = {
  "title": "Átlag-összehasonlítás és t-próba labor",
  "design": "Elrendezés",
  "one": "Egymintás",
  "paired": "Páros",
  "independent": "Független",
  "vra": "VRA labor",
  "ci": "CI-böngésző",
  "atlas": "Atlasz",
  "teach": "Vetítés",
  "share": "Megosztás",
  "copied": "Link másolva",
  "canvas": "Megfigyelések",
  "groupA": "1. csoport",
  "groupB": "2. csoport",
  "meanLbl": "átlag",
  "ciLbl": "az átlag 95 % CI-je",
  "dragHint": "húzd a pontot, az x̄ vagy az s fogantyút · nyilak fókuszban",
  "tFraction": "t = becsült különbség ÷ standard hibája",
  "nullDist": "Nulleloszlás",
  "twoTailed": "kétoldali, árnyékolt = p",
  "groups": "Csoportok",
  "removeObs": "Megfigyelés törlése",
  "addObs": "Megfigyelés hozzáadása",
  "mu0": "Feltételezett μ₀",
  "scNoDiff": "Nincs különbség",
  "scUnequal": "Eltérő szórás",
  "reset": "Visszaállítás",
  "procedure": "Eljárás",
  "readouts": "Kiolvasások",
  "formula": "Képlet",
  "task": "Feladat",
  "lead": {
    "independent": "Két csoport, egy kérdés: nagy-e az átlagok különbsége ahhoz képest, amennyire az ilyen különbségek mintáról mintára ingadoznak? Húzd az átlag (számláló) vagy a szórás (nevező) fogantyúját, és nézd, hogyan mozdul t.",
    "paired": "Minden vonal ugyanannak a személynek két mérését köti össze. A próba a különbségek egymintás t-próbája, így a személyek közötti variabilitás kiesik a hibából.",
    "one": "Egy minta átlagát hasonlítjuk egy rögzített μ₀-hoz. Húzd μ₀-t: a különbség változik, a standard hiba nem."
  },
  "synthetic": "Szintetikus pontszámok (0–100, seedelt). Minden statisztika az SPSS t-próba sorainak felel meg (Student = egyenlő varianciák, Welch = nem egyenlő) és a SciPy-nak; semmi sem empirikus eredmény.",
  "insight": {
    "independent": "Ugyanaz az átlagkülönbség lehet szignifikáns vagy nem: felezd a szórást vagy négyszerezd n-t, és a nevező zsugorodik, míg a számláló marad.",
    "paired": "A párosítás kiveszi a hibából a közös, személyek közötti komponenst. Erősen korreláló pároknál az SE sokkal kisebb, mint a független elrendezésben ugyanezekkel a számokkal.",
    "one": "t nő |x̄ − μ₀|-lal és √n-nel, csökken s-sel. A p-érték a t(n − 1) farokterülete, nem H₀ valószínűsége."
  },
  "levene": "Levene F = {F}, p {p}. Csak diagnosztika: nem dönti el a sort. A Welch biztonságos alapértelmezés; kis n-nél a Levene nem veszi észre a valódi eltérést, nagy n-nél jelentéktelent is jelez.",
  "seNotePaired": "SE = s_d/√n, a különbségekből",
  "seNoteOne": "SE = s/√n",
  "live": "t = {t}, df = {df}, p {p}, különbség {d}"
};

export const TT_T: Record<Lang, TtTStrings> = { en: tt_t_en, hu: tt_t_hu };

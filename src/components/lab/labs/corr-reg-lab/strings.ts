// EN/HU strings transcribed from the V3 prototype (QDA2 CorrReg Lab.dc.html).
import type { Lang } from "@/content/curriculum/types";

type View = "simple" | "multi" | "logit";
const cr_t_en = {
  title: "Correlation & Regression Lab",
  view: "View",
  simple: "Bivariate",
  multi: "Two predictors",
  logit: "Binary outcome",
  probAxis: "right axis: P̂(y = 1)",
  scatter: "Scatter",
  rects: "Covariance rectangles",
  squares: "Residual squares",
  point: "point",
  coefTable: "Coefficient table",
  pointTable: "Points (x, y, residual)",
  addPoint: "Add point",
  removePoint: "Remove last point",
  regenerate: "Regenerate",
  presetsLabel: "Data presets",
  group: "group",
  moveHint: "Arrow keys move the point (Shift = ×5)",
  lead: {
    simple: "Drag points. Every (x − x̄)(y − ȳ) rectangle is one term of the covariance; blue rectangles push r up, red ones pull it down. The line minimises the sum of the orange squares.",
    multi: "Colour is a second, binary predictor (two groups). Two parallel lines: the group coefficient is the vertical gap, the x coefficient is the shared slope. Compare adjusted R² with the bivariate model.",
    logit: "The outcome is now binary: y above the median = 1. The violet curve is the fitted logistic probability; the odds ratio per unit of x is e^b. Drag points across the median to flip outcomes.",
  } as Record<View, string>,
  note: "Pearson r and its t-test, Spearman ρ on average ranks, OLS by normal equations with classical SEs (statsmodels-equivalent), logistic by IRLS. Synthetic data, seeded; the 'outlier' preset plants one high-leverage point by hand.",
  formula: {
    simple: ["r = Σ(xᵢ−x̄)(yᵢ−ȳ) / √(Σ(xᵢ−x̄)² Σ(yᵢ−ȳ)²)", "b = r · s_y/s_x", "a = ȳ − b x̄", "t = r√(n−2)/√(1−r²)"],
    multi: ["ŷ = b₀ + b₁x + b₂·group", "adj R² = 1 − (1−R²)(n−1)/(n−k−1)"],
    logit: ["logit P(y=1) = b₀ + b₁x", "OR = e^b₁", "P̂ = 1/(1+e^−(b₀+b₁x))"],
  } as Record<View, string[]>,
  insight: {
    simple: "One far point in the corner can dominate both r and b: leverage grows with (x − x̄)². Spearman only sees ranks, so it barely moves.",
    multi: "Adding a predictor never lowers R²; adjusted R² can fall. The group gap is 'controlling for x'.",
    logit: "A unit step in x multiplies the odds by e^b₁; the probability change depends on where you are on the curve.",
  } as Record<View, string>,
  presets: { linear: "Linear", weak: "Weak", outlier: "Outlier", curve: "Curve (r misses it)", groups: "Two groups" },
  live: "r = {r}, b = {b}, R² = {r2}",
  groupNote: "The group coefficient {b} is the vertical distance between the two lines at the same x.",
  notConverged: "Logistic fit not available: {why}. Drag points across the median line (or try the Weak preset) so that the two outcome groups overlap in x.",
  singular: "OLS not available: {why}",
  readouts: "Readouts",
};
type CrStrings = typeof cr_t_en;

const cr_t_hu: CrStrings = {
  title: "Korreláció és regresszió labor",
  view: "Nézet",
  simple: "Kétváltozós",
  multi: "Két prediktor",
  logit: "Bináris kimenet",
  probAxis: "jobb tengely: P̂(y = 1)",
  scatter: "Pontdiagram",
  rects: "Kovariancia-téglalapok",
  squares: "Reziduum-négyzetek",
  point: "pont",
  coefTable: "Együttható-tábla",
  pointTable: "Pontok (x, y, reziduum)",
  addPoint: "Pont hozzáadása",
  removePoint: "Utolsó pont törlése",
  regenerate: "Újragenerálás",
  presetsLabel: "Adat-előbeállítások",
  group: "csoport",
  moveHint: "A nyilak mozgatják a pontot (Shift = ×5)",
  lead: {
    simple: "Húzd a pontokat. Minden (x − x̄)(y − ȳ) téglalap a kovariancia egy tagja; a kékek emelik r-t, a pirosak csökkentik. Az egyenes a narancs négyzetek összegét minimalizálja.",
    multi: "A szín egy második, bináris prediktor (két csoport). Két párhuzamos egyenes: a csoport-együttható a függőleges rés, az x-együttható a közös meredekség. Hasonlítsd a korrigált R²-t a kétváltozós modellhez.",
    logit: "A kimenet most bináris: a medián feletti y = 1. A lila görbe az illesztett logisztikus valószínűség; az esélyhányados x egységére e^b. Húzz pontokat a medián túloldalára.",
  },
  note: "Pearson r és t-próbája, Spearman ρ átlagos rangokon, OLS normálegyenletekkel és klasszikus SE-kkel (statsmodels-ekvivalens), logisztikus IRLS-sel. Szintetikus, seedelt adat; az 'outlier' előbeállítás egy nagy leverage-ű pontot ültet kézzel.",
  formula: cr_t_en.formula,
  insight: {
    simple: "Egy távoli sarokpont uralhatja r-t és b-t is: a leverage (x − x̄)²-tel nő. A Spearman csak rangokat lát, alig mozdul.",
    multi: "Új prediktor sosem csökkenti R²-t; a korrigált R² csökkenhet. A csoport-rés az 'x-re kontrollált' különbség.",
    logit: "Egy egységnyi x-lépés e^b₁-szeresére szorozza az esélyt; a valószínűség változása attól függ, hol állsz a görbén.",
  },
  presets: { linear: "Lineáris", weak: "Gyenge", outlier: "Kiugró", curve: "Görbe (r nem látja)", groups: "Két csoport" },
  live: "r = {r}, b = {b}, R² = {r2}",
  groupNote: "A {b} csoport-együttható a két egyenes függőleges távolsága azonos x mellett.",
  notConverged: "A logisztikus illesztés nem elérhető: {why}. Húzz pontokat a mediánvonal túloldalára (vagy próbáld a Gyenge beállítást), hogy a két kimeneti csoport x szerint átfedjen.",
  singular: "Az OLS nem elérhető: {why}",
  readouts: "Kiolvasások",
};

export const CR_T: Record<Lang, CrStrings> = { en: cr_t_en, hu: cr_t_hu };

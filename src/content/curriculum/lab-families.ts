// The five lab families of the V3 portfolio (QDA2 Labs.dc.html). Every lab belongs to exactly one family.
import type { Bilingual } from "./types";

export interface LabFamily {
  id: "A" | "B" | "C" | "D" | "E";
  title: Bilingual;
  shared: Bilingual;
  labs: string[];
}

export const LAB_FAMILIES: LabFamily[] = [
  {
    id: "A",
    title: { en: "Probability & distributions", hu: "Valószínűség és eloszlások" },
    shared: {
      en: "Events as regions, probability mass, expectation, empirical vs theoretical distribution.",
      hu: "Események mint tartományok, valószínűségi tömeg, várható érték, empirikus és elméleti eloszlás.",
    },
    labs: ["probability-playground", "expected-value-lab", "distribution-studio", "sampling-universe"],
  },
  {
    id: "B",
    title: { en: "Inference & group comparisons", hu: "Következtetés és csoport-összehasonlítás" },
    shared: {
      en: "Sampling distributions, null models, test statistics, intervals, squared deviations.",
      hu: "Mintavételi eloszlások, nullmodellek, próbastatisztikák, intervallumok, négyzetes eltérések.",
    },
    labs: ["hypothesis-lab", "ttest-lab", "ci-explorer", "anova-studio", "vra-lab"],
  },
  {
    id: "C",
    title: { en: "Categorical & relational", hu: "Kategoriális és relációs" },
    shared: {
      en: "Conditional distributions, stratification, covariance, model fit: association, not causation.",
      hu: "Feltételes eloszlások, rétegzés, kovariancia, modellilleszkedés: együttjárás, nem okság.",
    },
    labs: ["categorical-lab", "lazarsfeld-simpson-lab", "corr-reg-lab"],
  },
  {
    id: "D",
    title: { en: "Survey statistics", hu: "Survey-statisztika" },
    shared: {
      en: "One population and sample-design engine shared by every survey instrument.",
      hu: "Egyetlen sokaság- és mintavételi motor, amelyet minden survey-eszköz használ.",
    },
    labs: ["survey-weighting-studio", "survey-design-studio", "weighting-calibration-lab", "complex-survey-lab"],
  },
  {
    id: "E",
    title: { en: "Measurement & multivariate modelling", hu: "Mérés és többváltozós modellezés" },
    shared: {
      en: "Variance, projection, optimisation, reliability vs validity, PCA vs factor analysis.",
      hu: "Variancia, vetítés, optimalizálás, megbízhatóság és érvényesség, főkomponens- és faktorelemzés.",
    },
    labs: ["measurement-index-lab", "linalg-pca-studio", "math-studio", "model-diagnostics-studio"],
  },
];

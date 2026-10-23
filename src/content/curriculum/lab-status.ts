// Maturity of each laboratory, recorded as separate dimensions. None of them implies another, and only
// a lab with every dimension checked may be called pilot-ready (brief §13: "Do not mark untested
// laboratories as pilot-ready"). Update a flag only together with the evidence it names.
import { isImplemented } from "./implemented-labs";
import { LABS } from "./labs";

export interface LabMaturity {
  /** A real React implementation is routed at /lab/[id] with working controls. */
  integrated: boolean;
  /** Its engine functions are covered by tests/unit against an external reference (SciPy/statsmodels/R). */
  numericallyValidated: boolean;
  /** An axe scan (WCAG 2.2 AA tags) and a keyboard pass run in tests/e2e. */
  accessibilityChecked: boolean;
  /** A teacher has reviewed the teaching content. Never set by code changes alone. */
  teachingReviewed: boolean;
  /** Used in a real class session. Never set by code changes alone. */
  pilotReady: boolean;
  /** Listed on the public /labs page. */
  public: boolean;
}

const NONE: LabMaturity = { integrated: false, numericallyValidated: false, accessibilityChecked: false, teachingReviewed: false, pilotReady: false, public: false };

/**
 * Evidence-backed flags per lab. `integrated` is derived from IMPLEMENTED_LABS; the others are set only
 * when the named test exists and passes:
 *   numericallyValidated → tests/unit (engine.test.ts / survey.test.ts) covers every statistic the lab shows
 *   accessibilityChecked → tests/e2e/labs.spec.ts runs axe (WCAG 2.2 AA tags) and a keyboard pass on the lab
 */
const STATUS: Record<string, Partial<LabMaturity>> = {
  // describe/fit/anova on the VRA scenarios: engine.test.ts "VRA base scenario", reference.json (SciPy)
  // accessibilityChecked: labs.spec.ts axe light/dark/Teach + a keyboard test for each flagged lab.
  "vra-lab": { numericallyValidated: true, accessibilityChecked: true },
  "sampling-universe": { accessibilityChecked: true },
  // independentT/pairedT/oneSampleT/Levene/g: engine.test.ts "t-test lab numbers vs the SciPy fixture"
  "ttest-lab": { numericallyValidated: true, accessibilityChecked: true },
  // Wilson/Wald vs statsmodels proportion_confint and coverage simulations: coverage.test.ts
  "ci-explorer": { numericallyValidated: true, accessibilityChecked: true },
  // Not numericallyValidated: the SE after post-stratification/raking is not checked (survey-studio.test.ts
  // covers the rest against R survey).
  "survey-weighting-studio": { accessibilityChecked: true },
  // nct CDF, power and t tails: engine.test.ts "distributions vs SciPy"
  "hypothesis-lab": { numericallyValidated: true, accessibilityChecked: true },
  // quantile functions, binomial/Poisson, type-7 quantiles and skewness: engine.test.ts (SciPy)
  "distribution-studio": { numericallyValidated: true, accessibilityChecked: true },
  // χ², V, Yates, Fisher, OR: engine.test.ts "categorical and correlation vs SciPy"; edits: categorical-lab.test.ts
  "categorical-lab": { numericallyValidated: true, accessibilityChecked: true },
  // Pearson, Spearman, OLS, logit: engine.test.ts (SciPy / statsmodels)
  "corr-reg-lab": { numericallyValidated: true, accessibilityChecked: true },
  // one-way/Welch/two-way ANOVA (statsmodels), Tukey (SciPy), Games–Howell: engine.test.ts; repeated measures with
  // Greenhouse–Geisser: rm-anova.test.ts (R aov Error strata + anova.mlm)
  "anova-studio": { numericallyValidated: true, accessibilityChecked: true },
  // svymean / svyby SEs and PPS π vs R survey + sampling on the studio's own samples: survey-design-studio.test.ts
  "survey-design-studio": { numericallyValidated: true, accessibilityChecked: true },
  // weights, means and calibration SEs vs R postStratify / calibrate (linear, raking, bounded): calibration.test.ts
  "weighting-calibration-lab": { numericallyValidated: true, accessibilityChecked: true },
  // svymean (± fpc), deff, JK1/JKn/BRR, domains, svychisq, svyglm vs R survey on five samples; coverage simulation: complex-survey.test.ts
  "complex-survey-lab": { numericallyValidated: true, accessibilityChecked: true },
  "measurement-index-lab": { numericallyValidated: true, accessibilityChecked: true },
  "linalg-pca-studio": { numericallyValidated: true, accessibilityChecked: true },
  "math-studio": { numericallyValidated: true, accessibilityChecked: true },
  "model-diagnostics-studio": { numericallyValidated: true, accessibilityChecked: true },
  // probability-playground, expected-value-lab and lazarsfeld-simpson-lab are checked against closed forms
  // and a published table (tests/unit), not against an external software reference: accessibility only.
  "probability-playground": { accessibilityChecked: true },
  "expected-value-lab": { accessibilityChecked: true },
  "lazarsfeld-simpson-lab": { accessibilityChecked: true },
};

export function labMaturity(id: string): LabMaturity {
  return { ...NONE, ...(STATUS[id] ?? {}), integrated: isImplemented(id) };
}

export const LAB_STATUS: Record<string, LabMaturity> = Object.fromEntries(LABS.map((l) => [l.id, labMaturity(l.id)]));

/** Short honest label for the UI. */
export function maturityLabel(m: LabMaturity): "pilot-ready" | "reviewed" | "validated" | "integrated" | "prototype" {
  if (m.pilotReady && m.teachingReviewed && m.numericallyValidated && m.accessibilityChecked && m.integrated) return "pilot-ready";
  if (m.teachingReviewed && m.integrated) return "reviewed";
  if (m.numericallyValidated && m.integrated) return "validated";
  if (m.integrated) return "integrated";
  return "prototype";
}

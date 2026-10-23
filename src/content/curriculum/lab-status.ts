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
  // accessibilityChecked for the five M2 labs: labs.spec.ts axe light/dark/Teach + keyboard tests.
  "vra-lab": { numericallyValidated: true, accessibilityChecked: true },
  "sampling-universe": { accessibilityChecked: true },
  // independentT/pairedT/oneSampleT/Levene/g: engine.test.ts "t-test lab numbers vs the SciPy fixture"
  "ttest-lab": { numericallyValidated: true, accessibilityChecked: true },
  // Wilson/Wald vs statsmodels proportion_confint and coverage simulations: coverage.test.ts
  "ci-explorer": { numericallyValidated: true, accessibilityChecked: true },
  // Not numericallyValidated: the SE after post-stratification/raking is not checked (survey-studio.test.ts
  // covers the rest against R survey).
  "survey-weighting-studio": { accessibilityChecked: true },
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

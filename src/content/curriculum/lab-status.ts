// Maturity of each laboratory, recorded as separate dimensions. None of them implies another, and only
// a lab with every dimension checked may be called pilot-ready (brief §13: "Do not mark untested
// laboratories as pilot-ready"). Update a flag only together with the evidence it names.
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

const STATUS: Record<string, Partial<LabMaturity>> = {};

export function labMaturity(id: string): LabMaturity {
  return { ...NONE, ...(STATUS[id] ?? {}) };
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

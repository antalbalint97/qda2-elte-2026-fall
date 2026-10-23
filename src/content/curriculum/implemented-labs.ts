// Labs that have a production React implementation routed at /lab/[id]. Kept free of React imports so
// server pages, lab-status.ts and the unit tests can read it. The component map is
// src/components/lab/registry.tsx; tests/unit/labs.test.ts checks that both lists agree.
export const IMPLEMENTED_LABS = ["vra-lab", "sampling-universe", "ttest-lab", "ci-explorer", "survey-weighting-studio", "hypothesis-lab", "distribution-studio", "probability-playground", "expected-value-lab", "categorical-lab", "corr-reg-lab", "lazarsfeld-simpson-lab", "anova-studio", "survey-design-studio", "weighting-calibration-lab", "complex-survey-lab"] as const;

export type ImplementedLabId = (typeof IMPLEMENTED_LABS)[number];

export const isImplemented = (id: string): id is ImplementedLabId => (IMPLEMENTED_LABS as readonly string[]).includes(id);

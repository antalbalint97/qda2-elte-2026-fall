// Labs that have a production React implementation routed at /lab/[id]. Kept free of React imports so
// server pages, lab-status.ts and the unit tests can read it. The component map is
// src/components/lab/registry.tsx; tests/unit/labs.test.ts checks that both lists agree.
export const IMPLEMENTED_LABS = ["vra-lab", "sampling-universe", "ttest-lab"] as const;

export type ImplementedLabId = (typeof IMPLEMENTED_LABS)[number];

export const isImplemented = (id: string): id is ImplementedLabId => (IMPLEMENTED_LABS as readonly string[]).includes(id);

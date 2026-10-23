"use client";

// Lab id → React component for client code that picks a lab at run time (lessons, builder preview). Each lab
// is code-split and rendered on the client only. The /lab/<id> routes import their lab directly (src/app/lab/<id>/page.tsx).
import type { ImplementedLabId } from "@/content/curriculum/implemented-labs";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { LabProps } from "./shell/useLab";

function Loading() {
  return <div className="h-[480px] animate-pulse rounded-2xl border border-line bg-surface-2" aria-busy="true" aria-label="Loading lab" />;
}

export const LAB_COMPONENTS: Record<ImplementedLabId, ComponentType<LabProps>> = {
  "vra-lab": dynamic(() => import("./labs/vra-lab/VraLab"), { loading: Loading, ssr: false }),
  "sampling-universe": dynamic(() => import("./labs/sampling-universe/SamplingUniverse"), { loading: Loading, ssr: false }),
  "ttest-lab": dynamic(() => import("./labs/ttest-lab/TTestLab"), { loading: Loading, ssr: false }),
  "ci-explorer": dynamic(() => import("./labs/ci-explorer/CiExplorer"), { loading: Loading, ssr: false }),
  "survey-weighting-studio": dynamic(() => import("./labs/survey-weighting-studio/SurveyWeightingStudio"), { loading: Loading, ssr: false }),
  "hypothesis-lab": dynamic(() => import("./labs/hypothesis-lab/HypothesisLab"), { loading: Loading, ssr: false }),
  "distribution-studio": dynamic(() => import("./labs/distribution-studio/DistributionStudio"), { loading: Loading, ssr: false }),
  "probability-playground": dynamic(() => import("./labs/probability-playground/ProbabilityPlayground"), { loading: Loading, ssr: false }),
  "expected-value-lab": dynamic(() => import("./labs/expected-value-lab/ExpectedValueLab"), { loading: Loading, ssr: false }),
  "categorical-lab": dynamic(() => import("./labs/categorical-lab/CategoricalLab"), { loading: Loading, ssr: false }),
  "corr-reg-lab": dynamic(() => import("./labs/corr-reg-lab/CorrRegLab"), { loading: Loading, ssr: false }),
  "lazarsfeld-simpson-lab": dynamic(() => import("./labs/lazarsfeld-simpson-lab/LazarsfeldSimpsonLab"), { loading: Loading, ssr: false }),
  "anova-studio": dynamic(() => import("./labs/anova-studio/AnovaStudio"), { loading: Loading, ssr: false }),
  "survey-design-studio": dynamic(() => import("./labs/survey-design-studio/SurveyDesignStudio"), { loading: Loading, ssr: false }),
  "weighting-calibration-lab": dynamic(() => import("./labs/weighting-calibration-lab/WeightingCalibrationLab"), { loading: Loading, ssr: false }),
  "complex-survey-lab": dynamic(() => import("./labs/complex-survey-lab/ComplexSurveyLab"), { loading: Loading, ssr: false }),
};

/** Renders a lab by id (used by /lab/[labId], lessons and the Course Builder preview). */
export function LabHost({ id, ...props }: LabProps & { id: string }) {
  const C = (LAB_COMPONENTS as Record<string, ComponentType<LabProps> | undefined>)[id];
  if (!C) return <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">This lab ({id}) is not available in this version.</p>;
  return <C {...props} />;
}

"use client";

// Lab map for the /lab routes. A client module of next/dynamic imports: each lab is server-rendered into
// the static HTML and shipped as its own chunk, so a page downloads only the lab it renders. (A server
// component importing the labs, statically or through dynamic(), puts every lab into the one
// /lab/[labId] page chunk.) Client code that picks a lab at run time without SSR, such as lessons and the
// builder preview, uses ./registry.tsx.
import type { ImplementedLabId } from "@/content/curriculum/implemented-labs";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { LabProps } from "./shell/useLab";

export const ROUTE_LABS: Record<ImplementedLabId, ComponentType<LabProps>> = {
  "vra-lab": dynamic(() => import("./labs/vra-lab/VraLab")),
  "sampling-universe": dynamic(() => import("./labs/sampling-universe/SamplingUniverse")),
  "ttest-lab": dynamic(() => import("./labs/ttest-lab/TTestLab")),
  "ci-explorer": dynamic(() => import("./labs/ci-explorer/CiExplorer")),
  "survey-weighting-studio": dynamic(() => import("./labs/survey-weighting-studio/SurveyWeightingStudio")),
  "hypothesis-lab": dynamic(() => import("./labs/hypothesis-lab/HypothesisLab")),
  "distribution-studio": dynamic(() => import("./labs/distribution-studio/DistributionStudio")),
  "probability-playground": dynamic(() => import("./labs/probability-playground/ProbabilityPlayground")),
  "expected-value-lab": dynamic(() => import("./labs/expected-value-lab/ExpectedValueLab")),
  "categorical-lab": dynamic(() => import("./labs/categorical-lab/CategoricalLab")),
  "corr-reg-lab": dynamic(() => import("./labs/corr-reg-lab/CorrRegLab")),
  "lazarsfeld-simpson-lab": dynamic(() => import("./labs/lazarsfeld-simpson-lab/LazarsfeldSimpsonLab")),
};

/** The lab of a /lab/[labId] page. */
export function LabRoute({ id }: { id: ImplementedLabId }) {
  const Lab = ROUTE_LABS[id];
  return <Lab />;
}

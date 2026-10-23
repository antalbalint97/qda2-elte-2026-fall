"use client";

// Lab id → React component for client code that picks a lab at run time (lessons, builder preview). Each lab
// is code-split and rendered on the client only. The /lab routes use ./server-registry.tsx.
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
};

/** Renders a lab by id (used by /lab/[labId], lessons and the Course Builder preview). */
export function LabHost({ id, ...props }: LabProps & { id: string }) {
  const C = (LAB_COMPONENTS as Record<string, ComponentType<LabProps> | undefined>)[id];
  if (!C) return <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">This lab ({id}) is not available in this version.</p>;
  return <C {...props} />;
}

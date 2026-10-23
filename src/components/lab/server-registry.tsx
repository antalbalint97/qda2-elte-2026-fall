// Server-side lab map for the /lab routes. Each entry is a client component reference, so the App Router
// splits every lab into its own chunk and the page downloads only the lab it renders. (Client code that
// must choose a lab at run time, such as lessons and the builder preview, uses ./registry.tsx instead.)
import type { ImplementedLabId } from "@/content/curriculum/implemented-labs";
import type { ComponentType } from "react";
import VraLab from "./labs/vra-lab/VraLab";
import SamplingUniverse from "./labs/sampling-universe/SamplingUniverse";
import TTestLab from "./labs/ttest-lab/TTestLab";
import CiExplorer from "./labs/ci-explorer/CiExplorer";
import SurveyWeightingStudio from "./labs/survey-weighting-studio/SurveyWeightingStudio";
import type { LabProps } from "./shell/useLab";

export const LAB_PAGES: Record<ImplementedLabId, ComponentType<LabProps>> = {
  "vra-lab": VraLab,
  "sampling-universe": SamplingUniverse,
  "ttest-lab": TTestLab,
  "ci-explorer": CiExplorer,
  "survey-weighting-studio": SurveyWeightingStudio,
};

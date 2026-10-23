import SurveyWeightingStudio from "@/components/lab/labs/survey-weighting-studio/SurveyWeightingStudio";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("survey-weighting-studio");

export default function Page() {
  return <SurveyWeightingStudio />;
}

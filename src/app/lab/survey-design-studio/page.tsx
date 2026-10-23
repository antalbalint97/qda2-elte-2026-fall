import SurveyDesignStudio from "@/components/lab/labs/survey-design-studio/SurveyDesignStudio";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("survey-design-studio");

export default function Page() {
  return <SurveyDesignStudio />;
}

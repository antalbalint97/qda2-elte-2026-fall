import ComplexSurveyLab from "@/components/lab/labs/complex-survey-lab/ComplexSurveyLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("complex-survey-lab");

export default function Page() {
  return <ComplexSurveyLab />;
}

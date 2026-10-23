import ProbabilityPlayground from "@/components/lab/labs/probability-playground/ProbabilityPlayground";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("probability-playground");

export default function Page() {
  return <ProbabilityPlayground />;
}

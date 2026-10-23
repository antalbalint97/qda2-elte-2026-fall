import HypothesisLab from "@/components/lab/labs/hypothesis-lab/HypothesisLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("hypothesis-lab");

export default function Page() {
  return <HypothesisLab />;
}

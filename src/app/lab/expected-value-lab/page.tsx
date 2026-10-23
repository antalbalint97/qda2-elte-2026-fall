import ExpectedValueLab from "@/components/lab/labs/expected-value-lab/ExpectedValueLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("expected-value-lab");

export default function Page() {
  return <ExpectedValueLab />;
}

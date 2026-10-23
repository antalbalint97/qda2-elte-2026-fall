import TTestLab from "@/components/lab/labs/ttest-lab/TTestLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("ttest-lab");

export default function Page() {
  return <TTestLab />;
}

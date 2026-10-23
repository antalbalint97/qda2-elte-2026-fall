import CorrRegLab from "@/components/lab/labs/corr-reg-lab/CorrRegLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("corr-reg-lab");

export default function Page() {
  return <CorrRegLab />;
}

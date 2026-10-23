import LazarsfeldSimpsonLab from "@/components/lab/labs/lazarsfeld-simpson-lab/LazarsfeldSimpsonLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("lazarsfeld-simpson-lab");

export default function Page() {
  return <LazarsfeldSimpsonLab />;
}

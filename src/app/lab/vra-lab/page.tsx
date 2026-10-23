import VraLab from "@/components/lab/labs/vra-lab/VraLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("vra-lab");

export default function Page() {
  return <VraLab />;
}

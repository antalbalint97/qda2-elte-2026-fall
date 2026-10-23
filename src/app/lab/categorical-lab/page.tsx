import CategoricalLab from "@/components/lab/labs/categorical-lab/CategoricalLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("categorical-lab");

export default function Page() {
  return <CategoricalLab />;
}

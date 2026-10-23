import DistributionStudio from "@/components/lab/labs/distribution-studio/DistributionStudio";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("distribution-studio");

export default function Page() {
  return <DistributionStudio />;
}

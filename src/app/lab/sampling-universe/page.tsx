import SamplingUniverse from "@/components/lab/labs/sampling-universe/SamplingUniverse";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("sampling-universe");

export default function Page() {
  return <SamplingUniverse />;
}

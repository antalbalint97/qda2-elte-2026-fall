import LinalgPcaStudio from "@/components/lab/labs/linalg-pca-studio/LinalgPcaStudio";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("linalg-pca-studio");

export default function Page() {
  return <LinalgPcaStudio />;
}

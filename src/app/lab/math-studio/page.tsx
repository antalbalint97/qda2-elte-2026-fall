import MathStudio from "@/components/lab/labs/math-studio/MathStudio";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("math-studio");

export default function Page() {
  return <MathStudio />;
}

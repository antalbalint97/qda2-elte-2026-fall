import AnovaStudio from "@/components/lab/labs/anova-studio/AnovaStudio";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("anova-studio");

export default function Page() {
  return <AnovaStudio />;
}

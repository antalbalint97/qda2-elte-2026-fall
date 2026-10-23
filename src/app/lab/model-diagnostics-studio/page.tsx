import ModelDiagnosticsStudio from "@/components/lab/labs/model-diagnostics-studio/ModelDiagnosticsStudio";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("model-diagnostics-studio");

export default function Page() {
  return <ModelDiagnosticsStudio />;
}

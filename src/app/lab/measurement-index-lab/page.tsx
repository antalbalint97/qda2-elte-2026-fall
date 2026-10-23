import MeasurementIndexLab from "@/components/lab/labs/measurement-index-lab/MeasurementIndexLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("measurement-index-lab");

export default function Page() {
  return <MeasurementIndexLab />;
}

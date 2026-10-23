import WeightingCalibrationLab from "@/components/lab/labs/weighting-calibration-lab/WeightingCalibrationLab";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("weighting-calibration-lab");

export default function Page() {
  return <WeightingCalibrationLab />;
}

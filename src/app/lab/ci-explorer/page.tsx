import CiExplorer from "@/components/lab/labs/ci-explorer/CiExplorer";
import { labMetadata } from "@/components/lab/route-meta";

export const metadata = labMetadata("ci-explorer");

export default function Page() {
  return <CiExplorer />;
}

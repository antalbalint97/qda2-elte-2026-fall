import { LabsPortfolio } from "@/components/labs/LabsPortfolio";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Laboratory portfolio" };

export default function LabsPage() {
  return <LabsPortfolio />;
}

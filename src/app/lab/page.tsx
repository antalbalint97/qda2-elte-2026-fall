import VraLab from "@/components/lab/labs/vra-lab/VraLab";
import type { Metadata } from "next";

// /lab is the flagship Variance → Regression → ANOVA lab. Its legacy hash (/lab#s=1, /lab#s=3) is linked from
// the /variance and /anova modules, so this address must keep working.
export const metadata: Metadata = { title: "Variance → Regression → ANOVA" };

export default function FlagshipLabPage() {
  return <VraLab />;
}

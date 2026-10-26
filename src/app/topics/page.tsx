import { TopicsMap } from "@/components/topics/TopicsMap";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Topics",
  description: "The QDA2 curriculum as a map: every topic by conceptual domain, with its course module and interactive labs.",
};

export default function TopicsPage() {
  return <TopicsMap />;
}

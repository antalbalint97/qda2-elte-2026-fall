import { RConsole } from "@/components/r/RConsole";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "R in the browser",
  description: "Run R code in your browser with webR: course datasets, plots and, on request, the survey package.",
};

export default function RPage() {
  return <RConsole />;
}

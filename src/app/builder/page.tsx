import { CourseBuilder } from "@/components/builder/CourseBuilder";
import { authoringEnabled } from "@/lib/authoring";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Course Builder", robots: { index: false, follow: false } };
// the authoring setting is read per request, so a deployment can switch it without a rebuild
export const dynamic = "force-dynamic";

export default function BuilderPage() {
  if (!authoringEnabled()) notFound();
  return <CourseBuilder />;
}

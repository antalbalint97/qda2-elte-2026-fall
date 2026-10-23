import { LessonView } from "@/components/lesson/LessonView";
import { publishedVersion, publishedVersions } from "@/content/published";
import { lessonData } from "@/lib/course/lesson-data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Params = { courseId: string; unitId: string; lessonId: string };
type Search = { v?: string | string[] };

function resolve(p: Params, s: Search) {
  const courseId = decodeURIComponent(p.courseId);
  const v = typeof s.v === "string" ? s.v : undefined;
  const entry = publishedVersion(courseId, v);
  if (!entry) return null;
  const all = publishedVersions(courseId);
  const snap = entry.data.course.versions[0].snapshot;
  return lessonData(snap, decodeURIComponent(p.unitId), decodeURIComponent(p.lessonId), { version: entry.version, latest: all.at(-1) === entry, review: entry.review });
}

export async function generateMetadata({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }): Promise<Metadata> {
  const d = resolve(await params, await searchParams);
  return d ? { title: `${d.lessonTitle.en} · ${d.courseTitle.en}` } : {};
}

export default async function LessonPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const d = resolve(await params, await searchParams);
  if (!d) notFound();
  return <LessonView data={d} />;
}

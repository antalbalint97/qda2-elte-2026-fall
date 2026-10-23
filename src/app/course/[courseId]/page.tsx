import { CourseOverview } from "@/components/lesson/CourseOverview";
import { publishedVersion, publishedVersions } from "@/content/published";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Params = { courseId: string };
type Search = { v?: string | string[] };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const e = publishedVersion(decodeURIComponent((await params).courseId));
  return e ? { title: e.data.course.title.en } : {};
}

export default async function CoursePage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<Search> }) {
  const courseId = decodeURIComponent((await params).courseId);
  const s = await searchParams;
  const entry = publishedVersion(courseId, typeof s.v === "string" ? s.v : undefined);
  if (!entry) notFound();
  const all = publishedVersions(courseId);
  const snap = entry.data.course.versions[0].snapshot;
  return (
    <CourseOverview
      courseId={courseId}
      version={entry.version}
      latest={all.at(-1) === entry}
      review={entry.review}
      note={entry.note}
      title={snap.title}
      description={snap.description}
      outcomes={snap.outcomes}
      units={snap.units.map((u) => ({ id: u.id, title: u.title, lessons: u.lessons.map((l) => ({ id: l.id, title: l.title, blocks: l.blocks.length })) }))}
      versions={all.map((v) => ({ version: v.version, publishedAt: v.data.course.versions[0].publishedAt, review: v.review }))}
    />
  );
}

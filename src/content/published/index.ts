// Registry of published course versions. A version is published by adding its export file (Builder → Export,
// schema qda2-course/2) under <courseId>/<version>.json in a reviewed pull request, listing it here and recording
// its SHA-256 in LOCK.json. Files are never edited afterwards: tests/unit/published.test.ts fails if a listed
// file changes, disappears or is not registered, and if a snapshot does not validate.
//
// `review` is the teaching-review state of the version. Only "approved-for-pilot" versions are listed in the
// course catalogue; every other version is still reachable by its URL and shows a "not yet reviewed" notice.
import type { CourseExport } from "@/lib/course/model";
import surveyV100 from "./course.survey/1.0.0.json";

export type ReviewState = "not-reviewed" | "approved-for-pilot";
export interface PublishedEntry {
  courseId: string;
  version: string;
  /** Path below src/content/published. */
  file: string;
  review: ReviewState;
  /** Why the version exists and what it is fit for. */
  note: string;
  data: CourseExport;
}

export const PUBLISHED: PublishedEntry[] = [
  {
    courseId: "course.survey",
    version: "1.0.0",
    file: "course.survey/1.0.0.json",
    review: "not-reviewed",
    note: "Generated from the Survey Statistics course template (scripts/course/publish-template.ts) to exercise the publication path and the acceptance lesson “Sampling, Weights and Statistical Inference”. Most blocks show library definitions only; not reviewed for teaching.",
    data: surveyV100 as unknown as CourseExport,
  },
];

export const publishedCourseIds = (): string[] => [...new Set(PUBLISHED.map((p) => p.courseId))];
/** Versions of a course in publication order (oldest first). */
export const publishedVersions = (courseId: string): PublishedEntry[] => PUBLISHED.filter((p) => p.courseId === courseId);
/** The requested version, or the newest one when `v` is empty or "latest". */
export function publishedVersion(courseId: string, v?: string | null): PublishedEntry | null {
  const all = publishedVersions(courseId);
  if (!all.length) return null;
  if (!v || v === "latest") return all[all.length - 1];
  return all.find((p) => p.version === v) ?? null;
}

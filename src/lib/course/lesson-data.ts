// Picks what one lesson needs out of a snapshot (its blocks and datasets, plus titles for navigation), so a
// lesson page ships only its own content to the browser.
import type { LessonData, LessonReview } from "../../components/lesson/LessonView";
import { lessonOrder, type DatasetRef, type Snapshot } from "./model";

export function lessonData(snap: Snapshot, unitId: string, lessonId: string, meta: { version: string; latest: boolean; review: LessonReview }): LessonData | null {
  const unit = snap.units.find((u) => u.id === unitId);
  const lesson = unit?.lessons.find((l) => l.id === lessonId);
  if (!unit || !lesson) return null;
  const blocks = lesson.blocks.map((bi) => (bi.iid ? snap.blocks[bi.iid] : undefined)).filter((b): b is NonNullable<typeof b> => !!b);
  const datasets: Record<string, DatasetRef> = {};
  for (const b of blocks) {
    for (const id of [b.type === "dataset" ? b.datasetId ?? b.id : null, typeof b.config?.dataset === "string" ? (b.config.dataset as string) : null]) {
      if (id && snap.datasets[id]) datasets[id] = snap.datasets[id];
    }
  }
  const order = lessonOrder(snap.units);
  const i = order.findIndex((o) => o.unitId === unitId && o.lessonId === lessonId);
  const item = (k: number) => (order[k] ? { unitId: order[k].unitId, lessonId: order[k].lessonId, title: order[k].title } : null);
  return {
    courseId: snap.courseId,
    version: meta.version,
    latest: meta.latest,
    review: meta.review,
    courseTitle: snap.title,
    outline: snap.units.map((u) => ({ unitId: u.id, title: u.title, lessons: u.lessons.map((l) => ({ id: l.id, title: l.title })) })),
    unitId,
    unitTitle: unit.title,
    lessonId,
    lessonTitle: lesson.title,
    blocks,
    datasets,
    prev: item(i - 1),
    next: item(i + 1),
  };
}

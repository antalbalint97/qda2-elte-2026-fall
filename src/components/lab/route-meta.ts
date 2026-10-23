// Metadata for the per-lab routes in src/app/lab/<id>/page.tsx. Every implemented lab has its own route
// file that imports the lab directly, so each page ships only its own lab (a shared /lab/[labId] page
// bundled every lab into one chunk, and next/dynamic wrappers broke useId hydration).
import { LABS } from "@/content/curriculum/labs";
import type { ImplementedLabId } from "@/content/curriculum/implemented-labs";
import type { Metadata } from "next";

export function labMetadata(id: ImplementedLabId): Metadata {
  const def = LABS.find((l) => l.id === id);
  return { title: def ? def.name.en : "Lab" };
}

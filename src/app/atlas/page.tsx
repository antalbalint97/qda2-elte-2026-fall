import { ConceptAtlas } from "@/components/atlas/ConceptAtlas";
import { authoringEnabled } from "@/lib/authoring";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Concept Atlas", description: "The QDA2 concept graph: prerequisites, related concepts, labs, learning blocks and course lessons." };
// read the authoring setting at request time, not at build time
export const dynamic = "force-dynamic";

export default function AtlasPage() {
  return <ConceptAtlas authoring={authoringEnabled()} />;
}

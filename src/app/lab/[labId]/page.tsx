import { LabRoute } from "@/components/lab/route-registry";
import { IMPLEMENTED_LABS, isImplemented } from "@/content/curriculum/implemented-labs";
import { LABS } from "@/content/curriculum/labs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return IMPLEMENTED_LABS.map((labId) => ({ labId }));
}

export async function generateMetadata({ params }: { params: Promise<{ labId: string }> }): Promise<Metadata> {
  const { labId } = await params;
  const def = LABS.find((l) => l.id === labId);
  return { title: def ? def.name.en : "Lab" };
}

export default async function LabPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  if (!isImplemented(labId)) notFound();
  return <LabRoute id={labId} />;
}

import { CONCEPTS, type ConceptId } from "@/content/concepts";

/** What the optional "Explain why my answer was wrong" feature sends to a model. */
export interface ExplainPayload {
  topic: string;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  courseDefinition: string;
  instructions: string;
}

export function buildExplainPayload(args: {
  concept: ConceptId;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
}): ExplainPayload {
  const c = CONCEPTS[args.concept];
  return {
    topic: c.label,
    question: args.question,
    correctAnswer: args.correctAnswer,
    studentAnswer: args.studentAnswer,
    courseDefinition: c.definition,
    instructions:
      "In at most 3 sentences, name the exact conceptual mistake, then restate the correct reasoning. Use only the terminology of the course definition. Do not use causal language for associations.",
  };
}

/**
 * Mocked model call. It is deterministic and assembled from course definitions so the
 * feature can be designed and tested without an API. Replace the body with a fetch to a
 * server route (e.g. /api/explain) that forwards the payload to a model.
 */
export async function explainMistake(p: ExplainPayload, hint?: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 700));
  const parts = [
    `You answered “${p.studentAnswer}”, but the answer that fits the course logic is “${p.correctAnswer}”.`,
    hint ?? "",
    `Key idea (${p.topic}): ${p.courseDefinition}`,
  ];
  return parts.filter(Boolean).join(" ");
}

// Deterministic grading for the question types the bank supports (choice and order). Free text (predictions,
// reflections) is never graded automatically.
import type { BankQuestion } from "../../content/curriculum/types";

export interface Grade {
  correct: boolean;
  /** Feedback for this answer: the option's or item's "why" when wrong, the explanation when right. */
  feedback: string[];
  /** Order questions: 0-based positions holding the wrong item (the correct order is revealed only on request). */
  wrongPositions?: number[];
}

export function gradeChoice(q: BankQuestion, optionId: string): Grade {
  if (q.kind !== "choice" || q.grading !== "deterministic-choice") throw new Error(`${q.id} is not a deterministic choice question`);
  const opt = q.options?.find((o) => o.id === optionId);
  if (!opt) throw new Error(`${q.id}: unknown option ${optionId}`);
  const correct = opt.id === q.correct && opt.correct;
  return { correct, feedback: correct ? [q.explanation] : [opt.why ?? "Not this one. Think about what the question asks and try again."] };
}

/** Items are listed in the correct order in the bank; `order` is the learner's arrangement of item ids. */
export function gradeOrder(q: BankQuestion, order: readonly string[]): Grade {
  if (q.kind !== "order" || q.grading !== "deterministic-order") throw new Error(`${q.id} is not a deterministic order question`);
  const target = (q.items ?? []).map((i) => i.id);
  if (order.length !== target.length || !target.every((id) => order.includes(id))) throw new Error(`${q.id}: the answer must be a permutation of the items`);
  const wrongPositions = order.map((id, i) => (id === target[i] ? -1 : i)).filter((i) => i >= 0);
  const correct = wrongPositions.length === 0;
  return {
    correct,
    wrongPositions,
    feedback: correct ? [q.explanation] : [`${target.length - wrongPositions.length} of ${target.length} steps are in the right place.`],
  };
}

export const isGradable = (q: BankQuestion) => (q.kind === "choice" && q.grading === "deterministic-choice") || (q.kind === "order" && q.grading === "deterministic-order");

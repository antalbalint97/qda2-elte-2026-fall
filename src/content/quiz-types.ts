import type { ReactNode } from "react";
import type { ConceptId } from "./concepts";

export interface ChoiceOption {
  id: string;
  label: string;
  /** Explains the exact conceptual mistake when this (wrong) option is picked. */
  why?: string;
}

export interface ChoiceQuestion {
  kind: "choice";
  id: string;
  concept: ConceptId;
  /** Short label of the question type, e.g. "Choose method". */
  format: string;
  prompt: string;
  context?: ReactNode;
  options: ChoiceOption[];
  correct: string;
  /** Why the correct answer is correct. */
  explanation: string;
  /** Options that are defensible with a caveat (shown as partial credit). */
  partial?: Record<string, string>;
}

export interface OrderQuestion {
  kind: "order";
  id: string;
  concept: ConceptId;
  format: string;
  prompt: string;
  /** Items in the correct order. */
  items: Array<{ id: string; label: string; why?: string }>;
  /** Starting (shuffled) order, as item ids. */
  initial: string[];
  explanation: string;
}

export type Question = ChoiceQuestion | OrderQuestion;

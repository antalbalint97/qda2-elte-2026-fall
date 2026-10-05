"use client";

import type { Question } from "@/content/quiz-types";
import { ChoiceQuestionView } from "./ChoiceQuestionView";
import { OrderQuestionView } from "./OrderQuestionView";

export function QuestionView({
  q,
  onAnswered,
  showFormat,
}: {
  q: Question;
  onAnswered?: (correct: boolean) => void;
  showFormat?: boolean;
}) {
  return q.kind === "choice" ? (
    <ChoiceQuestionView q={q} onAnswered={onAnswered} showFormat={showFormat} />
  ) : (
    <OrderQuestionView q={q} onAnswered={onAnswered} showFormat={showFormat} />
  );
}

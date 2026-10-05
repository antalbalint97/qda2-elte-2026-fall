"use client";

import { ChoiceQuestionView } from "@/components/quiz/ChoiceQuestionView";
import type { ChoiceQuestion } from "@/content/quiz-types";
import { cn } from "@/lib/cn";
import { useState } from "react";

interface Ex {
  id: string;
  rq: string;
  dv: string;
  dvWrong: string[];
  group: string;
  groupWrong: string[];
  test: "one" | "ind" | "paired";
  h0: string;
  h0Wrong: string[];
  h1: string;
  h1Wrong: string[];
  why: string;
}

const EXAMPLES: Ex[] = [
  {
    id: "interview",
    rq: "Is average interview completion time equal to 60 minutes?",
    dv: "Interview completion time (minutes)",
    dvWrong: ["The value 60", "Interviewer"],
    group: "None: one group compared with a fixed value",
    groupWrong: ["Interview completion time", "The value 60"],
    test: "one",
    h0: "μ = 60",
    h0Wrong: ["x̄ = 60", "μ ≠ 60"],
    h1: "μ ≠ 60",
    h1Wrong: ["μ = 60", "μ > x̄"],
    why: "One variable, one sample, compared with a known value (the 60-minute target).",
  },
  {
    id: "happiness",
    rq: "Do politically interested and uninterested respondents differ in happiness?",
    dv: "Happiness (0–10)",
    dvWrong: ["Political interest", "Respondent ID"],
    group: "Political interest (interested / uninterested)",
    groupWrong: ["Happiness", "None"],
    test: "ind",
    h0: "μ(interested) = μ(uninterested)",
    h0Wrong: ["x̄(interested) = x̄(uninterested)", "μ(interested) ≠ μ(uninterested)"],
    h1: "μ(interested) ≠ μ(uninterested)",
    h1Wrong: ["μ(interested) = μ(uninterested)", "μ_d = 0"],
    why: "Two separate groups of respondents; each person is either interested or uninterested.",
  },
  {
    id: "ratings",
    rq: "Do respondents rate the education system and the healthcare system differently (both 0–10)?",
    dv: "The within-person difference: education rating − healthcare rating",
    dvWrong: ["Education rating only", "Type of system as a grouping variable"],
    group: "None: both ratings come from the same respondents",
    groupWrong: ["System type (education / healthcare)", "Respondent gender"],
    test: "paired",
    h0: "μ_d = 0 (the mean difference between the two ratings is zero)",
    h0Wrong: ["μ(education) ≠ μ(healthcare)", "x̄_d = 0"],
    h1: "μ_d ≠ 0",
    h1Wrong: ["μ_d = 0", "μ(education) > 5"],
    why: "Every respondent gives both ratings, so the two values are paired.",
  },
  {
    id: "panel",
    rq: "In a two-wave panel, did the same respondents' trust in parliament change between 2022 and 2024?",
    dv: "Trust in parliament (0–10), measured twice",
    dvWrong: ["Survey year", "Panel ID"],
    group: "None: the same people are measured twice",
    groupWrong: ["Survey year (2022 / 2024) as independent groups", "Trust in parliament"],
    test: "paired",
    h0: "μ_d = 0",
    h0Wrong: ["μ(2022) ≠ μ(2024)", "μ = 5"],
    h1: "μ_d ≠ 0",
    h1Wrong: ["μ_d = 0", "μ(2024) = 5"],
    why: "Panel data: two measurements from the same respondents.",
  },
  {
    id: "hours",
    rq: "Do men and women differ in weekly working hours?",
    dv: "Weekly working hours",
    dvWrong: ["Gender", "Occupation"],
    group: "Gender (men / women)",
    groupWrong: ["Weekly working hours", "None"],
    test: "ind",
    h0: "μ(men) = μ(women)",
    h0Wrong: ["μ(men) ≠ μ(women)", "μ = 40"],
    h1: "μ(men) ≠ μ(women)",
    h1Wrong: ["μ(men) = μ(women)", "μ_d = 0"],
    why: "Two separate groups defined by gender.",
  },
];

const TEST_NAME = { one: "One-sample t-test", ind: "Independent-samples t-test", paired: "Paired-samples t-test" };

function rot<T>(a: T[], k: number) {
  const n = k % a.length;
  return [...a.slice(n), ...a.slice(0, n)];
}

function testWhy(picked: Ex["test"], correct: Ex["test"]): string {
  if (correct === "one") return "There is only one group of observations, compared with a fixed reference value.";
  if (correct === "paired")
    return picked === "ind"
      ? "You chose an independent-samples t-test, but the two values come from the same respondents."
      : "There is no fixed reference value; two measurements from the same people are compared.";
  return picked === "paired"
    ? "Each respondent belongs to only one group, so there are no pairs."
    : "There is no fixed reference value; the means of two groups are compared.";
}

function build(e: Ex, k: number): ChoiceQuestion[] {
  const mk = (
    suffix: string,
    n: number,
    prompt: string,
    correct: string,
    wrong: string[],
    explanation: string,
    wrongWhy: string,
    concept: ChoiceQuestion["concept"] = "t-test-choice",
  ): ChoiceQuestion => ({
    kind: "choice",
    id: `tp-${e.id}-${suffix}`,
    concept,
    format: `Step ${n} of 5`,
    prompt,
    options: rot(
      [{ id: "c", label: correct }, ...wrong.map((w, i) => ({ id: `w${i}`, label: w, why: wrongWhy }))],
      k + n,
    ),
    correct: "c",
    explanation,
  });
  return [
    mk("dv", 1, "What is the dependent variable (the one whose mean we compare)?", e.dv, e.dvWrong, `The mean of ${e.dv.toLowerCase()} is what the test compares.`, "This is not the variable whose mean is compared.", "roles"),
    mk("group", 2, "What is the grouping variable, if any?", e.group, e.groupWrong, e.why, e.test === "ind" ? "The grouping variable defines the two independent groups; it is not the outcome." : "There are no separate groups here: " + e.why.charAt(0).toLowerCase() + e.why.slice(1), "roles"),
    {
      kind: "choice",
      id: `tp-${e.id}-test`,
      concept: "t-test-choice",
      format: "Step 3 of 5",
      prompt: "Which t-test fits?",
      options: (["one", "ind", "paired"] as const).map((t) => ({
        id: t,
        label: TEST_NAME[t],
        why: t === e.test ? undefined : testWhy(t, e.test),
      })),
      correct: e.test,
      explanation: `${TEST_NAME[e.test]}: ${e.why}`,
    },
    mk("h0", 4, "Formulate H₀.", e.h0, e.h0Wrong, "Hypotheses are about population parameters (μ), and H₀ is the ‘no difference’ statement.", "Hypotheses are statements about population means (μ), not sample means (x̄), and H₀ states no difference.", "p-value"),
    mk("h1", 5, "Formulate the (two-sided) alternative hypothesis H₁.", e.h1, e.h1Wrong, "H₁ is the complement of H₀: the population means (or the mean difference) are not equal.", "H₁ must contradict H₀ and refer to the same population parameter.", "p-value"),
  ];
}

export function Practice() {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState<Record<string, number>>({});
  const e = EXAMPLES[i];
  const qs = build(e, i);
  const n = shown[e.id] ?? 1;
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex gap-1 overflow-x-auto border-b border-line px-4 py-2 sm:px-6">
        {EXAMPLES.map((x, k) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setI(k)}
            aria-current={k === i}
            className={cn("shrink-0 rounded-md px-3 py-1.5 text-sm", k === i ? "bg-surface-2 font-medium text-ink" : "text-muted hover:text-ink")}
          >
            Example {k + 1}
          </button>
        ))}
      </div>
      <div className="p-4 sm:p-6">
        <p className="font-serif text-xl italic text-ink">“{e.rq}”</p>
      </div>
      <div key={e.id} className="divide-y divide-line border-t border-line">
        {qs.slice(0, n).map((q, k) => (
          <div key={q.id} className="p-4 sm:p-6">
            <ChoiceQuestionView q={q} compact onAnswered={() => setShown((s) => ({ ...s, [e.id]: Math.max(s[e.id] ?? 1, k + 2) }))} />
          </div>
        ))}
      </div>
    </div>
  );
}

import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { BeforeSpss, MenuPath, SpssDialog, SpssOutput } from "@/components/learning/Spss";
import { GuessR } from "@/components/modules/correlation/GuessR";
import { PearsonSpearman } from "@/components/modules/correlation/PearsonSpearman";
import { Playground } from "@/components/modules/correlation/Playground";
import { MonotonicExample, UShape } from "@/components/modules/correlation/UShape";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Callout } from "@/components/ui/Callout";
import { Role } from "@/components/ui/Role";
import { MODULES } from "@/content/modules";
import { qCorrCause, qCorrOutput, qCorrU, qPearsonScale, qPearsonSpearmanOrd } from "@/content/questions";
import type { ChoiceQuestion } from "@/content/quiz-types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Correlation" };
const meta = MODULES[4];

const OUTPUT_QS: ChoiceQuestion[] = [
  {
    kind: "choice",
    id: "k-out-dir",
    concept: "correlation",
    format: "Interpret SPSS output",
    prompt: "What is the direction of the relationship?",
    options: [
      { id: "pos", label: "Positive" },
      { id: "neg", label: "Negative", why: "The coefficient .31 has no minus sign, so higher education goes with higher trust." },
    ],
    correct: "pos",
    explanation: "r = .31 is positive: respondents with more years of education tend to report higher trust in parliament.",
  },
  {
    kind: "choice",
    id: "k-out-strength",
    concept: "correlation",
    format: "Interpret SPSS output",
    prompt: "How strong is the relationship?",
    options: [
      { id: "moderate", label: "Moderate (|r| = .31)" },
      { id: "strong", label: "Strong, because it is significant", why: "You confused statistical significance with strength. Strength is read from |r|, not from Sig." },
      { id: "31", label: "31% of trust is explained by education", why: "r is not a percentage. (r² = .10 would be the share of shared variance, and even that is not ‘explained’ in a causal sense.)" },
    ],
    correct: "moderate",
    explanation: "Using this course's convention (0–.20 weak, .21–.40 moderate, .41–1 strong), |r| = .31 is a moderate association.",
  },
  {
    kind: "choice",
    id: "k-out-sig",
    concept: "p-value",
    format: "Interpret SPSS output",
    prompt: "Is it statistically significant at α = .05?",
    options: [
      { id: "yes", label: "Yes, Sig. < .001" },
      { id: "no", label: "No, Sig. is .000 so p is zero", why: "SPSS rounds to three decimals; .000 means p < .001, which is far below .05." },
    ],
    correct: "yes",
    explanation: "Sig. (2-tailed) = .000 means p < .001, so we reject H₀: ρ = 0. With N = 1,412 even modest correlations are significant.",
  },
  {
    kind: "choice",
    id: "k-out-cause",
    concept: "correlation",
    format: "Interpret SPSS output",
    prompt: "Can we conclude that education increases trust in parliament?",
    options: [
      { id: "yes", label: "Yes, the correlation is significant", why: "Significance does not establish causation. Cross-sectional correlation shows association only." },
      { id: "no", label: "No; education is associated with trust, but r alone does not establish causation" },
    ],
    correct: "no",
    explanation:
      "Say ‘years of education are positively associated with trust in parliament (r = .31, p < .001)’. Other variables (age, income, political interest) may be related to both.",
  },
];

export default function Page() {
  return (
    <ModuleShell
      meta={meta}
      lede={
        <>
          Pearson&apos;s r summarises two things about a linear association between two variables: its{" "}
          <strong className="text-ink">direction</strong> and its <strong className="text-ink">strength</strong>, on a
          scale from −1 to +1.
        </>
      }
    >
      <Step
        kind="understand"
        id="understand"
        title="Correlation playground"
        intro="Change the trend and the noise. Notice that r depends on how tightly the points hug a line, not on how steep the line is: a steep trend with lots of noise can have a smaller r than a gentle trend with little noise."
      >
        <Playground />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Callout tone="key" title="r gives you">
            <ul className="list-disc space-y-1 pl-4">
              <li>the direction of a linear association (sign)</li>
              <li>the strength of a linear association (|r| from 0 to 1)</li>
            </ul>
          </Callout>
          <Callout tone="caution" title="r does not give you">
            <ul className="list-disc space-y-1 pl-4">
              <li>causality (correlation ≠ causation)</li>
              <li>the slope in original units</li>
              <li>a complete description of nonlinear relationships</li>
            </ul>
          </Callout>
        </div>
      </Step>

      <Step kind="try" id="try" title="Guess the correlation" intro="Training your eye makes output easier to sanity-check.">
        <GuessR />
      </Step>

      <Step
        kind="understand"
        id="nonlinear"
        title="When r = 0 but the relationship is obvious"
        intro="Pearson's r only looks for straight-line patterns. Always look at the scatterplot."
      >
        <UShape />
      </Step>

      <Step
        kind="understand"
        id="choose"
        title="Pearson or Spearman?"
        intro="Spearman's rank correlation is a rank-based measure of monotonic association: it replaces values with their ranks and correlates the ranks."
      >
        <PearsonSpearman />
        <div className="mt-8">
          <MonotonicExample />
        </div>
        <Callout tone="note" className="mt-6" title="Advanced note">
          In large social-science samples, mild departures from normality may be less consequential than in very small
          samples. Outliers and clearly curved patterns matter more than small deviations from a bell shape.
        </Callout>
      </Step>

      <Step kind="spss" id="spss" title="Correlation in SPSS">
        <div className="space-y-6">
          <BeforeSpss
            items={[
              { q: "What is the research question?", a: "Is education associated with trust in parliament?" },
              { q: "What are X and Y?", a: <><Role r="X">years of education</Role> <Role r="Y">trust in parliament (0–10)</Role></> },
              { q: "Measurement levels?", a: "Both treated as scale." },
              { q: "Compare or associate?", a: "Associate: two scale variables, no groups." },
              { q: "Which method?", a: "Pearson (scatterplot roughly linear); Spearman as a robustness check." },
            ]}
          />
          <MenuPath path={["Analyze", "Correlate", "Bivariate"]} />
          <SpssDialog
            title="Bivariate Correlations"
            variables={["age", "gender", "polint", "happy", "hours"]}
            fields={[
              { label: "Variables:", values: ["eduyrs", "trustprl"], note: "Move both variables here. The order does not matter: correlation is symmetric." },
            ]}
            options={[
              { label: "Pearson", checked: true, note: "Tick Pearson, Spearman, or both, depending on the decision above." },
              { label: "Kendall's tau-b", checked: false },
              { label: "Spearman", checked: false },
              { label: "Two-tailed", checked: true, note: "Test of significance: two-tailed unless you had a directional hypothesis in advance." },
              { label: "Flag significant correlations", checked: true },
            ]}
            footerNote="Click Paste to save the syntax, or OK to run."
          />
          <SpssOutput
            title="Correlations"
            headers={["", "", "Years of education", "Trust in parliament"]}
            rows={[
              ["Years of education", "Pearson Correlation", "1", { v: ".31**", hl: 1 }],
              ["", "Sig. (2-tailed)", "", { v: ".000", hl: 2 }],
              ["", "N", "1412", { v: "1412", hl: 3 }],
              ["Trust in parliament", "Pearson Correlation", ".31**", "1"],
              ["", "Sig. (2-tailed)", ".000", ""],
              ["", "N", "1412", "1412"],
            ]}
            annotations={{
              1: "Correlation coefficient: sign = direction, size = strength.",
              2: "Sig. (2-tailed): the p-value for H₀: no correlation in the population. .000 means p < .001.",
              3: "N: cases with valid values on both variables (pairwise).",
            }}
            footnote="** Correlation is significant at the 0.01 level (2-tailed). The table is symmetric: read one half."
          />
          <QuizRunner questions={OUTPUT_QS} title="Read this output" />
        </div>
      </Step>

      <Step kind="test" id="test" title="Mastery check">
        <QuizRunner questions={[qCorrOutput, qCorrU, qPearsonSpearmanOrd, qPearsonScale, qCorrCause]} />
      </Step>
    </ModuleShell>
  );
}

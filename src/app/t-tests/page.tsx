import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { AllDiagrams, Chooser } from "@/components/modules/ttest/Chooser";
import { EffectSize } from "@/components/modules/ttest/EffectSize";
import { Levene } from "@/components/modules/ttest/Levene";
import { Practice } from "@/components/modules/ttest/Practice";
import { SpssGuides } from "@/components/modules/ttest/SpssGuides";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Callout } from "@/components/ui/Callout";
import { Pill } from "@/components/ui/Role";
import { MODULES } from "@/content/modules";
import { qEffectSize, qLevene, qTInd, qTOne, qTOutput, qTPaired } from "@/content/questions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "t-tests" };
const meta = MODULES[5];

export default function Page() {
  return (
    <ModuleShell meta={meta} lede={<p className="font-serif text-2xl text-ink">A t-test asks whether means differ.</p>}>
      <Step
        kind="understand"
        id="understand"
        title="Choose the comparison"
        intro="The three t-tests share the same logic (difference ÷ standard error). What differs is what is being compared."
      >
        <Chooser />
        <div className="mt-8">
          <AllDiagrams />
        </div>
        <Callout tone="warn" className="mt-6" title="The paired trap">
          If the two numbers come from the same respondents (two questions, two waves, before and after), the
          observations are not independent. Use the paired-samples t-test, even if it ‘looks like’ two groups.
        </Callout>
      </Step>

      <Step
        kind="try"
        id="try"
        title="Practice: from research question to hypotheses"
        intro="For each example: identify the dependent variable and grouping variable, choose the test, and formulate H₀ and H₁."
      >
        <Practice />
      </Step>

      <Step kind="spss" id="spss" title="SPSS workflows">
        <SpssGuides />
      </Step>

      <Step
        kind="spss"
        id="levene"
        title="Independent t-test: which row do I read?"
        intro="Keep it short: Levene first, then the t-test row it points to."
      >
        <Levene />
      </Step>

      <Step
        kind="understand"
        id="effect"
        title={
          <span className="flex flex-wrap items-center gap-3">
            Significant does not mean large <Pill>Next step / advanced</Pill>
          </span>
        }
        intro="An effect size expresses the difference relative to the spread of the data, so it does not grow with sample size the way significance does."
      >
        <EffectSize />
      </Step>

      <Step kind="test" id="test" title="Mastery check">
        <QuizRunner questions={[qTOne, qTInd, qTPaired, qLevene, qTOutput, qEffectSize]} />
      </Step>
    </ModuleShell>
  );
}

import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { BeforeSpss, SpssOutput } from "@/components/learning/Spss";
import { MathPanel } from "@/components/modules/pvalue/MathPanel";
import { Misconceptions } from "@/components/modules/pvalue/Misconceptions";
import { PValueExplorer } from "@/components/modules/pvalue/PValueExplorer";
import { SampleSizeDemo } from "@/components/modules/pvalue/SampleSizeDemo";
import { StudyComparison } from "@/components/modules/pvalue/StudyComparison";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Callout } from "@/components/ui/Callout";
import { Disclosure } from "@/components/ui/Disclosure";
import { Term } from "@/components/ui/Term";
import { MODULES } from "@/content/modules";
import { qPMeaning, qPN, qPNonSig, qExpected } from "@/content/questions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "p-values" };
const meta = MODULES[3];

export default function Page() {
  return (
    <ModuleShell
      meta={meta}
      lede={
        <>
          The p-value measures how unusual the observed result would be if the <Term k="nullHyp">null hypothesis</Term>{" "}
          were true. Nothing more, and nothing less.
        </>
      }
    >
      <Step
        kind="understand"
        id="understand"
        title="Level 1: intuition"
        intro="Imagine H₀ is true and we drew thousands of samples. The curve shows which test statistics we would typically get. The p-value is the share of those imaginary results that are at least as extreme as ours."
      >
        <PValueExplorer />
        <div className="mt-8">
          <Misconceptions />
        </div>
      </Step>

      <Step
        kind="try"
        id="n"
        title="Same effect, different sample size"
        intro="The p-value depends on two things: how big the difference is and how precisely it is measured. Precision grows with N."
      >
        <SampleSizeDemo />
        <div className="my-10 rounded-2xl bg-ink px-6 py-8 text-center sm:py-10">
          <p className="font-serif text-2xl font-semibold tracking-tight text-bg sm:text-3xl">
            Statistical significance ≠ substantive importance
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-bg/70">
            Significance tells you whether a result is distinguishable from H₀ given your sample size. Whether the
            difference matters is a separate, substantive question answered by effect sizes and subject knowledge.
          </p>
        </div>
        <StudyComparison />
      </Step>

      <Step
        kind="understand"
        id="math"
        title="Level 2: show me the math"
        intro="Optional, but it makes the sample-size effect obvious."
      >
        <Disclosure title="Open the mathematical explanation" defaultOpen={false}>
          <MathPanel />
        </Disclosure>
      </Step>

      <Step
        kind="spss"
        id="spss"
        title="Where the p-value appears in SPSS"
        intro="SPSS never prints the letter p. It prints ‘Sig.’, and it rounds."
      >
        <div className="space-y-6">
          <BeforeSpss
            items={[
              { q: "What is the null hypothesis?", a: "State it before reading any output, e.g. μ = 60 or ‘no association’." },
              { q: "What is α?", a: "Usually .05, decided in advance." },
              { q: "One- or two-tailed?", a: "SPSS reports two-tailed p by default: Sig. (2-tailed)." },
            ]}
          />
          <SpssOutput
            title="One-Sample Test (Test Value = 60)"
            headers={["", "t", "df", "Sig. (2-tailed)", "Mean Difference"]}
            rows={[["Interview length (min)", { v: "2.06", hl: 1 }, "24", { v: ".050", hl: 2 }, { v: "4.00", hl: 3 }]]}
            annotations={{
              1: "The test statistic: the difference measured in standard errors.",
              2: "The p-value. ‘.000’ in SPSS means p < .001; never report p = 0.",
              3: "The effect in original units (minutes). This, not Sig., tells you how big the difference is.",
            }}
          />
          <Callout tone="note" title="Reporting">
            “The mean interview length (M = 64.0, SD = 9.7) did not differ significantly from 60 minutes, t(24) = 2.06,
            p = .050.” At exactly .050 the result is not below α = .05: report the value and avoid treating .049 and .051
            as different worlds.
          </Callout>
        </div>
      </Step>

      <Step kind="test" id="test" title="Mastery check">
        <QuizRunner questions={[qPMeaning, qPNonSig, qPN, qExpected]} />
      </Step>
    </ModuleShell>
  );
}

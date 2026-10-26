import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { BeforeSpss, MenuPath, SpssOutput } from "@/components/learning/Spss";
import { Tex, TexBlock } from "@/components/learning/Tex";
import { TRUST_GROUPS } from "@/components/modules/variance/data";
import { ErrorDance } from "@/components/modules/variance/ErrorDance";
import { MeanPull } from "@/components/modules/variance/MeanPull";
import { ResidualSquares } from "@/components/modules/variance/ResidualSquares";
import { SameMean } from "@/components/modules/variance/SameMean";
import { SpreadPatterns } from "@/components/modules/variance/SpreadPatterns";
import { VarianceSquares } from "@/components/modules/variance/VarianceSquares";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { Callout } from "@/components/ui/Callout";
import { Role } from "@/components/ui/Role";
import { MODULES } from "@/content/modules";
import {
  qVarHetero,
  qVarNoise,
  qVarOutlier,
  qVarResidual,
  qVarSameMean,
  qVarSdUnit,
  qVarWhySquare,
} from "@/content/questions";
import { mean, median, skewness, sd, variance } from "@/lib/stats";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Spread, Variance & Error" };
const meta = MODULES.find((m) => m.slug === "variance")!;

const f2 = (v: number) => v.toFixed(2);

export default function VariancePage() {
  return (
    <ModuleShell
      meta={meta}
      lede={
        <p className="font-serif text-2xl text-ink">
          Averages are intuitive. Why do we need anything else? A visual lab about spread, squares and error.
        </p>
      }
    >
      <Step
        kind="understand"
        id="understand"
        title="The trouble with averages"
        intro="The mean and the median answer one question well: where is the middle? Every method in this course also needs a second answer: how much do cases differ from that middle, and from each other?"
      >
        <div className="space-y-8">
          <SameMean />
          <MeanPull />
          <Callout tone="key" title="Why statistics gets more complicated">
            A centre alone hides <strong>spread</strong> (do people agree?), <strong>shape</strong> (one peak, two
            camps, a long tail?) and <strong>unusual cases</strong>. Every test you have met compares a difference with
            the spread around it: χ² compares observed with expected counts, t divides a mean difference by its standard
            error, F divides between-group by within-group variation. So we need a number for spread, and a picture of the
            whole distribution.
          </Callout>
        </div>
      </Step>

      <Step
        kind="understand"
        id="squares"
        title="Spread as squares"
        intro="Measure how far each observation is from the mean. The deviations always sum to zero, so we square them: each deviation becomes a real square, and spread becomes area."
      >
        <div className="space-y-6">
          <VarianceSquares />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <TexBlock>{String.raw`s^2 = \frac{\sum_i (x_i - \bar{x})^2}{n - 1} = \frac{\text{sum of squares}}{n-1}`}</TexBlock>
              <p className="text-sm text-muted">
                <strong className="text-ink">Variance</strong>: the total area of the squares, shared out over n − 1. It
                is in squared units (books²).
              </p>
            </div>
            <div className="space-y-2">
              <TexBlock>{String.raw`s = \sqrt{s^2}`}</TexBlock>
              <p className="text-sm text-muted">
                <strong className="text-ink">Standard deviation</strong>: the side of the average square, back in the
                original unit (books). Large deviations count disproportionately: a deviation of 8 adds 64, one of 2
                adds only 4.
              </p>
            </div>
          </div>
          <p className="text-sm text-muted">
            Why n − 1 and not n? The deviations are measured from the sample&rsquo;s own mean, which sits exactly in the
            middle of these observations, so they come out slightly too small. Dividing by n − 1 corrects for that; it is
            what SPSS reports.
          </p>
        </div>
      </Step>

      <Step
        kind="understand"
        id="residuals"
        title="Deviations from a prediction: residuals"
        intro="Now measure each person not from the overall mean but from a better guess for them: their group's mean, or a line on X. What is left is the residual, the part of Y the prediction does not account for."
      >
        <div className="space-y-6">
          <ResidualSquares />
          <TexBlock>{String.raw`\underbrace{\sum (y_i-\bar{y})^2}_{\text{total}} \;=\; \underbrace{\sum (\hat{y}_i-\bar{y})^2}_{\text{accounted for}} \;+\; \underbrace{\sum (y_i-\hat{y}_i)^2}_{\text{residual}}`}</TexBlock>
          <p className="text-sm text-muted">
            This split holds when the predictions ŷ come from the least-squares line (or, in ANOVA, from the group
            means). For any other tilt of &ldquo;your line&rdquo; the two parts no longer add up to the total, which is one
            more reason the best line is the one we use.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Callout title="You have seen this split before: ANOVA">
              In <Link href="/anova#try" className="text-accent underline">one-way ANOVA</Link> the prediction for each
              person is their group mean. SS within is the area of the residual squares, SS between is the part the group
              means account for, and η² = SS between ÷ SS total.
            </Callout>
            <Callout title="…and in correlation">
              With a straight line as the prediction, the share accounted for is r². A correlation of{" "}
              <Tex>{"r = .5"}</Tex> means the best line removes only 25% of the squared spread. See the{" "}
              <Link href="/correlation" className="text-accent underline">correlation module</Link>.
            </Callout>
          </div>
        </div>
      </Step>

      <Step
        kind="try"
        id="try"
        title="Error terms: why their spread matters"
        intro="Behind every sample stands a population in which people also differ from the line. That error is invisible; the residuals are our estimate of it. Its spread decides how much one sample can be trusted."
      >
        <div className="space-y-6">
          <ErrorDance />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <TexBlock>{String.raw`SE(b) = \frac{s_{\text{residual}}}{\sqrt{\sum (x_i-\bar{x})^2}}`}</TexBlock>
              <p className="text-sm text-muted">
                Bigger residual spread → bigger standard error. More cases or a wider range of X → smaller standard
                error.
              </p>
            </div>
            <div className="space-y-2">
              <TexBlock>{String.raw`t = \frac{b}{SE(b)}, \qquad SE(\bar{x}) = \frac{s}{\sqrt{n}}`}</TexBlock>
              <p className="text-sm text-muted">
                The same logic as the <Link href="/t-tests" className="text-accent underline">t-tests</Link>: an
                estimate divided by its standard error, which is built from the spread of the data.
              </p>
            </div>
          </div>
        </div>
      </Step>

      <Step
        kind="try"
        id="hetero"
        title="A first look at heteroscedasticity"
        intro="The standard error above uses one residual SD for everyone. That is only fair if the errors are about the same size at every value of X."
      >
        <div className="space-y-6">
          <SpreadPatterns />
          <Callout tone="note" title="The group version is already in your SPSS output">
            In the <Link href="/t-tests" className="text-accent underline">independent-samples t-test</Link>, Levene&rsquo;s
            test asks whether two groups have the same variance, and the &ldquo;Equal variances not assumed&rdquo; (Welch)
            row is the answer when they do not. In <Link href="/anova" className="text-accent underline">ANOVA</Link> the
            homogeneity-of-variance test plays the same role. A funnel in a residual plot is the same issue with a
            continuous X. Handling it formally belongs to regression, later in your studies.
          </Callout>
        </div>
      </Step>

      <Step
        kind="spss"
        id="spss"
        title="Ask SPSS for spread, not just the centre"
        intro="Descriptive output should always pair a centre with a spread, and a picture of the distribution."
      >
        <div className="space-y-6">
          <BeforeSpss
            items={[
              { q: "Which variable?", a: <Role r="Y">trust in parliament 0–10</Role> },
              { q: "Separately by group?", a: <>Yes: <Role r="X">group</Role> as factor</> },
              { q: "Which statistics?", a: "Mean and median for the centre; SD (or variance), minimum, maximum for the spread; skewness for the shape." },
              { q: "Which picture?", a: "Histogram or boxplot per group: the shape is the point." },
            ]}
          />
          <MenuPath path={["Analyze", "Descriptive Statistics", "Explore"]} />
          <SpssOutput
            title="Descriptives: trust (condensed from Explore, synthetic data)"
            headers={["Group", "N", "Mean", "Median", "Variance", "Std. Deviation", "Minimum", "Maximum", "Skewness"]}
            rows={TRUST_GROUPS.map((g, i) => [
              g.label.replace(/^Group (\w):.*/, "$1"),
              String(g.values.length),
              { v: f2(mean(g.values)), hl: i === 0 ? 1 : undefined },
              f2(median(g.values)),
              f2(variance(g.values)),
              { v: f2(sd(g.values)), hl: i === 0 ? 2 : undefined },
              String(Math.min(...g.values)),
              String(Math.max(...g.values)),
              f2(skewness(g.values)),
            ])}
            annotations={{
              1: "Identical means (and medians) in all four groups: the centre does not tell them apart.",
              2: "The SD does: from under 1 point (consensus) to about 4 points (polarised). Skewness flags group D's long right tail.",
            }}
            footnote="Explore also gives a 95% CI for the mean, the interquartile range, kurtosis, histograms and boxplots. In SPSS: Plots → Histogram; Factor List: the group variable."
          />
          <p className="text-sm text-muted">
            Even this table cannot show that group C is split into two camps: the SD is large, but a wide spread and
            two camps can share an SD. Always look at the histogram.
          </p>
        </div>
      </Step>

      <Step kind="test" id="test" title="Mastery check">
        <QuizRunner questions={[qVarSameMean, qVarOutlier, qVarWhySquare, qVarSdUnit, qVarResidual, qVarNoise, qVarHetero]} />
      </Step>
    </ModuleShell>
  );
}

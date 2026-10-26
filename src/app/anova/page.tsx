import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { anova, fmt, LABELS, ORIGINAL } from "@/components/modules/anova/data";
import { VarianceExplorer } from "@/components/modules/anova/VarianceExplorer";
import {
  AnovaDerivation,
  CorrelationDerivation,
  CramerDerivation,
  SymbolKey,
} from "@/components/modules/anova/Derivations";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { MODULES } from "@/content/modules";
import {
  qAnovaEta,
  qAnovaGrandMean,
  qAnovaLargeN,
  qAnovaPaired,
  qAnovaTwoWay,
  qAnovaWithinZero,
} from "@/content/questions";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "ANOVA" };
const meta = MODULES.find((m) => m.slug === "anova")!;

const baseline = anova(ORIGINAL);

export default function AnovaPage() {
  return (
    <ModuleShell
      meta={meta}
      lede={<p className="font-serif text-2xl text-ink">Slow down and calculate: what ANOVA compares, step by step.</p>}
    >
      <Step kind="understand" id="understand" title="One question behind every method"
        intro="How different is what we observe from what we would expect if the pattern were absent?">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Crosstab", "Observed counts versus expected counts under independence.", "χ² and Cramér’s V"],
            ["Correlation", "Two variables moving together, relative to their own spread.", "Pearson r; Spearman ρ"],
            ["ANOVA", "Distance between group means, relative to variation within groups.", "F; η²"],
          ].map(([head, sub, metric]) => (
            <div className="rounded-xl border border-line bg-surface p-5" key={head}>
              <h3 className="tracking-tight text-xl font-semibold text-ink">{head}</h3>
              <p className="mt-3 text-sm text-muted">{sub}</p>
              <p className="mt-4 text-xs font-semibold text-accent">{metric}</p>
            </div>
          ))}
        </div>
      </Step>

      <Step kind="understand" id="foundations" title="First: the math behind last week&rsquo;s methods"
        intro="Every number below is calculated step by step, with the reason for each step in words. These are small constructed teaching datasets, not findings from the homework.">
        <div className="space-y-12">
          <SymbolKey />
          <CramerDerivation />
          <CorrelationDerivation />
        </div>
      </Step>

      <Step kind="try" id="try" title="Now derive ANOVA from eleven observations"
        intro="Eleven people in three groups, as in the calculation video. Follow the nine steps with pen and paper: each one says what we calculate and why.">
        <div className="grid gap-4 md:grid-cols-3">
          {ORIGINAL.map((xs, j) => (
            <div className="rounded-xl border border-line bg-surface p-5" key={j}>
              <p className="font-semibold text-ink">{LABELS[j]}</p>
              <p className="mt-2 font-mono text-sm text-muted">{xs.join(", ")}</p>
              <p className="mt-4 text-sm text-ink">n = {xs.length}</p>
            </div>
          ))}
        </div>
        <h3 className="sr-only">The step-by-step derivation</h3>
        <AnovaDerivation />
        <h3 className="tracking-tight mt-14 mb-4 text-xl font-semibold text-ink">Now change the data</h3>
        <VarianceExplorer />
        <p className="mt-4 text-xs text-muted">Live recalculation of the original data: F = {fmt(baseline.f,3)}, η² = {fmt(baseline.eta,3)}.</p>
      </Step>

      <Step kind="spss" id="spss" title="Translate the calculation into an SPSS decision"
        intro="Before pressing Analyze, identify the outcome, factor, observational unit and relevant assumptions.">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-surface p-5">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-ink">
              <li>Scale outcome (Y) and one categorical group variable (X): <strong>one-way ANOVA</strong>.</li>
              <li>SPSS: Analyze → Compare Means → One-Way ANOVA. Request Descriptives, homogeneity of variance, and Welch.</li>
              <li>Check sample sizes, missing-value codes, outliers, independence and the within-group distribution.</li>
              <li>Use Levene as a diagnostic, not as proof of equal variances. If group variances differ materially, Welch&rsquo;s ANOVA is a useful alternative.</li>
              <li>An omnibus significant result says at least one group mean differs; use suitable post-hoc comparisons to locate differences (e.g. Tukey for the standard setting, Games–Howell under unequal variances).</li>
              <li>Report the means, N, F or Welch test, degrees of freedom, p, and an appropriate effect size.</li>
            </ol>
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-5">
            <h3 className="font-semibold text-ink">Do not mix up these four designs</h3>
            <div className="mt-3 space-y-2 text-sm text-muted">
              <p><strong className="text-ink">Independent t-test:</strong> two independent groups, one outcome.</p>
              <p><strong className="text-ink">Paired t-test:</strong> two measurements of the same people (or matched pairs).</p>
              <p><strong className="text-ink">One-way ANOVA:</strong> one grouping factor, typically three or more independent groups (two also works).</p>
              <p><strong className="text-ink">Two-way ANOVA:</strong> two grouping factors; evaluates main effects and potentially their interaction.</p>
              <p><strong className="text-ink">Full sample vs subsamples:</strong> a stratified/control-variable analysis, not the definition of one-way versus two-way ANOVA.</p>
            </div>
          </div>
          <p className="text-sm text-muted">A non-significant Levene test does not prove homoscedasticity. Overlapping separate 95% group-mean confidence intervals are not a reliable substitute for an adjusted pairwise comparison. Keep inference separate from effect size and causal claims.</p>
        </div>
      </Step>

      <Step kind="test" id="test" title="Exit ticket: explain, don’t just calculate">
        <QuizRunner questions={[qAnovaGrandMean, qAnovaWithinZero, qAnovaEta, qAnovaLargeN, qAnovaPaired, qAnovaTwoWay]} />
        <p className="mt-6 text-sm text-muted">For extra interactive exercises, revisit <Link className="text-accent underline" href="/crosstabs">crosstabs</Link>, <Link className="text-accent underline" href="/correlation">correlation</Link>, or <Link className="text-accent underline" href="/t-tests">t-tests</Link>.</p>
      </Step>
    </ModuleShell>
  );
}

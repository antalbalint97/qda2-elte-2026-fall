import { ModuleShell, Step } from "@/components/learning/ModuleShell";
import { anova, fmt, LABELS, mean, ORIGINAL } from "@/components/modules/anova/data";
import { VarianceExplorer } from "@/components/modules/anova/VarianceExplorer";
import { Working } from "@/components/modules/anova/Working";
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
const meta = MODULES[6];

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
              <h3 className="font-serif text-xl font-semibold text-ink">{head}</h3>
              <p className="mt-3 text-sm text-muted">{sub}</p>
              <p className="mt-4 text-xs font-semibold text-accent">{metric}</p>
            </div>
          ))}
        </div>
      </Step>

      <Step kind="understand" id="foundations" title="First: the math behind last week&rsquo;s methods"
        intro="Use the same small examples before opening SPSS. These are constructed teaching datasets, not findings from the homework.">
        <div className="space-y-9">
          <section>
            <h3 className="font-serif text-xl font-semibold text-ink">A. From row percentages to Cramér&rsquo;s V</h3>
            <p className="mt-2 text-muted">Sixty students: in the low, medium and high study groups, 8/20, 12/20 and 16/20 pass. The pass rates are 40%, 60% and 80%.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[370px] text-sm text-ink">
                <thead><tr className="border-b border-line text-left"><th className="p-2">Study intensity</th><th>Failed</th><th>Passed</th><th>Pass rate</th></tr></thead>
                <tbody>{[["Low",12,8,"40%"],["Medium",8,12,"60%"],["High",4,16,"80%"]].map(row => (
                  <tr className="border-b border-line" key={row[0]}>{row.map((v,i)=><td className="p-2" key={i}>{v}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
            <Working>E(Low, Failed) = (20 × 24) / 60 = 8<br />χ² = Σ (Observed − Expected)² / Expected = 6.667<br />df = (3 − 1)(2 − 1) = 2; p ≈ .036<br />V = √(χ² / (60 × 1)) = .333</Working>
            <p className="text-sm text-muted">The p-value tests independence. V describes association strength; it does not tell us which category is higher. Row percentages give direction in this specific ordered example.</p>
          </section>
          <section>
            <h3 className="font-serif text-xl font-semibold text-ink">B. Pearson and Spearman are not mysterious</h3>
            <p className="mt-2 text-muted">Six students have study hours 1, 2, 3, 4, 5, 6 and exam scores 50, 52, 61, 59, 68, 75. Pearson works on the original numbers. Spearman works on ranks.</p>
            <Working>mean(hours) = 3.5; mean(score) = 60.833<br />Σ(x − x̄)(y − ȳ) = 85.5<br />Σ(x − x̄)² = 17.5; Σ(y − ȳ)² = 450.833<br />r = 85.5 / √(17.5 × 450.833) ≈ .963</Working>
            <p className="text-sm text-muted">Score ranks are 1, 2, 4, 3, 5, 6. With no ties, only the third and fourth ranks are exchanged.</p>
            <Working>Σ(rank difference)² = 2<br />ρ = 1 − (6 × 2) / (6 × (6² − 1)) ≈ .943</Working>
            <p className="text-sm text-muted">Both show a strong positive association here, but correlation is not proof of causation. Always inspect the scatterplot and the variable coding.</p>
          </section>
        </div>
      </Step>

      <Step kind="try" id="try" title="Now derive ANOVA from eleven observations"
        intro="Start with the three groups from the calculation video. Before seeing a test result, calculate how far observations are from their own group mean and from the grand mean.">
        <div className="grid gap-4 md:grid-cols-3">
          {ORIGINAL.map((xs,j)=>(
            <div className="rounded-xl border border-line bg-surface p-5" key={j}>
              <p className="font-semibold text-ink">{LABELS[j]}</p>
              <p className="mt-2 font-mono text-sm text-muted">{xs.join(", ")}</p>
              <p className="mt-4 text-sm text-ink">n = {xs.length}; mean = {fmt(mean(xs))}</p>
            </div>
          ))}
        </div>
        <Working>Grand mean = (sum of all eleven values) / 11 = 34.909<br />
          For observation 45: (45 − 58)² = 169 (within)<br />
          For observation 45: (45 − 34.909)² ≈ 101.826 (total)<br />
          For Group 1: 4 × (58 − 34.909)² ≈ 2132.760 (between)</Working>
        <Working>SS Total = Σ(yᵢ − grand mean)² = 3988.909<br />
          SS Within = Σ(yᵢ − group mean)² = 520.750<br />
          SS Between = Σnⱼ(group meanⱼ − grand mean)² = 3468.159<br />
          3988.909 = 520.750 + 3468.159</Working>
        <Working>df Between = 3 − 1 = 2; df Within = 11 − 3 = 8<br />
          MS Between = 3468.159 / 2 = 1734.080<br />
          MS Within = 520.750 / 8 = 65.094<br />
          F = 1734.080 / 65.094 ≈ 26.640<br />
          η² = 3468.159 / 3988.909 ≈ 0.869</Working>
        <p className="mb-6 text-sm text-muted">For the original numbers, the classical F(2, 8) test yields p ≈ .00029 (under its assumptions). η² ≈ .869 says roughly 86.9% of this sample&rsquo;s total sum of squared deviations is between groups; it is not evidence of a causal effect.</p>
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

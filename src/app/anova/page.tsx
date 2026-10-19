"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ModuleShell, Panel, Step } from "@/components/learning/ModuleShell";
import { MODULES } from "@/content/modules";

const ORIGINAL = [
  [45, 61, 53, 73],
  [20, 14, 17],
  [22, 32, 26, 21],
];
const LABELS = ["Group 1", "Group 2", "Group 3"];
const COLORS = ["var(--x)", "var(--y)", "var(--z)"];

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function sumSquares(xs: number[], m: number): number {
  return xs.reduce((s, x) => s + (x - m) ** 2, 0);
}
function calculate(groups: number[][]) {
  const all = groups.flat();
  const overall = mean(all);
  const means = groups.map(mean);
  const within = groups.reduce((s, xs, j) => s + sumSquares(xs, means[j]), 0);
  const between = groups.reduce((s, xs, j) => s + xs.length * (means[j] - overall) ** 2, 0);
  const total = sumSquares(all, overall);
  const dfBetween = groups.length - 1;
  const dfWithin = all.length - groups.length;
  const msBetween = between / dfBetween;
  const msWithin = within / dfWithin;
  return {
    overall, means, within, between, total, dfBetween, dfWithin,
    msBetween, msWithin, f: msWithin > 0 ? msBetween / msWithin : Infinity,
    eta: total > 0 ? between / total : 0,
  };
}
function n(x: number, digits = 2) {
  return x.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function VarianceExplorer() {
  const [gap, setGap] = useState(0);
  const [spread, setSpread] = useState(1);
  const groups = useMemo(
    () => ORIGINAL.map((xs, j) => {
      const center = mean(xs);
      const shift = j === 0 ? gap : j === 1 ? -gap : 0;
      return xs.map(x => center + (x - center) * spread + shift);
    }),
    [gap, spread],
  );
  const r = calculate(groups);
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold text-ink">Move the groups. Watch the sums of squares.</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">The initial values reproduce the 11 observations in the ANOVA calculation video. Changing the sliders creates a teaching simulation, not new survey data.</p>
        </div>
        <button type="button" onClick={() => { setGap(0); setSpread(1); }}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink hover:bg-surface-2">Reset</button>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label htmlFor="gap" className="block text-sm font-medium text-ink">
          Group separation: {gap > 0 ? "+" : ""}{gap}
          <input id="gap" aria-label="Group separation" type="range" className="range mt-3"
            min={-14} max={14} step={1} value={gap} onChange={e => setGap(Number(e.target.value))} />
          <span className="block text-xs font-normal text-muted">Moves Group 1 up and Group 2 down.</span>
        </label>
        <label htmlFor="spread" className="block text-sm font-medium text-ink">
          Within-group spread: {n(spread, 1)}×
          <input id="spread" aria-label="Within-group spread" type="range" className="range mt-3"
            min={0.2} max={2} step={0.1} value={spread} onChange={e => setSpread(Number(e.target.value))} />
          <span className="block text-xs font-normal text-muted">Moves individuals towards / away from their group mean.</span>
        </label>
      </div>
      <svg className="mt-5 w-full" viewBox="0 0 600 240" role="img"
        aria-label="Dot plot of three groups, each with individual observations and a horizontal mean line">
        {[0, 20, 40, 60, 80, 100].map(v => (
          <g key={v}>
            <line x1="44" x2="584" y1={202 - v * 1.75} y2={202 - v * 1.75} stroke="var(--grid)" />
            <text x="36" y={206 - v * 1.75} textAnchor="end" fontSize="12" fill="var(--muted)">{v}</text>
          </g>
        ))}
        {groups.map((xs, j) => {
          const cx = 140 + j * 170;
          const cy = 202 - r.means[j] * 1.75;
          return (
            <g key={j}>
              {xs.map((v, i) => <circle key={i} cx={cx + (i % 2 === 0 ? -13 : 13)}
                cy={202 - v * 1.75} r={6} fill={COLORS[j]} opacity={0.85} />)}
              <line x1={cx - 35} x2={cx + 35} y1={cy} y2={cy}
                stroke={COLORS[j]} strokeWidth={3.5} strokeLinecap="round" />
              <text x={cx} y="227" textAnchor="middle" fontSize="13" fill="var(--ink)">{LABELS[j]}</text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-muted">Dots = observations; thick lines = group means. The grand mean is {n(r.overall)}.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Within SS", n(r.within)],
          ["Between SS", n(r.between)],
          ["F (df 2, 8)", n(r.f)],
          ["Eta squared", n(r.eta, 3)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[400px] border-collapse text-left text-sm">
          <thead><tr className="border-b border-line text-muted">
            <th className="py-2">Source</th><th>SS</th><th>df</th><th>MS</th>
          </tr></thead>
          <tbody className="text-ink">
            <tr className="border-b border-line"><td className="py-2">Between groups</td>
              <td>{n(r.between)}</td><td>{r.dfBetween}</td><td>{n(r.msBetween)}</td></tr>
            <tr className="border-b border-line"><td className="py-2">Within groups</td>
              <td>{n(r.within)}</td><td>{r.dfWithin}</td><td>{n(r.msWithin)}</td></tr>
            <tr><td className="py-2">Total</td><td>{n(r.total)}</td>
              <td>{r.dfBetween + r.dfWithin}</td><td>—</td></tr>
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">
        Check the identity: {n(r.within)} + {n(r.between)} = {n(r.total)}.
        When within-group scatter grows, F generally shrinks. When group means separate, between-group variation grows.
        This animation does not calculate p-values; the classical F test additionally requires its assumptions.
      </p>
    </Panel>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return <div className="my-4 overflow-x-auto rounded-xl border border-line bg-surface-2 px-4 py-3 font-mono text-sm leading-7 text-ink">{children}</div>;
}

const baseline = calculate(ORIGINAL);

export default function AnovaPage() {
  return (
    <ModuleShell meta={MODULES[6]} lede={<>Slow down and calculate. This lab connects crosstabs, correlation, variance decomposition and the logic of a one-way ANOVA.</>}>
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

      <Step kind="understand" id="foundations" title="First: the math behind last week's methods"
        intro="Use the same small examples before opening SPSS. These are constructed teaching datasets, not findings from the homework.">
        <div className="space-y-9">
          <section>
            <h3 className="font-serif text-xl font-semibold text-ink">A. From row percentages to Cramér's V</h3>
            <p className="mt-2 text-muted">Sixty students: in the low, medium and high study groups, 8/20, 12/20 and 16/20 pass. The pass rates are 40%, 60% and 80%.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[370px] text-sm text-ink">
                <thead><tr className="border-b border-line text-left"><th className="p-2">Study intensity</th><th>Failed</th><th>Passed</th><th>Pass rate</th></tr></thead>
                <tbody>{[["Low",12,8,"40%"],["Medium",8,12,"60%"],["High",4,16,"80%"]].map(row => (
                  <tr className="border-b border-line" key={row[0]}>{row.map((v,i)=><td className="p-2" key={i}>{v}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
            <Formula>E(Low, Failed) = (20 × 24) / 60 = 8<br />χ² = Σ (Observed − Expected)² / Expected = 6.667<br />df = (3 − 1)(2 − 1) = 2; p ≈ .036<br />V = √(χ² / (60 × 1)) = .333</Formula>
            <p className="text-sm text-muted">The p-value tests independence. V describes association strength; it does not tell us which category is higher. Row percentages give direction in this specific ordered example.</p>
          </section>
          <section>
            <h3 className="font-serif text-xl font-semibold text-ink">B. Pearson and Spearman are not mysterious</h3>
            <p className="mt-2 text-muted">Six students have study hours 1, 2, 3, 4, 5, 6 and exam scores 50, 52, 61, 59, 68, 75. Pearson works on the original numbers. Spearman works on ranks.</p>
            <Formula>mean(hours) = 3.5; mean(score) = 60.833<br />Σ(x − x̄)(y − ȳ) = 85.5<br />Σ(x − x̄)² = 17.5; Σ(y − ȳ)² = 450.833<br />r = 85.5 / √(17.5 × 450.833) ≈ .963</Formula>
            <p className="text-sm text-muted">Score ranks are 1, 2, 4, 3, 5, 6. With no ties, only the third and fourth ranks are exchanged.</p>
            <Formula>Σ(rank difference)² = 2<br />ρ = 1 − (6 × 2) / (6 × (6² − 1)) ≈ .943</Formula>
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
              <p className="mt-4 text-sm text-ink">n = {xs.length}; mean = {n(mean(xs))}</p>
            </div>
          ))}
        </div>
        <Formula>Grand mean = (sum of all eleven values) / 11 = 34.909<br />
          For observation 45: (45 − 58)² = 169 (within)<br />
          For observation 45: (45 − 34.909)² ≈ 101.826 (total)<br />
          For Group 1: 4 × (58 − 34.909)² ≈ 2132.760 (between)</Formula>
        <Formula>SS Total = Σ(yᵢ − grand mean)² = 3988.909<br />
          SS Within = Σ(yᵢ − group mean)² = 520.750<br />
          SS Between = Σnⱼ(group meanⱼ − grand mean)² = 3468.159<br />
          3988.909 = 520.750 + 3468.159</Formula>
        <Formula>df Between = 3 − 1 = 2; df Within = 11 − 3 = 8<br />
          MS Between = 3468.159 / 2 = 1734.080<br />
          MS Within = 520.750 / 8 = 65.094<br />
          F = 1734.080 / 65.094 ≈ 26.640<br />
          η² = 3468.159 / 3988.909 ≈ 0.869</Formula>
        <p className="mb-6 text-sm text-muted">For the original numbers, the classical F(2, 8) test yields p ≈ .00029 (under its assumptions). η² ≈ .869 says roughly 86.9% of this sample's total sum of squared deviations is between groups; it is not evidence of a causal effect.</p>
        <VarianceExplorer />
        <p className="mt-4 text-xs text-muted">Baseline verified independently: F = {n(baseline.f,3)}, η² = {n(baseline.eta,3)}.</p>
      </Step>

      <Step kind="spss" id="spss" title="Translate the calculation into an SPSS decision"
        intro="Before pressing Analyze, identify the outcome, factor, observational unit and relevant assumptions.">
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-surface p-5">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-ink">
              <li>Scale outcome (Y) and one categorical group variable (X): <strong>one-way ANOVA</strong>.</li>
              <li>SPSS: Analyze → Compare Means → One-Way ANOVA. Request Descriptives, homogeneity of variance, and Welch.</li>
              <li>Check sample sizes, missing-value codes, outliers, independence and the within-group distribution.</li>
              <li>Use Levene as a diagnostic, not as proof of equal variances. If group variances differ materially, Welch's ANOVA is a useful alternative.</li>
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

      <Step kind="test" id="test" title="Exit ticket: explain, don't just calculate">
        <div className="rounded-xl border border-line bg-surface p-6">
          <ol className="list-decimal space-y-3 pl-5 text-ink">
            <li>Why is the overall average not the same as a group's average?</li>
            <li>What would SS Within equal if every group contained identical observations?</li>
            <li>How could η² be large without proving that X caused Y?</li>
            <li>Why can a tiny correlation have p &lt; .001 in a very large sample?</li>
            <li>When comparing air-pollution ratings for cars and industry from the same people, why use a paired t-test rather than one-way ANOVA?</li>
            <li>What extra question can a two-way ANOVA answer that a one-way ANOVA cannot?</li>
          </ol>
        </div>
        <p className="mt-6 text-sm text-muted">For extra interactive exercises, revisit <Link className="text-accent underline" href="/crosstabs">crosstabs</Link>, <Link className="text-accent underline" href="/correlation">correlation</Link>, or <Link className="text-accent underline" href="/t-tests">t-tests</Link>.</p>
      </Step>
    </ModuleShell>
  );
}

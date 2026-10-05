"use client";

import { Slider } from "@/components/ui/Slider";
import { DistributionChart } from "@/components/viz/DistributionChart";
import { formatP, gaussian, mulberry32, tPdf, tTwoTailedP, chiSquareTest } from "@/lib/stats";
import { setAdvancedCompleted, useProgress } from "@/lib/progress";
import { useMemo, useState, type ReactNode } from "react";

const TOPICS = [
  ["residuals", "Residuals: where does χ² come from?"],
  ["pairwise", "Pairwise follow-ups"],
  ["trend", "Trend vs association"],
  ["weights", "Survey weights"],
  ["pre-gamma", "Lambda, PRE and Gamma"],
  ["chooser", "Choose the measure"],
  ["pvalue", "p-value: go deeper"],
  ["spss", "Reproducible SPSS"],
] as const;

type TopicId = (typeof TOPICS)[number][0];

export function AdvancedLab() {
  const progress = useProgress();
  const completed = progress.advancedCompleted ?? [];

  return (
    <div className="space-y-16">
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">Progress</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Advanced exploration</h2>
            <p className="mt-2 text-sm text-muted">No extra grade. Core course mastery remains separate.</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold tabular-nums text-ink">{completed.length} / {TOPICS.length}</div>
            <div className="text-xs text-faint">Curious enough to click further.</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-1 sm:grid-cols-8" aria-label="Advanced topics completed">
          {TOPICS.map(([id, title]) => (
            <a
              key={id}
              href={`#${id}`}
              title={title}
              className={`h-2 rounded-full ${completed.includes(id) ? "bg-pos" : "bg-surface-3"}`}
            />
          ))}
        </div>
      </section>

      <Residuals />
      <Pairwise />
      <Trend />
      <Weights />
      <PreGamma />
      <MeasureChooser />
      <PValueDeep />
      <ReproducibleSpss />
    </div>
  );
}

function OptionalSection({
  id,
  title,
  children,
}: {
  id: TopicId;
  title: string;
  children: ReactNode;
}) {
  const progress = useProgress();
  const done = (progress.advancedCompleted ?? []).includes(id);

  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Optional / advanced</p>
          <h2 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            You do not need this for the basic task. This section explains what some of your classmates already explored.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdvancedCompleted(id, !done)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            done ? "border-pos/30 bg-pos-soft text-pos" : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink"
          }`}
        >
          {done ? "✓ Explored" : "Mark explored"}
        </button>
      </div>
      {children}
    </section>
  );
}

const OBS = [
  [42, 18],
  [31, 29],
  [20, 40],
];

function Residuals() {
  const result = chiSquareTest(OBS);
  const rowTotals = OBS.map((r) => r.reduce((a, b) => a + b, 0));
  const colTotals = OBS[0].map((_, j) => OBS.reduce((s, r) => s + r[j], 0));
  const labels = ["18–29", "30–49", "50+"];

  const asr = OBS.map((row, i) =>
    row.map((o, j) => {
      const e = result.expected[i][j];
      return (o - e) / Math.sqrt(e * (1 - rowTotals[i] / result.n) * (1 - colTotals[j] / result.n));
    }),
  );

  return (
    <OptionalSection id="residuals" title="From omnibus χ² to cell-level interpretation">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-4 sm:p-6">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-faint">
                <th className="pb-3 pr-3 font-medium">Age</th>
                <th className="pb-3 px-3 font-medium">Outcome: Yes</th>
                <th className="pb-3 pl-3 font-medium">Outcome: No</th>
              </tr>
            </thead>
            <tbody>
              {OBS.map((row, i) => (
                <tr key={labels[i]} className="border-b border-line last:border-0">
                  <th className="py-4 pr-3 text-left font-medium text-ink">{labels[i]}</th>
                  {row.map((o, j) => {
                    const e = result.expected[i][j];
                    const r = o - e;
                    const z = asr[i][j];
                    const unusual = Math.abs(z) >= 1.96;
                    return (
                      <td key={j} className="px-3 py-4 align-top">
                        <div className={`rounded-xl p-3 ${unusual ? "bg-accent-soft" : "bg-surface-2"}`}>
                          <div className="font-mono text-base font-semibold text-ink">O = {o}</div>
                          <div className="mt-1 font-mono text-xs text-muted">E = {e.toFixed(1)}</div>
                          <div className="font-mono text-xs text-muted">Residual = {r.toFixed(1)}</div>
                          <div className={`mt-2 font-mono text-sm font-semibold ${z > 0 ? "text-pos" : "text-neg"}`}>
                            ASR = {z.toFixed(2)}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-ink">Read the workflow in order</p>
            <ol className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
              <li><strong className="text-ink">χ²:</strong> something differs somewhere in the table.</li>
              <li><strong className="text-ink">Cramer’s V:</strong> how strong is the overall association?</li>
              <li><strong className="text-ink">Percentages:</strong> what is the descriptive pattern?</li>
              <li><strong className="text-ink">Residuals:</strong> which cells depart most from independence?</li>
            </ol>
            <div className="mt-4 rounded-lg bg-surface-2 p-3 font-mono text-xs leading-6 text-ink">
              χ²({result.df}) = {result.chi2.toFixed(2)}<br />
              p {formatP(result.p)}<br />
              Cramer’s V = {result.cramersV.toFixed(2)}
            </div>
          </div>
          <div className="rounded-2xl border border-warn/30 bg-warn-soft p-5 text-sm leading-relaxed text-muted">
            <strong className="text-ink">±1.96 is a heuristic, not a magic switch.</strong> An adjusted standardized residual
            near zero means observed ≈ expected. Large positive values mean more cases than expected; large negative values
            mean fewer. Looking across many cells creates a multiple-comparisons issue, so do not label every positive or
            negative residual “important.”
          </div>
        </div>
      </div>
    </OptionalSection>
  );
}

const AGE_ROWS = [
  ["18–29", 55, 45],
  ["30–39", 40, 60],
  ["40–49", 42, 58],
  ["50–59", 30, 70],
  ["60+", 18, 82],
] as const;

function Pairwise() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(4);
  const table = [
    [AGE_ROWS[a][1], AGE_ROWS[a][2]],
    [AGE_ROWS[b][1], AGE_ROWS[b][2]],
  ];
  const result = a === b ? null : chiSquareTest(table);

  return (
    <OptionalSection id="pairwise" title="Pairwise / 2×2 follow-up comparisons">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-sm font-semibold text-ink">Start with the 5×2 table</p>
          <div className="mt-4 space-y-3">
            {AGE_ROWS.map(([label, yes]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-xs text-muted"><span>{label}</span><span>{yes}% Yes</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${yes}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-sm font-semibold text-ink">Select two categories</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <select value={a} onChange={(e) => setA(Number(e.target.value))} className="rounded-lg border border-line bg-bg p-2 text-sm text-ink">
              {AGE_ROWS.map(([label], i) => <option value={i} key={label}>{label}</option>)}
            </select>
            <select value={b} onChange={(e) => setB(Number(e.target.value))} className="rounded-lg border border-line bg-bg p-2 text-sm text-ink">
              {AGE_ROWS.map(([label], i) => <option value={i} key={label}>{label}</option>)}
            </select>
          </div>
          {result ? (
            <div className="mt-5 rounded-xl bg-surface-2 p-4">
              <div className="font-mono text-sm leading-7 text-ink">
                {AGE_ROWS[a][0]} vs {AGE_ROWS[b][0]}<br />
                χ²(1) = {result.chi2.toFixed(2)}<br />
                p {formatP(result.p)}
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-neg">Choose two different categories.</p>
          )}
          <p className="mt-5 text-sm leading-relaxed text-muted">
            A significant larger table does not tell you which pairs differ. A focused 2×2 follow-up can help, but repeated
            testing raises false-positive risk. Prefer hypothesis-driven comparisons over “test every pair until something
            is significant.” Multiple-testing correction is an optional next step, not a basic requirement here.
          </p>
        </div>
      </div>
    </OptionalSection>
  );
}

const TREND_SETS = {
  "Strictly monotonic": [55, 46, 38, 29, 18],
  "Broadly decreasing": [55, 40, 42, 30, 18],
  "U-shaped": [50, 34, 24, 35, 52],
  "No clear trend": [34, 51, 29, 47, 38],
} as const;

function Trend() {
  const [kind, setKind] = useState<keyof typeof TREND_SETS>("Broadly decreasing");
  const vals = TREND_SETS[kind];
  const strictly = vals.every((v, i) => i === 0 || v < vals[i - 1]);

  return (
    <OptionalSection id="trend" title="Trend vs association">
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TREND_SETS) as Array<keyof typeof TREND_SETS>).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={`rounded-full px-3 py-1.5 text-sm ${kind === k ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}>
              {k}
            </button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-5 items-end gap-3" style={{ height: 220 }}>
          {vals.map((v, i) => (
            <div key={AGE_ROWS[i][0]} className="flex h-full flex-col justify-end text-center">
              <div className="mb-1 font-mono text-xs text-muted">{v}%</div>
              <div className="mx-auto w-full max-w-16 rounded-t bg-accent" style={{ height: `${v * 2.5}px` }} />
              <div className="mt-2 text-[11px] text-faint">{AGE_ROWS[i][0]}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl bg-surface-2 p-4 text-sm leading-relaxed text-muted">
          <strong className="text-ink">Is this strictly monotonic?</strong> {strictly ? "Yes." : "No."}
          {kind === "Broadly decreasing" && (
            <> The overall tendency is downward, but 40% → 42% is a local reversal. “Broadly decreasing” is more precise than “monotonic.”</>
          )}
        </div>
      </div>
    </OptionalSection>
  );
}

const RESPONDENTS = [
  { id: "A", group: "Urban", yes: true, weight: 0.7 },
  { id: "B", group: "Urban", yes: true, weight: 0.8 },
  { id: "C", group: "Urban", yes: false, weight: 0.8 },
  { id: "D", group: "Rural", yes: false, weight: 1.6 },
  { id: "E", group: "Rural", yes: false, weight: 1.5 },
  { id: "F", group: "Rural", yes: true, weight: 1.6 },
];

function Weights() {
  const unweightedYes = RESPONDENTS.filter((r) => r.yes).length / RESPONDENTS.length;
  const weightedN = RESPONDENTS.reduce((s, r) => s + r.weight, 0);
  const weightedYes = RESPONDENTS.filter((r) => r.yes).reduce((s, r) => s + r.weight, 0) / weightedN;

  return (
    <OptionalSection id="weights" title="Survey weights: who does each case represent?">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-5">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-faint"><tr><th className="pb-3">Case</th><th>Group</th><th>Outcome</th><th>Weight</th></tr></thead>
            <tbody>
              {RESPONDENTS.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="py-3 font-mono text-ink">{r.id}</td><td>{r.group}</td><td>{r.yes ? "Yes" : "No"}</td>
                  <td><span className="inline-block rounded bg-accent-soft px-2 py-1 font-mono text-accent">{r.weight.toFixed(1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Unweighted" value={`${(unweightedYes * 100).toFixed(1)}%`} sub="each respondent = 1" />
            <Metric label="Weighted" value={`${(weightedYes * 100).toFixed(1)}%`} sub={`weighted N = ${weightedN.toFixed(1)}`} />
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5 text-sm leading-relaxed text-muted">
            <p className="font-semibold text-ink">Ask before weighting</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>What population are we trying to describe?</li>
              <li>What does the weight represent?</li>
              <li>Was weighting intended for this analysis?</li>
            </ul>
          </div>
          <pre className="overflow-x-auto rounded-2xl bg-surface-2 p-5 font-mono text-xs leading-6 text-ink">{`WEIGHT BY dweight.
CROSSTABS ...
WEIGHT OFF.`}</pre>
          <p className="text-sm leading-relaxed text-muted">
            In SPSS: <strong className="text-ink">Data → Weight Cases</strong>. Weight status can remain active and silently
            affect later N, percentages and estimates. Reproducibility rule: always know whether weighting is active.
          </p>
        </div>
      </div>
    </OptionalSection>
  );
}

function PreGamma() {
  const [before, setBefore] = useState(40);
  const [after, setAfter] = useState(30);
  const [c, setC] = useState(70);
  const [d, setD] = useState(30);
  const lambda = before > 0 ? Math.max(0, Math.min(1, (before - after) / before)) : 0;
  const gamma = c + d > 0 ? (c - d) / (c + d) : 0;

  return (
    <OptionalSection id="pre-gamma" title="Lambda, PRE and Gamma">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="font-semibold text-ink">Lambda = proportional reduction in error</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">First predict Y without knowing X. Then predict Y using X. Count how many classification errors remain.</p>
          <div className="mt-5 space-y-4">
            <Slider label="Errors without X" value={before} min={10} max={80} onChange={setBefore} />
            <Slider label="Errors with X" value={after} min={0} max={80} onChange={setAfter} />
          </div>
          <div className="mt-5 rounded-xl bg-surface-2 p-4">
            <div className="font-mono text-sm text-ink">PRE = ({before} − {after}) / {before} = {lambda.toFixed(2)}</div>
            <p className="mt-2 text-sm text-muted">Knowing X reduces prediction error for Y by {(lambda * 100).toFixed(0)}%.</p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted"><strong className="text-ink">Cramer’s V</strong> describes overall association strength. <strong className="text-ink">Lambda</strong> describes prediction-error reduction. They are not interchangeable.</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="font-semibold text-ink">Gamma = direction among ordered pairs</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">For ordinal variables, concordant pairs move in the same direction; discordant pairs move in opposite directions.</p>
          <div className="mt-5 space-y-4">
            <Slider label="Concordant pairs" value={c} min={0} max={100} onChange={setC} />
            <Slider label="Discordant pairs" value={d} min={0} max={100} onChange={setD} />
          </div>
          <div className="mt-5 rounded-xl bg-surface-2 p-4">
            <div className="font-mono text-sm text-ink">Gamma = (C − D) / (C + D) = {gamma.toFixed(2)}</div>
            <p className="mt-2 text-sm text-muted">{gamma > 0.1 ? "Higher X tends to occur with higher Y." : gamma < -0.1 ? "Higher X tends to occur with lower Y." : "Little directional ordering."}</p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">A variable is not ordinal merely because its categories happen to be coded 1 and 2. Ask: <strong className="text-ink">are the categories substantively ordered?</strong></p>
        </div>
      </div>
    </OptionalSection>
  );
}

const CHOOSER = {
  nominal: { label: "Nominal × nominal", answer: "Cramer’s V", extra: "Lambda can be useful if prediction is substantively meaningful." },
  ordinal: { label: "Ordinal × ordinal", answer: "Gamma / Spearman", extra: "Choose based on the data structure and whether the question is about ordered association or ranks." },
  scale: { label: "Scale × scale", answer: "Pearson / Spearman", extra: "Pearson targets linear association; Spearman targets monotonic rank association." },
} as const;

function MeasureChooser() {
  const [choice, setChoice] = useState<keyof typeof CHOOSER>("nominal");
  const [challenge, setChallenge] = useState<string | null>(null);

  return (
    <OptionalSection id="chooser" title="Choosing association measures">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-sm font-semibold text-ink">Method chooser</p>
          <div className="mt-4 grid gap-2">
            {(Object.keys(CHOOSER) as Array<keyof typeof CHOOSER>).map((k) => (
              <button key={k} type="button" onClick={() => setChoice(k)}
                className={`rounded-xl border p-3 text-left text-sm ${choice === k ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"}`}>
                {CHOOSER[k].label}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-surface-2 p-4">
            <div className="font-semibold text-ink">{CHOOSER[choice].answer}</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{CHOOSER[choice].extra}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-sm font-semibold text-ink">“Why did you use this?” challenge</p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-surface-2 p-4 font-mono text-xs text-ink">/STATISTICS=CHISQ PHI LAMBDA GAMMA</pre>
          <p className="mt-4 text-sm text-muted">Suppose both variables are nominal and prediction is not part of the research question. Which requested statistics are substantively justified?</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {["CHISQ + PHI/Cramer’s V", "All four", "Gamma only", "Lambda + Gamma"].map((x) => (
              <button key={x} type="button" onClick={() => setChallenge(x)}
                className={`rounded-lg border p-3 text-left text-sm ${challenge === x ? "border-accent bg-accent-soft" : "border-line"}`}>{x}</button>
            ))}
          </div>
          {challenge && (
            <p className={`mt-4 rounded-lg p-3 text-sm leading-relaxed ${challenge === "CHISQ + PHI/Cramer’s V" ? "bg-pos-soft text-pos" : "bg-neg-soft text-neg"}`}>
              {challenge === "CHISQ + PHI/Cramer’s V"
                ? "Yes. χ² tests independence; Cramer’s V describes strength. Lambda needs a prediction question, and Gamma requires substantive ordinality."
                : "Not quite. Do not report a measure only because SPSS produced it. Justify each statistic from measurement level and research question."}
            </p>
          )}
        </div>
      </div>
    </OptionalSection>
  );
}

function PValueDeep() {
  const [diff, setDiff] = useState(5);
  const [sd, setSd] = useState(20);
  const [n, setN] = useState(40);
  const se = sd / Math.sqrt(n);
  const t = diff / se;
  const df = n - 1;
  const p = tTwoTailedP(t, df);

  const sim = useMemo(() => {
    const rand = mulberry32(20261005 + n * 13 + sd * 7);
    const z = gaussian(rand);
    const threshold = Math.abs(t);
    let extreme = 0;
    const total = 500;
    const values: number[] = [];
    for (let i = 0; i < total; i++) {
      const sampleMeanUnderH0 = (sd / Math.sqrt(n)) * z();
      const tsim = sampleMeanUnderH0 / (sd / Math.sqrt(n));
      values.push(tsim);
      if (Math.abs(tsim) >= threshold) extreme++;
    }
    return { extreme, total, empirical: extreme / total, values };
  }, [n, sd, t]);

  return (
    <OptionalSection id="pvalue" title="p-value: test statistic, reference distribution, simulation">
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="text-sm font-semibold text-ink">Hold two things constant, change the third</p>
          <div className="mt-5 space-y-4">
            <Slider label="Observed mean difference" value={diff} min={1} max={12} step={0.5} onChange={setDiff} />
            <Slider label="Standard deviation / noise" value={sd} min={5} max={40} onChange={setSd} />
            <Slider label="Sample size N" value={n} min={10} max={250} step={5} onChange={setN} />
          </div>
          <div className="mt-5 rounded-xl bg-surface-2 p-4 font-mono text-sm leading-7 text-ink">
            SE = {sd.toFixed(1)} / √{n} = {se.toFixed(2)}<br />
            t = {diff.toFixed(1)} / {se.toFixed(2)} = {t.toFixed(2)}<br />
            df = {df}<br />
            p {formatP(p)}
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm leading-relaxed text-muted">
              <strong className="text-ink">Test statistic = observed deviation from H₀ / standard error.</strong> The numerator
              is the observed effect in original units. The denominator is expected sampling variability. The ratio says
              how many standard errors the observation lies from H₀.
            </p>
            <div className="mt-4">
              <DistributionChart
                pdf={(x) => tPdf(x, df)}
                xMin={-5}
                xMax={5}
                ticks={[-4, -2, 0, 2, 4]}
                regions={[[-10, -Math.abs(t)], [Math.abs(t), 10]]}
                markers={[{ x: Math.max(-4.9, Math.min(4.9, t)), label: `t = ${t.toFixed(2)}` }]}
                ariaLabel="t reference distribution with two-tailed p-value regions"
                xLabel={`t distribution, df = ${df}`}
                height={190}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm font-semibold text-ink">Simulation view: assume H₀ is true</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Draw 500 simulated samples under H₀ and count how often |t<sub>sim</sub>| ≥ |t<sub>observed</sub>|.
            </p>
            <div className="mt-4 flex items-end gap-4">
              <div className="font-mono text-3xl font-semibold text-ink">{sim.extreme} / {sim.total}</div>
              <div className="pb-1 text-sm text-muted">empirical p ≈ {sim.empirical.toFixed(3)}</div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Larger effect usually lowers p; larger N usually lowers p; larger noise usually raises p. But <strong className="text-ink">p is not effect size</strong>.
              Pair χ² with Cramer’s V, t-tests with Cohen’s d / Hedges’ g, while correlation r already carries strength information.
            </p>
          </div>
        </div>
      </div>
    </OptionalSection>
  );
}

function ReproducibleSpss() {
  const [temporary, setTemporary] = useState(true);

  return (
    <OptionalSection id="spss" title="Reproducible SPSS: paste, inspect, run">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="font-semibold text-ink">Prefer this workflow</p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-xl bg-neg-soft p-4 text-neg">Avoid: click → OK → forget</div>
            <div className="rounded-xl bg-pos-soft p-4 text-pos">Prefer: click → Paste → inspect syntax → run</div>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => setTemporary(true)} className={`rounded-full px-3 py-1.5 text-sm ${temporary ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}>TEMPORARY</button>
            <button type="button" onClick={() => setTemporary(false)} className={`rounded-full px-3 py-1.5 text-sm ${!temporary ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}>Persistent filter</button>
          </div>
          <div className="mt-4 rounded-xl bg-surface-2 p-4 text-sm leading-relaxed text-muted">
            {temporary
              ? "TEMPORARY makes the following transformation or selection apply only to the immediately following procedure. That keeps exploratory subsets from silently leaking into later analyses."
              : "A persistent selection/filter remains active until you explicitly turn it off. That can be useful, but it also makes later output easy to misread if you forget the state."}
          </div>
        </div>
        <div>
          <pre className="overflow-x-auto rounded-2xl border border-line bg-surface-2 p-5 font-mono text-xs leading-6 text-ink">{`FREQUENCIES VARIABLES=age outcome.
MISSING VALUES age outcome (99).

RECODE age
  (18 THRU 29=1)
  (30 THRU 49=2)
  (50 THRU HI=3)
  INTO age3.

COMPUTE eligible = (age >= 18).

TEMPORARY.
SELECT IF eligible = 1.
CROSSTABS
  /TABLES=age3 BY outcome
  /STATISTICS=CHISQ PHI
  /CELLS=COUNT EXPECTED ROW ASRESID.

WEIGHT BY dweight.
CROSSTABS /TABLES=age3 BY outcome.
WEIGHT OFF.`}</pre>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Useful building blocks: <span className="font-mono">FREQUENCIES</span>, <span className="font-mono">MISSING VALUES</span>, <span className="font-mono">RECODE</span>, <span className="font-mono">COMPUTE</span>, <span className="font-mono">TEMPORARY</span>, <span className="font-mono">SELECT IF</span>, <span className="font-mono">WEIGHT BY</span>, <span className="font-mono">WEIGHT OFF</span>, <span className="font-mono">CROSSTABS</span>.
          </p>
        </div>
      </div>
    </OptionalSection>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="text-xs text-faint">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </div>
  );
}

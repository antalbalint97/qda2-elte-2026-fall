"use client";

import { Formula, Frac, Sqrt } from "@/components/learning/Formula";
import { DistributionChart } from "@/components/viz/DistributionChart";
import { Disclosure } from "@/components/ui/Disclosure";
import { Slider } from "@/components/ui/Slider";
import { formatP, tPdf, tTwoTailedP } from "@/lib/stats";
import { useState } from "react";

const NS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 500, 1000];

export function MathPanel() {
  const [xbar, setXbar] = useState(64);
  const [mu0, setMu0] = useState(60);
  const [s, setS] = useState(10);
  const [ni, setNi] = useState(4);
  const n = NS[ni];
  const se = s / Math.sqrt(n);
  const t = (xbar - mu0) / se;
  const df = n - 1;
  const p = tTwoTailedP(t, df);
  const tc = Math.max(-5.4, Math.min(5.4, t));

  return (
    <div className="space-y-6">
      <p className="leading-relaxed text-muted">
        Every test statistic in this course has the same shape: how far the observed result is from what H₀ predicts,
        measured in units of its typical sampling variability.
      </p>
      <Formula label="General idea">
        test statistic = <Frac num="observed difference" den="standard error" />
      </Formula>
      <Formula
        label="One-sample t-test"
        legend={[
          ["t", "the test statistic"],
          ["x̄", "sample mean"],
          ["μ₀", "the value stated in H₀"],
          ["s", "sample standard deviation"],
          ["n", "sample size"],
          ["s/√n", "standard error of the mean"],
        ]}
      >
        t = <Frac num="x̄ − μ₀" den={<><span>s</span> / <Sqrt>n</Sqrt></>} />
      </Formula>

      <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-medium text-ink">Try your own numbers</p>
          <Slider label="Sample mean x̄" value={xbar} min={50} max={70} step={0.5} onChange={setXbar} display={xbar.toFixed(1)} />
          <Slider label="Null value μ₀" value={mu0} min={50} max={70} step={0.5} onChange={setMu0} display={mu0.toFixed(1)} />
          <Slider label="Standard deviation s" value={s} min={2} max={40} step={1} onChange={setS} display={s} />
          <Slider label="Sample size n" value={ni} min={0} max={NS.length - 1} onChange={setNi} display={n} valueText={`n = ${n}`} />
        </div>
        <div>
          <div className="rounded-xl bg-surface-2 p-4 font-mono text-sm leading-7 text-ink">
            <div>
              SE = {s} / √{n} = <strong>{se.toFixed(3)}</strong>
            </div>
            <div>
              t = ({xbar.toFixed(1)} − {mu0.toFixed(1)}) / {se.toFixed(3)} = <strong>{t.toFixed(2)}</strong>
            </div>
            <div>
              df = n − 1 = <strong>{df}</strong>
            </div>
            <div>
              p (two-tailed) <strong>{formatP(p)}</strong>
            </div>
          </div>
          <div className="mt-3">
            <DistributionChart
              pdf={(x) => tPdf(x, df)}
              xMin={-5.5}
              xMax={5.5}
              ticks={[-4, -2, 0, 2, 4]}
              height={170}
              regions={[
                [-10, -Math.abs(t)],
                [Math.abs(t), 10],
              ]}
              markers={[{ x: tc, label: Math.abs(t) > 5.4 ? `t = ${t.toFixed(1)} (off chart)` : `t = ${t.toFixed(2)}` }]}
              xLabel={`t distribution, df = ${df}`}
              ariaLabel={`t distribution with df ${df}, observed t ${t.toFixed(2)}`}
            />
          </div>
        </div>
      </div>

      <Disclosure title="Deeper: where the p-value comes from" badge={<span className="text-xs font-normal text-faint">optional</span>}>
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            If H₀ is true and the data meet the test&apos;s assumptions, the t statistic follows a known reference
            distribution: the t distribution with n − 1 degrees of freedom. It looks like the normal curve but with
            heavier tails for small samples; for large n it is practically normal.
          </p>
          <p>
            The p-value is the <strong>tail probability</strong> under that reference distribution: the share of the
            area beyond the observed t (both tails for a two-sided test). No calculus is needed to use it; SPSS reads the
            area off the distribution for you and prints it as <span className="font-mono">Sig. (2-tailed)</span>.
          </p>
          <p>
            Because the whole calculation assumes H₀ is true, the result can only tell you how surprising the data are
            under H₀. It cannot tell you the probability that H₀ itself is true.
          </p>
        </div>
      </Disclosure>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Scatter } from "@/components/viz/Scatter";
import { col, RUNTIME_FUCK } from "@/content/sopranos/analysis";
import { cn } from "@/lib/cn";
import { recordAnswer } from "@/lib/progress";
import { noLeadingZero } from "@/lib/stats";
import { useState } from "react";
import { SyntheticTag } from "./Case";

const XS = col("runtime_minutes");
const YS = col("fuck_count");

/** “Does Tony swear more in longer episodes?” Guess r before it is revealed. */
export function GuessSwearing() {
  const [guess, setGuess] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const err = Math.abs(guess - RUNTIME_FUCK.r);

  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <div>
        <Scatter
          xs={XS}
          ys={YS}
          xLabel="runtime_minutes"
          yLabel="fuck_count"
          tone="z"
          ariaLabel="Scatterplot of runtime against F-word count: a loose upward cloud with two extreme points at the longest runtimes."
        />
        <SyntheticTag />
      </div>
      <div className="space-y-5">
        <p className="text-sm text-muted">Estimate Pearson&apos;s r from the cloud.</p>
        <Slider
          label="Your guess"
          value={guess}
          min={-1}
          max={1}
          step={0.05}
          onChange={(v) => !revealed && setGuess(v)}
          display={noLeadingZero(guess)}
        />
        {!revealed ? (
          <Button
            variant="primary"
            onClick={() => {
              setRevealed(true);
              recordAnswer("sop-cor-guess", "correlation", err < 0.15);
            }}
          >
            Reveal r
          </Button>
        ) : (
          <div className="animate-fade-up space-y-3">
            <div className={cn("rounded-xl p-4", err < 0.15 ? "bg-pos-soft" : err < 0.3 ? "bg-warn-soft" : "bg-neg-soft")}>
              <p className="font-mono text-xl font-semibold text-ink">r = {noLeadingZero(RUNTIME_FUCK.r)}</p>
              <p className="font-mono text-sm text-muted">rho = {noLeadingZero(RUNTIME_FUCK.rho)}</p>
              <p className="mt-2 text-sm text-ink/85">
                You were off by {err.toFixed(2)}.{" "}
                {err < 0.15
                  ? "Strong prediction."
                  : err < 0.3
                    ? "Weak prediction."
                    : "Somewhere, a Pearson coefficient is disappointed."}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Notice the two points at the top right. They are long episodes with extreme counts, and they pull Pearson&apos;s r up. Spearman only
              sees them as ‘the highest ranks’.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

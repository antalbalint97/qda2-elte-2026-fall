"use client";

import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Scatter } from "@/components/viz/Scatter";
import { cn } from "@/lib/cn";
import { mulberry32, noLeadingZero, pearson } from "@/lib/stats";
import { useMemo, useState } from "react";
import { rhoSample } from "./gen";

const TARGETS = [0.9, -0.5, 0, 0.5, -0.9, 0.3, -0.7, 0.7, -0.2];

export function GuessR() {
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const target = TARGETS[round % TARGETS.length];
  const { xs, ys } = useMemo(() => rhoSample(1000 + round * 31 + Math.floor(mulberry32(round)() * 100), 90, target), [round, target]);
  const r = pearson(xs, ys);
  const err = Math.abs(guess - r);

  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
      <Scatter xs={xs} ys={ys} tone="z" ariaLabel="Scatterplot: guess the correlation" />
      <div className="space-y-5">
        <p className="text-sm text-muted">Round {round + 1}. Look at the cloud and estimate r.</p>
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
              setHistory((h) => [...h, err]);
            }}
          >
            Reveal r
          </Button>
        ) : (
          <div className="animate-fade-up space-y-3">
            <div className={cn("rounded-xl p-4", err < 0.15 ? "bg-pos-soft" : err < 0.3 ? "bg-warn-soft" : "bg-neg-soft")}>
              <p className="font-mono text-2xl font-semibold text-ink">r = {noLeadingZero(r)}</p>
              <p className="mt-1 text-sm text-ink/80">
                You were off by {err.toFixed(2)}.{" "}
                {err < 0.15
                  ? "Very good eye."
                  : Math.sign(guess) !== Math.sign(r) && Math.abs(r) > 0.15
                    ? "Check the direction first: does the cloud rise or fall from left to right?"
                    : Math.abs(guess) > Math.abs(r)
                      ? "You overestimated the strength. Clouds with r ≈ .5 still look quite scattered."
                      : "You underestimated the strength. Look at how tightly the points follow a line."}
              </p>
            </div>
            <Button
              onClick={() => {
                setRound((x) => x + 1);
                setRevealed(false);
                setGuess(0);
              }}
            >
              Next plot
            </Button>
          </div>
        )}
        {history.length > 0 && (
          <p className="text-xs text-faint">
            Average error over {history.length} round{history.length > 1 ? "s" : ""}:{" "}
            {(history.reduce((a, b) => a + b, 0) / history.length).toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

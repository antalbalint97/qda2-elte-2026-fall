"use client";

import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Term } from "@/components/ui/Term";
import { cn } from "@/lib/cn";
import { useState } from "react";
import { CausalDiagram } from "./CausalDiagram";
import { EXPLORER, PATTERN_NAME, type Pattern } from "./data";
import { PartialBars } from "./PartialBars";

const ORDER: Pattern[] = ["rep", "spec", "expl", "interp"];

export function Explorer() {
  const [p, setP] = useState<Pattern>("rep");
  const [split, setSplit] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const ex = EXPLORER[p];

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">Same zero-order relationship.</span> Choose a control variable:
        </p>
        <Segmented
          size="sm"
          label="Control variable"
          value={p}
          onChange={(v) => {
            setP(v);
            setRevealed(false);
          }}
          options={ORDER.map((k) => ({ value: k, label: EXPLORER[k].z }))}
        />
      </div>
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
            {split ? "Model with control variable" : "Zero-order model"}
          </p>
          <CausalDiagram
            pattern={split && revealed ? p : split ? "control" : "zero"}
            x={ex.x}
            y={ex.y}
            z={ex.z}
            className="mt-2 w-full"
          />
          {split && !revealed && (
            <p className="mt-1 text-center text-xs text-faint">
              Z is held constant. Look at the partial tables, then reveal the pattern.
            </p>
          )}
        </div>
        <div>
          <PartialBars
            xCats={ex.xCats}
            zCats={ex.zCats}
            zero={ex.zero}
            partials={ex.partials}
            yLabel={ex.yLabel}
            split={split}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-line px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex flex-wrap gap-2">
          <Button variant={split ? "secondary" : "primary"} onClick={() => setSplit((s) => !s)}>
            {split ? "Back to the zero-order table" : `Control for ${ex.z.toLowerCase()}`}
          </Button>
          {split && !revealed && (
            <Button variant="primary" onClick={() => setRevealed(true)}>
              Reveal the pattern
            </Button>
          )}
        </div>
        <div className={cn("max-w-xl text-sm leading-relaxed text-muted", !split && "sm:text-right")}>
          {!split && (
            <p>
              <Term k="zeroOrder">Zero-order relationship</Term>: graduates are {ex.zero[1] - ex.zero[0]} points more
              likely to be politically active.
            </p>
          )}
          {split && !revealed && (
            <p>
              Each group on the right is a <Term k="partial">partial table</Term>: the X–Y relationship within one
              category of <Term k="control">Z</Term>. Compare each partial difference with the zero-order difference.
            </p>
          )}
          {split && revealed && (
            <p className="animate-fade-up">
              <span className="font-semibold text-ink">{PATTERN_NAME[p]}. </span>
              {ex.note} Z is{" "}
              {ex.zType === "ante" ? (
                <Term k="antecedent">antecedent</Term>
              ) : (
                <Term k="intervening">intervening</Term>
              )}
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

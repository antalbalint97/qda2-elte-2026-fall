"use client";

import { SpssOutput, type OutputCell } from "@/components/learning/Spss";
import { Segmented } from "@/components/ui/Segmented";
import { Term } from "@/components/ui/Term";
import { useState } from "react";

export function Levene() {
  const [lev, setLev] = useState<"high" | "low">("high");
  const levP = lev === "high" ? ".412" : ".004";
  const rows: OutputCell[][] = [
    ["Equal variances assumed", { v: lev === "high" ? "0.67" : "8.32", hl: 1 }, { v: levP, hl: 1 }, "2.14", "1198", ".033", ".31"],
    ["Equal variances not assumed", "", "", "2.08", "961.4", ".038", ".31"],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted">
          <Term k="levene">Levene&apos;s test</Term> asks whether the group variances can be treated as equal. It does not
          test your hypothesis; it only tells you which row to read.
        </p>
        <Segmented
          label="Levene's Sig."
          value={lev}
          onChange={setLev}
          options={[
            { value: "high", label: "Levene p = .412" },
            { value: "low", label: "p = .004" },
          ]}
        />
        <div className="rounded-xl bg-surface-2 p-4 text-sm">
          {lev === "high" ? (
            <p>
              <strong className="text-ink">p ≥ .05</strong> <span className="text-muted">→ read</span>{" "}
              <strong className="text-ink">“Equal variances assumed”</strong>
            </p>
          ) : (
            <p>
              <strong className="text-ink">p &lt; .05</strong> <span className="text-muted">→ read</span>{" "}
              <strong className="text-ink">“Equal variances not assumed”</strong>
            </p>
          )}
        </div>
      </div>
      <SpssOutput
        title="Independent Samples Test (happiness by political interest)"
        groupHeaders={[
          { label: "", span: 1 },
          { label: "Levene's Test", span: 2 },
          { label: "t-test for Equality of Means", span: 4 },
        ]}
        headers={["", "F", "Sig.", "t", "df", "Sig. (2-tailed)", "Mean Diff."]}
        rows={rows}
        activeRow={lev === "high" ? 0 : 1}
        annotations={{ 1: "Levene's test lives in the first row only. Its Sig. decides which row of the t-test to use." }}
      />
    </div>
  );
}

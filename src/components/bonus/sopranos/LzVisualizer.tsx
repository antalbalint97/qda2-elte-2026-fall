"use client";

import { CausalDiagram } from "@/components/modules/lazarsfeld/CausalDiagram";
import { Segmented } from "@/components/ui/Segmented";
import { useState } from "react";

type View = "zero" | "rep" | "spec" | "expl" | "interp";

const VIEWS: Record<View, { label: string; z: string; where: string; text: string }> = {
  zero: {
    label: "Zero order",
    z: "",
    where: "No Z yet.",
    text: "The original two-variable relationship: later seasons, more major violence. Everything that follows is compared with this.",
  },
  rep: {
    label: "Replication",
    z: "Finale episode",
    where: "Z is held constant, but it is not part of the story between X and Y.",
    text: "Within finales and within ordinary episodes, the X–Y relationship looks the same as before. Controlling for Z changes nothing essential.",
  },
  spec: {
    label: "Specification",
    z: "Finale episode",
    where: "Z sets the conditions: it decides how strong the X–Y relationship is.",
    text: "The X–Y relationship is strong in one category of Z and weak or absent in the other. Z specifies when the relationship holds.",
  },
  expl: {
    label: "Explanation",
    z: "HBO policy change",
    where: "Z lives before X. It is antecedent: it influences both X and Y.",
    text: "Z precedes X. When Z is held constant, the X–Y relationship weakens or disappears: it was produced by Z acting on both.",
  },
  interp: {
    label: "Interpretation",
    z: "Production budget",
    where: "Z lives between X and Y. It is intervening: X → Z → Y.",
    text: "Z intervenes between X and Y. When Z is held constant, the X–Y relationship weakens or disappears: X works through Z.",
  },
};

export function LzVisualizer() {
  const [view, setView] = useState<View>("zero");
  const v = VIEWS[view];
  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="overflow-x-auto border-b border-line px-4 py-3 sm:px-6">
        <Segmented
          label="Lazarsfeld pattern"
          size="sm"
          value={view}
          onChange={setView}
          options={(Object.keys(VIEWS) as View[]).map((k) => ({ value: k, label: VIEWS[k].label }))}
        />
      </div>
      <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
        <CausalDiagram pattern={view} x="Later season" y="Major violence" z={v.z || "Z"} className="w-full" />
        <div className="space-y-3" aria-live="polite">
          <p className="text-sm leading-relaxed text-ink">{v.text}</p>
          <div className="rounded-xl border border-rz/30 bg-rz-soft px-3.5 py-2.5">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-rz">Where does Z live in the story?</p>
            <p className="mt-1 text-sm text-ink">{v.where}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

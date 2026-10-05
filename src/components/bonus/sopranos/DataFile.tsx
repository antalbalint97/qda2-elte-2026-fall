"use client";

import { Disclosure } from "@/components/ui/Disclosure";
import { EPISODES, type Episode } from "@/content/sopranos/dataset";
import { SOURCE_META, SYNTHETIC_NOTICE, VARIABLES, type Source } from "@/content/sopranos/variables";
import { cn } from "@/lib/cn";

const SOURCE_STYLE: Record<Source, string> = {
  real: "border-solid border-pos/50 bg-pos-soft text-pos",
  coded: "border-solid border-rx/50 bg-rx-soft text-rx",
  synthetic: "border-dashed border-warn/60 bg-warn-soft text-warn",
};

function downloadCsv() {
  const cols = VARIABLES.map((v) => v.name);
  const lines = [cols.join(","), ...EPISODES.map((e) => cols.map((c) => String(e[c as keyof Episode])).join(","))];
  const blob = new Blob([lines.join("\n") + "\n"], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sopranos_synthetic_teaching_data.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Data provenance, codebook and the downloadable dataset. */
export function DataFile() {
  const preview = EPISODES.slice(0, 8);
  const shown: Array<keyof Episode> = [
    "episode_id",
    "season",
    "early_late",
    "runtime_minutes",
    "therapy_scene",
    "major_violence",
    "violence_event_count",
    "death_count",
    "fuck_count",
    "finale_episode",
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-xl border-2 border-dashed border-warn/60 bg-warn-soft px-4 py-3">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-warn">Read this first</p>
        <p className="mt-1 font-medium text-ink">{SYNTHETIC_NOTICE}</p>
        <p className="mt-1 text-sm text-muted">
          {EPISODES.length} synthetic episode observations across 6 seasons. Episode labels are generic (S1E01 …) and do not
          refer to real episodes; the number of episodes per season is also synthetic.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(SOURCE_META) as Source[]).map((s) => {
          const count = VARIABLES.filter((v) => v.source === s).length;
          return (
            <div key={s} className={cn("rounded-xl border bg-surface p-3", count === 0 && "opacity-75")}>
              <span className={cn("inline-block rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider", SOURCE_STYLE[s])}>
                {SOURCE_META[s].label}
              </span>
              <p className="mt-2 font-mono text-2xl font-semibold text-ink">{count}</p>
              <p className="text-xs leading-relaxed text-muted">{SOURCE_META[s].text}</p>
            </div>
          );
        })}
      </div>

      <Disclosure title="Codebook" badge={<span className="font-mono text-xs font-normal text-faint">{VARIABLES.length} variables</span>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="border-b border-line py-1.5 pr-3 font-medium">Variable</th>
                <th className="border-b border-line py-1.5 pr-3 font-medium">Meaning</th>
                <th className="border-b border-line py-1.5 pr-3 font-medium">Values</th>
                <th className="border-b border-line py-1.5 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {VARIABLES.map((v) => (
                <tr key={v.name} className="align-top">
                  <td className="border-b border-line py-1.5 pr-3 font-mono text-xs text-ink">{v.name}</td>
                  <td className="border-b border-line py-1.5 pr-3 text-ink">{v.label}</td>
                  <td className="border-b border-line py-1.5 pr-3 text-xs text-muted">{v.values}</td>
                  <td className="border-b border-line py-1.5">
                    <span className={cn("inline-block rounded-sm border px-1 py-px font-mono text-[10px] uppercase", SOURCE_STYLE[v.source])}>
                      {v.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-faint">
            Measurement levels are deliberately left out of the codebook: classifying them is Part 1.
          </p>
        </div>
      </Disclosure>

      <Disclosure title="Data view (first 8 episodes)" badge={<span className="font-mono text-xs font-normal text-faint">synthetic</span>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse font-mono text-xs">
            <thead>
              <tr className="text-muted">
                {shown.map((c) => (
                  <th key={c} className="border-b border-line px-2 py-1.5 text-right font-medium first:text-left">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((e) => (
                <tr key={e.episode_id}>
                  {shown.map((c) => (
                    <td key={c} className="border-b border-line px-2 py-1 text-right tabular-nums text-ink first:text-left">
                      {e[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={downloadCsv}
            className="h-9 rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            Download the dataset (.csv)
          </button>
          <p className="text-xs text-faint">Opens in SPSS via File › Import Data › CSV Data, if you want to reproduce the outputs yourself.</p>
        </div>
      </Disclosure>
    </div>
  );
}

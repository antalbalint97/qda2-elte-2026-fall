import { ChoiceQuestionView } from "@/components/quiz/ChoiceQuestionView";
import { qStudyAB } from "@/content/questions";

const STUDIES = [
  { name: "Study A", diff: 0.4, n: "50,000", p: "p < .001", label: "tiny effect, huge N" },
  { name: "Study B", diff: 6, n: "40", p: "p = .08", label: "larger effect, small N" },
];

export function StudyComparison() {
  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-surface p-4 sm:p-6 lg:grid-cols-2">
      <div className="space-y-4">
        {STUDIES.map((s) => (
          <div key={s.name} className="rounded-xl bg-surface-2 p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-ink">{s.name}</p>
              <p className="font-mono text-sm text-muted">
                N = {s.n} · {s.p}
              </p>
            </div>
            <p className="text-xs text-faint">{s.label}</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-3 flex-1 rounded-full bg-surface-3">
                <div className="h-3 rounded-full bg-accent" style={{ width: `${(s.diff / 10) * 100}%`, minWidth: 3 }} />
              </div>
              <span className="w-24 text-right font-mono text-sm text-ink">{s.diff} points</span>
            </div>
            <p className="mt-1 text-[11px] text-faint">Mean difference on a 0–100 scale (bar spans 0–10 points)</p>
          </div>
        ))}
      </div>
      <ChoiceQuestionView q={qStudyAB} compact />
    </div>
  );
}

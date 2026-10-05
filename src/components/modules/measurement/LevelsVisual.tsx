import { cn } from "@/lib/cn";

function Check({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "inline-grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold",
        on ? "bg-pos-soft text-pos" : "bg-surface-3 text-faint",
      )}
      aria-label={on ? "yes" : "no"}
    >
      {on ? "✓" : "–"}
    </span>
  );
}

const COLS = [
  {
    level: "Nominal",
    ex: "religion, gender, settlement type",
    order: false,
    distance: false,
    stats: "frequencies, mode, crosstab, χ², Cramer's V",
    art: (
      <svg viewBox="0 0 160 60" className="h-16 w-full" aria-hidden>
        <circle cx="30" cy="30" r="11" className="fill-rx/25 stroke-rx" strokeWidth="1.5" />
        <rect x="64" y="18" width="24" height="24" rx="4" className="fill-ry/25 stroke-ry" strokeWidth="1.5" />
        <path d="M128 17l13 24h-26z" className="fill-rz/25 stroke-rz" strokeWidth="1.5" />
      </svg>
    ),
    caption: "different kinds, no order",
  },
  {
    level: "Ordinal",
    ex: "political interest 1–4, age groups, education level",
    order: true,
    distance: false,
    stats: "+ median, percentiles, Spearman's rank correlation",
    art: (
      <svg viewBox="0 0 160 60" className="h-16 w-full" aria-hidden>
        <line x1="10" y1="40" x2="150" y2="40" className="stroke-line-strong" strokeWidth="1.5" />
        {[18, 40, 92, 138].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="40" r="6" className="fill-accent" opacity={0.35 + i * 0.2} />
            <text x={x} y="22" textAnchor="middle" className="fill-muted font-mono text-[11px]">
              {i + 1}
            </text>
          </g>
        ))}
        <text x="66" y="56" textAnchor="middle" className="fill-faint text-[9px]">gaps unequal / unknown</text>
      </svg>
    ),
    caption: "ranked categories, unknown distances",
  },
  {
    level: "Continuous / Scale",
    ex: "age in years, working hours, number of children",
    order: true,
    distance: true,
    stats: "+ mean, standard deviation, Pearson's r, t-tests",
    art: (
      <svg viewBox="0 0 160 60" className="h-16 w-full" aria-hidden>
        <line x1="10" y1="40" x2="150" y2="40" className="stroke-ink" strokeWidth="1.5" />
        {Array.from({ length: 8 }, (_, i) => 10 + i * 20).map((x, i) => (
          <g key={x}>
            <line x1={x} y1="34" x2={x} y2="46" className="stroke-ink" strokeWidth="1.2" />
            <text x={x} y="24" textAnchor="middle" className="fill-muted font-mono text-[10px]">
              {i * 10}
            </text>
          </g>
        ))}
        <text x="80" y="58" textAnchor="middle" className="fill-faint text-[9px]">equal distances</text>
      </svg>
    ),
    caption: "numbers with meaningful distances",
  },
];

export function LevelsVisual() {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
      {COLS.map((c) => (
        <div key={c.level} className="flex flex-col bg-surface p-5">
          <p className="font-serif text-xl font-semibold text-ink">{c.level}</p>
          <p className="mt-0.5 text-xs text-faint">{c.caption}</p>
          <div className="my-3">{c.art}</div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted">Categories have an order?</dt>
              <dd>
                <Check on={c.order} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted">Distances are meaningful?</dt>
              <dd>
                <Check on={c.distance} />
              </dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
            <span className="font-medium text-ink">e.g.</span> {c.ex}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            <span className="font-medium text-ink">Allows:</span> {c.stats}
          </p>
        </div>
      ))}
    </div>
  );
}

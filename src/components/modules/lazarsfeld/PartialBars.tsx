import { cn } from "@/lib/cn";

/**
 * Zero-order vs partial tables as grouped bars. When `split` is false the partial groups show
 * the zero-order values, so toggling it animates the transition from 2D to 3D analysis.
 */
export function PartialBars({
  xCats,
  zCats,
  zero,
  partials,
  yLabel,
  split = true,
  compact = false,
}: {
  xCats: [string, string];
  zCats: [string, string];
  zero: [number, number];
  partials: [[number, number], [number, number]];
  yLabel: string;
  split?: boolean;
  compact?: boolean;
}) {
  const groups: Array<{ label: string; sub: string; vals: [number, number]; ghost?: [number, number]; kind: "zero" | "partial" }> = [
    { label: "Zero-order", sub: "all respondents", vals: zero, kind: "zero" },
    { label: `Z: ${zCats[0]}`, sub: "partial table 1", vals: split ? partials[0] : zero, ghost: zero, kind: "partial" },
    { label: `Z: ${zCats[1]}`, sub: "partial table 2", vals: split ? partials[1] : zero, ghost: zero, kind: "partial" },
  ];
  const h = compact ? 120 : 170;
  return (
    <figure>
      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span>{yLabel}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rx/35" />
            {xCats[0]}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rx" />
            {xCats[1]}
          </span>
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-4">
        {groups.map((g) => {
          const diff = g.vals[1] - g.vals[0];
          const show = g.kind === "zero" || split;
          return (
            <div
              key={g.label}
              className={cn(
                "rounded-xl border px-2 pb-2 pt-3 transition-colors sm:px-3",
                g.kind === "zero" ? "border-line bg-surface-2" : "border-rz/25 bg-rz-soft/40",
              )}
            >
              <div className="relative flex items-end justify-center gap-2 sm:gap-3" style={{ height: h }}>
                {[0, 1].map((k) => (
                  <div key={k} className="relative flex h-full w-8 flex-col justify-end sm:w-10">
                    {g.ghost && split && (
                      <div
                        className="absolute inset-x-0 border-t-2 border-dashed border-faint"
                        style={{ bottom: `${g.ghost[k]}%` }}
                        aria-hidden
                      />
                    )}
                    <div
                      className={cn("rounded-t-md transition-all duration-700 ease-out", k ? "bg-rx" : "bg-rx/35")}
                      style={{ height: `${g.vals[k]}%` }}
                    />
                    <span className="absolute inset-x-0 text-center font-mono text-[11px] text-ink transition-all duration-700" style={{ bottom: `calc(${g.vals[k]}% + 2px)` }}>
                      {g.vals[k]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 border-t border-line pt-2 text-center">
                <p className="truncate text-xs font-medium text-ink">{g.label}</p>
                <p
                  className={cn(
                    "mt-0.5 font-mono text-sm font-semibold tabular-nums transition-opacity",
                    show ? "opacity-100" : "opacity-0",
                    g.kind === "zero" ? "text-ink" : "text-rz",
                  )}
                >
                  {diff > 0 ? "+" : ""}
                  {diff} pp
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-2 text-xs text-faint">
        pp = percentage-point difference between {xCats[1].toLowerCase()} and {xCats[0].toLowerCase()}.
        {split && " Dashed lines mark the zero-order values."}
      </figcaption>
    </figure>
  );
}

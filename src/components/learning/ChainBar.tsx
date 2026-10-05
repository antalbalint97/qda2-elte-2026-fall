import { CHAIN } from "@/content/modules";
import { cn } from "@/lib/cn";

/** The analysis chain every module reinforces; highlighted links are trained in the current module. */
export function ChainBar({ active = [], compact = false }: { active?: number[]; compact?: boolean }) {
  return (
    <ol
      aria-label="Analysis chain"
      className={cn("flex flex-wrap items-center gap-y-2 text-xs", compact ? "gap-x-1" : "gap-x-1.5")}
    >
      {CHAIN.map((step, i) => {
        const on = active.includes(i);
        return (
          <li key={step} className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                on ? "bg-accent-soft text-accent ring-1 ring-inset ring-accent/25" : "text-faint",
              )}
            >
              {step}
              {on && <span className="sr-only"> (trained here)</span>}
            </span>
            {i < CHAIN.length - 1 && (
              <svg aria-hidden viewBox="0 0 12 12" className="h-3 w-3 text-line-strong">
                <path d="M3 6h6m-2-2.5L9.5 6 7 8.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            )}
          </li>
        );
      })}
    </ol>
  );
}

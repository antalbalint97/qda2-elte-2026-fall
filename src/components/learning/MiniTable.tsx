import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** Compact table used inside questions (percentages, partial tables). */
export function MiniTable({
  caption,
  head,
  rows,
  className,
}: {
  caption?: ReactNode;
  head: ReactNode[];
  rows: ReactNode[][];
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-line bg-surface", className)}>
      <table className="w-full border-collapse text-sm">
        {caption && (
          <caption className="border-b border-line px-3 py-2 text-left text-xs font-medium text-muted">{caption}</caption>
        )}
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                scope="col"
                className={cn("border-b border-line px-3 py-1.5 text-xs font-medium text-muted", i ? "text-right" : "text-left")}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child_td]:border-b-0">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td
                  key={j}
                  className={cn(
                    "border-b border-line px-3 py-1.5",
                    j ? "text-right font-mono tabular-nums text-ink" : "text-ink",
                  )}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

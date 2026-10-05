import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const styles = {
  X: "bg-rx-soft text-rx ring-rx/30",
  Y: "bg-ry-soft text-ry ring-ry/30",
  Z: "bg-rz-soft text-rz ring-rz/30",
};

/** Colour-coded role chip. X, Y and Z use the same colours everywhere on the site. */
export function Role({ r, children, className }: { r: "X" | "Y" | "Z"; children?: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.8em] font-semibold ring-1 ring-inset whitespace-nowrap",
        styles[r],
        className,
      )}
    >
      <span className="font-mono">{r}</span>
      {children && <span className="font-medium">{children}</span>}
    </span>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

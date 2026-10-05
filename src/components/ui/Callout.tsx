import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const tones = {
  key: "border-accent/30 bg-accent-soft",
  note: "border-line bg-surface-2",
  warn: "border-warn/30 bg-warn-soft",
  caution: "border-neg/25 bg-neg-soft",
};

export function Callout({
  tone = "note",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border px-4 py-3.5 text-sm leading-relaxed", tones[tone], className)}>
      {title && <p className="mb-1 font-semibold text-ink">{title}</p>}
      <div className="text-muted [&_strong]:text-ink">{children}</div>
    </div>
  );
}

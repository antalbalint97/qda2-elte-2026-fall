import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="mx-1 inline-flex flex-col items-center align-middle leading-tight">
      <span className="border-b border-current px-1 pb-0.5">{num}</span>
      <span className="px-1 pt-0.5">{den}</span>
    </span>
  );
}

export function Sqrt({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-stretch">
      <span aria-hidden>√</span>
      <span className="border-t border-current pl-0.5">{children}</span>
    </span>
  );
}

/** Display formula with optional symbol legend. */
export function Formula({
  children,
  legend,
  label,
  className,
}: {
  children: ReactNode;
  legend?: Array<[ReactNode, ReactNode]>;
  label?: string;
  className?: string;
}) {
  return (
    <figure className={cn("rounded-xl border border-line bg-surface-2 px-5 py-4", className)}>
      {label && <figcaption className="mb-2 text-xs font-medium text-faint">{label}</figcaption>}
      <div className="overflow-x-auto py-1 text-center font-serif text-xl text-ink" role="math">
        {children}
      </div>
      {legend && (
        <dl className="mt-4 grid gap-x-4 gap-y-1.5 border-t border-line pt-3 text-sm sm:grid-cols-2">
          {legend.map(([sym, desc], i) => (
            <div key={i} className="flex gap-3">
              <dt className="min-w-10 shrink-0 whitespace-nowrap font-serif text-ink">{sym}</dt>
              <dd className="text-muted">{desc}</dd>
            </div>
          ))}
        </dl>
      )}
    </figure>
  );
}

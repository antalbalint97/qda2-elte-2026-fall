import type { ReactNode } from "react";

/** Left-aligned, multi-line worked calculation. */
export function Working({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-line bg-surface-2 px-4 py-3 font-mono text-sm leading-7 text-ink">
      {children}
    </div>
  );
}

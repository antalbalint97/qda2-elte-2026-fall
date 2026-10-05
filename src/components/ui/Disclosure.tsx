"use client";

import { cn } from "@/lib/cn";
import { useId, useState, type ReactNode } from "react";

export function Disclosure({
  title,
  badge,
  children,
  defaultOpen = false,
  className,
}: {
  title: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={cn("rounded-xl border border-line bg-surface", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
          {title}
          {badge}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")}
        >
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div id={id} className="animate-fade-up border-t border-line px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

"use client";

import { useId, useState, type ReactNode } from "react";
import { GLOSSARY, type GlossaryKey } from "@/content/glossary";

/** Inline glossary term with an accessible tooltip (hover, focus or tap). */
export function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const entry = GLOSSARY[k];
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="cursor-help border-b border-dotted border-faint text-inherit decoration-0 hover:border-accent hover:text-accent"
      >
        {children ?? entry.term}
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="animate-fade-up absolute bottom-full left-1/2 z-30 mb-2 w-64 -translate-x-1/2 rounded-lg border border-line bg-surface p-3 text-left text-xs font-normal leading-relaxed text-muted shadow-lg"
        >
          <span className="mb-1 block text-[13px] font-semibold text-ink">{entry.term}</span>
          {entry.def}
        </span>
      )}
    </span>
  );
}

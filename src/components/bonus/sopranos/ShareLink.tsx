"use client";

import { useState, useSyncExternalStore } from "react";

const PATH = "/bonus/sopranos";
const noop = () => () => {};

/** Copyable direct link the instructor can send to the student. */
export function ShareLink() {
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const [copied, setCopied] = useState(false);
  const url = origin + PATH;

  return (
    <div className="flex max-w-full flex-wrap items-center gap-2 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--cream-muted)]">Direct link</span>
      <code className="min-w-0 max-w-full truncate rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-[var(--cream)]">
        {url}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            // clipboard can be blocked; the link is visible and selectable anyway
          }
        }}
        className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium text-[var(--cream)] hover:bg-white/10"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

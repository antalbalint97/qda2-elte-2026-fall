"use client";

import { MODULES } from "@/content/modules";
import { cn } from "@/lib/cn";
import { PRESENT_KEY, THEME_KEY } from "@/lib/theme";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

function subscribeHtmlClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/** Projector-friendly setting: larger type, stronger secondary text, no animation. Also `?present=1`. */
function PresentationToggle() {
  const on = useSyncExternalStore(
    subscribeHtmlClass,
    () => document.documentElement.classList.contains("present"),
    () => false,
  );
  function toggle() {
    document.documentElement.classList.toggle("present", !on);
    try {
      localStorage.setItem(PRESENT_KEY, on ? "0" : "1");
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label="Presentation mode"
      title="Presentation mode: larger text for projectors"
      className={cn(
        "grid h-8 w-8 place-items-center rounded-md hover:bg-surface-2 hover:text-ink",
        on ? "bg-accent-soft text-accent" : "text-muted",
      )}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
        <rect x="1.8" y="2.5" width="12.4" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 10.5v2.5M5.5 13.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function ThemeToggle() {
  function toggle() {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4 dark:hidden" aria-hidden>
        <path d="M13 9.5A5.5 5.5 0 016.5 3a5.5 5.5 0 106.5 6.5z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <svg viewBox="0 0 16 16" className="hidden h-4 w-4 dark:block" aria-hidden>
        <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold text-ink" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
            <rect x="2" y="2" width="20" height="20" rx="5" className="fill-accent" />
            <path d="M6 16.5c2.2 0 2.6-9 6-9s3.8 9 6 9" fill="none" stroke="var(--accent-ink)" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <span>
            QDA2 <span className="font-normal text-muted">Lab</span>
          </span>
        </Link>
        <nav aria-label="Modules" className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex">
          {MODULES.map((m) => (
            <Link
              key={m.slug}
              href={m.href}
              className={cn(
                "whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors xl:px-2.5",
                path === m.href ? "bg-surface-2 text-ink" : "text-muted hover:text-ink",
              )}
            >
              {m.short}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap">
          <Link
            href="/go-further"
            className={cn(
              "hidden rounded-md px-2.5 py-1.5 text-sm font-medium xl:block",
              path === "/go-further" ? "bg-warn-soft text-warn" : "text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            Go Further
          </Link>
          <Link
            href="/bonus/sopranos"
            className={cn(
              "hidden rounded-md px-2.5 py-1.5 text-sm font-medium xl:block",
              path === "/bonus/sopranos" ? "bg-surface-2 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            Sopranos
          </Link>
          <Link
            href="/review"
            className={cn(
              "hidden rounded-md px-3 py-1.5 text-sm font-medium sm:block",
              path === "/review" ? "bg-accent text-accent-ink" : "text-accent hover:bg-accent-soft",
            )}
          >
            Quick review
          </Link>
          <PresentationToggle />
          <ThemeToggle />
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-surface-2 lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
              <path d={open ? "M4 4l8 8M12 4l-8 8" : "M2.5 4.5h11M2.5 8h11M2.5 11.5h11"} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Modules" className="animate-fade-up border-t border-line bg-bg px-4 py-3 lg:hidden">
          <ul className="grid gap-1 sm:grid-cols-2">
            {MODULES.map((m) => (
              <li key={m.slug}>
                <Link
                  href={m.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-3 rounded-md px-2 py-2 text-sm text-ink hover:bg-surface-2"
                >
                  <span className="font-mono text-xs text-faint">{m.number}</span>
                  {m.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/go-further"
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-3 rounded-md px-2 py-2 text-sm font-medium text-warn hover:bg-warn-soft"
              >
                <span className="font-mono text-xs text-faint">+</span>
                Go Further (optional)
              </Link>
            </li>
            <li>
              <Link
                href="/bonus/sopranos"
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-3 rounded-md px-2 py-2 text-sm font-medium text-ink hover:bg-surface-2"
              >
                <span className="font-mono text-xs text-faint">★</span>
                The Sopranos bonus lab
              </Link>
            </li>
            <li>
              <Link
                href="/review"
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-3 rounded-md px-2 py-2 text-sm font-medium text-accent hover:bg-surface-2"
              >
                <span className="font-mono text-xs text-faint">★</span>
                Quick review
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

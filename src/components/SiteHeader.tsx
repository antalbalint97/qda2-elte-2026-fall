"use client";

import { MODULES } from "@/content/modules";
import { cn } from "@/lib/cn";
import { PRESENT_KEY, THEME_KEY } from "@/lib/theme";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BrandLink } from "./BrandMark";

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

/** Routes that bring their own full-screen app bar (labs, lessons, the Course Builder); the site chrome steps aside. */
export function isAppRoute(path: string | null): boolean {
  if (!path) return false;
  if (path === "/lab" || path.startsWith("/lab/") || path.startsWith("/builder")) return true;
  // lesson pages: /course/<course>/<unit>/<lesson>
  return /^\/course\/[^/]+\/[^/]+\/[^/]+/.test(path);
}

const PRIMARY = [
  { href: "/topics", label: "Topics" },
  { href: "/labs", label: "Labs" },
  { href: "/atlas", label: "Concept Atlas" },
  { href: "/r", label: "R" },
];

function ModulesMenu({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const current = MODULES.some((m) => m.href === path);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="modules-menu"
        onClick={() => setOpen((o) => !o)}
        className={cn("flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm hover:text-ink", current || open ? "text-ink" : "text-muted")}
      >
        Modules
        <svg viewBox="0 0 12 12" className={cn("h-3 w-3 transition-transform", open && "rotate-180")} aria-hidden>
          <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <nav id="modules-menu" aria-label="Modules" className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-line bg-surface p-2 shadow-lg">
          <ul>
            {MODULES.map((m) => (
              <li key={m.slug}>
                <Link
                  href={m.href}
                  onClick={() => {
                    setOpen(false);
                    onNavigate();
                  }}
                  aria-current={path === m.href ? "page" : undefined}
                  className="flex items-baseline gap-3 rounded-md px-2.5 py-2 text-sm text-ink hover:bg-surface-2"
                >
                  <span className="font-mono text-xs text-faint">{m.number}</span>
                  <span>{m.short}</span>
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-1">
              <Link href="/go-further" onClick={() => setOpen(false)} className="flex items-baseline gap-3 rounded-md px-2.5 py-2 text-sm text-ink hover:bg-surface-2">
                <span className="font-mono text-xs text-faint">+</span>Go Further (optional)
              </Link>
            </li>
            <li>
              <Link href="/bonus/sopranos" onClick={() => setOpen(false)} className="flex items-baseline gap-3 rounded-md px-2.5 py-2 text-sm text-ink hover:bg-surface-2">
                <span className="font-mono text-xs text-faint">★</span>The Sopranos bonus lab
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  if (isAppRoute(path)) return null;
  // the landing page opens on the midnight hero; its header is part of it
  const night = path === "/";
  return (
    <header className={cn("sticky top-0 z-40 border-b", night ? "dark border-night-line bg-night" : "border-line bg-bg/90 backdrop-blur")}>
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-4 sm:px-7">
        <BrandLink tagline="Interactive laboratory for statistical thinking" onClick={() => setOpen(false)} />
        <nav aria-label="Main" className="ml-auto hidden items-center gap-0.5 lg:flex">
          {PRIMARY.slice(0, 1).map((l) => (
            <NavLink key={l.href} {...l} active={path === l.href} />
          ))}
          <ModulesMenu onNavigate={() => setOpen(false)} />
          {PRIMARY.slice(1).map((l) => (
            <NavLink key={l.href} {...l} active={path === l.href || (l.href === "/labs" && path === "/labs")} />
          ))}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1 whitespace-nowrap lg:ml-2">
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
        <div className="animate-fade-up border-t border-line bg-bg px-4 py-3 lg:hidden">
          <nav aria-label="Main (mobile)">
            <ul className="grid gap-1 sm:grid-cols-2">
              {[...PRIMARY, { href: "/review", label: "Quick review" }].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm font-medium text-ink hover:bg-surface-2">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Modules" className="mt-2 border-t border-line pt-2">
            <ul className="grid gap-1 sm:grid-cols-2">
              {MODULES.map((m) => (
                <li key={m.slug}>
                  <Link href={m.href} onClick={() => setOpen(false)} className="flex items-baseline gap-3 rounded-md px-2 py-2 text-sm text-ink hover:bg-surface-2">
                    <span className="font-mono text-xs text-faint">{m.number}</span>
                    {m.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/go-further" onClick={() => setOpen(false)} className="flex items-baseline gap-3 rounded-md px-2 py-2 text-sm text-ink hover:bg-surface-2">
                  <span className="font-mono text-xs text-faint">+</span>Go Further (optional)
                </Link>
              </li>
              <li>
                <Link href="/bonus/sopranos" onClick={() => setOpen(false)} className="flex items-baseline gap-3 rounded-md px-2 py-2 text-sm text-ink hover:bg-surface-2">
                  <span className="font-mono text-xs text-faint">★</span>The Sopranos bonus lab
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition-colors", active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink")}
    >
      {label}
    </Link>
  );
}

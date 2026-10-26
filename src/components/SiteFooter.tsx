"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAppRoute } from "./SiteHeader";

const LINKS = [
  { href: "/topics", label: "Topics" },
  { href: "/labs", label: "Labs" },
  { href: "/atlas", label: "Concept Atlas" },
  { href: "/r", label: "R in the browser" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy & local data" },
  { href: "/review", label: "Quick review" },
];

export function SiteFooter() {
  const path = usePathname();
  if (isAppRoute(path)) return null;
  return (
    <footer className="border-t border-line py-8 text-[12.5px] text-faint">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 sm:px-7 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-1 leading-relaxed">
          <p>
            <span className="font-medium text-muted">StatisztikaMetis · QDA2 Interactive Lab</span> · a study companion
            for Quantitative Data Analysis 2 · progress is stored only in this browser
          </p>
          <p>
            StatisztikaMetis is an independently developed educational resource. References to university courses or
            institutions do not imply official institutional endorsement.
          </p>
        </div>
        <nav aria-label="Site information">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 md:max-w-md md:justify-end">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-medium text-muted underline-offset-2 hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
